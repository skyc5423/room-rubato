# Rhythm: distinguish the pulse from the pattern

2026-11-12. Original learning interaction within the existing syncopation activity, not a new questionnaire or musical-ability test. No personal responses were accessed for research.

## Demonstrated gap

The graphic had 16 vertical positions, only four of which were the reference beats. Its nearby text called all vertical lines steady beats. The audio actually placed the lower reference tones at slots 1, 5, 9 and 13. A and B could only be heard with the reference already mixed in, making the central beat/pattern distinction difficult to inspect independently.

## Correction and invariants

- One shared definition supplies the four pulse onsets, 16 subdivisions and original A/B patterns to the SVG, audio and no-sound explanation.
- Four numbered beat labels distinguish the heavy pulse lines from intermediate subdivisions. Each beat spans four slots. Accessible text names the exact one-based pulse and high-note positions.
- A manually started reference-only button lets the listener hear the lower pulse before choosing A/B playback. It is explicitly not a third answer. Reference-only playback has eight lower tones across two repeats; A/B each have eight lower and eight higher tones. The copy distinguishes simultaneous tones in A from shifted tones in B rather than promising an equal number of separately perceived events.
- A remains [0,4,8,12], B remains [0,3,6,10], with the same 0.15-second subdivisions, two repeats, frequencies, gain and approximately five-second duration. No tempo option or new stimulus was added.
- No autoplay, external media, microphone access, stored listening history, answer change or new schema. Stop, unmount and stale-resume cancellation retain the existing request-generation protection. Saved answers and existing choice labels remain unchanged.

## Primary-source map and limits

Opened and read 2026-11-12:

- [Carnegie Hall: Performing and Composing Four Beat Patterns](https://www.carnegiehall.org/Education/Programs/Music-Educators-Toolbox/1-Performing-and-Composing-Four-Beat-Patterns). The Grade 1 page's Going Deeper section separates maintaining a steady beat from performing a rhythm. This supports the educational distinction, not an adult-learning or retention efficacy claim. The webpage is CC BY-NC-SA; no worksheet, notation, recording or translated exercise is reproduced. The interface, text and synthesized examples are Room Rubato's own.
- [National Gugak Center: 장단맞춰, 쿵딱!](https://academy.gugak.go.kr/open/open/lecture/detail.do?currentMenuId=900006007&openLectureSeq=1536&srchListType=SERIES&srchOpenCategorySeq=). The official description identifies a children's introduction to 굿거리 and 자진모리. This remains separately linked Korean listening material. The four-beat synthetic example is not either jangdan or a general model of Korean rhythm. The worksheet is marked 공공누리 제4유형; no worksheet or video is reproduced. Full external video playback was not audited.

The existing Witek/Senn research discussion remains unchanged and does not validate these synthetic stimuli, individual preference or musical skill. Cross-domain artwork prompts remain observations, not assertions that visual and musical rhythm have identical structure.

## Acceptance

Synthetic tests check exact onset times/frequencies for pulse/A/B, beat/subdivision count and labels, accessible no-sound descriptions, no writes, manual stop, timeout, unmount, pending-resume cancellation and stale rejection while switching to the reference. Existing notebook and audio lifecycle regressions remain in the full suite. Typecheck and flagged production build are required. Actual audio-device quality and browser/screen-reader checks must be recorded separately, not inferred from these tests.

Local candidate evidence: 217/217 tests across 36 files passed, TypeScript passed, production build with `NEXT_PUBLIC_PERSONA_CAS_ENABLED=true` and `NEXT_PUBLIC_TASTE_CLOUD_SYNC=true` passed, and all 8 existing local HTTP smoke checks passed. Independent read-only code/source review found no remaining blocker. No production action, real-device audio audition, screen-reader session or narrow-viewport visual acceptance is claimed.
