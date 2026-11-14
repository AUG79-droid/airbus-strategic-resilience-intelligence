# ASRI 2.0 — Veredicto ejecutivo independiente

**Fecha:** 14/11/2026  
**Veredicto:** **APTA CON LIMITACIONES para demostración ejecutiva**

## Respuesta directa

### ¿Es fiable ASRI 2.0 como demostración didáctica?

**Sí.** Dentro de sus supuestos ficticios, los cálculos son reproducibles y las protecciones frente a conclusiones engañosas han mejorado sustancialmente. La auditoría final obtuvo:

- 249/249 pruebas automáticas;
- 9/9 suites de navegador;
- typecheck y build correctos;
- 32/32 combinaciones de los cuatro casos, dos alternativas y cuatro audiencias;
- 0 vulnerabilidades notificadas por `npm ci`.

Una prueba aritmética independiente con riesgos correlacionados reprodujo exactamente el tiempo esperado, la probabilidad de plazo y el coste del motor.

### ¿Tiene errores críticos o altos pendientes?

**No quedan errores críticos o altos de programación conocidos en la rama auditada.**

Se encontraron cinco hallazgos nuevos. Dos eran altos:

1. faltaba exigir y someter a sensibilidad la evidencia del retraso conjunto cuando el coste dependía de la indisponibilidad;
2. Eurodrone podía afirmar “menos material” aunque se invirtiera el dato.

Ambos se corrigieron y tienen regresiones. También se añadió el recorrido E2E de los cuatro casos y se corrigió una incoherencia del número de parámetros. Queda una mejora media de rendimiento por chunks JavaScript mayores de 500 kB.

Persisten **limitaciones altas para uso operativo**, no defectos de la demo: ausencia de datos calibrados, IAM/firma, ACV validado, modelo de misión/flota, almacenamiento corporativo, conciliación financiera y aprobación Airbus.

### ¿Puede presentarse a José Coll?

**Sí, con un encuadre explícito.**

Mensaje recomendado:

> ASRI traduce una decisión de sostenibilidad en escenarios condicionales de recuperación, plazo, coste, dependencias e impacto ambiental para distintas audiencias. Esta demostración utiliza datos ficticios y sirve para definir un piloto controlado; no predice resultados Airbus ni sustituye las aprobaciones técnicas, financieras o de seguridad.

No debe decirse que:

- Airbus ha aprobado el método;
- los revisores o gates son firmas auténticas;
- los casos representan datos reales de Eurodrone, SAF, clima o incendios;
- una mejora de componente demuestra disponibilidad de flota o misión;
- los resultados ambientales constituyen un ACV certificado;
- SHA-256 acredita autoría o aprobación;
- la demo está lista para uso operativo.

### ¿Qué limitaciones deben explicarse?

1. **Dos ámbitos de cálculo:** DEMO-60 y Case Studio comparten riesgo y momentos, pero no todas las políticas de estrategia/economía.
2. **Modelo condicional:** probabilidades, retrasos y costes son entradas; no están calibrados con históricos.
3. **Dependencias acotadas:** se admiten probabilidades conjuntas y topología, pero no una red industrial completa ni una cola estocástica.
4. **Evidencia declarada:** revisión, propietario y gates no tienen identidad corporativa ni firma.
5. **Medio ambiente:** inventarios comparables y márgenes deterministas no equivalen a ACV ni beneficio verificado.
6. **Misión:** la recuperación de un componente/servicio no se extrapola automáticamente.
7. **Economía:** no sustituye Programme Finance, Contracts o valoración multi-divisa.
8. **Persistencia:** el guardado local ficticio es voluntario y sin cifrar; no sirve para datos corporativos.
9. **PDF:** Unicode correcto, pero accesibilidad etiquetada pendiente.
10. **Rendimiento:** conviene optimizar chunks antes de una distribución amplia.

### ¿Qué impediría utilizarla operativamente en Airbus?

- falta de un Business Owner y alcance de decisión aprobado;
- falta de datos clasificados/autorizados y backtesting;
- falta de metodología firmada para riesgo, suministro, economía y ACV;
- falta de identidad, roles, segregación, firma y auditoría inmutable;
- falta de infraestructura corporativa cifrada, retención y control de acceso;
- falta de aceptación de Engineering/In-Service, Programme, Finance, Contracts, Sustainability, Quality y Security;
- falta de monitorización, soporte, gestión de cambios y criterios de retirada.

## Estado de los 24 hallazgos originales

| Estado | Número |
|---|---:|
| Corregidos | **11** |
| Parciales | **12** |
| Depende de Airbus | **1** |

“Parcial” significa que el prototipo incorpora una salvaguarda real, pero todavía no satisface los requisitos de un sistema empresarial u operativo.

## Decisión recomendada

Autorizar una **demostración didáctica** y, si existe interés, un **único piloto interno controlado** con datos desidentificados en infraestructura autorizada. No autorizar despliegue operativo ni uso decisorio.

Antes de la demo:

1. mantener el PR sin fusionar ni desplegar;
2. usar solo los casos ficticios incluidos;
3. mostrar al menos un escenario desfavorable;
4. explicar la diferencia entre resultado calculado, evidencia declarada y beneficio validado;
5. cerrar con la propuesta de plan de validación y responsables, no con una promesa de rendimiento.

## Conclusión

ASRI 2.0 es una demo técnicamente sólida para explicar cómo conectar sostenibilidad y resiliencia bajo supuestos explícitos. Su valor actual es pedagógico y de estructuración de preguntas. Su uso operativo exige un proyecto corporativo separado de datos, método, gobernanza, seguridad y validación.
