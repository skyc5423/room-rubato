-- App-database candidate only. No production role grants or user-data mutation.
-- Integration contract: the trusted orchestrator must hold this transaction lock
-- before independent journal publication, deletion, or restore reconciliation.
-- ALL destructive/import entry points must use it; existing withdrawal RPC is
-- not integrated and must stay disabled. A lease alone is not a commit fence.
begin;
create sequence room_internal.recovery_generation as bigint no cycle;
revoke all on sequence room_internal.recovery_generation from public;
create function room_internal.acquire_recovery_fence()
returns bigint language plpgsql security definer set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('room-rubato:deletion-restore-fence:v1',0));
 return pg_catalog.nextval('room_internal.recovery_generation'::regclass);
end;
$$;
revoke all on function room_internal.acquire_recovery_fence() from public;
-- No grant here: grant only to the eventual narrowly scoped trusted orchestrator.
-- Use before existing per-owner CAS locks. Never mix the opposite lock order.
commit;

-- Activate this exact generation at the independent authority before publication
-- or reading restoration trust state. A delayed lower-generation activation or
-- publication must fail there. Keep this sequence out of table-level restores.
-- Whole-DB rollback is OUT OF SCOPE. Never just reseed above the authority head:
-- old issued-but-not-activated generations are absent there and can collide.
-- Stop workers and revoke their old authority credentials, reconcile in-flight
-- outcomes, then review an independent epoch/allocator recovery protocol before
-- resuming. This candidate supports app-table-only restore with sequence intact.
