import type { CausalStage, Locale, ViewId } from '../app/types';

export interface Copy {
  skip: string;
  brandSub: string;
  prototypeStatus: string;
  phaseLabel: string;
  navLabel: string;
  railHint: string;
  railBottom: string;
  views: Record<ViewId, { label: string; short: string }>;
  eyebrow: string;
  heroLead: string;
  heroEmphasis: string;
  heroSubtitle: string;
  heroCopy: string;
  scopeMeta: string;
  dataMeta: string;
  systemMap: string;
  causalCaption: string;
  caseLabel: string;
  caseDescription: string;
  chainKicker: string;
  chainTitle: string;
  chainIntro: string;
  chainStages: CausalStage[];
  statusLabels: Record<CausalStage['status'], string>;
  disciplineKicker: string;
  disciplineTitle: string;
  disciplineCopy: string;
  disciplineList: string[];
  questionKicker: string;
  questionTitle: string;
  questionCopy: string;
  counterfactualLabel: string;
  counterfactualCopy: string;
  boundaryLabel: string;
  boundaryCopy: string;
  foundationKicker: string;
  foundationTitle: string;
  foundationCopy: string;
  foundationItems: Array<{ number: string; title: string; copy: string }>;
  fixtureLabel: string;
  challengeTitle: string;
  challengeCopy: string;
  lockedLabel: string;
  paths: string[];
  interpretationTitle: string;
  interpretationCopy: string;
  validateTitle: string;
  validateCopy: string;
  evidenceKicker: string;
  evidenceRows: Array<{ link: string; state: string; note: string }>;
  noClaimsTitle: string;
  noClaimsCopy: string;
  translateTitle: string;
  translateCopy: string;
  translationKicker: string;
  audiences: Array<{ title: string; copy: string }>;
  memoKicker: string;
  memoTitle: string;
  memoCopy: string;
  memoGuardrail: string;
  footerLeft: string;
  footerRight: string;
}

