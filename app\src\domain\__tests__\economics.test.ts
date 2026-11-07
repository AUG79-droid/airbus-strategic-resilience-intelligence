import { describe, expect, it } from 'vitest';
import { evaluateScenario } from '../model/engine';
import type { ModelBranch } from '../model/types';
import { fictionalScenario } from './fixtures';

function branch(
  branches: ModelBranch[],
  repairFeasible: boolean,
  supplierShock: boolean,
) {
  const result = branches.find(
    (candidate) =>
      candidate.repairFeasible === repairFeasible &&
      candidate.supplierShock === supplierShock,
  );
  if (!result) throw new Error('Expected branch was not generated.');
  return result;
}

describe('branch-level economics', () => {
  it('matches the explicit expected-cost equations for the fictional base fixture', () => {
    const strategies = evaluateScenario(fictionalScenario()).strategies;
    expect(strategies.new.expectedCashOutlay).toBeCloseTo(140_000, 12);
    expect(strategies.repairFirst.expectedCashOutlay).toBeCloseTo(79_000, 12);
    expect(strategies.parallel.expectedCashOutlay).toBeCloseTo(111_250, 12);
    expect(strategies.parallel.expectedSunkCost).toBeCloseTo(32_250, 12);
    expect(strategies.parallel.maximumCashCommitment).toBe(160_000);
  });

  it('charges the full new-part commitment when a firm order is cancelled after repair wins', () => {
    const input = fictionalScenario();
    input.parallel.procurementContract = 'firmOrder';
    const result = evaluateScenario(input);
    const repairWins = branch(result.strategies.parallel.branches, true, false);
    const commitment = repairWins.economics.lineItems.find(
      (line) => line.category === 'newCancellationCommitment',
    );

    expect(repairWins.pathOutcome).toBe('repair');
    expect(commitment?.cashImpact).toBe(140_000);
    expect(commitment?.sunk).toBe(true);
    expect(repairWins.economics.totalCashOutlay).toBe(214_000);
  });

  it('applies the explicit fraction and fee to a cancellable new-part order', () => {
    const result = evaluateScenario(fictionalScenario());
    const repairWins = branch(result.strategies.parallel.branches, true, false);

    expect(
      repairWins.economics.lineItems.find(
        (line) => line.category === 'newCancellationCommitment',
      )?.cashImpact,
    ).toBe(21_000);
    expect(
      repairWins.economics.lineItems.find((line) => line.category === 'newCancellationFee')
        ?.cashImpact,
    ).toBe(2_000);
    expect(repairWins.economics.totalCashOutlay).toBe(95_000);
    expect(repairWins.economics.sunkCost).toBe(38_000);
  });

  it('charges the repair cancellation commitment when the new part wins', () => {
    const input = fictionalScenario();
    input.timing.repairExecutionDays = 120;
    const result = evaluateScenario(input);
    const newWins = branch(result.strategies.parallel.branches, true, false);

    expect(newWins.pathOutcome).toBe('new');
    expect(
      newWins.economics.lineItems.find(
        (line) => line.category === 'repairCancellationCommitment',
      )?.cashImpact,
    ).toBe(13_000);
    expect(
      newWins.economics.lineItems.find((line) => line.category === 'repairCancellationFee')
        ?.cashImpact,
    ).toBe(1_000);
    expect(newWins.economics.totalCashOutlay).toBe(174_000);
  });

  it('keeps residual assets separate from cash outlay and recognises value only when enabled', () => {
    const input = fictionalScenario();
    input.parallel.onRepairWins = 'completeNewToInventory';
    input.parallel.residualValueRecognition = {
      enabled: true,
      newPartInventoryValue: 100_000,
    };
    const result = evaluateScenario(input);
    const repairWins = branch(result.strategies.parallel.branches, true, false);

    expect(repairWins.economics.totalCashOutlay).toBe(212_000);
    expect(repairWins.economics.recognisedResidualValue).toBe(100_000);
    expect(repairWins.economics.netEconomicCost).toBe(112_000);
    expect(repairWins.economics.residualAssets).toEqual([
      { type: 'newPartInventory', declaredValue: 100_000 },
    ]);
  });

  it('does not fabricate net cost when a residual asset has no declared value', () => {
    const input = fictionalScenario();
    input.parallel.onRepairWins = 'completeNewToInventory';
    input.parallel.residualValueRecognition = { enabled: true };
    const result = evaluateScenario(input);
    const repairWins = branch(result.strategies.parallel.branches, true, false);

    expect(repairWins.economics.recognisedResidualValue).toBeNull();
    expect(repairWins.economics.netEconomicCost).toBeNull();
  });

  it('applies activation credit only to a completed purchase', () => {
    const input = fictionalScenario();
    input.parallel.activationCreditOnCompletedPurchase = 10_000;
    const result = evaluateScenario(input);
    const repairWins = branch(result.strategies.parallel.branches, true, false);
    const repairInfeasible = branch(result.strategies.parallel.branches, false, false);

    expect(
      repairWins.economics.lineItems.some((line) => line.category === 'activationCredit'),
    ).toBe(false);
    expect(
      repairInfeasible.economics.lineItems.find((line) => line.category === 'activationCredit')
        ?.cashImpact,
    ).toBe(-10_000);
    expect(repairInfeasible.economics.sunkCost).toBe(5_000);
  });

  it('enumerates tie obligations according to the explicit tie policy', () => {
    const input = fictionalScenario();
    input.risks.repairFeasibilityProbability = 1;
    input.risks.supplierShockProbability = 0;
    input.timing.newLeadDays = 28;
    input.parallel.tiePolicy = 'completeBothUseRepair';
    input.parallel.residualValueRecognition = {
      enabled: true,
      newPartInventoryValue: 90_000,
    };
    const tie = evaluateScenario(input).strategies.parallel.branches[0];

    expect(tie?.pathOutcome).toBe('tie');
    expect(tie?.economics.totalCashOutlay).toBe(212_000);
    expect(tie?.economics.residualAssets[0]).toEqual({
      type: 'newPartInventory',
      declaredValue: 90_000,
    });
  });

  it('derives expected cost from the weighted branch ledger', () => {
    const result = evaluateScenario(fictionalScenario()).strategies.parallel;
    const weighted = result.branches.reduce(
      (total, item) => total + item.probability * item.economics.totalCashOutlay,
      0,
    );
    expect(result.expectedCashOutlay).toBeCloseTo(weighted, 12);
  });
});
