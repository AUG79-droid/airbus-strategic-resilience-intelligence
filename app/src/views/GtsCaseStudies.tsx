import { useState } from 'react';
import type { Locale } from '../app/types';
import type { AudienceId } from '../features/translator/types';
import './GtsCaseStudies.css';

/**
 * Exploratory GTS use cases. Public sources only establish background facts.
 * Proposed resilience effects remain hypotheses, not validated programme claims.
 * These cases are deliberately separate from DEMO-60 model outputs and exports.
 */
type CaseId = 'eurodrone' | 'climate' | 'saf' | 'wildfire';
interface CaseContent {
  title: string;
  tagline: string;
  publicContext: string;
  initiative: string;
  exposure: string;
  hypothesis: string;
  narratives: Record<AudienceId, string>;
  evidenceByAudience: Record<AudienceId, string>;
  indicators: string[];
  validation: string[];
  boundary: string;
  sources: Array<{ name: string; url: string; fact: string }>;
}
const studies: Record<CaseId, Record<Locale, CaseContent>> = {
  "eurodrone": {
    "es": {
      "title": "Eurodrone · Ecodiseño",
      "tagline": "Diseñar hoy para depender menos mañana",
      "publicContext": "Airbus lidera Eurodrone y comunicó la revisión preliminar de diseño (PDR) y el uso de un gemelo digital. OCCAR confirmó la revisión crítica (CDR) en octubre de 2025, con cierre de la fase de diseño. Airbus publica principios generales de ecodiseño, pero no hay evidencia pública de un beneficio específico de Eurodrone.",
      "initiative": "Evaluar cambios autorizados y opciones de soporte de un subsistema mediante análisis de ciclo de vida, reparabilidad, sustitución cualificada y trazabilidad de materias críticas.",
      "exposure": "Dependencia de proveedores o materiales críticos, tiempos largos de reposición y reparaciones difíciles durante décadas de servicio.",
      "hypothesis": "Si una alternativa mantiene todos los requisitos técnicos y de seguridad, podría acortar la recuperación de capacidad y reducir exposición a suministros críticos. Hay que contrastarla con masa, coste, mantenibilidad y huella ambiental.",
      "narratives": {
        "defenceCustomer": "La propuesta no es simplemente reducir el impacto ambiental del Eurodrone: es examinar si el diseño permite sostener la capacidad de misión cuando falla el suministro de un componente crítico. El valor para el cliente solo podrá afirmarse cuando haya pruebas de disponibilidad y soporte.",
        "programmeManager": "Una evaluación de ecodiseño en cambios autorizados, industrialización o decisiones de soporte permitiría analizar dependencias y costes durante la vida en servicio. La recomendación es un estudio comparativo compatible con la CDR y los requisitos del programa.",
        "engineering": "Comparar una configuración de referencia con otra alternativa: material, reparabilidad, interfaces, cualificación y análisis de ciclo de vida de la misma unidad funcional. Sin equivalencia de prestaciones y seguridad no hay recomendación técnica.",
        "executiveLeadership": "El ecodiseño puede explorarse como palanca de autonomía industrial y soporte sostenible, no como un beneficio ya conseguido. La decisión propuesta es financiar una prueba limitada y exigir evidencia de reducción de vulnerabilidad antes de escalar."
      },
      "indicators": [
        "Plazo de reposición de componentes críticos (días)",
        "Número de fuentes de suministro cualificadas",
        "Tiempo de reparación y recuperación de capacidad",
        "Impacto de ciclo de vida por unidad funcional equivalente"
      ],
      "validation": [
        "Seleccionar con Ingeniería un subsistema real y una alternativa técnicamente viable.",
        "Solicitar BOM, fuentes de suministro, plazos, requisitos de cualificación y datos de mantenimiento.",
        "Realizar comparación de ciclo de vida y resiliencia con baseline, incertidumbre y revisión del programa."
      ],
      "boundary": "No se atribuye a Eurodrone ningún beneficio ambiental, de disponibilidad o de coste sin datos específicos validados.",
      "sources": [
        {
          "name": "OCCAR · Eurodrone CDR (2025)",
          "url": "https://occar.int/news/eurodrone-achieves-major-milestone-with-successful-critical-design-review-cdr-completion",
          "fact": "La revisión crítica de diseño se completó en octubre de 2025; no atribuye ventajas ambientales."
        },
        {
          "name": "Airbus · Eurodrone PDR (2024)",
          "url": "https://www.airbus.com/en/newsroom/press-releases/2024-05-airbus-achieves-eurodrones-preliminary-design-review",
          "fact": "Contexto público de madurez de diseño y gemelo digital."
        },
        {
          "name": "Airbus · Resources and circularity",
          "url": "https://www.airbus.com/en/sustainability/environment/resources-and-circularity",
          "fact": "Principios generales de circularidad y diseño; no prueba de impacto Eurodrone."
        },
        {
          "name": "Airbus Protect · Eco-design and LCA",
          "url": "https://www.protect.airbus.com/sustainability/eco-design-life-cycle-assessment/",
          "fact": "Métodos de ecodiseño, LCA y evaluación de materias críticas."
        }
      ],
      "evidenceByAudience": {
        "defenceCustomer": "Registros de disponibilidad de referencia, plazos de recuperación, aceptación del operador y evidencias de cualificación del subsistema.",
        "programmeManager": "Mapa de suministradores, riesgos y costes de soporte, impacto de cualquier cambio autorizado en coste y calendario.",
        "engineering": "BOM, requisitos y resultados de cualificación, análisis de reparabilidad y ACV comparativo de la misma función.",
        "executiveLeadership": "Evaluación consolidada de exposición industrial y costes de ciclo de vida con reducción de riesgo cuantificada y revisada."
      }
    },
    "en": {
      "title": "Eurodrone · Eco-design",
      "tagline": "Design now for fewer dependencies later",
      "publicContext": "Airbus leads Eurodrone and reported the Preliminary Design Review and digital twin work. OCCAR confirmed completion of the Critical Design Review in October 2025, closing the design phase. Airbus publishes general eco-design principles, but these do not establish Eurodrone-specific benefits.",
      "initiative": "Assess authorised changes and support options for a subsystem using life-cycle assessment, repairability, qualified substitution and critical-material traceability.",
      "exposure": "Dependence on critical suppliers or materials, extended replenishment lead times and difficult repairs across a long service life.",
      "hypothesis": "If an alternative satisfies all technical and safety requirements, it might shorten capability recovery and reduce exposure to critical supplies. Mass, cost, maintainability and environmental impacts must also be assessed.",
      "narratives": {
        "defenceCustomer": "The case is not merely about a lower environmental footprint: it asks whether design choices can preserve mission capability when a critical component becomes unavailable. Customer value requires evidence on availability and support.",
        "programmeManager": "A targeted eco-design review of authorised changes, industrialisation or in-service support options could reveal supply dependencies and costs. Any trade study must respect the completed CDR, technical requirements and programme controls.",
        "engineering": "Compare a reference configuration with one alternative across material, repairability, interfaces, qualification and life-cycle impacts for the same functional unit. No technical recommendation without equivalent performance and safety.",
        "executiveLeadership": "Explore eco-design as a possible contributor to industrial autonomy and sustainable support, not as an achieved benefit. Fund a bounded test and require proof of lower vulnerability before scaling."
      },
      "indicators": [
        "Critical-part replenishment lead time (days)",
        "Number of qualified supply sources",
        "Repair time and capability recovery time",
        "Life-cycle impacts per equivalent functional unit"
      ],
      "validation": [
        "Select a real subsystem and feasible alternative with Engineering.",
        "Obtain BOM, suppliers, lead times, qualification constraints and maintenance data.",
        "Compare baseline and alternative for LCA and resilience, including uncertainty and programme review."
      ],
      "boundary": "No environmental, availability or cost improvement is claimed for Eurodrone without validated programme-specific data.",
      "sources": [
        {
          "name": "OCCAR · Eurodrone CDR (2025)",
          "url": "https://occar.int/news/eurodrone-achieves-major-milestone-with-successful-critical-design-review-cdr-completion",
          "fact": "Critical Design Review completed in October 2025; no programme-specific environmental benefit established."
        },
        {
          "name": "Airbus · Eurodrone PDR (2024)",
          "url": "https://www.airbus.com/en/newsroom/press-releases/2024-05-airbus-achieves-eurodrones-preliminary-design-review",
          "fact": "Public design maturity and digital-twin context."
        },
        {
          "name": "Airbus · Resources and circularity",
          "url": "https://www.airbus.com/en/sustainability/environment/resources-and-circularity",
          "fact": "General circular design principles, not Eurodrone-specific proof."
        },
        {
          "name": "Airbus Protect · Eco-design and LCA",
          "url": "https://www.protect.airbus.com/sustainability/eco-design-life-cycle-assessment/",
          "fact": "Eco-design, life-cycle assessment and critical-material assessment methods."
        }
      ],
      "evidenceByAudience": {
        "defenceCustomer": "Baseline availability, recovery time, operator acceptance and verified subsystem qualification.",
        "programmeManager": "Supplier map, support risks and costs, and authorised-change impact on schedule and budget.",
        "engineering": "BOM, qualification requirements and results, repairability study and functional-equivalent comparative LCA.",
        "executiveLeadership": "Reviewed industrial dependency exposure and quantified life-cycle risk reduction and cost trade-offs."
      }
    }
  },
  "climate": {
    "es": {
      "title": "Adaptación climática del producto",
      "tagline": "Resiliencia operativa ante condiciones extremas",
      "publicContext": "Airbus indica que realiza ensayos ambientales, incluyendo temperaturas extremas, y considera la adaptación climática de productos. EASA identifica riesgos emergentes para la seguridad y las operaciones, principalmente en aviación civil.",
      "initiative": "Analizar escenarios de calor extremo, lluvia intensa y eventos meteorológicos sobre un producto y su sistema de apoyo, y priorizar mitigaciones de diseño y mantenimiento.",
      "exposure": "Ventanas de operación restringidas, degradación de equipos, incidencias en bases y recuperación lenta tras eventos meteorológicos.",
      "hypothesis": "Las mitigaciones podrían preservar margen operativo y mejorar la capacidad de recuperación, si los ensayos y datos de campo confirman su eficacia.",
      "narratives": {
        "defenceCustomer": "La pregunta relevante para el cliente no es cuántos riesgos climáticos se han listado, sino si la plataforma y su soporte pueden cumplir una misión bajo condiciones extremas definidas, con límites y procedimientos demostrables.",
        "programmeManager": "Incorporar escenarios climáticos en las revisiones de riesgos podría anticipar requisitos de ensayos, mantenibilidad y disponibilidad. La inversión debe priorizarse mediante criticidad de misión, coste y evidencia.",
        "engineering": "Identificar modos de fallo ligados al ambiente, definir envolventes de operación, verificar márgenes y ensayar mitigaciones frente a una configuración de referencia. No extrapolar los resultados entre plataformas.",
        "executiveLeadership": "La adaptación climática puede proteger compromisos de servicio, evitar vulnerabilidades y reforzar confianza del cliente. Presentarla como gestión de riesgo con pruebas de resistencia y coste, no como garantía universal."
      },
      "indicators": [
        "Disponibilidad de misión bajo escenario definido (%)",
        "Horas de indisponibilidad relacionadas con eventos extremos",
        "Tiempo de recuperación tras incidente (horas)",
        "Cobertura de requisitos y ensayos ambientales (%)"
      ],
      "validation": [
        "Seleccionar plataforma, base y escenario climático con límites medibles.",
        "Reunir requisitos operativos, ensayos ambientales, registros de incidencias y perfil meteorológico.",
        "Comparar disponibilidad y recuperación antes/después; documentar efectos secundarios y restricciones de certificación."
      ],
      "boundary": "Los ensayos ambientales generales no validan automáticamente adaptación climática, continuidad operativa ni mejoras en una plataforma específica.",
      "sources": [
        {
          "name": "Airbus · Adaptation to climate change",
          "url": "https://www.airbus.com/en/sustainability/environment/adaptation-to-climate-change",
          "fact": "Contexto corporativo sobre adaptación y ensayos extremos de productos."
        },
        {
          "name": "EASA · Climate Adaptation and Resilience",
          "url": "https://www.easa.europa.eu/en/domains/environment/climate-adaptation-and-resilience",
          "fact": "Riesgos meteorológicos y enfoque de seguridad, centrado sobre todo en aviación civil."
        }
      ],
      "evidenceByAudience": {
        "defenceCustomer": "Ensayos representativos de misión bajo condiciones adversas, disponibilidad y tiempos de recuperación verificados.",
        "programmeManager": "Matriz de requisitos, registro de riesgos, hitos de mitigación y efectos demostrados sobre coste y plazos.",
        "engineering": "Envolvente ambiental, modos de fallo, resultados de ensayos, límites de operación y validación de mitigaciones.",
        "executiveLeadership": "Estimación de exposición sobre contratos de servicio y escenarios de continuidad sustentada en datos verificables."
      }
    },
    "en": {
      "title": "Product climate adaptation",
      "tagline": "Operational resilience in extreme conditions",
      "publicContext": "Airbus reports environmental testing, including exposure to extreme heat and cold, and considers product climate adaptation. EASA highlights emerging safety and operational risks, primarily in civil aviation.",
      "initiative": "Assess extreme heat, intense rainfall and other weather scenarios against a defined product and its support system; prioritise design and maintenance mitigations.",
      "exposure": "Restricted operating windows, equipment degradation, disrupted bases and slow recovery after weather events.",
      "hypothesis": "Mitigations may preserve operating margins and accelerate recovery if test and in-service data confirm their effectiveness.",
      "narratives": {
        "defenceCustomer": "The customer question is not how many climate risks are listed, but whether a platform and its support system can complete a defined mission in extreme conditions within proven operating limits.",
        "programmeManager": "Climate scenarios in programme risk reviews could reveal test, maintainability and availability requirements earlier. Prioritise action by mission criticality, cost and verified impact.",
        "engineering": "Identify environment-related failure modes, establish operating envelopes, verify margins and test mitigations against a baseline. Do not transfer conclusions between platforms without evidence.",
        "executiveLeadership": "Climate adaptation could protect service commitments, reduce vulnerabilities and build customer confidence. Frame it as measurable risk management, not universal mission assurance."
      },
      "indicators": [
        "Mission availability in a defined scenario (%)",
        "Weather-related downtime (hours)",
        "Recovery after incident (hours)",
        "Environmental test and requirement coverage (%)"
      ],
      "validation": [
        "Select a platform, base and measurable climate scenario.",
        "Gather operating requirements, tests, incident records and climate exposure profiles.",
        "Compare baseline and mitigated outcomes; capture trade-offs and certification constraints."
      ],
      "boundary": "General environmental testing does not establish platform-specific climate resilience or operational improvements.",
      "sources": [
        {
          "name": "Airbus · Adaptation to climate change",
          "url": "https://www.airbus.com/en/sustainability/environment/adaptation-to-climate-change",
          "fact": "Corporate adaptation approach and extreme-condition product tests."
        },
        {
          "name": "EASA · Climate Adaptation and Resilience",
          "url": "https://www.easa.europa.eu/en/domains/environment/climate-adaptation-and-resilience",
          "fact": "Weather-related safety challenges, primarily in civil aviation."
        }
      ],
      "evidenceByAudience": {
        "defenceCustomer": "Representative mission tests in extreme conditions, verified availability and recovery times.",
        "programmeManager": "Requirements matrix, risk log, mitigation milestones and verified schedule and cost effects.",
        "engineering": "Environmental envelopes, failure modes, test evidence, operating limits and validated mitigations.",
        "executiveLeadership": "Verified service-contract exposure and continuity scenarios with defensible risk estimates."
      }
    }
  },
  "saf": {
    "es": {
      "title": "SAF · Preparación operativa",
      "tagline": "Descarbonizar sin crear una dependencia nueva",
      "publicContext": "Airbus y sus socios realizaron en 2022 un vuelo de prueba del A330 MRTT/Voyager con 100 % SAF. Airbus también ha realizado pruebas con mezclas de SAF en A400M y C295. EASA documenta la oferta europea de SAF; un vuelo de prueba no equivale a autorización general de operación.",
      "initiative": "Evaluar la preparación de una flota y sus bases para utilizar mezclas de SAF autorizadas, con estrategia de suministro, trazabilidad del combustible y contingencias.",
      "exposure": "Dependencia de puntos de suministro, costes superiores, compatibilidad y aprobación por plataforma y riesgo de disponibilidad durante un despliegue.",
      "hypothesis": "Una estrategia flexible de abastecimiento y compatibilidad podría ampliar opciones logísticas y permitir reducciones de emisiones de ciclo de vida; también podría aumentar complejidad y coste.",
      "narratives": {
        "defenceCustomer": "El valor es conservar la libertad de operar y reabastecerse sin introducir nuevos riesgos logísticos. La disponibilidad de SAF en un aeropuerto no demuestra que esté disponible, autorizado o contratado para una misión militar concreta.",
        "programmeManager": "Se propone una hoja de ruta por plataforma y base: mezcla permitida, acuerdos de suministro, pruebas, coste incremental y plan alternativo. Cada avance requiere una decisión basada en preparación real.",
        "engineering": "Verificar especificación del combustible, compatibilidad de motores y sistemas, instrucciones aplicables, trazabilidad y límites de aprobación. Separar los vuelos experimentales de las configuraciones autorizadas en servicio.",
        "executiveLeadership": "El SAF ofrece una vía potencial de reducción de emisiones, pero su valor estratégico depende de coste, disponibilidad y aprobación operativa. Una transición robusta no debe reducir la flexibilidad de misión."
      },
      "indicators": [
        "Bases con suministro contratado y verificable (número)",
        "Porcentaje de misiones con combustible autorizado disponible",
        "Coste incremental por unidad de combustible o misión (€)",
        "Emisiones de ciclo de vida según metodología y lote (CO₂e)"
      ],
      "validation": [
        "Confirmar por plataforma las mezclas y condiciones autorizadas para operar.",
        "Contrastar contratos, volúmenes, calidad, costes, origen y continuidad logística.",
        "Modelizar contingencias con y sin SAF y calcular impactos de ciclo de vida con trazabilidad."
      ],
      "boundary": "No equiparar un ensayo de vuelo a certificación general, ni asumir que SAF incrementa la autonomía logística o reduce emisiones en cualquier origen y proporción.",
      "sources": [
        {
          "name": "Airbus · A330 MRTT flight test (2022)",
          "url": "https://www.airbus.com/en/newsroom/press-releases/2022-11-airbus-a330mrtt-completes-first-100-saf-test-flight-on-both-engines",
          "fact": "Prueba de vuelo con 100 % SAF; no autorización universal."
        },
        {
          "name": "Airbus · Defence in Spain",
          "url": "https://www.airbus.com/en/about-us/our-worldwide-presence/airbus-in-europe/airbus-in-spain/airbus-defence-in-spain",
          "fact": "Contexto de ensayos SAF en plataformas militares."
        },
        {
          "name": "EASA · ReFuelEU report (2026)",
          "url": "https://www.easa.europa.eu/en/document-library/general-publications/refueleu-aviation-annual-technical-report-2026",
          "fact": "Datos públicos de oferta de SAF en la UE; no disponibilidad específica para misiones militares."
        }
      ],
      "evidenceByAudience": {
        "defenceCustomer": "Disponibilidad contractual de combustible por base y misión, límites de uso aprobados y procedimiento alternativo probado.",
        "programmeManager": "Contratos y volúmenes por base, autorizaciones por plataforma, planificación y sobrecoste medido.",
        "engineering": "Documentación de compatibilidad y aprobación de combustible por plataforma, condiciones de uso y trazabilidad.",
        "executiveLeadership": "Análisis de coste total, exposición de abastecimiento y huella de ciclo de vida acreditada por lote y metodología."
      }
    },
    "en": {
      "title": "SAF · Operational readiness",
      "tagline": "Decarbonise without creating new dependency",
      "publicContext": "Airbus and partners conducted a 100% SAF flight test on an A330 MRTT/Voyager in 2022. Airbus has also tested SAF blends on A400M and C295. EASA reports on EU SAF availability; a test flight is not fleet-wide operational approval.",
      "initiative": "Assess fleet and base readiness for authorised SAF blends, covering supply contracts, fuel traceability and fallback arrangements.",
      "exposure": "Fuel-source concentration, higher costs, platform-specific compatibility and approval, and potential deployment supply gaps.",
      "hypothesis": "Flexible sourcing and approved compatibility could preserve logistic options and enable life-cycle emissions reductions, but may also add cost and complexity.",
      "narratives": {
        "defenceCustomer": "Protect the freedom to deploy, refuel and sustain missions without introducing new logistics risks. SAF supplied at an airport is not proof that it is available or authorised for a specific military operation.",
        "programmeManager": "Build a platform-by-base roadmap covering approved blends, supply contracts, trials, incremental cost and fallback. Make each step conditional on demonstrated readiness.",
        "engineering": "Verify fuel specifications, engines and fuel systems compatibility, applicable instructions, traceability and approved limits. Keep experimental flights distinct from in-service authorisation.",
        "executiveLeadership": "SAF may reduce life-cycle emissions, but strategic value depends on cost, availability and operational approval. A credible transition must preserve mission flexibility."
      },
      "indicators": [
        "Bases with demonstrably contracted fuel supply (count)",
        "Missions with approved fuel available (%)",
        "Incremental fuel or mission cost (€)",
        "Traceable life-cycle emissions by batch (CO₂e)"
      ],
      "validation": [
        "Verify approved blends and operational conditions for each platform.",
        "Check contracts, volumes, quality, costs, origin and contingency supply.",
        "Model supply disruptions with and without SAF; quantify life-cycle emissions with traceability."
      ],
      "boundary": "A trial flight is not fleet-wide certification. Do not assume SAF improves logistics autonomy or emissions for all feedstocks and blends.",
      "sources": [
        {
          "name": "Airbus · A330 MRTT flight test (2022)",
          "url": "https://www.airbus.com/en/newsroom/press-releases/2022-11-airbus-a330mrtt-completes-first-100-saf-test-flight-on-both-engines",
          "fact": "100% SAF trial, not universal operating approval."
        },
        {
          "name": "Airbus · Defence in Spain",
          "url": "https://www.airbus.com/en/about-us/our-worldwide-presence/airbus-in-europe/airbus-in-spain/airbus-defence-in-spain",
          "fact": "Military SAF test context."
        },
        {
          "name": "EASA · ReFuelEU report (2026)",
          "url": "https://www.easa.europa.eu/en/document-library/general-publications/refueleu-aviation-annual-technical-report-2026",
          "fact": "EU SAF supply background, not mission-specific military fuel availability."
        }
      ],
      "evidenceByAudience": {
        "defenceCustomer": "Contracted mission/base fuel availability, approved use limits and tested fallback supply.",
        "programmeManager": "Base-level contracts and volumes, platform approvals, schedule and measured incremental cost.",
        "engineering": "Platform-specific fuel compatibility and approval evidence, operating conditions and traceability.",
        "executiveLeadership": "Total cost, supply exposure and batch-specific life-cycle emissions using documented methods."
      }
    }
  },
  "wildfire": {
    "es": {
      "title": "Incendios forestales · Respuesta integrada",
      "tagline": "De la observación a una decisión operativa más rápida",
      "publicContext": "Airbus publicó en marzo de 2026 una demostración de coordinación entre aeronaves, drones, datos satelitales y equipos terrestres contra incendios. Sus soluciones espaciales ofrecen detección, seguimiento y evaluación de daños. La demostración no prueba resultados generalizables en operaciones reales.",
      "initiative": "Evaluar un flujo combinado de vigilancia aérea y satelital, comunicaciones seguras y apoyo a la decisión para un escenario de incendio forestal.",
      "exposure": "Alertas tardías, información fragmentada, comunicaciones interrumpidas y coordinación limitada entre medios aéreos y terrestres.",
      "hypothesis": "Compartir una imagen operativa común podría reducir el tiempo desde la detección hasta una decisión ejecutable y mejorar la coordinación, sujeto a cobertura y fiabilidad.",
      "narratives": {
        "defenceCustomer": "Para autoridades y servicios de emergencia, el resultado que importa es disponer de información útil y comunicación fiable para actuar antes. Hay que demostrar tiempos, calidad de alerta y continuidad de las comunicaciones en condiciones exigentes.",
        "programmeManager": "Un piloto acotado debe integrar sensores, mando, enlaces de datos y equipos de respuesta, midiendo plazos de entrega y funcionamiento extremo a extremo frente a la coordinación convencional.",
        "engineering": "Validar latencia de datos, precisión geográfica, falsas alarmas, interoperabilidad, cobertura y continuidad cuando falla una red. Ensayar cada enlace antes de atribuir una mejora al sistema completo.",
        "executiveLeadership": "La combinación de observación terrestre, conectividad y medios aéreos puede ser una propuesta de valor diferencial en gestión de crisis. Su despliegue requiere evidencia de efecto operativo y viabilidad económica, no solo una demostración tecnológica."
      },
      "indicators": [
        "Tiempo desde detección hasta alerta accionable (min)",
        "Tiempo desde alerta hasta decisión o despacho (min)",
        "Precisión de alertas y tasa de falsos positivos (%)",
        "Disponibilidad del enlace de comunicaciones en crisis (%)"
      ],
      "validation": [
        "Definir un escenario de referencia y objetivos medibles con usuarios de emergencias.",
        "Verificar latencia, calidad de datos, enlaces y cadena completa de coordinación en un piloto.",
        "Contrastar resultados con procedimiento habitual y documentar falsas alarmas, costes y limitaciones."
      ],
      "boundary": "No afirmar reducción de hectáreas quemadas, vidas salvadas ni resultados de extinción sin datos operativos comparativos y atribución validada.",
      "sources": [
        {
          "name": "Airbus · Firefighting trial (2026)",
          "url": "https://www.airbus.com/en/newsroom/press-releases/2026-03-airbus-brings-digital-technology-to-firefighting",
          "fact": "Demostración pública de conexión de medios y datos; no eficacia a escala validada."
        },
        {
          "name": "Airbus Space · Climate risks and disasters",
          "url": "https://space-solutions.airbus.com/industries/climate-risks-and-disasters/",
          "fact": "Capacidades de observación para detección, seguimiento y evaluación de incendios."
        }
      ],
      "evidenceByAudience": {
        "defenceCustomer": "Pruebas con servicios de emergencia: latencia, utilidad de alertas, falsas alarmas y continuidad operativa.",
        "programmeManager": "Resultados de ensayo extremo a extremo, aceptación del usuario, presupuesto e interoperabilidad de sistemas.",
        "engineering": "Registros de latencia, geolocalización, precisión, pérdida de enlaces y recuperación del sistema.",
        "executiveLeadership": "Resultados comparados con el procedimiento actual y análisis económico validado de adopción y escalabilidad."
      }
    },
    "en": {
      "title": "Wildfires · Connected response",
      "tagline": "From observation to faster operational decisions",
      "publicContext": "In March 2026 Airbus reported a firefighting trial connecting aircraft, drones, satellite data and ground teams. Airbus space services support fire detection, monitoring and damage assessment. The trial does not establish generalised operational outcomes.",
      "initiative": "Test an integrated flow of aerial and satellite surveillance, secure communications and decision support in a defined wildfire scenario.",
      "exposure": "Late alerts, fragmented information, disrupted communications and limited coordination across air and ground assets.",
      "hypothesis": "A shared tactical picture could reduce time from detection to actionable decisions and improve coordination, subject to coverage and reliability.",
      "narratives": {
        "defenceCustomer": "For emergency authorities, the value is actionable intelligence and reliable communications that enable timely response. Demonstrate latency, alert quality and connectivity under demanding conditions.",
        "programmeManager": "Run a bounded pilot linking sensors, command, data links and first responders. Measure end-to-end delivery and performance against conventional coordination.",
        "engineering": "Validate data latency, geolocation accuracy, false alarms, interoperability, coverage and resilience to network failure. Verify each connection before claiming system-level improvement.",
        "executiveLeadership": "Combining Earth observation, connectivity and aerial assets could differentiate crisis-response offerings. Scaling requires verified operational outcomes and economics, not only a technology trial."
      },
      "indicators": [
        "Detection-to-actionable-alert time (minutes)",
        "Alert-to-decision or dispatch time (minutes)",
        "Alert precision and false-positive rate (%)",
        "Communication availability during incidents (%)"
      ],
      "validation": [
        "Agree a baseline scenario and measurable goals with emergency stakeholders.",
        "Test latency, data quality, network links and end-to-end coordination.",
        "Compare with standard practice; capture false alarms, costs, attribution and constraints."
      ],
      "boundary": "Do not claim fewer hectares burned, lives saved or improved suppression outcomes without comparable operational evidence and attribution.",
      "sources": [
        {
          "name": "Airbus · Firefighting trial (2026)",
          "url": "https://www.airbus.com/en/newsroom/press-releases/2026-03-airbus-brings-digital-technology-to-firefighting",
          "fact": "Public multi-asset demonstration, not validated large-scale effectiveness."
        },
        {
          "name": "Airbus Space · Climate risks and disasters",
          "url": "https://space-solutions.airbus.com/industries/climate-risks-and-disasters/",
          "fact": "Earth-observation capabilities for detection, monitoring and damage assessment."
        }
      ],
      "evidenceByAudience": {
        "defenceCustomer": "Emergency-user trials: latency, actionable-alert quality, false alarms and operational continuity.",
        "programmeManager": "End-to-end trial results, user acceptance, delivery budget and system interoperability.",
        "engineering": "Latency, geolocation, accuracy, link-loss and recovery logs.",
        "executiveLeadership": "Results versus standard practice and validated adoption economics and scalability."
      }
    }
  }
};
const ids: CaseId[] = ['eurodrone','climate','saf','wildfire'];
const audiences: AudienceId[] = ['defenceCustomer', 'engineering', 'programmeManager', 'executiveLeadership'];
const labels: Record<Locale, Record<AudienceId, string>> = {
  es: { defenceCustomer:'Cliente de Defensa', engineering:'Ingeniería', programmeManager:'Responsable de programa', executiveLeadership:'Dirección' },
  en: { defenceCustomer:'Defence Customer', engineering:'Engineering', programmeManager:'Programme Manager', executiveLeadership:'Leadership' }
};
const ui = {
  es: {
    eyebrow: 'GTS / PROPUESTAS DE APLICACIÓN', title: 'Cuatro casos para traducir sostenibilidad en valor de negocio',
    intro: 'Explora cuatro oportunidades sugeridas para GTS. Cada propuesta cambia su narrativa según la audiencia; ninguna utiliza las cifras del escenario DEMO-60 ni constituye una evaluación aprobada de Airbus.',
    cases: 'Elige un caso', audience: 'Selecciona la audiencia', background: 'Qué sabemos (fuentes públicas)',
    initiative:'Iniciativa que se propone evaluar', risk:'Vulnerabilidad que queremos abordar', hypothesis:'Hipótesis de resiliencia por comprobar',
    narrative:'Narrativa estratégica adaptada', proof:'Evidencia necesaria para esta audiencia', metrics:'Cómo mediríamos el resultado', validation:'Qué falta para validarlo',
    sources:'Evidencias públicas y sus límites', boundary:'Afirmación que NO podemos hacer todavía',
    state:'HIPÓTESIS / NO VALIDADA', note:'Las fuentes respaldan exclusivamente los hechos públicos indicados. No validan los beneficios específicos propuestos ni alimentan automáticamente el registro de evidencias de DEMO-60.'
  },
  en: {
    eyebrow: 'GTS / APPLICATION PROPOSALS', title: 'Four cases translating sustainability into business value',
    intro: 'Explore four GTS opportunities. Each case adapts its narrative to the selected audience; none uses DEMO-60 figures or constitutes an Airbus-approved assessment.',
    cases:'Choose a case', audience:'Choose an audience', background:'What we know (public sources)',
    initiative:'Initiative to assess', risk:'Strategic vulnerability', hypothesis:'Resilience hypothesis to test',
    narrative:'Audience-specific strategic narrative', proof:'Evidence required for this audience', metrics:'How we would measure the result', validation:'What still needs validation',
    sources:'Public evidence and its limits', boundary:'What we CANNOT claim yet',
    state:'HYPOTHESIS / NOT VALIDATED', note:'Sources support only the stated public facts. They do not validate the proposed case-specific benefits and do not automatically populate the DEMO-60 evidence register.'
  }
} as const;

