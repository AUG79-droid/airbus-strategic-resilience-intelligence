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
    general:{
      titleEs:'Resiliencia operativa: opciones frente a una vulnerabilidad definida',
      titleEn:'Operational resilience: alternatives to a defined vulnerability',
      processEs:'la actividad definida en el caso',
      processEn:'the service defined by this case',
      mechanismEs:data.mechanism||'La iniciativa busca reducir la vulnerabilidad de una actividad crítica mediante una alternativa de operación o suministro.',
      mechanismEn:data.mechanism||'The initiative aims to reduce a critical service vulnerability through an alternative operating or supply route.',
      benefitEs:'Lo relevante es comparar el impacto operativo junto con sus costes y condiciones ambientales, no asumir un beneficio automático.',
      benefitEn:'The goal is to compare operational effects with costs and environmental conditions, not assume an automatic benefit.',
      engineeringEs:'¿Qué requisitos técnicos y pruebas permitirían utilizar la alternativa de forma segura?',
      engineeringEn:'Which technical requirements and tests would allow this option to be used safely?',
      programmeEs:'¿Qué plazos y costes permitirían cumplir los compromisos de servicio?',
      programmeEn:'Which timings and costs would support the service commitments?',
      execEs:'¿Qué alternativa reduce mejor la vulnerabilidad dentro de las restricciones declaradas?',
      execEn:'Which alternative reduces vulnerability most effectively within the stated constraints?'
    },
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
    general:{
      es:'¿Qué alternativa proporciona una vía de recuperación más robusta dentro del alcance definido?',
      en:'Which alternative provides a more robust recovery route within the stated boundary?'
    },
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

/**
 * Universal route for ANY new or imported user-defined case, regardless of the
 * chosen template. Unlike prepared examples, its meaning comes exclusively
 * from the user's own case definition and the compared, applicable inputs.
 * An incomplete case produces questions and clearly missing findings.
 */
