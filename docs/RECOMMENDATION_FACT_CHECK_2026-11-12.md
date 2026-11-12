# Bounded recommendation fact check — 2026-11-12

Scope: read-only triage of recommendation fields across all 12 domains in the three `domains-pillar*.ts` files, followed by seven targeted field changes. Base: `541ac62`. This is not a certification of the entire catalogue. No personal answers or production data were used. Earlier 25-field copy calibration is not repeated. No app rendering or scoring changes.

## Evidence and exact correction targets

| Target (base line) | Previous claim / issue | Primary evidence | Correction classification |
| --- | --- | --- | --- |
| `src/lib/domains-pillar3.ts:1008`, decisionGuide associated with `cur-eco-2` | Fixed-rate/dividend/bond ladder increases both psychological stability and long-term performance | [SEC Investor.gov Bonds FAQ](https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds), risks section: credit/default, interest-rate, inflation and liquidity risk | Remove unsupported performance/suitability inference. Retain maturity timing as a research topic and explain default/interest-rate risk. Not investment advice or Korean deposit-protection guidance. |
| Same file:1014, `cur-eco-2.reason` | A ledger and ladder complete an unwavering financial safety net | Same regulator source | Editorial correction of unsupported guarantee: record cash needs; maturity spacing does not itself guarantee principal/returns or establish suitability. |
| `src/lib/domains-pillar1.ts:2156`, `cur-gas-16.reason` | Santa Maria Novella, L’Occitane and Mariage Frères collectively described as centuries-old botanical houses | [L’Occitane official history](https://group.loccitane.com/group/who-we-are), 1976 founding entry | Verified factual overgeneralization: L’Occitane was founded in 1976. Remove shared chronology rather than invent a replacement history for all brands. Distinguish fragrance/skincare from drinkable tea; specific product ingredients and stock remain unverified. |
| `src/lib/domains-pillar3.ts:1596`, `cur-wrk-1.reason` | Switching on headphones blocks surrounding noise and guarantees immersion | [Sony WH-1000XM5 official help](https://helpguide.sony.net/mdr/wh1000xm5/v1/en/contents/TP1000534716.html): noise is reduced, not completely cancelled; effect varies with fit/environment/noise | Verified counterexample to universal blocking, not a claim that every headphone works identically. Recommend checking fit and reduction in the actual work setting. |
| `src/lib/domains-pillar1.ts:2587–2588`, `cur-art-4.reason` and tags | Van Gogh, de Staël and contemporary abstract expressionism grouped under knife marks and an Abstract Expressionism tag | [MoMA, The Starry Night](https://www.moma.org/collection/works/79802): Van Gogh contextualized as Post-Impressionism; impasto shows brush **or** palette-knife marks | Correct technique/scope, retain names and a comparison of color/material surface. New grouping is an original editorial comparison, not a historical school classification or claim that every work by each artist uses impasto. No acquisition or current exhibition claim. |
| `src/lib/domains-pillar2.ts:1148`, `cur-cin-7.reason` | Archive gives access to director commentary and early storyboards without edition/territory qualification | [Criterion General FAQ](https://www.criterion.com/faq), supplements selected per release and region/shipping restrictions; [Channel FAQ](https://www.criterion.com/faq/channel), Channel available only US/Canada, not all Collection titles stream | Retain catalogue/research value; check supplements per edition and disc region/subtitles/shipping. Distinguish discs from Channel and disclose current official territory limit. No promise of Korea delivery, stock, subtitles or title availability. |

All linked sources above were opened and relevant text read on 2026-11-12. A Van Gogh Museum secondary lead (`https://ontrafel.vangogh.nl/en/story/32/a-brush-and-a-knife`) timed out; it is not relied upon. MoMA independently supports the implemented technique/classification correction.

## Triage outside the correction set

- Fashion: subjective brand/style superlatives remain; no universal performance or price/stock verification is implied. Prioritized objective/high-consequence claims above rather than rewriting every aesthetic preference.
- Space: generic comfort/value claims and named shops require a future product-specific check before treating these as purchasable listings. No verified current inventory or showroom-opening claim.
- Food/fragrance: corrected shared history only; individual formulations, allergy suitability, food/skincare distinction and availability must be checked on actual products. Prior Fritz correction remains intact.
- Art: an “only black-and-white” grouping in `cur-art-6` is too broad if read as a lifetime oeuvre claim; this pass did not establish artist-specific primary evidence for all names, so no new factual assertion is substituted. Treat it as an unverified scope concern, not a verified factual finding.
- Music: FLAC/high-resolution terminology and guaranteed audible detail in `cur-mus-4` deserve a dedicated format/playback-source check. No claim that an equipment recommendation was acoustically tested.
- Cinema: corrected edition/territory limits; no playback or purchase test performed.
- Literature: genre and series recommendations inspected; edition-specific binding, availability and claims of explanatory authority not independently certified.
- Travel: generic destination/stay suggestions are not live listings; existing per-property qualification preserved. No availability, opening-hours, safety or access checks implied.
- Technology: `cur-tec-6` still asserts fault-free longevity and unrestricted DIY maintenance without specifying a model. Flagged as unsupported; product-specific evidence cannot validate such a universal claim. No hardware tested.
- Economy: corrected the consequential remaining return/ladder promise. Other summary/personality grounding is owned by the result-grounding workstream, not evidence of financial suitability.
- Work: corrected complete noise blocking; no measured productivity outcome claimed.
- Life/philosophy: expressive/emotional benefit copy is not a verified therapeutic outcome; `cur-phi-5` instantaneous vitality wording remains an editorial risk, not clinical evidence.

## Validation

Four narrow regression cases cover the seven changed fields, preserving named artists, specialist technique, ledger/maturity topic and film archive specificity. Full tests/typecheck are run on the isolated candidate; results are reported with the commit. These tests verify copy invariants, not external facts, current product availability or user comprehension.

Candidate validation: `npm test` passed 205 tests across 35 files; `npm run typecheck` passed; `npm run build` passed; `git diff --check` passed. No publish or deployment performed by this worker.


## Bounded follow-up: eight additional fields

The original triage flags for technology, audio, art6 and instantaneous vitality are now addressed; their descriptions above record the initial finding, not an outstanding implementation blocker.

- `cur-tec-6.reason` and its phenotype's first decision guide: removed fault-free longevity, unrestricted DIY and generation-number satisfaction promises. [Apple Self Service Repair](https://support.apple.com/self-service-repair), opened/read 2026-11-12, explicitly requires relevant repair knowledge/experience and model-specific manuals/tools/parts. This is a counterexample to unrestricted DIY, not a blanket repair policy for every notebook. Replacement is a concrete model/manual/parts/warranty checklist; no durability test or service availability is claimed.
- `cur-mus-4.title`, reason, first decision guide and tags: removed FLAC=high-resolution conflation, guaranteed newfound detail and equipment-as-the-only-answer framing. [Xiph FLAC FAQ](https://www.xiph.org/flac/faq.html), opened/read, defines lossless compression and supports varying PCM bit depths/sample rates. It does not establish a universal perceptual improvement. [NIDCD noise-induced hearing loss](https://www.nidcd.nih.gov/health/noise-induced-hearing-loss), opened/read, identifies high-volume headphone listening as a risk. Replacement keeps concrete attention to instrument placement/reverb without promising audible format differences or prompting louder comparison. No listening experiment or individual hearing inference made.
- `cur-phi-5.reason`: removed “활력을 즉시 회복”. This is editorial withdrawal of an unsupported universal outcome, NOT a clinical finding that nature has no benefit. Keeps a weather/body-condition-sensitive optional flower/sunset observation and indoor alternative; no medical treatment claim introduced.
- `cur-art-6.reason`: narrowed to choosing monochrome landscape/ink works for comparison, explicitly not classifying the artists' entire output. This is an editorial scope correction, NOT an asserted new fact about every named artist. [Ansel Adams Gallery catalogue](https://www.anseladams.com/pages/explore-photographs) was opened but its text did not establish a whole-oeuvre black-and-white claim; no such inference is made. No stock/exhibition claim added.

Follow-up adds three narrow regression cases to the original four. No other catalogue fields, scores, stored responses or rendering are modified.

Follow-up validation: 208 tests across 35 files passed; typecheck, production build and diff-check passed. Eight follow-up fields plus the original seven make 15 bounded field corrections across this two-commit candidate.
