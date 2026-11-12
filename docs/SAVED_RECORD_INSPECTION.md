# Neutral, optional saved-record inspection

2026-11-12. Source-only audit; no personal records inspected.

## Concrete defect and provenance

`src/app/research/page.tsx` automatically rendered the complete current PersonaState JSON under “Ground-Truth JSON Snapshot” and labelled didShift “동조 변화”. This contradicted the page's own unvalidated-score disclaimer and needlessly exposed raw answers/timestamps during casual scrolling or screen sharing.

`src/lib/persona-store.tsx`, recordDailyPulseShift, computes exactly `phase1Choice !== phase2ChoiceAfterSocialProof`. It appends the resulting boolean to dailyShiftLog. The daily page independently uses the same inequality to describe answer changes. The boolean establishes neither motive nor conformity. The existing historical field name is retained for compatibility; no score/schema/storage/export change is made.

## Small correction

A new SavedRecordInspector component uses “저장된 기록 확인”. Raw JSON is absent from initial markup and only mounted after the explicit “JSON 기록 펼치기” button is activated. The native button retains its position when collapsing; aria-expanded/aria-controls identify the disclosure. A bounded, keyboard-focusable pre permits scrolling the raw record. Collapse unmounts it. This reduces incidental visual disclosure; it does not remove existing records from client memory or provide access control.

Text defines responseTimeMs as milliseconds to a choice and didShift as an initial/final answer difference after reading a situation. It explicitly rejects inferring reason or conformity. The snapshot remains JSON.stringify of exactly the current state with no redaction/transformation or download. Opening/closing adds no persisted state, request or tracking.

## Separate educational-link adjustment

The two syncopation paper links now use canonical DOIs resolving to their original PLOS publisher pages:
- https://doi.org/10.1371/journal.pone.0094446
- https://doi.org/10.1371/journal.pone.0311877

The PMC URLs returned a browser-check page to the public research fetch on2026-11-12; that is not proof of failure for every user's browser. The publisher pages were accessible. This is an alternate original-source reading path, not a change in findings.

The2015 Witek correction (https://doi.org/10.1371/journal.pone.0139409) was opened/read: it corrects stimulus indexing/notational supplemental materials, with the authors stating no effect on outcomes, interpretations or significance. Room Rubato's synthetic clicks do not reproduce those stimuli. Existing contrast between Witek2014 and Senn2024 findings and non-universal caveats is unchanged.

## Verification scope

Synthetic fixtures only. Regression tests cover absent-on-initial-render JSON, explicit reveal, exact unchanged serialization, collapse/unmount, disclosure semantics, keyboard-scroll target, source provenance, no persistence calls, and the two DOI URLs. Browser focus/screen-reader behavior is not proven by renderer tests. Full tests/typecheck/build results accompany the candidate commit; no publish performed here.

Candidate validation:271 tests across44 files passed, typecheck and production build passed, git diff --check passed. No browser rendering/focus check claimed.

Owner/visit isolation follow-up: the caller keys the inspector by the existing authenticated user UUID, or a guest sentinel. Owner changes remount it collapsed; ordinary record changes for the same owner do not reset an explicit inspection. Returning after unmount also starts collapsed. The key is not added to stored data or rendered attributes. A synthetic regression covers same-owner updates, account A→B, account→guest, and fresh visit. Focused5 tests and typecheck passed; combined build is delegated to integration.
