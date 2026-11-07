import type { Locale, ViewId } from '../../app/types';
import { guidanceCopy } from './copy';

const order: ViewId[] = ['investigate', 'challenge', 'validate', 'translate'];

export function GuidedJourney({ view, locale, onNext, onDisable }: { view: ViewId; locale: Locale; onNext: () => void; onDisable: () => void }) {
  const content = guidanceCopy(locale)[view];
  const index = order.indexOf(view);
  return <section className={`guided-journey guided-journey--${view}`} aria-labelledby={`guide-${view}-title`} data-testid={`guide-${view}`}>
    <header><div><p className="kicker">{locale === 'es' ? `RECORRIDO GUIADO · PASO ${index + 1} DE 4` : `GUIDED JOURNEY · STEP ${index + 1} OF 4`}</p><h2 id={`guide-${view}-title`}>{content.title}</h2><p>{content.intro}</p></div><button type="button" onClick={onDisable}>{locale === 'es' ? 'Usar modo experto' : 'Use expert mode'}</button></header>
    <div className="guided-progress" aria-label={locale === 'es' ? `Progreso: paso ${index + 1} de 4` : `Progress: step ${index + 1} of 4`}>{order.map((step, stepIndex) => <span key={step} className={stepIndex <= index ? 'is-complete' : ''}><i />{String(stepIndex + 1).padStart(2, '0')}</span>)}</div>
    <div className="guided-journey__content"><div className="guided-explainers">{content.sections.map((section, sectionIndex) => <article key={section.title}><span>{String(sectionIndex + 1).padStart(2, '0')}</span><div><h3>{section.title}</h3><p>{section.body}</p></div></article>)}</div><aside><p className="kicker kicker--lime">{locale === 'es' ? 'QUÉ HACER AHORA' : 'WHAT TO DO NOW'}</p><ol>{content.actions.map((action) => <li key={action}>{action}</li>)}</ol><button type="button" data-testid={`guide-next-${view}`} onClick={onNext}>{content.next}<span>→</span></button></aside></div>
  </section>;
}
