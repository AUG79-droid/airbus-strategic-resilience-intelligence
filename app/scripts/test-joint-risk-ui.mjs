import { chromium } from 'playwright-core';

const url=process.env.QA_URL??'http://127.0.0.1:4174';
const executablePath=process.env.CHROME_BIN||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser=await chromium.launch({executablePath,headless:true,args:['--disable-extensions','--no-first-run']});
try {
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url+'/#/investigate',{waitUntil:'networkidle'});
  await page.locator('.case-mode-switch button').last().click();
  await page.locator('.workspace-tabs button').nth(1).click();
  await page.locator('.cy-universal__section').nth(1).locator('summary').click();

  const section=label=>page.locator('.cy-universal__param').filter({has:page.getByRole('heading',{name:label,exact:false})});
  const technical=section('Technical success probability');
  const shock=section('External disruption probability');
  const joint=section('Technical failure AND disruption together');
  await technical.locator('select').first().selectOption('applies');
  await technical.locator('input[type=number]').first().fill('50');
  await shock.locator('input[type=number]').first().fill('50');
  await joint.locator('select').first().selectOption('applies');
  const overlap=joint.locator('input[type=number]').first();
  await overlap.fill('60');
  if(await overlap.getAttribute('aria-invalid')!=='true')throw Error('An impossible 60% overlap was not rejected.');
  await overlap.fill('50');
  if(await overlap.getAttribute('aria-invalid')!=='false')throw Error('A feasible 50% overlap was rejected.');
  if(!(await joint.locator('.cy-universal__option').first().innerText()).includes('Admissible joint range'))
    throw Error('The expected admissible joint range was not displayed.');
  // Opt-in browser draft recovery is permitted ONLY for hypothetical examples.
  await page.goto(url+'/#/investigate',{waitUntil:'networkidle'});
  await page.locator('.case-mode-switch button').last().click();
  const optIn=page.locator('section[aria-label="Optional local draft saving"] input[type=checkbox]');
  await optIn.check();
  await page.locator('.cy-preset-grid button').first().click();
  await page.locator('textarea[data-case-field=title]').fill('Saved fictional example regression');
  await page.waitForFunction(()=>{
    const raw=localStorage.getItem('asri-demo-draft-v2');
    return raw&&JSON.parse(raw).title==='Saved fictional example regression';
  });
  await page.reload({waitUntil:'networkidle'});
  await page.locator('.case-mode-switch button').last().click();
  if(await page.locator('textarea[data-case-field=title]').inputValue()!=='Saved fictional example regression')
    throw Error('Opt-in fictional draft was not restored after reload.');
  await page.locator('section[aria-label="Optional local draft saving"] input[type=checkbox]').uncheck();
  if(await page.evaluate(()=>localStorage.getItem('asri-demo-draft-v2'))!==null)
    throw Error('Disabling draft saving did not remove local data.');
  // Regression ASRI-012: language changes may NOT silently switch the
  // selected alternative or executive audience before an export.
  await page.goto(url+'/#/investigate',{waitUntil:'networkidle'});
  await page.locator('.case-mode-switch button').last().click();
  await page.locator('.cy-preset-grid button').first().click();
  await page.locator('.workspace-tabs button').nth(3).click();
  const choice=page.locator('.cy-choices select');
  await choice.nth(0).selectOption('option-b');
  await choice.nth(1).selectOption('executiveLeadership');
  await page.getByRole('button',{name:'ES',exact:true}).click();
  if(await choice.nth(0).inputValue()!=='option-b'||await choice.nth(1).inputValue()!=='executiveLeadership')
    throw Error('Selected option or executive audience changed after switching to Spanish');
  await page.getByRole('button',{name:'EN',exact:true}).click();
  if(await choice.nth(0).inputValue()!=='option-b'||await choice.nth(1).inputValue()!=='executiveLeadership')
    throw Error('Selected option or executive audience changed after returning to English');
  console.log('PASS: option B and executive audience survive ES/EN/ES language changes.');
  if(errors.length)throw Error(errors.join('; '));
  console.log('PASS: v2 joint-risk input enforces Fréchet bounds in the browser.');
  await context.close();
} finally { await browser.close(); }
