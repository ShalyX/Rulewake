import { Decimal } from "decimal.js";

Decimal.set({
  precision: 80,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -80,
  toExpPos: 80,
});

export type DecimalInput = string;

export type TierInput = {
  startUsd: DecimalInput;
  endUsd: DecimalInput | null;
  rate: DecimalInput;
};

export type BaselineInput = {
  effectiveEquityUsd: DecimalInput;
  maintenanceMarginUsd: DecimalInput;
  marginRatio: DecimalInput;
};

export type CollateralChangeInput = {
  asset: string;
  grossUsdBefore: DecimalInput;
  grossUsdAfter: DecimalInput;
  oldTiers: TierInput[];
  newTiers: TierInput[];
};

export type ImpactInput = {
  baseline: BaselineInput;
  changes: CollateralChangeInput[];
  deltaPnlUsd?: DecimalInput;
  baselineResidualToleranceUsd?: DecimalInput;
};

export type RiskBand = "stable" | "watch" | "warning" | "critical";

export type CalculationChange = {
  asset: string;
  grossUsdBefore: string;
  grossUsdAfter: string;
  oldContributionUsd: string;
  newContributionUsd: string;
  deltaUsd: string;
};

export type ImpactTrace = {
  engineVersion: "0.1.0";
  baseline: {
    effectiveEquityUsd: string;
    maintenanceMarginUsd: string;
    suppliedMarginRatio: string;
    normalizedNumeratorUsd: string;
    feeResidualUsd: string;
    residualClampApplied: boolean;
  };
  changes: CalculationChange[];
  assumptions: {
    positionsHeldConstant: true;
    openOrdersHeldConstant: true;
    liabilitiesHeldConstant: true;
    feeResidualHeldConstant: true;
  };
  result: {
    collateralDeltaUsd: string;
    deltaPnlUsd: string;
    projectedEffectiveEquityUsd: string;
    projectedNumeratorUsd: string;
    projectedMarginRatio: string | null;
    riskBand: RiskBand;
  };
};

export class CalculationInputError extends Error {
  override readonly name: string = "CalculationInputError";
}

export class BaselineInconsistentError extends CalculationInputError {
  override readonly name: string = "BaselineInconsistentError";
}

function decimal(value: DecimalInput, label: string): Decimal {
  if (typeof value !== "string" || value.trim() === "") {
    throw new CalculationInputError(`${label} must be a non-empty decimal string`);
  }

  let parsed: Decimal;
  try {
    parsed = new Decimal(value);
  } catch {
    throw new CalculationInputError(`${label} is not a valid decimal`);
  }

  if (!parsed.isFinite()) {
    throw new CalculationInputError(`${label} must be finite`);
  }

  return parsed;
}

function nonNegative(value: DecimalInput, label: string): Decimal {
  const parsed = decimal(value, label);
  if (parsed.isNegative()) {
    throw new CalculationInputError(`${label} cannot be negative`);
  }
  return parsed;
}

function canonical(value: Decimal): string {
  return value.isZero() ? "0" : value.toFixed();
}

function validateTiers(tiers: readonly TierInput[]): void {
  if (tiers.length === 0) {
    throw new CalculationInputError("tier schedule cannot be empty");
  }

  let expectedStart = new Decimal(0);

  tiers.forEach((tier, index) => {
    const start = nonNegative(tier.startUsd, `tiers[${index}].startUsd`);
    const rate = decimal(tier.rate, `tiers[${index}].rate`);

    if (!start.eq(expectedStart)) {
      const relation = start.gt(expectedStart) ? "gap" : "overlap";
      throw new CalculationInputError(`tier schedule contains a ${relation} at index ${index}`);
    }

    if (rate.lt(0) || rate.gt(1)) {
      throw new CalculationInputError(`tiers[${index}].rate must be between zero and one`);
    }

    if (tier.endUsd === null) {
      if (index !== tiers.length - 1) {
        throw new CalculationInputError("only the final tier can be unbounded");
      }
      return;
    }

    const end = nonNegative(tier.endUsd, `tiers[${index}].endUsd`);
    if (end.lte(start)) {
      throw new CalculationInputError(`tiers[${index}].endUsd must exceed its start`);
    }
    expectedStart = end;
  });

  if (tiers.at(-1)?.endUsd !== null) {
    throw new CalculationInputError("the final tier must be unbounded");
  }
}

export function collateralContribution(
  grossUsd: DecimalInput,
  tiers: readonly TierInput[],
): string {
  const gross = nonNegative(grossUsd, "grossUsd");
  validateTiers(tiers);

  let contribution = new Decimal(0);

  for (const tier of tiers) {
    const start = new Decimal(tier.startUsd);
    if (gross.lte(start)) break;

    const upper = tier.endUsd === null
      ? gross
      : Decimal.min(gross, new Decimal(tier.endUsd));
    const width = upper.minus(start);

    if (width.isPositive()) {
      contribution = contribution.plus(width.times(tier.rate));
    }
  }

  return canonical(contribution);
}

export function classifyRisk(ratio: DecimalInput): RiskBand {
  const value = nonNegative(ratio, "ratio");
  if (value.gte(1)) return "critical";
  if (value.gte("0.8")) return "warning";
  if (value.gte("0.65")) return "watch";
  return "stable";
}

