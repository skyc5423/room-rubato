-- REVIEW CANDIDATE: no hosted DB changes have been performed.
begin;
create schema if not exists room_internal;
revoke all on schema room_internal from public, anon;
grant usage on schema room_internal to authenticated;
create table if not exists public.taste_journals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{"version":1,"entries":{}}'::jsonb,
  revision uuid not null default gen_random_uuid(),
  last_write_id uuid,
  updated_at timestamptz not null default now()
);
alter table public.taste_journals enable row level security;
revoke all on public.taste_journals from public, anon, authenticated;
grant select on public.taste_journals to authenticated;
drop policy if exists "Read own observation journal" on public.taste_journals;
create policy "Read own observation journal" on public.taste_journals for select to authenticated using ((select auth.uid()) = user_id);

create or replace function room_internal.save_taste_journal(p_owner_id uuid, p_expected_revision uuid, p_write_id uuid, p_state jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid(); v_row public.taste_journals%rowtype;
  v_revision uuid := gen_random_uuid();
begin
  if v_uid is null or p_owner_id is distinct from v_uid then raise exception using errcode='42501', message='Authentication required'; end if;
  if p_write_id is null or p_state is null or jsonb_typeof(p_state) <> 'object'
     or p_state->>'version' is distinct from '1' or jsonb_typeof(p_state->'entries') is distinct from 'object'
     or octet_length(p_state::text) > 1048576 then
    raise exception using errcode='22023', message='Invalid journal payload';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('journal:' || v_uid::text, 0));
  select * into v_row from public.taste_journals where user_id=v_uid for update;
  if found then
    if v_row.last_write_id=p_write_id then return v_row.revision; end if;
    if p_expected_revision is distinct from v_row.revision then
      raise exception using errcode='P0001', message='JOURNAL_REVISION_CONFLICT';
    end if;
  elsif p_expected_revision is not null then
    raise exception using errcode='P0001', message='JOURNAL_REVISION_CONFLICT';
  end if;
  insert into public.taste_journals(user_id,state,revision,last_write_id,updated_at)
    values(v_uid,p_state,v_revision,p_write_id,now())
    on conflict(user_id) do update set state=excluded.state, revision=excluded.revision,
      last_write_id=excluded.last_write_id, updated_at=excluded.updated_at;
  return v_revision;
end;
$$;
revoke all on function room_internal.save_taste_journal(uuid,uuid,uuid,jsonb) from public, anon;
grant execute on function room_internal.save_taste_journal(uuid,uuid,uuid,jsonb) to authenticated;
create or replace function public.save_taste_journal(p_owner_id uuid, p_expected_revision uuid, p_write_id uuid, p_state jsonb)
returns uuid language sql security invoker set search_path = '' as $$
 select room_internal.save_taste_journal(p_owner_id,p_expected_revision,p_write_id,p_state);
$$;
revoke all on function public.save_taste_journal(uuid,uuid,uuid,jsonb) from public, anon;
grant execute on function public.save_taste_journal(uuid,uuid,uuid,jsonb) to authenticated;
commit;
