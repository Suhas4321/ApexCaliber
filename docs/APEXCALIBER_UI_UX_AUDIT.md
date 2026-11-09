# ApexCaliber UI/UX audit

Updated 9 November 2026. Scope: the React frontend in this repository, with a browser pass on the local build. This is a code and interaction audit, not a study with learners or a full accessibility certification. Earlier proposals in `FRONTEND_DESIGN_AUDIT_AND_PLAN.md` predate several shipped changes; use this document for the current state.

## Skill verification

| Requested skill | Previously installed? | Previously used in ApexCaliber? | Action this audit |
| --- | --- | --- | --- |
| `frontend-skill` (attributed to OpenAI) | No. It is absent from the official OpenAI curated catalog checked on 9 November 2026. | Unable to verify; no matching repository reference or commit. | Did not install a third-party namesake as an official skill. Applied the product's existing visual direction directly. |
| `web-design-guidelines` (Vercel) | No. | Unable to verify; no matching repository reference or commit. | Installed from `vercel-labs/agent-skills`; applied its focus, form, keyboard, progress, and responsive guidance. |
| `vercel-react-best-practices` (Vercel) | No. | Unable to verify; no matching repository reference or commit. | Installed from `vercel-labs/agent-skills` (`skills/react-best-practices`); applied targeted state and request-lifecycle guidance. |
| `vercel-composition-patterns` (Vercel) | No. | Unable to verify; no matching repository reference or commit. | Installed from `vercel-labs/agent-skills` (`skills/composition-patterns`); reviewed component boundaries and kept the small changes in existing shared components. |
| `playwright-interactive` (OpenAI) | No. The separate `playwright` CLI skill was already installed. | Unable to verify; no matching repository reference or commit. | Not installed or used: its official instructions require `js_repl` and disabled sandboxing, which this session does not provide and this brief prohibits. Used the in-app browser for desktop/mobile checks. |

The local `playwright` and `security-best-practices` skills were installed in the previous account-flow work. Their presence is not evidence that any of the five skills above had been applied. No project `AGENTS.md` was found. The Git history shows many prior UI changes but no reliable attribution to these named skills.

## Assessment

| Area | Current assessment | Evidence and decision |
| --- | --- | --- |
| Dashboard/navigation | Minor improvements needed | `frontend/src/pages/Dashboard.tsx` keeps a compact 4-column citadel grid and visible first map camp, shipped in `b75df96` and `28346fc`. `frontend/src/App.tsx` still lacked a skip link; added one. Header controls were recently regrouped in `ed10c7f`. |
| Citadel/world selection | Good | `Dashboard.tsx` directs non-DSA students to the concept route before the map; DSA retains practice-first behavior. The 8 compact citadel cards fit above the mountain map at desktop width. No card redesign was justified. |
| Lesson workflow | Minor improvements needed | `frontend/src/pages/LearningPathPage.tsx` and `LessonPage.tsx` already teach through Understand → Explore → Check. Stage changes could leave the reader at the previous scroll location; fixed focus/scroll positioning. A stale route request could show another citadel briefly; fixed request cleanup. |
| Coding/algorithm visualizations | Minor improvements needed | Heavy workspaces are lazy-loaded in `frontend/src/main.tsx`; visualizer code remains large and has many bespoke controls. No execution or trace contracts were changed. A full keyboard/playback audit is still warranted. |
| Progress/achievement | Minor improvements needed | The concept route showed `n of m` visually but its bar lacked progress semantics. Added an accessible progressbar in `LearningPathPage.tsx`. Backend still treats checks as completion, not durable mastery. |
| Typography/color/spacing | Good with minor cleanup | `frontend/src/index.css` has a restrained neutral canvas, supporting panels and citadel accents. IBM Plex Sans, Condensed and JetBrains Mono give the product a consistent voice. The 60–30–10 rule is already reflected loosely; measuring pixels to enforce it would not improve learning. A mobile keycap styling conflict was fixed. |
| Mobile/tablet | Minor improvements needed | The hosted sign-in form was brought above the fold in `ed10c7f`. This audit checked the lesson at 390px and the concept route at 768px. The lesson was readable; the tablet header overflowed until the progress HUD was reserved for wider screens. The full question workspace and every simulation still need a dedicated small-screen pass. |
| Motion/transitions | Minor improvements needed | `frontend/src/pages/PatternFinder.tsx` uses reduced-motion aware page changes; the procedural sky also checks the preference. Some older components still use `transition-all` and bespoke motion. Avoid adding decorative effects until these are consolidated. |
| Accessibility/keyboard | Major improvements needed | Visible global focus styling existed in `index.css`, but there was no skip link. Finder shortcuts activated while another button/link held focus, and its hint advertised impossible shortcuts above 9. Fixed these. A broader automated and manual accessibility audit remains. |
| Loading/empty/error/success | Minor improvements needed | Shared Skeleton/ErrorNote/ErrorBoundary exist in `frontend/src/components/ui.tsx` and `ErrorBoundary.tsx`. An invalid Finder bookmark previously crashed to a generic error screen; it now preserves the last valid step with a recovery action. |
| Component reuse/performance | Minor improvements needed | Shared button styles and route-level lazy imports exist, but `frontend/dist/assets` still contains a roughly 732 KB entry chunk and a roughly 2.6 MB editor chunk before compression. `LearningPathPage.tsx` now ignores stale responses on citadel changes. Profile production bundles before splitting more code. |
| Overall learning experience | Minor improvements needed | Beginner concept routes and a one-request system-design primer were shipped in `0859f60`, `33334d7`, and later content commits. The lesson library is still much smaller than the challenge bank; teaching coverage and learner testing are the main remaining risks. |

