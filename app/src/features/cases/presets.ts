import { createCase, type CaseKind, type StrategicCase } from './model';

export type PresetKey = Exclude<CaseKind,'general'>;

interface Preset {
  title:string; programme:string; decision:string; initiative:string;
  vulnerability:string; mechanism:string; boundary:string; timeHorizon:string;
  names:[string,string,string];
  explanations:[string,string,string];
  // Every number is deliberately fictional: not Airbus, supplier, programme or customer data.
  values:[number[],number[],number[]];
}
export const PRESETS: Record<PresetKey,Preset> = {
  ecodesign:{
    title:'Eurodrone · Eco-design and critical material dependencies',
    programme:'Hypothetical Eurodrone support subsystem — no programme data',
    decision:'Could a qualified repair and multiple sourcing strategy reduce vulnerability in long-term support?',
    initiative:'Evaluate repairability, traceable material options and qualified alternative sourcing for ONE support component.',
    vulnerability:'Long replenishment time and dependence on scarce, concentrated supply sources.',
    mechanism:'A qualified repair or alternate supply pathway could avoid some new material and shorten replacement delays.',
    boundary:'Same fictional component, same functional requirement and support horizon. Any design change must pass programme controls.',
    timeHorizon:'Illustrative 12-month support period',
    names:['Conventional replacement','Qualified repair option','Repair plus alternate supplier'],
    explanations:['Single-source new component only','Use authorised repair where feasible','Combine repair capability with an additional qualified supply route'],
    values:[[110,1,18,195000],[78,1,12,175000],[64,2,14,210000]]
  },
  climate:{
    title:'Product climate adaptation · Extreme-heat scenario',
    programme:'Hypothetical aircraft ground-support activity',
    decision:'Which adaptation better preserves a defined support activity during an extreme-heat event?',
    initiative:'Evaluate equipment hardening, revised maintenance and protective infrastructure under a fixed heat scenario.',
    vulnerability:'Weather-related disruption and slower restoration of the same service.',
    mechanism:'Tested mitigations may preserve service hours and reduce recovery time; added material and investment have trade-offs.',
    boundary:'Same fictional 10-day heat event, base, mission profile and scope. No fleet-wide availability inference.',
    timeHorizon:'One defined 10-day event',
    names:['Current configuration','Equipment hardening','Hardening plus operating changes'],
    explanations:['Existing operational restrictions','Thermal protection for critical equipment','Thermal protection and revised support practices'],
    values:[[68,30,0,0],[83,18,550,175000],[89,12,850,270000]]
  },
  saf:{
    title:'SAF · Fuel-supply resilience for an equivalent mission',
    programme:'Hypothetical military aviation base and mission — no fleet approval inferred',
    decision:'Could an authorised SAF supply route reduce lifecycle impact while preserving fuel availability?',
    initiative:'Assess authorised fuel blends, contracts, traceability and a fallback supply route before deployment.',
    vulnerability:'Limited suppliers, uncertain availability, incremental costs and platform-specific approvals.',
    mechanism:'A documented low-carbon fuel pathway might lower lifecycle emissions; diversified supply could improve access if approved.',
    boundary:'Same fictional mission energy demand and boundaries; values do not indicate SAF certification or military fuel availability.',
    timeHorizon:'One equivalent mission and annual supply planning',
    names:['Current fuel contract','SAF from one supplier','SAF plus contingency supply'],
    explanations:['Current approved fuel under a single supply arrangement','Hypothetical SAF route requiring platform approval','Hypothetical SAF route with independently contracted fallback'],
    values:[[92,1,10000,32000],[75,1,6500,42000],[96,2,7100,48500]]
  },
  wildfire:{
    title:'Wildfires · Connected detection and emergency response',
    programme:'Hypothetical multi-agency fire-response exercise',
    decision:'Can integrated satellite/airborne intelligence improve actionable alert time without weakening communications?',
    initiative:'Compare existing reporting with an integrated satellite, drone and incident-command information flow.',
    vulnerability:'Delayed alerts, fragmented information, unreliable communications and false positives.',
    mechanism:'Faster validated information sharing may reduce alert latency; false alarms and cost need explicit measurement.',
    boundary:'Same fictional exercise area, fire events and emergency teams. No claims on hectares saved or casualty reduction.',
    timeHorizon:'One controlled operational exercise',
    names:['Existing coordination','Integrated observation feeds','Integration plus resilient communications'],
    explanations:['Conventional monitoring and radio reporting','Joint satellite / airborne observation flow','Joint observation with redundancy of critical communications'],
    values:[[40,82,15,35000],[19,84,10,85000],[15,97,8,120000]]
  }
};


