# ApexCaliber identity and prerequisite-first learning

7 November 2026. Addendum to the frontend design audit. Proposed requirements, not implemented curriculum or UI. Implementation remains deferred until the user resumes it. Redesign work is maintained on `codex/learning-experience-redesign`.

## Product identity

ApexCaliber should feel like a place to understand and experiment with engineering ideas. Its distinctive experience should come from the way it teaches, supported by its visual identity.

Retain familiar editor conventions: a resizable problem/editor split, readable test results, keyboard shortcuts and standard code controls are useful. Their presence alone does not establish that a product copies LeetCode. However, the current `LeetCodeLeftPanel` / `LeetCodeRightPanel` structure and question-number-led presentation reinforce a practice-site identity. Renaming those files alone would not change the experience.

Proposed direction:

- Lead with a learning goal and a real situation, rather than a problem number and editor.
- Give the interactive model the central position in Learn. Show the explanation beside the relevant state, then open the coding workspace for Practice.
- Keep one stable Learn / Practice / Interview progression. Use consistent ApexCaliber typography, violet action tokens, quiet surfaces and concise labels across all three modes.
- Keep citadels/worlds as a recognizable map of the curriculum. Offer a direct list view and named prerequisites so students are not forced to decipher game metaphors.
- Use a small “What changed / Why / Try next” pattern tied to each experiment. Avoid adding three permanent cards to every page; disclose only the current explanation.
- Let students record a short explanation or prediction as a learning note. Consider this after the essential flow is reliable; it should not become another always-open panel.
- Treat external problem links as references. Internal lessons should not have invented LeetCode links or appear to be externally numbered challenges.
- Keep the editor split where it helps solving. Do not move familiar controls merely to look different. Judge distinctiveness across the full learning experience, not only its editor arrangement.

Research informs this direction without copying a competitor's visual design. Exercism separates concepts from practice and models prerequisites; Brilliant describes interactive guided learning paths. These are useful interaction patterns, not proof that a particular design will improve ApexCaliber outcomes. Compare student comprehension and successful transfer before claiming the result is better than another platform.

## Current foundation coverage: partial, not sufficient

The repository has related topic groupings, but the sampled lessons do not consistently build understanding from first principles:

- `content/questions/19-os-concurrency/processes-vs-threads-memory.yaml` begins with lost updates, bytecode, mutexes and critical sections. A novice first needs an explanation of a running program, a thread, memory ownership and scheduling. Its label promises foundations but its opening assumes them.
- `content/questions/27-locks-deadlocks/deadlock-cycle-detector.yaml` moves directly into circular wait, wait-for graphs and 3-color DFS. That is an implementation exercise after learning deadlock, not a sufficient introduction to deadlock itself.
- `content/questions/26-concurrency-race-conditions/concurrency-vs-parallelism-cores.yaml` teaches a simplified scheduling calculation. Its output should be called a model under stated assumptions, not empirical or universally true speedup.
- System Design currently opens into SOLID and later introduces advanced architectures. A beginner route should make its assumed programming/networking/storage foundations visible and reachable.
- World-level curriculum edges are useful navigation, but the inspected question schema does not explicitly describe concept prerequisites, diagnostic checks or evidence that a learner understands them.

Audit all citadels for these gaps rather than assuming every existing lesson is deficient. Preserve good explanations and add missing bridges. The aim is to make depth manageable, not remove necessary information.

## Foundation map for concurrency

Build a dependency graph of concepts; do not make every student read one enormous introductory page.

