import { NUMERIC_EPSILON, sum } from '../common/validation';
import { newOnlyEconomics, parallelEconomics, repairFirstEconomics } from './economics';
import { buildRiskTable } from './probability';
import type {
  BranchEconomics,
  EnvironmentalEvents,
  ModelBranch,
  NewPartPhysicalOutcome,
  OriginalComponentPhysicalOutcome,
  PathOutcome,
  RiskState,
  ScenarioInputs,
  ScenarioResult,
  StrategyId,
  StrategyResult,
} from './types';
import { validateScenarioInputs } from './validation';

function pathOutcome(repairCompletionDays: number, newCompletionDays: number): PathOutcome {
  if (Math.abs(repairCompletionDays - newCompletionDays) <= NUMERIC_EPSILON) return 'tie';
  return repairCompletionDays < newCompletionDays ? 'repair' : 'new';
}

function cancelledNewOutcome(
  outcome: ScenarioInputs['parallel']['cancelledNewPhysicalOutcome'],
): NewPartPhysicalOutcome {
  return outcome;
}

function cancelledRepairOutcome(
  outcome: ScenarioInputs['parallel']['cancelledRepairPhysicalOutcome'],
): OriginalComponentPhysicalOutcome {
  return outcome;
}

function parallelEnvironmentalEvents(
  inputs: ScenarioInputs,
  repairFeasible: boolean,
  outcome: PathOutcome,
): EnvironmentalEvents {
  if (!repairFeasible) {
    return {
      newPartOutcome: 'completedUsed',
      originalComponentOutcome:
        inputs.environmentalPolicy.originalComponentOutcomeWhenRepairInfeasible,
      repairCompleted: false,
      newPartDelivered: true,
    };
  }

  if (outcome === 'repair') {
    return {
      newPartOutcome:
        inputs.parallel.onRepairWins === 'completeNewToInventory'
          ? 'completedInventory'
          : cancelledNewOutcome(inputs.parallel.cancelledNewPhysicalOutcome),
      originalComponentOutcome: 'repairedUsed',
      repairCompleted: true,
      newPartDelivered: inputs.parallel.onRepairWins === 'completeNewToInventory',
    };
  }

  if (outcome === 'new') {
    const repairContinues = inputs.parallel.onNewWins === 'completeRepairToInventory';
    return {
      newPartOutcome: 'completedUsed',
      originalComponentOutcome: repairContinues
        ? 'repairedInventory'
        : cancelledRepairOutcome(inputs.parallel.cancelledRepairPhysicalOutcome),
      repairCompleted: repairContinues,
      newPartDelivered: true,
    };
  }

  if (inputs.parallel.tiePolicy === 'useRepairCancelNew') {
    return {
      newPartOutcome: cancelledNewOutcome(inputs.parallel.cancelledNewPhysicalOutcome),
      originalComponentOutcome: 'repairedUsed',
      repairCompleted: true,
      newPartDelivered: false,
    };
  }
  if (inputs.parallel.tiePolicy === 'useNewCancelRepair') {
    return {
      newPartOutcome: 'completedUsed',
      originalComponentOutcome: cancelledRepairOutcome(
        inputs.parallel.cancelledRepairPhysicalOutcome,
      ),
      repairCompleted: false,
      newPartDelivered: true,
    };
  }
  if (inputs.parallel.tiePolicy === 'completeBothUseRepair') {
    return {
      newPartOutcome: 'completedInventory',
      originalComponentOutcome: 'repairedUsed',
      repairCompleted: true,
      newPartDelivered: true,
    };
  }
  return {
    newPartOutcome: 'completedUsed',
    originalComponentOutcome: 'repairedInventory',
    repairCompleted: true,
    newPartDelivered: true,
  };
}

function branch(
  strategy: StrategyId,
  id: string,
  repairFeasible: boolean | null,
  supplierShock: boolean,
  probability: number,
  recoveryDays: number,
  targetDays: number,
  outcome: PathOutcome,
  economics: BranchEconomics,
  environmentalEvents: EnvironmentalEvents,
  assumptions: string[],
): ModelBranch {
  return {
    id,
    strategy,
    repairFeasible,
    supplierShock,
    probability,
    recoveryDays,
    targetMet: recoveryDays <= targetDays + NUMERIC_EPSILON,
    pathOutcome: outcome,
    economics,
    environmentalEvents,
    assumptions,
  };
}

function positiveProbability<T extends { probability: number }>(items: T[]) {
  return items.filter((item) => item.probability > NUMERIC_EPSILON);
}

function aggregate(strategy: StrategyId, branches: ModelBranch[]): StrategyResult {
  const probabilityTotal = sum(branches.map((item) => item.probability));
  const expected = (selector: (item: ModelBranch) => number) =>
    sum(branches.map((item) => item.probability * selector(item))) / probabilityTotal;

  const residualValues = branches.map((item) => item.economics.recognisedResidualValue);
  const netValues = branches.map((item) => item.economics.netEconomicCost);
  const allResidualValuesKnown = residualValues.every((value): value is number => value !== null);
  const allNetValuesKnown = netValues.every((value): value is number => value !== null);

  return {
    strategy,
    branches,
    expectedRecoveryDays: expected((item) => item.recoveryDays),
    probabilityTargetMet: expected((item) => (item.targetMet ? 1 : 0)),
    expectedCashOutlay: expected((item) => item.economics.totalCashOutlay),
    expectedSunkCost: expected((item) => item.economics.sunkCost),
    maximumCashCommitment: Math.max(...branches.map((item) => item.economics.totalCashOutlay)),
    expectedRecognisedResidualValue: allResidualValuesKnown
      ? sum(
          branches.map(
            (item, index) => item.probability * (residualValues[index] ?? 0),
          ),
        ) / probabilityTotal
      : null,
    expectedNetEconomicCost: allNetValuesKnown
      ? sum(
          branches.map((item, index) => item.probability * (netValues[index] ?? 0)),
        ) / probabilityTotal
      : null,
  };
}

