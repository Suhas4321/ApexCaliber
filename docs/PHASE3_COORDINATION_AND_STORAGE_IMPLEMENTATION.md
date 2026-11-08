# Phase 3: coordination, I/O and data correctness

This slice extends the beginner learning graph from 22 to 28 manually authored lessons. It continues the approved bottom-up curriculum approach and leaves DSA unchanged.

## What is now taught

- **OS:** A counting semaphore as a capacity rule after the mutex; files and descriptors after processes; async tasks and event-loop waiting after scheduling, threads and files. The semaphore lesson compares two-permit admission with an unsafe shared counter in a manual step-through model.
- **DBMS:** Normalization from a repeated-phone-number update anomaly, transaction isolation from two buyers of the last ticket, and storage pages from a small table-scan versus index-lookup model. The page lesson distinguishes PostgreSQL's common 8 KB page from SQLite's default 4 KB page and explains that PostgreSQL `ctid` is a physical row-version location, not stable identity.
- The corresponding advanced challenges now name their required lessons: semaphore simulation, asyncio, normalization, lost-update handling and heap-page scans.
- The route highlights one next lesson and opens only its module by default; other modules remain expandable. Locked cards list only unfinished prerequisites, with human-readable titles and direct links across citadels.

Each lesson begins with a familiar situation, defines its terms, uses a worked example plus a distinct transfer setting, calls out a misconception, and checks understanding after teaching. The two new models advance only when the learner clicks; there is no timed playback.

## Verification and remaining scope

The graph contains 10 modules, 28 lessons and 18 mapped challenges. Graph validation, all 37 backend tests, the frontend build and validation of the five newly mapped challenge solutions passed. The full 198-question bank was validated in Phase 2 and its question files did not change here. This is still not a complete syllabus: OS file-system implementation and deeper concurrency, DB formal normal forms and query planning, Python intermediate topics, Backend security/idempotency, AI/LLM/RAG and System Design remain for later authored slices. Review these new explanations with a real beginner before treating passing checks as proof of comprehension.
