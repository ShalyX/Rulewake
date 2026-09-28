# Project status

Updated: 20 September 2026 (Africa/Lagos)

## Current decision

The unnamed Bitget UTA collateral-impact product is the active S2 direction. `uta-risk-desk` is only an internal folder/working descriptor and is not a candidate product name.

The project has moved from broad problem discovery into a deployed, validation-backed MVP candidate. The deterministic calculation core, live demo-account reconciliation, public preview, keyboard/mobile QA and live Qwen explanation gates are complete. **Rulewake is locked as the public name and Causal Field is the selected interface system.** The rejected editorial UI has been replaced by a bright spatial calculation field whose wake is driven by deterministic account state.

Foreword is parked and untouched.

## What is verified

- Bitget UTA Advanced Mode uses shared multi-asset collateral across eligible products.
- Collateral ratios are tiered and apply to adjusted equity, not gross account value.
- The cross-margin rate is calculated from maintenance margin, partial-liquidation fees, and adjusted equity.
- Bitget's account API exposes current account equity, effective/adjusted equity, maintenance margin, margin ratio, position value, leverage, and per-asset balances.
- Bitget publishes collateral-ratio and maintenance-margin changes through official announcements.
- Official rToken guidance warns that a reopening gap can reduce collateral value fast enough to trigger liquidation before a user adds margin.
- UTA has no single fixed account liquidation price; account-level risk depends on the shared pool.
- Adjacent portfolio-risk and liquidation-alert products have paying plans, supporting category-level willingness to pay.

## What remains a hypothesis

- Enough Bitget UTA Advanced Mode users experience this workflow frequently enough to retain a standalone product.
- Users will trust a third-party, read-only account connection.
- Exact personalized change-impact alerts are more valuable than maintaining an intentionally large buffer.
- The best first distribution channel is individual traders rather than trading communities, brokers, or Bitget itself.
- Information Extraction & Signal Generation is strategically better than AI Trading Desk Open Theme.

## Immediate validation work

1. Interview five qualified UTA Advanced Mode users.
2. Complete the final responsive/accessibility polish pass on the implemented Causal Field.
3. Extend the approved field language into the worksheet and submission assets.
4. Record the promoted URL in the submission, capture the final runtime demo and submit.

## Build readiness rule

Development may begin on the deterministic calculation core and sample-mode interface because they are reversible validation assets. Do not implement live customer credential collection, automated trading, paid plans, notification infrastructure, or multi-exchange support during the hackathon.

## Implementation progress

