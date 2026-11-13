/**
 * Formal provenance of two distinct numerical models.
 * Both now reuse the same joint-risk probability engine, but their
 * timing, physical outcomes, contract states and KPI boundaries differ.
 * Outputs from different modes are NOT directly interchangeable.
 */
export const MODEL_PROVENANCE={
  demo:{
    id:'asri-demo60-branch-engine',
    version:'0.6.0-phase-6',
    title:{es:'DEMO-60: decisión de mantenimiento de un componente',
      en:'DEMO-60: single-component maintenance decision'},
    scope:{es:'Tres vías discretas: sustituir, reparar primero y paralela; costes y plazos por ramas de decisión.',
      en:'Three discrete strategies: replacement, repair first and parallel; branch-based costs and timings.'}
  },
  custom:{
    id:'asri-case-studio-universal',
    version:'2.0-audit-prototype',
    title:{es:'Caso estratégico: comparación de alternativas configurables',
      en:'Strategic case: configurable alternative comparison'},
    scope:{es:'Modelo condicional de servicio definido por el caso; parámetros, incertidumbre y evidencias declaradas.',
      en:'Conditional service model defined by the case, with declared inputs, sensitivity and evidence.'}
  }
} as const;
export type ModelMode=keyof typeof MODEL_PROVENANCE;
export function modelCompatibility(a:ModelMode,b:ModelMode):'same-mode'|'not-directly-comparable'{
  return a===b?'same-mode':'not-directly-comparable';
}
