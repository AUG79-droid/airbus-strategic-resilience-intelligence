import { DomainValidationError, assertFiniteNonNegative, sum } from '../common/validation';
import type { ModelBranch, StrategyResult } from '../model/types';
import type {
  EnvironmentalAssessment,
  EnvironmentalEvidenceStatus,
  EnvironmentalFactor,
  EnvironmentalFactors,
  EnvironmentalIndicator,
  EnvironmentalIndicatorId,
  ExpectedEnvironmentalEvents,
} from './types';

function weightedKnownCount(
  branches: ModelBranch[],
  selector: (branch: ModelBranch) => number | null,
) {
  if (branches.some((branch) => branch.probability > 0 && selector(branch) === null)) return null;
  return sum(branches.map((branch) => branch.probability * (selector(branch) ?? 0)));
}

function newPartManufacturedCount(branch: ModelBranch) {
  const outcome = branch.environmentalEvents.newPartOutcome;
  if (outcome === 'notInitiated' || outcome === 'cancelledBeforeManufacture') return 0;
  if (outcome === 'completedUsed' || outcome === 'completedInventory') return 1;
  return null;
}

function originalDisposedCount(branch: ModelBranch) {
  const outcome = branch.environmentalEvents.originalComponentOutcome;
  if (outcome === 'disposed') return 1;
  if (outcome === 'repairedUsed' || outcome === 'repairedInventory') return 0;
  return null;
}

