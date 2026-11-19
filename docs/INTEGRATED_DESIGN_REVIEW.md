# Integrated pixel review — 2026-11-16

## Evidence

Twelve actual CI-rendered PNGs from artifact14224133390, run43862944704, candidate4076393d9aa25b3930beabca643e1553b5a221fc were downloaded and visually inspected: home, public catalogue, notebook and light/edge comparison at390,768,1280 CSS pixels. Full-page overviews and top/detail crops were used. This is a newer combined-candidate review, not a description of current production.

## Findings

- Warm paper, cobalt text, local Korean fonts, consistent rounded controls and artwork/caption treatments form a coherent visual language across the four page types. No new palette or asset set is justified merely to claim redesign.
- At390px the header wraps, primary actions remain readable, comparison images retain whole-image proportions and source/rights links remain adjacent. At1280px home uses artwork/return columns and notebook uses three path columns. Catalogue grouping remains legible at all sampled widths.
- At768px the two-row fixed header leaves minimal clearance above the first content on home/notebook/comparison; explicit640px capture is added to inspect the lower breakpoint rather than assuming those layouts are safe.
- **Actionable hierarchy problem:** the390px notebook is6443px tall. All three multi-activity study paths are expanded before the individual activity catalogue. These optional paths dominate the initial journey and repeat material now independently discoverable through `/explore`.

## Bounded correction

Keep the three paths and their existing completion-aware controls intact, but place only that grid inside a native, initially closed disclosure. The summary names its purpose. Artwork comparison, flavor entry, rotating spotlight and individual activity catalogue remain outside it. No saved user preference is introduced, no record is changed, and no path is deleted. This prioritises the notebook's single-activity task while retaining deeper exploration on demand.

Regression includes closed initial state, all path titles preserved, independent comparison/flavor links, and keyboard Enter opening/closing in the capture run. Final screenshots and CI are checked separately after publication. The original screenshot height is evidence of density, not a measured task-time or retention result.

## Limits

This is an assistant editorial/design review of real pixels, not a human-user aesthetic endorsement. It does not establish physical-phone touch, actual Safari, screenreader speech, audible audio, every saved state or every dialog. Existing synthetic lifecycle and accessibility suites remain required. No production account/data, deployment or merge is involved.

## Follow-up actual640px finding

Artifact14225695841 from candidate7b656321536272f84f58e00deb09a170d8d8a484 showed that at640px the fixed header wraps to three rows and visibly covers the home/notebook heading. The earlier390/768/1280 samples did not reveal this. A shared tablet-width main-content offset now reserves the additional wrapped rows, preserving existing mobile in-flow and desktop spacing. The capture script asserts at least16px heading clearance below the header at640/768px. This is a bounded layout fix, not proof of every possible zoom/font/device setting.

The revised390px notebook screenshot measured5141px versus6443px before the disclosure change. This is a1302px reduction in the initial page, not an asserted usability or retention percentage. The native summary visibly retains keyboard focus and can reopen all paths.

## Separating test lifecycle from application errors

The retained notebook browser suite intermittently logged WebKit RSC access-control failures after fake pagehide/pageshow events. Installed Next15.5.29 source shows pagehide aborts the shared RSC fetch controller, while pageshow replaces it; late fetch catches inspect the current controller. Dispatching both without actually leaving the document can therefore create an inconsistent app-router lifecycle. This is evidence of a test-induced cancellation path, not proof of a production CORS policy problem.

The real Web Audio browser check now simulates background visibility via a temporary document.hidden descriptor, restores it, and verifies closure/no automatic resume/explicit replay. It no longer fakes an app-wide unload while retaining the page. Every pageerror still fails the suite; no CORS setting or error filter is relaxed. Component tests retain the separate pagehide stop/cancellation assertion. Browser-level real unload/audio audibility remains a distinct limit, not silently relabelled as verified.
