import type { Locale } from '../../app/types';
import { useLab } from './LabProvider';

type SymbolEntry = { symbol: string; es: string; en: string };

const symbols: SymbolEntry[] = [
  { symbol: 'E[·]', es: 'Valor medio calculado considerando todos los resultados posibles y sus probabilidades.', en: 'Probability-weighted average across all possible outcomes.' },
  { symbol: 'T', es: 'Tiempo necesario para volver a disponer de un módulo operativo (no solo tiempo de reparación).', en: 'Time until an operational module is available again (not just hands-on repair time).' },
  { symbol: 'q', es: 'Probabilidad de que reparar el módulo sea viable.', en: 'Probability that repairing the module is feasible.' },
  { symbol: 'I', es: 'Días necesarios para inspeccionar el módulo.', en: 'Days needed to inspect the module.' },
  { symbol: 'R', es: 'Días de ejecución de la reparación, si resulta viable.', en: 'Days to perform the repair, if it is feasible.' },
  { symbol: 'N', es: 'Plazo de entrega del módulo nuevo, sin retrasos imprevistos.', en: 'Delivery time of a new module without unexpected delays.' },
  { symbol: 'S', es: 'Días adicionales de retraso si el proveedor sufre una interrupción.', en: 'Extra delivery days if the supplier experiences a disruption.' },
  { symbol: 'p', es: 'Probabilidad general de interrupción del proveedor.', en: 'Overall probability of supplier disruption.' },
  { symbol: 'pₛ|¬q', es: 'Probabilidad de retraso del proveedor cuando la reparación NO es viable. Puede ser distinta de p si los riesgos están relacionados.', en: 'Probability of supplier disruption given that repair is NOT feasible. It may differ from p when the risks are linked.' },
  { symbol: 's', es: 'Estrategia que estamos evaluando (sustituir, reparar primero o ambas vías).', en: 'Strategy being evaluated (replace, repair first or both routes).' },
  { symbol: 'b', es: 'Cada resultado posible de esa estrategia, por ejemplo reparar con éxito o comprar tras fallar la reparación.', en: 'An individual possible outcome, such as successful repair or purchasing after repair fails.' },
  { symbol: 'P(b)', es: 'Probabilidad de que ocurra ese resultado b.', en: 'Probability of outcome b.' },
  { symbol: 'Cₛ', es: 'Desembolso medio estimado para la estrategia s.', en: 'Expected average cash outlay for strategy s.' },
  { symbol: 'Oᵦ', es: 'Suma de los gastos u obligaciones económicas de ese resultado b.', en: 'Total spending or contractual financial obligations in outcome b.' },
  { symbol: 'Aᵦ', es: 'Abonos o descuentos expresamente aplicables a ese resultado b.', en: 'Credits or discounts explicitly applicable to outcome b.' },
  { symbol: 'Tᵦ', es: 'Días necesarios para recuperar el módulo en el resultado b.', en: 'Days to recover the module under outcome b.' },
  { symbol: 'target', es: 'Plazo objetivo establecido para recuperar el módulo.', en: 'Target deadline for recovering the module.' },
  { symbol: 'j', es: 'Probabilidad de que ocurran a la vez una reparación viable y una interrupción del proveedor.', en: 'Probability that repair is feasible AND the supplier is disrupted.' },
  { symbol: 'Σ', es: 'Suma: combinar los valores de todos los resultados posibles.', en: 'Sum: add up the values across possible outcomes.' },
  { symbol: 'min / max', es: 'Menor / mayor de los valores indicados; sirve para fijar límites matemáticamente posibles.', en: 'Smaller / larger of the listed values; used to set mathematically valid bounds.' },
  { symbol: '≤ / ∈', es: 'Menor o igual que / pertenece al intervalo indicado.', en: 'Less than or equal to / falls within the given range.' },
];

const equations = [
  {
    es: '1. ¿Cuánto tardaremos, de media, si intentamos reparar primero?',
    en: '1. How long will recovery take on average if we try repair first?',
    equation: 'E[Trepair]',
    detailEs: 'Si se puede reparar, sumamos inspección y reparación. Si no, sumamos inspección y compra, incluyendo la posibilidad de un retraso del proveedor. Ponderamos las dos situaciones según su probabilidad.',
    detailEn: 'If repair is feasible, add inspection and repair time. Otherwise, add inspection and procurement time, including the possibility of a supplier delay. Weight both outcomes by their probabilities.',
  },
  {
    es: '2. ¿Cuánto dinero desembolsaremos de media?',
    en: '2. How much money will we spend on average?',
    equation: 'E[Cₛ]',
    detailEs: 'En cada resultado posible, sumamos los pagos y restamos únicamente los abonos que permite el contrato. Después multiplicamos por la probabilidad de ese resultado y sumamos todas las posibilidades.',
    detailEn: 'For each possible outcome, add payments and subtract only credits allowed by the contract. Multiply by the probability of that outcome and add across all outcomes.',
  },
  {
    es: '3. ¿Qué probabilidad hay de cumplir el plazo objetivo?',
    en: '3. What is the chance of meeting the target deadline?',
    equation: 'P(T≤target)',
    detailEs: 'Sumamos las probabilidades de todos los resultados en los que el módulo estaría operativo dentro del plazo objetivo.',
    detailEn: 'Add the probabilities of all outcomes where an operational module is available within the target deadline.',
  },
  {
    es: '4. ¿Qué combinaciones de riesgos son posibles?',
    en: '4. What combinations of risks are possible?',
    equation: 'j',
    detailEs: 'Calculamos el intervalo matemáticamente válido de probabilidad de que coincidan una reparación viable y un retraso del proveedor. No es una predicción de cuánto ocurrirá.',
    detailEn: 'Calculate the mathematically valid probability range for repair being feasible while the supplier is disrupted. This is not a prediction of how often it will happen.',
  },
] as const;

