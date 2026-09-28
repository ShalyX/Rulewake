# Rulewake final QA report

Reviewed build: `https://rulewake.vercel.app/`

Review date: September 28, 2026, Africa/Lagos.

## Summary

| Area | Status | Evidence |
| --- | --- | --- |
| Accessible production demo | Pass | branded Vercel alias returned the current multi-page build |
| Complete AI Trading Desk research task | Pass | question → reviewed rule → deterministic impact → actionable buffer → validated explanation |
| Deterministic engine | Pass | 83 tests across 11 files |
| Application behavior | Pass | 20 tests across 4 files |
| Type safety | Pass | TypeScript no-emit check |
| Production build | Pass | Next.js build generated `/`, `/app`, `/analyses`, `/library`, `/settings`, `/api/explain` |
| Qwen live path | Pass | production answer labelled `QWEN · VALIDATED`; numeric allowlist passed |
| Qwen extraction corpus | Pass | 5/5 supported exact, 5/5 unsupported rejected |
| Bitget demo integration | Pass | authenticated reconciliation succeeded with read-only demo key |
| Responsive UI | Pass | 390 px landing and workspace inspected without horizontal overflow |
| Secret exposure in browser | Pass | settings show status only; secrets remain server-side |
| Public repository/history | Unverified | this workspace is not currently attached to a Git repository |
| Final MP4 | Pending | assigned to Antigravity; URL not yet added |
| X promotional post | Pending | drafts prepared; user must publish and provide URL |
| Official form acceptance | Unverified | official page states a September 27 deadline; portal response not observed |

## Official requirement mapping

| Requirement | Result | Evidence |
| --- | --- | --- |
| AI Trading Desk accessible demo | Pass | https://rulewake.vercel.app/ |
| Complete research task | Pass | rSTRC 90% → 85% scenario produces equity, margin ratio, risk band and buffer insight |
| Human makes final decision | Pass | no execution route; product and export state decision-support boundary |
| Role of LLM explained | Pass | separate form answer in `SUBMISSION_COPY.md` |
| Specific target user and value | Pass | self-directed UTA Advanced Mode trader or small desk with collateral exposure |
| Validation data and metrics | Pass | engineering results labelled observed; product metrics labelled targets |
| Submission materials link | Pending | use public repository README or live demo fallback |
| Compliant X post | Pending | three drafts in `X_POSTS.md` |

## Core acceptance scenarios

### Reviewed rSTRC scenario

Pass.

- Before collateral ratio: 90%
- After collateral ratio: 85%
- Current effective equity: $90,000.00
- Projected effective equity: $85,000.00
- Current margin ratio: 94.44%
- Projected margin ratio: 100.00%
- Projected band: critical
- Buffer to 75% target: $28,333.34

### Model failure and recovery

Pass in automated tests.

- pending state is announced;
- deterministic result remains visible;
- timeout or provider error produces a bounded fallback;
- retry can recover without recalculating from model text;
- numeric allowlist rejects unsupported output.

### Stale account fixture

Pass in automated and earlier runtime review.

- stale state is visible;
- projection remains disabled;
- no false actionable result is produced.

### Configuration boundary

Pass.

- production Settings shows Bitget Demo configured and Qwen configured;
- no secret values are rendered;
- local preferences remain in browser storage;
- Bitget access is restricted to signed GET requests and checked for read-only permission.

## Launch-quality issues

1. **BLOCKER for code-link submission:** no public Git repository URL is attached to this workspace.
2. **BLOCKER for valid official submission:** no published compliant X post URL is recorded.
3. **EXTERNAL BLOCKER:** the official deadline appears to have passed; form acceptance must be checked immediately.
4. **LAUNCH-QUALITY ISSUE:** repository license is not selected.
5. **POLISH:** final Antigravity MP4 still needs a link and a visual match check.

## Known limitations

- public calculations use reviewed fixtures rather than exposing private account payloads;
- analysis history is browser-local;
- current rate limiting is in-process;
- Rulewake is not an exchange liquidation oracle, execution system or profitability claim.

