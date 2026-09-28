# Rulewake demo and submission plan

## Submission objective

Make the judges understand one useful outcome immediately:

> A Bitget collateral-policy announcement can change an account's risk before the trader changes a position. This desk turns that announcement into an account-specific, auditable impact report.

The submission should demonstrate a working decision tool, not a general AI trading assistant.

## Provisional category

**AI Trading Desk — Information Extraction & Signal Generation**

Rationale:

- Qwen extracts an actionable structured event from unstructured Bitget information.
- The application combines that event with account context.
- The output is a risk signal and action buffer, not an autonomous trade.

Confirm the exact category names and selection rules in the final submission form before submitting.

## Canonical demonstration scenario

Use a Bitget collateral-ratio update for rSTRC:

- collateral market value: `100,000 USDT`;
- old collateral ratio: `90%`;
- new collateral ratio: `85%`;
- effective collateral change: `-5,000 USDT`;
- maintenance-margin numerator: `85,000 USDT`;
- current adjusted equity: `90,000 USDT`;
- current margin ratio: `94.44%`;
- projected adjusted equity: `85,000 USDT`;
- projected margin ratio: `100.00%`.

The exact input fixture must be versioned and tested. The interface must label it as a sample account if it is not live.

## Two-and-a-half-minute demo structure

### 0:00–0:15 — The trigger

Show the official Bitget announcement and state the problem in one sentence:

> This ratio change looks small, but its account-level effect depends on what you hold and how close your unified account already is to its risk thresholds.

### 0:15–0:35 — Source becomes a structured event

- Open the event in the product.
- Show source URL, effective time and extracted old/new ratios.
- Reveal the source evidence beside the fields.
- State that Qwen performs extraction; the user can correct it before calculation.

### 0:35–0:55 — Load account context

- Select the sample account snapshot.
- Show snapshot time and whether it is live or fixture-backed.
- Show the affected holding and Bitget's current adjusted equity/margin ratio.
- Do not spend time on unrelated balances.

### 0:55–1:25 — Calculate the impact

- Run the deterministic calculation.
- Show `-5,000 USDT` adjusted-equity impact.
- Show margin ratio moving from `94.44%` to `100.00%`.
- Show the threshold transition clearly.
- Expand the trace briefly to prove the number is inspectable.

### 1:25–1:50 — Turn risk into an action buffer

- Set a target ratio below the warning threshold, for example `75%`.
- Show the exact stablecoin top-up required under the stated assumptions.
- Make clear that this is a scenario buffer, not an instruction to deposit or trade.

### 1:50–2:10 — Qwen explains the result

- Ask for a concise explanation.
- Show that the explanation uses only validated source fields and deterministic outputs.
- Point out citations/assumptions and generated-content labeling.

### 2:10–2:30 — Trust and close

- Show that the app is read-only and never asks public users for Bitget API secrets.
- Export the impact report.
- Close with the product thesis and who it is for.

## Narration guardrails

Say:

- “projects impact under stated assumptions”;
- “uses Bitget's current displayed state as the baseline”;
- “read-only”;
- “the trader makes the final decision”;
- “the fixture keeps the demo reproducible.”

Do not say:

- “predicts liquidation exactly”;
- “guarantees safety”;
- “executes the optimal hedge”;
- “works for every UTA edge case”;
- “AI calculated the risk number.”

## Required demo assets

- production URL;
- public repository URL;
- stable sample fixture;
- official source announcement;
- sample account provenance note;
- backup local recording;
- final Rulewake wordmark and Causal Field launch frame;
- screenshots at desktop and mobile widths;
- short architecture diagram;
- calculation trace screenshot;
- Qwen role diagram or caption.

The maintained submission pack is in `../submission/` and contains the final copy, architecture diagram, launch frames and runtime screenshot capture plan.

## Six-part project description

Draft the final submission in this order:

