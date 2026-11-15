import {describe, expect, it} from 'vitest';
import {createCase, validateCaseImport} from './model';
import {fromPreset} from './presets';

const cases=['ecodesign','climate','saf','wildfire'] as const;
const deadlines=['100 days','24 hours','15 days','30 minutes'] as const;

describe('Case incident: clear and traceable starting situation',()=>{
  it.each(cases)('defines the problem in both languages before alternatives (%s)',kind=>{
    const es=fromPreset(kind,'es');
    const en=fromPreset(kind,'en');
    expect(es.scenario?.length).toBeGreaterThan(130);
    expect(en.scenario?.length).toBeGreaterThan(130);
    expect(es.scenario).not.toEqual(en.scenario);
    expect(es.hypothetical).toBe(true);
    expect(en.hypothetical).toBe(true);
    expect(es.options).toHaveLength(3);
    expect(en.options).toHaveLength(3);
    expect(validateCaseImport(es).scenario).toBe(es.scenario);
    expect(validateCaseImport(en).scenario).toBe(en.scenario);
  });

  it.each(cases.map((kind,i)=>[kind,deadlines[i]] as const))('sets an explicit target in %s (%s)',(kind,target)=>{
    expect(fromPreset(kind,'en').scenario).toContain(target);
  });

  it('starts a newly created real case without any fictional incident',()=>{
    expect(createCase('ecodesign','es').scenario).toBe('');
  });

  it('imports historic case JSON lacking the new optional scenario field',()=>{
    const legacy=fromPreset('ecodesign','en');
    delete legacy.scenario;
    expect(validateCaseImport(legacy).scenario).toBe('');
  });

  it('rejects invalid incident data instead of silently accepting it',()=>{
    const bad=fromPreset('ecodesign','en') as unknown as {scenario:unknown};
    bad.scenario={untrusted:'object'};
    expect(()=>validateCaseImport(bad)).toThrow('Invalid field: scenario');
  });
});
