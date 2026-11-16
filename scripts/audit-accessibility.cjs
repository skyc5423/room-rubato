const {chromium}=require('playwright-core');
const axe=require('axe-core');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();
async function audit(label){await page.evaluate(axe.source);const result=await page.evaluate(async()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));console.log(JSON.stringify({label,violations:result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))}));if(result.violations.length)throw Error(`Accessibility violations at ${label}`);}
for(const path of ['/','/notes','/notes?lesson=light','/daily','/compare','/compare/light-and-edges','/privacy','/research']){await page.goto('http://127.0.0.1:3000'+path);await page.waitForTimeout(600);await audit(path);
if(path==='/notes?lesson=light'){
await page.getByRole('button',{name:'A 쪽',exact:true}).click();
await page.getByRole('button',{name:'선택했어요 · 관찰할 단서 읽기 →'}).click();
await page.getByRole('button',{name:'이제 다시 보고 기록하기 →'}).click();
await page.getByRole('button',{name:'B 쪽',exact:true}).click();
await page.locator('#observation-memo').fill('synthetic accessibility journey');
await page.getByRole('button',{name:'이번 탐색 마치기',exact:true}).click();
if(!await page.locator('#observation-memo').evaluate(el=>el.readOnly))throw Error('completed record is not read-only');
await audit('completed-notebook');console.log('PASS complete observation journey and read-only review');
}}

await page.goto('http://127.0.0.1:3000/');await page.route('**/artwork/options/fas-q1-A.jpg*',route=>route.abort());const start=page.getByRole('button',{name:/문항 · 시작하기/}).first();await start.click();await page.getByRole('dialog').waitFor();await page.getByRole('dialog').getByText('선택지 A 이미지를 불러오지 못했어요.',{exact:false}).waitFor();if(await page.locator('[role=dialog] button.paper-postcard').first().locator('img').count())throw Error('Unrelated image substituted after failure');console.log('PASS failed choice image disclosed without misleading replacement');await audit('survey-dialog');
for(const key of ['Tab','Shift+Tab'])for(let i=0;i<25;i++){await page.keyboard.press(key);if(!await page.evaluate(()=>document.querySelector('[role=dialog]')?.contains(document.activeElement)))throw Error('Keyboard focus escaped dialog');}
await page.keyboard.press('Escape');if(await page.getByRole('dialog').count())throw Error('Escape did not dismiss dialog');
if(!await start.evaluate(el=>el===document.activeElement))throw Error('Focus did not return to survey opener');console.log('PASS dialog keyboard containment, Escape and focus restoration');
await start.click();
for(let step=0;step<20;step++){
 const heading=page.locator('[data-survey-step-heading]');
 if(await heading.getAttribute('data-survey-step-heading')==='result')break;
 const previous=await heading.textContent();
 await page.locator('[role=dialog] button.paper-postcard').first().click();
 await page.waitForFunction(old=>document.querySelector('[data-survey-step-heading]')?.textContent!==old,previous);
 await page.waitForFunction(()=>document.querySelector('[data-survey-step-heading]')===document.activeElement);
}
const result=page.locator('[data-survey-step-heading=result]');await result.waitFor();const resultText=await result.textContent();await audit('survey-result');
await page.keyboard.press('Escape');await page.reload();await page.getByRole('button',{name:/내 결과 다시 보기 →/}).first().click();
if(await page.locator('[data-survey-step-heading=result]').textContent()!==resultText)throw Error('Saved survey result did not survive reload');
console.log('PASS full survey, step/result focus, persistence and result revisit');
// The standalone route is a separate implementation from the home dialog.
await page.goto('http://127.0.0.1:3000/domain/fashion');
await page.locator('[data-survey-step-heading=result]').waitFor();
const savedBeforeRechoose=await page.evaluate(()=>localStorage.getItem('room_rubato_guest_state_v4'));
await page.getByRole('button',{name:'질문 다시 선택하기',exact:true}).click();
await page.locator('button.paper-postcard').last().click();
await page.getByRole('button',{name:'이전 결과 보기 →',exact:true}).click();
await page.locator('[data-survey-step-heading=result]').waitFor();
if(await page.evaluate(()=>localStorage.getItem('room_rubato_guest_state_v4'))!==savedBeforeRechoose)throw Error('Incomplete rechoose replaced saved results');
await page.getByRole('button',{name:'질문 다시 선택하기',exact:true}).click();
for(let step=0;step<20;step++){
 const heading=page.locator('[data-survey-step-heading]');
 if(await heading.getAttribute('data-survey-step-heading')==='result')break;
 const previous=await heading.textContent();
 await page.locator('button.paper-postcard').last().click();
 await page.waitForFunction(old=>document.querySelector('[data-survey-step-heading]')?.textContent!==old,previous);
 await page.waitForFunction(()=>document.querySelector('[data-survey-step-heading]')===document.activeElement);
}
await page.locator('[data-survey-step-heading=result]').waitFor();await audit('standalone-survey-result');
if(await page.evaluate(()=>localStorage.getItem('room_rubato_guest_state_v4'))===savedBeforeRechoose)throw Error('Completed rechoose was not saved');
const replacementResult=await page.locator('[data-survey-step-heading=result]').textContent();
await page.reload();await page.locator('[data-survey-step-heading=result]').waitFor();
if(await page.locator('[data-survey-step-heading=result]').textContent()!==replacementResult)throw Error('Standalone result did not survive reload');
console.log('PASS standalone rechoose, cancel without overwrite, complete replacement, focus and reload');
await page.goto('http://127.0.0.1:3000/');

