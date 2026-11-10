# ApexCaliber: design review and dark UI direction

Status: the homepage, learning entry, subject and topic pages, lesson shell, question workspace, Progress, System Design, and interview practice use the new neutral study direction. The final homepage motion graphic remains deferred. Updated 10 November 2026.

## Decisions from the latest review

- Preserve **all** existing lessons, questions, answers, guides, worked examples, hints, visualizations, editor tools, and student progress. This is an interface and navigation redesign, not a curriculum deletion or rewrite.
- Keep subject differentiation. DSA, Python, databases, operating systems, backend, networking, AI, and system design should each be recognizable. Give them category accents, icons, and names inside one shared grid, typography, button, and navigation system. Category accents are orientation cues; they do not replace the semantic colors for primary actions, success, errors, or warnings.
- The first screen after login and the entry into a subject now lead with plain-language next actions. Mountain silhouettes and the multi-camp entry are no longer part of the required route. Any optional map would need a separate learner-tested purpose.
- **Reserve a prominent product-demo area on the public homepage, but do not build the final motion graphic yet.** Its content and composition must follow the approved interior design so the marketing demo accurately represents the real lesson and editor. The current interactive two-sum example may remain as a temporary illustration.
- Local development now requires a username and password. The server stores a password hash and an HTTP-only session cookie for one local account. Hosted deployments retain Supabase-managed email-link authentication until provider setup and launch checks are complete. Google sign-in is a possible later provider, not a working feature today.
- The homepage uses ExpertCode's editorial canvas and dark demo as a visual direction, with Aceternity's centered headline, early actions, and aligned product preview. Log out lives in the avatar account menu in the signed-in header and fullscreen coding screens.

## The product we are designing

ApexCaliber is for engineering students and graduates preparing for software jobs and interviews. Its promise is to take a learner from a basic mental model to a working solution: understand an idea, trace an example, write code, check the result, and revisit the idea later. The lesson and editor are the product. The marketing page's job is to show that learning loop and lead to sign-in.

The repository already has substantial learning content, prerequisite routes, a coding editor, execution traces, and saved progress. The design should make those capabilities easier to understand and use. It should not imply that every listed subject already has a complete beginner curriculum.

## References reviewed

