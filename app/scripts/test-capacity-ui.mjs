import {chromium} from 'playwright-core';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const base=process.env.QA_URL??'http://127.0.0.1:4174';
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,
  args:['--disable-extensions','--no-first-run']});
try {
  const context=await browser.newContext({viewport:{width:1440,height:900},
    acceptDownloads:true,reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/#/investigate',{waitUntil:'networkidle'});
  await page.locator('.case-mode-switch button').last().click();
  await page.locator('.cy-preset-grid button').first().click();
  await page.locator('.workspace-tabs button').nth(1).click();
  const capacity=page.getByTestId('repair-capacity');
  await capacity.locator('summary').click();
  const options=capacity.locator('.cy-option-definition');
  await options.nth(0).getByRole('button',{name:/Add a capacity scenario/}).click();
  await options.nth(1).getByRole('button',{name:/Add a capacity scenario/}).click();
  const baselineFields=options.nth(0).locator('input[type=number]');
  await baselineFields.nth(0).fill('1');
  await baselineFields.nth(1).fill('4');
  await baselineFields.nth(2).fill('3');
  await baselineFields.nth(3).fill('2');
  await options.nth(0).getByText(/conditional completion/i).waitFor();
  if(!(await options.nth(0).innerText()).includes('14 days'))
    throw Error('FIFO workshop baseline conditional completion is incorrect');
  const secondFields=options.nth(1).locator('input[type=number]');
  await secondFields.nth(0).fill('2');
  await secondFields.nth(1).fill('3');
  await secondFields.nth(2).fill('4');
  await secondFields.nth(3).fill('2');
  if(!(await options.nth(1).innerText()).includes('6 days'))
    throw Error('FIFO alternative conditional completion is incorrect');
  const env=page.getByTestId('environment-method-review');
  await env.locator('summary').click();
  await env.locator('.cy-option-definition').nth(0).locator('input[type=number]').fill('10');
  await env.locator('.cy-option-definition').nth(1).locator('input[type=number]').fill('20');
  await page.locator('.workspace-tabs button').nth(3).click();
  const impact=page.locator('.cy-deep-dive__item--environment');
  await impact.getByText(/Deterministic difference range/).first().waitFor();
  if(!(await impact.innerText()).includes('NOT a confidence interval'))
    throw Error('Environmental margin must be labelled non-statistical in Translate');
  const bottleneck=page.locator('.cy-deep-dive__item--bottleneck');
  if(!(await bottleneck.innerText()).includes('optional FIFO workshop scenario'))
    throw Error('Workshop constraint is absent from Translate');
  await page.locator('.cy-work-files summary').click();
  const [download]=await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button',{name:'Download a copy of my case'}).click()
  ]);
  const folder='/tmp/asri-case-capacity-qa';
  await mkdir(folder,{recursive:true});
  const file=path.join(folder,'case.json');
  await download.saveAs(file);
  const raw=JSON.parse(await readFile(file,'utf-8'));
  if(raw.envelopeVersion!==2||raw.caseData.workshopCapacity.length!==2||
    raw.caseData.environmentalBasis[0]?.relativeUncertaintyPercent!==10||
    raw.caseData.environmentalBasis[1]?.relativeUncertaintyPercent!==20)
    throw Error('New FIFO and inventory margins were not preserved in checksum case JSON');
  if(errors.length)throw Error(errors.join('; '));
  console.log('PASS: FIFO workshop capacity, bounded environmental comparison, Translate and JSON round-trip UI.');
  await context.close();
}finally{await browser.close();}
