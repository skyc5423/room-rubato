# Local journal diagram-setting guard (2026-11-16)

Confirmed a crash in the current deploy-branch parser: it spread unvalidated
`beforeSetting`/`afterSetting` values from local storage into records. A synthetic
saved entry containing an object caused React to throw while opening the record
list ("Objects are not valid as a React child"). This is a defensive failure case,
not evidence that any real user's stored notes are damaged.

The parser now accepts finite numeric diagram settings only in the control's
0–100 range. It does not coerce strings or clamp invalid values into a fabricated
saved setting. Zero, decimals and 100 are retained. Memo, choices and bookmark are
preserved; viewing does not rewrite stored bytes. When no valid setting is present,
the existing view-only default is used rather than claiming it was saved.

Regression coverage includes object/array/null/string/boolean/out-of-range values,
valid boundaries, and an actual notebook component opening a malformed synthetic
record without changing its original local-storage string. Cloud validation already
checks this range; no database schema, remote data or authentication was changed.

This patch does not claim full journal-schema validation or hosted browser acceptance.
It is a local implementation candidate until reviewed, committed and deployed.
