# Authentication launch readiness (2026-11-11)

## Verified
- Current app calls Google signInWithOAuth without extra scopes.
- Unauthenticated production authorize endpoint redirects to accounts.google.com with scope `email profile` (no token or secret captured).
- Google documentation exempts basic identity-only requests from test-user allowlist and seven-day expiration rules. Therefore Testing does not by itself prove Room Rubato is restricted to registered testers. A second non-listed real account is still untested, and Workspace policies may block access.
- Cloud Console remains `Site Unavailable` from the current cloud browser. No Google configuration changed.

## Email launch gate
`NEXT_PUBLIC_EMAIL_SIGNUP_ENABLED` defaults off. UI does not offer new email signup and the application handler rejects it. Existing email sign-in remains. This is an app guard, **not an auth-provider enforcement control**: direct Supabase signup endpoints retain current settings.
Enable only after custom SMTP, confirmed email delivery, recovery UI/redirect handling, abuse limits and secret storage have been tested. Never disable email confirmation to evade delivery failures.
Default Supabase SMTP is restricted to organization-team recipients and documented as two messages/hour, best-effort only. Custom SMTP requires a sender/provider/domain decision; no account, purchase or external email has been created/sent here.

## Leaked password protection
Supabase documents this as Pro-plan-and-above. Current Free project cannot be treated as fixed by a simple toggle. Keep Google authentication primary; do not upgrade plan or disable existing email accounts without the corresponding decision/approval.

## Google production path
Google Auth Platform > Audience > Publish app. Brand/name/logo verification is separate from sensitive/restricted-scope verification. Basic profile/email login does not require expanding permissions. Before public launch confirm real support contact, valid public privacy page, accurate brand/domain ownership and real-account access. No publishing or verification submission was performed.

## Sources
- https://support.google.com/cloud/answer/15549945?hl=en
- https://developers.google.com/identity/protocols/oauth2/production-readiness/overview
- https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/password-security
- https://supabase.com/changelog.md

## Data-use decision applied (2026-11-11)
- Approved public service/privacy contact: sangmin5423@gmail.com, linked from `/privacy`.
- Responses and observation notes serve only the individual's storage, restoration, taste summary and exploration. They are not used for service research/improvement, model training or cross-user statistical comparison.
- New gender, age-group and occupation inputs have been removed from the account panel because the individual experience does not use them. Existing stored values and consent records are preserved; this release does not rewrite consent timestamps or delete data.
- Code review found only account-scoped Supabase profile/journal persistence and local personal calculations. No application analytics SDK, external AI request, research export endpoint or aggregate-user endpoint is present. This is a source-code check, not an audit of provider operational logs or historical human access. Necessary hosting and authentication processing still occurs.
- `/privacy` remains a current-functionality guide, not a completed legal privacy policy. Legal operator identity, retention/backup expiry, full account withdrawal, minimum age, provider processing/regions and operational log handling still need decisions and verification before public recruitment.
- The unimplemented account-lifecycle proposal is not part of this release. No database, authentication-provider setting or stored user record is changed.

## Evidence checkpoint, 2026-11-12

See [the current completion matrix](COMPLETION_PLAN.md) for delivered follow-up releases and explicit verification limits. Earlier validation sections describe their original slice, not the current overall completion state.
Account withdrawal now has a delivered disabled page and staged protocol/SQL proposal. Hosted activation, backup expiry and non-resurrection verification remain blocked; no deletion support is claimed active.

## Source-level privacy and recovery checkpoint, 2026-11-12

The dismissed-form password lifecycle and pending-response UI are corrected in [AUTH_SECRET_LIFECYCLE.md](AUTH_SECRET_LIFECYCLE.md). Existing email sign-in now explicitly states that in-app password reset is unavailable and provides the approved support contact without requesting passwords/codes or promising recovery. SMTP, recovery redirects and real delivery remain unverified; no provider change or signup activation follows from this UI correction.

Read-only project metadata confirmed the database project region as `ap-northeast-2` (Seoul); deployment metadata separately reported Vercel compute `icn1`. These are location facts, not guarantees that Auth, CDN, support, logs, backups or every transfer remain domestic. See SERVICE_PROVIDER_INVENTORY.md for the consolidated provider/source scope. Operator legal identity, minimum age, retention, processor/transfer disclosures and legal review remain distinct owner/provider decisions, not values inferred from these region settings.
