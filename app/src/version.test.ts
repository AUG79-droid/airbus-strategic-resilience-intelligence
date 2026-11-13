import {describe,expect,it} from 'vitest';
import packageJson from '../package.json';
import lockJson from '../package-lock.json';
import {APP_VERSION} from './version';
import {MODEL_VERSION} from './features/export/types';
import {MODEL_PROVENANCE} from './features/cases/modelProvenance';
import {copy} from './content/i18n';
describe('One application version across UI, domain, package and export',()=>{
 it('fails if package, lockfile or exported model version become inconsistent',()=>{
  expect(packageJson.version).toBe(lockJson.version);
  expect(packageJson.version).toBe(lockJson.packages[''].version);
  expect(APP_VERSION).toBe(packageJson.version);
  expect(MODEL_VERSION).toBe(packageJson.version);
  expect(MODEL_PROVENANCE.demo.version).toBe(packageJson.version);
  expect(copy.en.phaseLabel).toContain(packageJson.version);
  expect(copy.es.phaseLabel).toContain(packageJson.version);
 });
});
