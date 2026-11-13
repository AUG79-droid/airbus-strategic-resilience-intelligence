import { calculateUniversal, defaultParameterStates, emptyParameterValues, UNIVERSAL_PARAMETERS, type DerivedValue, type ParamMap, type ParamValues } from './universal';
import { validateRoutes, type DependencyRoute } from './supplyGraph';
import { compareEnvironmentalBasis, validateEnvironmentalBasis, type EnvironmentalBasis, type EnvironmentBasisCheck } from './environmentBasis';
import { validateMissionBridges, type MissionBridge } from './missionBridge';
import { emptyFinancePlan, validateFinancePlan, type DiscountedFinancePlan } from './discountedCashFlows';
// Independent custom-case model. This is a transparent comparative calculator, not
// a predictive aerospace certification, LCA, mission-availability or emissions model.
export type CaseKind = 'general' | 'ecodesign' | 'climate' | 'saf' | 'wildfire';
export type Audience = 'defenceCustomer' | 'engineering' | 'programmeManager' | 'executiveLeadership';
export type Phase = 'investigate' | 'challenge' | 'validate' | 'translate';
export type Direction = 'higher' | 'lower';
export type EvidenceStatus = 'pending' | 'reviewed' | 'rejected';
export type EvidenceNature = 'observed' | 'estimate' | 'method';

export interface MetricDefinition {
  id: string;
  label: string;
  unit: string;
  direction: Direction;
  category: 'resilience' | 'environment' | 'cost' | 'operational';
  min?: number;
  max?: number;
}
export interface Measure { value: number | null; evidenceId: string; }
export interface Option {
  id: string; name: string; explanation: string;
  measures: Record<string, Measure>;
  parameterValues: ParamValues;
}
export function displayOptionName(option:Pick<Option,'id'|'name'>,locale:'es'|'en'):string {
  // Translate only built-in default names; preserve user-defined scenario names.
  const defaults:Record<string,{es:string;en:string}>={
    baseline:{es:'Situación actual',en:'Current reference'},
    'option-a':{es:'Alternativa A',en:'Alternative A'},
    'option-b':{es:'Alternativa B',en:'Alternative B'}
  };
  const named=defaults[option.id];
  if(!named)return option.name;
  return option.name===named.es||option.name===named.en?named[locale]:option.name;
}
export interface EvidenceItem {
  id: string; title: string; reference: string; owner: string; reviewer: string;
  reviewedOn: string; status: EvidenceStatus; nature: EvidenceNature; limitations: string;
  /** Optional source provenance declarations; none authenticates a reviewer. */
  documentVersion?:string;
  documentSha256?:string;
  excerptUsed?:string;
  validUntil?:string;
  revokedOn?:string;
}
export interface ReviewGates {
  comparableBoundary: boolean;
  technicalEligibility: boolean;
  measurementMethod: boolean;
  independentReview: boolean;
}
export interface StrategicCase {
  version: 1;
  /** Import schema revision; legacy cases without this field use revision 1. */
  caseSchemaVersion?:2;
  id: string;
  kind: CaseKind;
  title: string;
  programme: string;
  decision: string;
  initiative: string;
  vulnerability: string;
  mechanism: string;
  boundary: string;
  timeHorizon: string;
  owner: string;
  metrics: MetricDefinition[];
  parameters: ParamMap;
  options: Option[];
  evidence: EvidenceItem[];
  gates: ReviewGates;
  robustnessPercent: number;
  hypothetical: boolean;
  /** Optional topology assessment, never a validated recovery or readiness factor. */
  dependencyRoutes: DependencyRoute[];
  environmentalBasis: EnvironmentalBasis[];
  missionBridges: MissionBridge[];
  discountedFinance: DiscountedFinancePlan;
}

export interface IndicatorComparison {
  metric: MetricDefinition;
  baseline: number | null;
  candidate: number | null;
  delta: number | null;
  percentChange: number | null;
  improvement: number | null;
  robustness: 'stable' | 'sensitive' | 'insufficient' | 'equivalent';
  /** Raw delta range under isolated input changes, NOT a confidence interval. */
  sensitivityRange?: {
    minDelta:number;maxDelta:number;
    attemptedScenarios:number;validScenarios:number;invalidScenarios:number;
    switchingParameter?:string;switchingAlternative?:string;switchingValue?:number;
  };
  /** Four coordinated ± input-stress scenarios; not statistical confidence bounds. */
  coordinatedStress?: {minDelta:number;maxDelta:number;validScenarios:number;attemptedScenarios:number;
    /** Scope of the extreme-scenario evaluation, never a confidence score. */
    coverage:'none'|'partial'|'complete'};
  evidenceReady: boolean;
  observedEvidence: boolean;
  issue?: 'excluded' | 'missing';
}
export type ComparisonVerdict = 'incomplete' | 'tradeoff' | 'improves' | 'worsens' | 'equivalent';
export interface OptionComparison {
  option: Option;
  rows: IndicatorComparison[];
  verdict: ComparisonVerdict;
  gatesReady: boolean;
  reviewedData: boolean;
  observedData: boolean;
  canDescribeAsMeasured: boolean;
  environmentCheck: EnvironmentBasisCheck;
  missing: string[];
}

