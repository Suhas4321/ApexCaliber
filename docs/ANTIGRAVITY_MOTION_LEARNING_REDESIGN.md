# Antigravity Handoff: Motion-Led Learning Redesign

## Purpose

This document is the implementation brief for improving ApexCaliber's new motion graphics. Preserve the visual work that is already strong, but correct the learning design, component architecture, accessibility, responsive behavior, and user-facing language.

The goal is not to make every lesson more animated. The goal is to help a student build an accurate mental model with less cognitive load. Motion is useful only when it explains a change over time, a request moving through a system, state transitions, ownership, contention, failure propagation, or recovery.

## Product outcome

A student should be able to answer these questions while watching a visual:

1. What entities are involved?
2. What changed in this step?
3. Why did it change?
4. What would break under the failure scenario?
5. What design rule or trade-off should I remember?

The experience must teach from foundations upward. For example, a deadlock journey should establish processes, threads, shared resources, locks, ownership and waiting before presenting a circular wait. A learner should understand the mechanism rather than memorize four conditions.

## Preserve these strengths

Do not discard the current visual direction. Keep and refine:

- The dark technical canvas and clear node-and-edge diagrams.
- Play, pause, replay, scrubber and selectable playback speed.
- The default slow walkthrough. `0.5x` is appropriate for a first viewing.
- Synchronized captions that explain the current event.
- Explicit failure modes such as fork bomb and infinite loop.
- Live values when they help explain behavior.
- Theater and fullscreen options after their interaction problems are fixed.
- Scenario comparison within one visual when the underlying model is the same.

## Problems to correct

### 1. Animation selection is too broad

`LessonExperiment.tsx` currently chooses many animations from a world or stage prefix. This can show the same deadlock animation for several different lessons even when the current stage is teaching race conditions, Coffman conditions, graph detection, or lock ordering.

Every visual must be selected by a stable, explicit `visualizationId` stored in lesson content. Do not infer it from `startsWith`, a citadel ID, or a broad slug group.

```ts
type LessonVisualization = {
  id: string
  kind: 'motion' | 'interactive-model' | 'static-diagram' | 'code-trace'
  learningObjective: string
  prerequisiteConcepts: string[]
  scenarioIds: string[]
}
```

Render no visualization when the lesson does not have an appropriate one. A well-designed static diagram or short code trace is better than a beautiful but unrelated animation.

### 2. Generic story acts are semantically incorrect

The shared player hardcodes labels such as Ingress, Traversal, Divergence and Resolution. These work for a request pipeline but not for deadlocks, memory management, B-trees, transactions, token rotation, or concurrency.

Each animation must provide its own meaningful chapters:

```ts
type TimelineChapter = {
  id: string
  label: string
  startMs: number
  summary: string
}
```

Examples:

- Deadlock: `Resources introduced` → `Locks acquired` → `Circular wait` → `Prevention strategy`
- B+ tree: `Lookup begins` → `Internal-node traversal` → `Leaf match` → `Range scan`
- Async job: `Request accepted` → `Job queued` → `Worker executes` → `Result delivered`
- ACID: `Transaction begins` → `Writes staged` → `Conflict or failure` → `Commit or rollback`

### 3. The visual does not always fit the learning sequence

Use this lesson structure:

1. **Orient:** State the question and activate prior knowledge.
2. **Predict:** Ask the student to commit to an outcome.
3. **Observe:** Run one focused visual or experiment.
4. **Explain:** Connect the observed behavior to the underlying mechanism.
5. **Contrast:** Change one variable or show one failure case.
6. **Apply:** Give a small transfer question in a different context.
7. **Recall:** End with a compact mental model, not a wall of notes.

Animation belongs primarily in Observe and Contrast. Do not mix the full definition, architecture, code, interview answer, telemetry, controls and multiple scenarios in one viewport.

### 4. The player contains too much chrome

Remove decorative or promotional language such as:

- `60 FPS Studio`
- `Cinematic Motion Graphic`
- `Pro Keyboard Controls`
- `ByteByteGo Architecture` as a style label

Use student-centered labels:

- `Interactive walkthrough`
- `Visual model`
- `Step-by-step explanation`
- `Show controls`
- `Focus mode`

Credit external sources only in a Sources section when material is actually derived from them. ApexCaliber must have its own visual identity and should not present itself as a LeetCode or ByteByteGo imitation.

## Required player architecture

Create one timeline engine instead of duplicating `requestAnimationFrame`, speed and timestamp logic in every visual.

Suggested structure:

```text
components/motion/
  MotionLessonPlayer.tsx
  MotionLessonControls.tsx
  MotionLessonCaption.tsx
  MotionLessonLegend.tsx
  useMotionTimeline.ts
  motion-types.ts
  scenes/
    DeadlockScene.tsx
    BTreeLookupScene.tsx
    AsyncJobScene.tsx
```

The shared hook should own:

- Current time and normalized progress.
- Play, pause, replay, seek and chapter navigation.
- Playback speeds: `0.25x`, `0.5x`, `1x`.
- Pause at meaningful teaching checkpoints.
- Visibility pause when the player is offscreen or the tab is hidden.
- Cleanup of every animation frame on unmount.
- Reduced-motion mode.
- A deterministic state derived from time so seeking produces the correct scene.

