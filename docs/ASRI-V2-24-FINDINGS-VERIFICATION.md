# ASRI 2.0 — Verificación independiente de ASRI-001 a ASRI-024

**Fecha:** 14/11/2026  
**Rama:** `asri-v2-audit-remediation`  
**Criterio:** el estado declarado en el tracker no se acepta sin inspección de código y prueba reproducible.

## Leyenda

- **CORREGIDO:** el defecto original está resuelto y cubierto.
- **PARCIAL:** existe mejora verificable, pero no satisface toda la recomendación o depende de método/datos.
- **DEPENDE DE AIRBUS:** no puede cerrarse con código del prototipo.

## Matriz

| ID | Estado declarado | Estado verificado | Evidencia técnica independiente | Residuo / tipo |
|---|---|---|---|---|
| **ASRI-001** Dos motores | PARTIAL | **PARCIAL** | `buildRiskTable` y `aggregateTimingMoments` compartidos; `engineParity.test.ts` y prueba independiente confirman ramas/momentos equivalentes. DEMO-60 conserva reglas propias de estrategias/economía. | Limitación de modelización; falta conciliación semántica completa. |
| **ASRI-002** Correlación y aditividad | PARTIAL | **PARCIAL** | Probabilidad conjunta, Fréchet, cuatro ramas, retraso/coste conjunto y cola FIFO probados. Estados imposibles bloquean recuperación/plazo/coste. | No hay procesos de llegada, secuencias complejas, prioridades ni calibración. |
| **ASRI-003** Dependencias | PARTIAL | **PARCIAL** | `analyzeRoutes` no suma capacidad con nodos comunes y no infiere independencia de topología ausente; pruebas de rutas y navegador. | No representa red real, conmutación, inventario o capacidad efectiva. |
| **ASRI-004** Sensibilidad | FIXED | **CORREGIDO** | Recálculo OAT, cobertura válida/inválida, bisección del umbral y estrés coordinado. Nueva corrección añade `jointExtraDelay` a sensibilidad del coste con indisponibilidad. | Sigue siendo estrés determinista, no incertidumbre estadística. |
| **ASRI-005** Contradicción Ingeniería | FIXED | **CORREGIDO** | Matriz ES/EN y prueba E2E `repair-worsens`; Ingeniería reconoce viabilidad independientemente de que el resultado mejore o empeore. | Revisión editorial humana recomendable. |
| **ASRI-006** Revisión autodeclarada | PARTIAL | **PARCIAL** | Propietario≠revisor, fecha válida/no futura, vigencia y revocación; digest documental local. | Falta identidad autenticada y control documental corporativo. |
| **ASRI-007** Gates sin firma/rol | NEEDS AIRBUS | **DEPENDE DE AIRBUS** | La UI etiqueta las casillas como declaraciones, no aprobaciones. | Requiere IAM, roles, segregación, firma y autorización Airbus. |
| **ASRI-008** Inventarios ambientales | PARTIAL | **PARCIAL** | Unidad funcional, periodo, frontera, método, asignación, factor y márgenes deterministas; bloqueo si no son comparables. | No es ACV; faltan inventario/factores validados e incertidumbre metodológica. |
| **ASRI-009** Pieza a misión | PARTIAL | **PARCIAL** | Puente explícito, definición/denominador, periodo y evidencia observada; no infiere disponibilidad desde recuperación. | Falta modelo autorizado de flota/misión, MTBF/MTTR e inventarios. |
| **ASRI-010** Vite vulnerable | FIXED | **CORREGIDO** | `vite 8.3.8`; `npm ci` informa 0 vulnerabilidades. | Mantener actualización y `npm audit` en CI. |
| **ASRI-011** Importación malformada | FIXED | **CORREGIDO** | ID, esquema, opciones, métricas, fechas, parámetros, referencias, finanzas, rutas y misión validados; pruebas de manipulación y migración. UI limita a 2 MB. | Para interoperabilidad institucional convendría esquema publicado. |
| **ASRI-012** Reinicio EN/ES | FIXED | **CORREGIDO** | E2E conserva alternativa B y Dirección durante ES/EN/ES; `App` ya no remonta el caso por idioma. | Ninguno reproducido. |
| **ASRI-013** Unicode PDF | PARTIAL | **PARCIAL** | Lato embebida, mapa `ToUnicode`, `CO₂e`, flechas y acentos visibles tras render Poppler de 8 páginas. | PDF no etiquetado; falta accesibilidad y revisión de glifos fuera de Lato. |
| **ASRI-014** Markdown | FIXED | **CORREGIDO** | `reportText` preserva líneas y separaciones; pruebas de localización y estructura. | Ninguno reproducido. |
| **ASRI-015** CI E2E | FIXED | **CORREGIDO** | Workflow ejecuta unitarias/build y nueve suites E2E. La auditoría añade los cuatro casos completos y 32 combinaciones de navegador. | Mantener Chrome y considerar un segundo motor en el futuro. |
| **ASRI-016** Versionado | FIXED | **CORREGIDO** | `package.json`, lockfile, UI, procedencia y exportación comprobados por `version.test.ts`; versión 0.6.0-phase-6. | Ninguno reproducido. |
| **ASRI-017** Economía | PARTIAL | **PARCIAL** | Coste de indisponibilidad, sucesos conjuntos, flujos, descuento, base nominal/constante y no doble cómputo probados. | Falta multi-divisa, calendario contractual, impuestos/contingencias y validación Finance. |
| **ASRI-018** Precisión | PARTIAL | **PARCIAL** | Rangos OAT y coordinados se etiquetan como deterministas; cobertura incompleta impide afirmar estabilidad. | Falta calibración, muestra histórica y evaluación fuera de muestra. |
| **ASRI-019** Traducción/numeración | PARTIAL | **PARCIAL** | Fases 01–04, estados/diagnósticos ES/EN y 32 combinaciones cubiertas. Hallazgo nuevo de ahorro material falso corregido ES/EN. | Revisión editorial humana completa y términos aprobados siguen pendientes. |
| **ASRI-020** Gramática inglesa | FIXED | **CORREGIDO** | Regresiones rechazan `it unchanged`, `1 more days` y `1 less days`; recorridos EN correctos. | Ninguno material reproducido. |
| **ASRI-021** Móvil | FIXED | **CORREGIDO** | 320/390 px: cuatro fases, Back/Continue, idioma y sin desbordamiento horizontal de página. | Las vistas densas siguen requiriendo desplazamiento vertical. |
| **ASRI-022** Continuidad | PARTIAL | **PARCIAL** | Autosave ficticio voluntario, desactivado por defecto, recuperación/borrado; conversión a real purga datos/evidencias. | Sin cifrado, identidad, historial o almacenamiento corporativo. |
| **ASRI-023** Sourcemaps | FIXED | **CORREGIDO** | `vite.config.ts`: `sourcemap:false`; build no produce mapas de producción. | Ninguno reproducido. |
| **ASRI-024** Integridad/auditoría | PARTIAL | **PARCIAL** | Sobre JSON v2, SHA-256 canónico, compatibilidad v1 y rechazo de cambios; mensajes distinguen integridad de firma. | Sin firma, sello temporal, identidad o log inmutable. |

