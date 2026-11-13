# Account withdrawal: staged implementation, not enabled

## Delivered

- `/account/withdrawal` is a user-visible, disabled entry point linked from `/privacy`. It accurately separates profile reset, logout, server erasure, backups and other-device copies, and gives the approved public contact. It sends no withdrawal request.
- `src/lib/account-withdrawal.ts` is an executable client protocol, default-disabled and intentionally not wired to the live UI. It verifies identity with Auth, sends exact confirmation plus a captured expected identity used only for an equality check (never as the deletion target), treats lost acknowledgments as unknown, never automatically retries or clears recovery copies, and hides raw errors.
- `docs/proposals/account-withdrawal.sql` is executable, tested candidate SQL, **not an applied or generated migration**. Private SECURITY DEFINER logic with an invoker public wrapper deletes the verified caller only. The private DB gate defaults off; retention and hosted verification gates also default off. Browser flags cannot unlock it.
- The SQL verifies a matching persisted session created within five minutes and not expired by `not_after`. Token `iat`, refresh time and editable metadata are not reauthentication. Sessions and Auth deletion happen in one transaction with profile/journal FK cascades. Exceptions roll everything back, including session revocation. Revoked-session replay cannot authorize withdrawal. Old JWT application inserts fail FK ownership after deletion.
- No user receipt/audit record is added. A successful explicit `true` is the only success acknowledgment. A lost response remains unknown and requires verification; absence of a user/session alone is not proof of successful withdrawal.

## Required before enabling (all still blocked)

1. Inventory and review hosted Auth cascades/triggers, session semantics, every application/consent/storage copy, and ownership foreign keys. The local Auth fixture is not the production Auth schema. Direct SQL deletion of Auth is a reviewed candidate, not a claim that it is supported equivalently to the Auth Admin API. Validate against a disposable hosted project and reconsider API orchestration if provider compatibility cannot be demonstrated.
2. The known `room_backups.persona_pre_cas_20261111` and `room_backups.persona_cas_cutover_20261111` snapshots have no verified expiry. SQL refuses withdrawal while either exists. Their schema names were verified by read-only hosted metadata on 2026-11-12. Account for all other non-FK copies. Do not drop them without required authorization. The original workspace also has three local QA JSON copies (test-profile-backup, restoration-qa-backup, home-restoration-qa-backup); their payloads were not read here. Inventory and approved disposal/expiry must cover these copies too.
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


## Hosted compatibility inventory, 2026-11-12 (read-only)

Queried catalog/information-schema metadata and the definitions of the existing two CAS RPCs on the original project only. No user, session, journal, profile, backup or Auth row contents were queried. No migrations, grants, configuration changes, account creation or deletion were performed. The proposed withdrawal RPC and gate are not installed.

Verified compatibility:

- `auth.sessions.id` and `user_id` are non-null UUIDs. `created_at` and `not_after` are nullable timestamps with time zone. The fixture had non-null `created_at`; the candidate still fails closed for a hosted null timestamp, but add that fixture case before activation.
- `storage.objects.owner` is nullable UUID and `owner_id` is nullable text, matching the candidate's two ownership checks. Storage ownership has no FK to Auth in the inspected graph. `objects_bucketId_fkey` points only to `storage.buckets`.
- Both application tables have exactly the expected validated `user_id → auth.users.id ON DELETE CASCADE` constraints. No additional application descendants appeared in the recursive inbound Auth FK graph, and no non-internal triggers were found on those application tables or the inspected Auth descendants.
- The existing CAS functions derive the target from `auth.uid()`, compare `p_owner_id` for equality, use the expected per-owner advisory locks, and preserve revision checks. They do **not** check `auth.sessions` existence/revocation. The verified FK prevents recreation after owner deletion; session revocation alone while an Auth user remains does not immediately deny an otherwise-valid JWT. Hosted replay/concurrency tests are still necessary.
- Authenticated direct INSERT/UPDATE/DELETE grants are absent on both app tables; owner-only SELECT RLS remains. Older persona INSERT/UPDATE/DELETE policy definitions still exist, but policy existence does not restore revoked table privileges.
- Both snapshots live in `room_backups`, with schema/table ACLs restricted to postgres, no FK ownership constraints, and no expiry column. RLS is off on these private snapshots; the verified ACLs, not RLS, currently provide API-role isolation. The candidate checks the snapshot names across schemas and therefore blocks correctly despite the earlier documentation's wrong schema.

