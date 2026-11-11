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

export function fromPreset(kind: PresetKey): StrategicCase {
  const p=PRESETS[kind];
  const result=createCase(kind);
  result.id='SYNTH-'+kind.toUpperCase();
  result.title=p.title;result.programme=p.programme;
  result.decision=p.decision;result.initiative=p.initiative;
  result.vulnerability=p.vulnerability;result.mechanism=p.mechanism;
  result.boundary=p.boundary;result.timeHorizon=p.timeHorizon;
  result.hypothetical=true;
  result.options=result.options.map((o,i)=>({
    ...o,name:p.names[i],explanation:p.explanations[i],
    measures:Object.fromEntries(result.metrics.map((m,j)=>[m.id,{value:p.values[i][j],evidenceId:''}]))
  }));
  // We intentionally provide NO 'reviewed' documents, gates or false source links.
  return result;
}
