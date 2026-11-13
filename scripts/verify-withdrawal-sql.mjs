// Isolated PostgreSQL WASM only. Never accepts a hosted connection string.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const root = new URL('../', import.meta.url);
await db.exec(`create role anon; create role authenticated;
 create schema auth; create schema storage;
 create table auth.users(id uuid primary key);
 create table auth.sessions(id uuid primary key,user_id uuid references auth.users on delete cascade,created_at timestamptz,not_after timestamptz);
 create table auth.scim_users(id uuid primary key,user_id uuid references auth.users on delete set null);
 create table auth.flow_state(id uuid primary key,user_id uuid,linking_target_id uuid);
 create table auth.refresh_tokens(id bigint primary key,user_id varchar,session_id uuid references auth.sessions on delete cascade);
 create table storage.objects(id uuid primary key,owner_id text,owner uuid);
 create table storage.buckets(id text primary key,owner_id text,owner uuid);
 create table storage.s3_multipart_uploads(id text primary key,owner_id text);
 create table storage.s3_multipart_uploads_parts(id uuid primary key,owner_id text);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
 grant usage on schema auth to authenticated,anon; grant execute on function auth.uid(),auth.jwt() to authenticated,anon;`);
for(const file of ['supabase/schema.sql','docs/proposals/persona-cas.sql','docs/proposals/taste-journal-cas.sql','docs/proposals/account-withdrawal.sql']) await db.exec(fs.readFileSync(new URL(file,root),'utf8'));
const a='11111111-1111-4111-8111-111111111111', b='22222222-2222-4222-8222-222222222222', sa='33333333-3333-4333-8333-333333333333', sb='44444444-4444-4444-8444-444444444444', wid='55555555-5555-4555-8555-555555555555';
let checks=0;
const admin=()=>db.exec('reset role');
const claims=async(uid,session)=>{await admin();await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[uid,JSON.stringify({session_id:session})]);await db.exec('set role authenticated');};
const withdraw=(confirmation='DELETE MY ACCOUNT',owner=a,session=sa)=>db.query('select public.withdraw_own_account($1,$2,$3) as deleted',[confirmation,owner,session]);
const denied=async(fn,code,message)=>{await assert.rejects(fn,e=>e.code===code&&(!message||e.message===message));checks++;};
await db.query('insert into auth.users values($1),($2)',[a,b]);
await db.query('insert into auth.sessions values($1,$2,now(),null),($3,$4,now(),null)',[sa,a,sb,b]);
await db.query("insert into persona_profiles(user_id,consent_agreed_at,consent_version) values($1,now(),'test'),($2,now(),'test')",[a,b]);
await db.query('insert into taste_journals(user_id) values($1),($2)',[a,b]);
await claims(a,sa);
await denied(withdraw,'P0001','WITHDRAWAL_DISABLED');
await denied(()=>db.exec('update room_internal.account_withdrawal_gate set enabled=true'),'42501');
await admin();await db.exec('update room_internal.account_withdrawal_gate set enabled=true,retention_verified=true,hosted_tests_verified=true');
await claims(a,sa);await denied(()=>withdraw('wrong'),'22023');
await denied(()=>withdraw('DELETE MY ACCOUNT',b),'42501');
await denied(()=>withdraw('DELETE MY ACCOUNT',a,sb),'42501');
// Same-owner replacement sign-in must not reuse confirmation for the old session.
await admin();await db.query('insert into auth.sessions values($1,$2,clock_timestamp(),null)',[wid,a]);
await claims(a,wid);await denied(withdraw,'42501');
await admin();await db.query('delete from auth.sessions where id=$1',[wid]);await claims(a,sa);
await claims(a,sb);await denied(withdraw,'42501');
await claims(a,'malformed');await denied(withdraw,'42501');
await claims(a,null);await denied(withdraw,'42501');
await admin();await db.query("update auth.sessions set created_at=now()-interval '6 minutes' where id=$1",[sa]);
await claims(a,sa);await denied(withdraw,'42501');
await admin();await db.query("update auth.sessions set created_at=now(),not_after=now()-interval '1 second' where id=$1",[sa]);
await claims(a,sa);await denied(withdraw,'42501');
await admin();await db.query('update auth.sessions set not_after=null,created_at=null where id=$1',[sa]);
await claims(a,sa);await denied(withdraw,'42501','Fresh sign-in required');
await admin();await db.query("update auth.sessions set created_at=clock_timestamp()+interval '1 minute' where id=$1",[sa]);
await claims(a,sa);await denied(withdraw,'42501','Fresh sign-in required');
await admin();await db.query('update auth.sessions set created_at=clock_timestamp() where id=$1',[sa]);
// Every known Storage ownership surface blocks, including legacy UUID owner.
for (const [table,column] of [ ['objects','owner'], ['buckets','owner'], ['buckets','owner_id'], ['s3_multipart_uploads','owner_id'], ['s3_multipart_uploads_parts','owner_id'] ]) {
  await db.query(`insert into storage.${table}(id,${column}) values($1,$2)`,[wid,a]);
  await claims(a,sa);await denied(withdraw,'P0001','WITHDRAWAL_STORAGE_REVIEW_REQUIRED');
  await admin();
  for (const t of ['auth.users','auth.sessions','public.persona_profiles','public.taste_journals']) {
    assert.equal((await db.query(`select count(*)::int n from ${t}`)).rows[0].n,2);checks++;
  }
  assert.equal((await db.query(`select count(*)::int n from storage.${table}`)).rows[0].n,1);checks++;
  await db.exec(`delete from storage.${table}`);
}
// A provider schema change must fail closed rather than skip the check.
await db.exec('alter table storage.s3_multipart_uploads_parts rename column owner_id to unexpected_owner');
await claims(a,sa);await denied(withdraw,'42703');
await admin();await db.exec('alter table storage.s3_multipart_uploads_parts rename column unexpected_owner to owner_id');
await db.exec('alter table storage.s3_multipart_uploads_parts rename to missing_parts_fixture');
await claims(a,sa);await denied(withdraw,'42P01');
await admin();await db.exec('alter table storage.missing_parts_fixture rename to s3_multipart_uploads_parts');
// Other-account resources must neither block nor be removed by A withdrawal.
for (const table of ['objects','buckets','s3_multipart_uploads','s3_multipart_uploads_parts']) {
  await db.query(`insert into storage.${table}(id,owner_id) values($1,$2)`,[b,b]);
}
await db.query('insert into storage.objects values($1,$2,null)',[wid,a]);
await claims(a,sa);await denied(withdraw,'P0001','WITHDRAWAL_STORAGE_REVIEW_REQUIRED');
await admin();await db.query('delete from storage.objects where id=$1',[wid]);await db.exec('create table room_internal.persona_pre_cas_20261111(user_id uuid)');
await claims(a,sa);await denied(withdraw,'P0001','WITHDRAWAL_RETENTION_UNVERIFIED');
await admin();await db.exec('drop table room_internal.persona_pre_cas_20261111; create table public.new_data(user_id uuid references auth.users on delete cascade)');
await claims(a,sa);await denied(withdraw,'P0001','WITHDRAWAL_SCHEMA_UNVERIFIED');
await admin();await db.exec('drop table public.new_data; create table public.journal_child(owner uuid references public.taste_journals on delete cascade)');
await claims(a,sa);await denied(withdraw,'P0001','WITHDRAWAL_SCHEMA_UNVERIFIED');
await admin();await db.exec('drop table public.journal_child; alter table public.taste_journals add column referrer_id uuid references auth.users on delete cascade');
await db.query('update public.taste_journals set referrer_id=$1 where user_id=$2',[a,b]);
await claims(a,sa);await denied(withdraw,'P0001','WITHDRAWAL_SCHEMA_UNVERIFIED');
await admin();assert.equal((await db.query('select count(*)::int n from public.taste_journals where user_id=$1',[b])).rows[0].n,1);checks++;
await db.exec('alter table public.taste_journals drop column referrer_id; alter table taste_journals drop constraint taste_journals_user_id_fkey; alter table taste_journals add constraint taste_journals_user_id_fkey foreign key(user_id) references auth.users(id)');
await claims(a,sa);await denied(withdraw,'P0001','WITHDRAWAL_SCHEMA_UNVERIFIED');
await admin();await db.exec('alter table taste_journals drop constraint taste_journals_user_id_fkey; alter table taste_journals add constraint taste_journals_user_id_fkey foreign key(user_id) references auth.users(id) on delete cascade');
await admin();await db.exec(`create function public.fixture_trigger() returns trigger language plpgsql as $$ begin return old; end $$; create trigger unexpected before delete on public.taste_journals for each row execute function public.fixture_trigger();`);
await claims(a,sa);await denied(withdraw,'P0001','WITHDRAWAL_SCHEMA_UNVERIFIED');
await admin();await db.exec('drop trigger unexpected on public.taste_journals; drop function public.fixture_trigger()');
// Non-cascading Auth references block without modifying either account.
for (const [table,column] of [['scim_users','user_id'],['flow_state','user_id'],['flow_state','linking_target_id']]) {
  await db.query(`insert into auth.${table}(id,${column}) values($1,$2)`,[wid,a]);
  await claims(a,sa);await denied(withdraw,'P0001','WITHDRAWAL_AUTH_REVIEW_REQUIRED');
  await admin();assert.equal((await db.query(`select count(*)::int n from auth.${table}`)).rows[0].n,1);checks++;
  assert.equal((await db.query('select count(*)::int n from auth.users')).rows[0].n,2);checks++;
  await db.exec(`delete from auth.${table}`);
}
// Both legacy sessionless tokens and inconsistent cross-owner sessions block.
for (const session of [null,sb]) {
  await db.query('insert into auth.refresh_tokens values(1,$1,$2)',[a,session]);
  await claims(a,sa);await denied(withdraw,'P0001','WITHDRAWAL_AUTH_REVIEW_REQUIRED');
  await admin();assert.equal((await db.query('select count(*)::int n from auth.refresh_tokens')).rows[0].n,1);checks++;
  await db.exec('delete from auth.refresh_tokens');
}
// Inverse inconsistency must not cascade another owner's token with A's session.
for (const owner of [b,null]) {
  await db.query('insert into auth.refresh_tokens values(1,$1,$2)',[owner,sa]);
  await claims(a,sa);await denied(withdraw,'P0001','WITHDRAWAL_AUTH_REVIEW_REQUIRED');
  await admin();assert.equal((await db.query('select count(*)::int n from auth.refresh_tokens')).rows[0].n,1);checks++;
  await db.exec('delete from auth.refresh_tokens');
}
await db.exec('alter table auth.flow_state rename column linking_target_id to changed_link_target');
await claims(a,sa);await denied(withdraw,'42703');
await admin();await db.exec('alter table auth.flow_state rename column changed_link_target to linking_target_id');
// A provider cascade drift must not report deletion while leaving token rows.
for (const action of ['set null','no action']) {
  await db.exec(`alter table auth.refresh_tokens drop constraint refresh_tokens_session_id_fkey;
    alter table auth.refresh_tokens add constraint refresh_tokens_session_id_fkey foreign key(session_id) references auth.sessions(id) on delete ${action}`);
  await claims(a,sa);await denied(withdraw,'P0001','WITHDRAWAL_SCHEMA_UNVERIFIED');
  await admin();
}
await db.exec('alter table auth.refresh_tokens drop constraint refresh_tokens_session_id_fkey');
await claims(a,sa);await denied(withdraw,'P0001','WITHDRAWAL_SCHEMA_UNVERIFIED');
await admin();await db.exec('alter table auth.refresh_tokens add constraint refresh_tokens_session_id_fkey foreign key(session_id) references auth.sessions(id) on delete cascade not valid');
await claims(a,sa);await denied(withdraw,'P0001','WITHDRAWAL_SCHEMA_UNVERIFIED');
await admin();await db.exec('alter table auth.refresh_tokens validate constraint refresh_tokens_session_id_fkey');
// Other-owner references survive; valid session-linked A tokens cascade.
await db.query('insert into auth.scim_users values($1,$2)',[b,b]);
await db.query('insert into auth.flow_state values($1,$2,$2)',[b,b]);
await db.query('insert into auth.refresh_tokens values(1,$1,$2),(2,$3,$4)',[a,sa,b,sb]);
// Force a downstream deletion failure and verify session/data transaction rollback.
await db.exec(`create function auth.reject_delete() returns trigger language plpgsql as $$ begin raise exception 'fixture failure'; end $$; create trigger reject_delete before delete on auth.users for each row execute function auth.reject_delete();`);
await claims(a,sa);await denied(withdraw,'P0001','fixture failure');
await admin();assert.equal((await db.query('select count(*)::int n from auth.sessions where user_id=$1',[a])).rows[0].n,1);checks++;
await db.exec('drop trigger reject_delete on auth.users');
await claims(a,sa);assert.equal((await withdraw()).rows[0].deleted,true);checks++;
// Replaying the old token cannot return success or resurrect account-owned data.
await denied(withdraw,'42501');
await denied(()=>db.query('select public.save_persona_cas($1,null,$2,$3,now(),$4)',[a,wid,{},'test']),'23503');
await denied(()=>db.query('select public.save_taste_journal($1,null,$2,$3)',[a,wid,{version:1,entries:{}}]),'23503');
await admin();for(const table of ['auth.users','auth.sessions','public.persona_profiles','public.taste_journals']) { const owner=table==='auth.users'?'id':'user_id';assert.equal((await db.query(`select count(*)::int n from ${table} where ${owner}=$1`,[a])).rows[0].n,0);assert.equal((await db.query(`select count(*)::int n from ${table} where ${owner}=$1`,[b])).rows[0].n,1);checks+=2; }
for (const table of ['objects','buckets','s3_multipart_uploads','s3_multipart_uploads_parts']) {
  assert.deepEqual((await db.query(`select owner_id from storage.${table}`)).rows,[{owner_id:b}]);checks++;
}
assert.deepEqual((await db.query('select user_id from auth.scim_users')).rows,[{user_id:b}]);checks++;
assert.deepEqual((await db.query('select user_id,linking_target_id from auth.flow_state')).rows,[{user_id:b,linking_target_id:b}]);checks++;
assert.deepEqual((await db.query('select user_id,session_id from auth.refresh_tokens')).rows,[{user_id:b,session_id:sb}]);checks++;
await db.exec('set role anon');await denied(withdraw,'42501');
console.log(`${checks} isolated SQL checks passed. Hosted Auth/PostgREST/Storage, concurrent connections and backup retention remain unverified.`);
await db.close();