export function expectedEnvironmentalEvents(result: StrategyResult): ExpectedEnvironmentalEvents {
  return {
    newPartsManufactured: weightedKnownCount(result.branches, newPartManufacturedCount),
    newPartsDelivered: sum(
      result.branches.map((branch) =>
        branch.probability * (branch.environmentalEvents.newPartDelivered ? 1 : 0),
      ),
    ),
    repairsCompleted: sum(
      result.branches.map((branch) =>
        branch.probability * (branch.environmentalEvents.repairCompleted ? 1 : 0),
      ),
    ),
    repairsReturnedToUse: sum(
      result.branches.map((branch) =>
        branch.probability *
        (branch.environmentalEvents.originalComponentOutcome === 'repairedUsed' ? 1 : 0),
      ),
    ),
    originalComponentsDisposed: weightedKnownCount(result.branches, originalDisposedCount),
    unknownNewPartPhysicalProbability: sum(
      result.branches
        .filter((branch) => newPartManufacturedCount(branch) === null)
        .map((branch) => branch.probability),
    ),
    unknownOriginalDispositionProbability: sum(
      result.branches
        .filter((branch) => originalDisposedCount(branch) === null)
        .map((branch) => branch.probability),
    ),
  };
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function factorMetadata(factors: EnvironmentalFactor[]) {
  return {
    evidenceStatuses: unique(factors.map((factor) => factor.evidenceStatus)),
    sourceIds: unique(factors.flatMap((factor) => factor.sourceIds)),
    boundary: factors.map((factor) => factor.boundary).join(' | '),
  };
}

function notQuantified(
  id: EnvironmentalIndicatorId,
  unit: string,
  direction: EnvironmentalIndicator['direction'],
  missingInputs: string[],
  limitations: string[],
): EnvironmentalIndicator {
  return {
    id,
    status: 'notQuantified',
    value: null,
    unit,
    direction,
    baselineValue: null,
    candidateValue: null,
    missingInputs,
    evidenceStatuses: [],
    sourceIds: [],
    boundary: 'Not established because required factors or physical outcomes are missing.',
    limitations,
  };
}

function modelled(
  id: EnvironmentalIndicatorId,
  unit: string,
  direction: EnvironmentalIndicator['direction'],
  baselineValue: number,
  candidateValue: number,
  factors: EnvironmentalFactor[],
  limitations: string[],
): EnvironmentalIndicator {
  const metadata = factorMetadata(factors);
  return {
    id,
    status: 'modelled',
    value: candidateValue - baselineValue,
    unit,
    direction,
    baselineValue,
    candidateValue,
    missingInputs: [],
    evidenceStatuses: metadata.evidenceStatuses,
    sourceIds: metadata.sourceIds,
    boundary: metadata.boundary || 'Single component-recovery decision event.',
    limitations,
  };
}

function validateFactors(factors: EnvironmentalFactors) {
  const issues: string[] = [];
  for (const [key, factor] of Object.entries(factors)) {
    if (!factor) continue;
    assertFiniteNonNegative(factor.value, `environmentalFactors.${key}.value`, issues);
    if (!factor.unit.trim()) issues.push(`environmentalFactors.${key}.unit must not be empty.`);
    if (!factor.boundary.trim()) issues.push(`environmentalFactors.${key}.boundary must not be empty.`);
    if (factor.evidenceStatus === 'documented' && factor.sourceIds.length === 0) {
      issues.push(`environmentalFactors.${key} is documented but has no sourceIds.`);
    }
  }
  if (
    factors.originalComponentDisposalMassKg &&
    factors.repairProcessWasteKg &&
    factors.originalComponentDisposalMassKg.unit !== factors.repairProcessWasteKg.unit
  ) {
    issues.push('Waste factors must use the same unit.');
  }
  const ghgUnits = [
    factors.newPartManufacturingKgCo2e,
    factors.repairProcessKgCo2e,
    factors.newPartLogisticsKgCo2e,
    factors.repairLogisticsKgCo2e,
  ]
    .filter((factor): factor is EnvironmentalFactor => factor !== undefined)
    .map((factor) => factor.unit);
  if (new Set(ghgUnits).size > 1) issues.push('GHG factors must use the same unit.');
  if (issues.length > 0) throw new DomainValidationError(issues);
}

function physicalUnknownLimitations(events: ExpectedEnvironmentalEvents) {
  const limitations: string[] = [];
  if (events.unknownNewPartPhysicalProbability > 0) {
    limitations.push(
      'Commercial cancellation does not establish whether new-part manufacturing physically stopped.',
    );
  }
  if (events.unknownOriginalDispositionProbability > 0) {
    limitations.push('The physical disposition of the original component is unknown.');
  }
  return limitations;
}

export function evaluateEnvironmentalIndicators(
  baseline: StrategyResult,
  candidate: StrategyResult,
  factors: EnvironmentalFactors,
): EnvironmentalAssessment {
  validateFactors(factors);
  const baselineEvents = expectedEnvironmentalEvents(baseline);
  const candidateEvents = expectedEnvironmentalEvents(candidate);
  const unknownLimitations = physicalUnknownLimitations(candidateEvents);
  const indicators: EnvironmentalIndicator[] = [];

  if (
    baselineEvents.newPartsManufactured === null ||
    candidateEvents.newPartsManufactured === null
  ) {
    indicators.push(
      notQuantified(
        'newManufactureAvoidedUnits',
        'components / decision',
        'higherIsBetter',
        ['physical outcome of the new-part path after cancellation'],
        unknownLimitations,
      ),
    );
  } else {
    indicators.push({
      id: 'newManufactureAvoidedUnits',
      status: 'modelled',
      value: baselineEvents.newPartsManufactured - candidateEvents.newPartsManufactured,
      unit: 'components / decision',
      direction: 'higherIsBetter',
      baselineValue: 0,
      candidateValue: baselineEvents.newPartsManufactured - candidateEvents.newPartsManufactured,
      missingInputs: [],
      evidenceStatuses: [],
      sourceIds: [],
      boundary: 'Single component-recovery decision event; manufacture is counted only when the physical outcome is known.',
      limitations: [
        'A commercial cancellation is not treated as avoided manufacture unless the physical outcome says cancellation occurred before manufacture.',
      ],
    });
  }

  const materialFactor = factors.newPartVirginMaterialKg;
  if (
    !materialFactor ||
    baselineEvents.newPartsManufactured === null ||
    candidateEvents.newPartsManufactured === null
  ) {
    indicators.push(
      notQuantified(
        'virginMaterialDemandDeltaKg',
        'kg',
        'lowerIsBetter',
        [
          ...(!materialFactor ? ['newPartVirginMaterialKg'] : []),
          ...(candidateEvents.newPartsManufactured === null
            ? ['physical outcome of the new-part path after cancellation']
            : []),
        ],
        unknownLimitations,
      ),
    );
  } else {
    indicators.push(
      modelled(
        'virginMaterialDemandDeltaKg',
        materialFactor.unit,
        'lowerIsBetter',
        baselineEvents.newPartsManufactured * materialFactor.value,
        candidateEvents.newPartsManufactured * materialFactor.value,
        [materialFactor],
        ['This indicator does not include manufacturing yield losses unless they are already included in the supplied factor.'],
      ),
    );
  }

  const disposalFactor = factors.originalComponentDisposalMassKg;
  const repairWasteFactor = factors.repairProcessWasteKg;
  if (
    !disposalFactor ||
    !repairWasteFactor ||
    baselineEvents.originalComponentsDisposed === null ||
    candidateEvents.originalComponentsDisposed === null
  ) {
    indicators.push(
      notQuantified(
        'wasteGeneratedDeltaKg',
        'kg',
        'lowerIsBetter',
        [
          ...(!disposalFactor ? ['originalComponentDisposalMassKg'] : []),
          ...(!repairWasteFactor ? ['repairProcessWasteKg'] : []),
          ...(candidateEvents.originalComponentsDisposed === null
            ? ['physical disposition of the original component']
            : []),
        ],
        unknownLimitations,
      ),
    );
  } else {
    const baselineWaste =
      baselineEvents.originalComponentsDisposed * disposalFactor.value +
      baselineEvents.repairsCompleted * repairWasteFactor.value;
    const candidateWaste =
      candidateEvents.originalComponentsDisposed * disposalFactor.value +
      candidateEvents.repairsCompleted * repairWasteFactor.value;
    indicators.push(
      modelled(
        'wasteGeneratedDeltaKg',
        disposalFactor.unit,
        'lowerIsBetter',
        baselineWaste,
        candidateWaste,
        [disposalFactor, repairWasteFactor],
        ['Waste treatment, replaced subcomponents and recycling credits are outside the calculation unless included in the supplied factors.'],
      ),
    );
  }

  const ghgFactors = [
    factors.newPartManufacturingKgCo2e,
    factors.repairProcessKgCo2e,
    factors.newPartLogisticsKgCo2e,
    factors.repairLogisticsKgCo2e,
  ];
  if (
    ghgFactors.some((factor) => !factor) ||
    baselineEvents.newPartsManufactured === null ||
    candidateEvents.newPartsManufactured === null
  ) {
    indicators.push(
      notQuantified(
        'boundedGhgDeltaKgCo2e',
        'kg CO₂e',
        'lowerIsBetter',
        [
          ...(!factors.newPartManufacturingKgCo2e ? ['newPartManufacturingKgCo2e'] : []),
          ...(!factors.repairProcessKgCo2e ? ['repairProcessKgCo2e'] : []),
          ...(!factors.newPartLogisticsKgCo2e ? ['newPartLogisticsKgCo2e'] : []),
          ...(!factors.repairLogisticsKgCo2e ? ['repairLogisticsKgCo2e'] : []),
          ...(candidateEvents.newPartsManufactured === null
            ? ['physical outcome of the new-part path after cancellation']
            : []),
        ],
        unknownLimitations,
      ),
    );
  } else {
    const [manufacturing, repair, newLogistics, repairLogistics] = ghgFactors as EnvironmentalFactor[];
    const footprint = (events: ExpectedEnvironmentalEvents) =>
      (events.newPartsManufactured ?? 0) * manufacturing.value +
      events.repairsCompleted * repair.value +
      events.newPartsDelivered * newLogistics.value +
      events.repairsCompleted * repairLogistics.value;
    indicators.push(
      modelled(
        'boundedGhgDeltaKgCo2e',
        manufacturing.unit,
        'lowerIsBetter',
        footprint(baselineEvents),
        footprint(candidateEvents),
        [manufacturing, repair, newLogistics, repairLogistics],
        [
          'The result is a modelled scenario delta, not an Airbus product footprint or verified lifecycle assessment.',
          'End-of-life treatment and use-phase effects are excluded unless embedded in the supplied factors.',
        ],
      ),
    );
  }

  const lifeExtensionFactor = factors.approvedLifeExtensionHoursPerRepair;
  if (!lifeExtensionFactor) {
    indicators.push(
      notQuantified(
        'serviceLifeExtensionHours',
        'hours',
        'higherIsBetter',
        ['approvedLifeExtensionHoursPerRepair'],
        ['Technical life extension must come from approved engineering data.'],
      ),
    );
  } else {
    indicators.push({
      ...modelled(
        'serviceLifeExtensionHours',
        lifeExtensionFactor.unit,
        'higherIsBetter',
        baselineEvents.repairsReturnedToUse * lifeExtensionFactor.value,
        candidateEvents.repairsReturnedToUse * lifeExtensionFactor.value,
        [lifeExtensionFactor],
        ['Inventory repairs are not counted as service-life extension until returned to use.'],
      ),
      value:
        candidateEvents.repairsReturnedToUse * lifeExtensionFactor.value -
        baselineEvents.repairsReturnedToUse * lifeExtensionFactor.value,
    });
  }

  return {
    baselineStrategy: baseline.strategy,
    candidateStrategy: candidate.strategy,
    baselineEvents,
    candidateEvents,
    indicators,
  };
}

export function evidenceStatusesUsed(assessment: EnvironmentalAssessment) {
  return unique(
    assessment.indicators.flatMap(
      (indicator) => indicator.evidenceStatuses,
    ),
  ) as EnvironmentalEvidenceStatus[];
}
