import { comparisons, type Audience, type OptionComparison, type StrategicCase } from './model';

/**
 * Dynamic strategic analysis for Translate. Uses the same calculated scenario
 * outcomes as Challenge, not invented supplementary scores or benefits.
 * Never infers aircraft availability, fuel authorisation, hectares protected,
 * safety acceptance or causal proof from restoration-time calculations.
 */
type Locale='es'|'en';
export interface StrategicInsight {
  id:'bottleneck'|'risk'|'economics'|'environment'|'alternatives'|'evidence'|'action';
  title:string;
  body:string;
}
const fmt=(value:number,locale:Locale,decimals=1)=>new Intl.NumberFormat(locale,{maximumFractionDigits:decimals}).format(value);
const percent=(v:number,locale:Locale)=>fmt(v,locale,1)+' %';
const metric=(c:OptionComparison,id:string)=>{
  const r=c.rows.find(row=>row.metric.id===id);
  return r&&r.issue===undefined&&r.baseline!==null&&r.candidate!==null&&
    r.delta!==null&&Number.isFinite(r.candidate)&&Number.isFinite(r.baseline)?r:undefined;
};
function input(data:StrategicCase,c:OptionComparison,id:string){
  if(data.parameters[id]?.applicability!=='applies')return;
  const b=data.options[0]?.parameterValues[id]?.value;
  const v=c.option.parameterValues[id]?.value;
  if(typeof b!=='number'||typeof v!=='number'||!Number.isFinite(b)||!Number.isFinite(v))return;
  return {b,v,d:v-b};
}
function outcomePhrase(delta:number,locale:Locale,unit:string){
  if(delta===0)return locale==='es'?'sin variación':'unchanged';
  const abs=fmt(Math.abs(delta),locale,unit==='€'?0:1);
  return locale==='es'
    ?(delta<0?'disminuye ':'aumenta ')+abs+' '+unit
    :(delta<0?'decreases by ':'increases by ')+abs+' '+unit;
}
const units=(kind:StrategicCase['kind'],locale:Locale)=>kind==='climate'?(locale==='es'?'horas':'hours'):
  kind==='wildfire'?(locale==='es'?'minutos':'minutes'):(locale==='es'?'días':'days');
const scopeByKind={
  ecodesign:['recuperación de un componente de soporte',
    'restoration of a support component'],
  climate:['recuperación del servicio de apoyo durante calor extremo',
    'recovery of ground-support operations during extreme heat'],
  saf:['recuperación del suministro para una misión equivalente',
    'recovery of supply for an equivalent mission'],
  wildfire:['recuperación de la coordinación ante incendios',
    'restoration of wildfire coordination'],
  general:['recuperación del servicio definido',
    'restoration of the defined service']
} as const;

