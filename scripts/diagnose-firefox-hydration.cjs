// Synthetic localhost-only reproduction matrix; never uses a hosted account or user records.
const {firefox}=require('playwright-core');
(async()=>{
 const browser=await firefox.launch({headless:true});const errors=[];let visits=0;
 const routes=['/notes','/notes?lesson=light','/notes?lesson=perspective','/privacy'];
 const variants=[{name:'empty',seed:false,delay:0,locale:'en-US',timezoneId:'UTC'},{name:'saved',seed:true,delay:0,locale:'ko-KR',timezoneId:'Asia/Seoul'},{name:'delayed-js',seed:false,delay:150,locale:'ko-KR',timezoneId:'Asia/Seoul'},{name:'saved-delayed-js',seed:true,delay:150,locale:'en-US',timezoneId:'UTC'}];
 for(let trial=1;trial<=3;trial++)for(const variant of variants){
  const context=await browser.newContext({locale:variant.locale,timezoneId:variant.timezoneId});
  if(variant.delay)await context.route('**/_next/static/**/*.js',async route=>{await new Promise(resolve=>setTimeout(resolve,variant.delay));await route.continue();});
  if(variant.seed)await context.addInitScript(()=>localStorage.setItem('rubato_taste_journal_v1:guest',JSON.stringify({version:1,entries:{light:{lessonId:'light',version:1,before:'a',after:'b',memo:'synthetic hydration fixture',bookmarked:false,completedAt:'2026-11-16T00:00:00Z',updatedAt:'2026-11-16T00:00:00Z'}}})));
  for(const path of routes){
   const page=await context.newPage();let phase='initial';
   page.on('pageerror',e=>{const item={trial,variant:variant.name,path,phase,message:e.message,stack:e.stack};errors.push(item);console.error('HYDRATION MATRIX ERROR',JSON.stringify(item));});
   page.on('console',m=>{if(m.type()==='error'&&/hydration|hydrated|Minified React error/i.test(m.text()))console.error('HYDRATION MATRIX CONSOLE',JSON.stringify({trial,variant:variant.name,path,phase,message:m.text()}));});
   await page.goto('http://127.0.0.1:3000'+path);
   for(const mode of ['initial','reload']){
    phase=mode;if(mode==='reload')await page.reload();
    await page.locator('main h1').waitFor();
    if(path.startsWith('/notes?'))await page.getByRole('button',{name:'A 쪽',exact:true}).waitFor();
    await page.waitForFunction(()=>localStorage.getItem('room_rubato_guest_state_v4')!==null);
    // Settling window is an observation interval, not a replacement for readiness checks above.
    await page.waitForTimeout(200);visits++;
   }
   await page.close();
  }
  await context.close();console.log('HYDRATION MATRIX completed',JSON.stringify({trial,variant:variant.name,visits,errorCount:errors.length}));
 }
 await browser.close();console.log('HYDRATION MATRIX RESULT',JSON.stringify({visits,variants:variants.length,trials:3,errorCount:errors.length}));if(errors.length)throw Error('Firefox hydration reproduction matrix failed');
})().catch(e=>{console.error(e);process.exit(1)});
