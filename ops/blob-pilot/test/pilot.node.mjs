import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {run,status,config,authenticated,checkBundle,recordScheduled} from '../lib/pilot.mjs';
import {unseal,sha256,publicFingerprint} from '../lib/backup-core.mjs';
import {fixture} from '../lib/fixture.mjs';
const rsa=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
const now=Date.now(),day=new Date(now).toISOString().slice(0,10),cfg={publicKey:rsa.publicKey,fingerprint:publicFingerprint(rsa.publicKey),secret:'test-only-'.repeat(8)};
function memory(){const data=new Map();return {data,read:async p=>data.get(p)??null,create:async(p,b)=>{if(data.has(p))return false;data.set(p,b);return true;}};}
test('synthetic encrypt upload origin readback, independent decrypt, deterministic contents',async()=>{
 const store=memory(),r=await run(store,cfg,now);assert.equal(r.status,'verified');assert.equal(r.restoreVerified,false);
 const raw=store.data.get(`synthetic-pilot/${day}/archive.json`),b=checkBundle(raw,day,cfg);
 assert(!raw.includes('SYNTHETIC ONLY'));assert.equal(sha256(raw),r.bundleDigest);
 assert.deepEqual(unseal(Buffer.from(b.archive,'base64'),rsa.privateKey,cfg.fingerprint,r.archiveDigest),fixture(day));
 assert.equal((await status(store,cfg,now)).status,'fresh');
 assert.equal((await status(store,cfg,now+28*3600000)).status,'missed-or-unverified');
 const n=store.data.size;assert.equal((await run(store,cfg,now)).idempotent,true);assert.equal(store.data.size,n);
});
test('concurrent same-day runs claim only one attempt',async()=>{const s=memory(),results=await Promise.all([run(s,cfg,now),run(s,cfg,now)]);assert.equal(results.filter(r=>r.status==='verified').length,1);assert.equal(results.filter(r=>r.status==='in-progress').length,1);assert.equal(s.data.size,3);});
test('failure durable without secret exception text; bounded retries',async()=>{
 const s=memory(),read=s.read;s.read=async p=>{if(p.endsWith('/archive.json'))throw Error('secret-sensitive-example');return read(p);};
 for(let n=1;n<=3;n++)assert.equal((await run(s,cfg,now)).status,'failed');
 assert.equal((await run(s,cfg,now)).status,'retry-exhausted');assert.equal(s.data.size,6);
 assert(![...s.data.values()].some(b=>b.includes('secret-sensitive-example')));
});
test('uncertain archive upload can be resumed without overwrite',async()=>{
 const s=memory(),create=s.create;let lost=false;s.create=async(p,b)=>{const result=await create(p,b);if(p.endsWith('/archive.json')&&!lost){lost=true;throw Error('lost ack');}return result;};
 assert.equal((await run(s,cfg,now)).status,'failed');const raw=s.data.get(`synthetic-pilot/${day}/archive.json`);
 assert.equal((await run(s,cfg,now)).status,'verified');assert.equal(s.data.get(`synthetic-pilot/${day}/archive.json`),raw);
});
test('tampered archive never marks verified',async()=>{const s=memory();s.data.set(`synthetic-pilot/${day}/archive.json`,Buffer.from('{}'));assert.equal((await run(s,cfg,now)).status,'failed');});
test('missing receipt readback prevents successful return',async()=>{const s=memory(),read=s.read;s.read=async p=>p.includes('result-')?null:read(p);await assert.rejects(run(s,cfg,now),/Receipt readback failed/);});
test('expired running lease allows bounded recovery',async()=>{const s=memory(),create=s.create;s.create=async(p,b)=>{if(p.endsWith('/archive.json'))throw Error('fail');return create(p,b);};await run(s,cfg,now);s.data.delete(`synthetic-pilot/${day}/result-1.json`);assert.equal((await run(s,cfg,now+1000)).status,'in-progress');assert.equal((await run(s,cfg,now+301000)).attempt,2);});
test('authentication denies missing, short or wrong credentials',()=>{assert(!authenticated(undefined,undefined));assert(!authenticated('Bearer x','x'));assert(!authenticated('Bearer wrong','a'.repeat(32)));assert(authenticated('Bearer '+'a'.repeat(32),'a'.repeat(32)));});
test('production export enable, missing synthetic gate, invalid or long window all rejected',()=>{
 const env={BACKUP_PRODUCTION_ENABLED:'false',PILOT_SYNTHETIC_ONLY:'true',PILOT_START_AT:new Date(now-1000).toISOString(),PILOT_EXPIRES_AT:new Date(now+86400000).toISOString(),PILOT_PUBLIC_KEY:rsa.publicKey,PILOT_KEY_FINGERPRINT:cfg.fingerprint,PILOT_RECEIPT_SECRET:cfg.secret};
 assert.equal(config(env,now).fingerprint,cfg.fingerprint);
 for(const extra of [{VERCEL:'1',VERCEL_PROJECT_ID:'wrong',VERCEL_ENV:'production'},{VERCEL:'1',VERCEL_PROJECT_ID:'prj_TO6prOB9hvCt8wTFK4IaOTu27ZAF',VERCEL_ENV:'preview'},{BACKUP_PRODUCTION_ENABLED:'true'},{PILOT_SYNTHETIC_ONLY:'false'},{PILOT_START_AT:'bad'},{PILOT_EXPIRES_AT:new Date(now+32*86400000).toISOString()},{PILOT_EXPIRES_AT:new Date(now-1000).toISOString()}])assert.throws(()=>config({...env,...extra},now));
});
test('packaged crypto core identical to repository reviewed core',async()=>{assert.equal(await readFile(new URL('../lib/backup-core.mjs',import.meta.url),'utf8'),await readFile(new URL('../../../scripts/backup/core.mjs',import.meta.url),'utf8'));});

test('deleted archive invalidates idempotent run and freshness',async()=>{const s=memory();await run(s,cfg,now);s.data.delete(`synthetic-pilot/${day}/archive.json`);await assert.rejects(run(s,cfg,now),/archive unavailable/);assert.equal((await status(s,cfg,now)).status,'missed-or-unverified');});
test('cron trigger receipt independent of earlier manual success and bounded',async()=>{const s=memory();await run(s,cfg,now);assert.equal((await status(s,cfg,now)).lastScheduledInvocationAt,null);await recordScheduled(s,cfg,now+1000);await recordScheduled(s,cfg,now+2000);const r=await status(s,cfg,now+2000);assert.equal(r.lastScheduledInvocationAt,new Date(now+1000).toISOString());assert.equal(s.data.size,4);});
test('expiry blocks writing but preserves authenticated offline retrieval configuration',()=>{const env={BACKUP_PRODUCTION_ENABLED:'false',PILOT_SYNTHETIC_ONLY:'true',PILOT_START_AT:new Date(now-2000).toISOString(),PILOT_EXPIRES_AT:new Date(now-1000).toISOString(),PILOT_PUBLIC_KEY:rsa.publicKey,PILOT_KEY_FINGERPRINT:cfg.fingerprint,PILOT_RECEIPT_SECRET:cfg.secret};assert.throws(()=>config(env,now));assert.equal(config(env,now,true).fingerprint,cfg.fingerprint);});
