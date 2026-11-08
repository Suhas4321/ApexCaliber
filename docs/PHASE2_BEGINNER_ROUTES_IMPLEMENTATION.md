# Phase 2: beginner routes beyond the OS/DB pilot

This phase expands the manually authored learning graph from 8 to 22 concept lessons. It does not complete the proposed syllabus. DSA content and challenge slugs remain unchanged.

## Shipped in this phase

- **OS:** Scheduling and I/O waiting, virtual memory and page faults, then deadlock built from lock ownership and circular wait. These follow the earlier process/thread/race/mutex pilot.
- **DBMS:** SQL filtering and ordering, then index tradeoffs. These follow the earlier table/key/join/transaction pilot.
- **Networks:** Client/server and URL, DNS and caching, then packets/TCP framing and the HTTP/3 exception. This gives the networking citadel its first beginner route.
- **Backend:** HTTP request anatomy, then response status classes. The first backend lesson links to the client/server prerequisite in Networks.
- **Python:** Names and shared objects, then function argument binding, mutation and rebinding.
- **AI:** Model training/prediction/evaluation, then embeddings and the limits of similarity as evidence.
- The dashboard and world pages discover concept routes from the API, so a newly authored citadel route appears without another hard-coded OS/DB condition.
- A locked lesson links to its exact prerequisites, including those in another citadel.
- Added prerequisite mappings for the corresponding advanced OS, DB, Network and HTTP challenges. Previously solved challenges retain their existing access policy.

Each new lesson includes a familiar situation, concise explanation, vocabulary, two different examples, a misconception, two scenario checks and a primary source. The existing Understand → Explore → Check presentation remains in place.

## Validation and limits

The graph validator checks unique IDs, known references and cycles. The focused API tests assert ordering, locked prerequisites and challenge mapping. The full backend suite, all 198 existing challenge solutions and the frontend build passed for this phase.

This is still a foundation slice, not a full engineering curriculum. The remaining syllabus work includes OS files, deeper synchronization and async/threading/multiprocessing; DB normalization, isolation and physical storage; full networking and backend security/idempotency; Python intermediate language concepts; AI/LLM/RAG/evaluations; and a dedicated System Design learning graph. Those should be authored and reviewed in small vertical slices, with comprehension checks on beginner learners before scaling. The visual and motion brief in `ANTIGRAVITY_MOTION_LEARNING_REDESIGN.md` remains separate.
