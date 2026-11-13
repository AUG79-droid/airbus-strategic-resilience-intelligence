import { describe, expect, it } from 'vitest';
import { compareEnvironmentalBasis, validateEnvironmentalBasis, type EnvironmentalBasis } from './environmentBasis';
import { createCase, compareOption, validateCaseImport } from './model';
import { fromPreset } from './presets';
const basis=(optionId:string):EnvironmentalBasis=>({optionId,functionalUnit:'one service unit',
  period:'12 months',boundary:'cradle-to-gate',inventoryMethod:'inventory v1',
  allocationRule:'mass allocation',factorSourceVersion:'2026-R1',evidenceId:''});
describe('Environmental comparability gate (not verified LCA)',()=>{
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
