# Editorial content doorway

## Reason for this slice

The home preview showcased one artwork pair. The notebook combined stored records, lesson controls and supplementary routes. Visitors lacked a public, non-personalised view of the available content before choosing an activity. `/explore` now provides that editorial index rather than adding another shallow lesson.

## Scope

- App-router-aware section links for artwork comparison, interactive observation and flavor reading.
- Existing comparison titles and eight lesson titles/minutes are imported from their canonical modules, not duplicated in a second catalogue.
- Eleven direct destinations: two existing comparison pages, eight notebook deep links, one flavor example page. These are different formats, not eleven equivalent courses.
- Separate doorway to the existing room's twelve questionnaires and cross-domain connections.
- Navigation replaces the duplicated home-connection shortcut with a catalogue entry available on mobile too. The original connection target remains on home and linked in the catalogue. Home artwork preview also links here.
- Server-rendered page, no new storage, personalisation, filters, analytics, APIs or progress model. Existing global account/provider behavior remains unchanged.
- Cards distinguish unsaved comparison/reading from notebook entries. Notebook local storage and explicit signed-in server-save control are described separately. Survey results are bounded weighted summaries, not psychological diagnoses.

## Content and rights

Original navigation/editorial copy only. No newly copied images, audio, institutional worksheets, translations or new scientific claims. Existing destination pages retain their source/rights disclosures; flavor concepts and original-example boundary are documented in FLAVOR_LANGUAGE.md. Imported activity labels remain the existing authored content. Estimated times are editorial estimates, not measured completion or efficacy claims.

## Verification

Unit tests cover all current destinations, one h1, labelled sections, semantic anchors and storage disclosures. Browser script exercises keyboard entry and jump links, active nav, 320/768/1280px horizontal reflow, HTTP success of all eleven destinations, flavor route back/reload and unchanged synthetic notebook/profile records in Chromium, Firefox and WebKit. Chromium additionally runs axe WCAG A/AA checks. Public smoke now covers twelve routes. Full application regression, typecheck and build are required in CI. Automated layout checks are not physical-device or screenreader speech verification; no live user records are touched.

No deployment or merge. This slice does not close operational backup, account, policy or physical-device release gates.

## History regression

The new browser test reproduced a back-navigation failure after native fragment navigation and opening flavor: the URL returned to `/explore#read-content` while the catalogue did not render. Waiting for the outgoing route URL did not resolve it. Section jumps now use the same Next Link routing as page destinations, preserving framework history state. The original back/reload assertion remains, without bypass or forced reload as a substitute for back navigation.
