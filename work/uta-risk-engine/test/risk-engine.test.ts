import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { Decimal } from "decimal.js";
import { describe, expect, it } from "vitest";

import {
  BaselineInconsistentError,
  calculateImpact,
  classifyRisk,
  scenarioBuffer,
  type ImpactInput,
} from "../src/index.js";

type CanonicalFixture = {
  input: ImpactInput;
  expected: {
    oldContributionUsd: string;
    newContributionUsd: string;
    collateralDeltaUsd: string;
    projectedEffectiveEquityUsd: string;
    projectedNumeratorUsd: string;
    projectedMarginRatio: string;
    riskBand: string;
    bufferTo75PercentAtCentPrecisionUsd: string;
  };
};

const fixturePath = fileURLToPath(
  new URL("./fixtures/rstrc-canonical.json", import.meta.url),
);
const canonical = JSON.parse(readFileSync(fixturePath, "utf8")) as CanonicalFixture;

describe("canonical rSTRC golden scenario", () => {
  it("projects the collateral haircut and the resulting account risk", () => {
    const result = calculateImpact(canonical.input);
    const change = result.changes[0];

    expect(change).toBeDefined();
    expect(change?.oldContributionUsd).toBe(canonical.expected.oldContributionUsd);
    expect(change?.newContributionUsd).toBe(canonical.expected.newContributionUsd);
    expect(change?.deltaUsd).toBe(canonical.expected.collateralDeltaUsd);
    expect(result.result.projectedEffectiveEquityUsd).toBe(
      canonical.expected.projectedEffectiveEquityUsd,
    );
    expect(result.result.projectedNumeratorUsd).toBe(
      canonical.expected.projectedNumeratorUsd,
    );
    expect(result.result.projectedMarginRatio).toBe(
      canonical.expected.projectedMarginRatio,
    );
    expect(result.result.riskBand).toBe(canonical.expected.riskBand);
    expect(result.baseline.residualClampApplied).toBe(true);
  });

  it("calculates a conservative buffer to the chosen target", () => {
    const result = calculateImpact(canonical.input);
    const buffer = scenarioBuffer({
      numeratorUsd: result.result.projectedNumeratorUsd,
      effectiveEquityUsd: result.result.projectedEffectiveEquityUsd,
      targetRatio: "0.75",
      settlementDecimals: 2,
    });

    expect(buffer).toBe(canonical.expected.bufferTo75PercentAtCentPrecisionUsd);
  });
});

describe("baseline reconciliation", () => {
  it("accepts numerator drift caused by a four-decimal exchange ratio", () => {
    const result = calculateImpact({
      baseline: {
        effectiveEquityUsd: "506200.46658713",
        maintenanceMarginUsd: "76589.03",
        marginRatio: "0.1513",
      },
      changes: [],
    });

    expect(result.baseline.normalizedNumeratorUsd).toBe("76589.03");
    expect(result.baseline.feeResidualUsd).toBe("0");
    expect(result.baseline.residualClampApplied).toBe(true);
  });

  it("rejects a materially negative fee residual", () => {
    expect(() =>
      calculateImpact({
        baseline: {
          effectiveEquityUsd: "1000",
          maintenanceMarginUsd: "700",
          marginRatio: "0.60",
        },
        changes: [],
      }),
    ).toThrow(BaselineInconsistentError);
  });

  it("accepts zero numerator and returns a zero ratio", () => {
    const result = calculateImpact({
      baseline: {
        effectiveEquityUsd: "1000",
        maintenanceMarginUsd: "0",
        marginRatio: "0",
      },
      changes: [],
    });

    expect(result.result.projectedMarginRatio).toBe("0");
    expect(result.result.riskBand).toBe("stable");
  });

  it("returns an undefined ratio and critical band when equity is non-positive", () => {
    const result = calculateImpact({
      baseline: {
        effectiveEquityUsd: "100",
        maintenanceMarginUsd: "90",
        marginRatio: "0.9",
      },
      changes: [],
      deltaPnlUsd: "-100",
    });

    expect(result.result.projectedEffectiveEquityUsd).toBe("0");
    expect(result.result.projectedMarginRatio).toBeNull();
    expect(result.result.riskBand).toBe("critical");
  });

  it("is deterministic across repeated executions", () => {
    const first = calculateImpact(canonical.input);
    const second = calculateImpact(canonical.input);

    expect(second).toEqual(first);
  });

  it("aggregates several affected collateral assets", () => {
    const result = calculateImpact({
      baseline: {
        effectiveEquityUsd: "1000",
        maintenanceMarginUsd: "500",
        marginRatio: "0.5",
      },
      changes: [
        {
          asset: "A",
          grossUsdBefore: "100",
          grossUsdAfter: "100",
          oldTiers: [{ startUsd: "0", endUsd: null, rate: "1" }],
          newTiers: [{ startUsd: "0", endUsd: null, rate: "0.8" }],
        },
        {
          asset: "B",
          grossUsdBefore: "200",
          grossUsdAfter: "150",
          oldTiers: [{ startUsd: "0", endUsd: null, rate: "0.5" }],
          newTiers: [{ startUsd: "0", endUsd: null, rate: "0.5" }],
        },
      ],
    });

    expect(result.result.collateralDeltaUsd).toBe("-45");
    expect(result.result.projectedEffectiveEquityUsd).toBe("955");
    expect(result.result.projectedMarginRatio).toBe(
      "0.52356020942408376963350785340314136125654450261780104712041884816753926701570681",
    );
  });
});

describe("risk classification boundaries", () => {
  it.each([
    ["0", "stable"],
    ["0.649999", "stable"],
    ["0.65", "watch"],
    ["0.799999", "watch"],
    ["0.8", "warning"],
    ["0.999999", "warning"],
    ["1", "critical"],
    ["4.2", "critical"],
  ] as const)("maps %s to %s", (ratio, expected) => {
    expect(classifyRisk(ratio)).toBe(expected);
  });
});

describe("scenarioBuffer", () => {
  it("returns zero when the account is already at or below target", () => {
    expect(
      scenarioBuffer({
        numeratorUsd: "50",
        effectiveEquityUsd: "100",
        targetRatio: "0.5",
        settlementDecimals: 2,
      }),
    ).toBe("0.00");
  });

  it("rounds upward instead of understating the required scenario buffer", () => {
    expect(
      scenarioBuffer({
        numeratorUsd: "10",
        effectiveEquityUsd: "0",
        targetRatio: "0.3",
        settlementDecimals: 2,
      }),
    ).toBe("33.34");
  });

  it("always reaches or improves on the requested ratio after conservative rounding", () => {
    const numerator = new Decimal("85000");
    const equity = new Decimal("85000");
    const target = new Decimal("0.75");
    const buffer = new Decimal(
      scenarioBuffer({
        numeratorUsd: numerator.toFixed(),
        effectiveEquityUsd: equity.toFixed(),
        targetRatio: target.toFixed(),
        settlementDecimals: 2,
      }),
    );

    expect(numerator.div(equity.plus(buffer)).lte(target)).toBe(true);
  });
});