function customStrategicMessage(data:StrategicCase,c:OptionComparison,audience:Audience,locale:Locale):StrategicMessage {
  const es=locale==='es';
  const text=(value:string,esFallback:string,enFallback:string)=>
    value.trim()|| (es?esFallback:enFallback);
  const subject=text(data.title, 'el caso estratégico','the strategic case');
  const initiative=text(data.initiative,'iniciativa pendiente de definir','initiative yet to be defined');
  const vulnerability=text(data.vulnerability,'vulnerabilidad pendiente de definir','vulnerability yet to be defined');
  const mechanism=text(data.mechanism,'mecanismo pendiente de definir','mechanism yet to be defined');
  const boundary=text(data.boundary,'perímetro aún no definido','boundary not yet defined');
  const option=text(c.option.name,'alternativa seleccionada','selected option');
  const timeUnit=data.kind==='climate'?(es?'horas':'hours'):
    data.kind==='wildfire'?(es?'minutos':'minutes'):(es?'días':'days');
  const recovery=measure(c,'expectedRecovery');
  const deadline=measure(c,'deadlineAttainment');
  const cost=measure(c,'expectedCost');
  const ghg=measure(c,'ghgKg');
  const material=measure(c,'materialKg');
  const outcome=recovery
    ?(es
      ?`El restablecimiento del servicio definido cambia de ${n(recovery.baseline!,locale)} a ${n(recovery.candidate!,locale)} ${timeUnit} (${recovery.delta!<0?'una reducción de':recovery.delta!>0?'un aumento de':'sin diferencia:'} ${n(Math.abs(recovery.delta!),locale)} ${timeUnit}).`
      :`Restoration of the defined service changes from ${n(recovery.baseline!,locale)} to ${n(recovery.candidate!,locale)} ${timeUnit} (${recovery.delta!<0?'a reduction of':recovery.delta!>0?'an increase of':'no difference:'} ${n(Math.abs(recovery.delta!),locale)} ${timeUnit}).`)
    :(es?'No hay todavía datos suficientes para comparar el tiempo de restablecimiento del servicio.':
      'There are not yet enough data to compare service restoration time.');
  const deadlineResult=deadline
    ?(es?` El cumplimiento calculado del plazo objetivo pasa del ${asPercent(deadline.baseline!,locale)} al ${asPercent(deadline.candidate!,locale)}.`
      :` Modelled deadline attainment changes from ${asPercent(deadline.baseline!,locale)} to ${asPercent(deadline.candidate!,locale)}.`)
    :'';
  const costResult=cost
    ?(es?`El coste esperado comparado pasa de ${n(cost.baseline!,locale,0)} € a ${n(cost.candidate!,locale,0)} €.`
      :`Compared expected cost changes from €${n(cost.baseline!,locale,0)} to €${n(cost.candidate!,locale,0)}.`)
    :(es?'El efecto económico no puede cuantificarse todavía.':'The economic effect cannot yet be quantified.');
  const environmental=[
    ghg?(es?`GEI acotados: ${n(ghg.baseline!,locale)} → ${n(ghg.candidate!,locale)} kg CO₂e.`
      :`Bounded GHG: ${n(ghg.baseline!,locale)} → ${n(ghg.candidate!,locale)} kg CO₂e.`):'',
    material?(es?`Material virgen: ${n(material.baseline!,locale)} → ${n(material.candidate!,locale)} kg.`
      :`Virgin material: ${n(material.baseline!,locale)} → ${n(material.candidate!,locale)} kg.`):''
  ].filter(Boolean).join(' ');
  const framed=es
    ?`En «${subject}», analizamos ${initiative}. La vulnerabilidad declarada es: ${vulnerability}. El mecanismo propuesto es: ${mechanism}. La alternativa «${option}» se evalúa dentro del alcance «${boundary}».`
    :`In “${subject}”, we examine ${initiative}. The stated vulnerability is: ${vulnerability}. The proposed mechanism is: ${mechanism}. “${option}” is assessed within “${boundary}”.`;
  const focus:Record<Audience,[string,string,string,string]>={
    defenceCustomer:[
      'Para el cliente, la pregunta es si la alternativa puede sostener la capacidad requerida cuando esa vulnerabilidad se materializa.',
      'For the customer, the question is whether the option can sustain required capability if that vulnerability materialises.',
      'Decisión para el cliente: ¿qué requisito operativo, límite de aceptación y prueba de continuidad justifican escoger esta alternativa?',
      'Customer decision: which operational requirement, acceptance limit and continuity test justify choosing this option?'
    ],
    engineering:[
      'Para Ingeniería, interesa comprobar que el mecanismo declarado es técnicamente viable y no introduce riesgos de seguridad o calidad.',
      'For Engineering, the proposed mechanism must be technically feasible without introducing safety or quality risks.',
      'Decisión para Ingeniería: ¿qué verificación, ensayo, criterio de aceptación y autorización exige el mecanismo propuesto?',
      'Engineering decision: which verification, test, acceptance criteria and authorisations does this mechanism require?'
    ],
    programmeManager:[
      'Para Programa, el valor depende de alcanzar los compromisos operativos dentro del plazo y coste del mismo perímetro.',
      'For Programme, value depends on meeting operational commitments within the same scope, timing and costs.',
      'Decisión para Programa: ¿qué opción equilibra mejor plazo objetivo, costes y contingencias del caso?',
      'Programme decision: which option best balances target deadline, costs and contingencies for this case?'
    ],
    executiveLeadership:[
      'Para Dirección, el objetivo es conocer la vulnerabilidad que cambia y cuánto cuesta reducir su exposición.',
      'For leadership, the aim is to understand which vulnerability changes and what it costs to reduce exposure.',
      'Decisión para Dirección: ¿qué capacidad merece inversión y qué umbral operativo y económico justificaría ampliarla?',
      'Leadership decision: which capability merits investment, and which operational and financial thresholds would justify scaling it?'
    ]
  };
  const words=focus[audience];
  return {
    headline:es?`Resiliencia estratégica de «${subject}»`:`Strategic resilience for “${subject}”`,
    operationalMeaning:framed+' '+words[es?0:1],
    quantifiedFinding:outcome+deadlineResult,
    sustainabilityLink:[environmental,costResult].filter(Boolean).join(' '),
    decisionQuestion:words[es?2:3]
  };
}

