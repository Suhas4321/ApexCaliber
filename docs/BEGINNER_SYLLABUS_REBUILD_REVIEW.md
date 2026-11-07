# ApexCaliber syllabus rebuild — review draft

**Decision requested:** Review the learning order and scope below before the question bank is migrated. This document is a proposed curriculum, not a claim that the listed lessons already exist.

## The problem in the current product

The site has 198 published question records. DSA accounts for 116 and can keep its present syllabus. The other 82 are distributed unevenly: Python/Data 23, DBMS/Caching 20, OS/Concurrency 14, Backend 12, AI 11, and Networking 2. The entry world for OS has **three** challenges, DBMS opens with heap pages, Backend opens with HTTP error diagnosis, AI opens with vector similarity, and Networking has only DNS and TCP. Those are useful applied topics, but none is a first explanation for a new learner.

The current `QuestionContent` schema requires starter code, test cases, a solution and two quizzes for every record. That forces a concept such as “What is an operating system?” into a coding-challenge shape. The existing foundation screen helps with individual questions, but it does not create the missing syllabus. We need **concept lessons as first-class content** and challenges after them. The present world page also shows only a trail of questions, so it cannot communicate the prerequisite route.

This proposal uses the official [OSTEP chapter sequence](https://pages.cs.wisc.edu/~remzi/OSTEP/), [Cornell's OS course schedule](https://www.cs.cornell.edu/courses/cs4410/2026su/schedule/), the [PostgreSQL beginner tutorial](https://www.postgresql.org/docs/current/tutorial.html), [MDN's beginner web explanation](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works), the [Python tutorial](https://docs.python.org/3/tutorial/), [FastAPI's step-by-step tutorial](https://fastapi.tiangolo.com/tutorial/), [pandas' introductory tutorials](https://pandas.pydata.org/docs/getting_started/intro_tutorials/), [Google's ML Crash Course](https://developers.google.com/machine-learning/crash-course) and [Hugging Face's LLM course](https://huggingface.co/learn/llm-course/). These establish topic coverage and prerequisite order. They do **not** prove that a particular prompt is statistically common in hiring; the prompts below are representative interview-style checks, not a ranked “most asked” list.

## The teaching contract

Assume a motivated student can use a browser but has never studied this subject. Do not assume they know words such as process, schema, endpoint, token or vector. A lesson should take one new idea at a time:

1. **Why it matters:** a familiar situation in one or two sentences.
2. **Name the pieces:** define each new word before using it. Show a small diagram or physical example when it clarifies the relationship.
3. **Worked example:** walk through the behavior with concrete values. Include a second, different example when the first analogy could mislead.
4. **Check understanding:** a low-stakes prediction *after* teaching, with explanation for every choice. A guess is not mastery.
5. **Use it:** a tiny practical or verbal task in a new situation. Code appears only when it helps the concept.
6. **Interview view:** after learning and practice, ask for a 60–90 second explanation and show a reference answer on request.

This order is supported by research on [worked examples for novices](https://www.tandfonline.com/doi/abs/10.1207/s1532690xci0201_3) and [retrieval practice for retention](https://doi.org/10.1126/science.1152408). The product should let an experienced learner skip a known foundation, but fresh learners enter at the first concept. A lesson is not complete merely because the learner clicked through or guessed an MCQ.

Use one durable, ordinary-life example through a unit, then a second transfer example from software. State where an analogy stops matching the system. Avoid invented “production incident” claims presented as fact; fictional examples should be labelled as such.

## Shared starting ramp (before any non-DSA citadel)

Five optional, plain-language mini-lessons: (1) what a program and data are; (2) what memory, disk and a file are; (3) what a client and server are; (4) how to read a tiny diagram and a code snippet; (5) what Learn, Practice and Interview mean here. A student may test out of this ramp. It is a bridge, not an entire introductory engineering course.

## Citadel IV — Operating systems and concurrency

**New promise:** “Understand what a computer does when several programs need its CPU, memory and files, then learn how simultaneous work can go wrong.” The present title overemphasizes Python's GIL and async before basic OS concepts. The learning route should be:

| Order | Unit and small concepts to teach | Representative explanation or interview prompt | Existing challenge placement |
| --- | --- | --- | --- |
| 1 | **Meet the OS:** hardware vs software; OS as resource manager; application vs kernel; user mode; system call | “What happens when an app asks to open a file? Why can it not simply read any memory?” | New teaching lessons; no coding challenge yet |
| 2 | **Programs become processes:** program vs running process; process ID; start, ready, running, blocked, finished; separate address spaces | “Why does opening the same app twice create two processes? What is isolated?” | `memory-isolation-threads-vs-processes` after the lessons |
| 3 | **Share the CPU:** core; scheduler; time slice; context switch; responsiveness vs throughput; CPU-bound vs waiting for I/O | “How can three apps appear active on one core? What does a context switch save?” | `context-switch-cost-model`; later `concurrency-vs-parallelism-cores` |
| 4 | **Memory basics:** bytes and addresses; RAM vs disk; stack vs heap as introductory models; virtual address space; pages and page faults; why excessive paging hurts | “Why can two processes use the same virtual address? What happens on a page fault?” | `virtual-memory-page-replacement` only after these |
| 5 | **Threads and shared state:** one process, multiple threads; each thread's execution state; shared memory; concurrency vs parallelism; interleaving | “When do two threads see the same counter? Can concurrent work run on one core?” | `processes-vs-threads-memory`, `deterministic-interleaving-counter` |
| 6 | **Make shared changes safe:** read–modify–write; race condition; critical section; mutex; condition variable; semaphore; choose the primitive | “Why can two increments produce one? How does a lock fix it? How is a semaphore different?” | `mutex-protected-counter`, `bounded-semaphore-simulator` |
| 7 | **When waiting never ends:** lock ownership; hold-and-wait; circular wait; deadlock vs starvation; prevention, detection and recovery | “Draw a two-worker deadlock. Which rule could you change to avoid it?” | `deadlock-cycle-detector`, `hierarchical-lock-order-resolver` |
| 8 | **Files and I/O:** file, directory and path; file descriptor/handle; read/write and buffering; persistence vs RAM; basic permissions | “What does saving a file ask the OS to do? Why is a write not necessarily durable immediately?” | New applied file/I/O task; the current citadel has no coverage |
| 9 | **Choose a concurrency model:** threads, processes and async tasks; blocking vs non-blocking I/O; event loop; CPU vs I/O workloads | “For 100 network waits and one CPU-heavy calculation, which model would you choose and why?” | `asyncio-event-loop-semaphore`, `thread-vs-process-pool-advisor` |
| 10 | **Python-specific appendix:** default CPython GIL, free-threaded builds, pools, one production cache-stampede case | “Does the GIL make shared-state code automatically correct?” | `python-gil-contention`, `single-flight-cache-lock` |

**Minimum core:** Units 1–8. Units 9–10 are applied engineering extensions. A learner should never reach deadlock before meeting a thread, shared resource and lock. For the counter, teach *process → thread → shared value → interleaving → race → lock*, then introduce the challenge. For deadlock, use workers sharing two tools, then database transactions waiting on locks, and finally a resource-allocation graph. The learner should be able to narrate the cycle before coding a detector.

This scope matches the broad foundations taught by [OSTEP](https://pages.cs.wisc.edu/~remzi/OSTEP/) and [Cornell CS 4410](https://www.cs.cornell.edu/courses/cs4410/2026su/schedule/): processes, scheduling, synchronization, memory and file systems. It deliberately avoids making kernel implementation or scheduler mathematics mandatory for every learner.

## Citadel III — Databases, SQL and caching

**New promise:** “Store information accurately, ask useful questions of it, then understand why some queries are slow or unsafe.” The current first lesson on 8KB heap pages is an advanced storage lesson, not an introduction.

| Order | Unit and small concepts to teach | Representative prompt | Existing challenge placement |
| --- | --- | --- | --- |
| 1 | **What is a database?** data vs database vs DBMS; table, row, column, data type; one student/one course example | “How would you store students and their courses without repeating every student's details?” | New concept lessons |
| 2 | **Identity and relationships:** unique value, primary key, foreign key, `NULL`, one-to-many and many-to-many; constraints | “Can two students have the same name? Why use `student_id`? What prevents an enrollment for a missing student?” | New tiny schema exercise |
| 3 | **Read and change data:** `SELECT`, `WHERE`, `ORDER BY`, `INSERT`, `UPDATE`, `DELETE`; safe filtering | “Which rows does this query return? What changes if `WHERE` is omitted?” | Move the easier existing SQL tasks here |
| 4 | **Join and summarize:** inner/left joins, missing matches, `COUNT`, `GROUP BY`, `HAVING`; then simple subqueries | “Which customers never ordered? Why does a left join help?” | `sql-customers-never-order`, `sql-employees-earning-more-than-managers` |
| 5 | **Design trustworthy tables:** dependencies and duplicate facts; normalization to 1NF/2NF/3NF at an intuitive level; views | “If a department name changes, how many rows should need updating?” | `database-normalization`, `sql-decompose-3nf-lossless-join`, view task |
| 6 | **Transactions:** what a transaction is; atomicity, consistency, isolation, durability; rollback; lost update and isolation | “If money leaves one account but never reaches another, what must the DB do?” | `sql-acid-money-transfer`, `sql-lost-update-optimistic-lock` |
| 7 | **Make queries fast:** scan vs index; primary-key lookup; B-tree intuition; composite index and leftmost prefix; read a simple `EXPLAIN` | “Why does a lookup get slower as a table grows? When might an index *not* help?” | `btree-vs-hash-indexes`, `composite-index-left-prefix`, `sql-explain-composite-index` |
| 8 | **Under the hood:** disk pages, heap storage, buffer cache, query plan; why indexes cost writes and storage | “Why does the DB fetch pages rather than individual bytes?” | `heap-pages-and-scans` moves here |
| 9 | **Reuse and analysis:** cache-aside, invalidation and stampedes; then window functions and analytical SQL | “Why can a cached price be stale? When is `ROW_NUMBER` useful?” | Redis tasks and `sql-*` analytical tasks |

Use a school enrollment database first, then transfer to an e-commerce order database. The first schema screen should let a learner connect `students.student_id` to `enrollments.student_id`; it should not mention `ctid` or B-trees. This follows the beginner-to-advanced progression in the [PostgreSQL tutorial](https://www.postgresql.org/docs/current/tutorial.html) and the [PostgreSQL constraints guide](https://www.postgresql.org/docs/current/ddl-constraints.html); [CMU's database course](https://15445.courses.cs.cmu.edu/spring2026/syllabus.html) supports the later storage/index/transaction units.

## Citadel VII — Computer networks

Two published questions cannot function as a networking citadel. Build a small but complete path, then connect it to Backend:

| Order | Unit | Representative prompt |
| --- | --- | --- |
| 1 | Two computers communicating; client/server; packets; network vs web | “What crosses the network when you open a site?” |
| 2 | IP address, local network, router, port and socket | “Why are an IP address and a port both needed?” |
| 3 | DNS: domain name, lookup, caching and TTL | “What happens after typing a domain name?” → existing `dns-recursive-resolver` later |
| 4 | TCP vs UDP; connection, ordering, retries, byte stream | “Why might a video call choose UDP, while a web request needs reliable delivery?” |
| 5 | TCP connection setup, teardown and failure | “Explain SYN, SYN+ACK, ACK.” → existing `tcp-three-way-handshake` later |
| 6 | TLS/HTTPS at a conceptual level; certificate identity and encryption | “What does HTTPS protect, and what does it not protect?” |
| 7 | Trace one page load: DNS → connection/TLS → HTTP → response; latency and timeouts | “A page hangs before any response. Where would you look first?” |

The initial explanation should be no more technical than [MDN's “How the web works”](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works). TCP internals follow only after IP, port and client/server are understood. HTTP/3 uses QUIC, so the course must not teach that all HTTP always uses TCP.

## Citadel V — Backend and APIs

| Order | Unit | Representative prompt and current placement |
| --- | --- | --- |
| 1 | Browser, server, API and one request/response | “What happens when you click Save?” Teach before `http-status-code-diagnostics` |
| 2 | URL/path, method, headers, body, JSON, status families | “What do GET and POST mean? When is a 404 different from a 500?” Then HTTP diagnosis |
| 3 | First small API: route, input validation, response; FastAPI/Pydantic as one implementation | “What should happen for an invalid age?” Then Pydantic and dependency-injection tasks |
| 4 | Persistence and data access; connect to the DB citadel | “Where does a saved item live after the process restarts?” |
| 5 | Identity and permissions: sessions/tokens, authentication vs authorization, password handling | “Who is the user, and may they delete this item?” Then JWT/refresh tasks |
| 6 | Browser security and CORS: origin and preflight, distinct from auth | “Why can a browser block a cross-origin response while a server-to-server request works?” Then CORS task |
| 7 | Slow work: blocking vs async, queues, background jobs and polling | “Why return 202 for a long export?” Then async jobs and polling tasks |
| 8 | Reliability: retries, timeout, idempotency, rate limiting, cache | “How do you avoid double charging after a timeout?” Then current idempotency/Redis tasks |

The learner should build one tiny notes or ordering API across units. Framework-specific names are introduced after HTTP ideas, as in the [FastAPI tutorial](https://fastapi.tiangolo.com/tutorial/) and [MDN HTTP guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview). Authentication and CORS must be taught as different concerns.

## Citadel II — Practical Python, OOP and data

This citadel currently begins with Python object identity and mutable defaults. Add a compact, optional Python runway for learners who have never coded:

| Order | Unit | Representative prompt and current placement |
| --- | --- | --- |
| 1 | Values, variables, strings/numbers/booleans, expressions | “What value does this variable hold after two assignments?” |
| 2 | Lists, dictionaries, loops and simple functions | “How would you count items in a list?” |
| 3 | Errors, tests, modules, reading/writing files and JSON | “What happens when a file is missing?” Then existing JSON/CSV tasks |
| 4 | Objects, classes, methods and composition before inheritance | “What belongs on an Order object?” Then dunder/ABC tasks |
| 5 | References, mutability, function defaults, scope and generators | “Why did changing one list affect another?” Then world 13 tasks |
| 6 | Design for change: interfaces, SOLID and patterns only after a simple app exists | “How do we add a new payment provider without editing checkout logic?” Then world 14 tasks |
| 7 | Tabular data: CSV → DataFrame → select/filter → missing values → group/merge | “Which rows are missing a price?” Then world 16 tasks |

The runway should be skippable by a learner comfortable with Python. It follows the [Python tutorial](https://docs.python.org/3/tutorial/) and [pandas' introductory tutorials](https://pandas.pydata.org/docs/getting_started/intro_tutorials/). Do not begin a beginner lesson with CPython pointers or SOLID acronyms.

## Citadel VI — AI engineering and GenAI

The current entry point is vector math. Move that to the middle, and keep GEPA/genetic prompt optimization optional at the end:

| Order | Unit | Representative prompt and current placement |
| --- | --- | --- |
| 1 | What AI, ML and a model mean; training vs inference; examples of tasks | “What did a model learn, and what happens when we use it?” |
| 2 | Data, labels, train/test split, overfitting and evaluation | “Why can a model score well on training data but fail on new examples?” |
| 3 | Generative models and LLMs: tokens, context, next-token prediction, uncertainty | “Why can a fluent answer still be wrong?” |
| 4 | Prompts and structured outputs; limits, cost and privacy | “What information should not be sent to a third-party model?” |
| 5 | Embeddings and similarity: number vectors, distance/cosine intuition, top-k | “Why can similar meaning have nearby vectors?” Then world 21 tasks |
| 6 | Retrieval and RAG: source documents, chunking, search, context, citation, grounded answer | “How can an assistant answer from a company handbook?” Then world 35 tasks |
| 7 | Evaluate retrieval and answers; failure cases, hallucination, relevance, latency | “Did the system retrieve the right passage, and did the answer use it?” |
| 8 | Tool use and agents: tool call, state, stopping rule, permissions and failure | “When should the assistant call a tool rather than guess?” Then world 36 tasks |
| 9 | Advanced optional: reranking, hybrid search, prompt optimization; resume defense as separate practice | Place GEPA and senior resume grill here, not on the beginner path |

Use a school handbook assistant first, then a support-ticket assistant. Explain what a source document and search result are before any vector database diagram. The [Google ML Crash Course](https://developers.google.com/machine-learning/crash-course) places data, evaluation and model basics before embeddings/LLMs; the [Hugging Face LLM course](https://huggingface.co/learn/llm-course/) supplies the later token/model vocabulary. The [original RAG paper](https://arxiv.org/abs/2005.11401) is a technical reference, not required reading for a beginner.

## System Design (currently a separate track)

It also needs a beginner route: (1) one user and one request; (2) client, server and database; (3) draw a request path and identify state; (4) estimate simple traffic and find a bottleneck; (5) add a cache or queue only for a stated need; (6) handle failure and retries; (7) compare two designs with trade-offs. Only then start SOLID, LLD case studies and distributed HLD. A learner should be able to explain a one-server app before designing a million-user service. Cross-link the OS, DB and Networking foundations instead of repeating them as assumed knowledge.

## Product and content implementation after review

1. **Add lesson content separately from coding challenges.** Proposed fields: stable `lesson_id`, `citadel_id`, `module_id`, ordered prerequisite IDs, plain goal, vocabulary, explanation, worked examples, misconception, small check, transfer task, optional sources and review status. Support diagram and text-only lessons; do not require starter code or three tests. A module may contain several lessons and one or two applied challenges.
2. **Add a real prerequisite graph.** Every challenge names its required lessons. The world page shows “Start with basics → Learn → Try it → Explain it,” not an unexplained list of numbered challenges. A student may open any challenge, but a fresh learner sees a “Learn these first” route. Keep a visible expert skip.
3. **Preserve existing links and progress.** Keep question slugs and internal world IDs stable initially. Add an explicit display order so new foundation modules can appear before existing world 19/17/20/21/40 without confusing URL IDs. Migrate question position only after verifying progress is keyed by slug; store lesson progress separately. Never silently mark a new concept mastered because an old challenge was solved.
4. **Separate names and counts.** Label modules as modules, concepts as lessons, and applied work as challenges/interview prompts. Stop showing synthetic `lc` numbers or generated LeetCode links for non-DSA content. The dashboard must count concept progress and challenge progress separately.
5. **Pilot one full vertical slice each for OS and DBMS.** OS: app → process → thread → race → lock → deadlock. DB: table → key → relationship → join → transaction → index. Author two examples, one misconception and a transfer task per lesson. Test with a student who has not learned the subject. Fix confusion before scaling to the other tracks.
6. **Migrate the remaining tracks in dependency order:** Networking → Backend; Python runway → Python/Data; ML/LLM basics → AI; cross-linked System Design last. Retain useful existing simulations and challenges, but move them behind their foundations. The motion work remains a separate handoff.
7. **Verify content, not just rendering.** Every new lesson needs technical review, accessible text without its diagram, a working link/source check, direct-link and refresh behavior, and one transfer prompt in a different context. Validate graph cycles/missing IDs and run the existing content, frontend and backend checks.

### Specific accuracy repairs discovered during the audit

- The current heap-page lesson says PostgreSQL and SQLite typically use 8KB pages. PostgreSQL commonly defaults to 8KB, but [SQLite's documented default is 4096 bytes](https://sqlite.org/pragma.html). Its `ctid` discussion must say this is a PostgreSQL physical row-version location, [not a stable logical row ID](https://www.postgresql.org/docs/current/ddl-system-columns.html).
- The race-condition lesson describes exactly three named CPython bytecode instructions and lock behavior “at any nanosecond.” [CPython bytecode can change across versions](https://docs.python.org/3/library/dis.html). Teach the language-level read–modify–write hazard with a deterministic interleaving instead of depending on a particular disassembly or scheduling accident.
- GIL lessons must distinguish default CPython from [optional free-threaded builds](https://docs.python.org/3/howto/free-threading-python.html). Avoid presenting “Python threads never run in parallel” as a universal rule.
- Interview question frequency has not been measured here. We should review actual candidate/interviewer input before adding “top asked” labels or company names.

## Review checklist for you

- Is this the right learner promise: **core concepts first, applied interview work second**, with an expert skip?
- Does the OS route cover the foundational areas you expect, including processes, scheduling, memory, synchronization and files?
- Do DB keys/relationships and basic SQL come early enough, with indexing/storage late enough?
- Are the Python and ML starting ramps appropriately small for this product, or should one be a separate optional track?
- Should System Design become an eighth citadel in the same map, or remain a linked separate track?

Once these decisions are settled, the first implementation should be the OS and DB vertical slices and the lesson/prerequisite model—not a bulk generation of thin quiz pages.
