import {describe,expect,it} from 'vitest';
import {localizeCaseDiagnostic,localizeResultStatus} from './reportI18n';
import {fromPreset} from './presets';
import {compareOption} from './model';
import {reportText} from './CaseJourney';

describe('Technical report bilingual terms and source identifiers',()=>{
  it('translates status labels but preserves identifiers',()=>{
    expect(localizeResultStatus('stable','es')).toBe('estable en variaciones válidas');
    expect(localizeResultStatus('notApplicable','es')).toBe('no aplica');
    expect(localizeResultStatus('reviewed','es')).toContain('declarada');
    expect(localizeResultStatus('reviewed','en')).toBe('reviewed');
    expect(localizeResultStatus('EV-2026','es')).toBe('EV-2026');
  });
  it('localises validation diagnostics without altering English outputs',()=>{
    expect(localizeCaseDiagnostic('Investigate: title is missing','es'))
      .toBe('Investigar: falta nombre del caso');
    expect(localizeCaseDiagnostic('Investigate: owner is missing','es'))
      .toBe('Investigar: falta responsable');
    expect(localizeCaseDiagnostic('expectedCost: missing traceable review for baseline and alternative','es'))
      .toContain('falta revisión trazable para referencia y alternativa');
    expect(localizeCaseDiagnostic('Scope, technical, method and reviewer gates are not all confirmed','es'))
      .toContain('cuatro declaraciones');
    expect(localizeCaseDiagnostic('Investigate: title is missing','en'))
      .toBe('Investigate: title is missing');
  });
  it('includes Spanish diagnostic wording in the exported case report',()=>{
    const c=fromPreset('saf','es');
    c.title='';
    c.options[1].parameterValues.baseCost.evidenceId='';
    const result=compareOption(c,c.options[1]);
    const report=reportText(c,result,'engineering','es');
    expect(report).toContain('Investigar: falta nombre del caso');
    expect(report).not.toContain('Investigate: title is missing');
    expect(report).not.toContain('Review gates:');
    expect(report).toContain('03 Comprobar');
  });
});