export function emptyGates(): ReviewGates {
  return { comparableBoundary: false, technicalEligibility: false, measurementMethod: false, independentReview: false };
}

const metric = (id: string, label: string, unit: string, direction: Direction,
  category: MetricDefinition['category'], min = 0, max?: number): MetricDefinition =>
  ({ id, label, unit, direction, category, min, ...(max === undefined ? {} : { max }) });

export const MODEL_TEMPLATES: Record<CaseKind, { title: string; guidance: string; requirement: string; metrics: MetricDefinition[] }> = {
  general: {
    title: 'Generic comparative decision model',
    guidance: 'Compare like-for-like outcomes for the same period, unit and scope; edit every KPI to fit your initiative.',
    requirement: 'Verify technical feasibility and a consistent reference scenario before comparing alternatives.',
    metrics: [
      metric('resilience','Time to restore the service','days','lower','resilience'),
      metric('operational','Successful service delivery','%','higher','operational',0,100),
      metric('environment','Material demand per functional unit','kg','lower','environment'),
      metric('cost','Total cost per functional unit','€','lower','cost')
    ]
  },
  ecodesign: {
    title: 'Critical-material and support-resilience model',
    guidance: 'Compare a qualified design/support alternative for the SAME subsystem and lifecycle boundary. Source count alone does not prove independence.',
    requirement: 'Engineering qualification, unchanged functional requirements and programme change-control approval.',
    metrics: [
      metric('resilience','Critical-part replenishment lead time','days','lower','resilience'),
      metric('operational','Qualified independent supply sources','count','higher','operational',0),
      metric('environment','Virgin material per functional unit','kg','lower','environment'),
      metric('cost','Lifecycle support cost per unit','€','lower','cost')
    ]
  },
  climate: {
    title: 'Extreme-condition continuity model',
    guidance: 'Use the SAME platform, mission profile, event severity and observation period across alternatives.',
    requirement: 'Verified operating envelope and environmental-test approval for the specific platform.',
    metrics: [
      metric('resilience','Mission-capable time during the defined event','%','higher','resilience',0,100),
      metric('operational','Recovery after weather disruption','hours','lower','operational'),
      metric('environment','Additional material demand for mitigation','kg','lower','environment'),
      metric('cost','Lifecycle adaptation cost','€','lower','cost')
    ]
  },
  saf: {
    title: 'Fuel-supply and mission-readiness model',
    guidance: 'Use one equivalent mission profile; assess approved fuels, real supply coverage and documented lifecycle factors.',
    requirement: 'Fuel and blend approval for each platform, engines and operating conditions; verified quality and supply.',
    metrics: [
      metric('resilience','Missions with authorised fuel available','%','higher','resilience',0,100),
      metric('operational','Qualified supply locations','count','higher','operational'),
      metric('environment','Lifecycle GHG per equivalent mission','kg CO₂e','lower','environment'),
      metric('cost','Fuel and logistics cost per equivalent mission','€','lower','cost')
    ]
  },
  wildfire: {
    title: 'Crisis detection and coordination model',
    guidance: 'Compare the SAME simulated or observed fire event, region, response organisation and alert criteria.',
    requirement: 'Operator acceptance, secure connectivity and evidence of end-to-end performance in defined conditions.',
    metrics: [
      metric('resilience','Detection to actionable alert','minutes','lower','resilience'),
      metric('operational','Communication uptime during incident','%','higher','operational',0,100),
      metric('falseAlerts','False alerts per 100 events','count','lower','operational',0,100),
      metric('cost','Operating cost per exercise','€','lower','cost')
    ]
  }
};


