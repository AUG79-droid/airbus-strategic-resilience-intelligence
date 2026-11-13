/**
 * Shared parameter catalogue for ALL custom case families.
 * The same 19 fields always exist, in identical sections and order.
 * Each has a *case-wide* applicability state and a separate value for
 * baseline and each alternative. N/A excludes a mechanism, not a zero.
 * Unknown blocks the derived outputs that depend on it.
 */
export type ParameterSection='operational'|'risk'|'economic'|'contract'|'environmental';
export type Applicability='applies'|'notApplicable'|'unknown';
export interface ParameterDefinition {
  id:string; section:ParameterSection; label:{es:string;en:string};
  unit:string; minimum?:number;maximum?:number;
  explanation:{es:string;en:string}; group?:string;
}
export interface ParameterState { applicability:Applicability; reason:string; }
export interface ParameterMeasurement {value:number|null;evidenceId:string;}
export const SECTION_ORDER:ParameterSection[]=['operational','risk','economic','contract','environmental'];
export const SECTION_NAMES:Record<ParameterSection,{es:string;en:string}>={
  operational:{es:'Condiciones operativas y plazos',en:'Operational conditions and timing'},
  risk:{es:'Riesgos y probabilidades',en:'Risks and probabilities'},
  economic:{es:'Obligaciones económicas',en:'Economic obligations'},
  contract:{es:'Condiciones contractuales',en:'Contractual conditions'},
  environmental:{es:'Factores ambientales',en:'Environmental factors'}
};
function def(id:string,section:ParameterSection,es:string,en:string,unit:string,esHelp:string,enHelp:string,minimum=0,maximum?:number):ParameterDefinition{
  return {id,section,label:{es,en},unit,explanation:{es:esHelp,en:enHelp},minimum,...maximum===undefined?{}:{maximum}};
}
export const UNIVERSAL_PARAMETERS:ParameterDefinition[]=[
  def('baseRecovery','operational','Tiempo operativo de recuperación','Base recovery time','time',
    'Duración de la vía elegida si no hay imprevistos.','Duration of the selected path without disruptions.'),
  def('supplyLead','operational','Plazo condicionante de suministro','Supply lead-time constraint','time',
    'Si aplica, el cálculo toma el mayor de este plazo y el tiempo de recuperación.','If applicable, the model takes the longer of lead time and recovery time.'),
  def('recoveryTarget','operational','Plazo objetivo de recuperación','Recovery deadline','time',
    'Mismo objetivo para todas las alternativas.','Same target for all alternatives.'),
  def('technicalSuccess','risk','Probabilidad de éxito técnico','Technical success probability','%',
    'Si falla la vía elegida, se añade el retraso de contingencia.','A failed selected route adds the fallback delay.',0,100),
  def('failureDelay','risk','Retraso si falla la vía técnica','Delay if technical route fails','time',
    'Aplicable conjuntamente con probabilidad de éxito.','Must be assessed together with technical success.'),
  def('shockProbability','risk','Probabilidad de disrupción externa','External disruption probability','%',
    'Probabilidad de que se materialice un retraso ajeno a la vía técnica.','Likelihood of an independent external delay.',0,100),
  def('shockDelay','risk','Retraso adicional de disrupción','Additional disruption delay','time',
    'Aplicable conjuntamente con probabilidad de disrupción.','Must be assessed together with disruption probability.'),
  def('jointFailureShock','risk','Fallo técnico y disrupción simultáneos','Technical failure AND disruption together','%',
    'Probabilidad CONJUNTA de los dos eventos: no es la probabilidad condicional. Activa este parámetro solo si hay evidencia sobre dependencia; debe respetar los límites matemáticos. Si no aplica se supone independencia de forma explícita.',
    'JOINT likelihood of BOTH events, not a conditional probability. Enable only with dependency evidence; must satisfy mathematical bounds. Otherwise independence is explicitly assumed.',0,100),
  def('baseCost','economic','Coste de la alternativa','Base option cost','€',
    'Coste directo comparable por unidad funcional.','Comparable direct cost per functional unit.'),
  def('downtimeRate','economic','Coste por unidad de tiempo de interrupción','Cost per recovery-time unit','€/time',
    'Opcional: coste incremental por día, hora o minuto según el caso. NO lo actives si ese impacto ya está incluido en el coste base o penalizaciones: evitar doble contabilización. Requiere estimar también el tiempo de recuperación.',
    'Optional incremental cost per day, hour or minute according to this case. DO NOT enable if the same impact is already in baseline cost or penalties: avoid double counting. Requires expected recovery time.'),
  def('logisticsCost','economic','Costes logísticos','Logistics costs','€',
    'Solo costes adicionales no incluidos en el coste base.','Additional logistics not included in base cost.'),
  def('investmentCost','economic','Inversión de adaptación','Adaptation investment','€',
    'Asignación al mismo periodo y unidad que el resto del caso.','Allocation to the same comparison scope and period.'),
  def('shockSurcharge','economic','Sobrecoste si ocurre una disrupción','Disruption surcharge','€',
    'Coste condicional ponderado por la probabilidad de disrupción.','Conditional cost weighted by disruption likelihood.'),
  def('failureCost','economic','Sobrecoste si falla la vía técnica','Technical failure surcharge','€',
    'Coste condicional ponderado por la probabilidad de fallo.','Conditional cost weighted by technical failure likelihood.'),
  def('reservationFee','contract','Coste de reserva o activación','Reservation / activation fee','€',
    'Obligación fija del contrato.','Fixed contractual commitment.'),
  def('cancellationProbability','contract','Probabilidad de cancelación','Cancellation probability','%',
    'Debe aplicarse junto con la penalización de cancelación.','Must be assessed with cancellation fee.',0,100),
  def('cancellationFee','contract','Penalización por cancelación','Cancellation fee','€',
    'Importe condicional multiplicado por su probabilidad.','Conditional amount multiplied by cancellation probability.'),
  def('materialKg','environmental','Material virgen utilizado','Virgin material demand','kg',
    'Cantidad física con igual unidad funcional, no ACV completo.','Physical quantity for equivalent function; not a full LCA.'),
  def('wasteKg','environmental','Residuos generados','Waste generated','kg',
    'Cantidad física en el mismo perímetro.','Physical quantity within the same boundary.'),
  def('ghgKg','environmental','Emisiones de GEI en el perímetro','Bounded greenhouse gas emissions','kg CO₂e',
    'Dato del mismo alcance y metodología, no una emisión certificada por la herramienta.','Same scope and methodology; the tool does not certify emissions.'),
  def('lifeExtension','environmental','Vida útil adicional autorizada','Approved additional service life','hours',
    'Debe estar justificada técnicamente; no se infiere automáticamente.','Must have technical support; not inferred automatically.')
];
export const PARAM_IDS=UNIVERSAL_PARAMETERS.map(p=>p.id);
export const PARAM_GROUPS=[['technicalSuccess','failureDelay'],['shockProbability','shockDelay'],['cancellationProbability','cancellationFee']] as const;
export type ParamMap=Record<string,ParameterState>;
export type ParamValues=Record<string,ParameterMeasurement>;
const activeByKind:Record<string,string[]>={
  general:['baseRecovery','recoveryTarget','shockProbability','shockDelay','baseCost','logisticsCost','materialKg','ghgKg'],
  ecodesign:['baseRecovery','supplyLead','recoveryTarget','technicalSuccess','failureDelay','shockProbability','shockDelay','baseCost','logisticsCost','shockSurcharge','failureCost','cancellationProbability','cancellationFee','materialKg','wasteKg','ghgKg','lifeExtension'],
  climate:['baseRecovery','recoveryTarget','technicalSuccess','failureDelay','shockProbability','shockDelay','baseCost','logisticsCost','investmentCost','shockSurcharge','materialKg','ghgKg'],
  saf:['baseRecovery','supplyLead','recoveryTarget','technicalSuccess','failureDelay','shockProbability','shockDelay','baseCost','logisticsCost','investmentCost','shockSurcharge','reservationFee','cancellationProbability','cancellationFee','ghgKg'],
  wildfire:['baseRecovery','recoveryTarget','technicalSuccess','failureDelay','shockProbability','shockDelay','baseCost','logisticsCost','investmentCost','shockSurcharge','ghgKg']
};
export function defaultParameterStates(kind:string,locale:'en'|'es'='en'):ParamMap{
  const active=activeByKind[kind]??activeByKind.general;
  return Object.fromEntries(UNIVERSAL_PARAMETERS.map(p=>[p.id,{
    applicability:active.includes(p.id)?'applies':'notApplicable',
    reason:active.includes(p.id)?'':(locale==='es'?'Fuera del alcance habitual de este modelo (comprobar al validar).':'Outside the standard scope of this model (verify during review).')
  }]));
}
export function emptyParameterValues():ParamValues{
  return Object.fromEntries(UNIVERSAL_PARAMETERS.map(p=>[p.id,{value:null,evidenceId:''}]));
}
export function timeUnit(kind:string,locale:'es'|'en'):string{
  const unit=kind==='climate'?'hours':kind==='wildfire'?'minutes':'days';
  return displayUnit(unit,locale);
}
export function displayUnit(unit:string,locale:'es'|'en'):string{
  if(locale==='en') return unit==='count'?'count':unit==='time'?'time':unit;
  const values:Record<string,string>={days:'días',hours:'horas',minutes:'minutos',count:'número',time:'tiempo'};
  return values[unit]??unit;
}
export function parameterUnit(unit:string,kind:string,locale:'es'|'en'):string{
  return unit==='time'?timeUnit(kind,locale):displayUnit(unit,locale);
}
export interface JointRiskBranch {
  technicalSuccess:boolean;
  shock:boolean;
  probability:number;
}
/**
 * Joint risk distribution for technical failure F and disruption S.
 * With no explicit P(F∩S), independence is a visible modelling assumption.
 * Reject impossible overlapping probabilities (Fréchet bounds), rather than
 * silently clamping an invalid scenario.
 */
