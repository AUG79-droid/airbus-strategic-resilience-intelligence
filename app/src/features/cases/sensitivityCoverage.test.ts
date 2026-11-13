import {describe,expect,it} from 'vitest';
import {fromPreset} from './presets';
import {compareOption} from './model';

describe('Sensitivity coverage must never overclaim robustness',()=>{
  it('marks an apparently stable comparison inconclusive if joint-event probes violate Frechet bounds',()=>{
    const c=fromPreset('ecodesign');
    c.robustnessPercent=15;
    c.parameters.jointFailureShock={applicability:'applies',reason:'Linked events, fictional'};
    for(const option of c.options){
      const success=option.parameterValues.technicalSuccess.value!;
      const shock=option.parameterValues.shockProbability.value!;
      option.parameterValues.jointFailureShock={value:Math.min(100-success,shock),evidenceId:''};
    }
    const result=compareOption(c,c.options[1]);
    const row=result.rows.find(r=>r.metric.id==='deadlineAttainment')!;
    expect(row.delta).not.toBeNull();
    expect(row.sensitivityRange?.invalidScenarios).toBeGreaterThan(0);
    expect(row.sensitivityRange!.attemptedScenarios).toBeGreaterThan(row.sensitivityRange!.validScenarios);
    expect(row.robustness).not.toBe('stable');
  });
  it('tracks all valid perturbations without treating a deterministic range as confidence',()=>{
    const c=fromPreset('saf');
    c.robustnessPercent=10;
    const row=compareOption(c,c.options[1]).rows.find(r=>r.metric.id==='expectedRecovery')!;
    expect(row.sensitivityRange?.attemptedScenarios).toBeGreaterThan(0);
    expect(row.sensitivityRange!.attemptedScenarios).toBe(
      row.sensitivityRange!.validScenarios+row.sensitivityRange!.invalidScenarios);
    expect(['stable','sensitive','equivalent','insufficient']).toContain(row.robustness);
  });
});
