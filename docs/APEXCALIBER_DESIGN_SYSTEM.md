# ApexCaliber frontend design system

Updated 10 November 2026. This records the current implementation and decisions for future screens. `frontend/src/index.css`, `frontend/src/pages/StudyPages.css`, `frontend/src/components/ui.tsx`, and `frontend/src/lib/citadels.ts` are the code sources of truth.

## Design intent

ApexCaliber should feel like a focused study desk: quiet reading surfaces, one obvious next action, and subject identity as a small orientation cue. The question, example, code, and diagram carry the attention. The mountain metaphor is no longer the primary learning route.

The 60–30–10 rule is a review heuristic, not a measured requirement. The existing page is already dominated by a neutral canvas, with panels carrying content and restrained accents marking action/status. Do not add more colored cards to satisfy a ratio. Check contrast and hierarchy before decorative color distribution.

## Current system

Direction A — Cobalt Studio was approved on 11 November 2026. The authoritative visual contract, exact palette, typography, layout, and token mapping are now in [DESIGN.md](../DESIGN.md). The shared interaction contract is [UX-CONTRACT.md](../UX-CONTRACT.md). Avoid duplicating token values here.

The redesign replaces forest/cream with platinum, white, ink, and cobalt, and replaces IBM Plex headings with Sora plus Inter body text. It adds illustrated subject covers, a sidebar/drawer shell, a user-paced code example, wider syllabus/topic rows, a sticky lesson stepper, and document scrolling in system design. All lesson, question, guide, and interview content remains intact. The question/editor split remains structurally unchanged.

## Component boundaries

Keep navigation shell, learning route, lesson stages, Finder decision tree, and system-design simulations in their existing feature areas. Extract a shared component only when behavior and visual contract are truly shared; do not create a prop-heavy universal card. Keep curriculum data and API contracts out of presentational components. Route changes must ignore stale async responses before updating visible state.

## Review checklist

Check desktop, 768px tablet, 390px mobile, 200% zoom, keyboard-only navigation, reduced motion, dark/light themes, long titles, empty/error states, and a returning learner. Confirm that a new student knows where to start and that changing a step leaves the next heading in view.
