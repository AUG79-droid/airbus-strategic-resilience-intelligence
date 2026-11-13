import { chromium } from 'playwright-core';
const url=process.env.QA_URL??'http://127.0.0.1:4174';
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const checks=[],errors=[];
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url+'/#/investigate',{waitUntil:'networkidle'});
  for(const step of ['investigate','challenge','validate','translate']){
    await page.getByTestId('guide-'+step).waitFor();
    const dims=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
    if(dims.document>dims.viewport)throw Error('Horizontal overflow in '+step);
    if(step!=='translate')await page.getByTestId('guide-next-'+step).click();
  }
  checks.push('Four guided steps reachable at '+viewport.width+' px');
  await page.getByRole('button',{name:'Use expert mode'}).click();
  if(await page.locator('[data-testid^="guide-"]').count())throw Error('Expert mode failed to hide guide');
  await page.getByRole('button',{name:'ES',exact:true}).click();
  await page.locator('.workspace-tabs button').first().click();
  await page.getByRole('heading',{name:/sostenibilidad como motor de resiliencia estratégica/i}).waitFor();
  checks.push('Expert mode and Spanish navigation retained');
  await context.close();
 }
 if(errors.length)throw Error(errors.join('; '));
 console.log(JSON.stringify({checks},null,2));
}finally{await browser.close();}
