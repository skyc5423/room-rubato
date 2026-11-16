# Fibre versus weave: bounded fashion reading

Implementation of EDITORIAL_BRIEF_FIBRE_WEAVE.md, 2026-11-16. Public route /observe/fibre-weave, discoverable in /explore. This adds one unsaved reading activity, not a ninth notebook completion or a fashion recommendation system.

## What visitors can do

Read two fictional descriptions side by side, reveal the distinction, switch between the comparisons, inspect an independently authored 6×6 plain-weave schematic and its always-visible textual equivalent, then reset. One comparison holds silk fixed and changes the named weave; the other holds plain weave fixed and changes the named fibre. These are controlled **descriptions**, not experimental cloth samples. Unspecified yarn size, density and finishing prevent conclusions about quality, cost, comfort or appearance. The next real-world action is to separate material and structure words in another garment description, without purchasing, touching or completing a streak.

## Primary evidence and limits

Verified 2026-11-16:
- [Canadian Conservation Institute, Caring for textiles and costumes](https://www.canada.ca/en/conservation-institute/services/preventive-conservation/guidelines-collections/textiles-costumes.html), Natural fibres / Woven textiles: fibre categories and crossing structure. Supports silk as fibre and warp/weft terminology. The plain-weave rule alternates crossings along both axes. Museum conservation guidance is not consumer garment-care advice; none is imported.
- [NPS, Weaving Patterns](https://www.nps.gov/articles/000/weaving-patterns.htm), Plain Weave / Satin: distinguishes a weave structure from fibre; naming usage varies. Public prose therefore says “새틴 조직”, not that every retail product called satin has one universal composition.

No institutional photos, diagrams, substantial wording or worksheets are reproduced. CCI figures 7–9 credit Royal Ontario Museum with permission; those are explicitly excluded. The new SVG is a parity-based drawing of plain-weave crossings, not a traced figure or satin simulation. Above/below is communicated by crossing direction and interrupted lower lines, not colour alone. Fictional labels and Korean explanations are independently authored. No creator-specific inspiration, endorsement or validated learning/retention effect is claimed.

## State and navigation

React component state only: initial first example, closed explanations, new example remounts its explanation, reset closes explanations without moving focus, reload starts fresh. No inputs, storage keys, analytics, completion badge, score or account dependency. Existing notebook/profile data are unchanged. Native details summaries, pressed-state buttons, polite text change announcement, SVG accessible name and always-visible crossing order cover nonvisual access. No sound or animation is necessary.

## Acceptance evidence to collect on exact candidate

- Unit tests: two descriptions, exact sources, six-by-six alternating rule, switch/reset/remount semantics, no storage calls, metadata/one H1, persistent text alternative.
- Aggregate tests/typecheck/build; smoke route and catalogue destination counts updated (13 checks / 12 destinations).
- Chromium/Firefox/WebKit browser checks: keyboard entry/reveal/switch/reset and reset focus, 320/390/640/768/1280 overflow, reload/back/forward, all local/session storage unchanged, no page errors. Chromium axe on the expanded state.
- Public-only CI screenshots: initial page at four widths plus expanded page at 320/640/1280, downloaded for actual pixel review. Passing capture is not itself visual acceptance.

Physical-device touch and screenreader speech are not established by these checks. Operational backup/account/ownership gates remain separate. No merge or production deployment.

## Candidate review record

Candidate c4fde6ba0f96474468c42071278e54217ae79ad6 passed full CI run 43870178584: 535 tests / 70 files, typecheck/build, three-engine fibre flows and the existing suites. Downloaded artifact 14227462168 and inspected all seven new page images, including full-size narrow content. Initial layouts are readable with no heading/navigation overlap or clipped controls; the schematic and textual order agree. Expanded full-page captures retained the keyboard-induced scroll position, placing fixed navigation (and the off-viewport skip link) in the middle of the stitched image. The capture now explicitly returns to the top after viewport changes; this is an evidence-generation fix, not a hidden product fix. Final candidate images must be rechecked. Physical-device and screenreader speech limits remain.
