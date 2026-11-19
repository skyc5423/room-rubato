/** Temporary SYNTHETIC-ONLY evidence through authenticated administrative logs.
 * Never use for real backups. No private key or credential may enter this module's output.
 */
import {config,artifact} from './pilot.mjs';
import {sha256,FORMAT} from './backup-core.mjs';
const CHUNK=1500,MAX=64*1024;
const exact=(value,keys)=>value&&typeof value==='object'&&JSON.stringify(Object.keys(value).sort())===JSON.stringify([...keys].sort());
export async function emitSyntheticDiagnostics({method,env,store,result,log=console.log,now=Date.now()}){
 if(method!=='GET'||env.PILOT_DIAGNOSTIC_LOG!=='true')return false;
 try{
  const cfg=config(env,now); // Active synthetic-only + production-export false + hosted project gates.
  if(result?.status!=='verified'||result.synthetic!==true)return false;
  const raw=await artifact(store,cfg,result.day);
  if(raw.length>MAX||sha256(raw)!==result.bundleDigest)throw Error('invalid');
  const b=JSON.parse(raw.toString('utf8'));
  if(!exact(b,['format','synthetic','day','fingerprint','snapshotDigest','archiveDigest','archive','mac']))throw Error('invalid');
  if(b.archiveDigest!==result.archiveDigest||b.snapshotDigest!==result.snapshotDigest)throw Error('invalid');
  const sealed=JSON.parse(Buffer.from(b.archive,'base64').toString('utf8'));
  if(!exact(sealed,['header','ciphertext','tag'])||!exact(sealed.header,['format','keyFingerprint','cipher','wrap','iv','wrappedKey'])||sealed.header.format!==FORMAT||sealed.header.cipher!=='AES-256-GCM'||sealed.header.wrap!=='RSA-OAEP-SHA256'||sealed.header.keyFingerprint!==cfg.fingerprint)throw Error('invalid');
  if(!Number.isInteger(result.attempt)||result.attempt<1||result.attempt>3||!Number.isFinite(Date.parse(result.verifiedAt)))throw Error('invalid');
  // Construct allowlisted receipt; never spread result/config/env or log raw exceptions.
  const receipt={synthetic:true,status:'verified',day:b.day,attempt:result.attempt,verifiedAt:new Date(result.verifiedAt).toISOString(),archiveDigest:b.archiveDigest,bundleDigest:result.bundleDigest,snapshotDigest:b.snapshotDigest,restoreVerified:false};
  const encoded=raw.toString('base64'),count=Math.ceil(encoded.length/CHUNK);
  log(JSON.stringify({event:'RUBATO_SYNTHETIC_PILOT_RECEIPT',day:b.day,bundleDigest:result.bundleDigest,receipt}));
  for(let index=0;index<count;index++)log(JSON.stringify({event:'RUBATO_SYNTHETIC_PILOT_ARCHIVE_CHUNK',day:b.day,index,count,bundleDigest:result.bundleDigest,data:encoded.slice(index*CHUNK,(index+1)*CHUNK)}));
  return true;
 }catch{
  // Fixed marker only. Logging itself is best effort, never changes durable backup success.
  try{log(JSON.stringify({event:'RUBATO_SYNTHETIC_PILOT_DIAGNOSTIC_FAILED',synthetic:true,errorCode:'EVIDENCE_UNAVAILABLE'}));}catch{}
  return false;
 }
}
