# Artwork-led observation and editorial paths

Verified 2026-11-11. Publication version 1.

## Source and licence checks

Six assets are downloaded unchanged from the Met Collection API's `primaryImageSmall`, after verifying `isPublicDomain=true` and the object's Public Domain label. The Met Open Access policy supplies CC0 for eligible public-domain images: https://www.metmuseum.org/hubs/open-access . `public/artworks/manifest.json` retains original URLs, titles, artists, dates, accession credit, licence, verification date, and SHA-256. Total assets under 1 MB, lazy loaded. No tracking embeds or external image hotlinks.

Object 437133 (Monet, Garden at Sainte-Adresse) was rejected because its API Public Domain flag was false and no downloadable image was provided. No uncertain-rights asset was included.

## Editorial verification

Institutional contexts are short paraphrases of these collection pages, independently distinguished from Room Rubato's observations and cross-domain prompts:

- 437881 Vermeer: domestic setting and light on vessel/linen.
- 436535 Van Gogh: 1889, impasto and on-site landscape.
- 436105 David: 1787, gestures; Plato's inclusion is narrative rather than eyewitness record.
- 436121 Degas: off-centre figure and prominent flowers; sitter identity remains tentative.
- 437853 Turner: c.1835, reflections and exhibited at Royal Academy 1835.
- 45434 Hokusai: c.1830–32, scale/perspective, imported Prussian blue.

All URLs are directly present in `artwork-studies.ts` and the rendered UI. Each work's educational text remains under 200 source-derived words; no gallery audio, full transcript, or proprietary images copied. Korean titles are editorial translations alongside original titles.

## Product behaviour

`ArtworkStudy` adds authentic objects to all eight existing lessons. A user can reveal interpretation after observing, switch works, see an enlarged detail or full image, then use the existing lesson memo. Activities do not produce personality claims or new score values.

`StudyPaths` adds three sequences connecting concepts across art, design, space, and music. Existing lesson completion drives next-step suggestions; no additional data collection. A daily editorial slot rotates existing activities on the Seoul calendar and explicitly does not claim new publication.

## Verification and limits

All six downloaded images were visually inspected. Tests check provenance/assets, full lesson coverage, date boundary, accessible disabled loading state, and source visibility. Mobile visual QA must occur after integration/deployment. This is a curated six-work collection, not comprehensive art history or a validated retention intervention. Existing music scientific sources and custom audio remain unchanged. Expansion should preserve this source/licence manifest and version records.
