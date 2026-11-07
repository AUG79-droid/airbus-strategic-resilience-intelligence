import type {
  ComparativeClassification,
  EnvironmentalAssessment,
  ScenarioInputs,
  ScenarioResult,
  StrategyId,
} from '../../domain';
import type { EvidenceAssumption, EvidenceModelOutput, EvidenceRecord } from './types';

const reviewed = '2026-11-07';

export function buildAssumptions(scenario: ScenarioInputs): EvidenceAssumption[] {
  const dependence = scenario.risks.dependence.mode === 'independent'
    ? 'independent'
    : `joint=${scenario.risks.dependence.repairFeasibleAndShockProbability}`;
  return [
    {
      id: 'ASSUMP-TIMING',
      label: { en: 'Timing inputs', es: 'Datos de plazos' },
      value: `inspection=${scenario.timing.inspectionDays} d; repair=${scenario.timing.repairExecutionDays} d; new=${scenario.timing.newLeadDays} d; shock=${scenario.timing.supplierShockDelayDays} d; target=${scenario.timing.targetRecoveryDays} d`,
      provenance: 'fictionalUserInput',
    },
    {
      id: 'ASSUMP-RISK',
      label: { en: 'Risk inputs', es: 'Datos de riesgo' },
      value: `P(repair feasible)=${scenario.risks.repairFeasibilityProbability}; P(shock)=${scenario.risks.supplierShockProbability}; ${dependence}`,
      provenance: 'fictionalUserInput',
    },
    {
      id: 'ASSUMP-COST',
      label: { en: 'Base cost inputs', es: 'Datos de costes base' },
      value: `inspection=€${scenario.costs.inspection}; repair=€${scenario.costs.repair}; new=€${scenario.costs.newPart}; repair logistics=€${scenario.costs.repairLogistics}; new logistics=€${scenario.costs.newPartLogistics}; shock surcharge=€${scenario.costs.supplierShockSurcharge}`,
      provenance: 'fictionalUserInput',
    },
    {
      id: 'ASSUMP-CONTRACT',
      label: { en: 'Parallel-path contract policy', es: 'Política contractual de vía paralela' },
      value: `${scenario.parallel.procurementContract}; activation=€${scenario.parallel.activationFee}; new cancellation commitment=${scenario.parallel.newCancellationCommittedFraction}; repair cancellation commitment=${scenario.parallel.repairCancellationCommittedFraction}; residual values=${scenario.parallel.residualValueRecognition.enabled ? 'declared' : 'not recognised'}`,
      provenance: 'explicitPolicy',
    },
  ];
}

export function buildModelOutputs(result: ScenarioResult): EvidenceModelOutput[] {
  return (Object.keys(result.strategies) as StrategyId[]).flatMap((strategy) => {
    const output = result.strategies[strategy];
    return [
      {
        id: `MODEL-${strategy}-TIME`,
        label: { en: `${strategy} expected recovery`, es: `Recuperación esperada de ${strategy}` },
        value: `${output.expectedRecoveryDays.toFixed(2)} days`,
        formula: 'Σ branch probability × branch recovery days',
        status: 'modelledExample' as const,
      },
      {
        id: `MODEL-${strategy}-TARGET`,
        label: { en: `${strategy} target attainment`, es: `Cumplimiento del objetivo de ${strategy}` },
        value: `${(output.probabilityTargetMet * 100).toFixed(2)}%`,
        formula: 'Σ probabilities of branches where recoveryDays ≤ targetDays',
        status: 'modelledExample' as const,
      },
      {
        id: `MODEL-${strategy}-COST`,
        label: { en: `${strategy} expected cash outlay`, es: `Desembolso esperado de ${strategy}` },
        value: `€${output.expectedCashOutlay.toFixed(2)}`,
        formula: 'Σ branch probability × explicit branch cash obligations',
        status: 'modelledExample' as const,
      },
    ];
  });
}

