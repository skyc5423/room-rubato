# Return to failed ordinary inputs

2026-11-16. The home continuation previously considered only committed journal data. After a failed ordinary memo write, the notebook could recover the input but home offered a fresh-start or unrelated saved activity instead of a recovery path.

The home card now reads the current owner's existing tab/memory pending-copy mechanism, prefers the most recent failed-input activity, and labels it as **not yet saved to the original**. It never renders memo text or choices, merges records, saves, uploads, clears copies, or marks completion. An unreadable temporary copy is disclosed without replacing it. A different account and pre-hydration render cannot see another owner's recovery path.

Synthetic component checks cover current-owner priority, memory-only retention, malformed-copy preservation and no write calls. The browser regression injects local write failure, enters a memo, navigates home, follows the recovery link, reloads, and verifies the memo is still pending before an explicit save. No real account or user records are involved. This is navigation reliability, not measured retention improvement or a guarantee beyond tab-memory/session-storage limits.
