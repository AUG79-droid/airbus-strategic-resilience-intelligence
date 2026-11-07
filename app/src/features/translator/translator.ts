import type {
  ComparativeClassification,
  EnvironmentalAssessment,
  NominalOutcome,
  ScenarioResult,
  StrategyId,
  StrategyResult,
} from '../../domain';
import type { Locale } from '../../app/types';
import type { ClaimGateResult, EvidenceOwner, EvidenceStatus } from '../evidence/types';
import { translatorCopy } from './copy';
import type { AudienceId, StrategicTranslation, TranslationConclusion, ValidationAction } from './types';

export function conclusionForOutcome(outcome: NominalOutcome): TranslationConclusion {
  if (outcome === 'modelledAdvantage') return 'favourable';
  if (outcome === 'potentiallyWorse') return 'unfavourable';
  if (outcome === 'tradeoff') return 'contradictory';
  if (outcome === 'noDemonstratedBenefit') return 'noDemonstratedBenefit';
  return 'inconclusive';
}

function formatNumber(value: number, locale: Locale, digits = 1) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
}

function formatMoney(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function direction(delta: number, lowerIsBetter: boolean, isReference: boolean) {
  if (isReference || Math.abs(delta) < 1e-9) return 'neutral' as const;
  return (lowerIsBetter ? delta < 0 : delta > 0) ? 'favourable' as const : 'unfavourable' as const;
}

function strategyName(strategy: StrategyId, locale: Locale) {
  return translatorCopy(locale).strategies[strategy];
}

function classificationFor(
  strategy: StrategyId,
  repair: ComparativeClassification,
  parallel: ComparativeClassification,
) {
  return strategy === 'repairFirst' ? repair : strategy === 'parallel' ? parallel : null;
}

function conclusionForStrategy(
  strategy: StrategyId,
  repair: ComparativeClassification,
  parallel: ComparativeClassification,
) {
  const classification = classificationFor(strategy, repair, parallel);
  return classification ? conclusionForOutcome(classification.nominalOutcome) : 'reference';
}

function headline(conclusion: TranslationConclusion, strategy: StrategyId, audience: AudienceId, locale: Locale) {
  const name = strategyName(strategy, locale);
  const audienceName = translatorCopy(locale).audiences[audience];
  const en: Record<TranslationConclusion, string> = {
    reference: `${name} is the analytical reference, not a demonstrated optimum`,
    favourable: `${name} shows a conditional advantage for ${audienceName}`,
    unfavourable: `${name} weakens the current case for ${audienceName}`,
    contradictory: `${name} creates a trade-off to govern, not a benefit to advertise`,
    noDemonstratedBenefit: `${name} shows no demonstrated benefit versus the reference`,
    inconclusive: `The evidence is inconclusive for ${name} and ${audienceName}`,
  };
  const es: Record<TranslationConclusion, string> = {
    reference: `${name} es la referencia analítica, no un óptimo demostrado`,
    favourable: `${name} muestra una ventaja condicional para ${audienceName}`,
    unfavourable: `${name} debilita el caso actual para ${audienceName}`,
    contradictory: `${name} crea un compromiso que gobernar, no un beneficio que anunciar`,
    noDemonstratedBenefit: `${name} no muestra un beneficio demostrado frente a la referencia`,
    inconclusive: `La evidencia no es concluyente para ${name} y ${audienceName}`,
  };
  return (locale === 'es' ? es : en)[conclusion];
}

function analyticalSentence(
  strategy: StrategyId,
  selected: StrategyResult,
  baseline: StrategyResult,
  conclusion: TranslationConclusion,
  locale: Locale,
) {
  const name = strategyName(strategy, locale);
  const time = formatNumber(selected.expectedRecoveryDays, locale);
  const target = formatNumber(selected.probabilityTargetMet * 100, locale);
  const cost = formatMoney(selected.expectedCashOutlay, locale);
  const deltaTime = formatNumber(Math.abs(selected.expectedRecoveryDays - baseline.expectedRecoveryDays), locale);
  if (locale === 'es') {
    if (conclusion === 'reference') return `${name} establece la referencia del modelo: ${time} días de tiempo medio para recuperar un módulo operativo, ${target}% de cumplimiento y ${cost} de desembolso esperado.`;
    if (conclusion === 'favourable') return `${name} produce ${time} días de tiempo medio para recuperar un módulo operativo, ${target}% de cumplimiento y ${cost}; el modelo estima una mejora temporal de ${deltaTime} días frente a sustitución.`;
    if (conclusion === 'unfavourable') return `${name} produce ${time} días de tiempo medio para recuperar un módulo operativo, ${target}% de cumplimiento y ${cost}; el modelo estima un deterioro temporal de ${deltaTime} días frente a sustitución.`;
    if (conclusion === 'contradictory') return `${name} presenta un tiempo medio de recuperación de ${time} días, ${target}% de cumplimiento y ${cost}, pero las señales de resiliencia y coste apuntan en direcciones distintas.`;
    if (conclusion === 'noDemonstratedBenefit') return `${name} no supera la referencia dentro de las tolerancias declaradas; esto significa ausencia de beneficio demostrado, no falta de capacidad analítica.`;
    return `${name} genera señales de resiliencia incompatibles o insuficientes para establecer una dirección única; la conclusión permanece no concluyente.`;
  }
  if (conclusion === 'reference') return `${name} establishes the model reference: ${time} days average time to recover an operational module, ${target}% target attainment and ${cost} expected cash outlay.`;
  if (conclusion === 'favourable') return `${name} produces ${time} days average time to recover an operational module, ${target}% target attainment and ${cost}; the model estimates a ${deltaTime}-day time improvement versus replacement.`;
  if (conclusion === 'unfavourable') return `${name} produces ${time} days average time to recover an operational module, ${target}% target attainment and ${cost}; the model estimates a ${deltaTime}-day time deterioration versus replacement.`;
  if (conclusion === 'contradictory') return `${name} produces an average module recovery time of ${time} days, ${target}% target attainment and ${cost}, but resilience and cost signals point in different directions.`;
  if (conclusion === 'noDemonstratedBenefit') return `${name} does not outperform the reference within the declared tolerances; this means no demonstrated benefit, not an inability to analyse the case.`;
  return `${name} produces incompatible or insufficient resilience signals to establish one direction; the conclusion remains inconclusive.`;
}

function audienceSentence(audience: AudienceId, locale: Locale) {
  const en: Record<AudienceId, string> = {
    defenceCustomer: 'Interpret this as a component-support hypothesis, not mission availability or fleet readiness.',
    programmeManager: 'Treat the result as a programme gate with a baseline, exit criteria and explicit obligations.',
    engineering: 'The direction depends on eligibility, process time, physical disposition and the approved release route.',
    executiveLeadership: 'Treat the output as modelled option value, not demonstrated performance or a market-ready claim.',
  };
  const es: Record<AudienceId, string> = {
    defenceCustomer: 'Debe interpretarse como hipótesis de apoyo al componente, no como disponibilidad de misión o preparación de flota.',
    programmeManager: 'Debe tratarse como una puerta de programa con referencia, criterios de salida y obligaciones explícitas.',
    engineering: 'La dirección depende de elegibilidad, tiempo de proceso, destino físico y vía de liberación aprobada.',
    executiveLeadership: 'El resultado representa valor de opción modelizado, no rendimiento demostrado ni una afirmación lista para el mercado.',
  };
  return (locale === 'es' ? es : en)[audience];
}

interface ComparativeNarrative {
  assessment: string;
  decisionRule: string;
  statements: string[];
  primaryComparator: StrategyId;
  marginalValuePerDay: number | null;
}

function pairStatement(selected: StrategyResult, peer: StrategyResult, locale: Locale) {
  const selectedName = strategyName(selected.strategy, locale);
  const peerName = strategyName(peer.strategy, locale);
  const timeDelta = selected.expectedRecoveryDays - peer.expectedRecoveryDays;
  const targetDelta = (selected.probabilityTargetMet - peer.probabilityTargetMet) * 100;
  const costDelta = selected.expectedCashOutlay - peer.expectedCashOutlay;
  const dayLabel = (value: number) => locale === 'es' ? (Math.abs(value) === 1 ? 'día' : 'días') : (Math.abs(value) === 1 ? 'day' : 'days');
  const timeText = Math.abs(timeDelta) < 0.05
    ? (locale === 'es' ? 'tiene el mismo plazo esperado' : 'has the same expected recovery time')
    : timeDelta < 0
      ? (locale === 'es' ? `es ${formatNumber(Math.abs(timeDelta), locale)} ${dayLabel(timeDelta)} más rápida` : `is ${formatNumber(Math.abs(timeDelta), locale)} ${dayLabel(timeDelta)} faster`)
      : (locale === 'es' ? `es ${formatNumber(timeDelta, locale)} ${dayLabel(timeDelta)} más lenta` : `is ${formatNumber(timeDelta, locale)} ${dayLabel(timeDelta)} slower`);
  const targetText = Math.abs(targetDelta) < 0.05
    ? (locale === 'es' ? 'con el mismo cumplimiento del objetivo' : 'with the same target attainment')
    : targetDelta > 0
      ? (locale === 'es' ? `con ${formatNumber(targetDelta, locale)} puntos porcentuales más de cumplimiento` : `with ${formatNumber(targetDelta, locale)} percentage points more target attainment`)
      : (locale === 'es' ? `con ${formatNumber(Math.abs(targetDelta), locale)} puntos porcentuales menos de cumplimiento` : `with ${formatNumber(Math.abs(targetDelta), locale)} percentage points less target attainment`);
  const costText = Math.abs(costDelta) < 1
    ? (locale === 'es' ? 'y el mismo desembolso esperado' : 'and the same expected cash outlay')
    : costDelta > 0
      ? (locale === 'es' ? `y cuesta ${formatMoney(costDelta, locale)} más` : `and costs ${formatMoney(costDelta, locale)} more`)
      : (locale === 'es' ? `y cuesta ${formatMoney(Math.abs(costDelta), locale)} menos` : `and costs ${formatMoney(Math.abs(costDelta), locale)} less`);
  const comparatorWord = locale === 'es' ? 'que' : 'than';
  return `${selectedName} ${timeText} ${comparatorWord} ${peerName}, ${targetText} ${costText}.`;
}

function comparativeNarrative(strategy: StrategyId, result: ScenarioResult, audience: AudienceId, locale: Locale): ComparativeNarrative {
  const selected = result.strategies[strategy];
  const peers = (Object.values(result.strategies) as StrategyResult[]).filter((item) => item.strategy !== strategy);
  const primary = [...peers].sort((a, b) => b.probabilityTargetMet - a.probabilityTargetMet || a.expectedRecoveryDays - b.expectedRecoveryDays || a.expectedCashOutlay - b.expectedCashOutlay)[0];
  const timeDelta = selected.expectedRecoveryDays - primary.expectedRecoveryDays;
  const targetDelta = selected.probabilityTargetMet - primary.probabilityTargetMet;
  const costDelta = selected.expectedCashOutlay - primary.expectedCashOutlay;
  const sameTarget = Math.abs(targetDelta) < 0.001;
  const selectedFaster = timeDelta < -0.05;
  const selectedSlower = timeDelta > 0.05;
  const selectedMoreExpensive = costDelta > 1;
  const selectedCheaper = costDelta < -1;
  const marginalValuePerDay = sameTarget && Math.abs(timeDelta) > 0.05 && Math.abs(costDelta) > 1 && ((selectedFaster && selectedMoreExpensive) || (selectedSlower && selectedCheaper))
    ? Math.abs(costDelta / timeDelta)
    : null;
  const selectedDominates = selected.expectedRecoveryDays <= primary.expectedRecoveryDays + 0.05 && selected.probabilityTargetMet >= primary.probabilityTargetMet - 0.001 && selected.expectedCashOutlay <= primary.expectedCashOutlay + 1 && (selectedFaster || targetDelta > 0.001 || selectedCheaper);
  const selectedDominated = selected.expectedRecoveryDays >= primary.expectedRecoveryDays - 0.05 && selected.probabilityTargetMet <= primary.probabilityTargetMet + 0.001 && selected.expectedCashOutlay >= primary.expectedCashOutlay - 1 && (selectedSlower || targetDelta < -0.001 || selectedMoreExpensive);
  const selectedName = strategyName(strategy, locale);
  const primaryName = strategyName(primary.strategy, locale);
  const marginalDays = Math.abs(timeDelta);
  const marginalDayLabel = locale === 'es' ? (marginalDays === 1 ? 'día esperado' : 'días esperados') : (marginalDays === 1 ? 'expected day' : 'expected days');
  let assessment: string;
  if (marginalValuePerDay !== null && selectedFaster && selectedMoreExpensive) {
    assessment = locale === 'es'
      ? `${selectedName} no debe preferirse automáticamente: frente a ${primaryName}, paga ${formatMoney(costDelta, locale)} adicionales por ${formatNumber(marginalDays, locale)} ${marginalDayLabel} ganado, sin mejora en el cumplimiento del objetivo.`
      : `${selectedName} should not be preferred automatically: versus ${primaryName}, it pays an additional ${formatMoney(costDelta, locale)} for ${formatNumber(marginalDays, locale)} ${marginalDayLabel} gained, with no target-attainment improvement.`;
  } else if (marginalValuePerDay !== null && selectedSlower && selectedCheaper) {
    assessment = locale === 'es'
      ? `${selectedName} ahorra ${formatMoney(Math.abs(costDelta), locale)} frente a ${primaryName} a cambio de ${formatNumber(timeDelta, locale)} ${marginalDayLabel} adicional, con el mismo cumplimiento del objetivo.`
      : `${selectedName} saves ${formatMoney(Math.abs(costDelta), locale)} versus ${primaryName} in exchange for ${formatNumber(timeDelta, locale)} additional ${marginalDayLabel}, with the same target attainment.`;
  } else if (selectedDominated) {
    assessment = locale === 'es' ? `${selectedName} está dominada por ${primaryName} en las métricas modelizadas pertinentes; no existe justificación cuantitativa suficiente para preferirla bajo estos supuestos.` : `${selectedName} is dominated by ${primaryName} on the relevant modelled metrics; there is insufficient quantitative justification to prefer it under these assumptions.`;
  } else if (selectedDominates) {
    assessment = locale === 'es' ? `${selectedName} domina a ${primaryName} en las métricas modelizadas, pero la preferencia sigue condicionada a validar los datos y las obligaciones no representadas.` : `${selectedName} dominates ${primaryName} on the modelled metrics, but preference remains conditional on validating the data and omitted obligations.`;
  } else {
    assessment = locale === 'es' ? `${selectedName} presenta un intercambio frente a ${primaryName}; el modelo no contiene una función de valor suficiente para declarar una preferencia automática.` : `${selectedName} presents a trade-off versus ${primaryName}; the model does not contain a sufficient value function to declare an automatic preference.`;
  }
  const threshold = marginalValuePerDay === null ? null : formatMoney(marginalValuePerDay, locale);
  const audienceRule = locale === 'es' ? {
    defenceCustomer: 'La decisión requiere vincular el valor de un día de recuperación a un KPI de servicio del componente; no puede inferirse disponibilidad de misión.',
    programmeManager: 'La decisión requiere comparar el umbral con penalizaciones, hitos y exposición contractual reales del programa.',
    engineering: 'La decisión requiere distribuciones aprobadas de elegibilidad, duración y liberación; una diferencia media no sustituye la validación técnica.',
    executiveLeadership: 'La decisión requiere monetizar explícitamente el valor de opción y el apetito de riesgo; no basta una mejora temporal marginal.',
  } : {
    defenceCustomer: 'The decision must link the value of one recovery day to a component service KPI; mission availability cannot be inferred.',
    programmeManager: 'The threshold must be compared with actual programme penalties, milestones and contractual exposure.',
    engineering: 'The decision requires approved eligibility, duration and release distributions; an expected-time difference does not replace technical validation.',
    executiveLeadership: 'The decision requires explicit valuation of option value and risk appetite; a marginal time improvement is not sufficient.',
  };
  const decisionRule = threshold
    ? (locale === 'es'
      ? `El punto de equilibrio modelizado es ${threshold} por día esperado. Solo se justifica pagar la prima si el valor validado de ese día —o un valor de opción independiente— supera el umbral. ${audienceRule[audience]}`
      : `The modelled break-even is ${threshold} per expected day. Paying the premium is justified only if the validated value of that day—or independently evidenced option value—exceeds the threshold. ${audienceRule[audience]}`)
    : audienceRule[audience];
  return { assessment, decisionRule, statements: peers.map((peer) => pairStatement(selected, peer, locale)), primaryComparator: primary.strategy, marginalValuePerDay };
}

function recommendation(conclusion: TranslationConclusion, strategy: StrategyId, audience: AudienceId, locale: Locale, comparison: ComparativeNarrative) {
  const name = strategyName(strategy, locale);
  const en: Record<TranslationConclusion, string> = {
    reference: `Use ${name} as the comparison baseline and validate whether its lead-time, stock and disruption assumptions reflect the programme.`,
    favourable: `Do not select ${name} from its replacement comparison alone. Use the three-way comparison and its explicit break-even test before controlled validation.`,
    unfavourable: `Do not promote ${name} as a resilience improvement under these assumptions; retain replacement as the decision reference.`,
    contradictory: `Govern ${name} through explicit time, target and cost thresholds rather than a blanket policy.`,
    noDemonstratedBenefit: `Do not claim an advantage for ${name}; retain it only where other programme constraints justify the option.`,
    inconclusive: `Defer preference for ${name} until the conflicting resilience signals and critical evidence gaps are resolved.`,
  };
  const es: Record<TranslationConclusion, string> = {
    reference: `Utilizar ${name} como referencia y validar si sus hipótesis de plazo, existencias y disrupción representan el programa.`,
    favourable: `No seleccionar ${name} únicamente por su comparación con sustitución. Aplicar la comparación entre las tres alternativas y su umbral explícito antes de una validación controlada.`,
    unfavourable: `No promover ${name} como mejora de resiliencia bajo estas hipótesis; mantener sustitución como referencia de decisión.`,
    contradictory: `Gobernar ${name} mediante umbrales explícitos de plazo, objetivo y coste, no con una política general.`,
    noDemonstratedBenefit: `No afirmar una ventaja para ${name}; conservarla solo si otras restricciones de programa justifican la opción.`,
    inconclusive: `Posponer la preferencia por ${name} hasta resolver las señales de resiliencia incompatibles y las brechas críticas.`,
  };
  const audienceAction = locale === 'es' ? {
    defenceCustomer: 'Acordar el KPI operativo y el nivel de servicio antes de vincular la estrategia con continuidad o disponibilidad.',
    programmeManager: 'Definir un piloto con criterios de entrada y salida, propietario de datos y revisión conjunta.',
    engineering: 'Validar población, datos aprobados, duración, límites de vida y liberación antes de fijar probabilidades.',
    executiveLeadership: 'Patrocinar solo una validación acotada y mantener bloqueadas las afirmaciones externas.',
  } : {
    defenceCustomer: 'Agree the operational KPI and service level before linking the strategy to continuity or availability.',
    programmeManager: 'Define a pilot with entry and exit criteria, a data owner and joint review.',
    engineering: 'Validate population, approved data, duration, life limits and release before fixing probabilities.',
    executiveLeadership: 'Sponsor only bounded validation and keep external claims blocked.',
  };
  return `${(locale === 'es' ? es : en)[conclusion]} ${comparison.assessment} ${comparison.decisionRule} ${audienceAction[audience]}`;
}

function strategyProfile(
  strategy: StrategyId,
  result: StrategyResult,
  baseline: StrategyResult,
  classification: ComparativeClassification | null,
  locale: Locale,
) {
  const en = locale === 'en';
  if (strategy === 'new') return {
    advantages: [en ? 'Avoids dependence on repair feasibility and inspection disposition.' : 'Evita depender de la viabilidad de reparación y del dictamen de inspección.', en ? 'Uses one procurement path with no repair-cancellation branch.' : 'Utiliza una única vía de compra sin rama de cancelación de reparación.'],
    drawbacks: [en ? 'Remains exposed to new-part lead time and supplier-shock delay.' : 'Permanece expuesta al plazo de pieza nueva y al retraso por disrupción.', en ? 'Requires a newly manufactured component in every model branch.' : 'Requiere un componente de nueva fabricación en todas las ramas del modelo.'],
    uncertainties: [en ? 'Observed supplier lead-time distribution, stock and alternative sources are not loaded.' : 'No se han cargado distribución observada de plazos, existencias ni fuentes alternativas.', en ? 'The modelled cash input is fictional and not a contractual price.' : 'El coste modelizado es ficticio y no representa un precio contractual.'],
  };
  const isRepair = strategy === 'repairFirst';
  const timeSignal = classification?.signals.expectedRecoveryTime;
  const costSignal = classification?.signals.expectedCashOutlay;
  const advantages = [
    timeSignal === 'better' ? (en ? 'Reduces expected recovery time versus replacement in this model.' : 'Reduce el tiempo esperado frente a sustitución en este modelo.') : (en ? 'Preserves an alternative to exclusive new-part sourcing.' : 'Mantiene una alternativa al suministro exclusivo de pieza nueva.'),
    costSignal === 'better' ? (en ? 'Reduces expected cash outlay versus replacement in this model.' : 'Reduce el desembolso esperado frente a sustitución en este modelo.') : isRepair ? (en ? 'Avoids new manufacture in repair-feasible branches.' : 'Evita nueva fabricación en ramas donde la reparación es viable.') : (en ? 'Takes the earliest available route when both paths run as modelled.' : 'Utiliza la vía disponible más temprana cuando ambas avanzan según el modelo.'),
  ];
  const drawbacks = isRepair ? [
    en ? 'An infeasible repair delays new procurement by the inspection period.' : 'Una reparación inviable retrasa la compra nueva durante la inspección.',
    costSignal === 'worse' ? (en ? 'Expected cash outlay is higher than replacement.' : 'El desembolso esperado es superior a sustitución.') : (en ? 'Eligibility and process time can reverse the modelled advantage.' : 'La elegibilidad y el tiempo de proceso pueden invertir la ventaja modelizada.'),
  ] : [
    en ? 'Parallel activation, cancellation and sunk obligations can increase cost.' : 'La activación paralela, cancelaciones y obligaciones hundidas pueden aumentar el coste.',
    en ? 'Completing both paths can create inventory and uncertain physical outcomes.' : 'Completar ambas vías puede crear inventario y resultados físicos inciertos.',
  ];
  const uncertainties = isRepair ? [
    en ? 'Repair feasibility is a fictional probability, not an observed engineering rate.' : 'La viabilidad es una probabilidad ficticia, no una tasa observada de ingeniería.',
    en ? 'Approved repair duration, release and life extension are not loaded.' : 'No se han cargado duración, liberación ni extensión de vida aprobadas.',
  ] : [
    en ? 'Contract mode, cancellation fractions, credits and residual values require real terms.' : 'Modalidad, fracciones de cancelación, créditos y valores residuales requieren condiciones reales.',
    en ? 'Risk dependence and the physical effect of cancellation remain assumptions.' : 'La dependencia entre riesgos y el efecto físico de cancelar siguen siendo hipótesis.',
  ];
  if (result.expectedRecoveryDays === baseline.expectedRecoveryDays) uncertainties.push(en ? 'The current time result is equivalent to the reference within numeric precision.' : 'El resultado temporal actual equivale a la referencia dentro de la precisión numérica.');
  return { advantages, drawbacks, uncertainties };
}

function validationActions(audience: AudienceId, strategy: StrategyId, locale: Locale): ValidationAction[] {
  const en = locale === 'en';
  const strategyAction: Record<StrategyId, ValidationAction> = {
    new: { owner: 'procurement', action: en ? 'Validate stock, observed lead-time distribution, disruption history and alternative-source constraints.' : 'Validar existencias, distribución observada de plazos, historial de disrupciones y fuentes alternativas.' },
    repairFirst: { owner: 'engineering', action: en ? 'Replace fictional feasibility with approved eligibility and historical inspection dispositions.' : 'Sustituir la viabilidad ficticia por elegibilidad aprobada e históricos de inspección.' },
    parallel: { owner: 'procurement', action: en ? 'Load actual activation, cancellation, credit, inventory and residual-value obligations for both paths.' : 'Cargar obligaciones reales de activación, cancelación, créditos, inventario y valor residual de ambas vías.' },
  };
  const audienceActions: Record<AudienceId, ValidationAction[]> = {
    defenceCustomer: [
      { owner: 'programmes', action: en ? 'Agree the operational KPI and distinguish component recovery, aircraft availability and mission availability.' : 'Acordar el KPI operativo y distinguir recuperación del componente, disponibilidad de aeronave y de misión.' },
      { owner: 'engineering', action: en ? 'Confirm configuration applicability and the governing airworthiness authority.' : 'Confirmar aplicabilidad por configuración y autoridad de aeronavegabilidad.' },
    ],
    programmeManager: [
      { owner: 'programmes', action: en ? 'Set baseline, target, demand profile and pilot decision criteria.' : 'Fijar referencia, objetivo, demanda y criterios de decisión del piloto.' },
      { owner: 'procurement', action: en ? 'Reconcile programme schedule, stock and contractual exposure.' : 'Conciliar calendario, existencias y exposición contractual del programa.' },
    ],
    engineering: [
      { owner: 'engineering', action: en ? 'Measure inspection, execution, test and release time distributions.' : 'Medir distribuciones de inspección, ejecución, prueba y liberación.' },
      { owner: 'sustainability', action: en ? 'Establish physical disposition and approved life extension before environmental quantification.' : 'Establecer destino físico y extensión de vida aprobada antes de cuantificar el efecto ambiental.' },
    ],
    executiveLeadership: [
      { owner: 'programmes', action: en ? 'Define the KPI that would justify a programme or portfolio decision.' : 'Definir el KPI que justificaría una decisión de programa o cartera.' },
      { owner: 'sustainability', action: en ? 'Require a verified comparison boundary before any environmental claim.' : 'Exigir una frontera comparativa verificada antes de cualquier afirmación ambiental.' },
    ],
  };
  return [strategyAction[strategy], ...audienceActions[audience]];
}

export function buildStrategicTranslation(args: {
  locale: Locale;
  audience: AudienceId;
  strategy: StrategyId;
  result: ScenarioResult;
  repairClassification: ComparativeClassification;
  parallelClassification: ComparativeClassification;
  environmental: Record<'repairFirst' | 'parallel', EnvironmentalAssessment>;
  claims: ClaimGateResult[];
}): StrategicTranslation {
  const { locale, audience, strategy } = args;
  const t = translatorCopy(locale);
  const baseline = args.result.strategies.new;
  const selected = args.result.strategies[strategy];
  const classification = classificationFor(strategy, args.repairClassification, args.parallelClassification);
  const conclusion = conclusionForStrategy(strategy, args.repairClassification, args.parallelClassification);
  const timeDelta = selected.expectedRecoveryDays - baseline.expectedRecoveryDays;
  const targetDelta = selected.probabilityTargetMet - baseline.probabilityTargetMet;
  const costDelta = selected.expectedCashOutlay - baseline.expectedCashOutlay;
  const assessment = strategy === 'new' ? null : args.environmental[strategy];
  const comparison = comparativeNarrative(strategy, args.result, audience, locale);
  const ghg = assessment?.indicators.find((item) => item.id === 'boundedGhgDeltaKgCo2e');
  const benefitRejected = conclusion === 'unfavourable' || conclusion === 'noDemonstratedBenefit';
  const environmentalStatus: EvidenceStatus = strategy === 'new' ? 'modelledExample' : ghg?.status === 'modelled' ? (ghg.value !== null && ghg.value >= 0 ? 'rejected' : 'modelledExample') : 'hypothesis';
  const environmentalStatement = locale === 'es'
    ? strategy === 'new' ? 'La sustitución constituye la referencia física de nueva fabricación; no se infiere superioridad ambiental.' : ghg?.status === 'modelled' ? `El escenario estima ${formatNumber(ghg.value ?? 0, locale)} ${ghg.unit} frente a sustitución; usa factores ficticios y no es un ACV.` : 'El mecanismo ambiental no está cuantificado con factores verificados.'
    : strategy === 'new' ? 'Replacement is the new-manufacture physical reference; no environmental superiority is inferred.' : ghg?.status === 'modelled' ? `The scenario estimates ${formatNumber(ghg.value ?? 0, locale)} ${ghg.unit} versus replacement; it uses fictional factors and is not an LCA.` : 'The environmental mechanism is not quantified with verified factors.';
  const profile = strategyProfile(strategy, selected, baseline, classification, locale);
  const strategyModelIds = [`MODEL-${strategy}-TIME`, `MODEL-${strategy}-TARGET`, `MODEL-${strategy}-COST`];
  const selectedEvidenceIds = strategy === 'new' ? ['HYP-SUPPLY-VULNERABILITY', 'MODEL-ECONOMICS'] : strategy === 'repairFirst' ? ['HYP-REPAIR-FEASIBILITY', 'MODEL-RESILIENCE', 'MODEL-ECONOMICS'] : ['HYP-SUPPLY-VULNERABILITY', 'HYP-REPAIR-FEASIBILITY', 'MODEL-ECONOMICS'];

  return {
    locale,
    audience,
    strategy,
    conclusion,
    headline: headline(conclusion, strategy, audience, locale),
    executiveSummary: `${analyticalSentence(strategy, selected, baseline, conclusion, locale)} ${audienceSentence(audience, locale)}`,
    decisionRecommendation: recommendation(conclusion, strategy, audience, locale, comparison),
    decisionBoundary: locale === 'es' ? 'Los resultados representan recuperación de un componente. No equivalen a disponibilidad de aeronave, preparación de flota o disponibilidad de misión.' : 'The outputs represent component recovery. They are not aircraft availability, fleet readiness or mission availability.',
    comparativeAssessment: comparison.assessment,
    comparativeDecisionRule: comparison.decisionRule,
    comparisonStatements: comparison.statements,
    primaryComparator: comparison.primaryComparator,
    marginalValuePerDay: comparison.marginalValuePerDay,
    metrics: [
      { id: 'expectedRecovery', label: t.metrics.expectedRecovery, value: `${formatNumber(selected.expectedRecoveryDays, locale)} ${locale === 'es' ? 'días' : 'days'}`, direction: direction(timeDelta, true, strategy === 'new'), status: 'modelledExample', modelOutputIds: [`MODEL-${strategy}-TIME`] },
      { id: 'targetAttainment', label: t.metrics.targetAttainment, value: `${formatNumber(selected.probabilityTargetMet * 100, locale)}%`, direction: direction(targetDelta, false, strategy === 'new'), status: 'modelledExample', modelOutputIds: [`MODEL-${strategy}-TARGET`] },
      { id: 'expectedCashOutlay', label: t.metrics.expectedCashOutlay, value: formatMoney(selected.expectedCashOutlay, locale), direction: direction(costDelta, true, strategy === 'new'), status: 'modelledExample', modelOutputIds: [`MODEL-${strategy}-COST`] },
    ],
    causalSteps: [
      { stage: 'initiative', label: t.stageLabels.initiative, statement: locale === 'es' ? `${strategyName(strategy, locale)} es una opción ficticia modelizada. Las fuentes públicas documentan únicamente el contexto general de reparación y circularidad, no esta estrategia específica.` : `${strategyName(strategy, locale)} is a fictional modelled option. Public sources document only general repair and circularity context, not this specific strategy.`, status: 'modelledExample', evidenceIds: ['MODEL-ECONOMICS', ...(strategy === 'new' ? [] : ['EVD-SERVICE-OFFERING', 'EVD-CIRCULARITY'])], focus: { type: 'strategy', id: strategy } },
      { stage: 'environmentalMechanism', label: t.stageLabels.environmentalMechanism, statement: environmentalStatement, status: environmentalStatus, evidenceIds: strategy === 'new' ? ['MODEL-ENVIRONMENT'] : ['EVD-CIRCULARITY', 'MODEL-ENVIRONMENT'], focus: { type: 'stage', id: 'environmentalMechanism' } },
      { stage: 'strategicVulnerability', label: t.stageLabels.strategicVulnerability, statement: locale === 'es' ? strategy === 'new' ? 'La referencia depende del plazo, existencias y disrupción del suministro nuevo.' : strategy === 'repairFirst' ? 'La opción combina dependencia de elegibilidad con una compra nueva secuencial si la reparación falla.' : 'La opción diversifica rutas, pero mantiene dependencias comunes y contractuales.' : strategy === 'new' ? 'The reference depends on new-supply lead time, stock and disruption.' : strategy === 'repairFirst' ? 'The option combines eligibility dependence with sequential new procurement after failure.' : 'The option diversifies routes but retains common-cause and contractual dependencies.', status: 'hypothesis', evidenceIds: ['HYP-SUPPLY-VULNERABILITY', ...(strategy === 'new' ? [] : ['HYP-REPAIR-FEASIBILITY'])], focus: { type: 'stage', id: 'strategicVulnerability' } },
      { stage: 'resilienceOutcome', label: t.stageLabels.resilienceOutcome, statement: locale === 'es' ? `El resultado de ${strategyName(strategy, locale)} es «${t.conclusions[conclusion]}» y procede de ramas con datos ficticios.` : `The ${strategyName(strategy, locale)} result is “${t.conclusions[conclusion]}” and comes from branches with fictional inputs.`, status: 'modelledExample', evidenceIds: selectedEvidenceIds, focus: { type: 'strategy', id: strategy } },
      { stage: 'customerValue', label: t.stageLabels.customerValue, statement: locale === 'es' ? 'El valor se expresa como recomendación de decisión condicionada; no hay beneficio específico validado para comunicación externa.' : 'Value is expressed as a conditional decision recommendation; no case-specific benefit is validated for external communication.', status: benefitRejected ? 'rejected' : 'unsupported', evidenceIds: ['UNSUPPORTED-AIRBUS-BENEFIT', 'REJECTED-READINESS'], focus: { type: 'stage', id: 'customerValue' } },
    ],
    traceItems: [
      { id: 'TRACE-PUBLIC', statement: locale === 'es' ? 'Las fuentes públicas documentan el contexto general de reparación y circularidad, no el rendimiento de esta estrategia.' : 'Public sources document general repair and circularity context, not this strategy’s performance.', status: 'documentedFact', evidenceIds: ['EVD-SERVICE-OFFERING', 'EVD-CIRCULARITY'], modelOutputIds: [], focus: { type: 'stage', id: 'initiative' } },
      { id: 'TRACE-STRATEGY', statement: locale === 'es' ? `Los resultados de ${strategyName(strategy, locale)} son ejemplos modelizados calculados desde las ramas activas.` : `${strategyName(strategy, locale)} results are modelled examples calculated from the active branches.`, status: 'modelledExample', evidenceIds: selectedEvidenceIds, modelOutputIds: strategyModelIds, focus: { type: 'strategy', id: strategy } },
      { id: 'TRACE-ENVIRONMENT', statement: environmentalStatement, status: environmentalStatus, evidenceIds: ['EVD-CIRCULARITY', 'MODEL-ENVIRONMENT'], modelOutputIds: strategy === 'new' || ghg?.status !== 'modelled' ? [] : [`ENV-${strategy}-boundedGhgDeltaKgCo2e`], claimId: 'environmentalBenefit', focus: { type: 'claim', id: 'environmentalBenefit' } },
      { id: 'TRACE-CLAIM', statement: locale === 'es' ? 'La recomendación es útil para decidir, pero no transforma el resultado en un beneficio demostrado.' : 'The recommendation supports a decision but does not turn the result into a demonstrated benefit.', status: benefitRejected ? 'rejected' : 'unsupported', evidenceIds: ['UNSUPPORTED-AIRBUS-BENEFIT', 'REJECTED-READINESS'], modelOutputIds: [], claimId: 'strategicResilience', focus: { type: 'claim', id: 'strategicResilience' } },
    ],
    validationActions: validationActions(audience, strategy, locale),
    advantages: profile.advantages,
    drawbacks: profile.drawbacks,
    uncertainties: profile.uncertainties,
    limitations: locale === 'es' ? [
      'Todos los plazos, probabilidades, costes y factores ambientales son ejemplos ficticios editables.',
      'El modelo excluye flota, demanda, reservas, causas comunes, mantenimiento agregado y disponibilidad de misión.',
      'Las fuentes públicas aportan contexto; no validan los resultados de ninguna estrategia.',
      'La recomendación no constituye aprobación técnica, contractual o comercial.',
    ] : [
      'All timing, probability, cost and environmental factors are editable fictional examples.',
      'The model excludes fleet, demand, reserves, common causes, aggregate maintenance and mission availability.',
      'Public sources provide context; they do not validate any strategy result.',
      'The recommendation is not technical, contractual or commercial approval.',
    ],
    validatedBenefitCount: 0,
  };
}

