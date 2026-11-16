# Cross-tab local clear handling (2026-11-16)

A browser `localStorage.clear()` operation emits a storage event with `key=null`.
The notebook previously handled only its exact journal key and left removed saved
notes on screen. It also did not refresh recovery-copy availability on storage
changes. Two synthetic component regressions failed before the correction.

The handler now clears its displayed saved journal and recovery-copy controls for
local-storage clear events, updates recovery-copy existence for its current owner,
and ignores non-local storage events. Unsaved explicit drafts are not discarded;
the existing compare-before-save guard still refuses a changed/deleted base.
No actual user storage was cleared and no production change was made.
