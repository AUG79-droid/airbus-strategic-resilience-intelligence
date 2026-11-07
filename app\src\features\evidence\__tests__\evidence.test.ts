import { describe, expect, it } from 'vitest';
import {
  classifyAgainstBaseline,
  evaluateEnvironmentalIndicators,
  evaluateScenario,
  type EnvironmentalFactors,
} from '../../../domain';
import { scenarioForPreset } from '../../lab/presets';
import { evaluateClaimGates } from '../claims';
import { buildAssumptions, buildEvidenceRecords, buildModelOutputs } from '../registry';
import { PUBLIC_SOURCES } from '../sources';

function evaluate(preset: 'balanced' | 'repairWorsens', factors: EnvironmentalFactors = {}) {
  const scenario = scenarioForPreset(preset);
  const result = evaluateScenario(scenario);
  const options = { timeToleranceDays: 0.1, targetProbabilityTolerance: 0.001, costTolerance: 1, criticalUnknowns: [] };
  const classifications = {
    repairFirst: classifyAgainstBaseline(result.strategies.new, result.strategies.repairFirst, options),
    parallel: classifyAgainstBaseline(result.strategies.new, result.strategies.parallel, options),
  };
  const environmental = {
    repairFirst: evaluateEnvironmentalIndicators(result.strategies.new, result.strategies.repairFirst, factors),
    parallel: evaluateEnvironmentalIndicators(result.strategies.new, result.strategies.parallel, factors),
  };
  return { scenario, result, classifications, environmental };
}

describe('public-source registry', () => {
  it('contains only traceable Airbus and EASA HTTPS sources with review metadata', () => {
    expect(PUBLIC_SOURCES).toHaveLength(4);
    expect(new Set(PUBLIC_SOURCES.map((source) => source.id)).size).toBe(PUBLIC_SOURCES.length);
    for (const source of PUBLIC_SOURCES) {
      const url = new URL(source.url);
      expect(url.protocol).toBe('https:');
      expect(['www.airbus.com', 'www.easa.europa.eu']).toContain(url.hostname);
      expect(source.accessedDate).toBe('2026-11-07');
      expect(source.locator.length).toBeGreaterThan(10);
      expect(source.extract.trim().split(/\s+/).length).toBeLessThanOrEqual(25);
      expect(source.limitations.length).toBeGreaterThan(0);
    }
  });

  it('never leaves a referenced source ID unresolved', () => {
    const data = evaluate('balanced');
    const records = buildEvidenceRecords({ ...data, environmentalEnabled: false });
    const sourceIds = new Set(PUBLIC_SOURCES.map((source) => source.id));
    expect(records.flatMap((record) => record.sourceIds).every((id) => sourceIds.has(id))).toBe(true);
  });
});

describe('evidence taxonomy and traceability', () => {
  it('distinguishes documented, hypothesis, modelled, unsupported and rejected records', () => {
    const data = evaluate('balanced');
    const records = buildEvidenceRecords({ ...data, environmentalEnabled: false });
    expect(new Set(records.map((record) => record.status))).toEqual(new Set([
      'documentedFact', 'hypothesis', 'modelledExample', 'unsupported', 'rejected',
    ]));
    expect(records.every((record) => record.stages.length > 0 && record.lastReviewed === '2026-11-07')).toBe(true);
  });

  it('carries fictional inputs and branch outputs into auditable records', () => {
    const data = evaluate('balanced');
    const assumptions = buildAssumptions(data.scenario);
    const outputs = buildModelOutputs(data.result);
    expect(assumptions).toHaveLength(4);
    expect(assumptions.every((item) => ['fictionalUserInput', 'explicitPolicy'].includes(item.provenance))).toBe(true);
    expect(outputs).toHaveLength(9);
    expect(outputs.every((item) => item.status === 'modelledExample')).toBe(true);
  });

  it('covers every causal stage and resolves model assumption references', () => {
    const data = evaluate('balanced');
    const records = buildEvidenceRecords({ ...data, environmentalEnabled: false });
    const assumptions = new Set(buildAssumptions(data.scenario).map((item) => item.id));
    const stages = new Set(records.flatMap((record) => record.stages));
    expect(stages).toEqual(new Set(['initiative', 'environmentalMechanism', 'strategicVulnerability', 'resilienceOutcome', 'customerValue', 'evidenceLimitations']));
    expect(records.flatMap((record) => record.assumptionIds).every((id) => assumptions.has(id))).toBe(true);
  });

  it('assigns evidence requests to all four validation owners', () => {
    const data = evaluate('balanced');
    const records = buildEvidenceRecords({ ...data, environmentalEnabled: false });
    const owners = new Set(records.flatMap((record) => record.requiredInformation.map((item) => item.owner)));
    expect(owners).toEqual(new Set(['engineering', 'procurement', 'sustainability', 'programmes']));
  });
});

describe('claim gating', () => {
  it('allows only narrow public context and blocks case-specific benefit claims', () => {
    const data = evaluate('balanced');
    const claims = evaluateClaimGates({
      repairClassification: data.classifications.repairFirst,
      environmental: data.environmental.repairFirst,
    });
    expect(claims.find((claim) => claim.id === 'serviceContext')?.status).toBe('allowedContext');
    expect(claims.filter((claim) => claim.id !== 'serviceContext').every((claim) => claim.status !== 'allowedContext')).toBe(true);
    expect(claims.find((claim) => claim.id === 'environmentalBenefit')?.status).toBe('blocked');
  });

  it('rejects operational and strategic benefit claims when repair performs worse', () => {
    const data = evaluate('repairWorsens');
    const claims = evaluateClaimGates({
      repairClassification: data.classifications.repairFirst,
      environmental: data.environmental.repairFirst,
    });
    expect(claims.find((claim) => claim.id === 'operationalBenefit')?.status).toBe('rejected');
    expect(claims.find((claim) => claim.id === 'strategicResilience')?.status).toBe('rejected');
    expect(claims.find((claim) => claim.id === 'customerValue')?.status).toBe('rejected');
  });

  it('rejects an environmental benefit when fictional factors produce an adverse GHG delta', () => {
    const factor = (value: number) => ({ value, unit: 'kg CO₂e', evidenceStatus: 'modelledExample' as const, sourceIds: ['TEST'], boundary: 'Test only.' });
    const factors: EnvironmentalFactors = {
      newPartManufacturingKgCo2e: factor(10),
      repairProcessKgCo2e: factor(200),
      newPartLogisticsKgCo2e: factor(1),
      repairLogisticsKgCo2e: factor(20),
    };
    const data = evaluate('balanced', factors);
    const claims = evaluateClaimGates({ repairClassification: data.classifications.repairFirst, environmental: data.environmental.repairFirst });
    expect(data.environmental.repairFirst.indicators.find((item) => item.id === 'boundedGhgDeltaKgCo2e')?.value).toBeGreaterThan(0);
    expect(claims.find((claim) => claim.id === 'environmentalBenefit')?.status).toBe('rejected');
  });
});

