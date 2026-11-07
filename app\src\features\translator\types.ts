import type { Locale } from '../../app/types';
import type { StrategyId } from '../../domain';
import type { CausalStageId, ClaimGateResult, EvidenceFocus, EvidenceOwner, EvidenceStatus } from '../evidence/types';

export type AudienceId = 'defenceCustomer' | 'programmeManager' | 'engineering' | 'executiveLeadership';
export type TranslationConclusion = 'reference' | 'favourable' | 'unfavourable' | 'contradictory' | 'noDemonstratedBenefit' | 'inconclusive';

export interface TranslatedMetric {
  id: 'expectedRecovery' | 'targetAttainment' | 'expectedCashOutlay';
  label: string;
  value: string;
  direction: 'favourable' | 'unfavourable' | 'neutral';
  status: 'modelledExample';
  modelOutputIds: string[];
}

export interface CausalTranslationStep {
  stage: CausalStageId;
  label: string;
  statement: string;
  status: EvidenceStatus;
  evidenceIds: string[];
  focus: EvidenceFocus;
}

export interface TranslationTraceItem {
  id: string;
  statement: string;
  status: EvidenceStatus | 'validatedBenefit';
  evidenceIds: string[];
  modelOutputIds: string[];
  claimId?: ClaimGateResult['id'];
  focus: EvidenceFocus;
}

export interface ValidationAction {
  owner: EvidenceOwner;
  action: string;
}

export interface StrategicTranslation {
  locale: Locale;
  audience: AudienceId;
  strategy: StrategyId;
  conclusion: TranslationConclusion;
  headline: string;
  executiveSummary: string;
  decisionRecommendation: string;
  decisionBoundary: string;
  comparativeAssessment: string;
  comparativeDecisionRule: string;
  comparisonStatements: string[];
  primaryComparator: StrategyId;
  marginalValuePerDay: number | null;
  metrics: TranslatedMetric[];
  causalSteps: CausalTranslationStep[];
  traceItems: TranslationTraceItem[];
  validationActions: ValidationAction[];
  advantages: string[];
  drawbacks: string[];
  uncertainties: string[];
  limitations: string[];
  validatedBenefitCount: 0;
}

