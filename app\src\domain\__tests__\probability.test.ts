import { describe, expect, it } from 'vitest';
import { DomainValidationError } from '../common/validation';
import { buildRiskTable, jointProbabilityBounds } from '../model/probability';

describe('joint risk table', () => {
  it('derives the independent joint distribution explicitly', () => {
    const table = buildRiskTable({
      repairFeasibilityProbability: 0.75,
      supplierShockProbability: 0.45,
      dependence: { mode: 'independent' },
    });

    expect(table.jointRepairFeasibleAndShockProbability).toBeCloseTo(0.3375, 12);
    expect(table.covariance).toBeCloseTo(0, 12);
    expect(table.phiCorrelation).toBeCloseTo(0, 12);
    expect(table.states.reduce((total, state) => total + state.probability, 0)).toBeCloseTo(1, 12);
  });

  it('accepts a valid non-independent joint probability', () => {
    const table = buildRiskTable({
      repairFeasibilityProbability: 0.7,
      supplierShockProbability: 0.4,
      dependence: { mode: 'joint', repairFeasibleAndShockProbability: 0.35 },
    });

    expect(table.covariance).toBeCloseTo(0.07, 12);
    expect(table.phiCorrelation).toBeGreaterThan(0);
    expect(table.states.map(({ repairFeasible, supplierShock }) => ({ repairFeasible, supplierShock }))).toEqual([
      { repairFeasible: true, supplierShock: true },
      { repairFeasible: true, supplierShock: false },
      { repairFeasible: false, supplierShock: true },
      { repairFeasible: false, supplierShock: false },
    ]);
    expect(table.states.map((state) => state.probability)).toEqual(
      expect.arrayContaining([
        expect.closeTo(0.35, 12),
        expect.closeTo(0.35, 12),
        expect.closeTo(0.05, 12),
        expect.closeTo(0.25, 12),
      ]),
    );
  });

  it('rejects a joint probability outside the Fréchet bounds', () => {
    expect(() =>
      buildRiskTable({
        repairFeasibilityProbability: 0.8,
        supplierShockProbability: 0.7,
        dependence: { mode: 'joint', repairFeasibleAndShockProbability: 0.2 },
      }),
    ).toThrow(DomainValidationError);
  });

  it('calculates Fréchet bounds from the marginals', () => {
    expect(jointProbabilityBounds(0.8, 0.7)).toEqual({ minimum: 0.5, maximum: 0.7 });
  });

  it('produces valid marginals across a deterministic probability grid', () => {
    for (let repairIndex = 0; repairIndex <= 20; repairIndex += 1) {
      for (let shockIndex = 0; shockIndex <= 20; shockIndex += 1) {
        const repair = repairIndex / 20;
        const shock = shockIndex / 20;
        const table = buildRiskTable({
          repairFeasibilityProbability: repair,
          supplierShockProbability: shock,
          dependence: { mode: 'independent' },
        });
        const total = table.states.reduce((value, state) => value + state.probability, 0);
        const repairMarginal = table.states
          .filter((state) => state.repairFeasible)
          .reduce((value, state) => value + state.probability, 0);
        const shockMarginal = table.states
          .filter((state) => state.supplierShock)
          .reduce((value, state) => value + state.probability, 0);
        expect(total).toBeCloseTo(1, 12);
        expect(repairMarginal).toBeCloseTo(repair, 12);
        expect(shockMarginal).toBeCloseTo(shock, 12);
        expect(table.states.every((state) => state.probability >= 0)).toBe(true);
      }
    }
  });

  it('reports correlation as undefined at deterministic marginals', () => {
    const table = buildRiskTable({
      repairFeasibilityProbability: 1,
      supplierShockProbability: 0,
      dependence: { mode: 'independent' },
    });
    expect(table.phiCorrelation).toBeNull();
  });
});
