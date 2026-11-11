-- PROPOSAL ONLY. Do not apply before owner approval, staging verification,
-- a private backup, and coordinated frontend rollout. No migration executed.
begin;
create schema if not exists room_internal;
revoke all on schema room_internal from public, anon;
grant usage on schema room_internal to authenticated;

alter table public.persona_profiles
  add column if not exists revision uuid not null default gen_random_uuid(),
  add column if not exists last_write_id uuid;

-- Direct writes must stop at cutover: old open tabs cannot bypass CAS.
-- Existing authenticated SELECT and owner-only RLS remain unchanged.
revoke insert, update, delete on public.persona_profiles from public, anon, authenticated;

create or replace function room_internal.save_persona_cas(
  p_owner_id uuid, p_expected_revision uuid, p_write_id uuid, p_state jsonb,
  p_consent_agreed_at timestamptz, p_consent_version text
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.persona_profiles%rowtype;
  v_revision uuid := gen_random_uuid();
  v_count integer;
begin
  if v_uid is null or p_owner_id is distinct from v_uid then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  if p_write_id is null or p_state is null or jsonb_typeof(p_state) <> 'object' or octet_length(p_state::text) > 1048576 then
    raise exception using errcode = '22023', message = 'Invalid profile payload';
  end if;
  -- Serializes create/update/reset, including the no-row-yet case. Hash
  -- collisions only serialize unrelated users, never grant them access.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));
  select * into v_row from public.persona_profiles where user_id = v_uid for update;
  if found then
    if v_row.last_write_id = p_write_id then return v_row.revision; end if;
    if p_expected_revision is distinct from v_row.revision then
      raise exception using errcode = 'P0001', message = 'PERSONA_REVISION_CONFLICT';
    end if;
  elsif p_expected_revision is not null then
    raise exception using errcode = 'P0001', message = 'PERSONA_REVISION_CONFLICT';
  end if;
  if jsonb_typeof(coalesce(p_state->'completedDomains', '{}'::jsonb)) <> 'object' then
    raise exception using errcode = '22023', message = 'Invalid completed domains';
  end if;
  select count(*) into v_count from jsonb_object_keys(coalesce(p_state->'completedDomains', '{}'::jsonb));
  insert into public.persona_profiles as profile (
    user_id, state, gender, age_group, occupation, completed_count,
    consent_agreed_at, consent_version, updated_at, revision, last_write_id
  ) values (
    v_uid, p_state,
    coalesce(p_state#>>'{demographics,gender}', 'unspecified'),
    coalesce(p_state#>>'{demographics,ageGroup}', 'unspecified'),
    coalesce(p_state#>>'{demographics,occupation}', 'unspecified'), v_count,
    coalesce(v_row.consent_agreed_at, p_consent_agreed_at),
    coalesce(v_row.consent_version, p_consent_version), now(), v_revision, p_write_id
  ) on conflict (user_id) do update set
    state = excluded.state, gender = excluded.gender,
    age_group = excluded.age_group, occupation = excluded.occupation,
    completed_count = excluded.completed_count, updated_at = excluded.updated_at,
    revision = excluded.revision, last_write_id = excluded.last_write_id;
  return v_revision;
end;
$$;
revoke all on function room_internal.save_persona_cas(uuid,uuid,uuid,jsonb,timestamptz,text) from public, anon;
grant execute on function room_internal.save_persona_cas(uuid,uuid,uuid,jsonb,timestamptz,text) to authenticated;

-- Exposed wrapper is invoker, with no dynamic SQL. owner_id is equality-checked, never used as the target.
create or replace function public.save_persona_cas(
  p_owner_id uuid, p_expected_revision uuid, p_write_id uuid, p_state jsonb,
  p_consent_agreed_at timestamptz, p_consent_version text
) returns uuid language sql security invoker set search_path = '' as $$
  select room_internal.save_persona_cas(p_owner_id,p_expected_revision,p_write_id,p_state,p_consent_agreed_at,p_consent_version);
$$;
revoke all on function public.save_persona_cas(uuid,uuid,uuid,jsonb,timestamptz,text) from public, anon;
grant execute on function public.save_persona_cas(uuid,uuid,uuid,jsonb,timestamptz,text) to authenticated;
commit;
