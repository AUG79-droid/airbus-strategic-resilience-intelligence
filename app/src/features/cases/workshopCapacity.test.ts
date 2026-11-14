import {describe,expect,it} from 'vitest';
import {evaluateWorkshopCapacity,validateWorkshopCapacity,type WorkshopCapacityScenario} from './workshopCapacity';
import {createCase,validateCaseImport} from './model';
const plan:WorkshopCapacityScenario={
  optionId:'option-a',availableBays:2,jobsAhead:3,
  serviceTimePerBacklogJob:4,targetServiceTime:2,evidenceId:''
};
describe('Repair capacity: deterministic FIFO planning only',()=>{
  it('calculates target waiting and completion with shared constrained bays',()=>{
    const result=evaluateWorkshopCapacity(plan);
    expect(result.status).toBe('calculated');
    expect(result.waitingTime).toBe(4);
    expect(result.completionTime).toBe(6);
    expect(result.throughputPerTimeUnit).toBe(.5);
    expect(evaluateWorkshopCapacity({...plan,jobsAhead:4}).completionTime).toBe(10);
    expect(evaluateWorkshopCapacity({...plan,jobsAhead:0}).waitingTime).toBe(0);
    expect(result.assumptions.join(' ')).toMatch(/NOT a calibrated queue/);
    expect(result.assumptions.join(' ')).toMatch(/Do NOT add/);
  });
  it('does not treat missing capacity as zero backlog or inferred availability',()=>{
    const result=evaluateWorkshopCapacity();
    expect(result.status).toBe('notAssessed');
    expect(result.waitingTime).toBeNull();
    expect(result.completionTime).toBeNull();
  });
  it('validates unique scenario IDs and rejects impossible bay and backlog inputs',()=>{
    expect(validateWorkshopCapacity([plan],['baseline','option-a'])).toHaveLength(1);
    expect(()=>validateWorkshopCapacity([plan,plan],['baseline','option-a'])).toThrow();
    expect(()=>validateWorkshopCapacity([{...plan,availableBays:0}],['option-a'])).toThrow();
    expect(()=>validateWorkshopCapacity([{...plan,jobsAhead:-1}],['option-a'])).toThrow();
    expect(()=>validateWorkshopCapacity([{...plan,jobsAhead:1.5}],['option-a'])).toThrow();
    expect(()=>validateWorkshopCapacity([{...plan,targetServiceTime:0}],['option-a'])).toThrow();
  });
  it('preserves optional scenarios across case JSON migration without calculating fleet availability',()=>{
    const c=createCase('ecodesign');
    c.workshopCapacity=[plan];
    const imported=validateCaseImport(c);
    expect(imported.workshopCapacity).toEqual([plan]);
    delete (c as unknown as {workshopCapacity?:unknown}).workshopCapacity;
    expect(validateCaseImport(c).workshopCapacity).toEqual([]);
  });
});
