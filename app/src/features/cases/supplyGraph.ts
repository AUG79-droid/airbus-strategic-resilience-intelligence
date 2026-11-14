/**
 * An explicit *topology* check for supplier/repair routes.
 * Not a stochastic reliability model. Naming two suppliers does not prove
 * independence, available capacity or programme qualification.
 */
export interface DependencyRoute {
  id:string;
  optionId:string;
  label:string;
  /** Canonical IDs of upstream dependencies, e.g. processor, refinery,
   * material source, logistics hub. Exclude the common end component. */
  dependencies:string[];
  capacityPercent:number|null;
  qualified:boolean;
  evidenceId:string;
}
export interface RouteGraphResult {
  routes:number;
  qualifiedRoutes:number;
  independentPairs:number;
  overlappingNodes:string[];
  singlePointsOfFailure:string[];
  declaredQualifiedCapacityPercent:number|null;
  reviewedRoutes:number;
  limitations:string[];
}
export function analyzeRoutes(routes:DependencyRoute[],optionId:string,reviewedEvidenceIds:string[]=[]):RouteGraphResult{
  const selected=routes.filter(x=>x.optionId===optionId);
  const usable=selected.filter(x=>x.qualified);
  const count=new Map<string,number>();
  for(const route of usable){
    for(const node of new Set(route.dependencies.map(x=>x.trim().toLowerCase()).filter(Boolean))){
      count.set(node,(count.get(node)??0)+1);
    }
  }
  const overlappingNodes=[...count].filter(([,n])=>n>=2).map(([n])=>n).sort();
  const singlePointsOfFailure=[...count].filter(([,n])=>usable.length>0&&n===usable.length).map(([n])=>n).sort();
  let independentPairs=0;
  for(let i=0;i<usable.length;i++)for(let j=i+1;j<usable.length;j++){
    const a=new Set(usable[i].dependencies.map(x=>x.trim().toLowerCase()).filter(Boolean));
    // Missing topology is unknown, not evidence of independence.
    if(a.size===0||usable[j].dependencies.length===0)continue;
    const common=usable[j].dependencies.some(x=>a.has(x.trim().toLowerCase()));
    if(!common)independentPairs++;
  }
  const capacityKnown=usable.length>0&&usable.every(x=>x.capacityPercent!==null&&x.dependencies.length>0);
  // Do not sum capacity across overlapping/unknown supply chains.
  const declaredQualifiedCapacityPercent=capacityKnown&&overlappingNodes.length===0?
    Math.min(100,usable.reduce((sum,x)=>sum+(x.capacityPercent??0),0)):null;
  const reviewed=new Set(reviewedEvidenceIds);
  const reviewedRoutes=usable.filter(x=>x.evidenceId&&reviewed.has(x.evidenceId)).length;
  const limitations=[
    'Topology matching only: unknown nodes and hidden ownership can introduce shared failure modes.',
    'Capacity is a user-declared nominal ceiling; availability, inventory, qualification and switching delays are not simulated.',
    'Two routes with no matching dependency IDs do not prove operational or statistical independence.'
  ];
  return {routes:selected.length,qualifiedRoutes:usable.length,independentPairs,
    overlappingNodes,singlePointsOfFailure,declaredQualifiedCapacityPercent,
    reviewedRoutes,limitations};
}
export function validateRoutes(value:unknown,allowedOptionIds:string[]):DependencyRoute[]{
  if(value===undefined)return [];
  if(!Array.isArray(value)||value.length>24)throw new Error('Invalid route register');
  const seen=new Set<string>();
  return value.map(raw=>{
    if(!raw||typeof raw!=='object')throw new Error('Invalid route entry');
    const x=raw as Partial<DependencyRoute>;
    if(typeof x.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(x.id)||seen.has(x.id)||
      typeof x.optionId!=='string'||!allowedOptionIds.includes(x.optionId)||
      typeof x.label!=='string'||x.label.length>150||
      !Array.isArray(x.dependencies)||x.dependencies.length>12||
      x.dependencies.some(n=>typeof n!=='string'||!/^[a-zA-Z0-9_-]{1,90}$/.test(n))||
      x.capacityPercent!==null&&(!Number.isFinite(x.capacityPercent)||typeof x.capacityPercent!=='number'||x.capacityPercent<0||x.capacityPercent>100)||
      typeof x.qualified!=='boolean'||typeof x.evidenceId!=='string'||x.evidenceId.length>100)
      throw new Error('Invalid route register field');
    seen.add(x.id);
    return x as DependencyRoute;
  });
}
