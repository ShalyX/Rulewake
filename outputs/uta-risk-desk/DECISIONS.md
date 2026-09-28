# Decision log

This file records durable decisions. Proposed changes should add a new entry rather than silently rewriting the rationale for an earlier decision.

## D-001 — Park Foreword

- Date: 17 September 2026
- Status: accepted
- Decision: Keep the Foreword prototype as a reserve concept and stop active development.
- Rationale: Outcome bias is real, but the standalone product has indirect financial value, high manual-input friction, weak proprietary data, and strong substitution from journals and general-purpose models.

## D-002 — Pursue account-level UTA risk impact

- Date: 17 September 2026
- Status: accepted
- Decision: Focus on personalized account impact from collateral-rule changes and cross-asset shocks.
- Rationale: The consequence is direct and measurable; the mechanics are Bitget-specific; the required current-state data is available; and the public S2 scan did not find the same workflow.

## D-003 — Human decision, read-only product

- Date: 17 September 2026
- Status: accepted
- Decision: Enter AI Trading Desk and keep order execution outside the MVP.
- Rationale: The value is understanding and preparing for account risk. Automatic execution introduces authority, safety, validation, and paper-log requirements without improving the core proof.

## D-004 — Deterministic arithmetic

- Date: 17 September 2026
- Status: accepted
- Decision: All balances, tier application, scenario arithmetic, thresholds, and buffer calculations are implemented as deterministic code.
- Rationale: Language-model arithmetic is neither auditable nor sufficiently reliable for account-risk calculations.

## D-005 — Qwen performs constrained extraction and explanation

- Date: 17 September 2026
- Status: accepted
- Decision: Qwen converts official announcement text into a validated structured change object and explains already-computed results.
- Rationale: This is a legitimate LLM task with clear evaluation data. Qwen never becomes the source of a financial number.

## D-006 — Use Bitget current state as the baseline

- Date: 17 September 2026
- Status: accepted
- Decision: Start projections from Bitget's returned effective equity, maintenance margin, and margin ratio, then apply transparent deltas.
- Rationale: Reconstructing every private risk-engine detail would be error-prone. Baseline reconciliation grounds the scenario in the exchange's own current calculation.

## D-007 — No public collection of Bitget credentials

- Date: 17 September 2026
- Status: accepted
- Decision: The public hackathon demo uses a labelled fixture or project-owned read-only/demo account. Visitors are not asked to paste API secrets.
- Rationale: A short-lived hackathon service should not become a custodian of third-party exchange credentials.

## D-008 — Provisional track selection

- Date: 17 September 2026
- Status: proposed pending final collision scan
- Decision: AI Trading Desk → Information Extraction & Signal Generation.
- Rationale: The main AI transformation is unstructured Bitget announcement → structured parameter change → personalized risk signal. Open Theme remains the fallback if the named sub-theme becomes crowded.

## D-009 — No public brand yet

- Date: 17 September 2026
- Status: accepted
- Decision: Use `uta-risk-desk` only as an internal folder/working descriptor. It is not the project name. Do not choose a public name or visual identity until user and technical gates pass.
- Rationale: Naming before user and workflow validation would create attachment to a concept that may still narrow or pivot. When the gate passes, run a separate collaborative naming and concept-first identity phase using the brand-identity skill, including distinct territories, ownability checks, a brand kit and launch assets.

## D-010 — Lock the Rulewake name; reject the initial visual direction

- Date: 19 September 2026
- Status: accepted
- Decision: The public product name is **Rulewake**. The name lock does not approve the initial editorial identity board, its palette, its provisional mark, or the current application UI.
- Rationale: Rulewake best captures the product mechanism: a verified external rule creates a measurable downstream effect through the account. The initial warm-paper/editorial treatment repeats an overused house style and does not meet the desired level of visual originality.
- Consequence: Replace all public placeholder naming only after a new visual territory is selected. Do not use the original `rulewake.svg` board as a production design reference.

## D-011 — Adopt Causal Field as Rulewake's interface system

- Date: 19 September 2026
- Status: accepted and implemented
- Decision: Build Rulewake around the bright Causal Field territory, with the effective-time scrubber borrowed as a behavior—not a visual style—from Split-Time Observatory.
- Rationale: The field turns the product's deterministic dependency graph into the interface itself. The rule boundary, affected collateral, adjusted equity, margin-ratio movement and required buffer become one readable causal event instead of a stack of dashboard cards.
- Consequence: Future product and launch assets must extend the field language: graphite contours, one orange rule boundary, restrained violet propagation states, explicit node labels and accessible non-spatial traces. Do not return to the retired editorial-sheet composition or generic dark trading-terminal styling.