// Localised case briefs: all values remain invented in both languages.
const ES_PRESETS: Record<PresetKey,Omit<Preset,'values'>> = {
  ecodesign:{
    title:'Eurodrone · Ecodiseño y dependencia de materiales críticos',
    programme:'Subsistema hipotético de soporte de Eurodrone — sin datos del programa',
    decision:'¿Podría una reparación cualificada y la diversificación de suministro reducir vulnerabilidades del soporte a largo plazo?',
    initiative:'Evaluar reparabilidad, alternativas de materiales trazables y abastecimiento cualificado de un único componente de soporte.',
    vulnerability:'Plazos prolongados de reposición y dependencia de fuentes de suministro concentradas.',
    mechanism:'Una reparación aprobada o un proveedor alternativo podría reducir reposiciones y necesidades de material nuevo.',
    boundary:'Mismo componente ficticio, función equivalente y horizonte de soporte. Cualquier cambio requiere control formal del programa.',
    timeHorizon:'Periodo hipotético de soporte de 12 meses',
    names:['Sustitución convencional','Reparación cualificada','Reparación y proveedor alternativo'],
    explanations:['Componente nuevo con una única fuente','Reparación autorizada cuando resulte viable','Reparación más una fuente de suministro adicional cualificada']
  },
  climate:{
    title:'Adaptación climática · Escenario de calor extremo',
    programme:'Actividad hipotética de soporte de aeronaves en tierra',
    decision:'¿Qué medida protege mejor la actividad de soporte durante un episodio de calor extremo?',
    initiative:'Evaluar protección térmica de equipos, mantenimiento adaptado e infraestructura de apoyo bajo el mismo episodio.',
    vulnerability:'Interrupciones por meteorología extrema y recuperación lenta del servicio.',
    mechanism:'Las medidas probadas podrían conservar horas de servicio y acelerar la recuperación, con costes y consumo de materiales adicionales.',
    boundary:'Mismo episodio ficticio de calor de 10 días, base y perfil de misión. No extrapolar a disponibilidad de flota.',
    timeHorizon:'Un episodio de 10 días',
    names:['Configuración actual','Protección térmica del equipo','Protección y cambios operativos'],
    explanations:['Restricciones operativas existentes','Protección térmica de equipamiento crítico','Protección térmica y procedimientos de soporte adaptados']
  },
  saf:{
    title:'SAF · Resiliencia de abastecimiento para una misión equivalente',
    programme:'Base y misión militar hipotéticas — sin asumir aprobación de la flota',
    decision:'¿Puede una vía autorizada de SAF reducir el impacto de ciclo de vida sin comprometer la disponibilidad de combustible?',
    initiative:'Evaluar mezclas autorizadas, contratos, trazabilidad y suministro de contingencia antes de desplegar.',
    vulnerability:'Proveedores limitados, disponibilidad incierta, costes adicionales y autorizaciones específicas por plataforma.',
    mechanism:'Una vía de combustible de menor huella podría reducir emisiones; la diversificación podría mejorar acceso si está autorizada.',
    boundary:'Misma demanda energética y alcance ficticios por misión; las cifras no indican certificación ni disponibilidad militar real.',
    timeHorizon:'Una misión equivalente y planificación anual de suministro',
    names:['Contrato de combustible actual','SAF de un solo proveedor','SAF y suministro alternativo'],
    explanations:['Combustible autorizado actual con una única fuente','SAF hipotético sujeto a aprobación de plataforma','SAF hipotético con respaldo contratado de modo independiente']
  },
  wildfire:{
    title:'Incendios forestales · Detección y respuesta conectada',
    programme:'Ejercicio hipotético de emergencias con múltiples organismos',
    decision:'¿Puede la integración de datos aéreos y satelitales acelerar alertas útiles sin debilitar las comunicaciones?',
    initiative:'Comparar avisos actuales con observación integrada por satélite, dron y centro de mando.',
    vulnerability:'Avisos tardíos, información fragmentada, interrupciones de comunicaciones y falsos positivos.',
    mechanism:'El intercambio de información validada podría reducir latencia, siempre que se controlen falsas alarmas y costes.',
    boundary:'Misma zona ficticia, incidencias y equipos. No atribuir hectáreas salvadas ni reducción de víctimas.',
    timeHorizon:'Un ejercicio operacional controlado',
    names:['Coordinación actual','Observación integrada','Integración y comunicaciones redundantes'],
    explanations:['Vigilancia y comunicación convencional por radio','Intercambio conjunto de información aérea y satelital','Observación conjunta con redundancia de comunicaciones']
  }
};
export function presetTitle(kind:PresetKey,locale:'es'|'en'):string {
  return locale==='es'?ES_PRESETS[kind].title:PRESETS[kind].title;
}


