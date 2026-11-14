import {describe,expect,it} from 'vitest';
import {calculateUniversal} from './universal';
import {createCase,validateCaseImport} from './model';

describe('Concurrent risk effects beyond additive failure penalties',()=>{
  const setup=()=>{
    const c=createCase('general');
    for(const id of ['technicalSuccess','failureDelay','jointFailureShock','jointExtraDelay','jointExtraCost']){
      c.parameters[id]={applicability:'applies',reason:'simulated dependency'};
    }
    const o=c.options[1];
    for(const [id,value] of Object.entries({
      baseRecovery:10,recoveryTarget:30,technicalSuccess:50,failureDelay:10,
      shockProbability:50,shockDelay:10,jointFailureShock:50,jointExtraDelay:20,
      baseCost:100,logisticsCost:0,jointExtraCost:200
    }))o.parameterValues[id]={value,evidenceId:''};
    return {c,o};
  };
  it('models extra joint delay in expected recovery and all-branch deadline probability',()=>{
    const {c,o}=setup();
    const withExtra=calculateUniversal(c,o);
    expect(withExtra.recovery.value).toBeCloseTo(30);
    expect(withExtra.deadline.value).toBeCloseTo(50);
    c.parameters.jointExtraDelay={applicability:'notApplicable',reason:'no excess delay'};
    const withoutExtra=calculateUniversal(c,o);
    expect(withoutExtra.recovery.value).toBeCloseTo(20);
    expect(withoutExtra.deadline.value).toBeCloseTo(100);
  });
  it('adds only explicitly modelled incremental concurrent-event cost',()=>{
    const {c,o}=setup();
    expect(calculateUniversal(c,o).cost.value).toBeCloseTo(200);
    c.parameters.jointExtraCost={applicability:'notApplicable',reason:'not separately costed'};
    expect(calculateUniversal(c,o).cost.value).toBeCloseTo(100);
  });
  it('rejects a joint penalty without specifying a joint event',()=>{
    const {c,o}=setup();
    c.parameters.jointFailureShock={applicability:'notApplicable',reason:'not estimated'};
    expect(calculateUniversal(c,o).recovery.state).toBe('invalid');
    expect(calculateUniversal(c,o).cost.state).toBe('invalid');
  });
  it('migrates original records with no joint impact fields without changing outcomes',()=>{
    const {c,o}=setup();
    c.parameters.jointExtraDelay={applicability:'notApplicable',reason:'legacy excluded'};
    c.parameters.jointExtraCost={applicability:'notApplicable',reason:'legacy excluded'};
    const baseline=calculateUniversal(c,o);
    delete c.parameters.jointExtraDelay;delete c.parameters.jointExtraCost;
    for(const alt of c.options){
      delete alt.parameterValues.jointExtraDelay;delete alt.parameterValues.jointExtraCost;
    }
    const upgraded=validateCaseImport(c);
    expect(upgraded.parameters.jointExtraDelay.applicability).toBe('notApplicable');
    expect(upgraded.parameters.jointExtraCost.applicability).toBe('notApplicable');
    expect(calculateUniversal(upgraded,upgraded.options[1]).recovery.value).toBeCloseTo(baseline.recovery.value!);
    expect(calculateUniversal(upgraded,upgraded.options[1]).cost.value).toBeCloseTo(baseline.cost.value!);
  });
});