Each scene should be declarative: it receives the current time or a derived scene state and renders it. It must not implement its own playback loop.

## A better teaching mode

Add two modes, with **Guided** as the default:

### Guided mode

- Advances one meaningful event at a time.
- Pauses automatically after each event.
- Displays a short caption: action, cause and consequence.
- Offers `Continue` and `Replay step`.
- Allows the student to answer a checkpoint before the failure or outcome is revealed.

### Continuous mode

- Plays the whole sequence at the selected speed.
- Retains chapters, pause, seek and replay.
- Is useful after the learner has completed the guided walkthrough.

Do not autoplay on page load. Preserve progress only within the current lesson session; reopening the lesson should begin from a comprehensible state.

## Deadlock reference design

The deadlock topic should be split into distinct visuals rather than using one Resource Allocation Graph everywhere.

| Lesson | Visual | Student interaction | Desired understanding |
|---|---|---|---|
| Process, thread and shared state | Two workers update one shared counter | Step through interleaving | Concurrency creates non-deterministic ordering |
| Race condition | Lost-update timeline | Choose the expected final value | Read-modify-write is not atomic |
| Lock and ownership | One critical section with a mutex | Try to enter while locked | A lock grants exclusive ownership and forces waiting |
| Coffman conditions | Build a deadlock one condition at a time | Toggle each condition | All four conditions are required for deadlock |
| Wait-for graph | Resources transform into a graph | Add or remove a dependency | A cycle represents circular waiting under the stated assumptions |
| Detection | Three-color DFS traversal | Step forward/back through colors | Gray-to-gray edge detects a cycle |
| Prevention | Compare lock ordering with unordered acquisition | Select an ordering policy | Global ordering removes circular wait |

Use at least two analogies only when they illuminate different aspects:

- Traffic gridlock explains circular waiting and why no participant can advance.
- Two kitchen workers holding different tools explains resource ownership and lock ordering.

Always return from the analogy to the technical model. Do not let the analogy replace correct terminology.

## System-design motion rules

System-design visuals should reveal architecture progressively. Begin with the user request and one service. Add a component only when a requirement or failure makes it necessary.

For the Remote Code Execution Sandbox:

1. Show synchronous execution and a single normal request.
2. Increase to a contest spike and show worker starvation/timeout.
3. Introduce the queue to decouple ingestion from execution.
4. Introduce isolated workers for untrusted code.
5. Apply CPU, memory, PID and network limits one at a time.
6. Kill an infinite loop or fork bomb and show the resulting state.
7. Recover a job from a failed worker using a lease/retry mechanism.
8. Finish with the complete architecture and explicit trade-offs.

Keep numbers consistent across the table, diagram, caption and interview explanation. Avoid unexplained precision. A latency figure such as `12ms` must be labeled as an example target or derived from an actual experiment.

## Layout requirements

### Desktop

- Use the available width, but keep explanatory prose around `65–75ch`.
- The player and its current caption must fit together within a typical laptop viewport where possible.
- Keep primary controls next to the timeline. Place rare options in one overflow menu.
- Use a collapsible lesson outline instead of a permanently wide sidebar when space is limited.
- While in Focus mode, hide unrelated navigation and lesson content.

### Tablet and mobile

- No horizontal page scrolling at `320px`, `375px`, `390px`, `768px` or `1024px`.
- Convert the System Design sidebar into a drawer below the desktop breakpoint.
- Stack telemetry into two columns and then one column.
- Give timeline controls at least `44 × 44px` touch targets.
- Keep labels visible; do not rely on hover tooltips.
- Allow the diagram to pan only when the content truly cannot reflow, and make the pan region obvious.

### Information hierarchy

In a learning view, the visual priority should be:

1. Current learning question.
2. Diagram or experiment.
3. Current-step explanation.
4. Play/step controls.
5. Optional telemetry and legend.
6. Advanced display settings.

## Color and visual system

The 60–30–10 rule can guide the interface, but do not apply it as a literal pixel calculation.

- **60% foundation:** neutral dark surfaces and page background.
- **30% structure:** raised panels, borders, secondary text and navigation.
- **10% emphasis:** one primary violet brand accent plus semantic colors used only for meaning.

Semantic colors must remain consistent:

- Violet: product identity and primary action.
- Cyan/blue: active flow or neutral data movement.
- Green: success, ownership acquired or completed state.
- Amber: waiting, degraded state or caution.
- Red: failure, denial, cycle or destructive outcome.

Do not use several saturated colors merely to make the canvas look active. Color, text labels, icons and line styles must work together so color is never the only carrier of meaning. All text and interactive states must meet WCAG AA contrast.

Button variants must be standardized across navigation and players: primary, secondary, ghost, destructive and icon-only. Theme, fullscreen, focus mode and overflow controls should share the same height, radius, border treatment and icon sizing.

## Motion and accessibility requirements

