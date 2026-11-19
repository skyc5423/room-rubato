# Flavor language: a specific doorway for gastronomy

2026-11-16. PR-only, no deployment. Existing journal lesson IDs, completion counts, storage formats and scores are unchanged.

## Demonstrated product gap

The result-to-observation bridge had domain-specific routes for visual art, interiors, music, literature, cinema and fashion, but gastronomy used the generic notebook fallback. The new `/observe/flavor` route gives that result a relevant, concrete next step and can also be discovered directly in the notebook. It is an optional reading activity, not a ninth stored notebook lesson or a personalized recommendation.

Three original fictional examples separate a broad impression from sensory description and personal evaluation. Selecting an example resets its explanation disclosure; reloading resets the exploration. Users can compare another example on a later visit, with no streak or claim of daily new content. The activity requests no food purchase, consumption, sniffing, nose-blocking or deliberate exposure to irritating substances. It has no response field, recording, analytics, storage write or scoring connection. No personal responses were read to construct these examples.

## Source-to-claim and rights review

Primary page read: [NIDCD, Taste Disorders](https://www.nidcd.nih.gov/health/taste-disorders), specifically **How does your sense of taste work?** The relevant explanation distinguishes at least five basic tastes from aromas and describes flavor as involving these together with texture, temperature and chemical sensations. The source does not validate our Korean examples, linguistic categories, preferences, educational effects or sensory abilities. No disease statistics, diagnostic procedures, treatment or dietary advice are imported. A linked medical-information page is identified honestly and does not make this app a health assessment.

A second NIDCD page, [What the Numbers Mean](https://www.nidcd.nih.gov/health/statistics/what-numbers-mean-epidemiological-perspective-taste-smell), was read as corroborating context for the multiple-sense distinction; its older parenthetical examples are not treated as an exhaustive taste list.

[NIDCD website policy](https://www.nidcd.nih.gov/policies), read 2026-11-16, describes its information as public domain unless otherwise identified, notes exceptions for other organizations' material, treats logos separately, and prohibits implying endorsement in linking. Our implementation uses a short original Korean summary and source link, not the institution's logos, images, diagnostic questions or a reproduced worksheet. No third-party flavor wheel or standardized lexicon is copied. The fictional examples and Korean wording are Room Rubato editorial work, not formal scientific classifications of Korean adjectives or guaranteed properties of real foods.

## Interface and validation scope

Text-first comparison, native disclosure, visible focus, selected-button state and responsive layout support reading without sensory participation. The gastronomy result uses the existing score-independent bridge component on both result entry points. The notebook retains its existing routes and record safeguards.

Component tests cover example switching/reset, source disclosure, no input collection, navigation and the exact domain route. Public smoke includes the new page. A dedicated browser script runs Chromium, Firefox and WebKit to check notebook discovery, keyboard interaction, explanation reset, 320 CSS-pixel overflow and unchanged synthetic journal/profile bytes; Chromium additionally runs axe. Aggregate pass/fail is verified against the exact remote SHA before reporting. These checks do not establish physical-device experience, screen-reader speech, medical validity, learning efficacy or retention lift. Existing real-account/backup/operational launch gates remain separate.
