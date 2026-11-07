import { evaluateScenario, jointProbabilityBounds, type ScenarioInputs, type StrategyId } from '../../domain';

export type SensitivityVariable =
  | 'repairFeasibilityProbability'
  | 'supplierShockProbability'
  | 'repairExecutionDays'
  | 'newLeadDays'
  | 'newPartCost'
  | 'repairCost';

export type SensitivityMetric = 'expectedRecoveryDays' | 'probabilityTargetMet' | 'expectedCashOutlay';

export interface SensitivityPoint {
  input: number;
  values: Record<StrategyId, number>;
}

export interface SensitivityResult {
  variable: SensitivityVariable;
  metric: SensitivityMetric;
  points: SensitivityPoint[];
  jointProbabilityAdjusted: boolean;
}

const ranges: Record<SensitivityVariable, [number, number]> = {
  repairFeasibilityProbability: [0, 1],
  supplierShockProbability: [0, 1],
  repairExecutionDays: [1, 160],
  newLeadDays: [15, 180],
  newPartCost: [50_000, 250_000],
  repairCost: [20_000, 160_000],
};

function setVariable(scenario: ScenarioInputs, variable: SensitivityVariable, value: number) {
  if (variable === 'repairFeasibilityProbability') scenario.risks.repairFeasibilityProbability = value;
  if (variable === 'supplierShockProbability') scenario.risks.supplierShockProbability = value;
  if (variable === 'repairExecutionDays') scenario.timing.repairExecutionDays = value;
  if (variable === 'newLeadDays') scenario.timing.newLeadDays = value;
  if (variable === 'newPartCost') scenario.costs.newPart = value;
  if (variable === 'repairCost') scenario.costs.repair = value;
}

function keepJointProbabilityValid(scenario: ScenarioInputs) {
  if (scenario.risks.dependence.mode !== 'joint') return false;
  const { minimum, maximum } = jointProbabilityBounds(
    scenario.risks.repairFeasibilityProbability,
    scenario.risks.supplierShockProbability,
  );
  const current = scenario.risks.dependence.repairFeasibleAndShockProbability;
  const adjusted = Math.min(maximum, Math.max(minimum, current));
  scenario.risks.dependence.repairFeasibleAndShockProbability = adjusted;
  return adjusted !== current;
}

export function runSensitivity(
  scenario: ScenarioInputs,
  variable: SensitivityVariable,
  metric: SensitivityMetric,
  steps = 11,
): SensitivityResult {
  const [minimum, maximum] = ranges[variable];
  let jointProbabilityAdjusted = false;
  const points = Array.from({ length: steps }, (_, index) => {
    const input = minimum + ((maximum - minimum) * index) / (steps - 1);
    const candidate = structuredClone(scenario);
    setVariable(candidate, variable, input);
    jointProbabilityAdjusted = keepJointProbabilityValid(candidate) || jointProbabilityAdjusted;
    const result = evaluateScenario(candidate);
    return {
      input,
      values: {
        new: result.strategies.new[metric],
        repairFirst: result.strategies.repairFirst[metric],
        parallel: result.strategies.parallel[metric],
      },
    };
  });
  return { variable, metric, points, jointProbabilityAdjusted };
}

