import { useMemo, useState } from 'react';
import type { Locale } from '../app/types';
import type { Copy } from '../content/i18n';
import type { StrategyId } from '../domain';
import { evidenceCopy } from '../features/evidence/copy';
import { useEvidence } from '../features/evidence/EvidenceProvider';
import type { CausalStageId } from '../features/evidence/types';
import { labCopy } from '../features/lab/copy';
import { DecisionDesk } from '../features/lab/DecisionDesk';
import { LAB_PRESETS, useLab, type EnvironmentalExampleValues } from '../features/lab/LabProvider';
import type { PresetId } from '../features/lab/presets';
import { runSensitivity, type SensitivityMetric, type SensitivityVariable } from '../features/lab/sensitivity';
import { calculateThresholds } from '../features/lab/thresholds';

interface ViewProps { content: Copy; locale: Locale; guided: boolean; }
const strategyOrder: StrategyId[] = ['new', 'repairFirst', 'parallel'];
const causalStageIds: CausalStageId[] = ['initiative', 'environmentalMechanism', 'strategicVulnerability', 'resilienceOutcome', 'customerValue', 'evidenceLimitations'];

function number(value: number, locale: Locale, digits = 1) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
}
function money(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function NumericField({ label, value, unit, step = 1, min = 0, max, onChange, testId }: {
  label: string; value: number; unit?: string; step?: number; min?: number; max?: number; onChange: (value: number) => void; testId?: string;
}) {
  return <label className="lab-field"><span>{label}</span><span className="lab-field__input"><input data-testid={testId} type="number" value={value} step={step} min={min} max={max} onChange={(event) => onChange(Number(event.target.value))} />{unit && <small>{unit}</small>}</span></label>;
}

function SelectField({ label, value, onChange, options, testId }: {
  label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; testId?: string;
}) {
  return <label className="lab-field"><span>{label}</span><select data-testid={testId} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>;
}

function SensitivityChart({ scenario, locale, t }: { scenario: ReturnType<typeof useLab>['scenario']; locale: Locale; t: ReturnType<typeof labCopy> }) {
  const [variable, setVariable] = useState<SensitivityVariable>('repairFeasibilityProbability');
  const [metric, setMetric] = useState<SensitivityMetric>('expectedRecoveryDays');
  const lab = useLab();
  const es = locale === 'es';
  const analysis = useMemo(() => runSensitivity(scenario, variable, metric), [metric, scenario, variable]);
  const values = analysis.points.flatMap((point) => Object.values(point.values));
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const spread = maximum - minimum || Math.max(Math.abs(maximum) * 0.1, 1);
  const yMinimum = Math.max(0, minimum - spread * 0.13);
  const yMaximum = maximum + spread * 0.13;
  const xMinimum = analysis.points[0].input;
  const xMaximum = analysis.points[analysis.points.length - 1].input;
  const plot = { left: 110, right: 728, top: 30, bottom: 285 };
  const x = (value: number) => plot.left + ((value - xMinimum) / (xMaximum - xMinimum || 1)) * (plot.right - plot.left);
  const y = (value: number) => plot.bottom - ((value - yMinimum) / (yMaximum - yMinimum || 1)) * (plot.bottom - plot.top);
  const path = (strategy: StrategyId) => analysis.points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.input).toFixed(2)} ${y(point.values[strategy]).toFixed(2)}`).join(' ');
  const probabilityVariable = variable === 'repairFeasibilityProbability' || variable === 'supplierShockProbability';
  const costVariable = variable === 'newPartCost' || variable === 'repairCost';
  const currentInput = variable === 'repairFeasibilityProbability' ? scenario.risks.repairFeasibilityProbability :
    variable === 'supplierShockProbability' ? scenario.risks.supplierShockProbability :
    variable === 'repairExecutionDays' ? scenario.timing.repairExecutionDays :
    variable === 'newLeadDays' ? scenario.timing.newLeadDays :
    variable === 'newPartCost' ? scenario.costs.newPart : scenario.costs.repair;
  const axisX = (value: number) => probabilityVariable ? `${number(value * 100, locale, 0)}%` : costVariable ? `${number(value / 1000, locale, 0)} k€` : `${number(value, locale, 0)}`;
  const axisY = (value: number) => metric === 'expectedCashOutlay' ? `${number(value / 1000, locale, 0)} k€` : metric === 'probabilityTargetMet' ? `${number(value * 100, locale, 0)}%` : `${number(value, locale, 0)}`;
  const xLabel = `${t.sensitivityVariables[variable]}${probabilityVariable ? ' (%)' : costVariable ? ' (€)' : es ? ' (días)' : ' (days)'}`;
  const yLabel = metric === 'expectedRecoveryDays' ? (es ? 'Tiempo medio para recuperar el módulo (días)' : 'Average module recovery time (days)') :
    metric === 'probabilityTargetMet' ? (es ? 'Probabilidad de cumplir el plazo (%)' : 'Chance of meeting deadline (%)') :
    (es ? 'Desembolso medio estimado (€)' : 'Expected average cash outlay (€)');
  const currentText = `${es ? 'Situación actual' : 'Current assumptions'}: ${axisX(currentInput)}`;
  const explanation = probabilityVariable && variable === 'repairFeasibilityProbability'
    ? metric === 'expectedRecoveryDays'
      ? (es ? 'A medida que aumenta la probabilidad de poder reparar, el tiempo medio de recuperación puede bajar. La línea negra (comprar nuevo) no cambia porque esa decisión no depende de reparar.' : 'As repair feasibility rises, average recovery time may fall. The black line (buy new) stays flat because that choice does not depend on repair feasibility.')
      : (es ? 'Aumentar la viabilidad de reparación puede alterar la comparación. Cada línea representa una estrategia calculada con las mismas condiciones.' : 'Changing repair feasibility can change the comparison. Each line models a strategy under the same conditions.')
    : (es ? 'El gráfico cambia solo la variable seleccionada. Las demás condiciones permanecen iguales; por eso podemos comparar las tres estrategias.' : 'The chart changes only the selected variable. All other assumptions remain constant so the three routes can be compared.');
  const readingHint = metric === 'probabilityTargetMet'
    ? (es ? 'Cuanto más alta esté una línea, mayor es la probabilidad de cumplir el plazo.' : 'A higher line means a better chance of meeting the deadline.')
    : (es ? 'Cuanto más baja esté una línea, menor será el tiempo o el gasto estimado.' : 'A lower line means less expected time or spending.');
  const title = es ? '¿Qué ocurre si cambia una condición?' : 'What happens if a condition changes?';
  return <article className="lab-panel lab-sensitivity">
    <header><div><p className="kicker">{es ? 'COMPRUEBA LA ROBUSTEZ DE TU DECISIÓN' : 'TEST HOW ROBUST YOUR DECISION IS'}</p><h3>{title}</h3></div></header>
    <p className="sensitivity-explain">{es
      ? 'Elige qué condición quieres variar y qué resultado quieres observar. Cada línea muestra cómo reaccionaría una de las tres decisiones.'
      : 'Select one condition to vary and one outcome to observe. Each line shows how one of the three decisions responds.'}</p>
    <div className="lab-inline-controls">
      <SelectField label={es ? '¿Qué dato cambiamos?' : 'What input changes?'} value={variable} onChange={(value) => setVariable(value as SensitivityVariable)} options={Object.entries(t.sensitivityVariables).map(([value, label]) => ({ value, label }))} testId="sensitivity-variable" />
      <SelectField label={es ? '¿Qué resultado observamos?' : 'What outcome do we track?'} value={metric} onChange={(value) => setMetric(value as SensitivityMetric)} options={(['expectedRecoveryDays', 'probabilityTargetMet', 'expectedCashOutlay'] as const).map((value) => ({ value, label: t.metrics[value] }))} testId="sensitivity-metric" />
    </div>
    <div className="lab-chart-wrap">
      <div className="lab-chart-intro">
        <strong>{currentText}</strong>
        <span>{es ? 'La línea vertical discontinua señala el valor actual.' : 'The dashed vertical line marks the current value.'}</span>
      </div>
      <svg viewBox="0 0 760 365" role="img" aria-label={`${t.sensitivityVariables[variable]}: ${yLabel}`}>
        <title>{`${t.sensitivityVariables[variable]}: ${yLabel}`}</title>
        <desc>{explanation}</desc>
        {[0, 1, 2, 3, 4].map((tick) => {
          const value = yMinimum + (yMaximum - yMinimum) * tick / 4;
          const py = y(value);
          return <g key={tick}>
            <line x1={plot.left} x2={plot.right} y1={py} y2={py} className="lab-chart__grid" />
            <text x={plot.left - 13} y={py + 5} textAnchor="end" className="lab-chart-tick">{axisY(value)}</text>
          </g>;
        })}
        {[0, 1, 2, 3, 4].map((tick) => {
          const value = xMinimum + (xMaximum - xMinimum) * tick / 4;
          const px = x(value);
          return <g key={tick}>
            <line x1={px} x2={px} y1={plot.bottom} y2={plot.bottom + 6} className="lab-chart-axis" />
            <text x={px} y={plot.bottom + 23} textAnchor="middle" className="lab-chart-tick">{axisX(value)}</text>
          </g>;
        })}
        <line x1={plot.left} x2={plot.left} y1={plot.top} y2={plot.bottom} className="lab-chart-axis" />
        <line x1={plot.left} x2={plot.right} y1={plot.bottom} y2={plot.bottom} className="lab-chart-axis" />
        <line x1={x(currentInput)} x2={x(currentInput)} y1={plot.top} y2={plot.bottom} className="lab-chart-current" />
        {strategyOrder.map((strategy) => <path key={strategy} d={path(strategy)} className={`lab-chart__line lab-chart__line--${strategy}`} />)}
        {lab.result && strategyOrder.map((strategy) => <circle key={strategy} cx={x(currentInput)} cy={y(lab.result!.strategies[strategy][metric])} r="5" className={`lab-chart-point lab-chart-point--${strategy}`} />)}
        <text x={(plot.left + plot.right) / 2} y={350} textAnchor="middle" className="lab-chart-axis-label">{xLabel}</text>
        <text transform="translate(19 159) rotate(-90)" textAnchor="middle" className="lab-chart-axis-label">{yLabel}</text>
      </svg>
      <div className="lab-chart-legend">{strategyOrder.map((strategy) => <span key={strategy} className={`legend--${strategy}`}><i />{t.strategies[strategy]}</span>)}</div>
      <p className="lab-chart-insight">{explanation} {readingHint}</p>
    </div>
    {analysis.jointProbabilityAdjusted && <p className="lab-method-note">{t.jointAdjusted}</p>}
  </article>;
}


function branchLabel(repairFeasible: boolean | null, shock: boolean, locale: Locale): string {
  const es = locale === 'es';
  const repair = repairFeasible === null ? (es ? 'Compra de pieza nueva' : 'New part purchase') : repairFeasible ? (es ? 'Reparación viable' : 'Repair feasible') : (es ? 'Reparación no viable' : 'Repair not feasible');
  const supply = shock ? (es ? 'con interrupción del proveedor' : 'with supplier disruption') : (es ? 'sin interrupción' : 'without disruption');
  return `${repair}, ${supply}`;
}
const costNames: Record<string, [string, string]> = {
  inspection: ['Inspección', 'Inspection'],
  repairCompleted: ['Reparación realizada', 'Completed repair'],
  newPartCompleted: ['Pieza nueva suministrada', 'New part supplied'],
  parallelActivation: ['Activación de vías paralelas', 'Parallel activation'],
  newCancellationCommitment: ['Compromiso de compra cancelada', 'Cancelled order commitment'],
  newCancellationFee: ['Penalización por cancelar compra', 'Procurement cancellation fee'],
  repairCancellationCommitment: ['Compromiso de reparación cancelada', 'Cancelled repair commitment'],
  repairCancellationFee: ['Penalización por cancelar reparación', 'Repair cancellation fee'],
  repairLogistics: ['Logística de reparación', 'Repair logistics'],
  newPartLogistics: ['Logística de compra nueva', 'New part logistics'],
  supplierShockSurcharge: ['Recargo por disrupción', 'Supplier disruption surcharge'],
  activationCredit: ['Crédito de activación', 'Activation credit'],
};
function costLabel(code: string, locale: Locale): string {
  const label = costNames[code];
  return label ? label[locale === 'es' ? 0 : 1] : code;
}

export function ChallengeView({ content: _content, locale, guided }: ViewProps) {
  const t = labCopy(locale);
  const et = evidenceCopy(locale);
  const lab = useLab();
  const evidence = useEvidence();
  const [chosen, setChosen] = useState<StrategyId | null>(null);
  const [activePanel, setActivePanel] = useState<'parameters' | 'technical' | null>(null);
  const [technicalTab, setTechnicalTab] = useState<'branches' | 'sensitivity' | 'environment' | 'method'>('branches');
  const thresholds = useMemo(() => lab.result ? calculateThresholds(lab.scenario) : [], [lab.result, lab.scenario]);
  const setTiming = (key: keyof typeof lab.scenario.timing, value: number) => lab.updateScenario((draft) => { draft.timing[key] = value; });
  const setCost = (key: keyof typeof lab.scenario.costs, value: number) => lab.updateScenario((draft) => { draft.costs[key] = value; });
  const setParallel = <K extends keyof typeof lab.scenario.parallel>(key: K, value: typeof lab.scenario.parallel[K]) => lab.updateScenario((draft) => { draft.parallel[key] = value; });
  const selectOptions = (values: string[]) => values.map((value) => ({ value, label: t.options[value as keyof typeof t.options] ?? value }));
  const switchDependence = (mode: string) => lab.updateScenario((draft) => { draft.risks.dependence = mode === 'joint' ? { mode: 'joint', repairFeasibleAndShockProbability: draft.risks.repairFeasibilityProbability * draft.risks.supplierShockProbability } : { mode: 'independent' }; });
  const environmentalKeys = Object.keys(lab.environmentalValues) as (keyof EnvironmentalExampleValues)[];
  const selectedEnvironmental = chosen === 'parallel' ? lab.environmental?.parallel : chosen === 'repairFirst' ? lab.environmental?.repairFirst : null;
  const indicatorStatus = selectedEnvironmental?.indicators.some((indicator) => indicator.status === 'modelled') ? t.modelled : t.notQuantified;

  return <section className="lab" aria-labelledby="challenge-title">
    <header className="lab-header"><div><p className="kicker">{locale === 'es' ? 'CASO 01 · PASO 2 DE 4' : 'CASE 01 · STEP 2 OF 4'}</p><h2 id="challenge-title">{locale === 'es' ? 'Decide y comprueba qué ocurre' : 'Make a decision and see what happens'}</h2></div><div className="lab-header__warnings"><strong>{t.fictional}</strong></div></header>
    <div className="lab-preset-row"><SelectField label={t.preset} value={lab.selectedPreset} onChange={(value) => value !== 'custom' && lab.applyPreset(value as PresetId)} options={[...LAB_PRESETS.map((preset) => ({ value: preset.id, label: t.presets[preset.id] })), ...(lab.selectedPreset === 'custom' ? [{ value: 'custom', label: t.custom }] : [])]} testId="preset-select" /><p className="lab-scenario-help">{locale === 'es' ? 'El escenario describe las condiciones. Tu elección es una de las tres alternativas que aparecen debajo.' : 'The scenario sets the conditions. Your decision is one of the three routes below.'}</p></div>
    <DecisionDesk locale={locale} chosen={chosen} onChoose={setChosen} activePanel={activePanel} onPanel={(panel) => {
      const next = activePanel === panel ? null : panel;
      setActivePanel(next);
      if (next) window.requestAnimationFrame(() => document.getElementById('lab-detailed-analysis')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }} />
    {activePanel && <div className={`lab-workbench lab-workbench--${activePanel}`} id="lab-detailed-analysis">
      {activePanel === 'parameters' && <aside className="lab-controls" aria-label={t.title}>
        {guided ? <>
          <section className="lab-basic-controls" data-testid="basic-controls"><header><span>01</span><div><strong>{t.guidedBasic}</strong><small>{t.guidedBasicNote}</small></div></header><div className="lab-field-grid"><NumericField testId="risk-repair-feasibility" label={t.fields.repairFeasibilityProbability} value={lab.scenario.risks.repairFeasibilityProbability * 100} unit="%" max={100} onChange={(value) => lab.updateScenario((draft) => { draft.risks.repairFeasibilityProbability = value / 100; })} /><NumericField testId="timing-repairExecutionDays" label={t.fields.repairExecutionDays} value={lab.scenario.timing.repairExecutionDays} unit={t.units.days} onChange={(value) => setTiming('repairExecutionDays', value)} /><NumericField testId="timing-newLeadDays" label={t.fields.newLeadDays} value={lab.scenario.timing.newLeadDays} unit={t.units.days} onChange={(value) => setTiming('newLeadDays', value)} /><NumericField testId="risk-supplier-shock" label={t.fields.supplierShockProbability} value={lab.scenario.risks.supplierShockProbability * 100} unit="%" max={100} onChange={(value) => lab.updateScenario((draft) => { draft.risks.supplierShockProbability = value / 100; })} /><NumericField testId="timing-targetRecoveryDays" label={t.fields.targetRecoveryDays} value={lab.scenario.timing.targetRecoveryDays} unit={t.units.days} onChange={(value) => setTiming('targetRecoveryDays', value)} /></div></section>
          <details data-testid="advanced-controls"><summary>{t.guidedAdvanced}</summary><p className="lab-method-note">{t.guidedAdvancedNote}</p><div className="lab-field-grid"><NumericField testId="timing-inspectionDays" label={t.fields.inspectionDays} value={lab.scenario.timing.inspectionDays} unit={t.units.days} onChange={(value) => setTiming('inspectionDays', value)} /><NumericField testId="timing-supplierShockDelayDays" label={t.fields.supplierShockDelayDays} value={lab.scenario.timing.supplierShockDelayDays} unit={t.units.days} onChange={(value) => setTiming('supplierShockDelayDays', value)} /><SelectField label={t.fields.dependenceMode} value={lab.scenario.risks.dependence.mode} onChange={switchDependence} options={selectOptions(['independent', 'joint'])} />{lab.scenario.risks.dependence.mode === 'joint' && <NumericField label={t.fields.jointProbability} value={lab.scenario.risks.dependence.repairFeasibleAndShockProbability * 100} unit="%" max={100} onChange={(value) => lab.updateScenario((draft) => { if (draft.risks.dependence.mode === 'joint') draft.risks.dependence.repairFeasibleAndShockProbability = value / 100; })} />}</div></details>
        </> : <>
          <details open><summary>{t.sections.timing}</summary><div className="lab-field-grid">{(Object.keys(lab.scenario.timing) as (keyof typeof lab.scenario.timing)[]).map((key) => <NumericField key={key} testId={`timing-${key}`} label={t.fields[key]} value={lab.scenario.timing[key]} unit={t.units.days} onChange={(value) => setTiming(key, value)} />)}</div></details>
          <details open><summary>{t.sections.risk}</summary><div className="lab-field-grid"><NumericField testId="risk-repair-feasibility" label={t.fields.repairFeasibilityProbability} value={lab.scenario.risks.repairFeasibilityProbability * 100} unit="%" max={100} onChange={(value) => lab.updateScenario((draft) => { draft.risks.repairFeasibilityProbability = value / 100; })} /><NumericField testId="risk-supplier-shock" label={t.fields.supplierShockProbability} value={lab.scenario.risks.supplierShockProbability * 100} unit="%" max={100} onChange={(value) => lab.updateScenario((draft) => { draft.risks.supplierShockProbability = value / 100; })} /><SelectField label={t.fields.dependenceMode} value={lab.scenario.risks.dependence.mode} onChange={switchDependence} options={selectOptions(['independent', 'joint'])} />{lab.scenario.risks.dependence.mode === 'joint' && <NumericField label={t.fields.jointProbability} value={lab.scenario.risks.dependence.repairFeasibleAndShockProbability * 100} unit="%" max={100} onChange={(value) => lab.updateScenario((draft) => { if (draft.risks.dependence.mode === 'joint') draft.risks.dependence.repairFeasibleAndShockProbability = value / 100; })} />}</div></details>
        </>}
        <details><summary>{t.sections.costs}</summary><div className="lab-field-grid">{(Object.keys(lab.scenario.costs) as (keyof typeof lab.scenario.costs)[]).map((key) => <NumericField key={key} label={t.fields[key]} value={lab.scenario.costs[key]} unit="€" step={1000} onChange={(value) => setCost(key, value)} />)}</div></details>
        <details><summary>{t.sections.contract}</summary><div className="lab-field-grid"><SelectField label={t.fields.procurementContract} value={lab.scenario.parallel.procurementContract} onChange={(value) => setParallel('procurementContract', value as typeof lab.scenario.parallel.procurementContract)} options={selectOptions(['firmOrder', 'cancellableOrder', 'capacityReservation'])} /><label className="lab-check"><input type="checkbox" checked={lab.scenario.parallel.procurementStartsAtDecision} onChange={(event) => setParallel('procurementStartsAtDecision', event.target.checked)} /><span>{t.fields.procurementStartsAtDecision}</span></label><NumericField label={t.fields.activationFee} value={lab.scenario.parallel.activationFee} unit="€" step={1000} onChange={(value) => setParallel('activationFee', value)} /><NumericField label={t.fields.activationCreditOnCompletedPurchase} value={lab.scenario.parallel.activationCreditOnCompletedPurchase} unit="€" step={1000} onChange={(value) => setParallel('activationCreditOnCompletedPurchase', value)} /><NumericField label={t.fields.newCancellationCommittedFraction} value={lab.scenario.parallel.newCancellationCommittedFraction * 100} unit="%" max={100} onChange={(value) => setParallel('newCancellationCommittedFraction', value / 100)} /><NumericField label={t.fields.newCancellationFee} value={lab.scenario.parallel.newCancellationFee} unit="€" step={1000} onChange={(value) => setParallel('newCancellationFee', value)} /><NumericField label={t.fields.repairCancellationCommittedFraction} value={lab.scenario.parallel.repairCancellationCommittedFraction * 100} unit="%" max={100} onChange={(value) => setParallel('repairCancellationCommittedFraction', value / 100)} /><NumericField label={t.fields.repairCancellationFee} value={lab.scenario.parallel.repairCancellationFee} unit="€" step={1000} onChange={(value) => setParallel('repairCancellationFee', value)} /><SelectField label={t.fields.onRepairWins} value={lab.scenario.parallel.onRepairWins} onChange={(value) => setParallel('onRepairWins', value as typeof lab.scenario.parallel.onRepairWins)} options={selectOptions(['cancelNew', 'completeNewToInventory'])} /><SelectField label={t.fields.onNewWins} value={lab.scenario.parallel.onNewWins} onChange={(value) => setParallel('onNewWins', value as typeof lab.scenario.parallel.onNewWins)} options={selectOptions(['cancelRepair', 'completeRepairToInventory'])} /><SelectField label={t.fields.tiePolicy} value={lab.scenario.parallel.tiePolicy} onChange={(value) => setParallel('tiePolicy', value as typeof lab.scenario.parallel.tiePolicy)} options={selectOptions(['useRepairCancelNew', 'useNewCancelRepair', 'completeBothUseRepair', 'completeBothUseNew'])} /><SelectField label={t.fields.cancelledNewPhysicalOutcome} value={lab.scenario.parallel.cancelledNewPhysicalOutcome} onChange={(value) => setParallel('cancelledNewPhysicalOutcome', value as typeof lab.scenario.parallel.cancelledNewPhysicalOutcome)} options={selectOptions(['cancelledBeforeManufacture', 'manufacturingStarted', 'unknown'])} /><SelectField label={t.fields.cancelledRepairPhysicalOutcome} value={lab.scenario.parallel.cancelledRepairPhysicalOutcome} onChange={(value) => setParallel('cancelledRepairPhysicalOutcome', value as typeof lab.scenario.parallel.cancelledRepairPhysicalOutcome)} options={selectOptions(['disposed', 'unknown'])} /><label className="lab-check"><input type="checkbox" checked={lab.scenario.parallel.residualValueRecognition.enabled} onChange={(event) => lab.updateScenario((draft) => { draft.parallel.residualValueRecognition.enabled = event.target.checked; })} /><span>{t.fields.recogniseResidualValues}</span></label>{lab.scenario.parallel.residualValueRecognition.enabled && <><NumericField label={t.fields.newPartInventoryValue} value={lab.scenario.parallel.residualValueRecognition.newPartInventoryValue ?? 0} unit="€" step={1000} onChange={(value) => lab.updateScenario((draft) => { draft.parallel.residualValueRecognition.newPartInventoryValue = value; })} /><NumericField label={t.fields.repairedComponentInventoryValue} value={lab.scenario.parallel.residualValueRecognition.repairedComponentInventoryValue ?? 0} unit="€" step={1000} onChange={(value) => lab.updateScenario((draft) => { draft.parallel.residualValueRecognition.repairedComponentInventoryValue = value; })} /></>}</div></details>
        <details><summary>{t.sections.environment}</summary><label className="lab-check lab-check--accent"><input data-testid="environment-toggle" type="checkbox" checked={lab.environmentalEnabled} onChange={(event) => lab.setEnvironmentalEnabled(event.target.checked)} /><span>{t.environmentalToggle}</span></label><p className="lab-method-note">{t.environmentalWarning}</p>{lab.environmentalEnabled && <div className="lab-field-grid">{environmentalKeys.map((key) => <NumericField key={key} label={t.environmental[key]} value={lab.environmentalValues[key]} unit={key.includes('Co2e') ? 'kg CO₂e' : key.includes('Hours') ? 'h' : 'kg'} onChange={(value) => lab.updateEnvironmentalValue(key, value)} />)}</div>}</details>
      </aside>}
      {activePanel === 'parameters' && chosen && lab.result && <div className="lab-conditions-live" data-testid="live-conditions">
        <p className="kicker">{locale === 'es' ? 'RESULTADO ACTUALIZADO DE TU ELECCIÓN' : 'LIVE RESULT FOR YOUR CHOICE'}</p>
        <h3>{t.strategies[chosen]}</h3>
        <p>{locale === 'es' ? 'Al cambiar un dato se recalcula el tiempo medio de recuperación (no el tiempo de reparar físicamente la pieza), el cumplimiento y el coste.' : 'Changing an input recalculates average recovery time (not physical repair duration), deadline attainment and cost.'}</p>
        <dl>
          <div><dt>{t.metrics.expectedRecoveryDays}</dt><dd>{number(lab.result.strategies[chosen].expectedRecoveryDays, locale)} {t.units.days}</dd></div>
          <div><dt>{t.metrics.probabilityTargetMet}</dt><dd>{number(lab.result.strategies[chosen].probabilityTargetMet * 100, locale)}%</dd></div>
          <div><dt>{t.metrics.expectedCashOutlay}</dt><dd>{money(lab.result.strategies[chosen].expectedCashOutlay, locale)}</dd></div>
        </dl>
        <button type="button" onClick={() => {
          setActivePanel(null);
          window.requestAnimationFrame(() => document.getElementById('decision-desk-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        }}>{locale === 'es' ? 'Volver a la comparación' : 'Back to your comparison'} →</button>
      </div>}
      {activePanel === 'technical' && <div className="lab-results">
        <nav className="lab-analysis-tabs" aria-label={locale === 'es' ? 'Apartados del análisis técnico' : 'Technical analysis sections'}>
          {([
            ['branches', locale === 'es' ? 'Desglose de tu elección' : 'Selected route breakdown'],
            ['sensitivity', locale === 'es' ? '¿Cuándo conviene reparar o comprar?' : 'When should we repair or buy?'],
            ['environment', locale === 'es' ? 'Impacto ambiental' : 'Environmental effects'],
            ['method', locale === 'es' ? 'Método y fórmulas' : 'Method and equations'],
          ] as const).map(([id, label]) => <button type="button" key={id} aria-pressed={technicalTab === id} className={technicalTab === id ? 'is-active' : ''} onClick={() => setTechnicalTab(id)}>{label}</button>)}
        </nav>{lab.errors.length > 0 && <div className="lab-errors" role="alert"><strong>{t.modelInvalid}</strong><ul>{lab.errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}{lab.result && lab.classifications && <>
        {technicalTab === 'branches' && chosen && <article className="lab-panel lab-branches"><header><div><p className="kicker">{locale === 'es' ? 'DESGLOSE DE TU ELECCIÓN' : 'YOUR SELECTED ROUTE'}</p><h3>{t.strategies[chosen]}</h3><p className="lab-detail-explanation">{locale === 'es' ? 'Solo se muestran los posibles resultados de la alternativa que has elegido. Cambia la elección arriba para actualizar este desglose.' : 'Only outcomes for your selected route are shown. Choose a different route above to update the breakdown.'}</p></div></header><div className="lab-table-wrap"><table><thead><tr><th>{t.branch}</th><th>{t.probability}</th><th>{t.metrics.expectedRecoveryDays}</th><th>{t.outcome}</th><th>{t.obligations}</th><th>{t.cash}</th><th>{t.sunk}</th></tr></thead><tbody>{lab.result.strategies[chosen!].branches.map((branch) => <tr key={branch.id}><td>{branchLabel(branch.repairFeasible, branch.supplierShock, locale)}</td><td>{number(branch.probability * 100, locale)}%</td><td>{number(branch.recoveryDays, locale)} d</td><td>{branch.pathOutcome === 'new' ? (locale === 'es' ? 'Pieza nueva' : 'New part') : branch.pathOutcome === 'repair' ? (locale === 'es' ? 'Reparación' : 'Repair') : (locale === 'es' ? 'Empate de vías' : 'Tied routes')}</td><td><ul className="branch-obligations">{branch.economics.lineItems.map((item) => <li key={item.id}><span>{costLabel(item.category, locale)}</span><strong>{money(item.cashImpact, locale)}</strong></li>)}</ul></td><td>{money(branch.economics.totalCashOutlay, locale)}</td><td>{money(branch.economics.sunkCost, locale)}</td></tr>)}</tbody></table></div></article>}
        {technicalTab === 'sensitivity' && <SensitivityChart scenario={lab.scenario} locale={locale} t={t} />}
        {technicalTab === 'sensitivity' && <article className="lab-panel"><header><div><p className="kicker">{locale === "es" ? "UMBRAL" : "THRESHOLD"}</p><h3>{t.thresholds}</h3></div></header><div className="threshold-grid">{thresholds.map((threshold) => <section key={threshold.id}><span>{t.thresholdNames[threshold.id]}</span><strong>{threshold.value === null ? t.thresholdStatus[threshold.status as keyof typeof t.thresholdStatus] : `${number(threshold.value, locale)} ${threshold.unit === 'days' ? t.units.days : '%'}`}</strong>{threshold.reason && <small>{threshold.reason}</small>}</section>)}</div></article>}
        {technicalTab === 'method' && <article className="lab-panel formula-panel"><header><div><p className="kicker">{locale === "es" ? "MÉTODO" : "METHOD"}</p><h3>{t.formulas}</h3></div></header><div className="formula-grid"><code>E[T<sub>repair</sub>] = q·(I+R) + (1−q)·(I+N+p<sub>s|¬q</sub>·S)</code><code>E[C<sub>s</sub>] = Σ<sub>b</sub> P(b)·[Σ obligations<sub>b</sub> − explicit credits<sub>b</sub>]</code><code>P(T≤target) = Σ<sub>b:Tb≤target</sub> P(b)</code><code>j ∈ [max(0,q+p−1), min(q,p)]</code></div><p>{t.formulaNote}</p></article>}
      </>}</div>}
    </div>}
    {activePanel === 'technical' && technicalTab === 'environment' && chosen === 'new' && <article className="lab-panel" style={{ padding: 24 }}><h3>{locale === 'es' ? 'Sustitución: estrategia de referencia' : 'Replacement: reference strategy'}</h3><p>{locale === 'es' ? 'Los indicadores ambientales del laboratorio representan diferencias respecto a comprar una pieza nueva. Selecciona Reparar primero o En paralelo para consultar su posible efecto ambiental; ningún beneficio está validado.' : 'Environmental indicators are differences from purchasing a new part. Select Repair first or Parallel to inspect potential environmental effects; no benefit is validated.'}</p></article>}
    {activePanel === 'technical' && technicalTab === 'environment' && selectedEnvironmental && lab.classifications && <article className="lab-causal"><header><div><p className="kicker kicker--lime">{locale === "es" ? "ANÁLISIS CAUSAL" : "CAUSAL ANALYSIS"}</p><h3>{t.causal}</h3></div><span className="phase-chip">{indicatorStatus}</span></header><div className="causal-chain">{t.causalSteps.map((step, index) => <section key={step}><span>0{index + 1}</span><strong>{step}</strong><p>{index === 1 ? `${t.causalValues[index]} · ${indicatorStatus}` : index === 3 ? `${t.causalValues[index]} · ${t.outcomes[lab.classifications![chosen === 'parallel' ? 'parallel' : 'repairFirst'].nominalOutcome]}` : t.causalValues[index]}</p><button type="button" onClick={() => evidence.openEvidence({ type: 'stage', id: causalStageIds[index] })}>{et.traceStage} →</button></section>)}</div><div className="indicator-grid">{selectedEnvironmental.indicators.map((indicator) => <section key={indicator.id} data-testid={`indicator-${indicator.id}`}><span className={`evidence-state evidence-state--${indicator.status === 'modelled' ? 'documented' : 'unknown'}`}>{indicator.status === 'modelled' ? t.modelled : t.notQuantified}</span><h4>{t.indicatorNames[indicator.id]}</h4><strong>{indicator.value === null ? '—' : `${number(indicator.value, locale, 2)} ${indicator.unit}`}</strong>{indicator.missingInputs.length > 0 && <small>{t.missing}: {indicator.missingInputs.join(', ')}</small>}<p>{indicator.boundary}</p></section>)}</div><p className="lab-method-note">{t.noClaim}</p></article>}
  </section>;
}
