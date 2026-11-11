import { useMemo, useState } from 'react';
import type { Locale } from '../app/types';
import type { Copy } from '../content/i18n';
import { evidenceCopy } from '../features/evidence/copy';
import { useEvidence } from '../features/evidence/EvidenceProvider';
import type { EvidenceFocus, EvidenceStatus } from '../features/evidence/types';
import { labCopy } from '../features/lab/copy';
import { useLab } from '../features/lab/LabProvider';
import { translatorCopy } from '../features/translator/copy';
import { buildStrategicTranslation } from '../features/translator/translator';
import type { AudienceId, TranslationTraceItem } from '../features/translator/types';
import type { StrategyId } from '../domain';
import { ExportReview } from '../features/export/ExportReview';
import { GtsCaseStudies } from './GtsCaseStudies';

interface ViewProps { content: Copy; locale: Locale; }
type TranslatorSection = 'profile' | 'causal' | 'trace' | 'validation';
const audiences: AudienceId[] = ['defenceCustomer', 'programmeManager', 'engineering', 'executiveLeadership'];
const strategies: StrategyId[] = ['new', 'repairFirst', 'parallel'];
const sections: TranslatorSection[] = ['profile', 'causal', 'trace', 'validation'];

function statusLabel(status: EvidenceStatus | 'validatedBenefit', locale: Locale) {
  const t = translatorCopy(locale);
  const labels = {
    documentedFact: t.documented,
    hypothesis: t.hypothesis,
    modelledExample: t.modelled,
    unsupported: t.unsupported,
    rejected: t.rejected,
    validatedBenefit: t.validated,
  };
  return labels[status];
}

function TraceRow({ item, locale, onOpen }: { item: TranslationTraceItem; locale: Locale; onOpen: (focus: EvidenceFocus) => void }) {
  const t = translatorCopy(locale);
  return <details className="translator-trace-row" data-testid={`trace-${item.id}`}>
    <summary><span>{item.id}</span><p>{item.statement}</p><strong className={`translator-status translator-status--${item.status}`}>{statusLabel(item.status, locale)}</strong></summary>
    <div><dl><div><dt>Evidence IDs</dt><dd>{item.evidenceIds.join(' · ') || '—'}</dd></div><div><dt>Model output IDs</dt><dd>{item.modelOutputIds.join(' · ') || '—'}</dd></div></dl><button type="button" onClick={() => onOpen(item.focus)}>{t.inspectEvidence} →</button></div>
  </details>;
}