export function strategicMessage(data:StrategicCase,c:OptionComparison,audience:Audience,locale:Locale):StrategicMessage{
  // A template type is NOT proof that a user's own case is the prepared
  // Eurodrone/heat/SAF/wildfire story. All new cases use the universal route.
  if(!data.hypothetical || !data.id.startsWith('SYNTH-'))return customStrategicMessage(data,c,audience,locale);
  if(data.kind!=='ecodesign')return otherStrategicMessage(data,c,audience,locale);
  const es=locale==='es';
  const isEco=data.kind==='ecodesign';
  const combo=isEco&&c.option.id==='option-b';
  const recovery=measure(c,'expectedRecovery');
  const cost=measure(c,'expectedCost');
  const deadline=measure(c,'deadlineAttainment');
  const material=measure(c,'materialKg');
  const supply=variable(data,c,'supplyLead');
  const hours=es?'días':'days';
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
      ?(es?'Combinar la reparación con un proveedor alternativo ofrece dos vías para recuperar el componente ante problemas de suministro.':
        'Combining repair with an alternative supplier provides two ways to recover the component if normal supply is disrupted.')
      :(es?'Una reparación cualificada permite recuperar el componente sin depender únicamente de recibir uno nuevo.':
        'Qualified repair offers another way to recover the component without relying only on a new delivery.'))
    :(es?`La iniciativa plantea este mecanismo de resiliencia: ${data.mechanism||'reducir una vulnerabilidad operativa definida'}.`
      :`The initiative proposes this resilience mechanism: ${data.mechanism||'reducing a defined operational vulnerability'}.`);
  const improvementQualifier=better
    ?(es?'En esta comparación, la alternativa permite recuperar el componente antes.':
      'In this comparison, the option restores the component sooner.')
    :(es?'En esta comparación, la alternativa no reduce el tiempo de recuperación.':
      'In this comparison, the option does not reduce recovery time.');
  if(audience==='defenceCustomer'){
    return {
      headline:es?'Resiliencia operativa: más capacidad de respuesta ante problemas de suministro':
        'Operational resilience: more recovery options when supply is disrupted',
      operationalMeaning:`${mechanism} ${improvementQualifier}`,
      quantifiedFinding:recoveryText+deadlineText,
      sustainabilityLink:es
        ?`${materialText} El valor para Defensa es consumir menos materiales y disponer de una alternativa a la sustitución convencional.`
        :`${materialText} For Defence, the value is using less material and having an alternative to conventional replacement.`,
      decisionQuestion:es
        ?'Pregunta del cliente: ¿qué aporta esta alternativa a la recuperación del componente cuando falla el suministro?'
        :'Customer question: what does this option add to component recovery when supply is disrupted?'
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
        ?'Pregunta para Ingeniería: ¿qué hay que comprobar para utilizar esta alternativa de forma segura?'
        :'Engineering question: what needs to be checked before this option can be used safely?'
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
        ?'Pregunta para Programa: ¿merece la pena esta alternativa por sus plazos y costes?'
        :'Programme question: is this option worthwhile in terms of time and cost?'
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
      ?'Pregunta para Dirección: ¿conviene invertir en esta alternativa de recuperación?'
      :'Leadership question: is this recovery option worth investing in?'
  };
}

/**
 * Explicit answer to the question asked in the strategic translator.
 * Based on the currently selected alternative, not a static example.
 * A modelled recovery gain is NOT proof of fleet readiness, technical
 * authorisation, mission continuity or commercial acceptance.
 */
/**
 * Answer the audience's ACTUAL decision question in clear, everyday language.
 *
 * The result is limited to what the scenario calculates. The existing case
 * status and evidence register identify simulated data; the answer doesn't
 * repeat a disclaimer after every useful conclusion.
 */
