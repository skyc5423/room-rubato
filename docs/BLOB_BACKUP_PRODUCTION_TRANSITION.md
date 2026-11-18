# Synthetic pilot evidence and production transition gates

This is a checklist, not permission to enable user-data export or deploy the Room Rubato application. The current writer remains `BACKUP_PRODUCTION_ENABLED=false`, fixture-only. The November 17 rehearsal tested a separate backup writer, private Blob upload/origin readback, a real scheduled invocation and external-key in-memory PostgreSQL restoration of **two synthetic rows**. It did not establish production backup, complete service recovery, permanent key escrow or Vercel-account independence.

## Offline evidence collection

The collector reads a **saved** authenticated Vercel runtime-log export. It performs no network request and cannot prove the export's authentication itself. It checks the MAC field's shape but does not independently authenticate the HMAC without its secret; no HMAC secret or private recovery key is requested by the collector. Preserve where and when the authorized operator obtained that export. The parser accepts the connector's exact Markdown record format, known writer project `prj_TO6prOB9hvCt8wTFK4IaOTu27ZAF`, selected deployment/day and optional request/digest selectors. It rejects malformed/truncated exports, unknown schemas, incomplete or duplicated chunks, mismatched digests, diagnostic/runtime failures and ambiguous multiple request groups. Declared export coverage and selected source-event count are retained, not mistaken for proof that no other events occurred.

```
node scripts/backup/collect-blob-evidence.mjs \
  SAVED_LOG_TEXT EXPECTED_DEPLOYMENT YYYY-MM-DD /ABSOLUTE/NEW/OUTPUT_DIR \
  RESTORE_REPORT_OR_DASH NOW_ISO OPTIONAL_REQUEST_ID OPTIONAL_BUNDLE_DIGEST
```

Arguments are positional. Use `-` when there is no restore report. Inputs must be regular bounded files with private permissions (0600), with neither a symlink final component nor symlink parent traversal. The output directory must not exist, its parent must exist without symlink traversal, and outputs use directory mode0700/file mode0600. Existing evidence is never overwritten. `evidence.json` contains only validated selected metadata/events, not arbitrary unrelated log text; `receipt.json`, `bundle.json`, `report.json` accompany it. Retain the original log export separately. A process interruption can leave a partial output directory; retain it for inspection and choose a new directory for a subsequent run, never silently replace it.

After collecting, run the separate offline verifier with the independently held synthetic key:

```
node scripts/backup/verify-blob-synthetic-restore.mjs \
  OUTPUT_DIR/bundle.json OUTPUT_DIR/receipt.json PRIVATE_KEY_FILE
```

Save its report separately and evaluate again into a different explicit output directory. No plaintext database or private key belongs in the repository, Blob archive diagnostics, CI artifacts or chat.

Monitoring classification:
- Before 13:10 UTC on the target date: absent complete evidence or external restore is **pending**. Hobby's daily noon run has the12:00–12:59 window plus10-minute grace.
- At/after13:10: absent complete evidence/restore is **missing**, not a proven Cron failure. Short-lived, partial or unavailable logs can also explain missing evidence.
- Invalid, conflicting or diagnostic/error evidence: **failure of verification**, not automatically failure of the scheduler.
- **verified** requires one complete matching artifact and an external restore report matching day, archive digest, bundle digest, both row counts and successful PGlite restoration. The report is trusted local operator evidence, not a cryptographic attestation independently authenticated by this parser. A previous day's restore cannot qualify today's run.

The November18 checks at12:55,13:05 and13:15 UTC are a synthetic follow-up, not an ongoing production monitoring service. A production monitor needs independent execution, durable state, tested alert delivery and an explicit recovery/escalation owner.

## Independent escrow rehearsal, November 18

A separate `room-rubato-recovery-escrow` project in the existing Supabase organization was created and verified `ACTIVE_HEALTHY`. The organization API reports `free` / `tier_free`; the operating database plus escrow use the two active-project allowance. Escrow database size at inspection was 11,114,163 bytes, well below the published 500 MB allowance. No paid upgrade was requested.

A newly generated **synthetic-only** RSA-3072 private key was stored in that project's Vault and retrieved through the existing authenticated management connection. A separate local in-memory RSA-OAEP-SHA256 decryption matched the precomputed synthetic plaintext digest. The escrow project was then actually paused to `INACTIVE`, resumed without a new login, and reached `ACTIVE_HEALTHY`; retrieval and decryption using the same stored key passed again. The operating project was not paused or altered and remained healthy. No private-key temporary file was required, no key value belongs in this document, and security advisors reported no findings before/after the rehearsal.

