/** Screenshot + computed-font QA of the LIVE deployed ASRI app (EN / ES). */
import {chromium} from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const out=path.join(root,'typography-qa');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const issues=[];
const results=[];
const BASE='https://aug79-droid.github.io/airbus-strategic-resilience-intelligence/#/translate';
const selectors={
  audienceDescription:['.audience-selector button small',13],
  headerContext:['.translator-header__context',13],
  summaryLabel:['.translator-summary__body h4',13],
  summaryBody:['.translator-summary__body > section:not(.translator-recommendation) p',15],
  comparisonText:['.translator-comparison p',15],
  comparisonBullets:['.translator-comparison li',14],
  metricLabels:['.translator-metric > span',13],
  metricNotes:['.translator-metric small',13],
  validatedCaption:['.validated-counter span',13],
  profileBullets:['.translator-profile li',14],
};
try {
  for (const viewport of [{width:1440,height:900},{width:390,height:844}]) {
    for(const locale of ['en','es']){
      const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce'});
      const page=await context.newPage();
      page.on('pageerror',e=>issues.push(locale+'@'+viewport.width+': '+e.message));
      await page.goto(BASE,{waitUntil:'networkidle',timeout:60000});
      if(locale==='es')await page.getByRole('button',{name:'ES',exact:true}).click();
      await page.locator('.translator-summary').waitFor({timeout:20000});
      await page.evaluate(()=>document.fonts.ready);
      const data=await page.evaluate((checks)=>{
        const fonts={};
        for (const [name,[selector,min]] of Object.entries(checks)) {
          const el=document.querySelector(selector);
          if(!el){fonts[name]={status:'missing',selector};continue;}
          const size=parseFloat(getComputedStyle(el).fontSize);
          fonts[name]={size,min,passed:size>=min};
        }
        return {
          lang:document.documentElement.lang,
          width:window.innerWidth,
          scrollWidth:document.documentElement.scrollWidth,
          fonts,
          mainHeading:document.querySelector('#translate-title')?.textContent,
        };
      },selectors);
      for (const [k,v] of Object.entries(data.fonts)) {
        if(!v.passed)issues.push(locale+'@'+viewport.width+': '+k+' '+JSON.stringify(v));
      }
      if(data.lang!==locale)issues.push(locale+'@'+viewport.width+': wrong lang '+data.lang);
      if(data.scrollWidth>data.width+2)issues.push(locale+'@'+viewport.width+': horizontal overflow '+data.scrollWidth+' > '+data.width);
      const stamp=locale+'-'+viewport.width;
      await page.screenshot({path:path.join(out,stamp+'-translate.png'),fullPage:true});
      await page.getByTestId('open-export-review').click();
      const exportFonts=await page.evaluate(()=>{
        const labels=['.export-review__summary dt','.export-review__confirm','.export-review__panel footer button'];
        return Object.fromEntries(labels.map(s=>[s,document.querySelector(s)?parseFloat(getComputedStyle(document.querySelector(s)).fontSize):null]));
      });
      for(const [name,value] of Object.entries(exportFonts)) {
        if(value===null||value<13)issues.push(stamp+': export '+name+' size '+value);
      }
      await page.screenshot({path:path.join(out,stamp+'-export.png'),fullPage:true});
      results.push({locale,viewport,...data,exportFonts});
      console.log('Checked',stamp,JSON.stringify(data.fonts));
      await context.close();
    }
  }
} finally {await browser.close();}
await fs.writeFile(path.join(out,'report.json'),JSON.stringify({status:issues.length?'failed':'passed',checks:results,issues},null,2));
if(issues.length){console.error('Typography QA problems:',JSON.stringify(issues,null,2));process.exitCode=1;}
else console.log('TYPOGRAPHY QA PASS: EN+ES desktop+mobile; all selected text >=13px, no horizontal overflow');
