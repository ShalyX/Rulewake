import { Decimal } from "decimal.js";

import {
  BaselineInconsistentError,
  CalculationInputError,
  calculateImpact,
} from "./index.js";

export type BitgetAccountAsset = {
  coin: string;
  equity: string;
  usdValue: string;
  balance?: string;
  available?: string;
  debt: string;
  locked?: string;
  bonus?: string;
};

export type BitgetAccountAssetsResponse = {
  code: string;
  msg: string;
  requestTime: number;
  data: {
    accountEquity: string;
    usdtEquity?: string;
    btcEquity?: string;
    unrealisedPnl?: string;
    usdtUnrealisedPnl?: string;
    btcUnrealizedPnl?: string;
    effEquity: string;
    mmr: string;
    imr: string;
    mgnRatio: string;
    positionMgnRatio?: string;
    positionValue: string;
    leverage: string;
    assets: BitgetAccountAsset[];
  };
  [key: string]: unknown;
};

export type BitgetAccountSettingsResponse = {
  code: string;
  msg: string;
  requestTime: number;
  data: {
    uid?: string;
    accountMode: string;
    accountLevel: string;
    assetMode: string;
    holdMode: string;
    stpMode?: string;
    deltaSwitch?: string;
    symbolConfigList?: unknown[];
    coinConfigList?: unknown[];
  };
};

export type SnapshotFreshnessOptions = {
  nowMs: number;
  maxAgeMs: number;
  maxFutureSkewMs?: number;
};

export type NormalizedAccountSnapshot = {
  source: "bitget:/api/v3/account/assets";
  capturedAtMs: number;
  accountEquityUsd: string;
  effectiveEquityUsd: string;
  maintenanceMarginUsd: string;
  marginRatio: string;
  initialMarginUsd: string;
  positionValueUsd: string;
  leverage: string;
  assets: Array<{
    coin: string;
    equity: string;
    usdValue: string;
    debt: string;
  }>;
};

export type NormalizedAccountSettings = {
  source: "bitget:/api/v3/account/settings";
  capturedAtMs: number;
  accountMode: string;
  accountLevel: string;
  assetMode: string;
  holdMode: string;
};

export type ReconciliationBaseline = {
  effectiveEquityUsd: string;
  maintenanceMarginUsd: string;
  marginRatio: string;
  normalizedNumeratorUsd: string;
  feeResidualUsd: string;
  residualClampApplied: boolean;
};

export type BitgetReconciliationReport = {
  status: "reconciled" | "ineligible" | "inconsistent";
  eligibleForProjection: boolean;
  assetsSnapshot: NormalizedAccountSnapshot;
  accountSettings: NormalizedAccountSettings;
  baseline: ReconciliationBaseline | null;
  diagnostics: string[];
};

export class BitgetSnapshotError extends Error {
  override readonly name: string = "BitgetSnapshotError";
}

function validateFreshness(
  requestTime: number,
  options: SnapshotFreshnessOptions,
  endpoint: string,
): void {
  if (!Number.isSafeInteger(requestTime) || requestTime <= 0) {
    throw new BitgetSnapshotError(`${endpoint} requestTime must be a positive integer`);
  }
  if (!Number.isSafeInteger(options.nowMs) || options.nowMs <= 0) {
    throw new BitgetSnapshotError("nowMs must be a positive integer");
  }
  if (!Number.isSafeInteger(options.maxAgeMs) || options.maxAgeMs < 0) {
    throw new BitgetSnapshotError("maxAgeMs must be a non-negative integer");
  }

  const maxFutureSkewMs = options.maxFutureSkewMs ?? 60_000;
  const age = options.nowMs - requestTime;
  if (age > options.maxAgeMs) {
    throw new BitgetSnapshotError(`${endpoint} snapshot is stale by ${age}ms`);
  }
  if (age < -maxFutureSkewMs) {
    throw new BitgetSnapshotError(`${endpoint} requestTime is too far in the future`);
  }
}

function assertSuccessfulEnvelope(
  response: { code: string; msg: string },
  endpoint: string,
): void {
  if (response.code !== "00000") {
    throw new BitgetSnapshotError(
      `${endpoint} returned Bitget code ${response.code}: ${response.msg}`,
    );
  }
}

function financialString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BitgetSnapshotError(`${label} must be a non-empty decimal string`);
  }

  let parsed: Decimal;
  try {
    parsed = new Decimal(value);
  } catch {
    throw new BitgetSnapshotError(`${label} is not a valid decimal`);
  }

  if (!parsed.isFinite()) {
    throw new BitgetSnapshotError(`${label} must be finite`);
  }
  return value;
}

function nonNegativeFinancialString(value: unknown, label: string): string {
  const raw = financialString(value, label);
  if (new Decimal(raw).isNegative()) {
    throw new BitgetSnapshotError(`${label} cannot be negative`);
  }
  return raw;
}

function requiredText(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BitgetSnapshotError(`${label} must be a non-empty string`);
  }
  return value;
}

