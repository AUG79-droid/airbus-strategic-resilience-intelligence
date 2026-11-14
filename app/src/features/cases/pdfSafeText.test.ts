import {describe,expect,it} from 'vitest';
import {pdfSafeText} from './pdfSafeText';
describe('Auditable PDF scientific typography',()=>{
 it('preserves Spanish accents and euro notation with WinAnsi support',()=>{
  expect(pdfSafeText('Emisiones, energía, reparación: 50 €; año 2026')).toBe('Emisiones, energía, reparación: 50 €; año 2026');
 });
 it('transliterates technical units, arrows, calculations and Greek symbols',()=>{
  expect(pdfSafeText('Δ kg CO₂e → -25 %; Σ P(F∩S) ≤ 1'))
    .toBe('Delta kg CO2e  ->  -25 %; Sigma P(FintersectionS) <= 1');
  expect(pdfSafeText('Tiempo medio 36,8 días ≥ 25 días')).toContain('>=');
 });
 it('never hides unknown characters as untraceable question marks',()=>{
  expect(pdfSafeText('Flight ✈')).toBe('Flight [U+2708]');
  expect(pdfSafeText('燃料')).toBe('[U+71C3][U+6599]');
 });
});
