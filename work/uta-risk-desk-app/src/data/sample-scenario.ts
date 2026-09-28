import type { TierInput } from "@risk-engine";

import asterFixture from "../../../uta-risk-engine/test/fixtures/announcements/aster-2026-04-30.json";
import rstrcFixture from "../../../uta-risk-engine/test/fixtures/announcements/rstrc-2026-07-01.json";
import canonicalFixture from "../../../uta-risk-engine/test/fixtures/rstrc-canonical.json";

export type SampleEvent = {
  id: string;
  title: string;
  sourceTitle: string;
  sourceUrl: string;
  publishedAt: string;
  effectiveAt: string;
  sourceHash: string;
  unsupportedStatements: string[];
  change: {
    asset: string;
    parameter: string;
    unit: string;
    before: TierInput[];
    after: TierInput[];
  };
};

export type SampleAccount = {
  id: string;
  label: string;
  mode: "sample";
  freshnessStatus: "fresh" | "stale";
  freshnessLabel: string;
  effectiveEquityUsd: string;
  maintenanceMarginUsd: string;
  marginRatio: string;
  holdingsUsd: Record<string, string>;
};

function eventFromFixture(
  fixture: typeof rstrcFixture | typeof asterFixture,
  title: string,
): SampleEvent {
  const change = fixture.golden.changes[0];
  if (!change) throw new Error(`reviewed event ${fixture.id} has no parameter change`);

  return {
    id: fixture.id,
    title,
    sourceTitle: fixture.source.title,
    sourceUrl: fixture.source.url,
    publishedAt: fixture.source.publishedAt,
    effectiveAt: fixture.source.effectiveAt,
    sourceHash: fixture.source.sourceHash,
    unsupportedStatements: [...fixture.golden.unsupportedStatements],
    change: {
      asset: change.asset,
      parameter: change.parameter,
      unit: change.unit,
      before: change.before,
      after: change.after,
    },
  };
}

export const sampleEvents: SampleEvent[] = [
  eventFromFixture(rstrcFixture, "rSTRC collateral ratio change"),
  eventFromFixture(asterFixture, "ASTER collateral ratio change"),
];

const sharedHoldings = {
  rSTRC: canonicalFixture.input.changes[0]!.grossUsdBefore,
  ASTER: "100000",
};

export const sampleAccounts: SampleAccount[] = [
  {
    id: "canonical-risk",
    label: "Canonical UTA sample",
    mode: "sample",
    freshnessStatus: "fresh",
    freshnessLabel: "Current fixture",
    ...canonicalFixture.input.baseline,
    holdingsUsd: sharedHoldings,
  },
  {
    id: "buffered-risk",
    label: "Buffered UTA sample",
    mode: "sample",
    freshnessStatus: "fresh",
    freshnessLabel: "Current fixture",
    effectiveEquityUsd: "200000",
    maintenanceMarginUsd: "85000",
    marginRatio: "0.425",
    holdingsUsd: sharedHoldings,
  },
  {
    id: "stale-risk",
    label: "Stale UTA sample",
    mode: "sample",
    freshnessStatus: "stale",
    freshnessLabel: "Expired fixture",
    ...canonicalFixture.input.baseline,
    holdingsUsd: sharedHoldings,
  },
];

export const sampleScenario = {
  event: sampleEvents[0]!,
  account: sampleAccounts[0]!,
  expected: canonicalFixture.expected,
};
