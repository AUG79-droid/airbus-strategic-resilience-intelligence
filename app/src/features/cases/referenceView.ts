import type { Audience, StrategicCase } from './model';
import { displayOptionName } from './model';
import { calculateUniversal, parameterUnit, type CalculatedOption, type DerivedState } from './universal';

/**
 * Present the baseline as a first-class decision without fabricating a
 * comparison against itself. The original comparative calculations remain
 * between baseline and each candidate.
 */
type Locale='es'|'en';
type OutcomeKey=Exclude<keyof CalculatedOption,'assumptions'>;
type ReferenceRow={ key:OutcomeKey; label:string; state:DerivedState; value:number|null; formatted:string; missing:string[] };
type Insight={id:'bottleneck'|'risk'|'economics'|'environment'|'alternatives'|'evidence'|'action';title:string;body:string};

const DEFINITIONS:{key:OutcomeKey;label:[string,string];unit:string}[]=[
  {key:'recovery',label:['Tiempo medio de recuperación','Expected recovery time'],unit:'time'},
  {key:'deadline',label:['Cumplimiento del plazo','Deadline attainment'],unit:'%'},
  {key:'cost',label:['Coste esperado','Expected cost'],unit:'€'},
  {key:'material',label:['Material virgen','Virgin material'],unit:'kg'},
  {key:'waste',label:['Residuos','Waste'],unit:'kg'},
  {key:'ghg',label:['GEI parciales','Bounded GHG'],unit:'kg CO₂e'},
  {key:'lifeExtension',label:['Vida útil adicional','Additional service life'],unit:'hours'}
];
const fmt=(value:number,locale:Locale)=>new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(value);
const t=(locale:Locale,es:string,en:string)=>locale==='es'?es:en;

export function referenceRows(data:StrategicCase,locale:Locale):ReferenceRow[]{
  const calculated=calculateUniversal(data,data.options[0]);
  return DEFINITIONS.map(definition=>{
    const result=calculated[definition.key];
    const valid=result.state==='calculated'&&result.value!==null&&Number.isFinite(result.value);
    const formatted=valid
      ?fmt(result.value!,locale)+' '+parameterUnit(definition.unit,data.kind,locale)
      :result.state==='excluded'?t(locale,'No aplica','Not applicable')
      :t(locale,'Dato desconocido / incompleto','Unknown / incomplete');
    return {key:definition.key,label:definition.label[locale==='es'?0:1],
      state:result.state,value:valid?result.value:null,formatted,missing:result.missing};
  });
}

