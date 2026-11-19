import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {createStore,MAX_OBJECT} from '../lib/store.mjs';
import {publicFingerprint} from '../lib/backup-core.mjs';
const key=()=>generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'}}).publicKey;
const first=key(),second=key();
const envFor=publicKey=>({BLOB_READ_WRITE_TOKEN:'synthetic-token-only',PILOT_PUBLIC_KEY:publicKey,PILOT_KEY_FINGERPRINT:publicFingerprint(publicKey)});
const env=envFor(first),logical='synthetic-pilot/2026-11-18/archive.json';
const physical=(e,name='archive')=>`synthetic-pilot-keys/${e.PILOT_KEY_FINGERPRINT}/2026-11-18/${name}.json`;
function adapter(){const data=new Map(),calls=[];return {data,calls,async get(p,o){calls.push(['get',p,o]);const b=data.get(p);return b?{statusCode:200,stream:(async function*(){yield b;})()}:null;},async put(p,b,o){calls.push(['put',p,o]);assert.equal(o.allowOverwrite,false);if(data.has(p))throw Error('exists');data.set(p,Buffer.from(b));}};}
test('all logical paths map exclusively to the configured key namespace',async()=>{
 const blob=adapter(),s=createStore({env,blob});
 for(const name of ['archive','scheduled','attempt-1','attempt-2','attempt-3','result-1','result-2','result-3']){
  const p=`synthetic-pilot/2026-11-18/${name}.json`;assert.equal(await s.create(p,Buffer.from(name)),true);assert.equal((await s.read(p)).toString(),name);assert(blob.data.has(physical(env,name)));
 }
 for(const [,p,o] of blob.calls){assert(p.startsWith(`synthetic-pilot-keys/${env.PILOT_KEY_FINGERPRINT}/`));assert.equal(o.access,'private');assert.equal(o.token,env.BLOB_READ_WRITE_TOKEN);if(o.useCache!==undefined)assert.equal(o.useCache,false);else assert.equal(o.addRandomSuffix,false);}
});
test('same-day key switch preserves legacy and prior-key archives without fallback',async()=>{
 const blob=adapter(),old=Buffer.from('legacy archive');blob.data.set(logical,old);
 const a=createStore({env,blob}),envB=envFor(second),b=createStore({env:envB,blob});
 assert.equal(await a.read(logical),null);assert.equal(await a.create(logical,Buffer.from('first-key')),true);
 assert.equal(await b.read(logical),null);assert.equal(await b.create(logical,Buffer.from('second-key')),true);
 assert.equal((await a.read(logical)).toString(),'first-key');assert.equal((await b.read(logical)).toString(),'second-key');assert.equal(blob.data.get(logical),old);
 assert.equal(await a.create(logical,Buffer.from('must-not-overwrite')),false);assert.equal((await a.read(logical)).toString(),'first-key');
 assert(blob.calls.every(([,p])=>p!==logical));
});
test('missing token/key malformed fingerprint and key mismatch fail before SDK use',()=>{
 const blob=adapter();for(const patch of [{BLOB_READ_WRITE_TOKEN:undefined},{BLOB_READ_WRITE_TOKEN:' '},{PILOT_PUBLIC_KEY:undefined},{PILOT_PUBLIC_KEY:'invalid'},{PILOT_KEY_FINGERPRINT:undefined},{PILOT_KEY_FINGERPRINT:'A'.repeat(64)},{PILOT_KEY_FINGERPRINT:'a'.repeat(64)},{PILOT_KEY_FINGERPRINT:'../escape'}])assert.throws(()=>createStore({env:{...env,...patch},blob}));assert.equal(blob.calls.length,0);
});
test('traversal URLs physical paths extra suffixes and impossible dates are denied',async()=>{
 const blob=adapter(),s=createStore({env,blob});for(const p of [null,{},'../archive.json',logical+'/extra',logical+'?x=1',logical+'\n',logical.replace('2026-11-18','2026-02-30'),logical.replace('/archive','/../archive'),physical(env),'https://example.com/'+logical,logical.replace('/archive','/%2e%2e/archive')]){await assert.rejects(s.read(p));await assert.rejects(s.create(p,Buffer.from('x')));}assert.equal(blob.calls.length,0);
});
test('uncertain create checks only the same key namespace and never overwrites',async()=>{
 const blob=adapter(),put=blob.put.bind(blob);blob.put=async(...args)=>{await put(...args);throw Error('lost ack');};const s=createStore({env,blob});assert.equal(await s.create(logical,Buffer.from('once')),false);assert.equal((await s.read(logical)).toString(),'once');assert(blob.calls.every(([,p])=>p===physical(env)));
});
test('unoccupied network failures and non-200 origin reads fail closed',async()=>{
 const blob=adapter();blob.put=async()=>{throw Error('network');};const s=createStore({env,blob});await assert.rejects(s.create(logical,Buffer.from('x')),/network/);blob.get=async()=>({statusCode:503});await assert.rejects(s.read(logical),/Origin read failed/);
});
test('object-size bounds and byte-type checks apply before writes and during reads',async()=>{
 const blob=adapter(),s=createStore({env,blob});await assert.rejects(s.create(logical,Buffer.alloc(MAX_OBJECT+1)));await assert.rejects(s.create(logical,{length:1}));assert.equal(blob.calls.length,0);blob.get=async()=>({statusCode:200,stream:(async function*(){yield Buffer.alloc(MAX_OBJECT);yield Buffer.from('x');})()});await assert.rejects(s.read(logical),/Object too large/);
});
test('unchanged pilot engine can run two keys on the same day without touching old objects',async()=>{
 const {run,status}=await import('../lib/pilot.mjs');const blob=adapter();const envB=envFor(second);
 const a=createStore({env,blob}),b=createStore({env:envB,blob}),now=Date.parse('2026-11-18T12:00:00.000Z');
 const cfg=e=>({publicKey:e.PILOT_PUBLIC_KEY,fingerprint:e.PILOT_KEY_FINGERPRINT,secret:'synthetic-receipt-secret'.repeat(3)});
 const old=Buffer.from('untouched legacy');blob.data.set(logical,old);
 assert.equal((await run(a,cfg(env),now)).status,'verified');
 const prior=new Map([...blob.data].map(([p,v])=>[p,Buffer.from(v)]));
 assert.equal((await run(b,cfg(envB),now)).status,'verified');
 for(const [p,v]of prior)assert.deepEqual(blob.data.get(p),v);
 assert.equal((await status(a,cfg(env),now)).status,'fresh');assert.equal((await status(b,cfg(envB),now)).status,'fresh');
 assert.equal(blob.data.size,7); // legacy + archive/attempt/result for each key
});
