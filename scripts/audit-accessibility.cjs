const {chromium}=require('playwright-core');
const axe=require('axe-core');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:844}});
// Install failure injection before any navigation/cache population.
let failedChoiceRequests=0;
await context.route('**/artwork/options/fas-q1-A.jpg*',route=>{failedChoiceRequests++;return route.abort();});
const page=await context.newPage();
async function audit(label){await page.evaluate(axe.source);const result=await page.evaluate(async()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));console.log(JSON.stringify({label,violations:result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))}));if(result.violations.length)throw Error(`Accessibility violations at ${label}`);}
for(const path of ['/','/notes','/notes?lesson=light','/daily','/compare','/compare/light-and-edges','/privacy','/research']){await page.goto('http://127.0.0.1:3000'+path);await page.waitForTimeout(600);await audit(path);
if(path==='/notes?lesson=light'){
const beforeRevisit=await page.evaluate(()=>localStorage.getItem('rubato_taste_journal_v1:guest'));
await page.getByRole('button',{name:'같은 작품 다시 살펴보기',exact:true}).click();
await page.getByRole('heading',{name:'두 번째 시선 · 달라진 단서 찾기',exact:true}).waitFor();
await page.getByRole('button',{name:'기존 관찰 메모로 이동',exact:true}).click();
await page.waitForFunction(()=>document.activeElement?.id==='observation-memo');
if(await page.evaluate(()=>localStorage.getItem('rubato_taste_journal_v1:guest'))!==beforeRevisit)throw Error('Artwork revisit navigation changed saved records');
await page.reload();await page.getByRole('button',{name:'A 쪽',exact:true}).waitFor();
await page.getByRole('button',{name:'A 쪽',exact:true}).click();
await page.getByRole('button',{name:'선택했어요 · 관찰할 단서 읽기 →'}).click();
await page.getByRole('button',{name:'이제 다시 보고 기록하기 →'}).click();
await page.getByRole('button',{name:'B 쪽',exact:true}).click();
await page.locator('#observation-memo').fill('synthetic accessibility journey');
await page.getByRole('button',{name:'이번 탐색 마치기',exact:true}).click();
if(!await page.locator('#observation-memo').evaluate(el=>el.readOnly))throw Error('completed record is not read-only');
await page.getByRole('button',{name:'기존 관찰 메모로 이동',exact:true}).click();
await page.waitForFunction(()=>document.activeElement?.id==='observation-memo');
if(!await page.locator('#observation-memo').evaluate(el=>el.readOnly))throw Error('Artwork revisit bypassed completed record read-only guard');
await page.getByRole('button',{name:'작품의 맥락 함께 읽기',exact:true}).click();
await page.getByRole('heading',{name:'미술관이 설명하는 맥락',exact:true}).waitFor();
console.log('PASS artwork revisit memo focus, no implicit save and completed read-only guard');
await audit('completed-notebook');console.log('PASS complete observation journey and read-only review');
}}

await page.goto('http://127.0.0.1:3000/');const start=page.getByRole('button',{name:/문항 · 시작하기/}).first();await start.click();await page.getByRole('dialog').waitFor();try{await page.getByRole('dialog').getByText('선택지 A 이미지를 불러오지 못했어요.',{exact:false}).waitFor();}catch(error){console.error('IMAGE FAILURE DIAGNOSTIC',{failedChoiceRequests,dialog:await page.getByRole('dialog').innerText(),images:await page.getByRole('dialog').locator('img').evaluateAll(imgs=>imgs.map(img=>({src:img.src,complete:img.complete,naturalWidth:img.naturalWidth})))});throw error;}if(!failedChoiceRequests)throw Error('Image failure was not actually injected');if(await page.locator('[role=dialog] button.paper-postcard').first().locator('img').count())throw Error('Unrelated image substituted after failure');console.log('PASS failed choice image disclosed without misleading replacement');await audit('survey-dialog');
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