export const MODEL_TEMPLATES_ES: Record<CaseKind,{title:string;guidance:string;requirement:string;labels:string[]}> = {
  general:{
    title:'Modelo comparativo configurable',
    guidance:'Compara resultados para la misma unidad, periodo y alcance; modifica los indicadores para tu iniciativa.',
    requirement:'Confirmar la viabilidad técnica y una situación de referencia equivalente antes de comparar.',
    labels:['Tiempo para recuperar el servicio','Prestación del servicio lograda','Demanda de material por unidad funcional','Coste total por unidad funcional']
  },
  ecodesign:{
    title:'Modelo de materiales críticos y resiliencia del soporte',
    guidance:'Compara opciones cualificadas para el MISMO subsistema y perímetro de ciclo de vida. Dos proveedores no garantizan independencia.',
    requirement:'Cualificación de Ingeniería, requisitos funcionales equivalentes y aprobación del control de cambios.',
    labels:['Plazo de reposición del componente crítico','Fuentes de suministro independientes cualificadas','Material virgen por unidad funcional','Coste de soporte de ciclo de vida por unidad']
  },
  climate:{
    title:'Modelo de continuidad bajo condiciones extremas',
    guidance:'Utiliza la MISMA plataforma, misión, intensidad meteorológica y periodo de observación en cada alternativa.',
    requirement:'Envolvente operativa comprobada y ensayos ambientales aprobados para la plataforma concreta.',
    labels:['Tiempo con capacidad de misión durante el evento','Recuperación tras la interrupción meteorológica','Demanda adicional de material para la adaptación','Coste de adaptación durante el ciclo de vida']
  },
  saf:{
    title:'Modelo de disponibilidad de combustible y misión',
    guidance:'Usa un perfil de misión equivalente; exige autorización de combustible, cobertura de suministro y factores de ciclo de vida trazables.',
    requirement:'Mezcla y combustible autorizados por plataforma, motores y condiciones; calidad y suministro comprobados.',
    labels:['Misiones con combustible autorizado disponible','Localizaciones de suministro cualificadas','Emisiones de GEI de ciclo de vida por misión equivalente','Coste de combustible y logística por misión']
  },
  wildfire:{
    title:'Modelo de detección y coordinación en crisis',
    guidance:'Compara el MISMO evento o ejercicio, región, organización de respuesta y criterio de alerta.',
    requirement:'Aceptación del operador, conectividad segura y rendimiento integral comprobado en las condiciones definidas.',
    labels:['Tiempo desde la detección hasta una alerta útil','Disponibilidad de comunicaciones durante el incidente','Falsas alarmas por cada 100 eventos','Coste operativo por ejercicio']
  }
};
export function templateInfo(kind:CaseKind, locale:'en'|'es'){
  return locale==='es'?MODEL_TEMPLATES_ES[kind]:MODEL_TEMPLATES[kind];
}


function makeOptions(metrics: MetricDefinition[], locale:'en'|'es'): Option[] {
  const names=locale==='es'?['Situación actual','Alternativa A','Alternativa B']:['Current reference','Alternative A','Alternative B'];
  return names.map((name,index) => ({
    id: ['baseline','option-a','option-b'][index], name, explanation: '',
    measures: Object.fromEntries(metrics.map(m => [m.id, {value: null,evidenceId:''}])),
    parameterValues: emptyParameterValues()
  }));
}

export function createCase(kind: CaseKind = 'general', locale:'en'|'es'='en'): StrategicCase {
  const metrics = MODEL_TEMPLATES[kind].metrics.map((m,i)=>({...m,label:locale==='es'?MODEL_TEMPLATES_ES[kind].labels[i]:m.label}));
  return {
    version:1, caseSchemaVersion:2, id: 'CASE-'+Date.now().toString(36), kind, title:'',
    programme:'', decision:'', initiative:'', vulnerability:'', mechanism:'',
    boundary:'', timeHorizon:'', owner:'', metrics,
    parameters:defaultParameterStates(kind,locale),
    options:makeOptions(metrics,locale), evidence:[], gates:emptyGates(),
    robustnessPercent:10, hypothetical:false, dependencyRoutes:[], environmentalBasis:[], missionBridges:[], discountedFinance:emptyFinancePlan()
  };
}

export function validNumber(value: number | null, def: MetricDefinition): boolean {
  return value !== null && typeof value === 'number' && Number.isFinite(value)
    && (def.min === undefined || value >= def.min) && (def.max === undefined || value <= def.max);
}

export function evidenceReviewed(caseData: StrategicCase, measure: Measure): boolean {
  const record = caseData.evidence.find(x=>x.id===measure.evidenceId);
  return !!record && record.status === 'reviewed' && !!record.reference.trim() &&
    !!record.owner.trim() && !!record.reviewer.trim() &&
    record.owner.trim().toLowerCase()!==record.reviewer.trim().toLowerCase() &&
    /^\d{4}-\d{2}-\d{2}$/.test(record.reviewedOn) &&
    record.reviewedOn<=new Date().toISOString().slice(0,10) &&
    (!record.validUntil||record.validUntil>=new Date().toISOString().slice(0,10)) &&
    !record.revokedOn &&
    !!record.title.trim();
}

export function evidenceObserved(caseData: StrategicCase, measure: Measure): boolean {
  const record = caseData.evidence.find(x=>x.id===measure.evidenceId);
  return evidenceReviewed(caseData,measure) && record?.nature === 'observed';
}

