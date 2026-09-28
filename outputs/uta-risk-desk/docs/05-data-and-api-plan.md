# Data and API plan

## 1. Data principles

- Bitget is authoritative for account state, market state, account configuration, and tier data.
- Official Bitget Support pages are authoritative for announced future changes.
- Qwen is not authoritative for any source value; it produces a candidate structured representation.
- Each normalized field retains its source path, source timestamp, retrieval time, and freshness status.
- The product never silently substitutes sample data for failed live data.

## 2. Required Bitget interfaces

Exact availability will be verified against the active UTA v3 specification and Agent Hub discovery surface during implementation.

| Need | Primary interface | Permission | MVP use |
| --- | --- | --- | --- |
| Account baseline | `GET /api/v3/account/assets` | UTA management read | Effective equity, MMR, margin ratio, leverage, asset list |
| Account mode | `GET /api/v3/account/settings` | UTA management read | Confirm Advanced Mode and configuration |
| Collateral configuration | `GET /api/v3/account/collateral-type` | UTA management read | Determine enabled collateral policy |
| User-eligible collateral tiers | `GET /api/v3/account/eligible-discount-rate` | UTA management read | Current tier schedule |
| Positions | `GET /api/v3/position/current-position` | Read | Current cross-margin positions and marks |
| Open orders | `GET /api/v3/trade/unfilled-orders` | Read | Margin-consuming orders |
| Tickers/index context | UTA market ticker interfaces | Public | Current market values and provenance |
| Position tiers | `GET /api/v3/market/position-tier` | Public | Maintenance-margin schedules |
| Fee rate | `GET /api/v3/account/fee-rate` | Read | Supported maintenance/fee calculations |

Agent Hub intent verbs may supply these through `account_overview`, `account_config`, `position`, `order`, `market`, and the read-only `raw` escape hatch. The adapter must record the underlying operation and response field.

## 3. Announcement sources

P0 uses a curated manifest of official Bitget Support URLs. Each manifest record contains:

```ts
type AnnouncementManifestItem = {
  id: string;
  url: string;
  title: string;
  publishedAt: string;
  expectedChangeType: "collateral_ratio" | "maintenance_tier" | "mixed";
  sourceSha256: string;
  fixturePath: string;
};
```

The server fetcher, if enabled, accepts only:

- HTTPS;
- an allowlist of official Bitget support hostnames;
- no redirects outside the allowlist;
- a small response-size limit;
- text/HTML content types; and
- a short timeout.

P0 does not crawl arbitrary websites or automatically monitor all announcements.

## 4. Normalized account snapshot

```ts
type AccountSnapshot = {
  schemaVersion: "1";
  snapshotId: string;
  mode: "sample" | "live_demo";
  accountMode: "advanced" | "basic" | "isolated" | "unknown";
  sourceTimestamp: string;
  retrievedAt: string;
  freshness: "fresh" | "stale" | "historical";
  totals: {
    accountEquityUsd: string;
    effectiveEquityUsd: string;
    maintenanceMarginUsd: string;
    initialMarginUsd: string;
    marginRatio: string;
    positionValueUsd: string;
    leverage: string;
  };
  assets: Array<{
    coin: string;
    equity: string;
    grossUsdValue: string;
    balance: string;
    available: string;
    debt: string;
    locked: string;
    collateralEnabled: boolean | null;
  }>;
  positions: NormalizedPosition[];
  openOrders: NormalizedOrder[];
  provenance: ProvenanceEntry[];
};
```

No UID, API key, secret, passphrase, deposit address, or withdrawal data belongs in this object.

## 5. Structured change contract

```ts
type ParameterChange = {
  schemaVersion: "1";
  source: {
    url: string;
    title: string;
    publishedAt: string | null;
    effectiveAt: string;
    timezone: string;
    sourceHash: string;
  };
  changes: Array<{
    asset: string;
    parameter: "collateral_ratio" | "maintenance_margin";
    unit: "USD";
    before: Tier[];
    after: Tier[];
  }>;
  unsupportedStatements: string[];
  extraction: {
    model: string;
    createdAt: string;
    confidence: "high" | "medium" | "low";
  };
};
```

