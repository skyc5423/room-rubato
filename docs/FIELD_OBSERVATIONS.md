# From a saved observation to an everyday comparison

2026-11-16. A renewed product-content task after the previous bounded editorial closeout. PR-only; no deployment.

## User value and scope

A completed observation previously offered replay/edit and onward lesson links. This addition offers a distinct reason to return: apply the same concept to an ordinary object or arrangement, while keeping the saved observation intact. Each of the eight activities has an independently written, optional field card: what to keep, one aspect to vary, concrete evidence to look for, and a limit on interpretation. There is no streak, deadline, new lesson-completion requirement or measured retention claim.

The card appears only in completed read-only review. It starts collapsed and is keyed by owner/lesson. It collects nothing and has no journal/draft/cloud write callback. Optional notes go on the person's own paper, not into an unannounced second app record. Existing explicit record editing remains separate. No personal responses were used to generate prompts; no analytics, schema, credentials or scores were added.

## Primary sources checked for this slice

- National Gallery, [Chiaroscuro](https://www.nationalgallery.org.uk/paintings/glossary/chiaroscuro): tonal contrast can suggest depicted volume. This does not validate our household activity or imply that strong contrast is always preferable.
- National Gallery, [Linear perspective](https://www.nationalgallery.org.uk/paintings/glossary/linear-perspective): a means of depicting depth on a plane, distinct from aerial perspective. An ordinary tabletop observation is not a perspective-accuracy test.
- MoMA, [Minimalism](https://www.moma.org/collection/terms/minimalism): serial forms, repetition, materials and space are topics in the collection resource. Arranging everyday objects does not turn a lifestyle preference into an art-historical classification.
- Never Too Small, [58sqm apartment in Poland](https://www.nevertoosmall.com/post/5-small-space-design-ideas-from-a-colourful-58sqm-624sqft-apartment-in-poland): glass-enclosed office and targeted spatial changes in one home. Not evidence for universal concentration, acoustic or accessibility benefits.
- Exploratorium, [Color Contrast](https://www.exploratorium.edu/snacks/color-contrast): surrounding colors can affect appearance. The page labels its material CC BY-NC-SA 4.0. No worksheet text, specified colored-paper assembly, photographs or comparison-strip procedure are reproduced here.
- Leder et al. (2004), [A model of aesthetic appreciation and aesthetic judgments](https://www.neurohumanitiestudies.eu/archivio/A_model_of_aesthetic_appreciation.pdf): distinguishes aesthetic emotion from judgments. A theoretical model, not validation of Room Rubato's questions.
- Reber et al. (2004), [Processing fluency and aesthetic pleasure](https://pages.ucsd.edu/~pwinkiel/reber-schwarz-winkielman-beauty-PSPR-2004.pdf): an integrative theoretical review. Ease of processing is not identical to artistic value, and a personal observation does not measure fluency or diagnose personality.
- Witek et al. (2014), [Syncopation, body-movement and pleasure](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0094446), with the existing linked 2015 correction, and Senn et al. (2024), [Null effect of perceived drum pattern complexity on groove](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0311877): preserve context-dependent findings, not a universally optimal rhythm. A silent beat-placement option is not a test of experienced groove.
- National Research Council (2000), [Learning and Transfer](https://www.nationalacademies.org/read/9853/chapter/6): remembering content and applying it elsewhere differ. This motivates a product-design choice, not evidence that these cards improve learning or retention.
- Getty, [Elements of Art](https://www.getty.edu/education/teachers/building_lessons/formal_analysis.html): distinguishes line, form, space and color. Background reading only, not a reproduced institutional routine or worksheet.

The UI reuses each lesson's source links as conceptual background and explicitly separates them from our editorial activity. No new image, audio, poem, diagram, quotation or translated institutional worksheet is imported. Public access to an article is not assumed to confer unrestricted reuse rights. Existing asset licensing is unchanged; this is a bounded review, not a legal-clearance certification.

## Verification boundary

Component tests cover all eight cards, optional/collapsed semantics, source separation, no input/write mechanism, completed versus unfinished visibility and owner isolation. Browser regression covers keyboard open/close, lesson/reload reset and byte-identical synthetic journal preservation in the existing multi-engine CI workflow. Aggregate results are reported against the exact remote commit, not inferred from focused tests. Physical-device/screen-reader experience and learning/retention outcomes are not measured here. Existing operational launch gates remain open.

## Browser-engine regression found during acceptance

The original pinned Playwright 1.56.1 passed the new Chromium/Firefox journeys, but WebKit repeatedly crashed or hung after the longer export/reload/multi-tab journey when navigating to perspective. HTTP 200 arrived, but DOMContentLoaded did not. Fresh-context perspective and an isolated completed-space-card/reload/perspective journey both passed; no pending draft keys were present in the failing case. This is not evidence that all WebKit use or the perspective lesson itself fails.

The upstream [Playwright issue #37766](https://github.com/microsoft/playwright/issues/37766) documents a 1.56 WebKit document-navigation/reload regression, including download-related reports. A maintainer identifies the upstream fix and its inclusion in 1.57. The test-only dependency is therefore minimally updated to exact 1.57.0, with its npm-generated lockfile. This is an evidence-backed matching hypothesis rather than a captured native stack-trace proof for our instance. No production dependency, notebook state logic, browser exclusion, retry-on-error or assertion weakening is introduced. Fresh-entry and isolated-return probes and the originally failing multi-tab journey all remain required. Exact post-update CI results must be checked separately; physical Safari remains unverified.
