-- Run with a separately reviewed SELECT-only backup role and psql -X -qAt.
-- NO auth credentials/sessions, storage contents, legacy snapshots, or secrets.
-- One repeatable-read transaction captures both application tables together.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '5s';
SELECT jsonb_build_object(
 'format','room-rubato-app-backup-v1',
 'project','nhusocbyuxzjsfwitkhe',
 'snapshotId',gen_random_uuid(),
 'capturedAt',transaction_timestamp(),
 'tables',jsonb_build_object(
  'persona_profiles',COALESCE((SELECT jsonb_agg(jsonb_build_object('user_id',p.user_id,'gender',p.gender,'age_group',p.age_group,'occupation',p.occupation,'completed_count',p.completed_count,'state',p.state,'consent_agreed_at',p.consent_agreed_at,'consent_version',p.consent_version,'updated_at',p.updated_at,'revision',p.revision,'last_write_id',p.last_write_id) ORDER BY p.user_id) FROM public.persona_profiles p),'[]'::jsonb),
  'taste_journals',COALESCE((SELECT jsonb_agg(jsonb_build_object('user_id',j.user_id,'state',j.state,'revision',j.revision,'last_write_id',j.last_write_id,'updated_at',j.updated_at) ORDER BY j.user_id) FROM public.taste_journals j),'[]'::jsonb)
 )
);
COMMIT;
