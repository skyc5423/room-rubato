# Room Rubato: service-quality completion criteria

Latest verified checkpoint: production bb26b14cd434d9ff83380cd59c948bb856daf701, 2026-11-12. Earlier checkpoint counts below are historical. This is a progress record, not overall acceptance.

## Scope and stop rule

Assess all six user-requested categories until the service meets usable, credible release quality: functionality/UI/UX; researched natural Korean copy; substantive professional content; retention; visual design; and other service-readiness factors. Use external research, not intuition alone. Current eight activities and two comparisons are a baseline, not an artificial content cap or permission to stop. Add content only when it closes a demonstrated quality gap. Avoid unrelated expansion and superficial question counts. User responses are for the individual's own experience, not service research, model training or cross-user statistics. The older master blueprint's research-engine proposal is historical and does not authorize implementation.

Map work to measurable gates and keep progressing every ready, authorized gate. A small release is a milestone, not completion of the overall request.

Product completion and public-service operational readiness are separate gates. Neither a passed smoke test nor a single deployed feature means the full request is complete.

## Milestone 1: complete the observation journey

Already delivered: eight source-linked interactive activities; Korean/international institutional references; six CC0 real artworks; two original paired studies; original observation prompts; institutional fact/editorial interpretation separation; reversible contrast verification; explicit safe notebook edit/revisit; owner-scoped return entry; corrected saved-result routing.

Delivered: in-page artwork details with whole-image default, four independently controlled detail targets, keyboard reset, retained sources and honest reproduction limits. Independent browser checks passed at 1168px. Also delivered focused notebook hierarchy, actual artwork previews before the home survey grid, grounded result summaries from recorded axes rather than fabricated generic assertions, and explicit owner-scoped temporary edit recovery. Recovery lifecycle browser checks passed: global navigation and reload offer explicit recovery; cancel preserves the original; save/reopen persists edits. Only a marked synthetic fixture was used and individually removed.

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

Current automated evidence: 201 tests in 34 files, typecheck, production build, CI43180689963 success, exact deployed tree and canonical alias verified, and eight public HTTP route checks passed after deployment. The prior recovery release smoke needed one retry after a timeout; current reset-release smoke passed all routes. HTTP checks do not establish authenticated database writes or real-device behavior.

Independent browser evidence: comparison full/detail controls, sources and deep links; contrast23→neutral→restore23; notebook safe save/cancel/reopen; focused workspace and home links passed at1168px. Music playback controls were exercised, not audible output. Temporary-edit recovery passed at1168px; no beforeunload dialog appeared, so warning remains best effort.

Explicit acceptance gaps: actual375px viewport unavailable because managed Chromium blocks DevTools; no bypass attempted. Incognito creation is also disabled, so isolated live result-axis/completed-domain tests were not performed. Automated result tests cover mixed/opposite/zero/missing axes. A previously verified real Google two-tab CAS conflict/recovery is not two-device or two-real-account isolation proof. Those remain unverified.

New actionable safety finding: two legacy survey reset buttons bypass the guarded asynchronous reset path during CAS conflict/unknown outcome. The deployed correction routes both through the guarded operation, removes the unsafe API and covers failure/owner races with synthetic regressions. Pending/outcome feedback stays mounted during home interactions. Live read-only checks confirm both controls, persistence through keyboard room focus and accurate privacy scope; no live reset was performed.

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

## Further learning and narrow-layout slice, 2026-11-12

The six-category review identified concrete improvements beyond the release checkpoint above: rhythm reference pulses were not independently playable and subdivisions were ambiguously labelled; related lessons lacked explicit observation bridges; the space activity's core professional case lacked Korean architectural scholarship. The candidate fixes those gaps without increasing lesson count or collecting additional answers. See RHYTHM_REFERENCE_REVIEW.md, lesson-transfer-bridges.md and KOREAN_ARCHITECTURE_CASE.md for source scope, independent/original content and verification.

A supported ordinary OS window resize also enabled a narrow browser check: page screenshot485px wide, exact CSS viewport not independently measured. Home/notebook/comparison reflowed without obvious clipping, but excess top spacing remained below the in-flow header. Core pages now use24px top padding at that breakpoint, retaining desktop fixed-header clearance. This does not establish375px acceptance. No exposed capture/listen capability was found for actual audio verification; pulse scheduling and start/stop UI are separate evidence.

Combined candidate:231 tests across39 files and typecheck passed. Production build, exact-commit CI/deployment and post-deploy checks are reported at release; pending checks must not be inferred from this source record. No notebook records, questionnaire answers, scores, schema or backup/login configuration are changed.

## Consolidated evidence checkpoint, 2026-11-12 (56ffd45)

