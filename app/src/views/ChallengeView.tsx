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
  const analysis = useMemo(() => runSensitivity(scenario, variable, metric), [metric, scenario, variable]);
  const values = analysis.points.flatMap((point) => Object.values(point.values));
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const spread = maximum - minimum || 1;
  const path = (strategy: StrategyId) => analysis.points.map((point, index) => {
    const x = 18 + (index / (analysis.points.length - 1)) * 264;
    const y = 112 - ((point.values[strategy] - minimum) / spread) * 88;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  const formatMetric = (value: number) => metric === 'expectedCashOutlay' ? money(value, locale) : metric === 'probabilityTargetMet' ? `${number(value * 100, locale)}%` : `${number(value, locale)} d`;
  return <article className="lab-panel lab-sensitivity"><header><div><p className="kicker">03 / ANALYSE</p><h3>{t.sensitivity}</h3></div></header><div className="lab-inline-controls"><SelectField label={t.variable} value={variable} onChange={(value) => setVariable(value as SensitivityVariable)} options={Object.entries(t.sensitivityVariables).map(([value, label]) => ({ value, label }))} testId="sensitivity-variable" /><SelectField label={t.metric} value={metric} onChange={(value) => setMetric(value as SensitivityMetric)} options={(['expectedRecoveryDays', 'probabilityTargetMet', 'expectedCashOutlay'] as const).map((value) => ({ value, label: t.metrics[value] }))} testId="sensitivity-metric" /></div><div className="lab-chart-wrap"><svg viewBox="0 0 300 138" role="img" aria-label={`${t.sensitivity}: ${t.sensitivityVariables[variable]}`}>{[24, 46, 68, 90, 112].map((y) => <line key={y} x1="18" y1={y} x2="282" y2={y} className="lab-chart__grid" />)}{strategyOrder.map((strategy) => <path key={strategy} d={path(strategy)} className={`lab-chart__line lab-chart__line--${strategy}`} />)}</svg><div className="lab-chart-legend">{strategyOrder.map((strategy) => <span key={strategy} className={`legend--${strategy}`}><i />{t.strategies[strategy]}</span>)}</div><div className="lab-chart-range"><span>{number(analysis.points[0].input, locale)}</span><strong>{formatMetric(maximum)} ↔ {formatMetric(minimum)}</strong><span>{number(analysis.points.at(-1)?.input ?? 0, locale)}</span></div></div>{analysis.jointProbabilityAdjusted && <p className="lab-method-note">{t.jointAdjusted}</p>}</article>;
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
  const indicatorStatus = lab.environmental?.repairFirst.indicators.some((indicator) => indicator.status === 'modelled') ? t.modelled : t.notQuantified;

  return <section className="lab" aria-labelledby="challenge-title">
    <header className="lab-header"><div><p className="kicker">{locale === 'es' ? 'CASO 01 · PASO 2 DE 4' : 'CASE 01 · STEP 2 OF 4'}</p><h2 id="challenge-title">{locale === 'es' ? 'Decide y comprueba qué ocurre' : 'Make a decision and see what happens'}</h2></div><div className="lab-header__warnings"><strong>{t.fictional}</strong></div></header>
    <div className="lab-preset-row"><SelectField label={t.preset} value={lab.selectedPreset} onChange={(value) => value !== 'custom' && lab.applyPreset(value as PresetId)} options={[...LAB_PRESETS.map((preset) => ({ value: preset.id, label: t.presets[preset.id] })), ...(lab.selectedPreset === 'custom' ? [{ value: 'custom', label: t.custom }] : [])]} testId="preset-select" /><span className="phase-chip">{lab.selectedPreset === 'custom' ? t.custom : t.presets[lab.selectedPreset]}</span></div>
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
      {activePanel === 'technical' && <div className="lab-results">
        <nav className="lab-analysis-tabs" aria-label={locale === 'es' ? 'Apartados del análisis técnico' : 'Technical analysis sections'}>
          {([
            ['branches', locale === 'es' ? 'Desglose de tu elección' : 'Selected route breakdown'],
            ['sensitivity', locale === 'es' ? 'Sensibilidad y umbrales' : 'Sensitivity and thresholds'],
            ['environment', locale === 'es' ? 'Impacto ambiental' : 'Environmental effects'],
            ['method', locale === 'es' ? 'Método y fórmulas' : 'Method and equations'],
          ] as const).map(([id, label]) => <button type="button" key={id} aria-pressed={technicalTab === id} className={technicalTab === id ? 'is-active' : ''} onClick={() => setTechnicalTab(id)}>{label}</button>)}
        </nav>{lab.errors.length > 0 && <div className="lab-errors" role="alert"><strong>{t.modelInvalid}</strong><ul>{lab.errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}{lab.result && lab.classifications && <>
        {technicalTab === 'branches' && chosen && <article className="lab-panel lab-branches"><header><div><p className="kicker">{locale === 'es' ? 'DESGLOSE DE TU ELECCIÓN' : 'YOUR SELECTED ROUTE'}</p><h3>{t.strategies[chosen]}</h3><p className="lab-detail-explanation">{locale === 'es' ? 'Solo se muestran los posibles resultados de la alternativa que has elegido. Cambia la elección arriba para actualizar este desglose.' : 'Only outcomes for your selected route are shown. Choose a different route above to update the breakdown.'}</p></div></header><div className="lab-table-wrap"><table><thead><tr><th>{t.branch}</th><th>{t.probability}</th><th>{t.metrics.expectedRecoveryDays}</th><th>{t.outcome}</th><th>{t.obligations}</th><th>{t.cash}</th><th>{t.sunk}</th></tr></thead><tbody>{lab.result.strategies[chosen!].branches.map((branch) => <tr key={branch.id}><td>{branchLabel(branch.repairFeasible, branch.supplierShock, locale)}</td><td>{number(branch.probability * 100, locale)}%</td><td>{number(branch.recoveryDays, locale)} d</td><td>{branch.pathOutcome === 'new' ? (locale === 'es' ? 'Pieza nueva' : 'New part') : branch.pathOutcome === 'repair' ? (locale === 'es' ? 'Reparación' : 'Repair') : (locale === 'es' ? 'Empate de vías' : 'Tied routes')}</td><td><ul className="branch-obligations">{branch.economics.lineItems.map((item) => <li key={item.id}><span>{costLabel(item.category, locale)}</span><strong>{money(item.cashImpact, locale)}</strong></li>)}</ul></td><td>{money(branch.economics.totalCashOutlay, locale)}</td><td>{money(branch.economics.sunkCost, locale)}</td></tr>)}</tbody></table></div></article>}
        {technicalTab === 'sensitivity' && <SensitivityChart scenario={lab.scenario} locale={locale} t={t} />}
        {technicalTab === 'sensitivity' && <article className="lab-panel"><header><div><p className="kicker">04 / THRESHOLDS</p><h3>{t.thresholds}</h3></div></header><div className="threshold-grid">{thresholds.map((threshold) => <section key={threshold.id}><span>{t.thresholdNames[threshold.id]}</span><strong>{threshold.value === null ? t.thresholdStatus[threshold.status as keyof typeof t.thresholdStatus] : `${number(threshold.value, locale)} ${threshold.unit === 'days' ? t.units.days : '%'}`}</strong>{threshold.reason && <small>{threshold.reason}</small>}</section>)}</div></article>}
        {technicalTab === 'method' && <article className="lab-panel formula-panel"><header><div><p className="kicker">05 / METHOD</p><h3>{t.formulas}</h3></div></header><div className="formula-grid"><code>E[T<sub>repair</sub>] = q·(I+R) + (1−q)·(I+N+p<sub>s|¬q</sub>·S)</code><code>E[C<sub>s</sub>] = Σ<sub>b</sub> P(b)·[Σ obligations<sub>b</sub> − explicit credits<sub>b</sub>]</code><code>P(T≤target) = Σ<sub>b:Tb≤target</sub> P(b)</code><code>j ∈ [max(0,q+p−1), min(q,p)]</code></div><p>{t.formulaNote}</p></article>}
      </>}</div>}
    </div>}
    {activePanel === 'technical' && technicalTab === 'environment' && lab.environmental && lab.classifications && <article className="lab-causal"><header><div><p className="kicker kicker--lime">06 / CAUSAL TEST</p><h3>{t.causal}</h3></div><span className="phase-chip">{indicatorStatus}</span></header><div className="causal-chain">{t.causalSteps.map((step, index) => <section key={step}><span>0{index + 1}</span><strong>{step}</strong><p>{index === 1 ? `${t.causalValues[index]} · ${indicatorStatus}` : index === 3 ? `${t.causalValues[index]} · ${t.outcomes[lab.classifications!.repairFirst.nominalOutcome]}` : t.causalValues[index]}</p><button type="button" onClick={() => evidence.openEvidence({ type: 'stage', id: causalStageIds[index] })}>{et.traceStage} →</button></section>)}</div><div className="indicator-grid">{lab.environmental.repairFirst.indicators.map((indicator) => <section key={indicator.id} data-testid={`indicator-${indicator.id}`}><span className={`evidence-state evidence-state--${indicator.status === 'modelled' ? 'documented' : 'unknown'}`}>{indicator.status === 'modelled' ? t.modelled : t.notQuantified}</span><h4>{t.indicatorNames[indicator.id]}</h4><strong>{indicator.value === null ? '—' : `${number(indicator.value, locale, 2)} ${indicator.unit}`}</strong>{indicator.missingInputs.length > 0 && <small>{t.missing}: {indicator.missingInputs.join(', ')}</small>}<p>{indicator.boundary}</p></section>)}</div><p className="lab-method-note">{t.noClaim}</p></article>}
  </section>;
}
