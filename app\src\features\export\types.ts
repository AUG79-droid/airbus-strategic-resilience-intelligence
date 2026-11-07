import type { Locale } from '../../app/types';
import type { EnvironmentalAssessment, ScenarioInputs, ScenarioResult, StrategyId } from '../../domain';
import type { ClaimGateResult, EvidenceAssumption, EvidenceModelOutput, EvidenceRecord, PublicSource } from '../evidence/types';
import type { AudienceId, StrategicTranslation } from '../translator/types';

export const MODEL_VERSION = '0.6.0-phase-6';
export const EXPORT_SCHEMA_VERSION = '1.0.0';
export const PROTOTYPE_WARNING = 'PROTOTYPE — NOT INTERNALLY VALIDATED';

export interface ResilienceExportPackage {
  schemaVersion: typeof EXPORT_SCHEMA_VERSION;
  modelVersion: typeof MODEL_VERSION;
  generatedAt: string;
  warning: typeof PROTOTYPE_WARNING;
  locale: Locale;
  selection: { audience: AudienceId; strategy: StrategyId; scenario: string };
  scenarioInputs: ScenarioInputs;
  scenarioResults: ScenarioResult;
  environmentalResults: Record<'repairFirst' | 'parallel', EnvironmentalAssessment>;
  translation: StrategicTranslation;
  evidence: {
    assumptions: EvidenceAssumption[];
    modelOutputs: EvidenceModelOutput[];
    records: EvidenceRecord[];
    sources: PublicSource[];
    claimGates: ClaimGateResult[];
  };
  exportPolicy: {
    validatedBenefits: [];
    blockedClaimIds: string[];
    rejectedClaimIds: string[];
    statement: string;
  };
}

export interface ExportValidation {
  safe: boolean;
  checks: Array<{ id: string; passed: boolean; message: string }>;
}
