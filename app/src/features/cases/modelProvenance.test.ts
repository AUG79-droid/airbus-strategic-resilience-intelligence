import {describe,expect,it} from 'vitest';
import {MODEL_PROVENANCE,modelCompatibility} from './modelProvenance';
import {jointRiskBranches} from './universal';
import {buildRiskTable} from '../../domain/model/probability';
describe('ASRI model versioning and shared probability semantics',()=>{
 it('identifies distinct scopes; refuses cross-mode numerical equivalence',()=>{
  expect(MODEL_PROVENANCE.demo.id).not.toBe(MODEL_PROVENANCE.custom.id);
  expect(modelCompatibility('demo','custom')).toBe('not-directly-comparable');
  expect(modelCompatibility('custom','custom')).toBe('same-mode');
 });
 it('uses the same validated joint-risk kernel under both model modes',()=>{
  const option=jointRiskBranches(70,40,15);
  const base=buildRiskTable({
   repairFeasibilityProbability:.70,supplierShockProbability:.40,
   dependence:{mode:'joint',repairFeasibleAndShockProbability:.25}
  });
  for(const state of option){
   const match=base.states.find(x=>x.repairFeasible===state.technicalSuccess&&x.supplierShock===state.shock);
   expect(state.probability).toBeCloseTo(match!.probability);
  }
 });
});
