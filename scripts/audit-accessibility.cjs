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

await page.goto('http://127.0.0.1:3000/');const start=page.getByRole('button',{name:/문항 · 시작하기/}).first();await start.click();await page.getByRole('dialog').waitFor();await audit('survey-dialog');
for(const key of ['Tab','Shift+Tab'])for(let i=0;i<25;i++){await page.keyboard.press(key);if(!await page.evaluate(()=>document.querySelector('[role=dialog]')?.contains(document.activeElement)))throw Error('Keyboard focus escaped dialog');}
await page.keyboard.press('Escape');if(await page.getByRole('dialog').count())throw Error('Escape did not dismiss dialog');
if(!await start.evaluate(el=>el===document.activeElement))throw Error('Focus did not return to survey opener');console.log('PASS dialog keyboard containment, Escape and focus restoration');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
