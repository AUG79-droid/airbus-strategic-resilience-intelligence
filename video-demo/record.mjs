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
    welcome: async () => page.locator('#case-start-title').scrollIntoViewIfNeeded(),
    case: async () => page.locator('.case-start__facts').scrollIntoViewIfNeeded(),
    purpose: async () => page.locator('.case-start__decision').scrollIntoViewIfNeeded(),

    // Each visual action begins with the EXACT sentence that mentions it.
    enter_challenge: async () => clickVisible(page.getByTestId('start-comparison')),
    select_repair: async () => {
      await page.getByTestId('decision-choice-repairFirst').waitFor({timeout: 12000});
      await clickVisible(page.getByTestId('decision-choice-repairFirst'));
    },
    baseline: async () => {
      await page.getByTestId('decision-feedback').waitFor({timeout: 12000});
      const metric = await page.locator('.decision-desk__metrics strong').first().innerText();
      if (!metric.includes('50')) throw new Error('Unexpected baseline recovery: ' + metric);
      await page.locator('.decision-desk__metrics').scrollIntoViewIfNeeded();
      console.log('Verified starting recovery:', metric);
    },
    baseline_explain: async () => page.getByTestId('recovery-time-explanation').scrollIntoViewIfNeeded(),

    open_analysis: async () => {
      await clickVisible(page.getByTestId('open-technical'));
      await page.locator('.lab-analysis-tabs').waitFor({timeout: 12000});
      await page.locator('.lab-analysis-tabs').scrollIntoViewIfNeeded();
    },
    compare: async () => page.locator('.lab-analysis-tabs').scrollIntoViewIfNeeded(),
    assumptions: async () => page.locator('.lab-analysis-tabs').scrollIntoViewIfNeeded(),

    open_conditions: async () => {
      await clickVisible(page.getByTestId('change-conditions'));
      await page.getByTestId('risk-repair-feasibility').waitFor({timeout: 12000});
    },
    change_feasibility: async () => {
      const input = page.getByTestId('risk-repair-feasibility');
      await input.scrollIntoViewIfNeeded();
      await input.hover();
      await delay(350);
      await input.fill('90');
      await input.press('Tab');
    },
    new_result: async () => {
      await page.waitForFunction(
        () => Array.from(document.querySelectorAll('.lab-conditions-live dd'))
          .some(item => item.textContent && item.textContent.includes('36.8')),
        null, {timeout: 12000}
      );
      const metric = await page.locator('.lab-conditions-live dd').first().innerText();
      console.log('Verified increased feasibility:', metric);
      await page.locator('.lab-conditions-live h3').scrollIntoViewIfNeeded();
      await page.screenshot({path: path.join(out, 'scene-change.png')});
    },
    open_breakdown: async () => {
      const summary = page.locator('[data-testid="condition-formula"] summary');
      await summary.waitFor({timeout: 10000});
      await clickVisible(summary);
      await page.locator('[data-testid="condition-formula"] table').scrollIntoViewIfNeeded();
    },
    fictional: async () => page.locator('[data-testid="condition-formula"] table').scrollIntoViewIfNeeded(),
    conclusion: async () => {},
  };

  // A short colour marker identifies the actual point where narration begins.
  // It is removed BEFORE the first exported video frame. FFmpeg detects the
  // marker edge instead of guessing pre-roll from the length of the video.
  await page.evaluate(() => {
    const sync = document.createElement('div');
    sync.id = '__asri_video_sync';
    sync.style.cssText = 'position:fixed;top:0;left:0;width:96px;height:96px;background:#ff00ff;z-index:2147483647;pointer-events:none';
    document.body.appendChild(sync);
  });
  await delay(850); // many frames, not a one-frame flash
  await page.evaluate(() => document.getElementById('__asri_video_sync')?.remove());

  const startedAt = Date.now();
  await delay(manifest.lead_seconds * 1000);
  const cueTimings = [];
  for (const scene of manifest.scenes) {
    for (const cue of scene.cues) {
      const action = actions[cue.id];
      if (!action) throw new Error('No action defined for cue ' + cue.id);
      console.log('Recording synchronized cue:', scene.id, cue.id);
      const intendedStart = cue.start_seconds * 1000;
      const actualStart = Date.now() - startedAt;
      const drift = actualStart - intendedStart;
      if (Math.abs(drift) > 500) throw new Error('Audio/video drift before ' + cue.id + ': ' + Math.round(drift) + 'ms');
      const begun = Date.now();
      await action();
      const elapsed = Date.now() - begun;
      const remaining = cue.hold_seconds * 1000 - elapsed;
      if (remaining < -200) throw new Error('Action exceeds its spoken cue: ' + cue.id + ' by ' + Math.round(-remaining) + 'ms');
      await delay(Math.max(0, remaining));
      cueTimings.push({cue: cue.id, start_ms: Math.round(actualStart), drift_ms: Math.round(drift), action_ms: elapsed});
    }
  }
  await delay(manifest.tail_seconds * 1000);
  const duration = (Date.now() - startedAt) / 1000;
  await fs.writeFile(path.join(out, 'recording-timing.json'), JSON.stringify({
    target_seconds: manifest.duration_seconds,
    browser_seconds: Number(duration.toFixed(2)),
    synchronization: 'Frame-level magenta marker removed at narration zero',
    cue_timings: cueTimings,
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