const actions:Record<StrategicCase['kind'],Record<Audience,[string,string]>>={
  ecodesign:{
    defenceCustomer:['Acordar qué nivel de recuperación del componente exige el cliente, qué límites operativos son aceptables y cómo comprobar la capacidad ante una interrupción.',
      'Agree the customer-required recovery level, acceptable operating limits and how to test the capability during disruption.'],
    engineering:['Definir los ensayos y criterios de aceptación de reparación, cualificación de materiales y autorizaciones antes de activar la alternativa.',
      'Define repair tests and acceptance criteria, material qualification and authorisations before activating the option.'],
    programmeManager:['Comparar una estrategia solo de reparación con reparación y suministro alternativo bajo el mismo plazo contractual y el mismo coste funcional.',
      'Compare repair-only with repair plus alternative sourcing under the same contractual deadline and functional cost basis.'],
    executiveLeadership:['Decidir si merece la pena desarrollar una capacidad industrial de reparación o una segunda vía de suministro y con qué umbral económico.',
      'Decide whether to develop an industrial repair capability or a second sourcing route, and at what economic threshold.']
  },
  climate:{
    defenceCustomer:['Definir el nivel mínimo de continuidad del soporte exigido durante el episodio extremo y las condiciones de aceptación.',
      'Define the minimum support continuity needed during the extreme event and the customer acceptance conditions.'],
    engineering:['Priorizar ensayos térmicos, límites de operación y verificación de la infraestructura protegida.',
      'Prioritise thermal testing, operating limits and validation of protected infrastructure.'],
    programmeManager:['Comparar inversión de adaptación con el plazo de recuperación y compromisos operativos del episodio definido.',
      'Compare adaptation investment with recovery timing and operational commitments for the defined event.'],
    executiveLeadership:['Seleccionar las instalaciones o equipos cuya protección reduce la mayor exposición operativa por euro invertido, sin extrapolar a flota.',
      'Prioritise facilities or equipment where protection has the greatest operational value per euro, without extrapolating to a fleet.']
  },
  saf:{
    defenceCustomer:['Definir cuánto combustible autorizado se necesita para el perfil de misión y qué suministro de reserva podría sostenerlo.',
      'Define how much authorised fuel is required for the mission profile and what backup supply could sustain it.'],
    engineering:['Verificar autorizaciones de plataforma y motor, calidad, mezcla, almacenamiento y trazabilidad de cada ruta SAF.',
      'Verify platform and engine authorisations, quality, blend, storage and traceability for each SAF route.'],
    programmeManager:['Evaluar contratos, reservas, dependencia de proveedores, plazos logísticos y sobrecostes para una misión equivalente.',
      'Evaluate contracts, reserve coverage, supplier concentration, logistics lead times and premiums for an equivalent mission.'],
    executiveLeadership:['Decidir si diversificar contratos y capacidad logística crea resiliencia suficiente para justificar el coste adicional.',
      'Decide whether diversified contracts and logistics capability create enough resilience to justify incremental cost.']
  },
  wildfire:{
    defenceCustomer:['Acordar el nivel de coordinación y continuidad de información exigido cuando se interrumpe una fuente de observación o un enlace.',
      'Agree the level of information continuity and coordination needed when an observation source or link fails.'],
    engineering:['Probar latencia de alertas, falsas alarmas, interoperabilidad, seguridad de datos y redundancia de comunicaciones por separado.',
      'Test alert latency, false alarms, interoperability, data security and communication redundancy separately.'],
    programmeManager:['Comparar el coste del sistema integrado con los tiempos de recuperación de la coordinación y los ejercicios operativos previstos.',
      'Compare integrated system cost with coordination recovery time and planned operational exercises.'],
    executiveLeadership:['Priorizar la interoperabilidad y los enlaces resilientes que reduzcan más dependencias durante una emergencia.',
      'Prioritise interoperability and resilient links that remove the most critical emergency-response dependencies.']
  },
  general:{
    defenceCustomer:['Acordar el objetivo operativo que la alternativa debe mantener ante el riesgo identificado.',
      'Agree the operational outcome the option must sustain under the identified risk.'],
    engineering:['Acordar pruebas, condiciones de aceptación y límites técnicos del cambio.',
      'Agree tests, acceptance criteria and technical limits for the change.'],
    programmeManager:['Comparar plazo, coste y recursos con la misma frontera de análisis.',
      'Compare timing, cost and resources within the same boundary.'],
    executiveLeadership:['Acordar qué nivel de riesgo y coste justifica invertir en la alternativa.',
      'Agree what level of risk and cost would justify investment in the option.']
  }
};

