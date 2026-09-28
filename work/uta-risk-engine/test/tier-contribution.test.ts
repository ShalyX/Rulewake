import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  CalculationInputError,
  collateralContribution,
  type TierInput,
} from "../src/index.js";

describe("collateralContribution", () => {
  it("calculates progressive contribution across several tiers", () => {
    const tiers: TierInput[] = [
      { startUsd: "0", endUsd: "40000", rate: "1" },
      { startUsd: "40000", endUsd: "80000", rate: "0.9" },
      { startUsd: "80000", endUsd: null, rate: "0.8" },
    ];

    expect(collateralContribution("100000", tiers)).toBe("92000");
  });

  it("is continuous at an exact tier boundary", () => {
    const tiers: TierInput[] = [
      { startUsd: "0", endUsd: "100", rate: "1" },
      { startUsd: "100", endUsd: null, rate: "0.5" },
    ];

    expect(collateralContribution("100", tiers)).toBe("100");
    expect(collateralContribution("100.01", tiers)).toBe("100.005");
  });

  it.each([
    ["negative holding", "-1", [{ startUsd: "0", endUsd: null, rate: "1" }]],
    ["empty schedule", "1", []],
    ["schedule not starting at zero", "1", [{ startUsd: "1", endUsd: null, rate: "1" }]],
    ["gap", "100", [
      { startUsd: "0", endUsd: "50", rate: "1" },
      { startUsd: "60", endUsd: null, rate: "1" },
    ]],
    ["overlap", "100", [
      { startUsd: "0", endUsd: "60", rate: "1" },
      { startUsd: "50", endUsd: null, rate: "1" },
    ]],
    ["rate over one", "1", [{ startUsd: "0", endUsd: null, rate: "1.01" }]],
    ["rate below zero", "1", [{ startUsd: "0", endUsd: null, rate: "-0.01" }]],
  ] as const)("rejects %s", (_label, value, tiers) => {
    expect(() => collateralContribution(value, [...tiers])).toThrow(CalculationInputError);
  });

  it("never exceeds the gross value for valid rates", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 10_000 }),
        (valueCents, rateBps) => {
          const value = (valueCents / 100).toFixed(2);
          const rate = (rateBps / 10_000).toFixed(4);
          const result = collateralContribution(value, [
            { startUsd: "0", endUsd: null, rate },
          ]);

          expect(Number(result)).toBeLessThanOrEqual(Number(value));
        },
      ),
    );
  });

  it("preserves contribution when a tier is split at the same rate", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000 }), (value) => {
        const unsplit = collateralContribution(String(value), [
          { startUsd: "0", endUsd: null, rate: "0.73" },
        ]);
        const split = collateralContribution(String(value), [
          { startUsd: "0", endUsd: "500000", rate: "0.73" },
          { startUsd: "500000", endUsd: null, rate: "0.73" },
        ]);

        expect(split).toBe(unsplit);
      }),
    );
  });

  it("cannot increase contribution when a collateral rate is reduced", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 9_999 }),
        (value, lowerRateBps) => {
          const lowerRate = (lowerRateBps / 10_000).toFixed(4);
          const higherRate = ((lowerRateBps + 1) / 10_000).toFixed(4);
          const lower = collateralContribution(String(value), [
            { startUsd: "0", endUsd: null, rate: lowerRate },
          ]);
          const higher = collateralContribution(String(value), [
            { startUsd: "0", endUsd: null, rate: higherRate },
          ]);

          expect(Number(lower)).toBeLessThanOrEqual(Number(higher));
        },
      ),
    );
  });

  it("preserves high-precision decimal inputs without binary floating-point loss", () => {
    expect(
      collateralContribution("123456789.123456789", [
        { startUsd: "0", endUsd: null, rate: "0.123456789" },
      ]),
    ).toBe("15241578.765432099750190521");
  });
});
