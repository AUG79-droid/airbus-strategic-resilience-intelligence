import type { Copy } from '../content/i18n';

interface CausalChainProps {
  content: Copy;
}

export function CausalChain({ content }: CausalChainProps) {
  return (
    <section className="chain-panel" aria-labelledby="chain-title">
      <header className="section-heading section-heading--split">
        <div>
          <p className="kicker">{content.chainKicker}</p>
          <h2 id="chain-title">{content.chainTitle}</h2>
        </div>
        <p>{content.chainIntro}</p>
      </header>

      <ol className="causal-chain">
        {content.chainStages.map((stage, index) => (
          <li className={`causal-stage causal-stage--${stage.status}`} key={stage.id}>
            <div className="causal-stage__header">
              <span className="causal-stage__index">{String(index + 1).padStart(2, '0')}</span>
              <span className="causal-stage__status">{content.statusLabels[stage.status]}</span>
            </div>
            <p className="causal-stage__short">{stage.short}</p>
            <h3>{stage.title}</h3>
            <p className="causal-stage__description">{stage.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
