# Public preview release evidence

Updated: 18 September 2026 (Africa/Lagos)

## Candidate

- Branded stable public URL: `https://rulewake.vercel.app`
- Current production deployment permalink: `https://rulewake-60xzmlayo-shalyxs-projects.vercel.app`
- Production Qwen proof: `QWEN · VALIDATED`, numeric allowlist passed, captured from the canonical domain after the production secret redeploy.
- Vercel deployment: `dpl_DSFQbRbZ98ApYDw1pbyY5kWCFccH`
- Runtime region: Singapore (`sin1`)
- Access: public and verified in a clean signed-out browser
- Status: preview candidate only; not promoted to production
- Naming: `le`, `uta-risk-desk` and `UTA risk change desk` are technical placeholders, not brand decisions

## Automated evidence

| Gate | Result |
|---|---|
| Deterministic engine | 83 tests passed across 11 files |
| Product app | 16 tests passed across 3 files |
| TypeScript | Engine and app passed |
| Dependency audit | 0 known production vulnerabilities |
| Local production build | Passed |
| Vercel Linux build | Passed |
| Server trace | Hoisted Next runtime baseline included |

## Signed-out browser rehearsal

The candidate was opened in an isolated browser session with no Vercel login state.

1. `Tab` exposed the skip link first; `Enter` moved focus to the main content.
2. Keyboard traversal reached the labelled event selector, primary source, account selector and Calculate button in order.
3. `Enter` ran the canonical calculation.
4. The report showed warning `94.44%` → critical `100.00%`, effective-equity change `−$5,000.00`, and the `75%` target buffer `$28,333.34`.
5. Qwen returned a live explanation labelled `Qwen · validated`; the numeric allowlist passed.
6. The calculation trace expanded and exposed old/new contribution, numerator, projected equity and held-constant assumptions.
7. At a `390×844` viewport, document and client widths were both `375`; no horizontal overflow was present.
8. The final browser console contained zero errors and zero warnings.

## Worksheet rehearsal

The public candidate downloaded `collateral-impact-rstrc-2026-09-18.html`. The downloaded artifact was opened in a separate clean browser session and verified to contain the reviewed source, account label, 94.44% → 100.00% transition, $28,333.34 buffer, calculation trace values, held-constant assumptions, generation timestamp and engine version. Its print-to-PDF control was present, semantic headings/lists/definitions were exposed, and the artifact console contained zero errors or warnings.

Worksheet labels and source URLs are treated as untrusted output: HTML-special characters are escaped and only HTTP(S) sources become links.

## Qwen resilience evidence

The public route initially exposed two deployment-specific failures during QA:

- an incomplete serverless trace omitted a hoisted Next runtime module;
- two short model attempts timed out from the cloud runtime.

The trace root now covers the monorepo root. The live route now allows one 25-second generation attempt per initial/repair phase inside a 60-second server cap. Qwen runs in Singapore, validated live output is cached briefly, duplicate in-flight requests are coalesced, and any timeout, transport error, failed repair or grounding violation still returns the labelled deterministic explanation.

## Known limitations

- The public workflow uses reviewed fixtures; it does not accept visitor Bitget credentials or expose a live customer-account route.
- Rate limiting is memory-bounded and process-local. Replace it with a shared or edge quota before horizontal scale.
- The worksheet is intentionally self-contained HTML so it can be opened offline or printed to PDF. Direct PDF generation is not bundled into the browser.
- The preview URL and working interface label will change after the naming and brand-kit gate.
- A dedicated screen-reader session and automated WCAG scan remain useful hardening, although the semantic tree and keyboard path passed this gate.
- This build is decision support only. It does not execute trades or guarantee liquidation avoidance.
