# Exact release/schema transition preflight, 2026-11-18

No production writes, user-row reads, deployment, credential decryption, or migration application were performed. This is a current catalog/configuration observation and local regression, not an end-to-end authenticated release acceptance.

## Current observed contract

- Supabase service project is ACTIVE_HEALTHY, PostgreSQL 17.11.0.018. Migration history records owner-checked CAS cutover on November 11; later November 13 entries concern a scoped backup reader. The candidate's proposal files are not a migration queue to apply wholesale.
- `persona_profiles` and `taste_journals` both have RLS enabled, authenticated SELECT, no anonymous SELECT, and no authenticated direct INSERT/UPDATE/DELETE.
- Both tables have `revision uuid NOT NULL` and nullable `last_write_id uuid`, matching the client CAS contract.
- `public.save_persona_cas(uuid,uuid,uuid,jsonb,timestamptz,text)` and `public.save_taste_journal(uuid,uuid,uuid,jsonb)` exist as security-invoker wrappers. Corresponding `room_internal` implementations are security-definer with empty search_path. Anonymous execution is denied; authenticated execution is granted. This catalog check does not test the current function body, PostgREST schema cache, or actual owner-isolated writes.
- `withdraw_own_account`, its private gate and its fixture allowlist are absent. Known retained pre-CAS/cutover snapshots still exist. This is consistent with the disabled withdrawal page and default-disabled client helper, not permission to install or enable them.
- Vercel app project metadata reports a READY production target. Plain production environment metadata has `NEXT_PUBLIC_PERSONA_CAS_ENABLED=true` and `NEXT_PUBLIC_TASTE_CLOUD_SYNC=true`; the listing contains no email-signup enable flag. These are current project settings, not proof of a historical artifact's compiled values. No encrypted/sensitive values were decrypted. The two true flags are production-targeted, so a preview build must not be assumed equivalent.
- Email signup is default-off in code; the UI and handler use the same gate. This does not disable the provider's direct signup API. SMTP/recovery/provider configuration and real login remain separate acceptance gates.

## Concrete defect corrected locally

The historical `supabase/schema.sql` bootstrap granted direct profile writes and recreated write policies. Reapplying it to the current CAS database would silently reopen a path around revision checks. It now refuses any database with profile revision/write-ID columns or a persona-CAS function, before changing anything, and wraps bootstrap statements in one transaction.

A new isolated PGlite regression proves: clean bootstrap succeeds; pre-CAS reapplication succeeds; CAS cutover revokes direct writes; later bootstrap fails with `LEGACY_BOOTSTRAP_BLOCKED_AFTER_CAS`; grants remain revoked and revision columns remain. The existing 123 isolated withdrawal SQL checks still pass. The environment example now states the existing service's required build flags and explicitly keeps email signup false.

## Allowed future transition, exact remaining gates

1. **App-only candidate:** do not apply `supabase/schema.sql` or any `docs/proposals/*.sql`. There is no newly required schema migration for the reviewed auth/logout and fixture-test changes. Preserve existing CAS grants/functions.
2. **Before an authorized deployment:** verify exact tested commit and CI; build with both CAS flags true and email signup off. Confirm safe target database and public key configuration without exposing credentials. Preview tests must use matching flags and an approved synthetic arrangement, not arbitrary writes to the service database.
3. **Rollback:** select a previously verified CAS-compatible artifact with matching compiled flags. Do not set CAS false, restore direct writes, or execute bootstrap to make an older frontend appear functional. A code rollback does not roll back database state or authorize restoring retained snapshots.
4. **Still blocked:** real-account/PostgREST owner isolation, hosted withdrawal/provider cleanup, real-data backup scope/restore, retention and non-resurrection, physical-device/actual audio, and OAuth provider configuration. Their disabled features remain disabled; public health/smoke or synthetic CI cannot clear these gates.
5. **Additional read-only preflight available:** re-run catalog presence/signature/grant/column checks, inspect ownership policies and foreign-key metadata, compare function definitions against reviewed versions, and inspect exact deployed build metadata. Do not query application/Auth/Storage row payloads as part of schema preflight.
