import type {Dispatch,SetStateAction} from 'react';
import type {Locale} from '../../app/types';
import {assessMissionBridge,type MissionBridge} from './missionBridge';
import {displayOptionName,evidenceObserved,type StrategicCase} from './model';
type Props={locale:Locale;data:StrategicCase;setData:Dispatch<SetStateAction<StrategicCase>>};
const blank=(optionId:string):MissionBridge=>({optionId,componentOrService:'',subsystem:'',
  platform:'',missionFunction:'',dependencyType:'unknown',observedMissionAvailabilityPercent:null,evidenceId:''});
export function MissionBridgeReview({locale,data,setData}:Props){
  const es=locale==='es',t=(a:string,b:string)=>es?a:b;
  const observed=data.evidence.filter(x=>evidenceObserved(data,{value:0,evidenceId:x.id})).map(x=>x.id);
  const patch=(optionId:string,key:keyof Omit<MissionBridge,'optionId'>,value:unknown)=>
    setData(c=>{
      const entry=c.missionBridges.find(x=>x.optionId===optionId)??blank(optionId);
      return {...c,missionBridges:[...c.missionBridges.filter(x=>x.optionId!==optionId),{
        ...entry,[key]:value
      }]};
    });
  const fields:[keyof Omit<MissionBridge,'optionId'>,string,string][]=[
    ['componentOrService','Componente o servicio','Component or service'],
    ['subsystem','Subsistema que depende de él','Dependent subsystem'],
    ['platform','Plataforma o activo','Platform or asset'],
    ['missionFunction','Función de misión afectada','Affected mission function']
  ];
  return <details className="cy-panel" data-testid="mission-bridge">
    <summary><strong>{t('De componente a misión: trazabilidad del impacto (avanzado)','Component-to-mission impact chain (advanced)')}</strong></summary>
    <p>{t('El tiempo de reparación NO equivale a disponibilidad de un avión, sistema o misión. Documenta cada conexión y, únicamente si existe evidencia observada independiente, introduce por separado una métrica de disponibilidad de misión.',
      'Component recovery time does NOT equal aircraft, system or mission availability. Document the causal chain; enter a separate mission-availability figure only when supporting observed evidence is available.')}</p>
    {data.options.map(option=>{
      const entry=data.missionBridges.find(x=>x.optionId===option.id)??blank(option.id);
      const result=assessMissionBridge(entry,observed);
      return <section className="cy-option-definition" key={option.id}>
        <h4>{displayOptionName(option,locale)}</h4>
        <p className="cy-help">{result.status==='userDeclaredObservation'
          ?t('Observación declarada con fuente revisada por el usuario; sin aprobación corporativa.','User-declared observation with a user-reviewed source; not corporate approval.')
          :t('Impacto de misión NO demostrado por el modelo actual.','Mission impact is NOT demonstrated by this model.')}</p>
        <div className="cy-field-grid">
          {fields.map(([key,a,c])=><label className="cy-field" key={key}><span>{t(a,c)}</span>
            <input value={String(entry[key])} maxLength={500}
              onChange={e=>patch(option.id,key,e.target.value)}/></label>)}
          <label className="cy-field"><span>{t('Dependencia para la misión','Mission dependency')}</span>
            <select value={entry.dependencyType} onChange={e=>patch(option.id,'dependencyType',e.target.value)}>
              <option value="unknown">{t('No determinada','Unknown')}</option>
              <option value="critical">{t('Crítica (declarada)','Critical (declared)')}</option>
              <option value="redundant">{t('Con redundancia (declarada)','Redundant (declared)')}</option>
            </select></label>
          <label className="cy-field"><span>{t('Disponibilidad de misión observada, SI se dispone de ella (%)','Observed mission availability IF separately available (%)')}</span>
            <input type="number" min="0" max="100" step="any" value={entry.observedMissionAvailabilityPercent??''}
              onChange={e=>patch(option.id,'observedMissionAvailabilityPercent',e.target.value===''?null:Number(e.target.value))}/></label>
          <label className="cy-field"><span>{t('Fuente observada','Observed source')}</span>
            <select value={entry.evidenceId} onChange={e=>patch(option.id,'evidenceId',e.target.value)}>
              <option value="">{t('Sin evidencia','No evidence')}</option>
              {data.evidence.map(e=><option key={e.id} value={e.id}>{e.title||e.id}</option>)}
            </select></label>
        </div>
      </section>;
    })}
    <p className="cy-help">{t('La herramienta no calcula disponibilidad de flota ni valida misión a partir de tiempos de recuperación. La cadena y los valores introducidos requieren verificación técnica y aprobación apropiada.',
      'The tool does not calculate fleet or mission readiness from recovery times. Mapping and entered figures require independent technical evidence and appropriate approval.')}</p>
  </details>;
}
