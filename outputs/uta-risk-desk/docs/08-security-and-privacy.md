# Security and privacy plan

## 1. Security posture

The hackathon MVP is a read-only research tool. It has no authority to trade, transfer, withdraw, borrow, change collateral settings, or modify an account.

The safest public-demo design is sample mode plus an optional project-owned read-only/demo account. Public visitors are never asked for exchange credentials.

## 2. Protected assets

- Bitget API key, secret, and passphrase for the project-owned account.
- Qwen API key.
- Private account balances, positions, liabilities, and open orders.
- Server environment and deployment controls.
- Calculation integrity and source provenance.
- Visitor session data and exported worksheets.

## 3. Threat model

| Threat | Consequence | MVP control |
| --- | --- | --- |
| Client bundle exposes a secret | Account/model compromise | Secrets used only in server environment; bundle scan before deploy |
| Over-permissioned Bitget key | Unauthorized state changes | Read-only or official demo key; verify permissions during startup |
| Public visitor submits credentials | Accidental custody and leakage | No credential fields or credential-accepting routes |
| Server logs private responses | Long-lived sensitive data | Structured redaction; no raw response logging |
| SSRF through announcement URL | Internal network access | Curated IDs first; strict hostname allowlist, redirect and IP checks if URL fetching ships |
| Prompt injection in announcement | Corrupted extraction or disclosure | Source isolation, no tools, strict schema, semantic validators |
| Qwen invents a tier or number | Misleading risk result | Numeric source verification and deterministic tier validation |
| Stale account data appears current | Unsafe inference | Freshness limits and visible timestamps |
| Cross-user cache leakage | Private account exposure | Do not cache private snapshots; scope transient state per request/session |
| Formula regression | Incorrect risk output | Golden/property tests and versioned traces |
| XSS from announcement HTML | Browser compromise | Server-side text extraction and output escaping; no raw HTML rendering |
| Denial-of-wallet through model calls | Unexpected API spend | Per-IP/session limits, response caps, one repair attempt |
| Formula or explanation implies advice | User over-reliance | Clear scenario language, limitations, no imperative actions |

## 4. Credential rules

- Never commit secrets to Git.
- Never write the Qwen or Bitget secrets into Markdown, fixtures, screenshots, telemetry, or client code.
- `.env.example` contains placeholder names only.
- Production variables live in the deployment secret store.
- Use a separate project-owned account/key with minimum permissions.
- Confirm trade, transfer, and withdrawal permissions are absent.
- Rotate credentials immediately after the hackathon if they appeared in any screen recording or debugging output.
- Run repository and Git-history secret scans before public release.

## 5. Data minimization

The normalized snapshot excludes:

- UID and sub-account identifiers;
- names, emails, phone numbers, and KYC data;
- API credentials and signatures;
- deposit/withdrawal addresses;
- transaction history not required for the scenario; and
- unrelated account metadata.

The explanation service receives only the affected asset, aggregate account metrics, computed deltas, assumptions, and sources required to explain the result.

## 6. Retention

### Sample mode

Fixtures are public, synthetic/redacted, and version controlled.

### Live-demo mode

- Retrieve on demand.
- Normalize in memory.
- Do not persist raw private payloads.
- Do not put responses in CDN/shared caches.
- Allow calculation traces only after removing account identifiers and unrelated assets.
- Clear transient browser state on reset or session expiry.

### Logs

Retain only operational metadata:

- request ID;
- endpoint class;
- timing;
- status code/error class;
- schema/engine version; and
- redacted validation summary.

## 7. API controls

- `Cache-Control: no-store` for private snapshot routes.
- Same-origin requests for server routes.
- Strict content types and body-size limits.
- Runtime schemas for all body/query parameters.
- Rate limits for Qwen-backed routes.
- Short upstream timeouts.
- Bounded retries for safe reads only.
- Generic client errors; detailed diagnostics remain redacted server-side.
- Security headers: CSP, frame restrictions, referrer policy, MIME sniffing protection, and HTTPS-only deployment.

## 8. Announcement URL controls

P0 should use curated announcement IDs. If direct URLs ship:

- allow only HTTPS;
- parse and normalize hostname before comparison;
- allow exact official hostnames, not suffix string tricks;
- resolve and reject private/link-local IP destinations;
- do not forward cookies or authorization headers;
- cap redirects and revalidate every redirect target;
- cap body size;
- accept text/HTML only;
- sanitize into plain text before storage or model use.

## 9. Privacy communication

The product should state plainly:

- The public demo uses a sample or project-owned account.
- Visitors should never paste an exchange key.
- Qwen receives announcement text and a redacted result summary, not credentials.
- Scenario worksheets may reveal financial exposure if a user later imports personal data.
- Deleting/resetting a session removes its transient browser scenario state.

Avoid vague claims such as “bank-grade security” or “your data never leaves your device” unless the architecture actually supports them.

## 10. Incident response

If a secret may have leaked:

1. Disable the deployment route or live-demo feature.
2. Revoke and rotate the affected key.
3. Check provider access logs and deployment history.
4. Remove the secret from the current tree and public artifacts.
5. Rewrite Git history only with explicit review and coordination.
6. Document the incident and prevention change.

If a calculation defect is found:

1. Disable affected scenario types.
2. Preserve failing input as a redacted regression fixture.
3. Correct the engine and version it.
4. Regenerate affected demo results and exports.
5. Disclose the limitation in submission materials if previously demonstrated.

## 11. Release security gate

- Read-only/demo permission verified.
- No credential input in the public UI.
- Secret scan passes current tree and relevant history.
- Client bundle contains no provider key or passphrase.
- Private routes return `no-store`.
- Prompt-injection fixtures fail safely.
- Announcement fetcher passes SSRF tests or remains disabled.
- Logs verified with a synthetic sensitive payload.
- Dependency audit reviewed; critical/high issues resolved or documented.
- Security and limitations copy visible in the demo and README.
