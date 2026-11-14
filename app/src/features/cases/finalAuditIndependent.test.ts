import {describe,expect,it} from 'vitest';
import {calculateUniversal,defaultParameterStates,emptyParameterValues} from './universal';
import {fromPreset} from './presets';

describe('independent final-audit arithmetic',()=>{
  it('matches a separately calculated correlated four-branch scenario',()=>{
    const parameters=defaultParameterStates('general');
    for(const id of ['technicalSuccess','failureDelay','jointFailureShock','jointExtraDelay',
      'downtimeRate','shockSurcharge','failureCost','jointExtraCost']){
      parameters[id]={applicability:'applies',reason:'Independent audit fixture'};
    }
    const parameterValues=emptyParameterValues();
    const entered:Record<string,number>={
      baseRecovery:10,recoveryTarget:15,technicalSuccess:60,failureDelay:4,
      shockProbability:50,shockDelay:6,jointFailureShock:30,jointExtraDelay:3,
      baseCost:100,logisticsCost:0,downtimeRate:2,shockSurcharge:20,
      failureCost:30,jointExtraCost:40,materialKg:0,ghgKg:0
    };
    for(const [id,value] of Object.entries(entered))parameterValues[id]={value,evidenceId:''};
    const actual=calculateUniversal({kind:'general',parameters},{parameterValues});

    // Independent derivation: P(success,no shock)=.4; P(success,shock)=.2;
    // P(failure,no shock)=.1; P(failure,shock)=.3.
    const expectedRecovery=.4*10+.2*16+.1*14+.3*23;
    const expectedDeadline=(.4+.1)*100;
    const expectedCost=100+.5*20+.4*30+.3*40+2*expectedRecovery;
    expect(expectedRecovery).toBe(15.5);
    expect(actual.recovery.value).toBeCloseTo(expectedRecovery,12);
    expect(actual.deadline.value).toBeCloseTo(expectedDeadline,12);
    expect(actual.cost.value).toBeCloseTo(expectedCost,12);
  });

  it('rejects a joint failure/shock probability outside the Frechet bounds',()=>{
    const parameters=defaultParameterStates('general');
    for(const id of ['technicalSuccess','failureDelay','jointFailureShock'])
      parameters[id]={applicability:'applies',reason:'Independent audit fixture'};
    const parameterValues=emptyParameterValues();
    for(const [id,value] of Object.entries({
      baseRecovery:10,recoveryTarget:20,technicalSuccess:90,failureDelay:5,
      shockProbability:20,shockDelay:5,jointFailureShock:15,
      baseCost:100,logisticsCost:0,materialKg:0,ghgKg:0
    }))parameterValues[id]={value,evidenceId:''};
    // P(failure)=10%, so P(failure AND shock)=15% is impossible.
    const actual=calculateUniversal({kind:'general',parameters},{parameterValues});
    expect(actual.recovery.state).toBe('invalid');
    expect(actual.deadline.state).toBe('invalid');
    expect(actual.cost.state).toBe('invalid');
  });

  it.each([
    ['ecodesign',92,64.8,69.2,99],
    ['climate',24.4,52.7,14.7,98.1],
    ['saf',25.7,0,17.2,72],
    ['wildfire',24.1,72,16.9,99.5]
  ] as const)('reproduces independently checked %s teaching-case timing outputs',
    (kind,recoveryA,deadlineA,recoveryB,deadlineB)=>{
      const data=fromPreset(kind);
      const a=calculateUniversal(data,data.options[1]);
      const b=calculateUniversal(data,data.options[2]);
      const round1=(value:number|null)=>Math.round((value!+Number.EPSILON)*10)/10;
      expect(round1(a.recovery.value)).toBe(recoveryA);
      expect(round1(a.deadline.value)).toBe(deadlineA);
      expect(round1(b.recovery.value)).toBe(recoveryB);
      expect(round1(b.deadline.value)).toBe(deadlineB);
    });
});