Additional compatibility/retention review gaps, **not evidence that these features contain user data or are used**:

- `auth.scim_users.user_id` references Auth with **ON DELETE SET NULL**, not CASCADE. It also has nullable `external_id` and `deleted_at`. Its presence in the schema does not establish SCIM usage. Review provider deletion semantics and retention before treating SQL Auth deletion as complete.
- `auth.flow_state.user_id` has no ownership FK; `auth.audit_log_entries` has a JSON payload but no user FK in the inspected metadata. No payloads were read. Their lifecycle must be verified with provider behavior/documentation, not inferred from Auth cascades.
- `auth.refresh_tokens.session_id` cascades from sessions but is nullable; `user_id` is nullable text without an Auth FK. Current-session descendants cascade, but the schema alone cannot prove that every historical token is session-linked or removed. No tokens or counts were read.
- Other verified Auth cascade descendants include identities, MFA factors/challenges/recovery sets/codes, MFA AMR claims, OAuth authorizations/consents, one-time tokens and WebAuthn records. Their presence is not evidence of usage. The minimal local fixture does not model this complete provider graph.
- Storage also has owner fields on buckets, multipart uploads and multipart-upload parts. The current candidate only blocks owned `storage.objects`; review all supported ownership surfaces and extend fail-closed handling before activation. Do not SQL-delete Storage metadata. The hosted Storage table has a `protect_objects_delete` trigger as well as an update timestamp trigger.
- Security advisor returned one warning: leaked-password protection is disabled. No setting was changed. This is separate from withdrawal correctness. Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Concrete synthetic hosted validation plan (not executed)

1. Keep the public gate disabled. Review and implement the missing Auth/Storage lifecycle handling above and independent backup-deletion reconciliation first. Never bypass global retention guards merely to get a passing test.
2. Obtain approval for a narrowly scoped synthetic-only test deployment in the original project, including exact disposable account identities, candidate migration and cleanup operations. Do not create another project, move the service, touch real accounts or enable deletion for ordinary users. If synthetic-only isolation cannot be enforced, stop before writes and request a supported test arrangement.
3. With approved synthetic accounts A/B, create distinct benign fixture profile/journal markers through normal authenticated APIs. Retain fixture identifiers only in an approved private test record; never print tokens, passwords or record contents. Verify B's fixture remains unchanged after every operation.
4. Exercise real Auth/PostgREST flows: missing/expired token, owner mismatch, session mismatch, same-owner replacement session, missing/null/old/future creation time, `not_after` expiry, refresh without reauthentication, and Google fresh reauthentication. Verify exact confirmation and no duplicated submissions. Manipulated session timestamps belong only in an approved isolated fixture, never in ordinary accounts.
5. Test storage/snapshot/schema/trigger blockers and forced rollback against isolated synthetic fixtures; do not add dangerous cross-user cascading constraints or failing triggers to production application tables. Use a separately scoped fixture schema for those structural fault cases. Verify no real schema/data changes occur.
6. For approved A only, verify all applicable Auth/API artifacts before and after withdrawal by fixture-scoped existence checks, including the non-FK/provider paths above. Check B preservation, all A sessions, legacy tokens, Auth sign-in, stale JWT reads/inserts/updates, and concurrent CAS from old tabs. Account deletion is irreversible; obtain required action-time confirmation for the concrete fixture deletion.
7. Drop the success response intentionally in the test harness: UI must say outcome unknown, preserve recovery copies, avoid automatic deletion retry and verify using a safe fixture-scoped path. Test account/session switching between confirmation and submission, navigation/cancel/repeated clicks, and post-success scoped cache cleanup without deleting guest/B data.
8. Complete a private backup restore rehearsal with the independent deletion ledger: restore must not resurrect deleted fixture A while retaining B and newer writes. Verify actual expiry for database snapshots, local QA copies, external backup versions and provider-managed retention. Only then prepare a separate reviewed activation decision and exact migration.

## Storage blocker completion, 2026-11-13 (candidate only)

A new read-only `information_schema.columns` check in the original project confirmed UUID `owner` and text `owner_id` on both Storage `objects` and `buckets`, plus text `owner_id` on `s3_multipart_uploads` and `s3_multipart_uploads_parts`. No resource contents, session records or credentials were queried.

