# Room Rubato deployment

Deployment is a separately authorized action. Passing CI or following this document does not authorize a production release, database changes, new accounts, or user-data migration.

## Existing Room Rubato database: app-only release

1. Do **not** run `supabase/schema.sql`: it is a legacy bootstrap, not a migration/rollback. The existing database already has owner-checked CAS functions and revoked direct writes. The bootstrap now fails closed after CAS cutover.
2. Verify the exact commit and passing CI. Use a CAS-compatible artifact for release **and rollback**; never restore direct grants or switch off CAS to accommodate an old frontend.
3. Recheck the catalog contract before building: both profile/journal tables have `revision uuid NOT NULL` and `last_write_id uuid`; owner-only SELECT policies and RLS; no authenticated direct INSERT/UPDATE/DELETE; authenticated-only execution of `public.save_persona_cas(uuid,uuid,uuid,jsonb,timestamptz,text)` and `public.save_taste_journal(uuid,uuid,uuid,jsonb)`. Their public wrappers are invoker, private implementations are reviewed definer functions with empty search_path. Verify actual definitions and owner checks, not just names. See [current preflight evidence](docs/RELEASE_SCHEMA_PREFLIGHT_20261118.md).
4. Set public URL/publishable or legacy anon key for the approved environment, **never** a service-role/secret key. Existing-service build flags are `NEXT_PUBLIC_PERSONA_CAS_ENABLED=true`, `NEXT_PUBLIC_TASTE_CLOUD_SYNC=true`, `NEXT_PUBLIC_EMAIL_SIGNUP_ENABLED=false`. These flags are compiled at build time; changing runtime/project settings does not rewrite an old artifact. Preview must not be assumed to inherit production-scoped flags or permission to use real records.
5. Node.js 24: `npm ci`, `npm test`, `npm run test:backup`, `node scripts/verify-withdrawal-sql.mjs`, `npm run typecheck`, then a build with the flags above. Follow the exact-sha release/alias/public-smoke and controlled authenticated acceptance gates in [OPERATIONS.md](docs/OPERATIONS.md). Do not apply proposal SQL during an app-only release.

## New database or isolated local setup: different prerequisites

`.env.example` documents the **existing CAS service**. Copying its true flags into a new database without CAS migrations will not provide working account saves.

1. For a clean, approved local/isolated database, the SQL dependency order is `supabase/schema.sql` → `docs/proposals/persona-cas.sql` → `docs/proposals/taste-journal-cas.sql`. The first requires Supabase Auth roles/schema. The latter two add profile revision/write ID and the journal table, revoke direct writes, and install the exact CAS contracts above. `scripts/verify-withdrawal-sql.mjs` demonstrates this order only in disposable in-memory PostgreSQL fixtures; it is not a hosted migration runner.
2. For a new **hosted** database, review and generate tracked migrations for those changes, validate them in an approved isolated arrangement, and obtain the applicable database-change authorization before applying. Files under `docs/proposals` remain proposals, not automatically approved or already-applied migrations. Do not apply withdrawal, recovery-fence, or deletion-authority proposals merely to complete setup.
3. Verify column types/nullability, function bodies/signatures/search_path, anonymous denial, owner isolation, RLS and revoked direct-write grants. Only then build with both CAS flags true. Keep account signup/withdrawal disabled until their own gates pass. Do not direct a default-false legacy client at the existing CAS database or use direct grants as a workaround.
4. Configure the approved Supabase public URL/key and specific Auth Site URL/redirect allowlist. Google OAuth requires the correct provider/client callback and published audience/branding review. Missing Google setup does **not** authorize enabling email signup as a fallback. New email signup stays off until SMTP, real delivery, confirmation, recovery and abuse protections are verified; existing email sign-in remains available.

## Security and current behavior

- Legacy `/api/users` demo authentication is permanently disabled (HTTP 410).
- Missing Supabase settings permits local guest mode only, not file-backed accounts.
- Guest data is separate from authenticated profiles and is never silently imported.
- Profile loads finish before saves. Load failures fail closed; save failures retain recovery options.
- CAS profile reset writes an empty state at a new revision, retaining identity, consent and the concurrency tombstone. It does not delete Auth or notebook records.
- `/account/withdrawal` is a disabled informational page. The staged helper defaults disabled; hosted withdrawal RPC/gates remain uninstalled. Do not turn it on through a browser flag.
- UUID-linked records are pseudonymous, not anonymous. Email remains in Auth. Editable consent metadata is not authorization; owner checks use authenticated identity.

## Acceptance not replaced by local checks

Real OAuth redirects and session return, two-account PostgREST isolation, revision conflicts/unknown acknowledgements, cross-device behavior, controlled profile reset, backup restoration/retention, actual audio and physical-device checks remain separate. Preserve real records; use only approved synthetic fixtures. Public `/api/health` and read-only smoke do not prove authenticated persistence.

Keep email signup off unless its delivery/recovery requirements pass. Full withdrawal and public launch remain blocked by their own provider-lifecycle, retention/non-resurrection and policy gates. No real-account deletion or snapshot disposal is implied by setup or rollback.
