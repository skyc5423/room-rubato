# Do not upload an unreadable local fallback

2026-11-16 candidate. No hosted account, production data, migration or deployment changed.

An unreadable local journal was rendered as an empty fallback with no pending local writes. Manual account save could therefore upload that fallback and replace a nonempty server journal. This is a guarded manual-save path, not evidence of an automatic upload or real-user data loss.

The notebook now tracks successful local snapshot reads separately from generic storage/export messages. Initial read failures and malformed cross-tab journal events block **new** account uploads, both in the button and handler. Raw recoverable bytes remain available; viewing or exporting the fallback does not make it trustworthy. Valid reads, a verified local edit, valid external events and successful explicit server replacement restore the flag. Server replacement retains its pre-replacement backup guard. Owner initialization resets trust. A successful read refreshes the displayed/upload snapshot together with trust, including draft recovery and a deletion whose subsequent write fails; trust is never granted to a prior fallback merely because a different snapshot was read.

Manual server reads/restores remain available. A previously sent request with unknown acknowledgment can still be retried using its original request, not later local state. The separate pending-local-input guard remains in place. This does not solve every multi-tab atomicity problem, and the current optional-field mutation parser's normalization behavior is outside this patch.

Synthetic tests first failed against the previous implementation, then passed for malformed/unavailable initial reads, external malformed data and valid recovery, failed export independence, explicit restore with raw backup preservation, direct save-handler refusal, and immutable pending-request retry. No hosted account isolation claim follows from these tests.

Follow-up: the previously deferred optional-field normalization issue is addressed in `LOSSLESS_LOCAL_JOURNAL_WRITES.md`. Malformed optional values now keep the snapshot untrusted while recoverable memo text remains viewable; raw originals are not normalized by unrelated writes.
