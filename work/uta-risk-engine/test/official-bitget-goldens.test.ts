import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { Decimal } from "decimal.js";
import { describe, expect, it } from "vitest";

import { collateralContribution, type TierInput } from "../src/index.js";

type AssetExample = {
  asset: string;
  grossUsd: string;
  tiers: TierInput[];
  expectedContributionUsd: string;
};

type OfficialExamples = {
  source: { title: string; url: string; reviewedAt: string };
  examples: {
    btcAndDot: {
      assets: AssetExample[];
      expectedAdjustedEquityUsd: string;
    };
    fortyBtc: {
      grossUsd: string;
      tiers: TierInput[];
      expectedContributionUsd: string;
    };
  };
};

const fixturePath = fileURLToPath(
  new URL("./fixtures/bitget-official-collateral-examples.json", import.meta.url),
);
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as OfficialExamples;

describe("official Bitget collateral examples", () => {
  it("matches Bitget's 1 BTC plus 500 DOT adjusted-equity example", () => {
    const total = fixture.examples.btcAndDot.assets.reduce((sum, asset) => {
      const contribution = collateralContribution(asset.grossUsd, asset.tiers);
      expect(contribution).toBe(asset.expectedContributionUsd);
      return sum.plus(contribution);
    }, new Decimal(0));

    expect(total.toFixed()).toBe(
      fixture.examples.btcAndDot.expectedAdjustedEquityUsd,
    );
  });

  it("matches Bitget's progressive 40 BTC example", () => {
    const example = fixture.examples.fortyBtc;

    expect(collateralContribution(example.grossUsd, example.tiers)).toBe(
      example.expectedContributionUsd,
    );
  });
});
