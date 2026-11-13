# Room Rubato managed encrypted backups

## Current choice and status

The owner chose **Backblaze service-managed encryption (SSE-B2)** to avoid personally creating or storing a recovery key. This supersedes the earlier optional client-encryption proposal. No password-manager installation, USB key custody or custom browser cryptography tool is required.

This is encryption at rest managed by Backblaze, **not end-to-end encryption**. Uploads travel over TLS and authorized downloads are plaintext. Backblaze controls the encryption keys. A compromised B2 account/read credential can expose the backups; compromise of the writer runtime/Vercel account can expose source data and the writer credentials. Account recovery depends on the providers' account recovery, not a user-held cryptographic key.

As of implementation: private encrypted bucket exists; separate Vercel writer project, production Secret storage, SELECT-only database login and scoped RLS policies are configured. The first live backup, readback, actual-data isolated restore, daily cron and irreversible retention have **not yet been verified or enabled**. Do not infer operational recovery from a successful code test or deployment.

## Boundaries

- Source: project `nhusocbyuxzjsfwitkhe`, only `public.persona_profiles` and `public.taste_journals`, explicit columns, consistent repeatable-read read-only transaction.
- Excluded: Auth users/password hashes/sessions, Storage, database secrets, schema migrations and legacy snapshots. This is app-data recovery, not full Supabase disaster recovery.
- B2: private bucket `room-rubato-backups-sangmin5423`, ID `a593f42c829bd620a011031b`, prefix `snapshots/`.
- Vercel: separate `room-rubato-backup-writer` project `prj_TO6prOB9hvCt8wTFK4IaOTu27ZAF`, Node 24. No backup secrets are placed in the public app.
- Database: dedicated `rr_backup_writer`, no superuser/role creation/database creation/replication/BYPASSRLS/inherited privileges. SELECT on exactly the two app tables and USAGE on public; SELECT-only policies apply only to this role. No Auth/Storage or app-table write privileges. Password plaintext is a production Secret; migration uses a SCRAM verifier rather than the plaintext password.
- Supabase session pooler is dashboard-confirmed: `aws-0-ap-northeast-2.pooler.supabase.com:5432`; username `rr_backup_writer.nhusocbyuxzjsfwitkhe`. The direct IPv6 host failed from Vercel. No paid IPv4 addon was purchased.

## Runtime and credential gates

`scripts/backup/http.mjs` is deployed only through a tiny `api/backup.mjs` wrapper in the dedicated framework-free worker, not as a public-app API route. It requires an exact strong bearer `CRON_SECRET`, production project identity and `BACKUP_PRODUCTION_ENABLED=true`. It returns no source rows and never stages plaintext files. Unknown upload outcomes are not automatically retried.

Required production Secrets: `BACKUP_DB_PASSWORD`, `B2_KEY_ID`, `B2_APPLICATION_KEY`, `CRON_SECRET`, `BACKUP_RECEIPT_SIGNING_KEY`. Non-secret configuration includes DB host/port/name/user, `B2_BUCKET_ID`, `BACKUP_ENCRYPTION_MODE=SSE-B2`, and independently verified `BACKUP_TARGET_BUCKET_PRIVATE_CONFIRMED=true`. No variable may use a `NEXT_PUBLIC_` prefix. Default activation remains false.

B2 key validation requires exactly this bucket, prefix `snapshots/`, and **only `writeFiles`**. Read/delete/list/governance or unknown capabilities are refused. If the dashboard cannot issue that scope, do not weaken validation silently. A separate reader is needed for recovery verification.

Bucket privacy must be checked independently when provisioning and periodically afterward. The write-only key cannot query bucket privacy. The confirmation environment value records an actual check; setting it is not a substitute for checking. SSE-B2 alone does not prevent public downloads.

The export is protected by a transaction-level advisory lock, statement timeout, TLS certificate verification and a conservative size preflight before materializing the JSON. Oversized or overlapping runs fail closed. A failed upload or lost acknowledgment must be reconciled by file ID before retrying.

`verify-connection.mjs` can perform an authenticated deployment-build probe and log only role, counts and privilege booleans. It never exports source rows. A temporary public Vercel share link was denied; no link was created and Deployment Protection was not disabled.

## Integrity receipts without a user recovery key

Each archive uses SSE-B2 and receives an Ed25519-signed receipt containing its bucket, immutable file ID, path, SHA256, byte length, timestamps and verification flags. The signing private key is a Vercel production Secret, separate from the B2 account. `receipt-public.pem` is the pinned public verification key and is not secret.

The signed receipt is uploaded alongside the archive, also using SSE-B2. Both uploads must be acknowledged. A B2 credential alone cannot forge a new valid receipt. The writer or Vercel account can sign receipts, so this is not protection against compromise of that authority. Losing the signing private key does not make existing archives unreadable: preserve the old public verification key and rotate the service key for new receipts. Do not discard old public keys while old signed archives are retained.

