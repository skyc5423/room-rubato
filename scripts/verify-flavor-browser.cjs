const engines=require('playwright-core');
const engine=process.env.BROWSER_ENGINE||'chromium';
if(!['chromium','firefox','webkit'].includes(engine))throw Error('Unsupported browser engine');
(async()=>{
 const browser=await engines[engine].launch(engine==='chromium'?{executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']}:{headless:true});
 const context=await browser.newContext({viewport:{width:320,height:760}});
 const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:3000/privacy');
 await page.evaluate(()=>localStorage.setItem('rubato_taste_journal_v1:guest',JSON.stringify({version:1,entries:{light:{lessonId:'light',version:1,memo:'synthetic preserved flavor-route record',bookmarked:false,before:'a',after:'b',updatedAt:'2026-11-16T00:00:00Z',completedAt:'2026-11-16T00:00:00Z'}}})));
 await page.goto('http://127.0.0.1:3000/notes');
 await page.locator('a[href="/observe/flavor"]').click();
 await page.locator('[data-flavor-study]').waitFor();
 if(!(await page.title()).includes('풍미'))throw Error('Missing flavor page title');
 const original=await page.evaluate(()=>({journal:localStorage.getItem('rubato_taste_journal_v1:guest'),profile:localStorage.getItem('room_rubato_guest_state_v4')}));
 const examples=page.locator('[data-flavor-example]');
 if(await examples.count()!==3)throw Error('Expected three original flavor examples');
 const initial=await examples.first().getAttribute('data-flavor-example');
 const disclosure=page.locator('[data-flavor-explanation]');
 if(await disclosure.evaluate(el=>el.open))throw Error('Flavor explanation starts expanded');
 await disclosure.locator('summary').focus();await page.keyboard.press('Enter');
 await page.waitForFunction(()=>document.querySelector('[data-flavor-explanation]')?.open===true);
 for(let index=1;index<3;index++){
  const next=examples.nth(index);await next.focus();await page.keyboard.press('Enter');
  await page.waitForFunction(id=>document.querySelector(`[data-flavor-example="${id}"]`)?.getAttribute('aria-pressed')==='true',await next.getAttribute('data-flavor-example'));
  if(await disclosure.evaluate(el=>el.open))throw Error('Prior example explanation remains expanded');
  await disclosure.locator('summary').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('[data-flavor-explanation]')?.open===true);
  if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1))throw Error('Flavor page overflows at 320px');
 }
 if(engine==='chromium'){
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id));
  if(violations.length)throw Error('Flavor accessibility: '+violations.join(','));
 }
 if(await page.locator('[data-flavor-study] input,[data-flavor-study] textarea').count())throw Error('Flavor activity unexpectedly collects input');
 await page.reload();await page.locator('[data-flavor-study]').waitFor();
 if(await page.locator(`[data-flavor-example="${initial}"]`).getAttribute('aria-pressed')!=='true'||await disclosure.evaluate(el=>el.open))throw Error('Flavor exploration persisted without consent');
 const after=await page.evaluate(()=>({journal:localStorage.getItem('rubato_taste_journal_v1:guest'),profile:localStorage.getItem('room_rubato_guest_state_v4')}));
 if(JSON.stringify(after)!==JSON.stringify(original))throw Error('Flavor exploration changed stored observations or profile');
 if(errors.length)throw Error(JSON.stringify(errors));
 console.log(`PASS ${engine} flavor discovery, keyboard examples, reset, 320px reflow and unchanged records`);
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
