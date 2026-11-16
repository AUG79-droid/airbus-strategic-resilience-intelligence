import {describe,it,expect} from 'vitest';
import {fromPreset,localizePresetCase} from './presets';
import type {StrategicCase} from './model';

const kinds=['ecodesign','climate','saf','wildfire'] as const;
const fields=['title','programme','scenario','decision','initiative','vulnerability',
  'mechanism','boundary','timeHorizon','owner'] as const;

describe('Case Studio language switching preserves calculations and translates all four stages',()=>{
  it.each(kinds)('localizes seeded %s case both ways without dropping its data',kind=>{
    const source=fromPreset(kind,'en');
    const spanish=localizePresetCase(source,'es');
    const expectedSpanish=fromPreset(kind,'es');
    fields.forEach(key=>expect(spanish[key]).toBe(expectedSpanish[key]));
    for(let i=0;i<3;i++){
      expect(spanish.options[i].name).toBe(expectedSpanish.options[i].name);
      expect(spanish.options[i].explanation).toBe(expectedSpanish.options[i].explanation);
      expect(spanish.options[i].parameterValues).toEqual(source.options[i].parameterValues);
    }
    expect(spanish.evidence.map(x=>x.title)).toEqual(expectedSpanish.evidence.map(x=>x.title));
    expect(spanish.evidence.map(x=>x.owner)).toEqual(expectedSpanish.evidence.map(x=>x.owner));
    expect(spanish.evidence.map(x=>x.limitations)).toEqual(expectedSpanish.evidence.map(x=>x.limitations));
    expect(spanish.environmentalBasis.map(x=>x.boundary)).toEqual(expectedSpanish.environmentalBasis.map(x=>x.boundary));
    const english=localizePresetCase(spanish,'en');
    fields.forEach(key=>expect(english[key]).toBe(source[key]));
    expect(english.options.map(x=>x.name)).toEqual(source.options.map(x=>x.name));
    expect(english.evidence.map(x=>x.title)).toEqual(source.evidence.map(x=>x.title));
    expect(english.options.map(x=>x.parameterValues)).toEqual(source.options.map(x=>x.parameterValues));
  });

  it('preserves case edits when changing language',()=>{
    const data=fromPreset('ecodesign','en');
    data.options[0].parameterValues.baseRecovery.value=137;
    data.scenario='My own edited problem';
    data.options[1].name='My chosen repair plan';
    data.evidence[0].title='My own evidence document';
    const spanish=localizePresetCase(data,'es');
    expect(spanish.options[0].parameterValues.baseRecovery.value).toBe(137);
    expect(spanish.scenario).toBe('My own edited problem');
    expect(spanish.options[1].name).toBe('My chosen repair plan');
    expect(spanish.evidence[0].title).toBe('My own evidence document');
    expect(spanish.options[0].name).toBe('Sustitución convencional');
  });

  it('does not modify a user-created case',()=>{
    const data=fromPreset('climate','en');
    data.hypothetical=false;
    data.id='MY-CUSTOM-CASE';
    expect(localizePresetCase(data,'es')).toBe(data);
  });
});
