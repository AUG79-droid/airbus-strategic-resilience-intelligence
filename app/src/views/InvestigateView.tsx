import { CausalChain } from '../components/CausalChain';
import type { Copy } from '../content/i18n';

interface ViewProps {
  content: Copy;
}

export function InvestigateView({ content }: ViewProps) {
  return (
    <div className="view-stack">
      <div className="investigation-grid">
        <CausalChain content={content} />

        <aside className="discipline-panel" aria-labelledby="discipline-title">
          <p className="kicker kicker--lime">{content.disciplineKicker}</p>
          <h2 id="discipline-title">{content.disciplineTitle}</h2>
          <p>{content.disciplineCopy}</p>
          <ul>
            {content.disciplineList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="discipline-panel__mark" aria-hidden="true">0</div>
        </aside>
      </div>

      <section className="question-grid" aria-labelledby="question-title">
        <article className="question-card question-card--primary">
          <p className="kicker">{content.questionKicker}</p>
          <h2 id="question-title">{content.questionTitle}</h2>
          <p>{content.questionCopy}</p>
        </article>
        <article className="question-card">
          <p className="question-card__label">{content.counterfactualLabel}</p>
          <p>{content.counterfactualCopy}</p>
        </article>
        <article className="question-card question-card--sand">
          <p className="question-card__label">{content.boundaryLabel}</p>
          <p>{content.boundaryCopy}</p>
        </article>
      </section>

      <section className="foundation-panel" aria-labelledby="foundation-title">
        <div className="foundation-panel__intro">
          <p className="kicker">{content.foundationKicker}</p>
          <h2 id="foundation-title">{content.foundationTitle}</h2>
          <p>{content.foundationCopy}</p>
        </div>
        <ol className="foundation-steps">
          {content.foundationItems.map((item) => (
            <li key={item.number}>
              <span>{item.number}</span>
              <strong>{item.title}</strong>
              <p>{item.copy}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
