import {describe,expect,it} from 'vitest';
import {compareOption,comparisons,createCase} from './model';
import {fromPreset} from './presets';
import {strategicInsights} from './strategicDeepDive';

describe('Extended strategic translator',()=>{
  const audience=['defenceCustomer','engineering','programmeManager','executiveLeadership'] as const;
  const kinds=['ecodesign','climate','saf','wildfire'] as const;
  const expectedIds=['bottleneck','risk','economics','environment','alternatives','evidence','action'];
  it.each(kinds)('offers seven complete conclusions for %s in both languages and all audiences',kind=>{
    for(const locale of ['es','en'] as const)for(const recipient of audience){
      const c=fromPreset(kind,locale);
      for(const result of comparisons(c)){
        const sections=strategicInsights(c,result,recipient,locale);
        expect(sections.map(x=>x.id)).toEqual(expectedIds);
        expect(sections.every(x=>x.title.length>10&&x.body.length>40)).toBe(true);
        expect(sections[6].body.length).toBeGreaterThan(130);
        expect(sections[5].body.toLowerCase()).toMatch(locale==='es'?/simulad/:/simulated/);
        expect(sections[6].body).toContain(locale==='es'?'Decisión propuesta':'Proposed decision');
      }
    }
  });
  it('identifies the real binding lead-time constraint rather than pretending faster repairs always help',()=>{
    const c=fromPreset('ecodesign','es');
    const [repair,combined]=comparisons(c);
    const r=strategicInsights(c,repair,'defenceCustomer','es');
    expect(r[0].body).toContain('65');
    expect(r[0].body).toContain('78');
    expect(r[0].body).toContain('suministro es el plazo condicionante');
    expect(r[0].body).toContain('49,3');
    const b=strategicInsights(c,combined,'defenceCustomer','es');
    expect(b[0].body).toContain('50');
    expect(b[0].body).toContain('64');
  });
  it('explains the conditional risk assumptions and does not claim real disruption observations',()=>{
    const c=fromPreset('ecodesign','es');
    const insights=strategicInsights(c,comparisons(c)[0],'defenceCustomer','es');
    expect(insights[1].body).toContain('45 %');
    expect(insights[1].body).toContain('28 %');
    expect(insights[1].body).toContain('75 %');
    expect(insights[1].body).toContain('90 %');
    expect(insights[1].body).toContain('supone independencia');
    expect(insights[5].body).toContain('simuladas');
  });
  it('states trade-offs only when computed: savings with faster recovery or premium per time unit',()=>{
    const c=fromPreset('ecodesign','es');
    const [repair,combined]=comparisons(c);
    const first=strategicInsights(c,repair,'programmeManager','es');
    expect(first[2].body).toContain('recuperación más rápida y menor coste');
    const second=strategicInsights(c,combined,'programmeManager','es');
    expect(second[2].body).toMatch(/sobrecoste|coste esperado/);
    expect(second[2].body).toContain('€');
  });
  it('reports environmental worsening instead of assuming every sustainability initiative reduces emissions',()=>{
    const c=fromPreset('wildfire','es');
    const message=strategicInsights(c,comparisons(c)[0],'executiveLeadership','es');
    expect(message[3].body).toContain('GEI');
    expect(message[3].body).toContain('5.000');
    expect(message[3].body).toContain('7.000');
    expect(message[3].body).toContain('aumenta');
    expect(message[3].body).toContain('no equivale a un ACV');
  });
  it('distinguishes the selected alternative from the other candidate, changing when switched',()=>{
    const c=fromPreset('saf','es');
    const [single,fallback]=comparisons(c);
    const s=strategicInsights(c,single,'programmeManager','es');
    const f=strategicInsights(c,fallback,'programmeManager','es');
    expect(s[4].body).toContain(fallback.option.name);
    expect(f[4].body).toContain(single.option.name);
    expect(s[4].body).not.toBe(f[4].body);
  });
  it('updates the binding constraint and cost conclusions when scenario inputs are modified',()=>{
    const c=fromPreset('ecodesign','es');
    const before=strategicInsights(c,comparisons(c)[0],'programmeManager','es');
    c.options[1].parameterValues.baseRecovery.value=200;
    c.options[1].parameterValues.baseCost.value=400000;
    const after=strategicInsights(c,comparisons(c)[0],'programmeManager','es');
    expect(after[0].body).toContain('200');
    expect(after[0].body).toContain('ejecución operativa');
    expect(after[2].body).toContain('aumenta');
    expect(after[0].body).not.toBe(before[0].body);
    expect(after[2].body).not.toBe(before[2].body);
  });
  it('does not fabricate indicators from unknown data or excluded controls',()=>{
    const c=fromPreset('ecodesign','es');
    c.parameters.baseRecovery={applicability:'unknown',reason:''};
    c.parameters.ghgKg={applicability:'notApplicable',reason:'Fuera del perímetro'};
    const items=strategicInsights(c,compareOption(c,c.options[1]),'defenceCustomer','es');
    expect(items[0].body).not.toContain('49,3');
    expect(items[3].body).not.toContain('kg CO₂e');
    expect(items[5].body).toContain('pendientes');
  });
  it('supports an unfilled generic case without inventing any results',()=>{
    const c=createCase('general','es');
    const insight=strategicInsights(c,compareOption(c,c.options[1]),'defenceCustomer','es');
    expect(insight).toHaveLength(7);
    expect(insight[0].body).not.toMatch(/recuperación de [0-9]+/);
    expect(insight[5].body).toContain('pendientes');
  });
});
