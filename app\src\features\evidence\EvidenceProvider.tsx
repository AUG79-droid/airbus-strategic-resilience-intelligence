import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useLab } from '../lab/LabProvider';
import { evaluateClaimGates } from './claims';
import { buildAssumptions, buildEvidenceRecords, buildModelOutputs } from './registry';
import { PUBLIC_SOURCES } from './sources';
import type {
  ClaimGateResult,
  EvidenceAssumption,
  EvidenceFocus,
  EvidenceModelOutput,
  EvidenceRecord,
  PublicSource,
} from './types';

interface EvidenceContextValue {
  records: EvidenceRecord[];
  visibleRecords: EvidenceRecord[];
  claims: ClaimGateResult[];
  sources: PublicSource[];
  assumptions: EvidenceAssumption[];
  modelOutputs: EvidenceModelOutput[];
  focus: EvidenceFocus;
  setFocus: (focus: EvidenceFocus) => void;
  openEvidence: (focus: EvidenceFocus) => void;
}

const EvidenceContext = createContext<EvidenceContextValue | null>(null);

export function EvidenceProvider({ children }: { children: ReactNode }) {
  const lab = useLab();
  const [focus, setFocus] = useState<EvidenceFocus>({ type: 'all' });

  const computed = useMemo(() => {
    if (!lab.result || !lab.classifications || !lab.environmental) {
      return { records: [], claims: [], assumptions: [], modelOutputs: [] };
    }
    const assumptions = buildAssumptions(lab.scenario);
    const modelOutputs = buildModelOutputs(lab.result);
    for (const [strategy, assessment] of Object.entries(lab.environmental)) {
      for (const indicator of assessment.indicators) {
        if (indicator.status !== 'modelled') continue;
        modelOutputs.push({
          id: `ENV-${strategy}-${indicator.id}`,
          label: { en: indicator.id, es: indicator.id },
          value: `${indicator.value ?? 0} ${indicator.unit}`,
          formula: 'candidate expected physical events − replacement expected physical events',
          status: 'modelledExample',
        });
      }
    }
    const records = buildEvidenceRecords({
      result: lab.result,
      classifications: lab.classifications,
      environmental: lab.environmental,
      environmentalEnabled: lab.environmentalEnabled,
    });
    const claims = evaluateClaimGates({
      repairClassification: lab.classifications.repairFirst,
      environmental: lab.environmental.repairFirst,
    });
    return { records, claims, assumptions, modelOutputs };
  }, [lab.classifications, lab.environmental, lab.environmentalEnabled, lab.result, lab.scenario]);

  const visibleRecords = useMemo(() => {
    if (focus.type === 'all' || !focus.id) return computed.records;
    if (focus.type === 'stage') return computed.records.filter((record) => record.stages.includes(focus.id as never));
    if (focus.type === 'strategy') return computed.records.filter((record) => record.strategyIds.includes(focus.id as never));
    const claim = computed.claims.find((item) => item.id === focus.id);
    return computed.records.filter((record) => claim?.evidenceIds.includes(record.id));
  }, [computed.claims, computed.records, focus]);

  const value = useMemo<EvidenceContextValue>(() => ({
    ...computed,
    visibleRecords,
    sources: PUBLIC_SOURCES,
    focus,
    setFocus,
    openEvidence: (nextFocus) => {
      setFocus(nextFocus);
      window.history.replaceState(null, '', '#/validate');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      document.getElementById('case-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  }), [computed, focus, visibleRecords]);

  return <EvidenceContext.Provider value={value}>{children}</EvidenceContext.Provider>;
}

export function useEvidence() {
  const context = useContext(EvidenceContext);
  if (!context) throw new Error('useEvidence must be used within EvidenceProvider.');
  return context;
}

