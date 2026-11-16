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

## Verified outcome (2026-11-16)

Candidate **2cf8b43071063bd122818a4987587e37aa646ade**, [run 43874158223](https://github.com/skyc5423/room-rubato/actions/runs/43874158223), diagnostic job 133322708734:
- Matrix completed **96 visits**, 4 variants, 3 trials, **0 page errors**.
- Full Firefox notebook journeys **10/10 passed consecutively**, each with the strict error gate; not failure retries.
- The separate ordinary aggregate job also passed (536 tests / 70 files, typecheck/build, existing browser/SQL/backup suites).

Classification: **unreproduced observation, root cause unknown**. No speculative application fix or suppression was made. This sample does not prove the error cannot recur. Keep the all-page event diagnostics and normal twice-run Firefox gate. The temporary additional CI job is removed after this bounded investigation to avoid duplicating build/install and ten journeys on every PR; the matrix script remains available for recurrence. To repeat against a local production server with installed Firefox and virtual audio: `node scripts/diagnose-firefox-hydration.cjs`, then `for trial in $(seq 1 10); do BROWSER_ENGINE=firefox node scripts/verify-notebook-browser.cjs || exit 1; done`. If it recurs, preserve the immediately recorded page/time/stack, isolate that transition, then use a development build before proposing a fix.

## Accessible release-check follow-through

`npm audit --omit=dev --json` and full `npm audit --json` succeeded against the current lockfile on 2026-11-16 with **0 known vulnerabilities at all severities**. No dependencies were changed. Registry advisory coverage is not a complete security audit. Real account/device journeys, backup upload/readback/isolated restore and owner policy decisions remain separate unverified release gates; passing this diagnostic does not close them. No merge or deployment.
