# ASRI 2.0 — Resultados finales de QA

**Fecha de ejecución:** 14/11/2026  
**Entorno:** Windows, Node 24.21.0, npm, Chrome local, vista previa Vite en `127.0.0.1:4174`.  
**Rama:** `asri-v2-audit-remediation`.

## 1. Resumen

| Grupo | Superadas | Fallidas |
|---|---:|---:|
| Pruebas Vitest | **249** | **0** |
| Suites E2E de navegador | **9** | **0** |
| Typecheck | **1** | **0** |
| Build de producción | **1** | **0** |
| **Total contabilizado** | **260** | **0** |

Adicionalmente, la suite de cuatro casos verificó **32 combinaciones** de caso/alternativa/audiencia y las pruebas de navegación se ejecutaron a 1440, 390 y 320 px.

## 2. Instalación y dependencias

Comando:

```text
npm ci
```

Resultado:

- 51 paquetes instalados;
- 52 paquetes auditados;
- **0 vulnerabilidades notificadas**;
- lockfile reproducible;
- Vite 8.3.8.

## 3. Unitarias e independientes

Comando:

```text
npm test
```

Resultado:

```text
Test Files  34 passed (34)
Tests       249 passed (249)
Duration    1.63 s
```

La auditoría añadió seis pruebas aritméticas independientes y regresiones para:

- cuatro ramas correlacionadas;
- límites de Fréchet;
- resultados de tiempos/plazo de los cuatro casos;
- procedencia de `jointExtraDelay` en el coste por indisponibilidad;
- narrativa ambiental adversa ES/EN.

### Cálculo independiente principal

Entradas:

| Entrada | Valor |
|---|---:|
| Tiempo base | 10 |
| Éxito técnico | 60 % |
| Disrupción | 50 % |
| Fallo ∩ disrupción | 30 % |
| Retraso por fallo | 4 |
| Retraso por disrupción | 6 |
| Retraso conjunto adicional | 3 |
| Plazo | 15 |
| Coste base | 100 € |
| Sobrecoste disrupción | 20 € |
| Sobrecoste fallo | 30 € |
| Sobrecoste conjunto | 40 € |
| Coste de indisponibilidad | 2 €/unidad |

Resultados esperados calculados por separado:

- ramas: 0,4 / 0,2 / 0,1 / 0,3;
- tiempo: `0,4×10 + 0,2×16 + 0,1×14 + 0,3×23 = 15,5`;
- plazo: `(0,4 + 0,1)×100 = 50 %`;
- coste: `100 + 0,5×20 + 0,4×30 + 0,3×40 + 2×15,5 = 165`.

Resultado del motor: **15,5; 50 %; 165 €**.

## 4. TypeScript y build

```text
npm run typecheck
npm run build
```

Ambos finalizaron con código 0.

Artefactos principales:

| Artefacto | Tamaño minificado | Gzip |
|---|---:|---:|
| CSS | 115,28 kB | 20,40 kB |
| index JS | 681,60 kB | 205,42 kB |
| fontkit | 710,70 kB | 329,57 kB |
| módulo PDF | 17,81 kB | 6,61 kB |

Advertencia no bloqueante: algunos chunks superan 500 kB.

## 5. Suites E2E

### 5.1 `test:final-qa`

- cuatro rutas en escritorio y móvil;
- navegación y cambio EN/ES;
- sin desbordamiento horizontal;
- sin paneles altos vacíos;
- sin errores de consola/página.

### 5.2 `test:translator-ui`

- 12 combinaciones DEMO-60 estrategia/audiencia;
- comparaciones entre pares y umbral de decisión;
- trazas de cálculo/evidencia;
- escenario “repair worsens” con narrativa y recomendación desfavorables;
- localización ES;
- móvil sin desbordamiento.

### 5.3 `test:export-ui`

- exportaciones bloqueadas antes de confirmación;
- JSON reproducible con inputs, resultados y evidencias;
- PDF válido;
- controles ES;
- PDF Case Studio con fuente Unicode y `ToUnicode`.

Archivos de prueba:

- DEMO-60 PDF: 13.132 bytes, 5 páginas;
- Case Studio PDF: 43.540 bytes, 8 páginas;
- JSON v2 con selección y versión 0.6.0-phase-6.

### 5.4 `test:lab-ui`

- recálculo en 1440 y 390 px;
- escenario y encabezado ES;
- sin desbordamiento.

### 5.5 `test:evidence-ui`

- fuentes, gates y foco de evidencia;
- escritorio/móvil;
- introducción y controles ES.

### 5.6 `test:guided-ui`