Metadata checks found no Vault schema/read privilege for `anon` or `authenticated`; default `service_role` can read decrypted secrets. No escrow credential was given to the Vercel writer. This is a distinct **project deletion/configuration failure boundary**, not independence from the Supabase account, organization administrators or provider. A recovered management connection can retrieve the key; perpetual connector authentication is not guaranteed. This rehearsal is not a production-key enrollment, a production-data restore or proof of alert delivery.

Free projects can pause after low activity over seven days. A health/existence monitor can detect this and the management resume path has been exercised, but occasional queries are not an availability guarantee. The provider currently documents a one-year restoration window for paused projects. Never delete the escrow project or retire a key while retained archives still depend on it. Production key rotation must preserve old keys until every corresponding retained archive has been reconciled and its deletion independently approved.

The earlier cloud-workspace synthetic key directory could not be found on the later attached workspace. Accordingly this rehearsal used a fresh challenge and key, not a claimed repeat restoration of November 17's archive. Workspace-local files alone must not be treated as durable escrow. The writer's historical synthetic key fingerprint must not silently be relabeled as the new escrow key.

Official constraints: https://supabase.com/pricing and https://supabase.com/docs/guides/platform/free-project-pausing . Vault portability and roles: https://supabase.com/docs/guides/database/vault .

## Scoped production gates, current status and concrete scope

The completion target must be the explicitly selected app-data backup scope, not an automatically expanded perfect disaster-recovery system. Authorization, recoverable keys, accurate limitations and tested operation are required for that scope. Broader recovery capabilities below are decisions/exclusions, not newly imposed mandatory features; accepted gaps must remain visible in the completion report.

1. **Data/destination authorization: closed.** Obtain explicit scope before transmitting actual data to the new destination. Candidate scope must name Vercel private Blob store `room-rubato-backup-synthetic-connected` (or a separately approved production store), which exact tables/columns are included, residency, who can access it, retention and deletion behavior. Existing Backblaze approval does not authorize a new destination. `persona_profiles`/`taste_journals` is app-only scope, not Auth or Storage restoration. Never repurpose synthetic archives as production evidence.
2. **Account-failure independence: not established.** Current writer `room-rubato-backup-writer` and Blob live in the same Vercel team/account. A separate project prevents accidental app routing changes, not account compromise, suspension or lost administrator access. Decide and authorize an independently controlled encrypted recovery copy or explicitly accept that gap before calling the system disaster recovery.
3. **Permanent recovery-key escrow: unconfigured.** The November 18 synthetic-only key is retained in the separate escrow project described above. It is not a production key, and its fingerprint differs from the earlier writer archive key. Establish a separately controlled, recoverable vault/custodian, access policy, recovery instructions and a successful second-device recovery drill. Never deploy the private key beside its archives or send it in chat. Without this gate, encrypted production backups can become permanently unrecoverable.
4. **Credentials: constrained, not immutable.** Current static `BLOB_READ_WRITE_TOKEN` is sensitive and scoped to the private store in writer production env, but it does not expire and can read/write/delete through authorized APIs. Application-level create-only paths are not WORM or account-level delete protection. OIDC is not automatically in use: official migration requires upgrading the Blob project connection, provisioned `BLOB_STORE_ID`/`BLOB_WEBHOOK_PUBLIC_KEY`, redeployment and validation. An explicit token option overrides OIDC; this pilot explicitly passes the static token. Any migration must preserve existing approvals and validate recovery separately.
5. **Costs/terms/capacity: unresolved for commercial operation.** Hobby is personal/noncommercial. Blob free allowances are shared:1GB storage,10,000 simple operations,2,000 advanced operations and10GB transfer/month. Exceeding allowances can stop access rather than provide unlimited free backup. Calculate encrypted archive sizes, write/readback/monitor/retry costs, retention, headroom and commercial plan eligibility before activation. Do not change to paid plans without authorization.
6. **Continuous operation and detection: not complete.** Cron has no automatic failure retry, Hobby runs at most daily with imprecise timing, runtime logs are short-lived. Durable receipts plus independent missed-run evaluation and a proven alert channel are required. Bound manual retries, preserve prior usable backups, and treat stale/missing evidence as an incident requiring diagnosis rather than overwriting archives.
7. **Retention/deletion/restore correctness: not a production policy.** Current trial expires November24 and stops writes; existing objects remain until explicitly approved deletion. Define how user deletion requests affect backups, verified retention duration, latest deletion authority/owner inventory, restoration fencing and schema migration. Reuse the existing fail-closed deletion/authority design, not an ad hoc raw import. App-account withdrawals and backup deletion must not resurrect removed owners.
8. **Whole-service recovery: separate scope, not an automatic blocker to app-data backup.** Supabase database backups do not contain Storage object contents; Auth configuration/identities, object bytes, migrations, app environment and external service settings need explicit scoped recovery decisions. Free Supabase recommends off-site backups. If Auth, Storage and other components are outside the authorized two-table app-data backup scope, record them as explicit exclusions; their implementation is not required merely to complete that limited scope. Completing app-data backup and completing full-service disaster recovery are different claims. A synthetic two-table PGlite test cannot establish the broader recovery objective or a real production RPO/RTO.
9. **Activation test and shutdown path: required.** Before any real-data run, complete all authorizations and gates applicable to the selected scope and run a separate end-to-end recovery drill with verified data scope, least privilege, externally retained evidence and alert delivery. Never flip `BACKUP_PRODUCTION_ENABLED` or remove fixture-only guards as a side effect of finishing the pilot. Disable `PILOT_DIAGNOSTIC_LOG` after synthetic evidence collection; encrypted archive logging is prohibited for production.