// A text-first artwork visit must be resumable without inventing an earlier A/B answer.
const memoContext=await browser.newContext({viewport:{width:390,height:844}});const memoPage=await memoContext.newPage();
await memoPage.goto('http://127.0.0.1:3000/notes?lesson=light');
const secondArtwork=memoPage.locator('[aria-label="비교할 작품"] button').nth(1);const chosenArtwork=await secondArtwork.textContent();await secondArtwork.click();
await memoPage.getByRole('button',{name:'기존 관찰 메모로 이동',exact:true}).click();
await memoPage.locator('#observation-memo').fill('synthetic memo-only return');
await memoPage.goto('http://127.0.0.1:3000/');
await memoPage.getByRole('link',{name:'멈춘 곳에서 이어보기 →',exact:true}).click();
await memoPage.locator('#observation-memo').waitFor();
if(await memoPage.locator('#observation-memo').inputValue()!=='synthetic memo-only return')throw Error('Memo-only visit did not resume its saved memo');
if(await memoPage.evaluate(()=>!!JSON.parse(localStorage.getItem('rubato_taste_journal_v1:guest')).entries.light.before))throw Error('Memo resume fabricated a prior choice');
if(await memoPage.locator('[aria-label="비교할 작품"] button[aria-pressed=true]').textContent()!==chosenArtwork)throw Error('Return replaced explicitly selected artwork');
console.log('PASS selected artwork and memo-only artwork visit resumes from home without invented choices');
const journalBeforeForget=await memoPage.evaluate(()=>localStorage.getItem('rubato_taste_journal_v1:guest'));await memoPage.getByRole('button',{name:'이 브라우저의 작품 선택 지우기',exact:true}).click();
if(await memoPage.evaluate(()=>localStorage.getItem('rubato_artwork_view_v1:guest:light'))!==null)throw Error('Artwork view preference did not clear');
if(await memoPage.evaluate(()=>localStorage.getItem('rubato_taste_journal_v1:guest'))!==journalBeforeForget)throw Error('Forgetting artwork view altered observations');
console.log('PASS explicit artwork preference deletion preserves observation records');await memoContext.close();
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
for(const lesson of ['syncopation','complexity']){
 await page.goto('http://127.0.0.1:3000/notes?lesson='+lesson);
 await page.locator('summary').filter({hasText:'논문은 무엇을 확인했나요?'}).click();
 if(lesson==='syncopation')await page.getByText('Witek 등(2014)은 펑크 드럼 패턴을 들려주고',{exact:false}).waitFor();
 else await page.getByText('논문은 보는 즐거움과 작품의 예술적 가치를 구분합니다.',{exact:false}).waitFor();
 await audit('expanded evidence notes '+lesson);await assertReflow('evidence notes '+lesson);
}
console.log('PASS sourced music and aesthetic-evidence notes expand at 320px');
// Guest storage failure and file-download failure must still leave a copyable recovery record.
const recoveryContext=await browser.newContext();
await recoveryContext.addInitScript(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='room_rubato_guest_state_v4')throw new DOMException('synthetic quota','QuotaExceededError');return set.call(this,key,value);};URL.createObjectURL=()=>{throw Error('synthetic download unavailable');};});
const recoveryPage=await recoveryContext.newPage();await recoveryPage.goto('http://127.0.0.1:3000/daily');
await recoveryPage.locator('button.paper-postcard').first().click();await recoveryPage.getByRole('button',{name:/유지하기/}).click();
await recoveryPage.getByRole('button',{name:'현재 기록 내려받기',exact:true}).click();
const copied=JSON.parse(await recoveryPage.getByRole('textbox',{name:'복구용 JSON 직접 복사',exact:true}).inputValue());
if(copied.dailyShiftLog.length!==1)throw Error('Manual recovery omitted unsaved daily answer');
if(await recoveryPage.evaluate(()=>localStorage.getItem('room_rubato_guest_state_v4'))!==null)throw Error('Failure fixture unexpectedly wrote journal');
console.log('PASS unsaved survey recovery remains copyable when storage and download fail');await recoveryContext.close();
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
