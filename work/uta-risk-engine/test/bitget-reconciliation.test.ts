import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  BitgetSnapshotError,
  buildBitgetReconciliationReport,
  normalizeBitgetAccountAssets,
  normalizeBitgetAccountSettings,
  type BitgetAccountAssetsResponse,
  type BitgetAccountSettingsResponse,
} from "../src/bitget-reconciliation.js";

type DocumentedResponses = {
  assetsResponse: BitgetAccountAssetsResponse;
  settingsResponse: BitgetAccountSettingsResponse;
};

const fixturePath = fileURLToPath(
  new URL("./fixtures/bitget-documented-account-responses.json", import.meta.url),
);
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as DocumentedResponses;

describe("Bitget account response normalization", () => {
  it("maps the documented account fields and drops identifiers", () => {
    const snapshot = normalizeBitgetAccountAssets(fixture.assetsResponse, {
      nowMs: fixture.assetsResponse.requestTime + 1_000,
      maxAgeMs: 5_000,
    });

    expect(snapshot).toEqual({
      source: "bitget:/api/v3/account/assets",
      capturedAtMs: fixture.assetsResponse.requestTime,
      accountEquityUsd: "11.13919278",
      effectiveEquityUsd: "6.19299777",
      maintenanceMarginUsd: "0",
      marginRatio: "0",
      initialMarginUsd: "0",
      positionValueUsd: "0",
      leverage: "1",
      assets: [
        { coin: "USDT", equity: "6.19300826", usdValue: "6.19299777", debt: "0" },
        { coin: "BGB", equity: "1.15582129", usdValue: "4.94618029", debt: "0" },
      ],
    });
    expect(JSON.stringify(snapshot)).not.toContain("must-not-survive-normalization");
    expect(JSON.stringify(snapshot)).not.toContain("available");
    expect(JSON.stringify(snapshot)).not.toContain("balance");
  });

  it("rejects stale account data", () => {
    expect(() =>
      normalizeBitgetAccountAssets(fixture.assetsResponse, {
        nowMs: fixture.assetsResponse.requestTime + 5_001,
        maxAgeMs: 5_000,
      }),
    ).toThrow(BitgetSnapshotError);
  });

  it("rejects malformed financial strings", () => {
    const response = structuredClone(fixture.assetsResponse);
    response.data.effEquity = "NaN";

    expect(() =>
      normalizeBitgetAccountAssets(response, {
        nowMs: response.requestTime,
        maxAgeMs: 5_000,
      }),
    ).toThrow(/effEquity/);
  });

  it("keeps only the account settings needed for compatibility", () => {
    const settings = normalizeBitgetAccountSettings(fixture.settingsResponse, {
      nowMs: fixture.settingsResponse.requestTime,
      maxAgeMs: 5_000,
    });

    expect(settings).toEqual({
      source: "bitget:/api/v3/account/settings",
      capturedAtMs: fixture.settingsResponse.requestTime,
      accountMode: "hybrid",
      accountLevel: "advanced",
      assetMode: "multi_assets",
      holdMode: "one_way_mode",
    });
    expect(JSON.stringify(settings)).not.toContain("must-not-survive-normalization");
  });
});

describe("Bitget snapshot reconciliation", () => {
  it("reconciles the documented zero-margin account without inventing risk", () => {
    const report = buildBitgetReconciliationReport({
      assetsResponse: fixture.assetsResponse,
      settingsResponse: fixture.settingsResponse,
      nowMs: Math.max(
        fixture.assetsResponse.requestTime,
        fixture.settingsResponse.requestTime,
      ),
      maxAgeMs: 10_000_000_000,
    });

    expect(report.status).toBe("reconciled");
    expect(report.eligibleForProjection).toBe(true);
    expect(report.baseline).toEqual({
      effectiveEquityUsd: "6.19299777",
      maintenanceMarginUsd: "0",
      marginRatio: "0",
      normalizedNumeratorUsd: "0",
      feeResidualUsd: "0",
      residualClampApplied: false,
    });
    expect(report.diagnostics).toEqual([]);
  });

  it("blocks a non-advanced account", () => {
    const settingsResponse = structuredClone(fixture.settingsResponse);
    settingsResponse.data.accountLevel = "basic";

    const report = buildBitgetReconciliationReport({
      assetsResponse: fixture.assetsResponse,
      settingsResponse,
      nowMs: Math.max(
        fixture.assetsResponse.requestTime,
        settingsResponse.requestTime,
      ),
      maxAgeMs: 10_000_000_000,
    });

    expect(report.status).toBe("ineligible");
    expect(report.eligibleForProjection).toBe(false);
    expect(report.diagnostics).toContain("account level must be advanced");
  });

  it("reports a materially inconsistent Bitget baseline", () => {
    const assetsResponse = structuredClone(fixture.assetsResponse);
    assetsResponse.data.effEquity = "1000";
    assetsResponse.data.mmr = "700";
    assetsResponse.data.mgnRatio = "0.6";

    const report = buildBitgetReconciliationReport({
      assetsResponse,
      settingsResponse: fixture.settingsResponse,
      nowMs: Math.max(
        assetsResponse.requestTime,
        fixture.settingsResponse.requestTime,
      ),
      maxAgeMs: 10_000_000_000,
    });

    expect(report.status).toBe("inconsistent");
    expect(report.eligibleForProjection).toBe(false);
    expect(report.diagnostics[0]).toMatch(/below maintenance margin/);
  });
});