// Source coverage is checked against the parameters actually used in a formula.
const COMPUTED_INDICATORS:{
  id:string; label:string; unit:string; direction:Direction;
  category:MetricDefinition['category']; sourceIds:string[];
}[]=[
  {id:'expectedRecovery',label:'Tiempo medio de recuperación / Expected recovery',unit:'time',direction:'lower',category:'resilience',
    sourceIds:['baseRecovery','supplyLead','technicalSuccess','failureDelay','shockProbability','shockDelay','jointFailureShock','jointExtraDelay']},
  {id:'deadlineAttainment',label:'Probabilidad de cumplir el plazo / Deadline attainment',unit:'%',direction:'higher',category:'operational',
    sourceIds:['baseRecovery','supplyLead','recoveryTarget','technicalSuccess','failureDelay','shockProbability','shockDelay','jointFailureShock','jointExtraDelay']},
  {id:'expectedCost',label:'Coste esperado / Expected cost',unit:'€',direction:'lower',category:'cost',
    sourceIds:['baseCost','logisticsCost','investmentCost','shockProbability','shockSurcharge','technicalSuccess','failureCost',
      'reservationFee','cancellationProbability','cancellationFee','downtimeRate','jointFailureShock','jointExtraCost']},
  {id:'materialKg',label:'Material virgen / Virgin material',unit:'kg',direction:'lower',category:'environment',sourceIds:['materialKg']},
  {id:'wasteKg',label:'Residuos / Waste',unit:'kg',direction:'lower',category:'environment',sourceIds:['wasteKg']},
  {id:'ghgKg',label:'GEI parciales / Bounded GHG',unit:'kg CO₂e',direction:'lower',category:'environment',sourceIds:['ghgKg']},
  {id:'lifeExtension',label:'Vida útil adicional / Additional service life',unit:'hours',direction:'higher',category:'operational',sourceIds:['lifeExtension']}
];
const OUTPUT_KEYS=['recovery','deadline','cost','material','waste','ghg','lifeExtension'] as const;
/**
 * Local, one-at-a-time (OAT) input sensitivity:
 * perturb every applicable contributing parameter in each alternative
 * in both directions, recalculate the model, and check if the signed
 * decision difference changes. This is not a confidence interval and
 * does not test correlated input changes or prove causal robustness.
 */
function localInputSensitivity(
  caseData:StrategicCase, baseline:Option, candidate:Option,
  outputKey:typeof OUTPUT_KEYS[number], sourceIds:string[],
  baseValue:number, candidateValue:number, direction:Direction
):{
  status:IndicatorComparison['robustness'];
  range?:IndicatorComparison['sensitivityRange'];
}{
  const original=(direction==='lower'?1:-1)*(baseValue-candidateValue);
  if(!Number.isFinite(original))return {status:'insufficient'};
  if(caseData.robustnessPercent<=0)return {status:Math.abs(original)<1e-9?'equivalent':'insufficient'};
  const referenceSign=Math.sign(original);
  const startDelta=candidateValue-baseValue;
  let minDelta=startDelta,maxDelta=startDelta;
  let tested=0,attempted=0,invalid=0;
  let switchingParameter:string|undefined,switchingAlternative:string|undefined,switchingValue:number|undefined;
  for(const id of sourceIds){
    if(caseData.parameters[id]?.applicability!=='applies')continue;
    const definition=UNIVERSAL_PARAMETERS.find(p=>p.id===id);
    if(!definition)continue;
    for(const option of [baseline,candidate]){
      const present=option.parameterValues[id]?.value;
      if(typeof present!=='number'||!Number.isFinite(present))continue;
      const step=Math.max(Math.abs(present),1)*caseData.robustnessPercent/100;
      for(const directionStep of [-1,1]){
        const changedValue=Math.max(definition.minimum??-Infinity,
          Math.min(definition.maximum??Infinity,present+directionStep*step));
        if(changedValue===present)continue;
        attempted++;
        const changed:Option={...option,parameterValues:{
          ...option.parameterValues,
          [id]:{...option.parameterValues[id],value:changedValue}
        }};
        const output=calculateUniversal(caseData,changed)[outputKey];
        // Invalid perturbed states (e.g. a joint probability outside Fréchet
        // limits) are not counted as simulated outcomes or proof of stability.
        if(output.state!=='calculated'||output.value===null){invalid++;continue;}
        const nextBaseline=option===baseline?output.value:baseValue;
        const nextCandidate=option===candidate?output.value:candidateValue;
        const delta=nextCandidate-nextBaseline;
        minDelta=Math.min(minDelta,delta);
        maxDelta=Math.max(maxDelta,delta);
        const signed=(direction==='lower'?1:-1)*(nextBaseline-nextCandidate);
        tested++;
        if(referenceSign!==0 && !switchingParameter &&
          (Math.abs(signed)<1e-9||Math.sign(signed)!==referenceSign)){
          switchingParameter=id;
          switchingAlternative=option.id;
          // Bisect the first sign reversal along this one input to return an
          // approximate DECISION THRESHOLD, not merely the stress endpoint.
          let sameSide=present,oppositeSide=changedValue;
          for(let iteration=0;iteration<26;iteration++){
            const midpoint=(sameSide+oppositeSide)/2;
            if(midpoint===sameSide||midpoint===oppositeSide)break;
            const probeOption:Option={...option,parameterValues:{
              ...option.parameterValues,
              [id]:{...option.parameterValues[id],value:midpoint}
            }};
            const trial=calculateUniversal(caseData,probeOption)[outputKey];
            if(trial.state!=='calculated'||trial.value===null)break;
            const x=option===baseline?trial.value:baseValue;
            const y=option===candidate?trial.value:candidateValue;
            const signedTrial=(direction==='lower'?1:-1)*(x-y);
            if(Math.abs(signedTrial)<1e-9||Math.sign(signedTrial)!==referenceSign)
              oppositeSide=midpoint;
            else sameSide=midpoint;
          }
          switchingValue=oppositeSide;
        }
      }
    }
  }
  if(!attempted)return {status:'insufficient'};
  const range={minDelta,maxDelta,attemptedScenarios:attempted,validScenarios:tested,invalidScenarios:invalid,
    switchingParameter,switchingAlternative,switchingValue};
  // One demonstrated sign change is meaningful. But skipping invalid probes
  // cannot justify declaring an option robust or equivalent over the range.
  if(switchingParameter)return {status:'sensitive',range};
  if(!tested||invalid>0)return {status:'insufficient',range};
  if(Math.abs(original)<1e-9)return {status:'equivalent',range};
  return {status:'stable',range};
}

