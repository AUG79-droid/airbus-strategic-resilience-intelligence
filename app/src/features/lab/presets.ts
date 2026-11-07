import type { ScenarioInputs } from '../../domain';

export type PresetId =
  | 'balanced'
  | 'supplierShock'
  | 'lowFeasibility'
  | 'costPressure'
  | 'repairWorsens'
  | 'correlatedRisk';

export interface LabPreset {
  id: PresetId;
  scenario: ScenarioInputs;
}

function baseScenario(): ScenarioInputs {
  return {
    timing: {
      inspectionDays: 4,
      repairExecutionDays: 24,
      newLeadDays: 85,
      supplierShockDelayDays: 60,
      targetRecoveryDays: 60,
    },
    risks: {
      repairFeasibilityProbability: 0.75,
      supplierShockProbability: 0.45,
      dependence: { mode: 'independent' },
    },
    costs: {
      inspection: 5_000,
      repair: 52_000,
      newPart: 140_000,
      repairLogistics: 2_000,
      newPartLogistics: 4_000,
      supplierShockSurcharge: 18_000,
    },
    parallel: {
      procurementContract: 'cancellableOrder',
      procurementStartsAtDecision: true,
      activationFee: 15_000,
      activationCreditOnCompletedPurchase: 0,
      newCancellationCommittedFraction: 0.15,
      newCancellationFee: 2_000,
      repairCancellationCommittedFraction: 0.25,
      repairCancellationFee: 1_000,
      onRepairWins: 'cancelNew',
      onNewWins: 'cancelRepair',
      tiePolicy: 'completeBothUseRepair',
      cancelledNewPhysicalOutcome: 'cancelledBeforeManufacture', // DEMO-60 fictional physical assumption; not a validated supplier fact.
      cancelledRepairPhysicalOutcome: 'disposed',
      residualValueRecognition: { enabled: false },
    },
    environmentalPolicy: {
      originalComponentOutcomeWhenReplaced: 'disposed',
      originalComponentOutcomeWhenRepairInfeasible: 'disposed',
    },
  };
}

function altered(mutator: (scenario: ScenarioInputs) => void): ScenarioInputs {
  const scenario = baseScenario();
  mutator(scenario);
  return scenario;
}

export const LAB_PRESETS: LabPreset[] = [
  { id: 'balanced', scenario: baseScenario() },
  {
    id: 'supplierShock',
    scenario: altered((scenario) => {
      scenario.risks.supplierShockProbability = 0.75;
      scenario.timing.supplierShockDelayDays = 95;
      scenario.costs.supplierShockSurcharge = 35_000;
    }),
  },
  {
    id: 'lowFeasibility',
    scenario: altered((scenario) => {
      scenario.risks.repairFeasibilityProbability = 0.2;
      scenario.timing.inspectionDays = 9;
    }),
  },
  {
    id: 'costPressure',
    scenario: altered((scenario) => {
      scenario.costs.newPart = 95_000;
      scenario.costs.repair = 72_000;
      scenario.costs.inspection = 9_000;
      scenario.parallel.activationFee = 22_000;
      scenario.parallel.newCancellationCommittedFraction = 0.35;
    }),
  },
  {
    id: 'repairWorsens',
    scenario: altered((scenario) => {
      scenario.timing.inspectionDays = 8;
      scenario.timing.repairExecutionDays = 78;
      scenario.timing.newLeadDays = 38;
      scenario.timing.supplierShockDelayDays = 18;
      scenario.timing.targetRecoveryDays = 50;
      scenario.risks.repairFeasibilityProbability = 0.8;
      scenario.risks.supplierShockProbability = 0.1;
      scenario.costs.repair = 145_000;
      scenario.costs.newPart = 118_000;
    }),
  },
  {
    id: 'correlatedRisk',
    scenario: altered((scenario) => {
      scenario.risks.repairFeasibilityProbability = 0.65;
      scenario.risks.supplierShockProbability = 0.6;
      scenario.risks.dependence = {
        mode: 'joint',
        repairFeasibleAndShockProbability: 0.5,
      };
    }),
  },
];

export function scenarioForPreset(id: PresetId): ScenarioInputs {
  const preset = LAB_PRESETS.find((item) => item.id === id) ?? LAB_PRESETS[0];
  return structuredClone(preset.scenario);
}

