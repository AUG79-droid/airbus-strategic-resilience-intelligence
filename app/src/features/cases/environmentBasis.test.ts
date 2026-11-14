import { describe, expect, it } from 'vitest';
import { compareEnvironmentalBasis, validateEnvironmentalBasis, boundedEnvironmentalDifference, type EnvironmentalBasis } from './environmentBasis';
import { createCase, compareOption, validateCaseImport } from './model';
import { fromPreset } from './presets';
const basis=(optionId:string):EnvironmentalBasis=>({optionId,functionalUnit:'one service unit',
  period:'12 months',boundary:'cradle-to-gate',inventoryMethod:'inventory v1',
  allocationRule:'mass allocation',factorSourceVersion:'2026-R1',evidenceId:''});
describe('Environmental comparability gate (not verified LCA)',()=>{
  it('does not assert environmental savings when scenario uncertainty overlaps',()=>{
    const baseline={...basis('baseline'),relativeUncertaintyPercent:10};
    const option={...basis('option-a'),relativeUncertaintyPercent:20};
    const overlapping=boundedEnvironmentalDifference(100,85,baseline,option);
    expect(overlapping.status).toBe('overlap');
    expect(overlapping.minDelta).toBeCloseTo(68-110);
    expect(overlapping.maxDelta).toBeCloseTo(102-90);
    const reduction=boundedEnvironmentalDifference(100,60,baseline,option);
    expect(reduction.status).toBe('reductionUnderBounds');
    expect(reduction.maxDelta).toBeLessThan(0);
    const increase=boundedEnvironmentalDifference(100,140,baseline,option);
    expect(increase.status).toBe('increaseUnderBounds');
    expect(increase.minDelta).toBeGreaterThan(0);
  });
  it('requires explicit bounds for both inventory datasets and rejects invalid margins',()=>{
    const baseline=basis('baseline'),option={...basis('option-a'),relativeUncertaintyPercent:10};
    expect(boundedEnvironmentalDifference(100,50,baseline,option).status).toBe('unassessed');
    baseline.relativeUncertaintyPercent=5;
    baseline.boundary='different scope';
    expect(boundedEnvironmentalDifference(100,50,baseline,option).status).toBe('unassessed');
    baseline.boundary=option.boundary;
    expect(boundedEnvironmentalDifference(100,-50,baseline,option).status).toBe('unassessed');
    for(const invalid of [-1,101,Infinity,NaN]){
      expect(()=>validateEnvironmentalBasis([{...baseline,relativeUncertaintyPercent:invalid}],['baseline']))
        .toThrow(/environmental/i);
    }
  });
  it('requires the same functional unit, time boundary, method, allocation and dataset revision',()=>{
    const a=basis('baseline'),b=basis('option-a');
    expect(compareEnvironmentalBasis(a,b).status).toBe('declaredComparable');
    b.functionalUnit='two service units';
    expect(compareEnvironmentalBasis(a,b).status).toBe('incompatible');
    b.functionalUnit=a.functionalUnit;b.factorSourceVersion='2025-R3';
    expect(compareEnvironmentalBasis(a,b).status).toBe('incompatible');
    b.factorSourceVersion=a.factorSourceVersion;b.allocationRule='';
    expect(compareEnvironmentalBasis(a,b).status).toBe('missing');
  });
  it('does not promote a claimed measured outcome without comparable context',()=>{
    const c=fromPreset('ecodesign');
    const before=compareOption(c,c.options[1]);
    expect(before.environmentCheck.status).toBe('declaredComparable');
    c.environmentalBasis[1].boundary='different scope';
    const after=compareOption(c,c.options[1]);
    expect(after.environmentCheck.status).toBe('incompatible');
    expect(after.missing.some(x=>x.includes('Environmental inventory boundary'))).toBe(true);
    expect(after.canDescribeAsMeasured).toBe(false);
  });
  it('rejects incomplete record shapes and imports unversioned legacy files safely',()=>{
    const c=createCase('general');
    const a=basis('baseline');
    expect(validateEnvironmentalBasis([a],['baseline','option-a'])).toHaveLength(1);
    c.environmentalBasis=[a,{...a,optionId:'baseline'}];
    expect(()=>validateCaseImport(c)).toThrow(/Invalid environmental/);
    delete (c as unknown as {environmentalBasis?:unknown}).environmentalBasis;
    expect(validateCaseImport(c).environmentalBasis).toEqual([]);
  });
});
