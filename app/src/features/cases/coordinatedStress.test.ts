import {describe,expect,it} from 'vitest';
import {compareOption,createCase} from './model';
import {fromPreset} from './presets';

describe('Coordinated input stress: deterministic, NOT statistical',()=>{
  it('reports four mathematically valid scenarios and always includes the base difference',()=>{
    const c=fromPreset('ecodesign');
    c.robustnessPercent=20;
    const result=compareOption(c,c.options[1]);
    const rows=result.rows.filter(x=>x.delta!==null);
    expect(rows.length).toBeGreaterThan(3);
    for(const row of rows){
      const stress=row.coordinatedStress!;
      expect(stress).toBeDefined();
      expect(stress.validScenarios).toBeGreaterThanOrEqual(0);
      expect(stress.validScenarios).toBeLessThanOrEqual(4);
      expect(stress.attemptedScenarios).toBe(4);
      expect(stress.minDelta).toBeLessThanOrEqual(row.delta!);
      expect(stress.maxDelta).toBeGreaterThanOrEqual(row.delta!);
    }
  });
  it('does not claim a usable four-corner stress range when the model has missing inputs',()=>{
    const c=createCase();
    c.robustnessPercent=20;
    const result=compareOption(c,c.options[1]);
    expect(result.rows.filter(x=>x.issue==='missing').every(x=>x.coordinatedStress===undefined)).toBe(true);
  });
  it('does not use a zero-variation range as an uncertainty estimate',()=>{
    const c=fromPreset('saf');c.robustnessPercent=0;
    expect(compareOption(c,c.options[1]).rows.every(x=>!x.coordinatedStress)).toBe(true);
  });
});
