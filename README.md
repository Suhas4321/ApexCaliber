# ApexCaliber (formerly PatternForge)

<div align="center">

**The Full-Stack, Systems & AI Engineering Citadel Platform**

[![Tests](https://img.shields.io/badge/tests-32%20passed-brightgreen.svg)]()
[![Curriculum](https://img.shields.io/badge/curriculum-198%20verified%20problems-blue.svg)]()
[![Citadels](https://img.shields.io/badge/citadels-7%20specialized%20domains-purple.svg)]()
[![Worlds](https://img.shields.io/badge/worlds-42%20total%20worlds-orange.svg)]()
[![Protocol](https://img.shields.io/badge/protocol-apex.trace.v1-cyan.svg)]()

*Stop memorizing code templates. Master the causal mechanisms, basement-layer trade-offs, and failure modes of production engineering.*

</div>

---

## 🏛️ The Pedagogical Philosophy: Two Distinct Engines

Traditional platforms force a single paradigm onto every topic—either reducing complex distributed systems to multiple-choice trivia or forcing distributed consensus into an empty coding box.

**ApexCaliber** splits engineering mastery into two deliberate learning architectures:

```
                                 APEXCALIBER CURRICULUM
                                           │
         ┌─────────────────────────────────┴─────────────────────────────────┐
         ▼                                                                   ▼
  CITADEL I: DSA                                              CITADELS II–VII: SYSTEMS & AI
  [Code-First Mastery]                                        [Concept Journey & POE First]
  ────────────────────                                        ─────────────────────────────
  • 12 Worlds · 107 Problems                                  • 30 Worlds · 91 Problems
  • Line-by-Line Heap/Pointer Tracing                         • 6–7 Stage POE Simulation Loop
  • Indian OA Real-World Hooks                                • Predict ➔ Observe ➔ Explain
  • 3-Tier Socratic Hint System                               • Interactive Parameter Controls
  • 4-Line Interview Pitch Defense                            • Pre-Wired Code Transfer Labs
```

### 1. Code-First Engine (Citadel I: Data Structures & Algorithms)
Every algorithmic problem guides the developer through 4 rigorous phases:
1. **Concept**: Why the pattern exists, Indian OA scenario vs clean LeetCode statement with trigger keywords.
2. **Micro-drills**: 3 targeted exercises training isolated sub-mechanics.
3. **Arena**: Real Monaco editor with line-by-line animated state tracing (pointers, heaps, trees, recursions). Socratic hints guide without giving away answers.
4. **Pitch Studio**: Practice defending time/space complexity and trade-offs against a model interview script, scheduled via spaced repetition (3, 7, 21 days).

### 2. Teaching-First Engine (Citadels II–VII: Systems, Runtime, Data & GenAI)
Non-DSA systems problems adhere to the **`apex.trace.v1` Universal Learning Protocol**, powered by the **POE (Predict ➔ Observe ➔ Explain)** model:
- **Incident Anchor**: Grounded in real-world outages (e.g. Swiggy delivery deadlocks, BharatPay token theft, SwiftCart 2M QPS polling stampedes, FitLabs 10GB OOM crashes).
- **Predict**: Interactive hypothesis quiz confronting common misconceptions before seeing the simulation.
- **Observe**: Interactive reactive controls (sliders, selectors, toggles) driving deterministic simulations (packet flows, buffer pools, page replacement, lock wait-for graphs).
- **Explain**: Deep causal explanation illuminating why the systems invariant functions.
- **Transfer Challenge**: Pre-wired coding sandbox with instant test execution—no blank-canvas homework fatigue.

---

## 🏰 The 7 Citadels (42 Worlds · 198 Problems)

| Citadel | Domain | Worlds Covered | Highlights & Systems Concepts |
| :--- | :--- | :---: | :--- |
| **🏰 Citadel I** | **Data Structures & Algorithms** | Worlds 1–12 *(107 problems)* | Two Pointers, Sliding Window, Monotonic Stack, Binary Search, Trees, Graphs, DP, Intervals. |
| **🐍 Citadel II** | **Python Internals & Data Engineering** | Worlds 13–16 *(16 problems)* | PyObject 28-byte headers, O(1) generator streaming, SOLID OOP patterns, vectorized Pandas merges. |
| **🗄️ Citadel III** | **Database Systems, SQL & In-Memory Caching** | Worlds 17, 18, 22–25, 39 *(25 problems)* | 8KB Slotted Heap Pages, B-Trees vs Hash indexes, ACID isolation anomalies, Redis cache-aside stampede mutex. |
| **⚙️ Citadel IV** | **Operating Systems, Concurrency & Memory** | Worlds 19, 26–30, 42 *(18 problems)* | 4KB Virtual Memory paging, Belady's Anomaly, 3-color DFS deadlock cycle detection, CPython GIL contention. |
| **🚀 Citadel V** | **Backend Engineering & API Design** | Worlds 20, 31–34 *(15 problems)* | HTTP lifecycle diagnostics, OAuth 2.0 Refresh Token Rotation (RTR), Pydantic 422 validation, HTTP 202 async backoff. |
| **🤖 Citadel VI** | **GenAI Systems, RAG & Agents** | Worlds 21, 35–38 *(13 problems)* | Vector Cosine Similarity, Reciprocal Rank Fusion (RRF), LangGraph cyclic state machines, GEPA prompt optimization, Staff Resume Grill. |
| **🌐 Citadel VII** | **High-Performance Networking** | Worlds 40–41 *(4 problems)* | Hierarchical recursive DNS resolution, TCP 3-Way Handshake, SYN flood resilience, sliding window rate limiters. |

---

## 📚 Architectural Specifications & RFC Library

Every systems world is engineered according to an explicit pedagogical blueprint published in [`docs/rfc/`](docs/rfc/):

- [`W13_PYTHON_MEMORY.md`](docs/rfc/W13_PYTHON_MEMORY.md) — PyObject Memory Layout, Eager List Danger & Lazy Generator Streaming.
- [`W17_DBMS_STORAGE.md`](docs/rfc/W17_DBMS_STORAGE.md) — 8KB Slotted Heap Pages, Item Pointers, and Physical Tuple IDs (`ctid`).
- [`W21_VECTOR_SEARCH.md`](docs/rfc/W21_VECTOR_SEARCH.md) — Dense Vector Embeddings, Cosine Similarity & Unit Sphere Normalization.
- [`W25_TRANSACTIONS_ACID.md`](docs/rfc/W25_TRANSACTIONS_ACID.md) — Transaction Isolation Levels, Dirty Reads, Phantom Reads & Optimistic Locks.
- [`W27_LOCKS_DEADLOCKS.md`](docs/rfc/W27_LOCKS_DEADLOCKS.md) — Coffman Conditions, Wait-For Graphs (WFG), 3-Color DFS Cycle Detection.
- [`W28_GIL_CONCURRENCY.md`](docs/rfc/W28_GIL_CONCURRENCY.md) — CPython Reference Counting, GIL Contention & Free-Threaded Python 3.13t.
- [`W31_TOKEN_ROTATION.md`](docs/rfc/W31_TOKEN_ROTATION.md) — OAuth 2.0 Single-Use Refresh Token Rotation (RTR) & Family Revocation.
- [`W32_FASTAPI_VALIDATION.md`](docs/rfc/W32_FASTAPI_VALIDATION.md) — Declarative Pydantic Schemas, CPython Boolean Inheritance & HTTP 422.
- [`W33_ASYNC_POLLING.md`](docs/rfc/W33_ASYNC_POLLING.md) — HTTP 202 Accepted, Reverse Proxy Timeouts & Truncated Exponential Backoff with Jitter.
- [`W34_RATE_LIMITER.md`](docs/rfc/W34_RATE_LIMITER.md) — Redis Sorted Sets, Sliding Window Log & Atomic Lua Scripts.
- [`W35_HYBRID_RRF.md`](docs/rfc/W35_HYBRID_RRF.md) — BM25 Lexical + Vector Dense Retrieval & Reciprocal Rank Fusion ($k=60$).
- [`W36_AGENT_GRAPH.md`](docs/rfc/W36_AGENT_GRAPH.md) — LangGraph Cyclic StateGraphs, Conditional Edge Routing & Step Budget Guards.
- [`W37_PROMPT_OPTIMIZER.md`](docs/rfc/W37_PROMPT_OPTIMIZER.md) — GEPA Genetic Optimization, Token Budget Penalties & Pareto Frontiers.
- [`W38_RESUME_GRILL.md`](docs/rfc/W38_RESUME_GRILL.md) — The 4-Part Staff Engineering Defense Matrix (Bottleneck $\rightarrow$ Alternatives $\rightarrow$ Primitives $\rightarrow$ Metrics).
- [`W39_REDIS_CACHING.md`](docs/rfc/W39_REDIS_CACHING.md) — Cache-Aside, TTL Expiration, and Distributed Mutex Locks against Cache Stampedes.
- [`W40_DNS_RESOLUTION.md`](docs/rfc/W40_DNS_RESOLUTION.md) — Root, TLD, and Authoritative Nameserver Resolution Hierarchy.
- [`W41_TCP_HANDSHAKE.md`](docs/rfc/W41_TCP_HANDSHAKE.md) — TCP 3-Way Handshake, ISN Sequence Offsets & SYN Flood SYN Cookies.
- [`W42_VIRTUAL_MEMORY.md`](docs/rfc/W42_VIRTUAL_MEMORY.md) — 4KB Paging, Hardware Page Fault Traps, Belady's Anomaly & LRU Stack Property.

---

## ⚡ Quickstart

### Prerequisites
- **Python 3.11+**
- **Node.js 20+**

### 1. Launch Production Server
```bash
./run.sh
```
Builds the frontend and boots the FastAPI service on **http://127.0.0.1:8010**.

### 2. Launch Development Server (Hot-Reload)
```bash
./run.sh dev
```
Runs the FastAPI backend daemon on `:8010` and Vite dev server on **http://127.0.0.1:5173**.

### 3. Run Automated Quality & Verification Suite
```bash
./run.sh test
```
Executes:
1. Backend pytest suite (`32 passed, 0 failed`).
2. Full curriculum test harness (`scripts/validate_content.py`): executes all reference solutions across all 198 problems.

---

## 🛠️ Multi-Runner Execution Architecture

ApexCaliber includes specialized code execution runners tailored to distinct engineering disciplines:

- **`algorithmic`**: High-performance Python sandbox tracing local frame pointers, array indices, variables, and recursive call trees.
- **`python_practical`**: Realistic unit-test harness running assertions on production Python classes, generators, and async functions.
- **`sql_schema`**: In-memory relational database engine evaluating queries against real schemas, table relationships, and window functions.
- **`bash_terminal`**: Shell command evaluator testing Linux CLI pipes, sed/awk, and process inspection.

---

## 💾 Local Storage & Data Portability

- **Zero External Dependencies Required**: Progress, drafts, notes, and pitch recordings are stored in `backend/patternforge.db` (SQLite).
- **Automated Backup & Restore**: State is automatically mirrored to `backend/backups/user_data.json` after every modification. If the SQLite database is ever reset, the next boot automatically restores your complete progress.
- **Cloud Database (Optional)**: To connect a remote PostgreSQL/Supabase database, copy `backend/.env.example` to `backend/.env`, set `DATABASE_URL`, and install `requirements-postgres.txt`.

---

## ⌨️ Keyboard Shortcuts & Power Navigation

| Shortcut | Action |
| :--- | :--- |
| `Ctrl+K` or `/` | Global search for any question, topic, citadel, or pattern |
| `Ctrl+Enter` | Run solution against test suite in active editor |
| `Alt+1` – `Alt+4` | Switch between unlocked stages / tabs |
| `←` / `→` | Step backward / forward through an execution trace |
| `Space` | Play / Pause execution animation |

---

## 📜 Adding New Content

To author a new question or concept journey:
1. Create a YAML file in `content/questions/<NN-world-name>/<slug>.yaml`.
2. Follow the schema defined in `backend/app/content_schema.py` and [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md).
3. Validate locally:
   ```bash
   backend/.venv/bin/python scripts/validate_content.py <slug>
   ```

---

<div align="center">

Crafted with precision for engineers who refuse to memorize solutions.

</div>
