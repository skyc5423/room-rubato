# Dismissed authentication form: secret lifetime and support

2026-11-12. Source baseline `abdbc70` (published tree `634da19`). This is a local interface privacy correction. No real credentials, accounts, response records or provider settings were accessed or changed.

## Demonstrated gap

The persistent Navbar owned `passwordInput` across routes. It cleared that state only after successful email authentication. Closing with Escape, outside click, the close button, profile toggle or privacy link, route navigation, and switching away from email merely hid the input; reopening restored its old value. A late earlier authentication result could also clear newly typed input or show stale feedback in a different form.

## Bounded fix

- Centralized dismissal clears the React-held password and old feedback. Route exits, all actual dismissal paths, leaving email for Google and verified owner changes invalidate the previous form view.
- An actively open failed email attempt retains its value for immediate retry. Leaving that view clears it. Email and password autofill/autocomplete remain supported; browser/password-manager storage is not controlled or claimed erased by this change.
- View-generation checks prevent an earlier authentication response from erasing a new form's password or repopulating old feedback. Unmounted components no longer own the response UI.
- An in-flight request guard remains active after closing/reopening until the request settles. Closing does **not** cancel credentials already submitted to Auth, and successful authentication may still complete. The pending UI says this explicitly. No automatic resend is added.
- No password is added to browser storage, logs, URLs, diagnostics or exports. Clearing React state is not a promise of secure memory erasure or erasure of request/provider copies.
- Existing-email support now states that the app does not offer password reset. It links the approved support email, warns against sending passwords/codes, and does not promise recovery, password change or deletion merely from contacting support. New email signup remains gated; no reset-email endpoint, SMTP change or new account is introduced.

## Verification and remaining gates

Synthetic component tests cover close/toggle/Escape/outside/privacy/route exits, email-to-Google, owner changes, still-open failed retry, pending success/failure/rejection, repeated submissions, method switching and unmount. Tests use invented strings and mocked Auth functions, never live authentication or credential transmission. No local/session storage write is made by the changed component.

The existing application's Auth session persistence is unchanged. Provider account-recovery availability, verified mail delivery, live-device/browser autofill behavior and all-site security review are separate gates. This fix does not activate public signup or account withdrawal.

Final local evidence: 257 tests across 41 files, typecheck and production build with both CAS/cloud flags enabled passed. The existing eight-route smoke script passed, plus separate read-only GET checks for privacy and withdrawal pages. Independent source/lifecycle/support-copy review and `git diff --check` passed. This does not claim a live login, mail delivery, password reset or browser-autofill acceptance test.
