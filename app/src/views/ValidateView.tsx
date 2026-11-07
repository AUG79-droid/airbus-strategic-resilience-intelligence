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
  const material = (route !== 'new' ? lab.environmental?.[route].indicators.find((indicator) => indicator.id === 'virginMaterialDemandDeltaKg') : null);
  const firstSource = evidence.sources.find((source) => source.id === 'AIRBUS-MMS-01');

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
      <p className="kicker">{es ? 'PASO 3 · COMPROBEMOS LO QUE SABEMOS' : 'STEP 3 · CHECK WHAT WE KNOW'}</p>
      <h2 id="validation-simple-title">{es ? '¿Qué es real y qué hemos simulado?' : 'What is real, and what have we simulated?'}</h2>
      <p>{es
        ? 'Antes de compartir una conclusión, necesitamos distinguir los datos inventados de los cálculos y las fuentes reales. No tienes que revisar una auditoría ni completar formularios.'
        : 'Before sharing a conclusion, we need to distinguish invented inputs from model calculations and genuine sources. You do not need to perform an audit or complete any forms.'}</p>
    </header>

    <div className="validation-simple__three" aria-label={es ? 'Tres tipos de información' : 'Three kinds of information'}>
      <article>
        <span className="validation-simple__number">01</span>
        <h3>{es ? 'Datos inventados' : 'Invented data'}</h3>
        <p>{es
          ? 'El fallo del módulo, los tiempos, los precios, las probabilidades y los factores ambientales pertenecen al caso ficticio DEMO-60.'
          : 'The failed module, timings, prices, probabilities and environmental factors all belong to the fictional DEMO-60 case.'}</p>
        <div className="validation-simple__example">
          <strong>{format(lab.scenario.risks.repairFeasibilityProbability * 100)}%</strong>
          <span>{es ? 'Probabilidad de reparación supuesta, no observada' : 'Assumed repair feasibility, not observed data'}</span>
        </div>
      </article>
      <article>
        <span className="validation-simple__number">02</span>
        <h3>{es ? 'Resultados calculados' : 'Calculated results'}</h3>
        <p>{es
          ? 'El simulador utiliza esos datos para comparar las tres alternativas. Los resultados son matemáticos, pero siguen siendo ficticios.'
          : 'The simulator uses those assumptions to compare the three routes. The calculations are mathematical, but the outcomes remain fictional.'}</p>
        {result && <div className="validation-simple__example">
          <strong>{format(result.expectedRecoveryDays, 1)} {es ? 'días' : 'days'}</strong>
          <span>{es
            ? `Tiempo medio simulado para «${strategyNames.es[route]}» · ${euros(result.expectedCashOutlay)} de desembolso medio`
            : `Simulated average recovery for “${strategyNames.en[route]}” · ${euros(result.expectedCashOutlay)} average cash outlay`}</span>
        </div>}
      </article>
      <article>
        <span className="validation-simple__number">03</span>
        <h3>{es ? 'Información pública real' : 'Real public information'}</h3>
        <p>{es
          ? 'Airbus describe públicamente servicios de mantenimiento y reparación. Eso aporta contexto, pero NO demuestra los resultados de nuestro módulo ficticio.'
          : 'Airbus publicly describes maintenance and repair services. That provides context, but does NOT prove the outcomes for our fictional component.'}</p>
        {firstSource && <a href={firstSource.url} target="_blank" rel="noreferrer">{es ? 'Consultar la información pública de Airbus' : 'See Airbus public information'} ↗</a>}
      </article>
    </div>

    <section className="validation-simple__decision" aria-labelledby="validation-claim-question">
      <div>
        <p className="kicker">{es ? 'LA PREGUNTA IMPORTANTE' : 'THE IMPORTANT QUESTION'}</p>
        <h3 id="validation-claim-question">{es ? '¿Podemos presentar estas cifras como resultados reales de Airbus?' : 'Can we present these figures as real Airbus results?'}</h3>
      </div>
      <div className="validation-simple__decision-answer">
        <strong>{es ? 'No, todavía no.' : 'No, not yet.'}</strong>
        <p>{es
          ? 'Sí podemos decir: «Con datos inventados, el simulador muestra cómo comparar plazos, gastos e impactos ambientales». No podemos afirmar que Airbus haya conseguido estos ahorros ni que el módulo mejore la disponibilidad de una aeronave.'
          : 'We can say: “Using invented data, the simulator shows how to compare recovery times, spending and potential environmental effects.” We cannot claim Airbus has achieved these savings or that module recovery improves aircraft availability.'}</p>
        {material?.status === 'modelled' && material.value !== null && <small>{es
          ? `Por ejemplo, los ${format(Math.abs(material.value), 2)} kg de material virgen calculados en el escenario no son un ahorro real verificado.`
          : `For example, the ${format(Math.abs(material.value), 2)} kg of modelled virgin material in this scenario is not a verified real-world saving.`}</small>}
      </div>
    </section>

    <section className="validation-simple__next" aria-labelledby="validation-real-case-title">
      <header>
        <p className="kicker">{es ? 'SI QUISIÉRAMOS ESTUDIAR UN CASO REAL' : 'IF WE WANTED TO STUDY A REAL CASE'}</p>
        <h3 id="validation-real-case-title">{es ? '¿Qué tendríamos que comprobar?' : 'What would we need to verify?'}</h3>
        <p>{es
          ? 'No son tareas para ti ahora. Son ejemplos de la información necesaria antes de utilizar resultados reales.'
          : 'These are not tasks you need to complete now. They show the evidence a real project would require.'}</p>
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
          ? 'Esta es la documentación técnica que utiliza el prototipo para justificar de dónde procede cada afirmación. No hace falta leerla para continuar con el caso.'
          : 'This is the technical documentation used by the prototype to trace each statement. You do not need to read it to continue the case.'}</p>
        <TechnicalEvidenceView content={content} locale={locale} />
      </div>}
    </div>
  </section>;
}
