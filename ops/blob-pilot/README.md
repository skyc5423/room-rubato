# Synthetic Blob backup pilot, not a production backup

Deploy **only this directory** as the existing separate `room-rubato-backup-writer` project. Never deploy the Room Rubato app as part of this rehearsal. There is no Postgres client, DB export, user input, upload body, B2 client, restore SQL, or private recovery key in this deployment. It seals the exact hard-coded two-row synthetic fixture only. `lib/backup-core.mjs` is an exact copy of the reviewed repository core; a parity regression test prevents drift.

## Server environment

- Existing `BACKUP_PRODUCTION_ENABLED=false` is mandatory.
- `PILOT_SYNTHETIC_ONLY=true` is mandatory.
- `PILOT_START_AT` / `PILOT_EXPIRES_AT`: UTC timestamps, at most 31 days apart. Current intended trial is 7 days. Expiration stops writes, not authenticated archive retrieval/status.
- `PILOT_PUBLIC_KEY`, `PILOT_KEY_FINGERPRINT`: RSA >=3072 public key and SHA-256 SPKI fingerprint. Synthetic-only private key remains outside the writer, repository, Blob and Vercel account.
- `PILOT_RECEIPT_SECRET`: independent random >=32 characters, sensitive server env. HMAC authenticates synthetic bundle and attempt/result receipts, not a production independent disaster ledger.
- `PILOT_RUN_SECRET`: independent random >=32 characters, sensitive env, manual and monitoring access.
- Existing `CRON_SECRET`: GET Cron authentication only, never retrieve or copy it.
- `BLOB_READ_WRITE_TOKEN`: private pilot store only, sensitive production target. SDK 2.9.0 pinned. This pilot uses the actual injected static token, **not assumed OIDC**.

## Routes

- `POST /api/run`, `Authorization: Bearer <PILOT_RUN_SECRET>`: no input accepted or exported; run current UTC day's fixture.
- `GET /api/run`, `Authorization: Bearer <CRON_SECRET>`: same operation plus first authenticated Cron invocation timestamp persisted separately. Only the configured Cron caller should possess this secret; it is evidence of authenticated invocation, not an infallible assertion of Vercel origin.
- `GET /api/status`, manual secret header: read-only aggregate status, fresh origin checks of archive digest/HMAC and receipts, last success/failure, separate `lastScheduledInvocationAt`. No public read-amplification endpoint.
- `POST /api/archive`, manual secret header, JSON `{ "runId": "YYYY-MM-DD" }`: exact bounded synthetic archive bundle only, no caller-selected paths or external URLs. Works after write expiration. Never returns storage credentials or recovery key.

Daily Cron is `0 12 * * *` (Hobby: one invocation within 12:00–12:59 UTC; delivery can delay/fail, **no automatic retry**). Manual success does not prove scheduled execution. Inspect `lastScheduledInvocationAt` after the actual window. Persist the `/api/run` receipt separately from `/api/archive` output. Verify using:

```
node scripts/backup/verify-blob-synthetic-restore.mjs BUNDLE_FILE RUN_RECEIPT_FILE PRIVATE_KEY_FILE
```

This repo-root harness decrypts with the independently stored key and compares the exact fixture, then restores every column into disposable in-memory PostgreSQL (PGlite). It has no hosted connection string. Its successful result, not the upload response, establishes `restoreVerified:true`. The online route always returns `restoreVerified:false`.

## Failure / retry / retention rules

Each UTC day has one create-only archive and up to three create-only attempts/results. At most one first authenticated Cron marker per day. Each write is <=64 KiB. A 5-minute abandoned-claim timeout permits a later manual retry. Archive upload with uncertain acknowledgement is not overwritten: origin read verifies the signed bundle and digest. A successful receipt is not enough: repeat run and status must still verify the actual archive. Corruption fails closed; there is no self-repair or delete path. On network failure while claiming/persisting receipts, the function returns 503 and the attempt marker or absent status remains detectable. No untrusted exception text is returned or persisted.

The independent monitor must check authenticated status after the daily window, alert on missing/stale/unavailable status or missing scheduled marker, and may explicitly retry POST within the bounded attempt limit after checking failure. A monitor is **not configured merely by deploying this directory**. Verify that the alert destination actually works. Preserve success/failure receipts beyond Hobby's short runtime logs. Retry exhaustion/corruption requires operator diagnosis rather than unbounded calls.

No automatic deletion is configured. Expired pilot objects remain until specifically approved cleanup. Code-level no-overwrite is **not provider WORM/immutability**: this read-write token/account can delete objects outside this application. Blob and writer share the Vercel account, so neither same-account control plane loss nor compromise is isolated. Free Hobby is personal/noncommercial and monthly quotas are shared; commercial use requires a new plan/destination decision. This is not full-service disaster recovery: Auth, Storage objects, other tables and physical device/account recovery remain outside this pilot. Real user data needs its own destination/retention/recovery authorization and design.

## Local/CI tests

```
npm ci --ignore-scripts --prefix ops/blob-pilot
npm test --prefix ops/blob-pilot
npm run test:backup
```

CI uses generated synthetic keys only and never contacts hosted stores. Root workflow retains all existing gates. The pilot's pinned SDK lockfile and files under `api/` + `lib/`, `package.json`, `package-lock.json`, `vercel.json` are the deploy bundle; omit tests, README, node_modules and all repo-external recovery files. Do not add the offline SQL harness to deployment.

## Temporary synthetic diagnostic evidence

`PILOT_DIAGNOSTIC_LOG=true` opts in to a **synthetic-only** diagnostic emitter on successfully authenticated Cron GET runs. POST/manual runs never emit archive data. The emitter rechecks active gates, fixed fixture identity, bundle HMAC/digests and sealed-envelope shape, then emits a field-allowlisted `RUBATO_SYNTHETIC_PILOT_RECEIPT` and base64 `RUBATO_SYNTHETIC_PILOT_ARCHIVE_CHUNK` events (1500 characters/chunk, zero-based index, count, day and bundleDigest). Use the existing authenticated administrative runtime-log connector, not a change to deployment protection. Reassemble only one complete matching day/digest set, verify its digest against the separate receipt, then run the offline private-key/PGlite verifier. Missing/truncated/mixed chunks are failure, not successful restoration.

This is temporary evidence for the bounded **synthetic** rehearsal only. It must never be enabled for real user backups. No private key, API token, request header, arbitrary result/env fields, plaintext fixture or raw exception text is logged. Failures emit only a fixed diagnostic marker and cannot convert backup failure into success. Logs are short-lived on Hobby, are not durable independent backup storage, and remain within the same Vercel account. Disable the opt-in after evidence collection. The persistent Blob receipts and external missed-run check remain necessary.
