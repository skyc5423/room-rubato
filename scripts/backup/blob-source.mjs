/** Candidate SELECT-only source adapter. No pg import, env lookup, network defaults or deployment.
 * Host/TLS + pooler username bind the configured destination, not cryptographic cluster identity.
 * Metadata attests a point in time; later privilege changes remain an operational gate.
 */
import {readFileSync} from 'node:fs';
import {PROJECT,SCHEMA,canonical} from './core.mjs';
const CA=readFileSync(new URL('./supabase-ca.pem',import.meta.url),'utf8');
export const BLOB_SOURCE_TARGET=Object.freeze({host:'aws-0-ap-northeast-2.pooler.supabase.com',port:5432,database:'postgres',user:`rr_backup_writer.${PROJECT}`});
const SESSION_SQL=[
 'SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY',
 "SET statement_timeout = '30s'",
 "SET lock_timeout = '5s'",
 'SET search_path = pg_catalog, public'
];
const SESSION_CHECK=`SELECT current_setting('default_transaction_read_only') AS default_read_only,
 current_setting('transaction_read_only') AS transaction_read_only,
 extract(epoch FROM current_setting('statement_timeout')::interval)*1000 AS statement_ms,
 extract(epoch FROM current_setting('lock_timeout')::interval)*1000 AS lock_ms,
 current_setting('search_path') AS search_path`;
