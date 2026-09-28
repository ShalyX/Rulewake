# Deterministic calculation specification

## 1. Purpose

This document defines the auditable numerical core. It is the authority for calculations; UI copy and Qwen output are not.

The engine estimates account-state deltas under explicit assumptions. It does not reproduce undisclosed Bitget liquidation-engine behaviour and must never present a scenario as an official liquidation quote.

## 2. Numeric policy

- Represent money, prices, ratios, quantities, and rates with arbitrary-precision decimal arithmetic.
- Parse API numeric strings without converting through JavaScript `number`.
- Preserve source precision throughout the engine.
- Round only at display/export boundaries.
- Round minimum buffer upward to the configured settlement precision.
- Store ratios internally as decimals: `0.8` means 80%.
- Reject `NaN`, infinity, negative tier widths, ratios outside `[0, 1]`, and timestamps outside reasonable bounds.

## 3. Source terms

For current state, prefer Bitget-returned fields:

- `E0`: current effective/adjusted equity in USD.
- `M0`: current maintenance margin in USD.
- `R0`: current cross-margin ratio.
- `V0[a]`: current gross USD value of affected asset `a`.
- `P0`: current aggregate position value.
- `L0`: current account leverage.

The implementation must record the exact API field name behind each normalized term.

## 4. Tier model

Each schedule is an ordered list:

```ts
type Tier = {
  startUsd: Decimal;
  endUsd: Decimal | null; // null means infinity
  rate: Decimal;          // 0..1
};
```

Tiers must:

- start at zero unless the source explicitly says otherwise;
- be sorted by `startUsd`;
- have no overlap;
- have no unlabelled gap within the affected value range;
- use one consistent currency/unit; and
- end with an explicit cap or infinity.

## 5. Progressive collateral function

For positive gross USD value `V` and validated tiers `T`:

```text
contribution(V, T) = Σ width_i(V) × rate_i

width_i(V) = max(0, min(V, end_i) − start_i)
```

For an infinite final tier, `min(V, end_i)` becomes `V`.

This is progressive. Never apply the rate of the final tier to the full holding.

## 6. Collateral-change impact

For affected asset `a`:

```text
C_old[a] = contribution(V0[a], oldTiers[a])
C_new[a] = contribution(V1[a], newTiers[a])
ΔC[a]    = C_new[a] − C_old[a]
```

If no price shock is applied:

```text
V1[a] = V0[a]
```

If a price shock `s[a]` is applied:

```text
V1[a] = max(0, V0[a] × (1 + s[a]))
```

For several affected assets:

```text
ΔC_total = Σ ΔC[a]
```

## 7. Scenario adjusted equity

The preferred MVP method starts from Bitget's baseline rather than reconstructing the whole account:

```text
E1 = E0 + ΔC_total + ΔPnL + ΔOtherValidated
```

Where:

- `ΔPnL` is a deterministic aggregate change in cross-margin unrealized PnL.
- `ΔOtherValidated` is zero in P0 unless a separately specified adjustment is implemented and tested.

Do not double-count an affected asset's price change. If `V1` already captures the price change in collateral contribution, add only position PnL that is not already included in that asset value.

## 8. Maintenance-margin numerator

Bitget documents:

```text
cross-margin ratio =
(maintenance margin + partial-liquidation fees) ÷ adjusted equity
```

Normalize the current numerator as:

```text
N0 = R0 × E0
```

The implied fee/residual term is:

```text
F0 = N0 − M0
```

Rules:

- If `F0` is slightly negative within rounding tolerance, clamp it to zero and record the clamp.
- If `F0` is materially negative, mark the baseline inconsistent and block exact projection language.
- For a collateral-only change with positions and orders held constant, use `N1 = N0`.
- When validated maintenance-margin or position changes are supported, calculate `ΔM` and use `N1 = N0 + ΔM + ΔFee`.
- P0 holds `F0` constant unless a tested fee recalculation is available.

## 9. Position PnL shock

The P0 UI may accept an aggregate `ΔPnL` because it is transparent and avoids pretending to model every contract perfectly.

The P1 per-position method is:

```text
ΔPnL[position] =
direction × (scenarioMark − currentMark) × quantity × multiplier × quoteUsdRate
```

Where direction is `+1` for a long and `-1` for a short.

Aggregate across cross-margin positions only. Isolated-margin PnL must not be added to the shared pool unless Bitget's returned field explicitly includes it.

