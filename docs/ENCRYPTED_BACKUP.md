# Encrypted app-data backup: implementation candidate, NOT ACTIVE

Status: inactive implementation candidate. No production data was exported, uploaded, restored or deleted by these scripts. No scheduler, retention rule, database role or production credential has been installed. This is not a claim that recovery is operational.

## Scope and guarantees

- Source project: `nhusocbyuxzjsfwitkhe`; only `public.persona_profiles` and `public.taste_journals`, explicit current columns, one repeatable-read read-only transaction.
- Excluded: Auth users/password hashes/sessions, Storage, secrets, legacy snapshots and schema migrations. This is **application-data recovery**, not complete Supabase disaster recovery. Auth identity recovery needs a separate approved plan.
- Destination: private B2 bucket `room-rubato-backups-sangmin5423`, ID `a593f42c829bd620a011031b`, prefix `snapshots/`. Existing B2 server-side encryption is additional protection, not a substitute for the client encryption here.
- Node 24 standard-library AES-256-GCM per snapshot, random key/nonce; RSA-OAEP-SHA256 key wrapping with a minimum 3072-bit recovery public key. Public fingerprint must be pinned. Recovery private key must never be placed on the writer or in the repository.
- Strict schema and size limits. Personal rows never printed or placed in CI artifacts. JavaScript strings cannot be reliably zeroed; run in a dedicated short-lived trusted process, without core dumps or verbose process logging.
- Writer key must authorize only `writeFiles`, exactly this bucket and prefix. An account-wide, read-enabled, delete-enabled or unknown-capability key is rejected. If the B2 web UI cannot provision that exact scope, do not weaken validation; use an approved scoped API provisioning flow.
- Upload acknowledgment is checked, but is NOT readback/decryption/restore verification. Uncertain uploads are never automatically retried.

## Activation gates (unresolved)

1. Select an approved persistent runner and secure credential store. Do not put production secrets into public source, chat, CLI arguments or CI logs. Do not modify `main` merely to obtain GitHub's default-branch scheduler. No web-app/public runtime environment should hold a recovery private key.
2. Review a dedicated SELECT-only database role for exactly the two tables, with verified RLS coverage and no write/Auth privileges. Test row-count parity as an administrator without exposing row data. An ordinary RLS-limited role can silently create incomplete backups; a privileged service role is not a safe substitute. No role/grant SQL is included or applied here.
3. User-approved recovery custodian generates and securely retains the RSA private key separately from the writer, verifies the public fingerprint, and tests recovery. No real recovery keys have been generated here.
4. Provision the restricted B2 writer key directly into that runner's approved secret store. Use private `PGPASSFILE` and verified TLS trust. Install a supported `psql` client from an approved source.
5. Establish the independent deletion ledger, signing authority, live-owner inventory and receipt checkpoint store described below. These do not yet exist operationally.
6. Perform one authorized live export/upload, download through a separate read-only credential, compare with an independently retained SHA256 receipt, decrypt privately, and test an isolated restore. Only after verified success enable the daily schedule and health alerts.

## Runner interface

`node scripts/backup/run.mjs` stages only encrypted bytes; `--upload` additionally uploads. Both fail closed unless `BACKUP_PRODUCTION_ENABLED=true`.

Required: `PGHOST`, `PGDATABASE`, `PGUSER`, private `PGPASSFILE`, `BACKUP_OUTPUT_DIR` (0700), `BACKUP_PUBLIC_KEY_FILE`, `BACKUP_KEY_FINGERPRINT`; optional `PGPORT` and `PGSSLROOTCERT`. Upload also needs `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_ID`. Password URLs/`PGPASSWORD` are refused. Encrypted output/receipt files are 0600 and never overwrite existing paths. Pin the approved script revision and runner image; no automatic source updates.

Proposed schedule: once daily at 03:00 Asia/Seoul (18:00 UTC previous day), one overlapping-run lock, maximum run time 5 minutes, alert on failure or most recent independently verified receipt older than 26 hours. This timing is a proposal, not an active schedule or a user-selected preference. Keep an independent receipt per archive containing SHA256, immutable file ID, timestamp, source/schema revision and verification outcome. Do not trust a checksum stored beside an archive as proof of provenance.

