# Browser-error triage, 2026-11-18

## Exact evidence, not a claim of repair

Draft candidate `a111fb1995178b466412f11a5b1cd9b9e83a9247` passed Quality checks run `44240113316` on the unchanged-commit retry. Its first attempt, job `134585642959`, failed the final no-page-errors guard, despite the individual notebook and audio assertions passing.

The first attempt recorded five WebKit 26.0 access-control page errors at 05:09:40 UTC, on page-4 at `/privacy`, for same-origin RSC requests to `/`, `/explore`, `/daily`, `/notes`, and `/research`. These coincide with a hard navigation to `/notes`. No cross-origin destination is present in those messages. The current evidence cannot distinguish a browser cancellation-reporting issue from a genuine failed prefetch.

The installed Next 15.5.29 `fetch-server-response` implementation aborts outstanding fetches on `pagehide` and resets its controller on `pageshow`. A cancellation-before-pagehide race is a plausible explanation, not a verified cause. Similar upstream reports concern different versions/platforms and are not proof about this app:
- https://github.com/microsoft/playwright/issues/43120
- https://github.com/microsoft/playwright/issues/42823

No CORS policy, browser security, prefetch behavior or error assertion was relaxed. A later successful retry does not close the issue.

## Additional bounded checks

- Two additional Firefox 144.0.2 production-build notebook navigation subsets passed, including synthetic records, exclusive writer transfer, export, completed-record re-open and unfinished perspective navigation. No hydration error reproduced. This does not include physical audio or real accounts.
- Previous 50 development navigation loops and 10 production navigation subsets also failed to reproduce the earlier Firefox React hydration #418. That distinct issue remains open.
- Notes initializes its journal/selection with deterministic empty values; persisted journal loading and daily spotlight updates occur in effects. A review found no simple render-time clock/random value explaining the notes error. This is a narrow code observation, not proof all hydration races are absent.
- Local WebKit browser downloaded, but launch prerequisites are missing (`libgtk-4`, Graphene, WOFF, Harfbuzz ICU, Hyphen, Manette and GLES). The unprivileged workspace has no sudo or apt package lists. No host security change or package upgrade was made. The existing Ubuntu CI already has a successful supported WebKit run and is the best available reproduction environment.

## Next meaningful diagnostic

The existing notebook browser check now logs route-only failed requests and HTTP error statuses alongside navigation events; all page errors still fail unchanged. On another natural failure, correlate these events and, where available, pagehide timestamps. Preserve the first failing attempt. Do not hide known messages or add arbitrary sleeps to make CI green. A controlled same-origin navigation/cancellation comparison may establish mechanism but must not be presented as proof that a real device is unaffected. Real mobile Safari and actual login remain separate acceptance gates.

## Separate confirmed product defect

The non-login synthetic authentication review found a distinct, reproducible race: a pending old-account `signOut()` could settle after a new account started/finished profile hydration and then overwrite the newer account with guest state. Both cases failed before the fix. The provider now checks the generation again after the await and retains newer session state, while accepting the SDK's normal signed-out event. Five added tests also cover ordinary signed-out hydration and returned/thrown signout errors with write recovery. The full app suite passes 543 tests; typecheck and production build pass. This does not prove real-provider logout semantics or real two-account isolation; those still require actual acceptance testing.

## Follow-up after candidate 61f5696

Run `44244254903` failed the same WebKit no-page-errors gate. All prerequisite suites, Chromium notebook and both Firefox notebook runs passed; WebKit's functional notebook/audio assertions passed before the accumulated five RSC diagnostics failed the job. This was not a logout regression.

Local WebKit 26.0 was subsequently made runnable using official Debian libraries extracted into the temporary browser bundle, without installing OS packages. Its ldconfig-only optional-library validation did not see the private GLES library, so the local diagnostic launch skipped that host inventory check after direct dlopen succeeded. No browser security options or test assertions were disabled. This workaround is local only; CI continues its normal supported dependency installation.

An app-free, same-origin loopback experiment on that exact engine observed:
- Normal fetch: HTTP 200, one server request.
- Fetch during held document replacement: a caught TypeError, no second request reached the server, but Playwright emitted the same native Fetch API access-control pageerror.
- Window error/unhandledrejection observers remained empty for the caught fetch. An intentional genuine throw was detected both by window error and Playwright pageerror.

This verifies the engine diagnostic mechanism, not individual application causation. The maintainer describes the related WebKit cancellation misclassification in https://github.com/microsoft/playwright/issues/43120 (tracked upstream as WebKit 329152). Fifteen fresh-context trials each of privacy→hard notes, API-health fixture→hard notes, and real privacy→notes Link navigation produced no error; the application's natural timing remains intermittent.

The notebook test now seeds completed synthetic records in its current notes document instead of making an assertion-free, short-lived privacy app visit solely to seed storage. The injected download failure is restored in finally. Actual privacy navigation-away and lease-release checks, the isolated WebKit privacy→notes case, reload, hard notes navigation, field-data immutability, audio checks and every pageerror assertion remain. This is fixture isolation, not a browser/app-error fix; no exception filter, prefetch switch, timeout sleep or CORS/security change is introduced.

Local bounded results: original navigation subset 3/3 passed; isolated-fixture subset 3/3 passed, then final try/finally version 1/1 passed. Neither series reproduced the natural CI failure, so these results do not establish that removing the temporary visit cures it. Full audio and multi-engine acceptance remain the unchanged CI job's responsibility.
