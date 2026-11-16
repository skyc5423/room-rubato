const engines=require('playwright-core');
const engine=process.env.BROWSER_ENGINE||'chromium';
if(!['chromium','firefox','webkit'].includes(engine))throw Error('Unsupported browser engine');
(async()=>{
const browser=await engines[engine].launch(engine==='chromium'?{executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']}:{headless:true});
console.log(`ENGINE ${engine} ${browser.version()} (Linux CI, not a device Safari test)`);
const context=await browser.newContext();
await context.addInitScript(()=>{
 window.__writerTrace=[];
 const request=navigator.locks?.request.bind(navigator.locks);
 if(request)navigator.locks.request=(name,options,callback)=>request(name,options,lock=>{
  window.__writerTrace.push({name,granted:!!lock,at:performance.now()});
  return callback(lock);
 });
});
const a=await context.newPage();const errors=[];a.on('pageerror',e=>errors.push(e.message));
await a.goto('http://127.0.0.1:3000/notes?lesson=light');
await a.getByRole('button',{name:'A 쪽',exact:true}).waitFor();
await a.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='A 쪽'&&!b.disabled));
await a.getByRole('button',{name:'A 쪽',exact:true}).click();
const b=await context.newPage();b.on('pageerror',e=>errors.push(e.message));await b.goto('http://127.0.0.1:3000/notes?lesson=light');
await b.getByText('다른 탭에서 관찰실을 편집 중이에요.',{exact:false}).waitFor();
if(!await b.getByRole('button',{name:'＋ 다시 볼 단서에 저장',exact:true}).isDisabled())throw Error('second tab writable');
const titleBox=await b.getByRole('heading',{level:1}).boundingBox();const noticeBox=await b.getByRole('status').filter({hasText:'다른 탭에서 관찰실을 편집 중'}).boundingBox();if(!titleBox||!noticeBox||noticeBox.y-titleBox.y-titleBox.height>48)throw Error('Read-only explanation is detached from the lesson heading');
console.log('PASS second tab blocked with near-heading explanation, first tab saved');
await a.close();await b.getByRole('button',{name:'이 탭에서 편집 다시 시도'}).click();
await b.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='＋ 다시 볼 단서에 저장'&&!b.disabled));
await b.getByRole('button',{name:'＋ 다시 볼 단서에 저장',exact:true}).click();
if(!await b.evaluate(()=>JSON.parse(localStorage.getItem('rubato_taste_journal_v1:guest')).entries.light.bookmarked))throw Error('takeover save failed');
console.log('PASS tab close releases lease and retry persists');
await b.reload();await b.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='✓ 다시 볼 단서에 저장됨'&&!b.disabled));console.log('PASS reload reacquires lease and preserves data');
const legacy=await context.newPage();await legacy.goto('http://127.0.0.1:3000/privacy');
await legacy.evaluate(()=>{const k='rubato_taste_journal_v1:guest',j=JSON.parse(localStorage.getItem(k));j.entries.space={lessonId:'space',version:1,memo:'테스트 감상: 여백과 빛 🌿',bookmarked:false,updatedAt:'2026-11-16T00:00:00Z'};localStorage.setItem(k,JSON.stringify(j));});
await b.getByRole('button',{name:'✓ 다시 볼 단서에 저장됨',exact:true}).click();
if(!await b.evaluate(()=>JSON.parse(localStorage.getItem('rubato_taste_journal_v1:guest')).entries.space))throw Error('legacy different record lost');
console.log('PASS external non-locking write preserved by fresh read (not atomic CAS)');
await b.goto('http://127.0.0.1:3000/privacy');await legacy.goto('http://127.0.0.1:3000/notes?lesson=light');
await legacy.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='＋ 다시 볼 단서에 저장'&&!b.disabled));console.log('PASS navigation away releases lease');
if(engine==='chromium'){
const crash=await context.newCDPSession(legacy);
const crashed=legacy.waitForEvent('crash');
void crash.send('Page.crash').catch(()=>{});
await crashed; // Confirm the injected event, never assume a 1.5s sleep means a crash.
await b.goto('http://127.0.0.1:3000/notes?lesson=light');
await legacy.close();
await b.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='이 탭에서 편집 다시 시도'||b.textContent==='＋ 다시 볼 단서에 저장'&&!b.disabled));
const retry=b.getByRole('button',{name:'이 탭에서 편집 다시 시도'});if(await retry.isVisible())await retry.click();
try {await b.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='＋ 다시 볼 단서에 저장'&&!b.disabled));}
catch(error){console.error('CRASH RECOVERY DIAGNOSTIC',await b.evaluate(async()=>({trace:window.__writerTrace,locks:await navigator.locks.query(),status:[...document.querySelectorAll('[role=status]')].map(el=>el.textContent)})));throw error;}
if(!await b.evaluate(()=>JSON.parse(localStorage.getItem('rubato_taste_journal_v1:guest')).entries.space))throw Error('crash recovery lost saved record');
console.log('PASS crashed-tab close and retry recover editing with saved records intact');
}else console.log('SKIP renderer crash injection: Chromium CDP only');
await b.goto('http://127.0.0.1:3000/notes');
const exportButton=b.getByRole('button',{name:'기록 내보내기',exact:true});await exportButton.waitFor();
const beforeExport=await b.evaluate(()=>localStorage.getItem('rubato_taste_journal_v1:guest'));
const downloadEvent=b.waitForEvent('download');await exportButton.click();const download=await downloadEvent;
if(download.suggestedFilename()!=='room-rubato-notes.txt'||await download.failure())throw Error('Notebook export failed');
const stream=await download.createReadStream();const chunks=[];for await(const chunk of stream)chunks.push(chunk);const exported=Buffer.concat(chunks).toString('utf8');
if(!exported.includes('테스트 감상: 여백과 빛 🌿')||!exported.includes('출처:'))throw Error('Notebook export lost text or sources');
if(await b.evaluate(()=>localStorage.getItem('rubato_taste_journal_v1:guest'))!==beforeExport)throw Error('Export modified saved records');
await b.evaluate(()=>{URL.createObjectURL=()=>{throw Error('synthetic download failure');};});await exportButton.click();
await b.getByText('기록 파일을 내보내지 못했어요.',{exact:false}).waitFor();
if(await b.evaluate(()=>localStorage.getItem('rubato_taste_journal_v1:guest'))!==beforeExport)throw Error('Failed export modified saved records');
console.log('PASS UTF-8 notebook download and explicit failure without record loss');
// Real Web Audio context, synthetic pagehide event; not physical-device audibility.
await b.addInitScript(()=>{const Audio=window.AudioContext;if(Audio)window.AudioContext=class extends Audio{constructor(...args){super(...args);window.__studyAudio=this;}};});
await b.goto('http://127.0.0.1:3000/notes?lesson=syncopation');
await b.getByRole('button',{name:'A 듣기',exact:true}).click();
try{await b.getByText('A 재생 중',{exact:true}).waitFor();}catch(error){console.error('AUDIO START DIAGNOSTIC',await b.evaluate(()=>({state:window.__studyAudio?.state,visibility:document.visibilityState,status:[...document.querySelectorAll('[role=status]')].map(el=>el.textContent)})));throw error;}
await b.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
await b.waitForFunction(()=>window.__studyAudio?.state==='closed');
if(!await b.getByRole('button',{name:'정지',exact:true}).isDisabled())throw Error('Hidden-page audio remained active');
await b.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
if(await b.evaluate(()=>window.__studyAudio?.state)!=='closed')throw Error('Returning to page unexpectedly resumed audio');
await b.getByRole('button',{name:'B 듣기',exact:true}).click();await b.getByText('B 재생 중',{exact:true}).waitFor();
await b.getByRole('button',{name:'정지',exact:true}).click();
await b.waitForFunction(()=>window.__studyAudio?.state==='closed');
console.log('PASS Web Audio pagehide cancellation, no auto-resume, explicit replay (synthetic lifecycle event)');
if(errors.length)throw Error(JSON.stringify(errors));console.log('PASS no page errors');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