## Thirty daily copies: retention is deliberately OFF

User requested 30 daily copies. A verified daily recovery point must exist before an old point is considered eligible. A simple 30-day lifecycle alone does not guarantee 30 usable copies when runs fail. Enumerate every version/file ID, reconcile against independent receipts, and present a concrete deletion manifest before enabling irreversible expiry. Any permanent deletion requires the applicable action-time confirmation. No cleanup method or lifecycle call is implemented in this candidate. Existing bucket versions, local snapshots, legacy schema copies and deleted-user records are not silently removed by adding this pipeline. Until retention is approved and installed, growth must be monitored and the 30-copy requirement is NOT satisfied.

## Deletion ledger and restore safety

The ledger must live outside the database being restored and outside the backup writer's mutable authority. A separate Ed25519 signing key signs the canonical ledger payload. Each event carries sequence, user ID, deletion time and previous-event hash. An independently retained monotonic checkpoint pins epoch, sequence and ledger digest; a signature alone does not prevent replay. A five-minute-fresh, signed live Auth owner inventory uses the same trusted authority. An empty ledger is only valid with a real signed genesis and independent checkpoint, never a fabricated default.

Deletion requests must be durably recorded before destructive account work is acknowledged; errors must not bypass the ledger. The current application withdrawal flow is NOT wired to this protocol. Retention of pseudonymous deletion markers and keys requires a separately reviewed policy. Backing up a ledger solely inside the same snapshot defeats rollback protection.

`node scripts/backup/plan-restore.mjs` is **offline planning only**. It requires all `RESTORE_*` variables listed in the script, including an independently trusted archive SHA256, private recovery key, signed fresh ledger and owner inventory, independent checkpoint, and private output path. Inputs containing owner data must be 0600. It refuses invalid/stale/missing trust inputs, excludes deleted or absent owners, rotates CAS revisions and clears prior write IDs. The resulting plaintext file is private and explicitly `applicationAuthorized:false`; its deadline is not permission to apply it.

There is deliberately NO production restore importer. Before an importer can be enabled, design a transactionally enforced deletion/restore fence: revalidate a fresh independent ledger, its monotonic checkpoint and current owners immediately before application, block concurrent deletions or recheck before commit, dry-run against an isolated schema, verify constraints/RLS and obtain approval for the actual overwrite. Never recreate Auth users from a snapshot or reuse stale CAS revisions. Keep the independent ledger and receipts when restoring application data.

## Verification

`npm run test:backup` runs isolated Node tests with generated throwaway keys and synthetic rows. CI invokes this separately from Vitest. No test connects to production or B2. Tests cover envelope roundtrip/tamper/provenance, schema rejection, ledger replay/freshness/signatures, deleted/missing owners, revision rotation, restricted B2 capabilities/endpoints and uncertain-upload behavior. An additional in-memory PGlite/PostgreSQL rehearsal exports synthetic rows, encrypts/decrypts them, applies the filtered plan to a second synthetic database and verifies old CAS revisions cannot write. This is not a production importer. These tests do not prove live Postgres export permissions, B2 configuration, recovery-key custody, scheduler delivery or live-data recovery.

## Runner investigation (2026-11-13)

Connected environment discovery found only the dot cloud computer, no owner-controlled persistent host. Do not use this transient workspace as the scheduler or sole key custodian. Vercel reports the existing Room Rubato project on the Hobby plan; a connected tool can create production-only Secret variables (`type: sensitive`). No secret has been written. A separate backup-only project would isolate credentials from the public app, but would require explicit credential provisioning and adapting the psql runner to a supported PostgreSQL client or narrowly scoped export RPC. Vercel cannot directly run this CLI without that adaptation. Avoid a Supabase service-role key as a shortcut. GitHub's default-branch schedule restriction still prevents simply adding a cron to the deployment branch while leaving main untouched.

Recommended next boundary: choose a dedicated backup-only runtime, provision only SELECT-scoped DB access and the prefix-scoped B2 writer key as production Secrets, and keep the recovery private key with an independent owner-controlled custodian. Retain archive receipts outside the writer's mutable authority. No existing approved recovery-key custodian was discovered, so creating a private key in this workspace would not safely complete setup.
