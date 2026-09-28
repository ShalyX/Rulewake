# Discovery and validation plan

## Discovery standard

A problem advances only if it meets all four conditions:

1. It creates a measurable financial or operational consequence.
2. It recurs often enough for a defined user segment.
3. Existing workflows leave meaningful friction or uncertainty.
4. A credible user could pay to remove that friction.

Hackathon-theme fit alone is insufficient.

## Evidence collected

### Direct platform evidence

- Bitget states that collateral ratios determine how much USD value counts toward adjusted equity.
- Bitget applies those ratios progressively across tiers.
- The cross-margin rate uses maintenance margin, partial-liquidation fees, and adjusted equity.
- A warning begins at a documented risk band, and partial liquidation may occur after the ratio reaches the liquidation band and order cancellation does not restore safety.
- Bitget warns that an rToken can gap down after a market closure and reduce effective collateral before the user has time to top up.
- Bitget warns that crypto futures PnL continues changing account risk while an rToken index is frozen during a U.S. market closure.
- Bitget publishes repeated collateral-ratio, leverage, limit, and maintenance-margin updates.
- The UTA v3 account endpoint returns the current state needed for a baseline.

### Category evidence

Paid crypto tools sell liquidation maps, portfolio-risk scores, and account alerts. This establishes willingness to pay for risk visibility as a category. It does not yet establish willingness to pay for Bitget-specific UTA announcement impact.

### Competition evidence

The public scan identified projects for:

- pre-trade thesis stress testing;
- loss budgeting and position sizing;
- rToken exit-cost analysis;
- weekend liquidity and void-window risk;
- overnight hedging;
- event-driven autonomous trading; and
- outcome-blind decision review.

No indexed S2 project was found that maps an official Bitget collateral or maintenance-tier change to a live account's projected adjusted equity and cross-margin ratio. This is provisional because private and unindexed entries may exist.

## Existing user workflow

A rigorous user currently needs to:

1. Monitor Bitget announcements.
2. Open the UTA risk-ratio panel and asset list.
3. Identify the affected coin's USD value.
4. Find the active and announced tier schedules.
5. Apply the rates piecewise, not as one percentage.
6. Replace the old collateral contribution with the new contribution.
7. Recalculate the cross-margin ratio.
8. Include any maintenance-tier change, open orders, liabilities, fees, and PnL.
9. Decide on a buffer without confusing a scenario estimate for an official liquidation quote.

Less rigorous users will inspect the current ratio, use a rough haircut, or add an arbitrary buffer.

## Worked discovery example

An official rSTRC announcement changed the first collateral tiers from 90% to 85% and tightened higher-value tiers.

For a hypothetical $100,000 positive rSTRC holding, with price and account state otherwise unchanged:

```text
Old contribution = $100,000 × 0.90 = $90,000
New contribution = $100,000 × 0.85 = $85,000
Adjusted-equity delta = -$5,000
```

If the account's maintenance-margin-plus-fee numerator is $85,000:

```text
Before: $85,000 ÷ $90,000 = 94.44%
After:  $85,000 ÷ $85,000 = 100.00%
```

This example is hypothetical and isolates one variable. It demonstrates that a rule change can move account risk without a market-price move.

## Problem scorecard

Scores are 1–5, where 5 is strongest.

| Problem lane | Severity | Recurrence | Direct monetary value | Existing gap | Hackathon fit | Total | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| UTA collateral-change impact | 5 | 4 | 5 | 4 | 5 | 23 | Lead |
| Auto-borrow cost leakage | 3 | 5 | 4 | 3 | 3 | 18 | Supporting feature later |
| rToken corporate-action reconciliation | 3 | 2 | 3 | 3 | 4 | 15 | Do not lead with it |
| Foreword outcome-blind review | 3 | 3 | 2 | 2 | 5 | 15 | Parked |

## User validation segment

Recruit participants who meet at least three conditions:

- use Bitget UTA Advanced Mode;
- have enabled a non-stablecoin as collateral;
- hold or have held an rToken;
- use cross-margin futures or spot margin;
- review margin risk at least weekly;
- have responded to a collateral, leverage, or maintenance-tier change.

Do not count spot-only users or people answering hypothetically without UTA experience as qualified interviews.

## Interview protocol

### Opening

“I am researching how Bitget UTA users handle collateral and margin-rule changes. I am not selling anything and I am not asking for balances, keys, or screenshots.”

### Behaviour questions

1. Tell me about the last time you noticed a Bitget collateral-ratio, leverage, or maintenance-margin change.
2. How did you determine whether your account was affected?
3. How did you calculate the effect on adjusted equity or margin ratio?
4. What did you do afterward, if anything?
5. Before a weekend or U.S. market closure, how do you think about rToken collateral and crypto positions together?
6. Which part takes the most effort or feels least certain?
7. Have you ever added more margin than you thought was necessary because the exact number was unclear?
8. Which current Bitget screen or number do you trust most when managing this risk?

### Prototype questions

Show a static before/after result only after the behaviour questions.

1. Explain what you think this result means.
2. Which number would influence a decision: projected ratio, equity loss, target buffer, or affected positions?
3. What would you verify before acting?
4. Would you connect a strictly read-only Bitget account? Why or why not?
5. How would you expect the product to behave if its estimate disagrees with Bitget?

### Avoid

- “Would you use this?”
- “Would you pay $20?” before demonstrating repeated pain.
- Explaining the desired answer.
- Treating general futures experience as proof of Bitget UTA experience.
- Collecting account balances, identifiers, keys, or screenshots unnecessarily.

## Validation thresholds

### Pass

- At least 3 of 5 qualified participants describe a manual, approximate, or missing calculation process.
- At least 2 identify a real past or intended action that better impact data would change.
- At least 2 accept a read-only connection after seeing the permission model.
- At least 4 correctly understand the prototype's current-versus-projected distinction without coaching.

### Narrow

Narrow to an educational calculator or Bitget-internal feature proposal if users understand the risk but will not connect accounts or do not experience changes often enough.

### Kill

Stop the standalone-product direction if:

- Bitget already provides an equivalent personalized forward simulator;
- qualified users consistently say the current interface answers the question easily;
- exact projections cannot stay close enough to Bitget's current baseline to be trustworthy; or
- the data required for a meaningful projection cannot be obtained read-only.

## Technical validation

### Schema checks

Confirm access to:

- current adjusted/effective equity;
- current maintenance margin and margin ratio;
- asset equity and gross USD value;
- enabled collateral set;
- eligible collateral tiers;
- current positions and mark prices;
- open orders that consume margin;
- current maintenance-margin tiers and taker fee rate.

### Numerical checks

- Reproduce every official tiered-collateral example.
- Reproduce the rSTRC before/after example.
- Reconcile the sample account's current ratio to the API-returned current ratio.
- Quantify and expose any residual fee term rather than hiding it.
- Verify top-up algebra across normal and boundary cases.

### AI checks

- Build a hand-labelled set of at least ten official announcements.
- Require exact asset, effective time, units, and tier rows.
- Reject missing or overlapping tiers.
- Compare extraction with source text in the interface.
- Never pass model-generated tier data to calculations without deterministic validation.

## Validation evidence log template

| Date | Evidence type | Participant/source | Observed fact | Hypothesis affected | Strength | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| YYYY-MM-DD | Interview / API / source / test | Anonymous label or URL | Factual note | H1–H5 | Weak / medium / strong | Next check |

## Current conclusion

The problem is strong enough to justify a narrow calculation core and disposable demo. It is not yet strong enough to justify credential custody, monitoring infrastructure, a paid plan, or a broad risk terminal.
