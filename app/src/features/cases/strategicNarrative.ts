import type { Audience, OptionComparison, StrategicCase } from './model';

/**
 * A strategic translator, NOT an automatic benefit certifier.
 * It relates observed *inputs* and calculated *conditional outcomes*
 * to a resilience mechanism and a decision for each audience.
 * It must not equate a component's restoration time with fleet readiness.
 */
export interface StrategicMessage {
  headline: string;
  operationalMeaning: string;
  quantifiedFinding: string;
  sustainabilityLink: string;
  decisionQuestion: string;
}
type Locale='es'|'en';
const n=(x:number,locale:Locale,digits=1)=>
  new Intl.NumberFormat(locale,{maximumFractionDigits:digits}).format(x);
const asPercent=(x:number,locale:Locale)=>n(x,locale,1)+' %';
const measure=(c:OptionComparison,id:string)=>{
  const row=c.rows.find(x=>x.metric.id===id);
  return row && row.issue===undefined && row.baseline!==null && row.candidate!==null
    && row.delta!==null ?row:undefined;
};
const variable=(data:StrategicCase,option:OptionComparison,id:string)=>{
  if(data.parameters[id]?.applicability!=='applies')return undefined;
  const base=data.options[0]?.parameterValues[id]?.value;
  const value=option.option.parameterValues[id]?.value;
  return Number.isFinite(base)&&Number.isFinite(value)&&base!==null&&value!==null
    ?{base,value,delta:value-base}:undefined;
};
export function strategicMessage(data:StrategicCase,c:OptionComparison,audience:Audience,locale:Locale):StrategicMessage{
  const es=locale==='es';
  const isEco=data.kind==='ecodesign';
  const combo=isEco&&c.option.id==='option-b';
  const repair=isEco&&c.option.id==='option-a';
  const name=c.option.name;
  const recovery=measure(c,'expectedRecovery');
  const cost=measure(c,'expectedCost');
  const deadline=measure(c,'deadlineAttainment');
  const material=measure(c,'materialKg');
  const supply=variable(data,c,'supplyLead');
  const hours= data.kind==='wildfire'?(es?'minutos':'minutes')
    :data.kind==='climate'?(es?'horas':'hours'):(es?'días':'days');
  const recoveryText=recovery
    ?(es
      ?`El tiempo medio estimado de recuperación del componente pasa de ${n(recovery.baseline!,locale)} a ${n(recovery.candidate!,locale)} ${hours} (${n(Math.abs(recovery.delta!),locale)} ${hours} ${recovery.delta!<0?'menos':'más'}).`
      :`Estimated component recovery time moves from ${n(recovery.baseline!,locale)} to ${n(recovery.candidate!,locale)} ${hours} (${n(Math.abs(recovery.delta!),locale)} ${hours} ${recovery.delta!<0?'faster':'slower'}).`)
    :es?'El tiempo de recuperación aún no puede compararse con los datos disponibles.':
      'Recovery time cannot yet be compared from the available inputs.';
  const deadlineText=deadline
    ?(es?` La probabilidad calculada de cumplir el plazo pasa del ${asPercent(deadline.baseline!,locale)} al ${asPercent(deadline.candidate!,locale)}, según las hipótesis introducidas.`
      :` The modelled probability of meeting the deadline moves from ${asPercent(deadline.baseline!,locale)} to ${asPercent(deadline.candidate!,locale)} under the entered assumptions.`)
    :'';
  const costText=cost
    ?(es
      ?`El coste esperado ${cost.delta!<0?'disminuye':cost.delta!>0?'aumenta':'no cambia'} en ${n(Math.abs(cost.delta!),locale,0)} € frente a la referencia.`
      :`Expected cost ${cost.delta!<0?'decreases':cost.delta!>0?'increases':'does not change'} by €${n(Math.abs(cost.delta!),locale,0)} against the baseline.`)
    :es?'El impacto económico todavía requiere datos comparables.':'The economic effect still requires comparable data.';
  const materialText=material
    ?(es?`La demanda de material virgen pasa de ${n(material.baseline!,locale)} a ${n(material.candidate!,locale)} kg por unidad funcional.`
      :`Virgin material demand moves from ${n(material.baseline!,locale)} to ${n(material.candidate!,locale)} kg per functional unit.`)
    :'';
  const supplyText=supply
    ?(es?`El plazo condicionante de suministro introducido pasa de ${n(supply.base,locale)} a ${n(supply.value,locale)} ${hours}.`
      :`The entered supply lead-time constraint moves from ${n(supply.base,locale)} to ${n(supply.value,locale)} ${hours}.`)
    :'';
  const better=recovery&&recovery.delta!<0;
  const mechanism=isEco
    ?(combo
      ?(es?'La combinación de una vía de reparación y otra de aprovisionamiento puede ampliar las opciones de recuperación cuando falla el suministro habitual.':
        'Combining repair with another sourcing route can broaden recovery options if normal supply fails.')
      :(es?'Una vía de reparación cualificada añade una opción de recuperación distinta a esperar la entrega de un componente nuevo. No significa disponer de otro proveedor.':
        'Qualified repair provides a recovery route beyond waiting for a new component. It does not, by itself, add another supplier.'))
    :(es?`La iniciativa plantea este mecanismo de resiliencia: ${data.mechanism||'reducir una vulnerabilidad operativa definida'}.`
      :`The initiative proposes this resilience mechanism: ${data.mechanism||'reducing a defined operational vulnerability'}.`);
  const improvementQualifier=better
    ?(es?'En este escenario la vía alternativa permite recuperar antes el componente; no demuestra por sí sola una mejora de disponibilidad de toda la flota.':
      'In this scenario the option restores the component sooner; this does not itself demonstrate fleet-level availability.')
    :(es?'La comparación no muestra una reducción del tiempo estimado de recuperación; hay que valorar otras ventajas y compromisos.':
      'The comparison does not show shorter estimated recovery; other benefits and trade-offs need assessment.');
  if(audience==='defenceCustomer'){
    return {
      headline:es?'Resiliencia operativa: más capacidad de respuesta ante problemas de suministro':
        'Operational resilience: more recovery options when supply is disrupted',
      operationalMeaning:`${mechanism} ${improvementQualifier}`,
      quantifiedFinding:recoveryText+deadlineText,
      sustainabilityLink:es
        ?`${materialText} El valor para Defensa no es solo consumir menos: es reducir la exposición del servicio a una única ruta de reposición.`
        :`${materialText} The value for Defence is not merely using less material: it is reducing exposure to a single replacement route.`,
      decisionQuestion:es
        ?'Decisión para el cliente: ¿permite esta opción mantener los requisitos de capacidad y recuperar antes el componente crítico bajo interrupciones comparables?'
        :'Customer decision: can this option meet capability requirements and restore the critical component sooner under comparable disruptions?'
    };
  }
  if(audience==='engineering'){
    return {
      headline:es?'Convertir la reparabilidad en una alternativa técnicamente utilizable':
        'Make repairability a technically viable recovery option',
      operationalMeaning:mechanism,
      quantifiedFinding:recoveryText,
      sustainabilityLink:es
        ?`${materialText} Una reducción de material solo se convierte en resiliencia cuando la reparación mantiene función, seguridad y trazabilidad.`
        :`${materialText} Material savings support resilience only when repair maintains function, safety and traceability.`,
      decisionQuestion:es
        ?'Decisión para Ingeniería: ¿qué ensayos, criterios de aceptación y autorizaciones permiten activar esta vía sin comprometer la aeronavegabilidad ni los requisitos funcionales?'
        :'Engineering decision: which tests, acceptance criteria and approvals are needed to use this route without compromising airworthiness or functional requirements?'
    };
  }
  if(audience==='programmeManager'){
    return {
      headline:es?'Transformar una decisión de ecodiseño en margen de recuperación del programa':
        'Translate an eco-design choice into programme recovery headroom',
      operationalMeaning:`${mechanism} ${better?(es?'La oportunidad es reducir el tiempo expuesto al riesgo de una reposición tardía.':'The opportunity is to reduce the time exposed to delayed replenishment.'):improvementQualifier}`,
      quantifiedFinding:recoveryText+deadlineText,
      sustainabilityLink:`${costText} ${supplyText}`,
      decisionQuestion:es
        ?'Decisión para Programa: ¿compensa la combinación de plazos, coste y contingencias para cumplir los compromisos de soporte?'
        :'Programme decision: do timing, cost and contingency trade-offs justify the option against in-service commitments?'
    };
  }
  return {
    headline:es?'De la circularidad a la resiliencia de la cadena de suministro':
      'From circularity to supply-chain resilience',
    operationalMeaning:mechanism+' '+improvementQualifier,
    quantifiedFinding:recoveryText+deadlineText,
    sustainabilityLink:es
      ?`${materialText} ${costText} Lo estratégico es disminuir la dependencia de una ruta crítica, sin esconder el coste de las alternativas.`
      :`${materialText} ${costText} The strategic value is reducing dependence on a critical route without hiding the alternatives' costs.`,
    decisionQuestion:es
      ?'Decisión para Dirección: ¿qué capacidades de reparación o abastecimiento conviene desarrollar para reducir la vulnerabilidad y qué evidencia justificaría invertir?'
      :'Leadership decision: which repair or sourcing capabilities merit investment to reduce vulnerability, and what evidence would justify it?'
  };
}
export function strategicNarrativeText(data:StrategicCase,c:OptionComparison,audience:Audience,locale:Locale):string{
  const x=strategicMessage(data,c,audience,locale);
  return [x.headline,x.operationalMeaning,x.quantifiedFinding,x.sustainabilityLink,x.decisionQuestion].join('\n\n');
}
