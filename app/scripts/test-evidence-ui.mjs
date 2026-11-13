import { chromium } from 'playwright-core';

const baseUrl = process.env.EVIDENCE_URL ?? 'http://127.0.0.1:4174';
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--disable-extensions', '--no-first-run'] });
const checks = [];
const errors = [];

async function pageAt(path, viewport) {
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

const desktop = await pageAt('challenge', { width: 1440, height: 900 });
await desktop.page.getByTestId('strategy-repairFirst').getByRole('button', { name: /Inspect evidence/ }).click();
await desktop.page.getByRole('heading', { name: 'Evidence & claim control' }).waitFor();
if (!desktop.page.url().endsWith('#/validate')) throw new Error('Result trace did not navigate to Validate.');
if (await desktop.page.getByTestId('evidence-focus').inputValue() !== 'strategy:repairFirst') throw new Error('Repair-result evidence focus was not preserved.');
checks.push('Laboratory result opens a strategy-filtered evidence register');

await desktop.page.getByTestId('evidence-EVD-SERVICE-OFFERING').waitFor();
await desktop.page.getByTestId('evidence-MODEL-RESILIENCE').waitFor();
await desktop.page.getByTestId('evidence-MODEL-RESILIENCE').click();
await desktop.page.locator('.selected-evidence').getByRole('heading', { name: 'Counterfactual recovery result' }).waitFor();
checks.push('Filtered register combines public fact, hypothesis and live model trace');
const compactDimensions = await desktop.page.evaluate(() => ({ height: document.documentElement.scrollHeight, visiblePanels: [...document.querySelectorAll('[role="tabpanel"]')].filter((element) => getComputedStyle(element).display !== 'none').length }));
if (compactDimensions.visiblePanels !== 1 || compactDimensions.height > 3000) throw new Error(`Validate is not compact: ${JSON.stringify(compactDimensions)}`);
checks.push('Only one compact internal panel is rendered at a time');

await desktop.page.getByRole('tab', { name: /Claim Gates/ }).click();
await desktop.page.getByTestId('claim-serviceContext').getByText('Allowed as context').waitFor();
await desktop.page.getByTestId('claim-operationalBenefit').getByText('Blocked').waitFor();
await desktop.page.getByTestId('claim-operationalBenefit').click();
await desktop.page.locator('.selected-claim').getByText('Gate rationale').waitFor();
await desktop.page.getByRole('tabpanel', { name: 'Claim Gates' }).getByText('0 validated case-specific benefit claims', { exact: true }).waitFor();
checks.push('Claim gate allows narrow context but blocks case-specific benefit claims');

await desktop.page.getByRole('tab', { name: /Source Library/ }).click();
await desktop.page.getByTestId('source-AIRBUS-MMS-01').locator('summary').click();
await desktop.page.getByTestId('source-AIRBUS-MMS-01').getByRole('link', { name: /Open public source/ }).waitFor();
const publicLinks = await desktop.page.locator('.source-accordion a').evaluateAll((links) => links.map((link) => link.href));
if (publicLinks.length !== 4 || publicLinks.some((url) => !url.startsWith('https://www.airbus.com/') && !url.startsWith('https://www.easa.europa.eu/'))) throw new Error('Public source library contains an unexpected URL.');
checks.push('Four reviewed Airbus/EASA public-source links are exposed');

await desktop.page.getByRole('tab', { name: /Validation Requests/ }).click();
await desktop.page.getByRole('tab', { name: /^Programmes/ }).click();
await desktop.page.locator('.selected-owner-requests').getByRole('heading', { name: 'Programmes' }).waitFor();
if (await desktop.page.locator('.selected-owner-requests li').count() === 0) throw new Error('Programme validation requests were not shown.');
checks.push('Validation requests show only the selected owner');

await desktop.page.goto(`${baseUrl}/#/challenge`, { waitUntil: 'networkidle' });
await desktop.page.locator('.causal-chain section').nth(2).getByRole('button', { name: /Trace this causal stage/ }).click();
if (await desktop.page.getByTestId('evidence-focus').inputValue() !== 'stage:strategicVulnerability') throw new Error('Causal-stage focus was not preserved.');
await desktop.page.getByTestId('evidence-HYP-SUPPLY-VULNERABILITY').waitFor();
checks.push('Causal-chain stage opens its linked hypotheses and limitations');

await desktop.page.goto(`${baseUrl}/#/challenge`, { waitUntil: 'networkidle' });
await desktop.page.getByTestId('preset-select').selectOption('repairWorsens');
await desktop.page.getByTestId('strategy-repairFirst').getByRole('button', { name: /Inspect evidence/ }).click();
await desktop.page.getByRole('tab', { name: /Claim Gates/ }).click();
await desktop.page.getByTestId('claim-operationalBenefit').getByText('Rejected').waitFor();
await desktop.page.getByTestId('claim-strategicResilience').getByText('Rejected').waitFor();
checks.push('Adverse repair scenario changes operational and resilience claims from blocked to rejected');

await desktop.page.getByRole('button', { name: 'ES', exact: true }).click();
await desktop.page.getByRole('heading', { name: 'Evidencias y control de afirmaciones' }).waitFor();
await desktop.page.getByText('SOLO FUENTES PÚBLICAS · SIN DOCUMENTACIÓN INTERNA DE AIRBUS').waitFor();
checks.push('Evidence register and gate are localised in Spanish');
await desktop.context.close();

const mobile = await pageAt('validate', { width: 390, height: 844 });
const size = await mobile.page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
if (size.scrollWidth > size.width) throw new Error(`Mobile horizontal overflow: ${size.scrollWidth} > ${size.width}`);
await mobile.page.getByTestId('evidence-focus').selectOption('stage:environmentalMechanism');
await mobile.page.getByTestId('evidence-EVD-CIRCULARITY').waitFor();
await mobile.page.getByTestId('evidence-EVD-CIRCULARITY').click();
await mobile.page.getByRole('tab', { name: /Source Library/ }).click();
await mobile.page.getByTestId('source-AIRBUS-CIRC-01').locator('summary').click();
checks.push('Mobile evidence filtering works without page-level horizontal overflow');
await mobile.context.close();

await browser.close();
if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`);
console.log(JSON.stringify({ baseUrl, checks, errors }, null, 2));

