import {createHmac,timingSafeEqual} from 'node:crypto';
import {canonical,sha256,seal,publicFingerprint} from './backup-core.mjs';
import {fixture} from './fixture.mjs';
const MAX_ATTEMPTS=3,LEASE_MS=5*60*1000;
export const dayOf=now=>new Date(now).toISOString().slice(0,10);
const path=(day,name)=>`synthetic-pilot/${day}/${name}.json`;
const bytes=x=>Buffer.from(canonical(x));
export function config(env,now=Date.now(),readOnly=false) {
 if(env.VERCEL==='1'&&(env.VERCEL_PROJECT_ID!=='prj_TO6prOB9hvCt8wTFK4IaOTu27ZAF'||env.VERCEL_ENV!=='production'))throw Error('Wrong hosted writer boundary');
 const start=Date.parse(env.PILOT_START_AT),end=Date.parse(env.PILOT_EXPIRES_AT);
 if(env.BACKUP_PRODUCTION_ENABLED!=='false'||env.PILOT_SYNTHETIC_ONLY!=='true')throw Error('Synthetic gate closed');
 if(!readOnly&&(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>31*86400000||now<start||now>=end))throw Error('Pilot window closed');
 if(!env.PILOT_RECEIPT_SECRET||env.PILOT_RECEIPT_SECRET.length<32||!env.PILOT_PUBLIC_KEY||!env.PILOT_KEY_FINGERPRINT)throw Error('Pilot key configuration missing');
 if(publicFingerprint(env.PILOT_PUBLIC_KEY)!==env.PILOT_KEY_FINGERPRINT)throw Error('Key mismatch');
 return {publicKey:env.PILOT_PUBLIC_KEY,fingerprint:env.PILOT_KEY_FINGERPRINT,secret:env.PILOT_RECEIPT_SECRET};
}
export function authenticated(header,secret) {
 if(typeof secret!=='string'||secret.length<32||typeof header!=='string')return false;
 const actual=Buffer.from(header),expected=Buffer.from(`Bearer ${secret}`);
 return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
export function signed(body,secret){return {...body,mac:createHmac('sha256',secret).update(canonical(body)).digest('hex')};}
export function checked(raw,secret){
 const value=JSON.parse(raw.toString('utf8')), {mac,...body}=value;
 if(typeof mac!=='string'||!/^[a-f0-9]{64}$/.test(mac))throw Error('Invalid receipt');
 if(!timingSafeEqual(Buffer.from(mac,'hex'),Buffer.from(signed(body,secret).mac,'hex')))throw Error('Receipt authentication failed');
 return body;
}
export function checkBundle(raw,day,cfg) {
 const body=checked(raw,cfg.secret);
 if(body.format!=='rubato-synthetic-blob-v1'||body.day!==day||body.synthetic!==true||body.snapshotDigest!==sha256(canonical(fixture(day)))||body.fingerprint!==cfg.fingerprint)throw Error('Wrong archive identity');
 const archive=Buffer.from(body.archive,'base64');
 if(archive.toString('base64')!==body.archive||sha256(archive)!==body.archiveDigest)throw Error('Archive integrity failed');
 return body;
}
export async function run(store,cfg,now=Date.now()) {
 const day=dayOf(now);
 let attempt;
 for(let n=1;n<=MAX_ATTEMPTS;n++) {
  const result=await store.read(path(day,`result-${n}`));
  if(result){const r=checked(result,cfg.secret);if(r.day!==day||r.attempt!==n)throw Error('Wrong receipt identity');if(r.status==='verified'){const raw=await store.read(path(day,'archive'));if(!raw||sha256(raw)!==r.bundleDigest)throw Error('Previously verified archive unavailable');checkBundle(raw,day,cfg);return {...r,idempotent:true};}continue;}
  const started=await store.read(path(day,`attempt-${n}`));
  if(started){const a=checked(started,cfg.secret);if(a.day!==day||a.attempt!==n)throw Error('Wrong attempt identity');if(now-Date.parse(a.startedAt)<LEASE_MS)return {day,status:'in-progress',attempt:n};continue;}
  const won=await store.create(path(day,`attempt-${n}`),bytes(signed({day,attempt:n,startedAt:new Date(now).toISOString(),synthetic:true},cfg.secret)));
  if(!won)return {day,status:'in-progress',attempt:n};attempt=n;break;
 }
 if(!attempt)return {day,status:'retry-exhausted',attempts:MAX_ATTEMPTS};
 let result;
 try {
  let raw=await store.read(path(day,'archive'));
  if(!raw){
   const snapshot=fixture(day),archive=seal(snapshot,cfg.publicKey,cfg.fingerprint);
   const bundle=signed({format:'rubato-synthetic-blob-v1',synthetic:true,day,fingerprint:cfg.fingerprint,snapshotDigest:sha256(canonical(snapshot)),archiveDigest:sha256(archive),archive:archive.toString('base64')},cfg.secret);
   await store.create(path(day,'archive'),bytes(bundle));
   raw=await store.read(path(day,'archive'));
  }
  if(!raw)throw Error('Archive absent');
  const b=checkBundle(raw,day,cfg);
  result={day,attempt,status:'verified',synthetic:true,verifiedAt:new Date(now).toISOString(),archiveDigest:b.archiveDigest,bundleDigest:sha256(raw),snapshotDigest:b.snapshotDigest,restoreVerified:false};
 }catch{
  // Never persist exception text: SDK errors may contain credentials or request details.
  result={day,attempt,status:'failed',synthetic:true,failedAt:new Date(now).toISOString(),errorCode:'ARCHIVE_OR_READBACK_FAILED'};
 }
 const record=bytes(signed(result,cfg.secret));
 if(!await store.create(path(day,`result-${attempt}`),record))throw Error('Receipt collision');
 const durable=await store.read(path(day,`result-${attempt}`));
 if(!durable||!durable.equals(record))throw Error('Receipt readback failed');
 return result;
}
export async function status(store,cfg,now=Date.now()) {
 const secret=cfg.secret;
 let latest=null,latestFailure=null,lastScheduledInvocationAt=null;
 for(const day of [dayOf(now),dayOf(now-86400000)]){const raw=await store.read(path(day,'scheduled'));if(raw){const s=checked(raw,secret);if(s.day!==day||s.source!=='cron-secret-get')throw Error('Wrong trigger identity');if(!lastScheduledInvocationAt||s.observedAt>lastScheduledInvocationAt)lastScheduledInvocationAt=s.observedAt;}}
 for(const day of [dayOf(now),dayOf(now-86400000)])for(let n=1;n<=MAX_ATTEMPTS;n++){
  const raw=await store.read(path(day,`result-${n}`));if(!raw)continue;
  const r=checked(raw,secret);if(r.day!==day||r.attempt!==n)throw Error('Wrong receipt identity');
  if(r.status==='verified'&&(!latest||r.verifiedAt>latest.verifiedAt))latest=r;
  if(r.status==='failed'&&(!latestFailure||r.failedAt>latestFailure.failedAt))latestFailure=r;
 }
 let archivePresent=false;
 if(latest){const raw=await store.read(path(latest.day,'archive'));archivePresent=!!raw&&sha256(raw)===latest.bundleDigest;if(archivePresent)checkBundle(raw,latest.day,cfg);}
 const ageMs=latest?now-Date.parse(latest.verifiedAt):null;
 return {synthetic:true,status:archivePresent&&ageMs!==null&&ageMs>=0&&ageMs<=27*3600000?'fresh':'missed-or-unverified',archivePresent,lastScheduledInvocationAt,lastSuccessAt:latest?.verifiedAt??null,lastFailureAt:latestFailure?.failedAt??null,archiveDigest:latest?.archiveDigest??null,day:latest?.day??null,restoreVerified:false};
}
export async function artifact(store,cfg,day){const raw=await store.read(path(day,'archive'));if(!raw)throw Error('Absent');checkBundle(raw,day,cfg);return raw;}

export async function recordScheduled(store,cfg,now=Date.now()){const day=dayOf(now),p=path(day,'scheduled');await store.create(p,bytes(signed({day,synthetic:true,source:'cron-secret-get',observedAt:new Date(now).toISOString()},cfg.secret)));const raw=await store.read(p);if(!raw)throw Error('Missing trigger receipt');const r=checked(raw,cfg.secret);if(r.day!==day||r.source!=='cron-secret-get')throw Error('Wrong trigger receipt');return r;}
