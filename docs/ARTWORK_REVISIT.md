# Optional text-first artwork revisit

2026-11-16. No new artwork, audio, API, analytics, score or persistent data schema.

## Evidence and limits
- The Met, Julia Daser, Non-interpretive AI (2026-04-21): https://lab.metmuseum.org/non-interpretive-ai-a511583972d5 . A slow-looking prototype and qualitative feedback, not a retention experiment. Selection and adjectives are interpretive; visual observation cannot substitute cultural context. No sample size or causal effect inferred.
- Getty Education, Look Again: https://www.getty.edu/education/teachers/trippack/activity_post_lookagain.html . School activity revisiting a work and adding observations across days. Not adult product efficacy evidence.

Room Rubato's prompts are independently written, not translated worksheet text. Existing local artwork images, credits, collection links and CC0 labels remain unchanged. No new museum image/text/audio copied. The optional source disclosure is visible beside the activity; no partnership implied.

## Interaction
First-view question -> optional existing observation memo -> second-view question -> optional sourced artwork context. No countdown, completion gate, forced answer change, personality inference or claim of improved taste/retention. Keeping the same observation is valid. Switching work resets only guide position, not saved notebook data. Opening memo or context does not save/complete anything. Completed records remain read-only until explicitly edited via existing controls.

Uses the existing memo and its existing save/error/lock handling rather than a second draft store. Copy suggests retaining the first sentence and appending the revisit, but does not promise immutable version history. Notebook exports already include the memo. No new automatically collected personal data.

## Verification
Focused component tests: reversible steps, heading focus, explicit callbacks only, source/limit disclosure, reset on artwork switch, separate context. Notebook and artwork image regressions included. Integration owner must run aggregate CI/build and verify memo navigation and existing read-only behavior in browser before delivery. Not production deployed.
