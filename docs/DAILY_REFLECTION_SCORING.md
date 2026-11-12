# Daily reflection and score separation

Daily fictional-situation answers are personal reflection records, not evidence of a personality trait. Keeping or changing an answer no longer changes any persona vector. Survey score derivation ignores daily history, including when a questionnaire is repeated. Raw daily choices, timing, timestamps, and shift flags remain intact.

## Existing profiles

This patch does not change profile hydration or existing sanitization. Historical aggregates are preserved; old daily influence may remain until a normal questionnaire submission recomputes the vectors using the existing survey-only derivation flow. No load-time migration, provenance flag, guessed reversal, blanket reset, or database operation is introduced. No production rows were inspected or directly rewritten for this change.

This patch does not change the survey-scoring model or claim it is a validated psychological measurement.

## Completion copy

Completion retains elapsed time as a descriptive fact, explicitly says daily answers do not affect trait scores, and pairs the question-specific editorial takeaway with a link to the related domain. It does not describe personal records as research data.

## Verification

Regression tests cover kept and changed answers, subsequent questionnaire recomputation, raw daily-history preservation, unchanged legacy aggregates through guest/account hydration, missing/malformed/unknown survey metadata under existing sanitization, and completion copy. Run `npm test`, `npm run typecheck`, and `npm run build` before release.
