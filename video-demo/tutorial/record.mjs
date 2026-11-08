/**
 * Real, unhurried guided tutorial recording of the published app.
 * No app source changes. Actions start at their corresponding spoken cue.
 * Captures 1920x970 UI; 110px of subtitle space is added BELOW the UI.
 */
import {chromium} from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'output');
await fs.mkdir(out, {recursive: true});
const timeline = JSON.parse(await fs.readFile(path.join(out, 'timeline.json'), 'utf8'));
const url = 'https://aug79-droid.github.io/airbus-strategic-resilience-intelligence/#/investigate';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const errors = [];
const browser = await chromium.launch({headless: true, args:['--no-sandbox', '--disable-dev-shm-usage']});
const context = await browser.newContext({
  viewport: {width:1920,height:970},
  screen: {width:1920,height:970},
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
  acceptDownloads: true,
  recordVideo: {dir:out,size:{width:1920,height:970}},
});
await context.addInitScript(() => {
  const createCursor = () => {
    if (document.getElementById('__asri_video_cursor')) return;
    const pointer = document.createElement('div');
    pointer.id = '__asri_video_cursor';
    pointer.setAttribute('aria-hidden','true');
    pointer.style.cssText =
      'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:38px;height:45px;transform:translate(1100px,90px);transition:transform .22s ease-out;filter:drop-shadow(0px 2px 3px #0007)';
    pointer.innerHTML = '<svg width="38" height="45" viewBox="0 0 38 45" xmlns="http://www.w3.org/2000/svg"><path d="M4 3V34L12 26L18 40L24 37L17 23H31Z" fill="#fff" stroke="#143929" stroke-width="2.3"/><circle id="__asri_click_ring" cx="5" cy="5" r="0" fill="none" stroke="#ef5b3d" stroke-width="3"/></svg>';
    document.body.appendChild(pointer);
    const ring = pointer.querySelector('#__asri_click_ring');
    document.addEventListener('pointermove', e => {
      pointer.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
    },true);
    document.addEventListener('pointerdown', () => {
      ring.setAttribute('r','17');
      ring.setAttribute('opacity','1');
      setTimeout(() => {ring.setAttribute('r','0'); ring.setAttribute('opacity','0');},450);
    },true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',createCursor);
  else createCursor();
});

let page;
try {
  page = await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m => {
    if(m.type()==='error' && !/favicon/i.test(m.text())) errors.push(m.text());
  });
  await page.goto(url, {waitUntil:'domcontentloaded',timeout:45000});
  await page.getByTestId('start-comparison').waitFor({timeout:25000});
  const english=page.locator('.language-switch button').filter({hasText:'EN'});
  if((await english.getAttribute('aria-pressed'))!=='true') await english.click();

  async function focus(selector) {
    const element = typeof selector === 'string' ? page.locator(selector).first() : selector;
    await element.scrollIntoViewIfNeeded({timeout:15000});
    await element.hover({timeout:15000});
    await sleep(370);
  }
  async function click(selector) {
    const element=typeof selector==='string'?page.locator(selector).first():selector;
    await focus(element);
    await sleep(250);
    await element.click({timeout:15000});
    await sleep(340);
  }
  async function tab(n) {
    await click(page.locator('.lab-analysis-tabs button').nth(n));
  }
  async function sectionTab(n) {
    await click(page.locator('.translator-section-tabs button').nth(n));
  }
  async function option(id) {
    await click(page.getByTestId('decision-choice-'+id));
  }
  const controls=page.locator('.lab-controls > details');
  async function expandDetail(n) {
    const detail=controls.nth(n);
    const isOpen=await detail.getAttribute('open');
    if(isOpen===null) await click(detail.locator('summary'));
    await focus(detail.locator('summary'));
  }
  const actions={
    // 1. Investigate — explain before proceeding.
    hero: ()=>focus('#hero-title'),
    purpose: ()=>focus('.hero__subtitle'),
    scope: ()=>focus('.hero__meta'),
    navigation: ()=>focus('.workspace-tabs'),
    case: ()=>focus('#case-start-title'),
    facts: ()=>focus('.case-start__fact-grid'),
    facts_detail: ()=>focus('.case-start__assumption'),
    alternatives: ()=>focus('.case-start__options'),
    begin: ()=>click(page.getByTestId('start-comparison')),

    // 2a. Decisions — compare all three, then select Repair First.
    scenario: ()=>focus('.lab-preset-row'),
    scenario_help: ()=>focus('.lab-scenario-help'),
    choices: ()=>focus('.decision-desk__options'),
    choose_new: ()=>option('new'),
    new_outcome: ()=>focus('.decision-desk__metrics'),
    choose_parallel: ()=>option('parallel'),
    parallel_outcome: ()=>focus('.decision-desk__feedback'),
    choose_repair: ()=>option('repairFirst'),
    repair_mean: async()=>{
      const m=await page.locator('.decision-desk__metrics strong').first().innerText();
      if(!m.includes('50'))throw new Error('Expected 50 days, got '+m);
      await focus(page.locator('.decision-desk__metrics div').nth(0));
      console.log('Verified initial scenario:',m);
    },
    repair_deadline: ()=>focus(page.locator('.decision-desk__metrics div').nth(1)),
    repair_cost: ()=>focus(page.locator('.decision-desk__metrics div').nth(2)),
    repair_explain: ()=>focus(page.getByTestId('recovery-time-explanation')),
    compare_routes: ()=>focus('.decision-desk__comparisons'),
    decision_caution: ()=>focus('.decision-desk__actions'),

    // 2b. Live conditions — real form edits with recalculation.
    open_conditions: async()=>{
      await click(page.getByTestId('change-conditions'));
      await page.getByTestId('basic-controls').waitFor({timeout:15000});
    },
    inputs: ()=>focus(page.getByTestId('basic-controls')),
    repair_initial: async()=>{
      const field=page.getByTestId('risk-repair-feasibility');
      if(Number(await field.inputValue())!==75)throw new Error('Expected 75% feasibility');
      await focus(field);
    },
    change_probability: async()=>{
      const field=page.getByTestId('risk-repair-feasibility');
      await focus(field);
      await field.fill('90');
      await field.press('Tab');
      await sleep(400);
    },
    result_updated: async()=>{
      await page.waitForFunction(
        ()=>Array.from(document.querySelectorAll('.lab-conditions-live dd')).some(x=>x.textContent && x.textContent.includes('36.8')),
        null,{timeout:12000}
      );
      const value=await page.locator('.lab-conditions-live dd').first().innerText();
      console.log('Verified updated scenario:',value);
      await focus(page.getByTestId('live-conditions'));
      await page.screenshot({path:path.join(out,'result-90-percent.png')});
    },
    interpret_change: ()=>focus(page.getByTestId('condition-impact')),
    other_inputs: ()=>focus(page.getByTestId('basic-controls')),
    advanced_inputs: ()=>expandDetail(0),
    cost_fields: ()=>expandDetail(1),
    contract_fields: ()=>expandDetail(2),
    environment_inputs: ()=>expandDetail(3),
    back_compare: ()=>click(page.getByTestId('change-conditions')),
    reset_assumption: async()=>{
      const preset = page.getByTestId('preset-select');
      await focus(preset);
      await preset.selectOption('balanced');
      await page.waitForFunction(()=>{
        const preset = document.querySelector('[data-testid="preset-select"]');
        return !!preset && preset.value === 'balanced';
      },null,{timeout:12000});
      const metric = await page.locator('.decision-desk__metrics strong').first().innerText();
      if(!metric.includes('50'))throw new Error('Baseline not restored: '+metric);
      await focus('.decision-desk__metrics');
      console.log('Restored initial conditions: 75% feasibility; '+metric);
    },

    // 2c. Optional technical analysis.
    open_analysis: async()=>{
      await click(page.getByTestId('open-technical'));
      await page.locator('.lab-analysis-tabs').waitFor({timeout:12000});
    },
    branch_table: ()=>focus('.lab-branches'),
    branch_probability: ()=>focus('.lab-branches table thead'),
    branch_costs: ()=>focus('.lab-branches table tbody'),
    sensitivity_tab: ()=>tab(1),
    sensitivity_graph: ()=>focus('.lab-chart-wrap'),
    sensitivity_test: async()=>{
      const selector=page.getByTestId('sensitivity-variable');
      await focus(selector);
      await selector.selectOption('repairExecutionDays');
      await sleep(330);
    },
    thresholds: ()=>focus('.threshold-explained'),
    environment_tab: ()=>tab(2),
    environment_mechanism: ()=>focus('.lab-causal'),
    environment_limits: ()=>focus('.lab-causal .lab-method-note'),
    method_tab: ()=>tab(3),
    method_explain: ()=>focus('.formula-panel'),
    technical_end: ()=>focus('.lab-analysis-tabs'),

    // 3. Check / Validate.
    validate_nav: async()=>{
      await click(page.locator('.workspace-tabs button').nth(2));
      await page.locator('#validation-simple-title').waitFor({timeout:15000});
    },
    validate_intro: ()=>focus('#validation-simple-title'),
    evidence_documented: ()=>focus(page.locator('.validation-review__record').nth(0)),
    evidence_hypothesis: ()=>focus(page.locator('.validation-review__record').nth(1)),
    evidence_modelled: ()=>focus(page.locator('.validation-review__record').nth(2)),
    supported_vs_pending: ()=>focus('.validation-conclusions'),
    engineering: ()=>focus(page.locator('.validation-simple__checks article').nth(0)),
    procurement: ()=>focus(page.locator('.validation-simple__checks article').nth(1)),
    environment_team: ()=>focus(page.locator('.validation-simple__checks article').nth(2)),
    programme: ()=>focus(page.locator('.validation-simple__checks article').nth(3)),
    advanced_evidence: async()=>{
      await click(page.getByTestId('validate-advanced-toggle'));
      await page.locator('#technical-evidence').waitFor({timeout:15000});
      await focus('#technical-evidence');
    },
    validate_end: ()=>focus('#technical-evidence'),

    // 4a. Strategic translation for different audiences.
    translate_nav: async()=>{
      await click(page.locator('.workspace-tabs button').nth(3));
      await page.locator('#translate-title').waitFor({timeout:15000});
    },
    audiences: ()=>focus('.audience-selector'),
    audience_engineering: ()=>click(page.getByTestId('audience-engineering')),
    engineering_message: ()=>focus(page.getByTestId('translator-summary')),
    audience_exec: ()=>click(page.getByTestId('audience-executiveLeadership')),
    executive_message: ()=>focus('.translator-summary__body'),
    strategy_choice: async()=>{
      await click(page.getByTestId('strategy-parallel'));
      await focus('.strategy-selector');
    },
    summary: async()=>{
      await click(page.getByTestId('strategy-repairFirst'));
      await focus('.translator-summary__body');
    },
    comparison: ()=>focus(page.getByTestId('three-way-comparison')),
    profile_tab: async()=>{await sectionTab(0);await focus('.translator-profile');},
    causal_tab: async()=>{await sectionTab(1);await focus('.translator-causal');},
    causal_caution: ()=>focus('.translator-causal__chain'),
    trace_tab: async()=>{await sectionTab(2);await focus('.translator-trace');},
    validation_tab: async()=>{await sectionTab(3);await focus('.translator-validation');},
    limitations: async()=>{
      const detail=page.locator('.translator-limitations');
      if((await detail.getAttribute('open'))===null) await click(detail.locator('summary'));
      await focus(detail);
    },

    // 4b. Review and export. Verify real downloads on disposable GitHub runner.
    export_open: async()=>{
      await click(page.getByTestId('open-export-review'));
      await page.locator('.export-review__panel').waitFor({timeout:15000});
    },
    export_summary: ()=>focus('.export-review__summary'),
    export_readiness: ()=>focus('.export-review__readiness'),
    export_confirm: async()=>{
      await click(page.getByTestId('export-confirm'));
      if(!(await page.getByTestId('export-confirm').isChecked()))throw new Error('Report was not acknowledged');
    },
    export_pdf: async()=>{
      // The UI requires explicit review consent. Keep the functional
      // operation even though the revised voiceover does not narrate it.
      const confirmation=page.getByTestId('export-confirm');
      if(!(await confirmation.isChecked()))await click(confirmation);
      const button=page.getByTestId('download-pdf');
      await focus(button);
      const [download]=await Promise.all([
        page.waitForEvent('download',{timeout:20000}),
        button.click(),
      ]);
      await download.saveAs(path.join(out,'example-decision-report.pdf'));
      console.log('PDF export verified:',download.suggestedFilename());
    },
    export_json: async()=>{
      const button=page.getByTestId('download-json');
      await focus(button);
      const [download]=await Promise.all([
        page.waitForEvent('download',{timeout:15000}),
        button.click(),
      ]);
      const target=path.join(out,'example-decision-data.json');
      await download.saveAs(target);
      const data=JSON.parse(await fs.readFile(target,'utf8'));
      if(!data||typeof data!=='object')throw new Error('JSON export invalid');
      console.log('JSON export verified:',download.suggestedFilename());
    },
    end: ()=>focus('.export-review__panel'),
  };

  const cueIds=timeline.chapters.flatMap(ch=>ch.cues.map(c=>c.id));
  const unknown=cueIds.filter(id=>!actions[id]);
  if(unknown.length)throw new Error('Narration has missing browser actions: '+unknown.join(','));
  await page.screenshot({path:path.join(out,'tutorial-start.png')});

  // A temporary sync marker appears ONLY during pre-roll. FFmpeg later detects
  // its trailing frame and removes all marker frames from the final MP4.
  await page.evaluate(()=>{
    const e=document.createElement('div');
    e.id='__asri_video_sync';
    e.style.cssText='position:fixed;top:0;left:0;width:96px;height:96px;background:#ff00ff;z-index:2147483647;pointer-events:none';
    document.body.appendChild(e);
  });
  await sleep(900);
  await page.evaluate(()=>document.getElementById('__asri_video_sync')?.remove());

  const started=Date.now();
  const cueTimes=[];
  for(const chapter of timeline.chapters){
    console.log('CHAPTER:',chapter.title);
    for(const cue of chapter.cues){
      const targetMs=cue.start_seconds*1000;
      await sleep(Math.max(0,targetMs-(Date.now()-started)));
      const actualMs=Date.now()-started;
      const driftMs=actualMs-targetMs;
      if(Math.abs(driftMs)>1800)throw new Error('Narration/visual sync drift: '+cue.id+' '+driftMs+'ms');
      const actionAt=Date.now();
      await actions[cue.id]();
      const actionMs=Date.now()-actionAt;
      if(actionMs>cue.hold_seconds*1000+1500)throw new Error('Action too slow for narration: '+cue.id);
      cueTimes.push({id:cue.id,start_ms:Math.round(actualMs),drift_ms:Math.round(driftMs),action_ms:actionMs});
    }
  }
  await sleep(Math.max(0,timeline.duration_seconds*1000-(Date.now()-started)));
  const videoSeconds=(Date.now()-started)/1000;
  await fs.writeFile(path.join(out,'recording-timing.json'),JSON.stringify({
    target_seconds:timeline.duration_seconds,
    browser_seconds:Number(videoSeconds.toFixed(3)),
    chapters:timeline.chapters.length,
    cues:cueTimes.length,
    synchronization:'First clean frame after temporary magenta sync marker',
    cue_timings:cueTimes,
    checks:['50 days at 75% feasibility','36.8 days at 90% feasibility','PDF downloaded','JSON downloaded'],
    page_errors:errors,
  },null,2));
  if(errors.some(x=>/Uncaught|TypeError|ReferenceError/i.test(x)))throw new Error('Browser exception: '+errors.join('; '));
  console.log('GUIDED TUTORIAL RECORDING FINISHED:',videoSeconds.toFixed(3),'seconds; cues:',cueTimes.length);
}finally{
  const video=page?.video();
  await context.close();
  if(video){
    const recorded=await video.path();
    const destination=path.join(out,'browser.webm');
    if(recorded!==destination)await fs.copyFile(recorded,destination);
    console.log('Browser video saved:',destination);
  }
  await browser.close();
}
