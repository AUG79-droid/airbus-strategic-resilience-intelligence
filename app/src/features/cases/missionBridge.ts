/**
 * Explicit claim boundary between component/service recovery and mission
 * readiness. A repair-time change never implies fleet availability.
 * The optional mapping and mission metric are DECLARED, not inferred.
 */
export interface MissionBridge {
  optionId:string;
  componentOrService:string;
  subsystem:string;
  platform:string;
  missionFunction:string;
  dependencyType:'critical'|'redundant'|'unknown';
  observedMissionAvailabilityPercent:number|null;
  evidenceId:string;
}
export interface MissionBridgeAssessment {
  status:'unmapped'|'hypothesis'|'userDeclaredObservation';
  issues:string[];
  availabilityPercent:number|null;
}
export function assessMissionBridge(
  input?:MissionBridge,acceptedObservedEvidenceIds:string[]=[]
):MissionBridgeAssessment{
  if(!input)return {status:'unmapped',issues:['No documented component-to-mission relationship'],availabilityPercent:null};
  const named=[input.componentOrService,input.subsystem,input.platform,input.missionFunction].every(x=>x.trim());
  if(!named||input.dependencyType==='unknown')
    return {status:'hypothesis',issues:['Component, subsystem, platform, mission function and dependency type must be defined'],availabilityPercent:null};
  if(input.observedMissionAvailabilityPercent===null)
    return {status:'hypothesis',issues:['No observed mission availability; cannot infer it from restoration time'],availabilityPercent:null};
  if(!input.evidenceId||!acceptedObservedEvidenceIds.includes(input.evidenceId))
    return {status:'hypothesis',issues:['Mission availability not linked to a user-declared reviewed observed record'],availabilityPercent:null};
  return {status:'userDeclaredObservation',
    issues:['Evidence and approval are user-declared, NOT independently verified or approved by Airbus. No causal link is demonstrated.'],
    availabilityPercent:input.observedMissionAvailabilityPercent};
}
export function validateMissionBridges(value:unknown,optionIds:string[]):MissionBridge[]{
  if(value===undefined)return [];
  if(!Array.isArray(value)||value.length>optionIds.length)throw new Error('Invalid mission relationship register');
  const seen=new Set<string>();
  const fields=['componentOrService','subsystem','platform','missionFunction','evidenceId'] as const;
  return value.map(item=>{
    if(!item||typeof item!=='object')throw new Error('Invalid mission link');
    const x=item as Partial<MissionBridge>;
    if(typeof x.optionId!=='string'||!optionIds.includes(x.optionId)||seen.has(x.optionId)||
      fields.some(k=>typeof x[k]!=='string'||(x[k] as string).length>500)||
      !['critical','redundant','unknown'].includes(String(x.dependencyType))||
      x.observedMissionAvailabilityPercent!==null&&(
        typeof x.observedMissionAvailabilityPercent!=='number'||
        !Number.isFinite(x.observedMissionAvailabilityPercent)||
        x.observedMissionAvailabilityPercent<0||x.observedMissionAvailabilityPercent>100
      ))throw new Error('Invalid mission link');
    seen.add(x.optionId);
    return x as MissionBridge;
  });
}
