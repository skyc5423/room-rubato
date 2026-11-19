// Local ephemeral Supabase only. Never logs credentials, tokens, rows or browser storage.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import http from 'node:http';
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
 console.log('LIMIT: SDK harness, not app PersonaProvider integration, Google OAuth, hosted settings or physical-device verification');
}finally{await browser.close();await new Promise(r=>server.close(r));await db.end();}