/** Bounded deterministic stress, *not* simulation percentiles.
 * For each input, vary by the configured percentage in the same
 * direction. Evaluate four combinations of reference/alternative
 * upward/downward changes; record valid outcomes only. Important:
 * neither scenario probabilities nor model confidence are estimated.
 */
function coordinatedInputStress(
  data:StrategicCase,base:Option,candidate:Option,
  key:typeof OUTPUT_KEYS[number],sourceIds:string[],
  baselineValue:number,candidateValue:number
):IndicatorComparison['coordinatedStress'] {
  if(data.robustnessPercent<=0)return undefined;
  const change=(option:Option,sign:-1|1):Option=>{
    const values={...option.parameterValues};
    for(const id of sourceIds){
      if(data.parameters[id]?.applicability!=='applies')continue;
      const present=option.parameterValues[id]?.value;
      const def=UNIVERSAL_PARAMETERS.find(p=>p.id===id);
      if(typeof present!=='number'||!Number.isFinite(present)||!def)continue;
      const step=Math.max(Math.abs(present),1)*data.robustnessPercent/100;
      const updated=Math.max(def.minimum??-Infinity,Math.min(def.maximum??Infinity,present+sign*step));
      values[id]={...values[id],value:updated};
    }
    return {...option,parameterValues:values};
  };
  const result=[candidateValue-baselineValue];
  let validScenarios=0;
  for(const baselineSign of [-1,1] as const)for(const optionSign of [-1,1] as const){
    const x=calculateUniversal(data,change(base,baselineSign))[key];
    const y=calculateUniversal(data,change(candidate,optionSign))[key];
    if(x.state!=='calculated'||y.state!=='calculated'||x.value===null||y.value===null)continue;
    result.push(y.value-x.value);
    validScenarios++;
  }
  return {minDelta:Math.min(...result),maxDelta:Math.max(...result),validScenarios,attemptedScenarios:4,
    coverage:validScenarios===0?'none':validScenarios===4?'complete':'partial'};
}

