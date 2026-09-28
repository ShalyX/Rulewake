# Sample-mode interface slice

Updated: 18 September 2026 (Africa/Lagos)

## Purpose

Ship the smallest inspectable product surface after the deterministic core. A first-time viewer should be able to understand the source event, see the account inputs, run the calculation and reconstruct the result without trusting AI prose.

## User path

```text
reviewed rSTRC event
  → canonical sample account
  → Calculate impact
  → warning 94.44% → critical 100.00%
  → read equity delta and top-up buffer
  → change target ratio
  → expand calculation trace
```

## Acceptance evidence

| Check | Result |
|---|---|
| Reviewed source title, effective time and limitation visible | Pass |
| 90% → 85% event terms visible | Pass |
| Calculation is user-triggered | Pass |
| Canonical equity delta is −$5,000.00 | Pass |
| Projected ratio is 100.00% and band is critical | Pass |
| Default 75% buffer is $28,333.34 | Pass |
| 80% target recalculates to $21,250.00 | Pass |
| Trace shows contributions, normalized numerator and assumptions | Pass |
| Local worksheet contains source, outputs, assumptions and provenance only | Pass |
| No credentials or network dependency | Pass |
| App production build | Pass |
| Mobile/keyboard visual QA | Pass on signed-out public preview |
| Live grounded Qwen explanation | Pass; numeric allowlist validated |
| Browser console | Pass; zero errors and warnings |

## Design decisions

- The report uses a dark result surface so the decision state has a stable visual anchor.
- Warning and critical are represented by labels and text, not color alone.
- Source evidence and the unsupported maintenance-margin statement sit next to the terms so the model boundary is visible.
- Target ratio is a bounded select, not free text, until scenario validation and policy rules are implemented.
- The worksheet is generated from the immutable trace and reviewed event metadata. It is a self-contained local HTML artifact with print-to-PDF styling, so the browser never uploads account data.
- Financial values are formatted only at the display boundary; the engine receives decimal strings.

## Not included

- live Bitget routes;
- user credentials, trading actions or payment.

These remain separate slices so a failure in live data or model transport cannot hide a deterministic result.
