import type { Locale } from '../app/types';
import type { Copy } from '../content/i18n';

interface ViewProps {
  content: Copy;
  locale: Locale;
  onNext: () => void;
}

export function InvestigateView({ content, locale, onNext }: ViewProps) {
  const es = locale === 'es';
  const alternatives = es
    ? [
        { title: 'Comprar una pieza nueva', detail: 'Depender de un proveedor y su plazo de entrega.' },
        { title: 'Reparar primero', detail: 'Inspeccionar y reparar; comprar nueva solo si no es viable.' },
        { title: 'Activar ambas vías', detail: 'Iniciar compra y reparación en paralelo, con posibles costes extra.' },
      ]
    : [
        { title: 'Buy a new component', detail: 'Rely on a supplier and its delivery lead time.' },
        { title: 'Repair first', detail: 'Inspect and repair; buy new only if repair is not feasible.' },
        { title: 'Start both routes', detail: 'Run procurement and repair in parallel, with potential extra costs.' },
      ];

  return (
    <section className="case-start" aria-labelledby="case-start-title">
      <header className="case-start__header">
        <p className="kicker">{es ? 'EL CASO QUE VAS A RESOLVER' : 'THE CASE YOU WILL SOLVE'}</p>
        <h2 id="case-start-title">{content.questionTitle}</h2>
        <p>{content.questionCopy}</p>
      </header>

      <div className="case-start__alternatives">
        <p className="kicker">{es ? 'TRES DECISIONES POSIBLES' : 'THREE POSSIBLE DECISIONS'}</p>
        <div className="case-start__options">
          {alternatives.map((option, index) => (
            <article key={option.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{option.title}</h3>
              <p>{option.detail}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="case-start__decision">
        <div>
          <p className="kicker">{es ? '¿QUÉ TIENE QUE VER CON LA SOSTENIBILIDAD?' : 'WHY DOES SUSTAINABILITY MATTER?'}</p>
          <p>{content.boundaryCopy}</p>
          <p className="case-start__disclaimer">{es
            ? 'Caso ficticio y cifras de ejemplo. El análisis estudia la recuperación del componente, no la disponibilidad de una aeronave.'
            : 'Fictional case and example data. The analysis concerns component recovery, not aircraft availability.'}</p>
        </div>
        <div className="case-start__action">
          <strong>{es ? 'Tu siguiente paso' : 'Your next step'}</strong>
          <p>{es ? 'Compara las tres alternativas cambiando un único dato cada vez.' : 'Compare all three routes by changing one input at a time.'}</p>
          <button type="button" data-testid="start-comparison" onClick={onNext}>
            {es ? 'Empezar la comparación' : 'Start comparing'} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
