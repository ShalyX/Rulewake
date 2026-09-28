import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { calculateImpact, type BaselineInput, type TierInput } from "../src/index.js";

type Fixture = {
  baseline: BaselineInput;
  affectedAsset: {
    asset: string;
    grossUsd: string;
    currentTiers: TierInput[];
    scenarioTiers: TierInput[];
  };
  expected: {
    zeroChange: {
      collateralDeltaUsd: string;
      projectedEffectiveEquityUsd: string;
      projectedNumeratorUsd: string;
      projectedMarginRatio: string;
    };
    btcRatioShock: {
      oldContributionUsd: string;
      newContributionUsd: string;
      collateralDeltaUsd: string;
      projectedEffectiveEquityUsd: string;
      projectedNumeratorUsd: string;
      projectedMarginRatio: string;
      riskBand: string;
    };
  };
};

const fixturePath = fileURLToPath(
  new URL("./fixtures/bitget-demo-live-baseline.json", import.meta.url),
);
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as Fixture;

describe("sanitized Bitget demo live baseline", () => {
  it("preserves the normalized baseline under a zero-change scenario", () => {
    const result = calculateImpact({ baseline: fixture.baseline, changes: [] });

    expect(result.result).toMatchObject(fixture.expected.zeroChange);
    expect(result.baseline.residualClampApplied).toBe(true);
  });

  it("projects a deterministic BTC collateral-ratio stress", () => {
    const asset = fixture.affectedAsset;
    const result = calculateImpact({
      baseline: fixture.baseline,
      changes: [{
        asset: asset.asset,
        grossUsdBefore: asset.grossUsd,
        grossUsdAfter: asset.grossUsd,
        oldTiers: asset.currentTiers,
        newTiers: asset.scenarioTiers,
      }],
    });

    expect(result.changes[0]).toMatchObject({
      oldContributionUsd: fixture.expected.btcRatioShock.oldContributionUsd,
      newContributionUsd: fixture.expected.btcRatioShock.newContributionUsd,
      deltaUsd: fixture.expected.btcRatioShock.collateralDeltaUsd,
    });
    expect(result.result).toMatchObject({
      collateralDeltaUsd: fixture.expected.btcRatioShock.collateralDeltaUsd,
      projectedEffectiveEquityUsd:
        fixture.expected.btcRatioShock.projectedEffectiveEquityUsd,
      projectedNumeratorUsd:
        fixture.expected.btcRatioShock.projectedNumeratorUsd,
      projectedMarginRatio:
        fixture.expected.btcRatioShock.projectedMarginRatio,
      riskBand: fixture.expected.btcRatioShock.riskBand,
    });
  });
});
