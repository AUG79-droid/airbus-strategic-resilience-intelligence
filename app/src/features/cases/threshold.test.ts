import {describe,expect,it} from 'vitest';
import {createCase,compareOption} from './model';

describe('Sensitivity decision switching thresholds',()=>{
 it('solves for an approximate input threshold, rather than reporting the perturbation endpoint',()=>{
  const c=createCase('general');
  c.robustnessPercent=50;
  for(const [index,option] of c.options.entries()){
    option.parameterValues.baseRecovery={value:index===0?10:12,evidenceId:''};
    option.parameterValues.shockProbability={value:0,evidenceId:''};
    option.parameterValues.shockDelay={value:0,evidenceId:''};
  }
  const row=compareOption(c,c.options[1]).rows.find(x=>x.metric.id==='expectedRecovery')!;
  expect(row.robustness).toBe('sensitive');
  expect(row.sensitivityRange?.switchingParameter).toBe('baseRecovery');
  expect(row.sensitivityRange?.switchingAlternative).toBe('baseline');
  // Baseline originally takes 10 days; candidate 12. The real reversal is
  // near baseline 12, rather than at the 15-day perturbation endpoint.
  expect(row.sensitivityRange?.switchingValue).toBeCloseTo(12,3);
 });
});
