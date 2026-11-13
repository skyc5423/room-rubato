// Local protocol only. No persistence, hosted mutation, credentials or network.
// Production requires independently durable CAS publication and a restore fence.
import {createPublicKey,sign,verify} from 'node:crypto';
import {PROJECT,canonical,sha256,ensure,checkedLedger,restorePlan} from './core.mjs';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const keys=(value,names)=>ensure(value && !Array.isArray(value) && canonical(Object.keys(value).sort())===canonical([...names].sort()),'Unexpected journal schema');
const timestamp=v=>{ensure(typeof v==='string' && Number.isFinite(Date.parse(v)) && v===new Date(v).toISOString(),'Invalid journal time');return Date.parse(v);};
const body=j=>{const {signature,...value}=j;return value;};
export const journalCheckpoint=j=>({epoch:j.epoch,sequence:j.events.length,digest:sha256(canonical(body(j)))});
function signed(value,key){return {...value,signature:sign(null,Buffer.from(canonical(value)),key).toString('base64')};}
export function initialDeletionJournal(epoch,privateKey,now=Date.now()) {
  ensure(UUID.test(epoch),'Invalid epoch');
  return signed({format:'room-rubato-deletion-journal-v1',project:PROJECT,epoch,observedAt:new Date(now).toISOString(),events:[]},privateKey);
}
export function inspectDeletionJournal(j,publicKey,expected,now=Date.now()) {
  keys(j,['format','project','epoch','observedAt','events','signature']);
  ensure(j.format==='room-rubato-deletion-journal-v1' && j.project===PROJECT && UUID.test(j.epoch) && Array.isArray(j.events),'Invalid journal identity');
  ensure(expected && canonical(expected)===canonical(journalCheckpoint(j)),'Journal checkpoint mismatch');
  const at=timestamp(j.observedAt);ensure(at<=now && at>=now-300000,'Journal not fresh');
  ensure(createPublicKey(publicKey).asymmetricKeyType==='ed25519','Ed25519 required');
  ensure(typeof j.signature==='string' && /^[A-Za-z0-9+/]{86}==$/.test(j.signature) && verify(null,Buffer.from(canonical(body(j))),publicKey,Buffer.from(j.signature,'base64')),'Invalid journal signature');
  const requests=new Map(),pending=new Map(),deleted=new Set();let previous='0'.repeat(64),last=0;
  for(const [i,event] of j.events.entries()) {
    keys(event,['sequence','requestId','userId','action','at','previous']);
    ensure(event.sequence===i+1 && UUID.test(event.requestId) && UUID.test(event.userId) && event.previous===previous,'Broken journal chain');
    const time=timestamp(event.at);ensure(time>=last && time<=at,'Invalid event time');
    if(event.action==='prepare') {
      ensure(!requests.has(event.requestId) && !pending.has(event.userId) && !deleted.has(event.userId),'Duplicate deletion request');
      requests.set(event.requestId,{userId:event.userId,status:'pending'});pending.set(event.userId,event.requestId);
    } else {
      const request=requests.get(event.requestId);
      ensure(request?.userId===event.userId && request.status==='pending','No matching pending request');
      ensure(event.action==='confirm-deleted' || event.action==='confirm-not-deleted','Unverified resolution');
      request.status=event.action;pending.delete(event.userId);
      if(event.action==='confirm-deleted')deleted.add(event.userId);
    }
    previous=sha256(canonical(event));last=time;
  }
  return {pendingUsers:[...pending.keys()].sort(),deletedUsers:[...deleted].sort()};
}
// Caller is a trusted authority, not an end-user endpoint. Resolution actions
// require verified outcomes; a timeout/error alone NEVER authorizes cancellation.
export function advanceDeletionJournal(j,publicKey,expected,operation,privateKey,now=Date.now()) {
  inspectDeletionJournal(j,publicKey,expected,now);
  keys(operation,['requestId','userId','action']);
  const events=[...j.events,{sequence:j.events.length+1,...operation,at:new Date(now).toISOString(),previous:j.events.length?sha256(canonical(j.events.at(-1))):'0'.repeat(64)}];
  const next=signed({...body(j),observedAt:new Date(now).toISOString(),events},privateKey);
  inspectDeletionJournal(next,publicKey,journalCheckpoint(next),now);
  return {journal:next,expectedPreviousCheckpoint:expected,nextCheckpoint:journalCheckpoint(next),publicationAuthorized:false};
}
// Call before generating a new plan. This does not authorize applying an old plan.
export function reconcileDeletionForRestore(j,publicKey,checkpoint,ledger,ledgerCheckpoint,now=Date.now()) {
  const state=inspectDeletionJournal(j,publicKey,checkpoint,now);
  ensure(state.pendingUsers.length===0,'Unresolved deletion blocks restore');
  const deleted=[...checkedLedger(ledger,publicKey,ledgerCheckpoint,now)].sort();
  ensure(canonical(deleted)===canonical(state.deletedUsers),'Journal and deletion ledger disagree');
  return {applicationAuthorized:false,journalDigest:checkpoint.digest,deletedUsers:deleted,notAfter:new Date(Math.min(Date.parse(j.observedAt),Date.parse(ledger.observedAt))+300000).toISOString()};
}
// Heartbeat preserves every event, including unresolved requests. Its supplied
// checkpoint MUST come from current independent authority, never the archive.
export function refreshDeletionJournal(j,publicKey,expected,privateKey,now=Date.now()) {
  const previousAt=timestamp(j.observedAt);ensure(previousAt<=now,'Clock moved backwards');
  inspectDeletionJournal(j,publicKey,expected,previousAt);
  const next=signed({...body(j),observedAt:new Date(now).toISOString()},privateKey);
  inspectDeletionJournal(next,publicKey,journalCheckpoint(next),now);
  return {journal:next,expectedPreviousCheckpoint:expected,nextCheckpoint:journalCheckpoint(next),publicationAuthorized:false};
}

export function reconciledRestorePlan(snapshot,journal,publicKey,journalExpected,ledger,ledgerExpected,owners,now=Date.now()) {
  const gate=reconcileDeletionForRestore(journal,publicKey,journalExpected,ledger,ledgerExpected,now);
  const plan=restorePlan(snapshot,ledger,publicKey,ledgerExpected,owners,now);
  return {...plan,journalDigest:gate.journalDigest,notAfter:new Date(Math.min(Date.parse(plan.notAfter),Date.parse(gate.notAfter))).toISOString()};
}
