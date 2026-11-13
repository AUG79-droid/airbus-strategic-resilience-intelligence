# ASRI 2.0 — Plan de datos, validaciones y decisiones para un piloto Airbus

**Fecha de preparación:** 14/11/2026  
**Referencia:** auditoría externa 13/11/2026; [registro técnico ASRI-001 a ASRI-024](./ASRI-V2-AUDIT-TRACKER.md).  
**Ámbito:** identificación de requisitos. **No es una autorización ni una petición efectuada a los departamentos.** Los equipos indicados son **propietarios funcionales propuestos**, no nombramientos confirmados.  
**Objetivo:** transformar la demo didáctica en un piloto empresarial acotado, con evidencia defendible y sin atribuir aprobación corporativa, predicciones calibradas ni beneficios demostrados antes de verificarlos.

## 1. Qué decisión necesitamos

**Para José Coll / patrocinio de Dirección:** autorizar **estudiar un piloto controlado**, designar un *Business Owner* y pedir a los responsables de Ingeniería/In-Service, Programa, Supply Chain, Finanzas, Sostenibilidad/Medio Ambiente, Quality y Digital/Security que evalúen la disponibilidad **y clasificación** de los datos. Esto **no** equivale a dar permiso para usar datos reales en el repositorio, desplegar en sistemas Airbus ni aprobar el método.

**Propuesta de primer piloto:** una única decisión de mantenimiento In-Service (sustitución frente a reparar primero frente a vía paralela), un programa y un perímetro funcional definidos, con datos históricos anonimizados o agregados **dentro de un entorno Airbus aprobado**. No ampliar inicialmente a cuatro áreas a la vez. Los cuatro casos Eurodrone/ecodiseño, adaptación climática, SAF e incendios pueden seguir como ejercicios hipotéticos mientras se estudia su metodología específica.

### Tres niveles de uso que NO deben confundirse

| Nivel | Qué necesita | Afirmación permitida |
|---|---|---|
| **D0 · Demo didáctica** | Datos ficticios, integridad del software y avisos de hipótesis | «Con estos supuestos, el modelo calcula X» |
| **P1 · Piloto interno limitado** | Datos autorizados y depurados, metodología validada para un alcance y revisión trazable dentro de Airbus | «En este conjunto histórico delimitado, el modelo reproduce/contrasta X con las limitaciones documentadas» |
| **P2 · Uso operativo** | Aprobación formal de responsables, identidad y firma, controles de seguridad, integración, pruebas independientes y monitorización | Solo las afirmaciones expresamente aprobadas para ese uso |

> **Protección de información:** el repositorio GitHub y la URL pública no son depósitos corporativos aprobados. No subir registros Airbus, contratos, nombres de proveedores restringidos, trazas de componentes, identificadores operativos, datos personales, documentos de auditoría interna ni exportaciones de casos reales. Datos reales únicamente tras la clasificación y autorización correspondientes, en infraestructura corporativa aprobada. La demo pública mantiene datos ficticios.

## 2. Matriz de los 13 hallazgos todavía no cerrados

**Leyenda de entrega:** `INT` = desarrollo/QA independiente que aún podemos completar sin datos Airbus; `DAT` = datos históricos/actuales o supuestos reales; `MET` = definición/validación de método; `GOV` = autorización y trazabilidad corporativa. **Ninguno se cierra solo por adjuntar una hoja de cálculo.**