function reconcileBaseline(input: ImpactInput["baseline"], toleranceInput: string) {
  const equity = decimal(input.effectiveEquityUsd, "baseline.effectiveEquityUsd");
  const maintenance = nonNegative(
    input.maintenanceMarginUsd,
    "baseline.maintenanceMarginUsd",
  );
  const ratio = nonNegative(input.marginRatio, "baseline.marginRatio");
  const tolerance = nonNegative(toleranceInput, "baselineResidualToleranceUsd");

  if (!equity.isPositive()) {
    throw new CalculationInputError("baseline.effectiveEquityUsd must be positive");
  }

  const suppliedNumerator = ratio.times(equity);
  const rawResidual = suppliedNumerator.minus(maintenance);
  // Exchange ratios are often rounded for transport/display. Half of the
  // least-significant reported ratio unit is the maximum ordinary rounding
  // error in the implied numerator.
  const ratioRoundingTolerance = new Decimal(10)
    .pow(-ratio.decimalPlaces())
    .times(equity)
    .div(2);
  const reconciliationTolerance = Decimal.max(
    tolerance,
    ratioRoundingTolerance,
  );
  let residual = rawResidual;
  let residualClampApplied = false;

  if (rawResidual.isNegative()) {
    if (rawResidual.abs().lte(reconciliationTolerance)) {
      residual = new Decimal(0);
      residualClampApplied = true;
    } else {
      throw new BaselineInconsistentError(
        "margin ratio implies a numerator materially below maintenance margin",
      );
    }
  }

  return {
    equity,
    maintenance,
    ratio,
    numerator: maintenance.plus(residual),
    residual,
    residualClampApplied,
  };
}

export function calculateImpact(input: ImpactInput): ImpactTrace {
  const baseline = reconcileBaseline(
    input.baseline,
    input.baselineResidualToleranceUsd ?? "0.01",
  );
  const deltaPnl = decimal(input.deltaPnlUsd ?? "0", "deltaPnlUsd");

  const changes = input.changes.map((change, index): CalculationChange => {
    if (change.asset.trim() === "") {
      throw new CalculationInputError(`changes[${index}].asset cannot be empty`);
    }

    const grossBefore = nonNegative(
      change.grossUsdBefore,
      `changes[${index}].grossUsdBefore`,
    );
    const grossAfter = nonNegative(
      change.grossUsdAfter,
      `changes[${index}].grossUsdAfter`,
    );
    const oldContribution = new Decimal(
      collateralContribution(change.grossUsdBefore, change.oldTiers),
    );
    const newContribution = new Decimal(
      collateralContribution(change.grossUsdAfter, change.newTiers),
    );

    return {
      asset: change.asset,
      grossUsdBefore: canonical(grossBefore),
      grossUsdAfter: canonical(grossAfter),
      oldContributionUsd: canonical(oldContribution),
      newContributionUsd: canonical(newContribution),
      deltaUsd: canonical(newContribution.minus(oldContribution)),
    };
  });

  const collateralDelta = changes.reduce(
    (sum, change) => sum.plus(change.deltaUsd),
    new Decimal(0),
  );
  const projectedEquity = baseline.equity.plus(collateralDelta).plus(deltaPnl);
  const projectedNumerator = baseline.numerator;
  const projectedRatio = projectedEquity.gt(0)
    ? projectedNumerator.div(projectedEquity)
    : null;
  const riskBand = projectedRatio === null
    ? "critical"
    : classifyRisk(canonical(projectedRatio));

  return {
    engineVersion: "0.1.0",
    baseline: {
      effectiveEquityUsd: canonical(baseline.equity),
      maintenanceMarginUsd: canonical(baseline.maintenance),
      suppliedMarginRatio: canonical(baseline.ratio),
      normalizedNumeratorUsd: canonical(baseline.numerator),
      feeResidualUsd: canonical(baseline.residual),
      residualClampApplied: baseline.residualClampApplied,
    },
    changes,
    assumptions: {
      positionsHeldConstant: true,
      openOrdersHeldConstant: true,
      liabilitiesHeldConstant: true,
      feeResidualHeldConstant: true,
    },
    result: {
      collateralDeltaUsd: canonical(collateralDelta),
      deltaPnlUsd: canonical(deltaPnl),
      projectedEffectiveEquityUsd: canonical(projectedEquity),
      projectedNumeratorUsd: canonical(projectedNumerator),
      projectedMarginRatio: projectedRatio === null ? null : canonical(projectedRatio),
      riskBand,
    },
  };
}

export type ScenarioBufferInput = {
  numeratorUsd: DecimalInput;
  effectiveEquityUsd: DecimalInput;
  targetRatio: DecimalInput;
  settlementDecimals: number;
};

export function scenarioBuffer(input: ScenarioBufferInput): string {
  const numerator = nonNegative(input.numeratorUsd, "numeratorUsd");
  const equity = decimal(input.effectiveEquityUsd, "effectiveEquityUsd");
  const target = decimal(input.targetRatio, "targetRatio");

  if (!target.isPositive() || target.gt(1)) {
    throw new CalculationInputError("targetRatio must be greater than zero and at most one");
  }

  if (
    !Number.isSafeInteger(input.settlementDecimals)
    || input.settlementDecimals < 0
    || input.settlementDecimals > 18
  ) {
    throw new CalculationInputError(
      "settlementDecimals must be an integer between zero and 18",
    );
  }

  const exact = Decimal.max(0, numerator.div(target).minus(equity));
  return exact
    .toDecimalPlaces(input.settlementDecimals, Decimal.ROUND_CEIL)
    .toFixed(input.settlementDecimals);
}
