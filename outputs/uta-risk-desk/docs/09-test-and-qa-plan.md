# Test and QA plan

## 1. Test strategy

The risk engine receives the deepest testing because a polished interface cannot compensate for incorrect arithmetic. External data and Qwen output are treated as untrusted. The release gate combines automated tests, manual reconciliation, accessibility review, security checks, and submission compliance.

## 2. Unit tests — risk engine

### Tier calculation

- Empty schedule rejects.
- First tier only.
- Exact tier start and end boundaries.
- Several progressive tiers.
- Infinite final tier.
- Zero-rate tier.
- All rates equal one.
- Holding above a zero-rate cap.
- Gap rejects.
- Overlap rejects.
- Unsorted rows reject or normalize only through an explicit reviewed function.
- Negative value rejects.
- Rate below zero or above one rejects.
- Very large and high-precision decimal values.

### Account delta

- Collateral-only haircut.
- Collateral increase.
- Price shock with unchanged tiers.
- Price shock and tier change together.
- Several affected assets.
- No affected asset.
- Aggregate negative and positive PnL shock.
- Effective equity reaches zero.
- Baseline numerator residual within tolerance.
- Material baseline inconsistency blocks exact result.

### Risk bands

- Values immediately below, at, and above 65%, 80%, and 100%.
- Undefined ratio when effective equity is non-positive.
- Unknown band when inputs are stale or incomplete.

### Buffer

- Already below target returns zero.
- Exactly at target returns zero.
- Positive buffer solves inequality.
- Upward rounding.
- Invalid target at or above warning threshold if policy disallows it.
- Non-100%-eligible deposit asset routes through tier solver rather than closed-form formula.

## 3. Property-style invariants

Generate bounded decimal inputs and assert:

- Reducing a tier rate cannot increase collateral contribution.
- Increasing positive value cannot decrease contribution when tiers have non-negative rates.
- Contribution never exceeds gross value for rates ≤ 1.
- Adding 100%-eligible collateral cannot worsen the ratio if the numerator stays constant.
- Repeated execution is deterministic.
- Splitting a tier into two identical-rate tiers preserves output.
- Formatting precision does not change the underlying result.
- The computed buffer brings the ratio to or below the selected target after conservative rounding.

## 4. Golden fixtures

Create reviewed fixtures for:

- Bitget's 1 BTC + 500 DOT adjusted-equity example.
- Bitget's 40 BTC progressive-tier example.
- rSTRC $100,000 before/after scenario.
- rSTRC high-value multi-tier scenario.
- Account with asset at 0% collateral ratio.
- Account with open orders represented in the baseline numerator.
- No-position account with zero ratio.
- Stale snapshot.
- Mixed collateral and maintenance-tier announcement that P0 must reject.

Golden outputs include full calculation traces, not only final ratios.

## 5. Schema and adapter tests

- Accept documented Bitget response examples.
- Reject missing effective equity, maintenance margin, or margin ratio.
- Reject unexpected numeric units.
- Preserve source numeric strings.
- Map account mode correctly.
- Exclude identifiers and credentials from normalized snapshots.
- Mark sample/live-demo modes correctly.
- Enforce freshness.
- Verify no-store response headers.

## 6. Qwen evaluation

Run the hand-labelled announcement set at least three times per source.

Measure:

- critical-field exact match;
- valid-schema rate;
- semantic-validator pass rate;
- unsupported-change detection;
- run-to-run variance;
- repair success; and
- explanation numeric-grounding rate.

Release requires zero silently accepted incorrect critical fields. A refusal/rejection is preferable to an incorrect pass.

## 7. Integration tests

- Sample snapshot → curated extraction → calculation → explanation → worksheet.
- Qwen unavailable → reviewed fixture → calculation still succeeds.
- Live-demo unavailable → explicit sample-mode choice.
- Source hash mismatch → revalidation required.
- Announcement affected asset absent → valid no-direct-impact result.
- Stale snapshot → current calculation disabled.
- Explanation invents a number → rejected and deterministic fallback shown.
- Baseline mismatch → confidence downgrade and visible diagnostic.

Use mock Bitget and Qwen servers for repeatability. No automated test should depend on a live financial account.

## 8. End-to-end tests

### Canonical judge flow

1. Open landing page.
2. Choose sample account.
3. Inspect current ratio and source timestamp.
4. Select rSTRC announcement.
5. Inspect extracted tiers.
6. Calculate impact.
7. Add a reopening price shock.
8. Choose a target ratio.
9. View scenario buffer.
10. Open and print/export worksheet.

### Failure flows

- Select malformed announcement fixture.
- Simulate Qwen timeout.
- Simulate Bitget live-demo failure.
- Load stale account fixture.
- Enter out-of-range scenario value.
- Attempt to fetch non-whitelisted URL if that feature exists.

## 9. Visual and interaction QA

Test at minimum:

- desktop 1440×900;
- laptop 1280×720;
- mobile 390×844;
- 200% zoom;
- keyboard-only navigation;
- reduced-motion preference;
- light/dark system contrast if both themes exist; and
- long asset names, large values, negative values, and multi-tier tables.

Verify:

- current/projected/assumed states are visually distinct;
- warning is not communicated by color alone;
- tables do not hide units;
- source timestamps remain visible;
- tooltips are not required for essential facts;
- export layout does not clip formulas or source links.

## 10. Accessibility QA

- One logical page heading hierarchy.
- Visible focus states.
- Form labels and error associations.
- Screen-reader names include current/projected context.
- Tables have captions and headers.
- Chart/waterfall has a text/table equivalent.
- Contrast meets WCAG AA.
- No keyboard traps.
- Dynamic results announce through an appropriate live region without excessive noise.

## 11. Security QA

- Search source and built assets for secret patterns.
- Inspect browser network traffic for accidental keys/private payloads.
- Verify trade-capable endpoints are absent.
- Verify public routes cannot accept visitor credentials.
- Test prompt-injection announcement fixture.
- Test oversized request bodies and rate limits.
- Test URL parser/redirect rules if URL fetching is enabled.
- Verify logs redact authorization headers and payloads.
- Run dependency audit and review material findings.

## 12. User testing

Run five moderated sessions where possible.

Record:

- completion without prompting;
- time to first correct interpretation;
- incorrect current/projected interpretations;
- fields users verify before trusting output;
- willingness to use read-only connectivity;
- intended action, if any; and
- language that creates overconfidence.

Do not collect financial account data during testing.

## 13. Release gates

The production demo cannot ship until:

- all P0 unit and golden tests pass;
- no critical schema or security test fails;
- Qwen evaluation meets thresholds or the affected live feature is disabled;
- canonical E2E passes on deployed preview;
- sample mode works with both upstream services unavailable;
- current/projected labels pass a manual comprehension check;
- export contains sources, timestamps, assumptions, and engine version;
- repository secret scan passes;
- production environment uses only read-only/demo Bitget permissions;
- official hackathon requirements are rechecked on submission day.

## 14. Evidence artifacts

Preserve for submission:

- test summary;
- golden-fixture list;
- Qwen extraction evaluation table;
- screenshots of sample and live-demo provenance;
- accessibility checklist;
- security checklist;
- known-limitations list; and
- demo recording aligned with the tested production build.
