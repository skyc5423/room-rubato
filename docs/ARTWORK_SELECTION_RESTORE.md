# Explicit artwork selection on return

An optional `artworkId` on the existing observation record retains the last explicitly selected catalogue work, not a personality inference or a claim that the entire memo concerns that one work. Opening an activity never writes the default first artwork. The selector explains its persistence before interaction.

Only IDs present in that lesson's current catalogue can be saved by the UI. The record parser, cloud payload validator and temporary edit parser accept a bounded numeric identity; missing/deleted catalogue works are disclosed and displayed with a fallback without rewriting the original ID. Records without this optional field retain their earlier default display.

Writes use the existing owner-scoped journal path, fresh reads, pending-write preservation and writer lease. Completed records are read-only until the user explicitly edits; browsing another work in read-only mode remains temporary. Text exports include the stored ID. No hosted schema or production deployment was changed.

Older client versions with strict cloud/draft field allowlists can reject records containing this added field. They must not be used to restore newer records; rejection preserves local records rather than dropping an unknown field. Real hosted cloud round-trip and mixed-version deployment remain unverified. Synthetic validator tests cover the current client only.
