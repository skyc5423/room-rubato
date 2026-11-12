# Survey reset entry-point safety review

2026-11-12. Bounded functional correction; no real account/data operations or backup/auth configuration changes.

## Confirmed gap

Home and the personal summary page used `resetAllData()`, which replaced React state directly. Unlike the account menu's guarded operation, this bypass could clear the visible state and local recovery cache while a CAS writer was blocked by a conflict or uncertain outcome. The unsafe store API has been removed.

## Correction

Both page entry points use `SurveyResetControl` and the existing asynchronous `deletePersonaData()` operation. The control requires hydration, confirms survey-only scope, prevents duplicate in-flight actions and shows success only after a successful result. Refusal/uncertain outcomes remain visible without claiming deletion. Results are scoped to the initiating owner and hidden after an account switch. The store retains its revision/base and generation checks, serialized write waiting, and same-request retry for uncertain reset outcomes.

The reset also clears daily-question choices and curation feedback, now explicitly named in the shared control and account-menu disclosure. The confirmation explicitly retains login account, consent and observation-notebook records. Other-device local copies and backups are not represented as erased. This is not account withdrawal. No notebook, backup, security or authentication configuration was changed.

## Verification scope

Synthetic tests cover shared-control confirmation/cancel/hydration, loading/repeated clicks, success, blocked and uncertain results, rejection sanitization and owner switching. Store-level regressions require both memory and recovery cache to remain unchanged when reset is refused during a CAS conflict or unknown write outcome. Existing tests cover successful revision-checked reset, uncertain reset retry, account switching and server deletion failure. Source contracts require both page entry points to use the control and prohibit the removed API.

Production browser reset actions are intentionally not used as a test. Real multi-device/multi-account isolation and backup deletion proof remain separate open work.

Local verification: 201/201 tests, TypeScript, flagged production build and all 8 HTTP smoke routes passed. A synthetic home integration test verifies the control remains mounted with pending/outcome state across room hover and question opening. No production reset was performed.
