import json
from pathlib import Path

curriculum_path = Path("content/curriculum.json")
with open(curriculum_path) as f:
    c = json.load(f)

citadels = {c_obj["id"]: c_obj for c_obj in c["citadels"]}
worlds_by_citadel = {}
for w in c["worlds"]:
    cid = w.get("citadel_id", "unknown")
    worlds_by_citadel.setdefault(cid, []).append(w)

lines = []
lines.append("# 🏛️ ApexCaliber: Master Architectural Transformation Plan & Tracking Blueprint\n")
lines.append("> **Document Purpose:** Authoritative system architecture, data contracts, and curriculum execution tracker for transforming ApexCaliber into an interactive, teaching-first Software Engineering Academy.\n")
lines.append("> **Architectural Co-Workers:** Principal Architect (GPT-6) & Lead Implementation Engineer (Antigravity)\n")
lines.append("> **Last Updated:** November 2026 (incorporating RFC AC-LEARN-002 across all 7 Citadels)\n")
lines.append("---\n")

lines.append("## 1. Executive Architectural Blueprint\n")
lines.append("### The Core Two-Experience Platform Model")
lines.append("| Dimension | Citadel I: DSA Apex Mastery | Citadels II–VII: Software Engineering Citadels |")
lines.append("| :--- | :--- | :--- |")
lines.append("| **Pedagogy** | **Code-First Puzzle Practice** | **TEACHING-FIRST Interactive Guided Journey** |")
lines.append("| **Landing UI** | Split-screen Monaco Code Editor | Rich Concept Journey (`JourneyPlayer`) |")
lines.append("| **Learner Action** | Implement algorithm to pass test cases | **Predict ➔ Observe ➔ Explain ➔ Experiment (POE)** |")
lines.append("| **Code Role** | Primary deliverable (empty function stub) | **Pre-wired Interactive Lab** (runnable code with parameter dials) |")
lines.append("| **Engine** | `python_trace` harness + Step Player | **Mode A Deterministic Simulator** + **Mode B Executable Lab** |\n")

lines.append("### The Dual-Engine Simulation Architecture")
lines.append("```mermaid")
lines.append("flowchart TD")
lines.append("    UI[\"React Concept Journey (JourneyPlayer)\"] --> Controls[\"Controls, Sliders & Predictions\"]")
lines.append("    Controls --> ModeA[\"Mode A: Deterministic Simulation Engine (Client/Fast State Machine)\"]")
lines.append("    Controls --> ModeB[\"Mode B: FastAPI Executable Lab (Real Python/SQLite/Redis Worker)\"]")
lines.append("    ModeA --> Stream[\"Normalized Event Stream (TraceEvents)\"]")
lines.append("    ModeB --> Stream")
lines.append("    Stream --> Viz[\"Interactive Visualizers (CacheRelational, NetworkFlow, Paging, Blueprint)\"]")
lines.append("```\n")

lines.append("### The 6 Simulation Engine Families")
lines.append("| Engine Family | Target Worlds | System Responsibility |")
lines.append("| :--- | :--- | :--- |")
lines.append("| `network_engine` | 40, 41 | DNS hierarchical resolution, TCP 3-way handshake, socket states, RTO timeouts |")
lines.append("| `backend_engine` | 17, 18, 20, 21, 28 | HTTP request lifecycle, Gateway timeouts (504), Idempotency, JWT, Token bucket rate limiting |")
lines.append("| `storage_engine` | 24, 25, 26, 39 | 8KB heap pages, B-Tree index scans, ACID isolation anomalies, Redis cache-aside & stampede |")
lines.append("| `os_engine` | 19, 27, 42 | CPU vs I/O threads, CPython GIL contention, Deadlock WFG cycles, Virtual memory page replacement |")
lines.append("| `python_runtime_engine` | 13, 14, 15, 16 | PyObject pointers, heap references, ref counting, generator streaming, vectorized Pandas |")
lines.append("| `ai_engine` | 34, 35, 36, 37, 38 | Tokenization costs, HNSW dense vector similarity, RAG chunking & reranking, tool-calling agents |\n")

lines.append("### The 12-Point Quality Checklist (Mandatory Acceptance Gate)")
lines.append("1. [ ] Begins with a concrete, relatable product scenario (Swiggy, Netflix, Zerodha, Razorpay).")
lines.append("2. [ ] Declares prerequisites and measurable learning objectives.")
lines.append("3. [ ] Explains the causal mechanism rather than just abstract terminology.")
lines.append("4. [ ] Includes a meaningful **Prediction (POE)** before revealing any outcome.")
lines.append("5. [ ] Includes an interactive experiment with observable state (sliders, buttons, toggles).")
lines.append("6. [ ] Uses an appropriate visual diagram reflecting actual model behavior.")
lines.append("7. [ ] Exposes at least one common misconception or failure condition.")
lines.append("8. [ ] Provides working, pre-loaded code in an interactive lab.")
lines.append("9. [ ] Includes a transfer challenge testing application in a different context.")
lines.append("10. [ ] Documents simplifying assumptions and production edge cases.")
lines.append("11. [ ] Supports keyboard navigation, responsive mobile layouts, and reduced motion.")
lines.append("12. [ ] Validated with automated Pydantic schema tests and deterministic assertions.\n")
lines.append("---\n")

