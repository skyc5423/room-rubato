/** Offline parser of saved authenticated Vercel runtime logs. No fetching, keys or hosted writes. */
import {canonical,sha256,FORMAT} from './core.mjs';
import {fixture} from '../../ops/blob-pilot/lib/fixture.mjs';
export const WRITER='prj_TO6prOB9hvCt8wTFK4IaOTu27ZAF';
export const LIMIT=1024*1024;
const HEX=/^[a-f0-9]{64}$/,DAY=/^\d{4}-\d{2}-\d{2}$/,DEP=/^dpl_[A-Za-z0-9]+$/,REQ=/^[A-Za-z0-9-]{1,120}$/;
function ensure(ok,code){if(!ok){const e=Error(code);e.code=code;throw e;}}
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&canonical(Object.keys(x).sort())===canonical([...keys].sort());
const instant=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T\d\d:\d\d:\d\d\.\d{3}Z$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
export function validDay(day){ensure(DAY.test(day)&&new Date(day+'T00:00:00.000Z').toISOString().slice(0,10)===day,'INVALID_DAY');return day;}
function b64(s,limit){ensure(typeof s==='string'&&s.length<=Math.ceil(limit/3)*4&&/^[A-Za-z0-9+/]*={0,2}$/.test(s),'INVALID_BASE64');const b=Buffer.from(s,'base64');ensure(b.length<=limit&&b.toString('base64')===s,'INVALID_BASE64');return b;}
function validateReceipt(r,day,digest){
 ensure(exact(r,['synthetic','status','day','attempt','verifiedAt','archiveDigest','bundleDigest','snapshotDigest','restoreVerified']),'RECEIPT_SCHEMA');
 ensure(r.synthetic===true&&r.status==='verified'&&r.restoreVerified===false&&r.day===day&&r.bundleDigest===digest&&Number.isInteger(r.attempt)&&r.attempt>=1&&r.attempt<=3&&instant(r.verifiedAt)&&r.verifiedAt.startsWith(day)&&HEX.test(r.archiveDigest)&&HEX.test(r.snapshotDigest),'RECEIPT_IDENTITY');
}
/** Accept precisely the current connector's Markdown log record format; unknown truncation fails closed. */
export function analyzeLogs(input,selection){
 ensure(typeof input==='string'&&Buffer.byteLength(input)<=LIMIT,'LOG_SIZE');
 const {deployment,day,requestId,bundleDigest}=selection;validDay(day);ensure(DEP.test(deployment)&&(!requestId||REQ.test(requestId))&&(!bundleDigest||HEX.test(bundleDigest)),'INVALID_SELECTION');
 ensure(!/truncat(?:ed|ion)|output omitted|\[\.\.\.\]/i.test(input),'TRUNCATED_LOG');
 const lines=input.split(/\r?\n/);ensure(lines.length<=4000,'LOG_SIZE');
 ensure(lines.filter(l=>l.startsWith('**Project:**')).length===1&&lines.includes(`**Project:** ${WRITER}`),'WRONG_PROJECT');
 ensure(lines.filter(l=>l.startsWith('**Deployment:**')).length===1&&lines.includes(`**Deployment:** ${deployment}`),'WRONG_DEPLOYMENT');
 const ranges=lines.filter(l=>l.startsWith('**Time range:**'));ensure(ranges.length===1,'LOG_COVERAGE');const range=ranges[0].match(/^\*\*Time range:\*\* (\S+) → (\S+)$/);ensure(range&&instant(range[1])&&instant(range[2])&&Date.parse(range[1])<=Date.parse(range[2]),'LOG_COVERAGE');const coverage={from:range[1],to:range[2],truncationReported:false};
 const groups=new Map(),failures=[];let meta=null,header=null;
 for(const line of lines){
  if(line.startsWith('### ')){header=null;meta=null;const m=line.match(/^### (\S+) (GET|POST) (\/[^ ]*) \[([a-z]+)\/([a-z]+)\]$/);ensure(m&&instant(m[1]),'LOG_HEADER');header={at:m[1],method:m[2],path:m[3],level:m[4],source:m[5]};continue;}
  if(line.startsWith('dep=')){ensure(header&&!meta,'LOG_METADATA');const m=line.match(/^dep=(dpl_[A-Za-z0-9]+) request=([A-Za-z0-9-]{1,120}) domain=([^ ]+) environment=(production|preview) region=([^ ]+) runtime=([^ ]+) stream=(stdout|stderr)$/);ensure(m,'LOG_METADATA');meta={deployment:m[1],requestId:m[2],environment:m[4]};if(header.level==='error'&&meta.deployment===deployment&&meta.environment==='production'&&header.method==='GET'&&header.path==='/api/run'&&header.at.startsWith(day)&&(!requestId||meta.requestId===requestId))failures.push({at:header.at,requestId:meta.requestId,code:'RUNTIME_ERROR'});continue;}
  if(!line.includes('RUBATO_SYNTHETIC_PILOT_'))continue;
  ensure(header&&meta&&line.startsWith('    {')&&line.endsWith('}'),'INCOMPLETE_EVENT');
  let event;try{event=JSON.parse(line.trim());ensure(JSON.stringify(event)===line.trim(),'NONCANONICAL_EVENT');}catch{ensure(false,'MALFORMED_EVENT');}
  ensure(meta.deployment===deployment&&meta.environment==='production'&&header.method==='GET'&&header.path==='/api/run'&&header.source==='function','WRONG_EVENT_ORIGIN');
  ensure(Date.parse(header.at)>=Date.parse(coverage.from)&&Date.parse(header.at)<=Date.parse(coverage.to),'EVENT_OUTSIDE_COVERAGE');
  if(!header.at.startsWith(day)||(requestId&&meta.requestId!==requestId))continue;
  if(event.event==='RUBATO_SYNTHETIC_PILOT_DIAGNOSTIC_FAILED'){ensure(exact(event,['event','synthetic','errorCode'])&&event.synthetic===true&&event.errorCode==='EVIDENCE_UNAVAILABLE','FAILURE_SCHEMA');failures.push({at:header.at,requestId:meta.requestId,code:'DIAGNOSTIC_FAILED'});continue;}
  ensure(['RUBATO_SYNTHETIC_PILOT_RECEIPT','RUBATO_SYNTHETIC_PILOT_ARCHIVE_CHUNK'].includes(event.event),'UNKNOWN_EVENT');
  ensure(event.day===day&&HEX.test(event.bundleDigest),'EVENT_IDENTITY');if(bundleDigest&&event.bundleDigest!==bundleDigest)continue;
  const key=meta.requestId+':'+event.bundleDigest;let g=groups.get(key);if(!g){ensure(groups.size<32,'TOO_MANY_GROUPS');g={deployment,day,requestId:meta.requestId,bundleDigest:event.bundleDigest,events:[],receipt:null,chunks:new Map(),count:null,observedAt:header.at};groups.set(key,g);}
  g.observedAt=header.at>g.observedAt?header.at:g.observedAt;
  if(event.event==='RUBATO_SYNTHETIC_PILOT_RECEIPT'){
   ensure(exact(event,['event','day','bundleDigest','receipt']),'RECEIPT_EVENT_SCHEMA');validateReceipt(event.receipt,day,event.bundleDigest);ensure(!g.receipt,'DUPLICATE_RECEIPT');g.receipt=event.receipt;
  }else{
   ensure(exact(event,['event','day','index','count','bundleDigest','data']),'CHUNK_SCHEMA');ensure(Number.isInteger(event.count)&&event.count>=1&&event.count<=59&&Number.isInteger(event.index)&&event.index>=0&&event.index<event.count&&typeof event.data==='string'&&event.data.length>0&&event.data.length<=1500&&/^[A-Za-z0-9+/]*={0,2}$/.test(event.data),'CHUNK_RANGE');
   ensure(!g.chunks.has(event.index),'DUPLICATE_CHUNK');ensure(g.count===null||g.count===event.count,'CHUNK_COUNT_CONFLICT');g.count=event.count;g.chunks.set(event.index,event.data);
  }
  g.events.push(event);
 }
 return {coverage,selection:{deployment,day,...requestId&&{requestId},...bundleDigest&&{bundleDigest}},groups:[...groups.values()],failures};
}
export function collectEvidence(analysis){
 ensure(analysis.failures.length===0,'DIAGNOSTIC_FAILED');ensure(analysis.groups.length>0,'NO_EVIDENCE');ensure(analysis.groups.length===1,'AMBIGUOUS_GROUPS');const g=analysis.groups[0];
 ensure(g.receipt&&g.count&&g.chunks.size===g.count,'INCOMPLETE_GROUP');
 const ordered=Array.from({length:g.count},(_,i)=>{ensure(g.chunks.has(i),'MISSING_CHUNK');const s=g.chunks.get(i);ensure(i===g.count-1||s.length===1500,'TRUNCATED_CHUNK');return s;});
 const bundle=b64(ordered.join(''),64*1024);ensure(sha256(bundle)===g.bundleDigest,'BUNDLE_DIGEST');
 let b;try{b=JSON.parse(bundle.toString('utf8'));ensure(canonical(b)===bundle.toString('utf8'),'NONCANONICAL_BUNDLE');}catch{ensure(false,'BUNDLE_JSON');}
 ensure(exact(b,['format','synthetic','day','fingerprint','snapshotDigest','archiveDigest','archive','mac']),'BUNDLE_SCHEMA');
 ensure(b.format==='rubato-synthetic-blob-v1'&&b.synthetic===true&&b.day===g.day&&HEX.test(b.fingerprint)&&HEX.test(b.mac)&&b.archiveDigest===g.receipt.archiveDigest&&b.snapshotDigest===g.receipt.snapshotDigest&&b.snapshotDigest===sha256(canonical(fixture(g.day))),'BUNDLE_IDENTITY');
 const archive=b64(b.archive,48*1024);ensure(sha256(archive)===b.archiveDigest,'ARCHIVE_DIGEST');let sealed;try{sealed=JSON.parse(archive.toString('utf8'));}catch{ensure(false,'ARCHIVE_JSON');}
 ensure(exact(sealed,['header','ciphertext','tag'])&&exact(sealed.header,['format','keyFingerprint','cipher','wrap','iv','wrappedKey']),'ENVELOPE_SCHEMA');
 ensure(sealed.header.format===FORMAT&&sealed.header.keyFingerprint===b.fingerprint&&sealed.header.cipher==='AES-256-GCM'&&sealed.header.wrap==='RSA-OAEP-SHA256','ENVELOPE_IDENTITY');
 ensure(b64(sealed.header.iv,12).length===12&&b64(sealed.tag,16).length===16&&b64(sealed.header.wrappedKey,1024).length>=384&&b64(sealed.ciphertext,32*1024).length>0,'ENVELOPE_BYTES');
 ensure(Date.parse(g.receipt.verifiedAt)<=Date.parse(g.observedAt)+30000,'FUTURE_RECEIPT');
 return {bundle,receipt:g.receipt,evidence:{format:'rubato-synthetic-log-evidence-v1',synthetic:true,project:WRITER,deployment:g.deployment,day:g.day,requestId:g.requestId,bundleDigest:g.bundleDigest,observedAt:g.observedAt,coverage:analysis.coverage,sourceEventCount:g.events.length,events:g.events},report:{synthetic:true,day:g.day,deployment:g.deployment,requestId:g.requestId,sourceEventCount:g.events.length,coverage:analysis.coverage,bundleDigest:g.bundleDigest,archiveDigest:b.archiveDigest,collectionVerified:true,restoreVerified:false,independentKeyEscrowConfigured:false,productionReady:false}};
}
export function evaluateMonitoring({day,now=Date.now(),collection=null,restoreReport=null,failureCode=null}){
 validDay(day);ensure(Number.isFinite(now),'INVALID_NOW');
 const cutoff=Date.parse(day+'T13:10:00.000Z');
 const base={synthetic:true,day,cronFailureConfirmed:false,sourceAuthenticationVerifiedOffline:false,checkedAt:new Date(now).toISOString(),deadline:new Date(cutoff).toISOString(),independentKeyEscrowConfigured:false,productionReady:false};
 if(failureCode)return {...base,status:'failure',reason:'EVIDENCE_INVALID_OR_DIAGNOSTIC_FAILURE'};
 if(collection){
  const r=collection.receipt;ensure(r.day===day&&sha256(collection.bundle)===r.bundleDigest,'COLLECTION_MISMATCH');validateReceipt(r,day,r.bundleDigest);
  if(Date.parse(collection.evidence.observedAt)>now+30000)return {...base,status:'failure',reason:'FUTURE_EVIDENCE'};
  if(restoreReport){
   const valid=exact(restoreReport,['synthetic','day','restoreVerified','isolatedDatabase','profileRows','journalRows','archiveDigest','bundleDigest','checkedAt'])&&restoreReport.synthetic===true&&restoreReport.restoreVerified===true&&restoreReport.day===day&&restoreReport.bundleDigest===r.bundleDigest&&restoreReport.archiveDigest===r.archiveDigest&&restoreReport.isolatedDatabase==='in-memory PostgreSQL/PGlite'&&restoreReport.profileRows===1&&restoreReport.journalRows===1&&instant(restoreReport.checkedAt)&&Date.parse(restoreReport.checkedAt)>=Date.parse(r.verifiedAt)&&Date.parse(restoreReport.checkedAt)<=now+30000;
   if(!valid)return {...base,status:'failure',reason:'RESTORE_REPORT_MISMATCH'};
   return {...base,status:'verified',reason:'COMPLETE_ARTIFACT_AND_EXTERNAL_RESTORE',bundleDigest:r.bundleDigest,archiveDigest:r.archiveDigest,restoreVerified:true};
  }
 }
 return {...base,status:now<cutoff?'pending':'missing',reason:collection?'EXTERNAL_RESTORE_UNVERIFIED':'NO_COMPLETE_SCHEDULED_EVIDENCE'};
}