export function jointRiskBranches(successPercent:number,shockPercent:number,
  bothFailureShockPercent?:number|null):JointRiskBranch[]{
  const valid=(n:number)=>Number.isFinite(n)&&n>=0&&n<=100;
  if(!valid(successPercent)||!valid(shockPercent)||
    (bothFailureShockPercent!==null&&bothFailureShockPercent!==undefined&&!valid(bothFailureShockPercent)))
    throw new RangeError('Probabilities must be between 0 and 100 percent');
  const fail=1-successPercent/100;
  const shock=shockPercent/100;
  const both=bothFailureShockPercent===null||bothFailureShockPercent===undefined
    ? fail*shock : bothFailureShockPercent/100;
  const lower=Math.max(0,fail+shock-1);
  const upper=Math.min(fail,shock);
  if(both<lower-1e-10||both>upper+1e-10)
    throw new RangeError('Joint probability violates Fréchet bounds');
  const probability=(value:number)=>Math.max(0,Math.min(1,value));
  return [
    {technicalSuccess:true,shock:false,probability:probability(1-fail-shock+both)},
    {technicalSuccess:true,shock:true,probability:probability(shock-both)},
    {technicalSuccess:false,shock:false,probability:probability(fail-both)},
    {technicalSuccess:false,shock:true,probability:probability(both)}
  ];
}

