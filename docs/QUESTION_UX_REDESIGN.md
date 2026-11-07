# Question workspace redesign

## Problem and research

The original journey showed scenario, answer, quiz, controls, a large sandbox and event logs at once. Four layers of headings competed for attention. The database lesson even displayed a RAG pipeline. The redesign treats navigation, reading and experimentation as different jobs.

- [Nielsen Norman Group: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/): expose essentials for the current task, make secondary information available on request. Applied to prediction → exploration → explanation, and optional DSA context.
- [Nielsen Norman Group: Tabs, Used Right](https://www.nngroup.com/articles/tabs-used-right/): avoid stacked tab systems and group comparable content. Applied to the Learn / Practice / Interview workspace switcher; lesson navigation moves into an outline.
- [Brilliant: Coding](https://brilliant.org/topics/coding/): interaction and practice are central to the learning experience. Inspiration for a short action-and-feedback sequence, not a claim that this redesign has been user-tested.

The supplied AI prompt was treated as a proposal. Its fixed 44–48px header containing every action would become crowded on small screens. Desktop uses a 48px header; mobile allows two compact rows. Lesson navigation belongs beside the lesson, not inside the header. Reading text retains a sensible measure; available width goes to navigation and experiments rather than stretching paragraphs across the monitor.

## Implemented layouts

```text
DESKTOP / LEARN
┌ World ← · Question                     Learn | Practice | Interview · Resources ┐
├ Lesson outline ┬ Lesson title + short introduction                              ┤
│ 01 Current     │ Make a prediction → Explore → Understand                       │
│ 02 Next        ├───────────────────────────────────────────────────────────────┤
│ 03 …           │ Situation             │ Question and prediction choices        │
│                │                       │                  [Commit & explore →] │
│ Progress       │                                                               │
└────────────────┴───────────────────────────────────────────────────────────────┘

AFTER COMMITTING
┌ Same outline   ┬ Explore                                                       ┐
│                │ Controls              │ Wide, relevant experiment             │
│                │                       │ Observable result                     │
│                │                                    [Understand why →]         │
└────────────────┴───────────────────────────────────────────────────────────────┘

PRACTICE
┌ World ← · Question                  Learn | Practice | Interview · Run · Tools  ┐
├ Problem | Trace | Exercises · Help ┬ Editor + target selector                   ┤
│ Statement                         │                                            │
│ ▸ Real-world scenario             │                                            │
│ Examples and constraints          ├────────────────────────────────────────────┤
│ ▸ Pattern clues / concept notes   │ Test cases / results                        │
│ Hints and coach (Help jumps here) │                                            │
└───────────────────────────────────┴────────────────────────────────────────────┘
```

On narrow screens, the outline becomes a disclosure and the prediction stacks vertically. Practice has explicit Problem & help / Code & tests views so neither pane is squeezed into half a phone screen. Reading and exploration have one main vertical scroll container; code retains independently scrollable editor and context panes.

DSA Learn and Interview use the same outline pattern. Learn separates operations, complexity reasoning and the trace walkthrough. Interview separates clarification, approach, complexity proof and rehearsal/reference material. Each guide shows one section with a clear next action; the outline allows direct navigation. The interview timer remains available across sections. Wide reference tables scroll within their own bounds on phones.

## Components and state

- `QuestionPage` keys `QuestionWorkspace` by slug, owns workspace mode, code, execution results and trace playback. Obsolete detail/trace responses are ignored after navigation. The header displays actions relevant to the active mode.
- `JourneyPlayer({ question, onProceedToCode })` owns the selected lesson and persisted stage state. It migrates the old stage/prediction storage format and retains it untouched. Storage failures leave the lesson usable and display a notice.
- `Prediction({ stage, committed, onCommit })` uses native radio inputs and a form. Committing moves to exploration without showing correctness feedback. Previously committed choices remain read-only.
- `StageProgress = { prediction?, phase, reached, complete? }`. `phase` is `predict | observe | explain`; `reached` gates phase navigation. Completing the explanation advances the lesson. The last continuation opens the existing practice editor, which runs the real question tests.
- `restoreJourney` checks stored indices, choice IDs and phase boundaries against the current curriculum. Invalid or outdated storage cannot reveal an explanation before a valid prediction. Lesson selection is free; the sequence within each lesson is guided.
- `LessonExperiment({ stage, question })` contains scoped, reactive models for the first heap-page and HTTP-framing lessons. Other lessons use their authored code/example content. Existing relevant topic sandboxes remain available on request, explicitly separated from the lesson-specific walkthrough.
- DSA context keeps statement, examples and constraints visible. Scenario and deeper reference material use native disclosures. Hints and coach are in the same context pane, with a persistent Help shortcut. The console opens results after any run, including a header-triggered run.
- `StudyGuideLayout` shares the outline, responsive navigation, section focus and next/previous actions between `DataStructurePrimer` and `InterviewAnswerPlaybook`. Existing trace playback, reference code and confidence scheduling remain available in their corresponding sections.

`journey.css` scopes the layout to the question workspace and uses the existing light/dark tokens. Desktop outline: 250px (280px on wide displays). Main area: fluid with 24–72px gutters. Text: 14–18px, quiet metadata, restrained green accent, visible keyboard focus. Mobile breakpoint: 760px; intermediate layout: 1150px. No new animation or UI library is required.

## Boundaries

The curriculum text has been retained; this is not a fact-check of all lessons. The old journey supplied synthetic generic events and accepted lab code by length. Those success claims are removed. This change does not claim to provide a complete simulation engine for all 42 worlds. The two new models describe their simplifying assumptions. The authored lab references remain available, while graded work uses the existing real runner.

The dashboard, curriculum authoring schema, backend grading and review schedule are unchanged. Lesson state remains browser-local, as before; it is not part of the backend backup. Existing reference visualizers still appear in the code workspace.

## Verification

- Production TypeScript/Vite build.
- Backend: 32 tests passed.
- Journey state: six regression tests (`npm run test:journey` in `frontend`).
- Browser checks: database prediction/scan/explanation, HTTP framing toggle, lesson outline, saved phase, DSA help and editor; desktop and 390px mobile layouts.
- Guide checks: section transitions, heading focus, interview timer across sections, single-section rendering and mobile table containment.
- Added the missing GSAP package declaration required by the existing `AnimatedContent` component to make a fresh build succeed.
