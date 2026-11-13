/**
 * Optional discounted CASH-FLOW add-on for scenario financial analysis.
 * This is a transparent present-value worksheet, not a calibrated
 * financial forecast, discounted lifecycle cost certification or NPV
 * substitute for reviewed programme financial analysis.
 */
export interface ScenarioCashFlow {
  id:string;
  optionId:string;
  year:number;
  amountEuro:number;
  accounting:'incremental'|'alreadyIncluded';
  evidenceId:string;
  explanation:string;
}
export interface DiscountedFinancePlan {
  annualDiscountPercent:number|null;
  flows:ScenarioCashFlow[];
}
export interface DiscountedScenarioCost {
  status:'notAssessed'|'calculated';
  incrementalPresentValueEuro:number|null;
  excludedAlreadyCountedEuro:number;
  flowCount:number;
  assumptions:string[];
}
export const emptyFinancePlan=():DiscountedFinancePlan=>({annualDiscountPercent:null,flows:[]});
export function validateFinancePlan(value:unknown,optionIds:string[]):DiscountedFinancePlan{
  if(value===undefined)return emptyFinancePlan();
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid discounted finance plan');
  const p=value as Partial<DiscountedFinancePlan>;
  if(p.annualDiscountPercent!==null&&(
    typeof p.annualDiscountPercent!=='number'||!Number.isFinite(p.annualDiscountPercent)||
    p.annualDiscountPercent<0||p.annualDiscountPercent>100
  ))throw new Error('Invalid discount rate: expected 0-100% or not assessed');
  if(!Array.isArray(p.flows)||p.flows.length>90)throw new Error('Invalid economic cash flow list');
  const ids=new Set<string>();
  const flows=p.flows.map(flow=>{
    if(!flow||typeof flow!=='object'||typeof flow.id!=='string'||
      !/^[a-zA-Z0-9_-]{1,90}$/.test(flow.id)||ids.has(flow.id)||
      typeof flow.optionId!=='string'||!optionIds.includes(flow.optionId)||
      typeof flow.year!=='number'||!Number.isInteger(flow.year)||flow.year<0||flow.year>80||
      typeof flow.amountEuro!=='number'||!Number.isFinite(flow.amountEuro)||
      Math.abs(flow.amountEuro)>1e12||
      !['incremental','alreadyIncluded'].includes(flow.accounting)||
      typeof flow.evidenceId!=='string'||flow.evidenceId.length>100||
      typeof flow.explanation!=='string'||flow.explanation.length>1200
    )throw new Error('Invalid discounted cash flow entry');
    ids.add(flow.id);
    return flow;
  });
  return {annualDiscountPercent:p.annualDiscountPercent,flows};
}
export function evaluateDiscountedFinance(plan:DiscountedFinancePlan,optionId:string):DiscountedScenarioCost{
  if(plan.annualDiscountPercent===null)return {
    status:'notAssessed',incrementalPresentValueEuro:null,excludedAlreadyCountedEuro:0,
    flowCount:plan.flows.filter(x=>x.optionId===optionId).length,
    assumptions:['Discount rate is not declared. No discounted financial estimate is produced.']
  };
  const selected=plan.flows.filter(x=>x.optionId===optionId);
  const rate=plan.annualDiscountPercent/100;
  const counted=selected.filter(x=>x.accounting==='incremental');
  return {
    status:'calculated',
    incrementalPresentValueEuro:counted.reduce((sum,x)=>sum+x.amountEuro/(1+rate)**x.year,0),
    excludedAlreadyCountedEuro:selected.filter(x=>x.accounting==='alreadyIncluded')
      .reduce((sum,x)=>sum+x.amountEuro,0),
    flowCount:selected.length,
    assumptions:[
      'User-declared annual discount rate and incremental cash flows; not independently verified.',
      'Flows marked already included in expected cost are EXCLUDED from this additional discounted worksheet to avoid double counting.',
      'All flows must use the same currency, functional unit, base-year prices and time origin; this module does not enforce external accounting standards.',
      'Negative flows represent declared recoveries or credits; no stochastic financial risk distribution is inferred.'
    ]
  };
}