- Honor `prefers-reduced-motion` in JavaScript as well as CSS.
- In reduced-motion mode, show discrete states with crossfades disabled or minimized.
- Never require animation to understand the content; the current state and caption must remain readable when paused.
- Space, arrow, `R`, `F` and `T` shortcuts must work only when the player has focus or is in focus/fullscreen mode.
- Ignore shortcuts while focus is in `input`, `textarea`, `select`, `button`, editor surfaces, or `[contenteditable]`.
- Add Escape handling for fullscreen/focus mode.
- Fullscreen must restore page scroll and prior keyboard focus on exit.
- Use appropriate button names, slider labels, live-region restraint and visible focus rings.
- Do not announce every animation frame to screen readers. Announce only chapter or step changes.

## Performance requirements

- Lazy-load each visualization with dynamic imports. A question should not download animations for unrelated topics.
- Load the player only when the student selects the visual or when its section approaches the viewport.
- Avoid one React state update per visual element per frame. Derive the frame from one timeline value.
- Pause when offscreen and when `document.visibilityState !== 'visible'`.
- Prefer transforms and opacity for motion.
- Test on a mid-range mobile CPU profile.
- Do not introduce a canvas/WebGL dependency unless SVG/HTML cannot meet the requirement.

## Content authoring contract

Each visualization must ship with this metadata:

```ts
type MotionLessonDefinition = {
  id: string
  title: string
  learningObjective: string
  prerequisites: string[]
  initialQuestion: string
  chapters: TimelineChapter[]
  scenarios: Array<{
    id: string
    label: string
    predictionPrompt?: string
  }>
  legend: Array<{
    id: string
    label: string
    meaning: string
  }>
  takeaway: string
  transferQuestion: string
  sourceNotes?: string[]
}
```

Reject a new animation during review if its learning objective, prerequisite concepts, chapter captions and transfer question are missing.

## Implementation phases

### Phase 1: Correct the shared player

- Extract `useMotionTimeline` and remove duplicated RAF loops.
- Make chapters and telemetry topic-specific props.
- Scope keyboard shortcuts and implement correct focus/fullscreen behavior.
- Add reduced-motion behavior.
- Simplify player language and controls.
- Add responsive player layouts.

### Phase 2: Correct content routing

- Add explicit visualization IDs to lesson content.
- Replace prefix-based selection in `LessonExperiment.tsx`.
- Lazy-load scenes from a visualization registry.
- Audit every existing mapping and remove mismatched graphics.

### Phase 3: Improve pedagogical sequences

- Split the deadlock content according to the reference table above.
- Audit concurrency, async, database and networking lessons from prerequisites upward.
- Add Guided mode checkpoints and transfer questions.
- Ensure each animation explains one core mechanism.

### Phase 4: System Design progressive disclosure

- Refactor each HLD animation to start with a naive design.
- Introduce components in response to requirements and failures.
- Keep scale values and captions consistent.
- Fix the mobile System Design sidebar and player layout.

### Phase 5: Polish and measurement

- Standardize buttons and color tokens.
- Remove decorative labels and redundant telemetry.
- Measure completion, replay, pause and checkpoint behavior without collecting unnecessary data.
- Use learner testing to identify where students pause, replay or abandon.

## Acceptance criteria

The work is complete only when all of these are true:

- Every animation shown is explicitly mapped to the current lesson objective.
- No generic chapter or telemetry label appears in an unrelated topic.
- A first-time learner can use Guided mode without discovering keyboard shortcuts.
- The visual remains understandable when paused and with reduced motion enabled.
- Keyboard shortcuts never hijack typing, code editing, buttons or page scrolling outside the focused player.
- Fullscreen/focus mode can be entered and exited with correct focus restoration.
- No horizontal page overflow at the required responsive widths.
- The current caption and important diagram state can be viewed together.
- Unrelated animations are excluded from the initial page bundle.
- Production build and existing journey tests pass.
- Component tests cover timeline seek/replay, chapter state, reduced motion and shortcut scoping.
- One usability session verifies that a student can explain the mechanism in their own words after the walkthrough.

## Files to inspect first

- `frontend/src/components/motion/MotionGraphicPlayer.tsx`
- `frontend/src/features/journey/LessonExperiment.tsx`
- `frontend/src/features/journey/experiments/`
- `frontend/src/components/system-design/SystemDesignHldView.tsx`
- `frontend/src/components/system-design/ArchitectureFlowSimulator.tsx`
- `frontend/src/features/journey/JourneyPlayer.tsx`
- `frontend/src/features/journey/journey.css`
- `docs/QUESTION_UX_REDESIGN.md`
- `docs/LEARNING_IDENTITY_AND_FOUNDATIONS.md`
- `docs/FRONTEND_DESIGN_AUDIT_AND_PLAN.md`

## Instruction to Antigravity

Treat this as a refactor and learning-design correction, not a visual rewrite. Preserve useful scenes, visual assets and scenario logic. First fix the shared player and explicit lesson mapping. Then revise individual animations in small groups, verifying the learning objective and responsive behavior after each group. Do not generate more animations until the existing set satisfies the acceptance criteria above.
