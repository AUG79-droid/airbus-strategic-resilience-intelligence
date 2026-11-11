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
      expect(c.evidence).toHaveLength(0);
      expect(comparisons(c)).toHaveLength(2);
      expect(comparisons(c).every(x=>!x.canDescribeAsMeasured)).toBe(true);
    }
  );
  it('computes baseline versus alternatives without declaring a validated benefit', () => {
    const c=fromPreset('ecodesign');
    const [repair,parallel]=comparisons(c);
    expect(repair.verdict).toBe('improves');
    expect(parallel.verdict).toBe('tradeoff');
    expect(repair.rows[0].delta).toBe(-32);
    expect(repair.reviewedData).toBe(false);
    expect(repair.canDescribeAsMeasured).toBe(false);
  });
  it('shows tradeoffs for SAF and wildfire sample options rather than universal wins', () => {
    expect(comparisons(fromPreset('saf'))[0].verdict).toBe('tradeoff');
    expect(comparisons(fromPreset('wildfire'))[0].verdict).toBe('tradeoff');
  });
  it('does not divide by zero when calculating a relative delta', () => {
    const c=fromPreset('climate');
    const change=compareOption(c,c.options[1]);
    expect(change.rows[2].baseline).toBe(0);
    expect(change.rows[2].percentChange).toBeNull();
  });
  it('rejects invalid percentage values rather than producing optimistic findings', () => {
    const c=fromPreset('saf');
    c.options[1].measures.resilience.value=150;
    const outcome=compareOption(c,c.options[1]);
    expect(outcome.verdict).toBe('incomplete');
    expect(outcome.missing.some(x=>x.includes('missing or invalid'))).toBe(true);
  });
  it('sensitivity is a margin test, never confidence significance', () => {
    const c=fromPreset('ecodesign');
    c.robustnessPercent=100;
    expect(compareOption(c,c.options[1]).rows[0].robustness).toBe('sensitive');
    c.robustnessPercent=0;
    expect(compareOption(c,c.options[1]).rows[0].robustness).toBe('stable');
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
    c.gates={comparableBoundary:true,technicalEligibility:true,measurementMethod:true,independentReview:true};
    c.evidence=[
      {id:'BASE',title:'Observed baseline',reference:'REF-BASE',owner:'Owner',reviewer:'Reviewer',
        reviewedOn:'2026-11-10',status:'reviewed',nature:'observed',limitations:'Defined baseline'},
      {id:'ALT',title:'Observed alternative',reference:'REF-ALT',owner:'Owner',reviewer:'Reviewer',
        reviewedOn:'2026-11-10',status:'reviewed',nature:'observed',limitations:'Comparable scope'}
    ];
    c.metrics.forEach(metric=>{
      c.options[0].measures[metric.id].evidenceId='BASE';
      c.options[1].measures[metric.id].evidenceId='ALT';
    });
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
    c.options[1].measures.resilience.value=200;
    expect(comparisons(c)[0].verdict).toBe('tradeoff');
  });
  it('round-trips a case JSON through strict versioned validation',()=>{
    const c=fromPreset('wildfire');
    const imported=validateCaseImport(JSON.parse(JSON.stringify(c)));
    expect(imported.options[1].measures.resilience.value).toBe(19);
    expect(imported.evidence).toHaveLength(0);
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
