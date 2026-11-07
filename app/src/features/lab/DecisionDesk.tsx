import type { Locale } from '../../app/types';
import type { StrategyId } from '../../domain';
import { useLab } from './LabProvider';
import { labCopy } from './copy';

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
  const t = labCopy(locale);
  const es = locale === 'es';
  const current = chosen && lab.result ? lab.result.strategies[chosen] : null;
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
        <div><strong>{fmt(current.expectedRecoveryDays, locale, 1)}</strong><span>{es ? 'días esperados para recuperar' : 'expected recovery days'}</span></div>
        <div><strong>{fmt(current.probabilityTargetMet * 100, locale, 1)}%</strong><span>{es ? 'probabilidad de cumplir el objetivo' : 'chance of meeting the target'}</span></div>
        <div><strong>{currency(current.expectedCashOutlay, locale)}</strong><span>{es ? 'desembolso esperado' : 'expected cash outlay'}</span></div>
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
      <p className="decision-desk__caution">{es
        ? 'Todas las alternativas se calculan bajo las mismas condiciones. Elegir una cambia el foco de la comparación, no los datos del escenario. Son ejemplos ficticios, no resultados reales de Airbus.'
        : 'All alternatives are calculated under the same conditions. Choosing one changes the focus of the comparison, not the scenario inputs. These are fictional examples, not real Airbus outcomes.'}</p>
      <div className="decision-desk__actions">
        <button type="button" className="decision-desk__explore" data-testid="change-conditions" onClick={() => onPanel('parameters')}>
          {activePanel === 'parameters' ? (es ? 'Ocultar condiciones' : 'Hide inputs') : (es ? 'Modificar las condiciones' : 'Change conditions')}
        </button>
        <button type="button" className="decision-desk__secondary" data-testid="open-technical" onClick={() => onPanel('technical')}>
          {activePanel === 'technical' ? (es ? 'Cerrar análisis técnico' : 'Close technical analysis') : (es ? 'Ver análisis técnico (opcional)' : 'View technical analysis (optional)')}
        </button>
      </div>
    </div> : <p className="decision-desk__hint">{es
      ? 'Selecciona una de las tres opciones para ver su resultado y compararla con las demás.'
      : 'Select one of the three options to see its result and compare it with the others.'}</p>}
  </section>;
}
