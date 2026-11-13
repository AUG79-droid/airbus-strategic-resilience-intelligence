import { chromium } from 'playwright-core';

const baseUrl = process.env.LAB_URL ?? 'http://127.0.0.1:4174';
const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--disable-extensions', '--no-first-run'],
});

const errors = [];
const checks = [];

async function openLab(viewport) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource: the server responded with a status of 404')) errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) errors.push(`HTTP ${response.status()} ${response.url()}`);
  });
  await page.goto(`${baseUrl}/#/challenge`, { waitUntil: 'networkidle' });
  return { context, page };
}

const desktop = await openLab({ width: 1440, height: 900 });
const page = desktop.page;
await page.getByRole('heading', { name: 'Counterfactual laboratory' }).waitFor();
await page.getByTestId('preset-select').selectOption('repairWorsens');
await page.getByTestId('outcome-repairFirst').getByText('Potentially worse').waitFor();
checks.push('Negative repair-resilience preset returns “Potentially worse”');

const repairCardBefore = await page.getByTestId('strategy-repairFirst').innerText();
await page.getByTestId('risk-repair-feasibility').fill('10');
await page.getByTestId('risk-repair-feasibility').blur();
const repairCardAfter = await page.getByTestId('strategy-repairFirst').innerText();
if (repairCardAfter === repairCardBefore) throw new Error('Editing repair feasibility did not update the repair result.');
if (await page.getByTestId('preset-select').inputValue() !== 'custom') {
  throw new Error('Edited scenario was not marked as custom.');
}
checks.push('Editable probability recomputes results and marks scenario custom');

await page.getByTestId('sensitivity-variable').selectOption('newLeadDays');
await page.getByTestId('sensitivity-metric').selectOption('expectedCashOutlay');
await page.getByRole('img', { name: /Sensitivity analysis/ }).waitFor();
checks.push('Sensitivity variable and metric are interactive');

await page.locator('summary').filter({ hasText: 'Environmental factors' }).click();
await page.getByTestId('environment-toggle').check();
await page.getByTestId('indicator-boundedGhgDeltaKgCo2e').getByText('Modelled example').waitFor();
checks.push('Fictional environmental factors change bounded GHG from unquantified to modelled');

await page.getByRole('button', { name: 'ES', exact: true }).click();
await page.getByRole('heading', { name: 'Laboratorio contrafactual' }).waitFor();
await page.getByText('EJEMPLO MODELIZADO · DATOS FICTICIOS · NO SON DATOS DE PROGRAMAS AIRBUS').waitFor();
checks.push('Spanish localisation covers laboratory and methodological warning');
await desktop.context.close();

const mobile = await openLab({ width: 390, height: 844 });
const dimensions = await mobile.page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
if (dimensions.scrollWidth > dimensions.width) throw new Error(`Mobile horizontal overflow: ${dimensions.scrollWidth} > ${dimensions.width}`);
await mobile.page.getByTestId('preset-select').selectOption('supplierShock');
await mobile.page.getByTestId('strategy-parallel').waitFor();
checks.push('Mobile layout remains operable without page-level horizontal overflow');
await mobile.context.close();

await browser.close();
if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`);
console.log(JSON.stringify({ baseUrl, checks, errors }, null, 2));

