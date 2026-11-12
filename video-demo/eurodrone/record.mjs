/**
 * Real browser tutorial of the new four-stage Eurodrone case builder.
 * Uses the same cursor, FHD window, and subtitle-safe framing as prior videos.
 * Every narration cue has a corresponding visible action at the matched time.
 * Does not modify the application or send user data to an external service.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const language=process.argv[2];
if(!['es','en'].includes(language))throw new Error('Use: node record.mjs es|en');
const spanish=language==='es';
const out=path.join(here,language,'output');
await fs.mkdir(out,{recursive:true});
const timeline=JSON.parse(await fs.readFile(path.join(out,'timeline.json'),'utf8'));
if(timeline.language!==(spanish?'es-ES':'en-GB'))throw new Error('Narration language mismatched');
const cues=timeline.chapters.flatMap(ch=>ch.cues);
if(timeline.chapters.length!==7||cues.length<85||timeline.chapters.find(ch=>ch.id==='translate')?.cues.length<40)throw new Error('Complete revised tutorial with strategic Translate chapter required');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const messages=[];
const checks=[];
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await browser.newContext({
 viewport:{width:1920,height:970},screen:{width:1920,height:970},deviceScaleFactor:1,
 reducedMotion:'reduce',acceptDownloads:true,recordVideo:{dir:out,size:{width:1920,height:970}}
});
await context.addInitScript(()=>{
 const setCursor=()=>{
  if(document.getElementById('__asri_video_cursor'))return;
  const e=document.createElement('div');
  e.id='__asri_video_cursor';e.setAttribute('aria-hidden','true');
  e.style.cssText='position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:38px;height:45px;transform:translate(1100px,90px);transition:transform .22s ease-out;filter:drop-shadow(0px 2px 3px #0007)';
  e.innerHTML='<svg width="38" height="45" viewBox="0 0 38 45" xmlns="http://www.w3.org/2000/svg"><path d="M4 3V34L12 26L18 40L24 37L17 23H31Z" fill="#fff" stroke="#143929" stroke-width="2.3"/><circle id="__asri_click_ring" cx="5" cy="5" r="0" fill="none" stroke="#ef5b3d" stroke-width="3"/></svg>';
  document.body.appendChild(e);
  const ring=e.querySelector('#__asri_click_ring');
  document.addEventListener('pointermove',evt=>{e.style.transform='translate('+evt.clientX+'px,'+evt.clientY+'px)';},true);
  document.addEventListener('pointerdown',()=>{ring.setAttribute('r','17');ring.setAttribute('opacity','1');
    setTimeout(()=>{ring.setAttribute('r','0');ring.setAttribute('opacity','0');},450);},true);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setCursor);else setCursor();
});
let page;
let recoveryBefore=null,firstRecovery=null,recoveryAfter=null;
try{
 page=await context.newPage();
 page.on('pageerror',e=>messages.push(e.message));
 await page.goto('https://aug79-droid.github.io/airbus-strategic-resilience-intelligence/#/investigate',
   {waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('.case-mode-switch button').last().waitFor({timeout:40000});
 const localeButton=page.locator('.language-switch button').filter({hasText:spanish?'ES':'EN'});
 if((await localeButton.getAttribute('aria-pressed'))!=='true')await localeButton.click();
 await page.waitForFunction((locale)=>document.documentElement.lang===locale,
   spanish?'es':'en',{timeout:12000});
 checks.push(spanish?'Spanish UI selected':'British English UI selected');
 checks.push('Current Translate prioritised: 41 narrated actions with seven in-depth conclusions');

 const loc=x=>typeof x==='string'?page.locator(x).first():x;
 async function focus(selector){
   const el=loc(selector);
   await el.scrollIntoViewIfNeeded({timeout:16000});
   await el.hover({timeout:16000});
   await sleep(240);
 }
 async function click(selector){
   const el=loc(selector);
   await focus(el);
   await el.click({timeout:16000});
   await sleep(230);
 }
 async function ensureSection(index){
   const detail=page.locator('.cy-universal__section').nth(index);
   if(!(await detail.evaluate(el=>el.open)))await click(detail.locator('summary'));
   await focus(detail.locator('summary'));
 }
 async function goStep(n){
   await click(page.locator('.workspace-tabs button').nth(n));
   await page.getByTestId('custom-case-journey').waitFor({timeout:20000});
 }
 async function selectAudience(value){
   const field=page.locator('.cy-choices select').nth(1);
   await focus(field);await field.selectOption(value);await sleep(280);
   await focus('.cy-output');
 }
 async function downloaded(selector,filename){
   const button=loc(selector);await focus(button);
   const [download]=await Promise.all([
     page.waitForEvent('download',{timeout:30000}),button.click({timeout:20000})
   ]);
   const dest=path.join(out,filename);
   await download.saveAs(dest);
   const stat=await fs.stat(dest);
   if(stat.size<120)throw new Error('Empty export: '+filename);
   checks.push(filename+' downloaded');
   return dest;
 }
 const resultsValue=()=>page.locator('.cy-universal__output-table tbody tr').first().locator('td').nth(1).locator('strong').innerText();
 const altRecoveryInput=()=>page.locator('.cy-universal__section').nth(0).locator('.cy-universal__param').first().locator('input[type="number"]').nth(1);
 const actions={
   welcome:()=>focus('.case-mode-switch'),
   mode:async()=>{await click(page.locator('.case-mode-switch button').last());
     await page.getByTestId('custom-case-journey').waitFor({timeout:18000});},
   examples:()=>focus('.cy-preset-grid'),
   choose:async()=>{await click(page.locator('.cy-preset-grid button').first());
     const title=await page.locator('textarea[data-case-field="title"]').inputValue();
     if(!title.toLowerCase().includes('eurodrone'))throw new Error('Did not load Eurodrone');
     checks.push('Eurodrone synthetic case loaded');},
   case_title:()=>focus('textarea[data-case-field="title"]'),
   case_decision:()=>focus('textarea[data-case-field="decision"]'),
   case_boundary:()=>focus('textarea[data-case-field="boundary"]'),
   next_challenge:async()=>{await click('.journey-actions__next');await page.getByTestId('universal-parameters').waitFor({timeout:18000});},
   alternatives:()=>focus('.cy-options-notes'),
   model_intro:()=>focus('.cy-universal__head'),
   operational:()=>ensureSection(0),
   recovery:()=>focus(page.locator('.cy-universal__section').nth(0).locator('.cy-universal__param').nth(0)),
   supply:()=>focus(page.locator('.cy-universal__section').nth(0).locator('.cy-universal__param').nth(1)),
   deadline:()=>focus(page.locator('.cy-universal__section').nth(0).locator('.cy-universal__param').nth(2)),
   risk_expand:()=>ensureSection(1),
   risk_success:()=>focus(page.locator('.cy-universal__section').nth(1).locator('.cy-universal__param').nth(0)),
   risk_external:()=>focus(page.locator('.cy-universal__section').nth(1).locator('.cy-universal__param').nth(2)),
   cost_expand:()=>ensureSection(2),
   cost_values:()=>focus(page.locator('.cy-universal__section').nth(2).locator('.cy-universal__param').first()),
   contract_expand:()=>ensureSection(3),
   contracts:()=>focus(page.locator('.cy-universal__section').nth(3).locator('.cy-universal__param').nth(1)),
   environment_expand:()=>ensureSection(4),
   environment:()=>focus(page.locator('.cy-universal__section').nth(4).locator('.cy-universal__param').first()),
   evidence_section:()=>ensureSection(5),
   results:async()=>{await focus('.cy-universal__results');recoveryBefore=await resultsValue();},
   edit_recovery:async()=>{
     await ensureSection(0);
     const field=altRecoveryInput();
     firstRecovery=await field.inputValue();
     if(!firstRecovery||!Number.isFinite(Number(firstRecovery)))throw new Error('Missing original recovery input');
     await focus(field);
     // The supply lead time is 78 days in this example: lowering repair time
     // below that bound cannot change the final result. Raise recovery to
     // exceed the binding supply constraint so the output must update.
     await field.fill(String(Number(firstRecovery)+25));await field.press('Tab');
     await sleep(200);
   },
   updated_result:async()=>{
     await focus('.cy-universal__results');recoveryAfter=await resultsValue();
     if(recoveryBefore===recoveryAfter)throw new Error('Edited recovery did not change calculated result: before='+recoveryBefore+', after='+recoveryAfter+', oldInput='+firstRecovery);
     console.log('Verified model response to changed recovery:',recoveryBefore,'→',recoveryAfter);
     await page.screenshot({path:path.join(out,'edited-recovery.png')});
     checks.push('Fictional input changed live comparison');
   },
   restore_recovery:async()=>{
     await ensureSection(0);
     const field=altRecoveryInput();await focus(field);
     await field.fill(firstRecovery);await field.press('Tab');
     checks.push('Original fictional scenario restored');
   },
   sensitivity:()=>focus('.cy-panel .cy-width-short'),
   compare:()=>focus('.cy-results'),
   next_check:async()=>{await goStep(2);await page.locator('.cy-checks').waitFor({timeout:18000});},
   check_intro:()=>focus('.cy-checks'),
   gates:()=>focus('.cy-checks label'),
   not_approved:async()=>{
     const gates=page.locator('.cy-checks input[type="checkbox"]');
     if(await gates.count()!==4)throw new Error('Expected four simulation review gates');
     for(let i=0;i<4;i++)if(!(await gates.nth(i).isChecked()))throw new Error('Eurodrone simulated review gate '+i+' not checked');
     await focus('.cy-checks label:last-child');
     checks.push('All four Eurodrone exercise review gates completed, no real approval asserted');
   },
   evidence_intro:()=>focus('.cy-section-heading'),
   add_evidence:async()=>{
     const records=page.locator('.cy-records article');
     if(await records.count()!==18)throw new Error('Eurodrone exercise should have exactly 18 fictional evidence records');
     const status=await records.first().locator('select').last().inputValue();
     if(status!=='reviewed')throw new Error('Simulated source is not marked as reviewed within exercise');
     await focus('.cy-records article');
     checks.push('All 18 prepared fictional evidence records loaded without creating pending records');
   },
   evidence_pending:async()=>{
     const records=page.locator('.cy-records article');
     const reviewed=await Promise.all(records.locator('select').filter({has:page.locator('option[value="reviewed"]')}).all().then(async opts=>Promise.all(opts.map(x=>x.inputValue()))));
     if(reviewed.length!==18||reviewed.some(x=>x!=='reviewed'))throw new Error('Incomplete synthetic reviewed evidence '+JSON.stringify(reviewed));
     await focus(records.last());
     checks.push('All option evidence records reviewed within example');
   },
   readiness:async()=>{
     const text=await page.locator('.cy-readiness').innerText();
     const status=spanish?'Ejercicio completado':'Exercise complete';
     if(text.split(status).length-1!==2)throw new Error('Expected both alternatives to show exercise complete: '+text.slice(0,800));
     if(/missing traceable review|Validation incomplete|Validación incompleta|Scope, technical, method/.test(text))throw new Error('Old pending evidence still visible');
     await focus('.cy-readiness');
     await page.screenshot({path:path.join(out,'check-complete.png')});
     checks.push('Both comparisons show completed simulated exercise with no missing evidence');
   },
   next_translate:async()=>{
     await goStep(3);
     await page.locator('.cy-deep-dive__item').first().waitFor({timeout:18000});
     if(await page.locator('.cy-deep-dive__item').count()!==7)throw new Error('Expected seven expanded Translate conclusions');
     const section=await page.locator('.cy-output').innerText();
     if(!section.includes(spanish?'EJERCICIO COMPLETO':'COMPLETE EXERCISE'))throw new Error('Translate should show a complete exercise');
     if(/missing traceable review|What is still required before communicating a benefit/.test(section))throw new Error('Outdated pending evidence shown in Translate');
     checks.push('Translate shows seven in-depth conclusions and complete exercise status, no pending checklist');
     await page.screenshot({path:path.join(out,'translate-new-overview.png')});
   },
   translate_intro:()=>focus('.cy-strategic-message h3'),
   translate_priority:()=>focus('.cy-strategic-meaning'),
   translate_logic:()=>focus('.cy-strategic-finding'),
   translate_causal:()=>focus('.cy-strategic-sustainability'),
   translate_conditions:()=>focus('.cy-strategic-assumption'),
   customer_focus:()=>focus('.cy-strategic-message h3'),
   customer_question:()=>focus('.cy-strategic-decision'),
   customer_value:()=>focus('.cy-strategic-finding'),
   engineering_focus:()=>focus('.cy-strategic-message h3'),
   engineering_question:()=>focus('.cy-strategic-decision'),
   engineering_value:()=>focus('.cy-deep-dive__item--action'),
   programme_focus:()=>focus('.cy-strategic-message h3'),
   programme_question:()=>focus('.cy-strategic-finding'),
   programme_value:()=>focus('.cy-deep-dive__item--economics'),
   leadership_focus:()=>focus('.cy-strategic-message h3'),
   leadership_question:()=>focus('.cy-strategic-decision'),
   leadership_value:()=>focus('.cy-deep-dive__item--action'),
   translation_summary:()=>focus('.cy-choices'),
   translation_conclusion:()=>focus('.cy-strategic-meaning'),
   customer_scope:()=>focus('.cy-strategic-assumption'),
   deep_intro:()=>focus('.cy-deep-dive__intro'),
   bottleneck:async()=>{await focus('.cy-deep-dive__item--bottleneck');await page.screenshot({path:path.join(out,'translate-bottleneck.png')});},
   supply_choice:()=>focus('.cy-deep-dive__item--bottleneck'),
   risk_assumptions:()=>focus('.cy-deep-dive__item--risk'),
   tradeoff_economics:()=>focus('.cy-deep-dive__item--economics'),
   environment_tradeoff:()=>focus('.cy-deep-dive__item--environment'),
   compare_options:()=>focus('.cy-deep-dive__item--alternatives'),
   evidence_confidence:()=>focus('.cy-deep-dive__item--evidence'),
   decision_action:()=>focus('.cy-deep-dive__item--action'),
   leadership_risks:()=>focus('.cy-deep-dive__item--risk'),
   leadership_evidence:()=>focus('.cy-deep-dive__item--evidence'),
   option_b_compare:()=>focus('.cy-deep-dive__item--alternatives'),
   option_b_cost:()=>focus('.cy-deep-dive__item--economics'),
   translate_evolution:()=>focus('.cy-deep-dive__intro'),
   customer:()=>selectAudience('defenceCustomer'),
   engineering:()=>selectAudience('engineering'),
   programme:()=>selectAudience('programmeManager'),
   leadership:()=>selectAudience('executiveLeadership'),
   choose_option_b:async()=>{
     const field=page.locator('.cy-choices select').first();
     const oldSummary=await page.locator('.cy-strategic-finding').innerText();
     await focus(field);await field.selectOption('option-b');await sleep(270);
     const newSummary=await page.locator('.cy-strategic-finding').innerText();
     if(oldSummary===newSummary)throw new Error('Translate did not update when selecting option B');
     await focus('.cy-strategic-finding');
     await page.screenshot({path:path.join(out,'translate-other-option.png')});
     checks.push('Translate recalculated to repair plus alternative supplier');

   },
   limitations:()=>focus('.cy-strategic-assumption'),
   export_intro:()=>focus(page.locator('.cy-panel').filter({hasText:spanish?'Exportar un análisis reproducible':'Export a reproducible analysis'}).last()),
   export_pdf:async()=>{
      await downloaded(page.getByRole('button',{name:spanish?'Informe PDF':'PDF report'}),'eurodrone-report.pdf');
   },
   export_markdown:async()=>{
      await downloaded(page.getByRole('button',{name:spanish?'Informe Markdown':'Markdown report'}),'eurodrone-report.md');
   },
   report_caution:()=>focus('.cy-strategic-assumption'),
   save_draft:async()=>{
     const details=page.locator('.cy-work-files');
     if(!(await details.evaluate(el=>el.open)))await click(details.locator('summary'));
     await downloaded(details.locator('button').first(),'eurodrone-case.json');
     const sample=JSON.parse(await fs.readFile(path.join(out,'eurodrone-case.json'),'utf8'));
     if(sample.kind!=='ecodesign'||!sample.hypothetical)throw new Error('Export is not the hypothetical Eurodrone case');
     checks.push('Roundtrip-capable case JSON exported');
   },
   closing:()=>focus('.cy-work-files')
 };
 const missing=cues.filter(cue=>!(cue.id in actions)).map(cue=>cue.id);
 if(missing.length)throw new Error('No browser action for cues: '+missing.join(', '));
 await page.screenshot({path:path.join(out,'tutorial-start.png')});
 // Pre-roll marker enables frame-accurate alignment with the audio clock.
 await page.evaluate(()=>{
   const el=document.createElement('div');el.id='__asri_video_sync';
   el.style.cssText='position:fixed;top:0;left:0;width:96px;height:96px;background:#ff00ff;z-index:2147483647;pointer-events:none';
   document.body.appendChild(el);
 });
 await sleep(900);
 await page.evaluate(()=>document.getElementById('__asri_video_sync')?.remove());
 const started=Date.now();
 const cueTimings=[];
 for(const chapter of timeline.chapters){
   console.log('EURODRONE CHAPTER:',chapter.title);
   for(const cue of chapter.cues){
     const targetMs=cue.start_seconds*1000;
     await sleep(Math.max(0,targetMs-(Date.now()-started)));
     const actualMs=Date.now()-started;
     if(actualMs-targetMs>1900)throw new Error('Cue start drift '+cue.id+': '+(actualMs-targetMs)+'ms');
     const actionStart=Date.now();
     await actions[cue.id]();
     const actionMs=Date.now()-actionStart;
     if(actionMs>cue.hold_seconds*1000+1400)throw new Error('Action exceeded narrator hold: '+cue.id+' '+actionMs+'ms');
     cueTimings.push({id:cue.id,start_ms:Math.round(actualMs),drift_ms:Math.round(actualMs-targetMs),action_ms:actionMs});
   }
 }
 await sleep(Math.max(0,timeline.duration_seconds*1000-(Date.now()-started)));
 const elapsed=(Date.now()-started)/1000;
 await fs.writeFile(path.join(out,'recording-timing.json'),JSON.stringify({
   browser_seconds:Number(elapsed.toFixed(3)),target_seconds:timeline.duration_seconds,
   chapters:timeline.chapters.length,cues:cueTimings.length,
   synchronization:'Clean frame immediately after pre-roll marker',
   cue_timings:cueTimings,checks,page_errors:messages
 },null,2));
 if(messages.some(x=>/TypeError|ReferenceError|Uncaught/i.test(x)))throw new Error('Application exception: '+messages.join('; '));
 console.log('EURODRONE VIDEO RECORDING FINISHED',language,'seconds',elapsed.toFixed(2),'cues',cueTimings.length);
}finally{
 const video=page?.video();
 await context.close();
 if(video){
   const recorded=await video.path();
   const dest=path.join(out,'browser.webm');
   if(recorded!==dest)await fs.copyFile(recorded,dest);
   console.log('Recording:',dest);
 }
 await browser.close();
}
