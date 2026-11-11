# Profile snapshot CAS proposal (not applied)

## Why a client-only patch is insufficient

Current saves replace one user's entire JSONB state. Independent tabs can both read
revision R and then write unrelated snapshots; the last wins. A read-before-write
check is itself racy. Old open tabs must also be prevented from unconditional upsert.

## Candidate change

`persona-cas.sql` is a review draft, not an executed migration. It adds a UUID
revision and last-write id, leaves existing state/consent unchanged, and exposes an
owner-scoped CAS RPC. The RPC gets the user only from `auth.uid()`, serializes writes
(including first creation), rejects a mismatched expected revision, and returns a
fresh revision. The mutation ID permits retry if a successful response was lost.
Direct authenticated INSERT/UPDATE/DELETE are revoked; SELECT and owner RLS stay.
A private-schema definer is necessary for the narrow write capability after direct
write grants are removed; its public wrapper is invoker. `anon` and PUBLIC cannot
execute either. `search_path` is empty; all tables/functions are schema-qualified.
No other user's ID can be supplied.

A profile reset should write `{}` via CAS and retain only revision/consent metadata,
not physically remove the row. This tombstone prevents a stale tab resurrecting
old answers. This changes the storage implementation of “delete taste data,” not
Auth account deletion. Review disclosure and implementation before cutover.

## Client integration (pending, do not claim implemented)

- Hydration loads `revision` alongside state. Existing row always has a token.
- Each serialized write uses the last ACKed revision at the moment it starts.
- Retain the exact mutation ID on uncertain network retry. New state after ACK gets
  a new ID. Never regenerate a failed request ID blindly.
- On conflict stop the queue. Keep the local draft in memory and leave server data
  untouched. Show a persistent, keyboard-accessible banner, not only an auth popover:
  “다른 기기에서 응답이 바뀌어 저장을 멈췄어요. 이 화면의 새 답변은 아직 저장되지 않았어요.”
- Offer “이 화면의 답변 파일로 보관” (local JSON export) and “서버의 최신 기록 불러오기”.
  Confirm that the latter replaces the unsaved local draft. No silent auto-merge,
  overwrite-server button, or unlimited retry loop. Account change clears drafts.
- Before logout, warn if a conflict/unsaved state remains; do not report it saved.
- Old client gets permission denied and must refresh. Prefer a small refresh notice
  release before cutover. Do not promise zero-downtime writes.
- No fallback to legacy upsert when RPC is unavailable; fail closed.

`profile-cas.ts` is a candidate transport only, not wired into the current store.
Tests use a deterministic server model, not live PostgreSQL.

## Approval and rollout gate

No live SQL or security/grant change has been executed. Parent must obtain required
approval for concrete privilege changes before any live application.

1. Inspect live schema, policies, grants (including column grants), triggers and
   security advisors. Ensure private schema is not API-exposed. Check current DB
   version and confirm UUID/hash functions resolve with empty search_path.
2. Staging/local DB: apply draft and run real two-connection race tests. Verify same
   revision yields one winner, initial insert race, stale post-reset writes, retry
   after lost ACK, unauthenticated denial, another user's isolation, malformed
   input, direct old upsert rejection, new-tab read, and deletion semantics.
3. Prepare recoverable backup BEFORE live change, in a non-exposed private backup
   schema with no public/anon/authenticated usage/read privileges, plus schema and
   grant definitions. Never copy user data into GitHub or public artifacts. Verify
   row count and per-row state hashes against the live source in the transaction.
   Retention/deletion of the backup needs a documented decision; do not silently
   delete backups or restore old user content.
4. Implement client conflict UX and reset path; test account switching, delayed
   saves, queue interruption, export, reload confirmation and cleanup.
5. Coordinated cutover: one DB transaction for revision/RPC/revoke, then verified
   compatible deployment. Expect a brief write-block for old clients. Verify exact
   deployed SHA and direct API negative tests before announcing protection.
6. Query security advisors and verify unchanged state hashes immediately after DDL.
   Test only a designated test account, with before/after snapshot and cleanup.

## Rollback

Prefer roll-forward. If client is faulty, stop writes while repairing it instead
of restoring stale snapshots. Schema additions can remain inert. A rollback to old
code requires explicit regrant of table writes and reintroduces the original race;
do not do this automatically. Restore individual user states only after comparing
current revision and confirming that no later legitimate writes are discarded.
Do not drop the revision/last-write columns or backup as a casual rollback step.

## Outstanding validation

No Postgres/DB race/RLS test or live migration has run. The local shell could not
fetch the Supabase changelog within the bounded request; Supabase's live Database
Functions docs were read via its documentation tool. The docs confirm invoker as
default, empty search_path for definer, and revocation of PUBLIC execution:
https://supabase.com/docs/guides/database/functions
