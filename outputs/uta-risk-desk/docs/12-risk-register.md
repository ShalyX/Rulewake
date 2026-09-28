# Risk Register

## Scoring

- Likelihood: low, medium or high.
- Impact: low, medium, high or critical.
- Status: open, monitoring, mitigated or accepted.
- “Trigger” is the observable condition that activates the contingency.

## Product and validation risks

| ID | Risk | Likelihood | Impact | Trigger | Mitigation | Contingency | Status |
|---|---|---:|---:|---|---|---|---|
| P-01 | Traders do not consider policy-impact calculation painful enough to adopt | Medium | Critical | Fewer than 3 of 5 target users recognize the workflow or ask to use it | Interview active UTA traders before polish; test real recent announcements | Narrow to a high-frequency adjacent UTA risk event or stop the build | Open |
| P-02 | The affected segment is too small | Medium | High | Recruitment cannot find active multi-collateral UTA users | Quantify relevant asset/feature usage where public data exists; interview power users | Reframe the engine for brokers, communities or risk educators if evidence supports it | Open |
| P-03 | Users want alerts, not a desk | Medium | Medium | Most interviews say they would only use automated notifications | Design the output schema for future alerts without building them in P0 | Add a post-hackathon watchlist/alert layer | Monitoring |
| P-04 | Users expect exact liquidation prediction | High | High | Testers interpret projections as an exchange guarantee | Repeat assumptions beside results; distinguish baseline projection from exchange engine | Restrict output to equity delta and risk-band movement | Open |
| P-05 | Willingness to pay is weak | Medium | Medium | Users value the calculation but reject a paid standalone tool | Validate paid monitoring/reporting, not only one-off calculation | Treat P0 as acquisition for a broader risk-monitoring product | Open |

## Calculation and data risks

| ID | Risk | Likelihood | Impact | Trigger | Mitigation | Contingency | Status |
|---|---|---:|---:|---|---|---|---|
| C-01 | Public formulas omit private exchange-engine details | High | Critical | Projected result disagrees materially with Bitget after aligned timestamps | Use Bitget's displayed current state as baseline; calculate only documented deltas; disclose limits | Remove unsupported projected margin ratio and show collateral/equity impact only | Open |
| C-02 | Tiered collateral is implemented as a flat rate | Low | Critical | Tier-boundary golden tests fail | Implement progressive tier calculation from the spec; property-test continuity | Block release until fixed | Open |
| C-03 | Maintenance margin changes when price/position changes during the scenario | High | High | Snapshot or market data moves between baseline and projection | Timestamp inputs; label static-snapshot assumption; support manual refresh | Freeze demo to a versioned fixture | Open |
| C-04 | Borrowing, debt or negative balance is omitted | Medium | High | Reconciliation exposes unexplained equity differences | Preserve Bitget's baseline values; include known liabilities in trace metadata | Mark the asset/account unsupported until normalized correctly | Open |
| C-05 | Precision or rounding creates threshold errors | Medium | Critical | Values around 80%/100% change classification across environments | Decimal arithmetic; retain internal precision; round only at display | Increase precision and block ambiguous boundary classifications | Open |
| C-06 | Endpoint fields or authentication change | Medium | High | Schema validation or signed requests begin failing | Version adapters; contract tests; fail closed | Use fixture mode and label live data unavailable | Monitoring |
| C-07 | Announcement format is inconsistent | High | Medium | Extraction misses required values or dates | Multiple fixtures; strict schema; evidence spans; user confirmation | Manual structured entry with source link | Open |
| C-08 | Data freshness is misunderstood | Medium | High | User compares stale snapshot with a newer account state | Prominent timestamps and stale-state warnings | Block calculation after freshness threshold unless explicitly acknowledged | Open |

## AI risks

