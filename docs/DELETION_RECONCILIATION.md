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

## Independent authority and generation-fence candidates

Additional isolated implementation brings the backup suite to **58 tests** (the earlier 53-test checkpoint above is historical). The separate authority candidate keeps append-only signed versions and atomically advances a compare-and-swap head. Ordinary users get no access; publisher and reader privileges are separately grantable function capabilities, not direct table writes. The database preserves history and comparison semantics but does not verify Ed25519 itself. The trusted publisher and every reader must validate signatures, exact canonical bytes, schema, freshness and checkpoint identity.

An authority-response verifier now enforces those reader checks and exact generation comparison without rounding large integers. It rejects an extra inner signature field that could otherwise change which bytes were authenticated. The SQL and helper are executable candidates with synthetic tests, not a deployed service.

The application-side candidate issues monotonically increasing generations while holding a transaction advisory lock. The independent authority accepts only increasing generation activation and refuses a publication from an older generation. Generations are not reused on transaction rollback. This prevents a delayed older request from publishing after a successor has activated a newer generation, within the stated app-table-only recovery model.

### Integration ordering and limits

- Acquire the app transaction lock before issuing a generation; activate that generation at the independent authority before reading trust state or publishing journal events. Never reverse the lock order.
- Publish a deletion prepare before attempting deletion. Commit the app deletion before confirming it externally. If commit acknowledgment is lost, leave the intent pending until its outcome is independently verified. Pending intent blocks restoration.
- Restore only after current, uncached primary-authority reads under the app fence; cached or archive-derived checkpoints do not satisfy this contract. All deletion/import entry points must participate. Existing user-facing withdrawal remains disabled and unconnected.
- Keep the sequence and control schema out of app-table restoration. Whole-database rollback is explicitly unsupported: reseeding merely above the authority's active generation can reuse an old issued-but-not-activated number. Stop old workers, revoke their authority credentials and reconcile in-flight outcomes before a separately reviewed namespace/allocator recovery procedure. Do not automatically restart this candidate after whole-database restoration.
- These tests do not prove real simultaneous connections, network partitions, production credential isolation, primary-read behavior or durable disaster recovery.

### Resource check

Read-only discovery found the existing application database and the related application/backup worker projects. No installed integration or connector was returned for the inspected backup workers, and no suitable independent durable authority was verified. This is not a claim that every possible account storage resource was enumerated. No new database, storage subscription, role, signing credential, provider connection or production migration was created. Placing the authority inside the same restored app database would not make it independent.
