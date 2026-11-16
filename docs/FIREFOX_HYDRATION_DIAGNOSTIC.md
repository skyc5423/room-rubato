# Firefox hydration observation and bounded reproduction

## Known evidence

On candidate b420368a808f7b9667dac6e7ebf9dda48d9a67ed, run 43871517878, the existing Firefox notebook journey reported one React #418 (HTML) at its final page-error gate. Application bytes matched the preceding successful candidate; only screenshot capture/documentation changed. The old listener retained the message but not the event's navigation/time, so the failing route cannot be recovered from that run. This is not evidence that the later screenshot change caused the mismatch.

Candidate 5bba07a52d4ba70ab9bfc5578b3480c8fa92877f then passed the strict journey twice. This is useful repetition, **not** proof of a fix. The source observation remains open until an actual mismatch can be identified or explicitly classified as unreproduced.

## Static separation

The visited /notes route renders the notebook list initially (selected=null); completion cards and lesson-specific controls are created after hydration. Provider initial state/auth/readiness are deterministic, and saved data/StudyPaths dates are read in effects. /privacy is static. No obvious invalid nesting was found in the visited initial tree. This narrows priorities, not proof of correctness.

The installed React host hydration implementation distinguishes text from HTML-node mismatch. A restored details open attribute alone is insufficient to explain #418 HTML; a node/structure difference would need evidence. [React's official error reference](https://react.dev/errors/418) lists server/client branching, varying data and invalid nesting as general possibilities, not a diagnosis of this incident.

## Reproduction plan in CI

A separate isolated localhost Firefox job preserves the ordinary aggregate job and does not touch hosted data/accounts. Matrix: three repeats × four conditions × four routes × initial/reload = **96 visits**. Conditions vary synthetic empty/saved notebook state, en-US/UTC versus ko-KR/Asia-Seoul, and ordinary versus 150ms-delayed JavaScript assets. Routes: notebook list, light, perspective, privacy. Every page error fails the job; hydration console messages are also diagnostic. Readiness checks precede a short observation interval.

After the matrix, ten complete existing Firefox notebook journeys must **each** pass. This is not retry-on-failure: a single failed journey fails the shell/job. Existing audio, lock, export and preservation assertions remain. All fixtures are synthetic; no DOM, storage contents or actual account credentials are logged.

If reproduced, identify route/phase first, then run the same state with a development build for expected/actual-node diagnostics before changing the application. If not reproduced, report exact counts and limits, keep the strict error gate and do not claim root-cause resolution. Browser Linux CI does not replace physical Firefox or accessibility acceptance.