function parameterEvidence(caseData:StrategicCase,option:Option,ids:string[],kind:'reviewed'|'observed'):boolean{
  return ids.filter(id=>caseData.parameters[id]?.applicability==='applies').every(id=>{
    const measure=option.parameterValues[id];
    return !!measure && (kind==='reviewed'?evidenceReviewed(caseData,measure):evidenceObserved(caseData,measure));
  });
}
export function compareOption(caseData: StrategicCase, candidate: Option): OptionComparison {
  const baseline=caseData.options[0];
  if(!baseline||candidate.id===baseline.id||!caseData.options.some(o=>o.id===candidate.id)){
    throw new Error('A non-baseline option within the case is required.');
  }
  const baseOut=calculateUniversal(caseData,baseline);
  const altOut=calculateUniversal(caseData,candidate);
  const missing:string[]=[];
  const rows=COMPUTED_INDICATORS.map((definition,index):IndicatorComparison=>{
    const key=OUTPUT_KEYS[index];
    const b=baseOut[key] as DerivedValue,a=altOut[key] as DerivedValue;
    const metric:MetricDefinition={
      id:definition.id,label:definition.label,unit:definition.unit,
      direction:definition.direction,category:definition.category
    };
    if(b.state==='excluded'&&a.state==='excluded'){
      return {metric,baseline:null,candidate:null,delta:null,percentChange:null,improvement:null,
        robustness:'insufficient',evidenceReady:true,observedEvidence:true,issue:'excluded'};
    }
    if(b.state!=='calculated'||a.state!=='calculated'){
      missing.push(definition.label+': '+[...b.missing,...a.missing].join(', '));
      return {metric,baseline:b.value,candidate:a.value,delta:null,percentChange:null,improvement:null,
        robustness:'insufficient',evidenceReady:false,observedEvidence:false,issue:'missing'};
    }
    const delta=a.value!-b.value!;
    const improvement=definition.direction==='lower'?-delta:delta;
    const sourceIds=definition.id==='expectedCost'&&
      caseData.parameters.downtimeRate?.applicability==='applies'
      ?[...definition.sourceIds,'baseRecovery','supplyLead','failureDelay','shockDelay']
      :definition.sourceIds;
    const sensitivity=localInputSensitivity(caseData,baseline,candidate,key,
      sourceIds,b.value!,a.value!,definition.direction);
    const coordinatedStress=coordinatedInputStress(caseData,baseline,candidate,
      key,sourceIds,b.value!,a.value!);
    const evidenceReady=parameterEvidence(caseData,baseline,sourceIds,'reviewed')&&
      parameterEvidence(caseData,candidate,sourceIds,'reviewed');
    const observedEvidence=parameterEvidence(caseData,baseline,sourceIds,'observed')&&
      parameterEvidence(caseData,candidate,sourceIds,'observed');
    if(!evidenceReady)missing.push(definition.label+': missing traceable review for baseline and alternative');
    return {metric,baseline:b.value,candidate:a.value,delta,
      percentChange:b.value===0?null:delta/Math.abs(b.value!)*100,improvement,
      robustness:sensitivity.status,sensitivityRange:sensitivity.range,coordinatedStress,
      evidenceReady,observedEvidence};
  });
  const active=rows.filter(r=>r.issue!=='excluded');
  const incomplete=active.length===0||active.some(r=>r.improvement===null);
  const better=active.some(r=>r.improvement!==null&&r.improvement>1e-9);
  const worse=active.some(r=>r.improvement!==null&&r.improvement< -1e-9);
  const verdict:ComparisonVerdict=incomplete?'incomplete':better&&worse?'tradeoff':
    better?'improves':worse?'worsens':'equivalent';
  const caseFields=['title','programme','decision','initiative','vulnerability','mechanism','boundary','timeHorizon','owner'] as const;
  const caseDefined=caseFields.every(key=>caseData[key].trim().length>0);
  for(const key of caseFields)if(!caseData[key].trim())missing.push('Investigate: '+key+' is missing');
  const gatesReady=Object.values(caseData.gates).every(Boolean);
  if(!gatesReady)missing.push('Scope, technical, method and reviewer gates are not all confirmed');
  const missingReasons=UNIVERSAL_PARAMETERS.filter(p=>caseData.parameters[p.id].applicability==='notApplicable'&&
    !caseData.parameters[p.id].reason.trim());
  if(missingReasons.length)missing.push('N/A exclusions require a reason: '+missingReasons.map(p=>p.id).join(', '));
  const hasEnvironmentalRows=active.some(row=>row.metric.category==='environment'&&row.issue!=='excluded');
  const environmentCheck=compareEnvironmentalBasis(
    caseData.environmentalBasis?.find(x=>x.optionId===baseline.id),
    caseData.environmentalBasis?.find(x=>x.optionId===candidate.id)
  );
  if(hasEnvironmentalRows&&environmentCheck.status!=='declaredComparable')
    missing.push('Environmental inventory boundary/method not comparable: '+environmentCheck.issues.join(', '));
  const environmentalMethodObserved=!hasEnvironmentalRows||
    [baseline.id,candidate.id].every(id=>{
      const method=caseData.environmentalBasis?.find(x=>x.optionId===id);
      return !!method?.evidenceId&&evidenceObserved(caseData,{value:0,evidenceId:method.evidenceId});
    });
  if(hasEnvironmentalRows&&!caseData.hypothetical&&!environmentalMethodObserved)
    missing.push('Environmental methodology metadata require independently traceable observed evidence for baseline and alternative (user-declared only).');
  const reviewedData=active.length>0&&active.every(r=>r.evidenceReady);
  const observedData=active.length>0&&active.every(r=>r.observedEvidence);
  return {option:candidate,rows,verdict,gatesReady,reviewedData,observedData,
    canDescribeAsMeasured:!caseData.hypothetical&&caseDefined&&reviewedData&&observedData&&
      gatesReady&&!incomplete&&missingReasons.length===0&&
      (!hasEnvironmentalRows||(environmentCheck.status==='declaredComparable'&&environmentalMethodObserved)),
      missing,environmentCheck};
}

export function comparisons(caseData: StrategicCase):OptionComparison[] {
  return caseData.options.slice(1).map(x=>compareOption(caseData,x));
}

