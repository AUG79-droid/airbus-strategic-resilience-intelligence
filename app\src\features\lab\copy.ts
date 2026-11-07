import type { Locale } from '../../app/types';

const en = {
  title: 'Counterfactual laboratory',
  intro: 'Compare replace, repair-first and parallel paths under one explicit set of fictional assumptions.',
  fictional: 'MODELLED EXAMPLE · FICTIONAL INPUTS · NOT AIRBUS PROGRAMME DATA',
  noClaim: 'Analytical output only. It is not evidence of a programme benefit, a lifecycle assessment or a customer claim.',
  preset: 'Scenario', custom: 'Custom scenario',
  guidedBasic: 'Basic test controls',
  guidedBasicNote: 'Change one input at a time and compare the three result cards.',
  guidedAdvanced: 'Advanced timing and risk options',
  guidedAdvancedNote: 'Use these only when you need inspection delay, shock duration or explicit risk dependence.',
  presets: {
    balanced: 'Balanced example', supplierShock: 'Supplier-shock exposure', lowFeasibility: 'Low repair feasibility',
    costPressure: 'Cost pressure', repairWorsens: 'Repair worsens resilience', correlatedRisk: 'Correlated risks',
  },
  sections: { timing: 'Timing', risk: 'Probability & dependence', costs: 'Cost obligations', contract: 'Parallel contract', environment: 'Environmental factors' },
  fields: {
    inspectionDays: 'Inspection', repairExecutionDays: 'Repair execution', newLeadDays: 'New-part lead time',
    supplierShockDelayDays: 'Shock delay', targetRecoveryDays: 'Recovery target',
    repairFeasibilityProbability: 'Repair feasible', supplierShockProbability: 'Supplier shock', dependenceMode: 'Risk relationship', jointProbability: 'Feasible + shock joint probability',
    inspection: 'Inspection cost', repair: 'Repair cost', newPart: 'New-part cost', repairLogistics: 'Repair logistics', newPartLogistics: 'New-part logistics', supplierShockSurcharge: 'Shock surcharge',
    procurementContract: 'Procurement mode', procurementStartsAtDecision: 'New procurement starts at decision', activationFee: 'Activation / reservation fee', activationCreditOnCompletedPurchase: 'Credit on completed purchase',
    newCancellationCommittedFraction: 'New-order committed fraction', newCancellationFee: 'New-order cancellation fee', repairCancellationCommittedFraction: 'Repair committed fraction', repairCancellationFee: 'Repair cancellation fee',
    onRepairWins: 'If repair wins', onNewWins: 'If new part wins', tiePolicy: 'If paths tie', cancelledNewPhysicalOutcome: 'Physical outcome after new-order cancellation', cancelledRepairPhysicalOutcome: 'Physical outcome after repair cancellation', recogniseResidualValues: 'Recognise declared residual values', newPartInventoryValue: 'New-part inventory residual value', repairedComponentInventoryValue: 'Repaired-component inventory residual value',
  },
  units: { days: 'days', percent: '%', currency: '€' },
  options: {
    independent: 'Independent', joint: 'Explicit joint probability', firmOrder: 'Firm order', cancellableOrder: 'Cancellable order', capacityReservation: 'Capacity reservation',
    cancelNew: 'Cancel new order', completeNewToInventory: 'Complete new part to inventory', cancelRepair: 'Cancel repair', completeRepairToInventory: 'Complete repair to inventory',
    useRepairCancelNew: 'Use repair; cancel new', useNewCancelRepair: 'Use new; cancel repair', completeBothUseRepair: 'Complete both; use repair', completeBothUseNew: 'Complete both; use new',
    cancelledBeforeManufacture: 'Cancelled before manufacture', manufacturingStarted: 'Manufacturing started', unknown: 'Unknown', disposed: 'Disposed',
  },
  results: 'Strategy comparison', strategies: { new: 'Replace', repairFirst: 'Repair first', parallel: 'Parallel / mixed' },
  metrics: { expectedRecoveryDays: 'Expected recovery', probabilityTargetMet: 'Target attained', expectedCashOutlay: 'Expected cash outlay', maximumCashCommitment: 'Maximum commitment', expectedSunkCost: 'Expected sunk cost', expectedNetEconomicCost: 'Expected net economic cost' },
  outcomes: { modelledAdvantage: 'Modelled advantage', noDemonstratedBenefit: 'No demonstrated benefit', potentiallyWorse: 'Potentially worse', tradeoff: 'Trade-off', inconclusive: 'Inconclusive' },
  versus: 'versus replacement', hypothesisOnly: 'Hypothesis only — requires evidence',
  branches: 'Branch ledger', probability: 'Probability', branch: 'Branch', outcome: 'Path', cash: 'Cash outlay', sunk: 'Sunk cost', obligations: 'Economic obligations', assumptions: 'Assumptions',
  sensitivity: 'Sensitivity analysis', variable: 'Variable', metric: 'Metric', jointAdjusted: 'The joint probability is clamped to the Fréchet bounds at infeasible points.',
  sensitivityVariables: { repairFeasibilityProbability: 'Repair feasibility', supplierShockProbability: 'Supplier-shock probability', repairExecutionDays: 'Repair duration', newLeadDays: 'New-part lead time', newPartCost: 'New-part cost', repairCost: 'Repair cost' },
  thresholds: 'Decision thresholds', thresholdNames: { repairFeasibility: 'Minimum feasibility for repair time ≤ replacement', repairDuration: 'Maximum repair duration for repair time ≤ replacement', newCancellationFraction: 'Maximum new-order commitment for parallel cost ≤ replacement' },
  thresholdStatus: { unavailable: 'Unavailable under explicit joint dependence', notReached: 'Not reached in scan', alwaysSatisfied: 'Satisfied across scan' },
  formulas: 'Transparent equations', formulaNote: 'Expected values sum branch probability × branch result. Parallel obligations are charged per contract branch; credits and residual values are never assumed.',
  causal: 'Causal chain under test', causalSteps: ['Sustainability initiative', 'Environmental mechanism', 'Strategic vulnerability', 'Resilience outcome', 'Customer value', 'Evidence & limitations'],
  causalValues: ['Qualified component repair', 'Avoided manufacture, material, waste or bounded GHG mechanism', 'Exposure to lead time and supplier shock', 'Recovery time and target attainment', 'No customer claim generated in Phase 3', 'Fictional model; programme evidence required'],
  environmentalToggle: 'Use fictional environmental factors', environmentalWarning: 'Values below are editable teaching inputs, not Airbus or supplier data.',
  environmental: { newPartVirginMaterialKg: 'Virgin material per new part', originalComponentDisposalMassKg: 'Original component disposal mass', repairProcessWasteKg: 'Repair-process waste', newPartManufacturingKgCo2e: 'New-part manufacturing GHG', repairProcessKgCo2e: 'Repair-process GHG', newPartLogisticsKgCo2e: 'New-part logistics GHG', repairLogisticsKgCo2e: 'Repair logistics GHG', approvedLifeExtensionHoursPerRepair: 'Approved life extension per repair' },
  indicatorNames: { newManufactureAvoidedUnits: 'New manufacture avoided', virginMaterialDemandDeltaKg: 'Virgin-material demand delta', wasteGeneratedDeltaKg: 'Waste delta', boundedGhgDeltaKgCo2e: 'Bounded GHG delta', serviceLifeExtensionHours: 'Service-life extension' },
  modelled: 'Modelled example', notQuantified: 'Not quantified', missing: 'Missing', modelInvalid: 'The model cannot evaluate these inputs:',
};

