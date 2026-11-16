# Browser-only artwork view preference

Explicitly selecting a catalogue work remembers its ID under a separate owner/lesson browser preference key. Merely opening an activity writes nothing. The UI distinguishes this last-view preference from the artwork described by a memo; it is not a cloud-backed journal field and does not travel to another device.

The initial optional journal-field implementation was removed before merge/deployment because older strict cloud/draft validators would reject it. Existing journal, draft, cloud payload and export schemas are unchanged. No hosted schema migration or production deployment occurred.

Current lesson catalogue membership controls choices. Unknown/deleted IDs display an explanation and fall back without changing saved observations. Locked tabs and completed read-only records can browse but cannot overwrite the preference. Failure to read or remember the preference is reported and never changes the memo.

Deleting the corresponding observation or explicitly replacing the local journal from cloud clears this user's relevant preferences, to avoid suggesting they describe the newly restored notes. Preference cleanup precedes journal replacement and fails closed; cleanup may remove a view preference even if the following journal write fails, but the original observation remains intact.

Cloud-only/cross-device restoration of the exact artwork remains unresolved; no new field is uploaded merely to claim that guarantee. This is a bounded current-browser return improvement, not whole-service acceptance or a claim about the artwork a historical memo refers to.
