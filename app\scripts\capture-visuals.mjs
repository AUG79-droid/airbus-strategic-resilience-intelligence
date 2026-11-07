import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const appDirectory = path.resolve(scriptDirectory, '..');
const workspaceDirectory = path.resolve(appDirectory, '..');
const outputDirectory = path.join(workspaceDirectory, 'artifacts', 'screenshots');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const expectedReferenceHash = 'CB1544F7B2866F19E8D729646B1AC22A122E72CCCB5E0C753EFEFC8DEF872D7F';

const viewports = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
];

await mkdir(outputDirectory, { recursive: true });

const referenceBytes = await readFile(path.join(workspaceDirectory, 'index.html'));
const referenceHash = createHash('sha256').update(referenceBytes).digest('hex').toUpperCase();
if (referenceHash !== expectedReferenceHash) {
  throw new Error(`Approved index.html changed: ${referenceHash}`);
}

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--disable-extensions', '--no-first-run'],
});

const report = {
  referenceHash,
  captures: [],
  interactionChecks: [],
  consoleErrors: [],
};

async function capturePage({ name, url, viewport }) {
  const context = await browser.newContext({
    viewport,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !message.text().includes('Failed to load resource: the server responded with a status of 404')
    ) {
      report.consoleErrors.push(`${name}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => report.consoleErrors.push(`${name}: ${error.message}`));
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
      report.consoleErrors.push(`${name}: HTTP ${response.status()} ${response.url()}`);
    }
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    title: document.title,
    lang: document.documentElement.lang,
  }));
  if (metrics.scrollWidth > metrics.innerWidth) {
    throw new Error(`${name} overflows horizontally: ${metrics.scrollWidth}px > ${metrics.innerWidth}px`);
  }
  const file = path.join(outputDirectory, `${name}-${viewport.width}x${viewport.height}.png`);
  await page.screenshot({ path: file, fullPage: false });
  report.captures.push({ name, viewport, file, metrics });
  await context.close();
}

for (const viewport of viewports) {
  await capturePage({ name: 'reference', url: 'http://127.0.0.1:4174/', viewport });
  await capturePage({ name: 'phase1', url: 'http://127.0.0.1:4173/#/investigate', viewport });
}

const interactionContext = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
});
const interactionPage = await interactionContext.newPage();
interactionPage.on('console', (message) => {
  if (
    message.type() === 'error' &&
    !message.text().includes('Failed to load resource: the server responded with a status of 404')
  ) {
    report.consoleErrors.push(`interaction: ${message.text()}`);
  }
});
interactionPage.on('pageerror', (error) => report.consoleErrors.push(`interaction: ${error.message}`));
interactionPage.on('response', (response) => {
  if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
    report.consoleErrors.push(`interaction: HTTP ${response.status()} ${response.url()}`);
  }
});
await interactionPage.goto('http://127.0.0.1:4173/#/investigate', { waitUntil: 'networkidle' });

for (const [label, hash] of [
  ['Challenge', '#/challenge'],
  ['Validate', '#/validate'],
  ['Translate', '#/translate'],
  ['Investigate', '#/investigate'],
]) {
  await interactionPage.getByRole('button', { name: new RegExp(`^\\d{2} ${label}$`) }).click();
  if (!interactionPage.url().endsWith(hash)) throw new Error(`${label} route did not update to ${hash}`);
  report.interactionChecks.push(`${label} navigation: pass`);
}

await interactionPage.getByRole('button', { name: 'ES', exact: true }).click();
const spanishState = await interactionPage.evaluate(() => ({
  lang: document.documentElement.lang,
  heading: document.querySelector('h1')?.textContent?.replace(/\\s+/g, ' ').trim(),
}));
if (spanishState.lang !== 'es' || !spanishState.heading?.includes('Sostenibilidad')) {
  throw new Error('Spanish localisation did not become active');
}
report.interactionChecks.push('Spanish localisation: pass');

await interactionPage.getByRole('button', { name: 'EN', exact: true }).click();
const englishState = await interactionPage.evaluate(() => ({
  lang: document.documentElement.lang,
  heading: document.querySelector('h1')?.textContent?.replace(/\\s+/g, ' ').trim(),
}));
if (englishState.lang !== 'en' || !englishState.heading?.includes('Sustainability')) {
  throw new Error('English localisation did not become active');
}
report.interactionChecks.push('English localisation: pass');

const keyboardChallenge = interactionPage.getByRole('button', { name: /^02 Challenge$/ });
await keyboardChallenge.focus();
await interactionPage.keyboard.press('Enter');
if (!interactionPage.url().endsWith('#/challenge')) {
  throw new Error('Keyboard navigation did not activate the Challenge route');
}
report.interactionChecks.push('Keyboard workflow navigation: pass');

const keyboardSpanish = interactionPage.getByRole('button', { name: 'ES', exact: true });
await keyboardSpanish.focus();
await interactionPage.keyboard.press('Enter');
if ((await interactionPage.locator('html').getAttribute('lang')) !== 'es') {
  throw new Error('Keyboard language activation did not switch to Spanish');
}
report.interactionChecks.push('Keyboard language activation: pass');
await interactionContext.close();

async function makeComparison(viewport) {
  const context = await browser.newContext({
    viewport: viewport.width === 390 ? { width: 920, height: 940 } : { width: 1800, height: 700 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const reference = await readFile(path.join(outputDirectory, `reference-${viewport.width}x${viewport.height}.png`));
  const phase1 = await readFile(path.join(outputDirectory, `phase1-${viewport.width}x${viewport.height}.png`));
  const referenceUrl = `data:image/png;base64,${reference.toString('base64')}`;
  const phase1Url = `data:image/png;base64,${phase1.toString('base64')}`;
  const mobile = viewport.width === 390;
  const imageWidth = mobile ? 390 : 850;
  await page.setContent(`
    <!doctype html>
    <html><head><style>
      *{box-sizing:border-box}body{margin:0;background:#19201f;color:#fffefa;font-family:Arial,sans-serif}
      header{height:70px;display:flex;align-items:center;justify-content:space-between;padding:0 30px;border-bottom:1px solid #45514c}
      header strong{font-size:17px;letter-spacing:.08em}header span{font-size:11px;color:#c3ef76;letter-spacing:.12em}
      main{display:flex;gap:20px;padding:20px;align-items:flex-start}
      figure{margin:0;width:${imageWidth}px;background:#f1f1eb;border:1px solid #4b5752}
      figcaption{height:38px;padding:11px 13px;background:#fffefa;color:#19201f;font-size:10px;font-weight:900;letter-spacing:.12em}
      img{display:block;width:100%;height:auto}
    </style></head><body>
      <header><strong>RI / PHASE 1 VISUAL COMPARISON</strong><span>${viewport.width} × ${viewport.height}</span></header>
      <main>
        <figure><figcaption>APPROVED REFERENCE</figcaption><img src="${referenceUrl}" /></figure>
        <figure><figcaption>REACT / TYPESCRIPT FOUNDATION</figcaption><img src="${phase1Url}" /></figure>
      </main>
    </body></html>
  `, { waitUntil: 'load' });
  await page.screenshot({
    path: path.join(outputDirectory, `comparison-${viewport.width}x${viewport.height}.png`),
    fullPage: false,
  });
  await context.close();
}

for (const viewport of viewports) await makeComparison(viewport);

await browser.close();

if (report.consoleErrors.length > 0) {
  throw new Error(`Console errors detected:\n${report.consoleErrors.join('\n')}`);
}

await writeFile(
  path.join(workspaceDirectory, 'artifacts', 'phase1-qa-report.json'),
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8',
);

console.log(JSON.stringify(report, null, 2));
