# Return journey: recoverable notebook edits

Reviewed 2026-11-12. This is a bounded reliability improvement, not a claim that the service enhancement or retention validation is complete.

## Research and scope

Public source pages were opened and read for this review; no personal responses were used as research data.

- NN/g, Raluca Budiu, *Memory Recognition and Recall in User Interfaces* (2024): https://www.nngroup.com/articles/recognition-and-recall/ . Visible context reduces the need to reconstruct prior work from memory. Application: a named activity and explicit recovery choice, with an inspectable memo, rather than an invisible draft.
- NN/g, Maria Rosala, *User Control and Freedom* (2020): https://www.nngroup.com/articles/user-control-and-freedom/ . Visible exits, cancellation and reversal support control; browser Back should not be trapped. Application: explicit recover/discard/cancel and no history interception. These are usability guidelines, not a measured retention effect in this app.
- Cepeda et al. (2008), *Spacing effects in learning: A temporal ridgeline of optimal retention*: https://www.yorku.ca/ncepeda/publications/CVRWP2008.html . The author-hosted abstract describes factual learning and delayed fact tests. Memory retention is not app retention; the study does not establish improved aesthetic judgment, an ideal Room Rubato return schedule, or a benefit from notifications/streaks. This change makes interrupted work easier to resume, not a scientifically proven learning intervention.

## Storage contract

Only explicit edits of completed notebook entries receive a temporary copy. One draft per owner per tab is stored in sessionStorage, containing the original base, edited entry, activity stage and diagram setting. Guest and account keys are separate. New/incomplete activity storage remains unchanged. No journal schema, server writes or automatic cloud synchronization were added.

Same-tab reload or route return offers explicit recovery; it does not silently overwrite the saved original. Recovery rereads the owner’s saved journal and requires the original base to match. Explicit save rechecks the base again, preserving the existing cross-tab conflict guard. Missing/deleted/changed originals cannot be resurrected by recovery; the memo remains available to copy before discard. Pending recovery blocks edits/bookmarks to that same original until resolved. Different owners do not see each other’s draft in the UI; logging out hides, not globally erases, copies.

Save, cancel, confirmed local departure/discard, deletion of the draft’s record, and successful cloud replacement attempt cleanup. Failed cloud backup or replacement writes retain the edit and temporary copy. Failed cleanup reports that the copy may remain; cancellation stays in edit mode, and successful save/delete offers cleanup retry. Saved-data base checks prevent stale copies from overwriting a changed or missing record. Browser storage failures can still prevent the latest temporary write: the UI asks users to copy the memo before leaving.

Tab-close recovery is **not guaranteed**. Browser session restoration/duplicate-tab behavior can preserve or copy sessionStorage; this is not durable backup or secure deletion across tabs/devices. The beforeunload warning is best effort and browser-dependent, especially on mobile/process termination. Global navigation and browser Back are not intercepted; recovery relies on the same tab’s storage. Users can explicitly discard a temporary copy. The public storage/deletion guide discloses these limits. Account withdrawal and hosted backup guarantees remain outside this change.

## Validation

Synthetic component tests model unmount/remount (reload and route exit/return), explicit recovery/save, deleted originals, owner switches, cancel, session write/removal failures, same-record bookmark protection, and both cloud backup/replacement write failures. Parser tests reject malformed, unknown and out-of-bounds copies and require a matching base. Existing journal conflict tests remain in place. These are not real-browser close/reopen or real two-account-device proof. Typecheck, production build and route smoke results are reported with the delivery commit.

Local candidate verification: 188/188 tests across 33 files passed (177 existing + 11 added), TypeScript passed, production build with CAS and notebook cloud flags enabled passed, and all 8 existing HTTP route smoke checks passed. Independent source review identified the cloud-restore failure-order regression and pending-bookmark invalidation during development; both were corrected with regression coverage. Browser interaction QA, deployment CI and post-deploy verification are not represented by these local results.
