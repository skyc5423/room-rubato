# Focused observation workspace and Korean copy

2026-11-12. This release addresses the user's functionality/UX, natural-language and visual-design requirements. It does not add questions or collect research data.

## Evidence and design decisions

The preceding live audit at 1168 px found that opening a lesson retained catalogue hero, progress and filtering controls above it. The lesson heading began around y=640 and its diagram was below the first viewport. The new selected view removes that catalogue chrome, places the lesson title/stages/current question before the diagram and keeps a compact back action. Catalogue discovery remains on the list view.

- NN/g progressive disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- NN/g aesthetic/minimalist design: https://www.nngroup.com/articles/aesthetic-minimalist-design/
- USWDS typography: https://designsystem.digital.gov/components/typography/
- GOV.UK paragraph guidance: https://design-system.service.gov.uk/styles/paragraphs/
- W3C reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- W3C text spacing: https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html
- W3C focus not obscured: https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html

These sources inform hierarchy, readable body text and resilient layout; they do not prove this implementation meets WCAG. Instructional body text uses 16px/default body sizing with generous line height; captions remain smaller. Cream/cobalt styling and native controls are retained. No fixed-height lesson container, new sticky panel or hidden overflow is added.

Storage errors and active draft warnings remain visible. Storage scope appears beside the lesson, with a direct link to the full storage/cloud/recovery/export section and a return link. That management section stays mounted in a stable position so switching list/lesson views does not interrupt the cloud component. Completed-record questions/settings use a native disclosure, while read-only state and explicit edit controls remain visible. Existing owner/readiness masks, draft guards and focus refs are unchanged.

## Natural Korean copy

Verified research sources:
- Toss writing principles: https://toss.tech/article/8-writing-principles-of-toss
- Samsung UX Writing: https://design.samsung.com/kr/contents/ux-writing/
- Geng & Trotta, ACL2025: https://aclanthology.org/2025.findings-acl.657/

Applied principles: name the immediate action, prefer concrete spoken wording, avoid repetitive reassurance or attributing motivations to the reader, and preserve essential limits. Examples: '편집 질문' becomes a plain question count; keep/change controls name the selected option; comparison disclosure says '작품 설명 읽기'; the notebook describes changing contrast/spacing and listening to rhythm. Home and daily controls now use equivalent wording. The hard-coded '10~12' fallback was replaced with an accurate summary description.

The ACL evidence concerns changing AI-associated vocabulary in English academic text. It is not an AI-authorship detector for Korean UI. These are source-informed editorial/design judgments, not evidence of improved retention or comprehension. Storage/deletion warnings, institutional/editorial distinctions and no-trait-inference statements are preserved.

## Validation and limits

Regression coverage adds focused view without catalogue chrome, stable storage/export access, Back to catalogue, declined draft navigation, cancel preservation and visible storage failure. Existing tests retain open/stage/cancel/Back focus behavior, owner isolation, saved records, contrast verification and audio interruption coverage.

Final automated results are recorded in the handoff. Live browser framing, keyboard layout and restricted-width checks must be performed on the deployed candidate. The prior audit used1168px; no actual375px or320px viewport, screen-reader session or retention experiment is claimed here.

## Home integration

The text-only opening is replaced by an editorial preview of the existing full Vermeer/Turner pair beside the owner-scoped return entry. The home introduction is shortened so imagery appears before the questionnaire grid. A shared-preview option removes duplicate comparison links from the empty return card while keeping the direct notebook route. All images retain original proportions, attribution, rights links and fallback behavior. This applies the audited hierarchy recommendation, not a measured retention improvement.

## Source usability recheck

A source audit found no material scientific overclaim in the reviewed lesson summaries. Reber's legacy psy2.ucsd.edu URL returned502 in one direct fetch (not evidence of permanent disappearance); the verified pages.ucsd.edu author-hosted full-text mirror replaces it. Minimalism now links to MoMA's dedicated topic and PBS's official readable episode/transcript page. Playback was not verified. No personal responses were accessed for this audit.
