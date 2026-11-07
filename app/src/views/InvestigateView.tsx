import type { Locale } from '../app/types';
import type { Copy } from '../content/i18n';
import { useLab } from '../features/lab/LabProvider';

interface ViewProps {
  content: Copy;
  locale: Locale;
  onNext: () => void;
}

export function InvestigateView({ content: _content, locale, onNext }: ViewProps) {
  const lab = useLab();
  const es = locale === 'es';
  const scenario = lab.scenario;
  const number = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
  const alternatives = es
    ? [
        { title: 'Comprar una nueva', detail: 'Pedir el módulo al proveedor y asumir su plazo y riesgo de interrupción.' },
        { title: 'Reparar primero', detail: 'Inspeccionar el módulo actual, repararlo si es viable y comprar otro si falla.' },
        { title: 'Iniciar ambas vías', detail: 'Arrancar reparación y compra a la vez, con posibles penalizaciones.' },
      ]
    : [
        { title: 'Buy a new one', detail: 'Order a new control module and accept supplier lead-time and disruption risk.' },
        { title: 'Repair first', detail: 'Inspect and repair the existing module, ordering a new one if repair is not viable.' },
        { title: 'Start both routes', detail: 'Begin repair and procurement together, with possible cancellation costs.' },
      ];
  const facts = [
    { value: `${number(scenario.timing.targetRecoveryDays)}`, unit: es ? 'días' : 'days', label: es ? 'Plazo objetivo de recuperación' : 'Target recovery deadline' },
    { value: `${number(scenario.timing.newLeadDays)}`, unit: es ? 'días' : 'days', label: es ? 'Entrega de una pieza nueva, sin retrasos' : 'New-part lead time, without disruption' },
    { value: `${number(scenario.timing.inspectionDays + scenario.timing.repairExecutionDays)}`, unit: es ? 'días' : 'days', label: es ? 'Inspección y reparación, si es viable' : 'Inspection and repair, if feasible' },
    { value: `${number(scenario.risks.repairFeasibilityProbability * 100)}%`, unit: '', label: es ? 'Probabilidad supuesta de poder reparar' : 'Assumed chance that repair is feasible' },
    { value: `${number(scenario.risks.supplierShockProbability * 100)}%`, unit: '', label: es ? 'Riesgo supuesto de disrupción del proveedor' : 'Assumed supplier disruption probability' },
  ];

  return (
    <section className="case-start" aria-labelledby="case-start-title">
      <header className="case-start__header">
        <p className="kicker">{es ? 'DEMO-60 · HISTORIA Y DATOS INVENTADOS' : 'DEMO-60 · INVENTED STORY AND DATA'}</p>
        <h2 id="case-start-title">{es
          ? 'Un banco de ensayos aeroespacial pierde su módulo de control'
          : 'An aerospace test bench loses its control module'}</h2>
        <p>{es
          ? 'En un centro ficticio de mantenimiento aeroespacial, falla el módulo electrónico que controla un banco de ensayos. El equipo debe recuperar un módulo operativo antes de su fecha objetivo. La compra nueva depende de una cadena de suministro vulnerable; la reparación podría ser más rápida y reducir nueva fabricación, pero puede fallar.'
          : 'At a fictional aerospace maintenance centre, the electronic controller for a test bench fails. The team must recover a working module before its target deadline. Buying new depends on a vulnerable supply chain; repair might be faster and limit new manufacture, but it may fail.'}</p>
        <p className="case-start__scope">{es
          ? 'Esta simulación solo calcula la recuperación del módulo: no mide disponibilidad del banco, aeronaves, flotas ni misiones.'
          : 'The simulation models module recovery only: not test-bench availability, aircraft readiness, fleet or mission availability.'}</p>
      </header>

      <div className="case-start__facts">
        <p className="kicker">{es ? 'LOS DATOS DEL ESCENARIO ACTUAL · TODOS FICTICIOS' : 'CURRENT SCENARIO DATA · ALL FICTIONAL'}</p>
        <div className="case-start__fact-grid">
          {facts.map((fact) => <div key={fact.label}><strong>{fact.value}<small> {fact.unit}</small></strong><span>{fact.label}</span></div>)}
        </div>
        <p className="case-start__assumption">{es
          ? `Si hay disrupción, el proveedor puede acumular ${number(scenario.timing.supplierShockDelayDays)} días adicionales. Los plazos, probabilidades, costes y condiciones contractuales son hipótesis inventadas para demostrar el funcionamiento.`
          : `A disruption may add ${number(scenario.timing.supplierShockDelayDays)} days to the supplier lead time. Timings, probabilities, costs and contract terms are invented assumptions for demonstration.`}</p>
      </div>

      <div className="case-start__alternatives">
        <p className="kicker">{es ? 'TÚ DECIDES CÓMO RECUPERARLO' : 'YOU DECIDE HOW TO RECOVER IT'}</p>
        <div className="case-start__options">
          {alternatives.map((option, index) => <article key={option.title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{option.title}</h3><p>{option.detail}</p>
          </article>)}
        </div>
      </div>

      <div className="case-start__decision">
        <div>
          <p className="kicker">{es ? 'QUÉ DEMOSTRAMOS CON EL EJEMPLO' : 'WHAT THIS EXAMPLE EXPLORES'}</p>
          <p>{es
            ? 'Si la reparación evita una compra nueva, podría reducir el uso de materiales y la dependencia del proveedor a la vez. El modelo compara las tres vías en tiempo, coste y riesgo; los indicadores ambientales también usan factores ficticios. Las ventajas calculadas no son resultados reales ni beneficios validados.'
            : 'Repair might reduce both new-material demand and supplier dependency if it avoids new manufacture. The model compares all three routes on time, cost and risk; environmental indicators also use fictional factors. Calculated advantages are not actual or validated benefits.'}</p>
          <p className="case-start__disclaimer">{es
            ? 'Centro, módulo, situación, cifras y factores: 100 % ficticios. Ningún dato corresponde a Airbus ni a un cliente real.'
            : 'Facility, module, events, figures and factors: 100% fictional. No figures belong to Airbus or a real customer.'}</p>
        </div>
        <div className="case-start__action">
          <strong>{es ? 'Tu siguiente paso' : 'Your next step'}</strong>
          <p>{es
            ? 'Elige una de las tres alternativas. Verás sus resultados simulados y podrás comprobar si la decisión resiste otros escenarios.'
            : 'Choose one of the three routes. Review the simulated outcomes, then see whether your decision holds under other scenarios.'}</p>
          <button type="button" data-testid="start-comparison" onClick={onNext}>
            {es ? 'Tomar una decisión' : 'Make a decision'} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
