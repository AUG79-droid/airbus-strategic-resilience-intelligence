import { useEffect, useMemo, useState } from 'react';
import type { Locale } from '../app/types';
import type { Copy } from '../content/i18n';
import { evidenceCopy } from '../features/evidence/copy';
import { useEvidence } from '../features/evidence/EvidenceProvider';
import type {
  CausalStageId,
  ClaimGateResult,
  EvidenceFocus,
  EvidenceOwner,
  EvidenceRecord,
  PublicSource,
} from '../features/evidence/types';

interface ViewProps { content: Copy; locale: Locale; }
type TabId = 'register' | 'claims' | 'sources' | 'requests';
const owners: EvidenceOwner[] = ['engineering', 'procurement', 'sustainability', 'programmes'];

function focusValue(focus: EvidenceFocus) {
  return focus.type === 'all' ? 'all' : `${focus.type}:${focus.id}`;
}

function parseFocus(value: string): EvidenceFocus {
  if (value === 'all') return { type: 'all' };
  const [type, id] = value.split(':');
  return { type: type as EvidenceFocus['type'], id: id as EvidenceFocus['id'] };
}

function EvidenceDetail({ record, locale }: { record: EvidenceRecord; locale: Locale }) {
  const t = evidenceCopy(locale);
  const evidence = useEvidence();
  const assumptions = new Map(evidence.assumptions.map((item) => [item.id, item]));
  const outputs = new Map(evidence.modelOutputs.map((item) => [item.id, item]));
  const sources = new Map(evidence.sources.map((item) => [item.id, item]));
  return <article className="selected-evidence" aria-live="polite">
    <header><div><span className="evidence-record__id">{record.id}</span><h3>{record.title[locale]}</h3></div><span className={`evidence-status evidence-status--${record.status}`}>{t.statuses[record.status]}</span></header>
    <p className="selected-evidence__statement">{record.statement[locale]}</p>
    <div className="trace-tags">{record.stages.map((stage) => <span key={stage}>{t.stages[stage]}</span>)}{record.strategyIds.map((strategy) => <span key={strategy}>{t.strategies[strategy]}</span>)}</div>
    {record.sourceIds.length > 0 ? <section><h4>{t.sourcesLabel}</h4>{record.sourceIds.map((sourceId) => { const source = sources.get(sourceId); return source && <div className="trace-source" key={source.id}><strong>{source.id} · {source.publisher}</strong><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a><small>{t.locator}: {source.locator}</small></div>; })}</section> : <p className="trace-empty">{t.noSource}</p>}
    {record.assumptionIds.length > 0 && <section><h4>{t.assumption}</h4><dl className="trace-list">{record.assumptionIds.map((id) => { const item = assumptions.get(id); return item && <div key={id}><dt>{item.id} · {item.label[locale]}</dt><dd>{item.value}<small>{t.provenance[item.provenance]}</small></dd></div>; })}</dl></section>}
    {record.modelOutputIds.length > 0 && <section><h4>{t.output}</h4><dl className="trace-list">{record.modelOutputIds.map((id) => { const item = outputs.get(id); return item && <div key={id}><dt>{item.id} · {item.label[locale]}</dt><dd>{item.value}<code>{item.formula}</code></dd></div>; })}</dl></section>}
    <section><h4>{t.limitations}</h4><ul>{record.limitations[locale].map((item) => <li key={item}>{item}</li>)}</ul></section>
    {record.requiredInformation.length > 0 && <section><h4>{t.needed}</h4><ul>{record.requiredInformation.map((item) => <li key={`${item.owner}-${item.request.en}`}><strong>{t.owners[item.owner]}:</strong> {item.request[locale]}</li>)}</ul></section>}
    <footer><span>{t.reviewed}: {record.lastReviewed}</span><span>{t.reviewer}: {record.reviewer}</span></footer>
  </article>;
}

function ClaimDetail({ claim, locale, onTrace }: { claim: ClaimGateResult; locale: Locale; onTrace: () => void }) {
  const t = evidenceCopy(locale);
  return <article className={`selected-claim selected-claim--${claim.status}`} aria-live="polite">
    <header><div><span>{claim.id}</span><h3>{claim.title[locale]}</h3></div><strong>{t.gateStatuses[claim.status]}</strong></header>
    <p className="selected-claim__statement">{claim.proposedClaim[locale]}</p>
    <section><h4>{t.claimReason}</h4><ul>{claim.reasons[locale].map((reason) => <li key={reason}>{reason}</li>)}</ul></section>
    {claim.missingInformation.length > 0 && <section><h4>{t.missingInfo}</h4><ul>{claim.missingInformation.map((item) => <li key={`${item.owner}-${item.request.en}`}><strong>{t.owners[item.owner]}:</strong> {item.request[locale]}</li>)}</ul></section>}
    <footer><span>{t.lastEvaluated}: {claim.lastEvaluated}</span><button type="button" onClick={onTrace}>{t.traceResult} →</button></footer>
  </article>;
}

