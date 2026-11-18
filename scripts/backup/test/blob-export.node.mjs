import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {exportToBlob,verifyBlobReceipt} from '../blob-export.mjs';
import {PROJECT,publicFingerprint,unseal,sha256} from '../core.mjs';
process.env.VERCEL_BLOB_RETRIES='0'; // private synthetic test process only
const rsa=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
const ed=generateKeyPairSync('ed25519',{publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
const fp=publicFingerprint(rsa.publicKey),signFp=publicFingerprint(ed.publicKey);
const cfg=()=>({enabled:true,mode:'app-data-candidate',sourceProject:PROJECT,confirmedScope:['persona_profiles','taste_journals'],destination:{storeId:'store_C1xbVeoXtowulKQG',prefix:'room-rubato-app-backups'},keyFingerprint:fp,publicKey:rsa.publicKey,receiptPublicKey:ed.publicKey,receiptPrivateKey:ed.privateKey,receiptKeyFingerprint:signFp,maxArchiveBytes:100000});
function memory(){const files=new Map(),calls=[];return {files,calls,identity:Object.freeze({project:PROJECT,mode:'app-data-candidate',storeId:'store_C1xbVeoXtowulKQG',prefix:'room-rubato-app-backups',keyFingerprint:fp}),async read(p){calls.push(['read',p]);return files.has(p)?Buffer.from(files.get(p)):null;},async create(p,b){calls.push(['create',p]);if(files.has(p))return false;files.set(p,Buffer.from(b));return true;}};}
async function fixture(){
 const db=new PGlite();await db.exec(`create table persona_profiles(user_id uuid,gender text,age_group text,occupation text,completed_count integer,state jsonb,consent_agreed_at timestamptz,consent_version text,updated_at timestamptz,revision uuid,last_write_id uuid);create table taste_journals(user_id uuid,state jsonb,revision uuid,last_write_id uuid,updated_at timestamptz);
 insert into persona_profiles values('00000000-0000-4000-8000-000000000001',null,null,null,1,'{"marker":"SYNTHETIC-PRIVATE-MARKER"}',now(),'synthetic',now(),'00000000-0000-4000-8000-000000000002',null);
 insert into taste_journals values('00000000-0000-4000-8000-000000000001','{"marker":"SYNTHETIC-PRIVATE-MARKER"}','00000000-0000-4000-8000-000000000003',null,now());`);
 const queries=[];let connected=0,ended=0;
 return {db,queries,get connected(){return connected;},get ended(){return ended;},async connect(){connected++;},async query(sql){queries.push(sql);return db.query(sql);},async end(){ended++;await db.close();}};
}
test('actual two-table export.sql reaches sink only encrypted, signed receipt readback never claims restore',async()=>{
 const client=await fixture(),store=memory();const result=await exportToBlob({config:cfg(),client,store});
 assert.equal(client.ended,1);assert.equal(store.files.size,2);assert.equal(result.restoreVerified,false);
 const payload=verifyBlobReceipt(result.receipt,ed.publicKey,signFp),bytes=store.files.get(payload.path);
 const snapshot=unseal(bytes,rsa.privateKey,fp,sha256(bytes));assert.equal(snapshot.tables.persona_profiles.length,1);assert.equal(snapshot.tables.taste_journals.length,1);
 assert.equal(snapshot.tables.taste_journals[0].state.marker,'SYNTHETIC-PRIVATE-MARKER');
 for(const b of store.files.values())assert(!b.includes('SYNTHETIC-PRIVATE-MARKER'));
 assert(!JSON.stringify(result).includes('SYNTHETIC-PRIVATE-MARKER'));
 assert(client.queries[0].includes('REPEATABLE READ READ ONLY'));assert.equal(client.queries.at(-1),'COMMIT');
});
test('closed configuration and destination/key/scope mismatches never connect or touch store',async()=>{
 const mutations=[c=>delete c.enabled,c=>c.mode='production',c=>c.sourceProject='wrong',c=>c.confirmedScope.push('auth.users'),c=>c.destination.storeId='wrong',c=>c.destination.prefix='../wrong',c=>c.keyFingerprint='0'.repeat(64),c=>c.maxArchiveBytes=Infinity,c=>c.maxArchiveBytes=0,c=>c.maxArchiveBytes=60000000,c=>c.receiptKeyFingerprint='0'.repeat(64),c=>c.receiptPrivateKey=rsa.privateKey];
 for(const mutate of mutations){let calls=0;const client={connect(){calls++;},query(){calls++;},end(){calls++;}},store=memory(),config=cfg();mutate(config);await assert.rejects(exportToBlob({config,client,store}),/^Error: BLOB_EXPORT_INVALID_CONFIG$/);assert.equal(calls,0);assert.equal(store.calls.length,0);}
 const store=memory();store.identity={...store.identity,keyFingerprint:'0'.repeat(64)};await assert.rejects(exportToBlob({config:cfg(),client:{connect(){throw Error('should not connect');},query(){},end(){}},store}),/INVALID_CONFIG/);
});
test('oversize archive rolls back active transaction before any sink and sanitizes failures',async()=>{
 const client=await fixture(),store=memory();await assert.rejects(exportToBlob({config:{...cfg(),maxArchiveBytes:1},client,store}),/^Error: BLOB_EXPORT_FAILED$/);assert.equal(client.queries.at(-1),'ROLLBACK');assert.equal(store.calls.length,0);assert.equal(client.ended,1);
});
test('SQL failure rolls back without exposing adapter error plaintext',async()=>{
 const client=await fixture(),query=client.query.bind(client),store=memory();client.query=async sql=>{if(sql.startsWith('SELECT'))throw Error('SYNTHETIC-PRIVATE-MARKER');return query(sql);};
 await assert.rejects(exportToBlob({config:cfg(),client,store}),/^Error: BLOB_EXPORT_FAILED$/);assert.equal(client.queries.at(-1),'ROLLBACK');assert.equal(store.calls.length,0);
});
test('uncertain archive and receipt writes resolve only through exact readback, no retries',async()=>{
 const client=await fixture(),store=memory(),create=store.create.bind(store);store.create=async(p,b)=>{await create(p,b);throw Error('SYNTHETIC-PRIVATE-MARKER');};
 const result=await exportToBlob({config:cfg(),client,store});assert.equal(result.restoreVerified,false);assert.equal(store.calls.filter(c=>c[0]==='create').length,2);
});
test('unresolved archive write leaves no success or receipt; external failure is not DB rollback',async()=>{
 const client=await fixture(),store=memory();store.create=async()=>{throw Error('SYNTHETIC-PRIVATE-MARKER');};
 await assert.rejects(exportToBlob({config:cfg(),client,store}),/^Error: BLOB_EXPORT_FAILED$/);assert.equal(store.files.size,0);assert.equal(client.queries.at(-1),'COMMIT');
});
test('existing immutable object is collision, no overwrite or success',async()=>{
 const client=await fixture(),store=memory();store.read=async()=>Buffer.from('older archive');
 await assert.rejects(exportToBlob({config:cfg(),client,store}),/BLOB_EXPORT_FAILED/);assert.equal(store.calls.filter(c=>c[0]==='create').length,0);
});
test('corrupt readback never yields receipt; orphan ciphertext not deleted',async()=>{
 const client=await fixture(),store=memory(),create=store.create.bind(store);store.create=async(p,b)=>create(p,Buffer.from('corrupt'));
 await assert.rejects(exportToBlob({config:cfg(),client,store}),/BLOB_EXPORT_FAILED/);assert.equal(store.files.size,1);
});
test('receipt failure preserves archive and cannot claim a completed backup',async()=>{
 const client=await fixture(),store=memory(),create=store.create.bind(store);store.create=async(p,b)=>{if(p.endsWith('.receipt.json'))return false;return create(p,b);};
 await assert.rejects(exportToBlob({config:cfg(),client,store}),/BLOB_EXPORT_FAILED/);assert.equal(store.files.size,1);
});
test('receipt tampering, wrong verification key pin and restore=true rejected',async()=>{
 const result=await exportToBlob({config:cfg(),client:await fixture(),store:memory()});
 for(const patch of [{restoreVerified:true},{destination:{storeId:'other',prefix:'room-rubato-app-backups'}},{sha256:'0'.repeat(64)}])await assert.throws(()=>verifyBlobReceipt({...result.receipt,payload:{...result.receipt.payload,...patch}},ed.publicKey,signFp),/BLOB_RECEIPT_INVALID/);
 assert.throws(()=>verifyBlobReceipt(result.receipt,ed.publicKey,'0'.repeat(64)),/BLOB_RECEIPT_INVALID/);
});
test('candidate adapter integration sends actual SQL export as encrypted private create-only bytes',async()=>{
 const {createAppBlobStore}=await import('../blob-store.mjs');const files=new Map(),calls=[];
 const blob={async get(path,options){calls.push({op:'get',path,options});return files.has(path)?{statusCode:200,blob:{pathname:path},stream:(async function*(){yield files.get(path);})()}:null;},async put(path,bytes,options){calls.push({op:'put',path,options});assert.equal(options.access,'private');assert.equal(options.allowOverwrite,false);assert.equal(options.addRandomSuffix,false);assert(!bytes.includes('SYNTHETIC-PRIVATE-MARKER'));if(files.has(path))throw Error('occupied');files.set(path,Buffer.from(bytes));return {pathname:path};}};
 const config=cfg(),store=createAppBlobStore({config,token:'vercel_blob_rw_C1xbVeoXtowulKQG_SYNTHETIC_ONLY_NOT_REAL',blob});
 const result=await exportToBlob({config,client:await fixture(),store});assert.equal(files.size,2);assert.equal(result.restoreVerified,false);
 assert(calls.every(c=>c.path.startsWith('room-rubato-app-backups/app-data-v1/'+fp+'/')));assert(calls.filter(c=>c.op==='get').every(c=>c.options.useCache===false));
});
test('connect error is sanitized and closes attempted connection without sink access',async()=>{
 let closed=0;const store=memory();await assert.rejects(exportToBlob({config:cfg(),store,client:{async connect(){throw Error('SYNTHETIC-PRIVATE-MARKER');},async query(){throw Error('not connected');},async end(){closed++;}}}),/^Error: BLOB_EXPORT_FAILED$/);assert.equal(closed,1);assert.equal(store.calls.length,0);
});
test('source size guard rejects huge/negative/unsafe/unknown sizes before materializing export',async()=>{
 for(const bytes of [60000000,-1,'9007199254740992',null,'NaN']){
  const client=await fixture(),query=client.query.bind(client),store=memory();let exported=false;
  client.query=async sql=>{if(sql.includes('AS bytes'))return {rows:[{bytes}]};if(sql.startsWith('SELECT jsonb_build_object'))exported=true;return query(sql);};
  await assert.rejects(exportToBlob({config:cfg(),client,store}),/BLOB_EXPORT_FAILED/);assert.equal(exported,false);assert.equal(client.queries.at(-1),'ROLLBACK');assert.equal(store.calls.length,0);
 }
});
test('advisory lock refusal rolls back before size/export and sink',async()=>{
 const client=await fixture(),query=client.query.bind(client),store=memory();client.query=async sql=>{if(sql.includes('pg_try_advisory'))return {rows:[{acquired:false}]};return query(sql);};
 await assert.rejects(exportToBlob({config:cfg(),client,store}),/BLOB_EXPORT_FAILED/);assert.equal(client.queries.at(-1),'ROLLBACK');assert(!client.queries.some(s=>s.includes('AS bytes')));assert.equal(store.calls.length,0);
});
test('stale source snapshot is refused before encryption sink',async()=>{
 const client=await fixture(),query=client.query.bind(client),store=memory();client.query=async sql=>{const r=await query(sql);if(sql.startsWith('SELECT jsonb_build_object'))r.rows[0].jsonb_build_object.capturedAt='2020-01-01T00:00:00Z';return r;};
 await assert.rejects(exportToBlob({config:cfg(),client,store}),/BLOB_EXPORT_FAILED/);assert.equal(client.queries.at(-1),'ROLLBACK');assert.equal(store.calls.length,0);
});

test('independent recovery key restores every exported column into a separate empty PostgreSQL fixture',async()=>{
 const store=memory(),result=await exportToBlob({config:cfg(),client:await fixture(),store});
 const verified=verifyBlobReceipt(result.receipt,ed.publicKey,signFp);
 const snapshot=unseal(store.files.get(verified.path),rsa.privateKey,verified.keyFingerprint,verified.sha256);
 const target=await fixture(); // independent disposable instance, not the source
 try{
  await target.db.exec('TRUNCATE persona_profiles,taste_journals');
  for(const [table,rows] of Object.entries(snapshot.tables)){
   for(const row of rows){const columns=Object.keys(row);await target.db.query(`INSERT INTO ${table}(${columns.join(',')}) VALUES(${columns.map((_,i)=>'$'+(i+1)).join(',')})`,columns.map(k=>k==='state'?JSON.stringify(row[k]):row[k]));}
   const restored=(await target.db.query(`SELECT to_jsonb(t) AS row FROM ${table} t ORDER BY user_id`)).rows.map(r=>r.row);
   assert.deepEqual(restored,rows);
  }
  assert.equal(result.restoreVerified,false); // offline assertion must not change writer receipt
  assert.equal(result.receipt.payload.restoreVerified,false);
 }finally{await target.end();}
});
