import { useMemo, useState } from 'react';
import type { Locale } from '../../app/types';
import type { EnvironmentalAssessment, ScenarioInputs, ScenarioResult, StrategyId } from '../../domain';
import type { ClaimGateResult, EvidenceAssumption, EvidenceModelOutput, EvidenceRecord, PublicSource } from '../evidence/types';
import type { AudienceId, StrategicTranslation } from '../translator/types';
import { downloadBytes, downloadText } from './download';
import { buildExportPackage, exportFilename, serialiseExportPackage, validateExportPackage } from './package';
import { PROTOTYPE_WARNING } from './types';

interface Props {
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
}

export function ExportReview(props: Props) {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const generatedAt = useMemo(() => new Date().toISOString(), [open]);
  const data = useMemo(() => buildExportPackage({ ...props, generatedAt }), [generatedAt, props]);
  const validation = useMemo(() => validateExportPackage(data), [data]);
  const es = props.locale === 'es';
  const blocked = props.claims.filter((claim) => claim.status === 'blocked').length;
  const rejected = props.claims.filter((claim) => claim.status === 'rejected').length;

  const downloadJson = () => {
    downloadText(serialiseExportPackage(data), exportFilename(data, 'json'), 'application/json');
    setMessage(es ? 'JSON reproducible generado.' : 'Reproducible JSON generated.');
  };
  const downloadPdf = async () => {
    setBusy(true);
    setMessage('');
    try {
      const { createProfessionalPdf } = await import('./pdf');
      const bytes = await createProfessionalPdf(data);
      downloadBytes(bytes, exportFilename(data, 'pdf'), 'application/pdf');
      setMessage(es ? 'Informe PDF generado.' : 'PDF report generated.');
    } catch (error) {
      setMessage(es ? `No se pudo generar: ${String(error)}` : `Could not generate: ${String(error)}`);
    } finally { setBusy(false); }
  };

  return <section className="export-review" aria-labelledby="export-review-title">
    <button className="export-review__trigger" type="button" data-testid="open-export-review" aria-expanded={open} onClick={() => { setOpen((value) => !value); setConfirmed(false); setMessage(''); }}>
      <span>06</span><div><strong>{es ? 'Revisar y exportar' : 'Review and export'}</strong><small>{es ? 'PDF editorial + paquete JSON reproducible' : 'Editorial PDF + reproducible JSON package'}</small></div><b>{open ? '−' : '+'}</b>
    </button>
    {open && <div className="export-review__panel">
      <header><div><p className="kicker">{es ? 'CONTROL PREVIO A LA EXPORTACIÓN' : 'PRE-EXPORT CONTROL'}</p><h3 id="export-review-title">{es ? 'Paquete de decisión' : 'Decision package'}</h3></div><strong>{PROTOTYPE_WARNING}</strong></header>
      <div className="export-review__summary">
        <dl><div><dt>{es ? 'Audiencia' : 'Audience'}</dt><dd>{props.audience}</dd></div><div><dt>{es ? 'Estrategia' : 'Strategy'}</dt><dd>{props.strategy}</dd></div><div><dt>{es ? 'Escenario' : 'Scenario'}</dt><dd>{props.scenarioLabel}</dd></div><div><dt>{es ? 'Conclusión' : 'Conclusion'}</dt><dd>{props.translation.conclusion}</dd></div></dl>
        <div className="export-review__gates"><span><strong>0</strong>{es ? 'beneficios validados' : 'validated benefits'}</span><span><strong>{blocked}</strong>{es ? 'afirmaciones bloqueadas' : 'blocked claims'}</span><span><strong>{rejected}</strong>{es ? 'afirmaciones rechazadas' : 'rejected claims'}</span></div>
      </div>
      <ul className="export-review__checks">{validation.checks.map((check) => <li key={check.id} className={check.passed ? 'is-pass' : 'is-fail'}><strong>{check.passed ? 'PASS' : 'FAIL'}</strong><span>{check.message}</span></li>)}</ul>
      <p className="export-review__contents">{es ? 'El PDF incluye resultados, hipótesis, cadena causal, evidencias, limitaciones, fuentes y conclusión por audiencia. El JSON incluye entradas, ramas, resultados, versión del modelo y estados de evidencia.' : 'The PDF includes results, assumptions, causal chain, evidence, limitations, sources and an audience-specific conclusion. The JSON includes inputs, branches, results, model version and evidence states.'}</p>
      <label className="export-review__confirm"><input type="checkbox" data-testid="export-confirm" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>{es ? 'Confirmo que se trata de un prototipo con datos ficticios y que las afirmaciones bloqueadas o rechazadas no son beneficios demostrados.' : 'I confirm this is a prototype using fictional data and that blocked or rejected claims are not demonstrated benefits.'}</span></label>
      <footer><button type="button" data-testid="download-pdf" disabled={!confirmed || !validation.safe || busy} onClick={downloadPdf}>{busy ? (es ? 'Generando…' : 'Generating…') : (es ? 'Descargar PDF' : 'Download PDF')}</button><button type="button" data-testid="download-json" disabled={!confirmed || !validation.safe || busy} onClick={downloadJson}>{es ? 'Descargar JSON' : 'Download JSON'}</button>{message && <output aria-live="polite">{message}</output>}</footer>
    </div>}
  </section>;
}
