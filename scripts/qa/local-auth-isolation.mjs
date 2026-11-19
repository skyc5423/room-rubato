// Local ephemeral Supabase only. Never logs credentials, tokens, rows or browser storage.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import {spawn,spawnSync,execFileSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import pg from 'pg';
import {chromium} from 'playwright-core';
const cfg=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const url=cfg.API_URL, key=cfg.ANON_KEY, dbUrl=cfg.DB_URL;
for(const value of [url,dbUrl]) assert(['127.0.0.1','localhost'].includes(new URL(value).hostname),'Only loopback allowed');
assert(key && dbUrl,'Missing local-only configuration');
const db=new pg.Client({connectionString:dbUrl}); await db.connect();
for(const file of ['supabase/schema.sql','docs/proposals/persona-cas.sql','docs/proposals/taste-journal-cas.sql']) await db.query(fs.readFileSync(file,'utf8'));
await db.query("NOTIFY pgrst, 'reload schema'");
await new Promise(r=>setTimeout(r,2000));
const options={auth:{persistSession:false,autoRefreshToken:false}};
const accounts=[];
for(const name of ['alice','bob']){
 const client=createClient(url,key,options), email=`${name}-${randomUUID()}@example.test`,password=randomUUID()+'aA1!';
 const {data,error}=await client.auth.signUp({email,password});assert(!error&&data.session,'Local GoTrue signup failed');
 accounts.push({client,email,password,id:data.user.id});
}
const [a,b]=accounts;
const save=async(account,owner=account.id)=>account.client.rpc('save_persona_cas',{p_owner_id:owner,p_expected_revision:null,p_write_id:randomUUID(),p_state:{marker:account===a?'alice':'bob'},p_consent_agreed_at:new Date().toISOString(),p_consent_version:'synthetic-ci'});
for(const account of accounts){const result=await save(account);assert(!result.error,'Owner CAS save failed');}
for(const account of accounts){const r=await account.client.from('persona_profiles').select('user_id,state');assert(!r.error&&r.data.length===1&&r.data[0].user_id===account.id,'RLS owner select failed');}
assert((await save(b,a.id)).error,'Cross-owner CAS accepted');
const direct=await b.client.from('persona_profiles').update({state:{marker:'attack'}}).eq('user_id',a.id);assert(direct.error,'Direct write grant should be revoked');
const anon=createClient(url,key,options);assert((await anon.from('persona_profiles').select('user_id')).error,'Anonymous read unexpectedly granted');
const refreshed=await a.client.auth.refreshSession();assert(!refreshed.error&&refreshed.data.user.id===a.id,'GoTrue refresh failed');
console.log('PASS actual local GoTrue signup/refresh, two identities, PostgREST RLS select, cross-owner CAS rejection, direct and anonymous denial');
const sdk=fs.readFileSync('node_modules/@supabase/supabase-js/dist/umd/supabase.js');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/sdk.js'?'application/javascript':'text/html');res.end(req.url==='/sdk.js'?sdk:'<!doctype html><html><head><title>Local synthetic auth harness</title></head><body><script src="/sdk.js"></script></body></html>');});
await new Promise(r=>server.listen(3123,'127.0.0.1',r));
const browser=await chromium.launch({headless:true});
try{
 const contexts=await Promise.all([browser.newContext(),browser.newContext()]);
 const pages=await Promise.all(contexts.map(c=>c.newPage()));
 for(let i=0;i<2;i++){
  await pages[i].goto('http://127.0.0.1:3123');
  await pages[i].evaluate(async({url,key,email,password})=>{localStorage.setItem('rubato_taste_journal_v1:guest','synthetic-guest');window.client=window.supabase.createClient(url,key);const r=await window.client.auth.signInWithPassword({email,password});if(r.error)throw Error('login failed');},{url,key,email:accounts[i].email,password:accounts[i].password});
  await pages[i].reload();
  const result=await pages[i].evaluate(async({url,key})=>{window.client=window.supabase.createClient(url,key);const s=await window.client.auth.getSession();const r=await window.client.from('persona_profiles').select('user_id');return {uid:s.data.session?.user.id,rows:r.data?.map(x=>x.user_id),guest:localStorage.getItem('rubato_taste_journal_v1:guest')};},{url,key});
  assert.equal(result.uid,accounts[i].id);assert.deepEqual(result.rows,[accounts[i].id]);assert.equal(result.guest,'synthetic-guest');
 }
 await pages[0].evaluate(async()=>{const r=await window.client.auth.signOut();if(r.error)throw Error('logout failed');});
 const after=await pages[0].evaluate(async()=>({session:(await window.client.auth.getSession()).data.session,guest:localStorage.getItem('rubato_taste_journal_v1:guest')}));assert.equal(after.session,null);assert.equal(after.guest,'synthetic-guest');
 assert.equal(await pages[1].evaluate(async()=>(await window.client.auth.getSession()).data.session.user.id),b.id);
 await pages[0].evaluate(async({email,password})=>{const r=await window.client.auth.signInWithPassword({email,password});if(r.error)throw Error('switch failed');},{email:b.email,password:b.password});
 assert.deepEqual(await pages[0].evaluate(async()=>(await window.client.from('persona_profiles').select('user_id')).data.map(x=>x.user_id)),[b.id]);
 console.log('PASS Chromium real SDK session persistence after reload, isolated browser contexts, logout and A-to-B switch, unchanged synthetic guest key');
 // Actual shipped app sources, unchanged HTTPS gate. Only the test proxy terminates local TLS.
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'rubato-app-'));
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',temp+'/key.pem','-out',temp+'/cert.pem','-days','1','-subj','/CN=127.0.0.1','-addext','subjectAltName=IP:127.0.0.1'],{stdio:'ignore'});
 const proxy=https.createServer({key:fs.readFileSync(temp+'/key.pem'),cert:fs.readFileSync(temp+'/cert.pem')},(req,res)=>{
  const upstream=http.request(new URL(req.url,url),{method:req.method,headers:{...req.headers,host:new URL(url).host}},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res);});
  upstream.on('error',()=>{res.writeHead(502);res.end();});req.pipe(upstream);
 });
 await new Promise(r=>proxy.listen(5443,'127.0.0.1',r));
 let app;
 try{
  const buildLog=fs.openSync(temp+'/build.log','w',0o600);
  const buildEnv={...process.env,NEXT_PUBLIC_SUPABASE_URL:'https://127.0.0.1:5443',NEXT_PUBLIC_SUPABASE_ANON_KEY:key,NEXT_PUBLIC_PERSONA_CAS_ENABLED:'true',NEXT_PUBLIC_TASTE_CLOUD_SYNC:'true',NEXT_TELEMETRY_DISABLED:'1'};
  const built=spawnSync('npm',['run','build'],{env:buildEnv,stdio:['ignore',buildLog,buildLog]});fs.closeSync(buildLog);assert.equal(built.status,0,'Actual app build failed (private local log retained only on ephemeral runner)');
  const appLog=fs.openSync(temp+'/app.log','w',0o600);
  app=spawn('npm',['run','start','--','-H','127.0.0.1','-p','3000'],{env:buildEnv,stdio:['ignore',appLog,appLog]});
  for(let i=0;i<120;i++){try{if((await fetch('http://127.0.0.1:3000/privacy')).ok)break;}catch{}await new Promise(r=>setTimeout(r,500));}
  const appContexts=[];
  async function signedIn(account){
   const context=await browser.newContext({ignoreHTTPSErrors:true});appContexts.push(context);
   await context.route('**/*',route=>{const host=new URL(route.request().url()).hostname;return ['127.0.0.1','localhost'].includes(host)?route.continue():route.abort();});
   const page=await context.newPage();await page.goto('http://127.0.0.1:3000/privacy');
   await page.addScriptTag({content:sdk.toString()});
   await page.evaluate(async({key,email,password})=>{window.testAuth=window.supabase.createClient('https://127.0.0.1:5443',key);const r=await window.testAuth.auth.signInWithPassword({email,password});if(r.error)throw Error('local session seeding failed');},{key,email:account.email,password:account.password});
   await page.goto('http://127.0.0.1:3000/daily');
   await page.locator('button[aria-controls="account-panel"]').click();
   await page.getByText(account.id,{exact:true}).waitFor();
   await page.getByRole('button',{name:'닫기 ✕',exact:true}).click();
   return page;
  }
  const alicePage=await signedIn(a);
  await alicePage.getByRole('button',{name:/이 답변 선택하기/}).first().click();
  await alicePage.getByRole('button',{name:/처음 고른 A 유지하기/}).click();
  await alicePage.locator('[data-daily-step-heading="result"]').waitFor();
  let savedRow;
  for(let i=0;i<50;i++){const result=await a.client.from('persona_profiles').select('state').eq('user_id',a.id).single();savedRow=result.data?.state;if(savedRow?.dailyShiftLog?.length===1)break;await new Promise(r=>setTimeout(r,200));}
  assert.equal(savedRow?.dailyShiftLog?.length,1,'Real UI did not persist through PersonaProvider CAS');
  const aliceSecond=await signedIn(a);await aliceSecond.locator('[data-daily-step-heading="result"]').waitFor();
  await alicePage.reload();await alicePage.locator('[data-daily-step-heading="result"]').waitFor();
  const bobPage=await signedIn(b);await bobPage.getByRole('button',{name:/이 답변 선택하기/}).first().waitFor();assert.equal(await bobPage.locator('[data-daily-step-heading="result"]').count(),0);
  // Actual app logout must restore guest state rather than carry Alice's completed daily response.
  await alicePage.locator('button[aria-controls="account-panel"]').click();await alicePage.getByRole('button',{name:'로그아웃',exact:true}).click();
  await alicePage.getByRole('button',{name:/로그인 · 내 방 저장/}).waitFor();
  await alicePage.goto('http://127.0.0.1:3000/daily');await alicePage.getByRole('button',{name:/이 답변 선택하기/}).first().waitFor();
  assert.equal(await alicePage.locator('[data-daily-step-heading="result"]').count(),0);
  // Seed Bob's genuine local session into the same context; app handles INITIAL_SESSION on reload.
  await alicePage.addScriptTag({content:sdk.toString()});
  await alicePage.evaluate(async({key,email,password})=>{const c=window.supabase.createClient('https://127.0.0.1:5443',key);const r=await c.auth.signInWithPassword({email,password});if(r.error)throw Error('local account switch failed');},{key,email:b.email,password:b.password});
  await alicePage.reload();await alicePage.locator('button[aria-controls="account-panel"]').click();await alicePage.getByText(b.id,{exact:true}).waitFor();
  await alicePage.getByRole('button',{name:'닫기 ✕',exact:true}).click();await alicePage.getByRole('button',{name:/이 답변 선택하기/}).first().waitFor();
  assert.equal(await alicePage.locator('[data-daily-step-heading="result"]').count(),0);
  const other=await b.client.from('persona_profiles').select('state').single();assert.equal(other.data?.state?.dailyShiftLog?.length||0,0);
  console.log('PASS actual Room Rubato build/PersonaProvider/UI: account restore, daily response CAS save, reload, second-context same-owner restore, other-owner isolation, UI logout to guest and same-context Bob restore');
  console.log('LIMIT: synthetic local GoTrue, not real Google OAuth or physical-device/cross-device networking');
  for(const context of appContexts)await context.close();
 }finally{app?.kill('SIGTERM');await new Promise(r=>proxy.close(r));}

}finally{await browser.close();await new Promise(r=>server.close(r));await db.end();}
