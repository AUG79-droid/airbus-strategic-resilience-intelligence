# ASRI — Create Your Own Strategic Case
Guía para equipos GTS · versión exploratoria · 11/11/2026

## Qué es
Un recorrido independiente de **DEMO-60** para evaluar una iniciativa de sostenibilidad como una decisión de resiliencia. Admite casos nuevos y cuatro escenarios de aprendizaje: Eurodrone (ecodiseño), adaptación climática, SAF e incendios forestales. Cada uno comienza en **01 INVESTIGATE** y recorre **02 CHALLENGE → 03 CHECK → 04 TRANSLATE**. Los ejemplos son 100 % hipotéticos, incluso cuando mencionan programas Airbus como contexto; sus números, costes y resultados no proceden de ningún programa.

## Cómo lo utiliza una persona de GTS

**01 · INVESTIGATE — plantear una decisión concreta.** Elegir el modelo: general, materiales y ecodiseño, adaptación climática, SAF o coordinación ante incendios. Introducir título, actividad o programa, pregunta de decisión, iniciativa, vulnerabilidad, mecanismo causal esperado, alcance y unidad de comparación, horizonte temporal y equipo responsable. Puede cargar uno de los cuatro casos hipotéticos para aprender; al pulsar «Convertir en plantilla vacía para datos reales» desaparecen todos los números ficticios.

**02 · CHALLENGE — un mismo panel de análisis para todos los casos.** Aparecen seis apartados con idéntico catálogo de 19 variables: (1) condiciones operativas y plazos, (2) riesgos y probabilidades, (3) obligaciones económicas, (4) contratos, (5) factores ambientales y (6) evidencias e incertidumbre. Cada escenario empieza con los campos pertinentes activados, pero el usuario puede inspeccionar los diecinueve y cambiar su estado.

Cada variable admite exactamente tres estados: **Aplica** (se introduce un valor para la referencia y cada alternativa), **No aplica** (se excluye la variable de su cálculo y se conserva la justificación) y **Dato desconocido** (el cálculo que depende de ella queda pendiente). **No aplica nunca se convierte en cero.** Los pares dependientes —por ejemplo, probabilidad de disrupción y días de retraso, o probabilidad de cancelación y su penalización— deben tener aplicabilidad coherente; de lo contrario el cálculo se bloquea. No se obliga a introducir campos irrelevantes, aunque todos están disponibles en todos los casos.

Los resultados **se calculan realmente** desde estos controles, no desde una tabla de cuatro indicadores introducidos manualmente. Fórmulas explícitas: tiempo medio = mayor plazo de recuperación/suministro + probabilidades de fallo y disrupción multiplicadas por sus retrasos; cumplimiento del objetivo = suma de las probabilidades de las ramas que cumplen plazo (suponiendo independencia); coste esperado = costes fijos y de logística más inversiones, reservas y recargos ponderados por probabilidad. Los materiales, residuos y GEI se comparan directamente para el mismo perímetro, sin calificarse como análisis de ciclo de vida certificado. Se muestran diferencias y compromisos, con sensibilidad ± elegida por el usuario: no es un intervalo de confianza ni una predicción calibrada.

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

## Cómo se adaptan los cuatro ejemplos sin cambiar los campos

Los **19 parámetros y seis apartados son los mismos** para Eurodrone, adaptación climática, SAF e incendios. Lo que cambia es su aplicabilidad inicial, las unidades de tiempo (días, horas o minutos) y los valores **hipotéticos** que se han preparado para aprender. Por ejemplo, un caso sin contrato de cancelación puede marcar ese par como *No aplica*, mientras que Eurodrone puede evaluar un plazo condicionante de proveedor. Los efectos calculados permanecen condicionados a los supuestos y la revisión de cada caso.

El botón «Crear un caso nuevo» inicia una ficha vacía. Los cuatro ejemplos precargan la ficha y los controles, pero **todos comienzan en Investigar**. «Guardar o recuperar mi trabajo» es una función opcional para descargar un JSON y abrirlo desde el equipo más adelante; ASRI no guarda automáticamente los casos en su servidor.

## Método, límites y calidad

Para cada resultado calculable, **Δ = valor de alternativa − valor de referencia**. La dirección de mejora está fijada por la naturaleza del indicador (por ejemplo, menor plazo o mayor cumplimiento), sin obligar al usuario a seleccionar «Mejora cuando». Si hay mejoras y deterioros simultáneos, la conclusión es **compromiso**, no un «ganador». Con referencia cero, no se calcula porcentaje. El control de sensibilidad aplica un margen absoluto `±m% × (|referencia| + |alternativa|)`; sirve para explorar la fragilidad del resultado, **no** es un intervalo de confianza estadístico.

El sistema no permite presentar como mediciones revisadas un caso hipotético ni una comparación sin datos, fuentes de ambas alternativas, revisión identificada y comprobaciones cumplidas. Incluso si se introducen documentos revisados, la causalidad, los requisitos de seguridad y la aprobación del mensaje siguen siendo tareas de los responsables técnicos y de negocio: ASRI no valida automáticamente un beneficio ambiental u operacional.

## Seguridad y confidencialidad

ASRI está publicado como demostración en **GitHub Pages público**. El estado del caso se mantiene en memoria del navegador; no hay servidor ASRI de almacenamiento ni mecanismo de autorización corporativa en esta versión. **No introducir información confidencial de Airbus, del cliente, datos personales, contratos ni archivos internos**. Utilizar datos públicos o anónimos hasta disponer de un despliegue corporativo autorizado. Los archivos JSON y PDF se generan localmente y deben manejarse con las normas de clasificación de información de su organización.

## Lo que falta para convertirlo en herramienta operativa aprobada

1. Revisión de GTS e Ingeniería de los indicadores y sus límites por familia de casos.
2. Conexión gobernada a fuentes corporativas y control de acceso autorizado (en lugar de referencias introducidas manualmente).
3. Calibración y validación independiente de modelos predictivos específicos donde se necesiten; el comparador actual no los sustituye.
4. Auditoría, gestión de versiones, aprobación formal de afirmaciones y revisión de ciberseguridad/protección de datos.

**Objetivo del prototipo:** que cualquier equipo pueda estructurar un caso reproducible y saber qué falta para demostrar su valor sin generar greenwashing ni asumir que una cifra ilustrativa es un beneficio real.
