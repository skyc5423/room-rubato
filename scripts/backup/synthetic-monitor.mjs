// Offline durable-outbox prototype. No HTTP, credentials, scheduler or messaging tools.
import {createHash} from 'node:crypto';
import {mkdir,open,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {evaluateSyntheticStatus} from './synthetic-alert.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const validId=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const labels={STATUS_UNAVAILABLE:'백업 상태를 확인하지 못했어요.',BACKUP_MISSING_OR_UNVERIFIED:'오늘 합성 백업이 없거나 검증되지 않았어요.',SCHEDULED_INVOCATION_MISSING:'오늘 예약 실행 기록이 확인되지 않았어요.',LATEST_ATTEMPT_FAILED:'가장 최근 합성 백업 시도가 실패했어요.'};
function checkedNotice(value) {
 if(!value||value.kind!=='synthetic-backup-alert'||value.version!==1||value.destination!=='originating-private-chat'||typeof value.expectedDay!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value.expectedDay)||!Array.isArray(value.issues)||!value.issues.length||value.issues.length>4||new Set(value.issues).size!==value.issues.length||!value.issues.every(x=>Object.hasOwn(labels,x))||value.id!==hash({expectedDay:value.expectedDay,issues:value.issues}))throw Error('Invalid notice');
 return {version:1,kind:value.kind,destination:value.destination,id:value.id,expectedDay:value.expectedDay,issues:[...value.issues]};
}
export function renderSyntheticNotice(value) {
 const n=checkedNotice(value);
 return `[합성 백업 점검 · ${n.expectedDay}]\n${n.issues.map(x=>labels[x]).join('\n')}\n실제 사용자 데이터 백업 상태를 뜻하지 않으며, 확인이 필요해요.`;
}
// Caller chooses an approved private persistent directory outside the writer failure boundary.
// Local disk persistence alone does not prove independence or survive workspace loss.
export class FileSyntheticLedger {
 constructor(directory){this.directory=directory;}
 path(id,type){if(!validId(id)||!['notice','claim','ack'].includes(type))throw Error('Invalid ledger identity');return join(this.directory,`${id}.${type}.json`);}
 async create(id,type,value){
  const path=this.path(id,type);await mkdir(this.directory,{recursive:true,mode:0o700});
  let file;try{file=await open(path,'wx',0o600);}catch(e){if(e.code==='EEXIST')return false;throw Error('Ledger unavailable');}
  try{await file.writeFile(JSON.stringify(value));await file.sync();}finally{await file.close();}
  const directory=await open(this.directory,'r');try{await directory.sync();}finally{await directory.close();}
  return true;
 }
 async read(id,type){try{const raw=await readFile(this.path(id,type),'utf8');if(raw.length>8192)throw Error('Oversized record');return JSON.parse(raw);}catch(e){if(e.code==='ENOENT')return null;throw Error('Ledger unreadable');}}
}
export async function prepareSyntheticNotice({status,now,expectedDay,ledger}) {
 const report=evaluateSyntheticStatus(status,{now,expectedDay});
 if(!report.needsAlert)return {state:'healthy',productionReady:false};
 const notice=checkedNotice({version:1,kind:'synthetic-backup-alert',destination:'originating-private-chat',id:report.id,expectedDay,issues:report.issues});
 const created=await ledger.create(notice.id,'notice',notice);
 // Never silently trust/overwrite an existing event, including an interrupted partial write.
 const saved=checkedNotice(await ledger.read(notice.id,'notice'));
 if(JSON.stringify(saved)!==JSON.stringify(notice))throw Error('Ledger identity mismatch');
 return {state:created?'prepared':'existing',notice:saved,sourceAuthenticationVerified:false,recipientReceiptVerified:false,productionReady:false};
}
export async function claimSyntheticNotice(ledger,id,current) {
 const notice=checkedNotice(await ledger.read(id,'notice'));
 if(notice.id!==id)throw Error('Ledger identity mismatch');
 // Root must obtain fresh authenticated status immediately before claiming a send.
 const report=evaluateSyntheticStatus(current?.status,{now:current?.now,expectedDay:current?.expectedDay});
 if(!report.needsAlert||report.id!==id)return {state:'superseded',id};
 // Reserve before invoking root messaging. A crash after this write is uncertain, never resend blindly.
 if(!await ledger.create(id,'claim',{version:1,id}))return {state:'reconcile-required',id};
 return {state:'claimed',id,text:renderSyntheticNotice(notice),destination:notice.destination};
}
export async function recordSyntheticMessageReceipt(ledger,id,messageId) {
 // Only call after the root's messaging tool confirms the exact destination and successful send.
 if(typeof messageId!=='string'||messageId.length<1||messageId.length>256||/[\x00-\x1f]/.test(messageId))throw Error('Invalid message receipt');
 const claim=await ledger.read(id,'claim');
 if(!claim||claim.version!==1||claim.id!==id)throw Error('Missing claim');
 const receipt={version:1,id,messageId};
 await ledger.create(id,'ack',receipt);
 const saved=await ledger.read(id,'ack');
 if(JSON.stringify(saved)!==JSON.stringify(receipt))throw Error('Receipt mismatch');
 return {state:'message-tool-confirmed',id,recipientReadVerified:false};
}
