# Observation journal cloud sync candidate

Not enabled in production. Set `NEXT_PUBLIC_TASTE_CLOUD_SYNC=true` only after the separate journal CAS table/RPC migration, account-isolation tests, backup verification and coordinated rollout have passed. No database or permission change is made by this frontend.

## Contract

- Read `taste_journals(state, revision)` filtered by authenticated `user_id` (server RLS must enforce ownership).
- `save_taste_journal(p_owner_id, p_expected_revision, p_write_id, p_state)` returns new revision UUID.
- `JOURNAL_REVISION_CONFLICT` means no write; no fallback to direct upsert is permitted.
- Server requires `auth.uid() = p_owner_id` (the supplied UUID is only an identity consistency guard, never authority to select another user), validates shape/size and authenticated identity, serializes first write, keeps idempotent request identity, and forbids direct writes from old or malicious clients.

## User behavior

- Guest and logged-in browser records remain separate. No guest migration.
- Mount/login never uploads or reads a notebook. User explicitly checks server records, then confirms the exact data scope before upload.
- This first safe release is **manual account save/load**, not automatic real-time synchronization. UI says this clearly.
- Cloud restore is explicit, creates one user-visible browser-local backup of the latest in-memory notebook first, and stops if that backup/write fails. It does not send the backup anywhere. The backup has export/delete controls and is replaced by the next restore.
- Conflicts retain local edits, disable overwrite, offer local text export and a fresh server read. The user must explicitly load server state before writing again.
- A network-uncertain save retains the exact write UUID and payload for retry, even if local editing continues; later local edits are never silently considered saved.
- Account switch/unmount invalidates callbacks. No previous account records are rendered in the next account.
- Deleting a local record remains local until the user explicitly saves the resulting notebook to the account. Server-state replacement warning covers this scope.

## Verification

Frontend contract tests cover opt-in/no mount upload, conflict lock/recovery, idempotent retries with newer local edits, owner switch during request and malformed server response rejection. These do not substitute for PostgreSQL concurrency/RLS tests or real browser end-to-end QA.
