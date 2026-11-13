/**
 * Environmental-inventory comparison gate. Matching metadata makes numerical
 * inventories *comparable in declared scope*, not ISO 14040/44-compliant LCA,
 * verified CO2 savings, environmental causality, or operational certification.
 */
export interface EnvironmentalBasis {
  optionId:string;
  functionalUnit:string;
  period:string;
  boundary:string;
  inventoryMethod:string;
  allocationRule:string;
  factorSourceVersion:string;
  evidenceId:string;
}
export interface EnvironmentBasisCheck {
  status:'missing'|'incompatible'|'declaredComparable';
  issues:string[];
}
const mandatory=['functionalUnit','period','boundary','inventoryMethod','allocationRule','factorSourceVersion'] as const;
const norm=(s:string)=>s.trim().replace(/\s+/g,' ').toLowerCase();
export function compareEnvironmentalBasis(baseline?:EnvironmentalBasis,candidate?:EnvironmentalBasis):EnvironmentBasisCheck {
  if(!baseline||!candidate)return {status:'missing',issues:['Environmental metadata required for baseline and alternative']};
  const missing=mandatory.filter(k=>!norm(baseline[k])||!norm(candidate[k]));
  if(missing.length)return {status:'missing',issues:missing.map(k=>k+': missing for baseline or alternative')};
  const comparable=['functionalUnit','period','boundary','inventoryMethod','allocationRule','factorSourceVersion'] as const;
  const mismatches=comparable.filter(k=>norm(baseline[k])!==norm(candidate[k]));
  if(mismatches.length)return {status:'incompatible',issues:mismatches.map(k=>k+': not the same across alternatives')};
  return {status:'declaredComparable',issues:[
    'Matching user-declared metadata only: source integrity, emission factors, allocation and uncertainty require expert review.'
  ]};
}
export function validateEnvironmentalBasis(value:unknown,ids:string[]):EnvironmentalBasis[]{
  if(value===undefined)return [];
  if(!Array.isArray(value)||value.length>ids.length)throw new Error('Invalid environmental basis list');
  const seen=new Set<string>();
  return value.map(entry=>{
    if(!entry||typeof entry!=='object')throw new Error('Invalid environmental comparison metadata');
    const x=entry as Partial<EnvironmentalBasis>;
    if(typeof x.optionId!=='string'||!ids.includes(x.optionId)||seen.has(x.optionId)||
      mandatory.some(k=>typeof x[k]!=='string'||(x[k] as string).length>1200)||
      typeof x.evidenceId!=='string'||x.evidenceId.length>100)
      throw new Error('Invalid environmental comparison metadata');
    seen.add(x.optionId);
    return x as EnvironmentalBasis;
  });
}
