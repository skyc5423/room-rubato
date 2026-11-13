-- REVIEW CANDIDATE ONLY. Not a migration and never applied to hosted data.
-- Requires the persona/journal CAS cutover. Defaults to disabled on installation.
begin;
create table room_internal.account_withdrawal_gate (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false,
  retention_verified boolean not null default false,
  hosted_tests_verified boolean not null default false
);
alter table room_internal.account_withdrawal_gate enable row level security;
revoke all on room_internal.account_withdrawal_gate from public, anon, authenticated;
insert into room_internal.account_withdrawal_gate(singleton) values(true);

create function room_internal.withdraw_own_account(p_confirmation text, p_expected_owner uuid, p_expected_session uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_session uuid;
  v_table regclass;
begin
  -- Browser flags are UX only. This private database gate is authoritative.
  if not exists (select 1 from room_internal.account_withdrawal_gate
    where singleton and enabled and retention_verified and hosted_tests_verified) then
    raise exception using errcode='P0001', message='WITHDRAWAL_DISABLED';
  end if;
  if v_uid is null or p_expected_owner is distinct from v_uid then
    raise exception using errcode='42501', message='Authentication required';
  end if;
  if p_confirmation is distinct from 'DELETE MY ACCOUNT' then
    raise exception using errcode='22023', message='Confirmation required';
  end if;
  -- PostgREST supplies verified JWT claims. Never use editable user_metadata,
  -- token iat (refresh is not reauthentication), or a client-supplied user ID.
  begin
    v_session := (auth.jwt()->>'session_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='42501', message='Fresh sign-in required';
  end;
  if v_session is null or p_expected_session is distinct from v_session then
    raise exception using errcode='42501', message='Fresh sign-in required';
  end if;
  if not exists (select 1 from auth.sessions s where s.id=v_session
      and s.user_id=v_uid and s.created_at <= clock_timestamp()
      and s.created_at > clock_timestamp() - interval '5 minutes'
      and (s.not_after is null or s.not_after > clock_timestamp())) then
    raise exception using errcode='42501', message='Fresh sign-in required';
  end if;

  -- Same lock order as the two CAS paths. Deletion and data cascades commit
  -- together; a concurrent CAS write cannot resurrect a deleted FK owner.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));
  perform pg_advisory_xact_lock(hashtextextended('journal:' || v_uid::text, 0));
  perform 1 from auth.users where id=v_uid for update;
  if not found then raise exception using errcode='42501', message='Authentication required'; end if;
  -- Recheck under a row lock so concurrent session revocation cannot race it.
  perform 1 from auth.sessions s where s.id=v_session and s.user_id=v_uid
    and s.created_at > clock_timestamp() - interval '5 minutes' and s.created_at <= clock_timestamp()
    and (s.not_after is null or s.not_after > clock_timestamp()) for update;
  if not found then raise exception using errcode='42501', message='Fresh sign-in required'; end if;

  -- No user-defined application trigger is reviewed for this flow. Built-in FK
  -- triggers are checked through their constraints below.
  if exists (select 1 from pg_catalog.pg_trigger where not tgisinternal
    and tgrelid in ('public.persona_profiles'::regclass,'public.taste_journals'::regclass)) then
    raise exception using errcode='P0001', message='WITHDRAWAL_SCHEMA_UNVERIFIED';
  end if;
  -- Fail closed when ownership/deletion semantics drift. Never silently leave
  -- application records behind or cascade a newly introduced table unreviewed.
  foreach v_table in array array['public.persona_profiles'::regclass, 'public.taste_journals'::regclass] loop
    if not exists (select 1 from pg_catalog.pg_constraint c
      where c.contype='f' and c.conrelid=v_table and c.confrelid='auth.users'::regclass
      and c.confdeltype='c' and c.convalidated
      and c.conkey=array[(select attnum from pg_catalog.pg_attribute where attrelid=v_table and attname='user_id')]
      and c.confkey=array[(select attnum from pg_catalog.pg_attribute where attrelid='auth.users'::regclass and attname='id')]) then
      raise exception using errcode='P0001', message='WITHDRAWAL_SCHEMA_UNVERIFIED';
    end if;
  end loop;
  -- Walk inbound FK edges, not only direct auth.users children. Any new
  -- application descendant, including children of the known tables, blocks.
  if exists (with recursive descendants(rel) as (
    select 'auth.users'::regclass::oid
    union
    select c.conrelid from pg_catalog.pg_constraint c
      join descendants d on c.confrelid=d.rel where c.contype='f'
  ) select 1 from descendants d
    join pg_catalog.pg_class t on t.oid=d.rel
    join pg_catalog.pg_namespace n on n.oid=t.relnamespace
    where n.nspname not in ('auth','storage')
      and d.rel not in ('public.persona_profiles'::regclass,'public.taste_journals'::regclass))
    or (select count(*) from pg_catalog.pg_constraint c where c.contype='f'
      and c.confrelid='auth.users'::regclass
      and c.conrelid in ('public.persona_profiles'::regclass,'public.taste_journals'::regclass)) <> 2
    or exists (select 1 from pg_catalog.pg_constraint c where c.contype='f'
      and c.confrelid in ('public.persona_profiles'::regclass,'public.taste_journals'::regclass)) then
    raise exception using errcode='P0001', message='WITHDRAWAL_SCHEMA_UNVERIFIED';
  end if;
  -- Known pre-cutover snapshots are not FK-owned and have no verified expiry.
  -- Approval of a future backup design does not make these copies disappear.
  if exists (select 1 from pg_catalog.pg_class where relname in
    ('persona_pre_cas_20261111','persona_cas_cutover_20261111') and relkind in ('r','p','m')) then
    raise exception using errcode='P0001', message='WITHDRAWAL_RETENTION_UNVERIFIED';
  end if;
  -- Storage resources require provider API cleanup, not SQL metadata deletion.
  -- Check both legacy UUID and current text ownership, including unfinished
  -- multipart uploads/parts. Missing tables/columns must error, never skip.
  -- Current product has no uploads; any future upload feature must redesign
  -- this gate and coordinate concurrent uploads before enabling withdrawal.
  if exists (select 1 from storage.objects where owner_id=v_uid::text or owner=v_uid)
    or exists (select 1 from storage.buckets where owner_id=v_uid::text or owner=v_uid)
    or exists (select 1 from storage.s3_multipart_uploads where owner_id=v_uid::text)
    or exists (select 1 from storage.s3_multipart_uploads_parts where owner_id=v_uid::text) then
    raise exception using errcode='P0001', message='WITHDRAWAL_STORAGE_REVIEW_REQUIRED';
  end if;

  delete from auth.sessions where user_id=v_uid;
  delete from auth.users where id=v_uid;
  if not found then raise exception using errcode='42501', message='Authentication required'; end if;
  return true;
end;
$$;
revoke all on function room_internal.withdraw_own_account(text,uuid,uuid) from public, anon;
grant execute on function room_internal.withdraw_own_account(text,uuid,uuid) to authenticated;
create function public.withdraw_own_account(p_confirmation text, p_expected_owner uuid, p_expected_session uuid)
returns boolean language sql security invoker set search_path = '' as $$
  select room_internal.withdraw_own_account(p_confirmation,p_expected_owner,p_expected_session);
$$;
revoke all on function public.withdraw_own_account(text,uuid,uuid) from public, anon;
grant execute on function public.withdraw_own_account(text,uuid,uuid) to authenticated;
commit;
