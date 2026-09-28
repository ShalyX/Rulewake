# Product brief

## Executive summary

Bitget's Unified Trading Account improves capital efficiency by letting several asset types support one shared margin pool. That same design makes risk less intuitive. An rToken, cryptocurrency, stablecoin, liability, open order, or futures position can change the safety of the whole account. Collateral and maintenance-margin tiers may also be updated by Bitget.

The product converts these changes into an account-specific before/after view. It combines official Bitget state, official tier data, a constrained Qwen extraction step, and deterministic calculations. The trader remains responsible for the final decision.

## Problem statement

When Bitget changes a collateral ratio or maintenance-margin tier—or when an rToken collateral asset faces a reopening gap—an Advanced Mode UTA trader cannot quickly determine:

- how much adjusted equity is lost;
- whether the account moves into the warning or liquidation band;
- which asset caused the change;
- how much 100%-eligible collateral would restore a chosen safety target; and
- which assumptions make that projection uncertain.

The current alternative is to monitor announcements, inspect current account risk, copy several tier tables into a spreadsheet, apply piecewise calculations, account for positions and liabilities, and repeat the exercise whenever balances or prices change.

## Why now

- Bitget has expanded UTA, rToken margin support, and spot-margin support.
- Eligible users began moving from classic accounts to UTA in September 2026.
- Official UTA product-update pages show repeated changes to collateral, leverage, limits, and maintenance-margin parameters.
- Bitget's S2 focus is AI × U.S. stock and tokenized-stock trading.
- Official Agent Hub and UTA v3 interfaces make a read-only, account-aware tool technically feasible.

## Primary target user

An active Bitget UTA Advanced Mode trader who:

- enables at least one non-stable asset or rToken as collateral;
- holds one or more cross-margin positions or liabilities;
- trades often enough that account composition changes during the week;
- understands leverage but does not maintain a custom risk engine; and
- cares more about avoiding forced actions than receiving another directional trade signal.

This is not for “all traders.” Spot-only users in Basic Mode without leverage do not have the target problem.

## Secondary users

- Small trading teams monitoring several Bitget sub-accounts.
- Community operators helping members understand UTA changes.
- Copy traders holding rToken collateral alongside crypto exposure.
- Bitget product, education, or risk teams evaluating a user-facing impact explainer.

These users are not part of the first public MVP unless they strengthen the demo without expanding the data model.

## Jobs to be done

### Core job

When a Bitget risk parameter is about to change, show me the effect on my actual shared-margin account before it takes effect so I can decide whether to add buffer, reduce risk, or do nothing.

### Supporting jobs

- Before a U.S. market closure, show how a selected rToken gap and crypto PnL shock interact.
- Explain why the margin ratio changed in terms I can audit.
- Separate current exchange facts from scenario assumptions.
- Produce a worksheet I can save or share with a teammate.

## Value proposition

The product does not claim to find alpha. It reduces the time and ambiguity between a generic Bitget warning and an account-specific risk decision.

The measurable value is:

- minutes saved per risk review;
- fewer unnoticed affected assets;
- correct tier application;
- earlier identification of threshold crossings;
- a clear minimum buffer for a selected target ratio; and
- an audit trail of source data and assumptions.

## Differentiation

| Alternative | What it does | What remains unresolved |
| --- | --- | --- |
| Bitget account UI | Shows current risk ratio and collateral settings | Does not publicly document a future before/after announcement-impact workflow |
| Bitget announcements | Publish generic parameter changes and warnings | Do not map the change to a specific account |
| General liquidation calculators | Estimate isolated or simple cross-margin liquidation | Do not model Bitget UTA's account-level, tiered rToken collateral changes |
| FaradayDesk / TradePremortem | Stress a proposed trade or thesis | Do not reconstruct the existing account's solvency response to platform parameter changes |
| Portfolio trackers | Aggregate balances, PnL, and generic risk | Usually lack Bitget-specific UTA tiers and announcement parsing |
| Manual spreadsheet | Can reproduce calculations | Requires upkeep, correct tier logic, and repeated data entry |

## Product wedge

The first wedge is **announcement impact**, not a general risk terminal:

1. Select a verified Bitget announcement.
2. Extract its structured parameter change.
3. Match affected assets to a sample or read-only demo account.
4. Calculate the before/after risk state.
5. Test one additional market shock.
6. Export the worksheet.

This wedge is narrow enough to demonstrate honestly and distinctive enough to avoid becoming another generic trading dashboard.

## Goals

- Demonstrate one complete question-to-actionable-insight workflow.
- Produce numerically reproducible results.
- Make Qwen's role visible and bounded.
- Showcase Bitget UTA and rToken mechanics specifically.
- Support sample mode without credentials.
- Fail safely when data is stale, incomplete, or inconsistent.

## Non-goals

- Automatic trading, rebalancing, hedging, or liquidation prevention.
- Official replication of Bitget's private liquidation engine.
- Return forecasts, price predictions, or financial advice.
- Multi-exchange aggregation.
- Tax accounting or corporate-action reconciliation.
- Push-notification infrastructure in the hackathon MVP.
- Customer credential custody.
- Institutional loan risk units in the first release.

## Commercial hypothesis

The most credible initial model is freemium:

- Free: sample mode, current-state explanation, and one manual scenario.
- Paid individual: continuous read-only monitoring, saved accounts, announcement alerts, scenario history, and exports.
- Later team plan: several sub-accounts, shared policies, and audit logs.

Adjacent risk and liquidation tools charge roughly low tens of dollars per month. This supports category willingness to pay but does not prove demand for this product. Pricing work begins only after users demonstrate repeated behaviour and read-only connection willingness.

## Core hypotheses

| ID | Hypothesis | Evidence required |
| --- | --- | --- |
| H1 | UTA users do not confidently calculate future collateral-change impact | 3 of 5 qualified interviews describe a manual, approximate, or absent process |
| H2 | A personalized before/after ratio changes behaviour | 2 of 5 users identify a real action they would take from the result |
| H3 | Read-only connectivity is acceptable | 2 of 5 users accept a permission-minimized connection after security explanation |
| H4 | Deterministic results can reconcile to Bitget | Baseline fields match; calculated fixtures reproduce official examples |
| H5 | Qwen can extract tier tables reliably | 100% critical-field accuracy on the release evaluation set; failures detected rather than silently accepted |

## Success metrics

### Hackathon proof metrics

- 100% pass rate on golden tier-calculation fixtures.
- Baseline current-state reconciliation within the documented tolerance.
- Zero silent acceptance of malformed announcement extraction.
- Complete demo workflow in under 90 seconds for a first-time tester.
- At least five user tests or, if recruitment fails, a documented validation plan with observed usability sessions.

### Post-hackathon product metrics

- Percentage of connected accounts with at least one relevant announcement per month.
- Alert-to-scenario-open rate.
- Scenario-to-user-action rate, recorded as self-reported action only.
- Four-week retained connected accounts.
- Frequency of calculation discrepancies against Bitget.
- Support incidents involving credential or data handling.

## Internal positioning statement

For Bitget UTA Advanced Mode traders using rTokens or other non-stable collateral, the product is a read-only account-risk workbench that translates platform rule changes and cross-asset shocks into personalized margin impact. Unlike thesis chatbots or generic liquidation calculators, it starts from the exchange's current account state, applies Bitget's tiered rules deterministically, and shows every assumption before the trader acts.
