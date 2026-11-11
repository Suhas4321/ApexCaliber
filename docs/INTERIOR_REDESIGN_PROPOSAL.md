> Status: Direction A approved and implemented. See `../DESIGN.md` and `../UX-CONTRACT.md` for the current contract. Other directions below remain exploration history.

# ApexCaliber interior design proposal

Status: concept exploration awaiting the user's choice. No application code is changed by this proposal. The current runtime design remains documented in DESIGN.md until a direction is selected.

## Design judgment

The previous pass improved clarity but lost too much character. Uniform cards, broad empty areas, and quiet colors alone do not make a distinctive learning product. The next direction should combine disciplined reading layouts with custom visual explanations, stronger typography, purposeful depth, and precise interaction feedback.

Cream and green is not inherently the best palette. For this product, my recommendation is cool neutral surfaces with cobalt actions, supported by a coherent dark counterpart. Two alternatives are included so the choice is concrete.

The signature should be **a concept coming to life**: array pointers, a request moving through an API, or rows joining in a database. These are subjects the product already teaches. This gives the interface personality without inventing an unrelated game world.

## What was inspected

- Routing and navigation: `frontend/src/main.tsx`, `App.tsx`, `AccountMenu.tsx`, `CommandPalette.tsx`.
- Learning home and subject entry: `Dashboard.tsx`, `WorldPage.tsx`, `LearningPathPage.tsx`, `lib/citadels.ts`.
- Lesson presentation and existing phases: `LessonPage.tsx` (Understand, Explore, Check).
- System Design's navigation tree, reading canvas, table of contents, and resizable panels: `SystemDesignPage.tsx`.
- Progress: `StatsPage.tsx`; interview preparation: `ResumeGrill.tsx`.
- Public entry: `LandingPage.tsx`; account flow from the preceding implementation.
- Shared tokens and components: `index.css`, `StudyPages.css`, `components/ui.tsx`.
- Existing animation/material tools: Motion, GSAP, Lucide, `GlassSurface`, `PlaybackDock`, teaching visualizers, vendored Magic UI and React Bits components.
- Current DESIGN.md and historical `frontend/DESIGN_REFERENCES.md`.
- Live local entry was inspected; it correctly required sign-in. Authenticated layouts were reviewed from source in this round, not claimed as a fresh authenticated browser audit.

### Concrete issues the proposal addresses

1. The learning home presents subjects as near-identical text cards. Subject content can supply more distinctive visual identities.
2. The next-step panel has insufficient visual distinction from the rest of the page.
3. Shared buttons coexist with page-specific button markup and different sizes, corners, and state treatments.
4. The shell, System Design, and full-screen tools follow different navigation/scroll conventions.
5. Command search still contains older names such as Journey map, Worlds, and Grimoire, while newer screens use learning-oriented terms.
6. The playback dock still has pulse rings and colored glow that do not match the quiet study surfaces.
7. The theme has multiple aliases and historical palette descriptions. `frontend/DESIGN_REFERENCES.md` contradicts DESIGN.md and even remains referenced by index.css. Reconcile these after selection; do not keep two active specifications.

## Three visual directions

Concept previews: [A — Cobalt Studio](design-concepts/a-cobalt-studio.png), [B — Graphite Lab](design-concepts/b-graphite-lab.png), [C — Signal](design-concepts/c-signal.png). The [generation prompts and art-direction review](design-concepts/README.md) preserve how these were produced and which generated details need refinement.

| Direction | Canvas and surfaces | Action and type | Character |
| --- | --- | --- | --- |
| A — Cobalt Studio, recommended | Cool platinum #F3F5F9, white #FFFFFF, pale blue wells #EDF2FF | Cobalt #315EFB, ink #162033; Sora headings, Inter body, JetBrains Mono code | Bright and inviting, with precise technical diagrams and a small frosted playback control |
| B — Graphite Lab | Graphite #101319, charcoal #191E27, elevated #222A35 | Amber #E6A44B, off-white #EDF1F7; IBM Plex Sans and JetBrains Mono | Focused developer studio, with layered surfaces and one warm visual focal point |
| C — Signal | White #FFFFFF, cool gray #F5F6F8, charcoal sidebar #1C2028 | Vermilion #D94E38 as detail, charcoal main action; Manrope and JetBrains Mono | Bolder editorial structure, stronger contrast, technical line illustrations |

These are alternatives, not three unrelated themes to combine. A chosen direction receives consistent light/dark versions. Each will keep category cues secondary to the primary action color. Green remains available for success and red for errors; a brand color is not a replacement for status semantics.

