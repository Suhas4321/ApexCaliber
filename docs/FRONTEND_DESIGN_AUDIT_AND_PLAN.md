# ApexCaliber: frontend design audit and implementation plan

Date: 7 November 2026. Status: proposed work, not implemented by this audit.

Implementation branch: `codex/learning-experience-redesign`. Existing redesign work was stashed, the branch created from main, and the stash restored without conflicts. Implementation is deferred at the user's request. Before resuming, incorporate [the identity and prerequisite-first teaching requirements](LEARNING_IDENTITY_AND_FOUNDATIONS.md) into the delivery scope.

## Design judgment

The previous question redesign improves information hierarchy, but the product still combines several design systems. It needs a consistent foundation, a reliable learning sequence and slower, truthful instructional playback before more visual effects. Retain the citadel identity and sense of progress; make reading, reasoning and coding the visual focus.

This is a principal-designer heuristic review with live browser checks and source inspection, not a student usability study or exhaustive certification of every question. Checked the question toolbar, DBMS lesson, Two Sum entry, World 17 return path, and System Design/SOLID/HLD. Inspected both playback implementations, curriculum examples, theme tokens and shared components. Tested the System Design screen at 390px, then restored the viewport. Existing modifications from the earlier redesign remain intact.

## Evidence and priorities

| Priority | Finding | Evidence | Decision |
| --- | --- | --- | --- |
| P0 | First-time DSA entry skips learning | `/q/two-sum` opens Practice. `QuestionPage.tsx` initializes code except for explicit stages; loaded content only switches non-DSA/authored journeys. | Resolve entry through a single learning-state policy. New question → Learn. |
| P0 | Reference answers can appear before an attempt | Interview is immediately accessible; primer uses the target solution trace/code; journey references may use `lab_solution`. | Distinguish teaching examples from the assessed target. Make target answer reveal deliberate and track it as studied, not solved. |
| P0 | System Design playback has a clock bug | `ArchitectureFlowSimulator.tsx` adds `time - lastTimeRef` to accumulated progress every frame, but updates the reference only at a hop boundary. Elapsed time is repeatedly counted. | Correct the clock before tuning speed; make it independent of frame rate. |
| P0 | DSA playback is too quick for explanation | `getMinStepDuration()` uses `max(650 / speed, 500)` ms. At 1× there is 650ms per raw step; 2× and 4× both hit the same 500ms floor. | Separate teaching pauses from animation duration and raw execution events. |
| P0 | System Design phone layout is unusable | At 390px the open curriculum sidebar leaves a very narrow lesson column; document width measured 419px. | Small screens get one content pane and an outline drawer. |
| P1 | Shared controls have inconsistent visual treatment | Live toolbar: Run 28px pill; icon tools 30×32px with 4px corners; resources 28×30px; theme 32px pill; back link about 19px high. | Shared button/icon-button sizing, radius, focus and loading states. Keep navigation visually distinct from actions. |
| P1 | Multiple unrelated accent systems | Global actions are violet/citadel-colored; new lesson actions are sage; playback uses green, amber and violet simultaneously. | One global action accent, with separate semantic and curriculum colors. |
| P1 | Some metadata lacks normal-text contrast | Token calculations: dark `#64748B` on `#0F1624` ≈ 3.80:1; light `#8B859E` on `#F7F4EF` ≈ 3.22:1. These do not meet 4.5:1 for normal-sized text. | Correct token pairs and verify computed colors in every theme. Small metadata is still text. |
| P1 | Navigation vocabulary changes between screens | World map says Concept / Drills / Arena / Pitch; question says Learn / Practice / Interview. Back from question names only World 17. | Use Learn / Practice / Interview consistently; show the world’s actual name and preserve return context. |
| P1 | Playback can continue outside its visible workspace | The question-level playback hook stays mounted; mode changes do not pause it. Global Space/arrow shortcuts exclude editors but not buttons or hidden visualization modes. | Pause on workspace/section changes and backgrounding; scope keyboard controls to visible playback and respect focused controls. |
| P1 | Simulation claims exceed implemented behavior | HLD latency is randomized; Cache Hit changes status text but the next-hop expression still walks every node. It loops at the last node. | Use deterministic teaching scenarios and real branches; label modeled values; stop after one request by default. |
| P1 | Learning text needs correctness review | Heap-page content implies PostgreSQL and SQLite generally use 8KB heap pages and promises exactly one page for indexed lookup. World 17 offers a generated LeetCode URL for an internal question. | Add source-backed corrections, model boundaries and explicit external URLs. |
| P2 | Loading and motion are fragmented | Shared Skeleton/Spinner already exist; question load uses a full-screen spinner. Motion, GSAP and several vendored effect collections already coexist. | Consolidate useful effects and use layout-shaped loading placeholders. |

