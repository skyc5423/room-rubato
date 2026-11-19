import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {emitSyntheticDiagnostics} from '../lib/diagnostics.mjs';
import {run,config} from '../lib/pilot.mjs';
import {unseal,publicFingerprint} from '../lib/backup-core.mjs';
import {fixture} from '../lib/fixture.mjs';
const now=Date.now(),keys=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
const env={BACKUP_PRODUCTION_ENABLED:'false',PILOT_SYNTHETIC_ONLY:'true',PILOT_DIAGNOSTIC_LOG:'true',PILOT_START_AT:new Date(now-1000).toISOString(),PILOT_EXPIRES_AT:new Date(now+86400000).toISOString(),PILOT_PUBLIC_KEY:keys.publicKey,PILOT_KEY_FINGERPRINT:publicFingerprint(keys.publicKey),PILOT_RECEIPT_SECRET:'receipt-secret-never-log-'.repeat(3),PILOT_RUN_SECRET:'run-secret-never-log-'.repeat(3),CRON_SECRET:'cron-secret-never-log-'.repeat(3),BLOB_READ_WRITE_TOKEN:'blob-secret-never-log-'.repeat(3),UNEXPECTED_PRIVATE_KEY:keys.privateKey};
async function setup(){const data=new Map(),store={read:async p=>data.get(p)??null,create:async(p,b)=>{if(data.has(p))return false;data.set(p,b);return true;}};const result=await run(store,config(env,now),now);return {data,store,result};}
test('opt-in Cron logs reconstruct byte-exact encrypted bundle and independent receipt',async()=>{
 const {data,store,result}=await setup(),logs=[];
 assert(await emitSyntheticDiagnostics({method:'GET',env,store,result:{...result,unexpectedSecret:env.PILOT_RUN_SECRET},now,log:s=>logs.push(s)}));
 const events=logs.map(s=>JSON.parse(s)),receipt=events[0].receipt,chunks=events.slice(1);
 assert.equal(events[0].event,'RUBATO_SYNTHETIC_PILOT_RECEIPT');
 for(const [index,c]of chunks.entries()){assert.equal(c.index,index);assert.equal(c.count,chunks.length);assert(c.data.length<=1500);assert.equal(c.bundleDigest,result.bundleDigest);}
 const raw=Buffer.from(chunks.map(c=>c.data).join(''),'base64');assert.deepEqual(raw,data.get(`synthetic-pilot/${result.day}/archive.json`));
 const b=JSON.parse(raw);assert.deepEqual(unseal(Buffer.from(b.archive,'base64'),keys.privateKey,b.fingerprint,receipt.archiveDigest),fixture(result.day));
 for(const secret of [env.PILOT_RUN_SECRET,env.PILOT_RECEIPT_SECRET,env.CRON_SECRET,env.BLOB_READ_WRITE_TOKEN,keys.privateKey,'SYNTHETIC ONLY'])assert(!logs.join('\n').includes(secret));
});
test('manual calls, opt-out, nonverified results never emit artifacts',async()=>{const {store,result}=await setup();for(const change of [{method:'POST'},{env:{...env,PILOT_DIAGNOSTIC_LOG:'false'}},{result:{status:'failed'}}]){const logs=[];assert.equal(await emitSyntheticDiagnostics({method:'GET',env,store,result,now,...change,log:s=>logs.push(s)}),false);assert.equal(logs.length,0);}});
test('unsafe gates, tamper and read errors emit only a fixed sanitized marker',async()=>{const {store,result}=await setup();for(const change of [{env:{...env,BACKUP_PRODUCTION_ENABLED:'true'}},{result:{...result,bundleDigest:'0'.repeat(64)}},{store:{read:async()=>{throw Error(env.PILOT_RUN_SECRET+keys.privateKey);}}}]){const logs=[];assert.equal(await emitSyntheticDiagnostics({method:'GET',env,store,result,now,...change,log:s=>logs.push(s)}),false);assert.deepEqual(logs.map(JSON.parse),[{event:'RUBATO_SYNTHETIC_PILOT_DIAGNOSTIC_FAILED',synthetic:true,errorCode:'EVIDENCE_UNAVAILABLE'}]);}});
test('logging transport failure does not throw or alter archive result',async()=>{const {store,result}=await setup();assert.equal(await emitSyntheticDiagnostics({method:'GET',env,store,result,now,log:()=>{throw Error('logger unavailable');}}),false);assert.equal(result.status,'verified');});
