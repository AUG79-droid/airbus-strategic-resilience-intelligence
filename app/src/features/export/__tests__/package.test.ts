import { describe, expect, it } from 'vitest';
import { classifyAgainstBaseline, evaluateEnvironmentalIndicators, evaluateScenario } from '../../../domain';
import { evaluateClaimGates } from '../../evidence/claims';
import { scenarioForPreset } from '../../lab/presets';
import { buildStrategicTranslation } from '../../translator/translator';
import { buildExportPackage, serialiseExportPackage, validateExportPackage } from '../package';
import { MODEL_VERSION, PROTOTYPE_WARNING } from '../types';

function fixture() {
  const scenario = scenarioForPreset('balanced');
  const result = evaluateScenario(scenario);
  const options = { timeToleranceDays: 0.1, targetProbabilityTolerance: 0.001, costTolerance: 1, criticalUnknowns: [] };
  const repairClassification = classifyAgainstBaseline(result.strategies.new, result.strategies.repairFirst, options);
  const parallelClassification = classifyAgainstBaseline(result.strategies.new, result.strategies.parallel, options);
  const environmental = {
    repairFirst: evaluateEnvironmentalIndicators(result.strategies.new, result.strategies.repairFirst, {}),
    parallel: evaluateEnvironmentalIndicators(result.strategies.new, result.strategies.parallel, {}),
  };
  const claims = evaluateClaimGates({ repairClassification, environmental: environmental.repairFirst });
  const translation = buildStrategicTranslation({ locale: 'es', audience: 'programmeManager', strategy: 'parallel', result, repairClassification, parallelClassification, environmental, claims });
  return buildExportPackage({
    locale: 'es', audience: 'programmeManager', strategy: 'parallel', scenarioLabel: 'Caso equilibrado', scenario, result, environmental, translation, claims,
    assumptions: [{ id: 'TEST-INPUT', label: { en: 'Test input', es: 'Entrada de prueba' }, value: 'fictional', provenance: 'fictionalUserInput' }],
    modelOutputs: [], records: [], sources: [], generatedAt: '2026-11-07T12:00:00.000Z',
  });
}

describe('reproducible export package', () => {
  it('includes the model version, full inputs, results and evidence state', () => {
    const data = fixture();
    expect(data.modelVersion).toBe(MODEL_VERSION);
    expect(data.warning).toBe(PROTOTYPE_WARNING);
    expect(data.selection).toEqual({ audience: 'programmeManager', strategy: 'parallel', scenario: 'Caso equilibrado' });
    expect(data.scenarioInputs.parallel.procurementContract).toBeTruthy();
    expect(data.scenarioResults.strategies.parallel.branches.length).toBeGreaterThan(0);
    expect(data.evidence.claimGates).toHaveLength(5);
    expect(JSON.parse(serialiseExportPackage(data))).toEqual(data);
  });

  it('never promotes blocked or rejected claims to demonstrated benefits', () => {
    const data = fixture();
    const validation = validateExportPackage(data);
    expect(validation.safe).toBe(true);
    expect(data.exportPolicy.validatedBenefits).toEqual([]);
    expect(data.translation.validatedBenefitCount).toBe(0);
    expect(data.evidence.claimGates.some((claim) => claim.status === 'blocked' || claim.status === 'rejected')).toBe(true);
    expect(data.translation.traceItems.some((item) => item.status === 'validatedBenefit')).toBe(false);
  });

  it('fails safely if a blocked claim is relabelled as validated', () => {
    const data = fixture();
    const blocked = data.evidence.claimGates.find((claim) => claim.status === 'blocked');
    expect(blocked).toBeTruthy();
    data.translation.traceItems.push({ id: 'unsafe', statement: 'unsafe', status: 'validatedBenefit', evidenceIds: [], modelOutputIds: [], claimId: blocked!.id, focus: { type: 'claim', id: blocked!.id } });
    expect(validateExportPackage(data).safe).toBe(false);
  });
});
