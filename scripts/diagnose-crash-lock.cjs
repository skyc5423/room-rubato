// Synthetic localhost-only investigation. No credentials, user data or lock stealing.
const {chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 const trials=Number(process.env.CRASH_TRIALS||3);
 if(!Number.isInteger(trials)||trials<1||trials>50)throw Error('CRASH_TRIALS must be 1..50');
 let failures=0;
 for(let trial=1;trial<=trials;trial++){
  const context=await browser.newContext();
  await context.addInitScript(()=>{
   window.__lockTrace=[];
   const request=navigator.locks.request.bind(navigator.locks);
   navigator.locks.request=(name,options,callback)=>{
    window.__lockTrace.push({event:'request',at:performance.now(),name,options});
    return request(name,options,lock=>{
     window.__lockTrace.push({event:lock?'granted':'unavailable',at:performance.now()});
     return callback(lock);
    });
   };
  });
  const owner=await context.newPage(), recovery=await context.newPage();
  await recovery.goto('http://127.0.0.1:3000/privacy');
  await owner.goto('http://127.0.0.1:3000/notes?lesson=light');
  const editable=()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='＋ 다시 볼 단서에 저장'&&!b.disabled);
  await owner.waitForFunction(editable);
  const session=await context.newCDPSession(owner);
  let crashObserved=false;owner.on('crash',()=>{crashObserved=true;});
  await Promise.race([session.send('Page.crash').catch(()=>{}),new Promise(resolve=>setTimeout(resolve,1500))]);
  await recovery.goto('http://127.0.0.1:3000/notes?lesson=light');
  await owner.close();
  await recovery.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='이 탭에서 편집 다시 시도'||b.textContent==='＋ 다시 볼 단서에 저장'&&!b.disabled));
  const snapshot=()=>recovery.evaluate(async()=>({trace:window.__lockTrace,locks:await navigator.locks.query(),statuses:[...document.querySelectorAll('[role=status]')].map(e=>e.textContent)}));
  // Do not add a pre-click IPC/query round trip: it can conceal the race.
  const before=null;
  const retry=recovery.getByRole('button',{name:'이 탭에서 편집 다시 시도'});
  if(await retry.isVisible())await retry.click();
  try{await recovery.waitForFunction(editable,null,{timeout:5000});console.log(JSON.stringify({trial,crashObserved,before,after:await snapshot(),result:'pass'}));}
  catch(error){
   failures++;
   const failed=await snapshot();
   let secondRetry='not available';
   if(await retry.isVisible()){
    await retry.click();
    try{await recovery.waitForFunction(editable,null,{timeout:5000});secondRetry='recovered';}catch{secondRetry='failed';}
   }
   console.log(JSON.stringify({trial,crashObserved,before,failed,secondRetry,after:await snapshot(),result:'failed first recovery'}));
  }
  await context.close();
 }
 await browser.close();
 if(failures)throw Error(`${failures}/${trials} single-retry crash recoveries failed; inspect trace, not a passing retry test`);
})().catch(e=>{console.error(e);process.exit(1)});