- The first test-first engine slice is implemented in `work/uta-risk-engine`.
- Progressive collateral contribution, baseline reconciliation, collateral deltas, projected equity/ratio, threshold bands and conservatively rounded scenario buffers are executable.
- The canonical rSTRC fixture and threshold boundaries are protected by automated tests.
- Current automated gate: 83 engine tests and 18 app tests pass; both TypeScript projects type-check and the production build completes locally and on Vercel.
- Two official Bitget collateral examples—the 1 BTC + 500 DOT account and progressive 40 BTC tiers—are encoded as source-linked golden fixtures alongside the rSTRC scenario.
- Official account-assets/settings examples now pass through the normalized reconciliation harness.
- A live read-only client is implemented with signature tests, stale-data checks, identifier stripping and a hard refusal for read-write keys.
- Dependency audits report zero known vulnerabilities across both package graphs after the engine test toolchain moved to Vitest 5.0.1.
- Live API integration is validated against a project-owned Bitget demo account in UTA Advanced Mode with multi-asset collateral and a nonzero cross-margin futures position.
- The live baseline reconciles after accounting for Bitget's reported-ratio rounding precision. A zero-change scenario and a BTC collateral-ratio stress are preserved as sanitized golden tests.
- The first Phase 2 fail-closed `ParameterChange` validator slice is implemented. It rejects unknown fields, forged source provenance, invalid timestamps, discontinuous tiers, out-of-range rates and numeric values absent from the official source text.
- The ten-item Qwen evaluation corpus is complete and reproducible: four supported single-asset collateral-change goldens, one supported six-asset announcement and five explicit rejection fixtures covering incomplete maintenance schedules, mixed leverage changes, calculation-method changes, missing assets and unbounded tiers.
- A server-only Qwen client, strict accepted/rejected envelope, deterministic post-model validator, exact scorer and sanitized evaluation-report runner are implemented.
- The Qwen client uses Bitget's documented Responses wire protocol with three bounded attempts for network, timeout, 408/429 and retryable 5xx failures. Each attempt receives a fresh abort budget, `Retry-After` is capped, non-transient 4xx errors fail immediately, and one schema-repair call is allowed before validation fails closed.
- A fresh full live evaluation passed all 10 fixtures: rejection accuracy `100%`, supported exact accuracy `100%`, and zero invalid outputs silently accepted. The extraction release gate passes with the six-asset announcement included as supported.
- Multi-asset announcements are split into source-bound single-asset chunks, processed with bounded concurrency, validated for exact asset/parameter coverage and merged in source order. One rejected or invalid chunk fails the whole extraction rather than returning a partial schedule.
- Evaluation resume now binds every reusable score to a SHA-256 fixture fingerprint, so changed labels or goldens cannot inherit stale passes.
- The reviewed-fixture fallback is implemented and source-bound. Valid live Qwen output is preferred; explicit rejection, missing output or failed validation falls back with a visible reason. A changed source hash blocks the fallback rather than serving stale reviewed data.
- The sample-mode interface now supports two reviewed official events (rSTRC and ASTER), three committed account states (canonical, buffered and stale), dynamic impact calculation, risk improvement/deterioration headlines, conservative top-up targets, expandable trace and local share-safe text export.
- Event or account changes invalidate the previous report. Stale snapshots visibly block calculation instead of producing a plausible result.
- A server-only explanation route now recomputes facts from fixture IDs, coalesces duplicate in-flight requests, caches validated responses briefly, sends only allowlisted facts to Qwen and falls back visibly if transport, repair or grounding fails.
- Explanation output is rejected if it introduces a new number, directive trading language or certainty claim. Qwen gets one repair attempt; the deterministic explanation remains available throughout.
- The interface imports the browser-safe calculation entry from the engine. Server-only Qwen modules are isolated behind `src/server.ts` so Node dependencies cannot leak into the client bundle.
- The public explanation route now rejects foreign browser origins and non-JSON requests, stops reading bodies above 1 KB, rate-limits clients to eight requests per minute with a bounded in-memory map, sanitizes unexpected failures, and gives each Qwen generation phase one bounded 25-second attempt inside a 60-second function cap.
- Production responses now include a restrictive baseline CSP, clickjacking protection, MIME-sniffing protection, a strict referrer policy and a disabled camera/microphone/geolocation/payment permissions policy.
- Rulewake is promoted under the renamed project at `https://rulewake.vercel.app`; the current production deployment `https://rulewake-60xzmlayo-shalyxs-projects.vercel.app` is Ready in Vercel.
- `QWEN_API_KEY` is stored as a Vercel secret for Production and Preview. A fresh production run returned `QWEN · VALIDATED` with the numeric allowlist passed on the canonical domain.
- A clean-browser rehearsal passed the skip-link/keyboard path, deterministic 94.44% → 100.00% calculation, live validated Qwen explanation, expandable trace, 390×844 mobile layout, no horizontal overflow and zero browser console errors or warnings.
- A share-safe HTML decision worksheet now downloads locally with source provenance, account label, current/projected metrics, assumptions, engine version, generation time and print-to-PDF styling. Untrusted labels are HTML-escaped and non-HTTP source links cannot become anchors.
- Qwen now exposes an accessible pending state without hiding the deterministic result, degrades to the labelled fallback on an outage or invalid response, and supports explicit retry recovery.
- The Rulewake Causal Field is implemented as the primary interaction surface: verified change boundary, dependency wake, named account nodes, before/after effective-time scrubber and a non-spatial deterministic result/trace console.
- Mobile QA at 390×844 has no horizontal overflow; the mobile field geometry was tightened so node labels remain separated at the narrow breakpoint.
- The submission pack now includes final copy, a Mermaid architecture diagram, Causal Field launch/OG art and four live production PNG captures covering desktop/mobile initial and calculated states.
- Eighteen app acceptance/security tests, TypeScript and the production build pass. Live customer account routes are not claimed complete.

## Current blockers

| Blocker | Owner | Resolution |
| --- | --- | --- |
| No direct user interviews yet | Product | Recruit through the Bitget community and personal trader network |
| Final demo video still needs recording | Submission | Record the verified production flow after the Qwen environment gate passes |
| Official deadline surfaces previously conflicted | Submission | Treat 21 September as internal production-ready target and 27 September as official handbook deadline |

## Next decision review

Review after either:

- five target-user conversations are completed, or
- ten official announcement fixtures are labelled and the first Qwen extraction evaluation is complete.
