const engines=require('playwright-core');
const fs=require('node:fs/promises');
const engine=process.env.BROWSER_ENGINE||'chromium';
if(!['chromium','firefox','webkit'].includes(engine))throw Error('Unsupported engine');
(async()=>{
 const browser=await engines[engine].launch(engine==='chromium'?{executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']}:{headless:true});
 const context=await browser.newContext({viewport:{width:320,height:850},reducedMotion:'reduce'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3000/explore');await page.waitForFunction(()=>localStorage.getItem('room_rubato_guest_state_v4')!==null);
 await page.evaluate(()=>localStorage.setItem('rubato_taste_journal_v1:guest',JSON.stringify({version:1,entries:{}})));
 const snapshot=()=>page.evaluate(()=>({local:Object.fromEntries(Object.entries(localStorage).sort()),session:Object.fromEntries(Object.entries(sessionStorage).sort())}));
 const before=await snapshot();
 const entry=page.locator('[data-explore-destination][href="/observe/fibre-weave"]');await entry.focus();await page.keyboard.press('Enter');await page.waitForURL('**/observe/fibre-weave');await page.locator('[data-fibre-study]').waitFor();
 if(await page.title()!=='섬유와 조직 | Room Rubato')throw Error('Wrong fibre page title');
 const terms=page.locator('[data-fibre-terms]');const explanation=page.locator('[data-fibre-explanation]');
 for(const disclosure of [terms,explanation]){if(await disclosure.evaluate(el=>el.open))throw Error('Initial disclosure open');await disclosure.locator('summary').focus();await page.keyboard.press('Enter');await disclosure.evaluate(el=>{if(!el.open)throw Error('Keyboard disclosure did not open');});}
 const realCase=page.locator('[data-fibre-case]');await realCase.locator('summary').focus();await page.keyboard.press('Enter');await realCase.getByText('실크 날실과 면 씨실',{exact:false}).waitFor();
 const options=page.locator('[data-fibre-example]');if(await options.count()!==2)throw Error('Expected two bounded examples');
 await options.nth(1).focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('[data-fibre-example="same-weave"]')?.getAttribute('aria-pressed')==='true');
 if(await explanation.evaluate(el=>el.open))throw Error('Stale explanation carried to next example');
 await explanation.locator('summary').focus();await page.keyboard.press('Enter');
 if(!(await explanation.innerText()).includes('평직'))throw Error('Second explanation missing');
 await page.getByText('1·3·5행은',{exact:false}).waitFor();
 if(await page.locator('[data-fibre-study] input,[data-fibre-study] textarea').count())throw Error('Unexpected data collection');
 if(await page.getByRole('img',{name:/평직 교차 도식/}).count()!==1)throw Error('Missing schematic text alternative');
 for(const width of [320,390,640,768,1280]){
  await page.setViewportSize({width,height:900});await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>scrollTo(0,0));
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Fibre overflow '+width);
  if(engine==='chromium'&&[320,640,1280].includes(width)){await fs.mkdir('design-review',{recursive:true});await page.screenshot({path:`design-review/fibre-expanded-${width}.png`,fullPage:true,animations:'disabled'});}
 }
 if(engine==='chromium'){await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const failures=await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id));if(failures.length)throw Error('Fibre accessibility '+failures.join(','));}
 const reset=page.locator('[data-fibre-reset]');await reset.focus();await page.keyboard.press('Enter');
 await page.waitForFunction(()=>document.querySelector('[data-fibre-example="same-fibre"]')?.getAttribute('aria-pressed')==='true');
 if(await page.locator('[data-fibre-study] details[open]').count())throw Error('Reset left explanation open');
 if(!await reset.evaluate(el=>el===document.activeElement))throw Error('Reset lost keyboard focus');
 await options.nth(1).click();await explanation.locator('summary').click();await page.reload();await page.locator('[data-fibre-study]').waitFor();
 if(await options.first().getAttribute('aria-pressed')!=='true'||await page.locator('[data-fibre-study] details[open]').count())throw Error('Ephemeral choice persisted');
 await page.getByRole('link',{name:'← 콘텐츠 둘러보기',exact:true}).click();await page.locator('[data-explore]').waitFor();await page.goBack();await page.locator('[data-fibre-study]').waitFor();await page.goForward();await page.locator('[data-explore]').waitFor();
 if(JSON.stringify(await snapshot())!==JSON.stringify(before))throw Error('Fibre navigation changed local/session storage');
 if(errors.length)throw Error(JSON.stringify(errors));
 console.log(`PASS ${engine} fibre/weave discovery, keyboard reveal/switch/reset, text alternative, five-width reflow, reload/history and unchanged storage`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
