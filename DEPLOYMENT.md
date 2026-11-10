# Room Rubato deployment

## Setup

1. Create a Supabase project. Run `supabase/schema.sql` for a **new** database.
   For an existing table, review schema differences before applying; `CREATE TABLE IF NOT EXISTS` does not add columns. This version requires `consent_version` and explicit `consent_agreed_at`.
2. Configure email authentication with email confirmation enabled. Add the deployment origin to Supabase Auth Site URL and Redirect URLs. Do not use unrestricted wildcard redirects in production.
3. Google login requires the Google OAuth provider to be enabled, with authorized client credentials and the Supabase callback URL configured in Google Cloud. Without this, use email signup/login.
4. Import this repository into Vercel. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the intended environment. A publishable or legacy anon key is suitable; **never** use a service-role/secret key in browser variables. Redeploy after variable changes.
5. Use Node.js 24. Build: `npm ci`, `npm test`, `npm run typecheck`, `npm run build`.

## Security and behavior

- Legacy `/api/users` demo authentication is permanently disabled (HTTP 410).
- Missing Supabase settings permits local guest mode only, not file-backed accounts.
- Guest data is separate from authenticated profiles, is not uploaded automatically, and is not silently imported from the old shared local-storage keys.
- Profile loads finish before saves are allowed. Load failures fail closed, and write failures are shown in the profile menu.
- Email login and signup are separate. Confirmation-required signup does not imply an authenticated session.
- “취향 프로필 삭제” removes the persona row, not the Supabase Auth account. New responses can create a new profile. Full account deletion is not offered by the client.
- UUID-linked persona records are pseudonymous, not anonymous. Email remains in Supabase Auth.
- User-editable consent metadata is only a consent record, never an authorization source. Ownership is enforced by `auth.uid()` RLS.

## Required hosted acceptance checks

Not replaced by unit tests: real email delivery/confirmation, real Google OAuth redirect, authenticated refresh, cross-device restore, two-account row isolation (SELECT/INSERT/UPDATE/DELETE), anonymous access rejection, logout, profile reset, and failure/retry UX. Run security advisors after schema setup. Ensure email rate limits and production SMTP meet the expected traffic.

Unit tests mock Supabase and validate client state transitions, not the hosted authentication service or RLS runtime.