Primary code locations: `frontend/src/pages/QuestionPage.tsx`, `frontend/src/components/ui.tsx`, `frontend/src/components/effects.tsx`, `frontend/src/index.css`, `frontend/src/features/journey/`, `frontend/src/components/workspace/`, `frontend/src/components/visualizers/stage/`, `frontend/src/lib/motion.ts`, `frontend/src/components/system-design/`, `frontend/src/lib/journey.ts`, `frontend/src/components/MountainTrail.tsx`.

## Color: apply the intent of 60–30–10

60–30–10 is a composition heuristic, not a usability requirement or a pixel quota. The existing screens are already mostly neutral, which is suitable for long study sessions. No measured allocation or coherent application-wide 60–30–10 system was found. The problem is inconsistent color roles, not too little color.

Use approximately 60% quiet canvas, 30% secondary surfaces, and a restrained accent presence up to roughly 10% as a visual review guide. Text, diagrams, code syntax and error states should remain readable regardless of proportions. Do not add colored panels just to reach 30% or 10%.

Proposed foundation:

| Role | Dark theme direction | Light theme direction | Usage |
| --- | --- | --- | --- |
| Canvas | Existing deep navy | Existing warm off-white | Page background |
| Secondary surface | Existing slate surfaces | White / warm gray | Header, outline, editor, raised controls |
| Primary action | Soft violet, candidate `#A78BFA` with dark text | Deep violet, candidate `#6D28D9` with white text | Main CTA, active navigation indicator, focus |
| Success / warning / error | Semantic green / amber / red | Contrast-adjusted equivalents | Status plus icon or text |
| Citadel identity | Small category marker | Same role | Map and curriculum labels; does not redefine every action |
| Diagram state | Read, compare, write, target tokens | Equivalent accessible mapping | Only meaningful changes, with labels/legend |

Validate final pairs before adoption. Consolidate the sage lesson accent into the chosen global accent. Remove misleading aliases such as a token named cyan that currently resolves to violet. Keep shadows subtle and reserved for overlays or meaningful elevation.

## Components and header specification

Use shadcn/ui primitives, customized through one token system. The project already uses Radix, Tailwind, class-variance-authority and Motion; select the compatible Radix variants. Start with Button, Tooltip, Dropdown Menu, Tabs, Breadcrumb, Sheet, Skeleton, Progress and Accordion. Build domain-specific lesson components on top. This is a component migration, not merely adding template screenshots or another set of copy-pasted styles.

- Regular controls: 36px desktop height, 8px radius, 16px icons, consistent label weight and spacing. Touch controls: at least 44px hit area as our product target. Dense controls may look smaller within the touch area.
- Button roles: primary, secondary, ghost and destructive. Shared states: idle, hover, focus, pressed, disabled, busy and success/error feedback. Disabled styling must never be the only explanation of a prerequisite.
- Learn / Practice / Interview are navigation tabs. Theme, resources and expand are utility controls. They should share alignment and icon styling but need not all resemble primary buttons.
- Desktop question header: left = “Back to Disk Storage” with question identity; center/right = 1 Learn / 2 Practice / 3 Interview; trailing = relevant Run action and aligned utility buttons. Theme becomes the same icon-button treatment as other utilities, with a tooltip and accessible label.
- At narrow widths use a compact identity row and a second navigation row; place secondary utilities in a menu. Show an accessible “Back to world” label rather than relying on an unexplained arrow.
- World-level breadcrumbs provide Home → Citadel → World. Returning from a question restores selected question and scroll position. Keep these breadcrumbs out of an additional permanent lesson header row.
- Replace game-specific action labels where they obscure meaning: “Start lesson,” “Continue learning,” “Reference sheet.” Preserve citadel/world names as identity.

## Learning sequence and answer boundaries

Default student journey:

```text
World → Learn → Guided example → Practice → Reflect → Interview → Scheduled review
          ↑                          │
          └──── contextual help ─────┘
```

Entry policy must cover normal links, explicit deep links, reloads, return visits, and review mode:

| Situation | Proposed behavior |
| --- | --- |
| New question | Learn, with a clear goal and prerequisites |
| Returning learner | Resume saved section/phase with an obvious Restart learning option |
| Learn checkpoint complete | Recommend Practice; do not claim mastery based on page visits |
| Practice attempt | Offer hints and reflection, then Interview |
| Early Interview access | Preview purpose; hide target answer behind an explicit reveal action explaining that it marks the solution as studied |
| Experienced learner | Explicit Skip to practice route; no forced repetition |
| Due review | Start with independent retrieval/practice; do not automatically display the answer or rerun onboarding |
| Legacy `?stage=1..4` URL | Map once to documented modes; preserve old links while migrating to readable route state |

