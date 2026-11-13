#!/usr/bin/env node
// Stage an encrypted snapshot. Upload requires explicit flag AND activation gate.
import {readFile,writeFile,mkdir,lstat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join,resolve} from 'node:path';
import {ensure,seal,MAX_BYTES,validateSnapshot,sha256} from './core.mjs';
import {uploadB2} from './b2.mjs';
export async function run(env=process.env,args=process.argv.slice(2)) {
  ensure(args.length===0 || (args.length===1 && args[0]==='--upload'),'Only --upload supported');
  ensure(env.BACKUP_PRODUCTION_ENABLED==='true','Backup activation is disabled');
  for(const name of ['PGHOST','PGDATABASE','PGUSER','PGPASSFILE','BACKUP_OUTPUT_DIR','BACKUP_PUBLIC_KEY_FILE','BACKUP_KEY_FINGERPRINT']) ensure(env[name],`Missing ${name}`);
  ensure(!env.PGPASSWORD && !env.DATABASE_URL,'Use an approved restricted PGPASSFILE, not URL/env passwords');
  const pass=await lstat(env.PGPASSFILE); ensure((pass.mode&0o077)===0 && pass.isFile(),'PGPASSFILE must be private');
  const pub=await readFile(env.BACKUP_PUBLIC_KEY_FILE,'utf8'); ensure(!pub.includes('PRIVATE KEY'),'Writer must not have private recovery key');
  const output=spawnSync('psql',['-X','-q','-A','-t','-v','ON_ERROR_STOP=1','-f',fileURLToPath(new URL('./export.sql',import.meta.url))],{
    env:{PATH:env.PATH,PGHOST:env.PGHOST,PGPORT:env.PGPORT||'5432',PGDATABASE:env.PGDATABASE,PGUSER:env.PGUSER,PGPASSFILE:env.PGPASSFILE,PGSSLMODE:'verify-full',PGSSLROOTCERT:env.PGSSLROOTCERT,PGCONNECT_TIMEOUT:'15'},
    encoding:'utf8',maxBuffer:MAX_BYTES,timeout:60000
  });
  // Never echo psql stdout/stderr: they can contain personal data or credentials.
  ensure(!output.error && output.status===0,'Snapshot export failed');
  const snapshot=validateSnapshot(JSON.parse(output.stdout.trim()));
  const bytes=seal(snapshot,pub,env.BACKUP_KEY_FINGERPRINT);
  const day=new Date(snapshot.capturedAt).toISOString().slice(0,10);
  const fileName=`snapshots/${day}/${snapshot.snapshotId}.rrb`;
  const directory=resolve(env.BACKUP_OUTPUT_DIR); await mkdir(directory,{recursive:true,mode:0o700});
  const directoryStat=await lstat(directory); ensure((directoryStat.mode&0o077)===0 && directoryStat.isDirectory(),'Output directory must be private');
  const path=join(directory,`${snapshot.snapshotId}.rrb`); await writeFile(path,bytes,{flag:'wx',mode:0o600});
  const receipt={fileName,bytes:bytes.length,sha256:sha256(bytes),uploaded:false};
  if(args[0]==='--upload') Object.assign(receipt,await uploadB2(bytes,{keyId:env.B2_KEY_ID,key:env.B2_APPLICATION_KEY,bucketId:env.B2_BUCKET_ID,fileName}),{uploaded:true});
  await writeFile(`${path}.receipt.json`,JSON.stringify(receipt),{flag:'wx',mode:0o600});
  return {status:receipt.uploaded?'upload_acknowledged_not_restore_verified':'encrypted_snapshot_staged'};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) run().then(result=>console.log(JSON.stringify(result))).catch(()=>{console.error('Backup failed or upload outcome unknown. Inspect privately; do not blindly retry.');process.exitCode=1;});
