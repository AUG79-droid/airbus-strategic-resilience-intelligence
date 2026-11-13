import { chromium } from 'playwright-core';

const baseUrl = process.env.TRANSLATOR_URL ?? 'http://127.0.0.1:4174';
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--disable-extensions', '--no-first-run'] });
const checks = [];
const errors = [];

async function open(path, viewport) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource: the server responded with a status of 404')) errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) errors.push(`HTTP ${response.status()} ${response.url()}`);
  });
  await page.goto(`${baseUrl}/#/${path}`, { waitUntil: 'networkidle' });
  return { context, page };
}

const desktop = await open('translate', { width: 1440, height: 900 });
const page = desktop.page;
await page.getByRole('heading', { name: 'Strategic Translator' }).waitFor();
if (await page.locator('.translator-summary').count() !== 1) throw new Error('Translator rendered more than one audience narrative.');
await page.getByTestId('audience-defenceCustomer').getAttribute('aria-pressed').then((value) => { if (value !== 'true') throw new Error('Defence Customer is not the default audience.'); });
await page.locator('.validated-counter strong').getByText('0', { exact: true }).waitFor();
checks.push('Compact translator renders one active audience and zero validated benefits');

for (const strategy of ['new', 'repairFirst', 'parallel']) {
  await page.getByTestId(`strategy-${strategy}`).click();
  if (await page.getByTestId(`strategy-${strategy}`).getAttribute('aria-pressed') !== 'true') throw new Error(`${strategy} was not selected.`);
  if (await page.locator('.translator-profile li').count() < 6) throw new Error(`${strategy} profile is incomplete.`);
}
await page.getByTestId('strategy-new').click();
await page.getByText('Reference strategy', { exact: true }).waitFor();
await page.getByTestId('strategy-parallel').click();
await page.getByTestId('translator-summary').getByText(/Parallel strategy/).first().waitFor();
await page.getByTestId('strategy-repairFirst').click();
checks.push('Replacement, repair-first and parallel are independently selectable with complete profiles');

const combinationNarratives = new Set();
for (const strategy of ['new', 'repairFirst', 'parallel']) {
  await page.getByTestId(`strategy-${strategy}`).click();
  for (const audience of ['defenceCustomer', 'programmeManager', 'engineering', 'executiveLeadership']) {
    await page.getByTestId(`audience-${audience}`).click();
    const comparison = await page.getByTestId('three-way-comparison').innerText();
    if (await page.getByTestId('three-way-comparison').locator('li').count() !== 2) throw new Error(`${strategy}/${audience} does not compare both alternatives.`);
    combinationNarratives.add(`${await page.getByTestId('translator-summary').innerText()}\n${comparison}`);
  }
}
if (combinationNarratives.size !== 12) throw new Error(`Expected 12 distinct strategy/audience translations, found ${combinationNarratives.size}.`);
checks.push('All twelve strategy-audience combinations expose two peer comparisons and an audience-specific decision test');

await page.getByTestId('strategy-repairFirst').click();
await page.getByTestId('audience-defenceCustomer').click();

const defenceSummary = await page.getByTestId('translator-summary').innerText();
await page.getByTestId('audience-programmeManager').click();
const programmeSummary = await page.getByTestId('translator-summary').innerText();
if (defenceSummary === programmeSummary || !programmeSummary.includes('programme gate')) throw new Error('Programme Manager narrative did not adapt.');
await page.getByTestId('audience-engineering').click();
const engineeringSummary = await page.getByTestId('translator-summary').innerText();
if (!engineeringSummary.includes('eligibility')) throw new Error('Engineering narrative did not adapt.');
await page.getByTestId('audience-executiveLeadership').click();
const executiveSummary = await page.getByTestId('translator-summary').innerText();
if (!executiveSummary.includes('option value')) throw new Error('Executive narrative did not adapt.');
checks.push('All four audiences produce distinct decision framing');

await page.getByRole('tab', { name: /Evidence trace/ }).click();
if (await page.locator('[role="tabpanel"]:visible').count() !== 1) throw new Error('More than one translator detail panel is visible.');
await page.getByTestId('trace-TRACE-STRATEGY').locator('summary').click();
await page.getByTestId('trace-TRACE-STRATEGY').getByText(/MODEL-repairFirst-TIME/).waitFor();
await page.getByTestId('trace-TRACE-STRATEGY').getByRole('button', { name: /Inspect evidence/ }).click();
await page.getByRole('heading', { name: 'What supports our decision?' }).waitFor();
if (await page.getByTestId('evidence-focus').inputValue() !== 'strategy:repairFirst') throw new Error('Translator trace did not preserve repair-first evidence focus.');
checks.push('Statement trace opens exact calculations and linked evidence');

await page.locator('.workflow-button').nth(1).click();
await page.getByTestId('preset-select').selectOption('repairWorsens');
await page.locator('.workflow-button').nth(3).click();
await page.getByText('Unfavourable result', { exact: true }).waitFor();
await page.getByTestId('translator-summary').getByText(/Repair first weakens/).waitFor();
await page.getByTestId('translator-summary').getByText(/Do not promote Repair first/).waitFor();
checks.push('Repair-worsens scenario produces an unfavourable narrative and negative recommendation');

await page.getByRole('tab', { name: /Validation plan/ }).click();
await page.getByTestId('audience-engineering').click();
if (await page.locator('.translator-validation li').count() !== 3) throw new Error('Engineering validation plan does not contain three targeted actions.');
await page.locator('.translator-limitations summary').click();
await page.locator('.translator-limitations li').first().waitFor();
checks.push('Audience validation actions and limitations remain available on demand');

await page.getByRole('button', { name: 'ES', exact: true }).click();
await page.getByRole('heading', { name: 'Traductor estratégico' }).waitFor();
await page.getByTestId('audience-programmeManager').click();
await page.getByTestId('translator-summary').getByText(/programa|decisión/i).first().waitFor();
await page.getByRole('tab', { name: /Plan de validación/ }).click();
await page.locator('.translator-validation li').first().waitFor();
checks.push('Spanish localisation covers audiences, conclusions and validation plan');
await desktop.context.close();

const mobile = await open('translate', { width: 390, height: 844 });
const size = await mobile.page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
if (size.scrollWidth > size.width) throw new Error(`Mobile horizontal overflow: ${size.scrollWidth} > ${size.width}`);
await mobile.page.getByTestId('audience-executiveLeadership').click();
await mobile.page.getByTestId('strategy-parallel').click();
await mobile.page.getByRole('tab', { name: /Evidence trace/ }).click();
await mobile.page.getByTestId('trace-TRACE-PUBLIC').locator('summary').click();
checks.push('Mobile audience selection and progressive disclosure work without horizontal overflow');
await mobile.context.close();

await browser.close();
if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`);
console.log(JSON.stringify({ baseUrl, checks, errors }, null, 2));

