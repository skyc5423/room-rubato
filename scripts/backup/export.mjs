import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {lstat} from 'node:fs/promises';
import {ensure,MAX_BYTES,validateSnapshot} from './core.mjs';
export async function exportSnapshot(env) {
  for(const name of ['PGHOST','PGDATABASE','PGUSER','PGPASSFILE'])ensure(env[name],`Missing ${name}`);
  ensure(!env.PGPASSWORD && !env.DATABASE_URL,'Use an approved private PGPASSFILE');
  const pass=await lstat(env.PGPASSFILE);ensure(pass.isFile()&&(pass.mode&0o077)===0,'Private password file required');
  const result=spawnSync('psql',['-X','-q','-A','-t','-v','ON_ERROR_STOP=1','-f',fileURLToPath(new URL('./export.sql',import.meta.url))],{env:{PATH:env.PATH,PGHOST:env.PGHOST,PGPORT:env.PGPORT||'5432',PGDATABASE:env.PGDATABASE,PGUSER:env.PGUSER,PGPASSFILE:env.PGPASSFILE,PGSSLMODE:'verify-full',PGSSLROOTCERT:env.PGSSLROOTCERT,PGCONNECT_TIMEOUT:'15'},encoding:'utf8',maxBuffer:MAX_BYTES,timeout:60000});
  ensure(!result.error&&result.status===0,'Snapshot export failed');return validateSnapshot(JSON.parse(result.stdout.trim()));
}
