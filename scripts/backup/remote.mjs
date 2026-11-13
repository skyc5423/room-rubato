import {readFile} from 'node:fs/promises';import {timingSafeEqual,createHash} from 'node:crypto';
import {ensure,PROJECT,validateSnapshot,MAX_BYTES} from './core.mjs';import {uploadManagedB2,uploadManagedReceipt} from './b2.mjs';
import {signReceipt} from './receipts.mjs';
export function authorizedWriterRequest(header,secret) {
  if(typeof header!=='string'||typeof secret!=='string'||secret.length<32||header.length>512)return false;
  const digest=value=>createHash('sha256').update(value).digest();return timingSafeEqual(digest(header),digest(`Bearer ${secret}`));
}
export async function runRemoteBackup(env,client,transport=fetch) {
  ensure(env.BACKUP_PRODUCTION_ENABLED==='true'&&env.BACKUP_ENCRYPTION_MODE==='SSE-B2','Activation disabled');
  ensure(env.VERCEL_PROJECT_ID==='prj_TO6prOB9hvCt8wTFK4IaOTu27ZAF'&&env.VERCEL_ENV==='production','Wrong runtime');
  ensure(env.BACKUP_TARGET_BUCKET_PRIVATE_CONFIRMED==='true','Private bucket verification required');
  ensure(env.BACKUP_RECEIPT_SIGNING_KEY,'Service receipt signing key required');
  let began=false;
  try {
    await client.connect();await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');began=true;
    const lock=await client.query('SELECT pg_try_advisory_xact_lock(5423, 30) AS acquired');ensure(lock.rows?.[0]?.acquired===true,'Another backup is running');
    const size=await client.query("SELECT (SELECT COALESCE(sum(octet_length(row_to_json(p)::text)+256),0) FROM public.persona_profiles p)+(SELECT COALESCE(sum(octet_length(row_to_json(j)::text)+256),0) FROM public.taste_journals j)+4096 AS bytes");
    ensure(Number(size.rows?.[0]?.bytes)<=MAX_BYTES,'Snapshot exceeds bounded export limit');
    const sql=(await readFile(new URL('./export.sql',import.meta.url),'utf8')).replace(/BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;/,'').replace(/COMMIT;/,'');
    const result=await client.query(sql);const list=Array.isArray(result)?result:[result];
    const row=list.flatMap(r=>r.rows||[]).find(r=>r.jsonb_build_object);ensure(row,'Snapshot missing');const snapshot=validateSnapshot(row.jsonb_build_object);
    const fileName=`snapshots/${snapshot.capturedAt.slice(0,10)}/${snapshot.snapshotId}.managed.json`;
    const receipt=await uploadManagedB2(snapshot,{keyId:env.B2_KEY_ID,key:env.B2_APPLICATION_KEY,bucketId:env.B2_BUCKET_ID,fileName},transport);
    const signed=signReceipt({...receipt,project:PROJECT,capturedAt:snapshot.capturedAt,restoreVerified:false},env.BACKUP_RECEIPT_SIGNING_KEY);
    const receiptUpload=await uploadManagedReceipt(signed,{keyId:env.B2_KEY_ID,key:env.B2_APPLICATION_KEY,bucketId:env.B2_BUCKET_ID,fileName:fileName+'.receipt.json'},transport);
    await client.query('COMMIT');began=false;
    // Metadata only. Receipt signature is anchored outside B2 by the pinned public key.
    return {signedReceiptFileId:receiptUpload.fileId,...receipt,project:PROJECT,capturedAt:snapshot.capturedAt,restoreVerified:false};
  } finally {if(began)await client.query('ROLLBACK').catch(()=>{});await client.end().catch(()=>{});}
}

export async function probeRemoteDatabase(env,client) {
  ensure(env.BACKUP_ENABLE_VERIFY==='true'&&env.VERCEL_PROJECT_ID==='prj_TO6prOB9hvCt8wTFK4IaOTu27ZAF'&&env.VERCEL_ENV==='production','Verification disabled');
  try {await client.connect();const result=await client.query("SELECT current_user AS role,(SELECT count(*) FROM public.persona_profiles) AS profiles,(SELECT count(*) FROM public.taste_journals) AS journals,has_table_privilege(current_user,'public.persona_profiles','INSERT,UPDATE,DELETE') AS profile_write,has_table_privilege(current_user,'public.taste_journals','INSERT,UPDATE,DELETE') AS journal_write,has_schema_privilege(current_user,'auth','USAGE') AS auth_access,has_schema_privilege(current_user,'storage','USAGE') AS storage_access");return {verifiedAt:new Date().toISOString(),...result.rows[0]};}finally{await client.end().catch(()=>{});}
}
