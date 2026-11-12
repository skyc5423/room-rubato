# Operations and release checklist

## What is implemented (not a monitoring subscription)

- `GET /api/health` is an uncached, public **liveness** response. It does not touch the database, check OAuth, prove writes work, or expose configuration/user data. HTTP 200 must not be described as full service health.
- `node scripts/smoke.mjs https://room-rubato.vercel.app` performs ten public, unauthenticated GETs. Redirects fail rather than masquerading as healthy sign-in pages. It prints only route/status; never response bodies, tokens, cookies or note text.
- `.github/workflows/ci.yml` runs tests, types, build, and a local-production smoke test with read-only repository permissions. It uses no production secrets and does not deploy. Publishing the workflow enables runs on subsequent pushes/PRs; it has **no scheduled uptime monitoring or alert subscription**.
- The config adds MIME sniff protection, origin-only cross-origin referrers, anti-framing and unused sensor permissions restrictions. It does not add COOP that could break OAuth popups or a speculative CSP that could block Next/Supabase. CSP needs a separately tested nonce/report rollout; no reporting endpoint is configured.

## Release gate

1. Review exact diff, dependency/lockfile changes and migration coupling. `npm ci`, `npm test`, `npm run typecheck`, `npm run build`. Test the production CAS flags enabled, not only their default off mode.
2. Confirm remote SHA equals tested SHA. CI must pass for this SHA (local tests are not GitHub CI evidence).
3. If changing database: obtain required approval, verified private backup, migration/rollback tests, ownership/RLS checks. Never print row contents or JWTs to logs.
4. Deploy exact SHA and verify READY, alias and build-time flags.
5. Run read-only smoke. Then browser-check Google login, route navigation, notes/artworks, audio start/stop, and restricted-width layout.
6. Authenticated writes require controlled fixtures: verify empty baseline, create only a marked test record, test persistence/conflict, remove only that record, and recheck original data. Do not reset a real account to make testing convenient.
7. Record SHA, check time, checks passed/failed/not-run and residual limits. Do not equate the first successful response with complete recovery.

## Incident response

- Freeze new writes/deployments when corruption is suspected; preserve evidence without copying private notes into third-party logs.
- Distinguish frontend build, authentication, network, database authorization, and revision conflict errors. Revision conflict is a protective refusal, not license to force overwrite.
- **After CAS cutover, never promote a pre-CAS frontend as a routine rollback.** It cannot write through the revoked direct grants. Prefer last known-good CAS-compatible artifact; maintain the protected database grants. Do not restore direct writes merely to silence an error.
- A code rollback and a data restore are separate decisions. Restore only after checking backup scope, timestamps and new writes. A stale full restore can destroy valid new responses.
- On lost acknowledgments, preserve/retry the original write ID; never synthesize an unrelated replacement overwrite.
- Re-run smoke and the affected authenticated flow before declaring recovery.

## Current monitoring limits and next decisions

No external uptime service, notification recipient, paid plan, schedule, or backup service was enabled by this change. CI can detect repository regressions, not outages between commits. Before claiming continuous monitoring, choose an approved check schedule and destination, test alert delivery, and document ownership. Before claiming disaster recovery, restore a backup into an isolated compatible environment and verify it.

## Primary references

- Next.js response headers: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
- GitHub least-privilege workflow guidance: https://docs.github.com/en/actions/reference/security/secure-use

Actions refs were resolved from their official Git repositories before pinning (checkout v4 and setup-node v4). Future action updates require review, not an unpinned tag switch.

## Dependency advisory checkpoint (2026-11-12)

`npm audit --omit=dev --json` against the committed lockfile reported zero known production dependency advisories (31 production dependencies). A follow-up `npm audit --json` including development dependencies also reported zero known advisories. No dependency or lockfile was changed. This is the registry's advisory snapshot, not a penetration test, proof of zero vulnerabilities, or provider configuration audit. Recheck as dependencies and advisories change.
