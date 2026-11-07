import { useEffect, useState } from 'react';
import type { Locale } from '../app/types';
import type { Copy } from '../content/i18n';
import type { StrategyId } from '../domain';
import { useEvidence } from '../features/evidence/EvidenceProvider';
import { useLab } from '../features/lab/LabProvider';
import { TechnicalEvidenceView } from './TechnicalEvidenceView';

interface ViewProps { content: Copy; locale: Locale; chosen: StrategyId | null; }

const strategyNames: Record<Locale, Record<StrategyId, string>> = {
  es: { new: 'Sustituir', repairFirst: 'Reparar primero', parallel: 'Paralela / mixta' },
  en: { new: 'Replace', repairFirst: 'Repair first', parallel: 'Parallel / mixed' },
};

export function ValidateView({ content, locale, chosen }: ViewProps) {
  const es = locale === 'es';
  const lab = useLab();
  const evidence = useEvidence();
  const openFromEvidence = Boolean(window.history.state?.asriOpenEvidence && evidence.focus.type !== 'all');
  const [advancedOpen, setAdvancedOpen] = useState(openFromEvidence);
  const route = chosen ?? 'repairFirst';
  const result = lab.result?.strategies[route];
  const format = (value: number, decimals = 0) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: decimals }).format(value);
  const euros = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  const supportedClaims = evidence.claims.filter((claim) => claim.status === 'allowedContext');
  const unverifiedClaims = evidence.claims.filter((claim) => claim.status !== 'allowedContext');
  const highlights = ([
    { status: 'documentedFact', label: es ? 'Con respaldo documental' : 'Documented', record: evidence.records.find((item) => item.status === 'documentedFact' && item.strategyIds.includes(route)) ?? evidence.records.find((item) => item.status === 'documentedFact') },
    { status: 'hypothesis', label: es ? 'Por contrastar' : 'To be verified', record: evidence.records.find((item) => item.status === 'hypothesis' && item.strategyIds.includes(route)) ?? evidence.records.find((item) => item.status === 'hypothesis') },
    { status: 'modelledExample', label: es ? 'Resultado calculado' : 'Model output', record: evidence.records.find((item) => item.status === 'modelledExample' && item.strategyIds.includes(route)) ?? evidence.records.find((item) => item.status === 'modelledExample') },
  ] as const);

  useEffect(() => {
    if (!openFromEvidence) return;
    const frame = window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() =>
        document.getElementById('technical-evidence')?.scrollIntoView({ behavior: 'auto', block: 'start' })
      )
    );
    return () => window.cancelAnimationFrame(frame);
  }, [openFromEvidence]);

  return <section className="validation-simple" data-testid="validate-simple" aria-labelledby="validation-simple-title">
    <header className="validation-simple__header">
      <p className="kicker">{es ? 'PASO 3 · REVISIÓN DE EVIDENCIAS' : 'STEP 3 · EVIDENCE REVIEW'}</p>
      <h2 id="validation-simple-title">{es ? '¿En qué se apoya nuestra decisión?' : 'What supports our decision?'}</h2>
      <p>{es
        ? 'Una decisión puede estar bien calculada y, aun así, necesitar evidencias para demostrar sus beneficios. Aquí distinguimos las fuentes disponibles, los supuestos por confirmar y los resultados del análisis.'
        : 'A decision can be calculated correctly and still require evidence before its benefits can be demonstrated. Here we review available sources, assumptions to confirm, and analytical results.'}</p>
    </header>

    <section className="validation-review" aria-labelledby="validation-evidence-heading">
      <header className="validation-review__heading">
        <div>
          <p className="kicker">{es ? 'REGISTRO RESUMIDO' : 'EVIDENCE AT A GLANCE'}</p>
          <h3 id="validation-evidence-heading">{es ? 'Evidencias principales' : 'Key evidence'}</h3>
        </div>
        <span>{es ? 'Consulta la trazabilidad completa al final de la página' : 'Full traceability is available below'}</span>
      </header>
      <div className="validation-review__records">
        {highlights.map((entry) => <article key={entry.status} className="validation-review__record">
          <div className="validation-review__record-type">
            <span className={`validation-review__marker validation-review__marker--${entry.status}`} />
            <strong>{entry.label}</strong>
          </div>
          <div className="validation-review__record-copy">
            {entry.status === 'modelledExample' && result
              ? <>
                <h4>{es ? `Resultado de «${strategyNames.es[route]}»` : `“${strategyNames.en[route]}” outcome`}</h4>
                <p>{es
                  ? `Tiempo medio para recuperar el módulo: ${format(result.expectedRecoveryDays, 1)} días. Desembolso medio estimado: ${euros(result.expectedCashOutlay)}. Son resultados calculados con los datos disponibles, no pruebas independientes de un beneficio.`
                  : `Average module recovery: ${format(result.expectedRecoveryDays, 1)} days. Expected spending: ${euros(result.expectedCashOutlay)}. These are results computed from the available inputs, not independent evidence of a benefit.`}</p>
              </>
              : entry.record
                ? <>
                  <h4>{entry.record.title[locale]}</h4>
                  <p>{entry.status === 'hypothesis'
                    ? (es
                      ? 'Este punto influye en la comparación, pero necesita datos contrastados para convertirse en una conclusión respaldada.'
                      : 'This assumption affects the comparison but requires supporting observations before it can become an evidenced conclusion.')
                    : entry.record.statement[locale]}</p>
                  {entry.status === 'documentedFact' && entry.record.sourceIds.length > 0 && <span className="validation-review__source">{es ? 'Fuente pública disponible' : 'Public source available'}</span>}
                </>
                : <p>{es ? 'No hay registros de esta categoría.' : 'No entries in this category.'}</p>}
          </div>
        </article>)}
      </div>
    </section>

    <section className="validation-conclusions" aria-labelledby="validation-conclusions-title">
      <header>
        <p className="kicker">{es ? 'CONCLUSIONES Y RESPALDO' : 'CONCLUSIONS AND EVIDENCE'}</p>
        <h3 id="validation-conclusions-title">{es ? '¿Qué podemos afirmar con lo que tenemos?' : 'What can we conclude from what we have?'}</h3>
      </header>
      <div className="validation-conclusions__grid">
        <div>
          <strong>{es ? 'Con respaldo disponible' : 'Supported by available evidence'}</strong>
          {supportedClaims.length > 0
            ? supportedClaims.map((claim) => <p key={claim.id}>{claim.proposedClaim[locale]}</p>)
            : <p>{es ? 'Todavía no hay afirmaciones respaldadas.' : 'No supported statements are available yet.'}</p>}
        </div>
        <div>
          <strong>{es ? 'Pendiente de demostrar' : 'Still to be demonstrated'}</strong>
          <p>{unverifiedClaims.length > 0
            ? (es
              ? 'Los beneficios ambientales, operativos o estratégicos calculados todavía necesitan evidencias específicas antes de presentarse como resultados demostrados.'
              : 'Calculated environmental, operational or strategic benefits still need case-specific evidence before they can be presented as demonstrated outcomes.')
            : (es
              ? 'Las afirmaciones revisadas cuentan con el respaldo que exige el análisis actual. Comprueba su alcance en la documentación técnica.'
              : 'The reviewed statements meet the current evidence criteria. Check their scope in the technical documentation.')}</p>
        </div>
      </div>
    </section>

    <section className="validation-simple__next" aria-labelledby="validation-real-case-title">
      <header>
        <p className="kicker">{es ? 'DATOS Y COMPROBACIONES PENDIENTES' : 'DATA AND CHECKS STILL NEEDED'}</p>
        <h3 id="validation-real-case-title">{es ? '¿Qué tendríamos que comprobar?' : 'What would we need to verify?'}</h3>
        <p>{es
          ? 'Para reforzar las conclusiones, cada área tendría que confirmar la información que le corresponde. La lista también sirve para preparar un análisis con datos reales.'
          : 'To strengthen the conclusions, each team would need to confirm its own information. This checklist also works when the model uses real-world data.'}</p>
      </header>
      <div className="validation-simple__checks">
        {[
          { es: 'Equipo técnico', en: 'Engineering team', esCopy: '¿Puede repararse ese módulo de forma aprobada? ¿Cuánto tarda y cuánto duraría en servicio?', enCopy: 'Is repair approved for this component? How long does it take, and how much additional service life is approved?' },
          { es: 'Compras', en: 'Procurement', esCopy: '¿Qué plazos y precios reales tiene el proveedor? ¿Qué gastos generaría cancelar un pedido?', enCopy: 'What are the supplier’s actual lead times and prices? What cancellation charges apply?' },
          { es: 'Medioambiente', en: 'Environment', esCopy: '¿Qué materiales, residuos y emisiones se producen realmente, con qué límites de comparación?', enCopy: 'What material, waste and emissions data can actually be measured, and within what comparison boundary?' },
          { es: 'Responsables del programa', en: 'Programme leads', esCopy: '¿Cómo afecta la recuperación de esa pieza a un resultado operativo medible, sin confundirlo con disponibilidad de flota?', enCopy: 'How does component recovery relate to a measurable operational outcome, without confusing it with fleet availability?' },
        ].map((item, index) => <article key={item.en}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <h4>{es ? item.es : item.en}</h4>
          <p>{es ? item.esCopy : item.enCopy}</p>
        </article>)}
      </div>
    </section>

    <div className="validation-simple__technical">
      <button type="button" data-testid="validate-advanced-toggle" aria-expanded={advancedOpen} aria-controls="technical-evidence" onClick={() => setAdvancedOpen((value) => !value)}>
        <span>
          <strong>{es ? 'Ver documentación y comprobaciones técnicas' : 'View technical documentation and checks'}</strong>
          <small>{es ? 'Opcional · fuentes, registros y criterios de validación' : 'Optional · sources, records and validation criteria'}</small>
        </span>
        <span aria-hidden="true">{advancedOpen ? '−' : '+'}</span>
      </button>
      {advancedOpen && <div id="technical-evidence" className="validation-simple__technical-content">
        <p>{es
          ? 'Aquí puedes consultar los registros completos, fuentes, supuestos y criterios de validación cuando necesites más detalle.'
          : 'Here you can review the full records, sources, assumptions and validation criteria whenever you need more detail.'}</p>
        <TechnicalEvidenceView content={content} locale={locale} />
      </div>}
    </div>
  </section>;
}
