# ASRI — Create Your Own Strategic Case
Guía para equipos GTS · versión exploratoria · 11/11/2026

## Qué es
Un recorrido independiente de **DEMO-60** para evaluar una iniciativa de sostenibilidad como una decisión de resiliencia. Admite casos nuevos y cuatro escenarios de aprendizaje: Eurodrone (ecodiseño), adaptación climática, SAF e incendios forestales. Cada uno comienza en **01 INVESTIGATE** y recorre **02 CHALLENGE → 03 CHECK → 04 TRANSLATE**. Los ejemplos son 100 % hipotéticos, incluso cuando mencionan programas Airbus como contexto; sus números, costes y resultados no proceden de ningún programa.

## Cómo lo utiliza una persona de GTS

**01 · INVESTIGATE — plantear una decisión concreta.** Elegir el modelo: general, materiales y ecodiseño, adaptación climática, SAF o coordinación ante incendios. Introducir título, actividad o programa, pregunta de decisión, iniciativa, vulnerabilidad, mecanismo causal esperado, alcance y unidad de comparación, horizonte temporal y equipo responsable. Puede cargar uno de los cuatro casos hipotéticos para aprender; al pulsar «Convertir en plantilla vacía para datos reales» desaparecen todos los números ficticios.

**02 · CHALLENGE — introducir y comparar datos.** Crear una referencia y dos alternativas; se pueden editar los nombres. Cada modelo tiene cuatro indicadores iniciales, con dirección de mejora (mayor/menor), unidades y límites de admisibilidad. Se permiten cambiar los nombres y direcciones. Introducir datos del mismo periodo y unidad funcional, evitando mezclar escenarios. El cálculo muestra diferencia absoluta, porcentaje cuando corresponde, resultado mejor/peor o compromiso y una sensibilidad con margen ± editable. **No es una simulación predictiva calibrada**: no predice disponibilidad de flota, eficacia de extinción, emisiones certificadas ni aprobación de combustible.

**03 · CHECK — registrar las pruebas.** Por cada dato, identificar la fuente en un registro con ID, título, referencia documental o URL, área responsable, revisor, fecha, naturaleza (medición observada, estimación o método), estado (pendiente, revisada declarada, rechazada) y limitaciones. Vincular cada registro con la celda de referencia o alternativa en CHALLENGE. Confirmar equivalencia de alcance, elegibilidad técnica, método de medida y revisión. La herramienta señala los datos o evidencias ausentes; una casilla marcada **no es una aprobación formal**.

**04 · TRANSLATE — adaptar el argumento.** Elegir una de las alternativas y la audiencia (Cliente de Defensa, Ingeniería, Responsable de Programa o Dirección). El mensaje se construye a partir de los datos y supuestos del caso, con conclusión, compromisos, límites y pruebas pendientes. Descargar JSON para continuar, PDF o Markdown para discusión; una exportación **no constituye validación**.

## Datos mínimos y fuentes

| Grupo | Datos necesarios | Responsable que normalmente puede aportarlos |
|---|---|---|
| Definición del caso | Producto, unidad funcional, escenario y decisión | GTS / Programa |
| Comparación técnica | Baseline y alternativas equivalentes; límites y aprobaciones | Ingeniería / Autoridad técnica |
| Resiliencia | Tiempos de recuperación, acceso a suministros o continuidad según modelo | Operaciones / Soporte |
| Economía | Costes relevantes medidos en el mismo horizonte, contratos, contingencias | Programa / Compras / Finanzas |
| Ambiental | Datos trazables de materiales y ciclo de vida cuando proceda | Medio Ambiente / LCA |
| Evidencia | ID, documento, dueño, revisor, fecha, calidad, incertidumbre y límites | Cada área propietaria |

## Los cuatro modelos de entrada

- **Ecodiseño/Eurodrone:** plazo de reposición, fuentes cualificadas, material virgen y coste de soporte. La comparación debe respetar la madurez del diseño, el control de cambios y la cualificación. Una segunda fuente no prueba por sí misma independencia real.
- **Adaptación climática:** capacidad disponible bajo un mismo evento, recuperación, material adicional de mitigación y coste de adaptación. No extrapolar de una base o evento a toda la flota.
- **SAF:** misiones con combustible autorizado accesible, suministradores cualificados, GEI del ciclo de vida por misión equivalente y costes. Un vuelo de ensayo no sustituye una autorización operativa.
- **Incendios forestales:** tiempo de detección a alerta útil, disponibilidad de comunicaciones, falsas alarmas y coste del ejercicio. No inferir hectáreas, daños o vidas salvadas.

## Método, límites y calidad

Por indicador, el resultado principal es **Δ = valor de alternativa − valor de referencia**. La dirección de mejora se define por el KPI. Si hay mejoras y deterioros simultáneos, la conclusión es **compromiso**, no un «ganador». Con referencia cero, no se calcula porcentaje. El control de sensibilidad aplica un margen absoluto `±m% × (|referencia| + |alternativa|)`; sirve para explorar la fragilidad del resultado, **no** es un intervalo de confianza estadístico.

El sistema no permite presentar como mediciones revisadas un caso hipotético ni una comparación sin datos, fuentes de ambas alternativas, revisión identificada y comprobaciones cumplidas. Incluso si se introducen documentos revisados, la causalidad, los requisitos de seguridad y la aprobación del mensaje siguen siendo tareas de los responsables técnicos y de negocio: ASRI no valida automáticamente un beneficio ambiental u operacional.

## Seguridad y confidencialidad

ASRI está publicado como demostración en **GitHub Pages público**. El estado del caso se mantiene en memoria del navegador; no hay servidor ASRI de almacenamiento ni mecanismo de autorización corporativa en esta versión. **No introducir información confidencial de Airbus, del cliente, datos personales, contratos ni archivos internos**. Utilizar datos públicos o anónimos hasta disponer de un despliegue corporativo autorizado. Los archivos JSON y PDF se generan localmente y deben manejarse con las normas de clasificación de información de su organización.

## Lo que falta para convertirlo en herramienta operativa aprobada

1. Revisión de GTS e Ingeniería de los indicadores y sus límites por familia de casos.
2. Conexión gobernada a fuentes corporativas y control de acceso autorizado (en lugar de referencias introducidas manualmente).
3. Calibración y validación independiente de modelos predictivos específicos donde se necesiten; el comparador actual no los sustituye.
4. Auditoría, gestión de versiones, aprobación formal de afirmaciones y revisión de ciberseguridad/protección de datos.

**Objetivo del prototipo:** que cualquier equipo pueda estructurar un caso reproducible y saber qué falta para demostrar su valor sin generar greenwashing ni asumir que una cifra ilustrativa es un beneficio real.
