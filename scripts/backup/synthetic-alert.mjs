// Offline pilot monitor contract. No network, credentials, retry, deletion or activation.
// A caller must authenticate status and supply an independently approved delivery adapter.
import {createHash} from 'node:crypto';
const fields=['synthetic','status','archivePresent','lastScheduledInvocationAt','lastSuccessAt','lastFailureAt','archiveDigest','day','restoreVerified'];
const timestamp=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(Date.parse(x)).toISOString()===x;
const validDay=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&timestamp(`${x}T00:00:00.000Z`);
export function evaluateSyntheticStatus(value,{now,expectedDay}) {
 if(!Number.isSafeInteger(now)||!validDay(expectedDay)||Date.parse(`${expectedDay}T13:10:00.000Z`)>now)throw Error('Check only after expected daily window');
 // Match the scheduled-monitor runbook: allow the noon window plus ten-minute grace.
 const issues=[];
 const unavailable=()=>issues.push('STATUS_UNAVAILABLE');
 const object=value&&typeof value==='object'&&!Array.isArray(value);
 const valid=object&&Object.keys(value).length===fields.length&&fields.every(k=>Object.hasOwn(value,k))&&
  value.synthetic===true&&value.restoreVerified===false&&['fresh','missed-or-unverified'].includes(value.status)&&
  typeof value.archivePresent==='boolean'&&[value.lastScheduledInvocationAt,value.lastSuccessAt,value.lastFailureAt].every(x=>x===null||(timestamp(x)&&Date.parse(x)<=now))&&
  (value.day===null||validDay(value.day))&&(value.archiveDigest===null||(typeof value.archiveDigest==='string'&&/^[a-f0-9]{64}$/.test(value.archiveDigest)));
 if(!valid)unavailable();
 else {
  if(value.status!=='fresh'||!value.archivePresent||!value.lastSuccessAt||!value.archiveDigest||value.day!==expectedDay||value.lastSuccessAt.slice(0,10)!==expectedDay||now-Date.parse(value.lastSuccessAt)>27*3600000)issues.push('BACKUP_MISSING_OR_UNVERIFIED');
  if(!value.lastScheduledInvocationAt||value.lastScheduledInvocationAt.slice(0,10)!==expectedDay)issues.push('SCHEDULED_INVOCATION_MISSING');
  if(value.lastFailureAt&&(!value.lastSuccessAt||value.lastFailureAt>=value.lastSuccessAt))issues.push('LATEST_ATTEMPT_FAILED');
 }
 const id=createHash('sha256').update(JSON.stringify({expectedDay,issues})).digest('hex');
 return Object.freeze({version:1,synthetic:true,id,expectedDay,issues:Object.freeze(issues),needsAlert:issues.length>0,productionReady:false});
}
export async function deliverSyntheticAlert(report,send,{timeoutMs=5000}={}) {
 // Recompute identity and allowlist: never relay arbitrary fields, exceptions, URLs or status bodies.
 const codes=['STATUS_UNAVAILABLE','BACKUP_MISSING_OR_UNVERIFIED','SCHEDULED_INVOCATION_MISSING','LATEST_ATTEMPT_FAILED'];
 if(!report||report.version!==1||report.synthetic!==true||!validDay(report.expectedDay)||!Array.isArray(report.issues)||report.issues.length>4||new Set(report.issues).size!==report.issues.length||!report.issues.every(x=>codes.includes(x))||report.id!==createHash('sha256').update(JSON.stringify({expectedDay:report.expectedDay,issues:report.issues})).digest('hex'))throw Error('Invalid synthetic report');
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000||typeof send!=='function')throw Error('Invalid delivery adapter');
 if(!report.issues.length)return {status:'not-needed',delivered:false,recipientReceiptVerified:false};
 const payload=Object.freeze({version:1,synthetic:true,id:report.id,expectedDay:report.expectedDay,issues:Object.freeze([...report.issues])});
 const controller=new AbortController();let timer;
 try {
  const ack=await Promise.race([
   Promise.resolve().then(()=>send(payload,{signal:controller.signal})),
   new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('timeout'));},timeoutMs);})
  ]);
  // Adapter acceptance is not proof of delivery to the final user's device.
  return {status:ack?.accepted===true&&ack?.id===payload.id?'adapter-accepted':'unconfirmed',delivered:false,recipientReceiptVerified:false};
 }catch{return {status:'unconfirmed',delivered:false,recipientReceiptVerified:false};}
 finally {clearTimeout(timer);}
}

