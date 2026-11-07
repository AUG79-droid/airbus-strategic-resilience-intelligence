import { describe, expect, it } from 'vitest';
import {
  classifyAgainstBaseline,
  evaluateEnvironmentalIndicators,
  evaluateScenario,
  type NominalOutcome,
} from '../../../domain';
import { evaluateClaimGates } from '../../evidence/claims';
import { scenarioForPreset } from '../../lab/presets';
import { buildStrategicTranslation, conclusionForOutcome } from '../translator';
import type { AudienceId } from '../types';
import type { StrategyId } from '../../../domain';

const audiences: AudienceId[] = ['defenceCustomer', 'programmeManager', 'engineering', 'executiveLeadership'];
const strategies: StrategyId[] = ['new', 'repairFirst', 'parallel'];

function caseData(preset: 'balanced' | 'repairWorsens' = 'balanced') {
  const result = evaluateScenario(scenarioForPreset(preset));
  const options = { timeToleranceDays: 0.1, targetProbabilityTolerance: 0.001, costTolerance: 1, criticalUnknowns: [] };
  const repairClassification = classifyAgainstBaseline(result.strategies.new, result.strategies.repairFirst, options);
  const parallelClassification = classifyAgainstBaseline(result.strategies.new, result.strategies.parallel, options);
  const environmental = {
    repairFirst: evaluateEnvironmentalIndicators(result.strategies.new, result.strategies.repairFirst, {}),
    parallel: evaluateEnvironmentalIndicators(result.strategies.new, result.strategies.parallel, {}),
  };
  const claims = evaluateClaimGates({ repairClassification, environmental: environmental.repairFirst });
  return { result, repairClassification, parallelClassification, environmental, claims };
}

describe('translation conclusion semantics', () => {
  it.each<[NominalOutcome, string]>([
    ['modelledAdvantage', 'favourable'],
    ['potentiallyWorse', 'unfavourable'],
    ['tradeoff', 'contradictory'],
    ['inconclusive', 'inconclusive'],
    ['noDemonstratedBenefit', 'noDemonstratedBenefit'],
  ])('maps %s without overstating the result', (outcome, expected) => {
    expect(conclusionForOutcome(outcome)).toBe(expected);
  });

  it('produces explicit contradictory and inconclusive narratives', () => {
    const data = caseData();
    const tradeoff = buildStrategicTranslation({ ...data, locale: 'en', audience: 'programmeManager', strategy: 'repairFirst', repairClassification: { ...data.repairClassification, nominalOutcome: 'tradeoff', decisionOutcome: 'tradeoff' } });
    const inconclusive = buildStrategicTranslation({ ...data, locale: 'en', audience: 'programmeManager', strategy: 'repairFirst', repairClassification: { ...data.repairClassification, nominalOutcome: 'inconclusive', decisionOutcome: 'inconclusive' } });
    expect(tradeoff.conclusion).toBe('contradictory');
    expect(tradeoff.headline).toContain('trade-off');
    expect(inconclusive.conclusion).toBe('inconclusive');
    expect(inconclusive.headline).toContain('inconclusive');
  });

  it('keeps no demonstrated benefit distinct from inconclusive', () => {
    const data = caseData();
    const translation = buildStrategicTranslation({ ...data, locale: 'en', audience: 'programmeManager', strategy: 'repairFirst', repairClassification: { ...data.repairClassification, nominalOutcome: 'noDemonstratedBenefit', decisionOutcome: 'noDemonstratedBenefit' } });
    expect(translation.conclusion).toBe('noDemonstratedBenefit');
    expect(translation.headline).toContain('no demonstrated benefit');
  });
});

