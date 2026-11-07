import { useState } from 'react';
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

function differences(
  current: { expectedRecoveryDays: number; expectedCashOutlay: number; probabilityTargetMet: number },
  other: { expectedRecoveryDays: number; expectedCashOutlay: number; probabilityTargetMet: number },
  locale: Locale,
): string {
  const es = locale === 'es';
  const time = current.expectedRecoveryDays - other.expectedRecoveryDays;
  const cash = current.expectedCashOutlay - other.expectedCashOutlay;
  const deadline = (current.probabilityTargetMet - other.probabilityTargetMet) * 100;
  const timeText = Math.abs(time) < 0.05 ? (es ? 'mismo plazo' : 'same recovery time')
    : `${fmt(Math.abs(time), locale, 1)} ${es ? (Math.abs(time) === 1 ? 'día' : 'días') : (Math.abs(time) === 1 ? 'day' : 'days')} ${time < 0 ? (es ? 'menos' : 'faster') : (es ? 'más' : 'slower')}`;
  const costText = Math.abs(cash) < 0.5 ? (es ? 'mismo coste' : 'same cost')
    : `${currency(Math.abs(cash), locale)} ${cash < 0 ? (es ? 'menos de coste' : 'less cost') : (es ? 'más de coste' : 'more cost')}`;
  const deadlineText = Math.abs(deadline) < 0.05
    ? (es ? 'igual probabilidad de cumplir el plazo' : 'equal chance of meeting the deadline')
    : `${fmt(Math.abs(deadline), locale, 1)} ${es ? 'puntos de probabilidad' : 'percentage points of deadline attainment'} ${deadline > 0 ? (es ? 'más' : 'higher') : (es ? 'menos' : 'lower')}`;
  return [timeText, costText, deadlineText].join(' · ');
}

export function DecisionDesk({ locale, onToggleDetails, detailsOpen }: {
  locale: Locale;
  onToggleDetails: () => void;
  detailsOpen: boolean;
}) {
  const lab = useLab();
  const t = labCopy(locale);
  const es = locale === 'es';
  const [chosen, setChosen] = useState<StrategyId | null>(null);
  const current = chosen && lab.result ? lab.result.strategies[chosen] : null;

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
        onClick={() => setChosen(option)}
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
          <strong>{t.strategies[option]}:</strong> {differences(current, lab.result!.strategies[option], locale)}
        </p>)}
      </div>
      <p className="decision-desk__caution">{es
        ? 'Estos resultados son simulados, no datos de Airbus. La opción más rápida puede costar más; sin valorar ese coste adicional no hay una ganadora automática.'
        : 'These are fictional model results, not Airbus data. Faster recovery can cost more; without valuing that extra cost there is no automatic winner.'}</p>
      <div className="decision-desk__actions">
        <button type="button" className="decision-desk__explore" data-testid="decision-toggle-details" onClick={onToggleDetails}>
          {detailsOpen
            ? (es ? 'Ocultar análisis detallado' : 'Hide detailed analysis')
            : (es ? 'Probar cambios y ver el análisis' : 'Change assumptions and see full analysis')} →
        </button>
        <span>{es ? 'Siguiente: modifica un dato y comprueba si tu elección sigue siendo razonable.' : 'Next: change one input and see whether your choice still makes sense.'}</span>
      </div>
    </div> : <p className="decision-desk__hint">{es
      ? 'Selecciona una de las tres opciones para ver su resultado y compararla con las demás.'
      : 'Select one of the three options to see its result and compare it with the others.'}</p>}
  </section>;
}
