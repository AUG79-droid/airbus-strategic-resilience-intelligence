import { useEffect, useMemo, useState } from 'react';
import { WorkflowIcon } from '../components/Icons';
import { copy } from '../content/i18n';
import { ChallengeView } from '../views/ChallengeView';
import { InvestigateView } from '../views/InvestigateView';
import { TranslateView } from '../views/TranslateView';
import { ValidateView } from '../views/ValidateView';
import type { Locale, ViewId } from './types';
import type { StrategyId } from '../domain';

const workflow: ViewId[] = ['investigate', 'challenge', 'validate', 'translate'];
type ChallengePanel = 'parameters' | 'technical' | null;
type ChallengeTab = 'branches' | 'sensitivity' | 'environment' | 'method';
type ChallengeScreen = { panel: ChallengePanel; tab: ChallengeTab };
type JourneyHistoryState = {
  asriChallenge?: ChallengeScreen;
  asriChoice?: StrategyId | null;
  asriInsideChallenge?: boolean;
};
const initialChallenge: ChallengeScreen = { panel: null, tab: 'branches' };
function currentHistory(): JourneyHistoryState {
  return (window.history.state ?? {}) as JourneyHistoryState;
}
function screenFromHistory(): ChallengeScreen {
  const value = currentHistory().asriChallenge;
  const panel = value?.panel === 'technical' || value?.panel === 'parameters' ? value.panel : null;
  const tab = value?.tab === 'sensitivity' || value?.tab === 'environment' || value?.tab === 'method' ? value.tab : 'branches';
  return { panel, tab };
}
function scrollToChallenge(screen: ChallengeScreen) {
  window.requestAnimationFrame(() => window.requestAnimationFrame(() =>
    document.getElementById(screen.panel ? 'lab-detailed-analysis' : 'decision-desk-heading')
      ?.scrollIntoView({ behavior: 'auto', block: 'start' })
  ));
}

function viewFromHash(): ViewId {
  const candidate = window.location.hash.replace('#/', '') as ViewId;
  return workflow.includes(candidate) ? candidate : 'investigate';
}

export function App() {
  const [locale, setLocale] = useState<Locale>('en');
  const [view, setView] = useState<ViewId>(viewFromHash);
  const [challengeScreen, setChallengeScreen] = useState<ChallengeScreen>(screenFromHistory);
  const [challengeChoice, setChallengeChoice] = useState<StrategyId | null>(() => currentHistory().asriChoice ?? null);
  const content = useMemo(() => copy[locale], [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const onNavigation = () => {
      const next = viewFromHash();
      const screen = screenFromHistory();
      setView(next);
      setChallengeScreen(screen);
      setChallengeChoice(currentHistory().asriChoice ?? null);
      if (next === 'challenge') scrollToChallenge(screen);
    };
    window.addEventListener('hashchange', onNavigation);
    window.addEventListener('popstate', onNavigation);
    return () => {
      window.removeEventListener('hashchange', onNavigation);
      window.removeEventListener('popstate', onNavigation);
    };
  }, []);

  const navigate = (next: ViewId) => {
    if (next === view) return;
    setView(next);
    window.history.pushState({
      asriChallenge: challengeScreen,
      asriChoice: challengeChoice,
      asriInsideChallenge: false,
    } satisfies JourneyHistoryState, '', `#/${next}`);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const chooseStrategy = (choice: StrategyId) => {
    setChallengeChoice(choice);
    window.history.replaceState({ ...currentHistory(), asriChallenge: challengeScreen, asriChoice: choice }, '', window.location.href);
  };

  const openChallengeScreen = (next: ChallengeScreen) => {
    if (challengeScreen.panel === next.panel && challengeScreen.tab === next.tab) return;
    setChallengeScreen(next);
    window.history.pushState({
      asriChallenge: next,
      asriChoice: challengeChoice,
      asriInsideChallenge: true,
    } satisfies JourneyHistoryState, '', '#/challenge');
    scrollToChallenge(next);
  };

  const goBack = () => {
    if (view === 'challenge') {
      // Internal panel/tab changes have their own browser history entries.
      // Never send the user back to Investigate while inside an analysis.
      if (currentHistory().asriInsideChallenge) {
        window.history.back();
        return;
      }
      if (challengeScreen.panel !== null) {
        const summary = { ...challengeScreen, panel: null } satisfies ChallengeScreen;
        setChallengeScreen(summary);
        window.history.replaceState({ ...currentHistory(), asriChallenge: summary, asriInsideChallenge: false }, '', '#/challenge');
        scrollToChallenge(summary);
        return;
      }
    }
    navigate(workflow[workflow.indexOf(view) - 1]);
  };

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
          {view === 'investigate' && <section className="hero" aria-labelledby="hero-title">
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
          </section>}

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
              {view !== 'investigate' && view !== 'challenge' && (
                <div className="step-direction" role="note">
                  <strong>{locale === 'es' ? 'PASO' : 'STEP'} {workflow.indexOf(view) + 1} / 4 · {content.views[view].label}</strong>
                  <p>{locale === 'es'
                    ? ({ challenge: 'Elige un escenario, cambia un dato y compara las tres alternativas. Los detalles avanzados están plegados.', validate: 'Selecciona una evidencia y comprueba qué está documentado, qué es una hipótesis y qué falta validar.', translate: 'Selecciona una estrategia y una audiencia. Comprueba la conclusión antes de exportar.' } as Record<string, string>)[view]
                    : ({ challenge: 'Choose a scenario, change one input and compare all three options. Advanced details are collapsed.', validate: 'Select an evidence record to see what is documented, assumed or still needs validation.', translate: 'Choose a strategy and an audience. Review the conclusion before exporting.' } as Record<string, string>)[view]}</p>
                </div>
              )}
              {view === 'investigate' && <InvestigateView content={content} locale={locale} onNext={() => navigate('challenge')} />}
              {view === 'challenge' && <ChallengeView content={content} locale={locale} guided={true}
                chosen={challengeChoice}
                onChoose={chooseStrategy}
                activePanel={challengeScreen.panel}
                technicalTab={challengeScreen.tab}
                onPanel={(panel) => openChallengeScreen({ ...challengeScreen, panel: challengeScreen.panel === panel ? null : panel })}
                onTabChange={(tab) => openChallengeScreen({ ...challengeScreen, panel: 'technical', tab })}
              />}
              {view === 'validate' && <ValidateView content={content} locale={locale} />}
              {view === 'translate' && <TranslateView content={content} locale={locale} />}
              {view !== 'investigate' && (
                <nav className="journey-actions" aria-label={locale === 'es' ? 'Navegación del caso' : 'Case navigation'}>
                  <button type="button" className="journey-actions__back" onClick={goBack} data-testid="journey-back">
                    ← {view === 'challenge' && (challengeScreen.panel !== null || currentHistory().asriInsideChallenge)
                      ? (locale === 'es' ? 'Volver a la pantalla anterior' : 'Back to previous screen')
                      : (locale === 'es' ? 'Volver' : 'Back')}
                  </button>
                  <button type="button" className="journey-actions__next" onClick={() => navigate(view === 'translate' ? 'investigate' : workflow[workflow.indexOf(view) + 1])}>
                    {view === 'translate' ? (locale === 'es' ? 'Volver al caso' : 'Return to case') : (locale === 'es' ? 'Continuar: ' : 'Continue: ') + content.views[workflow[workflow.indexOf(view) + 1]].label} →
                  </button>
                </nav>
              )}
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
