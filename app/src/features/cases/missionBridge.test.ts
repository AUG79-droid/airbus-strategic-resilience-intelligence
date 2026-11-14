import { describe, expect, it } from 'vitest';
import { assessMissionBridge, validateMissionBridges, type MissionBridge } from './missionBridge';
import { createCase, validateCaseImport } from './model';
const sample:MissionBridge={
  optionId:'option-a',componentOrService:'component C',subsystem:'support system S',
  platform:'asset P',missionFunction:'mission M',dependencyType:'critical',
  observedMissionAvailabilityPercent:83,availabilityDefinition:'available mission time / planned mission time',observationPeriod:'2026-Q3',evidenceId:'REAL-MISSION'
};
describe('No automatic aircraft or mission readiness inference',()=>{
 it('never turns component recovery into demonstrated mission availability',()=>{
  expect(assessMissionBridge().status).toBe('unmapped');
  const withoutData=assessMissionBridge({...sample,observedMissionAvailabilityPercent:null},['REAL-MISSION']);
  expect(withoutData.status).toBe('hypothesis');
  expect(withoutData.availabilityPercent).toBeNull();
  expect(assessMissionBridge(sample,[]).status).toBe('hypothesis');
  expect(assessMissionBridge({...sample,availabilityDefinition:''},['REAL-MISSION']).status).toBe('hypothesis');
  expect(assessMissionBridge({...sample,observationPeriod:''},['REAL-MISSION']).status).toBe('hypothesis');
  const declared=assessMissionBridge(sample,['REAL-MISSION']);
  expect(declared.status).toBe('userDeclaredObservation');
  expect(declared.availabilityPercent).toBe(83);
  expect(declared.issues.join(' ')).toMatch(/not independently verified/i);
 });
 it('rejects impossible availability, duplicate bridge entries and unknown assets',()=>{
  const c=createCase();
  c.missionBridges=[sample,{...sample,observedMissionAvailabilityPercent:100}];
  expect(()=>validateCaseImport(c)).toThrow(/Invalid mission/);
  c.missionBridges=[{...sample,observedMissionAvailabilityPercent:101}];
  expect(()=>validateCaseImport(c)).toThrow(/Invalid mission/);
  expect(()=>validateMissionBridges([{...sample,optionId:'other'}],['option-a'])).toThrow();
 });
 it('imports pre-v2 files without any mission-availability claim',()=>{
  const c=createCase();delete (c as unknown as {missionBridges?:unknown}).missionBridges;
  expect(validateCaseImport(c).missionBridges).toEqual([]);
 });
});
