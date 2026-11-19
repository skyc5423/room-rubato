import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPackagedHandler} from '../../../ops/blob-app-candidate/runtime.mjs';
import api from '../../../ops/blob-app-candidate/api/app-backup.mjs';
const manifest=JSON.parse(readFileSync(new URL('../../../ops/blob-app-candidate/config.json',import.meta.url),'utf8'));
const cron='synthetic-cron-secret-'.repeat(3),manual='synthetic-manual-secret-'.repeat(3);
const runtime={VERCEL:'1',VERCEL_PROJECT_ID:'prj_TO6prOB9hvCt8wTFK4IaOTu27ZAF',VERCEL_ENV:'production',BACKUP_PRODUCTION_ENABLED:'true',BACKUP_TARGET_STORE_PRIVATE_CONFIRMED:'true',CRON_SECRET:cron,APP_BACKUP_RUN_SECRET:manual};
const request=(secret=manual)=>new Request('https://fixture.invalid/api/app-backup',{method:'POST',headers:{authorization:'Bearer '+secret}});
const enabled=()=>({...structuredClone(manifest),enabled:true,keyFingerprint:'a'.repeat(64),receiptKeyFingerprint:'b'.repeat(64)});
function harness(config=manifest,values=runtime){const reads=[];let imports=0;return {reads,get imports(){return imports;},handle:createPackagedHandler({config,readEnv(name){reads.push(name);return values[name];},loadBlob(){imports++;throw Error('PRIVATE SDK ERROR');},loadPg(){imports++;throw Error('PRIVATE PG ERROR');}})};}
test('disabled and absent pins do not access environment, secrets or SDK',async()=>{
 for(const config of [manifest,{...manifest,enabled:true},{...enabled(),receiptKeyFingerprint:''}]){const h=harness(config);const r=await h.handle(request());assert.equal(r.status,503);assert.equal(r.headers.get('cache-control'),'no-store');assert.deepEqual(h.reads,[]);assert.equal(h.imports,0);}
});
test('inactive runtime never reads auth or data credentials',async()=>{const h=harness(enabled(),{...runtime,BACKUP_PRODUCTION_ENABLED:'false'});assert.equal((await h.handle(request())).status,503);assert(!h.reads.includes('CRON_SECRET'));assert(!h.reads.some(n=>n.startsWith('APP_BACKUP_')));assert.equal(h.imports,0);});
test('valid runtime still authenticates before data secrets or SDK imports',async()=>{
 const h=harness(enabled());for(const secret of ['wrong',cron])assert.equal((await h.handle(request(secret))).status,401);
 assert.equal(h.imports,0);assert(h.reads.includes('CRON_SECRET'));assert(h.reads.includes('APP_BACKUP_RUN_SECRET'));assert(!h.reads.some(n=>['APP_BACKUP_RECOVERY_PUBLIC_KEY','APP_BACKUP_RECEIPT_PUBLIC_KEY','APP_BACKUP_RECEIPT_SIGNING_KEY','APP_BACKUP_BLOB_READ_WRITE_TOKEN','APP_BACKUP_DB_PASSWORD'].includes(n)));
});
test('transport override is rejected before SDK import or data-secret reads',async()=>{
 const keys=['VERCEL_BLOB_RETRIES','VERCEL_BLOB_API_URL'];const previous=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 try{process.env.VERCEL_BLOB_RETRIES='0';process.env.VERCEL_BLOB_API_URL='https://never-connect.invalid';const h=harness(enabled()),r=await h.handle(request());assert.equal(r.status,503);assert.equal((await r.json()).code,'BACKUP_FAILED_OR_UNCONFIRMED');assert.equal(h.imports,0);assert(!h.reads.includes('APP_BACKUP_RECEIPT_SIGNING_KEY'));assert(!h.reads.includes('APP_BACKUP_DB_PASSWORD'));}finally{for(const k of keys){if(previous[k]===undefined)delete process.env[k];else process.env[k]=previous[k];}}
});
test('original Vercel Node adapter remains disabled and sends safe headers',async()=>{const headers={};let body;const res={setHeader(k,v){headers[k]=v;},end(v){body=v;}};await api({method:'GET',url:'/api/app-backup',headers:{}},res);assert.equal(res.statusCode,503);assert.equal(headers['cache-control'],'no-store');assert.equal(headers['x-content-type-options'],'nosniff');assert.deepEqual(JSON.parse(body),{code:'BACKUP_INACTIVE'});});

