import { describe, expect, it } from 'vitest';
import { comparisons } from './model';
import { fromPreset } from './presets';
import { strategicMessage, strategicNarrativeText } from './strategicNarrative';

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
    expect(x.decisionQuestion).toMatch(/capacidad/);
    expect(x.operationalMeaning).not.toMatch(/disponibilidad de la flota aumentó/);
    expect(x.operationalMeaning).toMatch(/No significa disponer de otro proveedor/);
  });
  it('does not conflate repair-only with the combined supplier option',()=>{
    const c=fromPreset('ecodesign','es');
    const [repair,combined]=comparisons(c);
    const repairMessage=strategicMessage(c,repair,'defenceCustomer','es');
    const combinedMessage=strategicMessage(c,combined,'defenceCustomer','es');
    expect(repairMessage.operationalMeaning).not.toMatch(/otra de aprovisionamiento/);
    expect(combinedMessage.operationalMeaning).toMatch(/otra de aprovisionamiento/);
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
    expect(outputs.every(x=>x.includes('Decisión para'))).toBe(true);
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
    expect(x.decisionQuestion).toContain('Customer decision');
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
});
