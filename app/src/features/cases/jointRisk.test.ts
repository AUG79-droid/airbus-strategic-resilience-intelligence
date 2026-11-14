import { describe, expect, it } from 'vitest';
import { calculateUniversal, jointRiskBranches } from './universal';
import { buildRiskTable } from '../../domain/model/probability';
import { createCase, validateCaseImport } from './model';
import { fromPreset } from './presets';

describe('ASRI v2 joint-risk probability', () => {
  it('recovers the independent case when the overlap parameter is excluded', () => {
    const branches=jointRiskBranches(50,50);
    expect(branches.map(x=>x.probability)).toEqual([.25,.25,.25,.25]);
    expect(branches.reduce((sum,x)=>sum+x.probability,0)).toBeCloseTo(1);
  });

  it('represents positively correlated and mutually exclusive hazards', () => {
    const correlated=jointRiskBranches(50,50,50);
    expect(correlated.map(x=>x.probability)).toEqual([.5,0,0,.5]);
    const exclusive=jointRiskBranches(50,50,0);
    expect(exclusive.map(x=>x.probability)).toEqual([0,.5,.5,0]);
  });

  it('shares probability semantics with DEMO-60 for independent and dependent risks',()=>{
    for(const pSuccess of [20,50,90])for(const pShock of [10,60,95]){
      const independence=jointRiskBranches(pSuccess,pShock);
      const common=buildRiskTable({
        repairFeasibilityProbability:pSuccess/100,
        supplierShockProbability:pShock/100,
        dependence:{mode:'independent'}
      });
      for(const branch of independence){
        const matched=common.states.find(x=>x.repairFeasible===branch.technicalSuccess&&x.supplierShock===branch.shock);
        expect(branch.probability).toBeCloseTo(matched!.probability);
      }
      const jointFailure=Math.min(100-pSuccess,pShock)/2;
      const minOverlap=Math.max(0,pShock-pSuccess);
      const pJoint=Math.max(jointFailure,minOverlap);
      const dependent=jointRiskBranches(pSuccess,pShock,pJoint);
      const expected=buildRiskTable({
        repairFeasibilityProbability:pSuccess/100,
        supplierShockProbability:pShock/100,
        dependence:{mode:'joint',repairFeasibleAndShockProbability:(pShock-pJoint)/100}
      });
      for(const branch of dependent){
        const matched=expected.states.find(x=>x.repairFeasible===branch.technicalSuccess&&x.supplierShock===branch.shock);
        expect(branch.probability).toBeCloseTo(matched!.probability);
      }
    }
  });
  it('rejects impossible joint probabilities under Fréchet limits', () => {
    expect(()=>jointRiskBranches(50,50,51)).toThrow(/Fréchet/);
    expect(()=>jointRiskBranches(10,70,0)).toThrow(/Fréchet/);
    expect(()=>jointRiskBranches(50,50,-1)).toThrow(/between/);
    expect(()=>jointRiskBranches(50,50,101)).toThrow(/between/);
  });

  it('recalculates deadline likelihood from joint events without inventing improved average recovery', () => {
    const c=createCase('general');
    c.parameters.technicalSuccess={applicability:'applies',reason:''};
    c.parameters.failureDelay={applicability:'applies',reason:''};
    const opt=c.options[1];
    for(const [id,value] of Object.entries({
      baseRecovery:10,recoveryTarget:15,technicalSuccess:50,failureDelay:10,
      shockProbability:50,shockDelay:10
    })) opt.parameterValues[id]={value,evidenceId:''};

    const independent=calculateUniversal(c,opt);
    expect(independent.deadline.state).toBe('calculated');
    expect(independent.deadline.value).toBeCloseTo(25);
    expect(independent.recovery.value).toBeCloseTo(20);

    c.parameters.jointFailureShock={applicability:'applies',reason:''};
    opt.parameterValues.jointFailureShock={value:50,evidenceId:''};
    const correlated=calculateUniversal(c,opt);
    expect(correlated.deadline.value).toBeCloseTo(50);
    expect(correlated.recovery.value).toBeCloseTo(20);

    opt.parameterValues.jointFailureShock.value=0;
    const exclusive=calculateUniversal(c,opt);
    expect(exclusive.deadline.value).toBeCloseTo(0);

    opt.parameterValues.jointFailureShock.value=60;
    const impossible=calculateUniversal(c,opt);
    expect(impossible.deadline.state).toBe('invalid');
    expect(impossible.recovery.state).toBe('invalid');
    opt.parameterValues.baseCost={value:100,evidenceId:''};
    opt.parameterValues.logisticsCost={value:20,evidenceId:''};
    expect(calculateUniversal(c,opt).cost.state).toBe('invalid');
    opt.parameterValues.jointFailureShock.value=50;
    expect(calculateUniversal(c,opt).recovery.state).toBe('calculated');
    expect(calculateUniversal(c,opt).cost.state).toBe('calculated');
  });

  it('upgrades older JSON without the joint-risk field while retaining values', () => {
    const old=fromPreset('saf','es');
    delete old.parameters.jointFailureShock;
    for(const option of old.options)delete option.parameterValues.jointFailureShock;
    const imported=validateCaseImport(JSON.parse(JSON.stringify(old)));
    expect(imported.parameters.jointFailureShock.applicability).toBe('notApplicable');
    expect(imported.options.every(option=>option.parameterValues.jointFailureShock.value===null)).toBe(true);
    expect(calculateUniversal(imported,imported.options[0]).deadline.state).toBe('calculated');
  });
});
