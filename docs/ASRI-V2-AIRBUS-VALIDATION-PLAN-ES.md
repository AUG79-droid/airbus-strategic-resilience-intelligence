# ASRI 2.0 | Plan ejecutivo de validación predictiva

**Decisión solicitada a José Coll:** autorizar el estudio de un **piloto interno** y designar un responsable de negocio (*Business Owner*). No supone aprobar ASRI para uso operativo ni autorizar todavía el acceso a datos.

## 1. Piloto: una decisión real, no cuatro casos

Seleccionar **una familia de componentes y un programa In-Service**. Comparar tres estrategias: **sustituir**, **reparar primero** y **reparar + suministro paralelo**.

**Predicciones a verificar:** tiempo de recuperación, probabilidad de cumplir plazo y coste total por alternativa. El riesgo de suministro se evaluará como factor explicativo. **Disponibilidad de misión** e **impacto ambiental** solo se incluirán con modelos, unidades y fuentes adicionales validadas.

## 2. Datos y equipos necesarios

| Equipo propuesto | Qué debe aportar o validar |
|---|---|
| **In-Service / Engineering / Reliability** | Averías, viabilidad y duración real de reparaciones, resultados observados y reglas técnicas |
| **Supply Chain / Operations** | Entregas, interrupciones, inventarios, proveedores/dependencias, capacidad y colas |
| **Programme** | Decisión concreta, plazos, restricciones, KPIs y nivel de error aceptable |
| **Finance / Contracts** | Costes, desembolsos, penalizaciones y reglas para evitar duplicidades |
| **Sustainability / Materials** | Si se reclaman beneficios ambientales: inventarios comparables, factores y revisión de ACV |
| **Systems Engineering / Operator** | Si se predice misión: dependencias de sistema y disponibilidad realmente observada |
| **Quality / IT / Cybersecurity** | Calidad y trazabilidad documental; acceso autorizado, roles, firmas, conservación y auditoría |

**Primera petición:** confirmar si los datos existen, quién los custodia, su calidad y clasificación. **Ningún archivo real se carga en GitHub ni en la web pública.**

## 3. Qué debe hacer el piloto

1. **Cerrar el método:** armonizar las reglas de los motores; definir eventos simultáneos, dependencias, colas, costes, unidad de análisis y resultados observables.
2. **Calibrar:** estimar probabilidades, retrasos y costes con históricos autorizados, documentando datos faltantes y supuestos.
3. **Contrastar:** reservar un periodo histórico **no usado para calibrar**. Comparar predicciones con lo realmente ocurrido y con un método de referencia. Medir error de tiempo y coste, calibración de probabilidad de plazo, cobertura de incertidumbre y fallos en escenarios adversos.
4. **Validar antes de utilizar:** Programme, Engineering y Quality establecen **por adelantado** los umbrales de aceptación y evalúan resultados independientes. IT/Security aprueba la arquitectura interna, autenticación y auditoría; responsables competentes firman el alcance autorizado.

## 4. Criterio de decisión

**GO** solo si hay datos suficientes y autorizados, se cumplen los umbrales definidos, el modelo mejora la referencia, su incertidumbre es útil y se aprueban seguridad, método y responsabilidades.

**NO-GO** si falla cualquiera de esos controles: ASRI continúa como **simulador condicional**, sin capacidad predictiva acreditada. La validación se limita al caso ensayado; Eurodrone, clima, SAF e incendios requieren validaciones propias.

**Entregables:** ficha de alcance y responsables, inventario autorizado de datos, método versionado, informe de predicciones frente a resultados reales, registro de riesgos y decisión firmada.

*Referencia técnica: [auditoría final](./ASRI-V2-FINAL-AUDIT.md) y [24 hallazgos](./ASRI-V2-24-FINDINGS-VERIFICATION.md). Responsables propuestos, aún no designados.*
