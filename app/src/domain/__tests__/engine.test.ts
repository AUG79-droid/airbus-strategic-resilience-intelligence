import { describe, expect, it } from 'vitest';
import { DomainValidationError } from '../common/validation';
import { evaluateScenario } from '../model/engine';
import { fictionalScenario } from './fixtures';

describe('scenario branch engine', () => {
  it('enumerates transparent expected recovery times for all strategies', () => {
    const result = evaluateScenario(fictionalScenario());

    expect(result.strategies.new.expectedRecoveryDays).toBeCloseTo(112, 12);
    expect(result.strategies.repairFirst.expectedRecoveryDays).toBeCloseTo(50, 12);
    expect(result.strategies.parallel.expectedRecoveryDays).toBeCloseTo(49, 12);
    expect(result.strategies.new.probabilityTargetMet).toBe(0);
    expect(result.strategies.repairFirst.probabilityTargetMet).toBeCloseTo(0.75, 12);
    expect(result.strategies.parallel.probabilityTargetMet).toBeCloseTo(0.75, 12);
  });

  it('keeps branch probabilities normalised for each strategy', () => {
    const result = evaluateScenario(fictionalScenario());
    for (const strategy of Object.values(result.strategies)) {
      expect(strategy.branches.reduce((total, branch) => total + branch.probability, 0)).toBeCloseTo(1, 12);
      expect(strategy.expectedRecoveryDays).toBeGreaterThanOrEqual(
        Math.min(...strategy.branches.map((branch) => branch.recoveryDays)),
      );
      expect(strategy.expectedRecoveryDays).toBeLessThanOrEqual(
        Math.max(...strategy.branches.map((branch) => branch.recoveryDays)),
      );
    }
  });

  it('handles zero repair feasibility without hiding the inspection delay', () => {
    const input = fictionalScenario();
    input.risks.repairFeasibilityProbability = 0;
    const result = evaluateScenario(input);

    expect(result.strategies.repairFirst.expectedRecoveryDays).toBeCloseTo(116, 12);
    expect(result.strategies.parallel.expectedRecoveryDays).toBeCloseTo(112, 12);
  });

  it('handles 100% repair feasibility', () => {
    const input = fictionalScenario();
    input.risks.repairFeasibilityProbability = 1;
    const result = evaluateScenario(input);

    expect(result.strategies.repairFirst.expectedRecoveryDays).toBeCloseTo(28, 12);
    expect(result.strategies.parallel.expectedRecoveryDays).toBeCloseTo(28, 12);
  });

  it('increases new-procurement expected time monotonically with shock probability', () => {
    let previous = -Infinity;
    for (let index = 0; index <= 20; index += 1) {
      const input = fictionalScenario();
      input.risks.supplierShockProbability = index / 20;
      const current = evaluateScenario(input).strategies.new.expectedRecoveryDays;
      expect(current).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
  });

  it('reduces expected recovery time monotonically as repair feasibility rises when repair is faster', () => {
    let previous = Infinity;
    for (let index = 0; index <= 20; index += 1) {
      const input = fictionalScenario();
      input.risks.repairFeasibilityProbability = index / 20;
      const current = evaluateScenario(input).strategies.repairFirst.expectedRecoveryDays;
      expect(current).toBeLessThanOrEqual(previous);
      previous = current;
    }
  });

  it('uses the declared joint distribution rather than silently assuming independence', () => {
    const independent = fictionalScenario();
    independent.risks.repairFeasibilityProbability = 0.7;
    independent.risks.supplierShockProbability = 0.4;
    const dependent = fictionalScenario();
    dependent.risks.repairFeasibilityProbability = 0.7;
    dependent.risks.supplierShockProbability = 0.4;
    dependent.risks.dependence = {
      mode: 'joint',
      repairFeasibleAndShockProbability: 0.4,
    };

    const independentTime = evaluateScenario(independent).strategies.repairFirst.expectedRecoveryDays;
    const dependentTime = evaluateScenario(dependent).strategies.repairFirst.expectedRecoveryDays;
    expect(dependentTime).not.toBeCloseTo(independentTime, 12);
  });

  it('rejects a purported parallel route that does not start procurement at the decision point', () => {
    const input = fictionalScenario();
    input.parallel.procurementStartsAtDecision = false;
    expect(() => evaluateScenario(input)).toThrow(DomainValidationError);
  });

  it('does not count zero-probability branches in maximum commitment', () => {
    const input = fictionalScenario();
    input.risks.repairFeasibilityProbability = 1;
    input.risks.supplierShockProbability = 0;
    const result = evaluateScenario(input);
    expect(result.strategies.parallel.branches).toHaveLength(1);
    expect(result.strategies.parallel.branches[0]?.pathOutcome).toBe('repair');
  });

  it('treats recovery exactly on the deadline as meeting the target', () => {
    const input = fictionalScenario();
    input.risks.repairFeasibilityProbability = 1;
    input.risks.supplierShockProbability = 0;
    input.timing.targetRecoveryDays = 28;
    const result = evaluateScenario(input);
    expect(result.strategies.repairFirst.probabilityTargetMet).toBe(1);
    expect(result.strategies.parallel.probabilityTargetMet).toBe(1);
  });

  it('rejects invalid monetary and probability inputs before modelling', () => {
    const negative = fictionalScenario();
    negative.costs.inspection = -1;
    expect(() => evaluateScenario(negative)).toThrow(DomainValidationError);

    const invalidFraction = fictionalScenario();
    invalidFraction.parallel.newCancellationCommittedFraction = 1.1;
    expect(() => evaluateScenario(invalidFraction)).toThrow(DomainValidationError);

    const invalidCredit = fictionalScenario();
    invalidCredit.parallel.activationCreditOnCompletedPurchase = 16_000;
    expect(() => evaluateScenario(invalidCredit)).toThrow(DomainValidationError);
  });
});
