import { useMemo, type Dispatch, type SetStateAction } from 'react';
import type { Locale } from '../../app/types';
import type { StrategicCase } from './model';
import {
  calculateUniversal, SECTION_NAMES, SECTION_ORDER,
  UNIVERSAL_PARAMETERS, parameterUnit, type Applicability, type ParameterSection,
  type DerivedValue, type CalculatedOption
} from './universal';

interface Props {
  locale:Locale;
  data:StrategicCase;
  setData:Dispatch<SetStateAction<StrategicCase>>;
}
function pretty(n:number|null,locale:Locale,digits=1){
  return n===null?'—':new Intl.NumberFormat(locale,{maximumFractionDigits:digits}).format(n);
}
const statusNames:Record<Applicability,{es:string;en:string}>={
  applies:{es:'Aplica',en:'Applies'},
  notApplicable:{es:'No aplica',en:'Not applicable'},
  unknown:{es:'Dato desconocido',en:'Unknown'}
};
const derivedTitles:{key:keyof CalculatedOption;es:string;en:string;unit:string}[]=[
  {key:'recovery',es:'Tiempo medio de recuperación',en:'Expected recovery time',unit:'time'},
  {key:'deadline',es:'Probabilidad calculada de cumplir el plazo',en:'Modelled chance of meeting deadline',unit:'%'},
  {key:'cost',es:'Coste económico esperado',en:'Expected economic cost',unit:'€'},
  {key:'material',es:'Material virgen',en:'Virgin material',unit:'kg'},
  {key:'waste',es:'Residuos',en:'Waste',unit:'kg'},
  {key:'ghg',es:'GEI en el perímetro definido',en:'Bounded greenhouse gases',unit:'kg CO₂e'},
  {key:'lifeExtension',es:'Vida útil adicional',en:'Additional service life',unit:'hours'}
];
function badge(output:DerivedValue,locale:Locale){
  if(output.state==='excluded')return locale==='es'?'No aplica':'N/A';
  if(output.state==='missing')return locale==='es'?'Pendiente de datos':'Missing data';
  if(output.state==='invalid')return locale==='es'?'Valor no válido':'Invalid value';
  return '';
}
export function UniversalControls({locale,data,setData}:Props){
  const es=locale==='es';
  const t=(a:string,b:string)=>es?a:b;
  const computed=useMemo(()=>data.options.map(option=>calculateUniversal(data,option)),[data]);
  const count=UNIVERSAL_PARAMETERS.filter(p=>data.parameters[p.id]?.applicability==='applies').length;
  const missing=UNIVERSAL_PARAMETERS.filter(p=>data.parameters[p.id]?.applicability==='unknown').length;
  const setStatus=(id:string,next:Applicability)=>{
    setData(current=>{
      const previous=current.parameters[id];
      const fallback=next==='notApplicable'
        ? (es?'No corresponde al alcance del caso; comprobar al validar.':'Outside case boundary; confirm during review.')
        : '';
      const params={...current.parameters,[id]:{
        applicability:next,
        reason:next==='notApplicable'?(previous.reason||fallback):''
      }};
      return {...current,parameters:params};
    });
  };
  const setReason=(id:string,reason:string)=>setData(current=>({
    ...current,parameters:{...current.parameters,[id]:{...current.parameters[id],reason}}
  }));
  const setNumber=(optionId:string,id:string,raw:string)=>setData(current=>({
    ...current,options:current.options.map(option=>{
      if(option.id!==optionId)return option;
      const prev=option.parameterValues[id];
      const n=raw.trim()===''?null:Number(raw);
      return {...option,parameterValues:{...option.parameterValues,[id]:{
        ...prev,value:raw.trim()===''?null:Number.isFinite(n)?n:null
      }}};
    })
  }));
  const setEvidence=(optionId:string,id:string,evidenceId:string)=>setData(current=>({
    ...current,options:current.options.map(option=>option.id!==optionId?option:{
      ...option,parameterValues:{...option.parameterValues,[id]:{...option.parameterValues[id],evidenceId}}
    })
  }));
  return <section className="cy-universal" data-testid="universal-parameters">
    <header className="cy-universal__head">
      <p className="kicker">{t('UN MODELO, SEIS APARTADOS','ONE MODEL, SIX SECTIONS')}</p>
      <h3>{t('Controles comunes para cualquier caso','Common controls for every case')}</h3>
      <p>{t('Encontrarás las mismas variables en los mismos apartados, tanto si estudias Eurodrone como SAF o un caso creado desde cero. Los ejemplos activan los parámetros relevantes; puedes revisar todos los demás.',
        'Every case shows the same variables, in the same order. Example scenarios activate their relevant inputs, and you can inspect all others.')}</p>
      <p className="cy-universal__overview"><strong>{count} {t('parámetros aplicables','applicable parameters')}</strong>
        {' · '}{missing} {t('sin clasificación','not classified')}</p>
    </header>
    {SECTION_ORDER.map((section,index)=>{
      const defs=UNIVERSAL_PARAMETERS.filter(p=>p.section===section);
      return <details className="cy-universal__section" key={section} defaultOpen={index===0}>
        <summary><span>0{index+1}</span>
          <strong>{SECTION_NAMES[section][locale]}</strong>
          <small>{defs.filter(d=>data.parameters[d.id]?.applicability==='applies').length} / {defs.length} {t('activos','active')}</small>
        </summary>
        <div className="cy-universal__rows">{defs.map(def=>{
          const state=data.parameters[def.id]??{applicability:'unknown' as Applicability,reason:''};
          return <section className={'cy-universal__param cy-universal__param--'+state.applicability} key={def.id}>
            <header>
              <div><h4>{def.label[locale]} <small>({parameterUnit(def.unit,data.kind,locale)})</small></h4>
                <p>{def.explanation[locale]}</p></div>
              <label className="cy-field cy-applicability"><span>{t('Aplicabilidad','Applicability')}</span>
                <select value={state.applicability} aria-label={def.label[locale]+' · '+t('Aplicabilidad','Applicability')}
                  onChange={e=>setStatus(def.id,e.target.value as Applicability)}>
                  {(['applies','notApplicable','unknown'] as const).map(v=><option key={v} value={v}>{statusNames[v][locale]}</option>)}
                </select></label>
            </header>
            {state.applicability==='notApplicable'&&<label className="cy-field cy-applicability-reason">
              <span>{t('Motivo de exclusión (queda registrado)','Reason for excluding this parameter (recorded)')}</span>
              <input value={state.reason} onChange={e=>setReason(def.id,e.target.value)}
                placeholder={t('Explica por qué no aplica','Explain why this is not relevant')}/>
              <small>{t('No se sustituye por cero ni participa en su fórmula.','It is not treated as zero and is excluded from its formula.')}</small>
            </label>}
            {state.applicability==='unknown'&&<p className="cy-unknown">
              {t('No sabemos todavía si este parámetro es relevante. Las conclusiones que dependen de él quedan pendientes hasta resolverlo.',
                'We do not yet know whether this parameter is relevant. Any result that depends on it remains pending.')}</p>}
            {state.applicability==='applies'&&<div className="cy-universal__option-grid">
              {data.options.map(option=>{
                const value=option.parameterValues?.[def.id]?.value??null;
                const invalid=value!==null&&(value<(def.minimum??-Infinity)||value>(def.maximum??Infinity));
                return <div className="cy-universal__option" key={option.id}>
                  <strong>{option.name}</strong>
                  <label className="cy-field"><span>{t('Valor','Value')} · {parameterUnit(def.unit,data.kind,locale)}</span>
                    <input type="number" step="any" min={def.minimum} max={def.maximum}
                      value={value??''} onChange={e=>setNumber(option.id,def.id,e.target.value)}
                      aria-label={def.label[locale]+' · '+option.name}/></label>
                  <label className="cy-field"><span>{t('Evidencia del valor','Evidence for this value')}</span>
                    <select value={option.parameterValues?.[def.id]?.evidenceId??''} onChange={e=>setEvidence(option.id,def.id,e.target.value)}>
                      <option value="">{t('Pendiente de justificar','No supporting source yet')}</option>
                      {data.evidence.map(x=><option key={x.id} value={x.id}>{x.title||x.id}</option>)}
                    </select></label>
                  {invalid&&<small className="cy-error">{t('Fuera de rango','Outside permitted range')}</small>}
                </div>;
              })}
            </div>}
          </section>;
        })}</div>
      </details>;
    })}
    <details className="cy-universal__section cy-universal__evidence">
      <summary><span>06</span><strong>{t('Evidencias e incertidumbre','Evidence and uncertainty')}</strong>
        <small>{t('Registro en Comprobar','Register in Check')}</small></summary>
      <div className="cy-universal__evidence-body">
        <p>{t('Cada valor aplicable puede vincularse a una referencia documental del caso. Añade las fuentes, responsables, revisores y limitaciones en la etapa 03 · Comprobar. Mientras faltan, el resultado es solo una simulación condicional.',
          'Each applicable value can refer to evidence added in stage 03 · Check, including owners, reviewers and limitations. Until verified, calculations remain conditional scenarios.')}</p>
        <p>{t('Los parámetros desconocidos bloquean las fórmulas afectadas. Los no aplicables se omiten y su motivo permanece en el informe.',
          'Unknown parameters block affected equations. Not-applicable ones are excluded and their reason is recorded in the report.')}</p>
      </div>
    </details>
    <section className="cy-universal__results" aria-labelledby="cy-expected-title">
      <h3 id="cy-expected-title">{t('Resultados calculados a partir de tus condiciones','Calculated results from your scenario inputs')}</h3>
      <p>{t('Cada columna refleja una alternativa; al cambiar un dato se recalculan las fórmulas. No se mezclan unidades ni se combinan indicadores con pesos arbitrarios.',
        'Each column is one alternative. Changing an input recalculates the equations. Metrics use consistent units and are not combined with arbitrary weights.')}</p>
      <div className="cy-table-scroll"><table className="cy-input-table cy-universal__output-table">
        <thead><tr><th>{t('Resultado','Outcome')}</th>{data.options.map(o=><th key={o.id}>{o.name}</th>)}</tr></thead>
        <tbody>{derivedTitles.map(def=><tr key={def.key}>
          <th scope="row">{es?def.es:def.en}<small>{parameterUnit(def.unit,data.kind,locale)}</small></th>
          {computed.map((result,i)=>{
            const val=result[def.key] as DerivedValue;
            return <td key={data.options[i].id} className={val.state==='calculated'?'':'cy-universal__pending'}>
              <strong>{val.state==='calculated'?pretty(val.value,locale,def.key==='deadline'?1:2):badge(val,locale)}</strong>
              {val.missing.length>0&&<small>{val.missing.map(id=>id.split(':')[0]).join(', ')}</small>}
            </td>;
          })}</tr>)}</tbody></table></div>
      <p className="cy-help">{t('Método: tiempo esperado = plazo base (o suministro, si condiciona) + probabilidades de fallo y disrupción × retrasos. Coste esperado = coste base + obligaciones aplicables + recargos ponderados por riesgos. La probabilidad de cumplir plazo enumera escenarios de éxito/fallo y disrupción suponiendo independencia. No hay calibración estadística ni relación causal demostrada.',
        'Method: expected time = base (or binding supply lead) + failure and disruption probabilities × delays. Expected cost = base + applicable commitments + probability-weighted surcharges. Deadline success enumerates technical and disruption branches assuming independence. This is not calibrated or causal proof.')}</p>
      <p className="cy-help">{t('Si las dependencias entre riesgos no están justificadas, el resultado debe tratarse como una hipótesis de cálculo y verificarse con Ingeniería. Los indicadores de materiales y emisiones son cantidades declaradas, no un ACV completo.',
        'If risk dependence has not been established, results are only modelling assumptions requiring engineering review. Material and emissions figures are declared quantities, not a full LCA.')}</p>
    </section>
  </section>;
}
