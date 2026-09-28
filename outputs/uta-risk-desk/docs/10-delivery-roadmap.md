# Delivery Roadmap

## Delivery rule

The internal production-ready target is **September 21, 2026**. The current official handbook deadline is **September 27, 2026**. The six-day difference is reserved for user feedback, failure recovery, polish and submission QA—not for expanding the core scope.

If the organizer publishes a newer deadline or requirement, update this document, `STATUS.md` and the submission checklist together.

## Milestones

| Milestone | Target | Exit condition |
|---|---:|---|
| M0 — Direction locked | Sep 17 | Problem, user, wedge, scope and kill criteria documented |
| M1 — Deterministic core | Sep 18 | Golden fixtures and calculation trace pass locally |
| M2 — Complete vertical slice | Sep 19 | Announcement → extraction → snapshot → impact result works end to end |
| M3 — Demo-ready product | Sep 20 | Polished UI, fallback fixtures, privacy controls and deploy preview work |
| M4 — Internal submission candidate | Sep 21 | Release gates pass; demo and written submission are recordable |
| M5 — Feedback iteration | Sep 22–25 | Target-user feedback addressed without destabilizing core |
| M6 — Final submission | Sep 26 | Submission complete one day before the verified deadline |
| M7 — Contingency | Sep 27 | Only emergency corrections or organizer-required changes |

## Critical path

```text
formula reconciliation
        ↓
deterministic calculator + golden tests
        ↓
announcement extraction + validation
        ↓
account snapshot adapter
        ↓
impact report UI
        ↓
security/QA/deployment
        ↓
demo recording + submission
```

Anything not on this path must justify its time by improving judge comprehension, correctness or demo reliability.

## Phase 0 — Discovery and specification

Status: substantially complete.

- [x] Park Foreword without deleting it.
- [x] Define the target user and job to be done.
- [x] Identify Bitget collateral-ratio changes as the initial trigger.
- [x] Verify the public UTA formulas and risk thresholds.
- [x] Define the deterministic/AI boundary.
- [x] Create the PRD, calculation spec, architecture, security and QA plans.
- [x] Reconcile one live or sanitized Bitget account example against displayed Bitget values.
- [ ] Complete at least three target-user discovery conversations.

Exit criterion: no unresolved ambiguity can reverse the P0 workflow or invalidate its primary output.

## Phase 1 — Deterministic domain core

### Work items

- [x] `CALC-01` Define decimal-safe money, ratio and percentage types.
- [x] `CALC-02` Implement progressive tier-adjusted collateral.
- [x] `CALC-03` Implement before/after collateral contribution.
- [x] `CALC-04` Implement adjusted-equity delta projection.
- [x] `CALC-05` Implement projected margin ratio using the Bitget baseline numerator.
- [x] `CALC-06` Implement warning and liquidation-distance bands.
- [x] `CALC-07` Implement stablecoin top-up buffer to selected target ratio.
- [x] `CALC-08` Emit a human-readable calculation trace.
- [x] `TEST-01` Add unit and property tests.
- [x] `TEST-02` Add canonical rSTRC plus official Bitget BTC/DOT and progressive 40 BTC golden fixtures.
- [x] `TEST-03` Add threshold boundary fixtures below, at and above 80% and 100%.

### Definition of done

- No binary floating-point arithmetic is used for financial values.
- All golden fixtures pass.
- Every displayed result can be reconstructed from the trace.
- Missing or invalid inputs produce a blocked result, not a plausible-looking number.

## Phase 2 — Sources, account data and Qwen

### Work items

- [x] `DATA-01` Create curated announcement fixtures with source URL, timestamp and raw excerpt.
- [x] `DATA-02` Add current collateral configuration fixtures.
- [x] `DATA-03` Define the normalized account snapshot schema.
- [x] `DATA-04` Implement a project-owned read-only Bitget adapter if credentials are available.
- [x] `AI-01` Implement Qwen structured extraction with a strict JSON schema.
- [x] `AI-02` Validate model output against source excerpts and business constraints.
- [x] `AI-03` Implement deterministic fallback/manual correction.
- [x] `AI-04` Generate plain-language explanation from the approved numeric allowlist. *(One grounded repair attempt and deterministic fallback shipped.)*
- [x] `AI-05` Run the extraction evaluation set and store results. *(10/10 passed; supported and rejection accuracy are both 100%.)*
- [x] `AI-06` Support multi-asset announcements safely. *(Source-bound per-asset chunks, bounded concurrency, exact coverage validation and all-or-nothing ordered aggregation shipped.)*

### Definition of done

- The product works fully with fixtures if Bitget or Qwen is unavailable.
- Model output cannot bypass schema validation.
- Source evidence appears beside every extracted change.
- No public visitor supplies Bitget credentials.

## Phase 3 — Product interface

### Primary screen sequence

1. Select a verified collateral-change event.
2. Load a sample or project-owned account snapshot.
3. Review extracted before/after terms and source evidence.
4. Run impact calculation.
5. Read the result: equity change, projected ratio, band transition and top-up buffer.
6. Expand the calculation trace.
7. Ask Qwen for an explanation or scenario summary.
8. Export a compact risk-impact report.

### Work items

