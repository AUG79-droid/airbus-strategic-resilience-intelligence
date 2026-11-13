import { chromium } from 'playwright-core';

const baseUrl = process.env.QA_URL ?? 'http://127.0.0.1:4174';
const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--disable-extensions', '--no-first-run'],
});
const checks = [];
const browserErrors = [];

function observe(page, label) {
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource: the server responded with a status of 404')) browserErrors.push(`${label}: ${message.text()}`);
  });
  page.on('pageerror', (error) => browserErrors.push(`${label}: ${error.message}`));
}

const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
observe(page, 'desktop');
await page.goto(`${baseUrl}/#/investigate`, { waitUntil: 'networkidle' });

if ((await page.getByRole('heading', { level: 1 }).innerText()).replace(/\s+/g, ' ').trim() !== 'Sustainability as a driver of strategic resilience.') throw new Error('The approved English strategic narrative title is not rendered.');
await page.getByText('From environmental initiatives to operational advantage and customer value.', { exact: true }).waitFor();
await page.getByText('Explore how sustainability-driven decisions can reduce critical dependencies, strengthen operational continuity and create strategic value for Airbus and its customers. Use practical cases to discover when these benefits materialise and what evidence is needed to demonstrate them.', { exact: true }).waitFor();
checks.push('The approved strategic-resilience narrative is presented verbatim in English');

await page.getByTestId('guide-investigate').getByRole('heading', { name: /fictional decision case/i }).waitFor();
const investigateGuide = await page.getByTestId('guide-investigate').innerText();
for (const required of ['supply problem', 'three alternatives', 'sustainability and resilience', 'purpose of the analysis']) {
  if (!investigateGuide.toLowerCase().includes(required)) throw new Error(`Investigate guide is missing “${required}”.`);
}
checks.push('A first-time visitor sees the fictional case, alternatives, causal purpose and next action');

await page.getByTestId('guide-next-investigate').click();
await page.getByTestId('guide-challenge').waitFor();
if (!page.url().endsWith('#/challenge')) throw new Error('Investigate next action did not open Challenge.');
await page.getByTestId('basic-controls').waitFor();
if (await page.getByTestId('advanced-controls').getAttribute('open') !== null) throw new Error('Advanced controls should initially be collapsed.');
const basicInputs = await page.getByTestId('basic-controls').locator('input').count();
if (basicInputs !== 5) throw new Error(`Expected five basic controls, found ${basicInputs}.`);
await page.getByTestId('preset-select').selectOption('repairWorsens');
await page.getByTestId('outcome-repairFirst').getByText('Potentially worse').waitFor();
await page.getByTestId('risk-repair-feasibility').fill('45');
await page.getByTestId('risk-repair-feasibility').blur();
if (await page.getByTestId('preset-select').inputValue() !== 'custom') throw new Error('Basic input did not update the scenario.');
checks.push('Challenge guides scenario choice and comparison while keeping five basic inputs visible and advanced options collapsed');

await page.getByTestId('guide-next-challenge').click();
await page.getByTestId('guide-validate').waitFor();
if (!page.url().endsWith('#/validate')) throw new Error('Challenge next action did not open Validate.');
const validationGuide = (await page.getByTestId('guide-validate').innerText()).toLowerCase();
for (const required of ['documented fact', 'modelled example', 'unsupported', 'rejected']) {
  if (!validationGuide.includes(required)) throw new Error(`Validate guide is missing evidence state “${required}”.`);
}
checks.push('Validate explains the evidence states, what to inspect and missing validation data');

await page.getByTestId('guide-next-validate').click();
await page.getByTestId('guide-translate').waitFor();
if (!page.url().endsWith('#/translate')) throw new Error('Validate next action did not open Translate.');
const translateGuide = (await page.getByTestId('guide-translate').innerText()).toLowerCase();
if (!translateGuide.includes('choose one strategy and one audience') || !translateGuide.includes('does not mean airbus has demonstrated')) throw new Error('Translate guide does not explain audience choice and claim status.');
checks.push('Translate explains strategy, audience and the boundary between a model result and a demonstrated benefit');

await page.getByTestId('guidance-toggle').click();
if (await page.locator('[data-testid^="guide-"]').count()) throw new Error('Expert mode did not hide the guided journey.');
if (await page.getByTestId('guidance-toggle').getAttribute('aria-pressed') !== 'false') throw new Error('Expert mode toggle state is incorrect.');
await page.reload({ waitUntil: 'networkidle' });
if (await page.locator('[data-testid^="guide-"]').count()) throw new Error('Expert mode did not persist after reload.');
await page.locator('.workspace-tabs button').first().click();
const permanentCase = (await page.locator('.question-grid').innerText()).toLowerCase();
for (const required of ['unavailable aerospace component', 'three alternatives', 'repair and circularity']) {
  if (!permanentCase.includes(required)) throw new Error(`Expert Investigate view is missing “${required}”.`);
}
await page.getByTestId('guidance-toggle').click();
await page.getByTestId('guide-investigate').waitFor();
checks.push('The journey starts enabled, expert mode persists, and the permanent case briefing remains understandable without the guide');

await page.getByRole('button', { name: 'ES', exact: true }).click();
if ((await page.getByRole('heading', { level: 1 }).innerText()).replace(/\s+/g, ' ').trim() !== 'La sostenibilidad como motor de resiliencia estratégica.') throw new Error('The approved Spanish strategic narrative title is not rendered.');
await page.getByText('De las iniciativas ambientales a las ventajas operativas y al valor para el cliente.', { exact: true }).waitFor();
await page.getByText('Explora cómo las decisiones de sostenibilidad pueden reducir dependencias críticas, fortalecer la continuidad operativa y crear valor estratégico para Airbus y sus clientes. Utiliza casos prácticos para descubrir cuándo se producen estos beneficios y qué evidencias necesitamos para demostrarlos.', { exact: true }).waitFor();
await page.getByTestId('guide-investigate').getByRole('heading', { name: /caso ficticio de decisión/i }).waitFor();
await page.getByTestId('guide-next-investigate').getByText('Empezar la comparación').waitFor();
checks.push('The complete orientation and navigation actions are available in Spanish');
await context.close();

const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const mobilePage = await mobileContext.newPage();
observe(mobilePage, 'mobile');
await mobilePage.goto(`${baseUrl}/#/investigate`, { waitUntil: 'networkidle' });
for (const route of ['investigate', 'challenge', 'validate', 'translate']) {
  if (route !== 'investigate') await mobilePage.getByTestId(`guide-next-${route === 'challenge' ? 'investigate' : route === 'validate' ? 'challenge' : 'validate'}`).click();
  await mobilePage.getByTestId(`guide-${route}`).waitFor();
  const widths = await mobilePage.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  if (widths.document > widths.viewport) throw new Error(`Mobile ${route} has horizontal overflow: ${JSON.stringify(widths)}.`);
}
checks.push('All four guided steps work at 390 px without horizontal overflow');
await mobileContext.close();

await browser.close();
if (browserErrors.length) throw new Error(`Browser errors:\n${browserErrors.join('\n')}`);
console.log(JSON.stringify({ baseUrl, checks, browserErrors }, null, 2));
