import type { Locale } from '../../app/types';

const en = {
  title: 'Strategic Translator',
  intro: 'Translate one analytical result for a decision audience without changing its evidence status.',
  fictional: 'MODELLED EXAMPLE · NOT AN AIRBUS PROGRAMME CONCLUSION',
  audience: 'Audience',
  scenario: 'Active scenario',
  audiences: { defenceCustomer: 'Defence Customer', programmeManager: 'Programme Manager', engineering: 'Engineering', executiveLeadership: 'Executive Leadership' },
  strategies: { new: 'Replacement', repairFirst: 'Repair first', parallel: 'Parallel strategy' },
  audienceNotes: { defenceCustomer: 'Operational continuity and accountable assurance', programmeManager: 'Decision gates, delivery risk and obligations', engineering: 'Eligibility, mechanism and technical proof', executiveLeadership: 'Strategic option value and claim readiness' },
  conclusions: { reference: 'Reference strategy', favourable: 'Favourable modelled result', unfavourable: 'Unfavourable result', contradictory: 'Contradictory trade-off', noDemonstratedBenefit: 'No demonstrated benefit', inconclusive: 'Inconclusive' },
  sections: { profile: 'Strategy profile', causal: 'Causal reasoning', trace: 'Evidence trace', validation: 'Validation plan' },
  mainConclusion: 'Principal conclusion', executiveSummary: 'Executive summary', decision: 'Decision recommendation', boundary: 'Decision boundary',
  modelled: 'Modelled example', documented: 'Documented fact', hypothesis: 'Hypothesis', unsupported: 'Unsupported', rejected: 'Rejected', validated: 'Validated benefit',
  validatedCount: 'Validated case benefits', inspectEvidence: 'Inspect evidence', inspectCalculation: 'Trace calculation',
  profile: 'Strategy profile', advantages: 'Modelled advantages', drawbacks: 'Drawbacks', uncertainties: 'Uncertainties',
  comparison: 'Three-way comparison', decisionTest: 'Decision test',
  limitations: 'Method and limitations', pending: 'What must be verified', owner: 'Owner',
  metrics: { expectedRecovery: 'Average module recovery time', targetAttainment: 'Target attainment', expectedCashOutlay: 'Expected cash outlay' },
  stageLabels: { initiative: 'Sustainability initiative', environmentalMechanism: 'Environmental mechanism', strategicVulnerability: 'Strategic vulnerability', resilienceOutcome: 'Resilience outcome', customerValue: 'Customer value' },
  noValidated: 'No environmental, operational or strategic benefit is validated for this case.',
};

const es = {
  ...en,
  title: 'Traductor estratégico',
  intro: 'Traduce un mismo resultado analítico para una audiencia de decisión sin alterar su estado de evidencia.',
  fictional: 'EJEMPLO MODELIZADO · NO ES UNA CONCLUSIÓN DE PROGRAMA AIRBUS',
  audience: 'Audiencia',
  scenario: 'Escenario activo',
  audiences: { defenceCustomer: 'Cliente de Defensa', programmeManager: 'Responsable de programa', engineering: 'Ingeniería', executiveLeadership: 'Dirección ejecutiva' },
  strategies: { new: 'Sustitución', repairFirst: 'Reparar primero', parallel: 'Estrategia paralela' },
  audienceNotes: { defenceCustomer: 'Continuidad operativa y aseguramiento responsable', programmeManager: 'Puertas de decisión, riesgo de entrega y obligaciones', engineering: 'Elegibilidad, mecanismo y prueba técnica', executiveLeadership: 'Valor de opción estratégica y preparación de afirmaciones' },
  conclusions: { reference: 'Estrategia de referencia', favourable: 'Resultado modelizado favorable', unfavourable: 'Resultado desfavorable', contradictory: 'Compromiso contradictorio', noDemonstratedBenefit: 'Sin beneficio demostrado', inconclusive: 'No concluyente' },
  sections: { profile: 'Perfil de estrategia', causal: 'Razonamiento causal', trace: 'Trazabilidad de evidencias', validation: 'Plan de validación' },
  mainConclusion: 'Conclusión principal', executiveSummary: 'Resumen ejecutivo', decision: 'Recomendación de decisión', boundary: 'Límite de la decisión',
  modelled: 'Ejemplo modelizado', documented: 'Hecho documentado', hypothesis: 'Hipótesis', unsupported: 'Sin respaldo', rejected: 'Rechazada', validated: 'Beneficio validado',
  validatedCount: 'Beneficios del caso validados', inspectEvidence: 'Consultar evidencias', inspectCalculation: 'Trazar cálculo',
  profile: 'Perfil de la estrategia', advantages: 'Ventajas modelizadas', drawbacks: 'Inconvenientes', uncertainties: 'Incertidumbres',
  comparison: 'Comparación entre las tres alternativas', decisionTest: 'Prueba de decisión',
  limitations: 'Método y limitaciones', pending: 'Qué debe verificarse', owner: 'Responsable',
  metrics: { expectedRecovery: 'Tiempo medio de recuperación del módulo', targetAttainment: 'Cumplimiento del objetivo', expectedCashOutlay: 'Desembolso esperado' },
  stageLabels: { initiative: 'Iniciativa de sostenibilidad', environmentalMechanism: 'Mecanismo ambiental', strategicVulnerability: 'Vulnerabilidad estratégica', resilienceOutcome: 'Resultado de resiliencia', customerValue: 'Valor para el cliente' },
  noValidated: 'No hay ningún beneficio ambiental, operativo o estratégico validado para este caso.',
};

type Widen<T> = T extends string ? string : T extends readonly unknown[] ? { [K in keyof T]: Widen<T[K]> } : T extends object ? { [K in keyof T]: Widen<T[K]> } : T;
export type TranslatorCopy = Widen<typeof en>;
export const translatorCopy = (locale: Locale): TranslatorCopy => locale === 'es' ? es : en;

