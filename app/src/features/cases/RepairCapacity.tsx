import type {Dispatch,SetStateAction} from 'react';
import type {Locale} from '../../app/types';
import {displayOptionName,type StrategicCase} from './model';
import {evaluateWorkshopCapacity,type WorkshopCapacityScenario} from './workshopCapacity';
import {timeUnit} from './universal';
type Props={locale:Locale;data:StrategicCase;setData:Dispatch<SetStateAction<StrategicCase>>};
export function RepairCapacity({locale,data,setData}:Props){
  const es=locale==='es',t=(a:string,b:string)=>es?a:b;
  const fmt=(v:number)=>new Intl.NumberFormat(es?'es-ES':'en-GB',{maximumFractionDigits:2}).format(v);
  const unit=timeUnit(data.kind,locale);
  const patch=(id:string,delta:Partial<WorkshopCapacityScenario>)=>
    setData(c=>({...c,workshopCapacity:c.workshopCapacity.map(x=>x.optionId===id?{...x,...delta}:x)}));
  const add=(optionId:string)=>setData(c=>c.workshopCapacity.some(x=>x.optionId===optionId)?c:{
    ...c,workshopCapacity:[...c.workshopCapacity,{optionId,availableBays:1,jobsAhead:0,
      serviceTimePerBacklogJob:1,targetServiceTime:1,evidenceId:''}]
  });
  const remove=(id:string)=>setData(c=>({...c,workshopCapacity:c.workshopCapacity.filter(x=>x.optionId!==id)}));
  return <details className="cy-panel" data-testid="repair-capacity">
    <summary><strong>{t('Capacidad de taller y cola de reparaciones (avanzado)',
      'Repair capacity and workshop queue (advanced)')}</strong></summary>
    <p>{t('Escenario determinista de planificación: todos los trabajos pendientes están listos al inicio, cada puesto procesa un trabajo a la vez y la reparación analizada entra al final de la cola FIFO. No modela llegadas futuras ni disponibilidad real. NO se suma automáticamente al tiempo medio de recuperación.',
      'Deterministic planning scenario: all backlog jobs are ready at the start, each repair bay processes one job at a time and the target repair joins the FIFO queue last. No future arrivals or real availability are modelled. This is NOT automatically added to the recovery KPI.')}</p>
    {data.options.map(option=>{
      const x=data.workshopCapacity.find(item=>item.optionId===option.id);
      const estimate=evaluateWorkshopCapacity(x);
      const baseline=evaluateWorkshopCapacity(data.workshopCapacity.find(item=>item.optionId===data.options[0].id));
      const delta=estimate.completionTime!==null&&baseline.completionTime!==null
        ?estimate.completionTime-baseline.completionTime:null;
      return <section key={option.id} className="cy-option-definition">
        <h4>{displayOptionName(option,locale)}</h4>
        {!x?<button type="button" onClick={()=>add(option.id)}>
          {t('+ Añadir hipótesis de capacidad','+ Add a capacity scenario')}
        </button>:<>
          <div className="cy-field-grid">
            <label className="cy-field"><span>{t('Puestos de reparación disponibles','Available repair bays')}</span>
              <input type="number" min="1" max="50" step="1" value={x.availableBays}
                onChange={e=>patch(option.id,{availableBays:Math.min(50,Math.max(1,Math.trunc(Number(e.target.value)||1)))})}/></label>
            <label className="cy-field"><span>{t('Trabajos en cola antes de la reparación','Jobs queued before the target repair')}</span>
              <input type="number" min="0" max="10000" step="1" value={x.jobsAhead}
                onChange={e=>patch(option.id,{jobsAhead:Math.min(10000,Math.max(0,Math.trunc(Number(e.target.value)||0)))})}/></label>
            <label className="cy-field"><span>{t('Duración por trabajo de la cola','Time per backlog job')} ({unit})</span>
              <input type="number" min="0.01" max="100000" step="any" value={x.serviceTimePerBacklogJob}
                onChange={e=>{const n=Number(e.target.value);if(Number.isFinite(n)&&n>0&&n<=1e5)patch(option.id,{serviceTimePerBacklogJob:n});}}/></label>
            <label className="cy-field"><span>{t('Duración de la reparación estudiada','Target repair service duration')} ({unit})</span>
              <input type="number" min="0.01" max="100000" step="any" value={x.targetServiceTime}
                onChange={e=>{const n=Number(e.target.value);if(Number.isFinite(n)&&n>0&&n<=1e5)patch(option.id,{targetServiceTime:n});}}/></label>
            <label className="cy-field"><span>{t('Evidencia disponible','Linked evidence')}</span>
              <select value={x.evidenceId} onChange={e=>patch(option.id,{evidenceId:e.target.value})}>
                <option value="">{t('Sin fuente','No source')}</option>
                {data.evidence.map(ev=><option value={ev.id} key={ev.id}>{ev.title||ev.id}</option>)}
              </select></label>
          </div>
          {estimate.status==='calculated'&&<p className="cy-help">
            {t('Espera FIFO condicionada','Conditional FIFO wait')}: {fmt(estimate.waitingTime!)} {unit};
            {' '}{t('finalización ilustrativa','illustrative completion')}: {fmt(estimate.completionTime!)} {unit}.
            {delta!==null&&option.id!==data.options[0].id&&<> {t('Diferencia frente a referencia','Difference against baseline')}: {fmt(delta)} {unit}.</>}
          </p>}
          <button type="button" onClick={()=>remove(option.id)}>{t('Eliminar escenario','Remove scenario')}</button>
        </>}
      </section>;
    })}
    <p className="cy-help">{t('Los datos no acreditan la capacidad real de taller ni la disponibilidad de piezas. Se necesita un modelo validado con llegadas, prioridades, recursos compartidos, interrupciones y datos históricos para conclusiones operativas.',
      'No actual workshop availability or repair capacity is certified. Operational conclusions require validated arrivals, priorities, shared resources, interruptions and historical data.')}</p>
  </details>;
}