The SQL candidate now refuses withdrawal when any of those ownership surfaces belongs to the requester. Both legacy and current ownership fields are checked where available. It never deletes Storage metadata; supported provider cleanup must happen through Storage APIs. Missing ownership columns/tables raise an error rather than silently bypassing review. These checks do not coordinate concurrent uploads and do not establish full provider retention semantics. Any future upload feature requires a new concurrency and lifecycle design before withdrawal can be enabled.

The isolated PostgreSQL harness now models nullable session creation time, checks null/future creation times, exercises each new Storage blocker with account/session/profile/journal and Storage-row preservation assertions, rejects missing-table and ownership-column drift, and verifies another account's resources survive successful synthetic withdrawal. **72 isolated checks pass.** These are in-memory synthetic fixtures only, not hosted Auth, PostgREST, concurrent connections, real-device, backup-restoration or provider-erasure acceptance tests.

The hosted withdrawal function and private gate remain uninstalled; the public page remains disabled. Auth non-FK and SET NULL artifacts, snapshot expiry, independent deletion-ledger reconciliation, real-device/session tests and concrete approval for irreversible synthetic hosted deletion remain unresolved. No production account, Storage resource, provider setting or backup was changed.

Provider references: [Storage schema](https://supabase.com/docs/guides/storage/schema/design), [Storage ownership](https://supabase.com/docs/guides/storage/security/ownership). Their general guidance does not replace the observed project schema or hosted acceptance tests.

## Auth orphan guard completion, 2026-11-13 (candidate only)

Read-only column metadata confirmed `scim_users.user_id`, both `flow_state.user_id` and `flow_state.linking_target_id`, and `refresh_tokens.user_id`/`session_id`. No tokens, flow codes, JSON payloads or user rows were read. The candidate now refuses withdrawal if SCIM or either pending-flow identity references the caller. It also refuses sessionless or cross-owner refresh-token relationships in **both directions**: an A-owned token attached to B's session, and a B-owned (or unowned) token attached to A's session. Only consistently caller-owned session descendants may cascade. The exact validated refresh-token session FK must remain ON DELETE CASCADE; missing, unvalidated, SET NULL and NO ACTION replacements are regression-tested blockers.

The isolated harness covers those blockers, untouched fixture records, missing ownership-column failure, normal session-linked token cascade and preservation of B's SCIM, flow and refresh-token references. **97 isolated checks pass.** This does not resolve historical orphan records, audit JSON payloads or provider logs, nor does it establish equivalence with the supported Auth Admin deletion API. These are refusal guards, not an implementation of provider erasure. No provider-owned records were changed in the hosted project.

### Next hosted test stages, with explicit stop conditions

- **Read-only preflight now:** inspect schema/function metadata and confirm the hosted public withdrawal RPC is absent and the UI disabled. Do not collect credentials or read token values. Record booleans and schema evidence rather than user payloads.
- **Rejection-only hosted stage, not authorized/executed here:** obtain the exact synthetic A/B account identities and approval for test account creation plus a separately reviewed, synthetic-only function installation. The current global three-boolean gate is **not sufficient isolation**: toggling it could allow any ordinary authenticated user. Before installation design a private fixture allowlist with exact A/B identities, a bounded expiry and deny-by-default behavior; keep the ordinary public route disabled. A/B must have no existing real data. Never put fixture account IDs or credentials in this public document. Test requests must use the ordinary authenticated API rather than a service key that bypasses RLS.
- **No bypass for successful deletion:** existing snapshot retention blockers must remain effective even for synthetic identities. Until independent backup/deletion-ledger reconciliation is verified, only rejection and read-only checks are meaningful. Do not exempt fixture identities from retention to manufacture an end-to-end pass.
- **Destructive hosted stage, not authorized/executed here:** after all readiness gates and synthetic isolation are independently reviewed, request action-time approval naming the exact disposable account and irreversible operation. Keep B intact. Before deletion record only scoped counts/expected fixture IDs in a private test record; after deletion check A absence, B equality, consistent provider artifacts, old-session API denial, simultaneous CAS behavior and unknown-acknowledgment handling. No JWT, refresh token, auth code or private note belongs in logs/artifacts.
- **Cleanup is separate:** do not assume test authorization covers irreversible account deletion or dropping retained snapshots. Remove temporary entry points/grants only through the approved migration/rollback plan, verify ordinary users could never call the test path, and confirm no fixture-exception configuration remains before later activation review.

This staged design is not a new approval request or a claim that test infrastructure exists. It makes the missing hosted authorization and isolation explicit while keeping all production deletion disabled.
