# Preserve rejected optional fields before mutation

2026-11-16 candidate; no production or real-user data changed.

The write parser previously validated the record's core fields and then reused the tolerant display parser. Invalid optional choices and settings were omitted, and non-boolean bookmarks were coerced. Saving or deleting another activity could therefore rewrite the entire journal and lose the rejected fields. Synthetic values demonstrated this; no real-user corruption is claimed.

Writes now reject present malformed before/after choices, before/after numeric settings, and bookmark values before any storage replacement. The display parser remains tolerant so valid memo text can still be viewed and exported. A parse failure also exposes the original raw copy and keeps new cloud uploads blocked. The initial read flow no longer replaces this salvaged display with an empty view. A getter failure still starts with an empty, untrusted fallback.

Missing legacy bookmark fields are allowed to default to false because no recorded value is being erased. Explicit booleans and valid numeric boundaries/choices are preserved; unknown per-entry fields remain preserved by the existing spread behavior. This is not a migration, repair, or permission to silently correct malformed values. Users can copy raw recovery bytes; an explicit server restore retains its backup/confirmation checks.

Regression coverage includes malformed choices/settings/bookmarks, unchanged raw bytes after an unrelated save or delete, safe memo display, valid/legacy compatibility, cloud eligibility for malformed optional fields, and a synthetic browser write to another activity. Pending input survives the rejected write. Hosted data and real accounts are not used.
