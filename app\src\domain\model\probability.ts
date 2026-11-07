import {
  DomainValidationError,
  NUMERIC_EPSILON,
  assertProbability,
  nearlyEqual,
  sum,
} from '../common/validation';
import type { RiskInputs, RiskState, RiskTable } from './types';

export function jointProbabilityBounds(
  repairFeasibilityProbability: number,
  supplierShockProbability: number,
) {
  return {
    minimum: Math.max(0, repairFeasibilityProbability + supplierShockProbability - 1),
    maximum: Math.min(repairFeasibilityProbability, supplierShockProbability),
  };
}

export function buildRiskTable(inputs: RiskInputs): RiskTable {
  const issues: string[] = [];
  const repairProbability = inputs.repairFeasibilityProbability;
  const shockProbability = inputs.supplierShockProbability;
  assertProbability(repairProbability, 'repairFeasibilityProbability', issues);
  assertProbability(shockProbability, 'supplierShockProbability', issues);

  let jointProbability = repairProbability * shockProbability;
  if (inputs.dependence.mode === 'joint') {
    jointProbability = inputs.dependence.repairFeasibleAndShockProbability;
    assertProbability(jointProbability, 'repairFeasibleAndShockProbability', issues);
    const bounds = jointProbabilityBounds(repairProbability, shockProbability);
    if (jointProbability < bounds.minimum - NUMERIC_EPSILON || jointProbability > bounds.maximum + NUMERIC_EPSILON) {
      issues.push(
        `repairFeasibleAndShockProbability must be within the Fréchet bounds ` +
          `[${bounds.minimum}, ${bounds.maximum}] for the supplied marginals.`,
      );
    }
  }

  if (issues.length > 0) throw new DomainValidationError(issues);

  const states: RiskState[] = [
    { repairFeasible: true, supplierShock: true, probability: jointProbability },
    {
      repairFeasible: true,
      supplierShock: false,
      probability: repairProbability - jointProbability,
    },
    {
      repairFeasible: false,
      supplierShock: true,
      probability: shockProbability - jointProbability,
    },
    {
      repairFeasible: false,
      supplierShock: false,
      probability: 1 - repairProbability - shockProbability + jointProbability,
    },
  ];

  const probabilitySum = sum(states.map((state) => state.probability));
  if (states.some((state) => state.probability < -NUMERIC_EPSILON) || !nearlyEqual(probabilitySum, 1)) {
    throw new DomainValidationError(['The derived joint risk table is not a valid probability distribution.']);
  }

  const covariance = jointProbability - repairProbability * shockProbability;
  const denominator = Math.sqrt(
    repairProbability *
      (1 - repairProbability) *
      shockProbability *
      (1 - shockProbability),
  );

  return {
    mode: inputs.dependence.mode,
    jointRepairFeasibleAndShockProbability: jointProbability,
    covariance,
    phiCorrelation: denominator > NUMERIC_EPSILON ? covariance / denominator : null,
    states: states.map((state) => ({
      ...state,
      probability: Math.max(0, state.probability),
    })),
  };
}