| Hallazgo | Qué falta exactamente y evidencia mínima exigible | Responsable funcional propuesto / validación | Tipo |
|---|---|---|---|
| **ASRI-001 · Dos motores** | Tabla única de equivalencias entre DEMO-60 y Case Studio: origen de los plazos, secuencia de inspección y compra, cancelación, reloj inicial, partidas de coste y supuestos de cada estrategia. Pruebas de paridad con entradas equivalentes y explicación de las divergencias intencionadas. | **Engineering/In-Service + Programme + Finance:** conformidad sobre reglas de estrategia y coste. **Desarrollo:** refactorización restante y pruebas. | INT · MET |
| **ASRI-002 · Dependencia, colas y eventos** | Cronología histórica de averías/disrupciones, tiempos de diagnóstico/reparación/suministro, solapamientos de eventos, llegadas a taller, colas, prioridades, puestos/capacidad disponible y recursos compartidos. Reglas para tiempos secuenciales y no aditivos. Validación retrospectiva de probabilidades y retrasos. | **In-Service/MRO/ILS + Reliability + Operations**; Programme valida criterio de plazo. | DAT · MET |
| **ASRI-003 · Red de suministro** | Mapa autorizado de proveedores/rutas y dependencias aguas arriba (puntos comunes, sitios/logística/materiales), grado de cualificación, ventanas de entrega, capacidad efectiva, inventario, conmutación de proveedor y pérdidas/cortes históricos. **No asumir independencia por tener dos proveedores.** | **Supply Chain/Procurement + Quality/Supplier Quality + Logistics**; Security revisa clasificación y minimización. | DAT · MET · GOV |
| **ASRI-006 · Evidencia autodeclarada** | Registro documental con identificador, versión, propietario, revisor, ámbito, fecha, validez, revocación y fragmento exacto utilizado; identidad verificada de quien revisa. Comprobación de que la persona que revisa no es quien declara, conforme al proceso aprobado. | **Quality/Document Control + Business Owner + IT Identity**. | GOV · DAT |
| **ASRI-007 · Gates sin firma/rol** | Matriz aprobada de permisos (autor, revisor técnico, revisor metodológico, aprobador, lector); autenticación corporativa, segregación de funciones, firma/aprobación auténtica, fecha y registro verificable. El estado actual «confirmado» es solo una declaración. | **IT/Identity & Access Management + Cybersecurity + Quality/Compliance + Programme**; decisión de arquitectura y autorización formal. | GOV |
| **ASRI-008 · Inventario ambiental/ACV** | Unidad funcional, inventarios de procesos para referencia y alternativa, límites de sistema, periodo, método, reglas de asignación, fuentes/versiones de factores, trazabilidad y criterios de calidad; incertidumbre con justificación metodológica y revisión competente. Separar indicadores físicos de resultados de ACV; no atribuir causalidad ni reducciones verificadas sin soporte. | **Sustainability/Environment + Engineering/Materials + LCA practitioner + Quality**. | DAT · MET |
| **ASRI-009 · Componente → misión** | Relación componente–subsistema–plataforma–función, criticidad y redundancias, tamaños de población y tiempo de exposición, disponibilidad observada con numerador/denominador y periodo, MTBF/MTTR, inventarios y reglas de misión. Prohibida extrapolación automática de días de pieza a disponibilidad de flota. | **Systems Engineering + In-Service/ILS/Reliability + Programme/Operator**. | DAT · MET · GOV |
| **ASRI-013 · PDF Unicode/accesibilidad** | Revisión final de glifos y símbolos fuera de Lato, salto de página, impresión, lectura/copia de texto, etiquetado y accesibilidad PDF. La fuente Unicode ya está embebida; requiere QA visual e informe de defectos, no acceso a información Airbus. | **Desarrollo/QA + revisión editorial y accesibilidad**. Corporate branding solo si se pretende presentar el PDF como formato oficial. | INT |
| **ASRI-017 · Economía/contratos** | Coste incremental frente a ya contabilizado, inversiones, mantenimiento, repuestos, cancelaciones, interrupciones/penalizaciones, calendario de pagos, moneda y año base, tasa de descuento y escalación, riesgo contractual, contingencias y tratamiento de inventario residual. Aceptación del criterio financiero, hipótesis de no doble cómputo y comparación por unidad funcional. | **Programme Finance/Controlling + Contracts/Commercial + Procurement + Programme**. | DAT · MET |
| **ASRI-018 · Calibración/incertidumbre** | Serie histórica por escenario/evento, definición de resultado observable, tamaños muestrales, cambios de proceso, datos faltantes, periodo de entrenamiento vs evaluación fuera de muestra, error/calibración, estabilidad y umbrales de aceptación. Sin muestra suficiente, continuar etiquetando como **análisis condicional**, no predicción. | **Reliability/Data Analytics + Engineering + Programme + Quality**. | DAT · MET |
| **ASRI-019 · Revisión editorial ES/EN** | Lista definitiva de términos aprobados y revisión de las 4 fases, 4 audiencias, informes y textos de aviso en inglés y español; prueba humana de comprensión, inconsistencias, tamaños y casos desfavorables. No traducir automáticamente IDs ni títulos documentales. | **Desarrollo/QA + Communications/representante de usuario GTS/TASS**; revisión técnica de Programme e Engineering cuando afecte al significado. | INT · MET |
| **ASRI-022 · Continuidad de casos reales** | Requisitos de conservación, clasificación, almacenamiento cifrado, control de acceso, recuperación, copias, borrado, retención, auditoría y responsable del sistema. Aprobar infraestructura corporativa ANTES de persistir datos reales; el guardado local actual solo admite casos didácticos. | **IT Architecture + Cybersecurity + Information Governance/Data Protection + Business Owner**. | GOV |
| **ASRI-024 · Integridad y pista de auditoría** | Quién creó/aprobó/modificó el caso y cuándo; firmas de usuario, versiones, fuente documental, sello temporal, inmutabilidad/retención del log y verificación de cambios. SHA-256 protege de cambios accidentales; por sí solo **no acredita autenticidad del autor ni aprobación**. | **IT Security/IAM + Quality/Document Control + Legal/Compliance si procede**. | GOV |

