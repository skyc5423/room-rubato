# Failed authentication return handling

2026-11-12. Source audit of `03b614d`; no live login, credentials, user records, provider setting or backup operation.

## Reproduced source gap

The pinned Supabase Auth client detects return URL errors during initialization and returns an error without clearing the URL. The application did not observe these failures; a canceled OAuth return or expired link could leave raw error parameters in the address bar without explaining the interrupted request. The installed SDK's `initialize()` caches the same initialization promise; this change awaits that promise, never retries an OAuth request or consumes a successful callback itself.

Supabase changelog and redirect documentation were reviewed on 2026-11-12:
- https://supabase.com/changelog.md (no relevant JS API change required for this bounded change)
- https://supabase.com/docs/guides/auth/redirect-urls
- Installed `@supabase/auth-js` source: `GoTrueClient.initialize`, `_initialize`, `_getSessionFromURL`; `lib/helpers.parseParametersFromURL`.

## Bounded behavior

The new notice handles only allowlisted OAuth error tokens or known authentication error codes. Generic application `error`/`error_description` fields alone are not treated as auth. Recognition mirrors SDK precedence: query overrides fragment and the last duplicate wins. Unknown provider codes and general SDK/network initialization failures are outside this patch, not silently claimed fixed.

After initialization, the notice rechecks that navigation has not changed, then replaces only the current same-origin history entry while preserving Next's history state and unrelated route/query data. Known error/token fields are removed. Generic `code` and `type` fields are preserved unless explicit token fields or a recognized auth-flow type establish their callback context. Ordinary success/code/token URLs with no recognized error remain entirely under SDK control. No raw provider text, token or URL is rendered or logged by this component.

The notice gives a generic explanation and asks the person to verify their current account state; it does not claim a valid existing session was logged out or that recovery succeeded. It offers manual dismissal and a same-origin home link, without automatic navigation or focus capture. Failed history cleanup gets a warning not to share the current address. This does not erase earlier server logs, browser sync/history copies or requests already sent.

Temporary pending consent is removed only if it still equals the captured failed attempt; a newer attempt is preserved. Storage failure leaves the expiring staging untouched and does not delete durable consent. The separate freshness check now rejects future timestamps, non-string/invalid timestamps, wrong versions and elapsed ages of 15 minutes or more. This is temporary consent staging, not account authorization; no durable consent migration/version change is introduced.

## Other audit findings and limits

- Current email/OAuth redirect destinations use `window.location.origin`, not a user-controlled `next` destination. No application open-redirect bypass was found. Hosted allowlists and public-domain/brand configuration were not changed or certified.
- Existing owner-state isolation, draft recovery, dismissal-secret cleanup, provider/privacy inventory and disabled account-withdrawal gates were not reimplemented.
- Failed OAuth-start staging cleanup on exceptional launch failure is not expanded in this patch; a fresh attempt overwrites it and the timestamp expires. Callback handling does not establish SMTP, recovery delivery, browser autofill or two-real-account isolation.

## Synthetic acceptance

Tests cover canceled/expired return errors, safe generic output, generic-query and successful-return non-interference, query/fragment precedence, duplicate values, mixed token cleanup, preserving unrelated fields and Next history state, same-origin double-slash paths, navigation/unmount races, history failure, matching/new temporary staging, and timestamp bounds including store-level future-consent rejection. Cleanup/remount against a shared unresolved initialization promise is explicitly synthetic replay, not a browser StrictMode or live OAuth test. Existing tests remain required; browser callback UI review is a separate stage.

Final local verification: 280 tests across 45 files passed, TypeScript passed, CAS/cloud-flagged production build passed, and all 10 current HTTP smoke routes passed. No production callback/login operation was exercised. Independent parser/lifecycle review required narrowing generic-query handling and matching SDK precedence; those findings are covered by the final regressions.
