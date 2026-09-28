import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outputDirectory = fileURLToPath(
  new URL("../test/fixtures/announcements", import.meta.url),
);
const createdAt = "2026-09-17T15:30:00Z";

function tiers(rows) {
  let startUsd = "0";
  return rows.map(([endUsd, rate]) => {
    const tier = { startUsd, endUsd, rate };
    if (endUsd !== null) startUsd = endUsd;
    return tier;
  });
}

function renderSchedule(label, schedule) {
  return `${label}: ${schedule.map((tier) => (
    `${tier.startUsd}-${tier.endUsd ?? "above"} ${tier.rate}`
  )).join("; ")}.`;
}

function sourceHash(sourceText) {
  return `sha256:${createHash("sha256").update(sourceText).digest("hex")}`;
}

function acceptedFixture({
  id,
  url,
  title,
  publishedAt,
  effectiveAt,
  timezone,
  changes,
  coverage,
  unsupportedStatements = [],
}) {
  const sourceText = [
    title,
    `Published ${publishedAt}. Effective ${effectiveAt}. Timezone ${timezone}.`,
    ...changes.flatMap((change) => [
      `${change.asset} ${change.parameter} in USD.`,
      renderSchedule("Before adjustment", change.before),
      renderSchedule("After adjustment", change.after),
    ]),
    ...unsupportedStatements.map((statement) => `Additional source statement: ${statement}`),
  ].join(" ");
  const hash = sourceHash(sourceText);
  return {
    id,
    coverage,
    expectedOutcome: "accepted",
    rejectionReasons: [],
    source: { url, title, publishedAt, effectiveAt, timezone, sourceHash: hash },
    sourceText,
    golden: {
      schemaVersion: "1",
      source: { url, title, publishedAt, effectiveAt, timezone, sourceHash: hash },
      changes,
      unsupportedStatements,
      extraction: {
        model: "human-reviewed-fixture",
        createdAt,
        confidence: "high",
      },
    },
  };
}

function rejectedFixture({
  id,
  url,
  title,
  publishedAt,
  effectiveAt,
  timezone,
  sourceText,
  coverage,
  rejectionReasons,
}) {
  return {
    id,
    coverage,
    expectedOutcome: "rejected",
    rejectionReasons,
    source: {
      url,
      title,
      publishedAt,
      effectiveAt,
      timezone,
      sourceHash: sourceHash(sourceText),
    },
    sourceText,
  };
}

const stockBefore = tiers([
  ["10000", "0.95"], ["50000", "0.95"], ["200000", "0.95"],
  ["500000", "0.95"], ["1000000", "0.94"], ["2000000", "0.93"],
  ["3000000", "0.92"], ["4000000", "0.91"], ["5000000", "0.9"],
  ["6000000", "0.85"], ["7000000", "0.8"], ["8000000", "0.7"],
  ["10000000", "0.5"], ["50000000", "0.4"], [null, "0"],
]);
const stockBeforeWide = tiers([
  ["10000", "0.95"], ["50000", "0.95"], ["200000", "0.95"],
  ["500000", "0.95"], ["1000000", "0.94"], ["2000000", "0.93"],
  ["3000000", "0.92"], ["4000000", "0.91"], ["5000000", "0.9"],
  ["10000000", "0.85"], ["20000000", "0.8"], ["30000000", "0.75"],
  ["50000000", "0.7"], [null, "0"],
]);
const stockAfter = tiers([
  ["10000", "0.95"], ["50000", "0.95"], ["200000", "0.95"],
  ["500000", "0.95"], ["1000000", "0.9"], ["2000000", "0.85"],
  ["3000000", "0.8"], ["4000000", "0.75"], ["5000000", "0.7"],
  ["10000000", "0.6"], ["20000000", "0.5"], ["30000000", "0.4"],
  ["50000000", "0.3"], [null, "0"],
]);

