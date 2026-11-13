import { chromium } from 'playwright-core';
const url=process.env.EVIDENCE_URL??'http://127.0.0.1:4174';
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const checks=[],errors=[];
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',err=>errors.push(err.message));
  await page.goto(url+'/#/validate',{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'What supports our decision?'}).waitFor();
  const toggle=page.getByTestId('validate-advanced-toggle');
  await toggle.click();
  await page.getByRole('heading',{name:'Sources and validation checks'}).waitFor();
  await page.getByTestId('evidence-focus').selectOption('strategy:repairFirst');
  const active=await page.getByTestId('evidence-focus').inputValue();
  if(active!=='strategy:repairFirst')throw Error('Filtered evidence focus lost');
  const claims=page.getByRole('tab',{name:/What can we state\?/});await claims.click();
  await page.getByTestId('claim-operationalBenefit').waitFor();
  const state=await page.getByTestId('claim-operationalBenefit').innerText();
  if(!/Blocked|Rejected/.test(state))throw Error('Unvalidated operational claims were presented as approved: '+state);
  await page.getByRole('tab',{name:/Public documents/}).click();
  await page.getByTestId('source-AIRBUS-MMS-01').waitFor();
  const width=await page.evaluate(()=>({window:innerWidth,document:document.documentElement.scrollWidth}));
  if(width.document>width.window)throw Error('Horizontal overflow in Check: '+JSON.stringify(width));
  checks.push('Evidence source, claim gates and focus work at '+viewport.width+' px');
  await page.getByRole('button',{name:'ES',exact:true}).click();
  await page.getByRole('heading',{name:'¿En qué se apoya nuestra decisión?'}).waitFor();
  checks.push('Spanish evidence introduction and controls');
  await context.close();
 }
 if(errors.length)throw Error(errors.join('; '));
 console.log(JSON.stringify({checks},null,2));
}finally{await browser.close();}
