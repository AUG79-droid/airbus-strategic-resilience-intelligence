import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  DomainValidationError,
  classifyAgainstBaseline,
  evaluateEnvironmentalIndicators,
  evaluateScenario,
  type ComparativeClassification,
  type EnvironmentalAssessment,
  type EnvironmentalFactors,
  type ScenarioInputs,
  type ScenarioResult,
} from '../../domain';
import { LAB_PRESETS, scenarioForPreset, type PresetId } from './presets';

export interface EnvironmentalExampleValues {
  newPartVirginMaterialKg: number;
  originalComponentDisposalMassKg: number;
  repairProcessWasteKg: number;
  newPartManufacturingKgCo2e: number;
  repairProcessKgCo2e: number;
  newPartLogisticsKgCo2e: number;
  repairLogisticsKgCo2e: number;
  approvedLifeExtensionHoursPerRepair: number;
}

interface LabState {
  scenario: ScenarioInputs;
  selectedPreset: PresetId | 'custom';
  result: ScenarioResult | null;
  errors: string[];
  classifications: Record<'repairFirst' | 'parallel', ComparativeClassification> | null;
  environmentalEnabled: boolean;
  environmentalValues: EnvironmentalExampleValues;
  environmental: Record<'repairFirst' | 'parallel', EnvironmentalAssessment> | null;
  applyPreset: (id: PresetId) => void;
  updateScenario: (mutator: (draft: ScenarioInputs) => void) => void;
  setEnvironmentalEnabled: (enabled: boolean) => void;
  updateEnvironmentalValue: (key: keyof EnvironmentalExampleValues, value: number) => void;
}

const LabContext = createContext<LabState | null>(null);

const initialEnvironmentalValues: EnvironmentalExampleValues = {
  newPartVirginMaterialKg: 10,
  originalComponentDisposalMassKg: 10,
  repairProcessWasteKg: 1,
  newPartManufacturingKgCo2e: 100,
  repairProcessKgCo2e: 20,
  newPartLogisticsKgCo2e: 10,
  repairLogisticsKgCo2e: 5,
  approvedLifeExtensionHoursPerRepair: 1_000,
};

function environmentalFactors(
  enabled: boolean,
  values: EnvironmentalExampleValues,
): EnvironmentalFactors {
  if (!enabled) return {};
  const factor = (value: number, unit: string) => ({
    value,
    unit,
    evidenceStatus: 'modelledExample' as const,
    sourceIds: ['UI-FICTIONAL-EXAMPLE'],
    boundary: 'Fictional single-component decision boundary; not Airbus data.',
  });
  return {
    newPartVirginMaterialKg: factor(values.newPartVirginMaterialKg, 'kg'),
    originalComponentDisposalMassKg: factor(values.originalComponentDisposalMassKg, 'kg'),
    repairProcessWasteKg: factor(values.repairProcessWasteKg, 'kg'),
    newPartManufacturingKgCo2e: factor(values.newPartManufacturingKgCo2e, 'kg CO₂e'),
    repairProcessKgCo2e: factor(values.repairProcessKgCo2e, 'kg CO₂e'),
    newPartLogisticsKgCo2e: factor(values.newPartLogisticsKgCo2e, 'kg CO₂e'),
    repairLogisticsKgCo2e: factor(values.repairLogisticsKgCo2e, 'kg CO₂e'),
    approvedLifeExtensionHoursPerRepair: factor(values.approvedLifeExtensionHoursPerRepair, 'hours'),
  };
}

export function LabProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState(() => scenarioForPreset('balanced'));
  const [selectedPreset, setSelectedPreset] = useState<PresetId | 'custom'>('balanced');
  const [environmentalEnabled, setEnvironmentalEnabled] = useState(true); // DEMO-60: all factors remain clearly fictional.
  const [environmentalValues, setEnvironmentalValues] = useState(initialEnvironmentalValues);

  const computed = useMemo(() => {
    try {
      const result = evaluateScenario(scenario);
      const options = {
        timeToleranceDays: 0.1,
        targetProbabilityTolerance: 0.001,
        costTolerance: 1,
        criticalUnknowns: [],
      };
      const classifications = {
        repairFirst: classifyAgainstBaseline(result.strategies.new, result.strategies.repairFirst, options),
        parallel: classifyAgainstBaseline(result.strategies.new, result.strategies.parallel, options),
      };
      const factors = environmentalFactors(environmentalEnabled, environmentalValues);
      const environmental = {
        repairFirst: evaluateEnvironmentalIndicators(result.strategies.new, result.strategies.repairFirst, factors),
        parallel: evaluateEnvironmentalIndicators(result.strategies.new, result.strategies.parallel, factors),
      };
      return { result, classifications, environmental, errors: [] as string[] };
    } catch (error) {
      const errors = error instanceof DomainValidationError ? error.issues : [String(error)];
      return { result: null, classifications: null, environmental: null, errors };
    }
  }, [environmentalEnabled, environmentalValues, scenario]);

  const value = useMemo<LabState>(() => ({
    scenario,
    selectedPreset,
    ...computed,
    environmentalEnabled,
    environmentalValues,
    applyPreset: (id) => {
      setScenario(scenarioForPreset(id));
      setSelectedPreset(id);
    },
    updateScenario: (mutator) => {
      setScenario((current) => {
        const draft = structuredClone(current);
        mutator(draft);
        return draft;
      });
      setSelectedPreset('custom');
    },
    setEnvironmentalEnabled,
    updateEnvironmentalValue: (key, value) => {
      setEnvironmentalValues((current) => ({ ...current, [key]: value }));
    },
  }), [computed, environmentalEnabled, environmentalValues, scenario, selectedPreset]);

  return <LabContext.Provider value={value}>{children}</LabContext.Provider>;
}

export function useLab() {
  const context = useContext(LabContext);
  if (!context) throw new Error('useLab must be used within LabProvider.');
  return context;
}

export { LAB_PRESETS };

