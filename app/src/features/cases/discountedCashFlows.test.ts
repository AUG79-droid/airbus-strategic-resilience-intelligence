import {describe,expect,it} from 'vitest';
import {emptyFinancePlan,validateFinancePlan,evaluateDiscountedFinance,type ScenarioCashFlow} from './discountedCashFlows';
import {createCase,validateCaseImport} from './model';
const flow=(id:string,optionId:string,year:number,amountEuro:number,accounting:ScenarioCashFlow['accounting']='incremental'):ScenarioCashFlow=>
  ({id,optionId,year,amountEuro,accounting,evidenceId:'',explanation:'Fictional financial training example'});
describe('Time-valued cash flows: explicit incremental costs',()=>{
  it('discounts euro cash flows deterministically under a declared rate',()=>{
    const plan={annualDiscountPercent:10,flows:[
      flow('a','baseline',1,110),flow('b','baseline',2,121),
      flow('c','option-a',1,220),flow('d','option-a',0,-20)
    ]};
    const baseline=evaluateDiscountedFinance(plan,'baseline');
    const candidate=evaluateDiscountedFinance(plan,'option-a');
    expect(baseline.incrementalPresentValueEuro).toBeCloseTo(200);
    expect(candidate.incrementalPresentValueEuro).toBeCloseTo(180);
    expect(candidate.incrementalPresentValueEuro!-baseline.incrementalPresentValueEuro!).toBeCloseTo(-20);
  });
  it('excludes cash flows flagged as already included in expected cost to avoid duplicates',()=>{
    const plan={annualDiscountPercent:0,flows:[
      flow('a','baseline',1,500,'alreadyIncluded'),
      flow('b','baseline',2,50,'incremental')
    ]};
    const output=evaluateDiscountedFinance(plan,'baseline');
    expect(output.incrementalPresentValueEuro).toBe(50);
    expect(output.excludedAlreadyCountedEuro).toBe(500);
    expect(output.assumptions.join(' ')).toMatch(/double counting/);
  });
  it('does not invent an NPV without declared discount rate',()=>{
    const result=evaluateDiscountedFinance({...emptyFinancePlan(),flows:[flow('a','baseline',1,50)]},'baseline');
    expect(result.status).toBe('notAssessed');
    expect(result.incrementalPresentValueEuro).toBeNull();
  });
  it('validates rates, duplicate IDs, option IDs, dates and non-finite numbers',()=>{
    const valid={annualDiscountPercent:4,flows:[flow('one','option-a',10,300)]};
    expect(validateFinancePlan(valid,['baseline','option-a']).flows).toHaveLength(1);
    expect(()=>validateFinancePlan({...valid,annualDiscountPercent:150},['baseline','option-a'])).toThrow(/discount rate/);
    expect(()=>validateFinancePlan({...valid,flows:[...valid.flows,...valid.flows]},['baseline','option-a'])).toThrow(/cash flow/);
    expect(()=>validateFinancePlan({...valid,flows:[flow('bad','other',1,10)]},['baseline','option-a'])).toThrow(/cash flow/);
    expect(()=>validateFinancePlan({...valid,flows:[flow('bad','baseline',81,10)]},['baseline','option-a'])).toThrow(/cash flow/);
    expect(()=>validateFinancePlan({...valid,flows:[flow('bad','baseline',1,Infinity)]},['baseline','option-a'])).toThrow(/cash flow/);
  });
  it('distinguishes nominal future cash flows from base-year euros and applies escalation only once',()=>{
    const plan={annualDiscountPercent:10,annualEscalationPercent:5,flows:[
      {...flow('constant','baseline',2,100),priceBasis:'baseYear' as const},
      {...flow('nominal','option-a',2,100),priceBasis:'futureNominal' as const}
    ]};
    expect(evaluateDiscountedFinance(plan,'baseline').incrementalPresentValueEuro)
      .toBeCloseTo(100*(1.05/1.1)**2);
    expect(evaluateDiscountedFinance(plan,'option-a').incrementalPresentValueEuro)
      .toBeCloseTo(100/1.1**2);
  });
  it('refuses false present values for constant-price flows without declared price escalation',()=>{
    const plan={annualDiscountPercent:10,flows:[
      {...flow('constant','baseline',2,100),priceBasis:'baseYear' as const}
    ]};
    const result=evaluateDiscountedFinance(plan,'baseline');
    expect(result.status).toBe('notAssessed');
    expect(result.incrementalPresentValueEuro).toBeNull();
    expect(result.assumptions.join(' ')).toMatch(/escalation/);
  });
  it('rejects invalid price basis and escalation but retains legacy nominal cashflows',()=>{
    const one=flow('base','baseline',2,100);
    expect(validateFinancePlan({annualDiscountPercent:10,flows:[one]},['baseline']).annualEscalationPercent).toBeNull();
    expect(evaluateDiscountedFinance({annualDiscountPercent:10,flows:[one]},'baseline').incrementalPresentValueEuro)
      .toBeCloseTo(100/1.1**2);
    expect(()=>validateFinancePlan({annualDiscountPercent:10,annualEscalationPercent:-100,flows:[one]},['baseline']))
      .toThrow(/escalation rate/);
    expect(()=>validateFinancePlan({annualDiscountPercent:10,flows:[{...one,priceBasis:'unknown'}]},['baseline']))
      .toThrow(/cash flow/);
  });
  it('upgrades old strategic cases and preserves new finance records on import',()=>{
    const c=createCase();
    c.discountedFinance={annualDiscountPercent:5,flows:[flow('a','baseline',1,100)]};
    expect(validateCaseImport(c).discountedFinance.flows).toHaveLength(1);
    delete (c as unknown as {discountedFinance?:unknown}).discountedFinance;
    expect(validateCaseImport(c).discountedFinance).toEqual(emptyFinancePlan());
  });
});