The server must independently validate this object. Model confidence never overrides a failed validator.

## 6. Provenance contract

```ts
type ProvenanceEntry = {
  normalizedPath: string;
  sourceSystem: "bitget_uta" | "bitget_support" | "user_scenario" | "derived";
  sourceField?: string;
  sourceUrl?: string;
  sourceTimestamp?: string;
  retrievedAt: string;
  transform?: string;
};
```

The calculation trace references provenance entries rather than duplicating raw private payloads.

## 7. Freshness policy

| Data | Fresh limit | Behaviour when stale |
| --- | ---: | --- |
| Current account totals | 30 seconds in live-demo mode | Block “current” calculation; allow historical review with acknowledgement |
| Positions/open orders | 30 seconds | Same as account totals |
| Market prices | 30 seconds during supported live periods | Block current scenario; sample fixtures remain usable |
| Current tier schedule | 15 minutes | Refresh before a live calculation |
| Official announcement | Immutable by source hash for the demo | Warn if current source content differs from fixture hash |
| Sample fixture | Historical by definition | Always display fixed timestamp and “sample” badge |

Freshness values are implementation defaults, not exchange guarantees.

## 8. Sample fixtures

Commit small, redacted fixtures for:

1. Safe account with rSTRC collateral.
2. Account moved from watch to warning by a haircut.
3. Account moved to critical by the canonical rSTRC change.
4. Account with no affected asset.
5. Tier-boundary holdings.
6. Zero-collateral-rate asset.
7. Stale or missing baseline data.
8. Malformed/overlapping Qwen extraction.

Fixtures include source metadata and expected calculation outputs. They contain no real account identifier.

## 9. Caching

- Curated announcement text and validated extraction may be cached by source hash.
- Public tier data may be cached briefly with retrieval time visible.
- Private live-demo account payloads are not persisted by default.
- Calculation traces may be persisted only after redaction and only for the project-owned demo account.
- Browser scenario state may use session storage; clear it on explicit reset.

## 10. Error policy

| Failure | User-visible response | Calculation allowed? |
| --- | --- | --- |
| Bitget authentication error | “Live demo unavailable; switch to sample mode.” | Sample only |
| Missing effective equity/MMR/ratio | Name missing fields | No |
| Tier gap covering holding value | Highlight the exact gap | No |
| Overlapping tiers | Highlight overlap | No |
| Unsupported mixed announcement | List unsupported parameter | Only if partial calculation is explicitly disabled by default |
| Qwen timeout | Use prevalidated curated extraction if available | Yes for curated item |
| Source hash changed | Require re-extraction/revalidation | No until validated |
| Stale live snapshot | Offer refresh or historical mode | Historical only |
| Baseline residual outside tolerance | Show discrepancy and downgrade confidence | Scenario may run only as “illustrative,” not reconciled |

## 11. Live integration checklist

Implementation status: the read-only client and reconciliation harness are complete in the internal engine package. Live execution is pending a locally configured project-owned demo/read-only key. See [14-live-reconciliation-runbook.md](./14-live-reconciliation-runbook.md).

- Use a project-owned read-only or official demo key.
- Confirm permissions exclude trade, transfer, and withdrawal.
- Run through the official Agent Hub `--read-only` path where practical.
- Verify response field semantics against current documentation.
- Capture one redacted response for a golden integration fixture.
- Compare API margin ratio with normalized `R0`.
- Confirm whether ratios arrive as decimals or percent strings.
- Confirm whether `usdValue` is gross or collateral-adjusted for each asset.
- Confirm how isolated positions appear in aggregate fields.
- Confirm behavior when there are no positions or orders.
- Document all discrepancies before enabling live-demo mode.
