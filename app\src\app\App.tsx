import { useEffect, useMemo, useState } from 'react';
import { WorkflowIcon } from '../components/Icons';
import { SystemMap } from '../components/SystemMap';
import { copy } from '../content/i18n';
import { GuidedJourney } from '../features/guidance/GuidedJourney';
import { ChallengeView } from '../views/ChallengeView';
import { InvestigateView } from '../views/InvestigateView';
import { TranslateView } from '../views/TranslateView';
import { ValidateView } from '../views/ValidateView';
import type { Locale, ViewId } from './types';

const workflow: ViewId[] = ['investigate', 'challenge', 'validate', 'translate'];

function viewFromHash(): ViewId {
  const candidate = window.location.hash.replace('#/', '') as ViewId;
  return workflow.includes(candidate) ? candidate : 'investigate';
}

export function App() {
  const [locale, setLocale] = useState<Locale>('en');
  const [view, setView] = useState<ViewId>(viewFromHash);
  const [guided, setGuided] = useState(() => {
    try { return window.localStorage.getItem('asri-experience-mode') !== 'expert'; } catch { return true; }
  });
  const content = useMemo(() => copy[locale], [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const onHashChange = () => setView(viewFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next: ViewId) => {
    setView(next);
    window.history.replaceState(null, '', `#/${next}`);
    document.getElementById('case-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const setGuidedMode = (enabled: boolean) => {
    setGuided(enabled);
    try { window.localStorage.setItem('asri-experience-mode', enabled ? 'guided' : 'expert'); } catch { /* Local storage can be unavailable in restricted browsers. */ }
  };

  const nextView = () => navigate(workflow[(workflow.indexOf(view) + 1) % workflow.length]);

  return (
    <>
      <a className="skip-link" href="#main-content">{content.skip}</a>

      <header className="topbar-shell">
        <div className="topbar">
          <button className="brand" type="button" onClick={() => navigate('investigate')} aria-label="RI home">
            <span className="brand__mark">R/</span>
            <span className="brand__copy">
              <strong>RESILIENCE INTELLIGENCE</strong>
              <small>{content.brandSub}</small>
            </span>
          </button>

          <div className="topbar__controls">
            <span className="prototype-status"><i />{content.prototypeStatus}</span>
            <span className="phase-label">{content.phaseLabel}</span>
            <button className={`guidance-toggle ${guided ? 'is-active' : ''}`} type="button" data-testid="guidance-toggle" aria-pressed={guided} onClick={() => setGuidedMode(!guided)}>{guided ? (locale === 'es' ? 'GUÍA ACTIVA' : 'GUIDE ON') : (locale === 'es' ? 'MODO EXPERTO' : 'EXPERT MODE')}</button>
            <div className="language-switch" aria-label="Language">
              {(['en', 'es'] as const).map((language) => (
                <button
                  className={locale === language ? 'is-active' : ''}
                  type="button"
                  key={language}
                  onClick={() => setLocale(language)}
                  aria-pressed={locale === language}
                >
                  {language.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="application-shell">
        <aside className="workflow-rail">
          <span className="workflow-rail__hint">{content.railHint}</span>
          <nav aria-label={content.navLabel}>
            {workflow.map((item) => (
              <button
                className={view === item ? 'workflow-button is-active' : 'workflow-button'}
                type="button"
                key={item}
                onClick={() => navigate(item)}
                aria-current={view === item ? 'page' : undefined}
                title={content.views[item].label}
              >
                <WorkflowIcon name={item} />
                <span>{content.views[item].short}</span>
                <strong>{content.views[item].label}</strong>
              </button>
            ))}
          </nav>
          <span className="workflow-rail__bottom">{content.railBottom}</span>
        </aside>

        <main id="main-content" className="main-content">
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero__copy">
              <p className="eyebrow">{content.eyebrow}</p>
              <h1 id="hero-title">
                {content.heroLead}{' '}
                <em>{content.heroEmphasis}</em>
              </h1>
              <p className="hero__subtitle">{content.heroSubtitle}</p>
              <p className="hero__intro">{content.heroCopy}</p>
              <div className="hero__meta">
                <span><i className="meta-square meta-square--coral" />{content.scopeMeta}</span>
                <span><i className="meta-square meta-square--green" />{content.dataMeta}</span>
              </div>
            </div>
            <SystemMap label={content.systemMap} caption={content.causalCaption} />
          </section>

          <section id="case-workspace" className="case-workspace" aria-label={content.caseLabel}>
            <div className="case-line">
              <strong>{content.caseLabel}</strong>
              <span>{content.caseDescription}</span>
            </div>
            <nav className="workspace-tabs" aria-label={content.navLabel}>
              {workflow.map((item) => (
                <button
                  className={view === item ? 'is-active' : ''}
                  type="button"
                  key={item}
                  onClick={() => navigate(item)}
                  aria-current={view === item ? 'page' : undefined}
                >
                  <span>{content.views[item].short} /</span> {content.views[item].label}
                </button>
              ))}
            </nav>

            <div className="workspace-view" key={`${locale}-${view}`}>
              {guided && <GuidedJourney view={view} locale={locale} onNext={nextView} onDisable={() => setGuidedMode(false)} />}
              {view === 'investigate' && <InvestigateView content={content} />}
              {view === 'challenge' && <ChallengeView content={content} locale={locale} guided={guided} />}
              {view === 'validate' && <ValidateView content={content} locale={locale} />}
              {view === 'translate' && <TranslateView content={content} locale={locale} />}
            </div>
          </section>

          <footer className="footer">
            <span>{content.footerLeft}</span>
            <span>{content.footerRight}</span>
          </footer>
        </main>
      </div>
    </>
  );
}
