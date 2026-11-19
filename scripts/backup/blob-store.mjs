/** Candidate private Blob adapter. Not imported by any deployed route or CLI.
 * SDK 2.9.0 get/put are injected explicitly; no environment or credential discovery.
 */
import {PROJECT,MAX_BYTES,publicFingerprint} from './core.mjs';
import {createPublicKey} from 'node:crypto';
export const BLOB_TARGET=Object.freeze({storeId:'store_C1xbVeoXtowulKQG',prefix:'room-rubato-app-backups'});
export const MAX_ARCHIVE_BYTES=MAX_BYTES*1.5;
const fail=()=>{throw Error('BLOB_STORE_CONFIGURATION_REJECTED');};
export function assertAppBlobRuntime(){
 // Run before importing the pinned SDK, and again before every SDK call.
 // Its DEBUG flag is captured on import; trusted wiring must not pre-import it.
 const overrides=['VERCEL_BLOB_API_URL','NEXT_PUBLIC_VERCEL_BLOB_API_URL','VERCEL_BLOB_API_VERSION_OVERRIDE','NEXT_PUBLIC_VERCEL_BLOB_API_VERSION_OVERRIDE','VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API','NEXT_PUBLIC_VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API'];
 if(overrides.some(k=>process.env[k]!==undefined)||[process.env.DEBUG,process.env.NEXT_PUBLIC_DEBUG].some(v=>v?.includes('blob')))throw Error('BLOB_TRANSPORT_OVERRIDE_REJECTED');
 // SDK defaults to ten transport retries. Unknown upload outcomes must be reconciled,
 // not automatically retried. This candidate never changes runtime settings itself.
 if(process.env.VERCEL_BLOB_RETRIES!=='0')throw Error('BLOB_TRANSPORT_RETRIES_REJECTED');
}
export function createAppBlobStore({config,token,blob}={}) {
 assertAppBlobRuntime();
 if(config?.enabled!==true||config.mode!=='app-data-candidate'||config.sourceProject!==PROJECT||config.destination?.storeId!==BLOB_TARGET.storeId||config.destination?.prefix!==BLOB_TARGET.prefix)fail();
 const fingerprint=config.keyFingerprint;
 if(!/^[a-f0-9]{64}$/.test(fingerprint||'')||typeof config.publicKey!=='string')fail();
 try{const key=createPublicKey(config.publicKey);if(publicFingerprint(config.publicKey)!==fingerprint||key.asymmetricKeyType!=='rsa'||key.asymmetricKeyDetails.modulusLength<3072)fail();}catch{fail();}
 // Pinned SDK 2.9.0 takes the fourth underscore-delimited component as store ID.
 // Reject other/malformed credentials before any outbound call. Never expose token.
 if(typeof token!=='string'||!/^vercel_blob_rw_C1xbVeoXtowulKQG_[A-Za-z0-9_-]{16,}$/.test(token)||typeof blob?.get!=='function'||typeof blob?.put!=='function')fail();
 const identity=Object.freeze({project:PROJECT,...BLOB_TARGET,keyFingerprint:fingerprint,mode:'app-data-candidate'});
 const physical=path=>{
  const m=typeof path==='string'&&path.match(/^app-data-v1\/([a-f0-9]{64})\/(\d{4}-\d{2}-\d{2})\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\.rrb(\.receipt\.json)?$/);
  if(!m||m[1]!==fingerprint||!Number.isFinite(Date.parse(m[2]+'T00:00:00.000Z'))||new Date(m[2]+'T00:00:00.000Z').toISOString().slice(0,10)!==m[2])throw Error('BLOB_PATH_REJECTED');
  return {key:`${BLOB_TARGET.prefix}/${path}`,limit:m[4]?16384:MAX_ARCHIVE_BYTES};
 };
 const read=async path=>{
  assertAppBlobRuntime();
  const {key,limit}=physical(path);
  try{
   const response=await blob.get(key,{access:'private',token,useCache:false,abortSignal:AbortSignal.timeout(30000)});
   if(response===null)return null;
   if(response?.statusCode!==200||response.blob?.pathname!==key)throw Error('invalid origin');
   const chunks=[];let length=0;
   for await(const chunk of response.stream){if(!(chunk instanceof Uint8Array))throw Error('invalid bytes');length+=chunk.byteLength;if(length>limit)throw Error('oversize');chunks.push(Buffer.from(chunk));}
   return Buffer.concat(chunks);
  }catch{throw Error('BLOB_READ_UNCONFIRMED');}
 };
 const create=async(path,bytes)=>{
  assertAppBlobRuntime();
  const {key,limit}=physical(path);
  if(!(bytes instanceof Uint8Array)||!bytes.byteLength||bytes.byteLength>limit)throw Error('BLOB_BYTES_REJECTED');
  // Snapshot the input: an SDK cannot mutate the caller's expected digest buffer.
  const body=Buffer.from(bytes);
  try{
   const response=await blob.put(key,body,{access:'private',token,addRandomSuffix:false,allowOverwrite:false,contentType:'application/octet-stream',cacheControlMaxAge:60,abortSignal:AbortSignal.timeout(30000)});
   if(response?.pathname!==key)throw Error('invalid acknowledgement');
   return true;
  }catch{
   // Any existing bytes merely establish occupation, not successful readback.
   // The exporter must compare with its independently captured digest/length.
   try{if(await read(path)!==null)return false;}catch{/* No untrusted SDK error details. */}
   throw Error('BLOB_CREATE_UNCONFIRMED');
  }
 };
 return Object.freeze({identity,read,create});
}
