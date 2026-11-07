import { useEffect, useRef, useState } from 'react';
import type { Locale } from '../../app/types';
import type { ModelBranch, ScenarioInputs, ScenarioResult, StrategyId } from '../../domain';
import { useLab } from './LabProvider';

type Leaf = string | number | boolean;
type Modified = { key: string; initial: Leaf; current: Leaf; before: ScenarioResult | null };
type Snapshot = { scenario: ScenarioInputs; result: ScenarioResult | null };

function collectLeaves(value: unknown, prefix = ''): Record<string, Leaf> {
  const result: Record<string, Leaf> = {};
  if (typeof value !== 'object' || value === null) return result;
  for (const [key, item] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof item === 'number' || typeof item === 'string' || typeof item === 'boolean') result[path] = item;
    else if (item && typeof item === 'object') Object.assign(result, collectLeaves(item, path));
  }
  return result;
}

function changedInputs(before: ScenarioInputs, after: ScenarioInputs) {
  const left = collectLeaves(before);
  const right = collectLeaves(after);
  return Object.keys(right).filter((key) => left[key] !== right[key]).map((key) => ({
    key, initial: left[key], current: right[key],
  }));
}

function fmt(value: number, locale: Locale, decimals = 1) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: decimals }).format(value);
}
function cash(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

const namedInputs: Record<string, [string, string]> = {
  'risks.repairFeasibilityProbability': ['Viabilidad de reparación', 'Repair feasibility'],
  'risks.supplierShockProbability': ['Probabilidad de interrupción del proveedor', 'Supplier disruption probability'],
  'risks.dependence.mode': ['Relación entre riesgos', 'Relationship between risks'],
  'risks.dependence.repairFeasibleAndShockProbability': ['Probabilidad conjunta de ambos riesgos', 'Joint risk probability'],
  'timing.inspectionDays': ['Duración de la inspección', 'Inspection duration'],
  'timing.repairExecutionDays': ['Duración de la reparación', 'Repair work duration'],
  'timing.newLeadDays': ['Plazo del módulo nuevo', 'New-component lead time'],
  'timing.supplierShockDelayDays': ['Retraso adicional del proveedor', 'Extra supplier delay'],
  'timing.targetRecoveryDays': ['Plazo objetivo', 'Target deadline'],
  'costs.inspection': ['Coste de inspección', 'Inspection cost'],
  'costs.repair': ['Coste de reparación', 'Repair cost'],
  'costs.newPart': ['Precio de la pieza nueva', 'New-part price'],
  'costs.repairLogistics': ['Logística de reparación', 'Repair logistics'],
  'costs.newPartLogistics': ['Logística de pieza nueva', 'New-part logistics'],
  'costs.supplierShockSurcharge': ['Recargo por retraso', 'Delay surcharge'],
};
function inputLabel(key: string, locale: Locale) {
  return namedInputs[key]?.[locale === 'es' ? 0 : 1] ?? (locale === 'es' ? 'Condición del escenario' : 'Scenario assumption');
}
function formatLeaf(key: string, value: Leaf, locale: Locale) {
  if (typeof value !== 'number') return String(value);
  if (key.startsWith('risks.') && (key.toLowerCase().includes('probability') || key.includes('AndShock'))) return `${fmt(value * 100, locale)}%`;
  if (key.startsWith('timing.')) return `${fmt(value, locale)} ${locale === 'es' ? 'días' : 'days'}`;
  if (key.startsWith('costs.')) return cash(value, locale);
  if (key.toLowerCase().includes('fraction')) return `${fmt(value * 100, locale)}%`;
  return fmt(value, locale, 2);
}

type OutcomeGroup = { id: string; probability: number; time: number; cost: number; targetProbability: number };
function groupBranches(branches: ModelBranch[], chosen: StrategyId): OutcomeGroup[] {
  const map = new Map<string, { probability: number; weightedTime: number; weightedCost: number; deadline: number }>();
  for (const branch of branches) {
    const id = chosen === 'new'
      ? (branch.supplierShock ? 'supplierShock' : 'noShock')
      : chosen === 'repairFirst'
        ? (branch.repairFeasible ? 'repairYes' : 'repairNo')
        : (branch.pathOutcome === 'repair' ? 'repairWins' : branch.pathOutcome === 'new' ? 'newWins' : 'tied');
    const prev = map.get(id) ?? { probability: 0, weightedTime: 0, weightedCost: 0, deadline: 0 };
    prev.probability += branch.probability;
    prev.weightedTime += branch.probability * branch.recoveryDays;
    prev.weightedCost += branch.probability * branch.economics.totalCashOutlay;
    if (branch.targetMet) prev.deadline += branch.probability;
    map.set(id, prev);
  }
  const order = chosen === 'new'
    ? ['noShock', 'supplierShock']
    : chosen === 'repairFirst'
      ? ['repairYes', 'repairNo']
      : ['repairWins', 'newWins', 'tied'];
  return order.flatMap((id) => {
    const item = map.get(id);
    if (!item || item.probability <= 0) return [];
    return [{
      id, probability: item.probability,
      time: item.weightedTime / item.probability,
      cost: item.weightedCost / item.probability,
      targetProbability: item.deadline / item.probability,
    }];
  });
}

const names: Record<string, [string, string]> = {
  noShock: ['Proveedor sin interrupción', 'Supplier without disruption'],
  supplierShock: ['Proveedor con interrupción', 'Supplier disrupted'],
  repairYes: ['La reparación es viable', 'Repair is feasible'],
  repairNo: ['La reparación no es viable', 'Repair is not feasible'],
  repairWins: ['La vía de reparación termina primero', 'Repair route finishes first'],
  newWins: ['La vía de compra termina primero', 'New procurement finishes first'],
  tied: ['Ambas vías terminan a la vez', 'Both routes finish together'],
};

function cause(key: string, chosen: StrategyId, locale: Locale): string {
  const es = locale === 'es';
  if (key === 'risks.repairFeasibilityProbability') return chosen === 'new'
    ? (es ? 'Comprar una pieza nueva no depende de que la reparación sea viable; por eso ese cambio no afecta a esta opción.' : 'Buying new does not depend on repair feasibility, so this assumption does not change the selected route.')
    : (es
      ? 'Cambia el peso de dos posibilidades: recuperar la pieza mediante reparación o tener que comprar otra. Cuanto más probable es reparar, más influye la vía de reparación en el promedio.'
      : 'The weights of two possible outcomes change: recovering the part through repair or having to buy a replacement. The more likely repair is, the more strongly it influences the average.');
  if (key === 'timing.inspectionDays') return chosen === 'new'
    ? (es ? 'La compra directa no necesita inspeccionar antes el módulo. El plazo no cambia por esta variable.' : 'Direct procurement does not require this inspection first, so this input does not affect its recovery time.')
    : chosen === 'repairFirst'
      ? (es ? 'La inspección se hace siempre antes de reparar o pedir la pieza de sustitución. Cada día adicional de inspección añade un día a las dos posibilidades de recuperación.' : 'Inspection comes before either repair or backup procurement. Each extra inspection day adds one day to both recovery outcomes.')
      : (es ? 'La inspección retrasa la vía de reparación. Como la compra también está en marcha, el efecto depende de cuál de las dos vías termine primero.' : 'Inspection delays the repair route. Because procurement also runs, the effect depends on which route finishes first.');
  if (key === 'timing.repairExecutionDays') return chosen === 'new'
    ? (es ? 'La estrategia de compra no realiza la reparación; este cambio no afecta a su plazo.' : 'Direct procurement does not repair the part, so repair duration does not affect its timeline.')
    : chosen === 'parallel'
      ? (es ? 'Alargar la reparación puede hacer que la compra termine antes y cambie cuál de las dos vías recupera el módulo.' : 'Longer repair work can cause procurement to finish first, changing which route restores the component.')
      : (es ? 'Solo aumenta el tiempo de los casos en los que la reparación se realiza. Los casos en los que hay que comprar una pieza siguen otro plazo.' : 'It only increases the duration of outcomes where repair is carried out. Outcomes requiring a new purchase follow a different timeline.');
  if (key === 'timing.targetRecoveryDays') return es
    ? 'Cambiar la fecha objetivo modifica qué resultados llegan a tiempo, pero por sí solo no modifica el tiempo de recuperación ni los gastos.'
    : 'Changing the target changes which outcomes meet the deadline, but by itself does not change recovery duration or costs.';
  if (key === 'risks.supplierShockProbability' || key === 'timing.supplierShockDelayDays' || key === 'timing.newLeadDays') return es
    ? 'Cambia el riesgo o la duración de la vía de compra. Esto afecta al promedio según la frecuencia con que la estrategia necesita una pieza nueva.'
    : 'The risk or duration of procurement changes. The effect on the average depends on how often the chosen route needs a new component.';
  if (key.startsWith('costs.') || key.startsWith('parallel.')) return es
    ? 'Los pagos se calculan por cada resultado posible: inspección, reparación, compra y, cuando corresponda, compromisos contractuales. Solo se cobran los conceptos aplicables a cada caso.'
    : 'Spending is calculated separately for each possible outcome: inspection, repair, procurement and any applicable contractual commitments. Only relevant items are charged.';
  if (key.startsWith('risks.dependence')) return es
    ? 'Si dos riesgos están relacionados, cambian las probabilidades de que ocurran juntos. El modelo vuelve a ponderar todos los resultados posibles.'
    : 'When risks are related, the probability that both happen together changes. The model reweights all possible outcomes.';
  return es
    ? 'El modelo vuelve a calcular todos los resultados posibles y sus probabilidades utilizando la condición actualizada.'
    : 'The model recomputes every possible outcome and its probability with the updated assumption.';
}

export function ConditionImpactGuide({ locale, chosen, onOpenMethod }: {
  locale: Locale;
  chosen: StrategyId;
  onOpenMethod: () => void;
}) {
  const lab = useLab();
  const previous = useRef<Snapshot>({ scenario: lab.scenario, result: lab.result });
  const [modified, setModified] = useState<Modified | null>(null);
  const es = locale === 'es';
  const strategy = lab.result?.strategies[chosen];
  const groups = strategy ? groupBranches(strategy.branches, chosen) : [];

  useEffect(() => {
    const prior = previous.current;
    if (prior.scenario !== lab.scenario) {
      const changes = changedInputs(prior.scenario, lab.scenario);
      if (changes.length === 1) {
        const item = changes[0];
        setModified((last) => last?.key === item.key
          ? { ...last, current: item.current }
          : { key: item.key, initial: item.initial, current: item.current, before: prior.result });
      } else {
        setModified(null);
      }
    }
    previous.current = { scenario: lab.scenario, result: lab.result };
  }, [lab.scenario, lab.result]);

  const before = modified?.before?.strategies[chosen];
  const dayDelta = before && strategy ? strategy.expectedRecoveryDays - before.expectedRecoveryDays : null;
  const targetDelta = before && strategy ? (strategy.probabilityTargetMet - before.probabilityTargetMet) * 100 : null;
  const cashDelta = before && strategy ? strategy.expectedCashOutlay - before.expectedCashOutlay : null;
  const weighted = (key: 'time' | 'cost') => groups.map((g) =>
    `${fmt(g.probability * 100, locale, 1)}% × ${key === 'time' ? `${fmt(g.time, locale, 1)} ${es ? 'días' : 'days'}` : cash(g.cost, locale)}`
  ).join(' + ');
  const outcomeLabels = (id: string) => names[id]?.[es ? 0 : 1] ?? id;

  return <div className="condition-impact" data-testid="condition-impact" aria-live="polite">
    <section className="condition-impact__reason" aria-labelledby="condition-impact-title">
      <p className="kicker">{es ? 'QUÉ CAMBIA Y POR QUÉ' : 'WHAT CHANGED AND WHY'}</p>
      <h4 id="condition-impact-title">{es ? 'Entiende el efecto de tu cambio' : 'Understand the effect of your change'}</h4>
      {modified && before && strategy ? <>
        <p>{es ? 'Has cambiado' : 'You changed'} <strong>{inputLabel(modified.key, locale)}</strong>:
          {' '}{formatLeaf(modified.key, modified.initial, locale)}
          {' → '}{formatLeaf(modified.key, modified.current, locale)}.</p>
        <p>{cause(modified.key, chosen, locale)}</p>
        <div className="condition-impact__changes">
          <div><span>{es ? 'Tiempo medio' : 'Average recovery'}</span><strong>{fmt(before.expectedRecoveryDays, locale)} → {fmt(strategy.expectedRecoveryDays, locale)} {es ? 'días' : 'days'}</strong><small>{dayDelta === null || Math.abs(dayDelta) < .01 ? (es ? 'Sin cambios' : 'No change') : `${dayDelta > 0 ? '+' : '−'}${fmt(Math.abs(dayDelta), locale)} ${es ? 'días' : 'days'}`}</small></div>
          <div><span>{es ? 'Cumple el plazo' : 'Meets deadline'}</span><strong>{fmt(before.probabilityTargetMet * 100, locale)}% → {fmt(strategy.probabilityTargetMet * 100, locale)}%</strong><small>{targetDelta === null || Math.abs(targetDelta) < .01 ? (es ? 'Sin cambios' : 'No change') : `${targetDelta > 0 ? '+' : '−'}${fmt(Math.abs(targetDelta), locale)} ${es ? 'puntos' : 'points'}`}</small></div>
          <div><span>{es ? 'Desembolso medio' : 'Average spending'}</span><strong>{cash(before.expectedCashOutlay, locale)} → {cash(strategy.expectedCashOutlay, locale)}</strong><small>{cashDelta === null || Math.abs(cashDelta) < .5 ? (es ? 'Sin cambios' : 'No change') : `${cashDelta > 0 ? '+' : '−'}${cash(Math.abs(cashDelta), locale)}`}</small></div>
        </div>
      </> : <p>{es
        ? 'Modifica una sola condición a la izquierda. Aquí verás su valor anterior, el nuevo y por qué varían el plazo, la probabilidad de cumplir el objetivo o el gasto.'
        : 'Change one input on the left. Here you will see the previous and new values and why recovery time, deadline attainment or spending changed.'}</p>}
    </section>
    {strategy && <details className="condition-impact__breakdown" data-testid="condition-formula">
      <summary>{es ? '¿Cómo se obtienen exactamente estas cifras?' : 'How are these figures calculated?'}</summary>
      <div>
        <p>{es
          ? 'El modelo sigue un árbol de decisiones: calcula todos los resultados posibles y les asigna una probabilidad. La media se obtiene sumando probabilidad × resultado. No es una fórmula específica de Airbus ni una predicción comprobada.'
          : 'The model uses a decision tree: it calculates every possible outcome and assigns a probability. The average is the sum of probability × outcome. This is not an Airbus-specific formula or a verified prediction.'}</p>
        <div className="condition-impact__table-wrap">
          <table>
            <thead><tr>
              <th>{es ? 'Resultado posible' : 'Possible outcome'}</th>
              <th>{es ? 'Probabilidad' : 'Probability'}</th>
              <th>{es ? 'Recuperación media' : 'Average recovery'}</th>
              <th>{es ? 'Desembolso medio' : 'Average spending'}</th>
            </tr></thead>
            <tbody>{groups.map((g) => <tr key={g.id}>
              <td>{outcomeLabels(g.id)}</td>
              <td>{fmt(g.probability * 100, locale)}%</td>
              <td>{fmt(g.time, locale)} {es ? 'días' : 'days'}</td>
              <td>{cash(g.cost, locale)}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <p><strong>{es ? 'Tiempo medio:' : 'Average recovery time:'}</strong> {weighted('time')} = <strong>{fmt(strategy.expectedRecoveryDays, locale)} {es ? 'días' : 'days'}</strong>.</p>
        <p><strong>{es ? 'Probabilidad de cumplir el plazo:' : 'Chance of meeting the deadline:'}</strong> {es
          ? 'sumamos las probabilidades de los casos que recuperan el módulo antes del plazo objetivo'
          : 'sum the probabilities of outcomes that recover the module within the target deadline'} ({fmt(lab.scenario.timing.targetRecoveryDays, locale)} {es ? 'días' : 'days'}) = <strong>{fmt(strategy.probabilityTargetMet * 100, locale)}%</strong>.</p>
        <p><strong>{es ? 'Desembolso medio:' : 'Average spending:'}</strong> {weighted('cost')} = <strong>{cash(strategy.expectedCashOutlay, locale)}</strong>.</p>
        <p>{es
          ? 'Los importes de cada resultado se forman sumando los gastos que correspondan a esa vía; la compra simultánea puede incluir penalizaciones de cancelación. Si varias condiciones cambian a la vez, sus efectos pueden combinarse.'
          : 'Each outcome’s spending adds only the costs incurred on that route; running both routes may also include cancellation charges. Changing several inputs at once can produce combined effects.'}</p>
        <button type="button" onClick={onOpenMethod}>{es ? 'Ver las fórmulas y su leyenda' : 'See equations and symbol definitions'} →</button>
      </div>
    </details>}
  </div>;
}
