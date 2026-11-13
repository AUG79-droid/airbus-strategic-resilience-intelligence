# ASRI 2.0 — Registro técnico de los 24 hallazgos de auditoría

**Auditoría de referencia:** revisión externa de ASRI del 13/11/2026 (ASRI-001 a ASRI-024).
**Desarrollo:** `asri-v2-audit-remediation`, PR #1. **Despliegue público original:** `main`, protegido.

## Interpretación de estados
- **FIXED** = el fallo concreto ha sido corregido y cubierto por pruebas automáticas; no significa aprobación de Airbus.
- **PARTIAL** = el prototipo mejora técnicamente el hallazgo, pero su alcance sigue limitado respecto a la recomendación completa.
- **NEEDS AIRBUS** = no se puede acreditar cumplimiento sin identidad corporativa, permisos, fuentes reales y validaciones de responsables autorizados.
- **No confundir:** evidencia o aprobación *declarada por el usuario* ≠ revisión autenticada; datos simulados ≠ predicción calibrada; comprobación matemática ≠ operación real.

| ID | Estado | Entregado en ASRI 2.0 / condición pendiente |
|---|---|---|
| ASRI-001 · Dos motores | PARTIAL | DEMO-60 y Case Studio comparten ahora núcleo validado de probabilidades conjuntas. La UI muestra el tipo y ámbito de modelo; las dos arquitecturas de plazos y costes **no** son todavía equivalentes y sus KPI no deben mezclarse. Pendiente unificar el motor integral y comprobar casos equivalentes. |
| ASRI-002 · Correlación y aditividad | PARTIAL | Probabilidad conjunta introducible, límites de Fréchet, cuatro ramas y recalculado de cumplimiento. Retrasos y costes **adicionales** de fallos simultáneos opcionales y trazables. Falta modelo de colas, distribuciones, eventos en secuencia, capacidad de taller y validación de parámetros. |
| ASRI-003 · Dependencias | PARTIAL | Grafo editable de rutas cualificadas, nodos upstream compartidos, potenciales fallos comunes, capacidad nominal y enlaces a evidencias; rutas compartidas no suman capacidad ni acreditan independencia. Falta convertir red y capacidad reales en tiempos/fiabilidad calibrados. |
| ASRI-004 · Sensibilidad incorrecta | **FIXED** | Sustituido margen heurístico por recálculos por parámetro y rango de diferencias; localización del **umbral aproximado de inversión** mediante bisección. Prueba de cuatro escenarios coordinados separada y etiquetada como determinista, no estadística. La previsión calibrada sigue siendo un objetivo diferente. |
| ASRI-005 · Contradicción Ingeniería | **FIXED** | La narrativa distingue mejoras, deterioros y compromisos. Pruebas de combinación de alternativas, cuatro audiencias, español e inglés, incluidos casos desfavorables. |
| ASRI-006 · Revisión autodeclarada | PARTIAL | Se exige propietario/revisor distintos; evidencia ahora admite revisión documental, SHA-256 local, fragmento, versión, vigencia y revocación. Caducidad o revocación invalida el estado revisado. Los nombres continúan sin autenticación. |
| ASRI-007 · Gates sin firma/rol | **NEEDS AIRBUS** | Casillas explícitamente presentadas como declaraciones, NO aprobaciones. Faltan identidad, segregación de funciones, autorización y firma integradas con servicios corporativos aprobados. Nadie puede autoprestarse estos permisos desde la demo. |
| ASRI-008 · Inventarios ambientales | PARTIAL | Comparador de unidades funcionales, periodo, límites, método, asignación y versión de factores; limita las afirmaciones si difieren y exige evidencia de metodología para una comparación declarada observada. Pendiente inventario de procesos validado, factores, incertidumbre, asignaciones, ACV y revisión competente. |
| ASRI-009 · Pieza vs misión | PARTIAL | Cadena declarada componente → subsistema → plataforma → función de misión, con métrica de disponibilidad SOLO si procede de observación separada. No infiere flota ni misión desde tiempo de una pieza. Pendiente modelo autorizado de disponibilidad/MTBF/MTTR/colas/inventarios y datos reales. |
| ASRI-010 · Vite vulnerable | **FIXED** | Vite actualizado de versión afectada a 8.3.8, manifiesto y lockfile reproducibles. |
| ASRI-011 · Importación malformada | **FIXED** | ID, tipos, métricas, fechas, límites, alternativas y evidencia validados. Versión de esquema explícita (v2), migración de documentos antiguos, comprobación de relaciones/IDs y SHA-256 opcional en sobres JSON. Pendiente consolidación en biblioteca externa de esquemas para interoperabilidad institucional. |
| ASRI-012 · Reinicio de selección EN/ES | **FIXED** | Cambio de idioma sin desmontar selección. E2E comprueba alternativa B y Dirección al cambiar EN→ES→EN. |
| ASRI-013 · Unicode PDF | PARTIAL | Sustituciones científicas auditables (CO₂e, flechas, fórmulas, subíndices), saltos y ajuste tipográfico. Glifos fuera de WinAnsi quedan identificados por su código Unicode, NO silenciosamente eliminados. Para conservar todos los glifos originales hace falta incorporar fuente embebida Unicode con licencia y pruebas PDF visuales. |
| ASRI-014 · Líneas Markdown | **FIXED** | Se mantienen encabezados, separaciones y líneas en blanco. |
| ASRI-015 · CI E2E insuficiente | **FIXED** | GitHub Actions ejecuta Vitest, TypeScript, compilación, laboratorio, Check, Translate, recorrido de fases, idioma, 320/390 px, importación/exportación PDF/JSON y riesgos conjuntos. Errores de navegador han hecho fallar CI y se han corregido. |
| ASRI-016 · Versionado incoherente | **FIXED** | `package.json` es la fuente única; lockfile, interfaz, procedencia del motor y exportación usan su versión. Test automático bloquea discrepancias. |
| ASRI-017 · Economía sencilla | PARTIAL | Coste de indisponibilidad por unidad de tiempo, sobrecostes correlacionados explícitos y flujos futuros por alternativa con descuento anual y exclusión de costes ya contabilizados. Cada flujo distingue euros nominales futuros de euros constantes del año base; estos últimos solo se valoran si se declara una escalación anual, sin doble escalación de los nominales (con pruebas). Faltan conversión multi-divisa, calendario contractual verificado, simulación de contingencias y criterios aprobados por Programme. |
| ASRI-018 · Precisión engañosa | PARTIAL | Sensibilidad OAT, extremos coordinados y rangos deterministas de diferencias con número de escenarios válidos. Translate advierte que no son bandas de confianza ni distribuciones predictivas. La calibración requiere series históricas y evaluación fuera de muestra. |
| ASRI-019 · Traducción y numeración | PARTIAL | Corregidas fases 4/Translate y expresiones conflictivas; matriz automatizada de 32 combinaciones en dos idiomas. Queda revisión editorial completa de interfaz, información de usuario e informes. |
| ASRI-020 · Gramática inglesa | **FIXED** | Concordancia singular de días y verbos comparativos corregida y cubierta por pruebas de redacción. |
| ASRI-021 · Navegación móvil | **FIXED** | Cuatro fases visibles sin scroll oculto; pruebas responsive de 320 px y 390 px más escritorio. |
| ASRI-022 · Continuidad | PARTIAL | Advertencia para casos reales no exportados y guardado local voluntario **solo de ejemplos ficticios**, con recuperación y borrado al retirar consentimiento. Casos reales no se persisten sin aprobación corporativa. Historial autentificado/cifrado de casos reales pendiente. |
| ASRI-023 · Sourcemaps | **FIXED** | Los mapas de código de producción ya no se publican. |
| ASRI-024 · Integridad y auditoría | PARTIAL | JSON de caso con suma SHA-256, rechazo de cambios no correspondientes, documentos con huella calculada localmente sin subida, versión, fragmento, vencimiento y revocación. No hay firma de usuario, libro de auditoría inmutable ni gestor documental corporativo; **NO puede declararse integridad forense autenticada**. |

**Balance por hallazgo: 11 FIXED, 12 PARTIAL, 1 NEEDS AIRBUS.** Los 24 tienen un tratamiento documentado; NO equivale a afirmar que los 24 hayan quedado cerrados.

## Qué puede usar Dirección y qué no

**Sí:** recorridos didácticos, escenarios supuestos, comparación condicional con costes/riesgos/compensaciones, preguntas de validación y narrativa ajustada al público.

**No:** decisiones operativas certificadas, predicciones calibradas, evidencia de aprobación Airbus, acreditación de proveedores, ACV conforme a ISO, disponibilidad de misión inferida, cumplimiento contractual autorizado, ROI garantizado.

## Puertas antes de publicar una versión 2.0

1. Todos los tests y comprobaciones de navegador/exports deben superar CI en el último commit.
2. Revisión visual y editorial bilingüe de cambios nuevos en una vista previa independiente.
3. Mantener el despliegue actual de `main` intacto hasta que se autorice expresamente la publicación.
4. Para piloto operativo real: departamentos competentes deben aportar fuentes reales, metodología validada, identidad/roles, firma y aceptación.

**No fusionar este PR de desarrollo como despliegue operativo aprobado.**
