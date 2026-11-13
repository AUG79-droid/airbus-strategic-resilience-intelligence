import {describe,expect,it} from 'vitest';
import {createCase,validateCaseImport} from './model';
import {fromPreset} from './presets';

describe('Versioned case import and provenance integrity',()=>{
 it('upgrades legacy case revision and keeps the correct three alternative IDs',()=>{
   const c=fromPreset('ecodesign');
   delete c.caseSchemaVersion;
   const imported=validateCaseImport(c);
   expect(imported.caseSchemaVersion).toBe(2);
   expect(imported.options.map(o=>o.id)).toEqual(['baseline','option-a','option-b']);
 });
 it('rejects unsupported schema revisions and tampered reference scenario IDs',()=>{
   const c=createCase();
   const bad=structuredClone(c) as unknown as {caseSchemaVersion?:number};
   bad.caseSchemaVersion=3;
   expect(()=>validateCaseImport(bad)).toThrow(/Unsupported case/);
   const invalidId=structuredClone(c);
   invalidId.options[0].id='different';
   expect(()=>validateCaseImport(invalidId)).toThrow(/scenario IDs/);
 });
 it('requires evidence references to resolve to actual records, not fabricated names',()=>{
   const c=createCase();
   c.options[0].parameterValues.baseRecovery.evidenceId='DOCUMENT-THAT-DOES-NOT-EXIST';
   expect(()=>validateCaseImport(c)).toThrow(/Unresolved evidence references/);
   c.options[0].parameterValues.baseRecovery.evidenceId='';
   c.dependencyRoutes=[{id:'ROUTE-A',optionId:'baseline',label:'route',dependencies:['supplier-one'],
     capacityPercent:50,qualified:true,evidenceId:'NO-SOURCE'}];
   expect(()=>validateCaseImport(c)).toThrow(/Unresolved evidence references/);
 });
});
