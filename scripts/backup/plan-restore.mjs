#!/usr/bin/env node
// Offline planning ONLY. Never imports to production, recreates Auth or emits rows to stdout.
import {writeFile} from 'node:fs/promises';
import {readBounded} from './files.mjs';
import {verifyReceipt} from './receipts.mjs';
import {readManagedSnapshot} from './managed.mjs';
import {unseal,restorePlan,ensure,MAX_BYTES} from './core.mjs';
const env=process.env;
async function main() {
  for(const name of ['RESTORE_ARCHIVE_FILE','RESTORE_LEDGER_FILE','RESTORE_LEDGER_PUBLIC_KEY_FILE','RESTORE_CHECKPOINT_FILE','RESTORE_LIVE_OWNERS_FILE','RESTORE_PLAN_FILE']) ensure(env[name],`Missing ${name}`);
  let snapshot;
  if(env.RESTORE_ENCRYPTION_MODE==='SSE-B2') {
    ensure(env.RESTORE_SIGNED_RECEIPT_FILE,'Signed service receipt required');
    const receipt=verifyReceipt(JSON.parse((await readBounded(env.RESTORE_SIGNED_RECEIPT_FILE,16384,true)).toString()),(await readBounded(new URL('./receipt-public.pem',import.meta.url),16384)).toString());
    const bytes=await readBounded(env.RESTORE_ARCHIVE_FILE,MAX_BYTES,true);ensure(bytes.length===receipt.bytes,'Receipt length mismatch');
    snapshot=readManagedSnapshot(bytes,receipt.sha256);
    ensure(receipt.fileName===`snapshots/${snapshot.capturedAt.slice(0,10)}/${snapshot.snapshotId}.managed.json`,'Receipt snapshot mismatch');
  }
  else {
    ensure(env.RESTORE_PRIVATE_KEY_FILE && env.RESTORE_KEY_FINGERPRINT && env.RESTORE_ARCHIVE_SHA256,'Recovery key required for client-encrypted archive');
    let privatePem=(await readBounded(env.RESTORE_PRIVATE_KEY_FILE,32768,true)).toString();
    snapshot=unseal(await readBounded(env.RESTORE_ARCHIVE_FILE,MAX_BYTES*1.5),privatePem,env.RESTORE_KEY_FINGERPRINT,env.RESTORE_ARCHIVE_SHA256);
  }
  const readJson=async name=>JSON.parse((await readBounded(env[name],MAX_BYTES,true)).toString());
  const plan=restorePlan(snapshot,await readJson('RESTORE_LEDGER_FILE'),(await readBounded(env.RESTORE_LEDGER_PUBLIC_KEY_FILE,16384)).toString(),await readJson('RESTORE_CHECKPOINT_FILE'),await readJson('RESTORE_LIVE_OWNERS_FILE'));
  await writeFile(env.RESTORE_PLAN_FILE,JSON.stringify(plan),{flag:'wx',mode:0o600});
  console.log('Offline restore plan created; nothing restored. Keep this plaintext plan private.');
}
main().catch(()=>{console.error('Restore planning refused. Verify keys, fresh independent ledger and live-owner inventory privately.');process.exitCode=1;});
