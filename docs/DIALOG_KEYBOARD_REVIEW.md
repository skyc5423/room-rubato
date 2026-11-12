# Native disclosure access inside the room dialog

The previous focus-boundary selector omitted native `summary`. The unavailable-result disclosure precedes retry/close, so Tab from the initially focused panel skipped it; reverse wrapping at retry also bypassed it. Question-to-result transitions could leave focus outside the panel and escape the custom boundary check.

The real RoomDialog now considers native summary/textarea and nonnegative explicit tab stops, filters disabled (including disabled fieldset descendants), hidden/inert, layout-hidden and visibility-hidden controls, and excludes closed-details content except its first direct summary. Positive tabindex order precedes ordinary DOM order. Boundaries wrap; interior Tab and native Enter/Space are not intercepted. If focus is outside after a content transition, the next Tab brings it inside. An empty tabbable set keeps focus on the panel. No disclosure open state, record, answer or scoring state is changed.

Escape still uses the latest close callback; body overflow/listener cleanup is preserved. Opener restoration now uses connectedness and actual focus capability, so focusable SVG room objects as well as HTML buttons can receive focus back; detached elements are not targeted.

Guidance: W3C APG dialog modal pattern https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ ; keyboard access https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html . This is a bounded repair for current controls, not a general-purpose browser tabbability library or a full accessibility certification.

Tests mount the actual RoomDialog and its actual effect/listener through React test renderer, mocking only portal transport and DOM APIs. They cover summary boundaries, unintercepted native keys/interior navigation, hidden/disabled/closed descendants, opening details, outside focus, empty state, positive tabindex, latest Escape callback, overflow/listener cleanup, and HTML/SVG/disconnected opener restoration. The small DOM adapter does not execute real browser layout, native Tab movement or disclosure expansion; live browser verification remains a separate release check.

Verification: 346 tests / 52 files, TypeScript, CAS/cloud-enabled production build, and all 10 local HTTP smoke routes passed. No live records, authentication, or publication actions.
