import {createHash} from 'node:crypto';
import {ensure,MAX_BYTES,sha256,validateSnapshot,canonical} from './core.mjs';
function trustedUrl(value) {
  const url=new URL(value);
  ensure(url.protocol==='https:' && !url.username && !url.password && !url.port && (url.hostname==='api.backblazeb2.com' || url.hostname.endsWith('.backblazeb2.com')), 'Untrusted B2 destination');
  return url.href;
}
async function responseJson(response) {
  ensure(response.ok,'B2 request rejected');
  const chunks=[]; let size=0;
  ensure(response.body,'Missing B2 response');
  for await (const chunk of response.body) {
    size+=chunk.byteLength; ensure(size<2*1024*1024,'B2 response too large'); chunks.push(Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function authorizeB2(keyId,key,transport=fetch) {
  ensure(typeof keyId==='string' && keyId && typeof key==='string' && key,'B2 credentials missing');
  const data=await responseJson(await transport('https://api.backblazeb2.com/b2api/v3/b2_authorize_account',{headers:{Authorization:`Basic ${Buffer.from(`${keyId}:${key}`).toString('base64')}`},redirect:'error',signal:AbortSignal.timeout(30000)}));
  const storage=data.apiInfo?.storageApi;
  ensure(storage && storage.apiUrl && data.authorizationToken,'Invalid B2 authorization'); trustedUrl(storage.apiUrl);
  return {apiUrl:storage.apiUrl,token:data.authorizationToken,allowed:storage};
}
/** No delete API, no retries on uncertain upload, encrypted bytes only. */
export async function uploadB2(archive,config,transport=fetch) {
  const envelope=JSON.parse(archive.toString()); ensure(envelope.header?.cipher==='AES-256-GCM' && typeof envelope.ciphertext==='string','Encrypted archive required');
  return uploadBytes(archive,config,transport,false);
}
/** SSE-B2 mode: data is sent over TLS to private B2, where the provider manages encryption. */
export async function uploadManagedB2(snapshot,config,transport=fetch) {
  const archive=Buffer.from(canonical(validateSnapshot(snapshot)));
  return uploadBytes(archive,config,transport,true);
}
export async function uploadManagedReceipt(receipt,config,transport=fetch) {
  ensure(receipt?.format==='room-rubato-managed-receipt-v1' && typeof receipt.signature==='string','Signed receipt required');
  const bytes=Buffer.from(canonical(receipt));ensure(bytes.length<16384,'Receipt too large');
  return uploadBytes(bytes,config,transport,true,true);
}
async function uploadBytes(archive,{keyId,key,bucketId,fileName},transport,managed,isReceipt=false) {
  ensure(Buffer.isBuffer(archive) && archive.length>0 && archive.length<MAX_BYTES*1.5,'Invalid archive size');
  ensure(bucketId==='a593f42c829bd620a011031b' && (isReceipt?/^snapshots\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]{36}\.managed\.json\.receipt\.json$/:managed?/^snapshots\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]{36}\.managed\.json$/:/^snapshots\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]{36}\.rrb$/).test(fileName),'Invalid backup destination');
  const session=await authorizeB2(keyId,key,transport);
  const allowed=session.allowed;
  // A bucket-scoped key is required: broad account keys are rejected.
  const ids=allowed.buckets?.map(b=>b.id) ?? (allowed.bucketId?[allowed.bucketId]:[]);
  ensure(ids.length===1 && ids[0]===bucketId,'Bucket-scoped key required');
  ensure(allowed.namePrefix==='snapshots/','Snapshot-prefix-scoped key required');
  const capabilities=allowed.capabilities;
  ensure(Array.isArray(capabilities) && capabilities.includes('writeFiles') && capabilities.every(c=>c==='writeFiles'),'Writer key has excessive permissions');
  const target=await responseJson(await transport(`${trustedUrl(session.apiUrl).replace(/\/$/,'')}/b2api/v3/b2_get_upload_url`,{method:'POST',headers:{Authorization:session.token,'Content-Type':'application/json'},body:JSON.stringify({bucketId}),redirect:'error',signal:AbortSignal.timeout(30000)}));
  ensure(target.bucketId===bucketId && typeof target.authorizationToken==='string','Upload bucket mismatch');
  const digest=createHash('sha1').update(archive).digest('hex');
  const result=await responseJson(await transport(trustedUrl(target.uploadUrl),{method:'POST',headers:{Authorization:target.authorizationToken,'X-Bz-File-Name':encodeURIComponent(fileName),'Content-Type':'application/octet-stream','X-Bz-Content-Sha1':digest,'X-Bz-Info-archive-sha256':sha256(archive),...(managed?{'X-Bz-Server-Side-Encryption':'AES256'}:{})},body:archive,redirect:'error',signal:AbortSignal.timeout(120000)}));
  ensure(result.bucketId===bucketId && result.fileName===fileName && result.contentLength===archive.length && result.contentSha1===digest && typeof result.fileId==='string','Upload acknowledgment mismatch; outcome unknown');
  if(managed) ensure(result.serverSideEncryption?.mode==='SSE-B2' && result.serverSideEncryption?.algorithm==='AES256','SSE-B2 acknowledgment mismatch; outcome unknown');
  return {encryptionMode:managed?'SSE-B2':'client-envelope',fileId:result.fileId,fileName,bucketId,bytes:archive.length,sha256:sha256(archive),acknowledgedAt:new Date().toISOString(),readbackVerified:false};
}
