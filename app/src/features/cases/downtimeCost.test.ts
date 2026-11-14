import { describe, expect, it } from 'vitest';
import { calculateUniversal } from './universal';
import { createCase, validateCaseImport } from './model';
import { fromPreset } from './presets';

describe('Optional monetisation of downtime',()=>{
  it('does not alter any legacy cost when excluded',()=>{
    const c=fromPreset('ecodesign');
    const original=calculateUniversal(c,c.options[1]).cost.value;
    c.options[1].parameterValues.downtimeRate={value:5000,evidenceId:''};
    expect(calculateUniversal(c,c.options[1]).cost.value).toBe(original);
  });
  it('adds explicitly declared, incremental cost per time unit without hiding assumptions',()=>{
    const c=fromPreset('ecodesign');
    const opt=c.options[1];
    const original=calculateUniversal(c,opt);
    c.parameters.downtimeRate={applicability:'applies',reason:''};
    opt.parameterValues.downtimeRate={value:1000,evidenceId:''};
    const later=calculateUniversal(c,opt);
    expect(later.cost.value).toBeCloseTo(original.cost.value!+1000*original.recovery.value!);
    expect(later.assumptions.join(' ')).toMatch(/double-counting/);
  });
  it('blocks cost if downtime valuation depends on an undefined recovery time',()=>{
    const c=createCase('general');
    c.parameters.downtimeRate={applicability:'applies',reason:''};
    c.options[0].parameterValues.baseCost={value:10,evidenceId:''};
    c.options[0].parameterValues.downtimeRate={value:100,evidenceId:''};
    const result=calculateUniversal(c,c.options[0]);
    expect(result.cost.state).toBe('missing');
    expect(result.cost.missing.join(' ')).toMatch(/recovery time/);
  });
  it('migrates older saved cases that do not contain the extra field',()=>{
    const c=fromPreset('saf');
    delete c.parameters.downtimeRate;
    for(const option of c.options)delete option.parameterValues.downtimeRate;
    const x=validateCaseImport(c);
    expect(x.parameters.downtimeRate.applicability).toBe('notApplicable');
    expect(x.options.every(option=>option.parameterValues.downtimeRate.value===null)).toBe(true);
  });
});