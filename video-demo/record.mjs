/**
 * Genuine browser interaction recording, not a recreated animation.
 * This code runs only on a GitHub-hosted runner. It never edits the app.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'output');
const manifest = JSON.parse(await fs.readFile(path.join(out, 'timeline.json'), 'utf8'));
const appUrl = process.env.ASRI_DEMO_URL ||
  'https://aug79-droid.github.io/airbus-strategic-resilience-intelligence/#/investigate';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function clickVisible(locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.hover();
  await delay(450);
  await locator.click();
  await delay(300);
}

await fs.mkdir(out, {recursive: true});
const errors = [];
const browser = await chromium.launch({headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']});
const context = await browser.newContext({
  viewport: {width: 1920, height: 1080},
  screen: {width: 1920, height: 1080},
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
  recordVideo: {dir: out, size: {width: 1920, height: 1080}},
});

// Overlay a visible pointer in the RECORDING BROWSER ONLY.
await context.addInitScript(() => {
  const createCursor = () => {
    if (document.getElementById('__asri_video_cursor')) return;
    const arrow = document.createElement('div');
    arrow.id = '__asri_video_cursor';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:38px;height:45px;transform:translate(1100px,90px);transition:transform .18s ease-out;filter:drop-shadow(0px 2px 3px #0007)';
    arrow.innerHTML = '<svg width="38" height="45" viewBox="0 0 38 45" xmlns="http://www.w3.org/2000/svg"><path d="M4 3V34L12 26L18 40L24 37L17 23H31Z" fill="#fff" stroke="#143929" stroke-width="2.3"/><circle id="__asri_click_ring" cx="5" cy="5" r="0" fill="none" stroke="#ef5b3d" stroke-width="3"/></svg>';
    document.body.appendChild(arrow);
    const ring = arrow.querySelector('#__asri_click_ring');
    document.addEventListener('pointermove', event => {
      arrow.style.transform = 'translate(' + event.clientX + 'px,' + event.clientY + 'px)';
    }, true);
    document.addEventListener('pointerdown', () => {
      ring.setAttribute('r','18');
      ring.setAttribute('opacity','1');
      setTimeout(() => {ring.setAttribute('r','0');ring.setAttribute('opacity','0');}, 330);
    }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createCursor);
  else createCursor();
});

let page;
try {
  page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(appUrl, {waitUntil: 'domcontentloaded', timeout: 45000});
  await page.locator('[data-testid="start-comparison"]').waitFor({timeout: 25000});
  const english = page.locator('.language-switch button').filter({hasText: 'EN'});
  if ((await english.getAttribute('aria-pressed')) !== 'true') await english.click();
  await page.locator('#case-start-title').scrollIntoViewIfNeeded();
  await page.screenshot({path: path.join(out, 'scene-start.png')});

  const actions = {
    introduction: async () => {
      await page.locator('#case-start-title').scrollIntoViewIfNeeded();
    },
    choose_repair: async () => {
      await clickVisible(page.getByTestId('start-comparison'));
      await page.getByTestId('decision-choice-repairFirst').waitFor({timeout: 12000});
      await clickVisible(page.getByTestId('decision-choice-repairFirst'));
      await page.getByTestId('decision-feedback').waitFor({timeout: 12000});
      const metric = await page.locator('.decision-desk__metrics strong').first().innerText();
      if (!metric.includes('50')) throw new Error('Unexpected baseline recovery: ' + metric);
      await page.locator('.decision-desk__metrics').scrollIntoViewIfNeeded();
      console.log('Verified starting recovery:', metric);
    },
    inspect: async () => {
      await clickVisible(page.getByTestId('open-technical'));
      await page.locator('.lab-analysis-tabs').waitFor({timeout: 12000});
      await page.locator('.lab-analysis-tabs').scrollIntoViewIfNeeded();
    },
    modify: async () => {
      await clickVisible(page.getByTestId('change-conditions'));
      const input = page.getByTestId('risk-repair-feasibility');
      await input.waitFor({timeout: 12000});
      await input.scrollIntoViewIfNeeded();
      await input.hover();
      await delay(350);
      await input.fill('90');
      await input.press('Tab');
      await page.waitForFunction(() => Array.from(document.querySelectorAll('.lab-conditions-live dd')).some(item => item.textContent && item.textContent.includes('36.8')), null, {timeout: 12000});
      const metric = await page.locator('.lab-conditions-live dd').first().innerText();
      console.log('Verified increased feasibility:', metric);
      await page.locator('.lab-conditions-live h3').scrollIntoViewIfNeeded();
      await page.screenshot({path: path.join(out, 'scene-change.png')});
    },
    explain: async () => {
      const summary = page.locator('[data-testid="condition-formula"] summary');
      await summary.waitFor({timeout: 10000});
      await clickVisible(summary);
      await page.locator('[data-testid="condition-formula"] table').scrollIntoViewIfNeeded();
    },
  };

  // Lead time is narrated silence, followed by per-scene voice+pause holds.
  await delay(manifest.lead_seconds * 1000);
  const startedAt = Date.now();
  for (const scene of manifest.scenes) {
    const action = actions[scene.id];
    if (!action) throw new Error('No action for scene ' + scene.id);
    console.log('Recording:', scene.id);
    const begun = Date.now();
    await action();
    const wait = scene.hold_seconds * 1000 - (Date.now() - begun);
    if (wait < -1000) throw new Error('Scene too slow: ' + scene.id + ' (' + Math.round(-wait) + ' ms over)');
    await delay(Math.max(0, wait));
  }
  await delay(manifest.tail_seconds * 1000);
  const duration = (Date.now() - startedAt) / 1000 + manifest.lead_seconds;
  await fs.writeFile(path.join(out, 'recording-timing.json'), JSON.stringify({
    target_seconds: manifest.duration_seconds,
    browser_seconds: Number(duration.toFixed(2)),
    url: appUrl,
    verified: ['50 days at 75%', '36.8 days at 90%'],
    page_errors: errors,
  }, null, 2));
  if (errors.some(x => /Uncaught|TypeError|ReferenceError/i.test(x))) throw new Error('Browser errors: ' + errors.join('; '));
  console.log('Browser demonstration completed:', duration, 'seconds');
} finally {
  const video = page && page.video();
  await context.close();
  if (video) {
    const rawPath = await video.path();
    const finalPath = path.join(out, 'browser.webm');
    if (rawPath !== finalPath) await fs.copyFile(rawPath, finalPath);
    console.log('Recorded:', finalPath);
  }
  await browser.close();
}
