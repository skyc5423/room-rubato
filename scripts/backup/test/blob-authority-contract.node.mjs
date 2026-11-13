// NON-PRODUCTION contract model, not a Vercel SDK integration or durability test.
// No SDK dependency, credentials, store creation, HTTP, or real records.
// No deletion executor, delayed in-flight commit, generation fencing, archive, or access-control model.
import test from 'node:test';import assert from 'node:assert/strict';import {generateKeyPairSync,randomUUID} from 'node:crypto';
import {initialDeletionJournal,advanceDeletionJournal,journalCheckpoint,inspectDeletionJournal,refreshDeletionJournal} from '../deletion-journal.mjs';
const key=generateKeyPairSync('ed25519',{publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}}),now=Date.now();
const fresh=()=>initialDeletionJournal(randomUUID(),key.privateKey,now);
function model(initial) {
 let current=initial,cached=initial,version=randomUUID(),cachedVersion=version,writes=0,mode='normal';
 return {
  get writes(){return writes;},set mode(value){mode=value;},
  async get(path,options){assert.equal(path,'authority/head.json');assert.equal(options.access,'private');if(mode==='unavailable')throw new Error('unavailable');if(mode==='missing')return null;return {journal:structuredClone(options.useCache===false?current:cached),etag:String(options.useCache===false?version:cachedVersion)};},
  async put(path,journal,options){assert.equal(path,'authority/head.json');assert.equal(options.access,'private');assert.equal(options.allowOverwrite,true);assert.equal(options.addRandomSuffix,false);assert.equal(options.ttlDays,undefined);writes++;if(mode==='quota')throw new Error('quota');if(mode==='lost-before')throw new Error('unknown');if(options.ifMatch!==String(version))throw new Error('precondition');current=structuredClone(journal);version=randomUUID();if(mode==='lost-after')throw new Error('unknown');return {etag:String(version)};}
 };
}
const read=async store=>{const value=await store.get('authority/head.json',{access:'private',useCache:false});assert(value,'Missing authority must block');return value;};
const put=(store,head,journal)=>store.put('authority/head.json',journal,{access:'private',allowOverwrite:true,addRandomSuffix:false,ifMatch:head.etag});
const prepare=j=>advanceDeletionJournal(j,key.publicKey,journalCheckpoint(j),{requestId:randomUUID(),userId:randomUUID(),action:'prepare'},key.privateKey,now).journal;
test('cached coherent old head can hide pending deletion; consistent-read contract prevents it',async()=>{
 const j=fresh(),store=model(j),head=await read(store),next=prepare(j);await put(store,head,next);
 const stale=await store.get('authority/head.json',{access:'private'});assert.equal(inspectDeletionJournal(stale.journal,key.publicKey,journalCheckpoint(stale.journal),now).pendingUsers.length,0);
 const latest=await read(store);assert.equal(inspectDeletionJournal(latest.journal,key.publicKey,journalCheckpoint(latest.journal),now).pendingUsers.length,1);
});
test('conditional writes reject a competing old-head publisher without last-write-wins',async()=>{
 const j=fresh(),store=model(j),one=await read(store),two=await read(store);await put(store,one,prepare(j));await assert.rejects(()=>put(store,two,prepare(j)),/precondition/);
});
test('lost acknowledgment after commit is reconciled by uncached read, never blind retry',async()=>{
 const j=fresh(),store=model(j),head=await read(store),next=prepare(j);store.mode='lost-after';await assert.rejects(()=>put(store,head,next),/unknown/);store.mode='normal';const current=await read(store);assert.equal(journalCheckpoint(current.journal).digest,journalCheckpoint(next).digest);assert.equal(store.writes,1);
});
test('lost acknowledgment before commit leaves the observed head unchanged in this model',async()=>{
 const j=fresh(),store=model(j),head=await read(store);store.mode='lost-before';await assert.rejects(()=>put(store,head,prepare(j)),/unknown/);store.mode='normal';assert.equal(journalCheckpoint((await read(store)).journal).digest,journalCheckpoint(j).digest);assert.equal(store.writes,1);
});
test('quota exhaustion, missing authority and outage fail closed without replacement',async()=>{
 const j=fresh(),store=model(j),head=await read(store);store.mode='quota';await assert.rejects(()=>put(store,head,prepare(j)),/quota/);
 for(const mode of ['missing','unavailable']){store.mode=mode;await assert.rejects(()=>read(store));}
 store.mode='normal';assert.equal(journalCheckpoint((await read(store)).journal).digest,journalCheckpoint(j).digest);
});
test('on-demand refresh preserves intent without continuous heartbeat writes',async()=>{
 const j=prepare(fresh()),store=model(j),later=now+86400000;assert.throws(()=>inspectDeletionJournal(j,key.publicKey,journalCheckpoint(j),later),/fresh/);
 const current=await read(store),renewed=refreshDeletionJournal(current.journal,key.publicKey,journalCheckpoint(current.journal),key.privateKey,later);
 await put(store,current,renewed.journal);const saved=await read(store);assert.equal(inspectDeletionJournal(saved.journal,key.publicKey,journalCheckpoint(saved.journal),later).pendingUsers.length,1);assert.equal(store.writes,1);assert.equal(renewed.publicationAuthorized,false);
});
test('five-minute background heartbeat budget is not compatible with a small free write allowance',()=>{
 const writesPer30Days=30*24*60/5;assert.equal(writesPer30Days,8640);assert(writesPer30Days>2000);
 // This arithmetic is not current account usage or a billing guarantee.
});
