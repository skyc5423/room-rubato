# Failed-input cloud boundary

2026-11-16. Candidate only; no hosted account, schema, deployment, or user records changed.

## Finding

The notebook renders unsaved ordinary inputs over committed records to keep a failed memo visible. It also passed that view to manual cloud storage. This meant the account-save control could send those failed-input overlays, despite the temporary-copy disclosure saying they were not sent to the server. Mount/login never uploaded them automatically; this was a mismatch on explicit account save, not evidence of an unsolicited data leak.

## Guard

While any ordinary local write remains pending, prevent a **new** account save in both the button and handler. Explain how to export, explicitly retry a local edit, or discard the failed inputs. The gate follows restoration after a client-route remount and clears after an explicit successful local write. No new cloud operation is triggered when it clears.

An already-sent request with unknown acknowledgment can still be retried using its original immutable request object. Do not replace it with later failed local edits, unmount the sync controller, or invent a new write ID. Server reads and explicit restore remain available; the notebook's existing confirmation and backup checks still govern replacement. The privacy copy distinguishes temporary inputs from later explicit local-then-account saves.

## Verification and limits

Synthetic regressions fail against the prior implementation, then verify the notebook's gate, remount persistence, local retry, no new upload/confirmation through direct handler calls, and preserved original-request retry after later failed inputs. Existing cross-owner pending-input tests and full aggregate checks are required. This does not prove real hosted-account isolation or physical-device recovery, and does not alter the temporary-copy retention policy.