const METADATA=`SELECT jsonb_build_object(
 'currentUser',current_user,
 'role',(SELECT jsonb_build_object('super',rolsuper,'createRole',rolcreaterole,'createDb',rolcreatedb,'replication',rolreplication,'bypassRls',rolbypassrls,'inherit',rolinherit) FROM pg_roles WHERE rolname=current_user),
 'canAssumeRole',EXISTS(SELECT 1 FROM pg_roles r WHERE r.rolname<>current_user AND pg_has_role(current_user,r.oid,'MEMBER')),
 'forbiddenSchemaUsage',EXISTS(SELECT 1 FROM pg_namespace n WHERE n.nspname IN ('auth','storage') AND has_schema_privilege(current_user,n.oid,'USAGE')),
 'schemaCreate',EXISTS(SELECT 1 FROM pg_namespace n WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema' AND has_schema_privilege(current_user,n.oid,'CREATE')),
 'tableWrites',EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p','v','m','f') AND n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema' AND (has_table_privilege(current_user,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN') OR has_any_column_privilege(current_user,c.oid,'INSERT,UPDATE,REFERENCES'))),
 'tables',(SELECT jsonb_object_agg(t.name,jsonb_build_object('select',has_table_privilege(current_user,c.oid,'SELECT'),'rls',c.relrowsecurity,
 'unfilteredSelectPolicy',EXISTS(SELECT 1 FROM pg_policy p WHERE p.polrelid=c.oid AND p.polcmd IN ('r','*') AND p.polpermissive AND pg_get_expr(p.polqual,p.polrelid)='true' AND (0::oid=ANY(p.polroles) OR (SELECT oid FROM pg_roles WHERE rolname=current_user)=ANY(p.polroles))),
 'restrictiveSelectPolicy',EXISTS(SELECT 1 FROM pg_policy p WHERE p.polrelid=c.oid AND p.polcmd IN ('r','*') AND NOT p.polpermissive AND (0::oid=ANY(p.polroles) OR (SELECT oid FROM pg_roles WHERE rolname=current_user)=ANY(p.polroles))),
 'schemaUsage',has_schema_privilege(current_user,n.oid,'USAGE'),'columns',(SELECT jsonb_object_agg(a.attname,format_type(a.atttypid,a.atttypmod)) FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped))) FROM (VALUES ('persona_profiles'),('taste_journals')) t(name) JOIN pg_namespace n ON n.nspname='public' JOIN pg_class c ON c.relnamespace=n.oid AND c.relname=t.name AND c.relkind='r')
) AS source_metadata`;
const TYPES={user_id:'uuid',gender:'text',age_group:'text',occupation:'text',completed_count:'integer',state:'jsonb',consent_agreed_at:'timestamp with time zone',consent_version:'text',updated_at:'timestamp with time zone',revision:'uuid',last_write_id:'uuid'};
const fail=code=>{throw Error(code);};
function validateMetadata(result){
 const m=result?.rows?.[0]?.source_metadata;
 if(result?.rows?.length!==1||!m||m.currentUser!=='rr_backup_writer'||!m.role)fail('BLOB_SOURCE_METADATA_REJECTED');
 if(['super','createRole','createDb','replication','bypassRls','inherit'].some(k=>m.role[k]!==false))fail('BLOB_SOURCE_METADATA_REJECTED');
 if(['canAssumeRole','forbiddenSchemaUsage','schemaCreate','tableWrites'].some(k=>m[k]!==false))fail('BLOB_SOURCE_METADATA_REJECTED');
 if(!m.tables||canonical(Object.keys(m.tables).sort())!==canonical(Object.keys(SCHEMA).sort()))fail('BLOB_SOURCE_METADATA_REJECTED');
 for(const [table,columns] of Object.entries(SCHEMA)){
  const t=m.tables[table],expected=Object.fromEntries(columns.map(c=>[c,TYPES[c]]));
  if(t?.select!==true||t.schemaUsage!==true||t.rls!==true||t.unfilteredSelectPolicy!==true||t.restrictiveSelectPolicy!==false||canonical(t.columns)!==canonical(expected))fail('BLOB_SOURCE_METADATA_REJECTED');
 }
}
export function createAppBlobSource({config,password,Client}={}){
 if(config?.enabled!==true||config.mode!=='app-data-candidate'||config.sourceProject!==PROJECT||!config.source||canonical(config.source)!==canonical(BLOB_SOURCE_TARGET)||typeof password!=='string'||!password.length||typeof Client!=='function')fail('BLOB_SOURCE_CONFIGURATION_REJECTED');
 // A nonempty fixed options string also prevents pg from inheriting PGOPTIONS.
 // Capture fixed options now. No connectionString or caller-supplied TLS/query overrides.
 const options={...BLOB_SOURCE_TARGET,password,ssl:{ca:CA,rejectUnauthorized:true},connectionTimeoutMillis:15000,query_timeout:30000,application_name:'rubato-blob-candidate',options:'-c search_path=pg_catalog,public'};
 let client=null,state='new',ending=null;
 async function end(){
  state='closed';if(!ending)ending=(async()=>{if(client){try{await client.end();}catch{fail('BLOB_SOURCE_CLOSE_FAILED');}}})();return ending;
 }
 return Object.freeze({
  async connect(){
   if(state!=='new')fail('BLOB_SOURCE_NOT_READY');state='connecting';
   try{
    client=new Client({...options,ssl:{...options.ssl}});
    await client.connect();
    if(state!=='connecting')fail('closed');
    // Supavisor does not forward all startup GUCs. Set and verify on the fixed
    // session-pooler connection, never rely on constructor options for safety.
    for(const sql of SESSION_SQL)await client.query(sql);
    const session=await client.query(SESSION_CHECK),settings=session?.rows?.[0];
    if(session?.rows?.length!==1||settings.default_read_only!=='on'||settings.transaction_read_only!=='on'||Number(settings.statement_ms)!==30000||Number(settings.lock_ms)!==5000||settings.search_path!=='pg_catalog, public')fail('session');
    const result=await client.query(METADATA);validateMetadata(result);
    if(state!=='connecting')fail('closed');state='ready';
   }catch{try{await end();}catch{}fail('BLOB_SOURCE_CONNECT_REJECTED');}
  },
  async query(sql){
   if(state!=='ready')fail('BLOB_SOURCE_NOT_READY');
   if(typeof sql!=='string'||!sql.trim())fail('BLOB_SOURCE_QUERY_REJECTED');
   try{return await client.query(sql);}catch{fail('BLOB_SOURCE_QUERY_FAILED');}
  },
  end
 });
}
