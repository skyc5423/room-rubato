# Cooperative notebook single-writer lease

The notebook acquires an exclusive Web Lock per journal owner while mounted.
A competing tab remains readable but cannot save, delete, restore, or clear a restore copy.
Close the first notebook or navigate away, then explicitly retry in the second tab.
Acquisition errors fail closed; unmount/account change releases the lease. Late callbacks
cannot grant editing rights to an obsolete component. No lock stealing, timestamp leases,
credentials, hosted writes, or production deployment are involved.

Browsers without Web Locks retain the existing behavior and display a one-tab-only warning.
This is NOT atomic localStorage CAS: older deployed tabs, unrelated code, browser data
clearing, and unsupported browsers do not participate. Existing fresh-read/conflict guards
remain necessary. Rollout must ask users to reload older tabs. Real browser process crashes
and mixed-version sessions are not certified by the simulated lock-manager tests.

Reference: https://www.w3.org/TR/web-locks/
