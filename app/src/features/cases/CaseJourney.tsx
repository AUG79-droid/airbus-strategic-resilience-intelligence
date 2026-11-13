import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { downloadText, downloadBytes } from '../export/download';
import type { Locale, ViewId } from '../../app/types';
import {
  comparisons, createCase, displayOptionName, templateInfo,
  type StrategicCase, type CaseKind, type EvidenceItem, type Audience,
  type OptionComparison
} from './model';
import { fromPreset, presetTitle, type PresetKey } from './presets';
import { exportCaseEnvelope, importCaseEnvelope } from './caseIntegrity';
import { UniversalControls } from './UniversalControls';
import { DependencyRoutes } from './DependencyRoutes';
import { RepairCapacity } from './RepairCapacity';
import { EnvironmentalMethod } from './EnvironmentalMethod';
import { MissionBridgeReview } from './MissionBridgeReview';
import { DiscountedFinance } from './DiscountedFinance';
import { evaluateDiscountedFinance, emptyFinancePlan } from './discountedCashFlows';
import { boundedEnvironmentalDifference } from './environmentBasis';
import { evaluateWorkshopCapacity } from './workshopCapacity';
import { pdfSafeText } from './pdfSafeText';
import { sha256EvidenceBlob } from './documentProof';
import { strategicDecisionAnswer, strategicMessage, strategicNarrativeText } from './strategicNarrative';
import { strategicInsights } from './strategicDeepDive';
import { calculateUniversal, parameterUnit, UNIVERSAL_PARAMETERS } from './universal';
import './CaseJourney.css';

type Props = {
  locale: Locale; view: ViewId;
  data: StrategicCase;
  setData: Dispatch<SetStateAction<StrategicCase>>;
};
const caseKinds: CaseKind[]=['general','ecodesign','climate','saf','wildfire'];
const four: PresetKey[]=['ecodesign','climate','saf','wildfire'];
const audiences: Audience[]=['defenceCustomer','engineering','programmeManager','executiveLeadership'];

const kinds: Record<CaseKind,[string,string]> = {
  general:['Otro / modelo configurable','Other / editable model'],
  ecodesign:['Ecodiseño y materiales críticos','Eco-design and critical materials'],
  climate:['Adaptación climática','Climate adaptation'],
  saf:['Combustible sostenible (SAF)','Sustainable aviation fuel (SAF)'],
  wildfire:['Incendios forestales','Wildfire response']
};
const audienceNames:Record<Audience,[string,string]>={
  defenceCustomer:['Cliente de Defensa','Defence Customer'],
  engineering:['Ingeniería','Engineering'],
  programmeManager:['Responsable de Programa','Programme Manager'],
  executiveLeadership:['Dirección','Executive Leadership']
};
const verdicts:Record<OptionComparison['verdict'],[string,string]>={
  incomplete:['Datos insuficientes','Insufficient data'],
  tradeoff:['Compromisos entre indicadores','Trade-offs across indicators'],
  improves:['Mejora en los indicadores introducidos','Improves the entered indicators'],
  worsens:['Empeora en los indicadores introducidos','Worsens the entered indicators'],
  equivalent:['Sin diferencias modelizadas','No modelled differences']
};
const phaseTitles:Record<ViewId,[string,string]>={
  investigate:['01 · Investigar: definir el caso','01 · Investigate: define the case'],
  challenge:['02 · Cuestionar: comparar alternativas','02 · Challenge: compare alternatives'],
  validate:['03 · Comprobar: evidencias y revisión','03 · Check: evidence and review'],
  translate:['04 · Traducir: valor para cada audiencia','04 · Translate: audience-specific value']
};