| ID | Risk | Likelihood | Impact | Trigger | Mitigation | Contingency | Status |
|---|---|---:|---:|---|---|---|---|
| A-01 | Qwen hallucinates a ratio, asset or effective time | Medium | Critical | Extracted field lacks exact evidence or contradicts constraints | Schema validation, evidence spans, source checks and confirmation UI | Reject output and require manual entry | Open |
| A-02 | Prompt injection appears inside an announcement | Low | High | Source text attempts to change system behavior | Treat source as data; delimit it; disable tools; validate allowlisted fields | Skip AI path and use manual extraction | Open |
| A-03 | Explanation changes a deterministic number | Medium | High | Generated prose contains an unapproved numeric token | Numeric allowlist and post-generation validator | Use deterministic explanation template | Open |
| A-04 | Subsidized model access is exhausted or unstable | Medium | Medium | Qwen request fails, times out or is rate-limited | Timeouts, retry budget, caching and usage limits | Fixture/manual extraction plus template explanation | Monitoring |
| A-05 | Qwen feels ornamental to judges | Medium | High | The same demo appears equally complete without extraction | Show unstructured-to-structured transformation and correction workflow clearly | Add multi-format announcement evaluation evidence, not more chat | Open |

## Security and privacy risks

| ID | Risk | Likelihood | Impact | Trigger | Mitigation | Contingency | Status |
|---|---|---:|---:|---|---|---|---|
| S-01 | A public user enters Bitget credentials | Medium | Critical | UI or support copy invites visitor keys | Do not expose credential fields; use fixtures/project-owned read-only integration | Disable live integration on public deployment | Open |
| S-02 | Project-owned credentials leak to browser, logs or repository | Low | Critical | Secret scanner, network inspector or logs expose a value | Server-only env vars, redaction, secret scans and least privilege | Revoke/rotate immediately; disable route; investigate logs | Open |
| S-03 | Account snapshot exposes identifying holdings | Medium | High | Screenshot, analytics or logs contain user/account details | Use synthetic/sanitized fixtures; collect minimum data; no payload analytics | Remove affected assets/logs and rotate fixture | Open |
| S-04 | Source URL fetching enables SSRF | Medium | High | Arbitrary user URL reaches server fetcher | Official-domain allowlist, redirects disabled/validated, size/time limits | Remove URL ingestion; use curated sources only | Open |
| S-05 | Public AI endpoints are abused | Medium | Medium | Cost/traffic spikes or inappropriate payloads | Rate limits, payload limits, server-side key and caching | Disable free-form prompt path | Monitoring |

## Delivery and submission risks

| ID | Risk | Likelihood | Impact | Trigger | Mitigation | Contingency | Status |
|---|---|---:|---:|---|---|---|---|
| D-01 | Conflicting deadline information causes a late submission | Medium | Critical | Landing page and handbook continue to disagree | Treat Sep 21 as internal deadline; verify official source before submission | Submit as soon as candidate is stable, no later than Sep 26 | Mitigated |
| D-02 | Scope creep prevents a reliable vertical slice | High | High | New features begin before golden flow passes | Enforce P0/non-goal lists and critical path | Cut exports, live refresh or secondary screens in that order | Open |
| D-03 | Live dependency fails during judging | Medium | High | Bitget/Qwen/network is unavailable | Fixture-first public demo and cached source metadata | Show explicit fallback mode and recorded demo | Open |
| D-04 | Submission claims exceed evidence | Medium | High | Copy uses “exact,” “guaranteed” or “predicts liquidation” | Claim review against evidence map | Rewrite to projected/illustrative language before publishing | Open |
| D-05 | Repository contains secrets or private notes | Low | Critical | Preflight scan finds sensitive material | Public-release hygiene and history scan | Rotate secrets and rebuild clean public repository if needed | Open |
| D-06 | Branding consumes validation/build time | Medium | Medium | Naming work starts before formula/user gates pass | Keep descriptive working name until M3 | Use a minimal wordmark for submission | Mitigated |
| D-07 | Demo is too technical for judges | Medium | High | Rehearsal viewers cannot state the value after one minute | Lead with one announcement and one account consequence | Shorten architecture details; show proof only after result | Open |
| D-08 | Product duplicates an existing entrant | Medium | Medium | Competitor review finds the same account-impact workflow | Emphasize source provenance, deterministic trace and Bitget-native baseline | Narrow to fastest/most defensible event class | Monitoring |

## Risk review cadence

- Review the register at the start and end of each build day.
- Any critical risk with an active trigger blocks release.
- Add evidence links to the status document when a risk is mitigated.
- Do not lower likelihood or impact simply because time is short.

## Immediate risk-reduction actions

1. Reconcile the canonical projection with one sanitized/current Bitget snapshot.
2. Conduct the first three target-user interviews.
3. Build the tier/boundary tests before UI work.
4. Confirm the public deployment has no credential input.
5. Recheck official rules and deadline before recording the demo.

