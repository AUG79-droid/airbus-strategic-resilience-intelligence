import type { Locale } from '../../app/types';
import type { StrategyId } from '../../domain';
import { useLab } from './LabProvider';
import { labCopy } from './copy';
import { useEvidence } from '../evidence/EvidenceProvider';

const options: StrategyId[] = ['new', 'repairFirst', 'parallel'];

function fmt(value: number, locale: Locale, decimals = 0): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: decimals }).format(value);
}

function currency(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

type Panel = 'parameters' | 'technical' | null;

function comparisonText(
  choice: { expectedRecoveryDays: number; expectedCashOutlay: number; probabilityTargetMet: number },
  other: { expectedRecoveryDays: number; expectedCashOutlay: number; probabilityTargetMet: number },
  otherName: string,
  locale: Locale,
): string {
  const es = locale === 'es';
  const time = choice.expectedRecoveryDays - other.expectedRecoveryDays;
  const cash = choice.expectedCashOutlay - other.expectedCashOutlay;
  const deadline = (choice.probabilityTargetMet - other.probabilityTargetMet) * 100;
  const days = Math.abs(time);
  const timePart = days < .05 ? (es ? 'tarda lo mismo' : 'takes the same time')
    : es
      ? `tarda ${fmt(days, locale, 1)} días ${time < 0 ? 'menos' : 'más'}`
      : `takes ${fmt(days, locale, 1)} ${time < 0 ? 'fewer' : 'more'} days`;
  const costPart = Math.abs(cash) < .5 ? (es ? 'cuesta lo mismo' : 'costs the same')
    : es
      ? `cuesta ${currency(Math.abs(cash), locale)} ${cash < 0 ? 'menos' : 'más'}`
      : `costs ${currency(Math.abs(cash), locale)} ${cash < 0 ? 'less' : 'more'}`;
  const probabilityPart = Math.abs(deadline) < .05
    ? (es ? 'tiene la misma probabilidad de cumplir el plazo' : 'has the same deadline attainment probability')
    : es
      ? `tiene ${fmt(Math.abs(deadline), locale, 1)} puntos porcentuales ${deadline > 0 ? 'más' : 'menos'} de probabilidad de cumplir el plazo`
      : `has a ${fmt(Math.abs(deadline), locale, 1)} percentage-point ${deadline > 0 ? 'higher' : 'lower'} chance of meeting the deadline`;
  return es
    ? `Frente a ${otherName}, tu elección ${timePart}, ${costPart} y ${probabilityPart}.`
    : `Compared with ${otherName}, your choice ${timePart}, ${costPart}, and ${probabilityPart}.`;
}

export function DecisionDesk({ locale, chosen, onChoose, activePanel, onPanel }: {
  locale: Locale;
  chosen: StrategyId | null;
  onChoose: (strategy: StrategyId) => void;
  activePanel: Panel;
  onPanel: (panel: Exclude<Panel, null>) => void;
}) {
  const lab = useLab();
  const evidence = useEvidence();
  const t = labCopy(locale);
  const es = locale === 'es';
  const current = chosen && lab.result ? lab.result.strategies[chosen] : null;
  const conditionalMean = (feasible: boolean) => {
    if (!current) return null;
    const branches = current.branches.filter((branch) => branch.repairFeasible === feasible);
    const probability = branches.reduce((sum, branch) => sum + branch.probability, 0);
    return probability > 0
      ? branches.reduce((sum, branch) => sum + branch.probability * branch.recoveryDays, 0) / probability
      : null;
  };
  const repairSuccessDays = chosen === 'repairFirst' ? conditionalMean(true) : null;
  const repairFailureDays = chosen === 'repairFirst' ? conditionalMean(false) : null;
  const environmental = chosen === 'repairFirst' || chosen === 'parallel' ? lab.environmental?.[chosen] : null;
  const circularityIndicators = ([
    ['virginMaterialDemandDeltaKg', es ? 'Material virgen' : 'Virgin material'],
    ['wasteGeneratedDeltaKg', es ? 'Residuos' : 'Waste'],
    ['boundedGhgDeltaKgCo2e', es ? 'GEI parciales' : 'Partial GHG'],
  ] as const).map(([id, label]) => ({ id, label, result: environmental?.indicators.find((item) => item.id === id) }));
  const dominatedBy = current && lab.result ? options.filter((option) => {
    if (option === chosen) return false;
    const alternative = lab.result!.strategies[option];
    return alternative.expectedRecoveryDays <= current.expectedRecoveryDays + .05
      && alternative.expectedCashOutlay <= current.expectedCashOutlay + .5
      && alternative.probabilityTargetMet >= current.probabilityTargetMet - .0005
      && (alternative.expectedRecoveryDays < current.expectedRecoveryDays - .05
        || alternative.expectedCashOutlay < current.expectedCashOutlay - .5
        || alternative.probabilityTargetMet > current.probabilityTargetMet + .0005);
  }) : [];

  return <section className="decision-desk" data-testid="decision-desk" aria-labelledby="decision-desk-heading">
    <header className="decision-desk__intro">
      <p className="kicker">{es ? 'TU DECISIÓN · NO HAY RESPUESTA PREDETERMINADA' : 'YOUR DECISION · NO PRESET RIGHT ANSWER'}</p>
      <h3 id="decision-desk-heading">{es ? '¿Qué harías para recuperar la pieza?' : 'How would you recover the component?'}</h3>
      <p>{es
        ? 'Eres responsable de recuperar un componente antes de la fecha objetivo. Elige una alternativa. La aplicación calculará qué ocurriría con los datos del escenario seleccionado.'
        : 'You need to recover an aerospace component before the target date. Choose a route. The model will calculate what happens under the selected scenario.'}</p>
    </header>
    <div className="decision-desk__options" role="group" aria-label={es ? 'Elige una estrategia' : 'Choose a strategy'}>
      {options.map((option, i) => <button
        type="button"
        key={option}
        data-testid={`decision-choice-${option}`}
        className={`decision-desk__option${chosen === option ? ' is-selected' : ''}`}
        onClick={() => onChoose(option)}
        aria-pressed={chosen === option}
      >
        <span>0{i + 1}</span><strong>{t.strategies[option]}</strong>
        <small>{es
          ? (option === 'new' ? 'Comprar una nueva' : option === 'repairFirst' ? 'Intentar reparar antes de comprar' : 'Activar reparación y compra')
          : (option === 'new' ? 'Order a new part' : option === 'repairFirst' ? 'Try repair before purchasing' : 'Start both routes')}</small>
      </button>)}
    </div>
    {current && lab.result ? <div className="decision-desk__feedback" data-testid="decision-feedback" aria-live="polite">
      <p className="kicker">{es ? 'ESTO SUCEDERÍA EN EL ESCENARIO SELECCIONADO' : 'THIS IS WHAT THE SELECTED SCENARIO PREDICTS'}</p>
      <h4>{t.strategies[chosen!]}</h4>
      <div className="decision-desk__metrics">
        <div><strong>{fmt(current.expectedRecoveryDays, locale, 1)} {es ? 'días' : 'days'}</strong><span>{es ? 'Tiempo medio estimado hasta tener un módulo operativo' : 'Estimated average time to recover an operational module'}</span></div>
        <div><strong>{fmt(current.probabilityTargetMet * 100, locale, 1)}%</strong><span>{es ? `Probabilidad de recuperarlo en un máximo de ${fmt(lab.scenario.timing.targetRecoveryDays, locale)} días` : `Chance of recovery within ${fmt(lab.scenario.timing.targetRecoveryDays, locale)} days`}</span></div>
        <div><strong>{currency(current.expectedCashOutlay, locale)}</strong><span>{es ? 'Desembolso medio estimado' : 'Estimated average cash outlay'}</span></div>
      </div>
      <div className="decision-desk__time-note" data-testid="recovery-time-explanation">
        <strong>{es ? '¿Qué significan esos días?' : 'What do these days mean?'}</strong>
        {chosen === 'repairFirst' && repairSuccessDays !== null && repairFailureDays !== null
          ? <p>{es
              ? `No significa que reparar tarde ${fmt(current.expectedRecoveryDays, locale, 1)} días. Si la reparación es viable (${fmt(lab.scenario.risks.repairFeasibilityProbability * 100, locale)}% de probabilidad), recuperar el módulo requiere ${fmt(repairSuccessDays, locale, 1)} días. Si no es viable, la compra de sustitución lleva una media de ${fmt(repairFailureDays, locale, 1)} días, incluidos los posibles retrasos. El promedio ponderado de ambos resultados es ${fmt(current.expectedRecoveryDays, locale, 1)} días.`
              : `It does not mean the repair itself takes ${fmt(current.expectedRecoveryDays, locale, 1)} days. If repair is feasible (${fmt(lab.scenario.risks.repairFeasibilityProbability * 100, locale)}% probability), recovery takes ${fmt(repairSuccessDays, locale, 1)} days. If it fails, purchasing a replacement takes ${fmt(repairFailureDays, locale, 1)} days on average, including possible delays. The probability-weighted average is ${fmt(current.expectedRecoveryDays, locale, 1)} days.`}</p>
          : <p>{es
              ? 'Es una media calculada a partir de los resultados posibles de esta estrategia y sus probabilidades, incluidos los riesgos de suministro. No es el tiempo fijo de una reparación ni una fecha garantizada.'
              : 'This is a probability-weighted average of the possible outcomes under this strategy, including supply risks. It is neither a fixed repair duration nor a guaranteed date.'}</p>}
      </div>
      <p className="decision-desk__compare-title">{es ? '¿Y frente a las otras dos decisiones?' : 'How does it compare with the other two routes?'}</p>
      <div className="decision-desk__comparisons">
        {options.filter((option) => option !== chosen).map((option) => <p key={option}>
          {comparisonText(current, lab.result!.strategies[option], t.strategies[option], locale)}
        </p>)}
      </div>
      <div className="decision-desk__insight" role="note">
        <strong>{es ? 'Qué significa tu elección' : 'What your choice means'}</strong>
        <p>{dominatedBy.length > 0
          ? es
            ? `Con estos tres indicadores simulados, ${dominatedBy.map((id) => t.strategies[id]).join(' y ')} ofrece igual o mejor plazo, coste y cumplimiento, y mejora al menos uno. Tu elección necesita una razón adicional no incluida en el modelo.`
            : `On the three modelled metrics, ${dominatedBy.map((id) => t.strategies[id]).join(' and ')} is at least as good on time, cost and deadline attainment, and better on one. Your choice would need an additional reason outside this model.`
          : es
            ? 'Tu alternativa no queda superada simultáneamente en plazo, coste y cumplimiento por otra. Eso no la convierte automáticamente en la mejor: hay que valorar los compromisos y las condiciones reales.'
            : 'No other route is simultaneously as good or better in all three measures and strictly better in one. This does not automatically make your choice best: trade-offs and real conditions still matter.'}</p>
      </div>
      <section className="decision-desk__environment" aria-labelledby="decision-environment-title">
        <div className="decision-desk__environment-heading">
          <p className="kicker">{es ? 'UNA SEGUNDA PREGUNTA: ¿QUÉ OCURRE CON LOS MATERIALES?' : 'A SECOND QUESTION: WHAT HAPPENS TO MATERIALS?'}</p>
          <h5 id="decision-environment-title">{es ? 'Circularidad e impacto potencial' : 'Circularity and potential impact'}</h5>
        </div>
        {chosen === 'new' ? (
          <p>{es
            ? 'Comprar una pieza nueva es la referencia ambiental. Selecciona Reparar primero o Paralela / mixta para calcular diferencias hipotéticas respecto a esta vía.'
            : 'Purchasing a new component is the environmental baseline. Choose Repair first or Parallel to model hypothetical differences versus this route.'}</p>
        ) : lab.environmentalEnabled ? (
          <>
            <div className="decision-desk__environment-grid">
              {circularityIndicators.map(({ id, label, result }) => <div key={id}>
                <span>{label}</span>
                <strong>{result?.status === 'modelled' && result.value !== null
                  ? `${fmt(result.value, locale, 1)} ${result.unit}`
                  : (es ? 'No cuantificado' : 'Not quantified')}</strong>
                <small>{result?.status === 'modelled'
                  ? (es ? 'Diferencia simulada frente a compra nueva' : 'Modelled difference vs new purchase')
                  : (es ? 'Falta una hipótesis física o un factor' : 'Physical assumption or factor missing')}</small>
              </div>)}
            </div>
            <p>{es
              ? 'Un valor negativo representa menos material, residuos o GEI dentro de las hipótesis elegidas. Los factores son totalmente inventados; esto no es un análisis de ciclo de vida ni acredita beneficios reales.'
              : 'A negative value represents less material, waste or GHG under the chosen assumptions. All factors are invented; this is not a lifecycle assessment or evidence of real benefits.'}</p>
          </>
        ) : <p>{es
          ? 'Los factores ambientales ficticios están desactivados. Puedes activarlos en Modificar las condiciones → Factores ambientales.'
          : 'Fictional environmental factors are disabled. Enable them in Change conditions → Environmental factors.'}</p>}
      </section>
      <p className="decision-desk__caution">{es
        ? 'Todas las alternativas se calculan bajo las mismas condiciones. Elegir una cambia el foco de la comparación, no los datos del escenario. Ninguna de estas cifras corresponde a Airbus.'
        : 'All alternatives are calculated under the same conditions. Your choice changes the focus of comparison, not the inputs. None of these figures belongs to Airbus.'}</p>
      <div className="decision-desk__actions">
        <button type="button" className="decision-desk__explore" data-testid="change-conditions" onClick={() => onPanel('parameters')}>
          {activePanel === 'parameters' ? (es ? 'Ocultar condiciones' : 'Hide inputs') : (es ? 'Modificar las condiciones' : 'Change conditions')}
        </button>
        <button type="button" className="decision-desk__secondary" data-testid="open-technical" onClick={() => onPanel('technical')}>
          {activePanel === 'technical' ? (es ? 'Cerrar análisis técnico' : 'Close technical analysis') : (es ? 'Ver análisis técnico (opcional)' : 'View technical analysis (optional)')}
        </button>
      </div>
      <button type="button" className="decision-desk__evidence-link" onClick={() => evidence.openEvidence({ type: 'strategy', id: chosen! })}>{es ? 'Consultar evidencias de esta elección' : 'Inspect evidence for this route'} →</button>
    </div> : <p className="decision-desk__hint">{es
      ? 'Selecciona una de las tres opciones para ver su resultado y compararla con las demás.'
      : 'Select one of the three options to see its result and compare it with the others.'}</p>}
  </section>;
}
