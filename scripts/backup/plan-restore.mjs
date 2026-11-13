#!/usr/bin/env node
// Offline planning ONLY. Never imports to production, recreates Auth or emits rows to stdout.
import {writeFile} from 'node:fs/promises';
import {readBounded} from './files.mjs';
import {unseal,restorePlan,ensure,MAX_BYTES} from './core.mjs';
const env=process.env;
async function main() {
  for(const name of ['RESTORE_ARCHIVE_FILE','RESTORE_ARCHIVE_SHA256','RESTORE_PRIVATE_KEY_FILE','RESTORE_KEY_FINGERPRINT','RESTORE_LEDGER_FILE','RESTORE_LEDGER_PUBLIC_KEY_FILE','RESTORE_CHECKPOINT_FILE','RESTORE_LIVE_OWNERS_FILE','RESTORE_PLAN_FILE']) ensure(env[name],`Missing ${name}`);
  const snapshot=unseal(await readBounded(env.RESTORE_ARCHIVE_FILE,MAX_BYTES*1.5),(await readBounded(env.RESTORE_PRIVATE_KEY_FILE,16384,true)).toString(),env.RESTORE_KEY_FINGERPRINT,env.RESTORE_ARCHIVE_SHA256);
  const readJson=async name=>JSON.parse((await readBounded(env[name],MAX_BYTES,true)).toString());
  const plan=restorePlan(snapshot,await readJson('RESTORE_LEDGER_FILE'),(await readBounded(env.RESTORE_LEDGER_PUBLIC_KEY_FILE,16384)).toString(),await readJson('RESTORE_CHECKPOINT_FILE'),await readJson('RESTORE_LIVE_OWNERS_FILE'));
  await writeFile(env.RESTORE_PLAN_FILE,JSON.stringify(plan),{flag:'wx',mode:0o600});
  console.log('Offline restore plan created; nothing restored. Keep this plaintext plan private.');
}
main().catch(()=>{console.error('Restore planning refused. Verify keys, fresh independent ledger and live-owner inventory privately.');process.exitCode=1;});