export type DerivedState='calculated'|'excluded'|'missing'|'invalid';
export interface DerivedValue {state:DerivedState;value:number|null;formula:string;missing:string[];}
export interface CalculatedOption {
  recovery:DerivedValue;deadline:DerivedValue;cost:DerivedValue;
  material:DerivedValue;waste:DerivedValue;ghg:DerivedValue;lifeExtension:DerivedValue;
  assumptions:string[];
}
type ParamOption={parameterValues?:ParamValues};
type ParamCase={parameters?:ParamMap;kind:string};
const result=(state:DerivedState,value:number|null,formula:string,missing:string[]=[]):DerivedValue=>({state,value,formula,missing});
/**
 * A value is read ONLY if the field applies. N/A is a documented exclusion;
 * an unknown field may never silently act as zero.
 */
export function calculateUniversal(c:ParamCase,o:ParamOption):CalculatedOption{
  const states=c.parameters??defaultParameterStates(c.kind);
  const values=o.parameterValues??emptyParameterValues();
  const reasons:string[]=[];
  const read=(id:string):DerivedValue=>{
    const definition=UNIVERSAL_PARAMETERS.find(p=>p.id===id)!;
    const param=states[id]??{applicability:'unknown',reason:''};
    if(param.applicability==='notApplicable'){
      reasons.push(id+': N/A'+(param.reason?' ('+param.reason+')':''));
      return result('excluded',null,'excluded',[]);
    }
    if(param.applicability==='unknown')return result('missing',null,'unknown',[id+': applicability unknown']);
    const v=values[id]?.value;
    if(v===null||v===undefined)return result('missing',null,'missing',[id+': no data']);
    if(!Number.isFinite(v)||v<(definition.minimum??-Infinity)||v>(definition.maximum??Infinity))
      return result('invalid',null,'invalid',[id+': invalid or out of bounds']);
    return result('calculated',v,'entered');
  };
  const cache=new Map<string,DerivedValue>();
  const get=(id:string)=>{if(!cache.has(id))cache.set(id,read(id));return cache.get(id)!;};
  const join=(ids:string[],name:string,fn:(v:(id:string)=>number|null)=>number):DerivedValue=>{
    const chunks=ids.map(get);
    const missing=chunks.filter(x=>x.state==='missing'||x.state==='invalid').flatMap(x=>x.missing);
    if(missing.length)return result('missing',null,name,missing);
    const val=(id:string)=>get(id).state==='excluded'?null:get(id).value;
    const value=fn(val);
    return Number.isFinite(value)?result('calculated',value,name):result('invalid',null,name,['invalid calculated result']);
  };
  // Exclusion is only allowed for entire coherent pairs.
  const paired=(a:string,b:string):string[]=>{
    const x=get(a),y=get(b);
    return (x.state==='excluded') !== (y.state==='excluded')
      ? [a+' / '+b+': inconsistent applicability']: [];
  };
  const pairIssues=[...paired('technicalSuccess','failureDelay'),...paired('shockProbability','shockDelay'),
    ...paired('cancellationProbability','cancellationFee')];
  const invalidPair=(x:DerivedValue):DerivedValue=>
    pairIssues.length?result('missing',null,x.formula,[...x.missing,...pairIssues]):x;
  const recovery=invalidPair(join(
    ['baseRecovery','supplyLead','technicalSuccess','failureDelay','shockProbability','shockDelay'],
    'max(baseRecovery,supplyLead if applicable) + (1-P(success))*failureDelay + P(shock)*shockDelay',
    v=>{
      const base=v('baseRecovery'); if(base===null)return NaN;
      const supply=v('supplyLead');
      const tech=v('technicalSuccess'),failure=v('failureDelay');
      const risk=v('shockProbability'),delay=v('shockDelay');
      return Math.max(base,supply??0)+(tech===null?0:(1-tech/100)*(failure??0))
        +(risk===null?0:risk/100*(delay??0));
    }
  ));
  const deadline=invalidPair(join(
    ['baseRecovery','supplyLead','recoveryTarget','technicalSuccess','failureDelay','shockProbability','shockDelay','jointFailureShock'],
    'Σ joint-risk branch probability × I(completion<=target); independence only when joint probability is N/A',
    v=>{
      const base=v('baseRecovery'),target=v('recoveryTarget');
      if(base===null||target===null)return NaN;
      const start=Math.max(base,v('supplyLead')??0);
      // Joint overlap requires both underlying risks to be defined.
      const overlap=v('jointFailureShock');
      if(overlap!==null&&(v('technicalSuccess')===null||v('shockProbability')===null))return NaN;
      let branches:JointRiskBranch[];
      try {
        branches=jointRiskBranches(v('technicalSuccess')??100,v('shockProbability')??0,overlap);
      } catch { return NaN; }
      let output=0;
      for(const branch of branches){
        const time=start+(branch.technicalSuccess?0:(v('failureDelay')??0))+
          (branch.shock?(v('shockDelay')??0):0);
        if(time<=target)output+=branch.probability;
      }
      return output*100;
    }
  ));
  const costBasis=invalidPair(join(
    ['baseCost','logisticsCost','investmentCost','shockProbability','shockSurcharge',
      'technicalSuccess','failureCost','reservationFee','cancellationProbability','cancellationFee','downtimeRate'],
    'base + fixed expenses + P(shock)*surcharge + P(failure)*failureCost + P(cancel)*fee + downtimeRate*expectedRecovery (if applicable)',
    v=>{
      if(v('baseCost')===null)return NaN;
      const r=(v('shockProbability')??0)/100,t=(v('technicalSuccess')??100)/100,
        p=(v('cancellationProbability')??0)/100;
      return v('baseCost')!+(v('logisticsCost')??0)+(v('investmentCost')??0)+
        (v('reservationFee')??0)+r*(v('shockSurcharge')??0)+
        (1-t)*(v('failureCost')??0)+p*(v('cancellationFee')??0)+
        (v('downtimeRate')===null?0:v('downtimeRate')!*(recovery.value??NaN));
    }
  ));
  const cost=states.downtimeRate?.applicability==='applies'&&recovery.state!=='calculated'
    ?result('missing',null,costBasis.formula,[
      'Downtime valuation needs a calculated recovery time',...recovery.missing
    ])
    :costBasis;
  // Financial and environmental outputs stay separate; no arbitrary combined score.
  return {
    recovery,deadline,cost,
    material:get('materialKg'),waste:get('wasteKg'),
    ghg:get('ghgKg'),lifeExtension:get('lifeExtension'),
    assumptions:[
      states.jointFailureShock?.applicability==='applies'
        ? 'An explicit joint technical-failure/disruption probability is supplied; it must satisfy Fréchet limits and be supported by evidence.'
        : 'Technical failure and external disruption are assumed independent for deadline probability; this is not a demonstrated property of the scenario.',
      'Expected time and economic cost use additive marginal-event terms; correlations alone do not change these means under this simplifying assumption.',
      states.downtimeRate?.applicability==='applies'
        ? 'Downtime valuation is an assumed incremental € per time unit times expected recovery. Verify contract and avoid double-counting against fixed and conditional costs.'
        : 'No monetary value is attributed to downtime; the expected cost may understate operational consequences.',
      'Calculated outcomes are conditional scenarios, not calibrated predictions.',
      ...reasons
    ]
  };
}
