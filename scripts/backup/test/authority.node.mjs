// Isolated SQL model only. No hosted credentials or connection strings.
import test from 'node:test';import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';import {readFile} from 'node:fs/promises';import {generateKeyPairSync,randomUUID} from 'node:crypto';
import {canonical} from '../core.mjs';import {initialDeletionJournal,advanceDeletionJournal,journalCheckpoint} from '../deletion-journal.mjs';
const key=generateKeyPairSync('ed25519',{publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
const body=j=>{const {signature,...b}=j;return canonical(b);};
test('independent SQL authority enforces CAS, append-only prefix and least privilege',async()=>{
 const db=new PGlite();let checks=0;
 try {
  await db.exec(await readFile(new URL('../../../docs/proposals/journal-authority.sql',import.meta.url),'utf8'));
  await db.exec('create role fixture_publisher;create role fixture_reader;create role fixture_user;grant usage on schema journal_authority to fixture_publisher,fixture_reader,fixture_user;grant execute on function journal_authority.publish(bigint,text,text,text) to fixture_publisher;grant execute on function journal_authority.activate_generation(bigint) to fixture_publisher;grant execute on function journal_authority.read_current() to fixture_reader;');
  const j=initialDeletionJournal(randomUUID(),key.privateKey),pub=(previous,value)=>db.query('select journal_authority.publish($1,$2,$3,$4) digest',[1,previous,body(value),value.signature]);
  await assert.rejects(()=>pub(null,j),/AUTHORITY_NOT_CONFIGURED/);checks++;
  await db.query('insert into journal_authority.configuration(singleton,project_name,epoch) values(true,$1,$2)',[j.project,j.epoch]);
  await db.exec('set role fixture_user');await assert.rejects(()=>pub(null,j),/permission denied/);checks++;
  await db.exec('reset role;set role fixture_reader');await assert.rejects(()=>pub(null,j),/permission denied/);checks++;
  await db.exec('reset role;set role fixture_publisher');
  for(const operation of ['select * from journal_authority.versions','delete from journal_authority.versions','update journal_authority.head set version=1','select * from journal_authority.read_current()']){await assert.rejects(()=>db.exec(operation),/permission denied/);checks++;}
  await assert.rejects(()=>pub(null,j),/STALE_FENCE/);checks++;
  await db.query('select journal_authority.activate_generation(1)');
  const result=await pub(null,j);assert.equal(result.rows[0].digest,journalCheckpoint(j).digest);checks++;
  const request={requestId:randomUUID(),userId:randomUUID(),action:'prepare'};
  const candidate=advanceDeletionJournal(j,key.publicKey,journalCheckpoint(j),request,key.privateKey);
  await pub(journalCheckpoint(j).digest,candidate.journal);
  await assert.rejects(()=>pub(journalCheckpoint(j).digest,candidate.journal),/CHECKPOINT_CONFLICT/);checks++;
  const rewrite=structuredClone(candidate.journal);rewrite.events[0].userId=randomUUID();await assert.rejects(()=>pub(candidate.nextCheckpoint.digest,rewrite),/JOURNAL_REWRITE/);checks++;
  const truncated={...j,observedAt:new Date().toISOString()};await assert.rejects(()=>pub(candidate.nextCheckpoint.digest,truncated),/JOURNAL_ROLLBACK/);checks++;
  const stale={...candidate.journal,observedAt:new Date(Date.now()-400000).toISOString()};await assert.rejects(()=>pub(candidate.nextCheckpoint.digest,stale),/STALE_PUBLICATION/);checks++;
  const future={...candidate.journal,observedAt:new Date(Date.now()+400000).toISOString()};await assert.rejects(()=>pub(candidate.nextCheckpoint.digest,future),/STALE_PUBLICATION/);checks++;
  await db.exec('reset role;set role fixture_reader');const stored=(await db.query('select * from journal_authority.read_current()')).rows[0];assert.equal(stored.digest,candidate.nextCheckpoint.digest);checks++;
  await db.exec('reset role;set role fixture_publisher');
  await db.query('select journal_authority.activate_generation(2)');
  await assert.rejects(()=>db.query('select journal_authority.activate_generation(1)'),/STALE_FENCE/);
  await assert.rejects(()=>pub(candidate.nextCheckpoint.digest,candidate.journal),/STALE_FENCE/);
  await db.exec('reset role');assert.equal((await db.query('select count(*)::int n from journal_authority.versions')).rows[0].n,2);checks++;
  assert.equal(checks,16);
 }finally{await db.close();}
});
test('app fence is transaction-scoped, fixed identity, unavailable to ordinary user',async()=>{
 const db=new PGlite();try{
 await db.exec('create schema room_internal;create role fixture_user;grant usage on schema room_internal to fixture_user;');
 await db.exec(await readFile(new URL('../../../docs/proposals/recovery-fence.sql',import.meta.url),'utf8'));
 await db.exec('set role fixture_user');await assert.rejects(()=>db.exec('select room_internal.acquire_recovery_fence()'),/permission denied/);
 await db.exec('reset role');await db.exec('begin');
 const first=(await db.query('select room_internal.acquire_recovery_fence() as g')).rows[0].g;
 await db.exec('rollback');await db.exec('reset role');await db.exec('begin');
 const second=(await db.query('select room_internal.acquire_recovery_fence() as g')).rows[0].g;
 assert(BigInt(second)>BigInt(first));await db.exec('commit');
 // Single in-memory connection checks transaction behavior, not network races.
 }finally{await db.close();}
});
