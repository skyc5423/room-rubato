import test from 'node:test';import assert from 'node:assert/strict';
import {createBlobBackupHandler} from '../blob-runtime.mjs';
const cron='synthetic-cron-'.repeat(4),manual='synthetic-manual-'.repeat(4);
const runtime={VERCEL:'1',VERCEL_PROJECT_ID:'prj_TO6prOB9hvCt8wTFK4IaOTu27ZAF',VERCEL_ENV:'production',BACKUP_PRODUCTION_ENABLED:'true',BACKUP_TARGET_STORE_PRIVATE_CONFIRMED:'true'};
const config={enabled:true,mode:'app-data-candidate'};
const req=(method='POST',secret=manual,path='/api/app-backup',body)=>new Request('https://writer.invalid'+path,{method,headers:{authorization:'Bearer '+secret},...(body?{body}: {})});
function harness(patch={}){let sources=0,stores=0;return {get sources(){return sources},get stores(){return stores},handle:createBlobBackupHandler({runtime,config,cronSecret:cron,manualSecret:manual,createSource(){sources++;throw Error('PRIVATE CREDENTIAL')},createStore(){stores++;throw Error('PRIVATE CREDENTIAL')},...patch})};}
test('inactive by default and wrong runtime/diagnostics never construct adapters',async()=>{
 const empty=await createBlobBackupHandler()(req());assert.equal(empty.status,503);
 for(const r of [{},{...runtime,VERCEL:'0'},{...runtime,VERCEL_PROJECT_ID:'app-project'},{...runtime,VERCEL_ENV:'preview'},{...runtime,BACKUP_PRODUCTION_ENABLED:'false'},{...runtime,BACKUP_TARGET_STORE_PRIVATE_CONFIRMED:'false'},{...runtime,PILOT_DIAGNOSTIC_LOG:'true'},{...runtime,BACKUP_DIAGNOSTIC_LOG:'true'}]){const h=harness({runtime:r});assert.equal((await h.handle(req())).status,503);assert.equal(h.sources+h.stores,0);}
});
test('separate GET Cron and POST manual auth, malformed/weak secrets rejected before adapters',async()=>{
 for(const [method,secret] of [['GET',manual],['POST',cron],['POST',''],['GET',cron+'x']]){const h=harness();assert.equal((await h.handle(req(method,secret))).status,401);assert.equal(h.sources+h.stores,0);}
 for(const pair of [{cronSecret:manual},{manualSecret:'short'},{cronSecret:'x'.repeat(300)}]){const h=harness(pair);assert.equal((await h.handle(req())).status,503);assert.equal(h.sources+h.stores,0);}
});
test('method/path/query/body cannot inject a source or target',async()=>{
 for(const [request,status]of [[req('PUT'),405],[req('POST',manual,'/other'),400],[req('POST',manual,'/api/app-backup?target=other'),400],[req('POST',manual,'/api/app-backup','{"credentials":"secret"}'),400]]){const h=harness();assert.equal((await h.handle(request)).status,status);assert.equal(h.sources+h.stores,0);}
});
test('authorized adapter failures are sanitized and responses never cached',async()=>{
 for(const [method,secret]of [['POST',manual],['GET',cron]]){const h=harness(),response=await h.handle(req(method,secret));assert.equal(response.status,503);assert.equal(h.stores,1);assert.equal(h.sources,0);assert.equal(response.headers.get('cache-control'),'no-store');assert(!JSON.stringify(await response.json()).includes('PRIVATE'));}
});
test('snapshot config cannot be enabled later and in-flight calls cannot duplicate one instance',async()=>{
 const flags={...runtime,BACKUP_PRODUCTION_ENABLED:'false'},h=harness({runtime:flags});flags.BACKUP_PRODUCTION_ENABLED='true';assert.equal((await h.handle(req())).status,503);
 let release;const wait=new Promise(resolve=>{release=resolve});let calls=0;const active=harness({async createStore(){calls++;await wait;throw Error('private')}});const first=active.handle(req());await Promise.resolve();assert.equal((await active.handle(req())).status,409);assert.equal(calls,1);release();assert.equal((await first).status,503);assert.equal((await active.handle(req())).status,503);assert.equal(calls,2);
});

test('response timeout keeps the instance locked until the underlying outcome settles',async()=>{
 let release;const pending=new Promise(resolve=>{release=resolve});let calls=0;
 const h=harness({requestTimeoutMs:10,async createStore(){calls++;await pending;throw Error('private')}});
 const response=await h.handle(req());assert.equal(response.status,503);assert.equal((await response.json()).code,'BACKUP_OUTCOME_UNCONFIRMED');
 assert.equal((await h.handle(req())).status,409);assert.equal(calls,1);release();await new Promise(resolve=>setImmediate(resolve));
 assert.equal((await h.handle(req())).status,503);assert.equal(calls,2);
});
