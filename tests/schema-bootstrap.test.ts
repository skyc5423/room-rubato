import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const sql=readFileSync(new URL('../supabase/schema.sql',import.meta.url),'utf8');
const cas=readFileSync(new URL('../docs/proposals/persona-cas.sql',import.meta.url),'utf8');
it('legacy bootstrap is repeatable before CAS but cannot reopen direct writes after cutover',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$select null::uuid$$;`);
  await db.exec(sql);await db.exec(sql);
  const grants=async()=> (await db.query<{insert:boolean;update:boolean;delete:boolean}>(`select has_table_privilege('authenticated','public.persona_profiles','INSERT') as insert,has_table_privilege('authenticated','public.persona_profiles','UPDATE') as update,has_table_privilege('authenticated','public.persona_profiles','DELETE') as delete`)).rows[0];
  expect(await grants()).toEqual({insert:true,update:true,delete:true});
  await db.exec(cas);expect(await grants()).toEqual({insert:false,update:false,delete:false});
  await expect(db.exec(sql)).rejects.toThrow('LEGACY_BOOTSTRAP_BLOCKED_AFTER_CAS');await db.exec('rollback');
  expect(await grants()).toEqual({insert:false,update:false,delete:false});
  const columns=await db.query(`select attname from pg_attribute where attrelid='public.persona_profiles'::regclass and attname in ('revision','last_write_id')`);expect(columns.rows).toHaveLength(2);
 }finally{await db.close();}
},15000);
