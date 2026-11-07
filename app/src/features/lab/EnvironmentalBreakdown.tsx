import type { Locale } from '../../app/types';
import type { EnvironmentalAssessment, EnvironmentalIndicatorId } from '../../domain';
import type { EnvironmentalExampleValues } from './LabProvider';

const factorRows: Array<{ key: keyof EnvironmentalExampleValues; unit: string; es: string; en: string }> = [
  { key: 'newPartVirginMaterialKg', unit: 'kg', es: 'Material virgen para un módulo nuevo', en: 'Virgin material per new component' },
  { key: 'originalComponentDisposalMassKg', unit: 'kg', es: 'Residuos al desechar el módulo antiguo', en: 'Waste if the old component is discarded' },
  { key: 'repairProcessWasteKg', unit: 'kg', es: 'Residuos por una reparación', en: 'Waste per completed repair' },
  { key: 'newPartManufacturingKgCo2e', unit: 'kg CO₂e', es: 'GEI de fabricación de un módulo nuevo', en: 'GHG from manufacturing one new component' },
  { key: 'repairProcessKgCo2e', unit: 'kg CO₂e', es: 'GEI de una reparación', en: 'GHG per completed repair' },
  { key: 'newPartLogisticsKgCo2e', unit: 'kg CO₂e', es: 'GEI de transporte de un módulo nuevo', en: 'GHG from new-part logistics' },
  { key: 'repairLogisticsKgCo2e', unit: 'kg CO₂e', es: 'GEI logísticos de una reparación', en: 'GHG from repair logistics' },
  { key: 'approvedLifeExtensionHoursPerRepair', unit: 'h', es: 'Horas adicionales supuestas tras reparar (no aprobadas)', en: 'Hypothetical additional hours after repair (not approved)' },
];
type CalculatedRow = { id: EnvironmentalIndicatorId; es: string; en: string; formula: string | null; unit: string };
const count = (value: number | null, locale: Locale) =>
  value === null ? '—' : new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
const num = (value: number, locale: Locale) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
const subtraction = (a: number, b: number, locale: Locale) => `(${num(a, locale)} − ${num(b, locale)})`;

