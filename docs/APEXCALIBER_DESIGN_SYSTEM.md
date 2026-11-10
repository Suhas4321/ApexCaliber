# ApexCaliber frontend design system

Updated 10 November 2026. This records the current implementation and decisions for future screens. `frontend/src/index.css`, `frontend/src/pages/StudyPages.css`, `frontend/src/components/ui.tsx`, and `frontend/src/lib/citadels.ts` are the code sources of truth.

## Design intent

ApexCaliber should feel like a focused study desk: quiet reading surfaces, one obvious next action, and subject identity as a small orientation cue. The question, example, code, and diagram carry the attention. The mountain metaphor is no longer the primary learning route.

The 60–30–10 rule is a review heuristic, not a measured requirement. The existing page is already dominated by a neutral canvas, with panels carrying content and restrained accents marking action/status. Do not add more colored cards to satisfy a ratio. Check contrast and hierarchy before decorative color distribution.

## Current tokens

| Role | Dark | Light | Use |
| --- | --- | --- | --- |
| Canvas | `--surface-0: #141B18` | `#F6F7F3` | Page background |
| Panel | `--surface-1: #1C2520` | `#FFFFFF` | Reading surfaces and cards |
| Inset | `--surface-2: #26312A` | `#EEF1EA` | Inputs, wells and secondary controls |
| Primary text | `--text-1: #F1F4EF` | `#1E2A22` | Headings and body emphasis |
| Supporting text | `--text-2: #BEC9BE` | `#526357` | Descriptions and labels |
| Main action | `--study-accent: #A8D5AF` | `#245C42` | Primary next-step control and focus |
| Semantic status | `--viz-*`, success, amber, crimson | Theme equivalents | Meaningful state with text/icon, never color alone |

Subject accents come from `frontend/src/lib/citadels.ts`; they identify a learning area. Do not recolor every action in a lesson. Legacy color aliases in `index.css` now map to the study palette; future code should prefer semantic names.

Typography: IBM Plex Sans for body and controls, IBM Plex Sans Condensed for headings, JetBrains Mono for code and compact numeric labels. Body copy is 17px with 1.6 line height; lesson prose should stay around 68–75 characters per line. Diagrams and code may use wider space. Existing global `:focus-visible` uses the current peak accent.

## Layout and controls

- `/app` puts a clear next step first, then lets learners choose a subject. Subject pages show foundation modules and practice topics without a required mountain map. The public `/` homepage has its marketing layout documented in the project-root `DESIGN.md`.
- Concept routes show one recommended next lesson and a visible prerequisite sequence. Lessons use Understand → Explore → Check. A stage change should move focus and scroll to the new content.
- Use `Button` from `frontend/src/components/ui.tsx` for reusable actions where its variants fit; links remain links. Utility controls in the header have a separate compact rhythm. The full navigation collapses into More before it crowds account controls.
- A visible primary action is usually enough per region. Use panel borders and spacing to group content; avoid layering extra glass, shadow or gradients around every paragraph.
- Provide an explicit label for icon-only controls, a focus indicator, disabled-state reason, and text feedback for success/error. The global skip link reaches `#main-content`.
- Treat mobile as a first-class reading mode: primary action in the first viewport, content at full width with side padding, controls that do not wrap into tiny fragments. Hide decorative keyboard hints when the compact header needs space.
- Motion should explain state changes. Respect reduced-motion preferences and keep teaching playback pauseable and slow enough to narrate; never rely on autoplay to convey the only explanation.
- Reserve a homepage demo region, but wait to build the final motion graphic until the interior lesson and editor layouts are settled.

## Component boundaries

Keep navigation shell, learning route, lesson stages, Finder decision tree, and system-design simulations in their existing feature areas. Extract a shared component only when behavior and visual contract are truly shared; do not create a prop-heavy universal card. Keep curriculum data and API contracts out of presentational components. Route changes must ignore stale async responses before updating visible state.

## Review checklist

Check desktop, 768px tablet, 390px mobile, 200% zoom, keyboard-only navigation, reduced motion, dark/light themes, long titles, empty/error states, and a returning learner. Confirm that a new student knows where to start and that changing a step leaves the next heading in view.
