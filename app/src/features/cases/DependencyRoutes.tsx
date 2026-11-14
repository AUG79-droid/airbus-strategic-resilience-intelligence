import type { Dispatch, SetStateAction } from 'react';
import type { Locale } from '../../app/types';
import { analyzeRoutes } from './supplyGraph';
import { displayOptionName, evidenceReviewed, type StrategicCase } from './model';

interface Props{locale:Locale;data:StrategicCase;setData:Dispatch<SetStateAction<StrategicCase>>}
export function DependencyRoutes({locale,data,setData}:Props){
  const es=locale==='es';
  const t=(a:string,b:string)=>es?a:b;
  const change=(id:string,patch:Partial<StrategicCase['dependencyRoutes'][number]>)=>
    setData(c=>({...c,dependencyRoutes:c.dependencyRoutes.map(r=>r.id===id?{...r,...patch}:r)}));
  const remove=(id:string)=>setData(c=>({...c,dependencyRoutes:c.dependencyRoutes.filter(r=>r.id!==id)}));
  const add=(optionId:string)=>setData(c=>c.dependencyRoutes.length>=24?c:({
    ...c,dependencyRoutes:[...c.dependencyRoutes,{
      id:'ROUTE-'+Date.now().toString(36)+'-'+c.dependencyRoutes.length,
      optionId,label:'',dependencies:[],capacityPercent:null,qualified:false,evidenceId:''
    }]
  }));
  const reviewedIds=data.evidence.filter(e=>evidenceReviewed(data,{value:0,evidenceId:e.id})).map(x=>x.id);
  return <details className="cy-panel" data-testid="route-dependency-analysis">
    <summary><strong>{t('Dependencias de suministro y reparación (análisis avanzado)','Supply and repair dependencies (advanced analysis)')}</strong></summary>
    <p>{t(
      'Registra rutas cualificadas y sus dependencias aguas arriba (fundición, materia prima, proveedor crítico, transporte). Escribe identificadores comunes EXACTOS para señalar riesgos compartidos. Dos proveedores diferentes no demuestran dos fuentes independientes.',
      'Register qualified routes and their upstream dependencies (processor, raw material, critical supplier, logistics). Use the SAME identifiers for shared sources. Two different suppliers do not prove independent supply.'
    )}</p>
    {data.options.map(option=>{
      const current=data.dependencyRoutes.filter(r=>r.optionId===option.id);
      const assessment=analyzeRoutes(data.dependencyRoutes,option.id,reviewedIds);
      return <section key={option.id} className="cy-panel" aria-label={displayOptionName(option,locale)}>
        <h4>{displayOptionName(option,locale)}</h4>
        <p className="cy-help">{current.length===0
          ?t('Dependencias no evaluadas. No se puede afirmar diversificación.','Dependencies not assessed. Diversification cannot be claimed.')
          :t(`Rutas declaradas: ${assessment.routes}; cualificadas: ${assessment.qualifiedRoutes}; pares sin nodos compartidos declarados: ${assessment.independentPairs}; rutas con fuente marcada como revisada: ${assessment.reviewedRoutes}.`,
            `Declared routes: ${assessment.routes}; qualified: ${assessment.qualifiedRoutes}; pairs with no declared shared nodes: ${assessment.independentPairs}; routes with user-declared reviewed evidence: ${assessment.reviewedRoutes}.`)}</p>
        {assessment.overlappingNodes.length>0&&<p className="cy-help"><strong>{t('Dependencias compartidas','Shared dependencies')}:</strong>{' '}{assessment.overlappingNodes.join(', ')}</p>}
        {assessment.singlePointsOfFailure.length>0&&<p className="cy-error">{t('Posibles puntos únicos de fallo para las rutas cualificadas','Possible single points of failure among qualified routes')}: {assessment.singlePointsOfFailure.join(', ')}</p>}
        {assessment.declaredQualifiedCapacityPercent!==null&&<p className="cy-help">{t('Capacidad nominal declarada (límite indicativo, no disponibilidad)','Declared nominal capacity (indicative ceiling, not availability)')}: {assessment.declaredQualifiedCapacityPercent}%</p>}
        {current.map(route=><div className="cy-option-definition" key={route.id}>
          <label className="cy-field"><span>{t('Nombre de la ruta','Route name')}</span><input value={route.label} onChange={e=>change(route.id,{label:e.target.value.slice(0,150)})}/></label>
          <label className="cy-field"><span>{t('Dependencias compartidas (IDs separados por coma)','Upstream dependencies (comma-separated IDs)')}</span>
            <input placeholder="processor-x, mineral-a, port-y" value={route.dependencies.join(', ')}
              onChange={e=>change(route.id,{dependencies:e.target.value.split(',').map(x=>x.trim().replace(/\s+/g,'-')).filter(Boolean).slice(0,12)})}/></label>
          <label className="cy-field"><span>{t('Capacidad nominal (%)','Declared nominal capacity (%)')}</span>
            <input type="number" min="0" max="100" value={route.capacityPercent??''}
              onChange={e=>change(route.id,{capacityPercent:e.target.value===''?null:Math.min(100,Math.max(0,Number(e.target.value)))})}/></label>
          <label className="cy-field"><span><input type="checkbox" checked={route.qualified} onChange={e=>change(route.id,{qualified:e.target.checked})}/> {t('Ruta cualificada (declaración del usuario)','Qualified route (user declaration)')}</span></label>
          <label className="cy-field"><span>{t('Evidencia de la ruta','Route evidence')}</span>
            <select value={route.evidenceId} onChange={e=>change(route.id,{evidenceId:e.target.value})}>
              <option value="">{t('No vinculada','Not linked')}</option>
              {data.evidence.map(e=><option key={e.id} value={e.id}>{e.title||e.id}</option>)}
            </select>
          </label>
          <button type="button" onClick={()=>remove(route.id)}>{t('Eliminar ruta','Remove route')}</button>
        </div>)}
        <button type="button" disabled={data.dependencyRoutes.length>=24} onClick={()=>add(option.id)}>
          {t('+ Añadir ruta','+ Add route')}
        </button>
      </section>;
    })}
    <p className="cy-help">{t(
      'La comprobación es topológica: no demuestra propiedad independiente, capacidad efectiva, fiabilidad, homologación ni mejora de disponibilidad de flota. Los valores declarados no modifican por sí solos los tiempos de recuperación calculados.',
      'This is a topology screen: it does not prove separate ownership, effective capacity, reliability, qualification or fleet availability. Declared paths do not automatically change the calculated recovery times.'
    )}</p>
  </details>;
}
