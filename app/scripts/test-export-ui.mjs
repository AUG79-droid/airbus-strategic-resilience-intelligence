import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const baseUrl = process.env.EXPORT_URL ?? 'http://127.0.0.1:4174';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const pdfDirectory = path.join(root, 'output', 'pdf');
const jsonDirectory = path.join(root, 'output', 'json');
await mkdir(pdfDirectory, { recursive: true });
await mkdir(jsonDirectory, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--disable-extensions', '--no-first-run'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('Failed to load resource: the server responded with a status of 404')) errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));
await page.goto(`${baseUrl}/#/translate`, { waitUntil: 'networkidle' });
await page.getByTestId('strategy-parallel').click();
await page.getByTestId('audience-programmeManager').click();
await page.getByTestId('open-export-review').click();
await page.locator('.export-review__panel > header').getByText('PROTOTYPE — NOT INTERNALLY VALIDATED', { exact: true }).waitFor();
if (!(await page.getByTestId('download-pdf').isDisabled()) || !(await page.getByTestId('download-json').isDisabled())) throw new Error('Exports were enabled before confirmation.');
await page.getByTestId('export-confirm').check();
if (await page.locator('.export-review__checks .is-fail').count()) throw new Error('A pre-export safety check failed.');

const [jsonDownload] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-json').click()]);
const jsonPath = path.join(jsonDirectory, 'phase6-qa-package.json');
await jsonDownload.saveAs(jsonPath);
const data = JSON.parse(await readFile(jsonPath, 'utf8'));
if (data.modelVersion !== '0.6.0-phase-6' || data.selection.strategy !== 'parallel' || data.selection.audience !== 'programmeManager') throw new Error('JSON context or model version is incorrect.');
if (data.exportPolicy.validatedBenefits.length !== 0 || !data.scenarioInputs || !data.scenarioResults || data.evidence.claimGates.length !== 5) throw new Error('JSON reproducibility or claim gate payload is incomplete.');

const [pdfDownload] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-pdf').click()]);
const pdfPath = path.join(pdfDirectory, 'phase6-qa-corrected.pdf');
await pdfDownload.saveAs(pdfPath);
const pdfBytes = await readFile(pdfPath);
if (pdfBytes.subarray(0, 5).toString() !== '%PDF-' || pdfBytes.length < 8_000) throw new Error(`Invalid PDF output (${pdfBytes.length} bytes).`);

await page.getByRole('button', { name: 'ES', exact: true }).click();
await page.getByText('Revisar y exportar').waitFor();
if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`);
await browser.close();
console.log(JSON.stringify({ baseUrl, checks: ['Review gate blocks premature export', 'JSON is reproducible and retains evidence states', 'PDF download is valid', 'Export controls localise to Spanish'], jsonPath, pdfPath, pdfBytes: pdfBytes.length }, null, 2));
