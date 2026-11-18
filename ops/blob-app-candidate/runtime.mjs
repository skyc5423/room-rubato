/** Independent deployment candidate. A flag is not authorization to deploy or export data.
 * No recovery/decryption private key is accepted or loaded by this package.
 * Import only through this module: Blob DEBUG settings must be checked before SDK import.
 */
import {readFileSync} from 'node:fs';
import {createBlobBackupHandler} from '../../scripts/backup/blob-runtime.mjs';
import {createAppBlobSource} from '../../scripts/backup/blob-source.mjs';
import {assertAppBlobRuntime,createAppBlobStore} from '../../scripts/backup/blob-store.mjs';
const manifest=JSON.parse(readFileSync(new URL('./config.json',import.meta.url),'utf8'));
const inactive=()=>new Response(JSON.stringify({code:'BACKUP_INACTIVE'}),{status:503,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
const runtimeNames=['VERCEL','VERCEL_PROJECT_ID','VERCEL_ENV','BACKUP_PRODUCTION_ENABLED','BACKUP_TARGET_STORE_PRIVATE_CONFIRMED','PILOT_DIAGNOSTIC_LOG','BACKUP_DIAGNOSTIC_LOG'];
/** Injection is for isolated tests only; the default uses pinned package dependencies.
 * Secret values are read only after the relevant activation/authentication gate.
 */
export function createPackagedHandler({config=manifest,readEnv=name=>process.env[name],loadBlob=()=>import('@vercel/blob'),loadPg=()=>import('pg')}={}){
 const fixed=structuredClone(config);
 let handler;
 return async request=>{
  if(fixed?.enabled!==true||fixed.mode!=='app-data-candidate'||!(/^[a-f0-9]{64}$/).test(fixed.keyFingerprint||'')||!(/^[a-f0-9]{64}$/).test(fixed.receiptKeyFingerprint||''))return inactive(); // no env/secret access, even if ambient flags say true
  try{
   if(!handler){
    const runtime=Object.fromEntries(runtimeNames.map(name=>[name,readEnv(name)]));
    if(runtime.VERCEL!=='1'||runtime.VERCEL_PROJECT_ID!=='prj_TO6prOB9hvCt8wTFK4IaOTu27ZAF'||runtime.VERCEL_ENV!=='production'||runtime.BACKUP_PRODUCTION_ENABLED!=='true'||runtime.BACKUP_TARGET_STORE_PRIVATE_CONFIRMED!=='true'||runtime.PILOT_DIAGNOSTIC_LOG==='true'||runtime.BACKUP_DIAGNOSTIC_LOG==='true')return inactive();
    handler=createBlobBackupHandler({runtime,config:fixed,cronSecret:readEnv('CRON_SECRET'),manualSecret:readEnv('APP_BACKUP_RUN_SECRET'),requestTimeoutMs:180000,
     async createStore(c){
      assertAppBlobRuntime();
      c.publicKey=readEnv('APP_BACKUP_RECOVERY_PUBLIC_KEY');
      c.receiptPublicKey=readEnv('APP_BACKUP_RECEIPT_PUBLIC_KEY');
      c.receiptPrivateKey=readEnv('APP_BACKUP_RECEIPT_SIGNING_KEY');
      const token=readEnv('APP_BACKUP_BLOB_READ_WRITE_TOKEN');
      // No process.env credentials are discovered by the SDK: pass this token explicitly.
      const sdk=await loadBlob();assertAppBlobRuntime();
      return createAppBlobStore({config:c,token,blob:sdk});
     },
     async createSource(c){
      const pg=await loadPg();
      return createAppBlobSource({config:c,password:readEnv('APP_BACKUP_DB_PASSWORD'),Client:pg.Client||pg.default?.Client});
     }
    });
   }
   return await handler(request);
  }catch{return inactive();} // never serialize loader errors, key values, or provider diagnostics
 };
}
export const handleBackup=createPackagedHandler();
