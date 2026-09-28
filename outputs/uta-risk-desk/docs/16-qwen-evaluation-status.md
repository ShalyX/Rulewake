# Qwen extraction evaluation status

Updated: 18 September 2026 (Africa/Lagos)

## Implemented

- Ten official Bitget announcement fixtures with immutable source-text hashes.
- Five supported collateral-ratio goldens, including one six-asset announcement.
- Five required rejection cases for incomplete, ambiguous or unsupported sources.
- Strict accepted/rejected model envelope.
- Server-bound URL and source-hash validation.
- Exact field allowlists and explicit timestamps.
- Tier continuity, bounds and rate validation.
- Numeric evidence checks against supplied source text.
- Exact scoring for provenance, assets, tiers, rates and unsupported statements.
- Source-bound per-asset chunking with bounded concurrency and all-or-nothing aggregation.
- SHA-256 fixture fingerprints that prevent resume mode from reusing a stale pass after a fixture changes.
- Sanitized report generation without prompts, keys or private account state.

## Corpus coverage

| Requirement | Coverage |
|---|---:|
| Official announcements | 10 |
| Supported collateral changes | 5 |
| Maintenance/leverage changes | 4 |
| Mixed changes | 3 |
| Multi-asset announcement | 1 |
| Unbounded-tier fixtures | 6 |
| Explicit rejection fixtures | 5 |

## Release thresholds

- Supported-fixture exact accuracy: at least 90%.
- Unsupported-fixture rejection accuracy: 100%.
- Silently accepted invalid output: zero.

## Current result

The deterministic corpus, client and scorer pass all automated gates. The full live evaluation has run against `qwen3.8-max` through Bitget's documented Responses wire API.

| Metric | Result | Threshold | Status |
|---|---:|---:|---|
| Overall fixtures passed | 10 / 10 | Informational | — |
| Supported exact accuracy | 100% | 90% | Passed |
| Unsupported rejection accuracy | 100% | 100% | Passed |
| Invalid output silently accepted | 0 | 0 | Passed |

The release gate is **passed**. ASTER, rSTRC, WIF, XRP and the six-asset rToken announcement all passed exact supported extraction in a fresh, non-resumed run. The five rejection fixtures remained passed.

Malformed or validator-rejected model output now receives one source-bound repair call. A second invalid result fails closed. Impact explanations use the same hardened transport and additionally reject new numeric tokens, directive trading language and certainty claims before falling back to deterministic copy.

For a multi-asset announcement, each model request receives one source-bound asset section plus the shared publication metadata. Accepted chunks must contain exactly one matching asset and parameter. Results are restored to source order and validated again against the complete source; any rejected or invalid chunk fails the full extraction, so a partial table cannot silently pass.

## Product fallback

The product does not depend on a passing live model call for its sample workflow. A source-hashed reviewed fixture is used when Qwen is unavailable, rejects the source, or returns invalid output. The result is labelled `reviewed_fixture` with a visible fallback reason. If the current source hash differs from the reviewed fixture, calculation is blocked until the fixture is reviewed again.

## Run command

Add the subsidy key to `work/uta-risk-engine/.env.local`:

```env
QWEN_API_KEY=your_local_key
```

Then run:

```bash
npm run qwen:evaluate
```

The sanitized result is written to `outputs/uta-risk-desk/qwen-evaluation.json`. Use `npm run qwen:evaluate -- --resume` to preserve passed cases and retry only failed fixtures. A passed score is reusable only while its fixture fingerprint is unchanged.