/**
 * Synthetic inputs for the shared advanced simulator. All four example families
 * have the exact same parameter catalogue. Not-applicable controls remain null.
 * No value is a programme/supplier observation or empirical calibration.
 */
const EXAMPLE_CONTROLS:Record<PresetKey,Record<string,[number,number,number]>>={
  ecodesign:{
    baseRecovery:[100,65,50],supplyLead:[110,78,64],recoveryTarget:[100,100,100],
    technicalSuccess:[75,90,95],failureDelay:[35,28,23],
    shockProbability:[45,28,20],shockDelay:[50,40,20],
    baseCost:[195000,175000,210000],logisticsCost:[5000,6000,7000],
    shockSurcharge:[20000,15000,12000],failureCost:[25000,12000,8000],
    cancellationProbability:[15,20,10],cancellationFee:[15000,9000,10000],
    materialKg:[18,12,14],wasteKg:[8,3,4],ghgKg:[200,145,170],lifeExtension:[0,500,600]
  },
  climate:{
    baseRecovery:[30,18,12],recoveryTarget:[24,24,24],
    technicalSuccess:[75,85,93],failureDelay:[15,12,8],
    shockProbability:[50,38,27],shockDelay:[16,12,8],
    baseCost:[45000,65000,70000],logisticsCost:[4000,5000,5000],
    investmentCost:[0,100000,200000],shockSurcharge:[20000,15000,12000],
    materialKg:[0,550,850],ghgKg:[1200,1500,2100]
  },
  saf:{
    baseRecovery:[15,12,10],supplyLead:[20,18,14],recoveryTarget:[15,15,15],
    technicalSuccess:[95,80,90],failureDelay:[10,12,8],
    shockProbability:[30,35,20],shockDelay:[15,15,12],
    baseCost:[32000,42000,48500],logisticsCost:[2000,3000,4000],
    investmentCost:[0,6000,10000],shockSurcharge:[5000,9000,7000],
    reservationFee:[0,1000,1500],cancellationProbability:[10,25,15],
    cancellationFee:[2000,4000,3000],ghgKg:[10000,6500,7100]
  },
  wildfire:{
    baseRecovery:[40,19,15],recoveryTarget:[30,30,30],
    technicalSuccess:[85,90,96],failureDelay:[20,15,12],
    shockProbability:[25,20,12],shockDelay:[20,18,12],
    baseCost:[35000,85000,120000],logisticsCost:[3000,7000,10000],
    investmentCost:[0,20000,35000],shockSurcharge:[10000,12000,8000],
    ghgKg:[5000,7000,9000]
  }
};

export function fromPreset(kind: PresetKey, locale:'es'|'en'='en'): StrategicCase {
  const p:Preset=locale==='es'?{...ES_PRESETS[kind],values:PRESETS[kind].values}:PRESETS[kind];
  const result=createCase(kind,locale);
  result.id='SYNTH-'+kind.toUpperCase();
  result.title=p.title;result.programme=p.programme;
  result.decision=p.decision;result.initiative=p.initiative;
  result.vulnerability=p.vulnerability;result.mechanism=p.mechanism;
  result.boundary=p.boundary;result.timeHorizon=p.timeHorizon;
  result.hypothetical=true;
  result.options=result.options.map((o,i)=>({
    ...o,name:p.names[i],explanation:p.explanations[i],
    measures:Object.fromEntries(result.metrics.map((m,j)=>[m.id,{value:p.values[i][j],evidenceId:''}])),
    parameterValues:Object.fromEntries(Object.keys(o.parameterValues).map(id=>[id,{
      value:result.parameters[id].applicability==='applies'?(EXAMPLE_CONTROLS[kind][id]?.[i]??null):null,
      evidenceId:''
    }]))
  }));
  // We intentionally provide NO 'reviewed' documents, gates or false source links.
  return result;
}
