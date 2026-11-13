import { chromium } from 'playwright-core';

const baseUrl = process.env.QA_URL ?? 'http://127.0.0.1:4174';
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--disable-extensions', '--no-first-run'] });
const errors = [];
const checks = [];
const routes = ['investigate', 'challenge', 'validate', 'translate'];
const viewports = [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }];

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('Failed to load resource: the server responded with a status of 404')) errors.push(`${viewport.name}: ${message.text()}`); });
  page.on('pageerror', (error) => errors.push(`${viewport.name}: ${error.message}`));
  for (const route of routes) {
    await page.goto(`${baseUrl}/#/${route}`, { waitUntil: 'networkidle' });
    const metrics = await page.evaluate(() => ({ innerWidth, scrollWidth: document.documentElement.scrollWidth, bodyWidth: document.body.getBoundingClientRect().width, emptyTallPanels: [...document.querySelectorAll('main section, main article')].filter((element) => { const rect = element.getBoundingClientRect(); return rect.height > 700 && (element.textContent?.trim().length ?? 0) < 80; }).length }));
    if (metrics.scrollWidth > metrics.innerWidth || metrics.bodyWidth > metrics.innerWidth + 1) throw new Error(`${viewport.name}/${route} horizontal overflow: ${JSON.stringify(metrics)}`);
    if (metrics.emptyTallPanels) throw new Error(`${viewport.name}/${route} contains a tall empty panel.`);
    const active = await page.locator('.workflow-button[aria-current="page"]').count();
    if (active !== 1) throw new Error(`${viewport.name}/${route} has ${active} active navigation entries.`);
  }
  await page.goto(`${baseUrl}/#/investigate`, { waitUntil: 'networkidle' });
  for (const index of [1, 2, 3, 0]) await page.locator('.workflow-button').nth(index).click();
  await page.getByRole('button', { name: 'ES', exact: true }).click();
  if (await page.locator('html').getAttribute('lang') !== 'es') throw new Error(`${viewport.name}: language did not switch to Spanish.`);
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  checks.push(`${viewport.name}: four routes, navigation and EN/ES passed without overflow or empty tall panels`);
  await context.close();
}

await browser.close();
if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`);
console.log(JSON.stringify({ baseUrl, checks, errors }, null, 2));