1. **Problem** — collateral and maintenance-policy updates are public, but their account-specific effects are not obvious.
2. **User** — active Bitget UTA traders using multiple collateral assets and cross-margin positions.
3. **Product** — a read-only impact desk that converts an official event plus a current snapshot into an auditable before/after report.
4. **AI** — Qwen extracts structured changes and explains validated calculations; it does not invent prices, balances or formulas.
5. **Technical proof** — deterministic decimal-safe engine, source provenance, schema validation, fixtures and tests.
6. **Outcome** — the trader sees risk-band movement and the top-up needed to restore a chosen buffer before the change takes effect.

## Judge-facing evidence map

| Claim | Evidence to show |
|---|---|
| The problem exists | Official Bitget policy-change announcement and account-risk documentation |
| The output is account-specific | Snapshot inputs and affected asset mapping |
| The calculation is trustworthy | Formula trace, fixture and tests |
| Qwen is essential but bounded | Raw announcement → extracted schema → validator → deterministic engine |
| The product is usable | One-minute path to a result, clear states and export |
| The team understands risk | Read-only design, privacy controls, limitations and fallback behavior |

## Repository readiness

The public repository README should contain:

- one-sentence value proposition;
- screenshot or short GIF;
- canonical example;
- architecture diagram;
- local setup;
- required environment variables without values;
- commands for lint, test and build;
- fixture/live-data modes;
- security and privacy posture;
- known limitations;
- hackathon attribution;
- license.

Repository hygiene before publishing:

- scan history and current files for secrets;
- remove logs, screenshots or fixtures containing account identifiers;
- verify `.env*` rules;
- pin or document dependency versions;
- ensure a fresh clone builds from the written instructions;
- tag the submission commit.

## Submission checklist

### Rules

- [ ] Re-open the official handbook.
- [ ] Verify deadline and timezone.
- [ ] Verify participant/team eligibility.
- [ ] Verify track name and judging criteria.
- [ ] Verify required repository visibility and license.
- [ ] Verify demo-video duration and hosting requirements.
- [ ] Verify required Qwen and Bitget integration evidence.
- [ ] Verify any required X post, tags and hashtags.

### Product

- [ ] Production URL loads in a signed-out browser.
- [ ] Sample flow works without secrets or local state.
- [ ] Source links open.
- [ ] Stale and fixture data are visibly labeled.
- [ ] The result includes assumptions and timestamp.
- [ ] No trade or deposit action is implied to be automatic.

### Technical

- [ ] Tests, lint and production build pass.
- [ ] No critical/high security finding remains.
- [ ] No credential or PII exists in repository/history.
- [ ] Qwen outage fallback works.
- [ ] Bitget outage fallback works.
- [ ] Calculation trace matches the displayed result.

### Submission package

- [ ] Project name and one-line description are consistent everywhere.
- [ ] Form copy contains no unsupported claims.
- [ ] Demo video uses the production build.
- [ ] Repository and deployment URLs are correct.
- [ ] Team member details are correct.
- [ ] Social post is live if required.
- [ ] Final form is submitted.
- [ ] Confirmation screenshot/email is saved.
- [ ] Final commit hash and deployment identifier are recorded.

## Demo reliability plan

- Default the public demo to a deterministic fixture.
- Keep live refresh as an explicit optional action.
- Cache the verified announcement and its source metadata.
- Display a visible “sample data” badge when appropriate.
- Record the demo after the final deployment passes a signed-out smoke test.
- Keep a local copy of the video and screenshots.
- Rehearse once with network throttling and once with Qwen disabled.

## Launch-post direction

Write the public post only after the product is stable. The post should:

- lead with the collateral-policy problem;
- show one before/after result;
- explain Qwen's precise role;
- link product and repository;
- name the hackathon and correct organizer accounts;
- invite UTA traders to challenge the assumptions.

Do not reuse the FaradayDesk privacy-first framing. This product's sharpest story is account-specific policy-impact analysis.
