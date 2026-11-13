-- Read-only catalog preflight. No user rows, session IDs, token values or logs.
-- A passing schema observation is NOT permission to install/activate/delete.
select
  pg_catalog.to_regprocedure('public.withdraw_own_account(text,uuid,uuid)') is not null as withdrawal_rpc_installed,
  pg_catalog.to_regclass('room_internal.account_withdrawal_gate') is not null as readiness_gate_installed,
  pg_catalog.to_regclass('room_internal.withdrawal_test_allowlist') is not null as fixture_allowlist_installed,
  exists (select 1 from pg_catalog.pg_class where relname in
    ('persona_pre_cas_20261111','persona_cas_cutover_20261111') and relkind in ('r','p','m')) as known_retention_snapshot_present,
  exists (select 1 from pg_catalog.pg_constraint c
    where c.contype='f' and c.conrelid=pg_catalog.to_regclass('auth.refresh_tokens')
      and c.confrelid=pg_catalog.to_regclass('auth.sessions') and c.confdeltype='c' and c.convalidated
      and c.conkey=array[(select attnum from pg_catalog.pg_attribute
        where attrelid=pg_catalog.to_regclass('auth.refresh_tokens') and attname='session_id')]
      and c.confkey=array[(select attnum from pg_catalog.pg_attribute
        where attrelid=pg_catalog.to_regclass('auth.sessions') and attname='id')]) as refresh_session_cascade_verified,
  not exists (select 1 from (values
    ('storage.objects','owner'),('storage.objects','owner_id'),
    ('storage.buckets','owner'),('storage.buckets','owner_id'),
    ('storage.s3_multipart_uploads','owner_id'),('storage.s3_multipart_uploads_parts','owner_id'),
    ('auth.scim_users','user_id'),('auth.flow_state','user_id'),('auth.flow_state','linking_target_id'),
    ('auth.refresh_tokens','user_id'),('auth.refresh_tokens','session_id')) as expected(rel,col)
    where not exists (select 1 from pg_catalog.pg_attribute a
      where a.attrelid=pg_catalog.to_regclass(expected.rel) and a.attname=expected.col and not a.attisdropped)
  ) as reviewed_ownership_columns_present;
