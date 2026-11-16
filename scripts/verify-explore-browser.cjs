const engines=require('playwright-core');
const engine=process.env.BROWSER_ENGINE||'chromium';
if(!['chromium','firefox','webkit'].includes(engine))throw Error('Unsupported engine');
(async()=>{
 const browser=await engines[engine].launch(engine==='chromium'?{executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']}:{headless:true});
 const context=await browser.newContext({viewport:{width:320,height:760}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3000/privacy');
 const original=await page.evaluate(()=>{localStorage.setItem('rubato_taste_journal_v1:guest',JSON.stringify({version:1,entries:{}}));return {journal:localStorage.getItem('rubato_taste_journal_v1:guest'),profile:localStorage.getItem('room_rubato_guest_state_v4')};});
 const entry=page.locator('header a[href="/explore"]');await entry.focus();await page.keyboard.press('Enter');await page.locator('[data-explore]').waitFor();
 if(await page.locator('[data-explore-destination]').count()!==11)throw Error('Catalogue entries missing');
 if(await page.locator('header a[href="/explore"]').getAttribute('aria-current')!=='page')throw Error('Active navigation missing');
 for(const id of ['compare','try','read']){const jump=page.locator(`a[href="#${id}-content"]`);await jump.focus();await page.keyboard.press('Enter');await page.waitForFunction(hash=>location.hash===hash,`#${id}-content`);}
 for(const width of [320,768,1280]){await page.setViewportSize({width,height:900});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Catalogue overflow '+width);}
 if(engine==='chromium'){await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const violations=await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id));if(violations.length)throw Error('Explore accessibility '+violations.join(','));}
 const destinations=await page.locator('[data-explore-destination]').evaluateAll(links=>links.map(a=>a.getAttribute('href')));
 for(const href of destinations){const response=await context.request.get('http://127.0.0.1:3000'+href);if(response.status()!==200)throw Error('Destination failed '+href);}
 const flavor=page.locator('[data-explore-destination][href="/observe/flavor"]');await flavor.focus();await page.keyboard.press('Enter');await page.locator('[data-flavor-study]').waitFor();await page.waitForURL('**/observe/flavor');console.log('EXPLORE leaving flavor',page.url());await page.goBack();console.log('EXPLORE after back',page.url());await page.waitForURL('**/explore**');await page.locator('[data-explore]').waitFor();await page.reload();await page.locator('[data-explore]').waitFor();
 const after=await page.evaluate(()=>({journal:localStorage.getItem('rubato_taste_journal_v1:guest'),profile:localStorage.getItem('room_rubato_guest_state_v4')}));if(JSON.stringify(after)!==JSON.stringify(original))throw Error('Browsing changed records');
 if(errors.length)throw Error(JSON.stringify(errors));console.log(`PASS ${engine} explore navigation, all destinations, back/reload, responsive layout, unchanged records`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