export function normalizeBitgetAccountAssets(
  response: BitgetAccountAssetsResponse,
  options: SnapshotFreshnessOptions,
): NormalizedAccountSnapshot {
  const endpoint = "/api/v3/account/assets";
  assertSuccessfulEnvelope(response, endpoint);
  validateFreshness(response.requestTime, options, endpoint);

  if (response.data === null || typeof response.data !== "object") {
    throw new BitgetSnapshotError(`${endpoint} data must be an object`);
  }
  if (!Array.isArray(response.data.assets)) {
    throw new BitgetSnapshotError(`${endpoint} data.assets must be an array`);
  }

  return {
    source: "bitget:/api/v3/account/assets",
    capturedAtMs: response.requestTime,
    accountEquityUsd: financialString(response.data.accountEquity, "accountEquity"),
    effectiveEquityUsd: financialString(response.data.effEquity, "effEquity"),
    maintenanceMarginUsd: nonNegativeFinancialString(response.data.mmr, "mmr"),
    marginRatio: nonNegativeFinancialString(response.data.mgnRatio, "mgnRatio"),
    initialMarginUsd: nonNegativeFinancialString(response.data.imr, "imr"),
    positionValueUsd: nonNegativeFinancialString(
      response.data.positionValue,
      "positionValue",
    ),
    leverage: nonNegativeFinancialString(response.data.leverage, "leverage"),
    assets: response.data.assets.map((asset, index) => ({
      coin: requiredText(asset.coin, `assets[${index}].coin`),
      equity: financialString(asset.equity, `assets[${index}].equity`),
      usdValue: financialString(asset.usdValue, `assets[${index}].usdValue`),
      debt: nonNegativeFinancialString(asset.debt, `assets[${index}].debt`),
    })),
  };
}

export function normalizeBitgetAccountSettings(
  response: BitgetAccountSettingsResponse,
  options: SnapshotFreshnessOptions,
): NormalizedAccountSettings {
  const endpoint = "/api/v3/account/settings";
  assertSuccessfulEnvelope(response, endpoint);
  validateFreshness(response.requestTime, options, endpoint);

  if (response.data === null || typeof response.data !== "object") {
    throw new BitgetSnapshotError(`${endpoint} data must be an object`);
  }

  return {
    source: "bitget:/api/v3/account/settings",
    capturedAtMs: response.requestTime,
    accountMode: requiredText(response.data.accountMode, "accountMode"),
    accountLevel: requiredText(response.data.accountLevel, "accountLevel"),
    assetMode: requiredText(response.data.assetMode, "assetMode"),
    holdMode: requiredText(response.data.holdMode, "holdMode"),
  };
}

export function buildBitgetReconciliationReport(input: {
  assetsResponse: BitgetAccountAssetsResponse;
  settingsResponse: BitgetAccountSettingsResponse;
  nowMs: number;
  maxAgeMs: number;
  baselineResidualToleranceUsd?: string;
}): BitgetReconciliationReport {
  const freshness = { nowMs: input.nowMs, maxAgeMs: input.maxAgeMs };
  const assetsSnapshot = normalizeBitgetAccountAssets(
    input.assetsResponse,
    freshness,
  );
  const accountSettings = normalizeBitgetAccountSettings(
    input.settingsResponse,
    freshness,
  );
  const diagnostics: string[] = [];

  if (accountSettings.accountLevel !== "advanced") {
    diagnostics.push("account level must be advanced");
  }
  if (accountSettings.assetMode !== "multi_assets") {
    diagnostics.push("asset mode must be multi_assets");
  }

  if (diagnostics.length > 0) {
    return {
      status: "ineligible",
      eligibleForProjection: false,
      assetsSnapshot,
      accountSettings,
      baseline: null,
      diagnostics,
    };
  }

  try {
    const trace = calculateImpact({
      baseline: {
        effectiveEquityUsd: assetsSnapshot.effectiveEquityUsd,
        maintenanceMarginUsd: assetsSnapshot.maintenanceMarginUsd,
        marginRatio: assetsSnapshot.marginRatio,
      },
      changes: [],
      baselineResidualToleranceUsd:
        input.baselineResidualToleranceUsd ?? "0.01",
    });

    return {
      status: "reconciled",
      eligibleForProjection: true,
      assetsSnapshot,
      accountSettings,
      baseline: {
        effectiveEquityUsd: trace.baseline.effectiveEquityUsd,
        maintenanceMarginUsd: trace.baseline.maintenanceMarginUsd,
        marginRatio: trace.baseline.suppliedMarginRatio,
        normalizedNumeratorUsd: trace.baseline.normalizedNumeratorUsd,
        feeResidualUsd: trace.baseline.feeResidualUsd,
        residualClampApplied: trace.baseline.residualClampApplied,
      },
      diagnostics: [],
    };
  } catch (error) {
    if (
      error instanceof BaselineInconsistentError
      || error instanceof CalculationInputError
    ) {
      return {
        status: "inconsistent",
        eligibleForProjection: false,
        assetsSnapshot,
        accountSettings,
        baseline: null,
        diagnostics: [error.message],
      };
    }
    throw error;
  }
}