export function MethodLegend({ locale }: { locale: Locale }) {
  const lab = useLab();
  const es = locale === 'es';
  const n = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
  const scenario = lab.scenario;
  const current = [
    ['q', `${n(scenario.risks.repairFeasibilityProbability * 100)}%`],
    ['I', `${n(scenario.timing.inspectionDays)} ${es ? 'días' : 'days'}`],
    ['R', `${n(scenario.timing.repairExecutionDays)} ${es ? 'días' : 'days'}`],
    ['N', `${n(scenario.timing.newLeadDays)} ${es ? 'días' : 'days'}`],
    ['S', `${n(scenario.timing.supplierShockDelayDays)} ${es ? 'días' : 'days'}`],
    ['p', `${n(scenario.risks.supplierShockProbability * 100)}%`],
    ['target', `${n(scenario.timing.targetRecoveryDays)} ${es ? 'días' : 'days'}`],
  ];

  return <div className="method-explained" data-testid="method-legend">
    <p className="method-explained__intro">{es
      ? 'Las ecuaciones describen cómo funciona el modelo, no son datos reales de Airbus. Primero te explicamos para qué sirve cada una y después encontrarás el significado de cada símbolo.'
      : 'These equations describe how the model works; they are not real Airbus data. Here is what each one calculates, followed by a full explanation of its symbols.'}</p>
    <div className="method-explained__equations">
      <section>
        <h4>{equations[0][locale]}</h4>
        <div className="method-explained__math"><code>E[T<sub>reparar</sub>] = q·(I + R) + (1−q)·(I + N + p<sub>s|¬q</sub>·S)</code></div>
        <p>{es ? equations[0].detailEs : equations[0].detailEn}</p>
      </section>
      <section>
        <h4>{equations[1][locale]}</h4>
        <div className="method-explained__math"><code>E[C<sub>s</sub>] = Σ<sub>b</sub> P(b)·(O<sub>b</sub> − A<sub>b</sub>)</code></div>
        <p>{es ? equations[1].detailEs : equations[1].detailEn}</p>
      </section>
      <section>
        <h4>{equations[2][locale]}</h4>
        <div className="method-explained__math"><code>P(T ≤ target) = Σ<sub>b: Tᵦ ≤ target</sub> P(b)</code></div>
        <p>{es ? equations[2].detailEs : equations[2].detailEn}</p>
      </section>
      <section>
        <h4>{equations[3][locale]}</h4>
        <div className="method-explained__math"><code>j ∈ [max(0, q + p − 1), min(q, p)]</code></div>
        <p>{es ? equations[3].detailEs : equations[3].detailEn}</p>
      </section>
    </div>

    <div className="method-explained__key">
      <h4>{es ? 'Leyenda: qué significa cada letra y símbolo' : 'Legend: what each letter and symbol means'}</h4>
      <dl>{symbols.map((item) => <div key={item.symbol}>
        <dt>{item.symbol}</dt>
        <dd>{es ? item.es : item.en}</dd>
      </div>)}</dl>
    </div>
    <div className="method-explained__current">
      <h4>{es ? 'Valores actuales del caso ficticio DEMO-60' : 'Current values of fictional DEMO-60 case'}</h4>
      <p>{es ? 'Si modificas las condiciones, estos valores cambian automáticamente.' : 'These values update automatically when you change the assumptions.'}</p>
      <div>{current.map(([symbol, value]) => <span key={symbol}><strong>{symbol}</strong> = {value}</span>)}</div>
    </div>
    <p className="method-explained__warning">{es
      ? 'Nota: la ecuación del tiempo corresponde a «Reparar primero». Las estrategias «Sustituir» y «Paralela/mixta» tienen reglas de cálculo diferentes. Todas las probabilidades y duraciones son hipótesis inventadas para la demostración.'
      : 'Note: the time equation applies to «Repair first». «Replace» and «Parallel/mixed» use different calculation rules. All probabilities and durations are invented demonstration assumptions.'}</p>
  </div>;
}
