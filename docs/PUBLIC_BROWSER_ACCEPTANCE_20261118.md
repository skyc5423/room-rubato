# Public browser acceptance, 2026-11-18

Checked the existing canonical production site, not a deployment of the pending draft PR. No code was deployed, signup/login submitted, consent checked, survey answer selected, note edited, bookmark saved or user record reset. Tests used public guest pages only.

## Observed in the live cloud Chromium browser

- Canonical home opened logged out. The account panel showed its consent and Google/email options. No authenticated Room Rubato session was reused; no credential/OTP request was initiated.
- Music lesson opened from the notebook. Audio was initially stopped, Stop disabled. Clicking the reference-beat control changed its checked state and showed playing/Stop enabled. Explicit Stop returned it to idle. This proves observable playback controls, **not audible sound, amplitude or real-device speaker behavior**.
- Native browser zoom at 200% produced a measured 582 CSS-pixel viewport without document horizontal overflow. At 300%, a supported native window-edge resize produced **375 CSS pixels**. DOM measurement confirmed `clientWidth=scrollWidth=375` on home, the music lesson and the light/edges comparison. Screenshots were visually inspected. This is a real desktop browser reflow/zoom check, **not a physical phone, touch interaction, mobile Safari or exhaustive mobile acceptance**.
- At 375 CSS pixels, Enter expanded the sound-free rhythm explanation and focus remained on its SUMMARY element. Enter on the skip link moved focus to MAIN#main-content.
- The artwork detail control changed the image's accessible description to the selected detail and pressed state to true. Space returned it to the whole image and false state while retaining focus. The screenshot showed the visible focus ring and readable source/reproduction limits.
- Original browser zoom (100%) and window width were restored; measured viewport returned to 1165 CSS pixels.

A Playwright role selector did not match the native SUMMARY despite the accessibility layer describing it as a button. The observed exact-text locator exercised native Enter successfully; this was a locator mismatch, not a user-facing broken control.

## Remaining limits

The available execution-environment list contains only the cloud computer, not the user's Mac or a phone. This does not substitute for physical-device audio, screen-reader testing, touch targets, actual mobile Safari auth return, two-device synchronization or two-real-account isolation. Those remain unverified. The earlier intermittent Firefox hydration #418 remains unresolved; these Chromium public checks do not fix or disprove it.

The current UI's public state cannot prove Google publishing/branding/redirect configuration. Actual alert delivery is also separate: root chat messages are a usable messaging path, but the operational monitor has not yet invoked that path end to end. No new framework or expanded product feature was added for these checks.
