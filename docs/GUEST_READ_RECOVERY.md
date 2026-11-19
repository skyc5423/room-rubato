# Preserve guest originals when hydration fails

2026-11-16 candidate. Synthetic local fixtures only; no hosted account, production data, migration or deployment changed.

## Reproduced defect

`loadGuest` previously converted JSON parsing and storage-read failures into `DEFAULT_STATE`. Hydration then succeeded and guest autosave replaced the existing `room_rubato_guest_state_v4` bytes with a blank profile. A getter failure could therefore destroy a valid record when the setter still worked. The same fallback was used after logout.

## Changed behavior

- Initial guest hydration and logout-to-guest fail closed on unreadable JSON, a non-object root, or a failed storage read. `isHydrated` stays false, so fallback state cannot autosave over the unread original. A genuinely missing key still initializes a new guest profile, and valid legacy partial objects remain supported.
- Logout can succeed while the separate guest read fails. In that case the UI reports the recovery problem, does not retain the signed-in account's displayed state, and does not write the guest fallback.
- When raw bytes were actually read, the status offers an exact read-only copy under a closed disclosure, with a personal-response warning. If the read itself failed, no fabricated raw recovery is offered. Empty but invalid strings also remain recoverable. Account transitions immediately clear the in-memory guest recovery copy.
- The blocked guest state hides “현재 기록 내려받기”, because exporting its blank fallback would misrepresent recovery. “다시 시도” rereads storage rather than initializing or replacing it. Once reading succeeds, the original data is hydrated normally.
- A separate hydrated-guest write retry now works with the account CAS feature enabled, without invoking an account RPC. Successful guest persistence clears its prior write error. Account CAS/conflict and authentication behavior retain their existing tests.

## Evidence and scope

A synthetic reproduction confirmed both malformed JSON and a throwing getter were overwritten before the fix. The initial dedicated regression run failed before implementation; the final focused run passed 48 tests across guest-read recovery, persona store, account CAS store and sync-status tests. TypeScript checking and diff whitespace checking passed. Cases include five invalid roots, direct mutation while unhydrated, a temporary getter failure and explicit successful retry, genuine missing storage, malformed/read-failed logout, guest write retry under CAS, and immediate recovery-copy clearing on sign-in. UI tests cover exact raw copying, a default-closed disclosure and suppression of misleading fallback downloads.

This is a read-health guard, not a complete schema audit or multi-tab transaction redesign. Existing sanitization of valid object-shaped legacy profiles is unchanged. No automatic repair, destructive reset, import UI or raw-data upload was added. When storage remains unavailable or malformed, the user must preserve the available original and restore readable storage before normal guest work resumes. Browser and aggregate CI verification are tracked separately by the integrating change.