const fixtures = [
  acceptedFixture({
    id: "rstrc-2026-07-01",
    url: "https://www.bitget.com/support/articles/12560603887694",
    title: "Bitget to update rSTRC collateral ratio for UTA",
    publishedAt: "2026-06-30T09:27:00Z",
    effectiveAt: "2026-07-01T10:00:00Z",
    timezone: "UTC+0",
    coverage: ["collateral_only", "unbounded_tier", "stock_token"],
    changes: [{
      asset: "rSTRC", parameter: "collateral_ratio", unit: "USD",
      before: tiers([
        ["10000", "0.9"], ["50000", "0.9"], ["200000", "0.9"],
        ["500000", "0.9"], ["1000000", "0.85"], ["2000000", "0.8"],
        ["3000000", "0.76"], ["4000000", "0.72"], ["5000000", "0.68"],
        ["6000000", "0.64"], ["7000000", "0.6"], ["8000000", "0.55"],
        ["10000000", "0.5"], [null, "0"],
      ]),
      after: tiers([
        ["5000", "0.85"], ["10000", "0.85"], ["30000", "0.85"],
        ["50000", "0.85"], ["100000", "0.85"], ["300000", "0.82"],
        ["500000", "0.79"], ["600000", "0.76"], ["650000", "0.73"],
        ["700000", "0.7"], ["750000", "0.65"], ["800000", "0.6"],
        ["900000", "0.55"], ["1000000", "0.5"], [null, "0"],
      ]),
    }],
    unsupportedStatements: [
      "The announcement warns maintenance margin may increase but provides no maintenance schedule.",
    ],
  }),
  acceptedFixture({
    id: "rtokens-multi-2026-07-10",
    url: "https://www.bitget.com/support/articles/12560603888840",
    title: "Bitget to update rCRCL,rAVGO,rTSM,rMRVL,rBB,rGLW collateral ratio for UTA",
    publishedAt: "2026-07-09T07:00:00Z",
    effectiveAt: "2026-07-10T10:00:00Z",
    timezone: "UTC+0",
    coverage: ["collateral_only", "multi_asset", "unbounded_tier", "stock_token"],
    changes: [
      { asset: "rCRCL", parameter: "collateral_ratio", unit: "USD", before: stockBefore, after: stockAfter },
      { asset: "rAVGO", parameter: "collateral_ratio", unit: "USD", before: stockBeforeWide, after: stockAfter },
      { asset: "rTSM", parameter: "collateral_ratio", unit: "USD", before: stockBeforeWide, after: stockAfter },
      {
        asset: "rMRVL", parameter: "collateral_ratio", unit: "USD",
        before: stockBefore,
        after: tiers([
          ["10000", "0.95"], ["50000", "0.9"], ["100000", "0.8"],
          ["500000", "0.75"], ["1000000", "0.7"], ["2000000", "0.6"],
          ["3000000", "0.5"], ["4000000", "0.4"], ["5000000", "0.3"],
          ["10000000", "0.2"], ["50000000", "0.1"], [null, "0"],
        ]),
      },
      { asset: "rBB", parameter: "collateral_ratio", unit: "USD", before: stockBefore, after: stockAfter },
      {
        asset: "rGLW", parameter: "collateral_ratio", unit: "USD",
        before: tiers([
          ["10000", "0.95"], ["50000", "0.95"], ["200000", "0.95"],
          ["500000", "0.95"], ["1000000", "0.94"], ["2000000", "0.93"],
          ["3000000", "0.92"], ["4000000", "0.91"], ["5000000", "0.9"],
          ["10000000", "0.85"], ["15000000", "0.8"], ["20000000", "0.75"],
          ["25000000", "0.7"], ["30000000", "0.65"], ["40000000", "0.6"],
          ["50000000", "0.5"], [null, "0"],
        ]),
        after: stockAfter,
      },
    ],
  }),
  acceptedFixture({
    id: "wif-2026-03-27",
    url: "https://www.bitget.com/support/articles/12560603881315",
    title: "Bitget to adjust the collateral ratios for selected unified trading account margin coins: WIF",
    publishedAt: "2026-03-24T07:50:00Z",
    effectiveAt: "2026-03-27T10:00:00Z",
    timezone: "UTC+8",
    coverage: ["collateral_only", "unbounded_tier", "crypto_asset"],
    changes: [{
      asset: "WIF", parameter: "collateral_ratio", unit: "USD",
      before: tiers([
        ["200000", "0.9"], ["500000", "0.88"], ["800000", "0.86"],
        ["1000000", "0.84"], ["1200000", "0.82"], ["1400000", "0.8"],
        ["1500000", "0.75"], ["1600000", "0.7"], ["1800000", "0.6"],
        ["2000000", "0.5"], [null, "0"],
      ]),
      after: tiers([
        ["1000", "0.6"], ["2500", "0.6"], ["5000", "0.6"],
        ["10000", "0.6"], ["50000", "0.55"], ["80000", "0.54"],
        ["100000", "0.53"], ["150000", "0.5"], ["200000", "0.45"],
        ["250000", "0.4"], [null, "0"],
      ]),
    }],
  }),
  acceptedFixture({
    id: "xrp-2026-06-24",
    url: "https://www.bitget.com/support/articles/12560603887286",
    title: "Bitget to adjust the collateral ratios for selected unified trading account margin coins: XRP",
    publishedAt: "2026-06-24T02:23:00Z",
    effectiveAt: "2026-06-24T10:00:00Z",
    timezone: "UTC+0",
    coverage: ["collateral_only", "unbounded_tier", "crypto_asset"],
    changes: [{
      asset: "XRP", parameter: "collateral_ratio", unit: "USD",
      before: tiers([
        ["10000", "0.9"], ["30000", "0.9"], ["80000", "0.9"],
        ["200000", "0.9"], ["500000", "0.88"], ["800000", "0.86"],
        ["1000000", "0.84"], ["1200000", "0.82"], ["1400000", "0.8"],
        ["1500000", "0.75"], ["1600000", "0.7"], ["1800000", "0.6"],
        ["2000000", "0.5"], [null, "0"],
      ]),
      after: tiers([
        ["10000", "0.95"], ["50000", "0.95"], ["200000", "0.95"],
        ["500000", "0.95"], ["1000000", "0.94"], ["2000000", "0.93"],
        ["3000000", "0.92"], ["4000000", "0.91"], ["5000000", "0.9"],
        ["6000000", "0.85"], ["7000000", "0.8"], ["8000000", "0.7"],
        ["10000000", "0.5"], [null, "0"],
      ]),
    }],
  }),
  acceptedFixture({
    id: "aster-2026-04-30",
    url: "https://www.bitget.com/support/articles/12560603883330",
    title: "Bitget to adjust the collateral ratios for selected unified trading account margin coins: ASTER",
    publishedAt: "2026-04-29T02:30:00Z",
    effectiveAt: "2026-04-30T10:00:00Z",
    timezone: "UTC+0",
    coverage: ["collateral_only", "unbounded_tier", "crypto_asset"],
    changes: [{
      asset: "ASTER", parameter: "collateral_ratio", unit: "USD",
      before: tiers([
        ["200000", "0.1"], ["500000", "0.1"], ["700000", "0.1"],
        ["1000000", "0.1"], [null, "0"],
      ]),
      after: tiers([
        ["5000", "0.8"], ["10000", "0.8"], ["30000", "0.8"],
        ["50000", "0.8"], ["100000", "0.77"], ["125000", "0.74"],
        ["150000", "0.71"], ["170000", "0.68"], ["200000", "0.65"],
        ["250000", "0.6"], ["300000", "0.55"], ["400000", "0.5"],
        ["500000", "0.4"], [null, "0"],
      ]),
    }],
  }),
  rejectedFixture({
    id: "safe-maintenance-2025-03-28",
    url: "https://www.bitget.com/support/articles/12560603824682",
    title: "Bitget to adjust the maintenance margin rate for USDT-M perpetual futures trading pairs",
    publishedAt: "2025-03-27T13:26:00+08:00",
    effectiveAt: "2025-03-28T18:00:00+08:00",
    timezone: "UTC+8",
    coverage: ["maintenance_or_leverage", "mixed_change", "ambiguous_or_unsupported"],
    sourceText: "SAFEUSDT leverage, position tiers, and maintenance margin rates change at 2025-03-28 18:00 UTC+8. Before/after rows end at 10,000,000 USDT and do not state a tier above that cap. Existing positions use a later effective date of 2025-04-03 18:00 UTC+8.",
    rejectionReasons: [
      "The schedule does not state an unbounded final tier.",
      "The announcement gives conflicting effective dates for new and existing positions.",
      "Leverage changes are outside ParameterChange schema version 1.",
    ],
  }),
  rejectedFixture({
    id: "jct-maintenance-2026-07-01",
    url: "https://www.bitget.com/support/articles/12560603887790",
    title: "Announcement on adjustment of leverage, position tiers and maintenance margin rate for JCTUSDT perpetual futures trading pair",
    publishedAt: "2026-07-01T10:45:00Z",
    effectiveAt: "2026-07-01T12:00:00Z",
    timezone: "UTC+0",
    coverage: ["maintenance_or_leverage", "mixed_change", "ambiguous_or_unsupported"],
    sourceText: "JCTUSDT leverage, tiers and maintenance rates change at 2026-07-01 12:00 UTC+0, but existing positions change at 2026-07-04 12:00 UTC+0. The before table ends at 3,000,000 and the after table ends at 5,000,000 with no above-cap tier.",
    rejectionReasons: [
      "The schedule does not state unbounded final tiers.",
      "New and existing positions have different effective dates.",
      "Leverage changes are outside ParameterChange schema version 1.",
    ],
  }),
  rejectedFixture({
    id: "btc-maintenance-2025-09-26",
    url: "https://www.bitget.com/support/articles/12560603838668",
    title: "Announcement on adjustment of leverage, position tiers and maintenance margin rate for BTCUSDT perpetual futures trading pair",
    publishedAt: "2025-09-26T08:22:00Z",
    effectiveAt: "2025-09-26T08:22:00Z",
    timezone: "UTC+0",
    coverage: ["maintenance_or_leverage", "mixed_change", "ambiguous_or_unsupported"],
    sourceText: "BTCUSDT before and after maintenance rates are identical across the displayed rows. First-tier leverage changes from 125 to 150. Both tables end at 1,200,000,000 USDT without an above-cap tier.",
    rejectionReasons: [
      "The represented maintenance parameter does not change.",
      "The actual leverage change is outside ParameterChange schema version 1.",
      "The schedule does not state an unbounded final tier.",
    ],
  }),
  rejectedFixture({
    id: "classic-maintenance-formula-2025-11-10",
    url: "https://www.bitget.com/support/articles/12560603841952",
    title: "Bitget to update maintenance margin calculation for classic account futures",
    publishedAt: "2025-11-07T09:00:00Z",
    effectiveAt: "2025-11-10T08:00:00Z",
    timezone: "UTC",
    coverage: ["maintenance_or_leverage", "ambiguous_or_unsupported"],
    sourceText: "Bitget changes classic-account maintenance calculation from applying one highest tier to the full position to progressive tier calculation. It also changes position valuation from min(entry price, mark price) to mark price for new positions. This is a calculation-logic change, not a complete before/after rate schedule.",
    rejectionReasons: [
      "Calculation-method changes are outside ParameterChange schema version 1.",
      "The source does not provide one complete aligned before/after tier schedule.",
    ],
  }),
  rejectedFixture({
    id: "unnamed-collateral-2026-04-21",
    url: "https://www.bitget.com/support/articles/12560603882817",
    title: "Bitget to adjust the collateral ratios for selected unified trading account margin coins",
    publishedAt: "2026-04-20T06:25:00Z",
    effectiveAt: "2026-04-21T16:00:00+08:00",
    timezone: "UTC+8",
    coverage: ["collateral_only", "ambiguous_or_unsupported", "unbounded_tier"],
    sourceText: "The announcement states that selected unified-account collateral ratios change at 2026-04-21 16:00 UTC+8 and provides an after schedule from 0-500,000 at 0.95 through above 10,000,000 at 0.00. The normalized page text does not identify the affected asset and provides no before schedule.",
    rejectionReasons: [
      "The affected asset identifier is absent.",
      "The before schedule is absent.",
    ],
  }),
];

mkdirSync(outputDirectory, { recursive: true });
for (const fixture of fixtures) {
  const path = join(outputDirectory, `${fixture.id}.json`);
  writeFileSync(path, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
}

process.stdout.write(`Wrote ${fixtures.length} evaluation fixtures.\n`);
