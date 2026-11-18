# App-data → private Blob candidate (not deployed)

This implementation closes a code gap, not permission or evidence of a live backup. No route, CLI, scheduler, environment variable, hosted credential or existing synthetic writer is changed. Only disposable synthetic databases and in-memory/intercepted SDK transports are used by tests. `enabled: true` and identity metadata are configuration assertions, not user authorization or proof of the real database identity.

## Candidate contract

- `scripts/backup/blob-export.mjs`: `exportToBlob({config,client,store})` connects an explicitly injected pg-like client to the existing reviewed `export.sql`, seals its result, verifies immutable archive readback, signs a Blob-specific receipt, and verifies receipt readback. B2 receipts and synthetic-pilot formats remain unchanged.
- `scripts/backup/blob-store.mjs`: `createAppBlobStore({config,token,blob})` binds explicit pinned-SDK `get/put` implementations to private store `store_C1xbVeoXtowulKQG`, prefix `room-rubato-app-backups`, and a recovery-key fingerprint. No list/delete/overwrite/fallback/public route exists.
- Logical path: `app-data-v1/<key-fingerprint>/<UTC-day>/<snapshot-UUID>.rrb`, with `.receipt.json` appended for the signed receipt. Synthetic paths and historical keys are never reused.
- Required config: `enabled === true`, `mode === 'app-data-candidate'`, exact `sourceProject`, `confirmedScope: ['persona_profiles','taste_journals']`, exact `{storeId,prefix}` destination, RSA-3072-or-larger `publicKey`/`keyFingerprint`, Ed25519 `receiptPrivateKey`/`receiptPublicKey`/`receiptKeyFingerprint`, and bounded integer `maxArchiveBytes`. No defaults enable operation.
- Export runs in repeatable-read/read-only with statement/lock timeouts, a transaction advisory lock, pre-materialization size estimate, full snapshot validation and captured-time bounds. The lock is released at COMMIT **before** Blob writes; it does not serialize external uploads. Immutable UUID paths prevent overwriting, not duplicate daily runs.
- The plaintext snapshot is limited to 32 MiB; encrypted-envelope limit is separately bounded to 48 MiB and receipts to 16 KiB. Encryption is AES-256-GCM with RSA-OAEP-SHA256 wrapping. Only encrypted archives and allowlisted signed metadata reach the sink. The private recovery key never reaches the writer.
- A put acknowledgement or occupied path alone never proves success. Exact independently captured bytes/digest/length must match origin readback for archive and receipt. Uncertain outcomes are reconciled once, without an application retry. A failure can leave immutable orphan ciphertext; no cleanup or rollback of external objects is falsely claimed.
- The receipt pins source-label, destination, path/snapshot ID, recovery fingerprint, capture time, ciphertext digest/length and `readbackVerified: true`. It always says `restoreVerified: false`. `verifyBlobReceipt` pins the separate Ed25519 public-key fingerprint; B2 verifiers are not weakened.

## Trusted SDK wiring prerequisite

Before importing SDK 2.9.0, call `assertAppBlobRuntime()` in a dedicated controlled runtime. It requires `VERCEL_BLOB_RETRIES=0` and rejects API URL, protocol-version, proxy-through-alternative-API overrides and Blob DEBUG flags. Repeat checks occur at factory creation and each call. No helper changes those variables itself. The SDK caches its debug flag on import, so an already imported arbitrary SDK is not retroactively certified by a later check. Inject only the reviewed SDK; an arbitrary adapter can lie about its identity or behavior.

The supplied static token must identify the exact store. Explicit tokens take precedence over OIDC/environment credentials in the pinned SDK implementation. This does not establish that the account/store is independently controlled or immutable. SDK metadata pathname is not cryptographic proof; exact receipt-bound bytes are the integrity check.

## Verification and remaining activation work

`npm ci --ignore-scripts --prefix ops/blob-pilot` supplies the existing pinned SDK used in offline transport tests; `npm run test:backup` includes the candidate tests. The tests execute actual two-table SQL on PGlite, decrypt with a separately held generated recovery key, and restore every column to a distinct disposable PGlite database. Network access is disabled for SDK mock-transport tests. No real account, hosted source, Blob upload or production key is used.

Before any real connection: confirm exact data/destination scope, verify live source identity and least-privilege credentials/TLS, enroll and recover an operational escrow key, validate destination privacy/region/quota/terms, wire a separate bounded authenticated runtime and durable run/incident state, and perform the approved isolated recovery drill. Retention, deletion-authority reconciliation, actual scheduled monitoring, and full Auth/Storage disaster recovery are not added by this candidate. Do not flip the synthetic writer's gate or deploy this library as a side effect of passing CI.
