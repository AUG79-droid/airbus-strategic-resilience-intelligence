import { useMemo, useState } from 'react';
import type { Locale } from '../../app/types';
import type { EnvironmentalAssessment, ScenarioInputs, ScenarioResult, StrategyId } from '../../domain';
import type { ClaimGateResult, EvidenceAssumption, EvidenceModelOutput, EvidenceRecord, PublicSource } from '../evidence/types';
import type { AudienceId, StrategicTranslation } from '../translator/types';
import { downloadBytes, downloadText } from './download';
import { buildExportPackage, exportFilename, serialiseExportPackage, validateExportPackage } from './package';
import { translatorCopy } from '../translator/copy';

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
  const t = translatorCopy(props.locale);
  const pendingEvidence = props.claims.some((claim) => claim.status !== 'allowedContext');
  const checkLabels: Record<string, [string, string]> = {
    'prototype-warning': ['Identificación del prototipo', 'Prototype identification'],
    'model-version': ['Versión del modelo', 'Model version'],
    'validated-benefits': ['Alcance de las conclusiones', 'Conclusion scope'],
    'claim-gating': ['Limitaciones de las afirmaciones', 'Claim limitations'],
    'reproducible-inputs': ['Datos y cálculos incluidos', 'Inputs and calculations included'],
  };

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
      <span>06</span><div><strong>{es ? 'Revisar y exportar' : 'Review and export'}</strong><small>{es ? 'Informe PDF y archivo de datos JSON' : 'PDF report and JSON data file'}</small></div><b>{open ? '−' : '+'}</b>
    </button>
    {open && <div className="export-review__panel">
      <header><div><p className="kicker">{es ? 'REVISIÓN DEL INFORME' : 'REPORT REVIEW'}</p><h3 id="export-review-title">{es ? 'Informe de decisión' : 'Decision report'}</h3></div><strong>{es ? 'PROTOTIPO · SIN VALIDACIÓN INTERNA' : 'PROTOTYPE · NOT INTERNALLY VALIDATED'}</strong></header>

      <div className="export-review__summary export-review__summary--simple">
        <dl>
          <div><dt>{es ? 'Destinatario' : 'Audience'}</dt><dd>{t.audiences[props.audience]}</dd></div>
          <div><dt>{es ? 'Estrategia seleccionada' : 'Selected strategy'}</dt><dd>{t.strategies[props.strategy]}</dd></div>
          <div><dt>{es ? 'Escenario' : 'Scenario'}</dt><dd>{props.scenarioLabel}</dd></div>
          <div><dt>{es ? 'Resultado del análisis' : 'Analytical result'}</dt><dd>{t.conclusions[props.translation.conclusion]}</dd></div>
        </dl>
      </div>

      <section className="export-review__scope" aria-label={es ? 'Alcance de los resultados' : 'Scope of results'}>
        <div>
          <strong>{es ? 'Qué muestra el informe' : 'What the report shows'}</strong>
          <p>{es
            ? 'La comparación de las alternativas, sus resultados y las condiciones que explican la decisión.'
            : 'A comparison of the available routes, their outcomes and the assumptions behind the decision.'}</p>
        </div>
        <div>
          <strong>{es ? 'Qué falta demostrar' : 'What still requires evidence'}</strong>
          <p>{pendingEvidence
            ? (es
              ? 'Las ventajas ambientales, económicas u operativas identificadas por el modelo necesitan datos contrastados antes de presentarse como beneficios reales.'
              : 'Environmental, financial or operational advantages identified by the model need verified data before they can be presented as real-world benefits.')
            : (es
              ? 'Consulta el alcance y las limitaciones de cada evidencia antes de comunicar conclusiones.'
              : 'Review the scope and limitations of each item of evidence before presenting conclusions.')}</p>
        </div>
      </section>

      <div className={`export-review__readiness ${validation.safe ? 'is-ready' : 'is-blocked'}`} role="status">
        <strong>{validation.safe
          ? (es ? 'El informe está preparado para descargarse.' : 'The report is ready to download.')
          : (es ? 'Falta resolver una comprobación antes de descargar.' : 'A check must be resolved before downloading.')}</strong>
        <span>{es
          ? 'Se han revisado automáticamente el formato, los datos incluidos y las advertencias. Esto no equivale a validar los resultados.'
          : 'The file format, included data and warnings have been checked automatically. This does not validate the results.'}</span>
      </div>

      <details className="export-review__technical">
        <summary>{es ? 'Ver comprobaciones técnicas (opcional)' : 'View technical checks (optional)'}</summary>
        <ul>{validation.checks.map((check) => <li key={check.id}>
          <strong>{check.passed ? (es ? 'Correcto' : 'Passed') : (es ? 'Revisar' : 'Review')}</strong>
          <span>{checkLabels[check.id]?.[es ? 0 : 1] ?? check.id}</span>
        </li>)}</ul>
      </details>

      <p className="export-review__contents">{es
        ? 'El PDF contiene el análisis y sus conclusiones, fuentes y limitaciones. El JSON guarda los datos y cálculos para reproducir el ejercicio.'
        : 'The PDF contains the analysis, conclusions, sources and limitations. The JSON file saves the data and calculations so the exercise can be reproduced.'}</p>
      <label className="export-review__confirm"><input type="checkbox" data-testid="export-confirm" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>{es
        ? 'He revisado el alcance del informe y entiendo que los resultados dependen de la calidad y validación de los datos empleados.'
        : 'I have reviewed the scope of this report and understand that the results depend on the quality and validation of its inputs.'}</span></label>
      <footer><button type="button" data-testid="download-pdf" disabled={!confirmed || !validation.safe || busy} onClick={downloadPdf}>{busy ? (es ? 'Generando…' : 'Generating…') : (es ? 'Descargar PDF' : 'Download PDF')}</button><button type="button" data-testid="download-json" disabled={!confirmed || !validation.safe || busy} onClick={downloadJson}>{es ? 'Descargar JSON' : 'Download JSON'}</button>{message && <output aria-live="polite">{message}</output>}</footer>
    </div>}
  </section>;
}
