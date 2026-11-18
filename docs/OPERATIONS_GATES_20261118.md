# Operations acceptance checkpoint, 2026-11-18

This checkpoint separates local synthetic evidence from actual operational service readiness. No operational deployment, real-user export, key enrollment, restore into a hosted service, or external alert transmission was performed.

## Verified candidate evidence

- Draft PR #1 commit `e5d7bb6f7404f4c8bd67ef9b877418acd20a2fd0`: final Quality checks run `44229401021` succeeded, including multi-engine browser checks. A prior attempt reported Firefox React hydration #418. The same commit passed a rerun; the intermittent cause remains unresolved, not fixed. Local 50 dev navigation loops and 10 production navigation trials did not reproduce it.
- Previous candidate checks: 538 application tests, 83 backup tests, 20 isolated pilot tests, 123 isolated withdrawal SQL assertions, typecheck, production build and 13 public-route local checks.
- Current follow-up: 11 new synthetic alert-contract tests, including actual in-memory pilot writer/status integration. Authentication regression subset: 53 tests passed.
- Supabase read-only project metadata: service and separate recovery escrow projects ACTIVE_HEALTHY in Seoul. This does not certify Auth configuration, key independence from the organization/provider, or a live backup.

## Synthetic alert contract

`scripts/backup/synthetic-alert.mjs` consumes an explicitly supplied daily status after the expected 12:00–12:59 UTC run window. It checks current-day archive evidence separately from the authenticated scheduled marker, detects later failed attempts, rejects malformed/future/unexpected fields, and emits only fixed codes with a stable issue identity.

An injected delivery adapter receives an allowlisted synthetic payload with a bounded timeout and cancellation signal. Errors, mismatched acknowledgements and timeouts remain unconfirmed; no automatic retry occurs. Even a matching adapter acknowledgement is **not final recipient delivery**: `delivered` and `recipientReceiptVerified` remain false. Timed-out external adapters may still have accepted a message; a future integration must reconcile the stable identity before retrying. No credentials, URLs, raw status bodies, archive contents or exceptions are forwarded.

Tests use an in-memory receiver, not a real inbox or device. Source authentication, durable incident state/deduplication, independent scheduling, an authorized external destination, delivery reconciliation and a monitor-for-the-monitor remain separate integration gates. The module does not read a hosted endpoint, schedule itself, send a network request, mutate a backup, or enable production. This is useful regression coverage, not an active alert service.

## Remaining gate order and estimates

Estimates below are hands-on time once access/scope is available, not promises that blocked provider access or scheduled windows will finish in that period. Overlapping work is possible; do not sum intervals as a guaranteed finish time.

1. **Independent monitor and actual alert delivery: 45–90 minutes.** Connect approved status authentication and a verified destination, keep durable incident/receipt state outside the writer failure boundary, rehearse unavailable/stale/missing-schedule failures and recovery without exporting personal data. Verify the final destination rather than only adapter acceptance. A scheduled window requires additional elapsed wait.
2. **Operational key and backup scope: 45–90 minutes.** Select exact real-data tables/objects and destination, retain historical recovery keys independently, validate least privilege and retention/deletion policy. Current metadata consistency and synthetic escrow restore are insufficient to enroll a real key or authorize export.
3. **Real-data isolated recovery: 60–120 minutes after applicable scope authorization.** Auth/Storage and other omitted resources must be explicitly included or excluded; verify encrypted write, integrity, isolated restore, recovery evidence and rollback. No automatic account resurrection or deletion activation.
4. **OAuth configuration and real-account acceptance: 65–130 minutes with an already usable provider session and test access.** Read Google Audience, published Branding, callback URI and domain ownership, plus Supabase Site URL/redirect allowlist; then verify real login, account separation and device return. Current connectors expose project metadata but not those configuration fields. Do not infer them from login source code or project health.
5. **Real-device/audio and remaining browser acceptance: 45–90 minutes with a device/audio path.** Distinguish automated viewport/multi-engine testing from physical device behavior and audible sound. Preserve the unresolved intermittent Firefox hydration finding.
6. **Combined candidate release/rollback verification: 45–90 minutes plus CI/provider wait.** Review exact head, run all gates, deploy only when within the separately authorized release scope, verify canonical alias and public/authenticated paths. Current work does not deploy.
7. **Launch governance/account lifecycle: separate unresolved gate, no reliable ETA.** Operator/audience/minimum-age, retention/transfer disclosures, legal review and withdrawal/non-resurrection evidence are not replaced by CI. Keep email signup and withdrawal disabled unless their own gates are met. Google-only launch can avoid SMTP rollout but not privacy or account-access obligations.

The technical path totals approximately 5–10 hours of hands-on work if prerequisites are ready, excluding scheduled runs, external review, access waits, and newly discovered defects. Reporting should identify the next completed gate and the actual blocker, not restart a blanket estimate as if no work had happened.

## Offline independent-monitor outbox prototype

`scripts/backup/synthetic-monitor.mjs` adds a file-backed synthetic outbox and fixed Korean chat text. It creates immutable notice/claim/receipt records, fsyncs file and directory, reserves a notice before any proposed send, and refuses automatic resend after an uncertain attempt or process restart. Concurrent claims yield one proposal. Corrupt/partial records fail closed instead of overwriting evidence. A failed monitor/check must itself be surfaced by the root; the ledger is not a self-running watchdog.

The approved root flow is: obtain authenticated **synthetic** status → prepare notice in an approved private durable location → claim once → resolve `originating-private-chat` to the verified user's current one-to-one conversation → send with the root messaging tool → record its confirmed message ID. This module has no room ID, service token, webhook, messaging-tool invocation or network client. It cannot send or change a destination by itself. The current-chat mapping is private runtime context, never a public source-code constant. The receipt means tool-confirmed send, not that the person saw it.

If a claim exists without a receipt, inspect messaging history for that exact incident before any further action. Do not delete the claim or automatically retry: a timed-out tool may already have delivered. If no safe reconciliation exists, leave it uncertain and surface the uncertainty through the root's existing status exchange.

This is a prototype tested with temporary directories and synthetic message IDs. It is **not activated**. The location still needs a persistence/recovery guarantee independent of the Vercel writer; a transient local workspace is not such a guarantee. Scheduler/authentication integration, receiver-side confirmation, incident recovery/closure policy, quota/expiry handling and a watchdog remain open. The inherited 13:00 UTC daily cutoff is specific to the current pilot schedule and must be reviewed if that schedule changes.

### Additional public authentication evidence

The public Supabase Auth settings endpoint now confirms Google/email enabled, email auto-confirm disabled, global signup not disabled, and phone/anonymous disabled. No authentication attempt or email was sent. See [Auth readiness](AUTH_LAUNCH_READINESS.md). Missing Google management fields and Supabase redirect configuration remain missing; no existing authenticated Console session or connected user Mac appeared in the available inventory.

Before a notice can be claimed, the caller must supply a newly obtained status and check time/day. The monitor recomputes the incident identity; recovered or changed/day-old incidents return `superseded` without claiming or proposing a message. This prevents a queued old incident from being sent based solely on its old journal entry, but authenticity/freshness of the supplied response remains the root connector's responsibility.