Primary references reviewed for the gate decisions:
- https://vercel.com/docs/vercel-blob/security
- https://vercel.com/docs/vercel-blob/usage-and-pricing
- https://vercel.com/docs/plans/hobby
- https://vercel.com/docs/schedules/cron-jobs/usage-and-pricing
- https://supabase.com/docs/guides/platform/backups

## Offline recovery inventory consistency checker

`inspectRecoverySet` in `scripts/backup/blob-recovery-readiness.mjs` checks a complete, externally reconciled archive/key metadata inventory. It rejects unknown fields (including accidental private-key payloads), duplicate identifiers, malformed timestamps and future archives. It flags absent keys, unverified key retrieval, missing archive readback/restore evidence, and no fresh recoverable point. Every archive and every referenced historical key is retained in its output; it never proposes or performs deletion.

`consistent` means only that supplied metadata is internally consistent. The caller must independently authenticate the source, prove the restore and escrow separation, and verify destination/scope. The checker deliberately returns `sourceAuthenticationVerifiedOffline=false`, `escrowIndependenceVerified=false`, `deletionAuthorized=false`, and `productionReady=false`. It does not connect to Vercel/Supabase, send alerts, enroll operational keys, or enable a backup schedule. The new tests are synthetic and cannot serve as actual production recovery evidence.

## Synthetic alert contract follow-up

See [the November 18 operational gate matrix](OPERATIONS_GATES_20261118.md) for the current acceptance order, evidence limits and estimates. `scripts/backup/synthetic-alert.mjs` plus 11 synthetic tests now exercise missing/stale evidence, missing scheduled invocation, latest failed attempt and bounded delivery-adapter outcomes, including the real pilot status producer against an in-memory store. This does **not** establish a configured independent monitor or delivery to the user's inbox/device. No external message or actual user data was sent.

## November 18 matching-key synthetic repair

The separate synthetic writer was redeployed as `dpl_79kuDx1XRadPAnXWXAfeWKBRJHAD` (READY). The operating Room Rubato app was not deployed. It now uses the already escrowed synthetic key fingerprint `486401d712f451288e9d7b5cc96d8982208e7c0714f24e88cbe65c19554ef6a3`, verified against the private key recovered from the separate escrow Vault.

Physical objects are now under `synthetic-pilot-keys/<fingerprint>/<day>/...`. Logical pilot paths and receipt/envelope schemas are unchanged. No historical-path fallback, overwrite or delete is implemented. Historical `synthetic-pilot/...` objects were not modified or deleted by this transition; their current bytes were not independently re-inventoried, and this does not recover their missing historical key. Eight new storage tests verify namespace isolation, key matching, path/date denial, size bounds, uncertain writes and actual same-day two-key pilot runs preserving prior bytes.

At 06:26:38 UTC a manually authenticated POST created/read back one two-row synthetic archive in the new namespace. A second POST returned `idempotent:true`, attempt1 and the same digests, not a second archive. A separately recovered escrow private key decrypted it and restored every column into isolated in-memory PostgreSQL/PGlite: one profile and one journal, including Unicode state. Archive digest `b57a784b19b0afb0251b4718fb6d59ae7d0a3b0a203bf2f7e296bc7d0a91c300`; bundle digest `60f7edf544a797eeb1568a21ae91c85fabdb4d44369ec594f08df66ca8946908`. The external restore report is dated 06:26:59 UTC.

`PILOT_RUN_SECRET` was replaced and stored/re-read in the existing private synthetic escrow Vault for subsequent authorized status checks, without requiring another user login. CRON, Blob, receipt-signing and database credentials were not changed. The private recovery key was not sent to Vercel. Synthetic-only=true, production-export=false, November24 expiry and noon daily Cron remain unchanged. Manual success is **not Cron success**: `lastScheduledInvocationAt` remained null before the scheduled window, and the writer intentionally continues to return `restoreVerified:false` because only the independent verifier performed restoration.

Local pilot tests:28/28. These results close the matching-key **new synthetic archive** recovery gap only. They do not enroll an operational key, back up users, prove historical archives recoverable, establish account/provider independence, or validate actual phone delivery.
