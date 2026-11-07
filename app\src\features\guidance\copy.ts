import type { Locale, ViewId } from '../../app/types';

export interface GuidanceStep {
  title: string;
  intro: string;
  sections: Array<{ title: string; body: string }>;
  actions: string[];
  next: string;
}

const en: Record<ViewId, GuidanceStep> = {
  investigate: {
    title: 'Start here: understand the fictional decision case',
    intro: 'A component is unavailable. The team must restore it without treating any route as the answer in advance. All numbers in the laboratory are editable teaching data, not Airbus programme data.',
    sections: [
      { title: 'The supply problem', body: 'A new component may have a long lead time or face a supplier disruption. Waiting can expose the programme to a recovery delay.' },
      { title: 'The three alternatives', body: 'Replace with a new component; inspect and repair first, buying new only if repair is not feasible; or start repair and procurement in parallel.' },
      { title: 'Why sustainability and resilience are linked', body: 'Repair may extend component life and may avoid some new manufacture. The same repair route may also reduce dependence on new supply—but only if eligibility, timing and obligations support it. Environmental intent alone does not prove resilience.' },
      { title: 'The purpose of the analysis', body: 'Find the conditions under which each route improves or worsens recovery, cost and target attainment, then check whether the evidence is strong enough to communicate a benefit.' },
    ],
    actions: ['Read the case and the three alternatives.', 'Follow the causal chain from initiative to evidence.', 'Continue to Challenge to test the alternatives with fictional inputs.'],
    next: 'Start the comparison',
  },
  challenge: {
    title: 'Test the decision step by step',
    intro: 'Begin with one scenario, change only one or two basic inputs, and watch how the three strategies respond. There is no required winning strategy.',
    sections: [
      { title: '1. Choose a scenario', body: 'Start with Balanced example to learn the screen. Then try Repair worsens resilience to see a valid negative conclusion.' },
      { title: '2. Change a basic input', body: 'Try repair feasibility, repair duration, new-part lead time, supplier disruption or the recovery target. Change one input at a time so the cause of the result remains clear.' },
      { title: '3. Read the result', body: 'Compare expected recovery, probability of meeting the target and expected cash outlay. A faster option may cost more; equal target attainment does not make the premium worthwhile automatically.' },
      { title: '4. Draw a bounded conclusion', body: 'Use sensitivity and thresholds to see when the result changes. A conclusion may be favourable, adverse, a trade-off or inconclusive. Open advanced options only when you need contractual, dependence or environmental detail.' },
    ],
    actions: ['Select Balanced example.', 'Change one basic control.', 'Compare all three strategy cards before continuing.'],
    next: 'Check the evidence',
  },
  validate: {
    title: 'Check what supports the result',
    intro: 'A calculated result is not automatically a demonstrated benefit. This step separates public context, fictional assumptions, model outputs and statements that must remain blocked.',
    sections: [
      { title: 'What the states mean', body: 'Documented fact supports only a narrow public statement. Hypothesis is unverified. Modelled example comes from fictional inputs. Unsupported lacks sufficient proof. Rejected conflicts with the result or exceeds the model boundary.' },
      { title: 'What to inspect', body: 'Open an Evidence Register row and read its sources, assumptions and limitations. Then inspect Claim Gates to see which statements may be used only as context and which are blocked.' },
      { title: 'What is still needed', body: 'Validation Requests show the information Engineering, Procurement, Sustainability or Programmes would need to provide before a conclusion could be strengthened.' },
    ],
    actions: ['Select one evidence row.', 'Review the related claim gate.', 'Note at least one missing validation item.'],
    next: 'Translate the conclusion',
  },
  translate: {
    title: 'Communicate the same result without changing its status',
    intro: 'Choose one strategy and one audience. The emphasis changes, but the calculated result, evidence status and limitations do not.',
    sections: [
      { title: 'Choose the strategy first', body: 'Replacement, repair first and parallel strategy each have their own time, cost, uncertainty and decision boundary.' },
      { title: 'Then choose the audience', body: 'Defence focuses on accountable continuity; Programme on gates and obligations; Engineering on eligibility and proof; Leadership on option value and claim readiness.' },
      { title: 'Read the conclusion correctly', body: 'Favourable means favourable under the modelled assumptions. It does not mean Airbus has demonstrated an environmental, operational or customer benefit. Open evidence and limitations before exporting.' },
    ],
    actions: ['Select a strategy and audience.', 'Read the three-way comparison and decision test.', 'Inspect evidence or export only with the prototype warning.'],
    next: 'Review the case again',
  },
};