export function EnvironmentalBreakdown({ locale, assessment, values }: {
  locale: Locale;
  assessment: EnvironmentalAssessment;
  values: EnvironmentalExampleValues;
}) {
  const es = locale === 'es';
  const b = assessment.baselineEvents;
  const c = assessment.candidateEvents;
  const indicators = assessment.indicators;

  const newPartsKnown = b.newPartsManufactured !== null && c.newPartsManufactured !== null;
  const wasteKnown = b.originalComponentsDisposed !== null && c.originalComponentsDisposed !== null;
  const rows: CalculatedRow[] = [
    {
      id: 'newManufactureAvoidedUnits',
      es: 'Fabricación nueva evitada (media por decisión)',
      en: 'New manufacture avoided (average per decision)',
      formula: newPartsKnown ? `${num(b.newPartsManufactured!, locale)} − ${num(c.newPartsManufactured!, locale)}` : null,
      unit: es ? 'módulos por decisión' : 'components per decision',
    },
    {
      id: 'virginMaterialDemandDeltaKg',
      es: 'Diferencia de material virgen',
      en: 'Virgin material difference',
      formula: newPartsKnown
        ? `${subtraction(c.newPartsManufactured!, b.newPartsManufactured!, locale)} × ${num(values.newPartVirginMaterialKg, locale)} kg`
        : null,
      unit: 'kg',
    },
    {
      id: 'wasteGeneratedDeltaKg',
      es: 'Diferencia de residuos',
      en: 'Waste difference',
      formula: wasteKnown
        ? `${subtraction(c.originalComponentsDisposed!, b.originalComponentsDisposed!, locale)} × ${num(values.originalComponentDisposalMassKg, locale)} kg + ${subtraction(c.repairsCompleted, b.repairsCompleted, locale)} × ${num(values.repairProcessWasteKg, locale)} kg`
        : null,
      unit: 'kg',
    },
    {
      id: 'boundedGhgDeltaKgCo2e',
      es: 'Diferencia parcial de emisiones',
      en: 'Partial greenhouse-gas difference',
      formula: newPartsKnown
        ? `${subtraction(c.newPartsManufactured!, b.newPartsManufactured!, locale)} × ${num(values.newPartManufacturingKgCo2e, locale)} + ${subtraction(c.repairsCompleted, b.repairsCompleted, locale)} × ${num(values.repairProcessKgCo2e, locale)} + ${subtraction(c.newPartsDelivered, b.newPartsDelivered, locale)} × ${num(values.newPartLogisticsKgCo2e, locale)} + ${subtraction(c.repairsCompleted, b.repairsCompleted, locale)} × ${num(values.repairLogisticsKgCo2e, locale)}`
        : null,
      unit: 'kg CO₂e',
    },
    {
      id: 'serviceLifeExtensionHours',
      es: 'Horas de uso adicional hipotéticas',
      en: 'Hypothetical additional service hours',
      formula: `${subtraction(c.repairsReturnedToUse, b.repairsReturnedToUse, locale)} × ${num(values.approvedLifeExtensionHoursPerRepair, locale)} h`,
      unit: 'h',
    },
  ];

  return <details className="environmental-breakdown" data-testid="environmental-breakdown">
    <summary>
      <strong>{es ? '¿De dónde salen estos resultados?' : 'Where do these results come from?'}</strong>
      <span>{es ? 'Datos inventados y cálculos paso a paso' : 'Invented inputs and calculations step by step'}</span>
    </summary>
    <div className="environmental-breakdown__body">
      <p className="environmental-breakdown__warning">{es
        ? 'DEMOSTRACIÓN FICTICIA. Los factores siguientes se han inventado expresamente para enseñar el funcionamiento del simulador. No proceden de Airbus ni de un proveedor.'
        : 'FICTIONAL DEMONSTRATION. The following factors were invented to show how the simulator works. They do not come from Airbus or a supplier.'}</p>
      <h4>{es ? '1. Datos de partida inventados' : '1. Invented input factors'}</h4>
      <div className="environmental-breakdown__table-wrap">
        <table>
          <thead><tr><th>{es ? 'Concepto' : 'Input'}</th><th>{es ? 'Valor utilizado ahora' : 'Current input'}</th></tr></thead>
          <tbody>{factorRows.map((row) => <tr key={row.key}>
            <td>{es ? row.es : row.en}</td>
            <td>{num(values[row.key], locale)} {row.unit}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <h4>{es ? '2. Qué resultados físicos está suponiendo el modelo' : '2. Physical outcomes assumed by the model'}</h4>
      <p>{es
        ? 'Las cifras son medias por decisión: combinan los distintos resultados posibles y sus probabilidades. No describen fracciones de una pieza real.'
        : 'These are average outcomes per decision, weighted by each possible outcome’s probability. They do not mean fractional physical components.'}</p>
      <div className="environmental-breakdown__table-wrap">
        <table>
          <thead><tr><th>{es ? 'Resultado esperado por decisión' : 'Expected outcome per decision'}</th><th>{es ? 'Comprar nuevo' : 'Buy new'}</th><th>{es ? 'Estrategia elegida' : 'Chosen route'}</th></tr></thead>
          <tbody>
            {([
              ['newPartsManufactured', es ? 'Módulos nuevos fabricados' : 'New components manufactured'],
              ['newPartsDelivered', es ? 'Módulos nuevos entregados' : 'New components delivered'],
              ['repairsCompleted', es ? 'Reparaciones realizadas' : 'Repairs completed'],
              ['repairsReturnedToUse', es ? 'Módulos reparados puestos en uso' : 'Repaired components returned to use'],
              ['originalComponentsDisposed', es ? 'Módulos antiguos desechados' : 'Old components discarded'],
            ] as const).map(([key, label]) => <tr key={key}>
              <td>{label}</td><td>{count(b[key], locale)}</td><td>{count(c[key], locale)}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <h4>{es ? '3. Cómo se calcula cada indicador' : '3. How each indicator is calculated'}</h4>
      <p>{es
        ? 'Cada diferencia se calcula como estrategia elegida menos compra nueva, excepto las piezas nuevas evitadas y las horas adicionales. Por eso un resultado negativo en materiales, residuos o emisiones indica menos cantidad dentro de este ejemplo.'
        : 'Each difference is chosen route minus new purchase, except avoided manufacture and additional hours. A negative result for material, waste or GHG means less in this fictional example.'}</p>
      <div className="environmental-breakdown__calculations">{rows.map((row) => {
        const indicator = indicators.find((item) => item.id === row.id);
        return <section key={row.id}>
          <h5>{es ? row.es : row.en}</h5>
          <p className="environmental-breakdown__formula">{indicator?.status === 'modelled' && row.formula
            ? row.formula
            : (es ? 'No calculable con los datos o resultados físicos actuales.' : 'Cannot be calculated with the current inputs or physical assumptions.')}</p>
          <strong>{indicator?.status === 'modelled' && indicator.value !== null
            ? `${num(indicator.value, locale)} ${row.unit}`
            : (es ? 'No cuantificado' : 'Not quantified')}</strong>
        </section>;
      })}</div>
      <p className="environmental-breakdown__footnote">{es
        ? 'Importante: estos indicadores solo cubren los procesos incluidos en los supuestos. No constituyen un análisis de ciclo de vida, una huella verificada ni horas de vida aprobadas por ingeniería. Las cifras se actualizan si modificas las condiciones.'
        : 'Important: these indicators cover only the processes represented in the assumptions. They are not a lifecycle assessment, a verified footprint or engineering-approved life extension. Figures update if you change the inputs.'}</p>
    </div>
  </details>;
}