Production `56ffd45eeb0d155d1976655e943a517f1a173f1e` is verified READY at the canonical origin; exact-commit CI 43194880314 succeeded. The combined application passed 267 tests in 43 files, typecheck, flagged production build and ten-route local smoke. Earlier counts above are historical slice evidence, not the current total.

This slice closes demonstrated quality gaps rather than adding question counts:
- Content: an original, manually stepped cinema sequence applies a verified BFI filmmaker interview and a creator-owned foreign essay-channel reference. It explicitly distinguishes creative intention from scientific causality and discloses order/ending confounds. The named Korean influencer's original posts remain inaccessible; third-party indexing is not treated as verified account style or permission to copy.
- Design/privacy: three licensed font families are served locally, repairing the old Wanted Sans URL and removing automatic font requests to three outside hosts. Production CSS has 119 same-origin font references; sample assets from all three families match the committed hashes. Live Korean glyph, narrow wrapping and 200% zoom checks passed in sampled views, not exhaustive font certification.
- Functionality: dismissed auth forms clear component-held passwords and stale request feedback cannot repopulate a later form. Synthetic tests cover lifecycle cases; live QA used only a fake password without submitting authentication.
- Accessibility: cinema endpoint controls retain keyboard focus and safely ignore repeated activation. Independent live checks passed both endpoints and reset. The notebook remained 0/8 and no answer/authentication writes occurred.
- Retention: existing safe return/unfinished-edit recovery and explicit lesson bridges remain the progression mechanism. No effectiveness or retention lift is claimed without a separate authorized study; personal responses are not research inputs.
- Readiness: public provider explanations, existing email-recovery limitations and ten-route smoke coverage are delivered. Provider metadata/default-retention evidence is tracked separately in SERVICE_PROVIDER_INVENTORY.md, not conflated with verified deletion.

Responsive evidence now includes ordinary-window 485px-wide screenshots and explicitly selected 200% browser zoom. Exact CSS viewport width and physical 375px phone behavior remain unverified. Audible output, two-device/two-real-account isolation, hosted backup/expiry/restore and account withdrawal remain open. The backup login was aborted; no new request or activation is made. Legal operator/audience and transfer/retention policy remain unresolved. These are concrete acceptance limits, not grounds to call the full service complete or to add unrelated features indefinitely.


## Trust and return-path checkpoint (bb26b14)

Production commit `bb26b14cd434d9ff83380cd59c948bb856daf701` is READY at the canonical origin; exact-commit CI43205628236 succeeded. The same source tree passed339 tests in51 files, typecheck, CAS/cloud-enabled production build, and ten local and ten public HTTP routes. This is not whole-service acceptance.

- Notebook lesson navigation now agrees with its URL, reload, Back/Forward and list destination; fixed-header focus clearance was independently checked broad and narrow. A sourced Museum SAN bridge connects light and space without adding a duplicate activity.
- All12 domain introductions describe their actual text/scene-choice task.22 catalogue-copy corrections remove unsupported sensory, suitability and certainty promises; mechanical fingerprints preserve scoring inputs. Both result surfaces label reference curation as preselected examples. Six selected curation entries have seven scoped primary-source links, not an assertion that every catalogue item was independently certified.
- Missing/invalid saved choices no longer fabricate option A/B. Unknown saved type IDs no longer become the first catalogue type or an unplayed prediction. Available saved evidence remains inspectable without rewriting records. These result edge cases have synthetic component coverage; isolated live fixtures were not created because managed incognito is unavailable and existing guest records must be preserved.
- Malformed numeric scores no longer crash the summary; unavailable saved durations no longer become zero, NaN, negative time or the new-answer default1.5 seconds. Actual finite numbers and zero remain intact. This is display validation, not data migration. Missing vector keys already defaulted to zero upstream cannot be distinguished from genuine zero.
- Live read-only intro and navigation checks passed broad and485px screenshots, with no questionnaire writes. The new summary empty state renders normally. Saved daily timing was unavailable in the visible guest state and was not forced by answering; valid/invalid timing regression evidence is synthetic.

Next demonstrated issue: the result modal's custom Tab loop excludes native disclosure controls and can lose containment when a focused questionnaire button disappears. This accessibility correction is pending, not accepted in this checkpoint.

No new launch authorization is inferred. Hosted backup/expiry/restore and withdrawal remain blocked after canceled Backblaze login. Current Google publishing/branding/redirect settings remain unverified because Console is inaccessible. Email signup remains off. Legal operator/audience/retention/transfer decisions, true two-device/two-account isolation, physical375px behavior and audible playback remain open. No personal responses were used for research.
