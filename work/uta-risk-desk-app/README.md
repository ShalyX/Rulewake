# Rulewake — collateral-rule impact simulator

Public URL: https://rulewake.vercel.app

Rulewake is the locked public product name. The project is named `rulewake`; Vercel's stable branded alias is the URL above.

![Rulewake Causal Field preview](../../outputs/uta-risk-desk/submission/screenshots/rulewake-live-workspace-qwen-validated.png)

Rulewake is built for the Bitget AI Base Camp S2 hackathon. The submission pack lives in [`outputs/uta-risk-desk/submission`](../../outputs/uta-risk-desk/submission/README.md), including the [submission copy](../../outputs/uta-risk-desk/submission/SUBMISSION_COPY.md) and [architecture diagram](../../outputs/uta-risk-desk/submission/ARCHITECTURE.md).

This is the fixture-backed product interface for the Bitget UTA collateral-impact workflow. Calculations require no visitor credentials or external calls. A server-side Qwen key enables validated explanations; the interface falls back to a deterministic explanation when Qwen is missing, unavailable or ungrounded. Production also holds a read-only Bitget demo key for server-side reconciliation and never exposes it to the browser.

## Run it

From this directory:

```text
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Open `http://localhost:3000` (or the port printed by Next).

To enable live explanations, create `.env.local` without committing it:

```text
QWEN_API_KEY=your_hackathon_key
```

## What is in this slice

- reviewed rSTRC and ASTER collateral-ratio events with primary-source links;
- canonical, buffered and fail-closed stale account fixtures;
- user-triggered deterministic calculation using the shared `@risk-engine` source;
- current `94.44%` warning → projected `100.00%` critical report;
- conservative buffer to a selectable 65%, 75% or 80% target ratio;
- expandable calculation trace and explicit held-constant assumptions.
- local share-safe HTML decision worksheet with source provenance, trace values and print-to-PDF styling.
- server-recomputed Qwen explanations with numeric allowlisting, a bounded generation attempt, one repair phase and deterministic fallback.
- a bright Causal Field that maps the deterministic dependency graph into a rule boundary, propagation wake, named account nodes and an effective-time scrubber.
- a public landing page plus workspace, local analyses, reviewed source library and settings routes.

The app imports only the browser-safe calculation entry. Qwen, Bitget signing and other Node-only modules remain behind the engine's `src/server.ts` entry.

## Reliability boundary

The browser sends only fixture IDs and the selected target ratio. The server recomputes the calculation and constructs the Qwen allowlist; it does not trust financial numbers from the client. The app does not collect user keys or execute trades. The worksheet is generated and downloaded locally; live customer-account routes remain a separate slice.

`POST /api/explain` accepts same-origin JSON requests up to 1 KB and limits each client identifier to eight requests per minute. Unexpected errors return a generic `503`; logs contain fixed reason codes rather than request bodies, credentials or model output. Live Qwen responses are briefly coalesced/cached server-side, while every HTTP response remains `private, no-store`.

The current limiter is intentionally in-process and memory-bounded. Keep the first deployment on one application instance. Before horizontal scaling, replace it with a trusted edge or shared-store rate limit and confirm the deployment proxy overwrites `X-Forwarded-For`, `X-Forwarded-Host` and `X-Forwarded-Proto`.
