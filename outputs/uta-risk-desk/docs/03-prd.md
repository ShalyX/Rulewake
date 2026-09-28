# Product requirements document

## 1. Product definition

The unnamed product is a read-only AI Trading Desk for understanding how an official Bitget UTA parameter change or user-defined cross-asset shock may affect one account's adjusted equity and cross-margin safety buffer.

The MVP proves one workflow well. It is not a general portfolio tracker.

## 2. Primary user story

> As a Bitget UTA Advanced Mode trader using rToken or other non-stable collateral, I want to see how a published collateral change affects my current shared-margin account so I can make my own risk decision before the change takes effect.

## 3. Supporting user stories

- As a trader, I want every source value and assumption visible so I can audit the result.
- As a trader, I want to test an additional collateral-price or position-PnL shock without modifying my account.
- As a trader, I want to choose a target safety ratio and see the additional 100%-eligible collateral needed to reach it.
- As a judge, I want to see where Qwen is used and where deterministic code is used.
- As a demo visitor, I want to complete the workflow without creating an account or providing an exchange key.
- As a maintainer, I want malformed or stale data to stop the calculation rather than create plausible-looking output.

## 4. P0 workflow

### Step 1 — Choose account mode

The visitor selects:

- **Sample account:** committed, redacted fixture with a fixed timestamp and obvious “sample” label.
- **Live demo account:** project-owned read-only or official demo account, if operationally available.

The public MVP does not offer visitor credential entry.

### Step 2 — Inspect current state

Show:

- snapshot time and freshness;
- account mode;
- adjusted/effective equity;
- maintenance margin;
- current cross-margin ratio;
- position value and account leverage;
- enabled collateral assets;
- affected-asset contribution; and
- current risk band.

The user can open “How this is calculated” to view field definitions and sources.

### Step 3 — Select an official change

The user chooses a curated Bitget announcement or pastes text from a whitelisted Bitget Support URL.

Show:

- source URL and title;
- publication and effective times;
- affected assets;
- parameter type;
- old and new tier tables; and
- extraction status.

Qwen's extracted object must pass deterministic validation before “Calculate impact” is enabled.

### Step 4 — Review baseline impact

Calculate and display:

- affected gross USD value;
- old adjusted-collateral contribution;
- new adjusted-collateral contribution;
- adjusted-equity delta;
- projected adjusted equity;
- projected cross-margin ratio;
- ratio change in percentage points;
- projected risk band; and
- assumptions held constant.

### Step 5 — Run one compound scenario

Allow the user to set bounded changes:

- affected collateral price: -50% to +25%;
- aggregate cross-margin PnL change: bounded by a clearly displayed maximum; and
- optional maintenance-margin tier change if present in the announcement.

Do not allow arbitrary free-text numbers to reach the engine without validation.

### Step 6 — Choose a safety target

The user selects a target cross-margin ratio, with presets such as 50%, 65%, and 75%, plus a valid custom value below the warning threshold.

Display the minimum additional 100%-eligible collateral required under the scenario. Label it “scenario buffer,” not “required deposit” or “guaranteed safe amount.”

### Step 7 — Export

Export a printable worksheet containing:

- account mode: sample or live demo;
- source timestamps;
- announcement source and extracted change;
- current state;
- scenario inputs;
- calculation results;
- assumptions and limitations;
- engine version; and
- generation time.

Never export credentials, internal prompts, or raw private API headers.

## 5. Information architecture

### Screen A — Start

- Product thesis
- Sample/live-demo choice
- Read-only and scenario disclaimer
- “Open risk desk” action

### Screen B — Account snapshot

- Risk ratio and band
- Adjusted equity and maintenance margin
- Asset-contribution table
- Positions/open-order summary
- Freshness and provenance status

### Screen C — Change reader

- Official announcement selector/input
- Source preview
- Qwen extraction status
- Validated old/new tier comparison
- Affected-account match

### Screen D — Impact workspace

- Before/after account cards
- Contribution waterfall
- Margin-ratio movement
- Compound scenario controls
- Scenario buffer result
- Calculation drawer

### Screen E — Worksheet

- Human-readable summary
- Evidence table
- Formula appendix
- Export/print controls

## 6. Functional requirements

### Account and source data

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-001 | Load a deterministic sample account without network access | P0 |
| FR-002 | Load a project-owned read-only live/demo snapshot through a server-side adapter | P0 if credentials available |
| FR-003 | Display source, timestamp, freshness, and mode for every snapshot | P0 |
| FR-004 | Refuse calculations when required baseline fields are absent or invalid | P0 |
| FR-005 | Show which assets are enabled as collateral | P0 |

