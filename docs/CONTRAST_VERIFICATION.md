# Visual claim verification

2026-11-12. Product audit ranked three substantive gaps: (1) verifiable observations inside lessons, (2) keeping artwork details and prompts together, (3) clarity between survey results and learning activities. This release addresses the first and one confirmed routing defect from the third.

The contrast lesson now lets visitors neutralize both backgrounds while keeping both center squares exactly #7e948c. It retains the original slider value and explicitly restores the original view. While the temporary, unrecorded condition is active, choices, slider, resets and final save are disabled. Stage/lesson changes reset the condition. Completed records stay read-only. Visible and accessible descriptions both identify the current condition.

Source checked: https://www.exploratorium.edu/snacks/color-contrast, accessed2026-11-12. The source supports the general principle that surrounding colors affect apparent color. Its activity text/images carry CC BY-NC-SA; this feature uses original interface, copy and existing SVG, not copied worksheets or imagery. No claim of validated learning effects, uniform perception, or ability measurement. No personal responses were used for research.

Also fixed: completed DomainExplorer entries labelled '내 결과 다시 보기' previously called the questionnaire-start handler. They now open the saved result; new domains still open questions. Illustrated room object behavior is unchanged. Home copy now accurately describes changing light/dark contrast, rather than moving a light source.

Checks:147 tests, typecheck, production build; regression tests cover identical centers, neutral/current accessible labels, exact setting restoration and no writes, completed-record verification/reopening, and completed-domain result routing. Live keyboard/layout verification remains separate. Actual375px rendering has not been verified.
