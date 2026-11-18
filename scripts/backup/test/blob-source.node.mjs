import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAppBlobSource,BLOB_SOURCE_TARGET} from '../blob-source.mjs';
import {PROJECT,SCHEMA} from '../core.mjs';
const types={user_id:'uuid',gender:'text',age_group:'text',occupation:'text',completed_count:'integer',state:'jsonb',consent_agreed_at:'timestamp with time zone',consent_version:'text',updated_at:'timestamp with time zone',revision:'uuid',last_write_id:'uuid'};
const config=()=>({enabled:true,mode:'app-data-candidate',sourceProject:PROJECT,source:{...BLOB_SOURCE_TARGET}});
const metadata=()=>({currentUser:'rr_backup_writer',role:{super:false,createRole:false,createDb:false,replication:false,bypassRls:false,inherit:false},canAssumeRole:false,forbiddenSchemaUsage:false,schemaCreate:false,tableWrites:false,tables:Object.fromEntries(Object.entries(SCHEMA).map(([name,columns])=>[name,{select:true,schemaUsage:true,rls:true,unfilteredSelectPolicy:true,restrictiveSelectPolicy:false,columns:Object.fromEntries(columns.map(c=>[c,types[c]]))}]))});
function fake(m=metadata(),overrides={}){const calls=[],instances=[];class Client{constructor(opts){this.options=opts;instances.push(this);}async connect(){calls.push('connect');if(overrides.connect)await overrides.connect();}async query(sql){calls.push(sql);if(sql.includes("current_setting('default_transaction_read_only')"))return {rows:[overrides.settings??{default_read_only:'on',transaction_read_only:'on',statement_ms:30000,lock_ms:5000,search_path:'pg_catalog, public'}]};if(sql.startsWith('SET '))return {rows:[]};if(sql.includes('AS source_metadata'))return overrides.metadataResult??{rows:[{source_metadata:m}]};if(overrides.query)return overrides.query(sql);return {rows:[{ok:true}]};}async end(){calls.push('end');if(overrides.end)await overrides.end();}}return {Client,calls,instances};}
const create=(f,c=config())=>createAppBlobSource({config:c,password:'SYNTHETIC_PASSWORD',Client:f.Client});
test('constructor lazy, exact TLS CA/timeouts/read-only options; metadata gates export',async()=>{
 const f=fake(),source=create(f);assert.equal(f.instances.length,0);await assert.rejects(source.query('SELECT 1'),/NOT_READY/);await source.connect();assert.equal(f.instances.length,1);
 const o=f.instances[0].options;for(const [k,v] of Object.entries(BLOB_SOURCE_TARGET))assert.equal(o[k],v);
 assert.deepEqual(o.ssl,{ca:readFileSync(new URL('../supabase-ca.pem',import.meta.url),'utf8'),rejectUnauthorized:true});assert.equal(o.connectionTimeoutMillis,15000);assert.equal(o.query_timeout,30000);assert.equal(o.statement_timeout,undefined);assert.equal(o.lock_timeout,undefined);assert.equal(o.options,'-c search_path=pg_catalog,public');assert.deepEqual(f.calls.slice(1,5),['SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY',"SET statement_timeout = '30s'","SET lock_timeout = '5s'",'SET search_path = pg_catalog, public']);
 assert.match(f.calls[6],/pg_roles/);assert.match(f.calls[6],/pg_attribute/);assert(!f.calls[6].includes('FROM public.persona_profiles'));
 assert.deepEqual(await source.query('SELECT 1'),{rows:[{ok:true}]});await source.end();await source.end();assert.equal(f.calls.filter(x=>x==='end').length,1);await assert.rejects(source.query('SELECT 1'),/NOT_READY/);
});
test('bad configs never construct or connect, no credential discovery',()=>{
 for(const mutate of [c=>delete c.enabled,c=>c.mode='production',c=>c.sourceProject='wrong',c=>c.source.host='attacker.test',c=>c.source.port=6543,c=>c.source.user='postgres',c=>c.source.database='other',c=>c.source.connectionString='postgres://bad',c=>c.source.ssl=false]){const f=fake(),c=config();mutate(c);assert.throws(()=>create(f,c),/CONFIGURATION_REJECTED/);assert.equal(f.instances.length,0);}
 const f=fake();for(const password of ['',null,undefined])assert.throws(()=>createAppBlobSource({config:config(),password,Client:f.Client}),/CONFIGURATION_REJECTED/);
});
test('privilege or source identity mismatch closes and blocks export',async()=>{
 const changes=[m=>m.currentUser='postgres',...['super','createRole','createDb','replication','bypassRls','inherit'].map(k=>m=>m.role[k]=true),...['canAssumeRole','forbiddenSchemaUsage','schemaCreate','tableWrites'].map(k=>m=>m[k]=true),m=>delete m.role.inherit,m=>m.tables.persona_profiles.select=false,m=>m.tables.persona_profiles.rls=false,m=>m.tables.persona_profiles.unfilteredSelectPolicy=false,m=>m.tables.taste_journals.restrictiveSelectPolicy=true,m=>m.tables.taste_journals.schemaUsage=false,m=>delete m.tables.persona_profiles.columns.revision,m=>m.tables.persona_profiles.columns.state='text',m=>m.tables.persona_profiles.columns.secret='text',m=>delete m.tables.taste_journals];
 for(const change of changes){const m=metadata();change(m);const f=fake(m),source=create(f);await assert.rejects(source.connect(),/^Error: BLOB_SOURCE_CONNECT_REJECTED$/);await assert.rejects(source.query('SELECT export'),/NOT_READY/);assert.equal(f.calls.at(-1),'end');assert.equal(f.calls.length,8);}
});
test('malformed probe results rejected and cleanup attempted',async()=>{
 for(const result of [{rows:[]},{rows:[{},{}]},{rows:[{source_metadata:null}]}]){const f=fake(metadata(),{metadataResult:result}),source=create(f);await assert.rejects(source.connect(),/CONNECT_REJECTED/);assert.equal(f.calls.at(-1),'end');}
});
test('untrusted connect/query/cleanup errors do not disclose payload',async()=>{
 const f=fake(metadata(),{connect(){throw Error('SECRET');},end(){throw Error('SECRET');}}),s=create(f);await assert.rejects(s.connect(),/^Error: BLOB_SOURCE_CONNECT_REJECTED$/);assert.equal(f.calls.at(-1),'end');
 const g=fake(metadata(),{query(){throw Error('SECRET');}}),t=create(g);await t.connect();await assert.rejects(t.query('SELECT 1'),/^Error: BLOB_SOURCE_QUERY_FAILED$/);await t.end();
});
test('captured config cannot be retargeted; concurrent connect rejected',async()=>{
 let release;const wait=new Promise(r=>release=r),f=fake(metadata(),{connect:()=>wait}),c=config(),s=create(f,c);c.source.host='attacker.test';const pending=s.connect();await assert.rejects(s.connect(),/NOT_READY/);assert.equal(f.instances[0].options.host,BLOB_SOURCE_TARGET.host);release();await pending;await s.end();
});
test('metadata SQL executes against local PostgreSQL catalogs for least-privilege fixture',async()=>{
 const {PGlite}=await import('@electric-sql/pglite');const db=new PGlite();
 try{
  await db.exec('CREATE ROLE rr_backup_writer NOINHERIT; REVOKE CREATE ON SCHEMA public FROM PUBLIC; GRANT USAGE ON SCHEMA public TO rr_backup_writer;');
  for(const [table,columns] of Object.entries(SCHEMA))await db.exec(`CREATE TABLE public.${table} (${columns.map(c=>`${c} ${types[c]}`).join(',')}); GRANT SELECT ON public.${table} TO rr_backup_writer; ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY; CREATE POLICY backup_reader ON public.${table} FOR SELECT TO rr_backup_writer USING (true);`);
  await db.exec('SET ROLE rr_backup_writer');
  class Client{async connect(){} async query(sql){return db.query(sql);}async end(){}}
  const source=createAppBlobSource({config:config(),password:'SYNTHETIC',Client});await source.connect();assert.deepEqual((await source.query('SELECT current_user AS name')).rows,[{name:'rr_backup_writer'}]);await source.end();
  await db.query('SET SESSION CHARACTERISTICS AS TRANSACTION READ WRITE');await db.exec('RESET ROLE; CREATE POLICY filter_backup ON public.persona_profiles AS RESTRICTIVE FOR SELECT TO rr_backup_writer USING (true); SET ROLE rr_backup_writer');
  const restricted=createAppBlobSource({config:config(),password:'SYNTHETIC',Client});await assert.rejects(restricted.connect(),/CONNECT_REJECTED/);
  await db.query('SET SESSION CHARACTERISTICS AS TRANSACTION READ WRITE');await db.exec('RESET ROLE; DROP POLICY filter_backup ON public.persona_profiles; ALTER POLICY backup_reader ON public.persona_profiles USING (false); SET ROLE rr_backup_writer');
  const filtered=createAppBlobSource({config:config(),password:'SYNTHETIC',Client});await assert.rejects(filtered.connect(),/CONNECT_REJECTED/);
  await db.query('SET SESSION CHARACTERISTICS AS TRANSACTION READ WRITE');await db.exec('RESET ROLE; ALTER POLICY backup_reader ON public.persona_profiles USING (true); ALTER TABLE public.persona_profiles DISABLE ROW LEVEL SECURITY; SET ROLE rr_backup_writer');
  const noRls=createAppBlobSource({config:config(),password:'SYNTHETIC',Client});await assert.rejects(noRls.connect(),/CONNECT_REJECTED/);
 }finally{await db.close();}
});
test('ignored session settings fail closed before metadata or exporter SQL',async()=>{
 const good={default_read_only:'on',transaction_read_only:'on',statement_ms:30000,lock_ms:5000,search_path:'pg_catalog, public'};
 for(const patch of [{default_read_only:'off'},{transaction_read_only:'off'},{statement_ms:0},{lock_ms:0},{search_path:'public'}, {statement_ms:null}]){
  const f=fake(metadata(),{settings:{...good,...patch}}),source=create(f);await assert.rejects(source.connect(),/CONNECT_REJECTED/);assert(!f.calls.some(sql=>sql.includes('AS source_metadata')));assert.equal(f.calls.at(-1),'end');await assert.rejects(source.query('SELECT export'),/NOT_READY/);
 }
});
