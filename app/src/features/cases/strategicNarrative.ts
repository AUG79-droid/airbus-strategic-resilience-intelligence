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

/**
 * Non-repair cases must not inherit component repair claims.
 * The shared model estimates duration to restore a defined SERVICE, not
 * platform fleet availability, fuel certification or wildfire detection speed.
 * Audience texts must reflect each case boundary explicitly.
 */
function otherStrategicMessage(data:StrategicCase,c:OptionComparison,audience:Audience,locale:Locale):StrategicMessage {
  const es=locale==='es';
  const recovery=measure(c,'expectedRecovery');
  const target=measure(c,'deadlineAttainment');
  const cost=measure(c,'expectedCost');
  const ghg=measure(c,'ghgKg');
  const material=measure(c,'materialKg');
  const minutes=data.kind==='wildfire'?(es?'minutos':'minutes'):
    data.kind==='climate'?(es?'horas':'hours'):(es?'días':'days');
  const profiles={
    climate:{
      titleEs:'Resiliencia climática: continuidad del soporte ante calor extremo',
      titleEn:'Climate resilience: support continuity during extreme heat',
      processEs:'la actividad de soporte en tierra bajo calor extremo',
      processEn:'the ground-support service during extreme heat',
      mechanismEs:'La protección térmica y los cambios operativos pueden limitar las interrupciones de equipos críticos y facilitar su recuperación.',
      mechanismEn:'Thermal protection and operating changes can limit disruption to critical equipment and support recovery.',
      benefitEs:'La adaptación climática puede convertirse en capacidad de continuidad operativa, no solo en una medida ambiental.',
      benefitEn:'Climate adaptation can strengthen operational continuity, not simply environmental performance.',
      engineeringEs:'¿Qué ensayos térmicos, límites operativos y autorizaciones demostrarían que la alternativa conserva una función equivalente?',
      engineeringEn:'Which thermal tests, operating limits and authorisations would demonstrate equivalent functionality?',
      programmeEs:'¿Qué combinación de inversión, interrupciones evitables y continuidad del soporte debe priorizar el programa?',
      programmeEn:'Which combination of investment, avoidable disruptions and support continuity should the programme prioritise?',
      execEs:'¿Qué adaptación debe financiarse para reducir la exposición del soporte a episodios extremos?',
      execEn:'Which adaptation should be funded to reduce support exposure to extreme events?'
    },
    saf:{
      titleEs:'Resiliencia energética: disponibilidad de rutas de abastecimiento',
      titleEn:'Energy resilience: access to alternative fuel-supply routes',
      processEs:'el abastecimiento del combustible necesario para una misión equivalente',
      processEn:'fuel supply for an equivalent mission',
      mechanismEs:c.option.id==='option-b'
        ?'Una ruta de combustible con suministro alternativo puede reducir la dependencia de un único contrato, siempre que el combustible esté autorizado para la plataforma.'
        :'Una ruta SAF puede reducir el impacto ambiental del combustible, pero depender de un único proveedor no supone diversificación.',
      mechanismEn:c.option.id==='option-b'
        ?'An additional fuel-supply route may reduce reliance on one contract, provided fuel use is approved for the platform.'
        :'A SAF route may reduce bounded fuel emissions, but using a single supplier does not itself diversify supply.',
      benefitEs:'La oportunidad estratégica es compatibilizar suministro fiable y menor impacto, sin confundir una ruta propuesta con una certificación.',
      benefitEn:'The strategic opportunity is to combine reliable supply and lower environmental impact without equating a proposed route with certification.',
      engineeringEs:'¿Están autorizadas la mezcla, la calidad y las condiciones de uso de este combustible para la plataforma y la misión?',
      engineeringEn:'Are the blend, quality and operating conditions approved for the platform and mission?',
      programmeEs:'¿Qué contratos, plazos, reservas y costes permitirían asegurar el combustible necesario para la misión?',
      programmeEn:'Which contracts, lead times, reserves and costs would secure mission fuel?',
      execEs:'¿Conviene invertir en diversificación de suministro y trazabilidad del combustible para reducir vulnerabilidades energéticas?',
      execEn:'Should investment prioritise fuel-supply diversification and traceability to reduce energy vulnerability?'
    },
    wildfire:{
      titleEs:'Resiliencia de respuesta: coordinación y continuidad de las alertas',
      titleEn:'Response resilience: coordinated and dependable alerts',
      processEs:'el flujo operativo de información y coordinación ante incendios',
      processEn:'the operational fire information and coordination flow',
      mechanismEs:'La integración de observación aérea y satelital puede ofrecer más vías de información, y la redundancia de comunicaciones reduce la dependencia de un único enlace.',
      mechanismEn:'Integrated airborne and satellite observations can offer more information routes, while redundant communications reduce reliance on a single link.',
      benefitEs:'El valor estratégico no es simplemente incorporar tecnología: es conservar una coordinación útil cuando fallan sensores o comunicaciones.',
      benefitEn:'The strategic value is not technology alone: it is maintaining useful coordination when sensors or communications fail.',
      engineeringEs:'¿Qué pruebas de latencia, alarmas falsas, seguridad de datos y conectividad confirmarían un flujo fiable de información?',
      engineeringEn:'Which latency, false-alert, data-security and connectivity tests would demonstrate reliable information flow?',
      programmeEs:'¿Qué costes y tiempos de respuesta justificarían integrar observación y redundancia de comunicaciones?',
      programmeEn:'Which costs and response times would justify integrated observation and communication redundancy?',
      execEs:'¿Qué inversiones en información interoperable y comunicaciones resilientes reducen la vulnerabilidad de la respuesta?',
      execEn:'Which investments in interoperable information and resilient communications reduce response vulnerability?'
    }
  } as const;
  if(data.kind==='ecodesign')throw new Error('Use the repair-specific translator for ecodesign');
  const profile=profiles[data.kind];
  const process=es?profile.processEs:profile.processEn;
  const modelledTime=recovery
    ?(es
      ?`Para ${process}, el tiempo medio calculado de restablecimiento pasa de ${n(recovery.baseline!,locale)} a ${n(recovery.candidate!,locale)} ${minutes} (${n(Math.abs(recovery.delta!),locale)} ${minutes} ${recovery.delta!<0?'menos':'más'}).`
      :`For ${process}, modelled restoration time moves from ${n(recovery.baseline!,locale)} to ${n(recovery.candidate!,locale)} ${minutes} (${n(Math.abs(recovery.delta!),locale)} ${minutes} ${recovery.delta!<0?'less':'more'}).`)
    :(es?'El tiempo de restablecimiento queda pendiente de datos suficientes.':'Restoration time needs more data.');
  const deadlineText=target
    ?(es?` El cumplimiento del plazo objetivo modelizado pasa del ${asPercent(target.baseline!,locale)} al ${asPercent(target.candidate!,locale)}.`
      :` Modelled deadline attainment moves from ${asPercent(target.baseline!,locale)} to ${asPercent(target.candidate!,locale)}.`)
    :'';
  const costText=cost
    ?(es?`El coste esperado ${cost.delta!>0?'aumenta':cost.delta!<0?'disminuye':'se mantiene'} en ${n(Math.abs(cost.delta!),locale,0)} € respecto a la referencia.`
      :`Expected cost ${cost.delta!>0?'increases':cost.delta!<0?'decreases':'stays unchanged'} by €${n(Math.abs(cost.delta!),locale,0)} versus baseline.`)
    :'';
  const environmental=ghg
    ?(es?`Los GEI incluidos en el perímetro declarado pasan de ${n(ghg.baseline!,locale)} a ${n(ghg.candidate!,locale)} kg CO₂e.`
      :`Greenhouse gases within the stated boundary move from ${n(ghg.baseline!,locale)} to ${n(ghg.candidate!,locale)} kg CO₂e.`)
    :material
      ?(es?`El material virgen cambia de ${n(material.baseline!,locale)} a ${n(material.candidate!,locale)} kg.`
        :`Virgin material use changes from ${n(material.baseline!,locale)} to ${n(material.candidate!,locale)} kg.`)
      :'';
  const explain=es?profile.mechanismEs:profile.mechanismEn;
  const benefit=es?profile.benefitEs:profile.benefitEn;
  const headline=es?profile.titleEs:profile.titleEn;
  const operationalMeaning=explain+' '+benefit;
  if(audience==='engineering'){
    return {
      headline:es?'Viabilidad técnica de la resiliencia: '+headline: 'Technical feasibility: '+headline,
      operationalMeaning:explain,
      quantifiedFinding:modelledTime,
      sustainabilityLink:environmental,
      decisionQuestion:es?profile.engineeringEs:profile.engineeringEn
    };
  }
  if(audience==='programmeManager'){
    return {
      headline:es?'Compromisos de programa: '+headline:'Programme commitments: '+headline,
      operationalMeaning:explain,
      quantifiedFinding:modelledTime+deadlineText,
      sustainabilityLink:[costText,environmental].filter(Boolean).join(' '),
      decisionQuestion:es?profile.programmeEs:profile.programmeEn
    };
  }
  if(audience==='executiveLeadership'){
    return {
      headline:es?'Decisión estratégica: '+headline:'Strategic decision: '+headline,
      operationalMeaning:benefit+' '+explain,
      quantifiedFinding:modelledTime+deadlineText,
      sustainabilityLink:[costText,environmental].filter(Boolean).join(' '),
      decisionQuestion:es?profile.execEs:profile.execEn
    };
  }
  const question={
    climate:{
      es:'¿Conservamos la actividad de soporte necesaria durante calor extremo sin introducir nuevas dependencias críticas?',
      en:'Can we sustain required support activity during extreme heat without adding new critical dependencies?'
    },
    saf:{
      es:'¿Existe suministro autorizado y suficiente para preservar la continuidad de la misión si falla la ruta habitual?',
      en:'Is approved fuel supply sufficient to preserve mission continuity when the usual route fails?'
    },
    wildfire:{
      es:'¿Puede el operador mantener información útil y coordinación si una fuente o comunicación deja de funcionar?',
      en:'Can the operator maintain actionable information and coordination when a source or communication link fails?'
    }
  }[data.kind];
  return {headline,operationalMeaning,quantifiedFinding:modelledTime+deadlineText,
    sustainabilityLink:[environmental,costText].filter(Boolean).join(' '),
    decisionQuestion:question[locale]};
}

export function strategicMessage(data:StrategicCase,c:OptionComparison,audience:Audience,locale:Locale):StrategicMessage{
  if(data.kind!=='ecodesign')return otherStrategicMessage(data,c,audience,locale);
  const es=locale==='es';
  const isEco=data.kind==='ecodesign';
  const combo=isEco&&c.option.id==='option-b';
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