| Step | Core understanding | Small demonstration |
| --- | --- | --- |
| 1. Program and execution | A program describes work; execution changes state over time | Follow three instructions and inspect changing values |
| 2. CPU work and I/O waiting | Computing and waiting consume different resources | Compare calculating a result with waiting for a network reply |
| 3. Process and address space | A running program has an execution environment and virtual address space | Two processes with separate variables; explicitly introduce IPC/shared-memory exceptions later |
| 4. Thread | A thread is an execution path within a process; threads share some resources and have per-thread state such as stacks | Two paths accessing a shared counter, with separate call stacks |
| 5. Scheduling and concurrency | Tasks can make progress over overlapping periods without executing simultaneously | Interleave two tasks on one CPU lane |
| 6. Parallelism | Work can execute simultaneously when resources and the runtime permit it | Add a second lane; contrast CPU work with waiting |
| 7. Async and the event loop | Cooperative suspension allows other ready tasks to run while an operation is pending | Mark running, ready and waiting tasks; contrast an awaitable I/O operation with blocking work |
| 8. Choosing an approach | Threads, processes and async solve overlapping but different needs | Compare an I/O-heavy client and independent CPU-heavy jobs; state Python implementation/build assumptions |
| 9. Shared state and races | Interleavings can violate an intended invariant | Deliberately interleave read-modify-write steps to produce a lost update |
| 10. Locks and waiting | A lock controls entry; a waiter needs an owner to release it | Observe acquire, hold, wait and release before combining locks |
| 11. Deadlock | A dependency cycle can prevent participants from progressing in the modeled exclusive-lock system | Construct the cycle one action at a time |
| 12. Prevention and recovery | Different strategies remove conditions or recover from failure, with costs | Compare fixed lock order, try/release/retry, and detection plus rollback |

Async is not a synonym for multithreading or parallel CPU execution. Threads are not universally unable to run in parallel. Teach the general model first, then the relevant runtime: ordinary GIL-enabled CPython, free-threaded builds and native code can behave differently. A scripted race interleaving is a teaching model; do not promise that an exact bytecode sequence or race reproduces on every Python version.

Shared state/locks form a prerequisite branch of deadlock; async is a related branch, not a compulsory detour before every deadlock lesson. Students who already know a concept should be able to take a short check and continue.

## Worked lesson: understanding deadlock before detecting it

1. Establish actors and resources. Introduce two workers and two exclusive resources. State who owns what; do not start with DFS terminology.
2. Demonstrate ordinary waiting. Worker B waits while A finishes and releases a resource. Ask why this can still make progress.
3. Introduce two-resource work. Each worker needs both resources to finish. First show a safe execution schedule.
4. Let the learner create the failing schedule: A holds R1; B holds R2; A requests R2; B requests R1. Pause after each action and show ownership and waiting arrows.
5. Ask: who can make the next move, and what event would permit it? Let the student explain the dependency before naming it deadlock.
6. Name the four conditions in the classic resource model: mutual exclusion, hold-and-wait, no preemption, circular wait. Map each to the visible scene. Explain the model assumptions; a cycle rule must not be generalized blindly to multiple-instance resource systems.
7. Derive the wait-for graph from the resource view, with a legend for arrow direction. These arrows show dependencies; numeric edge weights are not necessary for the basic detector. Teach directed cycles and graph traversal separately before asking for DFS code.
8. Change the policy. Require a consistent global lock order, then ask which condition this prevents. Compare with timeout/retry and detection/recovery; timeouts alone do not guarantee eventual progress and retries can introduce livelock.
9. Transfer to a different domain. Present a new schedule without highlighted answers. Ask the student to identify the wait, decide whether it is deadlock and propose a fix with a cost.
10. Only then implement the cycle detector and explain its assumptions and limitations.

Distinguish deadlock from slow work, ordinary blocking, starvation and livelock through examples and non-examples. Do not mark understanding solely because the learner clicked through all steps or passed a memorized definition quiz.

## Multiple examples with a purpose

Use a simple analogy first, a concrete engineering example second, and an optional contrasting example when it reveals a limitation. Present them sequentially or behind “See another example”; do not stack three complete stories on the screen.

