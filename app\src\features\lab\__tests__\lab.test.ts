import { describe, expect, it } from 'vitest';
import { classifyAgainstBaseline, evaluateScenario } from '../../../domain';
import { LAB_PRESETS, scenarioForPreset } from '../presets';
import { runSensitivity } from '../sensitivity';
import { calculateThresholds } from '../thresholds';

describe('Phase 3 laboratory scenarios', () => {
  it('keeps every fictional preset executable and probability-normalised', () => {
    expect(LAB_PRESETS).toHaveLength(6);
    for (const preset of LAB_PRESETS) {
      const result = evaluateScenario(preset.scenario);
      for (const strategy of Object.values(result.strategies)) {
        expect(strategy.branches.reduce((total, branch) => total + branch.probability, 0)).toBeCloseTo(1, 10);
      }
    }
  });

  it('includes a scenario in which repair is explicitly potentially worse than replacement', () => {
    const result = evaluateScenario(scenarioForPreset('repairWorsens'));
    const classification = classifyAgainstBaseline(result.strategies.new, result.strategies.repairFirst, {
      timeToleranceDays: 0.1,
      targetProbabilityTolerance: 0.001,
      costTolerance: 1,
      criticalUnknowns: [],
    });
    expect(classification.signals.expectedRecoveryTime).toBe('worse');
    expect(classification.signals.targetAttainmentProbability).toBe('worse');
    expect(classification.signals.expectedCashOutlay).toBe('worse');
    expect(classification.nominalOutcome).toBe('potentiallyWorse');
    expect(classification.claimReadiness).toBe('hypothesisOnly');
  });

  it('returns independent scenario copies so UI edits cannot mutate a preset', () => {
    const first = scenarioForPreset('balanced');
    first.timing.newLeadDays = 999;
    expect(scenarioForPreset('balanced').timing.newLeadDays).toBe(85);
  });
});

describe('Phase 3 sensitivity analysis', () => {
  it('evaluates all three strategies at every requested point', () => {
    const analysis = runSensitivity(
      scenarioForPreset('balanced'),
      'repairFeasibilityProbability',
      'expectedRecoveryDays',
    );
    expect(analysis.points).toHaveLength(11);
    expect(analysis.points[0].input).toBe(0);
    expect(analysis.points.at(-1)?.input).toBe(1);
    expect(Object.keys(analysis.points[5].values).sort()).toEqual(['new', 'parallel', 'repairFirst']);
    expect(analysis.points[0].values.new).toBeCloseTo(analysis.points[10].values.new, 10);
  });

  it('clamps explicit joint probability to valid Frechet bounds during a marginal scan', () => {
    const analysis = runSensitivity(
      scenarioForPreset('correlatedRisk'),
      'repairFeasibilityProbability',
      'probabilityTargetMet',
    );
    expect(analysis.jointProbabilityAdjusted).toBe(true);
    expect(analysis.points.every((point) => Object.values(point.values).every(Number.isFinite))).toBe(true);
  });
});

describe('Phase 3 thresholds', () => {
  it('calculates auditable scans for feasibility, duration and contract commitment', () => {
    const thresholds = calculateThresholds(scenarioForPreset('balanced'));
    expect(thresholds.map((threshold) => threshold.id)).toEqual([
      'repairFeasibility',
      'repairDuration',
      'newCancellationFraction',
    ]);
    expect(thresholds[0].status).toBe('available');
    expect(thresholds[0].value).toBeGreaterThan(0);
    expect(thresholds[1].value).not.toBeNull();
  });

  it('does not report a one-dimensional feasibility threshold under explicit dependence', () => {
    const [threshold] = calculateThresholds(scenarioForPreset('correlatedRisk'));
    expect(threshold.status).toBe('unavailable');
    expect(threshold.value).toBeNull();
  });
});

