const assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const requireQA=createRequire(process.cwd()+'/qa-harness/package.json');
const {chromium}=requireQA('playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:320,height:760}});
 await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:3000';
 async function layout(){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');}
 async function axe(){await page.addScriptTag({path:requireQA.resolve('axe-core/axe.min.js')});const violations=await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);}
 async function activate(link){await link.scrollIntoViewIfNeeded();await link.focus();assert(await link.evaluate(e=>e===document.activeElement));const box=await link.boundingBox();assert(box.height>=44);assert(box.x>=0&&box.x+box.width<=320);await page.keyboard.press('Enter');}
 await page.goto(base+'/explore');await page.waitForFunction(()=>localStorage.getItem('room_rubato_guest_state_v4')!==null);
 const original=await page.evaluate(()=>({profile:localStorage.getItem('room_rubato_guest_state_v4'),journal:localStorage.getItem('rubato_taste_journal_v1:guest')}));
 const first=page.locator('section[aria-labelledby="first-visit-title"] a');
 assert.equal(await first.getAttribute('href'),'/notes?lesson=light');
 assert(await first.evaluate(e=>e.compareDocumentPosition(document.querySelector('nav[aria-label="콘텐츠 종류"]'))&Node.DOCUMENT_POSITION_FOLLOWING));
 for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:760});await layout();}await page.setViewportSize({width:320,height:760});await axe();
 await activate(first);await page.locator('#lesson-heading').waitFor();await page.getByRole('button',{name:'A 쪽',exact:true}).waitFor();await layout();await axe();
 assert.equal(await page.evaluate(()=>localStorage.getItem('rubato_taste_journal_v1:guest')),original.journal);
 const slider=page.getByRole('slider');await slider.focus();const before=await slider.inputValue();await page.keyboard.press('ArrowRight');assert.notEqual(await slider.inputValue(),before);
 await page.getByRole('button',{name:'A 쪽',exact:true}).click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('rubato_taste_journal_v1:guest'))?.entries.light.before==='a');
 const saved=await page.evaluate(()=>localStorage.getItem('rubato_taste_journal_v1:guest'));
 await page.reload();await page.locator('#lesson-heading').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('rubato_taste_journal_v1:guest')),saved);
 console.log('PASS 320px first CTA keyboard/scroll, real guest slider and choice, local save/reload; 4-width reflow and axe');
 for(const [route,id] of [['fibre-weave','contrast'],['flavor','context']]){
  await page.goto(base+'/observe/'+route);const next=page.locator('section[aria-labelledby="next-activity-title"] a');await next.waitFor();await layout();await axe();
  assert.equal(await next.getAttribute('href'),'/notes?lesson='+id);assert.equal(await page.evaluate(()=>localStorage.getItem('rubato_taste_journal_v1:guest')),saved);
  await activate(next);await page.locator('#lesson-heading').waitFor();await page.getByRole('button',{name:'A 쪽',exact:true}).waitFor();assert.equal(new URL(page.url()).searchParams.get('lesson'),id);await layout();await axe();
  assert.equal(await page.evaluate(()=>localStorage.getItem('rubato_taste_journal_v1:guest')),saved);
  await page.goBack();await next.waitFor();await page.reload();await next.waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('rubato_taste_journal_v1:guest')),saved);
  console.log('PASS 320px '+route+' optional next CTA, actual '+id+' guest lesson, back/reload, axe and no implicit save');
 }
 assert.equal(await page.evaluate(()=>localStorage.getItem('room_rubato_guest_state_v4')),original.profile);assert.deepEqual(errors,[]);
 await context.close();await browser.close();console.log('PASS no profile/consent changes, no runtime errors; no hosted credentials or data');
})().catch(e=>{console.error(e);process.exit(1)});