### Para cerrar hallazgos: criterios verificables

1. **ASRI-001, -013 y -019:** desarrollo/QA completa el alcance técnico y demuestra pruebas reproducibles, revisión manual y, para -001/-019, aceptación semántica de los propietarios de negocio. No dependen de importar registros reales para las verificaciones de software.
2. **ASRI-002, -003, -008, -009, -017 y -018:** método escrito y firmado para el perímetro del piloto; fuente, calidad, permiso de acceso y evidencia; cálculos reproducibles; contrastación independiente frente a referencia histórica con criterios de aceptación definidos **antes** del ensayo.
3. **ASRI-006, -007, -022 y -024:** arquitectura y modelo de identidad/documentación/seguridad aprobados e implementados, con ensayo verificable de permisos, segregación, revocación, retención y auditoría. No se sustituyen por checks de interfaz.
4. **El estado “cerrado para demo” no significa “cerrado para operación”**. Registrar por separado cierre técnico, validación metodológica, conformidad documental, autorización de datos y aprobación de uso.

## 3. Paquetes concretos que habría que pedir

| Paquete | Equipo propuesto | Entrega mínima del piloto | Para qué se utilizará |
|---|---|---|---|
| **A · Caso y decisión** | Programme + In-Service/Engineering | 1 decisión concreta, comparador (baseline/alternativas), unidad funcional, horizonte, objetivo y restricciones de negocio | Delimitar alcance, definir KPIs y umbrales |
| **B · Tiempos y fiabilidad** | MRO/ILS/Reliability | Registros autorizados de fallos, inspecciones, rutas viables, reparaciones, tiempos de pieza nueva, retrasos por evento y plazos comprometidos | Correlación, modelo de plazos, validación temporal |
| **C · Suministro y capacidad** | Procurement/Supply Chain/Operations | Mapa de dependencias, homologación, entregas históricas, interrupciones, puestos, colas y ocupación del taller | Fallos comunes y cuellos de botella |
| **D · Coste y contrato** | Programme Finance/Contracts | Desembolso por opción, penalizaciones, coste de indisponibilidad, calendario, moneda, año base y supuestos financieros | Valor económico sin dobles conteos |
| **E · Método ambiental** | Sustainability/Environment + Engineering | Unidad funcional, inventario, método, factores, asignación, incertidumbre y documento de revisión | Comparaciones ambientales válidas dentro del alcance |
| **F · Operación y misión** | Systems Engineering + Operator/ILS | Mapa de dependencias, definición de disponibilidad, numerador/denominador, ventana de observación y datos de soporte | Evitar saltos injustificados de componente a misión |
| **G · Evidencia y seguridad** | Quality + IT/IAM/Cybersecurity + Information Governance | Fuente documental y permisos; arquitectura de acceso, aprobación, almacenamiento, retención y auditoría | Autoría, integridad y conservación comprobables |

**Formato recomendado para la petición inicial:** no solicitar todavía ficheros, planos ni contratos. Pedir a cada equipo: (1) propietario competente, (2) existencia/disponibilidad del dato, (3) clasificación y condiciones de acceso, (4) método/definiciones ya existentes, (5) viabilidad de utilizar agregados o datos desidentificados. Los datos se proporcionan **solo después de la aprobación de Security/Data Owners**.

## 4. Diccionario mínimo de datos para el piloto de mantenimiento

| Campo / tipo | Qué debe quedar inequívocamente definido |
|---|---|
| `case_id`, `scenario_id` | Identificadores internos pseudonimizados, única decisión y alternativa, sin referencias sensibles en público |
| `functional_unit`, `period`, `boundary` | Unidad comparable, ventana temporal y perímetro de mantenimiento |
| `decision_timestamp`, `deadline` | Origen del reloj, plazo objetivo y qué se considera cumplimiento |
| `inspection_time`, `repair_time`, `new_part_lead`, `fallback_time` | Duraciones medidas, unidad, distribución y fuente |
| `repair_feasible`, `supplier_disruption`, `joint_event` | Eventos definidos operativamente, fecha y relación causal/estadística estudiada |
| `workshop_bays`, `queue_jobs`, `resource_constraints` | Capacidad y saturación registradas, no presunta |
| `supplier_path_id`, `shared_upstream_node_id`, `qualification` | IDs pseudonimizados y evidencia de rutas/dependencias |
| `cash_flow`, `currency`, `price_year`, `incremental_flag` | Momento, concepto, tipo de euros y control de doble cómputo |
| `observed_result`, `evidence_id`, `source_version` | Resultado contrastable, documento de procedencia, revisor y versión |
| `mission_availability_num_den`, `observation_window` | **Solo si** se pretende comparar disponibilidad de misión y existe soporte autónomo |

