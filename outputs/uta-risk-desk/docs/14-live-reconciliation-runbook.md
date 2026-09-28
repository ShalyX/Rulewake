# Live Bitget Reconciliation Runbook

## Purpose

This gate determines whether the deterministic model can safely use Bitget's current displayed account state as the baseline for scenario projections.

Passing the documented-response fixtures proves contract compatibility. It does **not** prove that the model matches a current real account. That requires a project-owned demo or production account snapshot.

## Current state

- Official `/api/v3/account/assets` and `/api/v3/account/settings` response examples normalize successfully.
- Baseline inconsistency, stale data, malformed decimals and unsupported account modes fail closed.
- The client verifies `/api/v3/account/info` before requesting account state.
- Read-write keys are refused.
- Project-owned credentials are configured locally, and the full live read-only flow has completed. Authentication, assets/settings retrieval, normalization and freshness checks pass. The connected account is UTA Basic Mode, so it is correctly classified as ineligible. An Advanced Mode validation account remains required. See [15-reconciliation-attempt-log.md](./15-reconciliation-attempt-log.md).

## Credential policy

Use a project-owned key only. Prefer a Bitget demo key.

Required permission:

- Unified account management: read-only.

Prohibited:

- read-write permission;
- withdrawal permission;
- a visitor's or tester's key;
- pasting any API key, secret or passphrase into chat;
- committing `.env.local`;
- recording a terminal or screen that exposes credentials.

Bitget recommends IP binding for API keys. Apply it where the deployment/runtime IP is stable.

## Local preparation

The implementation is in `work/uta-risk-engine`.

1. Copy `.env.example` to `.env.local` locally.
2. Populate `BITGET_API_KEY`, `BITGET_SECRET_KEY` and `BITGET_PASSPHRASE`.
3. Set `BITGET_DEMO=true` for a demo key. The client will add Bitget's required `paptrading: 1` header.
4. Confirm `.env.local` remains ignored by Git.
5. Run `npm run reconcile:live` from the engine directory.

The command performs only:

1. `GET /api/v3/account/info` — permission guard;
2. `GET /api/v3/account/assets` — current risk baseline and asset USD values;
3. `GET /api/v3/account/settings` — Advanced Mode and multi-asset compatibility.

No trading, transfer, withdrawal or account-setting endpoint exists in this client.

## Pass conditions

The report passes only when:

- Bitget reports the API key as `readonly` or the documented variant `read-only`;
- the key includes UTA management access;
- account level is `advanced`;
- asset mode is `multi_assets`;
- both snapshots are no older than 30 seconds;
- all required financial fields are finite decimal strings;
- implied numerator `mgnRatio × effEquity` is not materially below `mmr`;
- the report is emitted without UID or credential material.

## Interpretation

### `reconciled`

The current Bitget fields are internally consistent within the configured tolerance. This permits the next validation step: apply a zero-change scenario and then one known collateral-ratio delta while holding all stated assumptions constant.

### `ineligible`

The account is not in Advanced Mode with multi-asset collateral. Do not use it to validate this product.

### `inconsistent`

The supplied margin ratio and effective equity imply a maintenance numerator materially below Bitget's returned maintenance margin, or another core baseline rule failed. Do not present account-specific projection language. Capture timestamps and field names, then investigate documentation/rounding differences without weakening the test.

## Evidence to retain

Save a sanitized report containing:

- response timestamps;
- account mode/level and asset mode;
- `effEquity`, `mmr`, and `mgnRatio`;
- normalized numerator and residual;
- affected asset USD value needed by the scenario;
- engine version;
- pass/fail diagnostics.

Do not retain API headers, UID, raw credentials, unrelated balances or account history.

## After a pass

1. Add the sanitized baseline as a private validation fixture.
2. Run the zero-change scenario and require no state delta.
3. Apply the canonical collateral-ratio change to an affected demo holding.
4. Compare the product trace with an independently reviewed worksheet.
5. Record limitations before enabling account-specific wording in the UI.
