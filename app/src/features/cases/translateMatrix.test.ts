import {describe,expect,it} from 'vitest';
import {fromPreset} from './presets';
import {compareOption,type Audience} from './model';
import {strategicMessage,strategicNarrativeText} from './strategicNarrative';
import {strategicInsights} from './strategicDeepDive';

describe('32 combinations × two languages: strategic translation contract',()=>{
 const kinds=['ecodesign','climate','saf','wildfire'] as const;
 const audiences:Audience[]=['defenceCustomer','engineering','programmeManager','executiveLeadership'];
 for(const kind of kinds)for(const locale of ['es','en'] as const){
  it(kind+' '+locale+': no invented numbers, unreviewed benefit or missing section',()=>{
    const c=fromPreset(kind,locale);
    for(const option of c.options.slice(1)){
      const comparison=compareOption(c,option);
      const all=audiences.map(audience=>{
        const message=strategicMessage(c,comparison,audience,locale);
        const narrative=strategicNarrativeText(c,comparison,audience,locale);
        const sections=strategicInsights(c,comparison,audience,locale);
        expect(sections.map(x=>x.id)).toEqual(['bottleneck','risk','economics','environment','alternatives','evidence','action']);
        for(const section of sections)expect(section.body.trim().length).toBeGreaterThan(35);
        const text=[message.headline,message.operationalMeaning,message.quantifiedFinding,
          message.sustainabilityLink,message.decisionQuestion,narrative,...sections.map(x=>x.body)].join(' ');
        expect(text).not.toMatch(/\bNaN\b|\bundefined\b|\bInfinity\b/);
        expect(text).not.toMatch(/it unchanged|\b1 more days\b|\b1 less days\b/i);
        expect(text).not.toMatch(/benefit (is|has been) (validated|certified) by Airbus/i);
        if(comparison.rows.find(x=>x.metric.id==='expectedRecovery')?.delta!>0)
          expect(text).not.toContain('la mejora calculada puede aplicarse');
        return narrative;
      });
      expect(new Set(all).size).toBe(4);
    }
  });
 }
});
