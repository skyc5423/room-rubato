# Malformed legacy value display guard

## Reproduced on the unmodified application
The persona-state sanitizer merges persisted vector properties over numeric defaults without scalar validation. Synthetic rendering with an existing completed domain and `layer1Vector.openness = null`, `'0.5'`, or `false` threw at ResearchPage's direct `.toFixed(2)`. Nonfinite numeric values rendered NaN/Infinity. Timing division coerced null to zero and numeric strings to durations; invalid strings/missing fields produced NaN, while negative values rendered negative seconds. Home had equivalent truthy-time coercion. The daily page substituted the new form's default 1500ms for a saved completion with missing/null timing, fabricating 1.5 seconds. No real records were accessed.

## Bounded display-only correction
`formatStoredScore` uses the existing finite numeric [-1,1] validator. These bounds are already enforced for the three derived vectors in `persona-scoring.ts` lines 44–46; this does not introduce a new scoring range. Invalid values show “저장된 점수 확인 불가”. Real zero, negative and positive scores retain their normal signed formatting. Research still shows “응답 없음” when no domain is completed.

`storedSeconds` accepts only finite nonnegative numeric milliseconds, preserving real zero and imposing no arbitrary maximum. Home, research and daily render unavailable-time wording otherwise. A saved daily record is no longer allowed to borrow the draft form's default duration. Home's existing common-trait prose now also checks the same recorded score bounds before making directional statements, rather than coercing strings or Infinity. No score calculation, prediction algorithm, sanitizer, schema, provider or write handler changes.

## Limits
Missing vector properties already become numeric zero in the sanitizer. Display code cannot distinguish those defaults from genuine stored zero, so this patch does not claim to recover that lost provenance. Other malformed structural data is not broadly migrated or certified safe by this work. Validation uses synthetic render fixtures modeling the sanitizer's reachable output, not live account data.

Regression tests cover both invalid and valid scores/durations, resumed daily timing, preserved zero, no mutation of supplied values, and no answer writes. Existing owner/storage tests remain unchanged.

Verification: 339 tests / 51 files, TypeScript, CAS/cloud-enabled production build, and all 10 local HTTP smoke routes passed. The production build used the same application code as the final tests. No live data or publication actions.
