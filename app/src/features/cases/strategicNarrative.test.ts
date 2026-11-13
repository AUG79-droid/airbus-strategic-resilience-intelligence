import { describe, expect, it } from 'vitest';
import { comparisons, createCase } from './model';
import { fromPreset } from './presets';
import { strategicDecisionAnswer, strategicMessage, strategicNarrativeText } from './strategicNarrative';

describe('Strategic resilience translation',()=>{
  it('translates component recovery into a concrete defence resilience mechanism',()=>{
    const c=fromPreset('ecodesign','es');
    const x=strategicMessage(c,comparisons(c)[0],'defenceCustomer','es');
    expect(x.headline).toMatch(/Resiliencia operativa/);
    expect(x.operationalMeaning).toMatch(/reparación cualificada|reparación|vía de reparación/);
    expect(x.quantifiedFinding).toContain('141,3');
    expect(x.quantifiedFinding).toContain('92');
    expect(x.quantifiedFinding).toContain('49,3');
    expect(x.quantifiedFinding).toContain('días');
    expect(x.decisionQuestion).toContain('¿qué aporta esta alternativa');
    expect(x.operationalMeaning).not.toMatch(/disponibilidad de la flota aumentó/);
    expect(x.operationalMeaning).toContain('sin depender únicamente');
  });
  it('does not conflate repair-only with the combined supplier option',()=>{
    const c=fromPreset('ecodesign','es');
    const [repair,combined]=comparisons(c);
    const repairMessage=strategicMessage(c,repair,'defenceCustomer','es');
    const combinedMessage=strategicMessage(c,combined,'defenceCustomer','es');
    expect(repairMessage.operationalMeaning).not.toMatch(/otra de aprovisionamiento/);
    expect(combinedMessage.operationalMeaning).toContain('proveedor alternativo');
    expect(combinedMessage.quantifiedFinding).not.toBe(repairMessage.quantifiedFinding);
  });
  it('changes Programme arguments dynamically when cost and timing change',()=>{
    const c=fromPreset('ecodesign','es');
    let x=strategicMessage(c,comparisons(c)[0],'programmeManager','es');
    expect(x.headline).toContain('recuperación');
    expect(x.sustainabilityLink).toContain('29.300');
    c.options[1].parameterValues.baseCost.value=400000;
    c.options[1].parameterValues.baseRecovery.value=200;
    x=strategicMessage(c,comparisons(c)[0],'programmeManager','es');
    expect(x.sustainabilityLink).toContain('aumenta');
    expect(x.quantifiedFinding).toContain('214');
  });
  it('produces four distinct, decision-specific narratives without generic KPI counts',()=>{
    const c=fromPreset('ecodesign','es');
    const comparison=comparisons(c)[0];
    const audiences=['defenceCustomer','engineering','programmeManager','executiveLeadership'] as const;
    const outputs=audiences.map(a=>strategicNarrativeText(c,comparison,a,'es'));
    expect(new Set(outputs).size).toBe(4);
    expect(outputs.every(x=>x.includes('Pregunta para')||x.includes('Pregunta del cliente'))).toBe(true);
    expect(outputs.every(x=>!x.includes('7 indicadores mejores'))).toBe(true);
    expect(outputs[1]).toMatch(/reparabilidad|reparación/);
    expect(outputs[2]).toMatch(/coste|plazo/);
    expect(outputs[3]).toMatch(/cadena de suministro|industrial/);
  });
  it('adapts correctly to British English without stray Spanish phrases',()=>{
    const c=fromPreset('ecodesign','en');
    const x=strategicMessage(c,comparisons(c)[0],'defenceCustomer','en');
    expect(x.headline).toContain('Operational resilience');
    expect(x.quantifiedFinding).toContain('141.3');
    expect(x.quantifiedFinding).toContain('49.3');
    expect(x.decisionQuestion).toContain('Customer question');
  });
  it('does not invent recovery improvement when an input is unknown',()=>{
    const c=fromPreset('ecodesign','es');
    c.parameters.baseRecovery={applicability:'unknown',reason:''};
    const comp=comparisons(c)[0];
    const x=strategicMessage(c,comp,'defenceCustomer','es');
    expect(x.quantifiedFinding).toMatch(/aún no puede compararse/);
    expect(x.operationalMeaning).not.toMatch(/permite recuperar antes el componente/);
  });
  it.each([
    ['climate','calor extremo','horas'],
    ['saf','abastecimiento','días'],
    ['wildfire','alertas','minutos']
  ] as const)('translates the completed %s case into a specific resilience decision', (kind,subject,unit)=>{
    for(const locale of ['es','en'] as const){
      const c=fromPreset(kind,locale);
      const compared=comparisons(c);
      expect(compared.every(x=>x.missing.length===0)).toBe(true);
      expect(compared.every(x=>x.reviewedData&&!x.canDescribeAsMeasured)).toBe(true);
      const audiences=['defenceCustomer','engineering','programmeManager','executiveLeadership'] as const;
      const messages=audiences.map(a=>strategicMessage(c,compared[0],a,locale));
      expect(new Set(messages.map(x=>x.headline)).size).toBe(4);
      expect(messages.every(x=>x.quantifiedFinding.length>35)).toBe(true);
      expect(messages.every(x=>x.decisionQuestion.length>35)).toBe(true);
      expect(messages.every(x=>!x.operationalMeaning.includes('qualified repair'))).toBe(true);
      if(locale==='es'){
        expect(messages[0].headline.toLowerCase()).toContain(subject);
        expect(messages[0].quantifiedFinding).toContain(unit);
        expect(messages[0].quantifiedFinding).not.toContain('del componente');
        expect(messages[3].decisionQuestion).toMatch(/Qué|Cuál|Conviene/);
      }
    }
  });
  it('distinguishes SAF supply diversification from a single SAF supplier',()=>{
    const c=fromPreset('saf','es');
    const [single,fallback]=comparisons(c);
    const a=strategicMessage(c,single,'defenceCustomer','es');
    const b=strategicMessage(c,fallback,'defenceCustomer','es');
    expect(a.operationalMeaning).toContain('único proveedor');
    expect(b.operationalMeaning).toContain('suministro alternativo');
    expect(a.sustainabilityLink).toContain('GEI');
    expect(a.operationalMeaning).not.toContain('aprobación concedida');
  });
  it('does not claim wildfire alert detection was directly measured by a restoration-time model',()=>{
    const c=fromPreset('wildfire','es');
    const a=strategicMessage(c,comparisons(c)[0],'defenceCustomer','es');
    expect(a.quantifiedFinding).toContain('restablecimiento');
    expect(a.quantifiedFinding).not.toContain('tiempo desde detección');
    expect(a.operationalMeaning).toContain('comunicaciones');
  });
  it('does not report a spurious fleet-availability effect for any case',()=>{
    for(const kind of ['ecodesign','climate','saf','wildfire'] as const){
      const c=fromPreset(kind,'es');
      const x=strategicMessage(c,comparisons(c)[0],'defenceCustomer','es');
      expect(x.operationalMeaning).not.toMatch(/flota.*aumenta|disponibilidad de flota.*mejora/);
      expect(x.decisionQuestion.length).toBeGreaterThan(35);
    }
  });
  it.each(['general','ecodesign','climate','saf','wildfire'] as const)('generates an audience-specific narrative for a user-created %s case, not the prepared preset',kind=>{
    for(const locale of ['es','en'] as const){
      const c=fromPreset(kind==='general'?'ecodesign':kind,locale);
      c.kind=kind;
      c.id='CASE-user-authored';
      c.hypothetical=false;
      c.title='CUSTOM CASE 2040';
      c.initiative='My independent waste-heat reuse concept';
      c.vulnerability='Dependence on an external cooling contractor';
      c.mechanism='Reuse recovered heat locally to protect critical activity';
      c.boundary='One workshop, one year';
      c.decision='Whether to invest in on-site recovery';
      for(const a of ['defenceCustomer','engineering','programmeManager','executiveLeadership'] as const){
        const result=strategicMessage(c,comparisons(c)[0],a,locale);
        expect(result.headline).toContain('CUSTOM CASE 2040');
        expect(result.operationalMeaning).toContain('Dependence on an external cooling contractor');
        expect(result.operationalMeaning).toContain('Reuse recovered heat locally');
        expect(result.decisionQuestion.length).toBeGreaterThan(50);
        expect(result.headline).not.toMatch(/SAF|Eurodrone|heatwave|incendios/i);
      }
    }
  });
  it('does not invent numeric impacts for a brand-new empty editable case',()=>{
    const c=createCase('general','es');
    c.title='Caso de suministro propio';
    c.vulnerability='Dependencia de un servicio externo';
    const output=strategicMessage(c,comparisons(c)[0],'executiveLeadership','es');
    expect(output.operationalMeaning).toContain('Dependencia de un servicio externo');
    expect(output.quantifiedFinding).toMatch(/No hay todavía datos suficientes/);
    expect(output.quantifiedFinding).not.toMatch(/141,3|92 días/);
  });


  it('answers Eurodrone Defence Customer question with the actual recovery and deadline results',()=>{
    const c=fromPreset('ecodesign','es');
    const comp=comparisons(c)[0];
    const a=strategicDecisionAnswer(c,comp,'defenceCustomer','es');
    expect(a).toContain('49,3 días menos');
    expect(a).toContain('141,3');
    expect(a).toContain('92');
    expect(a).toContain('0 %');
    expect(a).toContain('64,8 %');
    expect(a).toMatch(/recuperación|suministro/);
    expect(a).not.toMatch(/simulado|capacidad operativa acreditada|disponibilidad de flota/);
    const report=strategicNarrativeText(c,comp,'defenceCustomer','es');
    expect(report).toContain('Respuesta del análisis: ');
    expect(report).toContain(a);
  });
  it('answers dynamically in English for both options and all four audiences',()=>{
    const c=fromPreset('ecodesign','en');
    const [repair,combined]=comparisons(c);
    const a=strategicDecisionAnswer(c,repair,'defenceCustomer','en');
    const b=strategicDecisionAnswer(c,combined,'defenceCustomer','en');
    expect(a).toContain('49.3 fewer days');
    expect(a).toContain('141.3');
    expect(a).toContain('64.8%'.replace('%',' %'));
    expect(a).not.toBe(b);
    for(const audience of ['defenceCustomer','engineering','programmeManager','executiveLeadership'] as const){
      const result=strategicDecisionAnswer(c,repair,audience,'en');
      expect(result.length).toBeGreaterThan(100);
      expect(result).not.toMatch(/This is a simulated scenario conclusion|Partly yes/);
      expect(strategicNarrativeText(c,repair,audience,'en')).toContain('Model-based answer: '+result);
    }
  });
  it.each(['climate','saf','wildfire'] as const)('responds in both languages without claiming %s outcomes are authorised',kind=>{
    for(const locale of ['es','en'] as const){
      const c=fromPreset(kind,locale);
      for(const cmp of comparisons(c)){
        for(const audience of ['defenceCustomer','engineering','programmeManager','executiveLeadership'] as const){
          const text=strategicDecisionAnswer(c,cmp,audience,locale);
          expect(text.length).toBeGreaterThan(120);
          expect(text.toLowerCase()).not.toMatch(/proven real-world mission availability|disponibilidad real de la flota demostrada/);
          expect(strategicNarrativeText(c,cmp,audience,locale)).toContain(text);
        }
      }
    }
  });
  it('does not answer positively when expected recovery worsens',()=>{
    const c=fromPreset('ecodesign','es');
    c.options[1].parameterValues.baseRecovery.value=250;
    const answer=strategicDecisionAnswer(c,comparisons(c)[0],'defenceCustomer','es');
    expect(answer).not.toContain('Sí, parcialmente');
    expect(answer).toContain('más en recuperar');
  });
  it('leaves an explicit answer when a newly created case has no results',()=>{
    const c=createCase('general','es');
    const cmp=comparisons(c)[0];
    const answer=strategicDecisionAnswer(c,cmp,'defenceCustomer','es');
    expect(answer).toContain('Todavía no hay datos suficientes');
    expect(answer).not.toContain('141,3');
  });
  it('updates the answer after editing a custom case and avoids inherited Eurodrone claims',()=>{
    const c=createCase('general','es');
    c.title='Mi proyecto de eficiencia operativa';
    c.vulnerability='Dependencia de una vía de refrigeración';
    c.options[0].parameterValues.baseRecovery.value=100;
    c.options[1].parameterValues.baseRecovery.value=60;
    c.options[0].parameterValues.recoveryTarget.value=95;
    c.options[1].parameterValues.recoveryTarget.value=95;
    for(const opt of c.options){
      opt.parameterValues.shockProbability.value=0;
      opt.parameterValues.shockDelay.value=0;
    }
    let text=strategicDecisionAnswer(c,comparisons(c)[0],'defenceCustomer','es');
    expect(text).toContain('60');
    expect(text).toContain('100');
    expect(text).not.toContain('flota');
    c.options[1].parameterValues.baseRecovery.value=120;
    text=strategicDecisionAnswer(c,comparisons(c)[0],'defenceCustomer','es');
    expect(text).toContain('120');
    expect(text).not.toContain('Sí, parcialmente');
  });

});
