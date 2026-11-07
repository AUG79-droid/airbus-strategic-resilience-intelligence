import { sum } from '../common/validation';
import type {
  BaseCostInputs,
  BranchEconomics,
  CostCategory,
  CostLineItem,
  ParallelPolicy,
  PathOutcome,
  ResidualAsset,
} from './types';

interface EconomicDraft {
  lineItems: CostLineItem[];
  residualAssets: ResidualAsset[];
}

function addLine(
  draft: EconomicDraft,
  category: CostCategory,
  cashImpact: number,
  sunk: boolean,
  explanation: string,
) {
  if (cashImpact === 0) return;
  draft.lineItems.push({
    id: `${category}-${draft.lineItems.length + 1}`,
    category,
    cashImpact,
    sunk,
    explanation,
  });
}

function addInspection(draft: EconomicDraft, costs: BaseCostInputs) {
  addLine(
    draft,
    'inspection',
    costs.inspection,
    false,
    'Inspection and diagnostic work is consumed before repair feasibility is known.',
  );
}

function addCompletedRepair(
  draft: EconomicDraft,
  costs: BaseCostInputs,
  asInventory: boolean,
  policy?: ParallelPolicy,
) {
  addLine(draft, 'repairCompleted', costs.repair, false, 'The authorised repair is completed.');
  addLine(
    draft,
    'repairLogistics',
    costs.repairLogistics,
    false,
    'Repair-route logistics are incurred for a completed repair.',
  );
  if (asInventory) {
    draft.residualAssets.push({
      type: 'repairedComponentInventory',
      declaredValue: policy?.residualValueRecognition.repairedComponentInventoryValue ?? null,
    });
  }
}

function addCompletedNewPart(
  draft: EconomicDraft,
  costs: BaseCostInputs,
  supplierShock: boolean,
  asInventory: boolean,
  policy?: ParallelPolicy,
) {
  addLine(draft, 'newPartCompleted', costs.newPart, false, 'The new-part procurement is completed.');
  addLine(
    draft,
    'newPartLogistics',
    costs.newPartLogistics,
    false,
    'New-part logistics are incurred for a completed procurement.',
  );
  if (supplierShock) {
    addLine(
      draft,
      'supplierShockSurcharge',
      costs.supplierShockSurcharge,
      false,
      'A shock-related surcharge is included only when explicitly supplied and the new part completes.',
    );
  }
  if (policy && policy.activationCreditOnCompletedPurchase > 0) {
    addLine(
      draft,
      'activationCredit',
      -policy.activationCreditOnCompletedPurchase,
      true,
      'The explicitly declared activation credit is applied against a completed purchase.',
    );
  }
  if (asInventory) {
    draft.residualAssets.push({
      type: 'newPartInventory',
      declaredValue: policy?.residualValueRecognition.newPartInventoryValue ?? null,
    });
  }
}

function addNewCancellation(
  draft: EconomicDraft,
  costs: BaseCostInputs,
  policy: ParallelPolicy,
) {
  const fraction =
    policy.procurementContract === 'firmOrder'
      ? 1
      : policy.newCancellationCommittedFraction;
  addLine(
    draft,
    'newCancellationCommitment',
    fraction * costs.newPart,
    true,
    policy.procurementContract === 'firmOrder'
      ? 'The firm order remains fully committed when the new-part path is cancelled.'
      : 'The contractually committed fraction of the cancelled new-part order is sunk.',
  );
  addLine(
    draft,
    'newCancellationFee',
    policy.newCancellationFee,
    true,
    'The fixed new-part cancellation fee is sunk.',
  );
}

function addRepairCancellation(
  draft: EconomicDraft,
  costs: BaseCostInputs,
  policy: ParallelPolicy,
) {
  addLine(
    draft,
    'repairCancellationCommitment',
    policy.repairCancellationCommittedFraction * costs.repair,
    true,
    'The contractually committed fraction of the cancelled repair is sunk.',
  );
  addLine(
    draft,
    'repairCancellationFee',
    policy.repairCancellationFee,
    true,
    'The fixed repair cancellation fee is sunk.',
  );
}

