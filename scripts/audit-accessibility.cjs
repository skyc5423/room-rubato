const {chromium}=require('playwright-core');
const axe=require('axe-core');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();
async function audit(label){await page.evaluate(axe.source);const result=await page.evaluate(async()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));console.log(JSON.stringify({label,violations:result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))}));}
for(const path of ['/','/notes','/notes?lesson=light','/daily','/compare','/compare/light-and-edges','/privacy','/research']){await page.goto('http://127.0.0.1:3000'+path);await page.waitForTimeout(600);await audit(path);}
await page.goto('http://127.0.0.1:3000/');const start=page.getByRole('button',{name:/문항 · 시작하기/}).first();await start.click();await page.getByRole('dialog').waitFor();await audit('survey-dialog');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
