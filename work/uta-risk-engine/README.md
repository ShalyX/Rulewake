# Bitget UTA Impact Engine

Internal deterministic calculation package for the unnamed Bitget hackathon project. This package name is technical, not a public product name.

## Current behavior

- validates and applies progressive collateral tiers;
- reconciles Bitget's displayed baseline margin ratio with maintenance margin;
- calculates before/after collateral contribution;
- projects adjusted equity and margin ratio while holding the documented P0 assumptions constant;
- classifies stable/watch/warning/critical bands;
- calculates a conservatively rounded 100%-eligible scenario buffer; and
- emits an auditable calculation trace.
- validates candidate AI-extracted parameter changes against strict fields, server-bound provenance, tier continuity and source-number evidence.

Golden fixtures include the canonical rSTRC haircut and Bitget's published 1 BTC + 500 DOT and progressive 40 BTC collateral examples. Each official fixture retains its source URL and review date.

A sanitized Bitget demo UTA Advanced Mode baseline protects zero-change reconciliation and a labelled BTC collateral-ratio stress. It contains no UID, credentials or production-account data.

## Commands

```bash
npm install
npm test
npm run typecheck
npm run fixtures:build
```

## Live reconciliation

Copy `.env.example` to `.env.local` and fill it only with a project-owned Bitget demo or production key that has **Unified account management: read-only** permission. Never paste credentials into chat, commit them, or use a read-write key.

```bash
npm run reconcile:live
```

The command first checks `/api/v3/account/info`. It refuses any key whose `permType` is not `read-only`, then fetches only `/api/v3/account/assets` and `/api/v3/account/settings`. Its JSON output is normalized and excludes UID, available balance, raw balance and API credentials.

## Qwen extraction evaluation

The release corpus contains ten source-hashed official Bitget announcement fixtures: five supported collateral schedules and five explicit rejection cases. Put the hackathon-subsidized key in `.env.local` as `QWEN_API_KEY`; it is sent only to the configured Qwen endpoint and is never written to an evaluation report.

```bash
npm run qwen:evaluate
```

The sanitized score report is written to `outputs/uta-risk-desk/qwen-evaluation.json`. A release pass requires at least 90% exact success on supported fixtures and 100% correct rejection of unsupported fixtures.

Multi-asset announcements are split into source-bound single-asset requests with bounded concurrency. Every chunk must return exactly the expected asset and parameter; the engine preserves source order, validates the aggregate again, and rejects the entire extraction if any chunk fails. `npm run qwen:evaluate -- --resume` reuses a passed result only when the fixture's SHA-256 fingerprint is unchanged.

## Boundary

The engine is not an exchange liquidation oracle. Live projection language remains blocked until a sanitized or project-owned account snapshot reconciles with Bitget's displayed current state.

## Dependency note

The current npm audit has no high or critical finding. It reports two moderate advisories in the Vitest development toolchain through `@vitest/mocker`; npm lists no fix at the time of this build. Vitest is not a production dependency.