## 10. Maintenance-tier change

When an announcement changes a maintenance-margin schedule, calculate each supported position/order using the validated schedule and the official position-value convention.

Conceptually:

```text
positionMaintenance =
positionValue × (maintenanceRate + takerFeeRate)

openOrderMaintenance =
orderValue × (maintenanceRate + takerFeeRate)
```

Bitget may use product- and side-specific aggregation. The implementation must match the official rule for long/short maxima and cannot generalize until fixtures cover the product.

P0 may reject maintenance-tier announcements rather than calculate an incomplete result.

## 11. Projected ratio

```text
R1 = N1 ÷ E1
```

Special cases:

- If `E1 <= 0`, classify the scenario as critical/undefined and do not display a finite ratio.
- If `N1 < 0`, treat the input as invalid.
- If no positions, orders, or liabilities produce a numerator, the ratio is zero.

## 12. Risk classification

```text
if data invalid/stale       => unknown
else if R1 >= 1.00          => critical
else if R1 >= 0.80          => warning
else if R1 >= 0.65          => watch (product convention)
else                        => stable
```

The product must distinguish sourced Bitget thresholds from internal display conventions.

## 13. Scenario buffer

For a chosen target ratio `Rt`, assume added collateral is USDT or another asset with a verified 100% contribution at the relevant tier and does not change the numerator.

Solve:

```text
N1 ÷ (E1 + B) <= Rt

B >= (N1 ÷ Rt) − E1

buffer B = max(0, (N1 ÷ Rt) − E1)
```

Round `B` upward. If the selected asset is not verified at 100% for the full amount, do not use this closed-form result; run the tier function for that asset instead.

The UI label is “scenario buffer to target,” not “required deposit.”

## 14. Worked rSTRC fixture

Given:

- positive gross rSTRC value: `$100,000`;
- old schedule contributes 90% through that range;
- new schedule contributes 85% through that range;
- current effective equity `E0 = $90,000`;
- current normalized numerator `N0 = $85,000`;
- no price, PnL, position, order, or liability change.

```text
C_old = $90,000
C_new = $85,000
ΔC     = -$5,000
E1     = $85,000
R0     = $85,000 / $90,000 = 94.444...%
R1     = $85,000 / $85,000 = 100%
```

For a target ratio of 75%:

```text
B = ($85,000 / 0.75) − $85,000
B = $28,333.333...
```

The displayed buffer rounds upward according to supported USDT precision.

## 15. Calculation trace

Every result produces an immutable trace:

```json
{
  "engineVersion": "0.1.0",
  "baseline": {
    "effectiveEquityUsd": "90000",
    "maintenanceMarginUsd": "85000",
    "marginRatio": "0.9444444444"
  },
  "changes": [
    {
      "asset": "rSTRC",
      "grossUsdBefore": "100000",
      "grossUsdAfter": "100000",
      "oldContributionUsd": "90000",
      "newContributionUsd": "85000",
      "deltaUsd": "-5000"
    }
  ],
  "assumptions": {
    "positionsHeldConstant": true,
    "openOrdersHeldConstant": true,
    "liabilitiesHeldConstant": true,
    "feeResidualHeldConstant": true
  },
  "result": {
    "projectedEffectiveEquityUsd": "85000",
    "projectedNumeratorUsd": "85000",
    "projectedMarginRatio": "1",
    "riskBand": "critical"
  }
}
```

## 16. Invariants

- A lower collateral rate cannot increase contribution when all other inputs are equal.
- A positive 100%-eligible top-up cannot increase the margin ratio when the numerator is constant.
- Applying the same validated scenario twice yields identical output.
- Tier contribution is continuous at tier boundaries.
- Contribution never exceeds positive gross USD value when all rates are ≤ 1.
- Unaffected assets do not change because of an announcement.
- Display rounding never feeds back into calculations.
- Unknown data never defaults to zero unless zero is explicitly sourced.

## 17. Known limitations

- The engine cannot know undisclosed emergency parameters or exchange-internal sequencing.
- Price/index conversion can differ slightly from visible market prices.
- The exchange can change thresholds and rules after the snapshot.
- Open-order cancellation may change the real numerator during stress.
- Slippage and liquidation-engine execution are not modelled.
- A scenario is stale as soon as the live account changes.
- Institutional-loan LTV is a separate risk system and is excluded.