const es = {
  ...en,
  title: 'Laboratorio contrafactual',
  intro: 'Compara sustitución, reparación primero y vías paralelas con un único conjunto explícito de hipótesis ficticias.',
  fictional: 'EJEMPLO MODELIZADO · DATOS FICTICIOS · NO SON DATOS DE PROGRAMAS AIRBUS',
  noClaim: 'Resultado analítico únicamente. No demuestra un beneficio de programa, no es un ACV ni constituye un argumento para clientes.',
  preset: 'Escenario', custom: 'Escenario personalizado',
  guidedBasic: 'Controles básicos de la prueba',
  guidedBasicNote: 'Cambia un dato cada vez y compara las tres tarjetas de resultados.',
  guidedAdvanced: 'Opciones avanzadas de plazos y riesgo',
  guidedAdvancedNote: 'Úsalas sólo si necesitas retraso de inspección, duración de disrupción o dependencia explícita.',
  presets: { balanced: 'Ejemplo equilibrado', supplierShock: 'Exposición a disrupción del proveedor', lowFeasibility: 'Baja viabilidad de reparación', costPressure: 'Presión de costes', repairWorsens: 'La reparación empeora la resiliencia', correlatedRisk: 'Riesgos correlacionados' },
  sections: { timing: 'Plazos', risk: 'Probabilidad y dependencia', costs: 'Obligaciones económicas', contract: 'Contrato de vía paralela', environment: 'Factores ambientales' },
  fields: { ...en.fields, inspectionDays: 'Inspección', repairExecutionDays: 'Ejecución de reparación', newLeadDays: 'Plazo de pieza nueva', supplierShockDelayDays: 'Retraso por disrupción', targetRecoveryDays: 'Objetivo de recuperación', repairFeasibilityProbability: 'Reparación viable', supplierShockProbability: 'Disrupción del proveedor', dependenceMode: 'Relación entre riesgos', jointProbability: 'Probabilidad conjunta viable + disrupción', inspection: 'Coste de inspección', repair: 'Coste de reparación', newPart: 'Coste de pieza nueva', repairLogistics: 'Logística de reparación', newPartLogistics: 'Logística de pieza nueva', supplierShockSurcharge: 'Recargo por disrupción', procurementContract: 'Modalidad de compra', procurementStartsAtDecision: 'La compra nueva empieza en la decisión', activationFee: 'Coste de activación / reserva', activationCreditOnCompletedPurchase: 'Crédito si se completa la compra', newCancellationCommittedFraction: 'Fracción comprometida del pedido nuevo', newCancellationFee: 'Coste de cancelación del pedido nuevo', repairCancellationCommittedFraction: 'Fracción comprometida de reparación', repairCancellationFee: 'Coste de cancelación de reparación', onRepairWins: 'Si gana la reparación', onNewWins: 'Si gana la pieza nueva', tiePolicy: 'Si las vías empatan', cancelledNewPhysicalOutcome: 'Resultado físico al cancelar la pieza nueva', cancelledRepairPhysicalOutcome: 'Resultado físico al cancelar la reparación', recogniseResidualValues: 'Reconocer valores residuales declarados', newPartInventoryValue: 'Valor residual de pieza nueva en inventario', repairedComponentInventoryValue: 'Valor residual del componente reparado en inventario' },
  units: { days: 'días', percent: '%', currency: '€' },
  options: { ...en.options, independent: 'Independientes', joint: 'Probabilidad conjunta explícita', firmOrder: 'Pedido firme', cancellableOrder: 'Pedido cancelable', capacityReservation: 'Reserva de capacidad', cancelNew: 'Cancelar pedido nuevo', completeNewToInventory: 'Completar pieza nueva para inventario', cancelRepair: 'Cancelar reparación', completeRepairToInventory: 'Completar reparación para inventario', useRepairCancelNew: 'Usar reparación; cancelar nueva', useNewCancelRepair: 'Usar nueva; cancelar reparación', completeBothUseRepair: 'Completar ambas; usar reparación', completeBothUseNew: 'Completar ambas; usar nueva', cancelledBeforeManufacture: 'Cancelada antes de fabricar', manufacturingStarted: 'Fabricación iniciada', unknown: 'Desconocido', disposed: 'Desechado' },
  results: 'Comparación de estrategias', strategies: { new: 'Sustituir', repairFirst: 'Reparar primero', parallel: 'Paralela / mixta' },
  metrics: { expectedRecoveryDays: 'Recuperación esperada', probabilityTargetMet: 'Cumplimiento del objetivo', expectedCashOutlay: 'Desembolso esperado', maximumCashCommitment: 'Compromiso máximo', expectedSunkCost: 'Coste hundido esperado', expectedNetEconomicCost: 'Coste económico neto esperado' },
  outcomes: { modelledAdvantage: 'Ventaja modelizada', noDemonstratedBenefit: 'Beneficio no demostrado', potentiallyWorse: 'Potencialmente peor', tradeoff: 'Compromiso', inconclusive: 'No concluyente' },
  versus: 'frente a sustitución', hypothesisOnly: 'Solo hipótesis — requiere evidencia',
  branches: 'Registro por ramas', probability: 'Probabilidad', branch: 'Rama', outcome: 'Vía', cash: 'Desembolso', sunk: 'Coste hundido', obligations: 'Obligaciones económicas', assumptions: 'Hipótesis',
  sensitivity: 'Análisis de sensibilidad', variable: 'Variable', metric: 'Métrica', jointAdjusted: 'La probabilidad conjunta se limita a las cotas de Fréchet en los puntos inviables.',
  sensitivityVariables: { repairFeasibilityProbability: 'Viabilidad de reparación', supplierShockProbability: 'Probabilidad de disrupción', repairExecutionDays: 'Duración de reparación', newLeadDays: 'Plazo de pieza nueva', newPartCost: 'Coste de pieza nueva', repairCost: 'Coste de reparación' },
  thresholds: 'Umbrales de decisión', thresholdNames: { repairFeasibility: 'Viabilidad mínima para tiempo de reparación ≤ sustitución', repairDuration: 'Duración máxima para tiempo de reparación ≤ sustitución', newCancellationFraction: 'Compromiso máximo de pedido nuevo para coste paralelo ≤ sustitución' },
  thresholdStatus: { unavailable: 'No disponible con dependencia conjunta explícita', notReached: 'No alcanzado en el barrido', alwaysSatisfied: 'Se cumple en todo el barrido' },
  formulas: 'Ecuaciones transparentes', formulaNote: 'Los valores esperados suman probabilidad de rama × resultado. Las obligaciones paralelas se imputan por rama contractual; no se presuponen créditos ni valores residuales.',
  causal: 'Cadena causal bajo análisis', causalSteps: ['Iniciativa de sostenibilidad', 'Mecanismo ambiental', 'Vulnerabilidad estratégica', 'Resultado de resiliencia', 'Valor para el cliente', 'Evidencias y limitaciones'],
  causalValues: ['Reparación cualificada de componentes', 'Fabricación evitada, materiales, residuos o mecanismo GEI acotado', 'Exposición a plazos y disrupción del proveedor', 'Tiempo de recuperación y cumplimiento del objetivo', 'La Fase 3 no genera argumentos para clientes', 'Modelo ficticio; se requieren evidencias de programa'],
  environmentalToggle: 'Usar factores ambientales ficticios', environmentalWarning: 'Los valores siguientes son datos didácticos editables, no datos de Airbus ni de proveedores.',
  environmental: { newPartVirginMaterialKg: 'Material virgen por pieza nueva', originalComponentDisposalMassKg: 'Masa de descarte del componente original', repairProcessWasteKg: 'Residuo del proceso de reparación', newPartManufacturingKgCo2e: 'GEI de fabricación de pieza nueva', repairProcessKgCo2e: 'GEI del proceso de reparación', newPartLogisticsKgCo2e: 'GEI logístico de pieza nueva', repairLogisticsKgCo2e: 'GEI logístico de reparación', approvedLifeExtensionHoursPerRepair: 'Extensión de vida aprobada por reparación' },
  indicatorNames: { newManufactureAvoidedUnits: 'Fabricación nueva evitada', virginMaterialDemandDeltaKg: 'Diferencia de demanda de material virgen', wasteGeneratedDeltaKg: 'Diferencia de residuos', boundedGhgDeltaKgCo2e: 'Diferencia acotada de GEI', serviceLifeExtensionHours: 'Extensión de vida útil' },
  modelled: 'Ejemplo modelizado', notQuantified: 'No cuantificado', missing: 'Falta', modelInvalid: 'El modelo no puede evaluar estos datos:',
};

type WidenStrings<T> = T extends string
  ? string
  : T extends readonly unknown[]
    ? { [K in keyof T]: WidenStrings<T[K]> }
    : T extends object
      ? { [K in keyof T]: WidenStrings<T[K]> }
      : T;

export type LabCopy = WidenStrings<typeof en>;
export const labCopy = (locale: Locale): LabCopy => locale === 'es' ? es : en;