Store lesson progress separately from graded completion. Preserve drafts on mode changes and answer reveal. A teaching example can be fully worked, but it must differ from the target challenge. The current DSA target-solution trace should move to deliberate answer review, or be replaced in Learn by a separately authored example. Inspect the code tab, variable trace, hints and reference disclosures for accidental answer leakage, not just the Interview tab.

A better lesson structure:

1. Goal in plain language: what the student will be able to explain or do.
2. One relatable scenario and a short definition. Provide “new to this?” prerequisite help.
3. Small worked example with a visible state change. A novice should not have to guess unfamiliar jargon to proceed.
4. Optional prediction on the next change, with useful corrective feedback.
5. Interactive experiment: change one input, observe one consequence, explain why.
6. A short transfer question with a different input/context.
7. Independent implementation and tests; later compare against the reference.

Use the existing real-world fields selectively, with sources and honest wording. Do not invent employer anecdotes, measured speedups or guaranteed production outcomes. Distinguish an illustrative scenario from an actual case study. Add reviewed source links, prerequisites, learning objectives, example/assessment separation and model assumptions to lesson metadata through a backward-compatible schema migration.

Pilot explanations:

- DBMS: retrieve an order from a large order history. Show a row inside a page, then a page moving from storage to the buffer pool. Compare cold-cache scan with indexed navigation; label index and heap reads separately. Explain the boundary of the bookshelf analogy. PostgreSQL usually uses 8kB pages; indexing does not universally mean exactly one disk read.
- HTTP: a checkout request travels through client, gateway, authentication, handler and response. Selecting a failure highlights where it occurs and why that status is returned. Separate HTTP framing from the later status-code lesson.
- DSA: finding a pair of prices matching a budget. Show current item, complement, prior map contents and why lookup happens before insert. Use a different target/input for the assessed problem.

## Diagrams and instructional playback

Use the simplest renderer for each teaching job:

| Tool | Recommended role | Boundary |
| --- | --- | --- |
| Existing SVG + Motion | Arrays, heap pages, pointer movement, a small fixed request path | Keep current useful visualizers and improve state/pacing |
| Mermaid | Author-maintained flowcharts, sequence diagrams and ER reference diagrams written as text | Good for explanatory diagrams; not the simulation engine |
| React Flow (`@xyflow/react`) | Architecture maps requiring node selection, branching, zoom/pan or editable connections | Introduce as a lazy-loaded pilot for HLD; accessible outline/text alternative required |
| DBML / dbdiagram approach | Schema-focused ER teaching or a later schema-editing exercise | dbdiagram.io is a reference product; embedding or uploading student material is not part of this plan |

Animated connections must represent the current simulated event. A moving dot should travel to the next relevant node, stop, reveal the changed state and let the student inspect it. A Cache Hit must actually bypass the downstream work. A failure must visibly end or redirect the request. Random latency and looping decorative traffic cannot serve as evidence that an architecture is correct.

Playback design:

- Start paused. Make Next step prominent for novices; offer Play explanation.
- Initial testable hypothesis: default 2 seconds per meaningful DSA step and 2.5 seconds per architecture hop, including a 300–500ms movement followed by reading time. Complex explanations can use 3–5 seconds or explicit Continue. These are starting values for student testing, not universal research constants.
- Speeds: 0.5×, 1×, 1.5×, 2×, plus step-only mode; preserve a valid saved preference. Separate display duration from modeled system latency.
- Group raw line events into meaningful actions while retaining an optional detailed trace.
- Support previous/next, replay current step, seek, reset, and stop at the end. Pause when navigating away, inspecting another section, or hiding the tab.
- Correct requestAnimationFrame time accounting; move side effects out of state-updater callbacks. Test at 60Hz/120Hz and after background-tab suspension.
- Reduced motion uses static highlight changes and captions. CSS alone cannot stop JavaScript-driven packet movement; handle both explicitly.
- Use a deterministic simulation state model shared by the canvas, narrative and metrics. Do not require React Flow to own the pedagogical state machine.

## Loading and interaction polish

Use the already-installed Motion library for new UI transitions. Inventory existing effects before adding dependencies.

| Moment | Proposed feedback |
| --- | --- |
| Question loading | Header/outline/content skeleton matching the destination layout, accessible status; avoid a full-screen spinner for every transition |
| Code execution | Keep editor and input visible; disable duplicate submission; show Running tests with an indeterminate indicator until real progress/results exist |
| Results | Stable result panel with a short fade and clear passed/failed counts; do not use fake percentage progress |
| Tab/section change | 120–180ms opacity transition; preserve scroll rules and move focus appropriately |
| Drawer/menu | 160–220ms movement/fade; keyboard dismissal and focus return |
| Diagram change | Animate only the affected node/edge/state; pause for explanation |
| Success | Small inline acknowledgment, optional brief celebration respecting reduced motion; avoid repeated confetti on every identical rerun |
| Slow or failed load | Specific retry action and preserved draft, with truthful status |

