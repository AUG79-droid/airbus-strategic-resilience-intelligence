import {
  DomainValidationError,
  assertFiniteNonNegative,
  assertProbability,
} from '../common/validation';
import { buildRiskTable } from './probability';
import type { ScenarioInputs } from './types';

export function validateScenarioInputs(inputs: ScenarioInputs) {
  const issues: string[] = [];
  const timingEntries = Object.entries(inputs.timing) as Array<[string, number]>;
  const costEntries = Object.entries(inputs.costs) as Array<[string, number]>;

  for (const [key, value] of timingEntries) assertFiniteNonNegative(value, `timing.${key}`, issues);
  for (const [key, value] of costEntries) assertFiniteNonNegative(value, `costs.${key}`, issues);

  assertFiniteNonNegative(inputs.parallel.activationFee, 'parallel.activationFee', issues);
  assertFiniteNonNegative(
    inputs.parallel.activationCreditOnCompletedPurchase,
    'parallel.activationCreditOnCompletedPurchase',
    issues,
  );
  assertFiniteNonNegative(inputs.parallel.newCancellationFee, 'parallel.newCancellationFee', issues);
  assertFiniteNonNegative(inputs.parallel.repairCancellationFee, 'parallel.repairCancellationFee', issues);
  assertProbability(
    inputs.parallel.newCancellationCommittedFraction,
    'parallel.newCancellationCommittedFraction',
    issues,
  );
  assertProbability(
    inputs.parallel.repairCancellationCommittedFraction,
    'parallel.repairCancellationCommittedFraction',
    issues,
  );

  if (!inputs.parallel.procurementStartsAtDecision) {
    issues.push(
      'parallel.procurementStartsAtDecision must be true: a route that does not start its lead-time clock at the decision point is not a true parallel strategy.',
    );
  }

  if (inputs.parallel.activationCreditOnCompletedPurchase > inputs.parallel.activationFee) {
    issues.push('parallel.activationCreditOnCompletedPurchase cannot exceed parallel.activationFee.');
  }
  if (inputs.parallel.activationCreditOnCompletedPurchase > inputs.costs.newPart) {
    issues.push('parallel.activationCreditOnCompletedPurchase cannot exceed costs.newPart.');
  }

  if (
    inputs.parallel.residualValueRecognition.newPartInventoryValue !== undefined
  ) {
    assertFiniteNonNegative(
      inputs.parallel.residualValueRecognition.newPartInventoryValue,
      'parallel.residualValueRecognition.newPartInventoryValue',
      issues,
    );
  }
  if (
    inputs.parallel.residualValueRecognition.repairedComponentInventoryValue !== undefined
  ) {
    assertFiniteNonNegative(
      inputs.parallel.residualValueRecognition.repairedComponentInventoryValue,
      'parallel.residualValueRecognition.repairedComponentInventoryValue',
      issues,
    );
  }

  if (issues.length > 0) throw new DomainValidationError(issues);
  buildRiskTable(inputs.risks);
}
