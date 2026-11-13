import test from 'node:test';import assert from 'node:assert/strict';import {generateKeyPairSync,randomUUID} from 'node:crypto';
import {canonical,sha256} from '../core.mjs';import {initialDeletionJournal,journalCheckpoint} from '../deletion-journal.mjs';import {verifyAuthorityRecord} from '../authority-record.mjs';
const key=generateKeyPairSync('ed25519',{publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}}),now=Date.now();
function record(){const j=initialDeletionJournal(randomUUID(),key.privateKey,now),{signature,...body}=j;return {version:1,digest:journalCheckpoint(j).digest,signed_body:canonical(body),signature,fencing_generation:'9007199254740993'};}
test('primary authority record verifies signature, canonical bytes and exact bigint generation',()=>{const r=record();const result=verifyAuthorityRecord(r,key.publicKey,r.fencing_generation,now);assert.equal(result.applicationAuthorized,false);assert.deepEqual(result.state.pendingUsers,[]);assert.equal(result.generation,r.fencing_generation);});
test('stale generation, imprecise number, tampering and stale observation fail closed',()=>{const r=record();assert.throws(()=>verifyAuthorityRecord(r,key.publicKey,'9007199254740994',now));assert.throws(()=>verifyAuthorityRecord({...r,fencing_generation:Number(r.fencing_generation)},key.publicKey,r.fencing_generation,now));assert.throws(()=>verifyAuthorityRecord({...r,signature:'A'.repeat(86)+'=='},key.publicKey,r.fencing_generation,now));assert.throws(()=>verifyAuthorityRecord({...r,signed_body:r.signed_body+' '},key.publicKey,r.fencing_generation,now));assert.throws(()=>verifyAuthorityRecord(r,key.publicKey,r.fencing_generation,now+400000));});

test('inner signature shadowing cannot change the signed bytes or checkpoint identity',()=>{
 const r=record(),body=JSON.parse(r.signed_body);body.signature='shadow';
 const changed=canonical(body);assert.throws(()=>verifyAuthorityRecord({...r,signed_body:changed,digest:sha256(changed)},key.publicKey,r.fencing_generation,now),/schema/);
});
