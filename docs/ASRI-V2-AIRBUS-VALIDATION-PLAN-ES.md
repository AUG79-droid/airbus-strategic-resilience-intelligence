# ASRI 2.0 — Plan ejecutivo para validar capacidad predictiva

**Objetivo:** comprobar si ASRI puede predecir, con un error aceptable, los resultados de decisiones reales de mantenimiento y suministro. **Estado actual:** simulador didáctico; no validado para decisiones operativas.

## 1. Decisión que se solicita a José Coll

**Autorizar el estudio de viabilidad de un único piloto interno**, designar un **Business Owner** (Programme/In-Service) y pedir a los equipos indicados que confirmen qué datos existen, quién los custodia y cómo podrían utilizarse. Esto **no** autoriza todavía el acceso a los datos ni el uso operativo de ASRI.

## 2. Piloto propuesto: una decisión In-Service

**Alcance:** una familia de componentes, un programa y un periodo definidos. Comparar tres estrategias: **sustituir**, **reparar primero** y **reparar con vía de suministro paralela**.

| Resultado que deberá predecir ASRI | Indicador de validación |
|---|---|
| Tiempo de recuperación | Error de predicción en días u horas |
| Cumplimiento del plazo acordado | Probabilidad prevista frente a frecuencia observada |
| Coste total por alternativa | Error en euros; sin doble contabilización |
| Riesgo de falta de suministro | Identificación y efecto medido de dependencias, retrasos y capacidad |

La **disponibilidad de misión** solo se incorporará si existen datos y un modelo autorizado de plataforma/sistema. Los **beneficios ambientales** solo se comunicarán si hay una comparación de inventarios y método revisados; no son un resultado predictivo automático del piloto.

## 3. Datos necesarios y responsables propuestos

| Equipo | Datos o validación que debe aportar |
|---|---|
| **In-Service / Engineering / Reliability** | Históricos de averías, inspecciones, viabilidad de reparación, duración real, recurrencias y resultado de cada intervención |
| **Supply Chain / Procurement / Operations** | Plazos reales de suministro, incidencias, dependencias comunes, inventario, cualificación y capacidad/colas de taller |
| **Programme** | Plazo exigido, restricciones de decisión, definición de éxito y umbrales aceptables |
| **Finance / Contracts** | Costes reales por estrategia, desembolsos, penalizaciones, indisponibilidad y reglas financieras |
| **Sustainability / Materials / ACV** | Solo si se afirma un beneficio ambiental: unidad funcional, inventarios, límites, factores e incertidumbre |
| **Systems Engineering / Operator** | Solo si se analiza disponibilidad de misión: función, redundancias, datos observados y definición de disponibilidad |
| **Quality + Digital/IT + Cybersecurity** | Calidad documental, permisos, autenticación, almacenamiento, trazabilidad, firma y revisión independiente |

**Primera petición a los equipos:** confirmar existencia, propietario, clasificación, calidad y posibilidad de uso de los datos. **No solicitar ni subir todavía archivos operativos.**

## 4. Trabajo técnico y pruebas exigidas

1. **Definir y cerrar el modelo:** reglas comunes de las tres estrategias, secuencia de eventos, fallos correlacionados, proveedores, capacidad, costes y límites. Documentar qué variables están observadas y cuáles son hipótesis.
2. **Calibrar con históricos autorizados:** estimar probabilidades, tiempos y costes; registrar faltantes, periodos, versiones y sesgos. Mantener datos de evaluación **separados cronológicamente** de los de calibración.
3. **Validar fuera de muestra:** comparar predicciones con resultados que el modelo no haya visto, y con una referencia sencilla. Medir error de tiempo/coste, calibración de probabilidades de plazo, cobertura de incertidumbre y desempeño en escenarios desfavorables.
4. **Acordar la aceptación antes de probar:** Programme, Engineering y Quality fijan, por indicador, umbrales máximos de error, representatividad mínima y condiciones de rechazo. **No inventar una precisión objetivo ni dar por suficiente un tamaño de muestra sin comprobarlo.**
5. **Habilitar uso corporativo seguro:** alojar una versión interna en infraestructura aprobada; incorporar identidad y roles, separación autor/revisor, registro de cambios y aprobaciones, controles de acceso, conservación y monitorización de errores o degradación del modelo.

## 5. Hitos y decisión final

| Hito | Entregable | Condición para avanzar |
|---|---|---|
| **A. Viabilidad** | Responsable designado, caso único, KPIs, inventario de datos y clasificación | Datos suficientes y acceso potencialmente autorizable |
| **B. Diseño** | Método documentado, arquitectura aprobada y criterios de aceptación previos | Conformidad funcional y autorización de tratamiento |
| **C. Prueba histórica** | Predicciones fuera de muestra, errores, incertidumbre, desviaciones y comparación con referencia | Cumplir todos los umbrales pactados |
| **D. Aprobación** | Informe independiente, evidencias trazables, controles de seguridad y firmas responsables | Autorización escrita para el **uso concreto** aprobado |

**Resultado posible:** si supera los cuatro hitos, ASRI podrá utilizarse predictivamente **solo en el alcance validado**; si no, seguirá siendo un simulador condicional. Cualquier extensión a Eurodrone, clima, SAF o incendios exigirá su propia validación.

**Restricción:** datos reales exclusivamente en sistemas Airbus autorizados; nunca en GitHub público ni en la aplicación web abierta.

---
**Base técnica:** [Auditoría final](./ASRI-V2-FINAL-AUDIT.md) y [registro de los 24 hallazgos](./ASRI-V2-24-FINDINGS-VERIFICATION.md) (11 corregidos, 12 parcialmente resueltos y 1 dependiente de Airbus). Los responsables de esta propuesta no están formalmente designados.
