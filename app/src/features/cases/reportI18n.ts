/** Generated report terminology; source IDs and user-entered evidence names are
 * deliberately not translated because they are audit identifiers.
 */
export function localizeResultStatus(value:string,locale:'es'|'en'):string{
  if(locale==='en')return value;
  const labels:Record<string,string>={
    stable:'estable en variaciones válidas',
    sensitive:'sensible a cambios',
    insufficient:'cobertura insuficiente',
    equivalent:'equivalente en los datos actuales',
    applies:'aplica',notApplicable:'no aplica',unknown:'desconocido',
    reviewed:'revisada (declarada)',pending:'pendiente',rejected:'rechazada',
    observed:'observado',estimate:'estimación',method:'método'
  };
  return labels[value]??value;
}
const fields:Record<string,string>={
  title:'nombre del caso',programme:'programa',decision:'decisión',
  initiative:'iniciativa',vulnerability:'vulnerabilidad',mechanism:'mecanismo',
  boundary:'perímetro',timeHorizon:'periodo de análisis',owner:'responsable'
};
export function localizeCaseDiagnostic(input:string,locale:'es'|'en'):string{
  if(locale==='en')return input;
  const investigate=input.match(/^Investigate: ([A-Za-z]+) is missing$/);
  if(investigate)return 'Investigar: falta '+(fields[investigate[1]]??investigate[1]);
  return input
    .replace('missing traceable review for baseline and alternative','falta revisión trazable para referencia y alternativa')
    .replace('Scope, technical, method and reviewer gates are not all confirmed',
      'No están confirmadas las cuatro declaraciones de alcance, viabilidad técnica, método y revisión')
    .replace('N/A exclusions require a reason:','Las exclusiones «No aplica» necesitan justificación:')
    .replace('Environmental inventory boundary/method not comparable:',
      'Perímetro o método ambiental no comparable:')
    .replace('Environmental methodology metadata require independently traceable observed evidence for baseline and alternative (user-declared only).',
      'La metodología ambiental requiere evidencia observada y trazable de referencia y alternativa; la revisión declarada no acredita aprobación independiente.')
    .replace('Environmental metadata required for baseline and alternative',
      'Se requieren metadatos ambientales en referencia y alternativa')
    .replace('not the same across alternatives','no coincide entre alternativas')
    .replace('missing for baseline or alternative','falta en referencia o alternativa')
    .replaceAll(': no data',': sin datos')
    .replaceAll(': applicability unknown',': aplicabilidad desconocida')
    .replaceAll(': invalid or out of bounds',': dato no válido o fuera de límites')
    .replaceAll('invalid calculated result','resultado calculado no válido')
    .replaceAll('inconsistent applicability','aplicabilidad incoherente');
}