const es: Record<ViewId, GuidanceStep> = {
  investigate: {
    title: 'Empieza aquí: comprende el caso ficticio de decisión',
    intro: 'Un componente no está disponible. El equipo debe recuperarlo sin dar por buena ninguna vía de antemano. Todas las cifras del laboratorio son datos didácticos editables, no datos de programas Airbus.',
    sections: [
      { title: 'El problema de suministro', body: 'Una pieza nueva puede tener un plazo largo o sufrir una disrupción del proveedor. Esperar puede retrasar la recuperación del componente.' },
      { title: 'Las tres alternativas', body: 'Sustituir con una pieza nueva; inspeccionar y reparar primero, comprando nueva sólo si no es reparable; o activar reparación y compra en paralelo.' },
      { title: 'Por qué relacionamos sostenibilidad y resiliencia', body: 'Reparar puede extender la vida del componente y evitar parte de la fabricación nueva. Esa misma vía puede reducir dependencia del suministro, pero sólo si la elegibilidad, el plazo y las obligaciones lo permiten. La intención ambiental no demuestra resiliencia.' },
      { title: 'Objetivo del análisis', body: 'Identificar cuándo cada vía mejora o empeora recuperación, coste y cumplimiento, y comprobar después si existe evidencia suficiente para comunicar un beneficio.' },
    ],
    actions: ['Lee el caso y las tres alternativas.', 'Sigue la cadena causal desde la iniciativa hasta la evidencia.', 'Continúa a Cuestionar para probar las alternativas con datos ficticios.'],
    next: 'Empezar la comparación',
  },
  challenge: {
    title: 'Pon a prueba la decisión paso a paso',
    intro: 'Empieza con un escenario, modifica sólo uno o dos datos básicos y observa cómo responden las tres estrategias. No hay una estrategia que deba ganar.',
    sections: [
      { title: '1. Elige un escenario', body: 'Empieza por Ejemplo equilibrado para aprender la pantalla. Después prueba La reparación empeora la resiliencia para observar una conclusión negativa válida.' },
      { title: '2. Modifica un dato básico', body: 'Prueba la viabilidad, duración de reparación, plazo de pieza nueva, disrupción del proveedor u objetivo. Cambia un dato cada vez para entender qué provoca el resultado.' },
      { title: '3. Interpreta el resultado', body: 'Compara recuperación esperada, probabilidad de cumplir el objetivo y desembolso. Una opción más rápida puede costar más; igual cumplimiento no justifica automáticamente la prima.' },
      { title: '4. Extrae una conclusión limitada', body: 'Usa sensibilidad y umbrales para ver cuándo cambia el resultado. Puede ser favorable, adverso, un compromiso o no concluyente. Abre opciones avanzadas sólo si necesitas detalle contractual, dependencia o ambiental.' },
    ],
    actions: ['Selecciona Ejemplo equilibrado.', 'Cambia un control básico.', 'Compara las tres tarjetas antes de continuar.'],
    next: 'Comprobar las evidencias',
  },
  validate: {
    title: 'Comprueba qué respalda el resultado',
    intro: 'Un resultado calculado no es automáticamente un beneficio demostrado. Esta pantalla separa contexto público, hipótesis ficticias, resultados del modelo y afirmaciones que deben permanecer bloqueadas.',
    sections: [
      { title: 'Qué significan los estados', body: 'Hecho documentado respalda sólo una afirmación pública concreta. Hipótesis no está verificada. Ejemplo modelizado procede de datos ficticios. Sin respaldo carece de prueba suficiente. Rechazada contradice el resultado o supera el límite del modelo.' },
      { title: 'Qué debes consultar', body: 'Abre una fila del Registro y revisa fuentes, hipótesis y limitaciones. Después consulta Control de afirmaciones para distinguir el contexto permitido de las afirmaciones bloqueadas.' },
      { title: 'Qué información falta', body: 'Solicitudes de validación muestra qué deberían aportar Ingeniería, Compras, Sostenibilidad o Programas antes de reforzar una conclusión.' },
    ],
    actions: ['Selecciona un registro.', 'Revisa la afirmación relacionada.', 'Identifica al menos un dato pendiente.'],
    next: 'Traducir la conclusión',
  },
  translate: {
    title: 'Comunica el mismo resultado sin cambiar su estado',
    intro: 'Elige una estrategia y una audiencia. Cambia el énfasis, pero no cambian el cálculo, la evidencia ni las limitaciones.',
    sections: [
      { title: 'Elige primero la estrategia', body: 'Sustitución, reparar primero y estrategia paralela tienen sus propios plazos, costes, incertidumbres y límites de decisión.' },
      { title: 'Después elige la audiencia', body: 'Defensa prioriza continuidad responsable; Programa, hitos y obligaciones; Ingeniería, elegibilidad y prueba; Dirección, valor de opción y preparación de afirmaciones.' },
      { title: 'Interpreta bien la conclusión', body: 'Favorable significa favorable bajo las hipótesis modelizadas. No significa que Airbus haya demostrado un beneficio ambiental, operativo o para el cliente. Consulta evidencias y limitaciones antes de exportar.' },
    ],
    actions: ['Selecciona estrategia y audiencia.', 'Lee la comparación tripartita y la prueba de decisión.', 'Consulta evidencias o exporta manteniendo la advertencia de prototipo.'],
    next: 'Revisar el caso de nuevo',
  },
};

export const guidanceCopy = (locale: Locale) => locale === 'es' ? es : en;
