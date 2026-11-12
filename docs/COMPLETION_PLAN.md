# Room Rubato: service-quality completion criteria

Current evidence checkpoint: production 2e28952392f322a0847cd3de7bc95d20d852d271, 2026-11-12. This is a progress record, not overall acceptance.

## Scope and stop rule

Assess all six user-requested categories until the service meets usable, credible release quality: functionality/UI/UX; researched natural Korean copy; substantive professional content; retention; visual design; and other service-readiness factors. Use external research, not intuition alone. Current eight activities and two comparisons are a baseline, not an artificial content cap or permission to stop. Add content only when it closes a demonstrated quality gap. Avoid unrelated expansion and superficial question counts. User responses are for the individual's own experience, not service research, model training or cross-user statistics. The older master blueprint's research-engine proposal is historical and does not authorize implementation.

Map work to measurable gates and keep progressing every ready, authorized gate. A small release is a milestone, not completion of the overall request.

Product completion and public-service operational readiness are separate gates. Neither a passed smoke test nor a single deployed feature means the full request is complete.

## Milestone 1: complete the observation journey

Already delivered: eight source-linked interactive activities; Korean/international institutional references; six CC0 real artworks; two original paired studies; original observation prompts; institutional fact/editorial interpretation separation; reversible contrast verification; explicit safe notebook edit/revisit; owner-scoped return entry; corrected saved-result routing.

Delivered: in-page artwork details with whole-image default, four independently controlled detail targets, keyboard reset, retained sources and honest reproduction limits. Independent browser checks passed at 1168px. Also delivered focused notebook hierarchy, actual artwork previews before the home survey grid, grounded result summaries from recorded axes rather than fabricated generic assertions, and explicit owner-scoped temporary edit recovery. The latest recovery lifecycle browser check remains pending at this checkpoint.

Completion criteria: four images inspected; all four detail targets are visually meaningful; whole/detail return works by keyboard; source/caption stays present; comparison-to-notebook destinations remain correct; no records are written by viewing; unit/type/build/CI and browser checks pass or a specific non-blocking device limitation is disclosed.

## Milestone 2: release acceptance and regression closure

Run final code checks once against the final combined candidate, deploy the exact passing commit, verify canonical alias and public routes, then perform a bounded browser sweep.

Acceptance matrix:
- Guest first visit: comparison and notebook entry, unknown route handling.
- Return visit: unfinished continuation, bookmarked/recent review, completed-all behavior.
- Notebook integrity: edit/save/cancel, storage failure, stale-draft conflict, deletion/restore handling, account switching and owner isolation, no auto-save on open.
- Visual/content: image loading/error fallback; source/interpretation separation; whole/detail labels; contrast temporary-state gating and exact-setting restore.
- Input/accessibility: keyboard focus, clear control names, native controls and stage/back navigation.
- Music: manual start/stop, no autoplay, unmount stop; report any playback/device check not exercised.
- Survey regression: completed result versus new questions, daily persistence and no daily trait-score inference.
- Responsive: source-layout checks plus actual available browser viewport. A real375px test is still not performed; do not represent desktop1168px QA as mobile verification. Obtain supported device/viewport coverage before claiming mobile acceptance.

Current automated evidence: 188 tests in 33 files, typecheck, production build, CI43179365429 success, exact deployed tree and canonical alias verified, and eight public HTTP route checks passed after deployment. One initial post-deploy smoke attempt timed out; a full retry passed. HTTP checks do not establish authenticated database writes or real-device behavior.

Independent browser evidence: comparison full/detail controls, sources and deep links; contrast23→neutral→restore23; notebook safe save/cancel/reopen; focused workspace and home links passed at1168px. Music playback controls were exercised, not audible output. New temporary-edit recovery browser QA is in progress.

Explicit acceptance gaps: actual375px viewport unavailable because managed Chromium blocks DevTools; no bypass attempted. Incognito creation is also disabled, so isolated live result-axis/completed-domain tests were not performed. Automated result tests cover mixed/opposite/zero/missing axes. A previously verified real Google two-tab CAS conflict/recovery is not two-device or two-real-account isolation proof. Those remain unverified.

New actionable safety finding: two legacy survey reset buttons bypass the guarded asynchronous reset path during CAS conflict/unknown outcome. The next candidate routes both through the guarded operation, removes the unsafe API and covers failure/owner races with synthetic regressions (201 total tests). Pending/outcome feedback stays mounted during home interactions. No real records are reset by this testing.

## Milestone 3: operational readiness, coordinated separately

Backup owner is a separate workstream. Required before claiming disaster recovery: confirmed private backup destination and credentials, explicit retention behavior, successful scheduled/manual backup, isolated restore test and documented rollback procedure. No backup-success claim based solely on account creation.

Account withdrawal remains intentionally disabled. Required before activation: hosted synthetic Auth/Storage/session/CAS tests; full copy inventory including snapshots/recovery copies; expiry and non-resurrection ledger; reviewed migration and current authorization; destructive UI confirmation and owner/session binding; safe success/unknown-outcome cache handling. No real-account or backup deletion is authorized by this plan.

## Milestone 4: launch scope and honest disclosures

Verify Google production audience/brand/domain path and support contact. Email signup remains paused unless SMTP/recovery/delivery/abuse handling is verified; launch may remain Google-only if explicitly chosen and accurately disclosed. Resolve legal operator/audience/minimum-age, processors/regions, operational logs and retention disclosures before public recruitment. Do not describe the current privacy functionality guide as a fully reviewed legal policy.

Completion criteria: each item is either verified complete, explicitly excluded from the release with safe disabled behavior and accurate disclosure, or recorded as a launch blocker requiring a concrete owner/provider decision. Full service readiness is not complete while an included gate is unresolved.

## Consolidated readiness review

Deliver one consolidated report: final production URL/commit, features completed, acceptance evidence, actual device limits, operational gates and exactly what remains. If an included quality gate remains unmet, continue the authorized work or identify the specific external blocker. Do not claim completion merely because the current pair of code tasks ended. Once all six categories meet their acceptance criteria and operational launch gates are resolved or explicitly scoped out by the owner, deliver the final service-readiness report. Ongoing maintenance remains separate.


## Six-category evidence matrix

1. Functionality/UI/UX: regression suite, interrupted and repeated flows, saved-result routing, owner isolation, image/audio failure paths; actual browser checks with device limits explicit.
2. Natural Korean text: research Korean product-writing guidance and relevant AI-style evidence; audit prominent copy for abstract/repetitive/inflated language. Preserve essential safety and storage distinctions. No claim that phrasing alone proves AI authorship.
3. Professional content: verified primary institutions, Korean/overseas educators, research scope and conflicting results; original exercises, source-to-claim mapping and per-object image rights. Influencer inspiration is not copying or unverified endorsement.
4. Retention: meaningful continuation, protected revisits, clear next observation and reasons to return. No arbitrary streak pressure or unsupported outcome claims. Test return flows without using personal data for research.
5. Visual design: inspect rendered hierarchy, density, typography, image/prompt relationship, keyboard and responsive behavior; ground recommendations in credible external guidance, and label aesthetic judgment as judgment.
6. Service readiness: data minimization, truthful limitations, auth/recovery, backup/restore, account lifecycle, privacy/retention disclosures, release/rollback checks. Keep sensitive/destructive gates disabled until verified.

Backup and deletion readiness remain unverified. Account setup alone is not evidence of a working bucket, encrypted backup, retention schedule or successful restore.