Basic contrast calculations: white on cobalt #315EFB is 5.09:1; ink #162033 on #F3F5F9 is 14.93:1; graphite text on amber is 8.66:1. For A, use #687487 rather than the lighter exploratory #6C788C for small metadata. For C, use #C44230 when red is a filled control with white text (5.04:1); #D94E38 remains illustration/accent detail. Real composited surfaces and focus indicators must still be checked in the browser.

The 60:30:10 idea is a visual weighting guide: dominant neutral canvas, supporting surfaces, restrained emphasis. It is not a requirement to fill exactly 10% of a study page with accent color.

## Placement and visual system

- Desktop shell: approximately 216px navigation rail, 64px contextual header, flexible main canvas with a 1200px content cap. Collapse the rail on narrower laptops; use a labeled drawer on phones.
- Logo: small summit mark and wordmark at the top of the navigation rail; it returns to Learning home. Avoid duplicated logos in the same viewport.
- Global navigation: Learning home, Subjects, Practice, Progress; Interview prep and tools grouped below. Existing tool routes remain reachable. A subject route reveals its curriculum locally rather than adding a second full global sidebar.
- Search: one quiet command trigger in the header; keyboard hint adapts to the OS. Account avatar remains at the right, with Log out inside its menu. No notification bell without real notifications.
- Type: 34–40px page headings, 22–26px section headings, 16–18px lesson prose, 14–15px controls, 12–13px secondary metadata. Code labels are monospaced; prose is not.
- Spacing: 4px base rhythm, 8/12/16px within controls, 24/32px in panels, 40/48px between major sections. Align text baselines and icon centers.
- Shape: 8px controls, 12px panels, 16px feature stages; pills reserved for compact status/filter choices. Use line weight and surface tone to establish hierarchy before shadows.
- Icons: Lucide at consistent 16/18/20px sizes. Pair unfamiliar icons with labels. Preserve the summit mark as the brand; no new mascot.

## Screen-by-screen plan

| Screen | Proposed composition | Distinctive detail | Existing function/content retained |
| --- | --- | --- | --- |
| Public homepage | Strong editorial hero, one clear sign-in path, product method and subject sections | Selected palette and typography; reserved product demonstration frame | All existing learning claims must stay accurate. Final motion demo remains deferred until the interior is approved |
| Sign-in | Restrained split composition with one aligned form and a small learning illustration | Small input focus and submit feedback; no moving background while typing | Local account setup/sign-in, password-manager support, errors and account persistence |
| Learning home | Heading, one strong continue module, then illustrated subject covers | Preview of an existing concept in the continue module; subject diagrams react to hover/focus | All current subjects, next step, progress links and tools; no fabricated metrics |
| Subject landing | Subject identity, next lesson, syllabus overview, practice topics | One subject-specific technical diagram; short module summaries | Category differentiation, all modules, topic guides and question links |
| Curriculum | Compact grouped modules with clear lesson state and prerequisites | Animated disclosure that preserves the learner's place | Current order, prerequisites, completed checks, and return-to-practice context |
| Lesson | Readable central column, compact curriculum, optional contextual example panel | Existing Understand / Explore / Check selector; relevant teaching model becomes the visual focal point | Every explanation, definition, worked example, second setting, misconception, check and source |
| Topic/question listing | Clear rows with title, pattern, difficulty, state and one entry action | Quiet hover/focus row treatment and concise topic identity | All questions and guides. Question workspace itself is excluded from structural redesign |
| System Design | Shared shell; curriculum panel can collapse into focus-reading mode; optional contents rail | Architecture diagrams animate when the learner plays a simulation | SOLID, LLD, HLD, simulators, completion and all written material |
| Progress | Readable record with subject progress and actionable review sections | Small transitions on genuine data changes; activity tooltips with keyboard access | Current activity, reviews, weak areas and completion data, without invented mastery claims |
| Interview prep | Scenario list beside the selected discussion; progressive sections | Question, reasoning and answer reveals have deliberate pacing | All existing scenarios, scripts, architecture explanations, code, and follow-up material |
| Pattern Finder | One question at a time with an always-visible route back | Selected choice and transition clarify the decision tree | Current decision logic and recommendations |
| Playground / guide overlays | Shared tools and panel styling, consistent close/focus behavior | Compact playback control and clear running/completion states | Trace functionality, editors, revision content and local behavior |
| Empty/error/loading | Screen-specific recovery with consistent component geometry | Stable skeleton or spinner, clear retry; no endless decorative animation | All existing routes and recoverable error paths |

## Motion, glass and interaction decisions

