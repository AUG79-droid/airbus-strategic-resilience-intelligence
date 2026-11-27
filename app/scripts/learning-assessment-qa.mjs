import assert from 'node:assert/strict';
const registered=new WeakSet();
// Exercise the actual initial gate, never disable it. Existing feature-specific journeys
// may defer the optional final assessment so they can continue testing the workspace.
export async function completeInitialAssessment(page){
 const dialog=page.locator('#sn-native-learning-evidence dialog');
 await page.locator('#sn-native-learning-evidence').waitFor({state:'attached'});
 const submit=dialog.getByRole('button',{name:/^(Corregir evaluación inicial|Correct initial assessment)$/});
 if(await submit.isVisible()){
   const fields=await dialog.locator('fieldset').all();assert.equal(fields.length,4);
   for(const [i,f] of fields.entries())await f.locator('input[value="'+[0,1,3,0][i]+'"]').check();
   await submit.click();
 }
 const start=dialog.getByRole('button',{name:/^(Comenzar actividad|Start activity)$/});
 if(await start.isVisible()){
   assert.equal(await dialog.locator('[data-initial-score="2"]').count(),1);
   assert.equal(await dialog.locator('[data-assessment-review="pre"] .correct-answer').count(),4);
   await start.click();
 }
 if(!registered.has(page)){
   const back=dialog.getByRole('button',{name:/^(Volver a la actividad|Return to activity)$/});
   await page.addLocatorHandler(back,async()=>{await back.click();});
   registered.add(page);
 }
}
