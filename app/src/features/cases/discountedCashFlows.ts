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
  /** Amount already expressed in future-year EUR, or in constant base-year EUR. */
  priceBasis?:'futureNominal'|'baseYear';
}
export interface DiscountedFinancePlan {
  annualDiscountPercent:number|null;
  /** Only applied to base-year amounts; never inflate already nominal flows. */
  annualEscalationPercent?:number|null;
  flows:ScenarioCashFlow[];
}
export interface DiscountedScenarioCost {
  status:'notAssessed'|'calculated';
  incrementalPresentValueEuro:number|null;
  excludedAlreadyCountedEuro:number;
  flowCount:number;
  assumptions:string[];
}
export const emptyFinancePlan=():DiscountedFinancePlan=>({annualDiscountPercent:null,annualEscalationPercent:null,flows:[]});
export function validateFinancePlan(value:unknown,optionIds:string[]):DiscountedFinancePlan{
  if(value===undefined)return emptyFinancePlan();
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid discounted finance plan');
  const p=value as Partial<DiscountedFinancePlan>;
  if(p.annualDiscountPercent!==null&&(
    typeof p.annualDiscountPercent!=='number'||!Number.isFinite(p.annualDiscountPercent)||
    p.annualDiscountPercent<0||p.annualDiscountPercent>100
  ))throw new Error('Invalid discount rate: expected 0-100% or not assessed');
  if(p.annualEscalationPercent!==undefined&&p.annualEscalationPercent!==null&&(
    typeof p.annualEscalationPercent!=='number'||!Number.isFinite(p.annualEscalationPercent)||
    p.annualEscalationPercent< -99||p.annualEscalationPercent>100
  ))throw new Error('Invalid annual escalation rate: expected -99% to 100% or not assessed');
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
      typeof flow.explanation!=='string'||flow.explanation.length>1200||
      (flow.priceBasis!==undefined&&!['futureNominal','baseYear'].includes(flow.priceBasis))
    )throw new Error('Invalid discounted cash flow entry');
    ids.add(flow.id);
    return flow;
  });
  return {annualDiscountPercent:p.annualDiscountPercent,
    annualEscalationPercent:p.annualEscalationPercent??null,flows};
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
  // A constant-price amount MUST NOT be silently treated as a future nominal
  // amount. Without an explicit escalation assumption, no PV is reported.
  if(counted.some(x=>x.priceBasis==='baseYear')&&
    (plan.annualEscalationPercent===null||plan.annualEscalationPercent===undefined))return {
    status:'notAssessed',incrementalPresentValueEuro:null,excludedAlreadyCountedEuro:0,
    flowCount:selected.length,
    assumptions:['Base-year EUR cash flows require an explicit annual escalation assumption before they can be discounted.']
  };
  const escalation=(plan.annualEscalationPercent??0)/100;
  return {
    status:'calculated',
    incrementalPresentValueEuro:counted.reduce((sum,x)=>{
      const nominal=x.priceBasis==='baseYear'
        ?x.amountEuro*(1+escalation)**x.year:x.amountEuro;
      return sum+nominal/(1+rate)**x.year;
    },0),
    excludedAlreadyCountedEuro:selected.filter(x=>x.accounting==='alreadyIncluded')
      .reduce((sum,x)=>sum+x.amountEuro,0),
    flowCount:selected.length,
    assumptions:[
      'User-declared annual discount rate and incremental cash flows; not independently verified.',
      'Flows marked already included in expected cost are EXCLUDED from this additional discounted worksheet to avoid double counting.',
      'Future-nominal EUR flows are discounted as entered; base-year EUR flows are escalated first at the explicitly declared annual rate. These price bases must not be mixed without review.',
      'All flows must use the same currency, functional unit, reference price year and time origin; this module does not enforce external accounting standards.',
      'Negative flows represent declared recoveries or credits; no stochastic financial risk distribution is inferred.'
    ]
  };
}