- [x] `UI-01` Build source/event selector. *(Fixture-backed rSTRC and ASTER events shipped.)*
- [x] `UI-02` Build account snapshot selector and freshness indicator. *(Canonical, buffered and fail-closed stale fixtures shipped.)*
- [x] `UI-03` Build extracted-change verification panel. *(Reviewed source evidence and unsupported-statement state update with selection.)*
- [x] `UI-04` Build before/after risk report. *(Risk transition, equity delta and threshold marker update with event/account selection.)*
- [x] `UI-05` Build buffer calculator. *(75% default plus 65%/80% target control shipped.)*
- [x] `UI-06` Build expandable calculation trace. *(Trace view shipped and verified in the public preview.)*
- [x] `UI-07` Build AI explanation with clear generated-content labeling. *(Live validated and deterministic fallback modes are visibly distinct.)*
- [x] `UI-08` Build export/share-safe report. *(Portable HTML decision worksheet with provenance, assumptions, print-to-PDF layout and output escaping shipped.)*
- [x] `UI-09` Add loading, empty, stale, invalid and outage states. *(Qwen pending state is announced; invalid/outage responses fall back visibly and can be retried.)*
- [x] `UI-10` Add keyboard and responsive behavior. *(Skip link, labelled controls, keyboard calculation and 390×844 overflow-free layout verified.)*

### Definition of done

- A first-time viewer reaches the main result in under 60 seconds with the sample scenario.
- The before/after change is legible without reading documentation.
- Risk thresholds and assumptions are visible at the decision point.
- The demo works at common laptop widths and on a narrow mobile viewport.

### Slice delivered — sample-mode impact report

The reversible sample-mode UI is available in `work/uta-risk-desk-app`. It covers reviewed rSTRC and ASTER events plus canonical, buffered and stale UTA sample accounts. A user can switch fixtures, read source limitations, trigger deterministic calculation, inspect a risk transition, change the top-up target, expand the trace, request a grounded Qwen explanation and export a local text report. A selection change invalidates the prior result, stale data blocks calculation, and Qwen failure degrades to a labelled deterministic explanation. It does not yet claim live account routes or worksheet export.

## Phase 4 — Reliability, security and deployment

- [x] `OPS-01` Configure server-only environment variables. *(Qwen remains optional and server-only; no public environment alias exists.)*
- [x] `OPS-02` Add request validation, rate limits and safe timeouts. *(Same-origin, media-type, 1 KB body and eight-per-minute guards shipped; Qwen attempts are bounded.)*
- [x] `OPS-03` Add structured logs without secrets or account-identifying payloads. *(Only fixed event/reason codes are logged on fallback or unexpected failure.)*
- [x] `OPS-04` Deploy a preview and production candidate. *(Public Vercel preview candidate deployed; production promotion waits for the name/brand freeze.)*
- [x] `QA-01` Run all automated tests. *(83 engine and 16 app tests pass.)*
- [x] `QA-02` Run accessibility and keyboard checks. *(Semantic tree, labels, skip link, focus order, Enter activation and expandable-control state verified.)*
- [x] `QA-03` Run security checklist. *(No blocker/high finding remains; deployment constraints are recorded in `17-security-deployment-gate.md`.)*
- [x] `QA-04` Verify fixture fallback after disabling live dependencies. *(Production runtime returned the deterministic fallback with Qwen unconfigured.)*
- [x] `QA-05` Complete a fresh-browser demo rehearsal. *(Signed-out calculation, live Qwen, trace and mobile rehearsal passed.)*
- [x] `QA-06` Capture release evidence and known limitations. *(See `18-preview-release-evidence.md`.)*

## Phase 5 — Evidence, demo and submission

- [ ] `SUB-01` Verify the final official rules and deadline.
- [ ] `SUB-02` Confirm the selected track and judging criteria.
- [ ] `SUB-03` Write the six-part project description.
- [ ] `SUB-04` Record the product demo from the production URL.
- [ ] `SUB-05` Prepare repository README and setup instructions.
- [ ] `SUB-06` Publish required social post only after the product URL is stable.
- [ ] `SUB-07` Complete the official form and save proof of submission.
- [ ] `SUB-08` Re-open every submitted link in a signed-out browser.

## Daily execution board

### September 17

- Finish the planning packet.
- Run the technical validation spike against a sanitized/current Bitget snapshot.
- Recruit target users and send interview prompts.
- Lock calculation contracts and fixtures.

### September 18

- Build the deterministic core test-first.
- Complete golden and boundary fixtures.
- Resolve any mismatch with Bitget-displayed numbers before UI work continues.

### September 19

- Integrate Qwen extraction and schema validation.
- Add fixture-backed Bitget account and announcement adapters.
- Complete the end-to-end vertical slice.

### September 20

- Complete UI states, trace, report export and privacy copy.
- Deploy and test the production candidate.
- Run a first complete demo rehearsal.

### September 21

- Freeze P0 features.
- Run full QA and security gates.
- Record a backup demo and prepare the submission draft.

### September 22–25

- Incorporate only feedback that improves clarity, correctness or trust.
- Fix observed failures.
- Refine visual hierarchy and demo pacing.
- Re-verify rules daily if organizer communications change.

### September 26

- Submit.
- Save confirmation, final URLs, commit hash and video copy.
- Publish the required launch post.

### September 27

- Contingency only.

## Scope-control rules

Cut or defer a feature when any of the following is true:

- it requires trade execution or withdrawal authority;
- it cannot be validated against a trusted reference;
- it obscures the deterministic calculation behind AI prose;
- it does not strengthen the canonical demo;
- it threatens the September 21 internal candidate;
- it needs a second product surface before the first is reliable.

## Build decision gate

Proceed to a polished public submission only if:

1. one sanitized or project-owned snapshot reconciles with Bitget's current state;
2. the canonical announcement produces a reproducible impact result;
3. at least three target users confirm the workflow is recognizable;
4. no critical security issue remains open.

If the first two fail, do not camouflage the gap with presentation work. Narrow the product to an educational scenario simulator or return to problem selection.