Los valores no disponibles permanecen como **desconocidos**: no asignar cero ni inventar precisión. Acordar ex ante cómo tratar datos faltantes, desviaciones, eventos raros y diferencias de estrategia. La ventana histórica y el tamaño de muestra se fijarán según disponibilidad, representatividad y precisión requerida: **no se presume que un número determinado de meses sea suficiente para calibrar**.

## 5. Validaciones y responsables de aprobación propuestos

| Control | Responsable que debe confirmarse | Prueba de aceptación |
|---|---|---|
| Objetivo, KPI, límites, criterio de decisión | Programme + Business Owner | Ficha de decisión y KPI firmada |
| Plausibilidad, tiempos y riesgo técnico | In-Service/Engineering/ILS/Reliability | Método, trazabilidad y backtesting independiente |
| Suministro y suposiciones de capacidad | Procurement/Supply Chain/Operations | Verificación documental de rutas y restricciones |
| Valoración económica | Finance/Controlling + Contracts | Conciliación de flujos sin duplicación |
| Inventario ambiental (si se afirma un impacto) | Sustainability/Environment + especialista metodológico | Unidades, método, factores, alcance e incertidumbre revisados |
| Traducción a disponibilidad de misión (si se afirma) | Systems Engineering/Operator + Programme | Definición y observación independiente, no extrapolación |
| Identidad, aprobación, almacenamiento y trazabilidad | IT/IAM/Cybersecurity/Information Governance/Quality | Arquitectura autorizada y ensayo de permisos y auditoría |
| Publicación y audiencia permitida | Dirección/Business Owner + Communications + Security | Autorización explícita del contenido y del entorno |

**No se asigna ni presupone ninguna firma concreta.** El Business Owner deberá confirmar el esquema RACI y el circuito formal existente en Airbus. Una firma ficticia o casilla de la demo no sustituye la aprobación.

## 6. Secuencia realista y criterio de paso

- **Hito 0 — Alineación:** José Coll o el patrocinador valida estudiar un único piloto y designa un Business Owner. Salida: alcance/decisión y titulares de datos; ninguna cesión de datos todavía.
- **Hito 1 — Factibilidad de datos y método:** responsables responden paquetes A–G (existencia, restricciones, definiciones, calidad). **Go/no-go** sobre si existe un caso históricamente comprobable y si puede trabajarse en entorno autorizado.
- **Hito 2 — Gobernanza:** IT/Security/Quality define ubicación, roles, acceso, retención, revisión, firmas y evidencias. **Go/no-go** para ingestión de datos reales.
- **Hito 3 — Piloto controlado:** se calcula la referencia histórica, se reconcilian resultados con responsables, se registran discrepancias y se evalúa la calidad/calibración; resultados desfavorables y fallos se conservan.
- **Hito 4 — Decisión:** Quality, Engineering, Programme y Security aceptan o rechazan el alcance operativo **por escrito**. Si no se superan los criterios, ASRI sigue siendo demo educativa o analizador condicional.

### Criterio para informar a Dirección

A José Coll se le puede mostrar ya la **narrativa**: «ASRI traduce una decisión de sostenibilidad en su impacto potencial sobre continuidad operativa, costes, dependencias y riesgos, con distintos mensajes según la audiencia. La demostración prueba el flujo de análisis; la validación de beneficios reales se plantea como piloto multidisciplinar». **No afirmar** que Airbus ha aprobado la metodología, que los resultados ficticios son realidades operativas o que ya existe un sistema predictivo calibrado.

## 7. Pendientes de programación independientes de Airbus

Aunque se obtuvieran todos los datos y autorizaciones, **estos desarrollos/revisiones siguen siendo trabajo del equipo técnico**:

1. Terminar refactorización integral de las políticas de estrategias y conciliación económica de ambos motores (ASRI-001).
2. Ampliar modelo de secuencia de eventos, colas con llegadas y restricciones industriales *si el método y la muestra lo justifican* (ASRI-002/-003).
3. Completar QA visual y de accesibilidad PDF, revisión editorial completa ES/EN y pruebas de términos técnicos (ASRI-013/-019).
4. Preparar implementación de conectores, identidad corporativa, permisos y auditoría sobre una arquitectura **previamente autorizada** (ASRI-006/-007/-022/-024).
5. Ejecutar pruebas de calibración y de robustez definidas ex ante con un conjunto de datos permitido; no alterar la demo pública antes de autorizar la publicación.

**Resultado de este documento:** necesidades identificadas y agrupadas, **sin solicitar datos, otorgar permisos, cerrar artificialmente hallazgos ni modificar despliegue público**.
