/** Disabled-by-default Node runtime candidate. Not mounted in any deployed app. */
import {createHash,timingSafeEqual} from 'node:crypto';
import {exportToBlob} from './blob-export.mjs';
const WRITER='prj_TO6prOB9hvCt8wTFK4IaOTu27ZAF';
const reply=(status,code,extra={})=>new Response(JSON.stringify({code,...extra}),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
function authorized(value,secret){
 if(typeof value!=='string'||value.length>512||typeof secret!=='string'||secret.length<32||secret.length>256)return false;
 const digest=s=>createHash('sha256').update(s).digest();
 return timingSafeEqual(digest(value),digest(`Bearer ${secret}`));
}
function permitted(env,c){
 return env?.VERCEL==='1'&&env.VERCEL_PROJECT_ID===WRITER&&env.VERCEL_ENV==='production'&&env.BACKUP_PRODUCTION_ENABLED==='true'&&env.BACKUP_TARGET_STORE_PRIVATE_CONFIRMED==='true'&&env.PILOT_DIAGNOSTIC_LOG!=='true'&&env.BACKUP_DIAGNOSTIC_LOG!=='true'&&c?.enabled===true&&c.mode==='app-data-candidate';
}
/** Caller supplies trusted fixed adapters/config. No env, credentials or SDK auto-discovery.
 * runtime and config are snapshotted; request URL/body never selects source/target.
 * The per-instance lock is not a distributed scheduler or durable retry ledger.
 */
export function createBlobBackupHandler({runtime={},config,cronSecret,manualSecret,createSource,createStore,requestTimeoutMs=180000}={}){
 const env={...runtime};
 const c=config?{...config,destination:{...config.destination},source:{...config.source},confirmedScope:Array.isArray(config.confirmedScope)?[...config.confirmedScope]:config.confirmedScope}:null;
 let busy=false;
 return async request=>{
  try{
   if(!['GET','POST'].includes(request?.method))return reply(405,'METHOD_NOT_ALLOWED');
   const url=new URL(request.url);
   if(url.pathname!=='/api/app-backup'||url.search||request.body!==null)return reply(400,'REQUEST_NOT_ACCEPTED');
   if(!permitted(env,c))return reply(503,'BACKUP_INACTIVE');
   if(typeof cronSecret!=='string'||typeof manualSecret!=='string'||cronSecret===manualSecret||cronSecret.length<32||manualSecret.length<32||cronSecret.length>256||manualSecret.length>256)return reply(503,'BACKUP_INACTIVE');
   if(!authorized(request.headers.get('authorization'),request.method==='GET'?cronSecret:manualSecret))return reply(401,'UNAUTHORIZED');
   if(busy)return reply(409,'BACKUP_IN_PROGRESS');
   if(typeof createSource!=='function'||typeof createStore!=='function'||!Number.isSafeInteger(requestTimeoutMs)||requestTimeoutMs<1||requestTimeoutMs>180000)return reply(503,'BACKUP_INACTIVE');
   busy=true;
   const operation=(async()=>{try{
    // Store validation occurs before a source object, and both before connect.
    const store=await createStore(c),client=await createSource(c);
    const result=await exportToBlob({config:c,client,store});
    const p=result.receipt.payload;
    return reply(200,'ARCHIVE_READBACK_VERIFIED',{capturedAt:p.capturedAt,archiveDigest:p.sha256,archiveBytes:p.bytes,receiptPath:result.receiptPath,readbackVerified:true,restoreVerified:false});
   }catch{return reply(503,'BACKUP_FAILED_OR_UNCONFIRMED');}
   finally{busy=false;}})();
   let timer;
   try{return await Promise.race([operation,new Promise(resolve=>{timer=setTimeout(()=>resolve(reply(503,'BACKUP_OUTCOME_UNCONFIRMED')),requestTimeoutMs);})]);}
   finally{clearTimeout(timer);}
  }catch{return reply(400,'REQUEST_NOT_ACCEPTED');}
 };
}
