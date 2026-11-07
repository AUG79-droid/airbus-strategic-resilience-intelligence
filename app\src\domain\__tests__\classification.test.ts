import { describe, expect, it } from 'vitest';
import { classifyAgainstBaseline } from '../classification';
import { DomainValidationError } from '../common/validation';
import type { StrategyResult } from '../model/types';

function result(
  strategy: StrategyResult['strategy'],
  expectedRecoveryDays: number,
  probabilityTargetMet: number,
  expectedCashOutlay: number,
): StrategyResult {
  return {
    strategy,
    branches: [],
    expectedRecoveryDays,
    probabilityTargetMet,
    expectedCashOutlay,
    expectedSunkCost: 0,
    maximumCashCommitment: expectedCashOutlay,
    expectedRecognisedResidualValue: null,
    expectedNetEconomicCost: null,
  };
}

const tolerances = {
  timeToleranceDays: 0.1,
  targetProbabilityTolerance: 0.001,
  costTolerance: 1,
  criticalUnknowns: [] as string[],
};

describe('comparative decision classification', () => {
  it('identifies a modelled advantage without elevating it above hypothesis', () => {
    const classification = classifyAgainstBaseline(
      result('new', 100, 0.5, 100_000),
      result('repairFirst', 70, 0.8, 80_000),
      tolerances,
    );
    expect(classification.nominalOutcome).toBe('modelledAdvantage');
    expect(classification.decisionOutcome).toBe('modelledAdvantage');
    expect(classification.claimReadiness).toBe('hypothesisOnly');
  });

  it('identifies a time/cost trade-off', () => {
    const classification = classifyAgainstBaseline(
      result('new', 100, 0.5, 100_000),
      result('parallel', 70, 0.8, 150_000),
      tolerances,
    );
    expect(classification.nominalOutcome).toBe('tradeoff');
  });

  it('identifies a potentially worse resilience result', () => {
    const classification = classifyAgainstBaseline(
      result('new', 80, 0.8, 100_000),
      result('repairFirst', 110, 0.4, 120_000),
      tolerances,
    );
    expect(classification.nominalOutcome).toBe('potentiallyWorse');
  });

  it('returns no demonstrated benefit inside declared tolerances', () => {
    const classification = classifyAgainstBaseline(
      result('new', 80, 0.8, 100_000),
      result('repairFirst', 80.05, 0.8005, 100_000.5),
      tolerances,
    );
    expect(classification.nominalOutcome).toBe('noDemonstratedBenefit');
  });

  it('returns inconclusive when time and deadline signals conflict', () => {
    const classification = classifyAgainstBaseline(
      result('new', 80, 0.8, 100_000),
      result('repairFirst', 70, 0.6, 90_000),
      tolerances,
    );
    expect(classification.nominalOutcome).toBe('inconclusive');
  });

  it('blocks the decision outcome when critical dependencies remain unresolved', () => {
    const classification = classifyAgainstBaseline(
      result('new', 100, 0.5, 100_000),
      result('repairFirst', 70, 0.8, 80_000),
      {
        ...tolerances,
        criticalUnknowns: ['repair eligibility evidence'],
      },
    );
    expect(classification.nominalOutcome).toBe('modelledAdvantage');
    expect(classification.decisionOutcome).toBe('inconclusive');
    expect(classification.claimReadiness).toBe('blocked');
  });

  it('rejects invalid tolerances', () => {
    expect(() =>
      classifyAgainstBaseline(
        result('new', 100, 0.5, 100_000),
        result('repairFirst', 70, 0.8, 80_000),
        { ...tolerances, timeToleranceDays: -1 },
      ),
    ).toThrow(DomainValidationError);
  });
});
