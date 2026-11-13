# ASRI 2.0 — Registro de seguimiento de la auditoría externa

**Fecha de referencia:** 13/11/2026. **Alcance:** hallazgos ASRI-001 a ASRI-024.
**Rama de trabajo:** `asri-v2-audit-remediation` (PR #1, borrador). **Versión pública `main`: intacta.**

## Criterio de cierre

- **FIXED:** se ha corregido un defecto verificable, con pruebas, en la versión correspondiente.
- **PARTIAL:** el prototipo incorpora una mejora real, pero faltan mecanismos de mayor alcance o validaciones de terceros.
- **NEEDS AIRBUS:** requieren identidad, permisos, datos operativos, validación metodológica o una aprobación que la aplicación no puede concederse a sí misma.
- **Ningún test con datos sintéticos** demuestra beneficios operativos reales ni certificación ambiental.

| Hallazgo | Estado | Trabajo realizado / condición que sigue pendiente |
|---|---|---|
| 001 · Motores matemáticos separados | PARTIAL | DEMO-60 y Case Studio comparten ahora el motor de probabilidades conjuntas; proveniencia y ámbitos explícitos en interfaz. Siguen existiendo modelos de tiempo, coste y decisiones con semánticas distintas; **no debe compararse directamente una cifra de un modo con otra del segundo**. Pendiente armonización de dominio y validación entre modelos. |
| 002 · Independencia/correlación de riesgos | PARTIAL | Probabilidad conjunta explícita, cuatro ramas y límites de Fréchet; riesgos dependientes afectan al cumplimiento de plazos. El tiempo esperado sigue siendo aditivo bajo hipótesis simplificadas, sin colas ni fallos de modo común modelados en detalle. |
| 003 · Proveedores y fallos comunes | PARTIAL | Editor opcional de rutas por alternativa, nodos compartidos, potenciales puntos únicos de fallo y capacidad nominal declarada; no suma capacidades compartidas. **No infiere independencia por contar proveedores** ni cambia automáticamente los tiempos de recuperación. Falta calibrar redes, capacidades y rutas reales. |
| 004 · Sensibilidad | PARTIAL | Recalcula alteraciones individuales, muestra rangos de diferencia, entrada que invierte la conclusión y valores de prueba; ya no presenta un margen heurístico como estadística. Falta incertidumbre conjunta y validación probabilística. |
| 005 · Texto de Ingeniería contradictorio | FIXED | Descripción neutral incluso cuando un resultado empeora. |
| 006 · Revisión declarada por el usuario | PARTIAL | Se exige nombre de propietario y revisor diferentes y fuentes trazables; **no existe verificación de identidad** ni aprobación de fuentes externas. |
| 007 · Gates sin autenticación | NEEDS AIRBUS | Las casillas siguen siendo declaraciones, no autorizaciones. La integración con identidad corporativa, roles y firma/aprobación de cambios requiere infraestructura aprobada y responsables designados. |
| 008 · Inventarios ambientales incomparables | PARTIAL | Ficha de unidad funcional, periodo, límites, método, asignación y versión de factores por alternativa; gate de comparabilidad declarada y bloqueo de mensajes numéricos de beneficio si difieren. Falta ACV revisado, factores trazables, representatividad e incertidumbre. |
| 009 · Pieza frente a misión | PARTIAL | Cadena opcional componente → subsistema → plataforma → función de misión con evidencia y disponibilidad observada **introducida por separado**. Se prohíbe inferir disponibilidad de flota a partir de recuperación de una pieza. Falta modelo real de sistema y validación operativa. |
| 010 · Vite afectado | FIXED | Versión parcheada Vite 8.3.8 con `package-lock.json` sincronizado. |
| 011 · Importación JSON | PARTIAL | Estructura, fechas, IDs, rangos, rutas, inventario, enlaces de misión y checksum SHA-256 revisados. Archivos anteriores siguen siendo compatibles. Pendiente esquema formal de migración a una versión mayor. |
| 012 · Cambio de idioma reiniciaba selección | FIXED | No se remonta el workspace solo por cambiar EN/ES. |
| 013 · Unicode PDF | PARTIAL | Sustitución semántica de caracteres no WinAnsi, salto de línea y ajuste por ancho real del texto. Sigue pendiente tipografía Unicode embebida y comprobación visual de todos los glifos. |
| 014 · Saltos de línea Markdown | FIXED | Informe Markdown conserva párrafos vacíos. |
| 015 · Cobertura E2E CI | PARTIAL | Calidad incluye tests unitarios, compilación, responsive, traducción, laboratorio, evidencias, recorrido guiado, informes PDF/JSON, riesgos conjuntos y almacenamiento opcional. La cobertura de todos los caminos y accesibilidad sigue ampliable. |
| 016 · Versión manifiestos | FIXED | Versiones en `package.json` y `package-lock.json` coherentes. |
| 017 · Economía simplificada | PARTIAL | Nuevo coste incremental por unidad de tiempo de interrupción, vinculado al tiempo esperado y con advertencia de doble contabilización; no afecta a ejemplos previos si no se activa. Falta descuento, escenarios contractuales avanzados y costes de disrupción de programa. |
| 018 · Precisión incierta | PARTIAL | Diferencias en rangos de sensibilidad **deterministas**, nunca percentiles o bandas de confianza; fuentes ficticias visibles. No existen distribuciones calibradas ni intervalos de confianza reales. |
| 019 · Idiomas y numeración | PARTIAL | Etapa Translate corregida, documentación, etiquetas y condiciones del informe revisadas. Falta comprobación manual integral de toda la aplicación. |
| 020 · Gramática inglesa | FIXED | Concordancia singular/plural de días y sujeto/verbo. |
| 021 · Navegación móvil oculta | FIXED | Cuatro etapas visibles en tarjetas móviles, sin scroll horizontal oculto. |
| 022 · Borradores sin guardar | PARTIAL | Aviso al abandonar casos reales con cambios. **Solo para ejemplos ficticios**, guardado local opcional con consentimiento y eliminación al desactivarlo. Los datos reales se exportan a archivo; no se guardan en navegador ni nube. |
| 023 · Sourcemaps públicos | FIXED | Desactivados en producción. |
| 024 · Integridad de archivos y firmas | PARTIAL / NEEDS AIRBUS | JSON de caso con huella SHA-256 e importación que detecta alteraciones; el archivo anterior sin huella se identifica. No es firma digital, no autentica autores ni certifica fuentes. Para historial firmado se necesita infraestructura aprobada. |

## Pruebas de aceptación del prototipo

- `npm test`: baterías unitarias y regresión.
- `npm run build`: tipado TypeScript y producción.
- CI: recorrido responsive y bilingüe, comparativas, revisión de evidencias, exportaciones PDF/JSON, pruebas de riesgos dependientes y recuperación de borrador hipotético.
- Garantía de despliegue: los cambios de esta rama no se mezclan automáticamente con el sitio publicado.

## Conclusiones metodológicas

1. **La aplicación es todavía un prototipo de análisis condicional**, no un sistema predictivo calibrado.
2. **DEMO-60 y Case Studio tienen límites de modelo diferentes** y no pueden intercambiar sus cifras sin una armonización del dominio.
3. **Los ejemplos didácticos siguen siendo ficticios**, y las verificaciones simuladas no representan firmas de Airbus.
4. Solo Airbus puede aceptar datos, permisos, aprobaciones y afirmaciones reales ante clientes.
5. El fin de la programación NO implica cierre de todos los 24 hallazgos como verificaciones operacionales.
