# Catalogue entry copy calibration

## Scope and rationale

Read-only source-code audit followed by a bounded editorial correction, based on
0af3312. No personal responses were accessed. No schema, ID, numeric scoring weight,
axis key, signature, storage or rendering code is changed.

All twelve rendered domain subtitles now describe the actual text-choice activity
rather than promising to analyze visual discernment, technical receptiveness,
financial management, life, or a bespoke recommendation. They keep domain-specific
materials and actions instead of replacing everything with generic reassurance.
Music explicitly distinguishes written choices from listening; food/scent distinguishes
scene choices from direct sensory evaluation; finance excludes suitability assessment.

Fashion's axis label, first type name and summary no longer classify navy as an
achromatic color. The summary is an editorial style suggestion, not a proven personal
trait. One wardrobe-use probability, four universal/superlative curation reasons,
and the asset-protection type name are calibrated to concrete optional comparisons.
The maturity-ladder tag is now 만기분산, not 계단식복리: spacing maturities does not
itself imply compounding or guaranteed returns. Other playful names are retained.
Unused deepAnalysis prose is deliberately untouched. This is not a certification
that the entire catalogue has been fact-checked.

## Sources and limits

- Musashino Art University, chromatic/achromatic color glossary:
  https://art-design-glossary.musabi.ac.jp/chromatic-and-achromatic-colors/
  White/gray/black are achromatic; colors with hue are chromatic. This supports the
  navy correction, not the merits of any clothing combination.
- Toss writing principles: https://toss.tech/article/8-writing-principles-of-toss
- Samsung UX writing: https://design.samsung.com/kr/contents/ux-writing/
  Applied as editorial guidance for concrete, comprehensible wording and honest
  scope. These do not establish an AI-text detector or experimentally validate this UI.
- Investor.gov bonds overview (already verified in the factual recommendation review):
  https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds
  Financial product risk remains; maturity allocation is not a promise of return.
  The tag correction withdraws an implication, not investment advice.
- Local implementation: domain introduction renders subtitle; type cards render name
  and summary; result uses decisionGuide and curation.reason. This correction changes
  the static editorial catalogue only. Result headings/provenance are a separate task.

## Regression scope

`tests/catalogue-copy.test.ts` checks all twelve subtitles and actual question counts,
the targeted navy/guarantee/tag changes, and a SHA-256 baseline of catalogue structure,
all IDs/axis keys and every numeric value (including signatures and scoring weights)
from pre-edit 0af3312. Editorial string arrays retain their lengths but not text in
that mechanical fingerprint. Tests use public catalogue constants only.

Local verification: focused 4/4 tests; full suite 298/298 across 47 files;
`tsc --noEmit`, optimized Next.js production build and `git diff --check` passed.
No production deployment or live visual check was performed in this worktree.