export function validateCaseImport(value: unknown): StrategicCase {
  if (!value || typeof value!=='object') throw new Error('Invalid case JSON.');
  const x=value as Partial<StrategicCase>;
  if(x.version!==1 || (x.caseSchemaVersion!==undefined&&x.caseSchemaVersion!==2) || typeof x.id!=='string'|| !/^[a-zA-Z0-9_-]{1,100}$/.test(x.id) ||
    !Object.keys(MODEL_TEMPLATES).includes(String(x.kind)) ||
    typeof x.title!=='string' || !Array.isArray(x.metrics) || !Array.isArray(x.options) ||
    !Array.isArray(x.evidence) || !x.gates || x.options.length!==3 ||
    x.metrics.length<1 || x.metrics.length>8 || x.evidence.length>150) throw new Error('Unsupported case structure.');
  const strings=['title','programme','decision','initiative','vulnerability','mechanism','boundary','timeHorizon','owner'] as const;
  for(const k of strings) if(typeof x[k]!=='string' || x[k].length>4000) throw new Error('Invalid field: '+k);
  const ids=new Set<string>();
  for(const m of x.metrics) {
    if(!m || typeof m.id!=='string'||!/^[a-zA-Z0-9_-]{1,40}$/.test(m.id)||ids.has(m.id)||
      typeof m.label!=='string'||m.label.length>150||typeof m.unit!=='string'||m.unit.length>40||
      !['higher','lower'].includes(m.direction)|| !['resilience','environment','cost','operational'].includes(m.category) ||
      (m.min!==undefined && !Number.isFinite(m.min))||(m.max!==undefined && !Number.isFinite(m.max))||
      (m.min!==undefined&&m.max!==undefined&&m.min>m.max)) throw new Error('Invalid indicator definition');
    ids.add(m.id);
  }
  const optionIds=new Set<string>();
  for(const opt of x.options){
    if(!opt || typeof opt.id!=='string'|| !/^[a-zA-Z0-9_-]{1,100}$/.test(opt.id) ||
      optionIds.has(opt.id)||typeof opt.name!=='string'||
      opt.name.length>200||typeof opt.explanation!=='string'||opt.explanation.length>4000||
      !opt.measures||typeof opt.measures!=='object'||Array.isArray(opt.measures)) throw new Error('Invalid alternative');
    optionIds.add(opt.id);
    for(const m of x.metrics){
      const measure=opt.measures[m.id];
      if(!measure || (measure.value!==null && (typeof measure.value!=='number'||!Number.isFinite(measure.value)||
        (m.min!==undefined&&measure.value<m.min)||(m.max!==undefined&&measure.value>m.max))) ||
        typeof measure.evidenceId!=='string'||measure.evidenceId.length>100) throw new Error('Invalid measure '+m.id);
    }
  }
  if(x.options[0].id!=='baseline'||x.options[1].id!=='option-a'||x.options[2].id!=='option-b')
    throw new Error('Invalid scenario IDs or order: baseline, option-a, option-b expected');
    const evidenceIds=new Set<string>();
  if(x.evidence.some(e=>{
    if(!e||typeof e.id!=='string'|| !/^[a-zA-Z0-9_-]{1,100}$/.test(e.id) ||
      evidenceIds.has(e.id) ||typeof e.title!=='string'||e.title.length>500||
      typeof e.reference!=='string'||e.reference.length>2000||
      typeof e.owner!=='string'||e.owner.length>250||
      typeof e.reviewer!=='string'||e.reviewer.length>250||
      typeof e.reviewedOn!=='string'||e.reviewedOn.length>20||
      typeof e.limitations!=='string'||e.limitations.length>4000||
      (e.documentVersion!==undefined&&(typeof e.documentVersion!=='string'||e.documentVersion.length>120))||
      (e.documentSha256!==undefined&&(typeof e.documentSha256!=='string'||
        (e.documentSha256!==''&&!/^[a-f0-9]{64}$/.test(e.documentSha256))))||
      (e.excerptUsed!==undefined&&(typeof e.excerptUsed!=='string'||e.excerptUsed.length>4000))||
      (e.validUntil!==undefined&&(typeof e.validUntil!=='string'||e.validUntil.length>20))||
      (e.revokedOn!==undefined&&(typeof e.revokedOn!=='string'||e.revokedOn.length>20))||
      !['pending','reviewed','rejected'].includes(e.status)||
      !['observed','estimate','method'].includes(e.nature))return true;
    evidenceIds.add(e.id);
    if(e.reviewedOn){
      if(!/^\d{4}-\d{2}-\d{2}$/.test(e.reviewedOn))return true;
      const d=new Date(e.reviewedOn);
      if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==e.reviewedOn)return true;
    }
    for(const dateValue of [e.validUntil,e.revokedOn]){
      if(dateValue===undefined||dateValue==='')continue;
      if(!/^\d{4}-\d{2}-\d{2}$/.test(dateValue))return true;
      const d=new Date(dateValue);
      if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==dateValue)return true;
    }
    return false;
  })) throw new Error('Invalid evidence register');
  if(typeof x.robustnessPercent!=='number'||!Number.isFinite(x.robustnessPercent)||
    x.robustnessPercent<0||x.robustnessPercent>100||typeof x.hypothetical!=='boolean') throw new Error('Invalid sensitivity settings');
  if(['comparableBoundary','technicalEligibility','measurementMethod','independentReview'].some(k=>typeof x.gates?.[k as keyof ReviewGates]!=='boolean'))throw new Error('Invalid review gates');
  // Upgrade saved cases from the original four-KPI builder safely.
  const upgraded=structuredClone(x as StrategicCase);
  upgraded.caseSchemaVersion=2;
  upgraded.dependencyRoutes=validateRoutes(upgraded.dependencyRoutes,upgraded.options.map(o=>o.id));
  upgraded.environmentalBasis=validateEnvironmentalBasis(upgraded.environmentalBasis,upgraded.options.map(o=>o.id));
  upgraded.missionBridges=validateMissionBridges(upgraded.missionBridges,upgraded.options.map(o=>o.id));
  upgraded.discountedFinance=validateFinancePlan(upgraded.discountedFinance,upgraded.options.map(o=>o.id));
  upgraded.parameters??=defaultParameterStates(upgraded.kind);
  if(!upgraded.parameters||typeof upgraded.parameters!=='object'||Array.isArray(upgraded.parameters))throw new Error('Invalid applicability catalogue');
  // Version-1 JSON files predate the optional joint-event field.
  // Keep them readable and retain explicit independence as the legacy assumption.
  if(!upgraded.parameters.jointFailureShock){
    upgraded.parameters.jointFailureShock={
      applicability:'notApplicable',
      reason:'Legacy model: technical failure and external shock assumed independent / Modelo anterior: independencia supuesta.'
    };
  }
  if(!upgraded.parameters.jointExtraDelay){
    upgraded.parameters.jointExtraDelay={applicability:'notApplicable',reason:'Concurrent-event delay not specified in archived model / Retraso conjunto no especificado en el modelo anterior.'};
  }
  if(!upgraded.parameters.jointExtraCost){
    upgraded.parameters.jointExtraCost={applicability:'notApplicable',reason:'Concurrent-event surcharge not specified in archived model / Sobrecoste conjunto no especificado en el modelo anterior.'};
  }
  if(!upgraded.parameters.downtimeRate){
    upgraded.parameters.downtimeRate={
      applicability:'notApplicable',
      reason:'Legacy model: the monetary value of interruption time was not estimated / El coste de indisponibilidad no se incluía.'
    };
  }
  for(const item of UNIVERSAL_PARAMETERS){
    const p=upgraded.parameters[item.id];
    if(!p||!['applies','notApplicable','unknown'].includes(p.applicability)||
      typeof p.reason!=='string'||p.reason.length>1000)throw new Error('Invalid applicability for '+item.id);
  }
  for(const option of upgraded.options){
    option.parameterValues??=emptyParameterValues();
    if(!option.parameterValues||typeof option.parameterValues!=='object'||Array.isArray(option.parameterValues))throw new Error('Invalid parameter values');
    option.parameterValues.jointFailureShock??={value:null,evidenceId:''};
    option.parameterValues.downtimeRate??={value:null,evidenceId:''};
    option.parameterValues.jointExtraDelay??={value:null,evidenceId:''};
    option.parameterValues.jointExtraCost??={value:null,evidenceId:''};
    for(const p of UNIVERSAL_PARAMETERS){
      const m=option.parameterValues[p.id];
      if(!m||typeof m.evidenceId!=='string'||m.evidenceId.length>100||
        (m.value!==null&&(typeof m.value!=='number'||!Number.isFinite(m.value)||
          m.value<(p.minimum??-Infinity)||m.value>(p.maximum??Infinity))))
        throw new Error('Invalid parameter '+p.id);
    }
  }
  // Evidence references must identify a real entry in this file. A dangling
  // ID is not traceability and must never silently pass the import gate.
  const references=[
    ...upgraded.options.flatMap(opt=>[
      ...Object.values(opt.measures).map(m=>m.evidenceId),
      ...Object.values(opt.parameterValues).map(m=>m.evidenceId)
    ]),
    ...upgraded.dependencyRoutes.map(x=>x.evidenceId),
    ...upgraded.environmentalBasis.map(x=>x.evidenceId),
    ...upgraded.missionBridges.map(x=>x.evidenceId),
    ...upgraded.discountedFinance.flows.map(x=>x.evidenceId)
  ];
  const unresolved=[...new Set(references.filter(id=>id.length>0&&!evidenceIds.has(id)))];
  if(unresolved.length)throw new Error('Unresolved evidence references: '+unresolved.slice(0,12).join(', '));
  return upgraded;
}