Avoid perpetual glowing controls, animated backgrounds behind lesson text, bouncing reading panels, typewriter explanations and splash screens that delay access. The existing world-map atmosphere can remain subdued; add a compact curriculum/list alternative for students who prefer direct navigation.

## Delivery order and acceptance

### 1. Repair the learning path and playback

Files: QuestionPage, journey URL/state helpers, usePlayback, motion timing, ArchitectureFlowSimulator, SystemDesignPage.

Deliver: Learn-first entry, deliberate answer boundary, correct review exception, correct animation clock, slower teaching pacing, scoped keyboard behavior, pause lifecycle, and mobile outline drawer. Add behavioral tests for these failures. Verify old links and drafts survive.

### 2. Establish one component system

Files: shared UI primitives, effects ThemeToggle, global tokens, lesson CSS, question/global headers, WorldPage, MountainTrail, PlaybackDock.

Deliver: shadcn-based controls, one action palette, readable contrast, consistent vocabulary, named back destinations, loading/running/error states. Migrate the question workspace first, then world/dashboard and System Design. Do not introduce a third temporary button family.

### 3. Pilot three improved lessons and one architecture map

Pilot: heap pages, HTTP framing/status, Two Sum, and one HLD request flow. Correct factual overstatements and broken external links. Create independent worked examples, short checkpoints, semantic traces and deterministic branch behavior. Introduce React Flow only if the chosen architecture pilot needs its interaction capabilities.

### 4. Add restrained motion and validate with students

Apply motion tokens, reduced-motion alternatives and stable skeletons after the layouts are correct. Test with 5–8 students as formative research; include beginners and returning interview candidates. Observe whether they can find the start, explain an animated step, return to their world and resume learning. Test delayed recall/transfer on a later session, not just visual preference or time on site.

Acceptance criteria:

- Fresh DSA and non-DSA question links enter Learn; returning and review states follow the documented policy.
- Target reference code remains hidden until deliberate reveal; studied and solved are different states.
- The same playback state produces the same diagram and caption. Speed presets have measurably different timing, pause freezes progression, replay is deterministic, and the last step stops.
- At 390px, no page-level horizontal overflow; diagrams/tables may pan within labeled bounds. Check 768px, 1440px, 200% zoom and long titles too.
- Normal text meets 4.5:1 contrast; large text 3:1. Meaningful controls have visible focus and adequate target size. Never encode outcomes only by color.
- The header’s utility controls share size/radius/icon rhythm. Navigation, primary actions and secondary controls remain distinguishable.
- Browser Back, named Back to world, direct URL, refresh and next-question actions preserve intended context without losing drafts.
- Reduced motion covers CSS, Motion, canvas/SVG and manual animation clocks. Loading/running/result/error states remain understandable without animation.
- Existing backend grading tests, lesson-state tests, build and lint pass; add focused tests for routing, playback and answer-reveal behavior. Student tests evaluate comprehension, successful task completion and voluntary return; no claim of improved learning until measured.

## Research references

- [Manning: 60:30:10](https://livebook.manning.com/learn/concepts/60-30-10-rule--technique/design-for-developers): approximate dominant/secondary/accent color allocation.
- [shadcn/ui theming](https://ui.shadcn.com/docs/theming), [Radix Button](https://ui.shadcn.com/docs/components/radix/button), [Skeleton](https://ui.shadcn.com/docs/components/radix/skeleton): implementation sources for a coherent local component system.
- [NN/g: Animation duration](https://www.nngroup.com/articles/animation-duration/), [Animation usability](https://www.nngroup.com/articles/animation-usability/): keep interface feedback brief and purposeful. Instructional reading time is a separate concern from UI transition duration.
- [Motion accessibility](https://motion.dev/docs/react-accessibility): framework support for reduced-motion preferences.
- [React Flow animated edges](https://reactflow.dev/examples/edges/animating-edges), [Mermaid introduction](https://mermaid.js.org/intro/), [dbdiagram](https://dbdiagram.io/): different diagram-authoring and interaction roles.
- [W3C contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [interaction animation](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html): testable accessibility requirements. The 44px touch target is our proposed product target; WCAG 2.2 AA minimum target size is 24px with specified exceptions. Interaction-animation disabling is an AAA criterion we choose to support.
- [NSW CESE cognitive load review](https://education.nsw.gov.au/about-us/education-data-and-research/cese/publications/literature-reviews/cognitive-load-theory): guidance, worked examples, practice and feedback support novices. Applying that evidence to these lessons still requires testing.
- [PostgreSQL page layout](https://www.postgresql.org/docs/current/storage-page-layout.html), [index-only scans](https://www.postgresql.org/docs/current/indexes-index-only-scans.html), [SQLite page size](https://www.sqlite.org/pragma.html#pragma_page_size): factual review sources for the database pilot.
