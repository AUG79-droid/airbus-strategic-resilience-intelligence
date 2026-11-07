import type { Locale } from '../../app/types';

const en = {
  title: 'Evidence & claim control',
  intro: 'Trace public facts, assumptions and model outputs before any statement can pass the claim gate.',
  tabs: { register: 'Evidence Register', claims: 'Claim Gates', sources: 'Source Library', requests: 'Validation Requests' },
  selectRecord: 'Select a record to inspect its complete trace.',
  selectClaim: 'Select a claim to inspect the gate rationale and validation requirements.',
  selectOwner: 'Select an owner to view only the information they must provide.',
  details: 'Details', recordsShown: 'records shown', requestsFor: 'Requests for',
  publicOnly: 'PUBLIC SOURCES ONLY · NO INTERNAL AIRBUS DOCUMENTATION',
  filter: 'Register focus', all: 'All evidence', currentFocus: 'Current focus', clear: 'Show all',
  register: 'Evidence register', sources: 'Source library', claims: 'Claim gate', gaps: 'Validation requests',
  statuses: { documentedFact: 'Documented fact', hypothesis: 'Hypothesis', modelledExample: 'Modelled example', unsupported: 'Unsupported', rejected: 'Rejected' },
  gateStatuses: { allowedContext: 'Allowed as context', blocked: 'Blocked', rejected: 'Rejected' },
  stages: { initiative: 'Sustainability initiative', environmentalMechanism: 'Environmental mechanism', strategicVulnerability: 'Strategic vulnerability', resilienceOutcome: 'Resilience outcome', customerValue: 'Customer value', evidenceLimitations: 'Evidence & limitations' },
  strategies: { new: 'Replace', repairFirst: 'Repair first', parallel: 'Parallel / mixed' },
  source: 'Source', sourcesLabel: 'Sources', assumption: 'Assumptions', output: 'Model outputs', limitations: 'Limitations', needed: 'Evidence required', reviewed: 'Last reviewed', reviewer: 'Reviewer',
  publicationDate: 'Publication', accessedDate: 'Accessed', locator: 'Location', extract: 'Reviewed extract', sourceLimits: 'Source limitations', openSource: 'Open public source', reviewState: 'Review status', reviewedSource: 'Reviewed', lastEvaluated: 'Last evaluated',
  noSource: 'No documentary source — this item is an assumption, model result or control decision.',
  noValidated: '0 validated case-specific benefit claims',
  noValidatedCopy: 'The public sources establish context only. Every environmental, operational, strategic and customer-value benefit remains blocked or rejected.',
  claimReason: 'Gate rationale', missingInfo: 'Information required to reconsider',
  focusNames: { all: 'Complete register', stage: 'Causal stage', strategy: 'Strategy result', claim: 'Claim decision' },
  owners: { engineering: 'Engineering', procurement: 'Procurement', sustainability: 'Sustainability', programmes: 'Programmes' },
  provenance: { fictionalUserInput: 'Fictional user input', explicitPolicy: 'Explicit model policy' },
  traceResult: 'Inspect evidence', traceStage: 'Trace this causal stage',
};

const es = {
  ...en,
  title: 'Evidencias y control de afirmaciones',
  intro: 'Traza hechos públicos, hipótesis y resultados del modelo antes de permitir que una afirmación supere el control.',
  tabs: { register: 'Registro de evidencias', claims: 'Control de afirmaciones', sources: 'Biblioteca de fuentes', requests: 'Solicitudes de validación' },
  selectRecord: 'Selecciona un registro para consultar su trazabilidad completa.',
  selectClaim: 'Selecciona una afirmación para consultar la justificación y los requisitos de validación.',
  selectOwner: 'Selecciona un responsable para consultar únicamente la información que debe aportar.',
  details: 'Detalles', recordsShown: 'registros mostrados', requestsFor: 'Solicitudes para',
  publicOnly: 'SOLO FUENTES PÚBLICAS · SIN DOCUMENTACIÓN INTERNA DE AIRBUS',
  filter: 'Foco del registro', all: 'Todas las evidencias', currentFocus: 'Foco actual', clear: 'Mostrar todo',
  register: 'Registro de evidencias', sources: 'Biblioteca de fuentes', claims: 'Control de afirmaciones', gaps: 'Solicitudes de validación',
  statuses: { documentedFact: 'Hecho documentado', hypothesis: 'Hipótesis', modelledExample: 'Ejemplo modelizado', unsupported: 'Sin respaldo', rejected: 'Rechazada' },
  gateStatuses: { allowedContext: 'Permitida como contexto', blocked: 'Bloqueada', rejected: 'Rechazada' },
  stages: { initiative: 'Iniciativa de sostenibilidad', environmentalMechanism: 'Mecanismo ambiental', strategicVulnerability: 'Vulnerabilidad estratégica', resilienceOutcome: 'Resultado de resiliencia', customerValue: 'Valor para el cliente', evidenceLimitations: 'Evidencias y limitaciones' },
  strategies: { new: 'Sustituir', repairFirst: 'Reparar primero', parallel: 'Paralela / mixta' },
  source: 'Fuente', sourcesLabel: 'Fuentes', assumption: 'Hipótesis de entrada', output: 'Resultados modelizados', limitations: 'Limitaciones', needed: 'Evidencia necesaria', reviewed: 'Última revisión', reviewer: 'Revisor',
  publicationDate: 'Publicación', accessedDate: 'Consulta', locator: 'Localización', extract: 'Extracto revisado', sourceLimits: 'Limitaciones de la fuente', openSource: 'Abrir fuente pública', reviewState: 'Estado de revisión', reviewedSource: 'Revisada', lastEvaluated: 'Última evaluación',
  noSource: 'Sin fuente documental: este elemento es una hipótesis, resultado del modelo o decisión de control.',
  noValidated: '0 afirmaciones validadas de beneficio específico del caso',
  noValidatedCopy: 'Las fuentes públicas solo establecen contexto. Todo beneficio ambiental, operativo, estratégico o para el cliente permanece bloqueado o rechazado.',
  claimReason: 'Justificación del control', missingInfo: 'Información necesaria para reconsiderar',
  focusNames: { all: 'Registro completo', stage: 'Etapa causal', strategy: 'Resultado de estrategia', claim: 'Decisión sobre afirmación' },
  owners: { engineering: 'Ingeniería', procurement: 'Compras', sustainability: 'Sostenibilidad', programmes: 'Programas' },
  provenance: { fictionalUserInput: 'Dato ficticio del usuario', explicitPolicy: 'Política explícita del modelo' },
  traceResult: 'Consultar evidencias', traceStage: 'Trazar esta etapa causal',
};

type Widen<T> = T extends string ? string : T extends readonly unknown[] ? { [K in keyof T]: Widen<T[K]> } : T extends object ? { [K in keyof T]: Widen<T[K]> } : T;
export type EvidenceCopy = Widen<typeof en>;
export const evidenceCopy = (locale: Locale): EvidenceCopy => locale === 'es' ? es : en;