| Topic | Intuitive analogy | Engineering transfer | Important boundary |
| --- | --- | --- | --- |
| Deadlock | Two workshop workers each hold one tool and wait for the other's tool; neither releases its tool under the stated rules | Two database transactions acquire row locks in opposite order | People could negotiate; the model assumes the programmed resource policy |
| Concurrency / parallelism | One cook switches between dishes while something bakes; two cooks can perform work simultaneously | Overlapping network requests versus independent image-processing jobs on multiple cores | Cooks do not accurately model memory isolation, CPU scheduling or runtime restrictions |
| Async | One receptionist records a pending request, handles another, then returns when a response arrives | A service awaits independent I/O operations without blocking the event-loop thread | Async syntax alone does not make CPU work nonblocking |
| Process / thread | Separate workspaces versus workers sharing a workspace | Separate worker processes communicating through messages versus threads sharing in-process data | Processes can explicitly share memory; threads also have private per-thread state |

All company-specific incident stories need a verifiable source or clear “illustrative scenario” labeling. Keep analogies and simulation parameters honest. Do not turn a familiar brand name into evidence that an invented outage actually happened.

## Apply the same principle across citadels

- System Design: one client/request/response → one server → persistence → concurrency and resource limits → queues/caching → replication/failure → distributed trade-offs. Each architecture should grow in response to an observed constraint instead of opening with every component present.
- DBMS: records and tables → pages and cache → scans → indexes → transactions/locks → isolation and recovery.
- Backend: request/response → handler and validation → state/persistence → blocking/waiting → async and queues → retries/idempotency and operational limits.
- DSA: concrete state and operations → small worked trace → invariant → complexity → independent implementation → transfer.
- AI: task/input/output → representation and retrieval basics → model interaction → evaluation → multi-stage pipelines and their failure modes.

These are proposed dependency directions, not a final syllabus. Map them to existing content, identify duplication and missing prerequisites, and validate ordering with subject expertise. The starting scenario can preview the destination without requiring the student to understand the whole system yet.

## Implementation requirements when work resumes

1. Inventory existing lessons and their assumed concepts; create stable concept IDs and a prerequisite DAG. Check for cycles, missing references and unintended cross-citadel dependencies.
2. Extend authored lesson metadata compatibly with prerequisites, goals, worked example, analogy mapping/limits, misconception checks, transfer task, assumptions and sources. Existing content must continue rendering during migration.
3. At entry show a short “Before this lesson” check. Offer a focused prerequisite refresher in context and return to the exact prior step. Do not force a long remedial path on an experienced learner.
4. Separate visited, practiced and demonstrated-understanding states. Use prediction, explanation and transfer evidence. Automated feedback must be specific; low-confidence free-text assessment must not silently block progression.
5. Add a step-based model with synchronized actor/resource state, narration, deterministic replay and slow/step-only playback. An animation must explain causality, not just move boxes.
6. Pilot the process/thread/race/lock/deadlock chain and one System Design architecture grown from a single server. Update the three earlier pilot lessons to the same teaching standard before scaling to the whole catalog.
7. Evaluate novices and experienced learners separately. Ask students to explain a new schedule, fix a failure and justify a trade-off without copying the lesson. Recheck transfer and recall later; completion clicks and time on site are not evidence of mastery.

## Sources consulted

- [Exercism: unlocking exercises](https://exercism.org/docs/building/product/unlocking-exercises) and [building tracks](https://exercism.org/docs/building/tracks): concept/practice separation and prerequisite-driven progression.
- [Brilliant: product features](https://brilliant.org/help/features/): guided paths and interactive practice as product-design references; no adoption of marketing efficacy claims.
- [AERO: explicit instruction](https://www.edresearch.edu.au/guides-resources/practice-guides/explicit-instruction-practice-guide-full-publication): connect prior knowledge, model steps, sequence learning and gradually reduce guidance. Application to this software still requires student testing.
- [Operating Systems: Three Easy Pieces](https://pages.cs.wisc.edu/~remzi/OSTEP/) and [Common Concurrency Problems](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf): foundational OS/concurrency teaching and deadlock mechanisms.
- [Python asyncio](https://docs.python.org/3/library/asyncio.html) and [threading](https://docs.python.org/3/library/threading.html): concurrency behavior and runtime-specific caveats. Verify against the app's actual Python runtime when authoring executable examples.