export function referenceNarrative(data:StrategicCase,audience:Audience,locale:Locale):{
 headline:string;operationalMeaning:string;quantifiedFinding:string;
 sustainabilityLink:string;decisionQuestion:string;answer:string;insights:Insight[];
}{
  const es=locale==='es';
  const name=displayOptionName(data.options[0],locale);
  const rows=referenceRows(data,locale);
  const value=(key:OutcomeKey)=>rows.find(r=>r.key===key)!.formatted;
  const input=(id:string,unit:string)=>{
    const p=data.parameters[id],v=data.options[0].parameterValues[id]?.value;
    return p?.applicability==='applies'&&typeof v==='number'&&Number.isFinite(v)
      ?fmt(v,locale)+' '+parameterUnit(unit,data.kind,locale)
      :t(locale,'No determinado / no aplica','Not defined / not applicable');
  };
  const next=data.options.slice(1).map(o=>displayOptionName(o,locale)).join(es?' y ':' and ');
  const gates=Object.values(data.gates).every(Boolean);
  const evidence=data.evidence.length;
  const copy={
    defenceCustomer:{
      headline:t(locale,'Continuidad del servicio con la opción de referencia','Service continuity under the reference option'),
      meaning:t(locale,'Esta es la situación de partida para decidir si conviene mantener la sustitución convencional. El resultado modelado no equivale a disponibilidad de aeronave ni de misión.','This is the starting point for deciding whether to retain conventional replacement. Modelled results are not aircraft or mission availability.'),
      question:t(locale,'¿Es aceptable mantener estos plazos y riesgos para recuperar el servicio?','Are these restoration times and risks acceptable for service continuity?'),
      answer:t(locale,'La referencia permite estimar el escenario actual. Su aceptación depende del plazo requerido y de las alternativas; no puede afirmarse que sea mejor ni peor sin compararlas.','The baseline estimates the current route. Acceptability depends on the required deadline and the alternatives; it cannot be ranked without comparing them.')
    },
    engineering:{
      headline:t(locale,'Viabilidad técnica de mantener la solución de referencia','Technical feasibility of retaining the reference solution'),
      meaning:t(locale,'Los datos de recuperación, suministro y fallo describen la opción actual; cualquier cambio requiere comprobar compatibilidad, cualificación y límites técnicos.','Recovery, supply and failure inputs characterise the current option; any change requires checks on compatibility, qualification and technical limits.'),
      question:t(locale,'¿Se mantienen las condiciones técnicas necesarias para utilizar esta solución?','Does the reference solution still meet the necessary technical conditions?'),
      answer:t(locale,'La modelización no acredita cualificación ni aprobación técnica. Deben revisarse las condiciones y evidencias del caso antes de mantener o sustituir esta vía.','Modelling is not proof of qualification or technical approval. Case conditions and evidence must be reviewed before retaining or replacing this route.')
    },
    programmeManager:{
      headline:t(locale,'Impacto de la solución actual en plazos y ejecución del programa','Reference-route implications for programme delivery'),
      meaning:t(locale,'La referencia hace visibles los plazos y el coste esperado que condicionan el compromiso del programa, sin atribuir efectos sobre flota o misión no medidos.','The reference makes timing and expected cost visible for programme delivery without attributing unmeasured fleet or mission effects.'),
      question:t(locale,'¿Cumple esta opción los compromisos del programa y su tolerancia al riesgo?','Does this option meet programme commitments and risk tolerance?'),
      answer:t(locale,'El modelo muestra los resultados de partida; deben contrastarse con los requisitos del programa, sus contratos y las dos alternativas antes de decidir.','The model shows starting outcomes; compare them with programme requirements, contracts and both alternatives before deciding.')
    },
    executiveLeadership:{
      headline:t(locale,'Dependencias estratégicas de conservar la opción actual','Strategic dependencies of retaining the current option'),
      meaning:t(locale,'Mantener la referencia también es una decisión: conserva sus dependencias de suministro, exposición económica y posibles compromisos de sostenibilidad.','Keeping the baseline is itself a decision: it retains its supply dependencies, financial exposure and potential sustainability trade-offs.'),
      question:t(locale,'¿Se justifica mantener estas dependencias frente a las alternativas disponibles?','Is retaining these dependencies justified relative to the available alternatives?'),
      answer:t(locale,'No existe un ganador automático. La decisión exige comparar coste, continuidad, viabilidad, evidencias y dependencias entre las tres opciones.','There is no automatic winner. The decision requires comparing cost, continuity, feasibility, evidence and dependencies across all three options.')
    }
  }[audience];
  const quantifiedFinding=t(locale,'Tiempo medio de recuperación: ','Expected recovery time: ')+value('recovery')+
    ' · '+t(locale,'Cumplimiento del plazo: ','Deadline attainment: ')+value('deadline')+
    ' · '+t(locale,'Coste esperado: ','Expected cost: ')+value('cost');
  const sustainabilityLink=t(locale,
    'Material virgen: '+value('material')+'; residuos: '+value('waste')+'; GEI parciales: '+value('ghg')+'. Son valores modelados, no ahorros ni beneficios ambientales demostrados.',
    'Virgin material: '+value('material')+'; waste: '+value('waste')+'; bounded GHG: '+value('ghg')+'. These are modelled values, not demonstrated savings or environmental benefits.');
  const insights:Insight[]=[
    {id:'bottleneck',title:t(locale,'Plazos y condiciones de suministro','Timing and supply conditions'),
      body:t(locale,'Tiempo medio modelado: ','Modelled expected time: ')+value('recovery')+
      '. '+t(locale,'Plazo de suministro declarado: ','Declared supply lead time: ')+input('supplyLead','time')+
      '. '+t(locale,'Cumplimiento estimado del plazo: ','Estimated deadline attainment: ')+value('deadline')+
      '. '+t(locale,'No se deduce automáticamente un cuello de botella sin evaluar las condiciones.','A bottleneck is not established automatically without checking the underlying conditions.')},
    {id:'risk',title:t(locale,'Riesgos de la opción de referencia','Reference-route risks'),
      body:t(locale,'Éxito técnico declarado: ','Declared technical success: ')+input('technicalSuccess','%')+
      '. '+t(locale,'Probabilidad de perturbación declarada: ','Declared disruption probability: ')+input('shockProbability','%')+
      '. '+t(locale,'Son entradas de simulación, no probabilidades calibradas.','These are simulation inputs, not calibrated probabilities.')},
    {id:'economics',title:t(locale,'Obligaciones económicas','Economic obligations'),
      body:t(locale,'Coste esperado modelado: ','Modelled expected cost: ')+value('cost')+
      '. '+t(locale,'Debe interpretarse con las condiciones contractuales y financieras del caso; no constituye un presupuesto aprobado.','Interpret it with the case contractual and financial conditions; it is not an approved budget.')},
    {id:'environment',title:t(locale,'Impacto ambiental con límites explícitos','Environmental outcomes with explicit boundaries'),
      body:sustainabilityLink+' '+t(locale,'Solo es posible afirmar una mejora mediante una comparación con alcance y método equivalentes.','An improvement can only be claimed after comparing equivalent scope and method.')},
    {id:'alternatives',title:t(locale,'Tres decisiones, una referencia común','Three choices, one shared reference'),
      body:t(locale,'La opción de referencia es ','The reference option is ')+name+'. '+
        t(locale,'Las otras opciones son ','The other options are ')+next+
        '. '+t(locale,'ASRI calcula sus diferencias frente a esta referencia, no frente a sí misma.','ASRI calculates their differences against the baseline, never against itself.')},
    {id:'evidence',title:t(locale,'Evidencias y revisión','Evidence and review'),
      body:t(locale,'Registros documentales en el caso: ','Evidence records in the case: ')+evidence+
        '. '+(gates?t(locale,'Controles metodológicos marcados; no representan aprobaciones reales de Airbus.','Method checks marked; these are not real Airbus approvals.')
          :t(locale,'Hay controles metodológicos pendientes.','Some method checks are pending.'))},
    {id:'action',title:t(locale,'Decisión para esta audiencia','Decision for this audience'),
      body:copy.question+' '+copy.answer}
  ];
  return {headline:copy.headline,operationalMeaning:copy.meaning,quantifiedFinding,
    sustainabilityLink,decisionQuestion:copy.question,answer:copy.answer,insights};
}

