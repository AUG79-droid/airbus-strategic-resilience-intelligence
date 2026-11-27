/* Generated from Sustainability Navigator Learning Evidence, instrument sn-pilot-v1. */
(function(){const config={"id":"airbus-strategic-resilience-intelligence","selector":"[data-testid=\"translate-option-select\"]","manual":false};const bank={"airbus-strategic-resilience-intelligence":[{"es":["Reparar reduce recursos pero el tiempo depende de supuestos. ¿Qué analizar?","Dos alternativas muestran distintos costes y recuperación bajo datos ficticios. ¿Qué evaluar?","Comparación equivalente, incertidumbre, dependencias y evidencias","La alternativa más sostenible por definición","El menor coste sin revisar supuestos"],"en":["Repair uses fewer resources but time depends on assumptions. What should be analysed?","Two alternatives show different costs and recovery under fictional data. What should be assessed?","Equivalent comparison, uncertainty, dependencies and evidence","The most sustainable option by definition","Lowest cost without checking assumptions"]},{"es":["Una simulación muestra menor tiempo de recuperación. ¿Qué permite afirmar?","Un cambio de parámetros mejora el resultado calculado. ¿Qué significa?","Resultado condicional al modelo; no es una mejora operativa medida","Disponibilidad de flota demostrada","Validación técnica automática"],"en":["A simulation shows shorter recovery time. What may be stated?","Changing parameters improves a calculated outcome. What does that mean?","Conditional model result; not a measured operational improvement","Proven fleet availability","Automatic technical validation"]},{"es":["La misma evidencia se presenta a Ingeniería y Dirección. ¿Qué cambia?","Se prepara una conclusión para Cliente y Programa. ¿Qué debe conservarse?","Mismos hechos y límites; énfasis según la decisión de cada audiencia","Cambiar cifras para adaptarse al destinatario","Eliminar incertidumbre del mensaje ejecutivo"],"en":["The same evidence is presented to Engineering and Leadership. What changes?","A conclusion is prepared for Customer and Programme. What must remain?","Same facts and limitations; emphasis for each audience's decision","Change numbers to suit the audience","Remove uncertainty from the executive message"]}]};const model=(function(practice,learning,catalogue){
 "use strict";
 const VERSION="sn-pilot-v1", LIBRARY="sustainable-aviation-learning-library", KEY="sn.pilot.sessions.v1";
 const bank=Object.assign(Object.create(null),practice,learning);
 const common={es:["Un resultado del recurso se basa en un caso ficticio. ¿Qué puedes concluir?","Tras una actividad, una alternativa obtiene un resultado favorable en la simulación. ¿Qué comunica correctamente ese resultado?","Aprendizaje o hipótesis condicionada; hace falta evidencia real para afirmar un beneficio operativo","El resultado demuestra una mejora real del negocio","El resultado autoriza a aplicar la decisión"],
 en:["A resource outcome is based on a fictional case. What can you conclude?","After an activity, an alternative achieves a favourable simulation outcome. What is the correct way to communicate it?","Learning or a conditional hypothesis; real evidence is needed to claim operational benefit","The result demonstrates a real business improvement","The result authorises application of the decision"]};
 const resources=new Map(catalogue.resources.map(r=>[r.id,r]));
 const resource=id=>resources.get(id);
 const supported=id=>Object.hasOwn(bank,id)||id===LIBRARY;
 const measured=id=>Object.hasOwn(bank,id);
 const forms=(id,lang,phase)=>{
   if(!measured(id)||!["es","en"].includes(lang)||!["pre","post"].includes(phase))return [];
   const hash=[...id].reduce((n,c)=>n+c.charCodeAt(0),0);
   return [...bank[id],common].map((pair,i)=>{
     const v=pair[lang];const shift=(hash+i+(phase==="post"?1:0))%3;
     const options=[0,1,2].map(j=>{const k=(j+shift)%3;return {id:k,text:v[k+2]};});
     options.push({id:3,text:lang==="es"?"No lo sé todavía":"I do not know yet"});
     return {id:i+1,prompt:v[phase==="pre"?0:1],options,answer:v[2]};
   });
 };
 const validAnswers=(a,id)=>measured(id)?Array.isArray(a)&&a.length===4&&a.every(n=>Number.isInteger(n)&&n>=0&&n<=3):a===null;
 const score=a=>Array.isArray(a)?a.filter(n=>n===0).length:null;
 const outcomes=["completed","partial","not_accessed"];
 const actions=["discuss","seek_evidence","apply_learning","none","not_applicable"];
 const validFeedback=f=>!!f&&["utility","clarity","transfer","confidence"].every(k=>Number.isInteger(f[k])&&f[k]>=0&&f[k]<=5)&&actions.includes(f.action);
 const validId=id=>typeof id==="string"&&/^[a-zA-Z0-9-]{12,100}$/.test(id);
 const newSession=(id,lang,sessionId)=>{
   if(!supported(id)||!resource(id)?.launches?.[lang]||!validId(sessionId))throw Error("Invalid session");
   return {instrument:VERSION,sessionId,resourceId:id,language:lang,pre:null,opened:false,outcome:null,post:null,feedback:null};
 };
 function validate(s){
   if(!s||s.instrument!==VERSION||!validId(s.sessionId)||!supported(s.resourceId)||!resource(s.resourceId)?.launches?.[s.language]||typeof s.opened!=="boolean")return false;
   if(s.pre!==null&&!validAnswers(s.pre,s.resourceId))return false;
   if(!measured(s.resourceId)&&s.pre!==null)return false;
   if(s.opened&&measured(s.resourceId)&&!validAnswers(s.pre,s.resourceId))return false;
   if(s.outcome===null)return s.post===null&&s.feedback===null;
   if(!s.opened||!outcomes.includes(s.outcome)||!validFeedback(s.feedback))return false;
   return s.outcome==="completed"&&measured(s.resourceId)?validAnswers(s.post,s.resourceId):s.post===null;
 }
 function transition(s,event){
   if(!validate(s)||s.outcome!==null)throw Error("Invalid or closed session");
   let next;
   if(event.type==="pre"&&measured(s.resourceId)&&s.pre===null&&!s.opened&&validAnswers(event.answers,s.resourceId))next={...s,pre:[...event.answers]};
   else if(event.type==="launch"&&!s.opened&&(!measured(s.resourceId)||validAnswers(s.pre,s.resourceId)))next={...s,opened:true};
   else if(event.type==="finish"&&s.opened&&outcomes.includes(event.outcome)&&validFeedback(event.feedback)){
     const needsPost=event.outcome==="completed"&&measured(s.resourceId);
     if(needsPost&&!validAnswers(event.answers,s.resourceId))throw Error("Post answers required");
     next={...s,outcome:event.outcome,post:needsPost?[...event.answers]:null,feedback:{utility:event.feedback.utility,clarity:event.feedback.clarity,transfer:event.feedback.transfer,confidence:event.feedback.confidence,action:event.feedback.action}};
   }else throw Error("Invalid transition");
   if(!validate(next))throw Error("Invalid result");return next;
 }
 const clean=s=>({instrument:VERSION,sessionId:s.sessionId,resourceId:s.resourceId,language:s.language,pre:s.pre===null?null:[...s.pre],opened:s.opened,outcome:s.outcome,post:s.post===null?null:[...s.post],feedback:s.feedback===null?null:{utility:s.feedback.utility,clarity:s.feedback.clarity,transfer:s.feedback.transfer,confidence:s.feedback.confidence,action:s.feedback.action}});
 const pack=sessions=>({schema:1,instrument:VERSION,records:sessions.filter(validate).map(clean)});
 function parse(data){
   if(!data||data.schema!==1||data.instrument!==VERSION||!Array.isArray(data.records)||data.records.length>5000)throw Error("Invalid file");
   if(data.records.some(s=>!validate(s)))throw Error("Invalid record");return data.records.map(clean);
 }
 function merge(input){
   const map=new Map(), conflicts=new Set();
   for(const s of input){if(!validate(s))continue;const c=clean(s),old=map.get(c.sessionId);
     if(old&&JSON.stringify(old)!==JSON.stringify(c)){
       // An exact in-progress prefix may be replaced by the completed version, never a conflicting outcome.
       const older=old.outcome===null?old:c.outcome===null?c:null;
       const newer=older===old?c:old;
       const same=older&&newer.outcome!==null&&older.resourceId===newer.resourceId&&older.language===newer.language&&JSON.stringify(older.pre)===JSON.stringify(newer.pre)&&older.opened===newer.opened;
       if(same)map.set(c.sessionId,newer);else conflicts.add(c.sessionId);
     }else map.set(c.sessionId,c);
   }
   return {records:[...map.values()].filter(s=>!conflicts.has(s.sessionId)),conflicts:conflicts.size};
 }
 function aggregate(input){
   const merged=merge(input),groups=new Map();
   for(const s of merged.records){const k=s.resourceId+"|"+s.language;const a=groups.get(k)||[];a.push(s);groups.set(k,a);}
   const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
   const rows=[...groups.values()].map(a=>{
     const pairs=a.filter(s=>s.outcome==="completed"&&measured(s.resourceId)&&validAnswers(s.pre,s.resourceId)&&validAnswers(s.post,s.resourceId));
     const completed=a.filter(s=>s.outcome==="completed"), ratings={};
     for(const k of ["utility","clarity","transfer","confidence"]){const v=completed.map(s=>s.feedback[k]).filter(n=>n>0);ratings[k]={n:v.length,mean:mean(v)};}
     const actionCounts=Object.fromEntries(actions.map(k=>[k,completed.filter(s=>s.feedback.action===k).length]));
     return {resourceId:a[0].resourceId,language:a[0].language,received:a.length,opened:a.filter(s=>s.opened).length,completed:completed.length,partial:a.filter(s=>s.outcome==="partial").length,notAccessed:a.filter(s=>s.outcome==="not_accessed").length,pending:a.filter(s=>s.outcome===null).length,paired:pairs.length,prePct:mean(pairs.map(s=>score(s.pre)*25)),postPct:mean(pairs.map(s=>score(s.post)*25)),gainPp:mean(pairs.map(s=>(score(s.post)-score(s.pre))*25)),ratings,actionCounts};
   }).sort((a,b)=>a.resourceId.localeCompare(b.resourceId)||a.language.localeCompare(b.language));
   return {rows,conflicts:merged.conflicts,records:merged.records.length};
 }
 function launchURL(id,lang,rootURL){
   const raw=resource(id)?.launches?.[lang];if(!raw||!supported(id))throw Error("Unknown resource");
   const url=new URL(raw,rootURL);if(!["https:","http:"].includes(url.protocol))throw Error("Unsafe launch");
   if(id==="airbus-strategic-resilience-intelligence")url.searchParams.set("hubLang",lang);
   if(id==="bio-inspired-innovation-lab")url.searchParams.set("hubAssessment",VERSION);
   return url.href;
 }
 return {VERSION,KEY,LIBRARY,resources,resource,supported,measured,forms,newSession,validate,transition,score,validFeedback,pack,parse,merge,aggregate,launchURL};
})(bank,{}, {resources:[{id:config.id,kind:"application",title:{es:config.id,en:config.id},launches:{es:"./",en:"./"}}]});
/* Local, versioned learning instrument. No network requests or employee identity. */
function mountNative(config,m){
"use strict";
const id=config.id,params=new URLSearchParams(location.search),t=(a,b)=>language==="es"?a:b;
let language=config.fixedLanguage||((params.get("hubLang")||params.get("lang")||document.documentElement.lang||"en").toLowerCase().startsWith("es")?"es":"en");
const measured=m.measured(id),key=m.KEY+".native."+id;
let records=[],session,storageOK=true,eligible=false,seenNonFinal=false,dialogMode="",finalSignal=false,prompted=false;
const read=()=>{try{const raw=localStorage.getItem(key);return raw?m.parse(JSON.parse(raw)):[];}catch{storageOK=false;return [];}};
records=read();const compatible=records.filter(s=>!config.fixedLanguage||s.language===config.fixedLanguage);session=[...compatible].reverse().find(s=>s.outcome===null)||[...compatible].reverse()[0]||null;
if(session)language=session.language;
const uid=()=>crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16).padStart(8,"0")).join("-");
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(label,fn,cls)=>{const n=el("button",label,cls);n.type="button";n.onclick=fn;return n;};
const host=el("div");host.id="sn-native-learning-evidence";document.body.append(host);
const shadow=host.attachShadow({mode:"open"});
const style=el("style",`
:host{font-family:system-ui,sans-serif;color:#142d43;font-size:16px}*{box-sizing:border-box}dialog{color:#142d43;background:#fff;border:1px solid #b7cbdc;border-radius:14px;width:min(900px,calc(100vw - 24px));max-height:92dvh;padding:clamp(1rem,3vw,2rem);overflow:auto;line-height:1.5;box-shadow:0 20px 80px #071b3366}dialog::backdrop{background:#071b33bf}h2{font-size:clamp(1.35rem,3vw,2rem);line-height:1.2;margin:.4rem 0 1rem}p{margin:.5rem 0 1rem}small,.fine{color:#52697b;font-size:.9rem}fieldset{border:1px solid #c9d7e3;border-radius:8px;margin:1rem 0;padding:.8rem;min-width:0}legend{font-weight:700;max-width:100%;padding:0 .4rem}.choice{display:flex;align-items:flex-start;gap:.6rem;padding:.55rem;cursor:pointer}.choice:hover{background:#eff6fc}input[type=radio],input[type=checkbox]{margin-top:.3rem;accent-color:#075985;flex:0 0 auto}button,select{font:inherit}button{border:1px solid #075985;background:#075985;color:#fff;border-radius:7px;padding:.7rem 1rem;font-weight:650;min-height:44px;cursor:pointer;white-space:normal}button.secondary{background:#fff;color:#075985}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #d97706;outline-offset:3px}.actions{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:1rem}.ratings{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:.8rem}.ratings label{display:flex;flex-direction:column;gap:.4rem;font-weight:650}.ratings select{border:1px solid #a9bdce;padding:.6rem;background:#fff;color:#142d43;border-radius:6px;width:100%}.notice{background:#fff7e8;color:#513916;border-left:4px solid #d97706;padding:.8rem}.metrics{display:flex;flex-wrap:wrap;gap:.8rem}.metric{padding:.65rem;border:1px solid #c9d7e3;border-radius:7px;flex:1 1 125px}.metric strong{display:block;font-size:1.5rem;color:#075985}.kicker{color:#075985;font-weight:750;letter-spacing:.08em;font-size:.8rem}.dock{position:fixed;bottom:16px;right:16px;z-index:2147483000;max-width:calc(100vw - 32px);box-shadow:0 4px 16px #071b3340;background:#fff;border:1px solid #a9bdce;padding:.5rem;border-radius:9px}.dock[hidden]{display:none}.error{color:#9f1239;font-weight:bold}.review-item{border:1px solid #c9d7e3;border-left:5px solid #a16207;border-radius:8px;padding:1rem;margin:1rem 0;background:#fffbeb}.review-item.correct{border-left-color:#167047;background:#f0fdf4}.review-item p{margin:.4rem 0}.review-status,.correct-answer{font-weight:700}.review-item.correct .review-status{color:#166534}.review-item.incorrect .review-status{color:#92400e}@media(max-width:500px){dialog{padding:1rem}.actions button{width:100%}.dock{bottom:8px;right:8px}}
`);
const dialog=el("dialog");dialog.setAttribute("aria-labelledby","sn-evidence-title");dialog.lang=language;
const dock=el("div",undefined,"dock");dock.hidden=true;
shadow.append(style,dialog,dock);
function save(next){
 session=next;
 const existing=read();const map=new Map([...existing,...records].map(s=>[s.sessionId,s]));map.set(next.sessionId,next);
 records=[...map.values()];
 try{if(records.length>5000)throw Error("limit");localStorage.setItem(key,JSON.stringify(m.pack(records)));storageOK=true;}catch{storageOK=false;}
}
function transition(event){save(m.transition(session,event));}
function startFresh(){session=m.newSession(id,language,uid());eligible=false;seenNonFinal=false;finalSignal=false;prompted=false;show("pre");}
function close(){if(dialog.open)dialog.close();dialogMode="";updateDock();}
dialog.addEventListener("cancel",e=>{if(dialogMode==="pre"||dialogMode==="pre-review"){e.preventDefault();return;}dialogMode="";updateDock();});
const terminal=()=>{
 if(finalSignal)return true;
 if(!config.selector)return false;
 try{return [...document.querySelectorAll(config.selector)].some(n=>n.isConnected&&n.getClientRects().length>0&&!n.closest("[hidden],[aria-hidden=true]"));}catch{return false;}
};
function check(){
 if(!session?.opened||session.outcome!==null)return;
 const ended=terminal();
 if(!ended)seenNonFinal=true;
 if(ended&&(seenNonFinal||eligible))eligible=true;
 updateDock();
 if(eligible&&!prompted&&!dialog.open){prompted=true;show("finish");}
}
function updateDock(){
 if(!session?.opened){dock.hidden=true;return;}
 const text=session.outcome!==null?t("Resultado de aprendizaje","Learning result"):eligible||config.manual?t("Evaluación final","Final assessment"):t("Mi evaluación","My assessment");
 if(dock.dataset.label===text&&!dock.hidden)return;
 dock.dataset.label=text;dock.replaceChildren(button(text,()=>show(session.outcome!==null?"result":"finish")));dock.hidden=false;
}
function note(s,cls="fine"){dialog.append(el("p",s,cls));}
function questions(parent,phase){
 const answers=Array(4).fill(null);
 m.forms(id,language,phase).forEach((q,i)=>{const f=el("fieldset");f.append(el("legend",(i+1)+". "+q.prompt));q.options.forEach(o=>{const l=el("label",undefined,"choice"),r=el("input");r.type="radio";r.name=phase+"-"+i;r.value=o.id;r.required=true;r.onchange=()=>{answers[i]=o.id;};l.append(r,el("span",o.text));f.append(l);});parent.append(f);});
 return answers;
}
const fields=()=>[["utility",t("Utilidad para mi trabajo","Usefulness for my work")],["clarity",t("Claridad sin facilitador","Clarity without a facilitator")],["transfer",t("Aplicabilidad profesional","Professional applicability")],["confidence",t("Confianza percibida para analizar decisiones","Perceived confidence in analysing decisions")]];
const actions=()=>[["discuss",t("Conversar con mi área o responsable","Discuss with my area or owner")],["seek_evidence",t("Buscar datos, evidencia o requisitos","Seek data, evidence or requirements")],["apply_learning",t("Aplicar lo aprendido en una actividad autorizada","Apply learning in an authorised activity")],["none",t("No tengo prevista una acción","No planned action")],["not_applicable",t("No aplica","Not applicable")]];
function survey(parent){
 parent.append(el("h3",t("Encuesta de utilidad profesional","Professional usefulness survey")),el("p",t("1 = muy baja; 5 = muy alta. Indica no aplica si corresponde.","1 = very low; 5 = very high. Select not applicable where relevant."),"fine"));
 const grid=el("div",undefined,"ratings"),inputs={};
 const select=(k,label,options)=>{const l=el("label",label),s=el("select");s.required=true;const blank=el("option",t("Selecciona","Select"));blank.value="";s.append(blank);options.forEach(([v,text])=>{const o=el("option",text);o.value=String(v);s.append(o);});l.append(s);grid.append(l);inputs[k]=s;};
 fields().forEach(([k,label])=>select(k,label,[[1,"1"],[2,"2"],[3,"3"],[4,"4"],[5,"5"],[0,t("No aplica","Not applicable")]]));
 select("action",t("Siguiente paso previsto","Intended next step"),actions());parent.append(grid);
 return ()=>Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,k==="action"?v.value:v.value===""?null:Number(v.value)]));
}
function submit(form,label,handler){const b=el("button",label);b.type="submit";form.append(b);form.onsubmit=e=>{e.preventDefault();try{handler();}catch{form.append(el("p",t("No se pudo guardar. Revisa las respuestas.","Could not save. Check the responses."),"error"));}};}
function download(){const u=URL.createObjectURL(new Blob([JSON.stringify(m.pack([session]),null,2)],{type:"application/json"}));const a=el("a");a.href=u;a.download="sn-pilot-"+id+"-"+language+".json";shadow.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}
// Formative feedback: the baseline is saved before any answers are revealed.
const reasons={"airpower-mission-green-2026":["Una comparación solo es válida si las opciones prestan el mismo servicio.|A comparison is valid only if options deliver the same service.","La eficiencia no garantiza que la función sobreviva a una interrupción.|Efficiency does not guarantee that a function survives disruption.","Ocultar un efecto desfavorable impide valorar el balance completo.|Hiding an adverse effect prevents a full trade-off assessment."],"bio-radar-runway-prevention":["El riesgo depende del contexto de exposición, no solo del recuento.|Risk depends on exposure context, not just counts.","La gestión de fauna debe conservar la seguridad y respetar obligaciones.|Wildlife management must maintain safety and meet obligations.","Una observación no sustituye la autoridad ni el procedimiento aplicable.|An observation cannot replace the applicable authority or procedure."],"sustainability-control-room":["Priorizar por consecuencias permite asignar recursos a los riesgos más importantes.|Prioritising consequences directs resources to the most important risks.","Una mejora local puede empeorar el resultado del sistema.|A local improvement may worsen the system outcome.","La resiliencia exige mantener o recuperar las funciones esenciales.|Resilience requires maintaining or recovering essential functions."],"eco-retrofit-mineral-footprint":["La masa no refleja por sí sola el servicio ni los impactos de toda la vida útil.|Mass alone does not reflect service or whole-life impacts.","Una declaración comercial no demuestra origen ni método.|A marketing claim does not establish origin or method.","Una alternativa disponible no es necesariamente apta para la función.|An available alternative is not necessarily fit for the function."],"sustainability-systems-escape-room":["Las dependencias entre áreas condicionan la eficacia de las acciones.|Cross-functional dependencies affect action effectiveness.","Desplazar impactos no equivale a reducirlos.|Shifting impacts is not the same as reducing them.","La incertidumbre exige contrastar evidencia antes de elegir.|Uncertainty requires checking evidence before choosing."],"noise-habitat-missions":["La sensibilidad varía según lugar, momento y requisitos de operación.|Sensitivity varies by location, timing and operating requirements.","Reducir ruido en un punto puede aumentar exposición en otro.|Reducing noise at one point can increase exposure elsewhere.","Un mapa didáctico no constituye un permiso operacional.|An educational map is not operational permission."],"strategic-soil-footprint-mapper":["La superficie no basta para caracterizar la sensibilidad ni la recuperación del suelo.|Area alone cannot characterise soil sensitivity or recovery.","La impermeabilización altera infiltración y escorrentía.|Sealing surfaces changes infiltration and runoff.","Sin estado inicial ni seguimiento no se puede demostrar recuperación.|Recovery cannot be demonstrated without a baseline and monitoring."],"mission-energy":["Ahorrar energía no garantiza continuidad durante un corte.|Saving energy does not guarantee continuity during an outage.","Dos fuentes que comparten un punto de fallo pueden perderse a la vez.|Two sources sharing a failure point may fail together.","La adaptación debe proteger la función expuesta y comprobar alternativas.|Adaptation must protect the exposed function and verify alternatives."],"fuel-sovereignty":["La autonomía depende de suministro utilizable y capacidad real, no solo del número de fuentes.|Autonomy depends on usable supply and actual capacity, not just source count.","Un combustible alternativo requiere compatibilidad y autorización además de beneficios ambientales.|Alternative fuel needs compatibility and authorisation as well as environmental benefits.","Una opción debe sostener la función durante la interrupción con riesgos y costes explícitos.|An option must sustain the function during disruption with explicit risks and costs."],"material-sovereignty":["Proveedores distintos pueden compartir un origen o una capacidad crítica.|Different suppliers may share an origin or critical capacity.","La sustitución debe conservar la función y cumplir requisitos técnicos.|Substitution must retain function and meet technical requirements.","La trazabilidad permite verificar el origen y gestionar riesgos antes de aceptar.|Traceability supports origin verification and risk management before acceptance."],"airbus-strategic-resilience-intelligence":["Sin condiciones equivalentes, los resultados de alternativas no son comparables.|Without equivalent conditions, alternative outcomes are not comparable.","Un resultado simulado depende de supuestos y no acredita desempeño real.|A simulated result depends on assumptions and does not establish real performance.","Adaptar el mensaje a una audiencia no permite cambiar la evidencia ni sus límites.|Tailoring a message to an audience does not permit changing evidence or its limits."],"tass-readiness-resilience-simulator":["La disponibilidad depende de alternativas utilizables y del tiempo de recuperación.|Availability depends on usable alternatives and recovery time.","La reparación solo es válida si conserva la función y cumple requisitos aplicables.|Repair is valid only if it retains function and meets applicable requirements.","Resolver un síntoma no evita necesariamente la recurrencia.|Fixing a symptom does not necessarily prevent recurrence."],"tassg-composite-guardian":["Reducir residuos no permite omitir controles de seguridad o calidad.|Waste reduction does not justify bypassing safety or quality controls.","Una reparación requiere comprobar integridad y función mediante procedimientos autorizados.|Repair requires checking integrity and function through authorised procedures.","La información insuficiente requiere revisión, no una decisión improvisada.|Insufficient information requires review, not an improvised decision."],"climate-adaptation-quest":["La adaptación reduce exposición o vulnerabilidad ante efectos físicos; la mitigación aborda sus causas.|Adaptation reduces exposure or vulnerability to physical effects; mitigation addresses their causes.","El riesgo depende de la amenaza, la exposición y la vulnerabilidad de la función.|Risk depends on hazard, exposure and functional vulnerability.","Las medidas deben compararse bajo condiciones equivalentes sin sacrificar seguridad.|Measures must be compared under equivalent conditions without compromising safety."],"tas-sustainability-quest":["El ciclo de vida permite detectar impactos desplazados entre etapas.|Lifecycle thinking identifies impacts shifted between stages.","La aceptación exige evidencia vigente y pertinente al uso concreto.|Acceptance requires current evidence relevant to the specific use.","Una comparación equilibrada muestra beneficios y contrapartidas bajo los mismos límites.|A balanced comparison shows benefits and trade-offs under the same boundaries."],"ethical-armor":["La diligencia debida es un proceso de gestión y seguimiento de riesgos.|Due diligence is a process of risk management and monitoring.","Una afirmación requiere documentación pertinente y trazable.|A claim requires relevant, traceable documentation.","Una alerta exige investigación y seguimiento; no es una prueba definitiva.|An alert requires investigation and follow-up; it is not definitive proof."],"phytosanitary-defender":["La conformidad depende de los requisitos aplicables al envío concreto.|Compliance depends on requirements applicable to the specific shipment.","La falta de evidencia no permite dar por conforme un envío.|Missing evidence does not establish shipment compliance.","Las observaciones deben gestionarse mediante los responsables y procedimientos aplicables.|Observations must be handled through applicable owners and procedures."],"reach-compliance-challenge":["Las obligaciones dependen del rol, la sustancia y su uso concreto.|Obligations depend on the role, substance and specific use.","Una documentación genérica o caducada no demuestra conformidad.|Generic or expired documentation does not establish compliance.","La sustitución debe cumplir obligaciones y requisitos técnicos y seguir el control de cambios.|Substitution must meet obligations and technical requirements and follow change control."],"year-15-challenge":["La edad no determina por sí sola la idoneidad ni el coste del servicio.|Age alone does not determine suitability or service cost.","Prolongar vida útil solo aporta valor si se conserva la función exigida.|Extending life adds value only if the required function is retained.","Los resultados dependen de la referencia y de la calidad de los datos.|Results depend on the baseline and data quality."],"sustainability-evidence-decisions":["Una estimación no equivale a una observación ni a una certificación.|An estimate is not an observation or certification.","Comparar datos con límites distintos puede producir conclusiones engañosas.|Comparing data with different boundaries can produce misleading conclusions.","La jerarquía de mitigación prioriza evitar y minimizar impactos.|The mitigation hierarchy prioritises avoiding and minimising impacts."],"tas-sustainability-knowledge-check":["La reciclabilidad no refleja todos los impactos del servicio prestado.|Recyclability does not reflect all impacts of delivered service.","El impacto depende de la sensibilidad y de la exposición del hábitat.|Impact depends on habitat sensitivity and exposure.","Una cifra favorable no es verificable sin método ni referencia.|A favourable figure is not verifiable without a method and baseline."],"sustainable-aviation-essentials":["El ciclo de vida permite identificar impactos desplazados entre etapas.|Lifecycle thinking identifies impacts shifted between stages.","Mitigar aborda causas del cambio climático; adaptar aborda sus efectos físicos.|Mitigation addresses climate change causes; adaptation addresses physical effects.","La circularidad no justifica comprometer la función ni los requisitos técnicos.|Circularity does not justify compromising function or technical requirements."],"esg-essentials-air-power-services":["Las dimensiones ESG interactúan y pueden generar compromisos.|ESG dimensions interact and may create trade-offs.","Una amenaza solo genera riesgo para una función expuesta y vulnerable.|A hazard creates risk for an exposed and vulnerable function.","Sin método, responsable y evidencia no puede defenderse la comparación.|Without method, ownership and evidence the comparison cannot be defended."],"introduction-sustainability-aviation":["La naturaleza presta servicios y también recibe impactos de las actividades.|Nature provides services and is also affected by activities.","Reparar conserva valor si mantiene los requisitos de servicio.|Repair retains value if service requirements are maintained.","Un único indicador no representa el balance del ciclo de vida.|A single indicator does not represent the lifecycle balance."],"sustainability-knowledge-check-evidence":["Una mejora cuantificada exige una referencia comparable.|A quantified improvement requires a comparable baseline.","Proteger una función frente a un efecto físico es adaptación; no demuestra eficacia por sí solo.|Protecting a function from a physical effect is adaptation; it does not itself prove effectiveness.","Una evidencia no representativa puede orientar, pero no validar el caso.|Unrepresentative evidence can guide but not validate the case."],"sustainable-aviation-foundations-master":["El riesgo físico surge de la interacción entre amenaza, exposición y vulnerabilidad.|Physical risk arises from hazard, exposure and vulnerability interacting.","Los límites equivalentes evitan ocultar impactos desplazados.|Equivalent boundaries avoid hiding shifted impacts.","El potencial ambiental no garantiza viabilidad ni disponibilidad.|Environmental potential does not guarantee feasibility or availability."],"responsible-supply-chain-compliance-foundations":["Los riesgos pueden encontrarse en niveles indirectos de la cadena.|Risks may occur in indirect supply tiers.","La conformidad requiere evidencia vigente y aplicable.|Compliance requires current and applicable evidence.","La diligencia debida requiere gestión continua de riesgos y seguimiento.|Due diligence requires ongoing risk management and monitoring."],"eco-design-circularity-aerospace-materials":["La vida útil modifica la cantidad de recursos necesaria para prestar el mismo servicio.|Service life changes the resources needed to deliver the same service.","La modularidad solo aporta valor si interfaces y requisitos permiten la intervención.|Modularity adds value only if interfaces and requirements allow intervention.","Una afirmación ambiental necesita límites, método y evidencia trazable.|An environmental claim needs boundaries, method and traceable evidence."],"supply-chain-compliance-decision-review":["Una carencia documental requiere revisión antes de aceptar.|A documentary gap requires review before acceptance.","Dos alternativas con exposición común no garantizan redundancia real.|Two alternatives with shared exposure do not guarantee real redundancy.","Documentar la discrepancia y su responsable permite resolverla de forma trazable.|Documenting the discrepancy and its owner enables traceable resolution."],"eco-design-lifecycle-decision-assessment":["Comparar servicios distintos distorsiona los resultados de ciclo de vida.|Comparing different services distorts lifecycle results.","La elegibilidad técnica precede a la comparación de beneficios.|Technical eligibility precedes benefit comparison.","La decisión debe reflejar incertidumbre y evidencia pendiente, no solo ventajas.|The decision must reflect uncertainty and pending evidence, not only advantages."],"aero-skills-launchpad":["Los impactos dependen del origen, método y condiciones del ciclo de vida.|Impacts depend on origin, method and lifecycle conditions.","La viabilidad energética incluye infraestructura y seguridad, no solo producción.|Energy feasibility includes infrastructure and safety, not just production.","Una referencia equivalente permite atribuir diferencias a la alternativa.|An equivalent baseline allows differences to be attributed to the alternative."],"advanced-sustainability-air-power-services":["La decisión de servicio debe conservar función y seguridad y considerar disponibilidad e impactos.|Service decisions must retain function and safety and consider availability and impacts.","La continuidad depende de capacidad y recuperación bajo escenarios pertinentes.|Continuity depends on capacity and recovery under relevant scenarios.","La adaptación exige relacionar exposición, vulnerabilidad y medidas verificables.|Adaptation requires linking exposure, vulnerability and verifiable measures."],"bio-inspired-innovation-lab":["El parecido no demuestra un mecanismo transferible.|Resemblance does not demonstrate a transferable mechanism.","Una hipótesis requiere una referencia y pruebas capaces de refutarla.|A hypothesis needs a baseline and tests capable of refuting it.","Vincular amenaza y función permite formular una hipótesis verificable.|Linking hazard and function enables a testable hypothesis."]};
function reviewAnswers(phase,parent){
 const list=el("section");list.dataset.assessmentReview=phase;
 m.forms(id,language,phase).forEach((q,i)=>{
   const selected=session[phase][i],correct=selected===0;
   const item=el("div",undefined,"review-item "+(correct?"correct":"incorrect"));
   const reason=i===3?t("Un caso ficticio permite aprender o formular hipótesis, pero no demuestra beneficios operativos reales.","A fictional case supports learning or hypotheses, but does not demonstrate real operational benefits."):reasons[id]?.[i]?.split("|")[language==="es"?0:1];
   item.append(el("strong",(i+1)+". "+q.prompt),el("p",correct?t("Correcta","Correct"):t("Incorrecta","Incorrect"),"review-status"),el("p",t("Tu respuesta: ","Your answer: ")+(q.options.find(o=>o.id===selected)?.text??"")),el("p",t("Respuesta correcta: ","Correct answer: ")+q.answer,"correct-answer"));
   if(reason)item.append(el("p",t("Por qué: ","Why: ")+reason));
   list.append(item);
 });parent.append(list);
}
function show(mode,outcome){
 dialogMode=mode;dialog.lang=language;dialog.replaceChildren(el("p",t("LEARNING EVIDENCE · EVALUACIÓN","LEARNING EVIDENCE · ASSESSMENT"),"kicker"));
 const title=el("h2",mode==="pre"?t("Antes de comenzar","Before you start"):mode==="pre-review"?t("Corrección de la evaluación inicial","Initial assessment review"):mode==="result"?t("Tu resultado de aprendizaje","Your learning result"):t("Después de la experiencia","After the experience"));title.id="sn-evidence-title";dialog.append(title);
 note(t("Respuestas locales, sin nombres ni envío automático. Comparte el resultado solo por el canal autorizado. No introduzcas información de trabajo.","Local responses, no names or automatic transmission. Share results only through an authorised channel. Do not enter work information."));
 if(!storageOK)note(t("El almacenamiento no está disponible. Mantén la página abierta y descarga el resultado antes de salir.","Storage is unavailable. Keep this page open and download the result before leaving."),"notice");
 if(mode==="pre"){
   if(!config.fixedLanguage){const a=el("div",undefined,"actions");a.append(button("Español",()=>{language="es";session=m.newSession(id,language,uid());show("pre");},"secondary"),button("English",()=>{language="en";session=m.newSession(id,language,uid());show("pre");},"secondary"));dialog.append(a);}
   note(measured?t("Responde cuatro preguntas sin consultar el contenido. No hay nota mínima. Para medir una experiencia nueva, realiza el recorrido desde el principio tras responder; si conservas progreso previo, reinicia el ejercicio cuando sea posible.","Answer four questions without consulting the content. There is no pass score. To measure a new experience, complete the journey from the beginning after answering; if prior progress exists, restart the exercise where possible."):t("La biblioteca es de consulta libre. Solo medimos utilidad y uso declarado, no cambio de conocimientos.","The library is for free exploration. Only usefulness and declared use are measured, not knowledge gain."));
   const f=el("form"),answers=measured?questions(f,"pre"):null;
   submit(f,measured?t("Corregir evaluación inicial","Correct initial assessment"):t("Guardar y empezar","Save and start"),()=>{if(measured){if(!answers.every(Number.isInteger))return;transition({type:"pre",answers});show("pre-review");return;}transition({type:"launch"});seenNonFinal=!terminal();close();check();});dialog.append(f);
 }else if(mode==="pre-review"){
   if(!measured||!session.pre||session.opened){show("pre");return;}
   const score=m.score(session.pre);
   const result=el("p",t("Resultado inicial: ","Initial result: ")+score+"/4 ("+score*25+"%)","metric");result.dataset.initialScore=String(score);dialog.append(result);
   note(t("Tu puntuación inicial ya está registrada. Revisa las cuatro respuestas y sus explicaciones antes de empezar. No hay nota mínima.","Your initial score is recorded. Review all four answers and explanations before starting. There is no pass score."));
   reviewAnswers("pre",dialog);
   dialog.append(button(t("Comenzar actividad","Start activity"),()=>{transition({type:"launch"});seenNonFinal=!terminal();close();check();}));
 }else if(mode==="finish"){
   note(config.manual?t("Indica si has terminado el recorrido de aprendizaje DESPUÉS de la evaluación inicial. La finalización es autodeclarada.","Indicate whether you completed the learning journey AFTER the initial assessment. Completion is self-reported."):eligible?t("Has llegado a la pantalla de resultados. Si has completado el recorrido después de la evaluación inicial, revisa tu resultado y realiza la evaluación final.","You reached the results screen. If you completed the journey after the initial assessment, review your result and take the final assessment."):t("La evaluación final de conocimientos se habilita cuando llegues a los resultados de la actividad. Puedes continuar o registrar una sesión parcial.","The final knowledge assessment becomes available when you reach the activity results. You can continue or record a partial session."));
   const row=el("div",undefined,"actions");
   if(eligible||config.manual)row.append(button(t("He terminado · evaluación final","I finished · final assessment"),()=>show("survey","completed")));
   row.append(button(t("No he terminado","I did not finish"),()=>show("survey","partial"),"secondary"),button(t("Volver a la actividad","Return to activity"),close,"secondary"));dialog.append(row);
 }else if(mode==="survey"){
   if(outcome==="completed"&&!(eligible||config.manual)){show("finish");return;}
   const f=el("form"),answers=outcome==="completed"&&measured?questions(f,"post"):null,get=survey(f);
   submit(f,t("Guardar resultado","Save result"),()=>{const feedback=get();if(!m.validFeedback(feedback)||answers&&!answers.every(Number.isInteger))return;transition({type:"finish",outcome,answers,feedback});show("result");});dialog.append(f,button(t("Volver a la actividad","Return to activity"),close,"secondary"));
 }else if(mode==="result"){
   const pct=el("div",undefined,"metrics");const metric=(label,v)=>{const d=el("div",undefined,"metric");d.append(el("small",label),el("strong",String(v)));pct.append(d);};
   if(session.post){const a=m.score(session.pre),b=m.score(session.post);metric(t("Antes","Before"),a+"/4");metric(t("Después","After"),b+"/4");metric(t("Cambio descriptivo","Descriptive change"),(b-a)*25+" pp");dialog.append(pct);note(t("Pruebas breves no calibradas. La corrección inicial forma parte del aprendizaje. No certifican competencia ni demuestran causalidad, productividad o resiliencia operativa.","Short uncalibrated probes. Initial feedback is part of learning. They do not certify competence or prove causality, productivity or operational resilience."));dialog.append(el("h3",t("Corrección de la evaluación final","Final assessment review")));reviewAnswers("post",dialog);const detail=el("details");detail.append(el("summary",t("Revisar evaluación inicial","Review initial assessment")));reviewAnswers("pre",detail);dialog.append(detail);
   }else note(t("No se calcula mejora de conocimientos para sesiones parciales o de consulta.","Knowledge gain is not calculated for partial or exploration sessions."));
   const grid=el("div",undefined,"metrics");fields().forEach(([k,label])=>{const d=el("div",undefined,"metric");d.append(el("small",label),el("strong",session.feedback[k]===0?"N/A":session.feedback[k]+"/5"));grid.append(d);});dialog.append(grid);
   const a=el("div",undefined,"actions");a.append(button(t("Descargar resultado JSON","Download JSON result"),download),button(t("Volver a la actividad","Return to activity"),close,"secondary"),button(t("Nueva evaluación","New assessment"),()=>{if(confirm(t("¿Empezar otra evaluación? Reinicia el ejercicio para un nuevo recorrido; la sesión anterior se conserva.","Start another assessment? Restart the exercise for a new journey; the previous session is retained.")))startFresh();},"secondary"));dialog.append(a);
 }
 if(!dialog.open)dialog.showModal();dialog.scrollTop=0;
}
if(!session||session.pre===null&&measured&&!session.opened){startFresh();}
else if(session.opened){seenNonFinal=!terminal();eligible=terminal();updateDock();}
else show(measured&&session.pre?"pre-review":"pre");
new MutationObserver(check).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","hidden","aria-hidden","data-sn-pilot-complete"]});
document.addEventListener("sn-pilot:completed",()=>{finalSignal=true;eligible=true;check();});
document.addEventListener("sn-pilot:open",()=>{if(session?.opened)show(session.outcome!==null?"result":"finish");});
check();
}

const boot=()=>mountNative(config,model);if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else setTimeout(boot,0);})();