await page.keyboard.press('Escape');
const daily=page.locator('#yesterday-letter');await daily.locator('button.paper-postcard').first().click();await daily.getByRole('button',{name:/유지하기/}).click();
if(await page.evaluate(()=>JSON.parse(localStorage.getItem('room_rubato_guest_state_v4')).dailyShiftLog.length)!==1)throw Error('Daily reflection was not stored exactly once');
page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'설문 응답 초기화',exact:true}).click();
await daily.locator('button.paper-postcard').first().waitFor();
if(await page.evaluate(()=>JSON.parse(localStorage.getItem('room_rubato_guest_state_v4')||'{}').dailyShiftLog?.length||0)!==0)throw Error('Daily records survived explicit synthetic reset');
console.log('PASS daily completion and immediate restart after explicit synthetic reset');

// Reflow and result content vary by domain: exercise every public questionnaire at 320 CSS pixels.
await page.setViewportSize({width:320,height:800});
const domainSlugs=['fashion','space-interior','gastronomy-scent','visual-art','music','cinema','literature','travel','tech-cosmos','economy','work-social','philosophy'];
async function assertReflow(label){
 const layout=await page.evaluate(()=>({width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,overflowing:[...document.querySelectorAll('main *')].filter(el=>el.getBoundingClientRect().right>document.documentElement.clientWidth+1).slice(0,8).map(el=>({tag:el.tagName,classes:el.className}))}));
 if(layout.scrollWidth>layout.width+1)throw Error(`Horizontal page overflow at ${label}: ${JSON.stringify(layout)}`);
}
for(const slug of domainSlugs){
 await page.goto('http://127.0.0.1:3000/domain/'+slug);
 await page.locator('[data-survey-step-heading=question]').waitFor();
 await assertReflow(slug+' question');
 for(let step=0;step<20;step++){
  const heading=page.locator('[data-survey-step-heading]');
  if(await heading.getAttribute('data-survey-step-heading')==='result')break;
  const previous=await heading.textContent();await page.locator('button.paper-postcard').nth(step%2).click();
  await page.waitForFunction(old=>document.querySelector('[data-survey-step-heading]')?.textContent!==old,previous);
 }
 await page.locator('[data-survey-step-heading=result]').waitFor();
 await assertReflow(slug+' result');await audit('320px '+slug+' result');
 console.log('PASS 320px questionnaire completion and result reflow: '+slug);
}
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
