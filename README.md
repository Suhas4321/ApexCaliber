# ApexCaliber

ApexCaliber is a local learning platform for aspiring software engineers and interview candidates. Its aim is to make unfamiliar engineering topics approachable: start with a small idea, see it in a familiar situation, try it, and only then tackle a harder question. The mountain and citadel theme represents that climb from base camp to advanced work.

**The product is in progress.** The existing challenge bank is much larger than the beginner lesson library. A topic appearing on the map does not mean it has a complete beginner-to-interview learning route yet.

## What is available today

| Learning area | Current entry point |
| --- | --- |
| Data structures & algorithms | The established world map and code practice flow. |
| Python & data | A short foundation route, then worlds and challenges. |
| SQL, databases & caching | A foundation route covering tables, keys, joins, transactions and selected storage topics. |
| Operating systems & concurrency | A foundation route from processes and threads toward races, locks, scheduling, deadlocks and selected I/O topics. |
| Backend & APIs | Introductory HTTP lessons, then application questions. |
| AI & retrieval | Introductory models and embeddings lessons, then application questions. |
| Computer networking | Introductory client/server, DNS and transport lessons, then application questions. |
| System design | A separate syllabus with a client → server → database primer, SOLID, LLD and HLD assignments. |

The seven world-map citadels contain **42 worlds and 198 question files**. The beginner concept graph currently contains **10 modules and 28 authored lessons**, with prerequisite mappings for **18 challenges**. System design is an eighth learning area with **20 assignments**; it is not part of the 42-world or 198-question counts. These are content counts, not a claim that all topics are taught comprehensively.

For non-DSA citadels with an authored route, the citadel entry points to concepts before practice. Mapped questions show the full prerequisite chain, start at the first missing lesson, and return to the question after the required ideas are complete. Finished modules list their linked practice questions. Each concept lesson uses a situation, plain-language explanation, terms, worked example, second setting, misconception, and two checks. A correct pair of checks records lesson completion; it is **not** yet evidence of durable understanding. DSA retains its coding-centered flow.

## Run locally

You need Python 3.11+ and Node.js 20+. The launcher installs dependencies on first use.

```bash
./run.sh dev
```

Open <http://127.0.0.1:5173>. The API runs at <http://127.0.0.1:8010>. For a built frontend served by the API, use `./run.sh` and open <http://127.0.0.1:8010>.

```bash
./run.sh test
cd frontend && npm run test:journey && npm run lint && npm run build
```

`./run.sh test` runs the backend test suite and validates the question content. The frontend checks are separate. The project uses FastAPI, React, Vite and SQLite by default; `backend/.env.example` documents the optional PostgreSQL configuration. The AI coach is optional and requires its own configuration.

**Public hosting:** This is currently a single-learner local app, not a production multi-user service. It has no login or per-student data isolation, and the Python runner must not be exposed to untrusted public users. See the [public launch and accounts plan](docs/PUBLIC_LAUNCH_AND_ACCOUNTS.md) before deploying.

## Content and progress

- `content/questions/` holds the existing world and challenge YAML files. See [the content guide](docs/CONTENT_GUIDE.md) and `backend/app/content_schema.py` before adding a challenge.
- `content/learning_paths.yaml` holds the beginner modules, lessons, prerequisite graph and selected challenge mappings. Its content is checked by `backend/app/lesson_schema.py` and `backend/app/services/learning_paths.py`.
- Backend lesson and question progress is stored in SQLite by default and mirrored to `backend/backups/user_data.json` when automatic backup is enabled. **System-design completion and some UI preferences are currently stored in browser localStorage**, so the backend backup is not a complete export of every user-visible state.

When authoring a lesson, teach the prerequisite before testing it. Use two meaningfully different examples, state the limits of analogies, link technical sources, and add a check that asks the learner to apply the idea in a new situation. Existing lesson examples are in `content/learning_paths.yaml`.

## Highest-value improvements

These are **proposals**, not shipped features. They follow from the current content and UI inventory and the [beginner-first curriculum plan](docs/BEGINNER_FIRST_PRODUCT_AND_CURRICULUM_PLAN.md).

1. **Complete the foundation paths before expanding the question bank.** The current 28 lessons cover only selected topics. Add reviewed, small lessons for Python beyond names/functions, full HTTP and API fundamentals, networking beyond DNS/TCP, AI from tokens through retrieval/evaluation, and a dedicated system-design foundation graph. Keep DSA's existing structure. Audit each new lesson against its later challenge and interview use; a count of questions alone is not syllabus coverage.
2. **Expand and review challenge-to-lesson mappings.** Only 18 challenges currently have explicit mappings. The mapped questions now show the full dependency chain and preserve the return path; extend that behavior to the remaining non-DSA questions as their foundations are authored. Add an optional readiness route for learners who already know the material without treating a skip as proof of understanding.
3. **Make understanding visible without overstating mastery.** Today two correct multiple-choice checks mark a lesson complete. Add a different transfer scenario, explanation or debugging task, meaningful feedback, and a later retrieval check. Record “visited,” “practiced,” and “demonstrated” separately so progress does not imply mastery from a lucky guess. [AERO's explicit-instruction guide](https://www.edresearch.edu.au/guides-resources/practice-guides/explicit-instruction-practice-guide-full-publication) supports small sequenced tasks, worked examples and practice after teaching.
4. **Unify the system-design journey and saved progress.** The current primer is a good first step, but the syllabus still moves quickly into SOLID, LLD and large-scale HLD. Build a guided path from one request and one service to persistence, failure and scale; connect each new component to a concrete problem it solves. Move system-design completion into the same progress and backup model as other learning areas.
5. **Audit the interface as one product.** Keep the compact citadel grid and visible first map camp. Standardize navigation labels, control sizes, focus states, theme controls and reading layouts across citadels; check mobile widths, zoom, contrast and reduced motion. The 60–30–10 color rule can be a useful *visual heuristic*—a dominant neutral canvas, supporting surfaces and a restrained accent—but should not be treated as a measured requirement. Consistent component behavior matters more; [W3C's predictable-navigation guidance](https://www.w3.org/WAI/WCAG22/Understanding/predictable) explains why. Audit the current pages before changing their palette.
6. **Validate with beginners.** Ask first-time learners to find the starting lesson, explain a concept in their own words, apply it to a new example, and resume the route later. Use failures in those tasks to prioritize content and UI changes. Passing builds and content validators cannot establish that students actually understand the material.

Detailed design and implementation notes live in [the frontend audit](docs/FRONTEND_DESIGN_AUDIT_AND_PLAN.md), [the syllabus review](docs/BEGINNER_SYLLABUS_REBUILD_REVIEW.md), and the [Phase 3 status](docs/PHASE3_COORDINATION_AND_STORAGE_IMPLEMENTATION.md). Those documents were written at different stages; this README describes the current repository and keeps remaining work explicit.
