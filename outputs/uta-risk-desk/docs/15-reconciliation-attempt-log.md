# Reconciliation Attempt Log

## Attempt 001 — 17 September 2026

### Scope

Run the project-owned read-only Bitget reconciliation client against:

1. `GET /api/v3/account/info`;
2. `GET /api/v3/account/assets`;
3. `GET /api/v3/account/settings`.

### Preflight

- Required credential fields: configured locally.
- Credential values: not printed, logged or copied into project documents.
- Local credential file: ignored by Git.
- Client policy: reject non-read-only keys before requesting account state.

### Result

**Blocked before authentication.**

The Node request failed at the network layer before receiving an HTTP or Bitget response. A credential-free request to Bitget's public time endpoint also timed out before TCP/TLS connection. Independent DNS-over-HTTPS resolution returned two current Cloudflare addresses; direct TLS connection attempts to both timed out.

No private endpoint response was received. Therefore:

- credentials were not accepted or rejected;
- account compatibility was not evaluated;
- baseline arithmetic was not evaluated;
- no balance, UID or holding data was returned;
- the reconciliation gate remains pending, not failed.

### Diagnosis

The current host/network cannot establish an outbound connection to Bitget's API edge. The observed failure is consistent with a local network, ISP, regional routing or egress-policy block. An IP whitelist mismatch would normally require reaching Bitget and receiving an API response, which did not happen here.

### Required next action

From a network that can reach `https://api.bitget.com`, run:

```bash
npm run reconcile:live
```

Do not weaken TLS verification, send credentials through a third-party proxy, or move secrets into chat. A trusted VPN or alternate network may be used only if it is appropriate for the account holder's jurisdiction and Bitget access terms.

### Pass evidence still required

- `status: reconciled`;
- `eligibleForProjection: true`;
- account level `advanced`;
- asset mode `multi_assets`;
- snapshot ages below 30 seconds;
- no reconciliation diagnostics.

## Attempt 002 — 17 September 2026

### Network result

- VPN enabled.
- Bitget public time endpoint returned HTTP 200 and Bitget code `00000`.
- Authenticated requests reached Bitget when IPv4-first routing was used.

### Environment check

The first authenticated attempt used demo mode because the template default was `BITGET_DEMO=true`. Bitget returned code `40099`, “exchange environment is incorrect.” The same permission check was then run against the regular environment.

Conclusion: the configured credential is a regular Bitget key, not a demo key. The local flag has been corrected to `BITGET_DEMO=false`.

### Permission result

Bitget's `/api/v3/account/info` response reported that the key is not read-only. The client refused further access immediately.

No request was made to:

- `/api/v3/account/assets`;
- `/api/v3/account/settings`; or
- any trading, transfer, withdrawal or mutation endpoint.

No balance or holding data was fetched.

### Gate result

**Blocked by credential policy.**

Create a separate project-owned key with Unified Account Management read-only permission. Replace the three local credential values and retry. Do not downgrade the client's safety guard or reuse a read-write key for the hackathon application.

## Attempt 003 — 17 September 2026

### Permission correction

The account owner changed the existing key to read-only. A signed `/api/v3/account/info` request then succeeded and returned:

- Bitget code `00000`;
- `permType: readonly`;
- permissions including `uta_mgt` and `uta_trade`.

The live API spelling differs from the current documentation, which describes the value as `read-only`. The client now accepts the explicit allowlist `readonly` and `read-only`; it continues to reject every other permission type. A regression test protects the live spelling.

The presence of `uta_trade` does not override the top-level read-only permission type, but the application still exposes no order or mutation endpoint.

### Account-read attempt

After the successful permission check, the VPN route became unstable. Subsequent connections to `api.bitget.com:443` were actively refused before `/account/assets` and `/account/settings` could complete. Both the Node and Windows HTTP transports were tested. No raw account payload was retained or printed.

### Gate result

**Credential policy passed. Network stability remains the only blocker.**

Keep the VPN connected to a stable endpoint and rerun the live command. The account baseline has not yet been reconciled.

## Attempt 004 — 17 September 2026

The confirmed read-only flow was retried after the user reconnected. The signed sequence timed out after 20 seconds. A follow-up credential-free request to Bitget's public time endpoint also timed out, confirming that the failure occurred at the VPN/network layer rather than authentication or account reconciliation.

No account payload was received or retained. Credential policy remains passed; baseline reconciliation remains pending.

## Attempt 005 — 17 September 2026

### Connectivity and authentication

- Public Bitget endpoint returned code `00000`.
- Signed account-info request succeeded.
- Permission type: `readonly`.
- Assets and settings endpoints both returned successfully.
- Both snapshots were normalized within three seconds of their Bitget request timestamps.

### Sanitized compatibility result

| Field | Result |
|---|---|
| Account mode | `unified` |
| Account level | `basic` |
| Asset mode | `multi_assets` |
| Non-zero asset count | `0` |
| Reconciliation status | `ineligible` |
| Eligible for projection | `false` |
| Diagnostic | Account level must be advanced |

No financial values, balances, holdings, UID or credential material were written to this log.

### Gate interpretation

The live integration contract is validated: authentication, permissions, endpoints, response normalization, freshness checks and fail-closed eligibility behavior all worked against Bitget's current API.

The configured account cannot validate the product's calculation model because it is in UTA Basic Mode and has no returned non-zero assets. The product specifically models multi-collateral behavior available in Advanced Mode.

### Required next action

Use a project-owned Bitget account or demo account configured for UTA Advanced Mode with a controlled, non-sensitive collateral fixture. Do not weaken the eligibility rule to make this account pass.

## Attempt 006 — 17 September 2026

### Demo environment and account state

- A separate Bitget demo API key was configured with `paptrading: 1` and read-only permission.
- Demo UTA was switched to Advanced Mode with multi-asset collateral.
- Virtual funds were provisioned from the Demo Futures interface.
- A demo cross-margin futures position produced a nonzero maintenance-margin baseline.

### Reconciliation result

| Field | Result |
|---|---|
| Environment | Demo |
| Account level | `advanced` |
| Asset mode | `multi_assets` |
| Effective equity | Nonzero |
| Maintenance margin | Nonzero |
| Margin ratio | Nonzero |
| Reconciliation status | `reconciled` |
| Eligible for projection | `true` |
| Diagnostics | None |

Bitget reports the margin ratio at limited decimal precision. Reconciliation now derives an allowed numerator drift from half the least-significant reported ratio unit, while retaining the fixed one-cent floor. A regression test proves this accepts ordinary exchange rounding without accepting a materially inconsistent baseline.

### Scenario validation

- The sanitized baseline is stored without UID, credentials or production-account data.
- A zero-change scenario preserves the normalized baseline.
- A BTC collateral-ratio stress produces a deterministic before/after trace.
- All 48 tests and TypeScript validation pass.

### Gate result

**Passed.** The deterministic engine may use a fresh, eligible Bitget baseline for labelled scenario projections. The next build gate is curated announcement data and schema-constrained Qwen extraction.