| Detail | Decision and purpose | Proposed timing / constraint |
| --- | --- | --- |
| Navigation selection | Active indicator moves between destinations to show location | 160–200ms; no bounce |
| Primary button | Color deepens on hover, arrow shifts a few pixels, slight press feedback | 120–160ms; fixed width during loading |
| Subject cover | A short diagram transition previews what the subject teaches | Once on hover/focus, 400–700ms; static equivalent on touch |
| Lesson step selector | Shared selected background and gentle content transition | 180–240ms; focus moves to the new section appropriately |
| Disclosure | Smooth height change for syllabus groups or answers | Around 180ms; keep layout and scroll position predictable |
| Teaching visualizer | Motion represents an actual value, packet, pointer or relationship | Play/pause and step controls; no unrelated ambient loop |
| Glass | Use sparingly on a floating header or playback capsule above a visual stage | Blur with opaque fallback. Never nested. Validate contrast at the lowest opacity |
| Reading surfaces | Solid surfaces keep paragraphs, forms and code legible | No refraction beneath text |
| Scroll | Native scrolling with a subtle sticky context header where useful | No scroll hijacking, forced snaps, or parallax behind lessons |
| Loading | Reuse existing skeleton geometry where the final structure is known; compact spinner otherwise | Delay decorative loading presentation to avoid flashes; preserve content footprint |
| Menus/search | Short opacity/position transition, clear focus/selected row, reliable Escape | 120–160ms; focus restoration and keyboard navigation |
| Completion | Small checkmark transition and contextual next step | No full-screen celebration by default |
| Reduced motion | Preserve meaning through static selection and opacity changes | Disable spatial transitions and looping illustration playback |

Liquid glass is a material choice, not the design concept. Its best place here is a small control layer over a teaching illustration, where translucency communicates layering. The visual identity comes from typography, layout, diagrams and controlled contrast.

## References and what to take from each

- [Linear's application redesign](https://linear.app/now/how-we-redesigned-the-linear-ui): sidebar/header alignment, surface hierarchy, restrained chrome, testing complete screens together. Reviewed the product screenshot and design rationale.
- [ExpertCode](https://expertcode.framer.website/): editorial hierarchy and a subject-specific visual signature. Reviewed the live page. Its marketing composition is a reference for the public entrance, not a literal layout for lessons.
- [shadcn sidebar blocks](https://ui.shadcn.com/blocks/sidebar): coherent responsive navigation composition. Adapt a suitable shell, not its unrelated dashboard metrics.
- [Radix color system](https://www.radix-ui.com/themes/docs/theme/color): separate roles for canvas, subtle fills, borders, solid actions and readable text, with coordinated light/dark scales.
- [Aceternity tabs](https://ui.aceternity.com/components/tabs): selected-state transitions; omit stacked-card theatrics in long lessons.
- [Aceternity stateful button](https://ui.aceternity.com/components/stateful-button): loading-to-success continuity; avoid delayed completion when the operation is already finished.
- [Aceternity liquid glass](https://ui.aceternity.com/components/liquid-glass): material reference for a small floating control, not wholesale application chrome.
- [Magic UI animated beam](https://magicui.design/docs/components/animated-beam): a candidate visual language for actual network/system flow, rather than decorative connections between unrelated cards.
- [Motion layout animation](https://motion.dev/docs/react-layout-animations) and [accessibility](https://motion.dev/docs/react-accessibility): use the Motion library already installed for coordinated transitions and reduced-motion behavior.

No new library is needed merely to make this direction possible. Reuse the maintained React/Motion/Radix/Lucide foundation and existing teaching models. Review licenses and browser performance before adopting external assets or component code; do not download a pack merely to add effects.

## Implementation order after direction selection

1. Choose one direction; refine a learning-home screen and one real long lesson, including dark mode and mobile. Generated concept images are visual explorations, not exact component specifications or evidence of working behavior.
2. Reconcile DESIGN.md and historical references into one maintained contract. Separate brand, category, status, and visualizer tokens; remove misleading palette aliases as consumers migrate.
3. Establish shared shell, type, buttons, cards, tabs, menus, search, tooltips, feedback and motion presets. Make their states reviewable before migrating every page.
4. Migrate learning home → subject → curriculum → lesson as a complete journey. Preserve data, authored text, prerequisites, check rules and saved progress.
5. Migrate System Design, Progress, Interview prep, Finder, and overlays with the same system. Keep the question workspace's structure intact and review any shared-theme impact explicitly.
6. Align the public homepage and sign-in. Finalize the reserved homepage motion graphic only after the real interior UI has been approved.
7. Verify full flows at desktop/mobile widths, keyboard, 200% zoom, both themes, slow loading, errors, long titles and reduced motion. Compare screenshots of sibling pages. Run relevant builds/tests and content validation before pushing implementation.

## This round's deliverables and limits

Three generated concept images and this plan. The images use illustrative lesson labels, not production data. Initial palette contrast calculations were performed. Application files were not edited; runtime builds and full authenticated UI tests are not claimed for these concepts. A final palette and prototype require the user's selection, as explicitly requested.
