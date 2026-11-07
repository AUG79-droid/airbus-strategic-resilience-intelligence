import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { ResilienceExportPackage } from './types';
import { validateExportPackage } from './package';

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 48;
const CONTENT_WIDTH = A4[0] - MARGIN * 2;
const colours = {
  ivory: rgb(0.965, 0.953, 0.906),
  paper: rgb(0.99, 0.985, 0.96),
  pine: rgb(0.105, 0.19, 0.16),
  green: rgb(0.12, 0.36, 0.27),
  coral: rgb(0.82, 0.25, 0.15),
  coralPale: rgb(0.96, 0.86, 0.81),
  ink: rgb(0.11, 0.12, 0.105),
  muted: rgb(0.39, 0.42, 0.39),
  line: rgb(0.78, 0.79, 0.74),
};

function safeText(value: unknown) {
  return String(value ?? '')
    .replaceAll('₂', '2')
    .replaceAll('→', '->')
    .replaceAll('“', '"')
    .replaceAll('”', '"')
    .replaceAll('’', "'")
    .replaceAll('•', '-')
    .replaceAll('\u00a0', ' ');
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const rawWords = safeText(text).split(/\s+/).filter(Boolean);
  const words = rawWords.flatMap((word) => {
    if (font.widthOfTextAtSize(word, size) <= width) return [word];
    const parts: string[] = [];
    let current = '';
    for (const char of word) {
      if (current && font.widthOfTextAtSize(current + char, size) > width) {
        parts.push(current);
        current = char;
      } else current += char;
    }
    if (current) parts.push(current);
    return parts;
  });
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(candidate, size) > width) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

