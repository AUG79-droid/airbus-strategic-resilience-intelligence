import { describe, expect, it } from 'vitest';
import { analyzeRoutes, validateRoutes, type DependencyRoute } from './supplyGraph';
import { createCase, validateCaseImport } from './model';
const route=(id:string,nodes:string[],capacity=35):DependencyRoute=>({
 id,optionId:'option-a',label:id,dependencies:nodes,
 capacityPercent:capacity,qualified:true,evidenceId:''
});
describe('Supply dependency topology, not proven availability',()=>{
 it('finds common upstream processor and blocks unjustified capacity summation',()=>{
  const paths=[route('r1',['processor-X','port-1']),route('r2',['processor-x','port-2'])];
  const x=analyzeRoutes(paths,'option-a');
  expect(x.qualifiedRoutes).toBe(2);
  expect(x.independentPairs).toBe(0);
  expect(x.overlappingNodes).toContain('processor-x');
  expect(x.singlePointsOfFailure).toEqual(['processor-x']);
  expect(x.declaredQualifiedCapacityPercent).toBeNull();
 });
 it('only counts distinct routes if upstream nodes are described',()=>{
  expect(analyzeRoutes([route('a',[]),route('b',['mine-2'])],'option-a').independentPairs).toBe(0);
  const x=analyzeRoutes([route('a',['mine-1']),route('b',['mine-2'])],'option-a');
  expect(x.independentPairs).toBe(1);
  expect(x.declaredQualifiedCapacityPercent).toBe(70);
  expect(x.singlePointsOfFailure).toHaveLength(0);
 });
 it('rejects malformed imported graph content and keeps old cases readable',()=>{
  const c=createCase();
  expect(validateCaseImport(c).dependencyRoutes).toEqual([]);
  const r=route('z',['source1']);
  c.dependencyRoutes=[r,r];
  expect(()=>validateCaseImport(c)).toThrow(/Invalid route/);
  c.dependencyRoutes=[route('a',['source'])];
  c.dependencyRoutes[0].capacityPercent=250;
  expect(()=>validateCaseImport(c)).toThrow(/Invalid route/);
  c.dependencyRoutes=[];
  delete (c as unknown as {dependencyRoutes?:unknown}).dependencyRoutes;
  expect(validateCaseImport(c).dependencyRoutes).toEqual([]);
 });
});