- cuatro fases;
- Back/Continue;
- 1440, 390 y 320 px;
- traducción ES.

### 5.7 `test:four-cases-ui` — añadido por auditoría

Superado:

- Eurodrone;
- Adaptación climática;
- SAF;
- Incendios forestales;
- cuatro fases por caso;
- alternativa A y B;
- Cliente de Defensa, Ingeniería, Programme y Dirección;
- 32 combinaciones;
- siete conclusiones ampliadas por combinación;
- sin `NaN`, `undefined`, `Infinity` ni errores.

### 5.8 `test-joint-risk-ui.mjs`

- alternativa B y Dirección sobreviven ES/EN/ES;
- límites de Fréchet aplicados en navegador.

### 5.9 `test-capacity-ui.mjs`

- cola FIFO: 1 bahía, 4 trabajos, 3 unidades/trabajo y objetivo 2 → finalización 14;
- 2 bahías, 3 trabajos, 4 unidades/trabajo y objetivo 2 → finalización 6;
- incertidumbre ambiental;
- Translate;
- round-trip JSON.

## 6. Resultados de los cuatro casos

Resultados redondeados como en interfaz:

| Caso | Referencia | Alternativa A | Alternativa B |
|---|---|---|---|
| Eurodrone | 141,3 d / 0 % | 92 d / 64,8 % | 69,2 d / 99 % |
| Clima | 41,8 h / 0 % | 24,4 h / 52,7 % | 14,7 h / 98,1 % |
| SAF | 25 d / 0 % | 25,7 d / 0 % | 17,2 d / 72 % |
| Incendios | 48 min / 0 % | 24,1 min / 72 % | 16,9 min / 99,5 % |

SAF A es deliberadamente un compromiso: recuperación ligeramente peor y menor GEI acotado. Translate no la convierte en ventaja de recuperación.

## 7. JSON e integridad

Verificado:

- exportación en sobre v2;
- SHA-256 canónico con claves ordenadas;
- reordenar propiedades no invalida contenido equivalente;
- modificar un valor sí invalida;
- digest fabricado se rechaza;
- sobre v1 se verifica con canonicalización histórica;
- JSON sin sobre se acepta solo como legado y se marca no verificado;
- ID, opciones, métricas, fechas, límites y referencias se validan;
- máximo de 2 MB en UI.

**Interpretación:** la suma detecta cambios; no autentica autor, aprobador ni fecha.

## 8. PDF y Unicode

Flujo:

1. generación desde navegador;
2. `pdfinfo`;
3. render de todas las páginas con Poppler;
4. inspección visual de portada, páginas técnicas, Translate y cierre.

Resultado:

- A4, sin cifrado ni JavaScript;
- Case Studio: 8 páginas, Lato Regular/Bold embebidas;
- DEMO-60: 5 páginas, cabecera, pie y numeración;
- `CO₂e`, acentos, flechas y signos visibles;
- texto seleccionable mediante `ToUnicode`;
- sin recortes ni solapes observados.

Limitación: `Tagged: no`; no se ha acreditado accesibilidad PDF.

## 9. Responsive y UX

| Ancho | Resultado |
|---:|---|
| 1440 px | correcto |
| 390 px | correcto |
| 320 px | correcto |

Se verificaron botones de fase, Back/Continue, idioma, selectores, tablas/paneles y ausencia de pantallas vacías. Las pantallas avanzadas son densas y requieren scroll vertical, pero no se pierde funcionalidad.

## 10. Seguridad

- aplicación estática, sin backend ni autenticación;
- React escapa el texto introducido;
- sin sourcemaps de producción;
- importación estricta y tamaño acotado;
- hash local de documentos sin subir bytes;
- autosave solo para casos ficticios, voluntario y sin cifrar;
- advertencia de no usar datos confidenciales.

No se realizaron pruebas de penetración de infraestructura GitHub Pages ni análisis SAST externo. No se introdujeron servicios o dependencias nuevas.

## 11. CI remoto observado

El PR estaba abierto y en borrador. La última ejecución pública observada antes de las correcciones finales fue:

- [ASRI Case Studio Quality Gate #43528322003](https://github.com/AUG79-droid/airbus-strategic-resilience-intelligence/actions/runs/43528322003): éxito en `0a5aea4`.

La validación final detallada en este documento se ejecutó localmente sobre la rama con las correcciones de auditoría. El workflow se amplió para incluir la suite de los cuatro casos.

## 12. Resultado

**Puerta final local: SUPERADA.**  
**Fallos finales reproducibles: 0.**  
**Limitaciones metodológicas/corporativas: abiertas y documentadas; no son convertidas en aprobaciones técnicas.**
