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
if(timeline.chapters.length!==7||cues.length<40)throw new Error('Full tutorial script missing');
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
     await focus(field);await field.fill(String(Number(firstRecovery)-12));await field.press('Tab');
     await sleep(200);
   },
   updated_result:async()=>{
     await focus('.cy-universal__results');recoveryAfter=await resultsValue();
     if(recoveryBefore===recoveryAfter)throw new Error('Edited recovery did not change calculated result');
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
   not_approved:()=>focus('.cy-checks label:last-child'),
   evidence_intro:()=>focus('.cy-records'),
   add_evidence:async()=>{
     await click('.cy-section-heading button');
     const first=page.locator('.cy-records article').first();
     await first.waitFor({timeout:10000});
     const field=first.locator('input').first();
     await focus(field);
     await field.fill(spanish?'Ejemplo hipotético, pendiente de verificar':'Hypothetical sample, not verified');
     checks.push('Pending evidence record created without falsely marking it reviewed');
   },
   evidence_pending:()=>focus('.cy-records article'),
   readiness:()=>focus('.cy-readiness'),
   next_translate:async()=>{await goStep(3);await page.locator('.cy-output').waitFor({timeout:18000});},
   translate_intro:()=>focus('.cy-output'),
   customer:()=>selectAudience('defenceCustomer'),
   engineering:()=>selectAudience('engineering'),
   programme:()=>selectAudience('programmeManager'),
   leadership:()=>selectAudience('executiveLeadership'),
   choose_option_b:async()=>{
     const field=page.locator('.cy-choices select').first();
     await focus(field);await field.selectOption('option-b');await sleep(270);
     await focus('.cy-output');
   },
   limitations:()=>focus('.cy-output ul'),
   export_intro:()=>focus(page.locator('.cy-panel').filter({hasText:spanish?'Exportar un análisis reproducible':'Export a reproducible analysis'}).last()),
   export_pdf:async()=>{
      await downloaded(page.getByRole('button',{name:spanish?'Informe PDF':'PDF report'}),'eurodrone-report.pdf');
   },
   export_markdown:async()=>{
      await downloaded(page.getByRole('button',{name:spanish?'Informe Markdown':'Markdown report'}),'eurodrone-report.md');
   },
   report_caution:()=>focus('.cy-output'),
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
