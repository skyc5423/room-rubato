# Survey step orientation

The dialog trapped focus correctly, but answering replaced the current option labels
without moving focus to the new question. A keyboard/screen-reader user could encounter
a changed answer without its new prompt. The standalone domain flow had the same gap.

Question and result headings now receive programmatic focus on step/mode changes,
without being added to the normal Tab sequence. Focus is scrolled into view; the dialog
still restores its opener on close. Choices, scoring and storage formats are unchanged.

Evidence: regression test failed before the change; both entry points are tested.
The Chromium CI journey completes a survey, checks question/result focus and revisits
the saved result after reload. This does not certify assistive-technology announcements.

Design references (primary guidance, adapted to this single-page flow):
- https://www.w3.org/WAI/tutorials/forms/multi-page/
- https://www.w3.org/WAI/WCAG21/Understanding/focus-order
