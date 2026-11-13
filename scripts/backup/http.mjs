import {readFileSync} from 'node:fs';
// Deploy ONLY to the separate backup-writer project, never enable in the public app.
import pg from 'pg';import {authorizedWriterRequest,runRemoteBackup,probeRemoteDatabase} from './remote.mjs';
export default async function handler(request,response) {
  response.setHeader('Cache-Control','no-store');
  if(request.method!=='GET'){response.statusCode=405;response.end();return;}
  if(!authorizedWriterRequest(request.headers.authorization,process.env.CRON_SECRET)){response.statusCode=401;response.end();return;}
  const verify=request.query?.mode==='verify';
  if(!verify&&process.env.BACKUP_PRODUCTION_ENABLED!=='true'){response.statusCode=503;response.end('Backup is inactive');return;}
  try {
    if(!process.env.BACKUP_DB_HOST||!process.env.BACKUP_DB_USER||!process.env.BACKUP_DB_PASSWORD)throw Error('Missing DB configuration');
    const client=new pg.Client({host:process.env.BACKUP_DB_HOST,port:Number(process.env.BACKUP_DB_PORT||5432),database:process.env.BACKUP_DB_NAME||'postgres',user:process.env.BACKUP_DB_USER,password:process.env.BACKUP_DB_PASSWORD,ssl:{rejectUnauthorized:true,ca:readFileSync(new URL('./supabase-ca.pem',import.meta.url),'utf8')},connectionTimeoutMillis:15000,statement_timeout:30000,application_name:'room-rubato-backup-writer'});
    const receipt=verify?await probeRemoteDatabase(process.env,client):await runRemoteBackup(process.env,client);response.statusCode=200;response.setHeader('Content-Type','application/json');response.end(JSON.stringify(receipt));
  } catch(error) {response.statusCode=503;const safeCodes=['ENOTFOUND','ENETUNREACH','ECONNREFUSED','28P01','42501','SELF_SIGNED_CERT_IN_CHAIN','CERT_HAS_EXPIRED'];response.end(verify?'Verification failed: '+(safeCodes.includes(error?.code)?error.code:'FAILED'):'Backup failed or upload outcome unknown; inspect privately before retrying');}
}
