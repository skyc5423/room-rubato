# Offline deletion reconciliation: implementation and limits

This is a local protocol and synthetic test result, not an enabled deletion or recovery service.

## Implemented

A signed deletion journal distinguishes prepared requests, confirmed deletion, and verified non-deletion. Unresolved requests block restore planning. Timeouts never count as a confirmed outcome. Duplicate, mismatched, reordered and replayed transitions are rejected. Heartbeats preserve every event and supply the prior checkpoint required for conditional publication.

The offline restore entry point now requires the journal and an independently trusted checkpoint in addition to the completed deletion ledger and current owner inventory. Missing, stale or untrusted state, pending deletion, or disagreement between the two deletion records refuses a plan. Successful plans remain unauthorized for application, bind the journal digest, exclude deleted or absent owners and expire with their oldest trust input.

UUID inputs must use canonical lowercase spelling. Noncanonical signed content is rejected rather than silently normalized.

## Synthetic evidence

The published backup suite has 53 passing tests. New cases cover pending deletion, completion and non-deletion resolution, tampering, another signing key, stale or replayed checkpoints, uppercase identity aliases and multiple deleted owners. An isolated PostgreSQL model checks conditional checkpoint publication, competing candidates, lost acknowledgment and preservation of the independent authority when a separate application database is recreated. These are not tests of simultaneous hosted clients or production durability.

## Required production integration

1. A trusted service verifies the authorized request and atomically persists the prepare event and checkpoint independently before attempting deletion. A returned candidate is not proof of publication.
2. A transactionally enforced fence coordinates deletion and restoration. The existing staged withdrawal candidate is not connected to this authority and must remain disabled.
3. After verified deletion, conditionally publish its confirmed outcome and reconcile the completed ledger. A gap blocks restoration. An unknown response remains pending until verified; an error alone cannot justify recording non-deletion.
4. Before any actual restore, reload current journal, checkpoints and owners under the same coordination mechanism. An old offline plan does not authorize writes or establish that no deletion started afterward.
5. Preserve the authority for as long as any archive remains recoverable, including hidden versions. Missing authority must never be interpreted as an empty deletion history.

No production journal store, signing credential, heartbeat schedule, restore importer or deletion integration was installed. The module accepts a trusted authority's resolution; it cannot itself prove that a provider deleted an account. A checkpoint taken solely from the same archive is not independent trust.

The general design is published separately because the earlier infrastructure-specific document was not changed by this work.