### Announcement extraction

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-010 | Load at least three curated official Bitget announcements | P0 |
| FR-011 | Extract asset, change type, effective time, and tier rows into a strict schema | P0 |
| FR-012 | Validate tier continuity, ordering, units, and ratios before use | P0 |
| FR-013 | Show the source text beside the extracted structure | P0 |
| FR-014 | Reject unsupported or ambiguous announcements with a useful reason | P0 |
| FR-015 | Fetch only whitelisted Bitget Support URLs | P1 |

### Calculation

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-020 | Apply collateral ratios progressively across tiers | P0 |
| FR-021 | Start from the Bitget current-state baseline and apply visible deltas | P0 |
| FR-022 | Calculate before/after adjusted equity and projected cross-margin ratio | P0 |
| FR-023 | Support a collateral-price shock and aggregate PnL shock | P0 |
| FR-024 | Calculate scenario buffer for a selected target ratio | P0 |
| FR-025 | Recompute maintenance margin when a validated maintenance-tier change is supplied | P1 |
| FR-026 | Estimate exposure reduction required | P2; excluded until separately validated |
| FR-027 | Preserve full-precision internal arithmetic and format only for display | P0 |
| FR-028 | Produce a machine-readable calculation trace | P0 |

### Explanation and export

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-030 | Generate a bounded explanation from computed facts only | P0 |
| FR-031 | Separate “current,” “projected,” and “assumed” visually and semantically | P0 |
| FR-032 | Export a printable worksheet | P0 |
| FR-033 | Include an engine version and evidence timestamps in the export | P0 |
| FR-034 | Never imply that an action is financial advice or guaranteed to prevent liquidation | P0 |

## 7. Risk bands

Risk bands are communication aids, not new exchange rules.

| Band | Default rule | Display behaviour |
| --- | --- | --- |
| Stable | ratio < 65% | Neutral language; no recommendation |
| Watch | 65% ≤ ratio < 80% | Highlight reduced buffer |
| Warning | 80% ≤ ratio < 100% | Reference Bitget's warning threshold and show buffer prominently |
| Critical | ratio ≥ 100% | State that Bitget may cancel orders and begin partial-liquidation procedures if the ratio remains elevated |
| Unknown | incomplete/stale/inconsistent data | Suppress risk conclusion and explain what is missing |

Only the 80% and 100% exchange thresholds are sourced from current Bitget documentation. The 65% product band is a configurable display convention and must be labelled as such.

## 8. Empty, loading, and error states

- **No affected asset:** “This account does not currently hold positive equity in the affected collateral. No direct collateral contribution change was calculated.”
- **Zero collateral ratio:** Explain that the asset contributes no adjusted equity before/after; other trade-loss effects may still exist.
- **Stale snapshot:** Disable calculation when freshness exceeds the configured limit unless the user explicitly switches to historical/sample analysis.
- **Qwen unavailable:** Allow curated, prevalidated announcements to continue; disable new extraction.
- **Malformed extraction:** Show validation errors and source comparison; never auto-correct silently.
- **Baseline inconsistency:** Show API-returned values and calculated residual; suppress “exact” language.
- **Unsupported parameter change:** Preserve the source, explain unsupported fields, and do not calculate partial impact as if complete.
- **Network failure:** Keep last valid sample state with clear timestamp; never label it live.

## 9. Non-functional requirements

- Scenario recomputation completes locally in under 250 ms at p95 for the fixture size.
- Initial sample workflow is usable at mobile widths but optimized for desktop research.
- All interactive controls are keyboard accessible.
- Text and state differences do not rely on red/green alone.
- Decimal arithmetic avoids binary floating-point for financial values.
- Server logs contain no credentials, raw authorization headers, or private account payloads.
- Qwen and Bitget keys never enter the client bundle.
- The demo remains useful when Qwen or live Bitget data is temporarily unavailable.

## 10. Acceptance criteria

1. A first-time visitor completes the canonical sample workflow in under 90 seconds.
2. The rSTRC fixture reproduces the hand-calculated before/after collateral values.
3. The UI shows the original announcement source and extracted tiers together.
4. Invalid tier overlap prevents calculation.
5. Changing a scenario input produces the same result across repeated runs.
6. The calculation trace accounts for every displayed delta.
7. Current and projected values cannot be confused in labels, export, or screen-reader text.
8. A target-ratio buffer is never negative and rounds upward conservatively.
9. No public route accepts or stores a visitor's Bitget secret.
10. No order-capable Bitget permission or endpoint is present in the deployed MVP.
11. Qwen failure does not break curated-announcement calculations.
12. The export includes sources, timestamps, assumptions, and limitations.

## 11. Explicitly deferred

- Push, Telegram, email, or SMS alerts.
- Background account polling.
- User authentication and saved cloud accounts.
- Team/sub-account aggregation.
- Automatic announcement discovery.
- Corporate-action settlement analysis.
- Auto-borrow optimization.
- Order simulation or execution.
- Multi-exchange support.
- Billing.
