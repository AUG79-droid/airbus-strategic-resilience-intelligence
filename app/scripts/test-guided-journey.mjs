import { chromium } from 'playwright-core';
const url=process.env.QA_URL??'http://127.0.0.1:4174';
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const checks=[],errors=[];
try {
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url+'/#/investigate',{waitUntil:'networkidle'});
  const stages=['investigate','challenge','validate','translate'];
  for(let i=0;i<stages.length;i++){
    await page.locator('.workspace-tabs button').nth(i).click();
    if(!page.url().endsWith('#/'+stages[i]))throw Error('Workflow route failed: '+stages[i]);
    if(await page.locator('.workflow-button[aria-current="page"]').count()!==1)throw Error('Multiple active workflow stages');
    const sizes=await page.evaluate(()=>({window:innerWidth,document:document.documentElement.scrollWidth}));
    if(sizes.document>sizes.window)throw Error('Horizontal overflow '+stages[i]);
  }
  await page.locator('.journey-actions__back').click();
  if(!page.url().endsWith('#/validate'))throw Error('Translate back button did not return to Check');
  await page.locator('.journey-actions__next').click();
  if(!page.url().endsWith('#/translate'))throw Error('Check next button did not advance to Translate');
  await page.getByRole('button',{name:'ES',exact:true}).click();
  await page.getByRole('heading',{name:'Traductor estratégico'}).waitFor();
  checks.push('Four-stage responsive navigation, back/next and Spanish translation at '+viewport.width+' px');
  await context.close();
 }
 if(errors.length)throw Error(errors.join('; '));
 console.log(JSON.stringify({checks},null,2));
} finally { await browser.close(); }
