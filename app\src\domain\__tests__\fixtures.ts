import type { EnvironmentalFactors } from '../environment/types';
import type { ScenarioInputs } from '../model/types';

/**
 * Test-only fictional values. They reproduce no Airbus programme, contract,
 * component footprint or validated operational estimate.
 */
export function fictionalScenario(): ScenarioInputs {
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
      repairLogistics: 0,
      newPartLogistics: 0,
      supplierShockSurcharge: 0,
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
      cancelledNewPhysicalOutcome: 'unknown',
      cancelledRepairPhysicalOutcome: 'disposed',
      residualValueRecognition: { enabled: false },
    },
    environmentalPolicy: {
      originalComponentOutcomeWhenReplaced: 'disposed',
      originalComponentOutcomeWhenRepairInfeasible: 'disposed',
    },
  };
}

function factor(value: number, unit: string) {
  return {
    value,
    unit,
    evidenceStatus: 'modelledExample' as const,
    sourceIds: ['TEST-ONLY'],
    boundary: 'Fictional single-component test boundary.',
  };
}

export function fictionalEnvironmentalFactors(): EnvironmentalFactors {
  return {
    newPartVirginMaterialKg: factor(10, 'kg'),
    originalComponentDisposalMassKg: factor(10, 'kg'),
    repairProcessWasteKg: factor(1, 'kg'),
    newPartManufacturingKgCo2e: factor(100, 'kg CO₂e'),
    repairProcessKgCo2e: factor(20, 'kg CO₂e'),
    newPartLogisticsKgCo2e: factor(10, 'kg CO₂e'),
    repairLogisticsKgCo2e: factor(5, 'kg CO₂e'),
    approvedLifeExtensionHoursPerRepair: factor(1_000, 'hours'),
  };
}
