# In-page comparison details

2026-11-12, based on b0e5dc1. This closes the comparison journey's detail-inspection gap without adding artworks, questions or storage.

All four local source images were visually inspected and their dimensions checked. Original files and CC0 attribution are unchanged. Each work starts in full-composition view and has its own labelled detail/whole toggle. The editorial observation prompt stays beside the image; captions, source links, resolution limits and image-error fallback remain available in both modes. Controls use native buttons, work-specific accessible names, pressed state and a status label.

Selected pixel windows, all4:3 without stretching:
- Vermeer437881,555×624:235,315 to535,540 includes the pitcher and basin rim.
- Turner437853,599×447:0,180 to352,444 includes left buildings, boats and water reflections.
- David436105,599×399:215,85 to475,280 includes the cup, reaching hands and raised hand.
- Degas436121,600×488:260,75 to600,330 includes flowers, face and the right picture edge. Retaining that edge matters to the gaze prompt.

Detail mode displays a region of the same approximately600px reproduction. It does not fetch a higher-resolution source, create visual information, imply actual object scale or preserve the full composition. It does not collect observations or change notebook records.

Verification:152 tests, typecheck and production build pass; new tests cover crop bounds/aspect ratio, preserved Degas boundary, independent toggles, whole reset, informative alt text, loaded/error states and retained source links. Public smoke checks now include /compare and both comparison slugs. Live browser/keyboard and actual375px visual inspection must be reported separately, not inferred from these tests.
