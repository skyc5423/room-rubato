# Original-request reconciliation — 2026-11-16

## Basis and bounded completion rule

The original 2026-11-10 request asked for varied direct testing and improvement across six areas: functional bugs/UI/UX including overlapping components; researched natural Korean language rather than generic AI-sounding copy; rich/professional content informed by domestic short-form creators, foreign channels and research papers; development for meaningful return visits; visual design; and other service factors. Research was explicitly required rather than relying only on prior knowledge. A later instruction asked not to stop before actual service quality; later instructions prohibit deployment before completion. This is not a request for a specified number of lessons or equal course coverage of all twelve questionnaire domains.

The current product candidate before this review is `443b7ebdfe6d959bf8100f171ae27c0a064bac94`, draft PR #1, successful CI43861604663, 524 tests. It includes the flavor-language study, optional field observations and public `/explore` doorway. It is not the production release. Prior counts in historical checkpoint documents remain historical.

Completion means closing evidenced defects and documenting remaining prerequisites, not indefinitely adding another page whenever CI passes. More tests do not by themselves prove richer content or a coherent visual design. No user answers are repurposed as research/analytics inputs.

## Requirement-to-evidence matrix

| Requirement | Current evidence | Largest remaining gap / acceptance boundary | Priority and estimate |
| --- | --- | --- | --- |
| Functional/UI/UX testing | Interrupted notebook/edit/recovery/owner isolation simulations; twelve survey journeys; catalogue back-navigation defect reproduced and fixed | Controlled real two-account/two-device verification is not replaced by synthetic tests | P0 before public readiness; 1–2h once suitable test accounts/devices available |
| Natural researched Korean copy | Existing Korean-writing research; source/interpretation boundaries, catalogue/result/summary audits; absence of fake peer percentages | Integrated final wording must remain consistent; no “AI detector” or proof of human authorship claimed | P1 bounded integrated review, 30–45min, fix actual misleading or inconsistent copy only |
| Rich/professional content | Eight interactive activities; six CC0 Met works/two comparisons; Korean architecture scholarship and SAN case; original literature/cinema studies; sourced rhythm/complexity review; flavor examples | Domestic influencer originals remain inaccessible in prior checks; do not claim to have studied their method or copied it. Uneven domain depth must not be described as a complete twelve-domain curriculum | P1 truthful scope/coverage; targeted future content only for demonstrated experience gap |
| Meaningful return | Owner-scoped resume, draft recovery, saved artwork/memo revisit, cross-lesson routes, optional completed-lesson field prompts | No editorial publishing workflow or proven sustainable cadence; no measured retention/learning gain | P1 editorial commissioning/review template with explicit draft/publication boundary, 45–60min; effect research requires separate authorization |
| Visual design | Warm paper/cobalt palette, local fonts, whole/detail artwork, accessible controls; 320px automated checks | Initial gap: latest combined screens lacked integrated pixel review. This review captured actual screens and found a640px header overlap and notebook density issue; see INTEGRATED_DESIGN_REVIEW.md | **P0 current independent task:** capture public guest pages at 390/640/768/1280px, inspect hierarchy/spacing/caption/control visibility, correct reproduced defects; 30–60min plus CI |
| Service operations | Safe disabled risky features, CI, backup/withdrawal simulations, bounded provider checks | Real backup/restore, OAuth evidence, legal/operator/retention decisions and notification delivery unresolved | Separate release gates below; no arbitrary content addition substitutes for them |

## Content coverage, not an invented course quota

- Visual art, space/interior and music have direct substantive observation paths with primary sources.
- Cinema and literature have specific original examples embedded in existing activities, not separate broad courses.
- Gastronomy has a limited language-reading study, not tasting or smell training.
- Fashion currently borrows a generic color-contrast exercise and explicitly does not simulate fabric, fit or actual garment color.
- Travel, technology, economy, work/relationships and philosophy have questionnaires/reference curation or generic notebook links, not comparable subject-specific observation modules. Do not count a source-linked product recommendation as a complete professional activity.

The required gate is that the entry points honestly describe these differences and each advertised activity works with evidence/rights boundaries. Adding five unrelated advisory modules or requiring twelve equal courses would expand scope without a clear user need. A bounded fashion material/surface observation could be a useful next content investment (2–3h after source/example feasibility), but is not silently made a prerequisite to the current review.

## Visual review method

`capture-design-review.cjs` builds sixteen screenshots of home, catalogue, notebook and comparison pages at four widths. Each uses a fresh isolated guest context against CI localhost; no hosted account, production database, user notes or credentials are loaded. Same-origin local fonts are awaited; lazy images are requested with a bounded decode wait and loaded/missing status is recorded before capture. Artifact retention is seven days. Pixel inspection, findings and exact candidate identity must be recorded separately after download. Capturing files is not itself visual acceptance.

Review: header/content separation; primary action hierarchy; readable Korean line lengths and wrapping; card rhythm and spacing; whole artwork/caption clarity; competing content density; text/control clipping; desktop/tablet/phone-width consistency. This still does not establish physical touch behavior, actual iOS Safari, screenreader speech, subjective user satisfaction or audible sound quality.

## Remaining release gates and estimates

Active-work estimates after prerequisites, not a calendar promise:
- Integrated visual/editorial closure: about 1–2h, allowing one fix/CI cycle. No new product feature required unless a concrete gap is observed.
- Editorial operation template and first bounded backlog: 45–60min. Do not promise daily new publication or auto-publish content.
- Representative physical device/assistive technology session: 30–60min per available setup.
- Real account/device journeys: 1–2h after safe test setup; current OAuth evidence 30–60min if authorized access is reachable.
- Backup upload/exact readback/isolated restore: 2–4h after secure scoped writer and independent reader prerequisites. Existing bucket/role preparation is not a restore test.
- Durable withdrawal/restore authority, if included: a separate multi-day project. Keep disabled; no real-data deletion.
- Operator/audience/retention/processor/notification ownership decisions: external, not estimable as coding hours.
- Deployment: not permitted in this task. An explicit release decision after applicable gates is required.

No repeated login requests, no production deployment, no merge and no real-data deletion are performed by this review.