export function TranslateView({ content: _content, locale }: ViewProps) {
  const t = translatorCopy(locale);
  const et = evidenceCopy(locale);
  const lt = labCopy(locale);
  const lab = useLab();
  const evidence = useEvidence();
  const [audience, setAudience] = useState<AudienceId>('defenceCustomer');
  const [strategy, setStrategy] = useState<StrategyId>('repairFirst');
  const [section, setSection] = useState<TranslatorSection>('profile');

  const translation = useMemo(() => {
    if (!lab.result || !lab.classifications || !lab.environmental) return null;
    return buildStrategicTranslation({
      locale,
      audience,
      strategy,
      result: lab.result,
      repairClassification: lab.classifications.repairFirst,
      parallelClassification: lab.classifications.parallel,
      environmental: lab.environmental,
      claims: evidence.claims,
    });
  }, [audience, evidence.claims, lab.classifications, lab.environmental, lab.result, locale, strategy]);

  const scenarioLabel = lab.selectedPreset === 'custom' ? lt.custom : lt.presets[lab.selectedPreset];

  if (!translation || !lab.result || !lab.environmental) {
    return <section className="translator-error" role="alert"><h2>{t.title}</h2><p>{lab.errors.join(' ')}</p></section>;
  }

  return <section className="translator" aria-labelledby="translate-title">
    <header className="translator-header"><div><p className="kicker">PHASE 05 / STRATEGIC TRANSLATION</p><h2 id="translate-title">{t.title}</h2><p>{t.intro}</p></div><div className="translator-header__context"><strong>{t.fictional}</strong><span>{t.scenario}: {scenarioLabel}</span></div></header>

    <nav className="audience-selector" aria-label={t.audience}>{audiences.map((item, index) => <button type="button" key={item} data-testid={`audience-${item}`} className={audience === item ? 'is-active' : ''} aria-pressed={audience === item} onClick={() => setAudience(item)}><span>0{index + 1}</span><div><strong>{t.audiences[item]}</strong><small>{t.audienceNotes[item]}</small></div></button>)}</nav>

    <nav className="strategy-selector" aria-label={t.profile}>{strategies.map((item, index) => <button type="button" key={item} data-testid={`strategy-${item}`} className={strategy === item ? 'is-active' : ''} aria-pressed={strategy === item} onClick={() => setStrategy(item)}><span>0{index + 1}</span><strong>{t.strategies[item]}</strong></button>)}</nav>

    <article className={`translator-summary translator-summary--${translation.conclusion}`} data-testid="translator-summary">
      <header><div><p className="kicker">{t.mainConclusion}</p><span className={`conclusion-chip conclusion-chip--${translation.conclusion}`}>{t.conclusions[translation.conclusion]}</span><h3>{translation.headline}</h3></div><div className="validated-counter"><strong>{translation.validatedBenefitCount}</strong><span>{t.validatedCount}</span></div></header>
      <div className="translator-summary__body"><section><h4>{t.executiveSummary}</h4><p>{translation.executiveSummary}</p></section><section className="translator-recommendation"><h4>{t.decision}</h4><p>{translation.decisionRecommendation}</p></section></div>
      <section className="translator-comparison" data-testid="three-way-comparison"><div><h4>{t.comparison}</h4><p>{translation.comparativeAssessment}</p><ul>{translation.comparisonStatements.map((statement) => <li key={statement}>{statement}</li>)}</ul></div><aside><h4>{t.decisionTest}</h4><p>{translation.comparativeDecisionRule}</p></aside></section>
      <div className="translator-metrics">{translation.metrics.map((metric) => <section key={metric.id} data-testid={`metric-${metric.id}`} className={`translator-metric translator-metric--${metric.direction}`}><span>{metric.label}</span><strong>{metric.value}</strong><small>{t.modelled}</small><button type="button" onClick={() => evidence.openEvidence({ type: 'strategy', id: strategy })}>{t.inspectCalculation} →</button></section>)}</div>
      <p className="translator-boundary"><strong>{t.boundary}:</strong> {translation.decisionBoundary}</p>
    </article>

    <article className="translator-detail">
      <nav className="translator-section-tabs" role="tablist" aria-label={t.title}>{sections.map((item, index) => <button type="button" role="tab" key={item} id={`translator-tab-${item}`} aria-selected={section === item} aria-controls={`translator-panel-${item}`} className={section === item ? 'is-active' : ''} onClick={() => setSection(item)}><span>0{index + 1}</span>{t.sections[item]}</button>)}</nav>

      {section === 'profile' && <section id="translator-panel-profile" role="tabpanel" aria-labelledby="translator-tab-profile" className="translator-profile"><article><h3>{t.advantages}</h3><ul>{translation.advantages.map((item) => <li key={item}>{item}</li>)}</ul></article><article><h3>{t.drawbacks}</h3><ul>{translation.drawbacks.map((item) => <li key={item}>{item}</li>)}</ul></article><article><h3>{t.uncertainties}</h3><ul>{translation.uncertainties.map((item) => <li key={item}>{item}</li>)}</ul></article></section>}

      {section === 'causal' && <section id="translator-panel-causal" role="tabpanel" aria-labelledby="translator-tab-causal" className="translator-causal"><div className="translator-causal__chain">{translation.causalSteps.map((step, index) => <article key={step.stage}><span>0{index + 1}</span><div><h4>{step.label}</h4><p>{step.statement}</p><strong className={`translator-status translator-status--${step.status}`}>{statusLabel(step.status, locale)}</strong><button type="button" onClick={() => evidence.openEvidence(step.focus)}>{t.inspectEvidence} →</button></div></article>)}</div></section>}

      {section === 'trace' && <section id="translator-panel-trace" role="tabpanel" aria-labelledby="translator-tab-trace" className="translator-trace"><p>{locale === 'es' ? 'Selecciona una afirmación para consultar sus referencias exactas y abrir el registro de evidencias.' : 'Select a statement to inspect its exact references and open the evidence register.'}</p><div>{translation.traceItems.map((item) => <TraceRow key={item.id} item={item} locale={locale} onOpen={evidence.openEvidence} />)}</div></section>}

      {section === 'validation' && <section id="translator-panel-validation" role="tabpanel" aria-labelledby="translator-tab-validation" className="translator-validation"><header><div><p className="kicker">{t.pending}</p><h3>{t.audiences[audience]}</h3></div><span className="phase-chip">{translation.validationActions.length}</span></header><ol>{translation.validationActions.map((action, index) => <li key={`${action.owner}-${action.action}`}><span>0{index + 1}</span><div><strong>{et.owners[action.owner]}</strong><p>{action.action}</p></div></li>)}</ol></section>}
    </article>

    <details className="translator-limitations"><summary>{t.limitations}<span>+</span></summary><div><p>{t.noValidated}</p><ul>{translation.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></div></details>

    <GtsCaseStudies locale={locale} />

    <ExportReview locale={locale} audience={audience} strategy={strategy} scenarioLabel={scenarioLabel} scenario={lab.scenario} result={lab.result} environmental={lab.environmental} translation={translation} assumptions={evidence.assumptions} modelOutputs={evidence.modelOutputs} records={evidence.records} sources={evidence.sources} claims={evidence.claims} />
  </section>;
}
