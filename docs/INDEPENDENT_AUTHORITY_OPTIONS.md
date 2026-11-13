# Independent deletion authority: storage candidates

Research snapshot: 2026-11-13. Design review only, not deployment approval or a production-readiness claim.

## Recommendation

Evaluate a **private object store with uncached reads and conditional writes** as the next low-footprint candidate. A separate PostgreSQL authority remains the stronger option for database-enforced append-only history, role separation and transactional compare-and-swap. Neither is activated by this document.

Current authorized discovery has not verified an existing independent durable authority usable without new access or resource setup. Available resource listings are not an exhaustive inventory of every native store. Billing plan, remaining quota and a usable least-privilege connection have not been verified. Do not create a store, connect a project, provision credentials or incur charges as a side effect of these tests.

## Comparison

| Candidate | Independence and recovery | Current limitation |
| --- | --- | --- |
| Separate PostgreSQL authority | Survives an application-only database restore; can enforce append-only versions and restricted reader/publisher functions | No usable independent instance verified; installation, access, recovery and availability still need validation |
| Private Vercel Blob | Separate from the application database; consistent reads and ETag conditional overwrites support a candidate single-head CAS protocol | Shares hosting control plane; native read-only authority and writer isolation not verified; no hosted test, store or durability proof |
| Application database, separate schema | Transactions and roles are convenient | Whole-database rollback can roll back both data and authority; not an independent source of truth |
| Existing backup object storage | Potential separate provider/failure domain | No usable authorized connection or conditional-write contract verified in this review; no login or new key requested |
| Local files or public repository | Useful for source and synthetic tests | Not an acceptable private, always-current deletion authority; never publish identifiers or ledger contents |

An independent database or object store does not automatically survive account compromise, provider outages or credential loss. Document and test the intended failure boundary before activation.

## Private Blob contract to validate

Official documentation now provides `useCache: false` for consistent private reads. Default cached reads can be stale after overwrite. Therefore a coherent, correctly signed cached head is still insufficient evidence that no deletion is pending.

The candidate requires a stable private object name, explicit overwrite permission, random suffixes disabled, and `ifMatch` with the currently observed ETag. All authority reads must bypass cache. A missing head must block, not initialize an empty history. Initialization is a separately authorized one-time operation.

Lost acknowledgments require an uncached read and exact digest reconciliation before any retry or protected action. Missing data, quota exhaustion and unavailable reads fail closed. ETag CAS alone is not append-only enforcement, authorization, a fencing protocol or signature verification. A trusted service must validate immutable prefixes, transition rules, signer, operation identity and active generation; stale workers must be fenced across restore and ownership changes. Read access must not imply write/delete access. Never give the client application an authority write credential.

The local contract tests deliberately use an in-memory fake, not the storage SDK. They do not prove provider semantics, durability, retention, permissions, delayed in-flight commits after a failed acknowledgment, concurrent restore fencing, runtime integration or end-to-end deletion safety. The SQL authority and restore-fence candidates retain their separate limits, including unsupported whole-database rollback recovery.

## Quota and availability

The published Hobby allowance includes 2,000 advanced operations monthly. A five-minute continuous heartbeat would require 8,640 writes in 30 days before real events, initialization or retries. On-demand refresh of the independently retrieved current signed history avoids that fixed burden; it must preserve unresolved intents, never refresh an arbitrary historical copy. Quota exhaustion must stop protected actions rather than fall back to stale data. This is not a current-account quota or no-cost guarantee. Consistent reads also consume origin-transfer allowance.

No expiration should be set on the authoritative head. Recovery history and key rotation require their own reviewed retention and restoration design; a single mutable object is not by itself a recoverable journal archive.

## Completed local verification

Seven synthetic tests cover cached stale heads, conflicting conditional writes, lost acknowledgment before and after commit, missing/unavailable/quota failures, intent-preserving on-demand refresh and heartbeat budget arithmetic. No network calls, account setup, credentials, live records or storage writes are used.

## Sources

- [Consistent private reads announcement](https://vercel.com/changelog/vercel-blob-now-supports-consistent-reads-on-private-storage)
- [Blob SDK reference: get and conditional put](https://vercel.com/docs/vercel-blob/using-blob-sdk)
- [Blob usage and pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing)
- [Blob security](https://vercel.com/docs/vercel-blob/security)
