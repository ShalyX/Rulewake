# Security and deployment gate

Updated: 18 September 2026 (Africa/Lagos)

## Decision

The security and public-preview gate passes. No blocker or high-severity finding remains in the current fixture-backed, read-only product boundary. Rulewake is promoted at the branded stable project URL `https://rulewake.vercel.app`.

## Reviewed boundary

- Static sample-mode interface.
- `POST /api/explain`, the only public application route that can spend a metered external model call.
- Server-only `QWEN_API_KEY` handling.
- Qwen timeout, retry, repair, coalescing and fallback behavior.
- Browser response headers and cache behavior.
- Application and engine dependency graphs.

The product has no authentication, persistent customer data, trade execution, withdrawal permission or user-supplied exchange credential route. Adding any of those changes the threat model and requires a new review.

## Resolved findings

| Severity | Finding | Resolution |
|---|---|---|
| High | A public caller could repeatedly trigger subsidized Qwen requests without a spend guard. | Added an eight-request-per-minute fixed window per normalized client identifier, bounded to 4,096 buckets. Duplicate in-flight requests remain coalesced. |
| Medium | The route parsed an unbounded request body. | Added a streaming 1 KB limit with early cancellation and `413` responses. |
| Medium | Cross-site browser pages could invoke the route. | Requests carrying `Origin` must match the effective application origin; foreign origins receive `403` before body parsing or model spend. |
| Medium | Unexpected exceptions could escape the route and risk exposing internal error details in development logs/responses. | Added a generic `503` response and fixed-code structured logging without exception text, request bodies or credentials. |
| Medium | The engine used a Vitest release covered by a path-traversal advisory in the development test server. | Upgraded to Vitest 5.0.1; both dependency audits now report zero known vulnerabilities. |
| Low | Browser hardening headers were absent. | Added CSP, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, COOP and a restrictive permissions policy. |

## Enforced invariants

- The client submits only `eventId`, `accountId` and one allowlisted target ratio.
- Financial outputs are recomputed from reviewed server fixtures.
- Qwen receives only the approved fact object; the browser never supplies the prompt or financial result.
- The Qwen key has no `NEXT_PUBLIC_` alias and never appears in a response.
- Each Qwen generation phase is capped at one 25-second attempt inside a 60-second server-function duration. A separate repair phase is allowed only when the first response arrives but fails grounding validation.
- Invalid, oversized, stale, unknown or cross-origin requests cannot reach Qwen.
- API responses are `private, no-store`.
- A missing or failed Qwen dependency preserves the deterministic calculation and explanation path.

## Verification evidence

| Gate | Result |
|---|---|
| Engine tests | 83 passed |
| App tests | 16 passed, including HTTP security-boundary, worksheet escaping and Qwen recovery cases |
| TypeScript | Both projects pass |
| Local and Vercel production builds | Passed with Next.js 16.3.5 |
| App dependency audit | 0 known vulnerabilities |
| Engine dependency audit | 0 known vulnerabilities |
| Public preview browser console | 0 errors, 0 warnings |
| Signed-out access | Passed without Vercel authentication |
| Live Qwen path | `Qwen · validated`; numeric allowlist passed |
| Mobile layout | 390×844 viewport; document/client width `375:375` (no horizontal overflow) |
| Same-origin valid request | `200`, deterministic fallback, `private, no-store` |
| Foreign-origin request | `403` |

The Vercel Linux build uses the native production toolchain successfully. The workspace tracing root is pinned to the monorepo root so the serverless function includes hoisted Next runtime modules.

## Deployment constraints

1. Start with one application instance. The current limiter is process-local and is not a global quota across replicas or serverless isolates.
2. The deployment proxy must overwrite, not append user-controlled values to, `X-Forwarded-For`, `X-Forwarded-Host` and `X-Forwarded-Proto`.
3. Terminate TLS at the platform edge and enable HSTS there after the final hostname is stable.
4. Store `QWEN_API_KEY` only in the platform's encrypted server environment. Do not add a `NEXT_PUBLIC_` key.
5. Keep the deterministic fixture path available when the key is absent or the model endpoint is unhealthy.
6. Repeat the signed-out browser rehearsal after any hostname, brand, CSP, runtime-region or Qwen transport change.

## Remaining non-blocking risks

- **Medium before horizontal scale:** replace the in-memory limiter with a shared or edge-enforced quota.
- **Low:** the CSP permits inline scripts/styles for the current Next bootstrap. Move to nonce-based CSP if the product later handles authenticated or private customer data.
- **Low:** the semantic accessibility tree and keyboard path passed manual browser QA, but a dedicated screen-reader session and automated WCAG scanner remain future hardening.