Upload acknowledgment sets neither `readbackVerified` nor `restoreVerified`. Verify the exact file ID with a separate read-only credential, validate the signature and SHA256, and rehearse the actual snapshot into an isolated database before claiming recoverability.

## Recovery and deleted-user protection

`plan-restore.mjs` with `RESTORE_ENCRYPTION_MODE=SSE-B2` requires a private downloaded archive, its signed receipt, a fresh independently signed deletion ledger, a monotonic checkpoint, and a signed current Auth-owner inventory. It verifies the pinned receipt key, hash, length, snapshot identity and strict schema. **No user decryption key is required.** The legacy client-envelope branch remains only for old `.rrb` archives.

The deletion ledger must not be rolled back with the restored app data. Its continuously maintained trusted authority/checkpoint storage and the account-deletion integration are still pending. An absent ledger is never treated as empty. Offline planning rejects deleted or absent owners, rotates CAS revisions and clears previous write IDs. It does not recreate Auth users. A plan is explicitly `applicationAuthorized:false` and expires within five minutes of its trust inputs.

There is no production restore importer. Actual application requires current deletion/owner revalidation and a transactionally enforced deletion/restore fence; a dry-run plan is not authorization to overwrite live tables. This gate does not prohibit collecting backup copies, but it prevents claiming completed automatic restoration or deleted-user safety before integration exists.

## Scheduling and thirty recovery points

Proposed daily schedule: 03:00 Asia/Seoul (18:00 UTC previous day), a single-run lock, health alert on failure or latest verified recovery point older than 26 hours. No schedule is active until separately verified. Daily copies may contain an archive and signed receipt pair, not just one B2 object.

Retention is **not active**. `retention-plan.mjs` produces a review-only exact-version manifest from complete trusted/reconciled receipts and retains at least 30 distinct verified daily points even after missed runs. It refuses stale/unverified/incomplete inventories. It performs no delete request. Permanent expiry needs concrete action-time approval before activation; existing legacy DB/local copies are outside this job. A simplistic 30-day expiry is not a guarantee of 30 recoverable copies.

## Verification and delivery

`npm run test:backup` runs synthetic-only tests; `npm test`, typecheck and build protect the existing app. PostgreSQL/PGlite rehearsals cover export, encryption compatibility, deleted-owner filtering, isolated insertion and stale-CAS rejection. Managed-mode tests cover SSE-B2 acknowledgments, signature tampering, role/activation gates and retention refusal. Synthetic tests are not evidence that live credentials, live backups, cron delivery or actual-data recovery work.

The managed CLI `run-managed.mjs` is an optional dedicated-host alternative using `psql` and a private receipt directory; it requires the same independent bucket-privacy confirmation. Current cloud direction is the separate Vercel worker. Never use the dot's transient workspace as the sole scheduler or credential custodian.

## Lifecycle semantics and deletion reconciliation review (2026-11-13)

[Backblaze lifecycle documentation](https://www.backblaze.com/docs/en/cloud-storage-lifecycle-rules) distinguishes prior-version expiry from upload-age hiding. The prior-version preset preserves each filename's latest version; Room Rubato's date/UUID archive names are distinct filenames. Upload-age rules can hide even the latest version, but hidden versions remain retrievable by file ID until permanent deletion. Rules run daily after the configured interval, not at an exact elapsed deadline. Overlapping prefixes use the smallest applicable values; Object Lock can prevent deletion.

The current implementation uses review-only exact-version retention planning, not an activated lifecycle rule. This review finds a configuration hazard to avoid, **not evidence of an applied faulty rule**. Do not replace the current disabled state with a “prior versions: 30 days” preset and call it 30-day archive expiry. Do not publish a strict physical-erasure deadline from a hide setting.

Before retention activation:
- Resolve the policy distinction: keeping at least 30 verified daily recovery points can retain older-than-30-day copies when runs are missed. A strict maximum age and that minimum point count cannot both be guaranteed then. No automatic preference or deletion follows from this review.
- Reconcile a complete all-version inventory, including hidden versions, archive/receipt pairs, interrupted or orphan uploads, and any replicas. A current-visible-files list is insufficient. Keep exact bucket/file IDs and approval scope; missing receipts or incomplete inventory must block deletion.
- Verify the newest remaining archive/receipt pairs can restore before proposing irreversible expiry. A provider rule does not inspect readback or restore success.
- Continue enforcing the independent deletion ledger and current-owner checks for every retained archive, including hidden ones. Hiding or restoring an old archive cannot justify resurrecting a deleted owner. Ledger/checkpoint retention must cover the oldest still-recoverable copy, including legacy database/local copies and any recovery exports, not merely a nominal lifecycle interval.
- Obtain concrete action-time approval for irreversible deletion settings or exact versions, then verify actual removal and reconcile unknown outcomes before reporting completion. Do not give the unattended writer delete privileges.

No lifecycle, expiry, backup upload, restore import or deletion was performed in this review.