describe('audience-specific translation', () => {
  it('creates one distinct recommendation and validation plan for each audience', () => {
    const data = caseData();
    const translations = audiences.map((audience) => buildStrategicTranslation({ ...data, locale: 'en', audience, strategy: 'repairFirst' }));
    expect(new Set(translations.map((item) => item.decisionRecommendation)).size).toBe(4);
    expect(translations.every((item) => item.validationActions.length === 3)).toBe(true);
    expect(translations.every((item) => item.validatedBenefitCount === 0)).toBe(true);
  });

  it('keeps all quantitative statements modelled and all benefits unvalidated', () => {
    const translation = buildStrategicTranslation({ ...caseData(), locale: 'en', audience: 'defenceCustomer', strategy: 'repairFirst' });
    expect(translation.metrics.every((metric) => metric.status === 'modelledExample')).toBe(true);
    expect(translation.traceItems.some((item) => item.status === 'validatedBenefit')).toBe(false);
    expect(translation.causalSteps.find((step) => step.stage === 'resilienceOutcome')?.statement).toContain('fictional');
    expect(translation.decisionBoundary).toContain('mission availability');
  });

  it('rejects the benefit narrative when the repair-worsens scenario is active', () => {
    const translation = buildStrategicTranslation({ ...caseData('repairWorsens'), locale: 'en', audience: 'executiveLeadership', strategy: 'repairFirst' });
    expect(translation.conclusion).toBe('unfavourable');
    expect(translation.headline).toContain('weakens');
    expect(translation.decisionRecommendation).toMatch(/Do not promote|Do not claim/);
    expect(translation.causalSteps.find((step) => step.stage === 'customerValue')?.status).toBe('rejected');
  });

  it('provides complete Spanish audience framing and guardrails', () => {
    const translation = buildStrategicTranslation({ ...caseData(), locale: 'es', audience: 'engineering', strategy: 'repairFirst' });
    expect(translation.headline).toMatch(/reparación|ventaja|compromiso|resiliencia/i);
    expect(translation.decisionRecommendation).toContain('Validar');
    expect(translation.validationActions.every((action) => action.action.length > 30)).toBe(true);
    expect(translation.limitations[0]).toContain('ficticios');
  });

  it('links every causal step and trace statement back to evidence focus', () => {
    const translation = buildStrategicTranslation({ ...caseData(), locale: 'en', audience: 'programmeManager', strategy: 'repairFirst' });
    expect(translation.causalSteps).toHaveLength(5);
    expect(translation.causalSteps.every((step) => step.evidenceIds.length > 0 && step.focus.type !== 'all')).toBe(true);
    expect(translation.traceItems.every((item) => item.evidenceIds.length > 0 && item.focus.type !== 'all')).toBe(true);
  });

  it('builds a complete strategy profile for every strategy and audience', () => {
    const data = caseData();
    const translations = strategies.flatMap((strategy) => audiences.map((audience) => buildStrategicTranslation({ ...data, locale: 'en', audience, strategy })));
    expect(translations).toHaveLength(12);
    expect(translations.every((item) => item.strategy && item.metrics.length === 3)).toBe(true);
    expect(translations.every((item) => item.advantages.length >= 2 && item.drawbacks.length >= 2 && item.uncertainties.length >= 2)).toBe(true);
    expect(translations.filter((item) => item.strategy === 'new').every((item) => item.conclusion === 'reference')).toBe(true);
  });

  it('uses a three-way break-even test for the balanced parallel strategy in all audiences', () => {
    const data = caseData();
    const translations = audiences.map((audience) => buildStrategicTranslation({ ...data, locale: 'en', audience, strategy: 'parallel' }));
    expect(translations.every((item) => item.primaryComparator === 'repairFirst')).toBe(true);
    expect(translations.every((item) => item.marginalValuePerDay === 32_250)).toBe(true);
    expect(translations.every((item) => item.comparativeAssessment.includes('€32,250') && item.comparativeAssessment.includes('1 expected day gained'))).toBe(true);
    expect(translations.every((item) => item.comparativeAssessment.includes('no target-attainment improvement'))).toBe(true);
    expect(translations.every((item) => item.decisionRecommendation.includes('should not be preferred automatically') && !item.decisionRecommendation.startsWith('Advance'))).toBe(true);
    expect(new Set(translations.map((item) => item.comparativeDecisionRule)).size).toBe(4);
  });

  it('explains the balanced repair saving against parallel rather than using replacement alone', () => {
    const translation = buildStrategicTranslation({ ...caseData(), locale: 'en', audience: 'programmeManager', strategy: 'repairFirst' });
    expect(translation.primaryComparator).toBe('parallel');
    expect(translation.comparativeAssessment).toContain('saves €32,250');
    expect(translation.comparativeAssessment).toContain('1 additional expected day');
    expect(translation.comparisonStatements).toHaveLength(2);
    expect(translation.comparisonStatements.join(' ')).toContain('Replacement');
    expect(translation.comparisonStatements.join(' ')).toContain('Parallel strategy');
  });

  it('never labels a fictional strategy as a documented Airbus initiative', () => {
    const data = caseData();
    const translations = strategies.flatMap((strategy) => audiences.map((audience) => buildStrategicTranslation({ ...data, locale: 'en', audience, strategy })));
    expect(translations.every((item) => item.causalSteps.find((step) => step.stage === 'initiative')?.status === 'modelledExample')).toBe(true);
    expect(translations.every((item) => item.causalSteps.find((step) => step.stage === 'initiative')?.statement.includes('fictional modelled option'))).toBe(true);
    expect(translations.every((item) => item.traceItems.find((trace) => trace.id === 'TRACE-PUBLIC')?.status === 'documentedFact')).toBe(true);
  });

  it('keeps all twelve adverse-scenario translations guarded and comparative', () => {
    const data = caseData('repairWorsens');
    const translations = strategies.flatMap((strategy) => audiences.map((audience) => buildStrategicTranslation({ ...data, locale: 'en', audience, strategy })));
    expect(translations).toHaveLength(12);
    expect(translations.every((item) => item.comparisonStatements.length === 2 && item.validatedBenefitCount === 0)).toBe(true);
    expect(translations.filter((item) => item.strategy === 'repairFirst').every((item) => item.conclusion === 'unfavourable')).toBe(true);
    expect(translations.filter((item) => item.strategy === 'repairFirst').every((item) => /Do not promote|insufficient quantitative justification|dominated/.test(item.decisionRecommendation))).toBe(true);
  });
});

