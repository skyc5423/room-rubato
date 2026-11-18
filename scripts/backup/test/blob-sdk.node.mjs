/** Pinned-SDK transport contract, with every real network destination disabled. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {readFileSync} from 'node:fs';
import undici from '../../../ops/blob-pilot/node_modules/undici/index.js';
import {assertAppBlobRuntime,createAppBlobStore,BLOB_TARGET} from '../blob-store.mjs';
import {PROJECT,publicFingerprint} from '../core.mjs';

const token='vercel_blob_rw_C1xbVeoXtowulKQG_synthetic_only_no_real_credential';
const storeHost='https://c1xbveoxtowulkqg.private.blob.vercel-storage.com';
const {publicKey}=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{format:'pem',type:'spki'}});
const fingerprint=publicFingerprint(publicKey);
const path=`app-data-v1/${fingerprint}/2026-11-18/11111111-1111-4111-8111-111111111111.rrb`;
const key=`${BLOB_TARGET.prefix}/${path}`;
const config={enabled:true,mode:'app-data-candidate',sourceProject:PROJECT,destination:BLOB_TARGET,publicKey,keyFingerprint:fingerprint};
const header=(headers,name)=>new Headers(headers).get(name);

test('actual pinned SDK uses explicit private token and zero transport retries', {timeout:10000}, async t=>{
 const envKeys=['VERCEL_BLOB_RETRIES','BLOB_READ_WRITE_TOKEN','BLOB_STORE_ID','VERCEL_OIDC_TOKEN'];
 const previous=Object.fromEntries(envKeys.map(k=>[k,process.env[k]]));
 const previousDispatcher=undici.getGlobalDispatcher();
 const network=new undici.MockAgent();network.disableNetConnect();
 undici.setGlobalDispatcher(network);
 try{
  process.env.VERCEL_BLOB_RETRIES='0';
  process.env.BLOB_READ_WRITE_TOKEN='vercel_blob_rw_WrongStore_synthetic_wrong_credential';
  process.env.BLOB_STORE_ID='store_WrongStore';
  process.env.VERCEL_OIDC_TOKEN='synthetic-oidc-never-use';
  assertAppBlobRuntime(); // Must precede SDK import, including captured debug settings.
  assert.equal(JSON.parse(readFileSync(new URL('../../../ops/blob-pilot/node_modules/@vercel/blob/package.json',import.meta.url),'utf8')).version,'2.9.0');
  const sdk=await import('../../../ops/blob-pilot/node_modules/@vercel/blob/dist/index.js');
  const store=createAppBlobStore({config,token,blob:sdk});
  await t.test('private create-only PUT and cache-bypassing GET bind the explicit token store',async()=>{
   const payload=Buffer.from('synthetic sealed fixture');let putRequest,getRequest;
   network.get('https://vercel.com').intercept({path:`/api/blob/?${new URLSearchParams({pathname:key})}`,method:'PUT'}).reply(options=>{
    putRequest=options;
    return {statusCode:200,data:JSON.stringify({pathname:key,url:`${storeHost}/${key}`,downloadUrl:`${storeHost}/${key}?download=1`,contentType:'application/octet-stream',contentDisposition:'attachment',etag:'synthetic'}),responseOptions:{headers:{'content-type':'application/json'}}};
   });
   network.get(storeHost).intercept({path:`/${key}?cache=0`,method:'GET'}).reply(options=>{
    getRequest=options;return {statusCode:200,data:payload,responseOptions:{headers:{'content-type':'application/octet-stream','content-length':String(payload.length)}}};
   });
   assert.equal(await store.create(path,payload),true);
   assert.deepEqual(await store.read(path),payload);
   assert.equal(header(putRequest.headers,'authorization'),`Bearer ${token}`);
   assert.equal(header(getRequest.headers,'authorization'),`Bearer ${token}`);
   assert.equal(header(putRequest.headers,'x-vercel-blob-store-id'),'C1xbVeoXtowulKQG');
   assert.equal(header(putRequest.headers,'x-vercel-blob-access'),'private');
   assert.equal(header(putRequest.headers,'x-add-random-suffix'),'0');
   assert.equal(header(putRequest.headers,'x-allow-overwrite'),'0');
   assert.equal(header(putRequest.headers,'x-api-version'),'13');
   assert.deepEqual(Buffer.from(putRequest.body),payload);
   network.assertNoPendingInterceptors();
  });
  await t.test('retryable SDK service error makes one PUT, then one reconciliation GET',async()=>{
   let puts=0,gets=0;
   network.get('https://vercel.com').intercept({path:`/api/blob/?${new URLSearchParams({pathname:key})}`,method:'PUT'}).reply(()=>{
    puts++;return {statusCode:503,data:JSON.stringify({error:{code:'service_unavailable',message:'synthetic failure'}}),responseOptions:{headers:{'content-type':'application/json'}}};
   }).persist();
   network.get(storeHost).intercept({path:`/${key}?cache=0`,method:'GET'}).reply(()=>{gets++;return {statusCode:404,data:''};}).persist();
   await assert.rejects(store.create(path,Buffer.from('synthetic candidate')),e=>e.message==='BLOB_CREATE_UNCONFIRMED');
   assert.equal(puts,1);assert.equal(gets,1);
  });
 }finally{
  undici.setGlobalDispatcher(previousDispatcher);await network.close();
  for(const k of envKeys){if(previous[k]===undefined)delete process.env[k];else process.env[k]=previous[k];}
 }
});
