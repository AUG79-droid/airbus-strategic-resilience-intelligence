import {describe,expect,it} from 'vitest';
import {fromPreset} from './presets';
import {calculateUniversal} from './universal';
import {referenceNarrative,referenceReportText,referenceRows} from './referenceView';
import type {Audience} from './model';

const kinds=['ecodesign','climate','saf','wildfire'] as const;
const audiences:Audience[]=['defenceCustomer','engineering','programmeManager','executiveLeadership'];

describe('Reference option is a fully represented third strategic decision',()=>{
  it.each(kinds)('shows original computed baseline outputs without fabricated deltas in %s',kind=>{
    for(const locale of ['es','en'] as const){
      const data=fromPreset(kind,locale);
      const model=calculateUniversal(data,data.options[0]);
      const rows=referenceRows(data,locale);
      expect(rows).toHaveLength(7);
      expect(rows.find(r=>r.key==='recovery')?.value).toBe(model.recovery.value);
      expect(rows.find(r=>r.key==='deadline')?.value).toBe(model.deadline.value);
      expect(rows.find(r=>r.key==='cost')?.value).toBe(model.cost.value);
      expect(rows.some(r=>r.formatted.includes('NaN'))).toBe(false);
    }
  });

  it.each(kinds)('translates the baseline to all four audiences in both languages (%s)',kind=>{
    for(const locale of ['es','en'] as const){
      const data=fromPreset(kind,locale);
      for(const audience of audiences){
        const story=referenceNarrative(data,audience,locale);
        expect(story.headline.length).toBeGreaterThan(15);
        expect(story.answer.length).toBeGreaterThan(30);
        expect(story.insights).toHaveLength(7);
        expect(story.quantifiedFinding).not.toMatch(/NaN|undefined|Infinity/);
        const report=referenceReportText(data,audience,locale);
        expect(report).toContain(data.scenario);
        expect(report).toContain(data.options[0].name);
        expect(report).toContain(data.options[1].name);
        expect(report).toContain(data.options[2].name);
        expect(report).not.toMatch(/NaN|undefined|Infinity/);
      }
    }
  });

  it('correctly represents incomplete or excluded baseline data',()=>{
    const data=fromPreset('ecodesign','en');
    data.options[0].parameterValues.baseRecovery.value=null;
    const row=referenceRows(data,'en').find(x=>x.key==='recovery');
    expect(row?.formatted).toBe('Unknown / incomplete');
    expect(referenceNarrative(data,'defenceCustomer','en').quantifiedFinding).toContain('Unknown / incomplete');
  });
});