## Representative browser checks

- At 1280px, Networking concept route begins at the first lesson and the lesson shows Understand → Explore → Check. After clicking **See examples** and **Check understanding**, the new step moved into view and received focus.
- At 390px, the lesson check cards fit the viewport. The stray `Ctrl K` keycap in the compact header was found and corrected in CSS. At 768px, the header initially crowded out its account controls; the progress HUD is now limited to wide screens.
- `/finder?path=bad` originally rendered an uncaught `Cannot read properties of undefined` error. It now shows the starting question and a **Start again** recovery action. A normal Finder choice still advances and updates the URL.
- Browser screenshots were inspected during the audit. They were not saved as repository files. A real hosted email sign-in remains untested because no Supabase project is configured locally.

## Remaining priorities

1. **High:** Run a dedicated accessibility and responsive pass on the question workspace, System Design simulations, dialogs, and 200% zoom. Fix keyboard traps, control labels, contrast, and overflow found there.
2. **High:** Test the beginner route with actual first-time learners. Observe whether they can explain an idea in a new setting and resume without help; do not infer learning from UI polish or two correct checks.
3. **Medium:** Profile the entry bundle and the editor download, then split only proven bottlenecks. Preserve the current route-level lazy loading.
4. **Medium:** Consolidate older `transition-all` and playback controls into reduced-motion aware, task-focused primitives where they cause visible inconsistency.

Concrete code findings still open:

- `frontend/src/pages/SystemDesignPage.tsx:81` and `frontend/src/pages/SystemDesignPage.tsx:166` — resize separators are pointer-only; add keyboard resizing and an accessible value, or make width a simple preset control.
- `frontend/src/components/motion/MotionGraphicPlayer.tsx:359` — timeline uses `transition-all` and changes height on hover; verify its focus treatment, touch target, and reduced-motion behavior during the dedicated playback pass.
- `frontend/src/components/vendor/chat/chat-composer.tsx:25` — default autofocus may raise a phone keyboard when the composer appears; inspect its actual call sites before changing the vendored component.

## Sources

- [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md)
- [Vercel agent skills](https://github.com/vercel-labs/agent-skills)
- [OpenAI curated skills](https://github.com/openai/skills/tree/main/skills/.curated)
- [OpenAI Playwright Interactive preconditions](https://github.com/openai/skills/blob/main/skills/.curated/playwright-interactive/SKILL.md)
