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
}
export interface EvidenceItem {
  id: string; title: string; reference: string; owner: string; reviewer: string;
  reviewedOn: string; status: EvidenceStatus; nature: EvidenceNature; limitations: string;
}
export interface ReviewGates {
  comparableBoundary: boolean;
  technicalEligibility: boolean;
  measurementMethod: boolean;
  independentReview: boolean;
}
export interface StrategicCase {
  version: 1;
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
  options: Option[];
  evidence: EvidenceItem[];
  gates: ReviewGates;
  robustnessPercent: number;
  hypothetical: boolean;
}

export interface IndicatorComparison {
  metric: MetricDefinition;
  baseline: number | null;
  candidate: number | null;
  delta: number | null;
  percentChange: number | null;
  improvement: number | null;
  robustness: 'stable' | 'sensitive' | 'insufficient';
  evidenceReady: boolean;
  observedEvidence: boolean;
  issue?: string;
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
      metric('operational','False alerts per 100 events','count','lower','operational',0,100),
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


function makeOptions(metrics: MetricDefinition[]): Option[] {
  return ['Current reference','Alternative A','Alternative B'].map((name,index) => ({
    id: ['baseline','option-a','option-b'][index], name, explanation: '',
    measures: Object.fromEntries(metrics.map(m => [m.id, {value: null,evidenceId:''}]))
  }));
}

export function createCase(kind: CaseKind = 'general', locale:'en'|'es'='en'): StrategicCase {
  const metrics = MODEL_TEMPLATES[kind].metrics.map((m,i)=>({...m,label:locale==='es'?MODEL_TEMPLATES_ES[kind].labels[i]:m.label}));
  return {
    version:1, id: 'CASE-'+Date.now().toString(36), kind, title:'',
    programme:'', decision:'', initiative:'', vulnerability:'', mechanism:'',
    boundary:'', timeHorizon:'', owner:'', metrics,
    options:makeOptions(metrics), evidence:[], gates:emptyGates(),
    robustnessPercent:10, hypothetical:false
  };
}

export function validNumber(value: number | null, def: MetricDefinition): boolean {
  return value !== null && typeof value === 'number' && Number.isFinite(value)
    && (def.min === undefined || value >= def.min) && (def.max === undefined || value <= def.max);
}

export function evidenceReviewed(caseData: StrategicCase, measure: Measure): boolean {
  const record = caseData.evidence.find(x=>x.id===measure.evidenceId);
  return !!record && record.status === 'reviewed' && !!record.reference.trim() &&
    !!record.owner.trim() && !!record.reviewer.trim() && /^\d{4}-\d{2}-\d{2}$/.test(record.reviewedOn) &&
    !!record.title.trim();
}

export function evidenceObserved(caseData: StrategicCase, measure: Measure): boolean {
  const record = caseData.evidence.find(x=>x.id===measure.evidenceId);
  return evidenceReviewed(caseData,measure) && record?.nature === 'observed';
}

export function compareOption(caseData: StrategicCase, candidate: Option): OptionComparison {
  const baseline = caseData.options[0];
  if (!baseline || !caseData.options.some(x=>x.id===candidate.id) || candidate.id===baseline.id) {
    throw new Error('A non-baseline option within the case is required.');
  }
  const missing: string[] = [];
  const rows = caseData.metrics.map((def): IndicatorComparison => {
    const base = baseline.measures[def.id] ?? {value:null,evidenceId:''};
    const alt = candidate.measures[def.id] ?? {value:null,evidenceId:''};
    const baseValid=validNumber(base.value,def),altValid=validNumber(alt.value,def);
    if(!baseValid || !altValid) {
      missing.push(def.label+': missing or invalid comparable input');
      return {metric:def,baseline:baseValid?base.value:null,candidate:altValid?alt.value:null,
        delta:null,percentChange:null,improvement:null,robustness:'insufficient',
        evidenceReady:false,observedEvidence:false,issue:'Missing / out-of-bounds value'};
    }
    const b=base.value as number,a=alt.value as number;
    const delta=a-b;
    const improvement=def.direction==='lower'?b-a:a-b;
    // Absolute uncertainty interval for two independently perturbed inputs.
    // This is a user-selected sensitivity margin, NOT a statistical confidence interval.
    const margin=(Math.abs(a)+Math.abs(b))*caseData.robustnessPercent/100;
    const evidenceReady=evidenceReviewed(caseData,base)&&evidenceReviewed(caseData,alt);
    const observedEvidence=evidenceObserved(caseData,base)&&evidenceObserved(caseData,alt);
    if(!evidenceReady) missing.push(def.label+': reviewed, traceable evidence needed for BOTH values');
    return {
      metric:def, baseline:b,candidate:a,delta,
      percentChange:b===0?null:delta/Math.abs(b)*100,improvement,
      robustness:Math.abs(improvement)>margin?'stable':'sensitive',
      evidenceReady,observedEvidence
    };
  });
  const incomplete=rows.some(x=>x.improvement===null);
  const better=rows.some(x=>x.improvement!==null && x.improvement>1e-9);
  const worse=rows.some(x=>x.improvement!==null && x.improvement < -1e-9);
  const verdict:ComparisonVerdict=incomplete?'incomplete':better&&worse?'tradeoff':
    better?'improves':worse?'worsens':'equivalent';
  const gatesReady=Object.values(caseData.gates).every(Boolean);
  if(!gatesReady) missing.push('Scope, technical, method and reviewer gates are not all confirmed');
  const reviewedData=rows.length>0&&rows.every(x=>x.evidenceReady);
  const observedData=rows.length>0&&rows.every(x=>x.observedEvidence);
  return {
    option:candidate,rows,verdict,gatesReady,reviewedData,observedData,
    // This only identifies a *candidate* for expert acceptance; it does not validate a benefit.
    canDescribeAsMeasured:!caseData.hypothetical && reviewedData && observedData && gatesReady && !incomplete,
    missing
  };
}

export function comparisons(caseData: StrategicCase):OptionComparison[] {
  return caseData.options.slice(1).map(x=>compareOption(caseData,x));
}

export function validateCaseImport(value: unknown): StrategicCase {
  if (!value || typeof value!=='object') throw new Error('Invalid case JSON.');
  const x=value as Partial<StrategicCase>;
  if(x.version!==1 || !Object.keys(MODEL_TEMPLATES).includes(String(x.kind)) ||
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
      (m.min!==undefined && !Number.isFinite(m.min))||(m.max!==undefined && !Number.isFinite(m.max))) throw new Error('Invalid indicator definition');
    ids.add(m.id);
  }
  const optionIds=new Set<string>();
  for(const opt of x.options){
    if(!opt || typeof opt.id!=='string'||optionIds.has(opt.id)||typeof opt.name!=='string'||
      opt.name.length>200||typeof opt.explanation!=='string'||!opt.measures||typeof opt.measures!=='object') throw new Error('Invalid alternative');
    optionIds.add(opt.id);
    for(const m of x.metrics){
      const measure=opt.measures[m.id];
      if(!measure || (measure.value!==null && (typeof measure.value!=='number'||!Number.isFinite(measure.value))) ||
        typeof measure.evidenceId!=='string'||measure.evidenceId.length>100) throw new Error('Invalid measure '+m.id);
    }
  }
  if(!['baseline'].includes(x.options[0].id))throw new Error('Invalid reference alternative');
  if(x.evidence.some(e=>!e||typeof e.id!=='string'||typeof e.title!=='string'||typeof e.reference!=='string'||
      typeof e.owner!=='string'||typeof e.reviewer!=='string'||typeof e.reviewedOn!=='string'||
      typeof e.limitations!=='string'||!['pending','reviewed','rejected'].includes(e.status)||
      !['observed','estimate','method'].includes(e.nature))) throw new Error('Invalid evidence register');
  if(typeof x.robustnessPercent!=='number'||!Number.isFinite(x.robustnessPercent)||
    x.robustnessPercent<0||x.robustnessPercent>100||typeof x.hypothetical!=='boolean') throw new Error('Invalid sensitivity settings');
  if(['comparableBoundary','technicalEligibility','measurementMethod','independentReview'].some(k=>typeof x.gates?.[k as keyof ReviewGates]!=='boolean'))throw new Error('Invalid review gates');
  return structuredClone(x as StrategicCase);
}
