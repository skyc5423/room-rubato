// Bounded, offline classification of an authenticated connector response.
// Log completeness/digests do NOT verify HMAC, current Blob availability or recovery.
import {createHash} from 'node:crypto';
import {analyzeLogs,collectEvidence,validDay} from './blob-evidence.mjs';
export const MONITOR_SLOTS=['12:55','13:05','13:15'];
export const PILOT_END='2026-11-24T00:00:00.000Z';
export function classifySyntheticLogCheck({text,connectorOk,day,now,deployment}) {
 validDay(day);
 if(!Number.isSafeInteger(now)||!/^dpl_[A-Za-z0-9]+$/.test(deployment))throw Error('Invalid monitor context');
 if(now>=Date.parse(PILOT_END)||day<'2026-11-17'||day>='2026-11-24')return {state:'stopped',productionReady:false};
 if(new Date(now).toISOString().slice(0,10)!==day)throw Error('Check must use current UTC day');
 let state,resultCode,digest=null,coverage=null;
 if(connectorOk!==true){state='source_unavailable';resultCode='CONNECTOR_ERROR';}
 else {
  try {
   const a=analyzeLogs(text,{deployment,day});
   const from=Date.parse(a.coverage.from),to=Date.parse(a.coverage.to);
   // Late, future or over-retention responses cannot be treated as a current observation.
   if(to>now+30000||now-to>120000||to-from>59*60000+1000||to-from<58*60000)throw Error('Invalid coverage');
   coverage={from:a.coverage.from,to:a.coverage.to};
   try{const c=collectEvidence(a);state='evidence_unverified';resultCode='COMPLETE_LOG_ARTIFACT_NO_RESTORE';digest=c.receipt.bundleDigest;}
   catch(e){if(e.code!=='NO_EVIDENCE')throw e;state=now<Date.parse(day+'T13:10:00.000Z')?'waiting_window':'missing_evidence';resultCode='NO_MATCHING_LOGS';}
  }catch{state='invalid_evidence';resultCode='INCOMPLETE_OR_INVALID_LOGS';}
 }
 const eventId=createHash('sha256').update(JSON.stringify({day,checkedAt:new Date(now).toISOString(),deployment,state,resultCode,digest})).digest('hex');
 return {eventId,day,state,resultCode,bundleDigest:digest,coverage,productionReady:false,restoreVerified:false,currentBlobReadVerified:false,sourceAuthenticationVerifiedOffline:false};
}
