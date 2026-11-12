# Same-origin font assets

## Scope and rationale

Base `abdbc70`. Removes all three routine third-party font stylesheet imports from `src/app/globals.css`. Fonts now load from `/fonts/` on the application's origin. This removes the font-related page requests to Naver's CDN, jsDelivr and Google Fonts; it does **not** mean the application has no other external services/links. No provider, account, response-data, privacy-page, navigation or scoring behavior is changed.

Same named families retained: Wanted Sans Variable, MaruBuri/MaruBuriSemiBold, Cormorant Garamond. Korean serif family aliases and existing font stacks remain unchanged, including existing synthetic bold behavior. Every font face uses `font-display: swap` to keep text available while loading. No blanket font preloads; unicode subsets remain demand-loaded.

## Concrete original defect

The existing Wanted import pointed to `wanted-sans-std/.../split/WantedSansVariable.min.css` at v1.0.3, which returned HTTP404 on 2026-11-12. The official v1.0.3 tree instead has `wanted-sans/.../split/WantedSansVariable.css`, whose declared family matches the app's `Wanted Sans Variable` stack. This candidate restores the intended family from that official package rather than retaining an accidental system-font fallback or silently substituting Wanted Sans Std. Therefore typography can visibly change where the prior failed import caused fallback; live line-wrap review remains important.

## Sources and redistribution

- Wanted Sans v1.0.3: official `wanteddev/wanted-sans` GitHub tree `f4f2f8fd93c19f1399cf5a7d17d05bb4b103ac14`, package `packages/wanted-sans`. Copied its variable split WOFF2 assets and preserved all 92 unicode ranges, weight range400–1000 and its CSS copyright notice. Package OFL.txt included unmodified.
- MaruBuri: unmodified Regular/SemiBold WOFF2 files referenced by the exact original official Naver CSS, `https://hangeul.pstatic.net/hangeul_static/css/maru-buri.css`. Only these two family aliases are used by the app; unused Bold/Light/ExtraLight aliases are not fetched. [Naver's official license notice](https://help.naver.com/service/11029/contents/18088?lang=ko&osType=PC) explicitly applies the same OFL1.1 rules to MaruBuri and allows redistribution with notices/license. Copyright and full bilingual license text from that public page are included, excluding unrelated page content.
- Cormorant Garamond: exact Google Fonts CSS request retained (normal500/600/700; italic500/600; swap). Modern browser response points to v21 WOFF2 unicode subsets;10 unique original files supply the25 face declarations. Google repository `ofl/cormorantgaramond/OFL.txt` included unmodified. Files are not re-encoded or locally subsetted.

The publisher license/copyright files accompany each family in `public/fonts`; public `/fonts/README.txt` provides attribution and license locations. The OFL permissions are used for bundling/redistribution, not endorsement; the fonts are not sold independently. Family names and font binaries are not modified.

## Asset budget and reproducibility

104 WOFF2 assets total **3,440,576 bytes on disk**, not per-page network cost:
- Wanted:92 files,2,281,860 bytes; largest77,896 bytes.
- MaruBuri:2 files,899,884 bytes; largest466,108 bytes.
- Cormorant Garamond:10 files,258,832 bytes; largest39,260 bytes.

`public/fonts/manifest.json` records every official download URL, byte length and SHA-256 digest, retrieved2026-11-12. No binary conversion/subsetting was performed. Tests verify valid WOFF2 signatures, exact hashes, local URL existence, absence of imports/remote CSS URLs, license notices and intended weight/style ranges. The files' actual subset selection depends on characters rendered; no measured speed improvement or measured per-page transfer saving is claimed.

## Validation and limitations

-244 tests across41 files passed; typecheck and production build passed.
-Playwright375px visual/font-network smoke could not run: installed Chromium first lacked writable crashpad config; a temporary config directory resolved that, then sandbox denied `socket()` during browser startup (`Operation not permitted`). No screenshot, computed-font or375px overflow pass is claimed. No security setting changed and no bypass attempted.
-This candidate needs production/browser confirmation of intended font rendering and line wrapping, especially the restored Wanted family. Static tests/build establish assets and CSS wiring, not pixel equivalence or runtime network traces.
-Local production HTTP smoke passed: representative MaruBuri font returned200; emitted stylesheet was served (90,391 bytes) with119 same-origin font references and no remote import. This was a server/CSS check, not a browser network trace.
-Optional fontTools glyph inspection was unavailable because the environment lacks its Brotli decoder. Binary integrity checks compare official download hashes/signatures; no complete glyph-rendering verification is claimed.
