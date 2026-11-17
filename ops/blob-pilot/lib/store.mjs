import {put,get} from '@vercel/blob';
export const MAX_OBJECT=64*1024;
export function createStore() {
 const token=process.env.BLOB_READ_WRITE_TOKEN;
 if(!token) throw Error('Storage configuration missing');
 const safe=p=>{if(!/^synthetic-pilot\/\d{4}-\d{2}-\d{2}\/(archive|scheduled|attempt-[1-3]|result-[1-3])\.json$/.test(p)) throw Error('Unsafe path');};
 return {
  async read(path) {
   safe(path); const result=await get(path,{access:'private',token,useCache:false});
   if(!result)return null;
   if(result.statusCode!==200)throw Error('Origin read failed');
   const chunks=[];let size=0;
   for await(const chunk of result.stream){size+=chunk.length;if(size>MAX_OBJECT)throw Error('Object too large');chunks.push(Buffer.from(chunk));}
   return Buffer.concat(chunks);
  },
  async create(path,bytes) {
   safe(path);if(bytes.length>MAX_OBJECT)throw Error('Object too large');
   // No overwrite, delete, client upload endpoint or automatic lifecycle deletion.
   try { await put(path,bytes,{access:'private',token,addRandomSuffix:false,allowOverwrite:false,contentType:'application/json',cacheControlMaxAge:60});return true; }
   catch(error){
    // SDK 2.9.0 has no BlobAlreadyExistsError. After any uncertain create,
    // a bounded origin read may prove this immutable pathname is occupied.
    // For claims this returns lost/not-owned, never authorizes duplicate work.
    if(await this.read(path))return false;throw error;
   }
  }
 };
}
