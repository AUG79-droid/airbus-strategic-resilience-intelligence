import {describe,expect,it} from 'vitest';
import {fromPreset} from './presets';
import {compareOption} from './model';
import {reportText} from './CaseJourney';

describe('Strategic Case Studio report: source-locale and finance assumptions',()=>{
  it('uses Spanish human-readable review labels and never claims authentic sign-off',()=>{
    const data=fromPreset('ecodesign','es');
    const text=reportText(data,compareOption(data,data.options[1]),'programmeManager','es');
    expect(text).toContain('## 03 Comprobar');
    expect(text).toContain('Controles de revisión declarados');
    expect(text).toContain('Trazabilidad documental');
    expect(text).toContain('Mediciones observadas');
    expect(text).toContain('Audiencia:');
    expect(text).toContain('rango Δ');
    expect(text).not.toMatch(/(?:Review gates|Evidence trace|Observed measurements|Audience):/);
    expect(text).toContain('no aprobado por Airbus');
  });
  it('retains clear English and describes nominal versus constant-price amounts in both languages',()=>{
    const data=fromPreset('saf','en');
    data.discountedFinance={
      annualDiscountPercent:10,
      annualEscalationPercent:5,
      flows:[{id:'FLOW-1',optionId:'baseline',year:2,amountEuro:100,
        priceBasis:'baseYear',accounting:'incremental',evidenceId:'',explanation:'Fictional training'}]
    };
    const c=compareOption(data,data.options[1]);
    const en=reportText(data,c,'defenceCustomer','en');
    const es=reportText(data,c,'defenceCustomer','es');
    expect(en).toContain('User-declared review gates');
    expect(en).toContain('Declared annual escalation for constant-price EUR: 5%');
    expect(en).toContain('priceBasis=baseYear');
    expect(es).toContain('Escalación anual declarada para euros constantes: 5%');
    expect(es).toContain('Un importe nominal futuro NO recibe escalación adicional');
  });
});
