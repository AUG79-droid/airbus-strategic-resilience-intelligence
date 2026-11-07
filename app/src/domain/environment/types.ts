import type { StrategyResult } from '../model/types';

export type EnvironmentalEvidenceStatus = 'documented' | 'hypothesis' | 'modelledExample';

export interface EnvironmentalFactor {
  value: number;
  unit: string;
  evidenceStatus: EnvironmentalEvidenceStatus;
  sourceIds: string[];
  boundary: string;
}

export interface EnvironmentalFactors {
  newPartVirginMaterialKg?: EnvironmentalFactor;
  originalComponentDisposalMassKg?: EnvironmentalFactor;
  repairProcessWasteKg?: EnvironmentalFactor;
  newPartManufacturingKgCo2e?: EnvironmentalFactor;
  repairProcessKgCo2e?: EnvironmentalFactor;
  newPartLogisticsKgCo2e?: EnvironmentalFactor;
  repairLogisticsKgCo2e?: EnvironmentalFactor;
  approvedLifeExtensionHoursPerRepair?: EnvironmentalFactor;
}

export interface ExpectedEnvironmentalEvents {
  newPartsManufactured: number | null;
  newPartsDelivered: number;
  repairsCompleted: number;
  repairsReturnedToUse: number;
  originalComponentsDisposed: number | null;
  unknownNewPartPhysicalProbability: number;
  unknownOriginalDispositionProbability: number;
}

export type EnvironmentalIndicatorId =
  | 'newManufactureAvoidedUnits'
  | 'virginMaterialDemandDeltaKg'
  | 'wasteGeneratedDeltaKg'
  | 'boundedGhgDeltaKgCo2e'
  | 'serviceLifeExtensionHours';

export interface EnvironmentalIndicator {
  id: EnvironmentalIndicatorId;
  status: 'modelled' | 'notQuantified';
  value: number | null;
  unit: string;
  direction: 'higherIsBetter' | 'lowerIsBetter';
  baselineValue: number | null;
  candidateValue: number | null;
  missingInputs: string[];
  evidenceStatuses: EnvironmentalEvidenceStatus[];
  sourceIds: string[];
  boundary: string;
  limitations: string[];
}

export interface EnvironmentalAssessment {
  baselineStrategy: StrategyResult['strategy'];
  candidateStrategy: StrategyResult['strategy'];
  baselineEvents: ExpectedEnvironmentalEvents;
  candidateEvents: ExpectedEnvironmentalEvents;
  indicators: EnvironmentalIndicator[];
}
