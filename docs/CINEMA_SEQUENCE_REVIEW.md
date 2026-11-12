# Cinema sequence case within the context lesson

2026-11-12. The existing context activity gains a concrete film-form comparison, without adding questions, scores, records or a lesson. No personal responses were used for research.

## Source evidence and limits

Opened and read independently, with a separate research review:

- BFI / Sight and Sound, Sam Wigley, 20 May 2025, direct Wong Kar Wai interview: https://www.bfi.org.uk/sight-and-sound/interviews/wong-kar-wai-mood-love-25 . His answer to the repetition question discusses the recurring music and stairs acquiring changed meaning. This is the filmmaker’s account of *In the Mood for Love*, not a cognitive-memory law or an experimentally established universal audience response. The UI labels it as a creator’s explanation, with a separate Room Rubato observation prompt.
- Creator-owned Every Frame a Painting channel: https://vimeo.com/channels/everyframeapainting/ . The page identifies Tony Zhou and film-form analysis as the channel’s purpose. Individual videos were not watched or audited. The link is optional further viewing, not a citation for an unverified video argument. No filmmaker/influencer endorsement is implied; inaccessible influencer originals are not treated as verified.

## Original interaction

Three new schematic SVG scenes (closed door, cup, empty chair) are drawn from basic geometry. The same scene component and artwork are reused unchanged in both sequences. A = door/cup/door/chair; B = door/cup/chair/door. Both have four cuts and exactly the same image counts. Cuts three and four exchange positions. Repetition position, adjacency and ending therefore change together; this is **not** an isolated test of repetition. Manual viewing time is not controlled.

A shared manual previous/next control advances both comparisons; explicit reset returns both to the first cut. There is no autoplay, audio, animation, timer, tracking or media embed. Full text sequences and scene descriptions remain available. Native buttons support keyboard activation, a polite status describes both current scenes, and no focus-jump or custom keyboard trap is added. The grid stacks below the small breakpoint; SVGs scale without a fixed pixel width. Browser/assistive-technology and physical narrow-device checks remain separate from synthetic tests.

The case is placed below the existing context lesson’s primary choices, not in their place. It has transient display state only, no new saved field, and resets on remount. Its interpretation question accepts no change/no story as valid. No film still, music, creator video, screenplay or characteristic creator presentation is copied. These independent diagrams are neither film reconstruction nor proof of emotion, learning or retention efficacy.

## Verification

Synthetic tests verify sequence order/counts, reusable scene markup, all four manual steps, previous/end bounds/repeated reset, text overview and current-step semantics, source/interpretation limits, no media/timers/storage calls, and notebook integration without answer writes. Typecheck, flagged production build and HTTP smoke results accompany the delivery commit. No live user record or authentication operation is part of this work.

Final local verification: 244/244 tests across 41 files, TypeScript, CAS/cloud-flagged production build and all 8 existing HTTP smoke routes passed. Independent source/UI review found no blocker. Browser visual/keyboard QA and post-deployment checks remain separate; this candidate was not published by its implementation worker.

## Live keyboard follow-up

Read-only production QA found that native disabled Next at the fourth cut dropped focus to the document. Endpoint navigation buttons now remain native focusable buttons with `aria-disabled` and explicitly guarded no-op handlers. This preserves the action's focus context while exposing unavailable direction; previous/next cannot exceed the four-cut bounds. WAI's button pattern (https://www.w3.org/WAI/ARIA/apg/patterns/button/, read2026-11-12) supports retaining focus when the context is not dismissed and announcing unavailable actions with aria-disabled. Synthetic tests verify endpoint semantics/no-op bounds; actual keyboard focus remains a separate browser check.
