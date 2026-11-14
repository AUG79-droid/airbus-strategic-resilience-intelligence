import {chromium} from 'playwright-core';

const base=process.env.QA_URL??'http://127.0.0.1:4174';
const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless:true,args:['--disable-extensions','--no-first-run']
});
const expected=['Eurodrone','Climate','SAF','Wildfire'];
const audiences=['defenceCustomer','engineering','programmeManager','executiveLeadership'];
const options=['option-a','option-b'];
const checks=[];
try{
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{
    if(message.type()==='error'&&!message.text().includes('Failed to load resource: the server responded with a status of 404'))
      errors.push(message.text());
  });
  await page.goto(base+'/#/investigate',{waitUntil:'networkidle'});
  await page.locator('.case-mode-switch button').last().click();

  for(let preset=0;preset<expected.length;preset++){
    await page.locator('.workflow-button').nth(0).click();
    await page.locator('.cy-preset-grid button').nth(preset).click();
    for(let phase=0;phase<4;phase++){
      await page.locator('.workflow-button').nth(phase).click();
      await page.locator('.cy-stage').waitFor();
      const text=await page.locator('.cy-stage').innerText();
      if(text.length<200)throw new Error(`${expected[preset]} phase ${phase+1} is unexpectedly empty`);
      if(/\bNaN\b|\bundefined\b|\bInfinity\b/.test(text))
        throw new Error(`${expected[preset]} phase ${phase+1} contains an invalid numeric token`);
    }
    const selects=page.locator('.cy-choices select');
    for(const option of options)for(const audience of audiences){
      await selects.nth(0).selectOption(option);
      await selects.nth(1).selectOption(audience);
      const output=page.locator('.cy-output');
      await output.getByText(/COMPLETE EXERCISE.*SIMULATED REVIEW/).waitFor();
      const text=await output.innerText();
      if(!text.includes('Model-based answer'))
        throw new Error(`${expected[preset]} ${option}/${audience} lacks a decision answer`);
      if((await output.locator('.cy-deep-dive__item').count())!==7)
        throw new Error(`${expected[preset]} ${option}/${audience} lacks seven deep-dive sections`);
      if(/\bNaN\b|\bundefined\b|\bInfinity\b/.test(text))
        throw new Error(`${expected[preset]} ${option}/${audience} contains an invalid numeric token`);
    }
    checks.push(`${expected[preset]}: four phases, two alternatives and four audiences`);
  }
  if(errors.length)throw new Error(`Browser errors:\n${errors.join('\n')}`);
  console.log(JSON.stringify({base,checks,combinations:expected.length*options.length*audiences.length,errors},null,2));
  await context.close();
}finally{
  await browser.close();
}
