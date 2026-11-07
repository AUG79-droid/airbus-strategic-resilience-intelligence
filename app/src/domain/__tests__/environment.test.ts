import { describe, expect, it } from 'vitest';
import { DomainValidationError } from '../common/validation';
import {
  evaluateEnvironmentalIndicators,
  evidenceStatusesUsed,
} from '../environment/indicators';
import { evaluateScenario } from '../model/engine';
import {
  fictionalEnvironmentalFactors,
  fictionalScenario,
} from './fixtures';

describe('environmental indicators', () => {
  it('keeps factor-dependent indicators unquantified when factors are absent', () => {
    const result = evaluateScenario(fictionalScenario()).strategies;
    const assessment = evaluateEnvironmentalIndicators(result.new, result.repairFirst, {});

    expect(
      assessment.indicators.find((item) => item.id === 'newManufactureAvoidedUnits')
        ?.status,
    ).toBe('modelled');
    for (const id of [
      'virginMaterialDemandDeltaKg',
      'wasteGeneratedDeltaKg',
      'boundedGhgDeltaKgCo2e',
      'serviceLifeExtensionHours',
    ]) {
      const indicator = assessment.indicators.find((item) => item.id === id);
      expect(indicator?.status).toBe('notQuantified');
      expect(indicator?.value).toBeNull();
      expect(indicator?.missingInputs.length).toBeGreaterThan(0);
    }
  });

  it('does not equate commercial cancellation with avoided manufacture', () => {
    const input = fictionalScenario();
    input.parallel.cancelledNewPhysicalOutcome = 'unknown';
    const result = evaluateScenario(input).strategies;
    const assessment = evaluateEnvironmentalIndicators(result.new, result.parallel, {});
    const indicator = assessment.indicators.find(
      (item) => item.id === 'newManufactureAvoidedUnits',
    );

    expect(indicator?.status).toBe('notQuantified');
    expect(indicator?.limitations.join(' ')).toContain('Commercial cancellation');
  });

  it('quantifies avoided manufacture only when cancellation before manufacture is explicit', () => {
    const input = fictionalScenario();
    input.parallel.cancelledNewPhysicalOutcome = 'cancelledBeforeManufacture';
    const result = evaluateScenario(input).strategies;
    const assessment = evaluateEnvironmentalIndicators(result.new, result.parallel, {});
    const indicator = assessment.indicators.find(
      (item) => item.id === 'newManufactureAvoidedUnits',
    );

    expect(indicator?.status).toBe('modelled');
    expect(indicator?.value).toBeCloseTo(0.75, 12);
  });

  it('computes transparent fictional deltas when all factors are supplied', () => {
    const result = evaluateScenario(fictionalScenario()).strategies;
    const assessment = evaluateEnvironmentalIndicators(
      result.new,
      result.repairFirst,
      fictionalEnvironmentalFactors(),
    );
    const value = (id: string) => assessment.indicators.find((item) => item.id === id)?.value;

    expect(value('newManufactureAvoidedUnits')).toBeCloseTo(0.75, 12);
    expect(value('virginMaterialDemandDeltaKg')).toBeCloseTo(-7.5, 12);
    expect(value('wasteGeneratedDeltaKg')).toBeCloseTo(-6.75, 12);
    expect(value('boundedGhgDeltaKgCo2e')).toBeCloseTo(-63.75, 12);
    expect(value('serviceLifeExtensionHours')).toBeCloseTo(750, 12);
    expect(evidenceStatusesUsed(assessment)).toEqual(['modelledExample']);
  });

  it('does not claim avoided manufacture when the new part completes to inventory', () => {
    const input = fictionalScenario();
    input.parallel.onRepairWins = 'completeNewToInventory';
    const result = evaluateScenario(input).strategies;
    const assessment = evaluateEnvironmentalIndicators(result.new, result.parallel, {});
    const indicator = assessment.indicators.find(
      (item) => item.id === 'newManufactureAvoidedUnits',
    );

    expect(indicator?.status).toBe('modelled');
    expect(indicator?.value).toBeCloseTo(0, 12);
  });

  it('rejects negative environmental factors', () => {
    const result = evaluateScenario(fictionalScenario()).strategies;
    const factors = fictionalEnvironmentalFactors();
    factors.newPartVirginMaterialKg = {
      ...factors.newPartVirginMaterialKg!,
      value: -1,
    };
    expect(() =>
      evaluateEnvironmentalIndicators(result.new, result.repairFirst, factors),
    ).toThrow(DomainValidationError);
  });

  it('does not quantify waste when the replacement disposition is unknown', () => {
    const input = fictionalScenario();
    input.environmentalPolicy.originalComponentOutcomeWhenReplaced = 'unknown';
    const result = evaluateScenario(input).strategies;
    const assessment = evaluateEnvironmentalIndicators(
      result.new,
      result.repairFirst,
      fictionalEnvironmentalFactors(),
    );
    const waste = assessment.indicators.find((item) => item.id === 'wasteGeneratedDeltaKg');
    expect(waste?.status).toBe('notQuantified');
    expect(waste?.value).toBeNull();
  });

  it('requires sources for factors labelled as documented', () => {
    const result = evaluateScenario(fictionalScenario()).strategies;
    const factors = fictionalEnvironmentalFactors();
    factors.newPartVirginMaterialKg = {
      ...factors.newPartVirginMaterialKg!,
      evidenceStatus: 'documented',
      sourceIds: [],
    };
    expect(() =>
      evaluateEnvironmentalIndicators(result.new, result.repairFirst, factors),
    ).toThrow(DomainValidationError);
  });

  it('rejects incompatible units inside the same indicator', () => {
    const result = evaluateScenario(fictionalScenario()).strategies;
    const factors = fictionalEnvironmentalFactors();
    factors.repairProcessWasteKg = {
      ...factors.repairProcessWasteKg!,
      unit: 'tonnes',
    };
    expect(() =>
      evaluateEnvironmentalIndicators(result.new, result.repairFirst, factors),
    ).toThrow(DomainValidationError);
  });
});
