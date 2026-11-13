#!/usr/bin/env node
// No recovery key or plaintext staging. Provider-managed encryption under TLS.
import {mkdir,lstat,writeFile} from 'node:fs/promises';import {resolve,join} from 'node:path';import {fileURLToPath} from 'node:url';
import {ensure,PROJECT} from './core.mjs';import {exportSnapshot} from './export.mjs';import {uploadManagedB2} from './b2.mjs';
export async function runManaged(env=process.env) {
  ensure(env.BACKUP_PRODUCTION_ENABLED==='true' && env.BACKUP_ENCRYPTION_MODE==='SSE-B2','Managed backup activation is disabled');
  ensure(env.BACKUP_TARGET_BUCKET_PRIVATE_CONFIRMED==='true','Independent private bucket verification required');
  ensure(env.BACKUP_RECEIPT_DIR,'Private receipt destination required');
  const directory=resolve(env.BACKUP_RECEIPT_DIR);await mkdir(directory,{recursive:true,mode:0o700});const info=await lstat(directory);ensure(info.isDirectory()&&(info.mode&0o077)===0,'Private receipt directory required');
  const snapshot=await exportSnapshot(env);
  const fileName=`snapshots/${snapshot.capturedAt.slice(0,10)}/${snapshot.snapshotId}.managed.json`;
  const receipt=await uploadManagedB2(snapshot,{keyId:env.B2_KEY_ID,key:env.B2_APPLICATION_KEY,bucketId:env.B2_BUCKET_ID,fileName});
  await writeFile(join(directory,`${snapshot.snapshotId}.receipt.json`),JSON.stringify({...receipt,project:PROJECT,capturedAt:snapshot.capturedAt,restoreVerified:false}),{flag:'wx',mode:0o600});
  return {status:'SSE-B2_upload_acknowledged_not_restore_verified'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))runManaged().then(result=>console.log(JSON.stringify(result))).catch(()=>{console.error('Managed backup failed or upload outcome unknown. Never blindly retry.');process.exitCode=1;});
