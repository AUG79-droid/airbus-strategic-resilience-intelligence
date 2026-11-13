import type {Dispatch,SetStateAction} from 'react';
import type {Locale} from '../../app/types';
import {displayOptionName,type StrategicCase} from './model';
import {evaluateDiscountedFinance,type ScenarioCashFlow} from './discountedCashFlows';
type Props={locale:Locale;data:StrategicCase;setData:Dispatch<SetStateAction<StrategicCase>>};
export function DiscountedFinance({locale,data,setData}:Props){
  const es=locale==='es',t=(a:string,b:string)=>es?a:b;
  const plan=data.discountedFinance;
  const percent=plan.annualDiscountPercent;
  const number=(v:number)=>new Intl.NumberFormat(es?'es-ES':'en-GB',
    {maximumFractionDigits:2}).format(v);
  const changeRate=(value:string)=>setData(c=>({...c,discountedFinance:{
    ...c.discountedFinance,annualDiscountPercent:value===''?null:
      Math.min(100,Math.max(0,Number(value)||0))
  }}));
  const add=(optionId:string)=>setData(c=>{
    if(c.discountedFinance.flows.length>=90)return c;
    const id='FLOW-'+Date.now().toString(36)+'-'+c.discountedFinance.flows.length;
    const entry:ScenarioCashFlow={id,optionId,year:1,amountEuro:0,
      accounting:'incremental',evidenceId:'',explanation:''};
    return {...c,discountedFinance:{...c.discountedFinance,
      flows:[...c.discountedFinance.flows,entry]}};
  });
  const remove=(id:string)=>setData(c=>({...c,discountedFinance:{
    ...c.discountedFinance,flows:c.discountedFinance.flows.filter(x=>x.id!==id)
  }}));
  const patch=(id:string,value:Partial<ScenarioCashFlow>)=>
    setData(c=>({...c,discountedFinance:{...c.discountedFinance,
      flows:c.discountedFinance.flows.map(x=>x.id===id?{...x,...value}:x)}}));
  const reference=evaluateDiscountedFinance(plan,data.options[0].id);
  return <details className="cy-panel" data-testid="discounted-finance">
    <summary><strong>{t('Costes futuros y valor actual (avanzado)','Future cash flows and present value (advanced)')}</strong></summary>
    <p>{t('Análisis opcional de desembolsos adicionales respecto al coste esperado del modelo. Se aplica descuento anual solo a los flujos declarados como adicionales. Los importes ya contabilizados se excluyen expresamente para evitar duplicaciones. Deben utilizarse el mismo año base, moneda, alcance y unidad funcional.',
      'Optional present-value worksheet for future cash flows additional to expected model cost. Annual discounting applies ONLY to declared incremental items. Flows already counted in expected cost are excluded to prevent double counting. Use the same base year, currency, boundary and functional unit.')}</p>
    <label className="cy-field"><span>{t('Tasa anual de descuento, declarada por el usuario (%)','User-declared annual discount rate (%)')}</span>
      <input type="number" step="any" min="0" max="100" value={percent??''}
        onChange={e=>changeRate(e.target.value)} placeholder={t('Sin evaluar','Not assessed')}/>
    </label>
    {data.options.map(option=>{
      const result=evaluateDiscountedFinance(plan,option.id);
      const delta=result.incrementalPresentValueEuro!==null&&reference.incrementalPresentValueEuro!==null
        ?result.incrementalPresentValueEuro-reference.incrementalPresentValueEuro:null;
      return <section className="cy-option-definition" key={option.id}>
        <h4>{displayOptionName(option,locale)}</h4>
        <p className="cy-help">{result.status==='calculated'
          ?t('Valor actual de flujos adicionales declarados: ','Present value of declared incremental cash flows: ')+
            number(result.incrementalPresentValueEuro!)+' €'
          :t('Sin tasa de descuento: valoración financiera NO calculada.','Discount rate missing: financial present value NOT calculated.')}
          {delta!==null&&option.id!==data.options[0].id&&
            <span>{' · '}{t('Diferencia frente a la referencia: ','Difference against baseline: ')}{number(delta)} €</span>}
        </p>
        {plan.flows.filter(x=>x.optionId===option.id).map(flow=><div className="cy-field-grid" key={flow.id}>
          <label className="cy-field"><span>{t('Año desde el año base','Year from present')}</span>
            <input type="number" min="0" max="80" step="1" value={flow.year}
              onChange={e=>patch(flow.id,{year:Math.min(80,Math.max(0,Math.trunc(Number(e.target.value)||0)))})}/></label>
          <label className="cy-field"><span>{t('Importe neto (€; negativo = crédito)','Net amount (€; negative = credit)')}</span>
            <input type="number" step="any" value={flow.amountEuro} onChange={e=>{
              const n=Number(e.target.value);if(Number.isFinite(n))patch(flow.id,{amountEuro:Math.min(1e12,Math.max(-1e12,n))});
            }}/></label>
          <label className="cy-field"><span>{t('¿Es un coste nuevo o ya incluido?','Incremental or already included?')}</span>
            <select value={flow.accounting} onChange={e=>patch(flow.id,{accounting:e.target.value as ScenarioCashFlow['accounting']})}>
              <option value="incremental">{t('Adicional; calcular valor actual','Incremental; include in present value')}</option>
              <option value="alreadyIncluded">{t('Ya contabilizado; excluir','Already counted; exclude')}</option>
            </select></label>
          <label className="cy-field"><span>{t('Concepto / hipótesis','Description / assumption')}</span>
            <input maxLength={1200} value={flow.explanation} onChange={e=>patch(flow.id,{explanation:e.target.value})}/></label>
          <label className="cy-field"><span>{t('Evidencia disponible','Available evidence')}</span>
            <select value={flow.evidenceId} onChange={e=>patch(flow.id,{evidenceId:e.target.value})}>
              <option value="">{t('Sin fuente asociada','No linked source')}</option>
              {data.evidence.map(e=><option key={e.id} value={e.id}>{e.title||e.id}</option>)}
            </select>
          </label>
          <button type="button" onClick={()=>remove(flow.id)}>{t('Eliminar flujo','Remove cash flow')}</button>
        </div>)}
        <button type="button" disabled={plan.flows.length>=90} onClick={()=>add(option.id)}>{t('+ Añadir flujo económico','+ Add cash flow')}</button>
      </section>;
    })}
    <p className="cy-help">{t(
      'No es un presupuesto validado ni un modelo estocástico. La tasa, conceptos, posibles solapamientos, periodos, fuentes y obligaciones contractuales deben revisarse antes de utilizar el resultado.',
      'This is not an approved budget or a stochastic forecast. Rate, cash-flow descriptions, overlap, horizon, sources and contractual obligations require review before use.'
    )}</p>
  </details>;
}
