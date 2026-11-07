import { evaluateScenario, type ScenarioInputs } from '../../domain';

export interface ThresholdResult {
  id: 'repairFeasibility' | 'repairDuration' | 'newCancellationFraction';
  status: 'available' | 'unavailable' | 'notReached' | 'alwaysSatisfied';
  value: number | null;
  unit: '%' | 'days';
  reason?: string;
}

export function calculateThresholds(scenario: ScenarioInputs): ThresholdResult[] {
  const baseline = evaluateScenario(scenario).strategies.new;
  let feasibility: ThresholdResult;
  if (scenario.risks.dependence.mode !== 'independent') {
    feasibility = {
      id: 'repairFeasibility', status: 'unavailable', value: null, unit: '%',
      reason: 'A feasibility threshold cannot vary one marginal while a fixed joint probability is preserved.',
    };
  } else {
    let first: number | null = null;
    for (let step = 0; step <= 200; step += 1) {
      const value = step / 200;
      const candidate = structuredClone(scenario);
      candidate.risks.repairFeasibilityProbability = value;
      if (evaluateScenario(candidate).strategies.repairFirst.expectedRecoveryDays <= baseline.expectedRecoveryDays + 1e-9) {
        first = value;
        break;
      }
    }
    feasibility = first === null
      ? { id: 'repairFeasibility', status: 'notReached', value: null, unit: '%' }
      : { id: 'repairFeasibility', status: first === 0 ? 'alwaysSatisfied' : 'available', value: first * 100, unit: '%' };
  }

  let lastDuration: number | null = null;
  for (let days = 0; days <= 365; days += 1) {
    const candidate = structuredClone(scenario);
    candidate.timing.repairExecutionDays = days;
    if (evaluateScenario(candidate).strategies.repairFirst.expectedRecoveryDays <= baseline.expectedRecoveryDays + 1e-9) {
      lastDuration = days;
    }
  }
  const duration: ThresholdResult = lastDuration === null
    ? { id: 'repairDuration', status: 'notReached', value: null, unit: 'days' }
    : { id: 'repairDuration', status: lastDuration === 365 ? 'alwaysSatisfied' : 'available', value: lastDuration, unit: 'days' };

  let lastFraction: number | null = null;
  for (let step = 0; step <= 200; step += 1) {
    const value = step / 200;
    const candidate = structuredClone(scenario);
    candidate.parallel.newCancellationCommittedFraction = value;
    if (evaluateScenario(candidate).strategies.parallel.expectedCashOutlay <= baseline.expectedCashOutlay + 1e-9) {
      lastFraction = value;
    }
  }
  const cancellation: ThresholdResult = lastFraction === null
    ? { id: 'newCancellationFraction', status: 'notReached', value: null, unit: '%' }
    : { id: 'newCancellationFraction', status: lastFraction === 1 ? 'alwaysSatisfied' : 'available', value: lastFraction * 100, unit: '%' };

  return [feasibility, duration, cancellation];
}