export function referenceReportText(data:StrategicCase,audience:Audience,locale:Locale):string{
  const es=locale==='es',n=referenceNarrative(data,audience,locale);
  const lines=[
    '# ASRI — '+(data.title||t(locale,'Caso sin título','Untitled case')),
    '',t(locale,'AVISO: prototipo independiente, no aprobado por Airbus.','NOTICE: independent prototype, not Airbus approved.'),
    t(locale,'RESULTADOS: supuestos modelados, no beneficios validados.','RESULTS: modelled assumptions, not validated benefits.'),
    data.hypothetical?t(locale,'DATOS: 100 % HIPOTÉTICOS.','DATA: 100% HYPOTHETICAL.'):'',
    '',t(locale,'## 01 Investigar','## 01 Investigate'),
    t(locale,'Programa: ','Programme: ')+data.programme,
    t(locale,'Qué ha ocurrido: ','What happened: ')+(data.scenario??''),
    t(locale,'Decisión: ','Decision: ')+data.decision,
    t(locale,'Vulnerabilidad: ','Vulnerability: ')+data.vulnerability,
    t(locale,'Alcance: ','Scope: ')+data.boundary,
    '',t(locale,'## 02 Cuestionar — Situación de referencia','## 02 Challenge — Baseline'),
    displayOptionName(data.options[0],locale),
    t(locale,'Valores absolutos de la referencia; sin diferencias ni mejora respecto a sí misma.','Absolute baseline outcomes; no deltas or self-comparison improvement.'),
    ...referenceRows(data,locale).map(row=>'- '+row.label+': '+row.formatted+(row.missing.length?' ('+row.missing.join('; ')+')':'')),
    '',t(locale,'## Controles y entradas de la referencia','## Baseline controls and inputs'),
    ...Object.entries(data.parameters).map(([id,state])=>{
      const v=data.options[0].parameterValues[id];
      return '- '+id+': '+state.applicability+'; '+(v?.value??'N/A')+'; evidence='+(v?.evidenceId||'unlinked')+'; '+state.reason;
    }),
    '',t(locale,'## Las otras dos alternativas','## The two other options'),
    ...data.options.slice(1).map(o=>'- '+displayOptionName(o,locale)+': '+o.explanation),
    '',t(locale,'## 03 Comprobar','## 03 Check'),
    t(locale,'Controles metodológicos declarados: ','Declared method checks: ')+JSON.stringify(data.gates),
    ...data.evidence.map(e=>'- '+e.id+': '+e.title+'; '+e.status+'; '+e.nature+'; '+e.reference+'; '+e.limitations),
    '',t(locale,'## 04 Traducir — Opción de referencia','## 04 Translate — Baseline'),
    t(locale,'Audiencia: ','Audience: ')+audience,
    '### '+n.headline,n.operationalMeaning,n.quantifiedFinding,n.sustainabilityLink,
    n.decisionQuestion,n.answer,
    ...n.insights.flatMap(i=>['','### '+i.title,i.body]),
    '',t(locale,'LÍMITE: no implica aprobación técnica ni causalidad demostrada.','BOUNDARY: no technical approval or demonstrated causality.')
  ];
  return lines.join('\n');
}
