import type { StrategyResult } from './model/types';
import {
  DomainValidationError,
  assertFiniteNonNegative,
  assertProbability,
} from './common/validation';

export type ComparativeSignal = 'better' | 'worse' | 'equivalent';
export type NominalOutcome =
  | 'modelledAdvantage'
  | 'noDemonstratedBenefit'
  | 'potentiallyWorse'
  | 'tradeoff'
  | 'inconclusive';

export interface ClassificationOptions {
  timeToleranceDays: number;
  targetProbabilityTolerance: number;
  costTolerance: number;
  criticalUnknowns: string[];
}

export interface ComparativeClassification {
  candidateStrategy: StrategyResult['strategy'];
  baselineStrategy: StrategyResult['strategy'];
  nominalOutcome: NominalOutcome;
  decisionOutcome: NominalOutcome;
  claimReadiness: 'hypothesisOnly' | 'blocked';
  signals: {
    expectedRecoveryTime: ComparativeSignal;
    targetAttainmentProbability: ComparativeSignal;
    expectedCashOutlay: ComparativeSignal;
  };
  deltas: {
    expectedRecoveryDays: number;
    targetAttainmentProbability: number;
    expectedCashOutlay: number;
  };
  criticalUnknowns: string[];
  explanation: string[];
}

function lowerIsBetterSignal(delta: number, tolerance: number): ComparativeSignal {
  if (delta < -tolerance) return 'better';
  if (delta > tolerance) return 'worse';
  return 'equivalent';
}

function higherIsBetterSignal(delta: number, tolerance: number): ComparativeSignal {
  if (delta > tolerance) return 'better';
  if (delta < -tolerance) return 'worse';
  return 'equivalent';
}

function nominalOutcome(
  time: ComparativeSignal,
  deadline: ComparativeSignal,
  cost: ComparativeSignal,
): NominalOutcome {
  const resilienceSignals = [time, deadline];
  const hasBetter = resilienceSignals.includes('better');
  const hasWorse = resilienceSignals.includes('worse');

  if (hasBetter && hasWorse) return 'inconclusive';
  if (hasBetter) return cost === 'worse' ? 'tradeoff' : 'modelledAdvantage';
  if (hasWorse) return cost === 'better' ? 'tradeoff' : 'potentiallyWorse';
  return 'noDemonstratedBenefit';
}

export function classifyAgainstBaseline(
  baseline: StrategyResult,
  candidate: StrategyResult,
  options: ClassificationOptions,
): ComparativeClassification {
  const issues: string[] = [];
  assertFiniteNonNegative(options.timeToleranceDays, 'timeToleranceDays', issues);
  assertProbability(
    options.targetProbabilityTolerance,
    'targetProbabilityTolerance',
    issues,
  );
  assertFiniteNonNegative(options.costTolerance, 'costTolerance', issues);
  if (issues.length > 0) throw new DomainValidationError(issues);

  const deltas = {
    expectedRecoveryDays: candidate.expectedRecoveryDays - baseline.expectedRecoveryDays,
    targetAttainmentProbability:
      candidate.probabilityTargetMet - baseline.probabilityTargetMet,
    expectedCashOutlay: candidate.expectedCashOutlay - baseline.expectedCashOutlay,
  };
  const signals = {
    expectedRecoveryTime: lowerIsBetterSignal(
      deltas.expectedRecoveryDays,
      options.timeToleranceDays,
    ),
    targetAttainmentProbability: higherIsBetterSignal(
      deltas.targetAttainmentProbability,
      options.targetProbabilityTolerance,
    ),
    expectedCashOutlay: lowerIsBetterSignal(
      deltas.expectedCashOutlay,
      options.costTolerance,
    ),
  };
  const nominal = nominalOutcome(
    signals.expectedRecoveryTime,
    signals.targetAttainmentProbability,
    signals.expectedCashOutlay,
  );
  const blocked = options.criticalUnknowns.length > 0;
  const explanation = [
    `Expected recovery time is ${signals.expectedRecoveryTime} than the baseline within the declared tolerance.`,
    `Target-attainment probability is ${signals.targetAttainmentProbability} than the baseline within the declared tolerance.`,
    `Expected cash outlay is ${signals.expectedCashOutlay} than the baseline within the declared tolerance.`,
  ];
  if (blocked) {
    explanation.push(
      'The decision outcome is inconclusive because one or more critical dependencies remain unresolved.',
    );
  }

  return {
    candidateStrategy: candidate.strategy,
    baselineStrategy: baseline.strategy,
    nominalOutcome: nominal,
    decisionOutcome: blocked ? 'inconclusive' : nominal,
    claimReadiness: blocked ? 'blocked' : 'hypothesisOnly',
    signals,
    deltas,
    criticalUnknowns: [...options.criticalUnknowns],
    explanation,
  };
}