/** Seven independent conclusions. Every optional numeric sentence is removed if data is missing. */
export function strategicInsights(data:StrategicCase,c:OptionComparison,audience:Audience,locale:Locale):StrategicInsight[]{
  const es=locale==='es',unit=units(data.kind,locale);
  const customCase=!data.hypothetical || !data.id.startsWith('SYNTH-');
  const filled=(value:string)=>value.trim().length>0;
  const concreteContext=customCase&&filled(data.vulnerability)
    ?(es?` La vulnerabilidad descrita en este caso es: «${data.vulnerability}».`:
      ` The vulnerability defined in this case is: “${data.vulnerability}”.`)
    :'';
  const recovery=metric(c,'expectedRecovery');
  const cost=metric(c,'expectedCost');
  const target=metric(c,'deadlineAttainment');
  const lead=input(data,c,'supplyLead'),base=input(data,c,'baseRecovery');
  const success=input(data,c,'technicalSuccess'),shock=input(data,c,'shockProbability');
  const failure=input(data,c,'failureDelay'),shockDelay=input(data,c,'shockDelay');
  const insights:StrategicInsight[]=[];
  const scope=customCase
    ?(es
      ?(filled(data.boundary)?`actividad y perímetro definidos en «${data.boundary}»`:'actividad del caso aún sin perímetro definido')
      :(filled(data.boundary)?`activity within “${data.boundary}”`:'case activity without a defined boundary'))
    :scopeByKind[data.kind][es?0:1];

  // Operational bottleneck - distinguish supply lead from base work, no incorrect "repair always improves".
  let bottleneck=es
    ?'Para mejorar la recuperación, primero hay que identificar qué nos hace esperar más tiempo.'
    :'To improve recovery, first identify which step takes the most time.';
  if(lead&&base){
    const slow=Math.max(lead.v,base.v);
    const driver=lead.v>base.v
      ?(es?'el suministro tarda más y limita la recuperación':'supply takes longer and limits recovery')
      :base.v>lead.v
        ?(es?'el trabajo operativo tarda más y limita la recuperación':'the work takes longer and limits recovery')
        :(es?'el trabajo y el suministro tardan lo mismo':'operations and supply take the same time');
    bottleneck+=es
      ?` En esta alternativa, el tiempo de trabajo es ${fmt(base.v,locale)} ${unit} y el suministro ${fmt(lead.v,locale)} ${unit}: ${driver} (${fmt(slow,locale)} ${unit}). Acortar la otra actividad no serviría de mucho mientras este plazo siga siendo el mayor.`
      :` For this option, the work takes ${fmt(base.v,locale)} ${unit} and supply lead time is ${fmt(lead.v,locale)} ${unit}: ${driver} (${fmt(slow,locale)} ${unit}). Shortening the other activity will not help much while this remains the longest step.`;
  }else if(base){
    bottleneck+=es
      ?` El tiempo operativo de esta alternativa se sitúa en ${fmt(base.v,locale)} ${unit}; el análisis no incluye una restricción adicional de suministro aplicable.`
      :` This option has a base operating time of ${fmt(base.v,locale)} ${unit}; no additional supply lead-time constraint is applicable.`;
  }
  if(recovery){
    const result=recovery.delta!<0?(es?'menos':'less'):recovery.delta!>0?(es?'más':'more'):(es?'de diferencia':'difference');
    bottleneck+=es
      ?` Frente a la situación actual, la ${scope} tarda ${fmt(Math.abs(recovery.delta!),locale)} ${unit} ${result}.`
      :` Compared with the baseline, ${scope} takes ${fmt(Math.abs(recovery.delta!),locale)} ${unit} ${result}.`;
  }
  insights.push({id:'bottleneck',title:es?'1. Qué está retrasando la recuperación':'1. What is slowing recovery',body:bottleneck});

  // Conditional exposure: parameter inputs, not empirical interruption probabilities.
  const riskPieces:string[]=[];
  if(concreteContext)riskPieces.push(concreteContext.trim());
  if(customCase&&filled(data.mechanism))riskPieces.push(es
    ?`El mecanismo propuesto para abordarla es: «${data.mechanism}». Su eficacia todavía depende de las comprobaciones del caso.`
    :`The proposed response mechanism is: “${data.mechanism}”. Its effectiveness remains subject to the case's validation checks.`);
  if(shock)riskPieces.push(es
    ?`La probabilidad supuesta de disrupción externa cambia del ${percent(shock.b,locale)} al ${percent(shock.v,locale)}.`
    :`Assumed external disruption probability changes from ${percent(shock.b,locale)} to ${percent(shock.v,locale)}.`);
  if(success)riskPieces.push(es
    ?`El éxito técnico supuesto pasa del ${percent(success.b,locale)} al ${percent(success.v,locale)}.`
    :`Assumed technical success moves from ${percent(success.b,locale)} to ${percent(success.v,locale)}.`);
  if(failure)riskPieces.push(es
    ?`Si falla la vía técnica, el retraso aplicado pasa de ${fmt(failure.b,locale)} a ${fmt(failure.v,locale)} ${unit}.`
    :`If the technical route fails, the added delay changes from ${fmt(failure.b,locale)} to ${fmt(failure.v,locale)} ${unit}.`);
  if(shockDelay)riskPieces.push(es
    ?`El retraso por disrupción pasa de ${fmt(shockDelay.b,locale)} a ${fmt(shockDelay.v,locale)} ${unit}.`
    :`Disruption delay changes from ${fmt(shockDelay.b,locale)} to ${fmt(shockDelay.v,locale)} ${unit}.`);
  if(target)riskPieces.push(es
    ?`Con estas hipótesis, la probabilidad calculada de cumplir el plazo pasa del ${percent(target.baseline!,locale)} al ${percent(target.candidate!,locale)}.`
    :`Under these assumptions, the modelled probability of meeting the deadline moves from ${percent(target.baseline!,locale)} to ${percent(target.candidate!,locale)}.`);
  riskPieces.push(es
    ?'El cálculo trata el fallo técnico y la interrupción externa como dos riesgos separados.'
    :'The calculation treats technical failure and external disruption as separate risks.');
  insights.push({id:'risk',title:es?'2. Cómo cambian los riesgos':'2. How the risks change',body:riskPieces.join(' ')});

  // Explicit economic trade-off, including a ratio only when higher cost buys faster recovery.
  let economic=es?'Comparamos el coste de las alternativas para el mismo servicio y periodo.':
    'We compare costs for the same service and period.';
  if(cost){
    economic+=es
      ?` El coste esperado pasa de ${fmt(cost.baseline!,locale,0)} € a ${fmt(cost.candidate!,locale,0)} €: ${outcomePhrase(cost.delta!,locale,'€')}.`
      :` Expected cost moves from €${fmt(cost.baseline!,locale,0)} to €${fmt(cost.candidate!,locale,0)}: it ${outcomePhrase(cost.delta!,locale,'€')}.`;
  }
  if(recovery&&cost){
    if(recovery.delta!<0&&cost.delta!<0)economic+=es
      ?' Esta alternativa recupera antes el servicio y tiene un coste esperado menor.'
      :' This option restores service sooner and has a lower expected cost.';
    else if(recovery.delta!<0&&cost.delta!>0){
      const ratio=cost.delta!/(-recovery.delta!);
      economic+=es
        ?` La recuperación más rápida cuesta más: ${fmt(ratio,locale,0)} € adicionales por ${unit.slice(0,-1)||unit} de recuperación anticipada, como relación entre coste adicional y tiempo ganado.`
        :` Faster recovery costs more: about €${fmt(ratio,locale,0)} per unit of recovery time saved, as a comparison of extra cost against time saved.`;
    }else if(recovery.delta!>0&&cost.delta!<0)economic+=es
      ?' Se ahorra dinero, pero la recuperación es más lenta.'
      :' This saves money, but recovery is slower.';
    else if(recovery.delta!>0&&cost.delta!>0)economic+=es
      ?' La alternativa cuesta más y tarda más en recuperar; no muestra ventaja en estas dos dimensiones.'
      :' The option costs more and restores service more slowly; it offers no advantage on these two dimensions.';
  }
  insights.push({id:'economics',title:es?'3. Coste de la alternativa':'3. What the option costs',body:economic});

  // Report all relevant environmental measures, including increases.
  const envIds:[string,string,string][]=[
    ['materialKg','material virgen','virgin material'],
    ['wasteKg','residuos generados','waste generated'],
    ['ghgKg','GEI incluidos en el perímetro','GHG within the defined boundary'],
    ['lifeExtension','vida útil adicional modelizada','modelled additional service life']
  ];
  const envPieces:string[]=[];
  for(const [id,esLabel,enLabel] of envIds){
    const v=metric(c,id);if(!v)continue;
    const u=id==='ghgKg'?'kg CO₂e':id==='lifeExtension'?(es?'horas':'hours'):'kg';
    envPieces.push(es
      ?`La variable «${esLabel}» pasa de ${fmt(v.baseline!,locale)} a ${fmt(v.candidate!,locale)} ${u}; ${outcomePhrase(v.delta!,locale,u)}.`
      :`The “${enLabel}” measure moves from ${fmt(v.baseline!,locale)} to ${fmt(v.candidate!,locale)} ${u}; it ${outcomePhrase(v.delta!,locale,u)}.`);
  }
  envPieces.push(es
    ?'Una alternativa puede mejorar la recuperación y, aun así, utilizar más materiales o generar más emisiones. Estas cifras comparan solo los impactos incluidos en el caso.'
    :'An option may restore service sooner while using more materials or producing more emissions. These figures cover only the impacts included in this case.');
  insights.push({id:'environment',title:es?'4. Impactos ambientales':'4. Environmental impact',body:envPieces.join(' ')});

  // Compare the selected option directly with the other candidate, not only baseline.
  const other=comparisons(data).find(item=>item.option.id!==c.option.id);
  let alternativeText=es
    ?'También comparamos esta opción con la otra alternativa, no solo con la situación actual.'
    :'We also compare this option with the other alternative, not just the baseline.';
  if(other){
    const otherTime=metric(other,'expectedRecovery');
    const otherCost=metric(other,'expectedCost');
    if(recovery&&otherTime){
      const difference=recovery.candidate!-otherTime.candidate!;
      alternativeText+=es
        ?` Frente a «${other.option.name}», esta opción ${difference===0?'tiene el mismo tiempo de recuperación':difference<0?'recupera antes':'recupera después'}${difference===0?'':` por ${fmt(Math.abs(difference),locale)} ${unit}`}.`
        :` Against “${other.option.name}”, this option ${difference===0?'has the same recovery time':difference<0?'restores service sooner':'restores service later'}${difference===0?'':` by ${fmt(Math.abs(difference),locale)} ${unit}`}.`;
    }
    if(cost&&otherCost){
      const difference=cost.candidate!-otherCost.candidate!;
      alternativeText+=es
        ?` Su coste esperado es ${difference===0?'igual':difference<0?'inferior':'superior'}${difference===0?'':` en ${fmt(Math.abs(difference),locale,0)} €`}.`
        :` Its expected cost is ${difference===0?'the same':difference<0?'lower':'higher'}${difference===0?'':` by €${fmt(Math.abs(difference),locale,0)}`}.`;
    }
  }
  // The generic builder allows user-specific metrics in addition to the
  // universal derived outcomes. Report their actual values, never interpolate.
  if(customCase){
    const values=data.metrics.flatMap(definition=>{
      const baseline=data.options[0]?.measures?.[definition.id]?.value;
      const candidate=c.option.measures?.[definition.id]?.value;
      if(typeof baseline!=='number'||typeof candidate!=='number'||
        !Number.isFinite(baseline)||!Number.isFinite(candidate)||
        (definition.min!==undefined&&(baseline<definition.min||candidate<definition.min))||
        (definition.max!==undefined&&(baseline>definition.max||candidate>definition.max)))return [];
      const delta=candidate-baseline;
      const favourable=delta===0?'neutral':(definition.direction==='higher'?delta>0:delta<0)?'positive':'negative';
      const tendency=es?(favourable==='positive'?'favorable':favourable==='negative'?'desfavorable':'sin cambio'):
        (favourable==='positive'?'favourable':favourable==='negative'?'unfavourable':'unchanged');
      return [es
        ?`«${definition.label}»: ${fmt(baseline,locale)} → ${fmt(candidate,locale)} ${definition.unit}; evolución ${tendency} según el objetivo del indicador declarado.`
        :`“${definition.label}”: ${fmt(baseline,locale)} → ${fmt(candidate,locale)} ${definition.unit}; ${tendency} against the indicator's declared direction.`];
    });
    if(values.length)alternativeText+=es
      ?` Otros indicadores específicos registrados en el caso: ${values.join(' ')}`
      :` Additional user-defined case indicators: ${values.join(' ')}`;
    if(filled(data.decision))alternativeText+=es
      ?` Decisión que queremos tomar: «${data.decision}».`
      :` Decision to be made: “${data.decision}”.`;
  }
  alternativeText+=es
    ?' La mejor opción depende de qué sea más importante: recuperar antes, gastar menos o reducir un riesgo concreto.'
    :' The best choice depends on what matters most: faster recovery, lower cost or a specific risk.';
  insights.push({id:'alternatives',title:es?'5. Comparación con la otra alternativa':'5. Comparison with the other option',body:alternativeText});

  // Show review coverage and the user-defined margin without pretending it is statistical confidence.
  const active=c.rows.filter(row=>row.issue!=='excluded');
  const reviewed=active.filter(row=>row.evidenceReady).length;
  const stable=active.filter(row=>row.robustness==='stable').length;
  const sensitive=active.filter(row=>row.robustness==='sensitive').length;
  let readiness=es
    ?`${reviewed} de ${active.length} resultados comparados tienen fuentes marcadas como revisadas. La prueba de sensibilidad utiliza un margen supuesto del ±${fmt(data.robustnessPercent,locale)} %: ${stable} diferencias superan ese margen y ${sensitive} se consideran sensibles.`
    :`${reviewed} of ${active.length} compared outcomes have records marked as reviewed. The sensitivity check uses an assumed ±${fmt(data.robustnessPercent,locale)} % margin: ${stable} differences exceed that margin and ${sensitive} are considered sensitive.`;
  readiness+=data.hypothetical
    ?(es
      ?' En este ejemplo, esas fuentes, revisiones y condiciones son simuladas: el caso didáctico está completo, pero no existe verificación externa ni beneficio operativo certificado.'
      :' In this example, sources, reviews and conditions are simulated: the exercise is complete, but there is no independent verification or certified operational benefit.')
    :(es?' Las revisiones declaradas requieren aceptación independiente y no establecen causalidad por sí mismas.'
      :' User-declared review needs independent acceptance and does not by itself establish causality.');
  if(c.missing.length)readiness+=es
    ?` Quedan ${c.missing.length} comprobaciones o fuentes pendientes de resolver.`
    :` ${c.missing.length} checks or source gaps remain unresolved.`;
  insights.push({id:'evidence',title:es?'6. Qué información respalda el análisis':'6. What supports the analysis',body:readiness});

  // A concrete NEXT decision, specialised by both audience and initiative.
  const action=(customCase?actions.general:actions[data.kind])[audience][es?0:1];
  const requestedDecision=customCase&&filled(data.decision)
    ?(es?` Decisión definida al crear el caso: «${data.decision}».`:
      ` Decision set when creating the case: “${data.decision}”.`)
    :'';
  const responsible=customCase&&filled(data.owner)
    ?(es?` Equipo responsable: ${data.owner}.`:
      ` Responsible team: ${data.owner}.`)
    :'';
  const gateText=es
    ?' Siguiente paso: contrastar los resultados con los equipos responsables y acordar las pruebas necesarias antes de aplicarlos.'
    :' Next step: review the results with the responsible teams and agree the checks needed before using them.';
  insights.push({id:'action',title:es?'7. Próximo paso recomendado':'7. Recommended next step',body:action+requestedDecision+responsible+gateText});
  return insights;
}
