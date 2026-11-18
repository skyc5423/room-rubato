import {put,get} from '@vercel/blob';
import {publicFingerprint} from './backup-core.mjs';
export const MAX_OBJECT=64*1024;
// Dependencies are injectable only for offline tests; routes call with no arguments.
export function createStore({env=process.env,blob={put,get}}={}) {
 const token=env.BLOB_READ_WRITE_TOKEN,fingerprint=env.PILOT_KEY_FINGERPRINT;
 if(typeof token!=='string'||!token.trim()||typeof fingerprint!=='string'||!/^[a-f0-9]{64}$/.test(fingerprint)||typeof env.PILOT_PUBLIC_KEY!=='string'||!env.PILOT_PUBLIC_KEY)throw Error('Storage configuration missing');
 try{if(publicFingerprint(env.PILOT_PUBLIC_KEY)!==fingerprint)throw Error('mismatch');}catch{throw Error('Storage key configuration invalid');}
 if(typeof blob?.get!=='function'||typeof blob?.put!=='function')throw Error('Storage adapter missing');
 // Immutable key-specific physical namespace. Never read/fall back to a historical
 // unscoped archive, and never reinterpret caller input as an SDK URL/path.
 const physical=p=>{
  const m=typeof p==='string'&&p.match(/^synthetic-pilot\/(\d{4}-\d{2}-\d{2})\/(archive|scheduled|attempt-[1-3]|result-[1-3])\.json$/);
  if(!m||!Number.isFinite(Date.parse(m[1]+'T00:00:00.000Z'))||new Date(m[1]+'T00:00:00.000Z').toISOString().slice(0,10)!==m[1])throw Error('Unsafe path');
  return `synthetic-pilot-keys/${fingerprint}/${m[1]}/${m[2]}.json`;
 };
 return {
  async read(path) {
   const key=physical(path); const result=await blob.get(key,{access:'private',token,useCache:false});
   if(!result)return null;
   if(result.statusCode!==200)throw Error('Origin read failed');
   const chunks=[];let size=0;
   for await(const chunk of result.stream){size+=chunk.length;if(size>MAX_OBJECT)throw Error('Object too large');chunks.push(Buffer.from(chunk));}
   return Buffer.concat(chunks);
  },
  async create(path,bytes) {
   const key=physical(path);if(!(bytes instanceof Uint8Array))throw Error('Object bytes required');if(bytes.byteLength>MAX_OBJECT)throw Error('Object too large');
   // No overwrite, delete, client upload endpoint or automatic lifecycle deletion.
   try { await blob.put(key,bytes,{access:'private',token,addRandomSuffix:false,allowOverwrite:false,contentType:'application/json',cacheControlMaxAge:60});return true; }
   catch(error){
    // SDK 2.9.0 has no BlobAlreadyExistsError. After any uncertain create,
    // a bounded origin read may prove this immutable pathname is occupied.
    // For claims this returns lost/not-owned, never authorizes duplicate work.
    if(await this.read(path))return false;throw error;
   }
  }
 };
}
