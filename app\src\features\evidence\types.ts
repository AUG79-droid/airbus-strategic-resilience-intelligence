import type { StrategyId } from '../../domain';

export type CausalStageId =
  | 'initiative'
  | 'environmentalMechanism'
  | 'strategicVulnerability'
  | 'resilienceOutcome'
  | 'customerValue'
  | 'evidenceLimitations';

export type EvidenceStatus =
  | 'documentedFact'
  | 'hypothesis'
  | 'modelledExample'
  | 'unsupported'
  | 'rejected';

export type EvidenceOwner = 'engineering' | 'procurement' | 'sustainability' | 'programmes';

export interface PublicSource {
  id: string;
  title: string;
  publisher: 'Airbus' | 'EASA';
  url: string;
  publicationDate: string | null;
  accessedDate: string;
  locator: string;
  extract: string;
  sourceType: 'publicWebPage' | 'publicReport' | 'regulatoryGuidance';
  reviewState: 'reviewed';
  limitations: string[];
}

export interface EvidenceRecord {
  id: string;
  title: { en: string; es: string };
  statement: { en: string; es: string };
  status: EvidenceStatus;
  stages: CausalStageId[];
  strategyIds: StrategyId[];
  sourceIds: string[];
  assumptionIds: string[];
  modelOutputIds: string[];
  limitations: { en: string[]; es: string[] };
  requiredInformation: Array<{
    owner: EvidenceOwner;
    request: { en: string; es: string };
  }>;
  lastReviewed: string;
  reviewer: string;
}

export interface EvidenceAssumption {
  id: string;
  label: { en: string; es: string };
  value: string;
  provenance: 'fictionalUserInput' | 'explicitPolicy';
}

export interface EvidenceModelOutput {
  id: string;
  label: { en: string; es: string };
  value: string;
  formula: string;
  status: 'modelledExample';
}

export type ClaimGateStatus = 'allowedContext' | 'blocked' | 'rejected';

export interface ClaimGateResult {
  id: 'serviceContext' | 'environmentalBenefit' | 'operationalBenefit' | 'strategicResilience' | 'customerValue';
  title: { en: string; es: string };
  proposedClaim: { en: string; es: string };
  status: ClaimGateStatus;
  evidenceIds: string[];
  reasons: { en: string[]; es: string[] };
  missingInformation: Array<{ owner: EvidenceOwner; request: { en: string; es: string } }>;
  lastEvaluated: string;
}

export interface EvidenceFocus {
  type: 'all' | 'stage' | 'strategy' | 'claim';
  id?: CausalStageId | StrategyId | ClaimGateResult['id'];
}

