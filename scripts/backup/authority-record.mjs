// Verify an uncached primary authority response; never read this from an archive.
// This is not a network adapter or permission to restore/delete.
import {canonical,sha256,ensure} from './core.mjs';
import {inspectDeletionJournal,journalCheckpoint} from './deletion-journal.mjs';
export function verifyAuthorityRecord(record,publicKey,expectedGeneration,now=Date.now()) {
 ensure(record && canonical(Object.keys(record).sort())===canonical(['version','digest','signed_body','signature','fencing_generation'].sort()),'Invalid authority record');
 const integer=value=>{ensure((typeof value==='number' && Number.isSafeInteger(value)) || (typeof value==='string' && /^[1-9][0-9]*$/.test(value)),'Invalid fence integer');const n=BigInt(value);ensure(n>0n && n<=9223372036854775807n,'Invalid fence integer');return n;};
 ensure(integer(record.fencing_generation)===integer(expectedGeneration),'Authority fence changed');integer(record.version);
 ensure(typeof record.signed_body==='string' && Buffer.byteLength(record.signed_body)<=33554432,'Invalid authority body');
 const body=JSON.parse(record.signed_body);
 ensure(body && !Array.isArray(body) && canonical(Object.keys(body).sort())===canonical(['format','project','epoch','observedAt','events'].sort()),'Invalid signed authority schema');
 ensure(canonical(body)===record.signed_body && sha256(record.signed_body)===record.digest,'Authority digest mismatch');
 const journal={...body,signature:record.signature},checkpoint=journalCheckpoint(journal);
 ensure(checkpoint.digest===record.digest,'Authority checkpoint mismatch');
 const state=inspectDeletionJournal(journal,publicKey,checkpoint,now);
 return {journal,checkpoint,state,generation:String(record.fencing_generation),applicationAuthorized:false};
}