function SourceItem({ source, locale }: { source: PublicSource; locale: Locale }) {
  const t = evidenceCopy(locale);
  return <details className="source-accordion" data-testid={`source-${source.id}`}>
    <summary><span>{source.id}</span><div><strong>{source.title}</strong><small>{source.publisher} · {source.publicationDate ?? source.accessedDate}</small></div><span>{t.details} +</span></summary>
    <div><dl><div><dt>{t.publicationDate}</dt><dd>{source.publicationDate ?? '—'}</dd></div><div><dt>{t.accessedDate}</dt><dd>{source.accessedDate}</dd></div><div><dt>{t.reviewState}</dt><dd>{t.reviewedSource}</dd></div><div><dt>{t.locator}</dt><dd>{source.locator}</dd></div></dl><blockquote>{source.extract}</blockquote><h4>{t.sourceLimits}</h4><ul>{source.limitations.map((item) => <li key={item}>{item}</li>)}</ul><a href={source.url} target="_blank" rel="noreferrer">{t.openSource} ↗</a></div>
  </details>;
}

export function TechnicalEvidenceView({ content: _content, locale }: ViewProps) {
  const t = evidenceCopy(locale);
  const evidence = useEvidence();
  const [tab, setTab] = useState<TabId>('register');
  const [selectedRecordId, setSelectedRecordId] = useState(evidence.visibleRecords[0]?.id ?? '');
  const [selectedClaimId, setSelectedClaimId] = useState<ClaimGateResult['id']>(evidence.claims[0]?.id ?? 'serviceContext');
  const [selectedOwner, setSelectedOwner] = useState<EvidenceOwner>('engineering');

  useEffect(() => {
    if (!evidence.visibleRecords.some((record) => record.id === selectedRecordId)) {
      setSelectedRecordId(evidence.visibleRecords[0]?.id ?? '');
    }
  }, [evidence.visibleRecords, selectedRecordId]);

  const selectedRecord = evidence.visibleRecords.find((record) => record.id === selectedRecordId) ?? evidence.visibleRecords[0];
  const selectedClaim = evidence.claims.find((claim) => claim.id === selectedClaimId) ?? evidence.claims[0];
  const ownerRequests = useMemo(() => {
    const byOwner = new Map<EvidenceOwner, Set<string>>(owners.map((owner) => [owner, new Set()]));
    for (const record of evidence.records) for (const item of record.requiredInformation) byOwner.get(item.owner)?.add(item.request[locale]);
    for (const claim of evidence.claims) for (const item of claim.missingInformation) byOwner.get(item.owner)?.add(item.request[locale]);
    return byOwner;
  }, [evidence.claims, evidence.records, locale]);

  const openClaimEvidence = (claim: ClaimGateResult) => {
    evidence.setFocus({ type: 'claim', id: claim.id });
    setTab('register');
  };

  return <section className="evidence-workspace evidence-workspace--compact" aria-labelledby="validate-title">
    <header className="evidence-workspace__header">
      <div>
        <p className="kicker">{locale === 'es' ? 'CONSULTA AVANZADA' : 'ADVANCED REFERENCE'}</p>
        <h2 id="validate-title">{locale === 'es' ? 'Fuentes y comprobaciones' : 'Sources and validation checks'}</h2>
        <p>{locale === 'es'
          ? 'Estas fichas sirven para rastrear información y distinguir datos ficticios, cálculos y fuentes públicas. No son tareas que tengas que completar para continuar.'
          : 'These records let you trace invented inputs, calculations and public sources. They are not tasks you must complete to continue.'}</p>
      </div>
    </header>

    <nav className="evidence-tabs" role="tablist" aria-label={t.title}>{(Object.keys(t.tabs) as TabId[]).map((item, index) => <button key={item} id={`evidence-tab-${item}`} type="button" role="tab" aria-selected={tab === item} aria-controls={`evidence-panel-${item}`} tabIndex={tab === item ? 0 : -1} className={tab === item ? 'is-active' : ''} onClick={() => setTab(item)}><span>0{index + 1}</span>{t.tabs[item]}</button>)}</nav>

    {tab === 'register' && <section id="evidence-panel-register" className="evidence-tabpanel" role="tabpanel" aria-labelledby="evidence-tab-register">
      <div className="evidence-focusbar"><label><span>{t.filter}</span><select data-testid="evidence-focus" value={focusValue(evidence.focus)} onChange={(event) => evidence.setFocus(parseFocus(event.target.value))}><option value="all">{t.all}</option><optgroup label={t.focusNames.stage}>{(Object.keys(t.stages) as CausalStageId[]).map((stage) => <option key={stage} value={`stage:${stage}`}>{t.stages[stage]}</option>)}</optgroup><optgroup label={t.focusNames.strategy}>{(Object.keys(t.strategies) as Array<keyof typeof t.strategies>).map((strategy) => <option key={strategy} value={`strategy:${strategy}`}>{t.strategies[strategy]}</option>)}</optgroup><optgroup label={t.focusNames.claim}>{evidence.claims.map((claim) => <option key={claim.id} value={`claim:${claim.id}`}>{claim.title[locale]}</option>)}</optgroup></select></label><span><strong>{evidence.visibleRecords.length}</strong> {t.recordsShown}</span>{evidence.focus.type !== 'all' && <button type="button" onClick={() => evidence.setFocus({ type: 'all' })}>{t.clear}</button>}</div>
      <p className="tab-instruction">{t.selectRecord}</p>
      <div className="register-master-detail"><div className="evidence-row-list" role="list">{evidence.visibleRecords.map((record) => <button type="button" role="listitem" key={record.id} data-testid={`evidence-${record.id}`} className={selectedRecord?.id === record.id ? 'is-selected' : ''} aria-pressed={selectedRecord?.id === record.id} onClick={() => setSelectedRecordId(record.id)}><span className="evidence-record__id">{record.id}</span><div><strong>{record.title[locale]}</strong><small>{record.statement[locale]}</small></div><span className={`evidence-status evidence-status--${record.status}`}>{t.statuses[record.status]}</span></button>)}</div>{selectedRecord && <EvidenceDetail record={selectedRecord} locale={locale} />}</div>
    </section>}

    {tab === 'claims' && <section id="evidence-panel-claims" className="evidence-tabpanel" role="tabpanel" aria-labelledby="evidence-tab-claims"><header className="tabpanel-heading"><div><p className="kicker">02 / GATE</p><h3>{t.claims}</h3><p>{t.selectClaim}</p></div><div className="compact-zero"><strong>0</strong><span>{t.noValidated}</span></div></header><div className="claim-master-detail"><div className="claim-row-list" role="list">{evidence.claims.map((claim) => <button type="button" role="listitem" key={claim.id} data-testid={`claim-${claim.id}`} className={selectedClaim?.id === claim.id ? 'is-selected' : ''} aria-pressed={selectedClaim?.id === claim.id} onClick={() => setSelectedClaimId(claim.id)}><span>{claim.id}</span><strong>{claim.title[locale]}</strong><em className={`gate-state gate-state--${claim.status}`}>{t.gateStatuses[claim.status]}</em></button>)}</div>{selectedClaim && <ClaimDetail claim={selectedClaim} locale={locale} onTrace={() => openClaimEvidence(selectedClaim)} />}</div></section>}

    {tab === 'sources' && <section id="evidence-panel-sources" className="evidence-tabpanel" role="tabpanel" aria-labelledby="evidence-tab-sources"><header className="tabpanel-heading"><div><p className="kicker">03 / PROVENANCE</p><h3>{t.sources}</h3></div><span className="phase-chip">{evidence.sources.length}</span></header><div className="source-accordion-list">{evidence.sources.map((source) => <SourceItem key={source.id} source={source} locale={locale} />)}</div></section>}

    {tab === 'requests' && <section id="evidence-panel-requests" className="evidence-tabpanel" role="tabpanel" aria-labelledby="evidence-tab-requests"><header className="tabpanel-heading"><div><p className="kicker">04 / CLOSE THE GAPS</p><h3>{t.gaps}</h3><p>{t.selectOwner}</p></div></header><div className="request-owner-tabs" role="tablist" aria-label={t.gaps}>{owners.map((owner) => <button key={owner} type="button" role="tab" aria-selected={selectedOwner === owner} className={selectedOwner === owner ? 'is-active' : ''} onClick={() => setSelectedOwner(owner)}><strong>{t.owners[owner]}</strong><span>{ownerRequests.get(owner)?.size ?? 0}</span></button>)}</div><article className="selected-owner-requests"><p>{t.requestsFor}</p><h3>{t.owners[selectedOwner]}</h3><ul>{[...(ownerRequests.get(selectedOwner) ?? [])].map((request) => <li key={request}>{request}</li>)}</ul></article></section>}
  </section>;
}
