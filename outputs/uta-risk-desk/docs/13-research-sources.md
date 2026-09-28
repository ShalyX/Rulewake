# Research Sources and Evidence Ledger

Last reviewed: **September 17, 2026**

## Source policy

Product behavior and submission decisions must be grounded in primary sources wherever possible:

1. current Bitget product/API documentation;
2. official Bitget announcements;
3. official hackathon handbook or organizer channels;
4. official Qwen/API documentation supplied by the organizer;
5. secondary sources only for market context or workflow discovery.

Every claim in the product should be traceable to a source, a deterministic calculation, or a clearly labeled hypothesis.

## Hackathon

### Bitget AI Base Camp Hackathon Season 2 handbook

- Source: [official handbook](https://bitget-ai.gitbook.io/bitgetai_hackathons2)
- Supports: program framing, tracks, participation/submission requirements, Qwen subsidy guidance and the September 27 date observed during research.
- Use: final rules verification and submission checklist.
- Note: another landing surface previously displayed September 21. The project therefore uses September 21 as its internal candidate date and must recheck the authoritative deadline before submission.

### Bitget AI Agent Hub

- Source: [official GitHub organization repository](https://github.com/Bitget-AI/agent_hub)
- Supports: organizer-provided agent integrations and implementation examples.
- Use: reference during Bitget/Qwen integration; do not assume repository examples define the exchange's financial formulas.

## Unified Trading Account and risk mechanics

### Unified Trading Account introduction

- Source: [Bitget UTA introduction](https://www.bitget.com/docs/uta/uta-intro)
- Supports: the UTA account model and API domain context.
- Use: product terminology and integration boundaries.

### Assets and balance API

- Source: [Bitget UTA assets and balance documentation](https://www.bitget.com/docs/catalog/account/assets-balance)
- Supports: fields available for account assets/balances and potential live snapshot construction.
- Use: normalized account-snapshot adapter.
- Validation still required: response fields, permissions and values must be tested against a project-owned read-only account before release.

### Account settings API

- Source: [Bitget UTA account settings documentation](https://www.bitget.com/docs/catalog/account/account-settings)
- Supports: account configuration context that may affect interpretation.
- Use: technical validation and compatibility checks.

### UTA collateral calculations

- Source: [Bitget — UTA collateral calculations](https://www.bitget.com/support/articles/12560603839176)
- Supports: collateral value concepts, tiered collateral treatment, adjusted equity and account-level risk interpretation.
- Use: calculation specification and user-facing formula trace.
- Caution: preserve progressive tier logic; do not multiply the full balance by a single terminal-tier rate.

### Unified-account collateral settings

- Source: [Bitget — collateral settings for unified accounts](https://www.bitget.com/support/articles/12560603830712)
- Supports: which assets can act as collateral and the role of collateral ratios.
- Use: collateral configuration ingestion and product education.

### UTA borrowing and repayment

- Source: [Bitget — UTA borrowing and repayment](https://www.bitget.com/support/articles/12560603822305)
- Supports: liabilities and borrowing behavior relevant to adjusted equity.
- Use: limitations and future expansion of the snapshot model.

### UTA migration/upgrade guidance

- Source: [Bitget — UTA upgrade/migration notice](https://www.bitget.com/support/articles/12560603893840)
- Supports: current account-mode transition context.
- Use: product compatibility checks and current-state verification.

## Stock-token and event examples

### Stock-token margin and collateral documentation

- Source: [Bitget — stock-token margin information](https://www.bitget.com/support/articles/12560603884928)
- Supports: stock-token-specific margin/collateral context.
- Use: target-user and scenario definition.

### rSTRC collateral-ratio update

- Source: [Bitget — rSTRC collateral ratio update](https://www.bitget.com/support/articles/12560603887694)
- Supports: a real old/new collateral-ratio event suitable for the canonical demonstration.
- Use: announcement extraction fixture and worked example.
- Required capture: source title, publication time, effective time, affected asset, old ratio, new ratio and exact evidence excerpts.

### Product-update archive

- Source: [Bitget product updates](https://www.bitget.com/support/sections/12508313447378/2)
- Supports: discovery of additional official events for the extraction evaluation set.
- Use: collect a diverse fixture set; each fixture should retain its direct article URL.

## Comparable workflow evidence

### FaradayDesk

- Product: [live site](https://faradaydesk.up.railway.app/)
- Code: [GitHub repository](https://github.com/0xileri/FaradayDesk)
- Supports: evidence that another hackathon entrant is already positioning a stock-token research/stress-testing desk around thesis review, local loss-budget math, Bitget market context and privacy.
- Use: competitive differentiation only.
- Conclusion: do not build a second generic thesis-pressure desk. The current concept must remain focused on account-specific Bitget policy impact.

## Secondary market signals

The following categories can inform willingness-to-pay research but cannot validate the product by themselves:

- portfolio and liquidation-alert tools;
- centralized-exchange risk dashboards;
- derivatives analytics subscriptions;
- institutional risk and collateral-management software.

Before citing a specific vendor, price or feature in public material, verify it from the vendor's current official site and record the date here.

## Evidence still required

| Evidence | Why it matters | Status |
|---|---|---|
| Sanitized/project-owned Bitget snapshot reconciled to displayed adjusted equity and margin ratio | Tests whether the public formula/delta model is safe enough for P0 | Open |
| Current API response examples for required endpoints | Confirms field names, auth scopes and freshness | Open |
| Qwen structured-output behavior using the supplied hackathon key | Confirms extraction reliability and latency | Open |
| At least five official announcement fixtures | Prevents overfitting to rSTRC wording | Open |
| Three to five target-user interviews | Validates workflow and urgency | Open |
| Current submission-form requirements | Prevents missing a mandatory artifact | Open |

## Evidence-handling rules

- Store raw fixtures separately from derived fields.
- Record retrieval time and source URL.
- Never silently edit a source fixture to make extraction easier.
- If an article changes, preserve the version used for the test and note that it is archived test data.
- Label inferences as inferences.
- Label sample account data as synthetic or sanitized.
- When official sources conflict, record both and choose the safer operational assumption until clarified.

