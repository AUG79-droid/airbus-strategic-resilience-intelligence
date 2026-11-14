import type { Dispatch, SetStateAction } from 'react';
import type { Locale } from '../../app/types';
import { compareEnvironmentalBasis, type EnvironmentalBasis } from './environmentBasis';
import { displayOptionName, type StrategicCase } from './model';

interface Props {locale:Locale;data:StrategicCase;setData:Dispatch<SetStateAction<StrategicCase>>}
const fields=[
  ['functionalUnit','Unidad funcional equivalente','Equivalent functional unit'],
  ['period','Periodo temporal comparable','Comparable time period'],
  ['boundary','Límites del inventario','Inventory boundaries'],
  ['inventoryMethod','Método de inventario / ACV','Inventory / LCA method'],
  ['allocationRule','Regla de asignación','Allocation rule'],
  ['factorSourceVersion','Versión de las fuentes / factores','Source / factor dataset version']
] as const;
const empty=(optionId:string):EnvironmentalBasis=>({optionId,functionalUnit:'',period:'',
  boundary:'',inventoryMethod:'',allocationRule:'',factorSourceVersion:'',evidenceId:'',relativeUncertaintyPercent:null});
export function EnvironmentalMethod({locale,data,setData}:Props) {
  const es=locale==='es';
  const t=(a:string,b:string)=>es?a:b;
  const patch=(optionId:string,field:Exclude<keyof EnvironmentalBasis,'optionId'>,value:string|number|null)=>
    setData(current=>{
      const existing=current.environmentalBasis.find(x=>x.optionId===optionId)??empty(optionId);
      const updated={...existing,[field]:typeof value==='string'?value.slice(0,1200):value};
      const remaining=current.environmentalBasis.filter(x=>x.optionId!==optionId);
      return {...current,environmentalBasis:[...remaining,updated]};
    });
  const base=data.environmentalBasis.find(x=>x.optionId===data.options[0]?.id);
  return <details className="cy-panel" data-testid="environment-method-review">
    <summary><strong>{t('Comparabilidad de inventarios ambientales (análisis avanzado)','Environmental inventory comparability (advanced analysis)')}</strong></summary>
    <p>{t('Los resultados de materiales, residuos y GEI solo pueden interpretarse como comparables si comparten unidad funcional, periodo, perímetro, método, regla de asignación y versión de factores. Completar estos campos NO certifica un ACV ni demuestra una reducción real.',
      'Materials, waste and GHG comparisons require matching functional unit, period, boundary, method, allocation and factor dataset version. Filling these fields does NOT certify an LCA or prove an actual environmental reduction.')}</p>
    {data.options.map(option=>{
      const selected=data.environmentalBasis.find(x=>x.optionId===option.id)??empty(option.id);
      const status=option.id===data.options[0].id?null:compareEnvironmentalBasis(base,selected);
      return <section className="cy-option-definition" key={option.id}>
        <h4>{displayOptionName(option,locale)}</h4>
        {status&&<p role="status" className={status.status==='declaredComparable'?'cy-help':'cy-error'}>
          {status.status==='declaredComparable'
            ?t('Los metadatos declarados coinciden (pendiente de verificar fuentes y factores).',
              'Declared metadata match (sources and factors still need independent verification).')
            :t('Inventarios NO comparables o incompletos: ','Inventories incompatible or incomplete: ')+status.issues.join('; ')}
        </p>}
        <div className="cy-field-grid">
          {fields.map(([key,nameEs,nameEn])=><label className="cy-field" key={key}>
            <span>{t(nameEs,nameEn)}</span>
            <input value={selected[key]} maxLength={1200} onChange={e=>patch(option.id,key,e.target.value)}/>
          </label>)}
          <label className="cy-field"><span>{t('Incertidumbre relativa declarada (±%; opcional)','Declared relative inventory uncertainty (±%; optional)')}</span>
            <input type="number" min="0" max="100" step="any" value={selected.relativeUncertaintyPercent??''}
              placeholder={t('No evaluada','Not assessed')}
              onChange={e=>{
                const raw=e.target.value,value=raw===''?null:Number(raw);
                if(value===null||Number.isFinite(value)&&value>=0&&value<=100)
                  patch(option.id,'relativeUncertaintyPercent',value);
              }}/>
            <small>{t('Margen determinista, no intervalo de confianza. Declara los márgenes en referencia y alternativa para comprobar si la mejora resiste la incertidumbre.',
              'Deterministic margin, not a confidence interval. Declare both baseline and option margins to test whether the improvement withstands uncertainty.')}</small>
          </label>
          <label className="cy-field"><span>{t('Evidencia de metodología','Methodology evidence')}</span>
            <select value={selected.evidenceId} onChange={e=>patch(option.id,'evidenceId',e.target.value)}>
              <option value="">{t('Sin fuente asociada','No supporting source')}</option>
              {data.evidence.map(e=><option value={e.id} key={e.id}>{e.title||e.id}</option>)}
            </select>
          </label>
        </div>
      </section>;
    })}
    <p className="cy-help">{t('Aunque coincidan los metadatos, deben revisarse los factores de emisión y calidad, representatividad, incertidumbres y límites del análisis por especialistas. Ningún resultado se convierte automáticamente en beneficio validado.',
      'Even with matching metadata, qualified specialists must review factor quality, representativeness, uncertainty and analysis limitations. No output automatically becomes a validated benefit.')}</p>
  </details>;
}
