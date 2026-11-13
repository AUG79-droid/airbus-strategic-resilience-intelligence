import { chromium } from 'playwright-core';
const url=process.env.LAB_URL??'http://127.0.0.1:4174';
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const checks=[],errors=[];
try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    const context=await browser.newContext({viewport,reducedMotion:'reduce'});
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(url+'/#/challenge',{waitUntil:'networkidle'});
    await page.getByRole('heading',{name:'Make a decision and see what happens'}).waitFor();
    await page.getByTestId('decision-choice-repairFirst').click();
    await page.getByTestId('decision-feedback').waitFor();
    const before=await page.getByTestId('decision-feedback').innerText();
    await page.getByTestId('change-conditions').click();
    await page.getByTestId('basic-controls').waitFor();
    const field=page.getByTestId('basic-controls').getByTestId('risk-repair-feasibility');
    await field.fill('10');
    await field.blur();
    const after=await page.getByTestId('decision-feedback').innerText();
    if(before===after)throw Error('Repair probability did not change the result');
    checks.push('Responsive scenario controls recalculate the decision at '+viewport.width+' px');
    const size=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
    if(size.scrollWidth>size.width)throw Error('Horizontal overflow: '+JSON.stringify(size));
    await page.getByRole('button',{name:'ES',exact:true}).click();
    await page.getByRole('heading',{name:'Decide y comprueba qué ocurre'}).waitFor();
    checks.push('Spanish scenario heading and no horizontal overflow');
    await context.close();
  }
  if(errors.length)throw Error(errors.join('; '));
  console.log(JSON.stringify({checks},null,2));
}finally{await browser.close();}