## Balance verificado

| Estado | Número |
|---|---:|
| CORREGIDO | **11** |
| PARCIAL | **12** |
| DEPENDE DE AIRBUS | **1** |
| Total | **24** |

## Pruebas de aceptación destacadas

1. **Matemática:** caso independiente correlacionado con resultado 15,5 unidades, 50 % de plazo y 165 €; coincidencia exacta.
2. **Fréchet:** solapamiento imposible bloquea los tres KPI.
3. **Narrativa adversa:** recuperación peor produce recomendación negativa; mayor material no puede producir mensaje de ahorro.
4. **Trazabilidad:** el coste por indisponibilidad no se considera respaldado sin evidencia de `jointExtraDelay`.
5. **Casos:** 4 casos × 2 alternativas × 4 audiencias en navegador.
6. **Persistencia:** JSON v2 conserva riesgo, incertidumbre y cola; manipulación altera el digest y se rechaza.
7. **PDF:** fuente Unicode real, texto científico visible y paginación legible.
8. **Main:** referencia `f049eb14aec043a79183e1b9585313219a2eed7a`; no se hizo checkout, commit, merge ni push a `main`.

## Cierre

El tracker existente describe de forma razonablemente fiel el grado de remediación, pero sus estados parciales no deben convertirse en “cerrados” por conveniencia. El cierre operativo de 13 hallazgos requiere método, datos, identidad, autorización o validación Airbus según el plan de validación.
