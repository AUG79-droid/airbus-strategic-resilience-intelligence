# Phase 2 domain specification

This directory contains the executable, UI-independent specification for the
repair-versus-replacement vertical slice. It is a prototype model, not an
Airbus operational forecast, contractual estimate, lifecycle assessment or
validated customer claim.

## 1. Decision alternatives

The engine evaluates three strategies:

1. `new`: start new-part procurement at the decision point.
2. `repairFirst`: inspect first; repair when feasible, otherwise start new-part
   procurement after inspection.
3. `parallel`: start inspection and a contractually meaningful new-part route
   at the same decision point.

The validator rejects a `parallel` policy if the procurement lead-time clock
does not start at the decision point. A capacity reservation can be represented
as parallel only when it genuinely preserves that lead-time position.

## 2. Joint risk distribution

Let:

- `q = P(R)`: probability that repair is feasible after inspection.
- `p = P(S)`: probability of a supplier shock.
- `j = P(R ∩ S)`: joint probability of feasibility and shock.

The four branch probabilities are:

```text
P(R, S)   = j
P(R, ¬S)  = q - j
P(¬R, S)  = p - j
P(¬R, ¬S) = 1 - q - p + j
```

`j` must satisfy the Fréchet bounds:

```text
max(0, q + p - 1) ≤ j ≤ min(q, p)
```

Independence is never implicit. When selected explicitly:

```text
j = q × p
```

The result includes covariance and the phi correlation when its denominator is
defined.

## 3. Timing branches

Let:

- `I`: inspection duration.
- `R`: repair execution duration after inspection.
- `N`: baseline new-part lead time.
- `D`: additional delay under supplier shock.

New procurement:

```text
Tnew(¬S) = N
Tnew(S)  = N + D
```

Repair-first:

```text
Trepair(R, *)  = I + R
Trepair(¬R, S) = I + N + D
Trepair(¬R, ¬S)= I + N
```

Parallel:

```text
Tparallel(R, S)  = min(I + R, N + D)
Tparallel(R, ¬S) = min(I + R, N)
Tparallel(¬R, S) = N + D
Tparallel(¬R, ¬S)= N
```

Expected values are calculated only after the explicit branches are built:

```text
E[T] = Σ P(branch) × T(branch)
```

The probability of meeting the target date is likewise a branch sum. It means
component recovery before the selected date, not aircraft availability or
mission readiness.

## 4. Economic ledger

Every branch produces a line-item ledger. It distinguishes:

- inspection;
- completed repair;
- completed new-part purchase;
- parallel-route activation;
- committed fractions after cancellation;
- fixed cancellation fees;
- logistics;
- explicitly supplied shock surcharge;
- explicitly declared activation credit;
- residual inventory assets.

The parallel policy supports:

- firm orders;
- cancellable orders;
- capacity reservations that genuinely start the procurement clock.

When repair wins, the policy must say whether the new route is cancelled or
completed to inventory. When the new part wins, the policy must say whether the
repair is cancelled or completed to inventory. Ties have four explicit
policies; the engine never silently chooses the cheapest outcome.

Cash outlay is not automatically netted against residual inventory value.
`netEconomicCost` is `null` unless residual-value recognition is enabled and
every residual asset in that branch has an explicit declared value.

Expected cash cost is:

```text
E[C] = Σ P(branch) × cashOutlay(branch)
```

Maximum cash commitment is calculated only from positive-probability branches.

## 5. Environmental events and indicators

Environmental effects are derived from physical events, not solely commercial
events. A commercial cancellation does not establish avoided manufacturing.
The new-part physical outcome must be one of:

- not initiated;
- cancelled before manufacture;
- manufacturing started;
- completed and used;
- completed to inventory;
- unknown.

The original-component disposition is also explicit. It is never silently
treated as waste merely because a replacement strategy was selected.

The engine can produce these indicators:

- modelled new manufacture avoided per decision;
- virgin-material demand delta;
- waste-generation delta;
- bounded scenario GHG delta;
- approved service-life extension returned to use.

Factor-dependent indicators return `notQuantified` unless every required
factor, unit, boundary and physical outcome is available. Factors marked
`documented` require at least one source identifier. The bounded GHG indicator
is not labelled as a lifecycle assessment.

No production environmental factor values are included in this directory.
Numbers in unit tests are explicitly test-only fictional fixtures.

## 6. Comparative classification

The classifier compares expected recovery time, target-attainment probability
and expected cash outlay using explicit tolerances. Possible nominal outcomes
are:

- `modelledAdvantage`;
- `noDemonstratedBenefit`;
- `potentiallyWorse`;
- `tradeoff`;
- `inconclusive`.

Even a modelled advantage is at most `hypothesisOnly`. If a caller supplies one
or more critical unknowns, the decision outcome becomes `inconclusive` and
claim readiness becomes `blocked`, while the nominal analytical result remains
visible for audit.

## 7. Known Phase 2 limits

- Point probabilities are used; parameter ranges and sensitivity belong to a
  later approved phase.
- Queueing, transport-time distributions, configuration heterogeneity and
  common-cause mechanisms are not structurally modelled beyond the supplied
  joint feasibility/shock distribution.
- Cash timing, discounting, taxes, currency risk and accounting treatment are
  outside the model.
- Capacity constraints and repeated-fleet decisions are outside the model.
- Environmental factors, system boundaries and source approval are caller
  responsibilities; the engine refuses to fill gaps with defaults.
- The model stops at component recovery and does not infer readiness.
