/** Entire candidate lifecycle with real local SQL, fake transport, and synthetic rows only. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {createBlobBackupHandler} from '../blob-runtime.mjs';
import {createAppBlobSource,BLOB_SOURCE_TARGET} from '../blob-source.mjs';
import {createAppBlobStore,BLOB_TARGET} from '../blob-store.mjs';
import {verifyBlobReceipt} from '../blob-export.mjs';
import {PROJECT,SCHEMA,publicFingerprint,unseal} from '../core.mjs';
import {fixture} from '../../../ops/blob-pilot/lib/fixture.mjs';
const types={user_id:'uuid',gender:'text',age_group:'text',occupation:'text',completed_count:'integer',state:'jsonb',consent_agreed_at:'timestamptz',consent_version:'text',updated_at:'timestamptz',revision:'uuid',last_write_id:'uuid'};
const makeTables=async db=>{for(const [table,columns]of Object.entries(SCHEMA))await db.exec(`CREATE TABLE public.${table} (${columns.map(c=>`${c} ${types[c]}`).join(',')});`);};
const insertRows=async(db,tables)=>{for(const [table,rows]of Object.entries(tables))for(const row of rows){const cols=SCHEMA[table];await db.query(`INSERT INTO public.${table} (${cols.join(',')}) VALUES (${cols.map((_,i)=>'$'+(i+1)).join(',')})`,cols.map(c=>c==='state'?JSON.stringify(row[c]):row[c]));}};

test('runtime authorization through restricted source catalogs, encrypted sink and independent local restore',{timeout:30000},async()=>{
 const oldRetries=process.env.VERCEL_BLOB_RETRIES;process.env.VERCEL_BLOB_RETRIES='0';
 const sourceDb=new PGlite(),targetDb=new PGlite();
 try{
  const rsa=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{format:'pem',type:'spki'},privateKeyEncoding:{format:'pem',type:'pkcs8'}});
  const ed=generateKeyPairSync('ed25519',{publicKeyEncoding:{format:'pem',type:'spki'},privateKeyEncoding:{format:'pem',type:'pkcs8'}});
  const keyFingerprint=publicFingerprint(rsa.publicKey),receiptKeyFingerprint=publicFingerprint(ed.publicKey);
  const config={enabled:true,mode:'app-data-candidate',sourceProject:PROJECT,source:BLOB_SOURCE_TARGET,destination:BLOB_TARGET,confirmedScope:Object.keys(SCHEMA),publicKey:rsa.publicKey,keyFingerprint,receiptPublicKey:ed.publicKey,receiptPrivateKey:ed.privateKey,receiptKeyFingerprint,maxArchiveBytes:100000};
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
  const handler=createBlobBackupHandler({runtime:{VERCEL:'1',VERCEL_PROJECT_ID:'prj_TO6prOB9hvCt8wTFK4IaOTu27ZAF',VERCEL_ENV:'production',BACKUP_PRODUCTION_ENABLED:'true',BACKUP_TARGET_STORE_PRIVATE_CONFIRMED:'true'},config,cronSecret:cron,manualSecret:manual,createSource:c=>createAppBlobSource({config:c,password:'SYNTHETIC SOURCE PASSWORD',Client}),createStore:c=>createAppBlobStore({config:c,token:'vercel_blob_rw_C1xbVeoXtowulKQG_SYNTHETIC_ONLY_NOT_REAL',blob})});
  const request=secret=>new Request('https://writer.invalid/api/app-backup',{method:'POST',headers:{authorization:'Bearer '+secret}});
  assert.equal((await handler(request(cron))).status,401);assert.equal(constructed,0);assert.equal(calls.length,0);
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
  assert.equal(files.size,2);assert.equal(calls.filter(x=>x==='put').length,2);assert.equal(receipt.payload.restoreVerified,false);
 }finally{await sourceDb.close();await targetDb.close();if(oldRetries===undefined)delete process.env.VERCEL_BLOB_RETRIES;else process.env.VERCEL_BLOB_RETRIES=oldRetries;}
});
