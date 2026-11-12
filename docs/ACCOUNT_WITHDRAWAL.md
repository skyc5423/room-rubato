# Account withdrawal: staged implementation, not enabled

## Delivered

- `/account/withdrawal` is a user-visible, disabled entry point linked from `/privacy`. It accurately separates profile reset, logout, server erasure, backups and other-device copies, and gives the approved public contact. It sends no withdrawal request.
- `src/lib/account-withdrawal.ts` is an executable client protocol, default-disabled and intentionally not wired to the live UI. It verifies identity with Auth, sends exact confirmation plus a captured expected identity used only for an equality check (never as the deletion target), treats lost acknowledgments as unknown, never automatically retries or clears recovery copies, and hides raw errors.
- `docs/proposals/account-withdrawal.sql` is executable, tested candidate SQL, **not an applied or generated migration**. Private SECURITY DEFINER logic with an invoker public wrapper deletes the verified caller only. The private DB gate defaults off; retention and hosted verification gates also default off. Browser flags cannot unlock it.
- The SQL verifies a matching persisted session created within five minutes and not expired by `not_after`. Token `iat`, refresh time and editable metadata are not reauthentication. Sessions and Auth deletion happen in one transaction with profile/journal FK cascades. Exceptions roll everything back, including session revocation. Revoked-session replay cannot authorize withdrawal. Old JWT application inserts fail FK ownership after deletion.
- No user receipt/audit record is added. A successful explicit `true` is the only success acknowledgment. A lost response remains unknown and requires verification; absence of a user/session alone is not proof of successful withdrawal.

## Required before enabling (all still blocked)

1. Inventory and review hosted Auth cascades/triggers, session semantics, every application/consent/storage copy, and ownership foreign keys. The local Auth fixture is not the production Auth schema. Direct SQL deletion of Auth is a reviewed candidate, not a claim that it is supported equivalently to the Auth Admin API. Validate against a disposable hosted project and reconsider API orchestration if provider compatibility cannot be demonstrated.
2. The known `room_internal.persona_pre_cas_20261111` and `room_internal.persona_cas_cutover_20261111` snapshots have no verified expiry. SQL refuses withdrawal while either exists. Confirm their actual schema names in hosted inventory, and account for all other non-FK copies. Do not drop them without required authorization. The original workspace also has three local QA JSON copies (test-profile-backup, restoration-qa-backup, home-restoration-qa-backup); their payloads were not read here. Inventory and approved disposal/expiry must cover these copies too.
3. Integrate the owner-approved **30-day backup design** with actual backup expiration, restore/replay protection, an independent deletion ledger preventing restored users/records from resurrection, deletion reconciliation and provider-retention review. A design approval is not deployed expiry. Both external backups and database snapshots need explicit treatment. Document verified maximums; do not claim immediate backup erasure.
4. Run synthetic hosted two-account tests: fresh/old/revoked sessions, Google reauthentication creating a new session, anon and wrong-account calls, stale JWT reads/writes, in-flight CAS writes from old tabs, all session cleanup, storage-owned objects, unexpected FK tables, rollback faults, and lost acknowledgments. Current SQL refuses existing storage objects; never SQL-delete their metadata alone.
5. Review, generate and test a real migration with Supabase CLI after independent security review and an approved private backup. No migration or security/privilege changes were run against production. Keep all gates off through validation. New non-FK tables/objects are not automatically discoverable by this function; schema reviews must keep inventory current.
6. Implement and browser-test the live destructive UI only after the backend is verified: fresh sign-in, exact confirmation, repeated clicks/cancel/navigation, account changes and in-flight writes. Capture expectedOwner and expectedSession when confirmation opens, never when submitting; the protocol checks owner against getUser and the RPC rechecks both against auth.uid() and the verified JWT session_id. Session IDs are assertions, not authorization. A caller must not recapture them silently after account/session changes. On confirmed success, quiesce stores, clear only the current user's scoped journal/profile/recovery caches and session, then reload. Do not clear guest/other-user data or assert that other device/exported copies were erased. On unknown outcome preserve copies and offer verification, not a false failure/success.
7. Final operator identity, audience/minimum age, processor/transfer and retention disclosures still require review. This implementation is not legal-policy sufficiency.

## Repeatable local checks

`npm ci --ignore-scripts`, `npm test`, `npm run typecheck`, `npm run build`.

SQL checks use an isolated temporary pinned PGlite 0.3.14 install; no hosted credentials or connection string:

`PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node scripts/verify-withdrawal-sql.mjs`

This covers default-off, private gate permissions, exact confirmation, malformed/missing/wrong/stale/expired sessions, storage/snapshot/new-FK/drift blockers, transactional rollback, two-account data preservation, deleted-account JWT replay and FK resurrection prevention. It does not test production Auth, PostgREST, concurrent connections, real browser cleanup or backup expiry.

## References checked 2026-11-12

- https://supabase.com/changelog.md (no relevant JS breaking change found)
- https://supabase.com/docs/guides/auth/sessions
- https://supabase.com/docs/guides/auth/managing-user-data

Production remains unchanged. No real accounts or backups were deleted.