lines.append("## 2. Citadel-by-Citadel Architectural Specifications (All 23 Systems Worlds)\n")

citadel_specs = {
    "computer_networking": {
        "title": "Citadel VII: Computer Networking & Protocols",
        "capstone": "Diagnose an unreachable trading API (Distinguish DNS failure vs TCP timeout vs TLS drop)",
        "worlds": {
            40: ("DNS & Domain Resolution", "pay.flipkart.com resolution", "Misconception: 'DNS returns the IP immediately from the browser'", "network_flow"),
            41: ("TCP 3-Way Handshake & Sockets", "High-frequency trade socket connection", "Misconception: 'SYN packets send payload data'", "network_flow")
        }
    },
    "backend_apis": {
        "title": "Citadel V: Backend Engineering & Distributed Systems",
        "capstone": "Reliable commerce checkout under network partition (Idempotency + Retries + Dead letter queue)",
        "worlds": {
            17: ("HTTP Lifecycle, Headers & Status Codes", "Swiggy food order checkout", "Misconception: '504 means the database transaction aborted'", "http_lifecycle"),
            18: ("Stateless Auth, JWT & RBAC", "Blinkit rider vs customer token spoofing", "Misconception: 'JWT payload is encrypted and cannot be read by clients'", "system_blueprint"),
            20: ("Pydantic Validation & FastAPI Middleware", "Razorpay payment payload validation (422)", "Misconception: 'FastAPI async endpoints always run faster than sync'", "system_blueprint"),
            21: ("Asynchronous Architecture & Task Queues", "Hotstar push notifications to 10M users", "Misconception: 'HTTP 202 guarantees the task will succeed'", "system_blueprint"),
            28: ("System Resilience & Rate Limiting", "Zerodha login burst under market opening surge", "Misconception: 'Fixed window counter prevents thundering herd rate limit bursts'", "system_blueprint")
        }
    },
    "sql_dbms": {
        "title": "Citadel III: Database Systems & In-Memory Caching",
        "capstone": "Flash-sale inventory correctness under 50k concurrent requests (Row locks + Redis mutex)",
        "worlds": {
            24: ("B-Trees & Relational Storage", "PostgreSQL 10M user lookup scan", "Misconception: 'Creating an index on (A, B, C) accelerates queries on B alone'", "cache_relational"),
            25: ("Transactions, ACID & Isolation Levels", "Bank balance transfer race condition", "Misconception: 'Read Committed prevents lost updates under concurrent writes'", "cache_relational"),
            26: ("Relational Schema Design & SQL Optimization", "E-commerce order analytics query", "Misconception: 'Subqueries always execute once per outer row'", "sql_pipeline"),
            39: ("Redis Caching Strategies, Eviction & Stampede", "Hot celebrity tweet view surge", "Misconception: 'Cache-Aside alone prevents database crashes when keys expire'", "cache_relational")
        }
    },
    "os_concurrency": {
        "title": "Citadel IV: OS, Concurrency, GIL & Async",
        "capstone": "The mysteriously frozen API (Diagnose thread starvation vs event loop block vs deadlock)",
        "worlds": {
            19: ("OS Concurrency, Threads & GIL", "Image resizing vs API fetch worker pool", "Misconception: 'Python threading runs CPU-heavy loops across 4 CPU cores in parallel'", "concurrency_timeline"),
            27: ("Locks, Semaphores & Deadlock Detection", "Double-lock account transfer deadlock", "Misconception: 'Adding more mutex locks makes concurrent programs safer'", "concurrency_timeline"),
            42: ("Virtual Memory & Page Replacement", "Server thrashing under 99% RAM usage", "Misconception: 'Virtual address directly equals the physical RAM chip pin address'", "memory_view")
        }
    },
    "python_data": {
        "title": "Citadel II: Practical Python, OOP & Clean Design",
        "capstone": "High-throughput streaming ETL pipeline with zero memory leak",
        "worlds": {
            13: ("Python Internals & PyObject", "Memory leak in list appending loop", "Misconception: 'Variables in Python hold raw values instead of PyObject pointers'", "system_blueprint"),
            14: ("OOP, SOLID & Design Patterns", "Payment gateway provider swap (Razorpay ➔ Stripe)", "Misconception: 'Inheritance is better than composition for code reuse'", "system_blueprint"),
            15: ("Defensive Parsing & Data Pipelines", "Corrupted partner CSV/JSON ingestion", "Misconception: 'Using json.loads on a 4GB file is fine if RAM is 8GB'", "dataframe_pipeline"),
            16: ("Vectorized Pandas & Numerical Processing", "Financial portfolio risk calculation", "Misconception: 'Iterating df.iterrows() is the standard way to process Pandas rows'", "dataframe_pipeline")
        }
    },
    "ai_resume": {
        "title": "Citadel VI: GenAI Systems & Intelligent Systems",
        "capstone": "Trustworthy enterprise AI assistant with guardrails, hybrid RAG, and semantic cache",
        "worlds": {
            34: ("LLM Foundational Mechanics", "Billing shock: 1M token invoice runaway", "Misconception: 'LLMs read characters and words like humans'", "system_blueprint"),
            35: ("Vector Embeddings & Similarity Search", "Semantic product search retrieval", "Misconception: 'Dot product and Cosine similarity are identical for unnormalized vectors'", "system_blueprint"),
            36: ("Production RAG Pipelines", "Hallucinated legal clause retrieval", "Misconception: 'Feeding more chunks to the LLM always produces better answers'", "system_blueprint"),
            37: ("Semantic Caching & Prompt Optimization", "Repeated FAQ user queries hitting GPT-4", "Misconception: 'Semantic cache similarity threshold of 0.70 is safe for enterprise data'", "system_blueprint"),
            38: ("Autonomous Agents & Tool Calling", "Financial trading agent placing unconfirmed order", "Misconception: 'LLM tool calling executes code inside the language model itself'", "system_blueprint")
        }
    }
}

