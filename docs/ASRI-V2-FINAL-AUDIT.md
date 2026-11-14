# ASRI 2.0 — Auditoría técnica final independiente

**Fecha:** 14/11/2026  
**Rama auditada:** `asri-v2-audit-remediation`  
**Base de la auditoría:** `d3507331548ce681eccb8b3cb40af7ed2b2c4577`  
**`main` de referencia:** `f049eb14aec043a79183e1b9585313219a2eed7a`  
**Pull Request:** [#1](https://github.com/AUG79-droid/airbus-strategic-resilience-intelligence/pull/1)  
**Clasificación del producto:** prototipo didáctico; no validado para uso operativo, contractual, de aeronavegabilidad, de misión o de ACV.

## 1. Dictamen

**APTA CON LIMITACIONES para una demostración ejecutiva.**

No quedan defectos de programación críticos o altos conocidos en la versión corregida por esta auditoría. Se localizaron cinco hallazgos nuevos: dos altos, dos medios/bajos y una mejora de rendimiento. Los cuatro primeros se corrigieron y se cubrieron con pruebas; la optimización del tamaño de los paquetes JavaScript queda abierta por no afectar a la corrección de resultados ni al recorrido de demostración.

ASRI 2.0 es fiable como **simulador condicional didáctico**: calcula de forma reproducible los resultados correspondientes a los supuestos introducidos, separa datos ficticios de hechos documentados, conserva los estados de evidencia y advierte que SHA-256 no es una firma. No es una herramienta operativa de Airbus: carece de datos calibrados, identidad corporativa, firma, circuito de aprobación, integración documental, modelo de flota/misión validado, ACV verificado y aceptación de Finance/Contracts/Engineering.

## 2. Alcance y método

Se realizó:

- inspección del repositorio completo, del historial del PR y de los dos documentos obligatorios;
- comparación de la rama con `origin/main`;
- revisión individual de ASRI-001 a ASRI-024;
- análisis estático de React/TypeScript, motor probabilístico, economía, sensibilidad, integridad, evidencias, PDF y persistencia;
- instalación reproducible con `npm ci` y auditoría de dependencias;
- 249 pruebas Vitest, typecheck y build de producción;
- nueve suites E2E con Chrome contra una vista previa local;
- recorrido real de los cuatro casos, las cuatro fases, dos alternativas y cuatro audiencias;
- pruebas independientes con resultados esperados calculados fuera de las funciones auditadas;
- casos límite: probabilidades imposibles, límites de Fréchet, sucesos simultáneos, alternativa desfavorable, datos ausentes, JSON manipulado, idioma, móvil de 320/390 px, PDF y Unicode;
- renderizado visual de los PDF con Poppler.

No se usaron datos confidenciales ni reales de Airbus. No se modificó, fusionó ni desplegó `main`.

## 3. Resultados cuantitativos

| Control | Resultado final |
|---|---:|
| Vitest | **249 superadas / 0 fallidas**, 34 ficheros |
| TypeScript | **1/1 superado** |
| Build Vite | **1/1 superado** |
| Suites E2E | **9/9 superadas** |
| Combinaciones de casos en navegador | **32/32 superadas** |
| Viewports explícitos | 1440 px, 390 px y 320 px |
| Dependencias (`npm ci`) | **0 vulnerabilidades notificadas** |
| Hallazgos originales | 11 corregidos, 12 parciales, 1 depende de Airbus |
| Hallazgos nuevos | **5** |
| Hallazgos nuevos corregidos | **4** |
| Críticos abiertos | **0** |
| Altos de programación abiertos | **0** |

El build muestra una advertencia de rendimiento: `index` minificado de 681,60 kB y `fontkit` de 710,70 kB. No afecta a la corrección, pero conviene reducir la carga inicial y mantener PDF/fontkit bajo importación diferida.

## 4. Hallazgos nuevos

### ASRI-FINAL-001 — ALTO — Corregido

**Tipo:** defecto de programación / trazabilidad matemática.

Cuando `downtimeRate` estaba activo, el coste esperado dependía del tiempo medio de recuperación. Si se declaraba `jointExtraDelay`, ese retraso alteraba el coste, pero `compareOption` no lo incluía entre las fuentes exigidas ni entre los parámetros perturbados para la sensibilidad del coste.

**Riesgo:** un coste podía aparecer como respaldado y estable sin evidencia del retraso conjunto que lo modificaba.

**Corrección:** inclusión de `jointExtraDelay` en la procedencia y sensibilidad de `expectedCost` cuando existe valoración de indisponibilidad.

**Prueba:** regresión en `model.test.ts`: el coste se calcula, pero `evidenceReady=false` mientras falta la fuente; pasa a `true` al enlazarla y aumenta la cobertura de perturbaciones.

### ASRI-FINAL-002 — ALTO — Corregido

**Tipo:** defecto de programación / afirmación potencialmente engañosa.

La narrativa Eurodrone para Cliente de Defensa afirmaba siempre «consumir menos materiales», incluso si se invertía el dato y la alternativa consumía más.

**Riesgo:** contradicción entre cálculo y mensaje ejecutivo.

**Corrección:** texto ambiental condicionado al signo real: reducción, aumento, igualdad o información no comparable.

**Prueba:** dos regresiones ES/EN invierten el consumo de material y exigen que el texto reconozca el aumento y prohíba afirmar ahorro.

### ASRI-FINAL-003 — MEDIO — Corregido

**Tipo:** cobertura de QA.

La matriz de 32 combinaciones existía en Vitest, pero el CI no recorría en navegador los cuatro casos preparados completos; la cobertura E2E se concentraba en Eurodrone.

**Corrección:** nueva suite `test-four-case-journeys.mjs`, añadida a `package.json` y al quality gate.

**Prueba:** Eurodrone, Clima, SAF e Incendios recorren 01–04, dos alternativas y cuatro audiencias; se comprueban contenido, siete conclusiones ampliadas y ausencia de `NaN`, `Infinity` y errores de página.

### ASRI-FINAL-004 — BAJO — Corregido

**Tipo:** mantenimiento/documentación.

Comentarios y nombres de prueba seguían hablando de 19 entradas cuando el catálogo universal contiene 23.

**Corrección:** terminología sincronizada con el catálogo real.

### ASRI-FINAL-005 — MEDIO — Abierto

**Tipo:** rendimiento/mantenibilidad.

Vite advierte de paquetes superiores a 500 kB después de minificar. No hubo fallo funcional, desbordamiento ni error de consola en escritorio o móvil.

**Recomendación:** medir carga en la red objetivo de la demostración; separar rutas/funciones no usadas al inicio y confirmar que `pdf-lib`/`fontkit` solo se descargan al exportar. Criterio: sin advertencia injustificada o presupuesto de rendimiento documentado y probado.

## 5. Auditoría matemática

### 5.1 Probabilidades conjuntas y Fréchet

DEMO-60 y Case Studio comparten `buildRiskTable` y `aggregateTimingMoments`. Case Studio convierte correctamente la probabilidad declarada de fallo técnico y disrupción simultáneos a la convención del motor DEMO-60, que trabaja con éxito técnico y disrupción. Los límites de Fréchet se validan y los estados imposibles bloquean recuperación, plazo y coste.

Prueba independiente:

- éxito técnico = 60 %;
- disrupción = 50 %;
- fallo y disrupción simultáneos = 30 %;
- ramas: 40 % éxito/sin disrupción, 20 % éxito/disrupción, 10 % fallo/sin disrupción, 30 % fallo/disrupción;
- tiempos: 10, 16, 14 y 23;
- recuperación esperada independiente: `0,4×10 + 0,2×16 + 0,1×14 + 0,3×23 = 15,5`;
- cumplimiento de plazo 15: 50 %;
- coste esperado independiente: `100 + 0,5×20 + 0,4×30 + 0,3×40 + 2×15,5 = 165`.

Los tres valores coinciden con el motor. Un solapamiento imposible de 15 % cuando el fallo total es 10 % devuelve estado inválido.

### 5.2 Tiempos, plazo y sucesos simultáneos

Case Studio calcula la media ponderada de tiempos de rama y el cumplimiento como suma de probabilidades de ramas que terminan antes del objetivo. `jointExtraDelay` se aplica una sola vez a la rama conjunta, además de los retrasos aislados. No se detectó doble contabilización en el escenario independiente.

DEMO-60 mantiene políticas de estrategia distintas: en reparar primero, una disrupción de proveedor solo afecta cuando se necesita pieza nueva; en paralelo, vence la vía viable más rápida. Por ello, la paridad entre motores es **paridad de núcleo probabilístico y momentos**, no identidad general de políticas. ASRI-001 permanece parcial.

### 5.3 Sensibilidad y escenarios combinados

La heurística original fue sustituida por recálculo OAT y bisección del umbral de cambio. Las perturbaciones fuera del dominio no se descartan como prueba de estabilidad. Los cuatro extremos coordinados se presentan como estrés determinista, nunca como intervalo de confianza o distribución.

Limitaciones: un ±10 % declarado por el usuario no es incertidumbre estadística; la prueba no calibra probabilidades, correlaciones temporales ni distribuciones. ASRI-004 queda corregido como defecto original; ASRI-018 sigue parcial por falta de calibración.

### 5.4 Colas y capacidad

La cola FIFO es matemáticamente coherente para su supuesto acotado: trabajos presentes en `t=0`, bahías idénticas, duraciones deterministas y objetivo último. Se mantiene separada del KPI principal para evitar doble cómputo. No modela llegadas, prioridades, averías, habilidades ni recursos compartidos; no puede presentarse como capacidad real.

### 5.5 Economía

Los costes condicionales se ponderan por su evento y el coste conjunto es incremental. La indisponibilidad usa `tarifa × E[T]`, válido por linealidad. Los flujos futuros distinguen euros nominales y constantes, aplican escalación solo a estos últimos y excluyen partidas marcadas como ya incluidas.

Siguen fuera del modelo: multi-divisa, impuestos, inflación contractual específica, calendario de hitos, contingencias estocásticas y conciliación con Programme Finance. ASRI-017 permanece parcial.

## 6. Cuatro casos didácticos

Los cuatro se identifican como hipotéticos y sus referencias `SIM-*` declaran que no son documentos Airbus.

| Caso | Alternativa A: recuperación / plazo | Alternativa B: recuperación / plazo | Verificación |
|---|---:|---:|---|
| Eurodrone | 92 días / 64,8 % | 69,2 días / 99 % | correcta |
| Adaptación climática | 24,4 h / 52,7 % | 14,7 h / 98,1 % | correcta |
| SAF | 25,7 días / 0 % | 17,2 días / 72 % | correcta |
| Incendios | 24,1 min / 72 % | 16,9 min / 99,5 % | correcta |

Se verificaron:

- las cuatro fases y los botones de navegación;
- las dos alternativas y cuatro audiencias;
- 7 secciones de análisis ampliado;
- conclusiones desfavorables y compromisos;
- bloqueo de beneficios reales;
- comparabilidad ambiental y límites;
- persistencia JSON de capacidad e incertidumbre.

## 7. Narrativa ejecutiva

La misma evidencia se adapta de forma diferenciada:

- Cliente de Defensa: continuidad y recuperación, sin inferir flota;
- Ingeniería: viabilidad, ensayos, seguridad y autorizaciones;
- Programme: plazo, coste, compromisos y umbrales;
- Dirección: vulnerabilidad, inversión y decisión.

Las pruebas adversas confirman que una recuperación peor no genera una recomendación positiva. El defecto ambiental ASRI-FINAL-002 quedó corregido. Los mensajes siguen siendo condicionales y no sustituyen aprobación experta.

## 8. UX, exportaciones, seguridad e integridad

- navegación completa y Back/Continue: correcta;
- selección y audiencia sobreviven ES/EN/ES: correcto;
- 1440/390/320 px: sin desbordamiento horizontal de página;
- JSON v2: valida estructura, IDs, referencias y límites; v1 se migra y se marca como legado;
- SHA-256: detecta manipulación del contenido; se presenta correctamente como integridad, no autenticidad;
- importación: límite de 2 MB en UI y rechazo de estructura/valores no válidos;
- PDF Case Studio: fuente Lato OFL embebida, `ToUnicode`, acentos, flechas y `CO₂e` visibles;
- PDF DEMO-60: render A4, paginación y pies correctos;
- PDF: no etiquetado para accesibilidad; ASRI-013 permanece parcial;
- producción: `sourcemap:false`;
- dependencias: `npm ci` informa 0 vulnerabilidades; Vite 8.3.8 no es la versión afectada 8.3.6 del hallazgo original;
- aplicación estática: sin backend, autenticación ni envío de documentos; las cadenas React se escapan;
- guardado local ficticio: voluntario, desactivado por defecto y sin cifrar, con advertencia explícita.

## 9. Estado de los 24 hallazgos

La evidencia detallada está en [ASRI-V2-24-FINDINGS-VERIFICATION.md](./ASRI-V2-24-FINDINGS-VERIFICATION.md).

- **CORREGIDOS:** ASRI-004, -005, -010, -011, -012, -014, -015, -016, -020, -021 y -023.
- **PARCIALES:** ASRI-001, -002, -003, -006, -008, -009, -013, -017, -018, -019, -022 y -024.
- **DEPENDE DE AIRBUS:** ASRI-007.

## 10. Condiciones para la demostración

Puede presentarse a José Coll si se abre con estas condiciones:

1. es una demo didáctica con datos ficticios;
2. muestra resultados condicionales, no predicciones calibradas;
3. las casillas y revisores son declaraciones/simulaciones, no firmas;
4. el componente no se extrapola a disponibilidad de flota o misión;
5. los resultados ambientales no son un ACV certificado;
6. ningún JSON/PDF debe cargarse con datos Airbus en GitHub o en la URL pública;
7. la decisión solicitada es autorizar estudiar un piloto controlado, no aprobar uso operativo.

## 11. Bloqueos para uso operativo

Impedirían utilizar ASRI operativamente:

- falta de datos autorizados y backtesting;
- falta de método aprobado para dependencias, colas, economía y ACV;
- falta de IAM, roles, segregación, firma y auditoría inmutable;
- falta de almacenamiento corporativo cifrado y política de retención;
- falta de modelo de misión/flota y validación de Engineering/Programme/Operator;
- falta de aceptación de Finance/Contracts y de Security/Information Governance.

## 12. Conclusión

ASRI 2.0 ha mejorado de forma material respecto a la auditoría original. La corrección matemática del prototipo es defendible dentro de sus supuestos y las salvaguardas de comunicación son sustancialmente mejores. El producto es adecuado para explicar el método y solicitar un piloto, pero no para recomendar decisiones reales ni acreditar beneficios Airbus.