export const copy: Record<Locale, Copy> = {
  en: {
    skip: 'Skip to main content',
    brandSub: 'Strategic resilience decision studio',
    prototypeStatus: 'EXPLORATORY · NOT AIRBUS APPROVED',
    phaseLabel: 'PROTOTYPE / MODEL 0.6',
    navLabel: 'Primary workflow',
    railHint: 'INVESTIGATE / CHALLENGE / VALIDATE / TRANSLATE',
    railBottom: 'PUBLIC DATA / SCENARIO',
    views: {
      investigate: { label: 'Investigate', short: '01' },
      challenge: { label: 'Challenge', short: '02' },
      validate: { label: 'Validate', short: '03' },
      translate: { label: 'Translate', short: '04' },
    },
    eyebrow: 'STRATEGIC RESILIENCE INTELLIGENCE / PRACTICAL CASES',
    heroLead: 'Sustainability as a driver of',
    heroEmphasis: 'strategic resilience.',
    heroSubtitle: 'From environmental initiatives to operational advantage and customer value.',
    heroCopy:
      'Explore how sustainability-driven decisions can reduce critical dependencies, strengthen operational continuity and create strategic value for Airbus and its customers. Use practical cases to discover when these benefits materialise and what evidence is needed to demonstrate them.',
    scopeMeta: 'FICTIONAL CASE DEMO-60: TEST-BENCH CONTROLLER',
    dataMeta: 'FICTIONAL SCENARIO / PUBLIC EVIDENCE',
    systemMap: 'RI / CAUSAL SYSTEM',
    causalCaption: 'CAUSAL CHAIN / EVERY LINK MUST EARN ITS CLAIM',
    caseLabel: 'DEMO-60 — TEST-BENCH CONTROL MODULE',
    caseDescription: 'Fictional maintenance centre · repair · new purchase · parallel route',
    chainKicker: 'GUIDED CASE / CAUSAL INVESTIGATION',
    chainTitle: 'From an initiative to customer value—without skipping the evidence.',
    chainIntro:
      'The platform is organised around six linked questions. A positive environmental intention is not treated as proof of resilience, and a modelled resilience result is not treated as a validated customer claim.',
    chainStages: [
      {
        id: 'initiative',
        short: 'Initiative',
        title: 'Qualified repair',
        description: 'Repair, recover or extend component life instead of relying only on a new part.',
        status: 'modelled',
      },
      {
        id: 'environment',
        short: 'Environment',
        title: 'Potential avoidance',
        description: 'Could defer new manufacture, virgin material demand or disposal; no quantities asserted.',
        status: 'notQuantified',
      },
      {
        id: 'vulnerability',
        short: 'Vulnerability',
        title: 'Supply exposure',
        description: 'Long lead times, supplier concentration and obsolescence may create strategic dependency.',
        status: 'hypothesis',
      },
      {
        id: 'resilience',
        short: 'Resilience',
        title: 'Recovery optionality',
        description: 'Test time, deadline attainment, dependencies and economic commitments by strategy.',
        status: 'modelled',
      },
      {
        id: 'value',
        short: 'Customer value',
        title: 'Defensible relevance',
        description: 'Continuity, planning confidence or autonomy only when the causal path is supported.',
        status: 'hypothesis',
      },
      {
        id: 'evidence',
        short: 'Evidence',
        title: 'Limits made visible',
        description: 'Sources, assumptions, unknowns and prohibited claims remain attached to the result.',
        status: 'documented',
      },
    ],
    statusLabels: {
      documented: 'PUBLIC CONTEXT',
      hypothesis: 'HYPOTHESIS',
      modelled: 'MODELLED EXAMPLE',
      notQuantified: 'NOT QUANTIFIED',
    },
    disciplineKicker: 'EVIDENCE DISCIPLINE',
    disciplineTitle: 'A broken link stops the claim.',
    disciplineCopy:
      'Each transition must carry its own evidence state. The application may conclude that the environmental mechanism is plausible while the resilience outcome is absent, adverse or inconclusive.',
    disciplineList: [
      'No invented CO₂, waste or material figures',
      'No mission-readiness interpretation',
      'No validated Airbus benefit in this prototype',
    ],
    questionKicker: 'THE FICTIONAL CASE',
    questionTitle: 'A customer needs to recover an unavailable aerospace component.',
    questionCopy:
      'The existing component may be repairable, while a replacement may face a long lead time or supplier disruption. The analysis is limited to component recovery and uses editable fictional data—not Airbus programme data.',
    counterfactualLabel: 'THREE ALTERNATIVES',
    counterfactualCopy:
      'Replace with a new component; inspect and repair first, procuring new if needed; or start repair and procurement in parallel.',
    boundaryLabel: 'WHY REPAIR AND CIRCULARITY MAY MATTER',
    boundaryCopy:
      'Extending component life may avoid some new manufacture and reduce exposure to new-part supply. It strengthens resilience only when eligibility, timing, cost and contractual obligations support the route.',
    foundationKicker: 'HOW TO USE THE APPLICATION',
    foundationTitle: 'One decision journey. Four accountable steps.',
    foundationCopy:
      'Move from understanding the case to testing alternatives, checking evidence and adapting the conclusion for a decision audience. The facts and evidence status remain attached throughout.',
    foundationItems: [
      { number: '01', title: 'Investigate', copy: 'Frame the initiative, counterfactual and causal path.' },
      { number: '02', title: 'Challenge', copy: 'Stress alternatives, dependencies and failure conditions.' },
      { number: '03', title: 'Validate', copy: 'Trace every premise, result and claim to its evidence state.' },
      { number: '04', title: 'Translate', copy: 'Adapt emphasis by audience without changing the facts.' },
    ],
    fixtureLabel: 'STATIC VISUAL FIXTURE · NO CALCULATIONS',
    challengeTitle: 'Three pathways. One transparent comparison.',
    challengeCopy:
      'This Phase 1 view validates panel density and chart language only. Values, rankings and recommendations will not be introduced before the model review gate.',
    lockedLabel: 'ANALYTICAL ENGINE / NOT YET IMPLEMENTED',
    paths: ['Purchase new', 'Repair-first', 'Parallel strategy'],
    interpretationTitle: 'Interpretation withheld',
    interpretationCopy:
      'No pathway is identified as preferable in this foundation. Future results must expose timing, economic obligations, dependencies and environmental boundaries together.',
    validateTitle: 'Evidence before assertion.',
    validateCopy:
      'The register structure distinguishes documented material, hypotheses, future model outputs and effects that cannot yet be quantified.',
    evidenceKicker: 'EVIDENCE REGISTER / FOUNDATION',
    evidenceRows: [
      { link: 'Initiative definition', state: 'DOCUMENTED STRUCTURE', note: 'Scope and counterfactual must be explicit.' },
      { link: 'Environmental mechanism', state: 'NOT QUANTIFIED', note: 'No CO₂, waste or material values supplied.' },
      { link: 'Strategic vulnerability', state: 'HYPOTHESIS', note: 'Requires programme and supply evidence.' },
      { link: 'Resilience outcome', state: 'FUTURE MODEL', note: 'No calculation exists in Phase 1.' },
      { link: 'Customer value', state: 'UNSUPPORTED', note: 'Translation remains blocked.' },
      { link: 'Limitations', state: 'VISIBLE', note: 'Boundaries remain attached to every view.' },
    ],
    noClaimsTitle: '0 approved customer claims',
    noClaimsCopy:
      'The foundation demonstrates information architecture and visual discipline. It contains no validated metric, recommendation or external-use assertion.',
    translateTitle: 'Same evidence. Different decision context.',
    translateCopy:
      'Audience framing is prepared, but generated arguments remain inactive until the analytical and evidence gates are approved.',
    translationKicker: 'TRANSLATION ARCHITECTURE',
    audiences: [
      { title: 'Defence customer', copy: 'Continuity, exposure, delivery confidence and conditions of use.' },
      { title: 'Programme', copy: 'Schedule, commitments, governance and decision gates.' },
      { title: 'Engineering', copy: 'Eligibility, configuration, certification and release to service.' },
      { title: 'Leadership', copy: 'Strategic options, dependencies and portfolio-level boundaries.' },
    ],
    memoKicker: 'TRANSLATION STUDIO / FOUNDATION',
    memoTitle: 'Language follows evidence—not ambition.',
    memoCopy:
      'When activated in a later phase, the translator will preserve the same facts while changing emphasis for each audience. Negative and inconclusive findings will remain negative and inconclusive.',
    memoGuardrail: 'NO NARRATIVE GENERATED · PHASE 1',
    footerLeft: 'INDEPENDENT CONCEPT · NO CONFIDENTIAL DATA · NOT AN AIRBUS PRODUCT',
    footerRight: 'RI / 2026 · DEMO-60 · FICTIONAL PROTOTYPE',
  },
  es: {
    skip: 'Saltar al contenido principal',
    brandSub: 'Estudio de decisiones de resiliencia estratégica',
    prototypeStatus: 'EXPLORATORIO · SIN APROBACIÓN DE AIRBUS',
    phaseLabel: 'PROTOTIPO / MODELO 0.6',
    navLabel: 'Flujo principal',
    railHint: 'INVESTIGAR / CUESTIONAR / VALIDAR / TRADUCIR',
    railBottom: 'DATOS PÚBLICOS / ESCENARIO',
    views: {
      investigate: { label: 'Investigar', short: '01' },
      challenge: { label: 'Cuestionar', short: '02' },
      validate: { label: 'Validar', short: '03' },
      translate: { label: 'Traducir', short: '04' },
    },
    eyebrow: 'INTELIGENCIA DE RESILIENCIA ESTRATÉGICA / CASOS PRÁCTICOS',
    heroLead: 'La sostenibilidad como motor de',
    heroEmphasis: 'resiliencia estratégica.',
    heroSubtitle: 'De las iniciativas ambientales a las ventajas operativas y al valor para el cliente.',
    heroCopy:
      'Explora cómo las decisiones de sostenibilidad pueden reducir dependencias críticas, fortalecer la continuidad operativa y crear valor estratégico para Airbus y sus clientes. Utiliza casos prácticos para descubrir cuándo se producen estos beneficios y qué evidencias necesitamos para demostrarlos.',
    scopeMeta: 'CASO FICTICIO DEMO-60: MÓDULO DE BANCO DE ENSAYOS',
    dataMeta: 'ESCENARIO FICTICIO / EVIDENCIA PÚBLICA',
    systemMap: 'RI / SISTEMA CAUSAL',
    causalCaption: 'CADENA CAUSAL / CADA ENLACE DEBE MERECER SU AFIRMACIÓN',
    caseLabel: 'DEMO-60 — MÓDULO DE CONTROL DE BANCO DE ENSAYOS',
    caseDescription: 'Centro ficticio de mantenimiento · reparación · compra nueva · vía paralela',
    chainKicker: 'CASO GUIADO / INVESTIGACIÓN CAUSAL',
    chainTitle: 'De una iniciativa al valor para el cliente, sin saltarse la evidencia.',
    chainIntro:
      'La plataforma se organiza alrededor de seis preguntas conectadas. Una intención ambiental positiva no demuestra resiliencia y un resultado modelizado no equivale a una afirmación validada para el cliente.',
    chainStages: [
      {
        id: 'initiative',
        short: 'Iniciativa',
        title: 'Reparación cualificada',
        description: 'Reparar, recuperar o extender la vida del componente en vez de depender solo de una pieza nueva.',
        status: 'modelled',
      },
      {
        id: 'environment',
        short: 'Medioambiente',
        title: 'Evitación potencial',
        description: 'Podría diferir fabricación, material virgen o residuo; no se afirma ninguna cantidad.',
        status: 'notQuantified',
      },
      {
        id: 'vulnerability',
        short: 'Vulnerabilidad',
        title: 'Exposición al suministro',
        description: 'Plazos largos, concentración y obsolescencia pueden crear dependencia estratégica.',
        status: 'hypothesis',
      },
      {
        id: 'resilience',
        short: 'Resiliencia',
        title: 'Opcionalidad de recuperación',
        description: 'Contrastar plazo, objetivo, dependencias y compromisos económicos de cada estrategia.',
        status: 'modelled',
      },
      {
        id: 'value',
        short: 'Valor cliente',
        title: 'Relevancia defendible',
        description: 'Continuidad, planificación o autonomía solo cuando la ruta causal esté respaldada.',
        status: 'hypothesis',
      },
      {
        id: 'evidence',
        short: 'Evidencia',
        title: 'Límites visibles',
        description: 'Fuentes, hipótesis, incógnitas y afirmaciones prohibidas permanecen unidas al resultado.',
        status: 'documented',
      },
    ],
    statusLabels: {
      documented: 'CONTEXTO PÚBLICO',
      hypothesis: 'HIPÓTESIS',
      modelled: 'EJEMPLO MODELIZADO',
      notQuantified: 'NO CUANTIFICADO',
    },
    disciplineKicker: 'DISCIPLINA DE EVIDENCIA',
    disciplineTitle: 'Un enlace roto detiene la afirmación.',
    disciplineCopy:
      'Cada transición mantiene su propio estado de evidencia. La aplicación puede concluir que el mecanismo ambiental es plausible mientras el resultado de resiliencia es inexistente, adverso o no concluyente.',
    disciplineList: [
      'Sin cifras inventadas de CO₂, residuos o materiales',
      'Sin interpretación de disponibilidad de misión',
      'Sin beneficios Airbus validados en este prototipo',
    ],
    questionKicker: 'EL CASO FICTICIO',
    questionTitle: 'Un cliente necesita recuperar un componente aeroespacial no disponible.',
    questionCopy:
      'El componente existente podría repararse, mientras que su sustitución puede afrontar un plazo largo o una disrupción del proveedor. El análisis se limita a recuperar el componente y utiliza datos ficticios editables, no datos de programas Airbus.',
    counterfactualLabel: 'TRES ALTERNATIVAS',
    counterfactualCopy:
      'Sustituirlo por uno nuevo; inspeccionar y reparar primero, comprando uno nuevo si fuera necesario; o iniciar reparación y compra en paralelo.',
    boundaryLabel: 'POR QUÉ PUEDEN IMPORTAR LA REPARACIÓN Y LA CIRCULARIDAD',
    boundaryCopy:
      'Prolongar la vida del componente puede evitar parte de la fabricación nueva y reducir la exposición al suministro. Solo fortalece la resiliencia si la elegibilidad, el plazo, el coste y las obligaciones contractuales respaldan esa vía.',
    foundationKicker: 'CÓMO UTILIZAR LA APLICACIÓN',
    foundationTitle: 'Un recorrido de decisión. Cuatro pasos responsables.',
    foundationCopy:
      'Avanza desde la comprensión del caso hasta la prueba de alternativas, la comprobación de evidencias y la adaptación de la conclusión. Los hechos y el estado de evidencia permanecen unidos durante todo el recorrido.',
    foundationItems: [
      { number: '01', title: 'Investigar', copy: 'Definir iniciativa, contrafactual y ruta causal.' },
      { number: '02', title: 'Cuestionar', copy: 'Contrastar alternativas, dependencias y condiciones de fallo.' },
      { number: '03', title: 'Validar', copy: 'Trazar cada premisa, resultado y afirmación hasta su evidencia.' },
      { number: '04', title: 'Traducir', copy: 'Adaptar el énfasis sin modificar los hechos.' },
    ],
    fixtureLabel: 'FIXTURE VISUAL ESTÁTICO · SIN CÁLCULOS',
    challengeTitle: 'Tres vías. Una comparación transparente.',
    challengeCopy:
      'Esta vista de Fase 1 valida densidad de paneles y lenguaje gráfico. No habrá valores, rankings ni recomendaciones antes de aprobar el modelo.',
    lockedLabel: 'MOTOR ANALÍTICO / TODAVÍA NO IMPLEMENTADO',
    paths: ['Compra nueva', 'Reparar primero', 'Estrategia paralela'],
    interpretationTitle: 'Interpretación retenida',
    interpretationCopy:
      'Ninguna vía se identifica como preferible en esta fundación. Los resultados futuros deberán mostrar conjuntamente plazos, obligaciones económicas, dependencias y límites ambientales.',
    validateTitle: 'Evidencia antes que afirmación.',
    validateCopy:
      'La estructura del registro diferencia material documentado, hipótesis, resultados futuros del modelo y efectos que todavía no pueden cuantificarse.',
    evidenceKicker: 'REGISTRO DE EVIDENCIAS / FUNDACIÓN',
    evidenceRows: [
      { link: 'Definición de iniciativa', state: 'ESTRUCTURA DOCUMENTADA', note: 'Ámbito y contrafactual deben ser explícitos.' },
      { link: 'Mecanismo ambiental', state: 'NO CUANTIFICADO', note: 'Sin datos de CO₂, residuos o materiales.' },
      { link: 'Vulnerabilidad estratégica', state: 'HIPÓTESIS', note: 'Requiere evidencias de programa y suministro.' },
      { link: 'Resultado de resiliencia', state: 'MODELO FUTURO', note: 'No existen cálculos en Fase 1.' },
      { link: 'Valor para el cliente', state: 'NO RESPALDADO', note: 'La traducción permanece bloqueada.' },
      { link: 'Limitaciones', state: 'VISIBLE', note: 'Los límites acompañan a todas las vistas.' },
    ],
    noClaimsTitle: '0 afirmaciones aprobadas para clientes',
    noClaimsCopy:
      'La fundación demuestra arquitectura de información y disciplina visual. No contiene métricas validadas, recomendaciones ni afirmaciones para uso externo.',
    translateTitle: 'Misma evidencia. Distinto contexto de decisión.',
    translateCopy:
      'La estructura por audiencias está preparada, pero los argumentos generados seguirán inactivos hasta aprobar los puntos de validación analíticos y de evidencia.',
    translationKicker: 'ARQUITECTURA DE TRADUCCIÓN',
    audiences: [
      { title: 'Cliente de Defensa', copy: 'Continuidad, exposición, confianza de entrega y condiciones de uso.' },
      { title: 'Programa', copy: 'Planificación, compromisos, gobernanza y puntos de decisión.' },
      { title: 'Ingeniería', copy: 'Elegibilidad, configuración, certificación y liberación al servicio.' },
      { title: 'Dirección', copy: 'Opciones estratégicas, dependencias y límites de cartera.' },
    ],
    memoKicker: 'ESTUDIO DE TRADUCCIÓN / FUNDACIÓN',
    memoTitle: 'El lenguaje sigue a la evidencia, no a la ambición.',
    memoCopy:
      'Cuando se active en una fase posterior, el traductor conservará los mismos hechos y cambiará el énfasis para cada audiencia. Los resultados negativos y no concluyentes seguirán siéndolo.',
    memoGuardrail: 'SIN NARRATIVA GENERADA · FASE 1',
    footerLeft: 'CONCEPTO INDEPENDIENTE · SIN DATOS CONFIDENCIALES · NO ES UN PRODUCTO AIRBUS',
    footerRight: 'RI / 2026 · DEMO-60 · PROTOTIPO FICTICIO',
  },
};