for cid, c_data in citadel_specs.items():
    lines.append(f"### 🏰 {c_data['title']} (`{cid}`)")
    lines.append(f"> **Capstone Integration Challenge:** {c_data['capstone']}\n")
    lines.append("| World | Topic | Relatable Product Hook | #1 Misconception Tested | Visualizer Archetype |")
    lines.append("| :---: | :--- | :--- | :--- | :--- |")
    for wid, w_info in c_data["worlds"].items():
        lines.append(f"| {wid} | **{w_info[0]}** | {w_info[1]} | {w_info[2]} | `{w_info[3]}` |")
    lines.append("\n---\n")

lines.append("## 3. Phased Implementation Roadmap for Antigravity (Engineering Execution)\n")
lines.append("### Phase 1: Universal Learning Engine Core (Immediate)\n")
lines.append("- [ ] **Backend Schema:** Update `backend/app/content_schema.py` with `PoePrediction`, `ControlDefinition`, `PredictionChoice`, and `JourneyStage` models.")
lines.append("- [ ] **Frontend Player:** Create `frontend/src/features/journey/JourneyPlayer.tsx` with POE modal, interactive simulator host, and pre-wired lab drawer.")
lines.append("- [ ] **Pilot Lesson:** Populate and verify World 17 (`http-lifecycle/http-status-codes.yaml`) with the full 7-stage RFC specification.\n")
lines.append("### Phase 2: Networking & Backend Pipeline (Worlds 40, 41, 17, 28)\n")
lines.append("- [ ] Wire `network_engine` events for DNS (W40) and TCP 3-Way Handshake (W41).")
lines.append("- [ ] Build Token Bucket rate limiter interactive simulation (W28).")
lines.append("- [ ] Connect DNS ➔ TCP ➔ HTTP ➔ Rate Limiter end-to-end journey.\n")
lines.append("### Phase 3: Storage, ACID & Caching (Worlds 24, 25, 26, 39)\n")
lines.append("- [ ] Wire `storage_engine` with Redis Cache-Aside & Stampede Mutex (W39).")
lines.append("- [ ] Wire B-Tree 8KB page visualizer (W24) and ACID transaction isolation anomalies (W25).\n")
lines.append("### Phase 4: Runtime, Concurrency & Memory (Worlds 19, 27, 42, 13)\n")
lines.append("- [ ] Virtual Memory Paging & Frame replacement simulation (W42).")
lines.append("- [ ] OS Deadlock cycle detection & hierarchical ordering (W27).")
lines.append("- [ ] Python GIL contention vs Asyncio event loop (W19, W13).\n")
lines.append("### Phase 5: Production Workflows & Auth (Worlds 14, 15, 16, 18, 20, 21)\n")
lines.append("- [ ] JWT Stateless Auth & Refresh token replay detection (W18).")
lines.append("- [ ] FastAPI Pydantic 422 & Celery Task Queues with DLQ (W20, W21).")
lines.append("- [ ] OOP SOLID patterns & Vectorized Pandas (W14, W15, W16).\n")
lines.append("### Phase 6: GenAI & Intelligent Systems (Worlds 34, 35, 36, 37, 38)\n")
lines.append("- [ ] Tokenization cost calculator & HNSW vector search (W34, W35).")
lines.append("- [ ] Production RAG cross-encoder reranking & Semantic Caching (W36, W37).")
lines.append("- [ ] Autonomous tool-calling agent state graph with guardrails (W38).\n")

content_out = "\n".join(lines)
out_file = Path("APEXCALIBER_FULL_TRANSFORMATION_PLAN.md")
with open(out_file, "w") as f:
    f.write(content_out)

print(f"Successfully generated {out_file} ({len(content_out)} chars, {len(lines)} lines).")
