# Phase 1: beginner-first learning graph

This implementation responds to the approved architecture review in the Engineering Directive. It introduces a teaching track alongside the existing challenge track. DSA remains unchanged. The pilot is intentionally small and manually authored: four OS lessons and four database lessons. It is a vertical slice for testing comprehension, rendering, progress, and prerequisite enforcement, not a claim that either citadel's full syllabus is finished.

## What is implemented

- `LearningModule` and `Lesson` are separate from `Question`. `LessonPrerequisite` links lessons to lessons; `ChallengePrerequisite` links existing challenge slugs to required lessons. A validator rejects unknown references and cycles before syncing the authored graph from `content/learning_paths.yaml`.
- `LessonProgress` stores passed scenario checks and mastery. The lesson API hides answer keys. A learner must master parent lessons before submitting a child lesson's checks. Mapped unsolved challenges cannot run until their required lesson is mastered; already-solved challenges remain accessible. Existing question slugs and challenge progress are preserved.
- The dashboard reports **Concepts Mastered** and **Challenges Solved** separately. OS and DB citadels and worlds link to a concept route. Those routes teach through a situation, plain explanation, vocabulary, two different examples, then two scenario checks. A module-end High-Yield Interview Playbook appears only when its lessons are mastered. No ungraded open-response field was added.
- A lesson now shows **Understand → Explore → Check** as successive steps, so the full explanation and assessment do not compete on one screen. Each pilot lesson includes a specific common misconception. The race and join lessons have manual step-through models with two contrasting outcomes. They reveal one state change per click without timed animation.
- Concept progress is included in JSON backup and restore. Synthetic LeetCode numbers/links are hidden from non-DSA challenge surfaces touched by this phase.
- The mobile top bar fits a phone width without horizontal page overflow; progress remains reachable through the mobile menu. The SQL `EXPLAIN QUERY PLAN` exercise compares with a same-version reference instead of a hard-coded planner integer, and its explanation now follows SQLite's `SCAN`/`SEARCH` definitions.

## Pilot graph

| Citadel | Sequence | Mapped challenge examples |
| --- | --- | --- |
| OS & Concurrency | Process → Thread → Race Condition → Mutex | Memory isolation, deterministic interleaving, mutex-protected counter |
| SQL & DBMS | Table → Foreign Key → Join → Transaction | Customers without orders, ACID money transfer |

The race lesson uses a conceptual read–calculate–write interleaving. It does not depend on CPython bytecode names. The mutex lesson cautions that a process-local lock cannot coordinate multiple servers. The DB slice teaches logical relationships before joins and multi-step changes. Both slices link to primary reference material from OSTEP, MIT/Cornell, and PostgreSQL documentation.

## Review criteria before expanding authoring

1. Have a new learner explain **process vs program**, **thread vs process**, and the lost-update timeline without memorizing a stock answer.
2. Have a new learner identify a foreign key, predict join cardinality in the worked example, and explain why a transfer needs a transaction.
3. Observe whether the two checks reveal misunderstandings and whether the page feels manageable on desktop and mobile. Rewrite unclear lessons before scaling the graph.
4. Confirm returning users retain existing solved challenges and new concept progress after restart and backup restore.

## Next curriculum work, after pilot review

- Expand OS through scheduling, memory, synchronization/deadlock, async vs threading vs multiprocessing, and the GIL. Contrast default CPython with free-threaded Python 3.13+ when that lesson is authored; never claim a universal GIL guarantee.
- Expand DB through relational modeling, queries, normalization, ACID/isolation, indexes, and storage. Before the heap-pages challenge, distinguish SQLite's default 4 KB page from PostgreSQL's default 8 KB page; treat PostgreSQL `ctid` as a volatile physical tuple pointer. Cover composite B-tree order, leftmost prefix, index-only scans, and write/bloat cost.
- Build the seven-step Networks route and then encode its lesson prerequisites on Backend challenges. Teach HTTP/3 over QUIC as well as TCP/UDP. Backend foundations should cover HTTP, authentication, and CORS before framework details, then idempotency before distributed systems.
- Keep Python standalone and deepen its data model, object references and memory, idiomatic typing, generators, decorators, dataclasses/Pydantic, and context managers.
- Rebuild AI around lean ML foundations, LLM mechanics, gateways, structured output, embeddings, production RAG, bounded agent workflows, memory, evaluations, observability, and guardrails.
- Promote System Design to Citadel VIII with a prerequisite graph from OS, DB, and Networks; teach LLD and HLD as distinct routes.

Do not bulk-generate lessons to fill these routes. Each later lesson should be authored and reviewed for beginner comprehension and technical accuracy before it becomes a prerequisite.
