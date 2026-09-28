# Rulewake submission copy

Official reference: [Bitget AI Base Camp Hackathon S2](https://bitget-ai.gitbook.io/bitgetai_hackathons2)

## Form selections

| Field | Answer |
| --- | --- |
| Project name | Rulewake |
| Track | AI Trading Desk |
| Sub-theme | Decision Stress Testing |
| Live demo | https://rulewake.vercel.app/ |
| Apply for Demo Day | Yes |
| Apply for K3 Token Subsidy | User decision |
| University Name | Fill only if eligible |
| S1 participant/team | User decision |

## One-line description

Rulewake shows how a Bitget UTA collateral-rule change propagates through an account before the trader decides what to do.

## Short description

Rulewake is a read-only decision-stress-testing desk for Bitget Unified Trading Account collateral changes. It converts a reviewed rule update into a deterministic before-and-after account projection, showing the change in collateral contribution, effective equity, margin ratio, risk band and required buffer. Qwen extracts and explains bounded facts. It never supplies the financial arithmetic, sees credentials or makes the final decision.

## Project description

### 1. Thesis

A collateral-rule update can change a UTA account even when the trader has not changed the position or balance. The collateral contribution moves first. Effective equity follows. The same account can land in a new margin-risk band at the rule's effective time.

The current workflow makes that hard to see. A trader has to read an announcement, find the effective date, inspect several account fields, reproduce progressive collateral math and decide whether the existing buffer still works. Generic chatbots can summarize the announcement, but they are the wrong place to perform or invent account arithmetic.

Rulewake tests a narrower hypothesis: if the language task and the financial calculation are separated, a trader can inspect the whole causal chain without giving the model authority over the numbers. Qwen handles bounded extraction and explanation. A deterministic engine calculates the impact. The human decides whether to act.

### 2. Target user and product value

The primary user is a self-directed Bitget UTA Advanced Mode trader or small trading desk that holds multiple eligible collateral assets and needs to assess scheduled collateral updates before they take effect. The highest-value use case is a trader carrying rToken or cross-asset exposure through a 24/7 window, where the cash market may be closed but account risk can still change.

Rulewake gives that user one place to answer four questions:

1. What exactly changed in the official rule?
2. Which account value moves first?
3. Where does the margin ratio land if the documented assumptions stay fixed?
4. How much buffer would restore the chosen target ratio?

The value is not a trade signal or promise of execution. It is a faster, auditable decision check before the trader changes size, adds collateral or accepts the new risk state.

### 3. Validation data and key metrics

Observed engineering validation on the submitted build:

- 83 deterministic-engine tests pass across progressive collateral tiers, baseline reconciliation, projection, risk bands and conservative buffer sizing.
- 20 application tests pass across the scenario workflow, server-side explanation boundary, retries and connection readiness.
- A 10-fixture Qwen extraction evaluation passed the release gate with 100% exact success on five supported announcements and 100% correct rejection on five unsupported cases.
- A project-owned Bitget demo account completed authenticated read-only reconciliation. The client refuses keys that Bitget does not report as read-only.
- The production demo returned a live Qwen explanation labelled `QWEN · VALIDATED`, with the numeric allowlist passed.
- Desktop and 390 px mobile workflows were inspected on the stable production URL.

This is engineering validation, not proof of user adoption. The first product-validation target is 10 qualified UTA or rToken users completing the rSTRC research task without guidance. Success targets are at least 80% task completion, median time to a defensible impact decision below two minutes, and zero cases where a user mistakes Qwen text for the calculation source. Follow-up interviews will test whether users would return for the next collateral announcement and whether the exported worksheet is useful inside an actual desk review.

### 4. Progress

Built and live:

- a public landing page and multi-page product shell;
- a scenario workspace with reviewed rSTRC and ASTER collateral changes;
- deterministic decimal-safe impact calculations with a visible trace;
- selectable target-ratio buffer calculations;
- a reviewed primary-source library;
- browser-local analysis history;
- a share-safe worksheet export;
- server-side Qwen extraction and explanation with strict validation, retries and deterministic fallback;
- encrypted production configuration for Qwen and a Bitget demo read-only key;
- responsive and accessible desktop/mobile layouts.

The hardest problems were keeping the server as the source of truth, preventing model output from introducing new numbers, and making failure visible without taking the deterministic result away. Rulewake addresses those with server recomputation, numeric allowlisting, source-bound validation, request limits, a deterministic fallback and explicit privacy copy.

Not built yet: cross-device accounts, a larger rule corpus, automatic announcement ingestion and direct customer-account projection in the public browser. Those remain outside the submitted scope so the demo stays reviewable and safe.

Technology: Next.js 16, React 19, TypeScript, Decimal.js, Vitest, Vercel, Bitget UTA v3 read-only endpoints and Qwen 3.8 Max.

### 5. Deliverables

- Live demo: https://rulewake.vercel.app/
- Public code repository: https://github.com/ShalyX/Rulewake
- Demo video: `[ADD FINAL ANTIGRAVITY MP4 URL]`
- Architecture and QA evidence: link the public repository's `outputs/uta-risk-desk/submission` directory
- X promotional post: `[ADD PUBLISHED X POST URL]`

Recommended value for the single **Submission Materials Link** field: `https://github.com/ShalyX/Rulewake`. Its README links the live demo, architecture, QA material and screenshots from one page.

### 6. Take on AI trading

AI is most useful on a trading desk when its authority matches the kind of problem it is solving. Language models are good at turning announcements into structure, comparing evidence and explaining a trace. They should not silently become the calculator, exchange oracle or final decision-maker.

Rulewake treats AI as the research layer around a deterministic financial core. That boundary makes the output easier to inspect, easier to reject and more useful to a human who remains responsible for the trade.

## Role of the LLM in the project

Rulewake uses Qwen 3.8 Max for two bounded language tasks.

First, Qwen extracts a structured parameter change from official Bitget announcement text. The result must match a strict schema, remain attached to the expected source and asset, preserve tier continuity, and use numbers that appear in the source. Unsupported or incomplete announcements are rejected rather than guessed.

Second, after the deterministic engine finishes, Qwen explains the resulting causal trace in plain language. The server gives it only validated rule facts, held-constant assumptions and computed outputs. A post-model validator checks every numeric claim against an allowlist. If the request times out, the provider fails or the answer introduces an unsupported number, Rulewake shows a deterministic fallback while preserving the calculation.

Qwen never receives Bitget API credentials, raw account payloads or private notes. It does not calculate the financial result and cannot place a trade. The submitted production build uses the hackathon-provided Qwen access and passed a live validated explanation check.

## Two-minute judge demo

1. Open https://rulewake.vercel.app/ and state the thesis: the balance can stay the same while collateral contribution changes the account state.
2. Enter the workspace and keep the reviewed rSTRC event selected: 90% to 85%, effective July 1, 2026.
3. Point to the canonical sample baseline: $90,000 effective equity, $85,000 maintenance and 94.44% margin ratio.
4. Select **Calculate impact**.
5. Follow the Causal Field: effective equity falls by $5,000, the margin ratio moves to 100.00%, the state becomes critical, and the 75% target buffer is $28,333.34.
6. Open the calculation trace or change the target ratio to show that the financial result is deterministic and inspectable.
7. Select **Explain with Qwen** and point out `QWEN · VALIDATED` plus `NUMERIC ALLOWLIST PASSED`.
8. Open Settings to show Bitget Demo and Qwen configured server-side, with the privacy boundary stated explicitly.
9. End on the human boundary: Rulewake exports a worksheet; it never executes a trade.

## Claim guardrails

Safe claims:

- deterministic and fixture-backed calculations;
- authenticated read-only demo reconciliation passed;
- Qwen extraction and explanation are bounded and validated;
- no trading or withdrawal permission is requested;
- the public demo is decision support.

Do not claim:

- guaranteed liquidation or execution prices;
- proven profitability;
- live customer-account coverage in the public browser;
- real user adoption before the planned validation is run;
- autonomous trading.