| Reference | What works | What to adapt for ApexCaliber |
| --- | --- | --- |
| [ExpertCode live site](https://expertcode.framer.website/) and [template listing](https://www.framer.com/marketplace/templates/expertcode/) | A strong editorial type hierarchy, warm paper around one dark terminal, limited accent color, and a replayable terminal that tells a short story. The listing describes it as a code component, not a background video. | Show an actual learning sequence: a small problem, a changing trace, the relevant lines of code, and a passing test. Give it a replay control and a still version for reduced motion. |
| [Aceternity Startup live preview](https://startup-landing-simple-aceternity.vercel.app/) and [template preview](https://ui.aceternity.com/template-preview/startup-landing-page-template) | The navigation, headline, short support text, two hero actions, and product image align to a clear grid. Sections are spacious and the dark canvas gives the product mockup contrast. | Use its spacing and action hierarchy, not its hosting copy, pricing, invented metrics, or decorative animation. Lead with a real ApexCaliber lesson and editor preview. |

Both are primarily marketing references. Their animation density should not be copied into the lesson or editor, where reading, thinking, and coding need stable surfaces.

## Current product: observed screens

The initial review used the running local build at `http://127.0.0.1:8010/` and inspected the homepage, `/app`, `/learn/python_data`, `/lesson/py-names`, and `/q/contains-duplicate` in Learn and Practice modes. The findings below describe the previous interface and explain the changes. They are heuristic observations, not findings from student testing.

### What is already valuable

- The homepage explains the idea-to-code method with a real two-sum example.
- The concept route makes the next lesson visible and records progress.
- The lesson uses a situation, explanation, example, and checks instead of only definitions.
- The question workspace has a real editor, test cases, traces, hints, and interview preparation.
- The app already has light and dark modes and reduced-motion handling in parts of the interface.

### What is making it feel assembled rather than designed

1. **The visual language changes at the learning boundary.** The public page is warm ivory with a dark demo; sign-in is dark with a related rust accent. The learning route and lesson use purple as the primary action. The question editor uses another dense dark shell. Color, corner shape, typography, and button emphasis do not yet read as one system.
2. **The first learning screen asks for too many decisions.** `/app` shows eight citadel cards, progress in the header, a next-step strip, an activity disclosure, and the mountain map. A returning learner should first see one unmistakable “Continue learning” action. Track discovery can follow it.
3. **The game vocabulary has become navigation.** Citadel, realm, world, camp, summit, boss, rank, XP, streak, and rusting are a lot to decode before beginning a lesson. They can add personality after the core route is understood, but the primary labels should be Learning paths, Lessons, Practice, and Progress.
4. **The lesson explains but does not yet show enough.** The Python names lesson opens with a large header, step buttons, and several paragraphs. Its best teaching opportunity is a small live diagram: `a` and `b` pointing to one list, then the list changing. That would make the concept visible before the prose expands it.
5. **The editor is powerful but crowded on first entry.** The Practice view simultaneously exposes Problem, Trace, Exercises, hints, Run, Run and visualize, Expand editor, resources, editor target, Code/Variables/Memory, test cases, and a console. Many are useful, but they should appear when relevant to the learner's current task.
6. **The homepage primary action originally dropped below the first desktop viewport** at the inspected 1280 × 720 size because the headline and demo were tall. Hero spacing and type size were tightened on 10 November; the action is now visible at that size. Keep this check during later content changes.

## Recommendation: simplify the product, retain the useful progression

Remove the game layer from the primary workflow. Keep progress as a quiet, useful signal; keep the map as an optional “Explore all topics” view if learners enjoy it. Do not delete progress data, lesson gates, or trace tools. Rename the primary path in plain language:

`Choose a learning path → Continue the next lesson → Try a guided example → Solve a practice problem → Review the result`

The working hypothesis is that this will make the product feel more trustworthy and less demanding for beginners. Validate it with first-time students before treating it as proven.

### Proposed screen hierarchy

**Marketing homepage**

1. Clear promise and one primary action: **Start learning**. Secondary action: **See a 45-second lesson demo**.
2. A real animated learning demo, not an abstract terminal: input → reasoning → highlighted code → test result. Pause/replay controls; no autoplay audio; still fallback.
3. Three concrete outcomes: understand an idea, write the solution, prepare to explain it in an interview.
4. Learning paths and a truthful note about current coverage.
5. A preview of the actual lesson and editor, with the same design system as the signed-in product.

**Learning home (`/app`)**

```text
Header: logo | Learning paths | Practice | Progress | account

Continue where you left off
Current path: Python & Data    Lesson 1 of 2
What does a Python variable hold?       [Continue lesson]

Choose a path
[DSA] [Python & Data] [SQL & databases] ...

Optional: Explore all topics / mountain map
```

Use one main action per card. Show completed counts as secondary text. Move XP, streak, and rank off the default header into Progress if retained.

**Lesson**

```text
Back to Python & Data     Lesson 1 of 2
What does a Python variable hold?
One-sentence objective

[interactive example / diagram]  [short explanation]

Predict what happens next → Reveal and explain

[Continue to practice]
```

The visual should respond to a learner action. A simple, accurate diagram is more useful here than a cinematic animation.

**Coding workspace**

Keep the familiar split between problem and editor. Default controls: **Run code**, **Submit**, and one **Hint** entry. Put Trace, Variables, Memory, extra exercises, and interview tools in a clearly labeled secondary toolbar or reveal them after the first run. Keep test input and result visually close to the Run action. Use the same button sizes, tab style, and color meanings as the rest of the product.

## Dark visual direction to explore

The original candidate palette below informed the redesign. The implemented runtime palette is forest charcoal with green primary actions; see `DESIGN.md` and `frontend/src/index.css` for exact current tokens. Do not enforce 60:30:10 numerically. Use a dominant canvas, a supporting surface, and a restrained accent while checking contrast and hierarchy.

| Role | Candidate color | Use |
| --- | --- | --- |
| Canvas | `#111317` | App background |
| Surface | `#1B2026` | Cards, editor chrome, lesson panels |
| Raised surface | `#252C34` | Active tabs, menus, focused panels |
| Primary text | `#F4F1EA` | Headings and essential content |
| Secondary text | `#AEB7BD` | Descriptions, labels |
| Brand accent | `#F28B67` | Primary action, current position, one signature motion moment |
| Success | `#75C6A0` | Passing test and completed lesson only |

The public page now uses warm off-white `#f6f7f3` with a charcoal demo inset and restrained green `#245c42` for emphasis. Aceternity informs the centered headline, action placement, and product-preview spacing. The interior uses the same green action semantics, with distinct muted subject accents.

Use one body face for interface text, one expressive display face for the public hero, and mono only for code and small technical labels. One spacing scale, one button family, one corner system, and one set of interaction states should connect public, sign-in, lesson, and editor screens.

## Motion: what to build and what to avoid

**Feasible now:** the React app already uses Motion and contains custom motion graphics and a trace system. A code-driven hero can animate a real two-sum or duplicate-detection sequence with React, CSS, SVG, and existing trace data. It does not need a video. The animation should explain a changing state, allow replay, and stop or become static under reduced-motion preference.

**Use motion for:** showing a value enter a set, highlighting a matching code line, progressing a test from running to passed, or revealing the next learning step.

**Avoid motion for:** permanent background movement while reading, every card on scroll, animated counters with no learning value, glowing borders around many controls, or layout shifts near the editor.

## Reuse and implementation order

1. **Audit and consolidate the design system.** Inventory current colors, type, radii, buttons, tabs, panels, and hover/focus states. Choose a canonical token owner and update shared components before individual screens. Define category accents without changing action semantics.
2. **Redesign one complete learning slice:** `/app` → one DSA or Python lesson → one question → result. Preserve authored content and every tool while improving their placement. Verify it with a new learner task: “Find where to start, explain the idea, run code, and resume later.”
3. **Build the marketing demo only after the interior is settled.** Keep a reserved area for it now. Later, show the real product behavior in a polished, replayable composition. Keep the homepage CTA visible on a 1280 × 720 viewport.
4. **Extend the system to other routes.** Move secondary game elements into Progress or Explore, then standardize other citadels and topic pages.
5. **Test with students.** Ask 3–5 first-time learners to start, understand a lesson, run a solution, and find their next step. Record where they hesitate. This is the deciding evidence for the navigation changes.

The current strict static UI audit reports zero findings for the active frontend. `premium-ui.json` records native select ownership and scopes the audit to `frontend/src`; the inactive prototype remains outside the product audit.

Do not paste a Framer site into the React app. Framer templates are visual/interaction references. Aceternity's React templates may supply implementation patterns, but they use a different site stack and should be adapted to the existing Vite app rather than dropped in wholesale. Respect each template's license and use ApexCaliber's own copy, data, and visual assets.

## More templates to review

- [AGENT.EXE](https://www.framer.com/marketplace/templates/agent-exe/) — free, dark retro developer site with a focused interactive terminal. Good motion reference; too much retro vocabulary for the learning app.
- [Launchstage](https://www.framer.com/marketplace/templates/launchstage/) — free, product screenshots and a choreographed walkthrough. Good reference for showing the real app in the homepage.
- [Clavra](https://www.framer.com/marketplace/templates/clavra/) — paid, white/graphite interface with a working hero demo. Strong reference for restrained, product-specific interaction.
- [Simplistic SaaS](https://ui.aceternity.com/templates/simplistic-saas-template) — Aceternity Pro, clean bento composition and microinteractions.
- [Playful Marketing](https://ui.aceternity.com/templates/playful-marketing-aceternity) — Aceternity Pro, minimal colors and more playful motion.
- [PHOSPHOR Terminal](https://www.framer.com/marketplace/templates/phosphor-terminal/) — paid, a high-motion terminal experiment. Useful as a technical possibility, but too visually busy for a beginner lesson.

## Research behind the recommendation

- [Nielsen Norman Group: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) supports showing the important actions first and making specialist controls available when needed. This is the reason to simplify the default editor, not a reason to remove its powerful tools.
- [Nielsen Norman Group: Why Does a Design Look Good?](https://www.nngroup.com/articles/why-does-design-look-good/) identifies consistent typography, hierarchy, palette, and grid alignment as major contributors to visual quality.
- [Australian Education Research Organisation: Explicit Instruction](https://www.edresearch.edu.au/guides-resources/practice-guides/explicit-instruction-practice-guide-full-publication) supports clear explanations, worked examples, practice, and gradually reduced scaffolding. This fits ApexCaliber's intended concept-to-code loop.
- [W3C: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions) explains why nonessential motion should be removable or reduced.

## Current implementation and next validation

The main learning slice is implemented: home → subject → syllabus/lesson → topic/question → progress. The palette and navigation are shared across light and dark themes. Student testing is still needed to verify that first-time learners can find a starting point, use the editor, and return to the next step without help. Finalize the homepage motion demo after the lesson and editor layout is accepted.
