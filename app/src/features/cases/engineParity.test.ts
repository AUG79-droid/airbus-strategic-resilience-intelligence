import {describe,expect,it} from 'vitest';
import {aggregateTimingMoments} from '../../domain/model/timingMoments';
import {evaluateScenario} from '../../domain/model/engine';
import {fictionalScenario} from '../../domain/__tests__/fixtures';
import {createCase} from './model';
import {calculateUniversal} from './universal';

describe('Cross-engine timing parity under explicitly equivalent assumptions',()=>{
  it('uses the same normalized four-risk-state moment aggregator',()=>{
    const m=aggregateTimingMoments([
      {probability:.25,completionTime:5,targetMet:true},
      {probability:.75,completionTime:15,targetMet:false}
    ]);
    expect(m.meanCompletionTime).toBeCloseTo(12.5);
    expect(m.probabilityTargetMet).toBeCloseTo(.25);
    expect(()=>aggregateTimingMoments([{probability:.5,completionTime:10}])).toThrow();
    expect(()=>aggregateTimingMoments([{probability:1,completionTime:-1}])).toThrow();
  });
  it('matches DEMO-60 replacement when both models have the same shock and lead assumptions',()=>{
    const demo=fictionalScenario();
    const expected=evaluateScenario(demo).strategies.new;
    const c=createCase('general');
    const option=c.options[0];
    for(const [id,value] of Object.entries({
      baseRecovery:demo.timing.newLeadDays,
      recoveryTarget:demo.timing.targetRecoveryDays,
      shockProbability:demo.risks.supplierShockProbability*100,
      shockDelay:demo.timing.supplierShockDelayDays
    }))option.parameterValues[id]={value,evidenceId:''};
    const actual=calculateUniversal(c,option);
    expect(actual.recovery.value).toBeCloseTo(expected.expectedRecoveryDays);
    expect(actual.deadline.value).toBeCloseTo(expected.probabilityTargetMet*100);
  });
  it('matches repair-first when no external shock acts and conditional recovery times are aligned',()=>{
    const demo=fictionalScenario();
    demo.risks.supplierShockProbability=0;
    const expected=evaluateScenario(demo).strategies.repairFirst;
    const c=createCase('general');
    c.parameters.technicalSuccess={applicability:'applies',reason:'Equivalent conditional feasibility'};
    c.parameters.failureDelay={applicability:'applies',reason:'Fallback lead time after inspection'};
    const o=c.options[1];
    for(const [id,value] of Object.entries({
      baseRecovery:demo.timing.inspectionDays+demo.timing.repairExecutionDays,
      recoveryTarget:demo.timing.targetRecoveryDays,
      technicalSuccess:demo.risks.repairFeasibilityProbability*100,
      failureDelay:demo.timing.newLeadDays-demo.timing.repairExecutionDays,
      shockProbability:0,shockDelay:demo.timing.supplierShockDelayDays
    }))o.parameterValues[id]={value,evidenceId:''};
    const actual=calculateUniversal(c,o);
    expect(actual.recovery.value).toBeCloseTo(expected.expectedRecoveryDays);
    expect(actual.deadline.value).toBeCloseTo(expected.probabilityTargetMet*100);
  });
});