function present(value:number|null,locale:Locale,digits=1):string {
  return value===null?'—':new Intl.NumberFormat(locale,{maximumFractionDigits:digits}).format(value);
}
function fValue(raw:string):number|null {
  if(raw.trim()==='')return null;
  const n=Number(raw);
  return Number.isFinite(n)?n:null;
}
function safeFilename(data:StrategicCase):string {
  const title=(data.title||'case').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]+/g,'-').slice(0,50);
  return 'ASRI-'+title+'-'+new Date().toISOString().slice(0,10);
}
function metricTitle(label:string,locale:Locale){
  const chunks=label.split(' / ');
  return chunks.length===2?chunks[locale==='es'?0:1]:label;
}
function describeVerdict(c:OptionComparison,locale:Locale){
  return verdicts[c.verdict][locale==='es'?0:1];
}
export function reportText(data:StrategicCase,chosen:OptionComparison,a:Audience,locale:Locale):string{
  const es=locale==='es';
  const lines=[
    '# ASRI — '+(data.title||(es?'Caso estratégico sin título':'Untitled strategic case')),
    '',es?'AVISO: prototipo independiente, no aprobado por Airbus.':'NOTICE: independent prototype, not Airbus approved.',
    es?'RESULTADOS: modelización comparativa, no beneficios validados.':'RESULTS: comparative modelling, not validated benefits.',
    data.hypothetical?(es?'DATOS: 100 % HIPOTÉTICOS.':'DATA: 100% HYPOTHETICAL.'):'',
    '',es?'## 01 Investigar':'## 01 Investigate',
    `${es?'Programa':'Programme'}: ${data.programme}`,`${es?'Decisión':'Decision'}: ${data.decision}`,
    `${es?'Iniciativa':'Initiative'}: ${data.initiative}`,`${es?'Vulnerabilidad':'Vulnerability'}: ${data.vulnerability}`,
    `${es?'Mecanismo':'Mechanism'}: ${data.mechanism}`,`${es?'Alcance':'Scope'}: ${data.boundary}`,
    `${es?'Horizonte':'Horizon'}: ${data.timeHorizon}`,`${es?'Responsable':'Owner'}: ${data.owner}`,
    '',es?'## 02 Cuestionar':'## 02 Challenge',
    `${es?'Referencia':'Baseline'}: ${displayOptionName(data.options[0],locale)}`,`${es?'Alternativa':'Alternative'}: ${displayOptionName(chosen.option,locale)}`,
    `${es?'Resultado':'Verdict'}: ${describeVerdict(chosen,locale)}`,
    ...chosen.rows.map(r=>`- ${metricTitle(r.metric.label,locale)}: ${r.issue==='excluded'?(es?'No aplica':'Not applicable'):`${present(r.baseline,locale)} → ${present(r.candidate,locale)} ${parameterUnit(r.metric.unit,data.kind,locale)} | Δ ${present(r.delta,locale)}`} | ${r.robustness} | ${es?'evidencia':'evidence'}: ${r.evidenceReady?(es?'revisada (declarada)':'reviewed (declared)'):(es?'pendiente':'pending')}${r.sensitivityRange
      ?` | ${es?'rango Δ univariable':'OAT Δ range'}: [${present(r.sensitivityRange.minDelta,locale)}, ${present(r.sensitivityRange.maxDelta,locale)}] (${r.sensitivityRange.validScenarios}/${r.sensitivityRange.attemptedScenarios} ${es?'recalculados válidos':'valid recalculations'})${r.sensitivityRange.invalidScenarios>0?(es?' · COBERTURA INCOMPLETA':' · INCOMPLETE COVERAGE'):''}${r.sensitivityRange.switchingParameter?` | ${es?'umbral aproximado de cambio':'approx switch threshold'}: ${r.sensitivityRange.switchingParameter}=${present(r.sensitivityRange.switchingValue??null,locale)}`:''}`
      :''}${r.coordinatedStress?(r.coordinatedStress.coverage==='none'
        ?` | ${es?'SIN RANGO de estrés':'NO stress range'} (0/4 ${es?'válidos':'valid'})`
        :` | ${es?'rango Δ simultáneo':'coordinated Δ range'} [${present(r.coordinatedStress.minDelta,locale)}, ${present(r.coordinatedStress.maxDelta,locale)}] (${r.coordinatedStress.validScenarios}/4 ${es?'válidos':'valid'})${r.coordinatedStress.coverage==='partial'?(es?' · COBERTURA INCOMPLETA, no es una cota de riesgo':' · INCOMPLETE COVERAGE, not a risk bound'):''}`):''}`),
    `${es?'Prueba de variación individual de parámetros':'One-at-a-time input test'}: ±${data.robustnessPercent} %. ${es?'Cada entrada se modifica por separado; no es un intervalo de confianza.':'Each input is changed separately; not a confidence interval.'}`,
    `${es?'Prueba de escenarios simultáneos':'Coordinated stress test'}: 4 ${es?'combinaciones extremas de entradas de referencia y alternativa':'extreme reference/option input combinations'}, ±${data.robustnessPercent} %. ${es?'Rango determinista, no probabilidad ni intervalo de confianza.':'Deterministic bound, not a probability or confidence interval.'}`,
    '',es?'## Controles y aplicabilidad':'## Universal controls and applicability',
    ...Object.entries(data.parameters).map(([id,state])=>'- '+id+': '+state.applicability+'; '+state.reason),
    ...data.options.flatMap(option=>{
      const calc=calculateUniversal(data,option);
      return [displayOptionName(option,locale)+': '+JSON.stringify(Object.fromEntries(Object.entries(calc).filter(([k])=>k!=='assumptions')))];
    }),
    '',es?'## Comparabilidad ambiental declarada':'## Declared environmental comparability',
    ...data.environmentalBasis.map(x=>`- ${x.optionId}: functionalUnit=${x.functionalUnit}; period=${x.period}; boundary=${x.boundary}; method=${x.inventoryMethod}; allocation=${x.allocationRule}; factorVersion=${x.factorSourceVersion}; uncertaintyPercent=${x.relativeUncertaintyPercent??'N/A'}; evidence=${x.evidenceId||'unlinked'}`),
    ...chosen.rows.filter(row=>row.metric.category==='environment'&&row.baseline!==null&&row.candidate!==null).map(row=>{
      const bound=boundedEnvironmentalDifference(row.baseline!,row.candidate!,
        data.environmentalBasis.find(x=>x.optionId===data.options[0].id),
        data.environmentalBasis.find(x=>x.optionId===chosen.option.id));
      return `- ${row.metric.id}: ${es?'incertidumbre de la diferencia':'difference uncertainty'}=${bound.status}; Δrange=[${bound.minDelta??'N/A'},${bound.maxDelta??'N/A'}]; ${es?'NO es un intervalo de confianza':'NOT a confidence interval'}`;
    }),
    '',es?'## Flujos de caja descontados adicionales (opcional)':'## Additional discounted cash flows (optional)',
    `${es?'Tasa anual de descuento declarada':'User-declared annual discount rate'}: ${data.discountedFinance.annualDiscountPercent??'N/A'}%`,
    `${es?'Escalación anual declarada para euros constantes':'Declared annual escalation for constant-price EUR'}: ${data.discountedFinance.annualEscalationPercent??'N/A'}%`,
    ...data.options.map(option=>{
      const result=evaluateDiscountedFinance(data.discountedFinance,option.id);
      return `- ${displayOptionName(option,locale)}: ${result.status==='calculated'
        ?`${present(result.incrementalPresentValueEuro,locale)} EUR ${es?'de valor actual incremental':'incremental present value'}`
        :es?'Valor actual no evaluado':'Present value not assessed'}`;
    }),
    ...data.discountedFinance.flows.map(flow=>`- ${flow.optionId} / ${flow.id}: year=${flow.year}; netEUR=${flow.amountEuro}; priceBasis=${flow.priceBasis??'futureNominal'}; account=${flow.accounting}; evidence=${flow.evidenceId||'unlinked'}; ${flow.explanation}`),
    `${es?'Un importe nominal futuro NO recibe escalación adicional; uno de euros constantes exige tasa explícita. No hay validación financiera ni contractual':'A future nominal amount is NOT escalated again; constant-price EUR requires an explicit escalation rate. Financial and contractual validation remains outstanding'}.`,
    '',es?'## Relación entre componente y misión':'## Component-to-mission evidence bridge',
    ...(data.missionBridges.length
      ?data.missionBridges.map(link=>`- ${link.optionId}: ${link.componentOrService} > ${link.subsystem} > ${link.platform} > ${link.missionFunction}; dependency=${link.dependencyType}; USER-DECLARED mission availability=${link.observedMissionAvailabilityPercent??'not measured'}%; metricDefinition=${link.availabilityDefinition||'not defined'}; observationPeriod=${link.observationPeriod||'not declared'}; evidence=${link.evidenceId||'none'}`)
      :[es?'Sin evaluación de disponibilidad de misión. No se infiere a partir de la recuperación del componente.':'Mission availability not assessed. Never inferred from component recovery.']),
    '',es?'## Capacidad de taller y cola FIFO (ilustrativa)':'## Repair-workshop capacity and FIFO queue (illustrative)',
    ...data.workshopCapacity.map(x=>{
      const r=evaluateWorkshopCapacity(x);
      return `- ${x.optionId}: bays=${x.availableBays}; jobsAhead=${x.jobsAhead}; backlogServiceTime=${x.serviceTimePerBacklogJob}; targetServiceTime=${x.targetServiceTime}; conditionalWait=${r.waitingTime??'N/A'}; conditionalCompletion=${r.completionTime??'N/A'}; evidence=${x.evidenceId||'unlinked'}`;
    }),
    `${es?'NO suma al tiempo medio de recuperación y no representa capacidad validada ni una cola predictiva':'NOT added to mean recovery time; not validated capacity or a predictive queue'}.`,
    '',es?'## Dependencias de rutas':'## Supply and repair dependencies',
    ...(data.dependencyRoutes.length
      ?data.dependencyRoutes.map(route=>`- ${route.optionId} / ${route.label}: ${route.qualified?'qualified (user-declared)':'unqualified'}; nodes=[${route.dependencies.join(', ')}]; declaredCapacity=${route.capacityPercent??'not specified'}%; evidence=${route.evidenceId||'unlinked'}`)
      :[es?'Dependencias no evaluadas; la independencia no está acreditada.':'Dependencies not assessed; independence not demonstrated.']),
    '',es?'## 03 Comprobar':'## 03 Check',
    `${es?'Controles de revisión declarados':'User-declared review gates'}: ${JSON.stringify(data.gates)}`,
    `${es?'Trazabilidad documental':'Evidence trace'}: ${chosen.reviewedData?(es?'todas las entradas asociadas a registros revisados (declarados)':'all inputs linked to user-declared reviewed records'):(es?'incompleta':'incomplete')}`,
    `${es?'Mediciones observadas':'Observed measurements'}: ${chosen.observedData?(es?'asociadas a todos los valores comparados':'linked for all compared values'):(es?'no confirmadas':'not confirmed')}`,
    ...chosen.missing.map(m=>'- '+m),
    ...data.evidence.map(e=>`- ${e.id}: ${e.title} | ${e.status} / ${e.nature} | ${e.reference} | ${e.owner} | ${e.reviewer} ${e.reviewedOn} | ${es?'versión':'version'}=${e.documentVersion||(es?'no indicada':'not declared')} | sha256=${e.documentSha256||(es?'no indicada':'not declared')} | ${es?'vigencia':'expiry'}=${e.validUntil||(es?'sin fecha':'none')} | ${es?'revocación':'revoked'}=${e.revokedOn||(es?'no':'no')} | ${es?'fragmento':'excerpt'}=${e.excerptUsed||(es?'no facilitado':'not supplied')} | ${es?'limitaciones':'limitations'}=${e.limitations}`),
    '',es?'## 04 Traducir':'## 04 Translate',
    `${es?'Audiencia':'Audience'}: ${audienceNames[a][es?0:1]}`,
    strategicNarrativeText(data,chosen,a,locale),
    '',es?'### Conclusiones estratégicas ampliadas':'### Extended strategic conclusions',
    ...strategicInsights(data,chosen,a,locale).flatMap(item=>['', '#### '+item.title,item.body]),
    '',es?'LÍMITE: ningún cálculo es una prueba de causalidad o aprobación técnica.':'BOUNDARY: calculations do not establish causality or technical approval.',
  ];
  return lines.join('\n');
}
async function downloadReportPdf(text:string, filename:string):Promise<void>{
  const [{ PDFDocument, rgb }, {default: fontkit}]=await Promise.all([
    import('pdf-lib'),import('@pdf-lib/fontkit')
  ]);
  const doc=await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fetchFont=async(filename:string):Promise<Uint8Array>=>{
    const response=await fetch(import.meta.env.BASE_URL+'fonts/'+filename);
    if(!response.ok)throw new Error('Bundled PDF font unavailable: '+filename);
    return new Uint8Array(await response.arrayBuffer());
  };
  // Locally bundled OFL-licensed font: no third-party network request or
  // runtime font service. UTF-8 scientific characters remain selectable text.
  const [regularBytes,boldBytes]=await Promise.all([
    fetchFont('Lato-Regular.ttf'),fetchFont('Lato-Bold.ttf')
  ]);
  const font=await doc.embedFont(regularBytes,{subset:true});
  const fontBold=await doc.embedFont(boldBytes,{subset:true});
  const rawFont=fontkit.create(regularBytes);
  const clean=(value:string)=>Array.from(value,ch=>
    rawFont.hasGlyphForCodePoint(ch.codePointAt(0)!)?ch:pdfSafeText(ch)).join('');
  const A4:[number,number]=[595.28,841.89];
  let page=doc.addPage(A4),y=A4[1]-42;
  const maxWidth=A4[0]-76;
  for(const raw of text.split('\n')){
    const bold=raw.startsWith('#')||raw.startsWith('NOTICE:')||raw.startsWith('AVISO:');
    const size=raw.startsWith('# ')?16:raw.startsWith('## ')?12:10;
    const face=bold?fontBold:font;
    const actual=bold?raw.replace(/^#+\s*/,''):raw;
    const words=clean(actual).split(/\s+/).filter(Boolean);
    const pieces:string[]=[];
    let line='';
    for(const word of words){
      const candidate=line?line+' '+word:word;
      if(face.widthOfTextAtSize(candidate,size)<=maxWidth){line=candidate;continue;}
      if(line){pieces.push(line);line='';}
      let rest=word;
      while(rest&&face.widthOfTextAtSize(rest,size)>maxWidth){
        let part='';
        for(const ch of rest){
          if(part&&face.widthOfTextAtSize(part+ch,size)>maxWidth)break;
          part+=ch;
        }
        pieces.push(part);
        rest=rest.slice(part.length);
      }
      line=rest;
    }
    if(line)pieces.push(line);
    if(pieces.length===0)pieces.push('');
    for(const part of pieces){
      if(y<47){page=doc.addPage(A4);y=A4[1]-42;}
      if(part)page.drawText(part,{x:38,y,size,font:face,color:rgb(.13,.19,.17)});
      y-=size+5;
    }
    y-=raw.startsWith('#')?9:3;
  }
  const bytes=await doc.save();
  downloadBytes(bytes,filename+'.pdf','application/pdf');
}

export function CaseJourney({locale,view,data,setData}:Props){
  const es=locale==='es',t=(spanish:string,english:string)=>es?spanish:english;
  const [selectedAudience,setSelectedAudience]=useState<Audience>('defenceCustomer');
  const [selectedOption,setSelectedOption]=useState('option-a');
  const [message,setMessage]=useState('');
  const [exportBusy,setExportBusy]=useState(false);
  const results=useMemo(()=>comparisons(data),[data]);
  const active=results.find(r=>r.option.id===selectedOption)??results[0];
  const strategic=active?strategicMessage(data,active,selectedAudience,locale):null;
  const deepDive=active?strategicInsights(data,active,selectedAudience,locale):[];
  // An exercise can be COMPLETE as a simulation without being validated
  // as a factual programme result. This distinction must never be hidden.
  const exerciseComplete=(c:OptionComparison)=>
    data.hypothetical&&data.evidence.some(item=>item.id.startsWith('SIM-'))&&c.reviewedData&&c.gatesReady&&c.missing.length===0;
  const setField=(key:keyof StrategicCase,value:unknown)=>setData(current=>({...current,[key]:value}));
  const patchOption=(id:string,key:'name'|'explanation',value:string)=>setData(current=>({
    ...current,options:current.options.map(o=>o.id===id?{...o,[key]:value}:o)
  }));
  const patchEvidence=(id:string,patch:Partial<EvidenceItem>)=>setData(current=>({
    ...current,evidence:current.evidence.map(e=>e.id===id?{...e,...patch}:e)
  }));
  const removeEvidence=(id:string)=>setData(current=>({
    ...current,evidence:current.evidence.filter(e=>e.id!==id),
    options:current.options.map(o=>({
      ...o,
      measures:Object.fromEntries(Object.entries(o.measures).map(([k,v])=>[k,v.evidenceId===id?{...v,evidenceId:''}:v])),
      parameterValues:Object.fromEntries(Object.entries(o.parameterValues).map(([k,v])=>[k,v.evidenceId===id?{...v,evidenceId:''}:v]))
    })),
    dependencyRoutes:current.dependencyRoutes.map(r=>r.evidenceId===id?{...r,evidenceId:''}:r),
    environmentalBasis:current.environmentalBasis.map(e=>e.evidenceId===id?{...e,evidenceId:''}:e),
    missionBridges:current.missionBridges.map(m=>m.evidenceId===id?{...m,evidenceId:''}:m),
    discountedFinance:{...current.discountedFinance,
      flows:current.discountedFinance.flows.map(f=>f.evidenceId===id?{...f,evidenceId:''}:f)},
    workshopCapacity:current.workshopCapacity.map(f=>f.evidenceId===id?{...f,evidenceId:''}:f)
  }));
  const addEvidence=()=>{
    setData(current=>({...current,evidence:[...current.evidence,{
      id:'EV-'+crypto.randomUUID(),
      title:'',reference:'',owner:'',reviewer:'',reviewedOn:'',
      status:'pending',nature:'estimate',limitations:''
    }]}));
  };
  const chooseKind=(kind:CaseKind)=>{setData(createCase(kind,locale));setSelectedOption('option-a');setMessage('');};
  const loadPreset=(kind:PresetKey)=>{setData(fromPreset(kind,locale));setSelectedOption('option-a');setMessage('');};
  const convertToReal=()=>setData(current=>({
    ...current,
    id:'CASE-'+Date.now().toString(36),hypothetical:false,programme:'',owner:'',
    gates:{comparableBoundary:false,technicalEligibility:false,measurementMethod:false,independentReview:false},
    evidence:[],dependencyRoutes:[],environmentalBasis:[],missionBridges:[],workshopCapacity:[],
    discountedFinance:emptyFinancePlan(),
    options:current.options.map(o=>({
      ...o,
      measures:Object.fromEntries(current.metrics.map(m=>[m.id,{value:null,evidenceId:''}])),
      parameterValues:Object.fromEntries(Object.keys(o.parameterValues).map(id=>[id,{value:null,evidenceId:''}]))
    }))
  }));
  const importCase=async(file?:File)=>{
    if(!file)return;
    if(file.size>2_000_000){setMessage(t('Archivo demasiado grande (máximo 2 MB).','File too large (2 MB max).'));return;}
    try{
      const {data,verifiedIntegrity}=await importCaseEnvelope(await file.text());
      setData(data);setSelectedOption('option-a');
      setMessage(verifiedIntegrity
        ?t('Caso cargado. Integridad del archivo comprobada (no equivale a aprobación de evidencias).',
          'Case loaded. File integrity verified (this does not approve the underlying evidence).')
        :t('Caso antiguo cargado sin huella de integridad. Comprueba la procedencia y las evidencias.',
          'Legacy case loaded without an integrity checksum. Check its origin and evidence.'));
    }catch(e){setMessage(t('Archivo no válido: ','Invalid file: ')+String(e));}
  };
  const exportJson=async()=>{
    try{
      const archived=await exportCaseEnvelope(data);
      downloadText(archived,safeFilename(data)+'.json','application/json');
      setMessage(t('JSON exportado con huella SHA-256 (integridad, no firma ni aprobación).',
        'JSON exported with SHA-256 checksum (integrity only, not a signature or approval).'));
    }catch(error){setMessage(t('No se pudo exportar el JSON: ','Could not export JSON: ')+String(error));}
  };
  const exportMarkdown=()=>{
    if(!active)return;
    downloadText(reportText(data,active,selectedAudience,locale),safeFilename(data)+'.md','text/markdown;charset=utf-8');
  };
  const exportPdf=async()=>{
    if(!active)return;
    setExportBusy(true);
    try{await downloadReportPdf(reportText(data,active,selectedAudience,locale),safeFilename(data));setMessage(t('PDF generado (borrador sujeto a validación).','PDF generated (draft subject to validation).'));}
    catch(e){setMessage(t('Error al generar PDF: ','PDF generation failed: ')+String(e));}
    finally{setExportBusy(false);}
  };
  const input=(field:keyof StrategicCase,label:string,placeholder='')=>(
    <label className="cy-field" key={String(field)}>
      <span>{label}</span>
      <textarea data-case-field={field} rows={field==='initiative'||field==='mechanism'?5:field==='boundary'||field==='decision'||field==='vulnerability'?4:3} value={String(data[field]??'')}
        placeholder={placeholder} onChange={e=>setField(field,e.target.value)} />
    </label>
  );
  const sampleWarning=t(
    'EJEMPLO HIPOTÉTICO. Cifras creadas para practicar: no son datos ni resultados de Airbus.',
    'HYPOTHETICAL CASE. Figures exist for practice only; they are not Airbus data or outcomes.'
  );
  return <section className="cy-root" data-testid="custom-case-journey" aria-label={t('Crea tu propio caso estratégico','Create your own strategic case')}>
    <header className="cy-intro">
      <p className="kicker">{t('CREA TU PROPIO CASO ESTRATÉGICO','CREATE YOUR OWN STRATEGIC CASE')}</p>
      <h2>{phaseTitles[view][es?0:1]}</h2>
      <p>{t('Un mismo caso recorre las cuatro etapas. Empieza con tu iniciativa, compara con una situación de referencia, registra evidencias y genera argumentos para el público seleccionado.',
        'One case follows all four stages: frame the initiative, compare against a baseline, review evidence and translate findings for a decision audience.')}</p>
      <p className="cy-help">{t('Puedes guardar una copia de tu caso desde el apartado opcional de guardado para continuar trabajando más adelante.',
        'You can save a copy of your case in the optional save section and resume work later.')}</p>
    </header>

    {view==='investigate' && <div className="cy-stage">
      <section className="cy-panel cy-start-panel">
        <h3>{t('Opción 1 · Crear un caso nuevo','Option 1 · Create a new case')}</h3>
        <p>{t('Para analizar una iniciativa propia. Empezarás con una ficha vacía y elegirás el tipo de análisis más abajo.','For your own initiative. Start with a blank case and choose its analysis type in the case form below.')}</p>
        <button className="cy-create-case" type="button" onClick={()=>chooseKind('general')}>
          {t('Crear un caso nuevo','Create a new case')} <span aria-hidden="true">→</span>
        </button>
      </section>
      <section className="cy-panel">
        <h3>{t('Opción 2 · Practicar con cuatro ejemplos','Option 2 · Explore four example cases')}</h3>
        <p>{t('Selecciona un ejemplo ya preparado: la ficha y los valores hipotéticos se rellenarán automáticamente y podrás recorrer las cuatro etapas.','Select a prepared example: its case definition and illustrative values will load automatically for the full four-stage journey.')}</p>
        <div className="cy-preset-grid">{four.map(id=><button type="button" key={id} onClick={()=>loadPreset(id)}>
          <strong>{kinds[id][es?0:1]}</strong><span>{presetTitle(id,locale)}</span>
        </button>)}</div>
        {data.hypothetical&&<p className="cy-example-notice">{sampleWarning}{' '}
          <button type="button" onClick={convertToReal}>{t('Convertirlo en plantilla vacía para datos reales','Convert to an empty real-data template')}</button>
        </p>}
      </section>
      <section className="cy-panel">
        <h3>{t('Ficha del caso','Case definition')}</h3>
        {!data.hypothetical ? <label className="cy-field cy-case-type"><span>{t('Tipo de análisis para tu caso','Type of analysis for your case')}</span>
          <select value={data.kind} onChange={e=>chooseKind(e.target.value as CaseKind)}>
            {caseKinds.map(kind=><option key={kind} value={kind}>{kinds[kind][es?0:1]}</option>)}
          </select>
          <small>{t('Elige la temática adecuada; cambiarla empezará una ficha nueva para evitar mezclar datos de modelos diferentes. Si ninguna encaja, utiliza «Otro / modelo configurable».',
            'Choose the relevant subject. Changing it starts a new form to avoid mixing different models. Use “Other / editable model” if none fits.')}</small>
        </label> : <p className="cy-help"><strong>{t('Ejemplo seleccionado:','Selected example:')}</strong> {kinds[data.kind][es?0:1]} · {t('Datos hipotéticos','Hypothetical data')}</p>}
        <p className="cy-help">{templateInfo(data.kind,locale).guidance}</p>
        <div className="cy-fields">
          {input('title',t('Nombre del caso','Case title'),'e.g. Fuel supply resilience')}
          {input('programme',t('Producto, programa o actividad','Product, programme or activity'))}
          {input('decision',t('Decisión concreta que se debe tomar','Decision to be made'))}
          {input('initiative',t('Iniciativa de sostenibilidad','Sustainability initiative'))}
          {input('vulnerability',t('Vulnerabilidad estratégica','Strategic vulnerability'))}
          {input('mechanism',t('Cómo podría reducir la vulnerabilidad','How it might mitigate the vulnerability'))}
          {input('boundary',t('Alcance y situación comparable','Comparison boundary / functional unit'))}
          {input('timeHorizon',t('Periodo de análisis','Assessment period'))}
          {input('owner',t('Equipo responsable','Owning team'))}
        </div>
        <p className="cy-help"><strong>{t('Requisito específico:','Specific requirement:')}</strong> {templateInfo(data.kind,locale).requirement}</p>
        <p className="cy-help">{t('Siguiente etapa: tendrás que introducir una referencia y dos alternativas con datos comparables.','Next: enter comparable values for a reference and two alternatives.')}</p>
      </section>
    </div>}

    {view==='challenge' && <div className="cy-stage">
      {data.hypothetical&&<p className="cy-example-notice">{sampleWarning}</p>}
      <section className="cy-panel">
        <h3>{t('Alternativas que vas a comparar','Alternatives to compare')}</h3>
        <p>{t('Utiliza la misma unidad funcional, periodo y alcance en todas las alternativas. Estos nombres y descripciones pueden editarse en cualquier caso.',
          'Use the same unit, period and boundary for all alternatives. You can edit these names and descriptions for any case.')}</p>
        <div className="cy-options-notes">{data.options.map(o=><div className="cy-option-definition" key={o.id}>
          <label className="cy-field"><span>{o.id==='baseline'?t('Situación de referencia','Baseline'):t('Alternativa','Alternative')}</span>
            <input value={displayOptionName(o,locale)} onChange={e=>patchOption(o.id,'name',e.target.value)}/></label>
          <label className="cy-field"><span>{t('Descripción y supuestos','Description and assumptions')}</span>
            <textarea rows={3} value={o.explanation} onChange={e=>patchOption(o.id,'explanation',e.target.value)}/></label>
        </div>)}</div>
      </section>
      <UniversalControls locale={locale} data={data} setData={setData}/>
      <DependencyRoutes locale={locale} data={data} setData={setData}/>
      <RepairCapacity locale={locale} data={data} setData={setData}/>
      <EnvironmentalMethod locale={locale} data={data} setData={setData}/>
      <MissionBridgeReview locale={locale} data={data} setData={setData}/>
      <DiscountedFinance locale={locale} data={data} setData={setData}/>
      <section className="cy-panel">
        <h3>{t('Comparación de las alternativas','Comparison of alternatives')}</h3>
        <p>{t('Los indicadores se calculan con los controles anteriores. Los que no aplican se excluyen, y los desconocidos bloquean las conclusiones afectadas. No hay un ganador automático si existen compromisos.',
          'Metrics are calculated from the controls above. Not-applicable inputs are excluded; unknown inputs block affected conclusions. Trade-offs do not produce an automatic winner.')}</p>
        <label className="cy-field cy-width-short"><span>{t('Variación de parámetros para la prueba (%)','Input variation for local test (%)')}</span>
          <input type="number" min="0" max="100" value={data.robustnessPercent}
            onChange={e=>{const n=Number(e.target.value);if(Number.isFinite(n))setField('robustnessPercent',Math.min(100,Math.max(0,n)));}}/></label>
        <p className="cy-help">{t('ASRI cambia cada parámetro aplicable un ± porcentaje, uno por uno, y recalcula si la conclusión favorable o desfavorable se mantiene. No es un intervalo de confianza ni analiza cambios simultáneos.',
          'ASRI changes applicable inputs one at a time by ± the selected percentage and recalculates whether the favourable or unfavourable result holds. It is not a confidence interval or a simultaneous-risk test.')}</p>
        <div className="cy-results">{results.map(c=><article key={c.option.id}>
          <h4>{displayOptionName(c.option,locale)}</h4><strong>{describeVerdict(c,locale)}</strong>
          <ul>{c.rows.filter(row=>row.issue!=='excluded').map(row=><li key={row.metric.id}>
            <span>{metricTitle(row.metric.label,locale)}</span>
            <b>{row.delta===null?t('Dato desconocido / incompleto','Unknown / incomplete'):
              `${row.delta>0?'+':''}${present(row.delta,locale)} ${parameterUnit(row.metric.unit,data.kind,locale)}`}</b>
            {row.delta!==null&&<small>{present(row.baseline,locale)} → {present(row.candidate,locale)} {parameterUnit(row.metric.unit,data.kind,locale)}
              {row.percentChange===null?'':` · ${row.percentChange>0?'+':''}${present(row.percentChange,locale)}%`}</small>}
            <small>{row.robustness==='stable'?t('Conclusión estable ante variaciones individuales','Stable under individual input changes'):
              row.robustness==='sensitive'?t('La conclusión cambia con alguna variación','The result changes under some variation'):
              row.robustness==='equivalent'?t('Alternativas equivalentes con los valores actuales','Equivalent with the current inputs'):t('No se ha podido evaluar la variación','Local variation not evaluated')}</small>
            {row.sensitivityRange&&<small>
              {t('Rango de diferencia bajo cambios individuales','Difference range under one-at-a-time changes')}: 
              {present(row.sensitivityRange.minDelta,locale)} – {present(row.sensitivityRange.maxDelta,locale)} {parameterUnit(row.metric.unit,data.kind,locale)}.
              {' '}{row.sensitivityRange.validScenarios}/{row.sensitivityRange.attemptedScenarios} {t('recalculos válidos','valid recalculations')}.
              {row.sensitivityRange.invalidScenarios>0&&<> <strong>{t('Cobertura incompleta: no puede afirmarse estabilidad.','Incomplete coverage: stability cannot be claimed.')}</strong></>}
              {row.sensitivityRange.switchingParameter&&<>
                {' · '}{t('Puede cambiar al modificar','Can switch when changing')}{' '}
                {UNIVERSAL_PARAMETERS.find(p=>p.id===row.sensitivityRange?.switchingParameter)?.label[locale]??row.sensitivityRange.switchingParameter}
                {' '}({t('umbral aproximado','approximate switch threshold')} {present(row.sensitivityRange.switchingValue??null,locale)})
              </>}
            </small>}
            {row.coordinatedStress&&<small>
              {t('Prueba simultánea de entradas (4 combinaciones extremas, NO un intervalo estadístico)',
                 'Coordinated input stress (4 extreme combinations, NOT a statistical interval)')}: 
              {row.coordinatedStress.coverage==='none'
                ?t('SIN RANGO: ninguna combinación extrema válida.','NO RANGE: no mathematically valid extreme combinations.')
                :<>{present(row.coordinatedStress.minDelta,locale)} – {present(row.coordinatedStress.maxDelta,locale)}
                  {' '}{parameterUnit(row.metric.unit,data.kind,locale)}</>}
              {' · '}{row.coordinatedStress.validScenarios}/{row.coordinatedStress.attemptedScenarios}{' '}
              {t('escenarios matemáticamente válidos','mathematically valid scenarios')}
              {row.coordinatedStress.coverage==='partial'&&
                <> · {t('COBERTURA INCOMPLETA: no es una cota de riesgo.',
                       'INCOMPLETE COVERAGE: not a risk bound.')}</>}
            </small>}
          </li>)}</ul>
          <p className="cy-help">{t('Referencia:','Baseline:')} {displayOptionName(data.options[0],locale)}. {t('Hipótesis de modelo, no beneficio validado.','Model assumption, not a validated benefit.')}</p>
        </article>)}</div>
      </section>
    </div>}

    {view==='validate' && <div className="cy-stage">
      <section className="cy-panel">
        <h3>{t('Comprobaciones para poder interpretar los resultados','Checks before interpreting the results')}</h3>
        <p>{data.hypothetical&&data.evidence.some(item=>item.id.startsWith('SIM-'))
          ?t('En este caso de ejemplo hemos simulado las cuatro comprobaciones metodológicas para recorrer el ejercicio de principio a fin. Las casillas representan la práctica, NO aprobaciones, ensayos ni autorizaciones reales.',
            'This prepared example simulates all four methodology checks to demonstrate the complete workflow. Checked boxes represent the exercise, NOT real engineering approvals, tests or authorisations.')
          :t('Marcar una casilla registra una declaración del usuario: NO sustituye una aprobación formal ni convierte automáticamente un beneficio en validado.',
            'Checking a box records a user declaration: it does NOT replace formal approval or automatically validate a benefit.')}</p>
        <div className="cy-checks">{([
          ['comparableBoundary',t('Las alternativas comparten una misma unidad, plazo y perímetro','All options share a defined and equivalent unit, period and scope')],
          ['technicalEligibility',t('Se ha contrastado la elegibilidad técnica y la seguridad','Technical and safety eligibility has been checked')],
          ['measurementMethod',t('Los indicadores tienen método de medición y fuentes identificables','Indicator methods and source references are defined')],
          ['independentReview',t('Un revisor autorizado ha revisado el caso y sus limitaciones','An authorised reviewer has checked the case and its limitations')]
        ] as const).map(([key,label])=><label key={key}>
          <input type="checkbox" checked={data.gates[key]} onChange={e=>setData(current=>({
            ...current,gates:{...current.gates,[key]:e.target.checked}
          }))}/><span>{label}{data.hypothetical&&data.evidence.some(item=>item.id.startsWith('SIM-'))
            ?t(' — SIMULADO',' — SIMULATED'):''}</span></label>)}</div>
        <p className="cy-help"><strong>{t('Requisito del modelo: ','Model-specific requirement: ')}</strong>{templateInfo(data.kind,locale).requirement}</p>
      </section>
      <section className="cy-panel">
        <div className="cy-section-heading"><h3>{t('Registro de evidencias del caso','Case evidence register')}</h3>
          <button type="button" onClick={addEvidence}>{t('+ Añadir evidencia','+ Add evidence')}</button></div>
        <p>{data.hypothetical&&data.evidence.some(item=>item.id.startsWith('SIM-'))
          ?t(`Hemos preparado referencias ficticias, equipos responsables, revisores y fechas simuladas. Los ${Object.values(data.parameters).filter(p=>p.applicability==='applies').length} parámetros aplicables de las tres alternativas están vinculados al registro. Las fichas SIM no son documentos de Airbus ni certificaciones.`,
            `The example includes fictional references, exercise teams, simulated reviewers and dates. All ${Object.values(data.parameters).filter(p=>p.applicability==='applies').length} applicable inputs for the three options are linked to this register. SIM records are not Airbus documents or certifications.`)
          :t('Registra el documento, medición o método por referencia; indica propietario, revisor, fecha y limitaciones. Vincúlalo después a cada valor en la etapa 02.',
            'Record each document, observation or method by reference, its owner, reviewer, date and limitations. Link it to each data cell in stage 02.')}</p>
        {data.evidence.length===0&&<p className="cy-example-notice">{t('No hay evidencias. Las cifras se consideran hipótesis, aunque aparezcan resultados numéricos.','No evidence registered. Every numeric comparison remains hypothetical.')}</p>}
        <div className="cy-records">{data.evidence.map(item=><article key={item.id}>
          <div className="cy-record-head"><strong>{item.id}</strong>
            <button type="button" onClick={()=>removeEvidence(item.id)}>{t('Eliminar','Remove')}</button></div>
          <div className="cy-fields">
            <label className="cy-field"><span>{t('Título del documento o medición','Evidence title')}</span>
              <input value={item.title} onChange={e=>patchEvidence(item.id,{title:e.target.value})}/></label>
            <label className="cy-field"><span>{t('Referencia documental o URL (sin subir archivos)','Document reference or URL (no upload)')}</span>
              <input value={item.reference} onChange={e=>patchEvidence(item.id,{reference:e.target.value})}/></label>
            <label className="cy-field"><span>{t('Equipo o propietario de la evidencia','Evidence owner')}</span>
              <input value={item.owner} onChange={e=>patchEvidence(item.id,{owner:e.target.value})}/></label>
            <label className="cy-field"><span>{t('Revisor responsable','Reviewer')}</span>
              <input value={item.reviewer} onChange={e=>patchEvidence(item.id,{reviewer:e.target.value})}/></label>
            <label className="cy-field"><span>{t('Fecha de revisión','Review date')}</span>
              <input type="date" value={item.reviewedOn} onChange={e=>patchEvidence(item.id,{reviewedOn:e.target.value})}/></label>
            <label className="cy-field"><span>{t('Versión o revisión exacta del documento','Exact source document version / revision')}</span>
              <input maxLength={120} value={item.documentVersion??''} onChange={e=>patchEvidence(item.id,{documentVersion:e.target.value})}/></label>
            <label className="cy-field"><span>{t('Fecha de caducidad (si aplica)','Evidence validity date (if applicable)')}</span>
              <input type="date" value={item.validUntil??''} onChange={e=>patchEvidence(item.id,{validUntil:e.target.value})}/></label>
            <label className="cy-field"><span>{t('Fecha de revocación (si aplica)','Revocation date (if applicable)')}</span>
              <input type="date" value={item.revokedOn??''} onChange={e=>patchEvidence(item.id,{revokedOn:e.target.value})}/></label>
            <label className="cy-field"><span>{t('Fragmento exacto que sustenta el dato','Exact supporting source excerpt')}</span>
              <textarea rows={2} maxLength={4000} value={item.excerptUsed??''}
                onChange={e=>patchEvidence(item.id,{excerptUsed:e.target.value})}/></label>
            <label className="cy-field"><span>{t('SHA-256 del archivo fuente (sin subir documento)','Source file SHA-256 (document NOT uploaded)')}</span>
              <input spellCheck={false} maxLength={64} value={item.documentSha256??''}
                onChange={e=>patchEvidence(item.id,{documentSha256:e.target.value.toLowerCase()})}
                placeholder="64 hexadecimal digits"/>
              <small>{t('Compara versiones de bytes. No autentica revisiones ni constituye firma.',
                'Checks file byte identity. It does not authenticate approvals or signatures.')}</small>
            </label>
            <label className="cy-field"><span>{t('Calcular SHA-256 en el navegador; el archivo NO se envía','Compute SHA-256 in browser; file is NOT sent')}</span>
              <input type="file" onChange={async e=>{
                const source=e.target.files?.[0];
                if(!source)return;
                try{
                  const digest=await sha256EvidenceBlob(source);
                  patchEvidence(item.id,{documentSha256:digest});
                  setMessage(t('Huella calculada localmente. El archivo no se ha subido.',
                    'Checksum calculated locally. The file was not uploaded.'));
                }catch(err){setMessage(t('No se pudo calcular la huella: ','Checksum failed: ')+String(err));}
                finally{e.target.value='';}
              }}/></label>
            <label className="cy-field"><span>{t('Naturaleza del dato','Evidence nature')}</span>
              <select value={item.nature} onChange={e=>patchEvidence(item.id,{nature:e.target.value as EvidenceItem['nature']})}>
                <option value="estimate">{t('Estimación / hipótesis','Estimate / assumption')}</option>
                <option value="observed">{t('Medición observada','Observed measurement')}</option>
                <option value="method">{t('Método o norma','Method or standard')}</option>
              </select></label>
            <label className="cy-field"><span>{t('Estado de revisión','Review status')}</span>
              <select value={item.status} onChange={e=>patchEvidence(item.id,{status:e.target.value as EvidenceItem['status']})}>
                <option value="pending">{t('Pendiente','Pending')}</option>
                <option value="reviewed">{t('Revisada (declarado)','Reviewed (declared)')}</option>
                <option value="rejected">{t('Rechazada','Rejected')}</option>
              </select></label>
            <label className="cy-field"><span>{t('Limitaciones y alcance de esta fuente','Limitations and applicability')}</span>
              <textarea rows={2} value={item.limitations} onChange={e=>patchEvidence(item.id,{limitations:e.target.value})}/></label>
          </div>
        </article>)}</div>
      </section>
      <section className="cy-panel">
        <h3>{t('Estado de evidencias de las alternativas','Evidence readiness by alternative')}</h3>
        <p>{data.hypothetical&&data.evidence.some(item=>item.id.startsWith('SIM-'))
          ?t('Aquí puede comprobarse la trazabilidad íntegra del ejercicio. La revisión que aparece como completada es EXCLUSIVAMENTE SIMULADA y nunca valida un beneficio operativo real.',
            'This section shows complete traceability within the exercise. The recorded reviews are SIMULATED ONLY and never establish a real operational benefit.')
          :t('Para confirmar un resultado documental se necesitan datos de referencia y alternativa asociados a fuentes revisadas. La revisión declarada en esta demo no acredita por sí sola un beneficio.',
            'A documented comparison requires both baseline and option values linked to reviewed sources. Self-declared review in this demo does not establish an approved benefit.')}</p>
        <div className="cy-readiness">{results.map(c=><article key={c.option.id}>
          <h4>{displayOptionName(c.option,locale)}</h4>
          <strong>{exerciseComplete(c)
            ?t('Ejercicio completado: revisión y trazabilidad simuladas','Exercise complete: simulated review and traceability')
            :c.canDescribeAsMeasured
              ?t('Mediciones documentadas declaradas; revisión experta pendiente','User-declared documented measurements; expert acceptance pending')
              :t('Validación incompleta','Validation incomplete')}</strong>
          <p>{c.rows.filter(x=>x.issue!=='excluded'&&x.evidenceReady).length} / {c.rows.filter(x=>x.issue!=='excluded').length} {t('indicadores con fuentes revisadas en ambas alternativas','indicators with reviewed records for both values')}</p>
          {exerciseComplete(c)
            ?<p className="cy-help">{t(`${Object.values(data.parameters).filter(p=>p.applicability==='applies').length} parámetros aplicables por opción, ${data.evidence.length} fichas documentales ficticias y cuatro comprobaciones simuladas. Se ha completado todo el recorrido del ejemplo; una aplicación real requeriría fuentes auténticas y aprobación técnica.`,
              `${Object.values(data.parameters).filter(p=>p.applicability==='applies').length} applicable parameters per option, ${data.evidence.length} fictional evidence records and four simulated checks. The exercise is complete; a real application would require authentic sources and technical approval.`)}</p>
            :<ul>{c.missing.map((item,i)=><li key={i}>{item}</li>)}</ul>}
        </article>)}</div>
      </section>
    </div>}

    {view==='translate' && <div className="cy-stage">
      <section className="cy-panel">
        <h3>{t('Traductor estratégico del caso','Case strategic translator')}</h3>
        <p>{t('ASRI explica qué mejora cada alternativa, qué riesgos mantiene y qué decisiones permite tomar. Cambia la alternativa o la audiencia para ver cómo cambian las conclusiones.',
          'ASRI explains what each option improves, what risks remain and which decisions it supports. Change the option or audience to see the conclusions update.')}</p>
        <div className="cy-choices">
          <label className="cy-field"><span>{t('Alternativa analizada','Alternative')}</span><select value={active?.option.id??''} onChange={e=>setSelectedOption(e.target.value)}>
            {results.map(c=><option key={c.option.id} value={c.option.id}>{displayOptionName(c.option,locale)}</option>)}</select></label>
          <label className="cy-field"><span>{t('Audiencia','Audience')}</span><select value={selectedAudience} onChange={e=>setSelectedAudience(e.target.value as Audience)}>
            {audiences.map(a=><option key={a} value={a}>{audienceNames[a][es?0:1]}</option>)}</select></label>
        </div>
        {active&&<div className="cy-output" role="status">
          <span className="cy-status">{exerciseComplete(active)
            ?t('EJERCICIO COMPLETO · REVISIÓN SIMULADA','COMPLETE EXERCISE · SIMULATED REVIEW')
            :data.hypothetical?t('EJEMPLO HIPOTÉTICO','HYPOTHETICAL CASE')
            :active.canDescribeAsMeasured?t('RESULTADOS CALCULADOS CON DATOS DECLARADOS COMO REVISADOS','RESULTS FROM USER-DECLARED REVIEWED DATA')
            :t('RESULTADO NO VALIDADO','UNVALIDATED RESULT')}</span>
          <h4>{audienceNames[selectedAudience][es?0:1]} · {displayOptionName(active.option,locale)}</h4>
          {strategic&&<section className="cy-strategic-message" aria-labelledby="cy-strategic-heading">
            <p className="cy-strategic-eyebrow">{t('Valor estratégico para esta audiencia','Strategic value for this audience')}</p>
            <h3 id="cy-strategic-heading">{strategic.headline}</h3>
            <p className="cy-strategic-meaning">{strategic.operationalMeaning}</p>
            <div className="cy-strategic-finding">
              <strong>{t('Qué cambia con esta alternativa','What changes with this option')}</strong>
              <p>{strategic.quantifiedFinding}</p>
            </div>
            <p className="cy-strategic-sustainability">{strategic.sustainabilityLink}</p>
            <div className="cy-strategic-decision">
              <p className="cy-strategic-question">{strategic.decisionQuestion}</p>
              <div className="cy-strategic-answer">
                <strong>{t('Respuesta del análisis','Model-based answer')}</strong>
                <p>{strategicDecisionAnswer(data,active,selectedAudience,locale)}</p>
              </div>
            </div>
          </section>}
          <section className="cy-deep-dive" aria-label={t('Conclusiones estratégicas ampliadas','Extended strategic conclusions')}>
            <div className="cy-deep-dive__intro">
              <h3>{t('Conclusiones estratégicas ampliadas','Extended strategic conclusions')}</h3>
              <p>{t('Análisis de los principales cambios: plazos, riesgos, costes, medio ambiente y opciones de decisión. Se actualiza al cambiar los datos o la audiencia.',
                'Explore what changes in timing, risks, costs, environmental impact and decisions. The analysis updates when you change the inputs or audience.')}</p>
            </div>
            <div className="cy-deep-dive__grid">{deepDive.map(insight=>
              <article key={insight.id} className={'cy-deep-dive__item cy-deep-dive__item--'+insight.id}>
                <h4>{insight.title}</h4>
                <p>{insight.body}</p>
              </article>)}</div>
          </section>
          {!exerciseComplete(active)&&<>
            <h4>{t('Qué información falta para completar la evaluación','What information is still needed to complete the assessment')}</h4>
            <ul>{active.missing.length?active.missing.map((m,i)=><li key={i}>{m}</li>):
              <li>{t('Falta la revisión técnica y operativa de las conclusiones.',
                'The conclusions still need technical and operational review.')}</li>}</ul>
          </>}
        </div>}
      </section>
      <section className="cy-panel">
        <h3>{t('Exportar un análisis reproducible','Export a reproducible analysis')}</h3>
        <p>{t('El JSON contiene entradas y registros de evidencia para reanudar el trabajo. El informe presenta supuestos, comparaciones, limitaciones y texto por audiencia. Ninguna exportación valida los resultados.',
          'JSON contains all inputs and evidence records for continuing work. Reports include assumptions, comparisons, limits and audience narrative. Exports do not validate results.')}</p>
        <div className="cy-inline-tools">
          <button type="button" onClick={exportMarkdown}>{t('Informe Markdown','Markdown report')}</button>
          <button type="button" disabled={exportBusy} onClick={()=>{void exportPdf();}}>{exportBusy?t('Generando…','Generating…'):t('Informe PDF','PDF report')}</button>
        </div>
        <p className="cy-security">{t('Antes de compartir archivos, aplica las normas de clasificación y protección de la información de tu organización.',
          'Before sharing any file, follow your organisation’s information-classification and protection rules.')}</p>
      </section>
    </div>}
    <details className="cy-work-files">
      <summary>{t('Guardar o recuperar mi trabajo (opcional)','Save or resume my work (optional)')}</summary>
      <div className="cy-work-files__body">
        <p>{t('ASRI no guarda tu caso en una cuenta. Si cierras la página, puedes perder los cambios. Descarga una copia del caso y vuelve a abrirla otro día. Es un archivo .json: solo sirve para conservar los datos y continuar editándolos, no es el informe para presentar.',
          'ASRI does not save your case to an account. Closing this page may lose your changes. Download a copy and reopen it later. The .json file stores your case data for further editing; it is not the presentation report.')}</p>
        <div className="cy-inline-tools">
          <button type="button" onClick={exportJson}>{t('Guardar una copia de mi caso','Download a copy of my case')}</button>
          <label className="cy-file-picker">{t('Abrir un caso guardado','Open a saved case')}
            <input aria-label={t('Abrir archivo de caso guardado','Open saved case file')} type="file" accept=".json,application/json"
              onChange={e=>{void importCase(e.target.files?.[0]);e.target.value='';}} /></label>
        </div>
      </div>
    </details>
    {message&&<p className="cy-message" role="status">{message}</p>}
  </section>;
}