export function buildEvidenceRecords(args: {
  result: ScenarioResult;
  classifications: Record<'repairFirst' | 'parallel', ComparativeClassification>;
  environmental: Record<'repairFirst' | 'parallel', EnvironmentalAssessment>;
  environmentalEnabled: boolean;
}): EvidenceRecord[] {
  const repair = args.result.strategies.repairFirst;
  const repairClassification = args.classifications.repairFirst;
  const environmentalModelIds = args.environmental.repairFirst.indicators
    .filter((indicator) => indicator.status === 'modelled')
    .map((indicator) => `ENV-repairFirst-${indicator.id}`);
  return [
    {
      id: 'EVD-SERVICE-OFFERING',
      title: { en: 'Airbus publicly describes material and repair support', es: 'Airbus describe públicamente apoyo de material y reparación' },
      statement: { en: 'Airbus Defence publicly offers services addressing material availability, repairs and exchange items.', es: 'Airbus Defence ofrece públicamente servicios relacionados con disponibilidad de material, reparaciones e intercambios.' },
      status: 'documentedFact', stages: ['initiative'], strategyIds: ['repairFirst', 'parallel'], sourceIds: ['AIRBUS-MMS-01'], assumptionIds: [], modelOutputIds: [],
      limitations: { en: ['A service description is not evidence of performance in this fictional case.'], es: ['La descripción de un servicio no demuestra su rendimiento en este caso ficticio.'] },
      requiredInformation: [], lastReviewed: reviewed, reviewer: 'Prototype public-source review',
    },
    {
      id: 'EVD-CIRCULARITY',
      title: { en: 'Repair is identified as a circularity approach', es: 'La reparación se identifica como enfoque de circularidad' },
      statement: { en: 'Airbus places repair among approaches intended to extend product lifespan.', es: 'Airbus incluye la reparación entre los enfoques destinados a prolongar la vida de los productos.' },
      status: 'documentedFact', stages: ['initiative', 'environmentalMechanism'], strategyIds: ['repairFirst', 'parallel'], sourceIds: ['AIRBUS-CIRC-01', 'AIRBUS-AR25-01'], assumptionIds: [], modelOutputIds: [],
      limitations: { en: ['The sources do not quantify the environmental effect of the modelled component decision.'], es: ['Las fuentes no cuantifican el efecto ambiental de la decisión modelizada sobre el componente.'] },
      requiredInformation: [{ owner: 'sustainability', request: { en: 'Component-specific lifecycle boundary and verified inventory factors.', es: 'Frontera de ciclo de vida específica del componente y factores de inventario verificados.' } }], lastReviewed: reviewed, reviewer: 'Prototype public-source review',
    },
    {
      id: 'EVD-AIRWORTHINESS',
      title: { en: 'Repair requires applicable approved maintenance controls', es: 'La reparación requiere controles de mantenimiento aprobados aplicables' },
      statement: { en: 'Civil EASA guidance links component maintenance release to approved organisations, maintenance data and release documentation.', es: 'La guía civil de EASA vincula la liberación de mantenimiento de componentes con organizaciones, datos de mantenimiento y documentación aprobados.' },
      status: 'documentedFact', stages: ['initiative', 'evidenceLimitations'], strategyIds: ['repairFirst', 'parallel'], sourceIds: ['EASA-P145-01'], assumptionIds: [], modelOutputIds: [],
      limitations: { en: ['Applicability to a military component and its governing authority must be established separately.'], es: ['La aplicabilidad a un componente militar y su autoridad competente debe establecerse por separado.'] },
      requiredInformation: [{ owner: 'engineering', request: { en: 'Approved repair data, eligibility limits, release route and governing airworthiness regime.', es: 'Datos de reparación aprobados, límites de elegibilidad, vía de liberación y régimen de aeronavegabilidad aplicable.' } }], lastReviewed: reviewed, reviewer: 'Prototype public-source review',
    },
    {
      id: 'HYP-SUPPLY-VULNERABILITY',
      title: { en: 'New-part sourcing is exposed to a programme-relevant delay risk', es: 'El suministro de pieza nueva está expuesto a un riesgo de retraso relevante para el programa' },
      statement: { en: 'The laboratory assumes a supplier-shock probability and delay penalty; neither is programme evidence.', es: 'El laboratorio supone una probabilidad de disrupción y una penalización de retraso; ninguna constituye evidencia de programa.' },
      status: 'hypothesis', stages: ['strategicVulnerability'], strategyIds: ['new', 'repairFirst', 'parallel'], sourceIds: [], assumptionIds: ['ASSUMP-TIMING', 'ASSUMP-RISK'], modelOutputIds: [],
      limitations: { en: ['No supplier, stock, lead-time distribution or common-cause evidence is loaded.'], es: ['No se han cargado datos de proveedor, existencias, distribución de plazos ni causas comunes.'] },
      requiredInformation: [{ owner: 'procurement', request: { en: 'Observed lead-time distribution, supplier disruption history, stock position and alternative-source constraints.', es: 'Distribución observada de plazos, historial de disrupciones, existencias y restricciones de fuentes alternativas.' } }, { owner: 'programmes', request: { en: 'Programme demand profile, recovery target and operational consequence of delay.', es: 'Perfil de demanda del programa, objetivo de recuperación y consecuencia operativa del retraso.' } }], lastReviewed: reviewed, reviewer: 'Model governance review',
    },
    {
      id: 'HYP-REPAIR-FEASIBILITY',
      title: { en: 'A defined share of components is repair-feasible', es: 'Una proporción definida de componentes es reparable' },
      statement: { en: 'Repair feasibility is an editable fictional probability, not an observed engineering rate.', es: 'La viabilidad de reparación es una probabilidad ficticia editable, no una tasa observada de ingeniería.' },
      status: 'hypothesis', stages: ['initiative', 'resilienceOutcome'], strategyIds: ['repairFirst', 'parallel'], sourceIds: [], assumptionIds: ['ASSUMP-RISK'], modelOutputIds: [],
      limitations: { en: ['Eligibility can vary by part number, damage mode, configuration, life limits and approved repair data.'], es: ['La elegibilidad puede variar por número de pieza, daño, configuración, límites de vida y datos de reparación aprobados.'] },
      requiredInformation: [{ owner: 'engineering', request: { en: 'Historical inspection dispositions and approved repair eligibility by component and damage mode.', es: 'Historial de dictámenes de inspección y elegibilidad aprobada por componente y modo de daño.' } }], lastReviewed: reviewed, reviewer: 'Model governance review',
    },
    {
      id: 'MODEL-RESILIENCE',
      title: { en: 'Counterfactual recovery result', es: 'Resultado contrafactual de recuperación' },
      statement: { en: `Repair-first produces ${repair.expectedRecoveryDays.toFixed(1)} modelled days and is classified “${repairClassification.nominalOutcome}” versus replacement.`, es: `Reparar primero produce ${repair.expectedRecoveryDays.toFixed(1)} días modelizados y se clasifica como «${repairClassification.nominalOutcome}» frente a sustitución.` },
      status: 'modelledExample', stages: ['resilienceOutcome'], strategyIds: ['repairFirst'], sourceIds: [], assumptionIds: ['ASSUMP-TIMING', 'ASSUMP-RISK'], modelOutputIds: ['MODEL-repairFirst-TIME', 'MODEL-repairFirst-TARGET'],
      limitations: { en: ['Recovery time is not aircraft readiness, mission availability or a validated programme KPI.'], es: ['El tiempo de recuperación no equivale a disponibilidad de aeronave, disponibilidad de misión ni KPI validado de programa.'] },
      requiredInformation: [{ owner: 'programmes', request: { en: 'Approved operational KPI definition and mapping from component recovery to programme outcome.', es: 'Definición aprobada del KPI operativo y relación entre recuperación del componente y resultado de programa.' } }], lastReviewed: reviewed, reviewer: 'Automated model trace',
    },
    {
      id: 'MODEL-ECONOMICS',
      title: { en: 'Branch-based economic result', es: 'Resultado económico por ramas' },
      statement: { en: 'Expected costs are generated from fictional branch obligations and explicit cancellation policies.', es: 'Los costes esperados se generan a partir de obligaciones ficticias por rama y políticas de cancelación explícitas.' },
      status: 'modelledExample', stages: ['resilienceOutcome', 'customerValue'], strategyIds: ['new', 'repairFirst', 'parallel'], sourceIds: [], assumptionIds: ['ASSUMP-COST', 'ASSUMP-CONTRACT'], modelOutputIds: ['MODEL-new-COST', 'MODEL-repairFirst-COST', 'MODEL-parallel-COST'],
      limitations: { en: ['No Airbus contract, price, discount rate or inventory carrying cost is represented.'], es: ['No se representa ningún contrato o precio Airbus, tasa de descuento ni coste de inventario.'] },
      requiredInformation: [{ owner: 'procurement', request: { en: 'Actual contractual obligations, cancellation clauses, prices, logistics and residual-value policy.', es: 'Obligaciones contractuales reales, cláusulas de cancelación, precios, logística y política de valor residual.' } }], lastReviewed: reviewed, reviewer: 'Automated model trace',
    },
    {
      id: 'MODEL-ENVIRONMENT',
      title: { en: 'Environmental mechanism calculation', es: 'Cálculo del mecanismo ambiental' },
      statement: { en: args.environmentalEnabled ? 'Environmental deltas use editable fictional factors and remain modelled examples.' : 'Factor-dependent environmental indicators remain unquantified until factors are supplied.' , es: args.environmentalEnabled ? 'Las diferencias ambientales utilizan factores ficticios editables y siguen siendo ejemplos modelizados.' : 'Los indicadores ambientales dependientes de factores permanecen sin cuantificar hasta aportar factores.' },
      status: 'modelledExample', stages: ['environmentalMechanism'], strategyIds: ['repairFirst', 'parallel'], sourceIds: ['AIRBUS-CIRC-01'], assumptionIds: [], modelOutputIds: environmentalModelIds,
      limitations: { en: ['No verified lifecycle assessment, component mass, process energy or physical cancellation evidence is loaded.'], es: ['No se ha cargado un ACV verificado, masa del componente, energía de proceso ni evidencia física de cancelación.'] },
      requiredInformation: [{ owner: 'sustainability', request: { en: 'Verified manufacturing, repair, logistics and waste factors with an approved lifecycle boundary.', es: 'Factores verificados de fabricación, reparación, logística y residuos con una frontera de ciclo de vida aprobada.' } }, { owner: 'engineering', request: { en: 'Approved life-extension value and physical disposition of repaired or replaced components.', es: 'Valor aprobado de extensión de vida y destino físico de componentes reparados o sustituidos.' } }], lastReviewed: reviewed, reviewer: 'Automated model trace',
    },
    {
      id: 'UNSUPPORTED-AIRBUS-BENEFIT',
      title: { en: 'Claim that Airbus has demonstrated a case benefit', es: 'Afirmación de que Airbus ha demostrado un beneficio del caso' },
      statement: { en: 'No reviewed public source demonstrates the laboratory’s cost, environmental or resilience result.', es: 'Ninguna fuente pública revisada demuestra el resultado económico, ambiental o de resiliencia del laboratorio.' },
      status: 'unsupported', stages: ['customerValue', 'evidenceLimitations'], strategyIds: ['repairFirst', 'parallel'], sourceIds: [], assumptionIds: [], modelOutputIds: [],
      limitations: { en: ['Public context cannot validate fictional inputs.'], es: ['El contexto público no puede validar datos ficticios.'] },
      requiredInformation: [{ owner: 'programmes', request: { en: 'Approved case boundary, baseline, KPI and observed outcome data.', es: 'Frontera, referencia, KPI y datos observados del caso aprobados.' } }], lastReviewed: reviewed, reviewer: 'Claim gate',
    },
    {
      id: 'REJECTED-READINESS',
      title: { en: 'Equating modelled recovery with aircraft readiness', es: 'Equiparar recuperación modelizada con disponibilidad de aeronave' },
      statement: { en: 'The statement “this model proves improved aircraft readiness” is rejected.', es: 'Se rechaza la afirmación «este modelo demuestra una mayor disponibilidad de aeronave».' },
      status: 'rejected', stages: ['customerValue', 'evidenceLimitations'], strategyIds: ['repairFirst', 'parallel'], sourceIds: [], assumptionIds: [], modelOutputIds: ['MODEL-repairFirst-TIME', 'MODEL-parallel-TIME'],
      limitations: { en: ['Readiness depends on fleet, demand, maintenance, reserves and common-cause conditions outside this model.'], es: ['La disponibilidad depende de flota, demanda, mantenimiento, reservas y causas comunes fuera del modelo.'] },
      requiredInformation: [{ owner: 'programmes', request: { en: 'Fleet-level readiness model and validated component-to-mission relationship.', es: 'Modelo de disponibilidad de flota y relación validada entre componente y misión.' } }], lastReviewed: reviewed, reviewer: 'Claim gate',
    },
  ];
}