function finalise(draft: EconomicDraft, policy?: ParallelPolicy): BranchEconomics {
  const totalCashOutlay = sum(draft.lineItems.map((line) => line.cashImpact));
  const sunkCost = sum(
    draft.lineItems.filter((line) => line.sunk).map((line) => line.cashImpact),
  );

  let recognisedResidualValue: number | null = null;
  let netEconomicCost: number | null = null;
  if (policy?.residualValueRecognition.enabled) {
    const values = draft.residualAssets.map((asset) => asset.declaredValue);
    if (values.every((value): value is number => value !== null)) {
      recognisedResidualValue = sum(values);
      netEconomicCost = totalCashOutlay - recognisedResidualValue;
    }
  }

  return {
    lineItems: draft.lineItems,
    totalCashOutlay,
    sunkCost,
    residualAssets: draft.residualAssets,
    recognisedResidualValue,
    netEconomicCost,
  };
}

export function newOnlyEconomics(costs: BaseCostInputs, supplierShock: boolean) {
  const draft: EconomicDraft = { lineItems: [], residualAssets: [] };
  addCompletedNewPart(draft, costs, supplierShock, false);
  return finalise(draft);
}

export function repairFirstEconomics(
  costs: BaseCostInputs,
  repairFeasible: boolean,
  supplierShock: boolean,
) {
  const draft: EconomicDraft = { lineItems: [], residualAssets: [] };
  addInspection(draft, costs);
  if (repairFeasible) addCompletedRepair(draft, costs, false);
  else addCompletedNewPart(draft, costs, supplierShock, false);
  return finalise(draft);
}

function addParallelActivation(draft: EconomicDraft, policy: ParallelPolicy) {
  addLine(
    draft,
    'parallelActivation',
    policy.activationFee,
    true,
    'The parallel procurement route is activated at the decision point; a completed-purchase credit is recorded separately in the branch where it is recovered.',
  );
}

function completeBoth(
  draft: EconomicDraft,
  costs: BaseCostInputs,
  policy: ParallelPolicy,
  supplierShock: boolean,
  usedPath: 'new' | 'repair',
) {
  addCompletedRepair(draft, costs, usedPath === 'new', policy);
  addCompletedNewPart(draft, costs, supplierShock, usedPath === 'repair', policy);
}

export function parallelEconomics(
  costs: BaseCostInputs,
  policy: ParallelPolicy,
  repairFeasible: boolean,
  supplierShock: boolean,
  pathOutcome: PathOutcome,
) {
  const draft: EconomicDraft = { lineItems: [], residualAssets: [] };
  addInspection(draft, costs);
  addParallelActivation(draft, policy);

  if (!repairFeasible) {
    addCompletedNewPart(draft, costs, supplierShock, false, policy);
    return finalise(draft, policy);
  }

  if (pathOutcome === 'repair') {
    addCompletedRepair(draft, costs, false, policy);
    if (policy.onRepairWins === 'completeNewToInventory') {
      addCompletedNewPart(draft, costs, supplierShock, true, policy);
    } else {
      addNewCancellation(draft, costs, policy);
    }
    return finalise(draft, policy);
  }

  if (pathOutcome === 'new') {
    addCompletedNewPart(draft, costs, supplierShock, false, policy);
    if (policy.onNewWins === 'completeRepairToInventory') {
      addCompletedRepair(draft, costs, true, policy);
    } else {
      addRepairCancellation(draft, costs, policy);
    }
    return finalise(draft, policy);
  }

  if (policy.tiePolicy === 'useRepairCancelNew') {
    addCompletedRepair(draft, costs, false, policy);
    addNewCancellation(draft, costs, policy);
  } else if (policy.tiePolicy === 'useNewCancelRepair') {
    addCompletedNewPart(draft, costs, supplierShock, false, policy);
    addRepairCancellation(draft, costs, policy);
  } else if (policy.tiePolicy === 'completeBothUseRepair') {
    completeBoth(draft, costs, policy, supplierShock, 'repair');
  } else {
    completeBoth(draft, costs, policy, supplierShock, 'new');
  }
  return finalise(draft, policy);
}
