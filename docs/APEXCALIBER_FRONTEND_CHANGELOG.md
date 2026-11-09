# ApexCaliber frontend changelog

## 9 November 2026 — targeted learner-flow and accessibility pass

- Added a keyboard skip link and a focusable main landmark in `frontend/src/App.tsx`.
- Kept tablet account controls visible by showing the progress HUD only when the header has room in `frontend/src/App.tsx`.
- Made concept-route titles name their citadel and exposed the completion bar as an accessible progressbar in `frontend/src/pages/LearningPathPage.tsx`.
- Cleared stale concept-route state and ignored late responses when switching citadels in `LearningPathPage.tsx`.
- Kept a new lesson stage in view and moved keyboard focus to it when learners advance, review or use the step navigator in `frontend/src/pages/LessonPage.tsx`.
- Validated Finder deep links against the authored decision tree. Invalid or stale links now recover at the last valid step with a restart action; keyboard shortcuts no longer activate while another control has focus, and hints only advertise supported keys. See `frontend/src/lib/patternFinder.ts` and `frontend/src/pages/PatternFinder.tsx`.
- Fixed a CSS specificity conflict that exposed the desktop `Ctrl K` keycap in the mobile header in `frontend/src/index.css`.
- Removed sign-in email autofocus on mobile and added an input name and disabled spellcheck in `frontend/src/pages/SignInPage.tsx`.
- Added focused path-validation tests in `frontend/tests/pattern-finder-path.test.mjs`.

The UI/UX rationale and remaining priorities are in `APEXCALIBER_UI_UX_AUDIT.md`. The current visual contract is in `APEXCALIBER_DESIGN_SYSTEM.md`.

## Previously shipped improvements preserved

- `ed10c7f`: login-first hosted entry, saved-session return path, responsive sign-in, and a header that collapses before crowding account controls.
- `b75df96` and `28346fc`: compact citadel cards, visible first map camp, and refined homepage identity.
- `33334d7`: a one-request system-design introduction and focus mode.
- `0859f60`, `e4d3000`, `cc222cb` and related content commits: concept-first beginner routes for OS, DBMS, networking and other non-DSA citadels.

Those systems were not redesigned again in this pass.
