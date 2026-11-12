# Production UX access audit — 2026-11-11

## Observed in the live browser
- The home room's outer SVG used `role=img`; its twelve interactive descendant targets did not appear in the browser accessibility tree. Alternative domain choices appeared only far below the room.
- The home introduction provided an observation-lab entry, but domain discovery still depended on spatial exploration or scrolling past a large illustration.
- No skip-main link or reduced-motion preference handling existed in the code.

## Implemented
- Nearby explicit domain chooser, with actual question counts and optional completed/unseen filters. No claim that every domain must be finished.
- SVG becomes a labelled group rather than an atomic image; keyboard focus triggers the same visible contextual cue as hover.
- Skip-to-main link, anchor offset for the fixed header, and respect for reduced motion including room parallax.
- Shortened the room guide to observable completion state rather than claiming the service already knows the user's taste.

## Research and scope
- W3C WCAG 2.4.1 (bypass repeated blocks): https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html
- W3C WCAG 2.3.3 (user preference for interaction animation, AAA): https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- NN/g, Recognition and Recall (2024): https://www.nngroup.com/articles/recognition-and-recall/ — visible choice labels reduce memory demands. This is a design heuristic, not evidence of a measured retention lift for this product.

## Release verification remaining
New code is typechecked and unit-tested. Recheck keyboard SVG targets, skip link, chooser opening/closing, narrow-width wrapping and actual reduced-motion behavior after deployment. No claim of full WCAG conformance or retention improvement. Do not add notifications/streak pressure without evidence and opt-in.

## Evidence checkpoint, 2026-11-12

See [the current completion matrix](COMPLETION_PLAN.md) for delivered follow-up releases and explicit verification limits. Earlier validation sections describe their original slice, not the current overall completion state.