export function strategicDecisionAnswer(
  data:StrategicCase,c:OptionComparison,audience:Audience,locale:Locale
):string {
  const es=locale==='es';
  const recovery=measure(c,'expectedRecovery');
  const deadline=measure(c,'deadlineAttainment');
  const cost=measure(c,'expectedCost');
  const unit=data.kind==='climate'?(es?'horas':'hours'):
    data.kind==='wildfire'?(es?'minutos':'minutes'):(es?'días':'days');
  const subject={
    ecodesign:es?'el componente':'the component',
    climate:es?'el servicio de apoyo en tierra':'ground-support operations',
    saf:es?'el suministro de combustible':'fuel supply',
    wildfire:es?'la coordinación durante el incendio':'coordination during a wildfire',
    general:es?'el servicio analizado':'the assessed service'
  }[data.kind];
  const change=(row:NonNullable<typeof recovery>):'better'|'worse'|'same'=>
    row.delta!< -1e-8?'better':row.delta!>1e-8?'worse':'same';
  const recoveryState=recovery?change(recovery):undefined;
  const targetState=deadline?deadline.delta!>1e-8?'better':
    deadline.delta!< -1e-8?'worse':'same':undefined;
  const costState=cost?change(cost):undefined;
  const measures:string[]=[];
  if(recovery){
    const difference=n(Math.abs(recovery.delta!),locale);
    measures.push(es
      ?recoveryState==='better'
        ?`se tarda ${difference} ${unit} menos en recuperar ${subject} (de ${n(recovery.baseline!,locale)} a ${n(recovery.candidate!,locale)} ${unit})`
        :recoveryState==='worse'
          ?`se tarda ${difference} ${unit} más en recuperar ${subject} (de ${n(recovery.baseline!,locale)} a ${n(recovery.candidate!,locale)} ${unit})`
          :`el tiempo de recuperación de ${subject} sigue siendo de ${n(recovery.candidate!,locale)} ${unit}`
      :recoveryState==='better'
        ?`recovering ${subject} takes ${difference} fewer ${unit} (from ${n(recovery.baseline!,locale)} to ${n(recovery.candidate!,locale)} ${unit})`
        :recoveryState==='worse'
          ?`recovering ${subject} takes ${difference} more ${unit} (from ${n(recovery.baseline!,locale)} to ${n(recovery.candidate!,locale)} ${unit})`
          :`recovery time for ${subject} stays at ${n(recovery.candidate!,locale)} ${unit}`);
  }
  if(deadline){
    measures.push(es
      ?`la probabilidad calculada de cumplir el plazo pasa del ${asPercent(deadline.baseline!,locale)} al ${asPercent(deadline.candidate!,locale)}`
      :`the modelled chance of meeting the deadline moves from ${asPercent(deadline.baseline!,locale)} to ${asPercent(deadline.candidate!,locale)}`);
  }
  const measureText=measures.length
    ?(es?`En la comparación, ${measures.join(' y ')}.`:
      `In the comparison, ${measures.join(' and ')}.`)
    :'';
  if(!recovery&&!deadline){
    return es
      ?'Todavía no hay datos suficientes para responder. Introduce los tiempos de recuperación y el plazo objetivo de las alternativas para obtener una conclusión.'
      :'There are not enough data to answer yet. Enter recovery times and a common deadline for the options to see a conclusion.';
  }
  const effect=recoveryState==='better'&&targetState!=='worse'
    ?(es?'La alternativa permite recuperar antes el servicio y disponer de otra opción ante una interrupción.':
      'The option restores the service sooner and provides an additional way to respond to disruption.')
    :recoveryState==='better'&&targetState==='worse'
      ?(es?'Aunque la recuperación media es más rápida, se reduce la probabilidad de llegar a tiempo. Hay que revisar ese riesgo antes de elegirla.':
        'Average recovery is faster, but the chance of meeting the deadline falls. Review that risk before choosing the option.')
      :recoveryState==='worse'
        ?(es?'La alternativa tarda más en recuperar el servicio. No mejora la rapidez de respuesta en esta comparación.':
          'The option takes longer to restore the service. It does not improve response speed in this comparison.')
        :targetState==='better'
          ?(es?'La opción aumenta la probabilidad de llegar a tiempo, aunque no reduce el tiempo medio de recuperación.':
            'The option improves the chance of meeting the deadline, although average recovery time does not fall.')
          :(es?'No se observa una mejora clara en la recuperación frente a la opción actual.':
            'There is no clear recovery improvement over the baseline.');
  const costText=cost
    ?(es
      ?costState==='better'
        ?` También reduce el coste esperado en ${n(Math.abs(cost.delta!),locale,0)} €.`
        :costState==='worse'
          ?` Su coste esperado es ${n(Math.abs(cost.delta!),locale,0)} € mayor.`
          :' Su coste esperado es el mismo.'
      :costState==='better'
        ?` It also lowers expected cost by €${n(Math.abs(cost.delta!),locale,0)}.`
        :costState==='worse'
          ?` Its expected cost is €${n(Math.abs(cost.delta!),locale,0)} higher.`
          :' Expected cost is unchanged.')
    :'';
  if(audience==='defenceCustomer'){
    const value=(!data.id.startsWith('SYNTH-'))
      ?(es?'Esta comparación muestra qué alternativa ayuda a recuperar antes el servicio que has definido.':
        'This comparison shows which option can restore the service you defined sooner.')
      :data.kind==='ecodesign'
        ?c.option.id==='option-b'
          ?(es?'Combinar reparación con otro proveedor ofrece dos vías para recuperar el componente ante problemas de suministro.':
            'Combining repair and another supplier gives two ways to restore the component when supply is disrupted.')
          :(es?'Contar con una vía de reparación, además de poder sustituir la pieza, ofrece más opciones para recuperar el componente ante un problema de suministro.':
            'Having a repair route as well as replacement offers another way to recover the component when supply is disrupted.')
      :data.kind==='climate'
        ?(es?'Esto permite valorar qué medida ayuda a restablecer antes las operaciones de apoyo durante episodios de calor extremo.':
          'This shows which option can restore support operations sooner during extreme heat.')
        :data.kind==='saf'
          ?(es?'Así podemos comparar qué alternativa recupera antes el abastecimiento necesario para la misión.':
            'This lets us compare which option restores the required fuel supply sooner.')
          :data.kind==='wildfire'
            ?(es?'Así identificamos qué opción restablece antes la información y la coordinación necesarias durante la emergencia.':
              'This identifies which option restores information and coordination sooner during the emergency.')
            :(es?'Esto ayuda a elegir la opción que permite recuperar el servicio con menos interrupciones.':
              'This helps identify the option that restores the service with less disruption.');
    if(recoveryState==='better'&&targetState!=='worse')return measureText+' '+value;
    return measureText+' '+effect;
  }
  if(audience==='engineering'){
    const checks={
      ecodesign:es?'ensayos de reparación, requisitos funcionales, seguridad y autorización del cambio':
        'repair tests, functional requirements, safety and change approval',
      climate:es?'ensayos térmicos y límites de funcionamiento de los equipos':
        'thermal tests and equipment operating limits',
      saf:es?'compatibilidad del combustible, calidad, trazabilidad y autorizaciones de uso':
        'fuel compatibility, quality, traceability and operating approvals',
      wildfire:es?'tiempos de alerta, fiabilidad de la información y comunicaciones de respaldo':
        'alert times, information reliability and backup communications',
      general:es?'requisitos técnicos, ensayos y criterios de aceptación del caso':
        'technical requirements, testing and acceptance criteria for the case'
    }[data.kind];
    return es
      ?`Ingeniería debe comprobar ${checks}. ${measureText} Así sabremos si la mejora calculada puede aplicarse sin comprometer el funcionamiento del sistema.`
      :`Engineering needs to check ${checks}. ${measureText} This will show whether the modelled improvement can be used without compromising system operation.`;
  }
  if(audience==='programmeManager'){
    const decision=recoveryState==='better'&&costState==='better'
      ?(es?'La alternativa ofrece una recuperación más rápida y un menor coste esperado; merece la pena evaluarla como opción de programa.':
        'The option offers faster recovery at a lower expected cost; it merits consideration by the programme.')
      :recoveryState==='better'&&costState==='worse'
        ?(es?'La alternativa permite recuperar antes, pero cuesta más. Programa debe valorar si el tiempo ganado justifica ese sobrecoste.':
          'The option restores service sooner but costs more. Programme Management must assess whether the time saved justifies the premium.')
        :recoveryState==='worse'&&costState==='better'
          ?(es?'La alternativa reduce costes, pero retrasa la recuperación. Hay que comprobar si el programa puede asumirlo.':
            'The option costs less but takes longer to restore service. The programme must decide if that delay is acceptable.')
          :(es?'No se observa una ventaja clara en plazo y coste a la vez. Conviene comparar también la otra alternativa.':
            'There is no clear advantage in both timing and cost. The other option should also be compared.');
    return measureText+costText+' '+decision;
  }
  const investment=recoveryState==='better'&&costState!=='worse'
    ?(es?'La opción merece un estudio prioritario porque mejora la recuperación sin aumentar el coste esperado.':
      'This option merits priority assessment because it improves recovery without increasing expected cost.')
    :recoveryState==='better'&&costState==='worse'
      ?(es?'La opción mejora la recuperación, pero requiere justificar el coste adicional antes de invertir.':
        'The option improves recovery, but its additional cost needs justification before investment.')
      :recoveryState==='worse'
        ?(es?'Esta opción no mejora la velocidad de recuperación; conviene revisar la otra alternativa antes de invertir.':
          'This option does not improve recovery speed; review the other alternative before investing.')
        :(es?'La comparación todavía no muestra una ventaja suficiente para priorizar esta inversión.':
          'The comparison does not yet show enough benefit to prioritise this investment.');
  return measureText+costText+' '+investment;
}

export function strategicNarrativeText(data:StrategicCase,c:OptionComparison,audience:Audience,locale:Locale):string{
  const x=strategicMessage(data,c,audience,locale);
  return [x.headline,x.operationalMeaning,x.quantifiedFinding,x.sustainabilityLink,x.decisionQuestion, (locale==='es'?'Respuesta del análisis: ':'Model-based answer: ')+strategicDecisionAnswer(data,c,audience,locale)].join('\n\n');
}