export async function createProfessionalPdf(data: ResilienceExportPackage) {
  const validation = validateExportPackage(data);
  if (!validation.safe) throw new Error('Export safety checks failed.');

  const pdf = await PDFDocument.create();
  pdf.setTitle('Airbus Strategic Resilience Intelligence');
  pdf.setSubject(`${data.selection.strategy} / ${data.selection.audience} / ${data.warning}`);
  pdf.setProducer(`ASRI ${data.modelVersion}`);
  pdf.setCreationDate(new Date(data.generatedAt));
  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const bodyBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const editorial = await pdf.embedFont(StandardFonts.TimesRoman);
  const editorialItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const isEs = data.locale === 'es';
  const labels = isEs ? {
    report: 'INFORME DE DECISIÓN ESTRATÉGICA', selection: 'Selección analizada', audience: 'Audiencia', strategy: 'Estrategia', scenario: 'Escenario', generated: 'Generado', executive: 'Resumen ejecutivo', conclusion: 'Conclusión principal', recommendation: 'Recomendación', boundary: 'Límite de decisión', results: 'Resultados modelizados', recovery: 'Recup. media del módulo', target: 'Cumplimiento objetivo', cash: 'Desembolso esperado', sunk: 'Gastos no recuperables estimados', assumptions: 'Hipótesis y parámetros', evidence: 'Evidencias y control de afirmaciones', gates: 'Estado de afirmaciones', limitations: 'Limitaciones', validation: 'Datos pendientes de validación', sources: 'Fuentes públicas', noBenefits: 'RESULTADOS DEL MODELO: DEBEN CONTRASTARSE ANTES DE COMUNICAR BENEFICIOS REALES', status: 'Estado', modelled: 'EJEMPLO MODELIZADO — DATOS FICTICIOS', page: 'Página', profile: 'Perfil de la estrategia', advantages: 'Ventajas modelizadas', drawbacks: 'Inconvenientes', uncertainties: 'Incertidumbres', checks: 'Revisión previa a la exportación', causal: 'Cadena causal', comparison: 'Comparación estratégica entre alternativas', decisionTest: 'Umbral de decisión', evidenceLabel: 'Sustento'
  } : {
    report: 'STRATEGIC DECISION REPORT', selection: 'Analysed selection', audience: 'Audience', strategy: 'Strategy', scenario: 'Scenario', generated: 'Generated', executive: 'Executive summary', conclusion: 'Principal conclusion', recommendation: 'Recommendation', boundary: 'Decision boundary', results: 'Modelled results', recovery: 'Average module recovery', target: 'Target attainment', cash: 'Expected cash outlay', sunk: 'Non-recoverable expenses', assumptions: 'Assumptions and parameters', evidence: 'Evidence and claim control', gates: 'Claim status', limitations: 'Limitations', validation: 'Pending validation data', sources: 'Public sources', noBenefits: 'MODEL RESULTS: VERIFY THE EVIDENCE BEFORE CLAIMING REAL-WORLD BENEFITS', status: 'Status', modelled: 'MODELLED EXAMPLE — FICTIONAL DATA', page: 'Page', profile: 'Strategy profile', advantages: 'Modelled advantages', drawbacks: 'Drawbacks', uncertainties: 'Uncertainties', checks: 'Pre-export review', causal: 'Causal chain', comparison: 'Strategic comparison across alternatives', decisionTest: 'Decision threshold', evidenceLabel: 'Support'
  };
  const strategyLabels = isEs ? { new: 'Sustitución', repairFirst: 'Reparar primero', parallel: 'Estrategia paralela' } : { new: 'Replacement', repairFirst: 'Repair first', parallel: 'Parallel strategy' };
  const audienceLabels = isEs ? { defenceCustomer: 'Cliente de Defensa', programmeManager: 'Responsable de programa', engineering: 'Ingeniería', executiveLeadership: 'Dirección ejecutiva' } : { defenceCustomer: 'Defence Customer', programmeManager: 'Programme Manager', engineering: 'Engineering', executiveLeadership: 'Executive Leadership' };
  const statusLabels = isEs ? { documentedFact: 'Hecho público documentado', hypothesis: 'Hipótesis', modelledExample: 'Ejemplo modelizado', unsupported: 'Sin respaldo suficiente', rejected: 'Afirmación rechazada', allowedContext: 'Permitida solo como contexto', blocked: 'Bloqueada' } : { documentedFact: 'Documented public fact', hypothesis: 'Hypothesis', modelledExample: 'Modelled example', unsupported: 'Insufficiently supported', rejected: 'Rejected claim', allowedContext: 'Allowed as context only', blocked: 'Blocked' };
  const ownerLabels = isEs ? { engineering: 'Ingeniería', procurement: 'Compras', sustainability: 'Sostenibilidad', programmes: 'Programas' } : { engineering: 'Engineering', procurement: 'Procurement', sustainability: 'Sustainability', programmes: 'Programmes' };
  const provenanceLabels = isEs ? { fictionalUserInput: 'Entrada ficticia editable', explicitPolicy: 'Política explícita del modelo' } : { fictionalUserInput: 'Editable fictional input', explicitPolicy: 'Explicit model policy' };
  const checkLabels: Record<string, string> = isEs ? { 'prototype-warning': 'Advertencia de prototipo', 'model-version': 'Versión del modelo y del esquema', 'validated-benefits': 'Beneficios específicos validados', 'claim-gating': 'Control de afirmaciones', 'reproducible-inputs': 'Entradas reproducibles' } : { 'prototype-warning': 'Prototype warning', 'model-version': 'Model and schema version', 'validated-benefits': 'Case-specific validated benefits', 'claim-gating': 'Claim control', 'reproducible-inputs': 'Reproducible inputs' };
  const numberFormat = new Intl.NumberFormat(data.locale, { maximumFractionDigits: 1 });
  const moneyFormat = new Intl.NumberFormat(data.locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const dateFormat = new Intl.DateTimeFormat(data.locale, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  const shortDateFormat = new Intl.DateTimeFormat(data.locale, { day: '2-digit', month: 'short', year: 'numeric' });
  const monthFormat = new Intl.DateTimeFormat(data.locale, { month: 'long', year: 'numeric' });
  const percentFormat = new Intl.NumberFormat(data.locale, { style: 'percent', maximumFractionDigits: 1 });
  const assumptionValue = (id: string, fallback: string) => {
    const scenario = data.scenarioInputs;
    if (id === 'ASSUMP-TIMING') return isEs
      ? `Inspección: ${numberFormat.format(scenario.timing.inspectionDays)} días; ejecución de reparación: ${numberFormat.format(scenario.timing.repairExecutionDays)} días; plazo de pieza nueva: ${numberFormat.format(scenario.timing.newLeadDays)} días; retraso por disrupción: ${numberFormat.format(scenario.timing.supplierShockDelayDays)} días; objetivo: ${numberFormat.format(scenario.timing.targetRecoveryDays)} días`
      : `Inspection: ${numberFormat.format(scenario.timing.inspectionDays)} days; repair execution: ${numberFormat.format(scenario.timing.repairExecutionDays)} days; new-part lead time: ${numberFormat.format(scenario.timing.newLeadDays)} days; disruption delay: ${numberFormat.format(scenario.timing.supplierShockDelayDays)} days; target: ${numberFormat.format(scenario.timing.targetRecoveryDays)} days`;
    if (id === 'ASSUMP-RISK') {
      const dependence = scenario.risks.dependence.mode === 'independent' ? (isEs ? 'independencia supuesta' : 'assumed independent') : `${isEs ? 'probabilidad conjunta' : 'joint probability'}: ${percentFormat.format(scenario.risks.dependence.repairFeasibleAndShockProbability)}`;
      return isEs ? `Viabilidad de reparación: ${percentFormat.format(scenario.risks.repairFeasibilityProbability)}; disrupción del suministro: ${percentFormat.format(scenario.risks.supplierShockProbability)}; ${dependence}` : `Repair feasibility: ${percentFormat.format(scenario.risks.repairFeasibilityProbability)}; supplier disruption: ${percentFormat.format(scenario.risks.supplierShockProbability)}; ${dependence}`;
    }
    if (id === 'ASSUMP-COST') return isEs
      ? `Inspección: ${moneyFormat.format(scenario.costs.inspection)}; reparación: ${moneyFormat.format(scenario.costs.repair)}; pieza nueva: ${moneyFormat.format(scenario.costs.newPart)}; logística de reparación: ${moneyFormat.format(scenario.costs.repairLogistics)}; logística de pieza nueva: ${moneyFormat.format(scenario.costs.newPartLogistics)}; recargo por disrupción: ${moneyFormat.format(scenario.costs.supplierShockSurcharge)}`
      : `Inspection: ${moneyFormat.format(scenario.costs.inspection)}; repair: ${moneyFormat.format(scenario.costs.repair)}; new part: ${moneyFormat.format(scenario.costs.newPart)}; repair logistics: ${moneyFormat.format(scenario.costs.repairLogistics)}; new-part logistics: ${moneyFormat.format(scenario.costs.newPartLogistics)}; disruption surcharge: ${moneyFormat.format(scenario.costs.supplierShockSurcharge)}`;
    if (id === 'ASSUMP-CONTRACT') {
      const contract = isEs ? { firmOrder: 'pedido firme', cancellableOrder: 'pedido cancelable', capacityReservation: 'reserva de capacidad' } : { firmOrder: 'firm order', cancellableOrder: 'cancellable order', capacityReservation: 'capacity reservation' };
      return isEs
        ? `Modalidad: ${contract[scenario.parallel.procurementContract]}; activación: ${moneyFormat.format(scenario.parallel.activationFee)}; compromiso al cancelar pieza nueva: ${percentFormat.format(scenario.parallel.newCancellationCommittedFraction)}; compromiso al cancelar reparación: ${percentFormat.format(scenario.parallel.repairCancellationCommittedFraction)}; valores residuales: ${scenario.parallel.residualValueRecognition.enabled ? 'reconocidos' : 'no reconocidos'}`
        : `Mode: ${contract[scenario.parallel.procurementContract]}; activation: ${moneyFormat.format(scenario.parallel.activationFee)}; new-part cancellation commitment: ${percentFormat.format(scenario.parallel.newCancellationCommittedFraction)}; repair cancellation commitment: ${percentFormat.format(scenario.parallel.repairCancellationCommittedFraction)}; residual values: ${scenario.parallel.residualValueRecognition.enabled ? 'recognised' : 'not recognised'}`;
    }
    return fallback;
  };
  const blockingEvidenceNames: Record<string, string> = isEs ? {
    'UNSUPPORTED-AIRBUS-BENEFIT': 'Advertencia: el beneficio específico del caso no está respaldado',
    'REJECTED-READINESS': 'Limitación bloqueante: la recuperación modelizada no equivale a disponibilidad de aeronave',
  } : {
    'UNSUPPORTED-AIRBUS-BENEFIT': 'Warning: the case-specific benefit is not supported',
    'REJECTED-READINESS': 'Blocking limitation: modelled recovery is not aircraft readiness',
  };
  const evidenceName = (id: string) => blockingEvidenceNames[id]
    ?? data.evidence.records.find((item) => item.id === id)?.title[data.locale]
    ?? data.evidence.sources.find((item) => item.id === id)?.title
    ?? ({ 'MODEL-ECONOMICS': isEs ? 'Modelo económico por ramas' : 'Branch economic model', 'MODEL-ENVIRONMENT': isEs ? 'Modelo ambiental del escenario' : 'Scenario environmental model', 'HYP-SUPPLY-VULNERABILITY': isEs ? 'Hipótesis de vulnerabilidad del suministro' : 'Supply vulnerability hypothesis', 'HYP-REPAIR-FEASIBILITY': isEs ? 'Hipótesis de viabilidad de reparación' : 'Repair feasibility hypothesis', 'UNSUPPORTED-AIRBUS-BENEFIT': isEs ? 'Beneficio específico no respaldado' : 'Unsupported case-specific benefit', 'REJECTED-READINESS': isEs ? 'Inferencia de disponibilidad rechazada' : 'Rejected readiness inference' }[id] ?? id.replaceAll('-', ' ').toLowerCase());
  const publicationDateLabel = (value: string | null) => {
    if (!value) return isEs ? 'fecha no indicada' : 'date not stated';
    if (/^\d{4}-\d{2}$/.test(value)) {
      const [year, month] = value.split('-').map(Number);
      return monthFormat.format(new Date(Date.UTC(year, month - 1, 1)));
    }
    return shortDateFormat.format(new Date(`${value}T00:00:00`));
  };
  const selectedResult = data.scenarioResults.strategies[data.selection.strategy];
  const comparatorResult = data.scenarioResults.strategies[data.translation.primaryComparator];
  const conclusionTimeDelta = selectedResult.expectedRecoveryDays - comparatorResult.expectedRecoveryDays;
  const conclusionCostDelta = selectedResult.expectedCashOutlay - comparatorResult.expectedCashOutlay;
  const conclusionTargetDelta = selectedResult.probabilityTargetMet - comparatorResult.probabilityTargetMet;
  const conclusionDays = Math.abs(conclusionTimeDelta);
  const conclusionDayLabel = isEs ? (conclusionDays === 1 ? 'día esperado' : 'días esperados') : (conclusionDays === 1 ? 'expected day' : 'expected days');
  const conclusionHeadline = data.translation.marginalValuePerDay !== null
    ? conclusionTimeDelta < 0
      ? (isEs
        ? `Intercambio entre tres alternativas: ${strategyLabels[data.selection.strategy]} gana ${numberFormat.format(conclusionDays)} ${conclusionDayLabel} frente a ${strategyLabels[data.translation.primaryComparator]} por ${moneyFormat.format(Math.abs(conclusionCostDelta))} adicionales, con ${Math.abs(conclusionTargetDelta) < 0.001 ? 'el mismo cumplimiento del objetivo' : 'un cumplimiento distinto'}.`
        : `Three-way trade-off: ${strategyLabels[data.selection.strategy]} gains ${numberFormat.format(conclusionDays)} ${conclusionDayLabel} over ${strategyLabels[data.translation.primaryComparator]} for an additional ${moneyFormat.format(Math.abs(conclusionCostDelta))}, with ${Math.abs(conclusionTargetDelta) < 0.001 ? 'equal target attainment' : 'different target attainment'}.`)
      : (isEs
        ? `Intercambio entre tres alternativas: ${strategyLabels[data.selection.strategy]} ahorra ${moneyFormat.format(Math.abs(conclusionCostDelta))} frente a ${strategyLabels[data.translation.primaryComparator]} a cambio de ${numberFormat.format(conclusionDays)} ${conclusionDayLabel}, con ${Math.abs(conclusionTargetDelta) < 0.001 ? 'el mismo cumplimiento del objetivo' : 'un cumplimiento distinto'}.`
        : `Three-way trade-off: ${strategyLabels[data.selection.strategy]} saves ${moneyFormat.format(Math.abs(conclusionCostDelta))} versus ${strategyLabels[data.translation.primaryComparator]} in exchange for ${numberFormat.format(conclusionDays)} additional ${conclusionDayLabel}, with ${Math.abs(conclusionTargetDelta) < 0.001 ? 'equal target attainment' : 'different target attainment'}.`)
    : data.translation.comparativeAssessment;

  let page!: PDFPage;
  let y = 0;
  const pages: PDFPage[] = [];
  const startPage = () => {
    page = pdf.addPage(A4);
    pages.push(page);
    page.drawRectangle({ x: 0, y: 0, width: A4[0], height: A4[1], color: colours.ivory });
    page.drawRectangle({ x: 0, y: A4[1] - 30, width: A4[0], height: 30, color: colours.coral });
    page.drawText(data.warning, { x: MARGIN, y: A4[1] - 19, size: 9, font: bodyBold, color: colours.paper });
    y = A4[1] - 54;
  };
  const ensure = (height: number) => { if (y - height < 48) startPage(); };
  const rule = (colour = colours.line) => { ensure(12); page.drawLine({ start: { x: MARGIN, y }, end: { x: A4[0] - MARGIN, y }, thickness: 0.7, color: colour }); y -= 12; };
  const heading = (text: string, level: 1 | 2 = 1) => {
    const size = level === 1 ? 22 : 13;
    ensure(size + 20);
    page.drawText(safeText(text).toUpperCase(), { x: MARGIN, y: y - size, size, font: level === 1 ? editorial : bodyBold, color: level === 1 ? colours.pine : colours.coral });
    y -= size + 12;
  };
  const paragraph = (text: string, options: { font?: PDFFont; size?: number; colour?: ReturnType<typeof rgb>; indent?: number; gap?: number } = {}) => {
    const font = options.font ?? body;
    const size = options.size ?? 10;
    const indent = options.indent ?? 0;
    const lineHeight = size * 1.42;
    const lines = wrap(text, font, size, CONTENT_WIDTH - indent);
    for (const line of lines) {
      ensure(lineHeight + 2);
      page.drawText(line, { x: MARGIN + indent, y: y - size, size, font, color: options.colour ?? colours.ink });
      y -= lineHeight;
    }
    y -= options.gap ?? 5;
  };
  const bullets = (items: string[]) => items.forEach((item) => paragraph(`- ${item}`, { indent: 10, size: 9.4, gap: 3 }));
  const keyValue = (key: string, value: string) => {
    const lines = wrap(value, body, 9.5, CONTENT_WIDTH - 12);
    ensure(28 + lines.length * 13);
    page.drawText(safeText(key).toUpperCase(), { x: MARGIN, y: y - 9, size: 7.5, font: bodyBold, color: colours.muted });
    lines.forEach((line, index) => page.drawText(line, { x: MARGIN + 12, y: y - 23 - index * 13, size: 9.5, font: body, color: colours.ink }));
    y -= 29 + lines.length * 13;
  };

  startPage();
  page.drawText('AIRBUS STRATEGIC', { x: MARGIN, y: y - 36, size: 34, font: editorial, color: colours.pine });
  page.drawText('RESILIENCE INTELLIGENCE', { x: MARGIN, y: y - 69, size: 29, font: editorialItalic, color: colours.coral });
  y -= 96;
  page.drawText(labels.report, { x: MARGIN, y: y - 10, size: 9, font: bodyBold, color: colours.muted });
  y -= 29;
  page.drawRectangle({ x: MARGIN, y: y - 118, width: CONTENT_WIDTH, height: 118, color: colours.pine });
  const coverPairs = [[labels.audience, audienceLabels[data.selection.audience]], [labels.strategy, strategyLabels[data.selection.strategy]], [labels.scenario, data.selection.scenario], [labels.generated, dateFormat.format(new Date(data.generatedAt))]];
  coverPairs.forEach(([key, value], index) => {
    page.drawText(safeText(key).toUpperCase(), { x: MARGIN + 18, y: y - 22 - index * 24, size: 7.5, font: bodyBold, color: colours.coralPale });
    page.drawText(safeText(value), { x: MARGIN + 150, y: y - 22 - index * 24, size: 10, font: body, color: colours.paper });
  });
  y -= 143;
  heading(labels.conclusion, 2);
  paragraph(conclusionHeadline, { font: editorial, size: 18, colour: colours.pine, gap: 10 });
  heading(labels.executive, 2);
  paragraph(data.translation.executiveSummary, { size: 10.5 });
  heading(labels.recommendation, 2);
  paragraph(data.translation.decisionRecommendation, { font: editorialItalic, size: 12 });
  paragraph(labels.noBenefits, { font: bodyBold, size: 9, colour: colours.coral });

  startPage();
  heading(labels.results);
  paragraph(labels.modelled, { font: bodyBold, size: 8.5, colour: colours.coral });
  paragraph(isEs ? 'Tiempo medio ponderado de recuperación de un módulo operativo, incluyendo éxito o fracaso de reparación y posibles retrasos de suministro. No es la duración de una reparación.' : 'Probability-weighted average time to recover an operational module, including possible repair failure and supplier delays. Not the duration of a repair.', { size: 8.5, colour: colours.ink, gap: 3 });
  const resultRows = Object.values(data.scenarioResults.strategies);
  for (const result of resultRows) {
    ensure(82);
    page.drawRectangle({ x: MARGIN, y: y - 68, width: CONTENT_WIDTH, height: 68, color: colours.paper, borderColor: colours.line, borderWidth: 0.6 });
    page.drawRectangle({ x: MARGIN, y: y - 68, width: 7, height: 68, color: result.strategy === data.selection.strategy ? colours.coral : colours.green });
    page.drawText(strategyLabels[result.strategy].toUpperCase(), { x: MARGIN + 17, y: y - 18, size: 10, font: bodyBold, color: colours.pine });
    const metrics = [`${labels.recovery}: ${numberFormat.format(result.expectedRecoveryDays)} ${isEs ? 'días' : 'days'}`, `${labels.target}: ${numberFormat.format(result.probabilityTargetMet * 100)}%`, `${labels.cash}: ${moneyFormat.format(result.expectedCashOutlay)}`, `${labels.sunk}: ${moneyFormat.format(result.expectedSunkCost)}`];
    metrics.forEach((metric, index) => page.drawText(safeText(metric), { x: MARGIN + 17 + (index % 2) * 240, y: y - 37 - Math.floor(index / 2) * 17, size: 8.8, font: body, color: colours.ink }));
    y -= 78;
  }
  heading(labels.comparison, 2);
  paragraph(data.translation.comparativeAssessment, { font: editorialItalic, size: 11, colour: colours.pine, gap: 4 });
  bullets(data.translation.comparisonStatements);
  paragraph(`${labels.decisionTest}: ${data.translation.comparativeDecisionRule}`, { font: bodyBold, size: 9, colour: colours.coral, gap: 8 });
  heading(labels.profile, 2);
  paragraph(labels.advantages, { font: bodyBold, size: 9, colour: colours.green, gap: 2 }); bullets(data.translation.advantages);
  paragraph(labels.drawbacks, { font: bodyBold, size: 9, colour: colours.coral, gap: 2 }); bullets(data.translation.drawbacks);
  paragraph(labels.uncertainties, { font: bodyBold, size: 9, colour: colours.muted, gap: 2 }); bullets(data.translation.uncertainties);
  heading(labels.boundary, 2); paragraph(data.translation.decisionBoundary);

  startPage();
  heading(labels.causal);
  data.translation.causalSteps.forEach((step, index) => {
    ensure(66);
    paragraph(`${String(index + 1).padStart(2, '0')}  ${step.label}  [${statusLabels[step.status]}]`, { font: bodyBold, size: 9, colour: colours.coral, gap: 2 });
    paragraph(step.statement, { size: 9.5, indent: 14, gap: 3 });
    const traceLabel = step.status === 'rejected' || step.status === 'unsupported'
      ? (isEs ? 'Advertencias y limitaciones bloqueantes' : 'Warnings and blocking limitations')
      : step.status === 'hypothesis'
        ? (isEs ? 'Hipótesis de apoyo' : 'Supporting assumptions')
        : step.status === 'modelledExample'
          ? (isEs ? 'Base del modelo' : 'Model basis')
          : labels.evidenceLabel;
    paragraph(`${traceLabel}: ${step.evidenceIds.map(evidenceName).join('; ')}`, { size: 7.5, colour: step.status === 'rejected' || step.status === 'unsupported' ? colours.coral : colours.muted, indent: 14, gap: 7 });
  });
  heading(labels.assumptions);
  data.evidence.assumptions.forEach((item) => keyValue(item.label[data.locale], `${assumptionValue(item.id, item.value)} · ${provenanceLabels[item.provenance]}`));

  rule();
  heading(labels.evidence);
  paragraph(data.exportPolicy.statement, { font: editorialItalic, size: 11, colour: colours.coral });
  heading(labels.gates, 2);
  data.evidence.claimGates.forEach((claim) => {
    ensure(72);
    paragraph(`${claim.title[data.locale]} — ${statusLabels[claim.status]}`, { font: bodyBold, size: 9.5, colour: claim.status === 'allowedContext' ? colours.green : colours.coral, gap: 2 });
    paragraph(claim.proposedClaim[data.locale], { font: editorialItalic, size: 10, gap: 2 });
    bullets(claim.reasons[data.locale]);
  });
  heading(labels.checks, 2);
  validation.checks.forEach((check) => paragraph(`${check.passed ? (isEs ? 'Correcto' : 'Passed') : (isEs ? 'Revisar' : 'Review')} · ${checkLabels[check.id] ?? check.id}`, { size: 8.5, colour: check.passed ? colours.green : colours.coral, gap: 3 }));

  rule();
  heading(labels.validation);
  data.translation.validationActions.forEach((action) => paragraph(`${ownerLabels[action.owner]}: ${action.action}`, { size: 9.5 }));
  heading(labels.limitations);
  bullets(data.translation.limitations);
  const sourceGap = 8;
  const sourceWidth = CONTENT_WIDTH;
  const sourceHeight = 116;
  ensure(sourceHeight * data.evidence.sources.length + sourceGap * (data.evidence.sources.length - 1) + 45);
  heading(labels.sources);
  const sourceTop = y;
  data.evidence.sources.forEach((source, index) => {
    const x = MARGIN;
    const top = sourceTop - index * (sourceHeight + sourceGap);
    page.drawRectangle({ x, y: top - sourceHeight, width: sourceWidth, height: sourceHeight, color: colours.paper, borderColor: colours.line, borderWidth: 0.6 });
    let cardY = top - 15;
    const cardLine = (text: string, font: PDFFont, size: number, colour: ReturnType<typeof rgb>, maxLines: number, gap = 4) => {
      const lines = wrap(text, font, size, sourceWidth - 18).slice(0, maxLines);
      lines.forEach((line) => { page.drawText(line, { x: x + 9, y: cardY, size, font, color: colour }); cardY -= size * 1.32; });
      cardY -= gap;
    };
    cardLine(source.title, bodyBold, 8.9, colours.pine, 1);
    const published = publicationDateLabel(source.publicationDate);
    cardLine(`${source.publisher} · ${isEs ? 'publicado' : 'published'} ${published} · ${isEs ? 'consultado' : 'accessed'} ${shortDateFormat.format(new Date(`${source.accessedDate}T00:00:00`))}`, body, 6.9, colours.muted, 1, 3);
    cardLine(source.url, body, 6.3, colours.coral, 1, 3);
    cardLine(source.limitations.join(' '), body, 7.1, colours.muted, 4, 0);
  });
  y = sourceTop - sourceHeight * data.evidence.sources.length - sourceGap * (data.evidence.sources.length - 1) - 8;

  pages.forEach((current, index) => {
    current.drawRectangle({ x: 0, y: A4[1] - 30, width: A4[0], height: 30, color: colours.coral });
    current.drawText(data.warning, { x: MARGIN, y: A4[1] - 19, size: 9, font: bodyBold, color: colours.paper });
    current.drawLine({ start: { x: MARGIN, y: 33 }, end: { x: A4[0] - MARGIN, y: 33 }, thickness: 0.5, color: colours.line });
    current.drawText(`ASRI · ${data.modelVersion}`, { x: MARGIN, y: 20, size: 7, font: body, color: colours.muted });
    const number = `${labels.page} ${index + 1} / ${pages.length}`;
    current.drawText(number, { x: A4[0] - MARGIN - body.widthOfTextAtSize(number, 7), y: 20, size: 7, font: body, color: colours.muted });
  });
  return pdf.save();
}
