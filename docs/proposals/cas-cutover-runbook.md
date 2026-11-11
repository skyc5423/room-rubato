# CAS cutover runbook — NOT YET APPLIED

## Scope and authorization gate
Target: existing Room Rubato Supabase project, not a new paid project.
New revision columns and owner-only functions on `persona_profiles`; separate
`taste_journals` table for observation records. Revoke direct authenticated
INSERT/UPDATE/DELETE only for these two tables. Auth, other app tables, and
existing responses are not deleted. Browser users may need to reload; old open
tabs will fail to save rather than overwrite newer data.

Root must obtain specific confirmation of this production permission change
before executing it. General deployment permission alone has not been treated
as that confirmation. No hosted mutation has occurred during implementation.

## Verified before cutover
- Hosted existing schema/grants/policies read-only inspected.
- Isolated PGlite PostgreSQL-WASM: 25 real SQL assertions, migration preserves
  existing JSON state; owner SELECT; no anonymous/direct writes; stale revisions
  and stale reset attempts rejected; idempotent retry; journal shape checking.
- This is **not** a Supabase/PostgREST integration test or multi-connection stress
  test. Real JWT owner tests must follow in staging or rollback-only transactions.
- Client CAS queue tests: ordered revisions, halted conflicts, exact lost-response
  retry, account changes, recoverable drafts, reset tombstones, load error logout.

Reproduce isolated SQL tests without modifying application dependencies:
```
mkdir -p /tmp/room-db-test
npm --cache /tmp/room-npm-cache install --prefix /tmp/room-db-test --ignore-scripts --save-exact @electric-sql/pglite@0.5.16
PGLITE_MODULE=/tmp/room-db-test/node_modules/@electric-sql/pglite/dist/index.js node scripts/verify-cas-sql.mjs
```

## Private backup and schema application
1. Before applying, verify current deployment and feature flags. Do not enable
   either flag with unverified backend.
2. Make an in-project private backup schema/table of `persona_profiles`, with no
   USAGE/SELECT for PUBLIC/anon/authenticated. Never print or export row contents.
   Verify row count and JSON equality through aggregate boolean checks, then
   verify API-role SELECT is denied. Record backup name and timestamp privately.
3. Apply persona and journal SQL as a single reviewed transaction via official
   hosted migration tool. Persona SQL revokes old direct writes; there is a brief
   save pause until the CAS-enabled frontend is served. No schema drops.
4. Verify function ACL, pinned search_path, RLS, and `auth.uid()` derivation.
   Functions derive the target from auth.uid() and require the captured owner-id to match it, preventing account-change/token-resolution races; malformed/anonymous calls must fail.
5. Enable `NEXT_PUBLIC_PERSONA_CAS_ENABLED=true` and
   `NEXT_PUBLIC_TASTE_CLOUD_SYNC=true` only in the intended verified deployment.
   Verify exact built SHA and production alias. No silent local journal upload.
6. Test real two-client writes to authorized synthetic accounts only: each load
   same revision, A saves, B must conflict; B can export; explicit reload sees A.
   Reset on A must prevent stale B resurrecting data. Test lost-response retry.
   Real user rows must not serve as destructive test fixtures.
7. Run Supabase security advisors and document any findings before declaring ready.

## Non-destructive rollback
If frontend rollout fails, pause saves and return users an honest error. Prefer
fix-forward because restoring direct writes reintroduces the old data-loss risk.
If a compatibility rollback is explicitly chosen: turn flags off, restore only
prior table grants/policies (not all schema privileges), keep revision columns,
new journal rows, functions, and backups. Never blindly restore old state over
new writes. Any row restoration requires comparison and explicit approval.

## Behavior and retention
- Survey failed writes keep per-account local recovery copies. UI offers export
  and confirmed deletion; server reload never automatically merges old data.
- Survey reset writes an empty state at a new revision, retaining user ownership,
  consent and revision tombstone. It does not delete the Auth account.
- Journal storage is manual opt-in, not automatic background sync. UI explicitly
  warns replacement vs merge. Unknown save outcome retries the same request.
- Journal restore backs up one per-account local copy, visible/exportable/deletable.
- No event history is deleted and no guest records are silently imported.
