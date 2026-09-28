# Rulewake — Bitget UTA collateral-impact project

`uta-risk-desk` remains an internal folder/working descriptor. **Rulewake is the locked public product name.** Its selected identity is the Causal Field: a bright spatial calculation landscape where a verified rule change propagates through the account.

Updated: 20 September 2026  
Status: production-promoted submission candidate; stable URL recorded below  
Hackathon: Bitget AI Base Camp S2  
Provisional track: AI Trading Desk  
Provisional sub-theme: Information Extraction & Signal Generation

Stable public URL: https://rulewake.vercel.app

Production deployment: https://rulewake-60xzmlayo-shalyxs-projects.vercel.app

## One-sentence product thesis

The product is a read-only decision workbench that converts Bitget collateral announcements and user-defined market shocks into a personalized estimate of how a Unified Trading Account's adjusted equity, cross-margin ratio, and safety buffer may change before the change takes effect.

## The problem

Bitget UTA Advanced Mode combines spot, margin, futures, liabilities, open orders, and multiple collateral assets into one shared risk pool. Collateral is valued using asset-specific, tiered ratios. Bitget may change those ratios or maintenance-margin tiers, and rToken collateral can gap when the U.S. market reopens.

Bitget exposes the current account state and publishes the rules, but the user must still connect several pieces manually:

1. Notice the relevant announcement.
2. Determine whether the account holds the affected asset.
3. Apply the old and new tier tables correctly.
4. Recalculate adjusted equity and the cross-margin ratio.
5. Decide how much additional buffer is needed before the effective time.

The product turns that workflow into an inspectable, account-specific calculation. It does not predict returns, guarantee safety, or execute trades.

## Canonical demo

An official Bitget announcement changes rSTRC collateral tiers. The desk extracts the effective time and before/after tiers with Qwen, matches rSTRC against a read-only demo account, calculates the projected loss of adjusted equity, shows the resulting margin-ratio band, and displays the minimum additional 100%-collateral buffer required to return to the user's chosen safety target.

## Product principles

- Exact current-state values come from Bitget, not from the model.
- Financial arithmetic is deterministic and independently testable.
- Qwen extracts and explains; it does not invent balances, ratios, prices, or results.
- Every number carries source, timestamp, unit, and calculation provenance.
- Forecasts are labelled scenarios, not official Bitget liquidation quotes.
- The MVP is read-only and cannot place, cancel, modify, or close an order.
- The public demo never asks visitors for exchange credentials.
- Missing or inconsistent data fails visibly.

## Document map

| Document | Purpose |
| --- | --- |
| [STATUS.md](./STATUS.md) | Current stage, passed gates, blockers, and immediate next actions |
| [DECISIONS.md](./DECISIONS.md) | Durable product and engineering decisions |
| [01-product-brief.md](./docs/01-product-brief.md) | Thesis, target user, value, scope, and commercial hypothesis |
| [02-discovery-and-validation.md](./docs/02-discovery-and-validation.md) | Evidence, existing workflow, competition, and user-validation plan |
| [03-prd.md](./docs/03-prd.md) | User journeys, functional requirements, states, and acceptance criteria |
| [04-calculation-spec.md](./docs/04-calculation-spec.md) | Deterministic formulas, examples, thresholds, and numerical invariants |
| [05-data-and-api-plan.md](./docs/05-data-and-api-plan.md) | Bitget/Qwen sources, contracts, freshness, fixtures, and failure policy |
| [06-technical-architecture.md](./docs/06-technical-architecture.md) | Proposed system boundaries, services, routes, and deployment model |
| [07-ai-spec.md](./docs/07-ai-spec.md) | Qwen tasks, structured outputs, validation, and prompt-injection controls |
| [08-security-and-privacy.md](./docs/08-security-and-privacy.md) | Threat model, credential policy, data minimization, and logging rules |
| [09-test-and-qa-plan.md](./docs/09-test-and-qa-plan.md) | Unit, property, integration, evaluation, accessibility, and release gates |
| [10-delivery-roadmap.md](./docs/10-delivery-roadmap.md) | Milestones, work breakdown, sequencing, and definition of done |
| [11-demo-and-submission.md](./docs/11-demo-and-submission.md) | Demo narrative and hackathon requirement mapping |
| [12-risk-register.md](./docs/12-risk-register.md) | Product, data, security, judging, and schedule risks |
| [13-research-sources.md](./docs/13-research-sources.md) | Primary sources and evidence ledger |
| [14-live-reconciliation-runbook.md](./docs/14-live-reconciliation-runbook.md) | Safe read-only account validation procedure and pass criteria |
| [15-reconciliation-attempt-log.md](./docs/15-reconciliation-attempt-log.md) | Timestamped live-gate attempts, outcomes, and evidence still required |
| [16-qwen-evaluation-status.md](./docs/16-qwen-evaluation-status.md) | Qwen extraction evaluation corpus, results and release decision |
| [17-security-deployment-gate.md](./docs/17-security-deployment-gate.md) | Public-route hardening, deployment constraints and verification evidence |
| [18-preview-release-evidence.md](./docs/18-preview-release-evidence.md) | Signed-out public-preview, keyboard, mobile and live-Qwen rehearsal evidence |
| [Submission pack](./submission/README.md) | Final copy, architecture diagram, launch frames and screenshot capture plan |
| [Brand strategy and name territories](./brand/01-brand-strategy-and-name-territories.md) | Three concept-first identity directions and the lead recommendation |
| [Ownability and collision review](./brand/02-ownability-and-collision-review.md) | Rejected names, preliminary public collision checks and ownability scores |
| [Brand decision card](./brand/03-brand-decision-card.md) | The single selection gate before production identity work |
| [Rulewake visual reboot](./brand/04-visual-reboot-territories.md) | Three non-editorial interface worlds, risks and the recommended direction |

## Stage gates

The project advances only when the relevant gate is satisfied.

| Gate | Pass condition | Current state |
| --- | --- | --- |
| Opportunity verification | Official rules, track, materials, and deadline documented | Passed, with deadline conflict tracked |
| Problem evidence | Direct financial consequence and recurring Bitget-specific trigger | Passed |
| Technical feasibility | Required current-state and tier data documented through read-only interfaces | Passed, including project-owned demo-account reconciliation |
| Collision scan | No indexed S2 project with the same account-specific announcement-impact workflow | Passed provisionally; repeat before submission |
| User validation | At least 3 of 5 qualified users report a manual/unclear workflow; at least 2 accept read-only connectivity | Pending |
| MVP build | P0 acceptance tests pass with sample and live-demo modes | Public sample-mode preview passes; live customer route deliberately deferred |
| Submission | Production demo, repository, validation report, compliant X post, and form audit complete | Not started |

## Definition of a successful hackathon build

The build is successful when a judge can complete this flow without guidance:

1. Open a public demo with a clearly labelled sample account.
2. Inspect its current Bitget-derived risk state.
3. Select or paste a verified Bitget collateral announcement.
4. Inspect Qwen's extracted structured change.
5. Run the deterministic before/after impact calculation.
6. See exactly which holdings and formula terms changed.
7. Test a stock-gap or futures-PnL scenario.
8. Export a timestamped risk worksheet.

No claim of avoided liquidation, trading profitability, or official Bitget risk certification is required.

## Reserve concept

Foreword remains available at `../foreword/` as a reserve concept. It is not part of this build and must not be merged into this product during the hackathon.
