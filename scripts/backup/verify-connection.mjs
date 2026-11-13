import {readFileSync} from 'node:fs';
// Read-only deployment-time probe. Logs metadata only, never source rows or credentials.
import pg from 'pg';import {probeRemoteDatabase} from './remote.mjs';
const env=process.env;
try {
  console.log('BACKUP_DB_CONFIGURATION '+JSON.stringify({passwordPresent:typeof env.BACKUP_DB_PASSWORD==='string'&&env.BACKUP_DB_PASSWORD.length>0,passwordLength:env.BACKUP_DB_PASSWORD?.length,expectedUser:env.BACKUP_DB_USER==='rr_backup_writer.nhusocbyuxzjsfwitkhe',expectedPooler:env.BACKUP_DB_HOST==='aws-0-ap-northeast-2.pooler.supabase.com'}));
  const client=new pg.Client({host:env.BACKUP_DB_HOST,port:Number(env.BACKUP_DB_PORT||5432),database:env.BACKUP_DB_NAME||'postgres',user:env.BACKUP_DB_USER,password:env.BACKUP_DB_PASSWORD,ssl:{rejectUnauthorized:true,ca:readFileSync(new URL('./supabase-ca.pem',import.meta.url),'utf8')},connectionTimeoutMillis:15000,statement_timeout:30000,application_name:'room-rubato-backup-probe'});
  const result=await probeRemoteDatabase(env,client);console.log('BACKUP_DB_VERIFIED '+JSON.stringify(result));
} catch(error) {const safe=['ENOTFOUND','ENETUNREACH','ECONNREFUSED','28P01','42501','SELF_SIGNED_CERT_IN_CHAIN','CERT_HAS_EXPIRED','ETIMEDOUT'];console.log('BACKUP_DB_NOT_VERIFIED '+(safe.includes(error?.code)?error.code:'FAILED'));process.exitCode=1;}