function evaluateNew(inputs: ScenarioInputs): StrategyResult {
  const shockProbability = inputs.risks.supplierShockProbability;
  const states = positiveProbability([
    { supplierShock: false, probability: 1 - shockProbability },
    { supplierShock: true, probability: shockProbability },
  ]);
  const branches = states.map((state) => {
    const recoveryDays =
      inputs.timing.newLeadDays +
      (state.supplierShock ? inputs.timing.supplierShockDelayDays : 0);
    return branch(
      'new',
      `new-${state.supplierShock ? 'shock' : 'no-shock'}`,
      null,
      state.supplierShock,
      state.probability,
      recoveryDays,
      inputs.timing.targetRecoveryDays,
      'new',
      newOnlyEconomics(inputs.costs, state.supplierShock),
      {
        newPartOutcome: 'completedUsed',
        originalComponentOutcome:
          inputs.environmentalPolicy.originalComponentOutcomeWhenReplaced,
        repairCompleted: false,
        newPartDelivered: true,
      },
      ['The new-part lead-time clock starts at the decision point.'],
    );
  });
  return aggregate('new', branches);
}

function riskStateId(state: RiskState) {
  return `${state.repairFeasible ? 'feasible' : 'infeasible'}-${
    state.supplierShock ? 'shock' : 'no-shock'
  }`;
}

function evaluateRepairFirst(inputs: ScenarioInputs, states: RiskState[]): StrategyResult {
  const branches = positiveProbability(states).map((state) => {
    const newCompletionDays =
      inputs.timing.newLeadDays +
      (state.supplierShock ? inputs.timing.supplierShockDelayDays : 0);
    const recoveryDays = state.repairFeasible
      ? inputs.timing.inspectionDays + inputs.timing.repairExecutionDays
      : inputs.timing.inspectionDays + newCompletionDays;
    return branch(
      'repairFirst',
      `repair-first-${riskStateId(state)}`,
      state.repairFeasible,
      state.supplierShock,
      state.probability,
      recoveryDays,
      inputs.timing.targetRecoveryDays,
      state.repairFeasible ? 'repair' : 'new',
      repairFirstEconomics(inputs.costs, state.repairFeasible, state.supplierShock),
      state.repairFeasible
        ? {
            newPartOutcome: 'notInitiated',
            originalComponentOutcome: 'repairedUsed',
            repairCompleted: true,
            newPartDelivered: false,
          }
        : {
            newPartOutcome: 'completedUsed',
            originalComponentOutcome:
              inputs.environmentalPolicy.originalComponentOutcomeWhenRepairInfeasible,
            repairCompleted: false,
            newPartDelivered: true,
          },
      state.repairFeasible
        ? ['Repair is authorised only after inspection confirms feasibility.']
        : ['New procurement starts only after inspection rejects the repair route.'],
    );
  });
  return aggregate('repairFirst', branches);
}

function evaluateParallel(inputs: ScenarioInputs, states: RiskState[]): StrategyResult {
  const branches = positiveProbability(states).map((state) => {
    const newCompletionDays =
      inputs.timing.newLeadDays +
      (state.supplierShock ? inputs.timing.supplierShockDelayDays : 0);
    const repairCompletionDays =
      inputs.timing.inspectionDays + inputs.timing.repairExecutionDays;
    const outcome = state.repairFeasible
      ? pathOutcome(repairCompletionDays, newCompletionDays)
      : 'new';
    const recoveryDays = state.repairFeasible
      ? Math.min(repairCompletionDays, newCompletionDays)
      : newCompletionDays;
    return branch(
      'parallel',
      `parallel-${riskStateId(state)}`,
      state.repairFeasible,
      state.supplierShock,
      state.probability,
      recoveryDays,
      inputs.timing.targetRecoveryDays,
      outcome,
      parallelEconomics(
        inputs.costs,
        inputs.parallel,
        state.repairFeasible,
        state.supplierShock,
        outcome,
      ),
      parallelEnvironmentalEvents(inputs, state.repairFeasible, outcome),
      [
        'The new-part lead-time clock and inspection start at the same decision point.',
        `Procurement contract mode: ${inputs.parallel.procurementContract}.`,
        `Risk relationship: ${inputs.risks.dependence.mode}.`,
      ],
    );
  });
  return aggregate('parallel', branches);
}

export function evaluateScenario(inputs: ScenarioInputs): ScenarioResult {
  validateScenarioInputs(inputs);
  const riskTable = buildRiskTable(inputs.risks);
  return {
    riskTable,
    strategies: {
      new: evaluateNew(inputs),
      repairFirst: evaluateRepairFirst(inputs, riskTable.states),
      parallel: evaluateParallel(inputs, riskTable.states),
    },
  };
}
