# Core-flow contrast and field-label review

Reviewed 2026-11-12 against `69c4c26` (the tree published as `33eea39`). This is a bounded source-color review and correction, not a WCAG conformance audit or a claim of assistive-technology/device testing. No personal responses or account credentials were accessed.

## Method and sources

Official sources opened and read:

- [WCAG 2.2 Understanding 1.4.3: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): normal text, including placeholders, is checked at 4.5:1; large text has a separate threshold. Do not round a failing ratio upward. Use underlying foreground/background colors rather than anti-aliased edge pixels.
- [Understanding 1.4.11: Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html): identifying field edges and meaningful graphical information are checked at 3:1. A text-labelled button need not have a contrasting enclosing border; inactive controls and essential visual presentations have exceptions.
- [Understanding 3.3.2: Labels or Instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html): field purpose should remain available, not disappear when an example is replaced by typed content. The auth fields now have visible labels associated by `htmlFor`/`id`.
- [W3C Compositing and Blending: simple alpha compositing](https://www.w3.org/TR/compositing-1/#simplealphacompositing): source-over composition is calculated before sRGB linearization. This compositing specification is a Candidate Recommendation Draft, not a product endorsement.

`tests/helpers/contrast.ts` uses unrounded channels and the 0.04045 sRGB transfer breakpoint, then relative luminance weights 0.2126/0.7152/0.0722 and `(lighter + .05)/(darker + .05)`. For an opaque backdrop, each composed channel is `alpha * foreground + (1 - alpha) * backdrop`. Ratios below are rounded only for display, never for test acceptance.

The current compiled Tailwind preflight was checked: an unstyled placeholder is `#9ca3af`, opacity 1. The article surface is white at 85% over `#FEF1D0`, the auth input is cream at 50% over `#FFFDF7`, and the footer is `#F6E2B3` at 40% over cream. Borders compose over their element's background (default border-box clipping), then contrast with the adjacent outside surface.

## Confirmed failures and finite correction

| Essential content or state | Previous pair and ratio | Corrected pair and ratio |
| --- | --- | --- |
| Observation memo example | `#9ca3af` / white: 2.539 | navy `#010D6E` at 70% / white: 6.777 |
| Memo identifying edge | blue `#0042AF` at 25% over white / article surface: 1.538; the white fill alone is only 1.018 | blue at 65% / article: 3.687 |
| Email/password examples | blue at 45% / composed auth input: 2.338 | navy at 70% / composed auth input: 6.617 |
| Email/password identifying edges | blue at 30% over input / outside paper: 1.804; input fill alone is only 1.051 | blue at 65% / outside paper: 3.854 |
| Account close and unselected home “내 취향 아님” text | blue at 70% / `#FFFDF7`: 4.211 | blue at 80%: 5.383 |
| Global privacy footer link | blue at 75% / composed warm footer: 4.415 | blue at 80%: 4.932 |
| Small orange labels, percentages, ordered-guide numbers, daily hypothetical-situation disclaimer and account error/reset text | `#D4653B` on audited cream/paper surfaces: 3.268–3.669 | dedicated `terracotta-ink` token `#A84824`: 5.171–5.805 on solid cream, paper-sheet, offwhite and white |
| Orange text on translucent panels | same original orange, below 4.5 | dark token: 5.276 on cream70/sheet (daily); 5.312 on cream60/sheet (guide); 5.375 on cream55/offwhite60/sheet (summary); 5.092 on orange10/offwhite reset hover |
| Text-bearing orange badges and selected “내 취향 아님” state, both home and domain result routes | offwhite / original orange: 3.607; white / original orange: 3.669 | offwhite / dark token: 5.707; white / dark token: 5.805 |
| Rhythm's 16-slot subdivision guides | `#c9d1cc` / `#f6f2e8`: 1.394 | `#77867f` / same surface: 3.415 |

The domain route's matching unselected feedback button is also aligned to blue80. Its old blue75 passed nominally on offwhite, but did not retain 4.5 under the same pessimistic texture bound used for the home button. This is a matched-state safety margin, not a claim of observed pixel failure.

The brighter terracotta remains the decorative palette color. Only text or solid fills explicitly carrying text were migrated in the audited home, domain, daily and account components. Progress bars, decorative dots, separators and artwork were not recolored. Existing focus colors, event handlers, data access, scoring and saved schemas are unchanged.

The two auth labels persist after typing; there is no sign-in submission in the new regression. The email/password IDs are unique within the single account panel. Existing password autocomplete and input handlers are retained.

## Passing styles and exclusions

- Navy at 60%, 65% and 70% on the checked light surfaces was not a blanket failure. For example, navy60 is 4.688 on cream and 4.609 on `#F2EFE7`; source-kind labels actually use navy60, not blue60. Passing source captions and step labels were preserved.
- Disabled `opacity-40/50` controls were left unchanged. Low-contrast card separators and button outlines were not automatically called failures when sufficiently contrasting text identifies the button.
- The rhythm grid is information, not decoration: the lesson asks users to distinguish four beats from 16 slots. Both its line hierarchy (2px main / 1px intermediate) and all positions, beat labels, dots and audio onsets remain unchanged. Main strokes are 4.023, pattern dots 4.171 and labels 11.013 on the diagram surface.
- Light, simultaneous-color-contrast and other instructional stimuli were not restyled. Their particular presentation is the lesson's subject; the same reasoning must not be applied indiscriminately to those diagrams or to artwork pixels.
- The body has a 4% multiply paper texture. New token/edge tests additionally use a pessimistic bound: darken the bright backdrop by a full 4% while leaving its dark foreground unchanged. The chosen new field edges, active blue labels/footer, orange text and rhythm subdivision lines still meet their applicable threshold under that bound. For inverse badges, the light text is darkened instead of the dark background. This is a safety margin, not a sample of actual browser noise pixels, and does not certify untouched styles.

## Verification scope

- Exact sRGB tests are tied to the actual field utility strings and the Tailwind `terracotta-ink` token. Layered surfaces and essential style uses are pinned by source contracts.
- Rendered synthetic component tests verify visible associated auth labels after typing, unchanged autocomplete and zero authentication calls. Rhythm tests verify both line colors, line counts, numbered beats and exact dot positions.
- Unit/type/build verification does not replace visual inspection, keyboard/screen-reader testing, real-device audio or narrow physical viewport testing. In particular, this review makes no new all-site accessibility or WCAG certification claim.

Final local evidence: all 240 tests across 40 files, typecheck and production build with `NEXT_PUBLIC_PERSONA_CAS_ENABLED=true` / `NEXT_PUBLIC_TASTE_CLOUD_SYNC=true` passed. All eight local HTTP smoke routes passed. The generated CSS was inspected for the new text/background/border token (`rgb(168 72 36)`), the blue65 field edge and navy70 placeholder. Independent read-only source/math/label review and `git diff --check` passed. No live authentication or response writes were performed; visual field-layout review remains separate.
