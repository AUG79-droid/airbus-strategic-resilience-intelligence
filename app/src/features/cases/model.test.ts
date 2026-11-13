import { describe, expect, it } from 'vitest';
import {
  MODEL_TEMPLATES, compareOption, comparisons, createCase,
  evidenceReviewed, validateCaseImport, type EvidenceItem
} from './model';
import { fromPreset } from './presets';

describe('Create your own strategic case', () => {
  it('starts blank with no fictitious values or approved gates', () => {
    const c=createCase();
    expect(c.options).toHaveLength(3);
    expect(c.evidence).toHaveLength(0);
    expect(c.hypothetical).toBe(false);
    expect(c.options.every(o=>Object.values(o.measures).every(m=>m.value===null))).toBe(true);
    expect(Object.values(c.gates).every(v=>v===false)).toBe(true);
  });
  it('has distinct domain indicator templates', () => {
    expect(MODEL_TEMPLATES.ecodesign.metrics[0].unit).toBe('days');
    expect(MODEL_TEMPLATES.climate.metrics[0].unit).toBe('%');
    expect(MODEL_TEMPLATES.saf.metrics[2].unit).toBe('kg CO₂e');
    expect(MODEL_TEMPLATES.wildfire.metrics[0].unit).toBe('minutes');
  });
  it.each(['ecodesign','climate','saf','wildfire'] as const)(
    'loads %s at Investigate with a full but explicitly synthetic input set', kind => {
      const c=fromPreset(kind,'es');
      expect(c.hypothetical).toBe(true);
      expect(c.title.length).toBeGreaterThan(8);
      expect(c.initiative.length).toBeGreaterThan(10);
      expect(c.decision.length).toBeGreaterThan(10);
      expect(c.boundary.length).toBeGreaterThan(10);
      expect(c.options).toHaveLength(3);
      expect(c.metrics).toHaveLength(4);
      expect(c.evidence).toHaveLength(kind==='ecodesign'||kind==='saf'?18:15);
      expect(comparisons(c)).toHaveLength(2);
      expect(comparisons(c).every(x=>!x.canDescribeAsMeasured)).toBe(true);
    }
  );
  it('computes baseline versus alternatives without declaring a validated benefit', () => {
    const c=fromPreset('ecodesign');
    const [repair,parallel]=comparisons(c);
    expect(repair.verdict).toBe('improves');
    expect(parallel.verdict).toBe('tradeoff');
    expect(repair.rows[0].delta).toBeCloseTo(-49.25);
    expect(repair.reviewedData).toBe(true); // Simulated evidence reviewed within the exercise
    expect(repair.observedData).toBe(false); // No synthetic source is real observed evidence
    expect(repair.canDescribeAsMeasured).toBe(false); // Never treat a mock case as a validated benefit
  });
  it.each(['es','en'] as const)('Eurodrone %s has fully filled but explicitly FICTIONAL evidence and approvals',locale=>{
    const c=fromPreset('ecodesign',locale);
    expect(c.hypothetical).toBe(true);
    expect(c.owner.length).toBeGreaterThan(10);
    expect(c.owner.toLowerCase()).toMatch(/fictic|fictional/);
    expect(c.evidence).toHaveLength(18);
    expect(new Set(c.evidence.map(e=>e.id)).size).toBe(18);
    expect(c.evidence.every(e=>
      e.id.startsWith('SIM-EURO-') &&
      e.reference.includes('fictional / ficticio') &&
      e.reviewer.toLowerCase().match(/fictic|fictional/) &&
      e.status==='reviewed' &&
      e.nature==='estimate' &&
      e.reviewedOn==='2026-11-01' &&
      e.limitations.length>100
    )).toBe(true);
    expect(Object.values(c.gates).every(Boolean)).toBe(true);
    for(const option of c.options){
      const applicable=Object.entries(c.parameters).filter(([,status])=>status.applicability==='applies');
      expect(applicable).toHaveLength(17);
      for(const [parameter] of applicable){
        const measure=option.parameterValues[parameter];
        expect(measure.value).not.toBeNull();
        expect(c.evidence.some(e=>e.id===measure.evidenceId)).toBe(true);
      }
    }
    for(const comparison of comparisons(c)){
      expect(comparison.gatesReady).toBe(true);
      expect(comparison.reviewedData).toBe(true);
      expect(comparison.observedData).toBe(false);
      expect(comparison.canDescribeAsMeasured).toBe(false);
      expect(comparison.missing).toEqual([]);
      expect(comparison.rows.filter(x=>x.issue!=='excluded').every(x=>x.evidenceReady)).toBe(true);
    }
  });
  it('changing a simulated document to pending correctly reopens an evidence gap',()=>{
    const c=fromPreset('ecodesign','es');
    c.evidence.find(e=>e.id==='SIM-EURO-OPS-REF')!.status='pending';
    const comparison=compareOption(c,c.options[1]);
    expect(comparison.reviewedData).toBe(false);
    expect(comparison.missing.some(x=>x.includes('missing traceable review'))).toBe(true);
    expect(comparison.canDescribeAsMeasured).toBe(false);
  });
  it.each([
    ['climate',12,15,'SIM-CLIM-'],
    ['saf',15,18,'SIM-SAF-'],
    ['wildfire',11,15,'SIM-FIRE-']
  ] as const)('fully completes the %s exercise with traceable synthetic review and no real claim', (kind,activeCount,evidenceCount,prefix)=>{
    for(const locale of ['es','en'] as const){
      const c=fromPreset(kind,locale);
      expect(c.hypothetical).toBe(true);
      expect(c.owner.toLowerCase()).toMatch(/fictic|fictional/);
      expect(Object.values(c.gates).every(Boolean)).toBe(true);
      expect(Object.values(c.parameters).filter(p=>p.applicability==='applies')).toHaveLength(activeCount);
      expect(c.evidence).toHaveLength(evidenceCount);
      expect(new Set(c.evidence.map(e=>e.id)).size).toBe(evidenceCount);
      expect(c.evidence.every(e=>e.id.startsWith(prefix)&&
        e.status==='reviewed'&&e.nature==='estimate'&&
        e.reference.includes('fictional / ficticio')&&
        e.reviewer.toLowerCase().match(/fictic|fictional/)&&
        e.limitations.length>100)).toBe(true);
      for(const option of c.options){
        for(const [id,state] of Object.entries(c.parameters)){
          if(state.applicability==='applies'){
            const value=option.parameterValues[id];
            expect(value.value).not.toBeNull();
            expect(c.evidence.some(e=>e.id===value.evidenceId)).toBe(true);
          }else{
            expect(option.parameterValues[id].evidenceId).toBe('');
          }
        }
      }
      for(const comparison of comparisons(c)){
        expect(comparison.gatesReady).toBe(true);
        expect(comparison.reviewedData).toBe(true);
        expect(comparison.observedData).toBe(false);
        expect(comparison.canDescribeAsMeasured).toBe(false);
        expect(comparison.missing).toEqual([]);
        expect(comparison.rows.filter(x=>x.issue!=='excluded').every(x=>x.evidenceReady)).toBe(true);
      }
    }
  });
  it.each(['climate','saf','wildfire'] as const)('%s exercise reopens pending evidence when an exercise review is changed',kind=>{
    const c=fromPreset(kind,'es');
    const linkedId=c.options[0].parameterValues.baseRecovery.evidenceId;
    expect(linkedId.startsWith('SIM-')).toBe(true);
    c.evidence.find(e=>e.id===linkedId)!.status='pending';
    const outcome=compareOption(c,c.options[1]);
    expect(outcome.reviewedData).toBe(false);
    expect(outcome.missing.some(m=>m.includes('missing traceable review'))).toBe(true);
    expect(outcome.canDescribeAsMeasured).toBe(false);
  });
  it.each(['climate','saf','wildfire'] as const)('removing one %s approval stops completeness even with all sources',kind=>{
    const c=fromPreset(kind,'es');
    c.gates.technicalEligibility=false;
    const result=compareOption(c,c.options[1]);
    expect(result.gatesReady).toBe(false);
    expect(result.missing.some(m=>m.includes('gates'))).toBe(true);
  });
  it('shows tradeoffs for SAF and wildfire sample options rather than universal wins', () => {
    expect(comparisons(fromPreset('saf'))[0].verdict).toBe('tradeoff');
    expect(comparisons(fromPreset('wildfire'))[0].verdict).toBe('tradeoff');
  });
  it('does not divide by zero when calculating a relative delta', () => {
    const c=fromPreset('climate');
    const change=compareOption(c,c.options[1]);
    const material=change.rows.find(r=>r.metric.id==='materialKg');
    expect(material?.baseline).toBe(0);
    expect(material?.percentChange).toBeNull();
  });
  it('rejects invalid percentage values rather than producing optimistic findings', () => {
    const c=fromPreset('saf');
    c.options[1].parameterValues.technicalSuccess.value=150;
    const outcome=compareOption(c,c.options[1]);
    expect(outcome.verdict).toBe('incomplete');
    expect(outcome.missing.some(x=>x.includes('invalid or out of bounds'))).toBe(true);
  });
  it('recalculates real one-at-a-time input variations instead of a delta margin', () => {
    const c=fromPreset('ecodesign');
    c.robustnessPercent=100;
    const change=compareOption(c,c.options[1]);
    expect(change.rows[0].robustness).toBe('sensitive');
    c.robustnessPercent=0;
    expect(compareOption(c,c.options[1]).rows[0].robustness).toBe('insufficient');
  });
  it('labels identical alternatives equivalent rather than pretending the difference is sensitive', () => {
    const c=fromPreset('ecodesign');
    c.options[1].parameterValues=structuredClone(c.options[0].parameterValues);
    const result=compareOption(c,c.options[1]);
    expect(result.rows[0].delta).toBe(0);
    expect(result.rows[0].robustness).toBe('equivalent');
  });
  it('rejects imported cases with missing IDs, inconsistent numeric bounds or out-of-range inputs', () => {
    const c=fromPreset('ecodesign');
    const missingId=structuredClone(c) as typeof c & {id?:string};
    delete missingId.id;
    expect(()=>validateCaseImport(missingId)).toThrow(/Unsupported case structure/);
    const bounds=structuredClone(c);
    bounds.metrics[0].min=50;
    bounds.metrics[0].max=2;
    expect(()=>validateCaseImport(bounds)).toThrow(/Invalid indicator/);
    const invalidParam=structuredClone(c);
    invalidParam.options[1].parameterValues.technicalSuccess.value=200;
    expect(()=>validateCaseImport(invalidParam)).toThrow(/Invalid parameter/);
    const duplicateEvidence=structuredClone(c);
    duplicateEvidence.evidence.push({...duplicateEvidence.evidence[0]});
    expect(()=>validateCaseImport(duplicateEvidence)).toThrow(/Invalid evidence/);
  });
  it('requires a real reviewer, date, owner and reference for reviewed evidence', () => {
    const c=createCase();
    const record:EvidenceItem={id:'E1',title:'Baseline report',reference:'REF-12',owner:'Programme',reviewer:'',
      reviewedOn:'2026-11-10',status:'reviewed',nature:'observed',limitations:'Bounded observation'};
    c.evidence=[record];
    expect(evidenceReviewed(c,{value:1,evidenceId:'E1'})).toBe(false);
    c.evidence[0].reviewer='Approved assessor';
    expect(evidenceReviewed(c,{value:1,evidenceId:'E1'})).toBe(true);
    c.evidence[0].status='rejected';
    expect(evidenceReviewed(c,{value:1,evidenceId:'E1'})).toBe(false);
  });
  it('requires linked observed data for both baseline and alternative, all gates and no hypothetical flag', () => {
    const c=fromPreset('ecodesign');
    c.hypothetical=false;
    c.owner='Independent case assessor';
    c.gates={comparableBoundary:true,technicalEligibility:true,measurementMethod:true,independentReview:true};
    c.evidence=[
      {id:'BASE',title:'Observed baseline',reference:'REF-BASE',owner:'Owner',reviewer:'Reviewer',
        reviewedOn:'2026-11-10',status:'reviewed',nature:'observed',limitations:'Defined baseline'},
      {id:'ALT',title:'Observed alternative',reference:'REF-ALT',owner:'Owner',reviewer:'Reviewer',
        reviewedOn:'2026-11-10',status:'reviewed',nature:'observed',limitations:'Comparable scope'}
    ];
    for(const [id,state] of Object.entries(c.parameters)){
      if(state.applicability==='applies'){
        c.options[0].parameterValues[id].evidenceId='BASE';
        c.options[1].parameterValues[id].evidenceId='ALT';
      }
    }
    let result=compareOption(c,c.options[1]);
    expect(result.canDescribeAsMeasured).toBe(true);
    c.evidence[1].nature='estimate';
    result=compareOption(c,c.options[1]);
    expect(result.reviewedData).toBe(true);
    expect(result.canDescribeAsMeasured).toBe(false);
    c.evidence[1].nature='observed';
    c.gates.technicalEligibility=false;
    expect(compareOption(c,c.options[1]).canDescribeAsMeasured).toBe(false);
    c.gates.technicalEligibility=true;
    c.hypothetical=true;
    expect(compareOption(c,c.options[1]).canDescribeAsMeasured).toBe(false);
  });
  it('recalculates transparently when an alternative becomes worse',()=>{
    const c=fromPreset('ecodesign');
    c.options[1].parameterValues.baseRecovery.value=200;
    expect(comparisons(c)[0].verdict).toBe('tradeoff');
  });

  it.each(['general','ecodesign','climate','saf','wildfire'] as const)('provides the same 19 parameters for %s',kind=>{
    const c=kind==='general'?createCase(kind):fromPreset(kind);
    expect(Object.keys(c.parameters)).toHaveLength(19);
    expect(c.options.every(o=>Object.keys(o.parameterValues).length===19)).toBe(true);
  });
  it('does not treat no-aplica values as numeric zero or demand their evidence',()=>{
    const c=fromPreset('ecodesign','es');
    const existing=comparisons(c)[0].rows.find(r=>r.metric.id==='ghgKg');
    expect(existing?.issue).toBeUndefined();
    c.parameters.ghgKg={applicability:'notApplicable',reason:'No se dispone de una frontera GEI comparable'};
    const row=comparisons(c)[0].rows.find(r=>r.metric.id==='ghgKg');
    expect(row?.issue).toBe('excluded');
    expect(row?.delta).toBeNull();
    expect(row?.evidenceReady).toBe(true);
  });
  it('blocks a result when an applicable input is unknown, even if it contains a stale value',()=>{
    const c=fromPreset('saf');
    c.parameters.shockProbability={applicability:'unknown',reason:''};
    const rows=comparisons(c)[0].rows;
    expect(rows.find(r=>r.metric.id==='expectedRecovery')?.issue).toBe('missing');
    expect(rows.find(r=>r.metric.id==='expectedCost')?.issue).toBe('missing');
    expect(comparisons(c)[0].verdict).toBe('incomplete');
  });
  it('marks inconsistent pair applicability as unknown rather than silently removing a term',()=>{
    const c=fromPreset('ecodesign');
    c.parameters.shockDelay={applicability:'notApplicable',reason:'Unrelated to this scenario'};
    const recovery=comparisons(c)[0].rows.find(r=>r.metric.id==='expectedRecovery');
    expect(recovery?.issue).toBe('missing');
  });
  it('changing an applied risk changes derived recovery and costs, but not excluded fields',()=>{
    const c=fromPreset('ecodesign');
    const before=compareOption(c,c.options[1]);
    c.options[1].parameterValues.shockProbability.value=90;
    const after=compareOption(c,c.options[1]);
    expect(after.rows[0].candidate).not.toBe(before.rows[0].candidate);
    expect(after.rows.find(r=>r.metric.id==='expectedCost')?.candidate)
      .not.toBe(before.rows.find(r=>r.metric.id==='expectedCost')?.candidate);
  });
  it('preserves N/A reasons and the nineteen inputs across JSON save and restore',()=>{
    const c=fromPreset('wildfire','es');
    c.parameters.materialKg={applicability:'notApplicable',reason:'No se evalúan materiales'};
    const imported=validateCaseImport(JSON.parse(JSON.stringify(c)));
    expect(imported.parameters.materialKg.reason).toBe('No se evalúan materiales');
    expect(imported.options[0].parameterValues.baseRecovery.value).toBe(40);
  });
  it('round-trips a case JSON through strict versioned validation',()=>{
    const c=fromPreset('wildfire');
    const imported=validateCaseImport(JSON.parse(JSON.stringify(c)));
    expect(imported.options[1].parameterValues.baseRecovery.value).toBe(19);
    expect(imported.evidence).toHaveLength(15);
    expect(imported.evidence.every(e=>e.id.startsWith('SIM-FIRE-'))).toBe(true);
  });
  it('rejects malformed, excessive and non-finite imports',()=>{
    expect(()=>validateCaseImport({})).toThrow();
    const c=fromPreset('saf');
    c.version=2 as never;
    expect(()=>validateCaseImport(c)).toThrow();
    const d=fromPreset('saf');
    d.options[1].measures.resilience.value=Infinity;
    expect(()=>validateCaseImport(d)).toThrow();
  });
});
