import type { ComparativeClassification, EnvironmentalAssessment } from '../../domain';
import type { ClaimGateResult, EvidenceOwner } from './types';

const date = '2026-11-07';
const missing = (owner: EvidenceOwner, en: string, es: string) => ({ owner, request: { en, es } });

export function evaluateClaimGates(args: {
  repairClassification: ComparativeClassification;
  environmental: EnvironmentalAssessment;
}): ClaimGateResult[] {
  const nominal = args.repairClassification.nominalOutcome;
  const resilienceRejected = nominal === 'potentiallyWorse' || nominal === 'noDemonstratedBenefit';
  const ghg = args.environmental.indicators.find((indicator) => indicator.id === 'boundedGhgDeltaKgCo2e');
  const environmentalRejected = ghg?.status === 'modelled' && ghg.value !== null && ghg.value >= 0;
  const standardMissing = [
    missing('engineering', 'Approved repair eligibility, duration and life-extension evidence.', 'Evidencia aprobada de elegibilidad, duración y extensión de vida de la reparación.'),
    missing('procurement', 'Observed lead times, disruption data and contractual economics.', 'Plazos observados, datos de disrupción y economía contractual.'),
    missing('programmes', 'Approved operational KPI and case baseline.', 'KPI operativo y referencia del caso aprobados.'),
  ];
  return [
    {
      id: 'serviceContext',
      title: { en: 'Public service context', es: 'Contexto público del servicio' },
      proposedClaim: { en: 'Airbus publicly offers material and repair support services.', es: 'Airbus ofrece públicamente servicios de apoyo de material y reparación.' },
      status: 'allowedContext', evidenceIds: ['EVD-SERVICE-OFFERING'],
      reasons: { en: ['Allowed only as a narrow description of the reviewed public Airbus page.'], es: ['Permitida únicamente como descripción acotada de la página pública Airbus revisada.'] },
      missingInformation: [], lastEvaluated: date,
    },
    {
      id: 'environmentalBenefit',
      title: { en: 'Environmental benefit claim', es: 'Afirmación de beneficio ambiental' },
      proposedClaim: { en: 'Repair reduces environmental impacts versus replacement in this case.', es: 'La reparación reduce los impactos ambientales frente a la sustitución en este caso.' },
      status: environmentalRejected ? 'rejected' : 'blocked', evidenceIds: ['EVD-CIRCULARITY', 'MODEL-ENVIRONMENT'],
      reasons: environmentalRejected
        ? { en: ['The current fictional factors do not produce a favourable bounded GHG delta.'], es: ['Los factores ficticios actuales no producen una diferencia acotada de GEI favorable.'] }
        : { en: ['Public circularity context does not validate component-specific factors.', 'Any calculated delta is a modelled example, not documented performance.'], es: ['El contexto público de circularidad no valida factores específicos del componente.', 'Toda diferencia calculada es un ejemplo modelizado, no rendimiento documentado.'] },
      missingInformation: [missing('sustainability', 'Verified lifecycle inventory and approved comparison boundary.', 'Inventario de ciclo de vida verificado y frontera de comparación aprobada.'), missing('engineering', 'Physical disposition and approved life-extension evidence.', 'Evidencia de destino físico y extensión de vida aprobada.')], lastEvaluated: date,
    },
    {
      id: 'operationalBenefit',
      title: { en: 'Operational recovery claim', es: 'Afirmación de recuperación operativa' },
      proposedClaim: { en: 'Repair improves operational recovery versus replacement.', es: 'La reparación mejora la recuperación operativa frente a la sustitución.' },
      status: resilienceRejected ? 'rejected' : 'blocked', evidenceIds: ['HYP-SUPPLY-VULNERABILITY', 'HYP-REPAIR-FEASIBILITY', 'MODEL-RESILIENCE'],
      reasons: resilienceRejected
        ? { en: [`The current model classification is “${nominal}”.`], es: [`La clasificación actual del modelo es «${nominal}».`] }
        : { en: ['The direction is modelled from fictional inputs; timings and probabilities are not programme evidence.'], es: ['La dirección se modeliza con datos ficticios; los plazos y probabilidades no son evidencia de programa.'] },
      missingInformation: standardMissing, lastEvaluated: date,
    },
    {
      id: 'strategicResilience',
      title: { en: 'Strategic resilience claim', es: 'Afirmación de resiliencia estratégica' },
      proposedClaim: { en: 'Repair makes the programme more resilient to supply disruption.', es: 'La reparación hace que el programa sea más resiliente ante disrupciones de suministro.' },
      status: resilienceRejected ? 'rejected' : 'blocked', evidenceIds: ['HYP-SUPPLY-VULNERABILITY', 'MODEL-RESILIENCE'],
      reasons: resilienceRejected
        ? { en: ['The current counterfactual does not support an improvement claim.'], es: ['El contrafactual actual no respalda una afirmación de mejora.'] }
        : { en: ['A component recovery result has not been linked to an approved programme resilience KPI.'], es: ['El resultado de recuperación del componente no se ha vinculado a un KPI aprobado de resiliencia del programa.'] },
      missingInformation: standardMissing, lastEvaluated: date,
    },
    {
      id: 'customerValue',
      title: { en: 'External customer-value claim', es: 'Afirmación externa de valor para el cliente' },
      proposedClaim: { en: 'Airbus can present the modelled benefits as demonstrated customer value.', es: 'Airbus puede presentar los beneficios modelizados como valor demostrado para el cliente.' },
      status: resilienceRejected ? 'rejected' : 'blocked', evidenceIds: ['UNSUPPORTED-AIRBUS-BENEFIT', 'REJECTED-READINESS'],
      reasons: { en: ['No case-specific benefit is validated; external release remains blocked.'], es: ['No se ha validado ningún beneficio específico del caso; su comunicación externa permanece bloqueada.'] },
      missingInformation: standardMissing, lastEvaluated: date,
    },
  ];
}

