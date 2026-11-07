import type { Locale } from '../../app/types';
import type { EnvironmentalAssessment, ScenarioInputs, ScenarioResult, StrategyId } from '../../domain';
import type { ClaimGateResult, EvidenceAssumption, EvidenceModelOutput, EvidenceRecord, PublicSource } from '../evidence/types';
import type { AudienceId, StrategicTranslation } from '../translator/types';
import { EXPORT_SCHEMA_VERSION, MODEL_VERSION, PROTOTYPE_WARNING, type ExportValidation, type ResilienceExportPackage } from './types';

export function buildExportPackage(args: {
  locale: Locale;
  audience: AudienceId;
  strategy: StrategyId;
  scenarioLabel: string;
  scenario: ScenarioInputs;
  result: ScenarioResult;
  environmental: Record<'repairFirst' | 'parallel', EnvironmentalAssessment>;
  translation: StrategicTranslation;
  assumptions: EvidenceAssumption[];
  modelOutputs: EvidenceModelOutput[];
  records: EvidenceRecord[];
  sources: PublicSource[];
  claims: ClaimGateResult[];
  generatedAt?: string;
}): ResilienceExportPackage {
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    modelVersion: MODEL_VERSION,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    warning: PROTOTYPE_WARNING,
    locale: args.locale,
    selection: { audience: args.audience, strategy: args.strategy, scenario: args.scenarioLabel },
    scenarioInputs: structuredClone(args.scenario),
    scenarioResults: structuredClone(args.result),
    environmentalResults: structuredClone(args.environmental),
    translation: structuredClone(args.translation),
    evidence: {
      assumptions: structuredClone(args.assumptions),
      modelOutputs: structuredClone(args.modelOutputs),
      records: structuredClone(args.records),
      sources: structuredClone(args.sources),
      claimGates: structuredClone(args.claims),
    },
    exportPolicy: {
      validatedBenefits: [],
      blockedClaimIds: args.claims.filter((claim) => claim.status === 'blocked').map((claim) => claim.id),
      rejectedClaimIds: args.claims.filter((claim) => claim.status === 'rejected').map((claim) => claim.id),
      statement: args.locale === 'es'
        ? 'Las afirmaciones bloqueadas o rechazadas se conservan como advertencias y nunca se exportan como beneficios demostrados.'
        : 'Blocked or rejected claims are retained as warnings and are never exported as demonstrated benefits.',
    },
  };
}

export function validateExportPackage(data: ResilienceExportPackage): ExportValidation {
  const disallowed = new Set([...data.exportPolicy.blockedClaimIds, ...data.exportPolicy.rejectedClaimIds]);
  const tracePromotesDisallowed = data.translation.traceItems.some((item) => item.status === 'validatedBenefit' && item.claimId && disallowed.has(item.claimId));
  const checks = [
    { id: 'prototype-warning', passed: data.warning === PROTOTYPE_WARNING, message: data.warning },
    { id: 'model-version', passed: data.modelVersion === MODEL_VERSION && data.schemaVersion === EXPORT_SCHEMA_VERSION, message: `${data.modelVersion} / schema ${data.schemaVersion}` },
    { id: 'validated-benefits', passed: data.exportPolicy.validatedBenefits.length === 0 && data.translation.validatedBenefitCount === 0, message: 'No case-specific validated benefits are declared.' },
    { id: 'claim-gating', passed: !tracePromotesDisallowed, message: 'Blocked and rejected claims remain limitations, not demonstrated benefits.' },
    { id: 'reproducible-inputs', passed: Boolean(data.scenarioInputs && data.scenarioResults && data.evidence.assumptions.length), message: 'Inputs, branch results, assumptions and evidence states are included.' },
  ];
  return { safe: checks.every((check) => check.passed), checks };
}

export function serialiseExportPackage(data: ResilienceExportPackage) {
  return `${JSON.stringify(data, null, 2)}\n`;
}

export function exportFilename(data: ResilienceExportPackage, extension: 'json' | 'pdf') {
  const date = data.generatedAt.slice(0, 10);
  return `airbus-resilience-${data.selection.strategy}-${data.selection.audience}-${date}.${extension}`;
}