import {generateKeyPairSync} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {BLOB_SOURCE_TARGET} from '../blob-source.mjs';
import {BLOB_TARGET} from '../blob-store.mjs';
import {verifyBlobReceipt} from '../blob-export.mjs';
import {SCHEMA,PROJECT,publicFingerprint,unseal} from '../core.mjs';
import {fixture} from '../../../ops/blob-pilot/lib/fixture.mjs';
const types={user_id:'uuid',gender:'text',age_group:'text',occupation:'text',completed_count:'integer',state:'jsonb',consent_agreed_at:'timestamptz',consent_version:'text',updated_at:'timestamptz',revision:'uuid',last_write_id:'uuid'};
const makeTables=async db=>{for(const [table,columns]of Object.entries(SCHEMA))await db.exec(`CREATE TABLE public.${table} (${columns.map(c=>`${c} ${types[c]}`).join(',')});`);};
const insertRows=async(db,tables)=>{for(const [table,rows]of Object.entries(tables))for(const row of rows){const cols=SCHEMA[table];await db.query(`INSERT INTO public.${table} (${cols.join(',')}) VALUES (${cols.map((_,i)=>'$'+(i+1)).join(',')})`,cols.map(c=>c==='state'?JSON.stringify(row[c]):row[c]));}};

test('full package wiring injects authenticated secrets into restricted SQL, encrypted sink and isolated restore',{timeout:30000},async()=>{
 const oldRetries=process.env.VERCEL_BLOB_RETRIES;process.env.VERCEL_BLOB_RETRIES='0';
 const sourceDb=new PGlite(),targetDb=new PGlite();
 try{
  const rsa=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{format:'pem',type:'spki'},privateKeyEncoding:{format:'pem',type:'pkcs8'}});
  const ed=generateKeyPairSync('ed25519',{publicKeyEncoding:{format:'pem',type:'spki'},privateKeyEncoding:{format:'pem',type:'pkcs8'}});
  const keyFingerprint=publicFingerprint(rsa.publicKey),receiptKeyFingerprint=publicFingerprint(ed.publicKey);
  const config={enabled:true,mode:'app-data-candidate',sourceProject:PROJECT,source:BLOB_SOURCE_TARGET,destination:BLOB_TARGET,confirmedScope:Object.keys(SCHEMA),keyFingerprint,receiptKeyFingerprint,maxArchiveBytes:100000};
  const expected=fixture(new Date().toISOString().slice(0,10)).tables;
  await makeTables(sourceDb);await insertRows(sourceDb,expected);
  const sourceRows={};for(const table of Object.keys(SCHEMA))sourceRows[table]=(await sourceDb.query(`SELECT to_jsonb(t) AS row FROM public.${table} t ORDER BY user_id`)).rows.map(r=>r.row);
  await sourceDb.exec('CREATE ROLE rr_backup_writer NOINHERIT; REVOKE CREATE ON SCHEMA public FROM PUBLIC; GRANT USAGE ON SCHEMA public TO rr_backup_writer; GRANT SELECT ON public.persona_profiles,public.taste_journals TO rr_backup_writer; ALTER TABLE public.persona_profiles ENABLE ROW LEVEL SECURITY; ALTER TABLE public.taste_journals ENABLE ROW LEVEL SECURITY; CREATE POLICY backup_read ON public.persona_profiles FOR SELECT TO rr_backup_writer USING (true); CREATE POLICY backup_read ON public.taste_journals FOR SELECT TO rr_backup_writer USING (true); SET ROLE rr_backup_writer;');
  const sql=[],calls=[],files=new Map();let constructed=0,closed=0;const failures=[];
  class Client{
   constructor(options){constructed++;assert.equal(options.host,BLOB_SOURCE_TARGET.host);assert.equal(options.user,BLOB_SOURCE_TARGET.user);assert.equal(options.ssl.rejectUnauthorized,true);assert.match(options.ssl.ca,/BEGIN CERTIFICATE/);assert.equal(options.query_timeout,30000);assert.equal(options.password,'SYNTHETIC SOURCE PASSWORD');assert(!('connectionString'in options));}
   async connect(){} // no network: local fixture role was set above
   async query(statement){sql.push(statement);try{return await sourceDb.query(statement);}catch(error){failures.push(error.message);throw error;}}
   async end(){closed++;}
  }
  const blob={
   async put(path,bytes,options){calls.push('put');assert.equal(options.access,'private');assert.equal(options.allowOverwrite,false);assert.equal(options.addRandomSuffix,false);assert(!bytes.includes('SYNTHETIC ONLY'));if(files.has(path))throw Error('occupied');files.set(path,Buffer.from(bytes));return {pathname:path};},
   async get(path,options){calls.push('get');assert.equal(options.access,'private');assert.equal(options.useCache,false);return files.has(path)?{statusCode:200,blob:{pathname:path},stream:(async function*(){yield files.get(path);})()}:null;}
  };
  const cron='synthetic-cron-secret-'.repeat(3),manual='synthetic-manual-secret-'.repeat(3);
  const secretReads=[];let blobImports=0,pgImports=0;
  const values={...runtime,CRON_SECRET:cron,APP_BACKUP_RUN_SECRET:manual,APP_BACKUP_RECOVERY_PUBLIC_KEY:rsa.publicKey,APP_BACKUP_RECEIPT_PUBLIC_KEY:ed.publicKey,APP_BACKUP_RECEIPT_SIGNING_KEY:ed.privateKey,APP_BACKUP_BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_C1xbVeoXtowulKQG_SYNTHETIC_ONLY_NOT_REAL',APP_BACKUP_DB_PASSWORD:'SYNTHETIC SOURCE PASSWORD'};
  const handler=createPackagedHandler({config,readEnv(name){secretReads.push(name);return values[name];},async loadBlob(){blobImports++;return blob;},async loadPg(){pgImports++;return {Client};}});
  const request=secret=>new Request('https://writer.invalid/api/app-backup',{method:'POST',headers:{authorization:'Bearer '+secret}});
  assert.equal((await handler(request(cron))).status,401);assert.equal(constructed,0);assert.equal(calls.length,0);assert.equal(blobImports+pgImports,0);assert(!secretReads.includes('APP_BACKUP_DB_PASSWORD'));
  const response=await handler(request(manual)),body=await response.json();
  assert.equal(response.status,200,JSON.stringify({body,sql,failures}));assert.equal(body.code,'ARCHIVE_READBACK_VERIFIED');assert.equal(body.restoreVerified,false);assert.equal(body.readbackVerified,true);assert.equal(response.headers.get('cache-control'),'no-store');
  assert(!JSON.stringify(body).includes('SYNTHETIC'));assert.equal(constructed,1);assert.equal(closed,1);assert(sql.some(q=>q.includes('source_metadata')));assert(sql.some(q=>q.includes('REPEATABLE READ READ ONLY')));assert.equal(sql.at(-1),'COMMIT');
  const receipt=JSON.parse(files.get(`${BLOB_TARGET.prefix}/${body.receiptPath}`).toString());
  const p=verifyBlobReceipt(receipt,ed.publicKey,receiptKeyFingerprint);
  assert.equal(p.sha256,body.archiveDigest);assert.equal(p.bytes,body.archiveBytes);
  const recovered=unseal(files.get(`${BLOB_TARGET.prefix}/${p.path}`),rsa.privateKey,keyFingerprint,p.sha256);
  for(const table of Object.keys(SCHEMA)){assert.equal(recovered.tables[table].length,1);assert.deepEqual(recovered.tables[table][0].state,expected[table][0].state);assert.equal(recovered.tables[table][0].user_id,expected[table][0].user_id);}
  await makeTables(targetDb);await insertRows(targetDb,recovered.tables);
  for(const [table,rows]of Object.entries(sourceRows))assert.deepEqual((await targetDb.query(`SELECT to_jsonb(t) AS row FROM public.${table} t ORDER BY user_id`)).rows.map(r=>r.row),rows);
  assert.equal((await sourceDb.query("SELECT current_setting('default_transaction_read_only') AS readonly")).rows[0].readonly,'on');
  assert.equal(blobImports,1);assert.equal(pgImports,1);assert(!secretReads.some(n=>n.includes('RECOVERY_PRIVATE')));assert.equal(files.size,2);assert.equal(calls.filter(x=>x==='put').length,2);assert.equal(receipt.payload.restoreVerified,false);
 }finally{await sourceDb.close();await targetDb.close();if(oldRetries===undefined)delete process.env.VERCEL_BLOB_RETRIES;else process.env.VERCEL_BLOB_RETRIES=oldRetries;}
});
