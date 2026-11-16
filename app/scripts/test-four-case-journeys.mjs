import {chromium} from 'playwright-core';

const base=process.env.QA_URL??'http://127.0.0.1:4174';
const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless:true,args:['--disable-extensions','--no-first-run']
});
const expected=['Eurodrone','Climate','SAF','Wildfire'];
const spanishNames=['Sustitución convencional','Configuración actual','Contrato de combustible actual','Coordinación actual'];
const audiences=['defenceCustomer','engineering','programmeManager','executiveLeadership'];
const options=['baseline','option-a','option-b'];
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
    const scenario=await page.getByTestId('case-scenario').locator('textarea[data-case-field="scenario"]').inputValue();
    if(scenario.length<130 || !scenario.toLowerCase().includes('fictional'))
      throw new Error(`${expected[preset]} missing explicit fictional incident context`);
    for(let phase=0;phase<4;phase++){
      await page.locator('.workflow-button').nth(phase).click();
      await page.locator('.cy-stage').waitFor();
      if(phase===1){
        if((await page.locator('.cy-results article').count())!==3)throw Error(`${expected[preset]} does not display all three decisions`);
        if((await page.getByTestId('baseline-results').count())!==1)throw Error(`${expected[preset]} lacks its explicit baseline card`);
      }
      if(phase>0){
        const recap=await page.getByTestId('case-scenario-recap').innerText();
        if(!recap.includes(scenario))throw new Error(`${expected[preset]} phase ${phase+1} lost starting incident`);
      }
      const text=await page.locator('.cy-stage').innerText();
      if(text.length<200)throw new Error(`${expected[preset]} phase ${phase+1} is unexpectedly empty`);
      if(/\bNaN\b|\bundefined\b|\bInfinity\b/.test(text))
        throw new Error(`${expected[preset]} phase ${phase+1} contains an invalid numeric token`);
    }
    const selects=page.locator('.cy-choices select');
    if((await selects.nth(0).locator('option').count())!==3)throw Error(`${expected[preset]} lacks three Translate decisions`);
    for(const option of options)for(const audience of audiences){
      await selects.nth(0).selectOption(option);
      await selects.nth(1).selectOption(audience);
      const output=page.locator('.cy-output');
      if(option==='baseline'&&!(await page.getByTestId('baseline-translation').count()))throw Error(`${expected[preset]} missing baseline translation`);
      await output.getByText(/COMPLETE EXERCISE.*SIMULATED REVIEW/).waitFor();
      const text=await output.innerText();
      if(!text.includes('Model-based answer'))
        throw new Error(`${expected[preset]} ${option}/${audience} lacks a decision answer`);
      if((await output.locator('.cy-deep-dive__item').count())!==7)
        throw new Error(`${expected[preset]} ${option}/${audience} lacks seven deep-dive sections`);
      if(/\bNaN\b|\bundefined\b|\bInfinity\b/.test(text))
        throw new Error(`${expected[preset]} ${option}/${audience} contains an invalid numeric token`);
    }

    // Switching language must localise the existing case, not reset it or mix languages.
    await page.locator('.language-switch button').nth(1).click();
    const esScenario=await page.getByTestId('case-scenario-recap').innerText();
    if(esScenario.includes(scenario)||esScenario.length<130)
      throw Error(`${expected[preset]} scenario was not translated to Spanish`);
    for(let phase=0;phase<4;phase++){
      await page.locator('.workflow-button').nth(phase).click();
      await page.locator('.cy-stage').waitFor();
      const text=await page.locator('.cy-stage').innerText();
      if(text.includes(scenario))throw Error(`${expected[preset]} phase ${phase+1} retained English scenario`);
      if(phase===0){
        const title=await page.locator('.case-line strong').innerText();
        if(title!==['Eurodrone · Ecodiseño y dependencia de materiales críticos',
          'Adaptación climática · Escenario de calor extremo',
          'SAF · Resiliencia de abastecimiento para una misión equivalente',
          'Incendios forestales · Detección y respuesta conectada'][preset])
          throw Error(`${expected[preset]} Spanish case title is wrong: ${title}`);
      }
      if(phase===1){
        if((await page.locator('.cy-results article').count())!==3)
          throw Error(`${expected[preset]} missing three decisions in Spanish`);
        const baseline=await page.getByTestId('baseline-results').innerText();
        if(!baseline.includes(spanishNames[preset])||!baseline.includes('Tiempo medio de recuperación'))
          throw Error(`${expected[preset]} baseline result was not localized in Spanish`);
        if(baseline.includes('Expected recovery time')||text.includes('Conventional replacement'))
          throw Error(`${expected[preset]} Challenge has leaked English case text`);
      }
      if(phase===2&&text.includes('SIMULATED EXERCISE ·'))
        throw Error(`${expected[preset]} Check retained English evidence titles`);
      if(/\\bNaN\\b|\\bundefined\\b|\\bInfinity\\b/.test(text))
        throw Error(`${expected[preset]} Spanish phase ${phase+1} has invalid output`);
    }
    const esSelects=page.locator('.cy-choices select');
    for(const option of options)for(const audience of audiences){
      await esSelects.nth(0).selectOption(option);
      await esSelects.nth(1).selectOption(audience);
      const output=page.locator('.cy-output');
      const text=await output.innerText();
      if(!text.includes('Respuesta del análisis')||text.includes('Model-based answer'))
        throw Error(`${expected[preset]} ${option}/${audience} missing Spanish analysis`);
      if((await output.locator('.cy-deep-dive__item').count())!==7)
        throw Error(`${expected[preset]} ${option}/${audience} missing Spanish detail`);
    }
    await page.locator('.language-switch button').nth(0).click();
    await page.locator('.workflow-button').nth(0).click();
    const roundtrip=await page.getByTestId('case-scenario').locator('textarea[data-case-field="scenario"]').inputValue();
    if(roundtrip!==scenario)throw Error(`${expected[preset]} original English case was not restored`);
    checks.push(`${expected[preset]}: ES/EN four phases, three decisions, four audiences, locale roundtrip`);
  }
  // Also walk the standard DEMO-60 in both languages across all four phases.
  await page.locator('.case-mode-switch button').first().click();
  for(const lang of [0,1]){
    await page.locator('.language-switch button').nth(lang).click();
    for(let phase=0;phase<4;phase++){
      await page.locator('.workflow-button').nth(phase).click();
      await page.locator('.workspace-view').waitFor();
      if((await page.locator('.workspace-view').innerText()).length<100)
        throw Error(`DEMO-60 language ${lang} phase ${phase} is empty`);
    }
  }
  if(errors.length)throw new Error(`Browser errors:\n${errors.join('\n')}`);
  console.log(JSON.stringify({base,checks,combinations:expected.length*options.length*audiences.length*2,errors},null,2));
  await context.close();
}finally{
  await browser.close();
}
