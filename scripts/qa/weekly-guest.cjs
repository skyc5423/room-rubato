const assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const req=createRequire(process.cwd()+'/qa-harness/package.json');
(async()=>{
 const browser=await req('playwright-core').chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:320,height:760}});
 await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:3000';
 const routes=['/observe/fibre-weave','/observe/flavor','/compare/light-and-edges'];
 const snapshot=()=>page.evaluate(()=>({profile:localStorage.getItem('room_rubato_guest_state_v4'),journal:localStorage.getItem('rubato_taste_journal_v1:guest')}));
 async function layout(){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow');}
 async function axe(){await page.addScriptTag({path:req.resolve('axe-core/axe.min.js')});assert.deepEqual(await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))),[]);}
 await page.goto(base+'/explore');await page.waitForFunction(()=>localStorage.getItem('room_rubato_guest_state_v4')!==null);const before=await snapshot();
 const primary=page.locator('section[aria-labelledby="first-visit-title"] a');
 const weekly=page.locator('section[aria-labelledby="weekly-observation-title"]');
 assert.equal(await primary.getAttribute('href'),'/notes?lesson=light');
 assert(await primary.evaluate(e=>Boolean(e.compareDocumentPosition(document.querySelector('[aria-labelledby="weekly-observation-title"]'))&Node.DOCUMENT_POSITION_FOLLOWING)));
 assert.equal(await weekly.locator('a').count(),3);
 assert(await primary.evaluate(e=>e.classList.contains('bg-[#0042AF]')));
 assert.equal(await weekly.locator('a.bg-\\[\\#0042AF\\]').count(),0);
 for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:760});await layout();}await page.setViewportSize({width:320,height:760});await axe();
 for(let i=0;i<3;i++){
  const link=weekly.locator('a').nth(i);assert.equal(await link.getAttribute('href'),routes[i]);await link.scrollIntoViewIfNeeded();await link.focus();
  assert(await link.evaluate(e=>document.activeElement===e));const b=await link.boundingBox();assert(b.height>=44&&b.x>=0&&b.x+b.width<=320);
  if(i<2){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('href')),routes[i+1]);await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('href')),routes[i]);}
  await page.keyboard.press('Enter');await page.waitForURL(base+routes[i]);await page.locator('h1').waitFor();await layout();await axe();assert.deepEqual(await snapshot(),before);
  await page.goBack();await weekly.waitFor();await page.reload();await weekly.waitFor();assert.deepEqual(await snapshot(),before);
  console.log('PASS 320px keyboard opening '+routes[i]+', axe, back/reload and unchanged guest records');
 }
 assert.deepEqual(errors,[]);console.log('PASS primary CTA priority, 4-width reflow, ordered keyboard links, no runtime errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
