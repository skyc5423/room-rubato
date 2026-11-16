# Read-only recovery of malformed daily records

Both the home reflection and `/daily` previously dereferenced every saved daily entry. A null member could break the whole page. A latest record with missing or invalid choices could also produce a false maintained/changed answer summary.

A shared read-only selector now skips non-records and dates that cannot identify the requested day. It retains the latest identifiable response even when its answers are invalid: it does not substitute an older answer, default to A/B, or invite a new response over that record. Exact A/B choices are required before interpreting maintained/changed. The original log remains untouched; the existing data export remains the recovery route. The dedicated page still reports missing response time honestly.

Evidence: 12 component regressions reproduced both failures before the fix; helper tests cover unknown members, dates, latest-record precedence, exact answers and real zero time. The browser audit seeds only an isolated synthetic guest log and checks both routes plus preservation after navigation. This is display validation, not a data migration, authenticated isolation proof or production deployment.
