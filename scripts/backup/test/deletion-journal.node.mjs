import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,randomUUID,sign} from 'node:crypto';
import {PROJECT,FORMAT,canonical,ledgerDigest,sha256} from '../core.mjs';
import {initialDeletionJournal,journalCheckpoint,inspectDeletionJournal,advanceDeletionJournal,refreshDeletionJournal,reconcileDeletionForRestore,reconciledRestorePlan} from '../deletion-journal.mjs';
const signer=generateKeyPairSync('ed25519',{publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
const now=Date.now(),a='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',b='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',requestId='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const initial=()=>initialDeletionJournal(randomUUID(),signer.privateKey,now);
const step=(j,action,userId=a,id=requestId,at=now)=>advanceDeletionJournal(j,signer.publicKey,journalCheckpoint(j),{requestId:id,userId,action},signer.privateKey,at).journal;
function ledger(ids=[]) {let previous='0'.repeat(64);const events=ids.map((userId,i)=>{const event={sequence:i+1,userId,deletedAt:new Date(now).toISOString(),previous};previous=sha256(canonical(event));return event;});const body={project:PROJECT,epoch:randomUUID(),sequence:events.length,observedAt:new Date(now).toISOString(),events};return {...body,signature:sign(null,Buffer.from(canonical(body)),signer.privateKey).toString('base64')};}
const cp=l=>({epoch:l.epoch,sequence:l.sequence,digest:ledgerDigest(l)});
const reconcile=(j,l=ledger())=>reconcileDeletionForRestore(j,signer.publicKey,journalCheckpoint(j),l,cp(l),now);
test('empty signed journal reconciles only with independently checkpointed empty ledger',()=>{assert.equal(reconcile(initial()).applicationAuthorized,false);});
test('prepare is durable protocol intent: pending blocks restore even with empty ledger',()=>assert.throws(()=>reconcile(step(initial(),'prepare')),/Unresolved/));
test('confirmed deletion must match ledger and cannot resurrect by an empty ledger',()=>{const j=step(step(initial(),'prepare'),'confirm-deleted');assert.throws(()=>reconcile(j),/disagree/);assert.deepEqual(reconcile(j,ledger([a])).deletedUsers,[a]);});
test('verified non-deletion resolves pending without adding a tombstone',()=>assert.deepEqual(reconcile(step(step(initial(),'prepare'),'confirm-not-deleted')).deletedUsers,[]));
test('timeout is not a resolution action',()=>assert.throws(()=>step(step(initial(),'prepare'),'timeout')));
test('missing prepare, wrong owner, duplicate completion and new request for deleted owner refused',()=>{assert.throws(()=>step(initial(),'confirm-deleted'));let j=step(initial(),'prepare');assert.throws(()=>step(j,'confirm-deleted',b));j=step(j,'confirm-deleted');assert.throws(()=>step(j,'confirm-deleted'));assert.throws(()=>step(j,'prepare',a,randomUUID()));});
test('duplicate pending request and same-owner parallel request refused',()=>{const j=step(initial(),'prepare');assert.throws(()=>step(j,'prepare'));assert.throws(()=>step(j,'prepare',a,randomUUID()));});
test('stale checkpoint refuses competing publisher candidate',()=>{const j=initial(),next=step(j,'prepare');assert.throws(()=>advanceDeletionJournal(next,signer.publicKey,journalCheckpoint(j),{requestId:randomUUID(),userId:b,action:'prepare'},signer.privateKey,now),/checkpoint/);});
test('tamper and different signer refused',()=>{let j=initial();j.project='other';assert.throws(()=>inspectDeletionJournal(j,signer.publicKey,journalCheckpoint(j),now));j=initial();const other=generateKeyPairSync('ed25519');assert.throws(()=>advanceDeletionJournal(j,signer.publicKey,journalCheckpoint(j),{requestId,userId:a,action:'prepare'},other.privateKey,now));j.signature='A'.repeat(86)+'==';assert.throws(()=>inspectDeletionJournal(j,signer.publicKey,journalCheckpoint(j),now));});
test('stale journal fails restore; heartbeat preserves pending intent and CAS precondition',()=>{const j=step(initial(),'prepare'),later=now+400000;assert.throws(()=>inspectDeletionJournal(j,signer.publicKey,journalCheckpoint(j),later),/fresh/);const r=refreshDeletionJournal(j,signer.publicKey,journalCheckpoint(j),signer.privateKey,later);assert.equal(r.publicationAuthorized,false);assert.deepEqual(inspectDeletionJournal(r.journal,signer.publicKey,r.nextCheckpoint,later).pendingUsers,[a]);assert.deepEqual(r.expectedPreviousCheckpoint,journalCheckpoint(j));});
test('future heartbeat and replay to wrong checkpoint refused',()=>{const j=initial();assert.throws(()=>refreshDeletionJournal(j,signer.publicKey,journalCheckpoint(j),signer.privateKey,now-1));const next=step(j,'prepare');assert.throws(()=>refreshDeletionJournal(j,signer.publicKey,journalCheckpoint(next),signer.privateKey,now+1));});
test('no mutation of input journal and candidate never claims publication',()=>{const j=initial(),before=JSON.stringify(j),r=advanceDeletionJournal(j,signer.publicKey,journalCheckpoint(j),{requestId,userId:a,action:'prepare'},signer.privateKey,now);assert.equal(JSON.stringify(j),before);assert.equal(r.publicationAuthorized,false);});

test('integrated restore planner excludes deleted owner, binds journal, and refuses pending/missing journal',()=>{
 const stamp=new Date(now).toISOString();
 const snapshot={format:FORMAT,project:PROJECT,snapshotId:randomUUID(),capturedAt:stamp,tables:{persona_profiles:[],taste_journals:[a,b].map(user_id=>({user_id,state:{synthetic:true},revision:randomUUID(),last_write_id:null,updated_at:stamp}))}};
 const ownerBody={project:PROJECT,observedAt:stamp,owners:[a,b]};const owners={...ownerBody,signature:sign(null,Buffer.from(canonical(ownerBody)),signer.privateKey).toString('base64')};
 const pending=step(initial(),'prepare'),j=step(pending,'confirm-deleted'),l=ledger([a]);
 const plan=reconciledRestorePlan(snapshot,j,signer.publicKey,journalCheckpoint(j),l,cp(l),owners,now);
 assert.deepEqual(plan.tables.taste_journals.map(r=>r.user_id),[b]);assert.equal(plan.applicationAuthorized,false);assert.equal(plan.journalDigest,journalCheckpoint(j).digest);
 assert.throws(()=>reconciledRestorePlan(snapshot,pending,signer.publicKey,journalCheckpoint(pending),l,cp(l),owners,now),/Unresolved/);
 assert.throws(()=>reconciledRestorePlan(snapshot,null,signer.publicKey,null,l,cp(l),owners,now));
});

test('uppercase identity aliases are rejected instead of bypassing tombstones',()=>{
 const j=step(initial(),'prepare');assert.throws(()=>step(j,'prepare',a.toUpperCase(),randomUUID()));
 assert.throws(()=>step(j,'confirm-deleted',a,requestId.toUpperCase()));
 const done=step(j,'confirm-deleted');assert.throws(()=>reconcile(done,ledger([a.toUpperCase()])));
});
test('multiple completed users reconcile with complete ordered ledger chain',()=>{
 let j=step(step(initial(),'prepare'),'confirm-deleted');const r=randomUUID();
 j=step(step(j,'prepare',b,r),'confirm-deleted',b,r);
 assert.deepEqual(reconcile(j,ledger([a,b])).deletedUsers,[a,b].sort());
});
test('isolated PostgreSQL checkpoint CAS rejects competing publish and lost ack remains pending',async()=>{
 const {PGlite}=await import('@electric-sql/pglite');const authority=new PGlite(),application=new PGlite();
 try {
  await authority.exec('create table authority(singleton boolean primary key check(singleton),digest text not null,journal jsonb not null)');
  const j=initial();await authority.query('insert into authority values(true,$1,$2)',[journalCheckpoint(j).digest,JSON.stringify(j)]);
  const candidate=(userId,id)=>advanceDeletionJournal(j,signer.publicKey,journalCheckpoint(j),{requestId:id,userId,action:'prepare'},signer.privateKey,now);
  const first=candidate(a,requestId),competing=candidate(b,randomUUID());
  const publish=async c=>(await authority.query('update authority set digest=$1,journal=$2 where singleton and digest=$3 returning digest',[c.nextCheckpoint.digest,JSON.stringify(c.journal),c.expectedPreviousCheckpoint.digest])).rows.length;
  assert.equal(await publish(first),1);assert.equal(await publish(competing),0);
  // Simulated lost response: retrying publication cannot overwrite newer state.
  assert.equal(await publish(first),0);
  // Restoring/replacing app data is intentionally separate from the authority DB.
  await application.exec('create table restored_app(user_id uuid); drop table restored_app; create table restored_app(user_id uuid)');
  const persisted=(await authority.query('select journal from authority')).rows[0].journal;
  assert.deepEqual(inspectDeletionJournal(persisted,signer.publicKey,first.nextCheckpoint,now).pendingUsers,[a]);
  assert.throws(()=>reconcile(persisted),/Unresolved/);
 } finally {await authority.close();await application.close();}
});
