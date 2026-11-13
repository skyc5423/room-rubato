-- Independent-database candidate only. NOT an app-database migration.
-- No actual project identifier, credential, initial data, or role is created.
-- Provisioning binds config privately, pins the signing public key in readers,
-- and grants only function execution to the trusted publication service.
begin;
create schema journal_authority;
revoke all on schema journal_authority from public;
create table journal_authority.configuration (
 singleton boolean primary key check(singleton),
 project_name text not null check(length(project_name)>0),
 epoch uuid not null,
 fencing_generation bigint not null default 0 check(fencing_generation>=0)
);
create table journal_authority.versions (
 version bigint generated always as identity primary key,
 previous_digest text,
 digest text not null unique check(digest ~ '^[a-f0-9]{64}$'),
 signed_body text not null,
 signature text not null check(signature ~ '^[A-Za-z0-9+/]{86}==$'),
 stored_at timestamptz not null default clock_timestamp()
);
create table journal_authority.head (
 singleton boolean primary key check(singleton),
 version bigint not null references journal_authority.versions(version)
);
alter table journal_authority.configuration enable row level security;
alter table journal_authority.versions enable row level security;
alter table journal_authority.head enable row level security;
revoke all on all tables in schema journal_authority from public;

create function journal_authority.activate_generation(p_generation bigint)
returns bigint language plpgsql security definer set search_path='' as $$
declare current_generation bigint;
begin
 select fencing_generation into current_generation from journal_authority.configuration where singleton for update;
 if not found then raise exception 'AUTHORITY_NOT_CONFIGURED'; end if;
 if p_generation is null or p_generation<=current_generation then raise exception 'STALE_FENCE'; end if;
 update journal_authority.configuration set fencing_generation=p_generation where singleton;
 return p_generation;
end;
$$;
revoke all on function journal_authority.activate_generation(bigint) from public;

create function journal_authority.publish(p_generation bigint,p_expected_digest text,p_body text,p_signature text)
returns text language plpgsql security definer set search_path='' as $$
declare
 cfg journal_authority.configuration%rowtype;
 prior journal_authority.versions%rowtype;
 value jsonb;
 old_value jsonb;
 digest text;
 inserted_version bigint;
 old_count integer;
 new_count integer;
 observed timestamptz;
begin
 -- One private configuration row serializes initial creation and every publish.
 select * into cfg from journal_authority.configuration where singleton for update;
 if not found then raise exception 'AUTHORITY_NOT_CONFIGURED'; end if;
 if p_generation is null or p_generation<=0 or p_generation<>cfg.fencing_generation then raise exception 'STALE_FENCE'; end if;
 select v.* into prior from journal_authority.head h join journal_authority.versions v on v.version=h.version
 cross join journal_authority.configuration c where h.singleton and c.singleton;
 if prior.digest is distinct from p_expected_digest then raise exception 'CHECKPOINT_CONFLICT'; end if;
 if p_body is null or octet_length(p_body)>33554432 or p_signature is null
   or p_signature !~ '^[A-Za-z0-9+/]{86}==$' then raise exception 'INVALID_PUBLICATION'; end if;
 value:=p_body::jsonb;
 if jsonb_typeof(value) is distinct from 'object'
   or value->>'format' is distinct from 'room-rubato-deletion-journal-v1'
   or value->>'project' is distinct from cfg.project_name
   or value->>'epoch' is distinct from cfg.epoch::text
   or jsonb_typeof(value->'events') is distinct from 'array' then raise exception 'INVALID_PUBLICATION'; end if;
 if (select count(*) from jsonb_object_keys(value))<>5 then raise exception 'INVALID_PUBLICATION'; end if;
 observed:=(value->>'observedAt')::timestamptz;
 if observed is null or observed>clock_timestamp() or observed<clock_timestamp()-interval '5 minutes' then raise exception 'STALE_PUBLICATION'; end if;
 new_count:=jsonb_array_length(value->'events');
 if prior.digest is null then
   if new_count<>0 then raise exception 'INITIAL_JOURNAL_NOT_EMPTY'; end if;
 else
   old_value:=prior.signed_body::jsonb;old_count:=jsonb_array_length(old_value->'events');
   if observed<(old_value->>'observedAt')::timestamptz or new_count not in (old_count,old_count+1) then raise exception 'JOURNAL_ROLLBACK'; end if;
   if exists (select 1 from jsonb_array_elements(old_value->'events') with ordinality x(event,position)
     where event is distinct from (value->'events')->(position::integer-1)) then raise exception 'JOURNAL_REWRITE'; end if;
 end if;
 digest:=encode(sha256(convert_to(p_body,'UTF8')),'hex');
 insert into journal_authority.versions(previous_digest,digest,signed_body,signature)
   values(prior.digest,digest,p_body,p_signature) returning version into inserted_version;
 insert into journal_authority.head values(true,inserted_version)
   on conflict(singleton) do update set version=excluded.version;
 return digest;
end;
$$;
revoke all on function journal_authority.publish(bigint,text,text,text) from public;
create function journal_authority.read_current()
returns table(version bigint,digest text,signed_body text,signature text,fencing_generation bigint)
language sql stable security definer set search_path='' as $$
 select v.version,v.digest,v.signed_body,v.signature,c.fencing_generation from journal_authority.head h
 join journal_authority.versions v on v.version=h.version
 cross join journal_authority.configuration c where h.singleton and c.singleton;
$$;
revoke all on function journal_authority.read_current() from public;
-- Signature/chain validation is required in the trusted service and every reader.
-- SQL preserves CAS/prefix history but does not implement Ed25519 verification.
-- Do not expose this function as an authenticated-user API or grant table writes.
commit;
