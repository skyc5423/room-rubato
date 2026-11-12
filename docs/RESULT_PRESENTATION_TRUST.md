# Result presentation trust repair

## Confirmed defects and bounded changes
- Both result entry points claimed three failure-reducing criteria, although many static types have only one or two entries. Both now say “함께 살펴볼 기준”, render the unchanged actual entries, and make no guaranteed outcome claim.
- Static curation lists lacked visible provenance. The shared `CurationScope` identifies them as preselected examples by type, not individually validated suitability or live availability, with a practical next step to compare current product/service conditions. It makes no claim about human/AI authorship. The parent-provided `CurationSources` appears after each reason; only its audited IDs expose optional factual references. References do not validate matching or imply institutional endorsement.
- Both “actual choices” strips fabricated A when telemetry was missing and interpreted malformed non-A values as B. The shared read-only `recordedChoice` uses the latest exact domain/question entry. Only literal A/B renders that choice; missing/invalid latest entries show “저장된 선택 없음” without an answer image/title. Earlier valid answers are not substituted for an invalid latest record. The neutral heading is “저장된 문항별 선택”.

No scoring, answer IDs, persistence, schema, feedback handlers, owner gates, or finance caveats change. This is a bounded accuracy repair, not certification that every static curation or recommendation has been independently validated. Broader copy research is a separate coordinated change.

Synthetic tests render both completed-result entry points, including music with two guide items, source-component ID wiring, empty logs, partial A/B logs, invalid latest values, and a foreign domain collision. Helper tests cover null/undefined/malformed data and latest-entry semantics. Render-only tests assert unchanged state and no answer writes. No real accounts, saved responses or provider actions are used.

Verification: 302 tests / 48 files, TypeScript, CAS/cloud-enabled production build, and all 10 local HTTP smoke routes passed. Both entry-point tests also render the mapped FLAC/hearing curation and verify its two official source links. Independent source review passed. No publication performed.

## Follow-up: unavailable stored type IDs
A second stored-result defect used the first catalogue type whenever `matchedPhenotypeId` was unknown. That fabricated a type label and its guide/curations in the domain result, home dialog/hover/completed tiles, and summary tile. These exact-ID lookups now stay unavailable rather than guessing. The shared unavailable-result panel retains the saved axis summary plus expandable exact scores and actual question choices, with the existing finance caveat. Home retains close/retry; the domain route retains back/retry; the summary tile links to that record. Retry only opens questions and does not clear or recalculate the existing completion. Valid types and scoring/new-prediction initialization are unchanged. No raw unknown identifier is rendered.

Synthetic follow-up coverage includes unknown IDs across both result entry points, home hover/completed tiles, research summary tiles, actual saved scores/B choice, no guessed curations, retry without mutation, and an unchanged valid summary type. This is not a migration or an attempt to repair the stored ID.

Follow-up verification: 306 tests / 49 files, TypeScript, CAS/cloud-enabled production build, and all 10 local HTTP smoke routes passed. No live data or publication actions.