export function GtsCaseStudies({ locale }: { locale: Locale }) {
  const [selected, setSelected] = useState<CaseId>('eurodrone');
  const [audience, setAudience] = useState<AudienceId>('defenceCustomer');
  const c = studies[selected][locale];
  const t = ui[locale];
  return (
    <section className="gts-cases" aria-labelledby="gts-cases-title" data-testid="gts-case-studies">
      <header className="gts-cases__header">
        <p className="kicker">{t.eyebrow}</p>
        <h2 id="gts-cases-title">{t.title}</h2>
        <p>{t.intro}</p>
      </header>
      <div className="gts-cases__selectors">
        <div>
          <h3>{t.cases}</h3>
          <div className="gts-cases__buttons" role="group" aria-label={t.cases}>
            {ids.map(id => <button key={id} type="button" aria-pressed={selected === id}
              className={selected === id ? 'is-active' : ''} onClick={() => setSelected(id)}>{studies[id][locale].title}</button>)}
          </div>
        </div>
        <div>
          <h3>{t.audience}</h3>
          <div className="gts-cases__buttons" role="group" aria-label={t.audience}>
            {audiences.map(id => <button key={id} type="button" aria-pressed={audience === id}
              className={audience === id ? 'is-active' : ''} onClick={() => setAudience(id)}>{labels[locale][id]}</button>)}
          </div>
        </div>
      </div>
      <article className="gts-cases__detail">
        <header><div><h3>{c.title}</h3><p>{c.tagline}</p></div><strong className="gts-cases__status">{t.state}</strong></header>
        <section><h4>{t.narrative} · {labels[locale][audience]}</h4><p className="gts-cases__narrative">{c.narratives[audience]}</p></section>
        <section className="gts-cases__proof"><h4>{t.proof} · {labels[locale][audience]}</h4><p>{c.evidenceByAudience[audience]}</p></section>
        <div className="gts-cases__chain">
          <section><h4>{t.initiative}</h4><p>{c.initiative}</p></section>
          <section><h4>{t.risk}</h4><p>{c.exposure}</p></section>
          <section><h4>{t.hypothesis}</h4><p>{c.hypothesis}</p></section>
        </div>
        <div className="gts-cases__validation">
          <section><h4>{t.metrics}</h4><ul>{c.indicators.map(v=><li key={v}>{v}</li>)}</ul></section>
          <section><h4>{t.validation}</h4><ol>{c.validation.map(v=><li key={v}>{v}</li>)}</ol></section>
        </div>
        <section className="gts-cases__evidence"><h4>{t.background}</h4><p>{c.publicContext}</p><h4>{t.sources}</h4>
          <ul>{c.sources.map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a><span>{s.fact}</span></li>)}</ul>
          <p className="gts-cases__note">{t.note}</p>
        </section>
        <footer><strong>{t.boundary}</strong><p>{c.boundary}</p></footer>
      </article>
    </section>
  );
}
