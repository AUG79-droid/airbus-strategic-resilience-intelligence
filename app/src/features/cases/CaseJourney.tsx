import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { downloadText, downloadBytes } from '../export/download';
import type { Locale, ViewId } from '../../app/types';
import {
  MODEL_TEMPLATES, comparisons, createCase, validateCaseImport,
  type StrategicCase, type CaseKind, type EvidenceItem, type Audience,
  type MetricDefinition, type OptionComparison
} from './model';
import { fromPreset, PRESETS, type PresetKey } from './presets';
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
function describeVerdict(c:OptionComparison,locale:Locale){
  return verdicts[c.verdict][locale==='es'?0:1];
}
function summary(data:StrategicCase, c:OptionComparison, locale:Locale):string {
  const es=locale==='es';
  const measurable=c.rows.filter(r=>r.improvement!==null);
  const positive=measurable.filter(r=>r.improvement!==null&&r.improvement>0);
  const negative=measurable.filter(r=>r.improvement!==null&&r.improvement<0);
  const main=c.rows.find(r=>r.metric.category==='resilience')??c.rows[0];
  const change=main && main.delta!==null
    ? `${main.metric.label}: ${present(main.baseline,locale)} → ${present(main.candidate,locale)} ${main.metric.unit} (${main.delta>0?'+':''}${present(main.delta,locale)} ${main.metric.unit})`
    : (es?'El indicador clave no tiene datos suficientes.':'The main indicator has insufficient data.');
  return es
    ? `${data.title||'Este caso'} evalúa «${data.initiative||'una iniciativa'}» frente a la referencia «${data.options[0]?.name||'situación actual'}». La alternativa «${c.option.name}» ofrece ${positive.length} indicadores mejores y ${negative.length} peores, según los valores declarados. ${change}. ${data.hypothetical?'Todos los valores son hipotéticos; ':'Estos valores han sido declarados por el usuario; '}no debe comunicarse una mejora como beneficio demostrado sin validación técnica y operativa.`
    : `${data.title||'This case'} examines “${data.initiative||'an initiative'}” against “${data.options[0]?.name||'the current baseline'}”. “${c.option.name}” has ${positive.length} improving and ${negative.length} worsening indicators under the entered assumptions. ${change}. ${data.hypothetical?'Every value is hypothetical; ':'Values are user-provided; '}do not communicate modelled changes as demonstrated benefits without technical and operational validation.`;
}
function narrative(data:StrategicCase,c:OptionComparison,audience:Audience,locale:Locale):string{
  const es=locale==='es';
  const opening=summary(data,c,locale);
  const risk=data.vulnerability || (es?'la vulnerabilidad por definir':'the vulnerability yet to be defined');
  const endings:Record<Audience,[string,string]>={
    defenceCustomer:[
      `Para el cliente, la cuestión es si reduce la exposición a «${risk}» y mantiene las capacidades necesarias. Deben acreditarse los límites operativos, el resultado bajo una situación comparable y las condiciones de aceptación del cliente.`,
      `For the customer, the question is whether it mitigates “${risk}” without losing required capability. Operating limits, like-for-like outcomes and customer acceptance must be demonstrated.`
    ],
    engineering:[
      `Ingeniería debe confirmar el mecanismo «${data.mechanism||'pendiente de definir'}», los requisitos de seguridad y las condiciones de ensayo. Ninguna mejora numérica autoriza por sí sola un cambio técnico.`,
      `Engineering must verify “${data.mechanism||'the proposed mechanism'}”, safety requirements and test conditions. Numeric improvements alone do not authorise a technical change.`
    ],
    programmeManager:[
      `El programa debe valorar fechas, recursos, costes y dependencias antes de decidir. Los indicadores deben relacionarse con hitos y compromisos verificables dentro de «${data.boundary||'un alcance aún no definido'}».`,
      `The programme should assess timing, resources, costs and dependencies. Connect indicators to measurable commitments within “${data.boundary||'a defined scope'}”.`
    ],
    executiveLeadership:[
      `Dirección puede utilizar el análisis para priorizar una validación, no para declarar un beneficio todavía. El criterio de inversión es que la mejora de resiliencia sea verificable y que los compromisos económicos, ambientales y técnicos sean explícitos.`,
      `Leadership may use this analysis to prioritise validation, not to advertise a benefit. Investment should follow verified resilience gains with transparent economic, environmental and technical trade-offs.`
    ]
  };
  return opening+' '+endings[audience][es?0:1];
}
function reportText(data:StrategicCase,chosen:OptionComparison,a:Audience,locale:Locale):string{
  const es=locale==='es';
  const lines=[
    '# ASRI — '+(data.title||'Custom strategic case'),
    '',es?'AVISO: prototipo independiente, no aprobado por Airbus.':'NOTICE: independent prototype, not Airbus approved.',
    es?'RESULTADOS: modelización comparativa, no beneficios validados.':'RESULTS: comparative modelling, not validated benefits.',
    data.hypothetical?(es?'DATOS: 100 % HIPOTÉTICOS.':'DATA: 100% HYPOTHETICAL.'):'',
    '',es?'## 01 Investigar':'## 01 Investigate',
    `Programme: ${data.programme}`,`Decision: ${data.decision}`,
    `Initiative: ${data.initiative}`,`Vulnerability: ${data.vulnerability}`,
    `Mechanism: ${data.mechanism}`,`Scope: ${data.boundary}`,
    `Horizon: ${data.timeHorizon}`,`Owner: ${data.owner}`,
    '',es?'## 02 Cuestionar':'## 02 Challenge',
    `Baseline: ${data.options[0].name}`,`Alternative: ${chosen.option.name}`,
    `Verdict: ${describeVerdict(chosen,locale)}`,
    ...chosen.rows.map(r=>`- ${r.metric.label}: ${present(r.baseline,locale)} → ${present(r.candidate,locale)} ${r.metric.unit} | Δ ${present(r.delta,locale)} | ${r.robustness} | evidence: ${r.evidenceReady?'reviewed':'pending'}`),
    `Sensitivity: ±${data.robustnessPercent}% user-selected input variation; NOT a statistical confidence interval.`,
    '',es?'## 03 Comprobar':'## 03 Check',
    `Review gates: ${JSON.stringify(data.gates)}`,
    `Evidence trace: ${chosen.reviewedData?'all inputs linked to reviewed records':'incomplete'}`,
    `Observed measurements: ${chosen.observedData?'linked for all compared values':'not confirmed'}`,
    ...chosen.missing.map(m=>'- '+m),
    ...data.evidence.map(e=>`- ${e.id}: ${e.title} | ${e.status} / ${e.nature} | ${e.reference} | ${e.owner} | ${e.reviewer} ${e.reviewedOn} | ${e.limitations}`),
    '',es?'## 04 Traducir':'## 04 Translate',
    `Audience: ${audienceNames[a][es?0:1]}`,
    narrative(data,chosen,a,locale),
    '',es?'LÍMITE: ningún cálculo es una prueba de causalidad o aprobación técnica.':'BOUNDARY: calculations do not establish causality or technical approval.',
  ];
  return lines.filter((x)=>x!=='').join('\n');
}
async function downloadReportPdf(text:string, filename:string):Promise<void>{
  const { PDFDocument, StandardFonts, rgb }=await import('pdf-lib');
  const doc=await PDFDocument.create();
  const font=await doc.embedFont(StandardFonts.Helvetica);
  const fontBold=await doc.embedFont(StandardFonts.HelveticaBold);
  const A4:[number,number]=[595.28,841.89];
  let page=doc.addPage(A4),y=A4[1]-42;
  const clean=(s:string)=>s.replace(/[^\x20-\x7e\u00a0-\u00ff]/g, ' ');
  for(const raw of text.split('\n')){
    const bold=raw.startsWith('#')||raw.startsWith('NOTICE:')||raw.startsWith('AVISO:');
    const size=raw.startsWith('# ')?16:raw.startsWith('## ')?12:10;
    const actual=(bold?raw.replace(/^#+\s*/,''):raw);
    const words=clean(actual).split(/\s+/);
    const lineMax=bold?82:100;
    const pieces:string[]=[];
    let line='';
    for(const word of words){
      if((line+' '+word).length>lineMax && line){pieces.push(line);line='';}
      line+=(line?' ':'')+word;
    }
    if(line)pieces.push(line);
    if(!pieces.length)pieces.push('');
    for(const part of pieces){
      if(y<47){page=doc.addPage(A4);y=A4[1]-42;}
      page.drawText(part,{x:38,y,size,font:bold?fontBold:font,color:rgb(.13,.19,.17)});
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
  const setField=(key:keyof StrategicCase,value:unknown)=>setData(current=>({...current,[key]:value}));
  const patchMetric=(id:string,patch:Partial<MetricDefinition>)=>setData(current=>({
    ...current,metrics:current.metrics.map(m=>m.id===id?{...m,...patch}:m)
  }));
  const patchOption=(id:string,key:'name'|'explanation',value:string)=>setData(current=>({
    ...current,options:current.options.map(o=>o.id===id?{...o,[key]:value}:o)
  }));
  const patchMeasure=(optionId:string,metricId:string,patch:{value?:number|null;evidenceId?:string})=>setData(current=>({
    ...current,options:current.options.map(o=>o.id!==optionId?o:{
      ...o,measures:{...o.measures,[metricId]:{...o.measures[metricId],...patch}}
    })
  }));
  const patchEvidence=(id:string,patch:Partial<EvidenceItem>)=>setData(current=>({
    ...current,evidence:current.evidence.map(e=>e.id===id?{...e,...patch}:e)
  }));
  const removeEvidence=(id:string)=>setData(current=>({
    ...current,evidence:current.evidence.filter(e=>e.id!==id),
    options:current.options.map(o=>({...o,measures:Object.fromEntries(Object.entries(o.measures).map(([k,v])=>[k,v.evidenceId===id?{...v,evidenceId:''}:v]))}))
  }));
  const addEvidence=()=>{
    setData(current=>({...current,evidence:[...current.evidence,{
      id:'EV-'+Date.now().toString(36)+'-'+current.evidence.length,
      title:'',reference:'',owner:'',reviewer:'',reviewedOn:'',
      status:'pending',nature:'estimate',limitations:''
    }]}));
  };
  const chooseKind=(kind:CaseKind)=>{setData(createCase(kind));setSelectedOption('option-a');setMessage('');};
  const loadPreset=(kind:PresetKey)=>{setData(fromPreset(kind,locale));setSelectedOption('option-a');setMessage('');};
  const convertToReal=()=>setData(current=>({
    ...current,
    id:'CASE-'+Date.now().toString(36),hypothetical:false,programme:'',owner:'',
    gates:{comparableBoundary:false,technicalEligibility:false,measurementMethod:false,independentReview:false},
    evidence:[],options:current.options.map(o=>({...o,measures:Object.fromEntries(current.metrics.map(m=>[m.id,{value:null,evidenceId:''}]))}))
  }));
  const importCase=async(file?:File)=>{
    if(!file)return;
    if(file.size>300_000){setMessage(t('Archivo demasiado grande (máximo 300 KB).','File too large (300 KB max).'));return;}
    try{
      const data=validateCaseImport(JSON.parse(await file.text()));
      setData(data);setSelectedOption('option-a');
      setMessage(t('Caso cargado. Comprueba la procedencia de cada dato.','Case loaded. Verify each data source.'));
    }catch(e){setMessage(t('Archivo no válido: ','Invalid file: ')+String(e));}
  };
  const exportJson=()=>downloadText(JSON.stringify(data,null,2),safeFilename(data)+'.json','application/json');
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
      <textarea rows={field==='boundary'||field==='decision'?2:1} value={String(data[field]??'')}
        placeholder={placeholder} onChange={e=>setField(field,e.target.value)} />
    </label>
  );
  const sampleWarning=t(
    'EJEMPLO HIPOTÉTICO. Cifras creadas para practicar: no son datos ni resultados de Airbus.',
    'HYPOTHETICAL CASE. Figures exist for practice only; they are not Airbus data or outcomes.'
  );
  return <section className="cy-root" data-testid="custom-case-journey" aria-label={t('Crea tu propio caso estratégico','Create your own strategic case')}>
    <header className="cy-intro">
      <p className="kicker">CREATE YOUR OWN STRATEGIC CASE</p>
      <h2>{phaseTitles[view][es?0:1]}</h2>
      <p>{t('Un mismo caso recorre las cuatro etapas. Empieza con tu iniciativa, compara con una situación de referencia, registra evidencias y genera argumentos para el público seleccionado.',
        'One case follows all four stages: frame the initiative, compare against a baseline, review evidence and translate findings for a decision audience.')}</p>
      <p className="cy-security"><strong>{t('Seguridad de la información:','Information security:')}</strong>{' '}
        {t('Esta demo pública funciona en el navegador. No introduzcas información confidencial, datos personales ni documentos internos sin un entorno Airbus autorizado. El archivo JSON se descarga localmente; los datos de esta sesión no se envían a un servidor de ASRI.',
          'This public demo runs in the browser. Do not enter confidential, personal or internal documents without an Airbus-approved environment. JSON is downloaded locally; session inputs are not sent to an ASRI server.')}</p>
    </header>

    {view==='investigate' && <div className="cy-stage">
      <section className="cy-panel">
        <div className="cy-section-heading"><h3>{t('Empieza desde cero','Start from scratch')}</h3><p>{t('Elige la familia analítica. Se cargan indicadores apropiados que podrás modificar.','Choose a model family. Relevant but editable KPIs are prepared.')}</p></div>
        <div className="cy-model-grid">{caseKinds.map(kind=><button key={kind} type="button"
          className={data.kind===kind&&!data.hypothetical?'is-active':''}
          onClick={()=>chooseKind(kind)}>{kinds[kind][es?0:1]}</button>)}</div>
        <div className="cy-inline-tools">
          <button type="button" onClick={exportJson}>{t('Guardar el caso en JSON','Save case as JSON')}</button>
          <label className="cy-file-picker">{t('Recuperar caso desde JSON','Restore case from JSON')}
            <input aria-label={t('Importar JSON de caso','Import case JSON')} type="file" accept=".json,application/json"
              onChange={e=>{void importCase(e.target.files?.[0]);e.target.value='';}} /></label>
        </div>
      </section>
      <section className="cy-panel">
        <h3>{t('O empieza con uno de los cuatro casos de Mireia','Or start with one of Mireia’s four cases')}</h3>
        <p>{t('Cada ejemplo comienza en la etapa 01 y lleva datos totalmente ficticios para practicar en las siguientes etapas.','Each example begins in stage 01 and carries entirely fictional numbers for the remaining stages.')}</p>
        <div className="cy-preset-grid">{four.map(id=><button type="button" key={id} onClick={()=>loadPreset(id)}>
          <strong>{kinds[id][es?0:1]}</strong><span>{PRESETS[id].title}</span>
        </button>)}</div>
        {data.hypothetical&&<p className="cy-example-notice">{sampleWarning}{' '}
          <button type="button" onClick={convertToReal}>{t('Convertirlo en plantilla vacía para datos reales','Convert to an empty real-data template')}</button>
        </p>}
      </section>
      <section className="cy-panel">
        <h3>{t('Ficha del caso','Case definition')}</h3>
        <p className="cy-help">{MODEL_TEMPLATES[data.kind].guidance}</p>
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
        <p className="cy-help"><strong>{t('Requisito específico:','Specific requirement:')}</strong> {MODEL_TEMPLATES[data.kind].requirement}</p>
        <p className="cy-help">{t('Siguiente etapa: tendrás que introducir una referencia y dos alternativas con datos comparables.','Next: enter comparable values for a reference and two alternatives.')}</p>
      </section>
    </div>}

    {view==='challenge' && <div className="cy-stage">
      {data.hypothetical&&<p className="cy-example-notice">{sampleWarning}</p>}
      <section className="cy-panel">
        <h3>{t('Modelo de análisis','Analysis model')}: {kinds[data.kind][es?0:1]}</h3>
        <p>{MODEL_TEMPLATES[data.kind].guidance}</p>
        <p className="cy-help">{t('El sistema compara valores introducidos para la misma unidad; no predice disponibilidad real, emisiones ni certificaciones. No se asignan pesos arbitrarios para declarar una opción ganadora.',
          'The tool compares inputs for the same functional unit; it does not predict actual readiness, emissions or certification. No arbitrary weights are used to declare a winner.')}</p>
        <div className="cy-indicator-grid">{data.metrics.map(m=><div className="cy-indicator" key={m.id}>
          <label><span>{t('Indicador','Indicator')}</span><input value={m.label} onChange={e=>patchMetric(m.id,{label:e.target.value})} /></label>
          <label><span>{t('Unidad','Unit')}</span><input value={m.unit} onChange={e=>patchMetric(m.id,{unit:e.target.value})} /></label>
          <label><span>{t('Mejora cuando','Improves when')}</span><select value={m.direction}
            onChange={e=>patchMetric(m.id,{direction:e.target.value as MetricDefinition['direction']})}>
            <option value="lower">{t('Disminuye','Lower')}</option><option value="higher">{t('Aumenta','Higher')}</option>
          </select></label>
        </div>)}</div>
      </section>
      <section className="cy-panel">
        <h3>{t('Escenarios: situación actual frente a alternativas','Scenarios: baseline versus alternatives')}</h3>
        <p>{t('Introduce valores para una misma unidad funcional y periodo. Elige en cada celda la evidencia asociada, si la tienes. Un campo vacío impide calcular ese indicador.',
          'Enter values for the same functional unit and time period. Link a source record to each value when available. Blank values cannot be compared.')}</p>
        <div className="cy-table-scroll"><table className="cy-input-table"><thead><tr><th>{t('Indicador','Indicator')}</th>
          {data.options.map(o=><th key={o.id}><label className="cy-table-label"><span>{o.id==='baseline'?t('Referencia','Baseline'):t('Alternativa','Alternative')}</span>
            <input value={o.name} onChange={e=>patchOption(o.id,'name',e.target.value)} /></label></th>)}</tr></thead>
          <tbody>{data.metrics.map(m=><tr key={m.id}><th scope="row">{m.label}<small>{m.unit}</small></th>
            {data.options.map(o=><td key={o.id}>
              <label className="cy-value-label"><span>{t('Valor','Value')}</span><input type="number" inputMode="decimal" step="any"
                min={m.min} max={m.max} value={o.measures[m.id]?.value??''}
                aria-label={m.label+' · '+o.name}
                onChange={e=>patchMeasure(o.id,m.id,{value:fValue(e.target.value)})}/></label>
              <label className="cy-evidence-select"><span>{t('Fuente / evidencia','Source / evidence')}</span>
                <select value={o.measures[m.id]?.evidenceId??''}
                  aria-label={t('Evidencia de ','Evidence for ')+m.label+' · '+o.name}
                  onChange={e=>patchMeasure(o.id,m.id,{evidenceId:e.target.value})}>
                  <option value="">{t('Sin evidencia','No evidence')}</option>
                  {data.evidence.map(item=><option key={item.id} value={item.id}>{item.id} · {item.title||t('Sin título','Untitled')}</option>)}
                </select></label>
              {!((o.measures[m.id]?.value===null)||(o.measures[m.id]?.value===undefined)) &&
                (Number(o.measures[m.id].value)<(m.min??-Infinity)||Number(o.measures[m.id].value)>(m.max??Infinity)) &&
                <small className="cy-error">{t('Fuera de rango','Out of range')}</small>}
            </td>)}</tr>)}</tbody></table></div>
        <div className="cy-options-notes">{data.options.map(o=><label key={o.id} className="cy-field"><span>{o.name} · {t('Descripción / supuestos','Description / assumptions')}</span>
          <textarea rows={2} value={o.explanation} onChange={e=>patchOption(o.id,'explanation',e.target.value)} /></label>)}</div>
      </section>
      <section className="cy-panel">
        <h3>{t('Resultados comparativos y sensibilidad','Comparative outcomes and sensitivity')}</h3>
        <label className="cy-field cy-width-short"><span>{t('Variación supuesta de cada dato (%)','Assumed variation of each input (%)')}</span>
          <input type="number" min="0" max="100" value={data.robustnessPercent} onChange={e=>{
            const n=Number(e.target.value);if(Number.isFinite(n))setField('robustnessPercent',Math.min(100,Math.max(0,n)));
          }}/></label>
        <p className="cy-help">{t('La prueba de sensibilidad aplica ± el porcentaje indicado a ambos valores. No es un intervalo estadístico ni una predicción calibrada.',
          'Sensitivity uses the chosen ± percentage around both values. It is not a statistical confidence interval or a calibrated forecast.')}</p>
        <div className="cy-results">{results.map(c=><article key={c.option.id}>
          <h4>{c.option.name}</h4><strong>{describeVerdict(c,locale)}</strong>
          <ul>{c.rows.map(row=><li key={row.metric.id}>
            <span>{row.metric.label}</span>
            <b>{row.delta===null?t('Sin datos','Missing'): `${row.delta>0?'+':''}${present(row.delta,locale)} ${row.metric.unit}`}</b>
            <small>{row.robustness==='stable'?t('Diferencia robusta al margen supuesto','Stable under chosen margin'):
              row.robustness==='sensitive'?t('Resultado sensible al margen supuesto','Sensitive to chosen margin'):t('No calculable','Not computable')}</small>
          </li>)}</ul>
          <p className="cy-help">{t('Referencia:','Baseline:')} {data.options[0]?.name}. {t('No se ha demostrado causalidad.','Causality is not demonstrated.')}</p>
        </article>)}</div>
      </section>
    </div>}

    {view==='validate' && <div className="cy-stage">
      <section className="cy-panel">
        <h3>{t('Comprobaciones para poder interpretar los resultados','Checks before interpreting the results')}</h3>
        <p>{t('Marcar una casilla registra una declaración del usuario: NO sustituye una aprobación formal ni convierte automáticamente un beneficio en validado.',
          'Checking a box records a user declaration: it does NOT replace formal approval or automatically validate a benefit.')}</p>
        <div className="cy-checks">{([
          ['comparableBoundary',t('Las alternativas comparten una misma unidad, plazo y perímetro','All options share a defined and equivalent unit, period and scope')],
          ['technicalEligibility',t('Se ha contrastado la elegibilidad técnica y la seguridad','Technical and safety eligibility has been checked')],
          ['measurementMethod',t('Los indicadores tienen método de medición y fuentes identificables','Indicator methods and source references are defined')],
          ['independentReview',t('Un revisor autorizado ha revisado el caso y sus limitaciones','An authorised reviewer has checked the case and its limitations')]
        ] as const).map(([key,label])=><label key={key}>
          <input type="checkbox" checked={data.gates[key]} onChange={e=>setData(current=>({
            ...current,gates:{...current.gates,[key]:e.target.checked}
          }))}/><span>{label}</span></label>)}</div>
        <p className="cy-help"><strong>{t('Requisito del modelo: ','Model-specific requirement: ')}</strong>{MODEL_TEMPLATES[data.kind].requirement}</p>
      </section>
      <section className="cy-panel">
        <div className="cy-section-heading"><h3>{t('Registro de evidencias del caso','Case evidence register')}</h3>
          <button type="button" onClick={addEvidence}>{t('+ Añadir evidencia','+ Add evidence')}</button></div>
        <p>{t('Registra el documento, medición o método por referencia; indica propietario, revisor, fecha y limitaciones. Vincúlalo después a cada valor en la etapa 02.',
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
        <p>{t('Para confirmar un resultado documental se necesitan datos de referencia y alternativa asociados a fuentes revisadas. La revisión declarada en esta demo no acredita por sí sola un beneficio.',
          'A documented comparison requires both baseline and option values linked to reviewed sources. Self-declared review in this demo does not establish an approved benefit.')}</p>
        <div className="cy-readiness">{results.map(c=><article key={c.option.id}>
          <h4>{c.option.name}</h4>
          <strong>{c.canDescribeAsMeasured?t('Mediciones documentadas declaradas; revisión experta pendiente','User-declared documented measurements; expert acceptance pending'):
            t('Validación incompleta','Validation incomplete')}</strong>
          <p>{c.rows.filter(x=>x.evidenceReady).length} / {c.rows.length} {t('indicadores con fuentes revisadas en ambas alternativas','indicators with reviewed records for both values')}</p>
          <ul>{c.missing.map((item,i)=><li key={i}>{item}</li>)}</ul>
        </article>)}</div>
      </section>
    </div>}

    {view==='translate' && <div className="cy-stage">
      <section className="cy-panel">
        <h3>{t('Traductor estratégico del caso','Case strategic translator')}</h3>
        <p>{t('Las narrativas se generan desde los valores y la descripción de tu caso; cambian al cambiar sus datos. No toman resultados del DEMO-60.',
          'Narratives are generated from your case description and values and update when inputs change. They never reuse DEMO-60 results.')}</p>
        <div className="cy-choices">
          <label className="cy-field"><span>{t('Alternativa analizada','Alternative')}</span><select value={active?.option.id??''} onChange={e=>setSelectedOption(e.target.value)}>
            {results.map(c=><option key={c.option.id} value={c.option.id}>{c.option.name}</option>)}</select></label>
          <label className="cy-field"><span>{t('Audiencia','Audience')}</span><select value={selectedAudience} onChange={e=>setSelectedAudience(e.target.value as Audience)}>
            {audiences.map(a=><option key={a} value={a}>{audienceNames[a][es?0:1]}</option>)}</select></label>
        </div>
        {active&&<div className="cy-output" role="status">
          <span className="cy-status">{data.hypothetical?t('EJEMPLO 100 % HIPOTÉTICO','100% HYPOTHETICAL CASE'):
            active.canDescribeAsMeasured?t('RESULTADOS CALCULADOS CON DATOS DECLARADOS COMO REVISADOS','RESULTS FROM USER-DECLARED REVIEWED DATA'):
            t('RESULTADO NO VALIDADO','UNVALIDATED RESULT')}</span>
          <h4>{audienceNames[selectedAudience][es?0:1]} · {active.option.name}</h4>
          <strong>{describeVerdict(active,locale)}</strong>
          <p>{narrative(data,active,selectedAudience,locale)}</p>
          <h4>{t('Qué falta antes de comunicar un beneficio','What is still required before communicating a benefit')}</h4>
          <ul>{active.missing.length?active.missing.map((m,i)=><li key={i}>{m}</li>):
            <li>{t('Revisión experta de causalidad, aceptación operativa y aprobación de la comunicación; el prototipo no sustituye ese proceso.',
              'Expert review of causality, operational acceptance and approval of claims; the prototype does not replace this process.')}</li>}</ul>
        </div>}
      </section>
      <section className="cy-panel">
        <h3>{t('Exportar un análisis reproducible','Export a reproducible analysis')}</h3>
        <p>{t('El JSON contiene entradas y registros de evidencia para reanudar el trabajo. El informe presenta supuestos, comparaciones, limitaciones y texto por audiencia. Ninguna exportación valida los resultados.',
          'JSON contains all inputs and evidence records for continuing work. Reports include assumptions, comparisons, limits and audience narrative. Exports do not validate results.')}</p>
        <div className="cy-inline-tools">
          <button type="button" onClick={exportJson}>{t('Guardar caso JSON','Save case JSON')}</button>
          <button type="button" onClick={exportMarkdown}>{t('Informe Markdown','Markdown report')}</button>
          <button type="button" disabled={exportBusy} onClick={()=>{void exportPdf();}}>{exportBusy?t('Generando…','Generating…'):t('Informe PDF','PDF report')}</button>
        </div>
        <p className="cy-security">{t('Antes de compartir archivos, aplica las normas de clasificación y protección de la información de tu organización.',
          'Before sharing any file, follow your organisation’s information-classification and protection rules.')}</p>
      </section>
    </div>}
    {message&&<p className="cy-message" role="status">{message}</p>}
  </section>;
}
