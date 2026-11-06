# ApexCaliber — Master Pedagogical Architecture RFC

<text color="secondary" weight="medium" size="xs">RFC AC-LEARN-002 · NOVEMBER 2026 · CITADELS II–VII</text>

<title size="2xl">From isolated computer science lessons to a connected engineering universe</title>

This is the proposed production curriculum architecture for the next stage of ApexCaliber, extending the teaching-first system established in World 17.

The governing principle remains:

> **Every learner should experience the engineering problem, discover the underlying mechanism, manipulate its behavior, understand its failure modes, and apply that understanding to a realistic production decision—before being expected to implement it.**

## 0. Scope and architectural decisions

Your message identifies 30 non-DSA worlds, but the detailed inventory lists **23 worlds across six citadels**, including World 17, whose RFC has already been completed.

<box gap={2}>
  <grid columns={3} gap={2}>
    <box border radius="lg" padding={3} gap={1}>
      <text color="secondary" size="2xs">CITADELS</text>
      <title size="2xl" tabularNums>6</title>
      <caption>All covered</caption>
    </box>
    <box border radius="lg" padding={3} gap={1}>
      <text color="secondary" size="2xs">LISTED WORLDS</text>
      <title size="2xl" tabularNums>23</title>
      <caption>Exact inventory supplied</caption>
    </box>
    <box border radius="lg" padding={3} gap={1}>
      <text color="secondary" size="2xs">NEW BLUEPRINTS</text>
      <title size="2xl" tabularNums>22</title>
      <caption>Plus existing World 17 RFC</caption>
    </box>
  </grid>
</box>

| Citadel | Worlds | Coverage |
|---|---|---|
| II — Python, OOP & Pandas | 13, 14, 15, 16 | Four new designs |
| III — DBMS & Redis | 24, 25, 26, 39 | Four new designs |
| IV — OS & Concurrency | 19, 27, 42 | Three new designs |
| V — Backend Engineering | 17, 18, 20, 21, 28 | Four new designs + existing RFC |
| VI — GenAI Systems | 34, 35, 36, 37, 38 | Five new designs |
| VII — Networking | 40, 41 | Two new designs |

I will use these exact world IDs and slugs. The seven additional worlds implied by the total of 30 will require their inventory later; they are not silently invented here.

All product stories below are **fictional educational incidents inspired by recognizable products**, not assertions that the named companies experienced those specific incidents or use the proposed implementations.

---

# Part A — The shared architecture every world must follow

## A1. Reuse the dual-engine system without rebuilding 22 mini-applications

<CodeBlock language="mermaid" model_previewable>
flowchart TD
    A["Canonical Concept Graph"]
    B["Versioned Journey Manifest"]
    C["JourneyPlayer"]
    D["Prediction / Observation / Explanation"]
    E["Experiment Registry"]
    F["Mode A: Deterministic Simulation"]
    G["Mode B: Isolated Executable Lab"]
    H["Normalized Event Stream"]
    I["Visualizer Registry"]
    J["Mastery Assessment"]
    K["Learner Progress"]

    A --> B --> C --> D
    D --> E
    E --> F
    E --> G
    F --> H
    G --> H
    H --> I
    I --> J --> K
    K --> C
</CodeBlock>

**The most important architectural constraint:** React must never contain the authoritative algorithm for an engineering experiment.

For example, the Redis visualizer should not independently calculate cache hits. The simulation engine calculates those results, emits events, and the visualizer renders the result.

Similarly, the TCP animation should never infer a successful connection merely because three arrows have appeared on screen.

## A2. Generalize the World 17 event contract

Retain the existing `apex.trace.v1` envelope and add domain-specific event families.

```typescript
interface ApexTraceEvent<
  TType extends string = string,
  TPayload = Record<string, unknown>
> {
  schemaVersion: "apex.trace.v1";

  eventId: string;
  runId: string;
  lessonId: string;
  stageId: string;

  mode: "deterministic" | "executable";
  evidence: "simulated" | "observed";

  sequence: number;
  atMs: number;

  timing: {
    deltaMs: number;
    durationMs?: number;
  };

  correlation: {
    traceId: string;
    logicalOperationId?: string;
    attemptId?: string;
    requestId?: string;
  };

  hop: {
    from?: string;
    at: string;
    to?: string;
  };

  type: TType;
  payload: TPayload;

  visual: {
    archetype: string;
    animation: string;
    focusHops: string[];
    badge?: string;
    annotation?: string;
    tone?: "neutral" | "success" | "warning" | "danger";
  };
}
```

This is the generic reference shape. Production event families should use discriminated unions with explicit payload types and versioned schema generation.

### Required extensions to World 17

| Addition | Purpose |
|---|---|
| Generic `lessonId`, `stageId` | Support all worlds |
| Extensible `hop.at` identifiers | Represent CPU, disk, Redis, DNS servers, model components |
| Domain-specific payloads | Preserve typed technical data |
| `experimentVersion` | Reproduce deterministic results |
| `modelAssumptions` on run result | Communicate simulation limitations |
| `scenarioSeed` | Reproduce stochastic-seeming experiments |
| `causalParentEventIds` | Support causal relationships across concurrent traces |
| `artifactRefs` | Reference larger traces, query plans and model outputs without embedding everything |

Maintain both event ordering and causal ordering. In concurrent systems, chronological order alone does not establish causality.

## A3. New event families

| Family | Core normalized events | Example consumers |
|---|---|---|
| Python runtime | `object.allocated`, `reference.changed`, `object.finalized`, `generator.yielded` | `memory_view` |
| OOP/design | `dependency.resolved`, `strategy.selected`, `observer.notified` | `system_blueprint` |
| Data pipelines | `record.parsed`, `record.rejected`, `schema.validated`, `batch.committed` | `pipeline_flow` |
| Numerical computing | `batch.executed`, `allocation.recorded`, `metric.sampled` | `vectorization_view` |
| Storage | `page.read`, `index.node.visited`, `query.plan.selected`, `row.returned` | `cache_relational` |
| Transactions | `txn.started`, `lock.acquired`, `txn.read`, `txn.committed`, `txn.aborted` | `transaction_timeline` |
| Cache | `cache.hit`, `cache.miss`, `cache.expired`, `cache.evicted`, `origin.read` | `cache_relational` |
| Concurrency | `task.scheduled`, `thread.blocked`, `lock.waiting`, `deadlock.detected` | `concurrency_timeline` |
| Virtual memory | `tlb.miss`, `page.fault`, `page.loaded`, `frame.evicted` | `memory_view` |
| Authentication | `token.issued`, `signature.verified`, `authorization.denied`, `token.revoked` | `auth_flow` |
| Async queues | `message.published`, `message.delivered`, `message.acknowledged`, `message.redelivered` | `queue_flow` |
| Resilience | `request.admitted`, `request.rejected`, `circuit.opened`, `dependency.failed` | `system_blueprint` |
| LLM inference | `text.tokenized`, `context.assembled`, `token.generated`, `usage.calculated` | `token_flow` |
| Vector search | `vector.compared`, `graph.node.visited`, `candidate.selected` | `vector_space` |
| RAG | `chunk.created`, `document.retrieved`, `document.reranked`, `answer.evaluated` | `rag_pipeline` |
| Agents | `tool.proposed`, `policy.checked`, `tool.executed`, `tool.denied` | `agent_state_graph` |
| DNS | `dns.query`, `dns.referral`, `dns.cache_hit`, `dns.answer` | `network_flow` |
| TCP | `tcp.segment_sent`, `tcp.segment_received`, `tcp.timeout`, `tcp.state_changed` | `network_flow` |

World implementations may use more specific events, but they should be declared in the event catalog and validated through the same transport contract.

## A4. The reusable stage specification

Each stage should be authored as a unit with:

```yaml
id: w39-s4
title: "The Stampede"

depends_on:
  - w39-s3

objective_ids:
  - cache.concurrent-miss

story:
  scenario_id: flash-sale-cache-expiry

prediction:
  question: "..."
  choices:
    - id: A
      text: "..."
      misconception: "..."
    - id: B
      text: "..."
      misconception: "..."
    - id: C
      text: "..."
  correct_choice_id: B

experiment:
  simulator_id: cache.stampede
  preset_id: flash_sale_100_users

observation:
  required_event_types:
    - cache.miss
    - origin.read

explanation:
  assessment_id: explain-concurrent-cache-miss

lab:
  lab_id: redis-stampede-lab
  starter_ref: labs/w39/starter.py
```

Keep correct answers and hidden expected observations server-side until the learner has committed a prediction.

## A5. Standard lesson interaction lifecycle

Each stage runs:

`HOOK → PREDICT → EXPERIMENT → OBSERVE → EXPLAIN → CHECKPOINT`

The number of actual content stages remains flexible.

A straightforward topic might have four stages. A complex topic can contain eight or more stages, including prerequisite branches and optional advanced investigations.

The POE pattern is a reusable **interaction loop**, not a rigid curriculum-stage structure.

---

# Part B — Citadel II: Practical Python, OOP & Pandas

<text color="secondary" weight="medium" size="xs">CITADEL KEY: `python_data` · WORLDS 13–16</text>

## The organic knowledge tree

<CodeBlock language="mermaid" model_previewable>
flowchart TD
    A["World 13: Objects and References"]
    B["World 14: Interfaces and Composition"]
    C["World 15: Defensive Data Pipelines"]
    D["World 16: Vectorized Processing"]
    E["Capstone: Reliable Analytics Service"]

    A --> B
    A --> C
    C --> D
    B --> E
    D --> E
</CodeBlock>

**Citadel capstone:** Process a large, unreliable CSV feed of commerce transactions into a validated, memory-efficient analytics pipeline with replaceable components.

The learner should understand why each design choice matters, not simply produce a Pandas one-liner.

## World 13 — Python Internals & PyObject

<text color="secondary" size="xs">`python-internals` · Proposed depth: 6 stages</text>

**Product anchor:** A Flipkart-style inventory worker crashes while loading a large catalog because its memory usage grows far beyond the available RAM.

### Organic progression

1. Understand names and objects through a shared-reference experiment.
2. Explore CPython objects, identity, type and references.
3. Experience mutation, aliasing and copying.
4. Visualize reference counting and object lifetime.
5. Discover iterators and generators as lazy data producers.
6. Redesign a memory-heavy catalog processor using streaming.

### Core misconception

“Assigning a variable creates a copy of the object.”

### POE

**Predict:** Two variables reference the same mutable list. One variable appends an item. What happens when the other variable is read?

- **A.** It remains unchanged. *Misconception:* Assignment always copies objects.
- **B.** It reflects the appended item. **Correct.**
- **C.** Python immediately raises an error. *Misconception:* Shared references are prohibited.

### Interactive experiment

| Control | Range / behavior |
|---|---|
| `assignment_mode` | `alias`, `shallow_copy`, `deep_copy` |
| `object_depth` | 1–4 nested levels |
| `input_rows` | 100–100,000 |
| `processing_mode` | `load_all`, `generator` |
| `mutate_nested` | Button |
| `advance_reference` | Button |

**Observe:** In alias mode, mutations affect the same list. With shallow copying, the outer container is distinct but nested mutable objects may remain shared. With deep copying, the example graph is duplicated.

Switch to streaming and observe how peak retained objects change compared with eager collection.

### Visualizer and Mode A model

**Archetype:** `memory_view` with heap-object cards, reference arrows and a generator execution frame.

```text
State:
  objects: ObjectGraph
  bindings: Name → ObjectID
  referenceCounts: ObjectID → Count
  generatorCursor: integer
  retainedBytes: integer

assign_alias
  → reference.changed

mutate_nested
  → object.mutated

release_reference
  → reference.changed
  → object.finalized, if eligible

generator_next
  → generator.resumed
  → generator.yielded
```

Memory accounting is educational and based on a declared cost model. CPython reference counts should be presented as implementation-specific, and finalization should not be promised immediately for cyclic or specially managed objects.

### Pre-wired Mode B lab

`labs/w13/object_memory_lab.py`

Libraries: `sys`, `gc`, `tracemalloc`, `copy`, `itertools`.

Loaded experiments:

- Identity and reference inspection.
- Shallow/deep-copy comparison.
- Reference-graph snapshot.
- Eager list versus streaming generator processing.

Metrics: peak allocated memory, retained objects, processing duration and yield count.

**Mastery criterion:** Explain how aliasing produces hidden shared-state bugs and how generator streaming changes peak memory requirements.

---

## World 14 — OOP, SOLID & Design Patterns

<text color="secondary" size="xs">`oop-solid-patterns` · Proposed depth: 6 stages</text>

**Product anchor:** A Razorpay-style payment integration must support multiple providers. Every new provider currently requires modifying a giant conditional block, creating regressions in existing payment flows.

### Organic progression

1. Experience tightly coupled code and provider-specific branching.
2. Discover encapsulation, abstraction and object contracts.
3. Introduce ABCs and interface-like protocols.
4. Understand dependency inversion and dependency injection.
5. Discover Strategy through replaceable payment policies.
6. Introduce Observer for downstream notifications, then reason about failure isolation.

### Core misconception

“Using inheritance automatically makes software follow SOLID principles.”

### POE

**Predict:** A payment service calls a concrete `ProviderA` implementation directly. What design change most directly allows the service to switch providers without modifying its business logic?

- **A.** Create more subclasses of the payment service. *Misconception:* More inheritance automatically removes coupling.
- **B.** Depend on a payment interface and inject the selected provider implementation. **Correct.**
- **C.** Move the provider selection into a larger `if/elif` block. *Misconception:* Centralizing conditions eliminates dependency coupling.

### Interactive controls

`provider` = A/B/C; `provider_failure` toggle; `design_mode` = coupled/strategy; `observer_count` = 0–10; `observer_exception` toggle; buttons `Add Provider`, `Process Payment`, `Notify Observers`.

**Observe:** Adding Provider C modifies the coupled implementation but only requires an additional adapter in the compositional design. A failing observer should expose the difference between synchronous notification and isolated asynchronous delivery.

### Mode A

**Archetype:** `system_blueprint`, with draggable dependency edges and highlighted contract boundaries.

```text
provider.selected
  → dependency.resolved
  → strategy.selected
  → payment.attempted
  → observer.notified | observer.failed
```

State includes `providers`, `bindings`, `observers`, `couplingEdges`, and `notificationOutcomes`.

### Pre-wired lab

`labs/w14/payment_strategy.py`

A fully functioning implementation with `PaymentGateway` ABC, `ProviderA`, `ProviderB`, `MockProvider`, `PaymentService`, and an event dispatcher.

Learners change providers through a select control. They can view the before/after architecture and run the same payment test suite against multiple adapters.

**Mastery:** Identify the appropriate abstraction boundary and defend composition versus inheritance.

---

## World 15 — Defensive Parsing & Data Pipelines

<text color="secondary" size="xs">`defensive-data-parsing` · Proposed depth: 7 stages</text>

**Product anchor:** A Blinkit-style vendor feed suddenly includes malformed JSON, unexpected columns and invalid prices. An ingestion pipeline stops processing halfway through the file.

### Organic progression

1. Understand bytes, text encoding and file formats.
2. Experience valid versus malformed JSON/CSV.
3. Learn schema validation and type conversion.
4. Introduce per-record error isolation and quarantine.
5. Explore schema versioning and optional fields.
6. Compare eager versus streaming ingestion and batching.
7. Design replay-safe ingestion with checkpointing and idempotent writes.

### Core misconception

“One malformed record means the entire import must fail.”

### POE

**Predict:** One row in a 10,000-record vendor feed has an invalid price. What is the best response when policy allows record-level quarantine?

- **A.** Abort the entire import unconditionally. *Misconception:* All ingestion failures require batch-wide rejection.
- **B.** Silently convert the invalid price to zero. *Misconception:* Replacing bad data with plausible defaults is always safe.
- **C.** Quarantine the invalid row with an error reason and continue processing valid rows. **Correct.**

### Interactive controls

`record_count` 100–100,000; `malformed_percent` 0–30%; `schema_version` v1/v2/v3; `batch_size` 10–10,000; `error_policy` = fail-fast/quarantine; `simulate_crash_after_batch` toggle.

**Observe:** Failed records enter quarantine with reasons; valid records advance. A simulated crash exposes why checkpoint persistence and replay protection matter.

### Mode A

**Archetype:** `pipeline_flow` — Source → Decode → Parse → Validate → Quarantine/Transform → Batch Commit.

```text
record.received
  → record.decoded | decode.failed
  → record.parsed | parse.failed
  → schema.validated | schema.rejected
  → record.transformed
  → batch.committed
  → checkpoint.saved
```

State includes source offset, committed batch IDs, schema version, accepted/rejected counters, and quarantine records.

### Pre-wired lab

`labs/w15/streaming_ingestion.py`

Libraries: `csv`, `json`, `pydantic`, `itertools`, optionally `ijson`.

Provide a synthetic vendor dataset containing missing fields, malformed records and versioned schemas.

Metrics: rows processed, rejection ratio, memory usage, throughput, replay duplicates and uncommitted records.

**Mastery:** Explain where validation belongs, why corrupt records should be auditable, and how to resume safely after a partial import.

---

## World 16 — Vectorized Pandas & Numerical Processing

<text color="secondary" size="xs">`vectorized-pandas` · Proposed depth: 6 stages</text>

**Product anchor:** A Zerodha-style trade-reporting service takes too long to compute daily aggregates because it loops over millions of records in Python.

### Organic progression

1. Understand tabular columns, Series and dtypes.
2. Observe Python per-row iteration overhead.
3. Introduce NumPy arrays and vectorized operations.
4. Compare native vectorization, `apply`, and row iteration.
5. Explore intermediate allocations, dtypes and memory trade-offs.
6. Build a production analytics transformation with grouping and chunked ingestion.

### Core misconception

“Any Pandas expression is automatically vectorized and memory efficient.”

### POE

**Predict:** Which approach is generally preferable for arithmetic on a large numeric column when the operation can be expressed as array operations?

- **A.** A Python `for` loop over rows. *Misconception:* Row-by-row Python execution has no overhead.
- **B.** A native vectorized NumPy/Pandas operation. **Correct**, subject to memory and dtype constraints.
- **C.** `DataFrame.apply(axis=1)` because it always uses compiled execution. *Misconception:* `apply` automatically eliminates Python-level execution costs.

Pandas documentation explicitly recommends investigating vectorized NumPy-style approaches before more specialized performance optimizations. <Cite ref="turn330880search4"/>

### Interactive controls

`rows` 1,000–1,000,000; `method` = loop/apply/vectorized; `dtype` = float64/float32; `temporary_arrays` 0–4; `chunk_size` 1,000–100,000.

**Observe:** Execution-time and memory-allocation curves change with row count, operation type, dtype and temporary arrays.

### Mode A

**Archetype:** New `vectorization_view`: animated array batches versus Python iteration, plus charts.

```text
batch.started
  → allocation.recorded
  → batch.executed
  → allocation.released
  → metric.sampled
```

Mode A uses an explicitly calibrated or illustrative cost model; it must not claim to measure actual Pandas performance.

### Pre-wired lab

`labs/w16/pandas_benchmark.py`

Libraries: `pandas`, `numpy`, `time.perf_counter`, `tracemalloc` or an appropriate process-memory profiler.

Preload equivalent transformations with correctness assertions before benchmarking.

Metrics: actual elapsed time, peak memory, throughput and numerical differences.

**Mastery:** Choose an efficient transformation and explain when vectorization's intermediate memory costs can outweigh its execution benefits.

### Citadel II completion challenge

A malformed commerce feed must be ingested, transformed and summarized under a memory budget.

The learner must assemble lessons from Worlds 13–16: references, dependency injection, schema validation, generators and vectorized numerical operations.

**Success is not merely a correct output file.** The learner must justify reliability, memory behavior, component boundaries and failure recovery.

---

# Part C — Citadel III: Database Systems & In-Memory Caching

<text color="secondary" weight="medium" size="xs">CITADEL KEY: `sql_dbms` · WORLDS 24, 25, 26, 39</text>

## The organic knowledge tree

<CodeBlock language="mermaid" model_previewable>
flowchart TD
    A["World 24: Physical Storage and Indexes"]
    B["World 25: Transactions and Isolation"]
    C["World 26: Relational Modeling and SQL"]
    D["World 39: Redis and Cache Behavior"]
    E["Capstone: Flash-sale Order System"]

    A --> B
    A --> C
    B --> D
    C --> D
    D --> E
</CodeBlock>

The overall journey should begin with **how data is stored**, then introduce **how concurrent users safely change it**, and finally explore **how to reduce expensive access without losing correctness**.

The capstone is a flash-sale inventory system under extreme read pressure and concurrent purchases.

## World 24 — B-Trees & Relational Storage

<text color="secondary" size="xs">`storage-engines-btrees` · Proposed depth: 7 stages</text>

**Product anchor:** A Flipkart-style product catalog contains millions of rows. A price-filter query becomes dramatically slower as the table grows.

### Organic progression

1. Why databases store rows in physical pages.
2. Understand heap pages, tuple locations and page reads.
3. Experience sequential scans.
4. Discover B-Tree/B+ Tree index navigation.
5. Insert keys and watch page splits.
6. Explore composite indexes and selectivity.
7. Compare execution plans and the cost of maintaining indexes.

### Core misconception

“Once an index exists, the database always uses it and every query becomes fast.”

### POE

**Predict:** A table contains one million products. A query returns almost every row. Why might PostgreSQL prefer a sequential scan even when an index exists?

- **A.** Indexes only work on primary keys. *Misconception:* Secondary indexes cannot be used.
- **B.** A sequential scan may require fewer total page accesses for a low-selectivity query. **Correct.**
- **C.** PostgreSQL cannot read indexes for large tables. *Misconception:* The planner has a fixed table-size limitation.

### Interactive controls

| Control | Values |
|---|---|
| `row_count` | 1,000–1,000,000 |
| `page_size_bytes` | 8192 default; alternative sizes for conceptual comparison |
| `rows_per_page` | Calculated from illustrative record size |
| `selectivity_percent` | 0.01–100% |
| `index_columns` | `(category)`, `(category, price)`, `(price, category)` |
| `index_enabled` | Boolean |
| `insert_key` | Button |
| `execute_query` | Button |

**Observe:** For selective queries, the index traversal reduces candidate rows. For queries returning most rows, a sequential scan can be cheaper. Changing the leading column of a composite index changes access efficiency.

A crucial accuracy requirement: PostgreSQL's leftmost-column guidance is an optimization principle, not an absolute prohibition on using later index columns. PostgreSQL 18 documents skip-scan behavior, which can sometimes make such access beneficial. <Cite ref="turn930373search1"/>

### Mode A

**Archetype:** `cache_relational` plus `btree_page_explorer`.

```text
query.started
  → planner.estimated
  → query.plan.selected
  → index.node.visited*
  → page.read*
  → row.returned*
  → query.completed
```

State:

```typescript
interface StorageSimulationState {
  pages: Record<string, PageNode>;
  rootPageId: string;
  bufferCachePageIds: string[];
  estimatedSelectivity: number;
  pageReads: number;
  selectedPlan: "seq_scan" | "index_scan";
}
```

Use a synthetic page graph rather than suggesting that PostgreSQL always stores exactly the simplified B+ Tree structure drawn in the UI.

### Pre-wired lab

`labs/w24/postgres_index_lab.sql`

Provision a disposable PostgreSQL database containing generated product data.

Preload:

```sql
CREATE INDEX idx_products_category_price
ON products (category_id, price);

EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM products
WHERE category_id = 12
  AND price BETWEEN 500 AND 1000;
```

Controls vary the dataset distribution, selectivity and index definition.

Metrics: execution time, shared buffer hits, page reads, index usage and planner estimates.

**Mastery:** Given a query and data distribution, justify whether an index is likely to help and explain the costs of additional indexes.

---

## World 25 — Transactions, ACID & Isolation Levels

<text color="secondary" size="xs">`transactions-acid` · Proposed depth: 8 stages</text>

**Product anchor:** A Zerodha-style order or ticket-booking service receives two concurrent requests for the final available unit. Both initially observe quantity one.

### Organic progression

1. Discover why partially completed updates are dangerous.
2. Learn atomicity, consistency, isolation and durability.
3. Introduce BEGIN, COMMIT and ROLLBACK.
4. Experience concurrent interleavings.
5. Explore dirty reads, nonrepeatable reads and phantoms.
6. Understand MVCC and snapshot visibility.
7. Compare optimistic and pessimistic concurrency control.
8. Prevent overselling and resolve deadlocks/serialization failures.

### Core misconception

“Wrapping code in a transaction automatically makes concurrent business operations serializable.”

### POE

**Predict:** Two transactions both read stock quantity one and then attempt to set stock to zero. What is the main risk if the application uses separate, unprotected read-then-write logic?

- **A.** Both may incorrectly conclude they successfully reserved the final unit. **Correct.**
- **B.** Every database automatically serializes the entire business workflow. *Misconception:* A transaction alone guarantees application-level serialization.
- **C.** The database always throws a deadlock exception. *Misconception:* Every concurrency anomaly is a deadlock.

### Interactive controls

`isolation_level` = read_committed/repeatable_read/serializable; `transaction_count` = 2–20; `locking_strategy` = none/for_update/optimistic_version/atomic_update; `inject_interleaving` button; `crash_before_commit` toggle.

**Observe:** Different interleavings produce different read/write outcomes. An atomic conditional update prevents overselling; serialization failures must be retried at the appropriate transaction boundary.

**PostgreSQL-specific rule:** `READ UNCOMMITTED` behaves as `READ COMMITTED`. PostgreSQL's implementation of `REPEATABLE READ` does not allow phantom reads, though other serialization anomalies remain possible. `SERIALIZABLE` may abort transactions to preserve serializable behavior. <Cite ref="turn330880search9"/>

### Mode A

**Archetype:** `transaction_timeline`, showing two or more concurrent lanes, row versions and lock ownership.

```text
txn.started
  → txn.read
  → row.version_observed
  → lock.acquired | lock.waiting
  → txn.write_attempted
  → txn.committed | txn.aborted
```

State consists of row versions, snapshots, read/write sets, lock holders, transaction states and committed inventory.

**Required invariant:** Inventory never becomes negative under a correctly implemented stock-reservation strategy.

### Pre-wired lab

`labs/w25/inventory_transactions.py`

Libraries: `asyncpg`, PostgreSQL.

Preload three alternative implementations:

- Unsafe read-then-write.
- Pessimistic row locking.
- Atomic conditional update using `UPDATE ... WHERE stock > 0 RETURNING ...`.

The learner changes the strategy through a dial while requests execute concurrently.

Metrics: successful reservations, conflicts, aborted transactions, retry count and final inventory.

**Mastery:** Explain why concurrency-safe business logic requires an atomic invariant, not merely the presence of `BEGIN` and `COMMIT`.

---

## World 26 — Relational Schema Design & SQL Optimization

<text color="secondary" size="xs">`relational-modeling-sql` · Proposed depth: 7 stages</text>

**Product anchor:** A Swiggy-style reporting system duplicates restaurant names and customer information across order rows. Updates cause inconsistent reporting, and expensive joins slow the dashboard.

### Organic progression

1. Identify entities, attributes and relationships.
2. Experience insert, update and delete anomalies.
3. Understand functional dependencies and 1NF–3NF.
4. Design primary keys, foreign keys and constraints.
5. Execute joins and compare join algorithms.
6. Explore window functions: `DENSE_RANK`, `LEAD`, `LAG`.
7. Optimize realistic reporting queries using `EXPLAIN`.

### Core misconception

“Adding joins always makes the database design worse.”

### POE

**Predict:** A table stores the same restaurant address in thousands of order rows. What is the most appropriate reason to separate the restaurant entity?

- **A.** To avoid update anomalies and establish a single authoritative restaurant record. **Correct.**
- **B.** Because SQL cannot join tables with repeated values. *Misconception:* Repeated values make joins impossible.
- **C.** Because normalization always makes every query faster. *Misconception:* Normalization guarantees lower latency.

### Interactive controls

`schema_mode` = denormalized/3NF; `orders` = 100–100,000; `join_algorithm` = nested_loop/hash/merge; `filter_selectivity` slider; `window_function` = dense_rank/lead/lag; `delete_restaurant` button.

**Observe:** Denormalized schemas show inconsistent updates when multiple copies are modified incorrectly. A normalized schema preserves referential relationships, while query performance varies with indexes, statistics and join choices.

### Mode A

**Archetype:** `cache_relational` with a `dbdiagram.io`-style relational schema editor.

```text
schema.changed
  → constraint.evaluated
  → query.plan.selected
  → join.input_scanned
  → join.row_matched
  → window.partition_processed
  → query.completed
```

State includes entities, constraints, relationships, row cardinality estimates, chosen query plan and output rows.

### Pre-wired lab

`labs/w26/relational_reporting.sql`

A synthetic restaurant/order/customer schema with executable migrations and analytics queries.

Example:

```sql
SELECT
    restaurant_id,
    order_date,
    revenue,
    DENSE_RANK() OVER (
        PARTITION BY restaurant_id
        ORDER BY revenue DESC
    ) AS revenue_rank,
    LAG(revenue) OVER (
        PARTITION BY restaurant_id
        ORDER BY order_date
    ) AS previous_day_revenue
FROM restaurant_daily_revenue;
```

Controls select schema variants, indexes and report parameters.

Metrics: constraint violations, query latency, plan nodes and rows scanned.

**Mastery:** Design a schema satisfying a stated set of functional dependencies and explain performance trade-offs without assuming normalization alone solves optimization.

---

## World 39 — Redis Caching Strategies, Eviction & Stampede

<text color="secondary" size="xs">`redis-caching` · Proposed depth: 8 stages</text>

**Product anchor:** A Hotstar-style streaming application's popular event metadata key expires during a major live event. A sudden burst of cache misses overwhelms the origin database.

### Organic progression

1. Discover the cost of repeated database reads.
2. Introduce cache-aside, hits and misses.
3. Explore TTL expiration and cache freshness.
4. Experience a concurrent cache stampede.
5. Introduce request coalescing and lock coordination.
6. Compare LRU, LFU and eviction under memory pressure.
7. Explore TTL jitter, cache penetration and avalanche.
8. Choose freshness, failure and correctness policies for production.

### Core misconception

“Adding Redis automatically prevents database overload and eliminates concurrency problems.”

### POE

**Predict:** One popular cache key expires while 100 requests arrive concurrently. What can happen without miss coordination?

- **A.** Redis automatically ensures only one request reaches the database. *Misconception:* Cache-aside provides single-flight behavior by default.
- **B.** Many concurrent requests may independently query the database. **Correct.**
- **C.** The requests must all fail because Redis cannot serve expired values. *Misconception:* A cache miss necessarily means failure.

### Interactive controls

| Control | Values |
|---|---|
| `concurrent_requests` | 1–500 |
| `ttl_seconds` | 1–600 |
| `expiration_pattern` | synchronized/jittered |
| `coordination` | none/local_singleflight/redis_lock |
| `memory_capacity_keys` | 10–1000 |
| `eviction_policy` | LRU/LFU |
| `origin_latency_ms` | 10–2000 |
| `cache_failure` | Toggle |

**Observe:** Without coordination, origin reads spike. With properly scoped request coalescing, many same-key misses share an origin fetch. TTL jitter spreads expirations. LRU and LFU retain different keys under changing workloads.

Redis's real LRU and LFU policies are approximate, so label a textbook-exact policy visualizer as an educational model, then allow comparison with measured Redis behavior in Mode B. <Cite ref="turn211140search1"/>

### Mode A

**Archetype:** `cache_relational`, with Redis, gateway and origin DB nodes plus a concurrent request waterfall.

```text
cache.lookup
  → cache.hit | cache.miss
  → cache.expired
  → lock.requested
  → lock.acquired | lock.waiting
  → origin.read
  → cache.written
  → lock.released
  → cache.evicted
```

State includes logical clock, cached values and expiry times, request queues, lock ownership, origin-read count and eviction metadata.

For deterministic concurrency, schedule every request as an event with a virtual arrival time.

### Pre-wired lab

`labs/w39/redis_stampede.py`

Libraries: `redis.asyncio`, `asyncio`, optional PostgreSQL.

Preload a correct cache-aside implementation, a deliberately unprotected implementation and an owner-aware lock-release mechanism.

Metrics: cache-hit ratio, origin QPS, p95 latency, lock contention, stale responses and evictions.

**Critical production caution:** A Redis distributed mutex does not by itself guarantee business correctness during lease expiry, process pauses or failover. Redis documents important safety limitations in lock designs. Use database constraints or stronger coordination where the business invariant requires it. <Cite ref="turn211140search7"/>

**Mastery:** Diagnose a cache stampede and explain the difference between protecting database load and guaranteeing transaction correctness.

---

## Citadel III capstone — Flash-sale correctness under load

The learner receives a fictional 10,000-request flash-sale trace for 100 products.

They can change:

- Composite indexes.
- Transaction isolation and atomic inventory updates.
- Redis cache strategy.
- TTL jitter and request coalescing.
- Origin connection-pool limits.

**The challenge:** Maintain correct inventory while meeting a latency goal under constrained resources.

The learner must explain why a fast cache cannot substitute for an atomic database update.

---

# Part D — Citadel IV: Operating Systems, Concurrency, GIL & Async

<text color="secondary" weight="medium" size="xs">CITADEL KEY: `os_concurrency` · WORLDS 19, 27, 42</text>

## The organic knowledge tree

<CodeBlock language="mermaid" model_previewable>
flowchart TD
    A["World 19: Processes, Threads, GIL and Async"]
    B["World 27: Synchronization and Deadlocks"]
    C["World 42: Virtual Memory and Paging"]
    D["Capstone: Diagnose a Freezing API"]

    A --> B --> D
    A --> C --> D
</CodeBlock>

The common production problem is **resource contention**: CPU time, shared memory, synchronization primitives and physical memory.

## World 19 — OS Concurrency, Threads & GIL

<text color="secondary" size="xs">`os-concurrency` · Proposed depth: 8 stages</text>

**Product anchor:** A FastAPI application handling simultaneous image uploads becomes unresponsive because CPU-intensive image processing runs inside asynchronous request handlers.

### Organic progression

1. Understand sequential execution.
2. Discover processes, threads and shared address spaces.
3. Distinguish concurrency from parallelism.
4. Experience I/O waiting versus CPU execution.
5. Introduce thread pools and task scheduling.
6. Discover `asyncio`, event loops and cooperative suspension.
7. Explore CPython GIL behavior and free-threaded builds.
8. Choose an appropriate execution architecture for a FastAPI workload.

### Core misconception

“Declaring a function `async def` makes its CPU-intensive code nonblocking.”

### POE

**Predict:** A FastAPI async endpoint calls a blocking CPU-intensive function directly, without yielding. What is the likely effect on other requests handled by that event-loop thread?

- **A.** The event loop continues handling other tasks automatically because the function is async. *Misconception:* `async` makes synchronous CPU work cooperative.
- **B.** The event loop can be blocked until the CPU-intensive call returns. **Correct.**
- **C.** Python automatically creates a new process for the computation. *Misconception:* Async execution implies multiprocessing.

### Interactive controls

`workload_type` = io_wait/cpu_compute/mixed; `task_count` 1–100; `execution_model` = sequential/asyncio/threadpool/processpool; `blocking_call_inside_async` toggle; `python_runtime` = gil_enabled/free_threaded.

**Observe:** Async execution efficiently overlaps cooperative I/O, but blocking CPU work can freeze the event loop. Processes can provide CPU parallelism, while threading behavior depends on workload, runtime and extension behavior.

Python 3.14 offers optional free-threaded execution, so the lesson must not teach that all modern CPython threading is inherently single-core. <Cite ref="turn930373search0"/>

FastAPI also distinguishes synchronous `def` route/dependency execution from directly called synchronous functions inside an async route. <Cite ref="turn211140search4"/>

### Mode A

**Archetype:** `concurrency_timeline`.

Display CPU cores, threads, runnable queues, blocked I/O tasks and an event-loop lane.

```text
task.created
  → task.scheduled
  → task.running
  → task.waiting_io | task.blocked_cpu
  → task.resumed
  → task.completed
```

State includes task status, scheduling policy, core ownership, GIL mode, simulated instruction cost and I/O completion events.

### Pre-wired lab

`labs/w19/concurrency_comparison.py`

Libraries: `asyncio`, `concurrent.futures`, `multiprocessing`, `time`.

Preload equivalent CPU-bound and I/O-bound workloads across multiple execution models.

Metrics: wall-clock time, CPU utilization, request responsiveness and completed tasks.

Run the free-threaded comparison only in a controlled, explicitly provisioned runtime that supports it. Never infer GIL configuration from the user's selection alone.

**Mastery:** Select an appropriate execution model for CPU-heavy image processing versus I/O-heavy API orchestration.

---

## World 27 — Locks, Semaphores & Deadlock Detection

<text color="secondary" size="xs">`locks-deadlocks` · Proposed depth: 7 stages</text>

**Product anchor:** A fictional banking transfer service freezes because two concurrent transfers acquire account locks in opposite orders.

### Organic progression

1. Experience unsynchronized shared-state updates.
2. Introduce critical sections and mutexes.
3. Explore semaphores and bounded concurrency.
4. Discover lock contention and waiting queues.
5. Construct the four Coffman deadlock conditions.
6. Detect cycles using a wait-for graph.
7. Prevent deadlocks through global lock ordering and compare timeout/recovery strategies.

### Core misconception

“Adding a lock fixes concurrency problems without creating new risks.”

### POE

**Predict:** Transaction A holds Lock X and waits for Y. Transaction B holds Lock Y and waits for X. What is the result if neither lock is released?

- **A.** Both transactions eventually continue automatically. *Misconception:* Waiting guarantees eventual progress.
- **B.** The transactions are deadlocked. **Correct.**
- **C.** The GIL automatically resolves the conflict. *Misconception:* Interpreter locking solves application resource deadlocks.

### Interactive controls

`transaction_count` 2–10; `lock_order` = inconsistent/global_order; `semaphore_capacity` 1–5; `deadlock_timeout_ms` 100–10,000; `victim_selection` = youngest/least_work; `step_scheduler` button.

**Observe:** Inconsistent lock ordering produces a cycle. Enforcing one global acquisition order prevents that class of circular wait.

### Mode A

**Archetype:** `concurrency_timeline` plus `resource_allocation_graph`.

```text
lock.requested
  → lock.acquired | lock.waiting
  → wait_edge.created
  → deadlock.detected
  → txn.aborted
  → lock.released
```

Use a wait-for graph of single-instance exclusive locks for the introductory model. A cycle is sufficient for deadlock in this restricted setting. For more general resource-allocation models with multiple instances, the interpretation is more complex.

### Pre-wired lab

`labs/w27/deadlock_lab.py`

Libraries: `asyncio`, `threading`.

The code is preloaded with two transfer tasks, a lock manager, timeout handling and a safe global-order variant.

Do not allow uncontrolled application-level deadlocks to block the shared worker indefinitely. Bound every experiment's runtime.

Metrics: blocked time, lock wait count, completed transactions, detected cycles and aborted transactions.

**Mastery:** Explain each Coffman condition and choose a prevention strategy for a concrete transaction workflow.

---

## World 42 — Virtual Memory & Page Replacement

<text color="secondary" size="xs">`virtual-memory` · Proposed depth: 7 stages</text>

**Product anchor:** An analytics worker processing a large dataset experiences massive latency increases as its active working set exceeds available physical memory.

### Organic progression

1. Understand virtual versus physical addresses.
2. Introduce virtual pages, physical frames and page tables.
3. Explore MMU address translation and TLB caching.
4. Trigger page faults and observe page loading.
5. Introduce frame eviction.
6. Compare FIFO and LRU replacement.
7. Discover working-set pressure and thrashing.

### Core misconception

“A page fault always indicates a crash or invalid memory access.”

### POE

**Predict:** A process accesses a valid virtual page that is not currently resident in RAM. What can happen?

- **A.** The operating system services a page fault and may load or map the page. **Correct.**
- **B.** The process must terminate with a segmentation fault. *Misconception:* Every page fault is illegal memory access.
- **C.** The CPU permanently ignores the memory request. *Misconception:* Virtual memory cannot recover from nonresident pages.

### Interactive controls

`virtual_pages` 4–32; `physical_frames` 2–8; `replacement_policy` = FIFO/LRU; `tlb_entries` 1–16; `reference_string` selectable sequences; `advance_access` button.

**Observe:** TLB hits avoid repeated page-table work. Nonresident pages cause page faults. Different replacement policies produce different fault counts.

The lab should include a reference sequence demonstrating **Belady's anomaly**, where increasing frame count under FIFO can unexpectedly increase page faults. This must not be presented as a general property of LRU.

### Mode A

**Archetype:** `memory_view`, with virtual page blocks, page-table entries, TLB, RAM frames and backing storage.

```text
memory.accessed
  → tlb.hit | tlb.miss
  → page_table.checked
  → page.fault
  → frame.evicted
  → page.loaded
  → memory.access.completed
```

State includes page table, TLB entries, frame ownership, page replacement metadata and access history.

### Pre-wired lab

`labs/w42/paging_simulator.py`

Implement FIFO and LRU policies against a fixed reference string, with deterministic traces and unit-tested page-fault counts.

Optional Mode B can provide actual OS memory-pressure observations in a tightly resource-limited container, but those observations should not be represented as a direct implementation of the simplified FIFO/LRU teaching model.

Metrics: page faults, TLB hit rate, evictions, average modeled access cost and working-set occupancy.

**Mastery:** Diagnose thrashing and explain why more RAM, better locality or a smaller working set may improve performance.

---

## Citadel IV capstone — The mysteriously frozen API

A fictional API reports high p99 latency and stalled requests.

The learner investigates:

- Event-loop blocking.
- Thread-pool saturation.
- Lock contention and deadlock.
- Memory pressure and page faults.

The same incident dashboard displays CPU, task states, memory pressure, lock waits and request latency.

**Apex challenge:** Identify which resource is actually limiting progress and recommend a targeted fix rather than reflexively adding servers.

---

# Part E — Citadel V: Backend Engineering & Distributed Systems

<text color="secondary" weight="medium" size="xs">CITADEL KEY: `backend_apis` · WORLDS 17, 18, 20, 21, 28</text>

## The organic knowledge tree

<CodeBlock language="mermaid" model_previewable>
flowchart TD
    A["World 17: HTTP Lifecycle"]
    B["World 20: Validation, Dependencies, Middleware"]
    C["World 18: Authentication and Authorization"]
    D["World 21: Queues and Background Processing"]
    E["World 28: Resilience and Rate Limiting"]
    F["Capstone: Reliable Order and Payment API"]

    A --> B
    A --> C
    B --> D
    B --> E
    C --> F
    D --> F
    E --> F
</CodeBlock>

This citadel must teach the transition from a functioning single-service API into a reliable application that survives malicious inputs, load spikes, slow dependencies and partial failures.

## World 17 — HTTP Lifecycle, Headers & Status Codes

<badge color="success">Existing RFC adopted</badge>

**Product anchor:** A Swiggy-style order request passes through a gateway and application server, succeeds internally, but may fail from the client's perspective.

The existing seven-stage journey is retained:

1. Why HTTP exists.
2. Request methods, headers and bodies.
3. Status semantics.
4. Application versus gateway failures.
5. Retry uncertainty.
6. Incident reconstruction.
7. Payment/UPI transfer challenge.

**Core misconception:** An HTTP timeout proves that the business operation failed.

**POE:** A gateway returns `504` after a request's database transaction has committed. Does this establish that the order failed?

- **A.** Yes, because all gateway errors imply rollback. *Misconception:* Network outcomes and database commits are identical.
- **B.** No, the backend may have committed despite the missing response. **Correct.**
- **C.** The gateway must convert the response into `201`. *Misconception:* Upstream completion guarantees timely delivery.

**Simulator:** `http.request-lifecycle`, `http.gateway-failures`, and `http.retry-uncertainty`.

**Visualizer:** `network_flow` and `http_request_inspector`.

**Lab:** Pre-wired FastAPI gateway application with latency, exception, response-drop and idempotency controls.

Its full seven-stage transitions, event payloads and implementation contracts remain governed by World 17 RFC.

---

## World 18 — Stateless Auth, JWT & RBAC

<text color="secondary" size="xs">`stateless-auth-jwt` · Proposed depth: 8 stages</text>

**Product anchor:** A Razorpay-style merchant dashboard receives requests using a stolen access token. A user also attempts to access another merchant's resources by changing an account identifier.

### Organic progression

1. Why identity and authentication matter.
2. Understand sessions versus bearer tokens.
3. Decode a JWT header, payload and signature.
4. Verify HMAC-SHA256 integrity and authenticity.
5. Validate expiry, issuer, audience and token type.
6. Introduce roles, permissions and resource ownership.
7. Experience refresh-token rotation and replay detection.
8. Investigate token theft, revocation and incident containment.

### Core misconception

“A signed JWT is encrypted, so its claims are secret and anyone holding it must be the legitimate user.”

### POE

**Predict:** Someone obtains a valid signed JWT. What can they potentially do before it expires if the service treats it as a bearer credential?

- **A.** Read the token payload and potentially replay the credential against a service that accepts it. **Correct.**
- **B.** They cannot read its claims because HMAC encrypts the payload. *Misconception:* A JWT signature provides confidentiality.
- **C.** They can change the role claim and still pass signature verification without the signing key. *Misconception:* Altered signed content remains valid.

OWASP distinguishes JWT signature integrity from confidentiality and highlights issuer/audience validation and token misuse risks. <Cite ref="turn330880search10"/>

### Interactive controls

`token_ttl_seconds` = 30–3600; `signature_valid` toggle; `role` = viewer/editor/admin; `resource_owner` = self/other; `rotate_refresh_token` button; `reuse_old_refresh_token` button; `revoke_token_family` button.

**Observe:** Modified tokens fail signature verification. A valid token can still lack authorization for a resource. Refresh-token reuse after rotation triggers a modeled replay alert and invalidation policy.

### Mode A

**Archetype:** New `auth_flow`.

```text
auth.request_received
  → token.decoded
  → signature.verified | signature.rejected
  → claims.validated | claims.rejected
  → authorization.granted | authorization.denied

refresh.requested
  → refresh.rotated
  → refresh.reuse_detected
  → token_family.revoked
```

State stores token metadata, key identifiers, token-family rotation state, expiration and authorized resource ownership.

### Pre-wired lab

`labs/w18/auth_lab.py`

Libraries: `FastAPI`, a vetted JWT library, `cryptography` where necessary, and a synthetic user database.

Provide preconfigured login, protected-resource and refresh endpoints.

The student changes expiry, user role, owner and refresh behavior using controls.

Metrics: authorization decisions, rejected signatures, replay detections and revoked token families.

**Mastery:** Explain why JWT signature verification is necessary but insufficient for authorization and session security.

---

## World 20 — Pydantic Validation & FastAPI Middleware

<text color="secondary" size="xs">`pydantic-fastapi-pipelines` · Proposed depth: 7 stages</text>

**Product anchor:** A Blinkit-style order-ingestion endpoint begins failing under load because a synchronous network call blocks its event loop. Separately, invalid customer payloads must be rejected safely.

### Organic progression

1. Observe the HTTP request entering FastAPI.
2. Understand request parsing and validation.
3. Introduce Pydantic models and typed constraints.
4. Explore dependency injection and dependency graphs.
5. Understand middleware, request state and lifecycle.
6. Compare synchronous and asynchronous handlers.
7. Diagnose event-loop starvation and dependency failures.

### Core misconception

“Pydantic validation, middleware, dependencies and route handlers are all the same processing layer.”

### POE

**Predict:** An endpoint is declared `async def`, but directly calls `time.sleep(3)` in its event-loop thread. What happens?

- **A.** The blocking call can stall the event loop. **Correct.**
- **B.** FastAPI automatically moves every synchronous function call into its thread pool. *Misconception:* Automatic thread-pool execution applies to every synchronous call.
- **C.** Pydantic prevents the call because it is synchronous. *Misconception:* Schema validation controls runtime scheduling.

### Interactive controls

`payload_variant` = valid/missing_field/wrong_type; `dependency_failure` toggle; `handler_type` = async/sync; `blocking_operation` = asyncio_sleep/time_sleep/CPU_loop; `concurrent_requests` 1–100; `middleware_enabled` toggle.

**Observe:** Validation rejects invalid inputs before the business handler executes. Dependency failures prevent route execution. A directly invoked blocking call inside an async handler delays other tasks on that event loop.

FastAPI documents that ordinary synchronous route functions and synchronous dependencies are executed in an external thread pool; directly called synchronous utility functions do not automatically receive the same treatment. <Cite ref="turn211140search3"/>

### Mode A

**Archetype:** `pipeline_flow` plus `concurrency_timeline`.

```text
request.entered
  → middleware.before
  → dependency.started
  → dependency.resolved | dependency.failed
  → validation.passed | validation.failed
  → handler.started
  → event_loop.blocked | task.suspended
  → response.created
  → middleware.after
```

Represent dependency ordering as a directed acyclic graph.

### Pre-wired lab

`labs/w20/fastapi_pipeline.py`

Use an actual FastAPI application with Pydantic models, reusable dependencies, request ID middleware, async and sync endpoints, and injectable failure modes.

Expose a synthetic concurrent load generator, with execution limits.

Metrics: validation failures, handler calls, event-loop lag, request latency and thread-pool occupancy.

**Mastery:** Explain where a request is rejected and diagnose why one blocking operation can increase latency for unrelated requests.

---

## World 21 — Asynchronous Architecture & Task Queues

<text color="secondary" size="xs">`async-task-queues` · Proposed depth: 8 stages</text>

**Product anchor:** An order-confirmation service sends email and notification events. A worker crashes after sending the notification but before acknowledging the queue message, resulting in duplicate delivery.

### Organic progression

1. Discover the cost of synchronous background work.
2. Introduce HTTP `202 Accepted` and job status.
3. Understand producer, broker, queue and worker.
4. Explore message reservation, acknowledgement and redelivery.
5. Experience worker crashes and duplicate execution.
6. Introduce retries, backoff and poison-message handling.
7. Explore dead-letter handling and transactional outbox.
8. Design idempotent background processing and observability.

### Core misconception

“Once a message queue accepts a task, the task executes exactly once.”

### POE

**Predict:** A worker performs a side effect, then crashes before acknowledging its message. What can happen with an at-least-once delivery configuration?

- **A.** The message may be delivered again, causing duplicate processing unless the handler is idempotent. **Correct.**
- **B.** The queue guarantees that the side effect is reversed. *Misconception:* Broker acknowledgement and business rollback are automatically linked.
- **C.** The queue has permanently lost the message as soon as a worker starts it. *Misconception:* Delivery always removes the message irreversibly.

Celery documentation explicitly cautions that late acknowledgements can cause repeated task execution and that tasks should be idempotent. The exact redelivery behavior depends on worker settings and the message transport. <Cite refs={["turn930373search5","turn930373search3"]}/>

### Interactive controls

`worker_count` 1–20; `queue_depth` 1–1000; `task_duration_ms` 100–10,000; `ack_policy` = early/late; `crash_point` = before_effect/after_effect/before_ack; `max_retries` 0–10; `idempotency_enabled` toggle; `inject_poison_message` button.

**Observe:** Early acknowledgement risks message loss after a crash. Late acknowledgement permits redelivery. With a stable business-operation ID and deduplication, repeated task attempts do not need to create repeated business effects.

### Mode A

**Archetype:** `queue_flow`, with publisher, broker, workers, retry queue and dead-letter store.

```text
job.created
  → message.published
  → message.delivered
  → task.started
  → business.effect_applied
  → message.acknowledged

worker.crashed
  → message.visibility_expired
  → message.redelivered
  → duplicate.detected
```

State includes queue messages, delivery attempts, acknowledgement status, worker states, retry deadlines and committed business effects.

### Pre-wired lab

`labs/w21/task_queue_lab.py`

Libraries: `FastAPI`, `Celery`, `Redis`, PostgreSQL.

Preloaded endpoints:

- Submit a job.
- Poll job status.
- Inject a worker failure.
- Restart a worker.
- Inspect retry attempts.
- Replay a duplicate message.

**Important implementation detail:** Do not model Redis-backed Celery as if it automatically provides AMQP dead-letter exchanges. Build a transport-aware dead-letter strategy, such as an explicitly managed failed-task store or queue, and teach its limitations.

Metrics: queue lag, retries, duplicate executions, distinct business effects, worker throughput and failed jobs.

**Mastery:** Explain at-least-once delivery and design safe background processing without relying on fictional exactly-once execution guarantees.

---

## World 28 — System Resilience & Rate Limiting

<text color="secondary" size="xs">`resilience-rate-limiting` · Proposed depth: 8 stages</text>

**Product anchor:** A Hotstar-style API receives sudden traffic bursts during a major live event. A slow downstream service causes requests to accumulate, eventually overwhelming upstream resources.

### Organic progression

1. Understand request capacity and bursts.
2. Experience overload without admission control.
3. Introduce token bucket rate limiting.
4. Compare leaky bucket and sliding-window log.
5. Examine fairness, burst allowance and distributed limits.
6. Introduce timeouts and retry amplification.
7. Discover circuit breakers and recovery states.
8. Combine rate limits, concurrency limits, backoff and circuit breakers.

### Core misconception

“Rate limiting and circuit breaking are the same reliability mechanism.”

### POE

**Predict:** A dependency starts returning errors for most requests. Which mechanism specifically helps prevent repeated calls to that failing dependency?

- **A.** A circuit breaker that temporarily opens after a configured failure threshold. **Correct.**
- **B.** Increasing the API rate limit. *Misconception:* Permitting more traffic solves downstream failure.
- **C.** Removing all timeouts. *Misconception:* Waiting indefinitely improves resilience.

### Interactive controls

`requests_per_second` 1–1000; `bucket_capacity` 1–100; `refill_rate` 1–100/s; `limiter_algorithm` = token_bucket/leaky_bucket/sliding_window_log; `downstream_failure_percent` 0–100; `circuit_failure_threshold` 1–20; `recovery_delay_ms` 100–30,000; `retry_policy` = none/immediate/exponential_jitter.

**Observe:** Token buckets permit controlled bursts. Leaky buckets smooth output. Sliding-window logs enforce a count over a rolling interval. Circuit breakers stop calls to an unhealthy dependency after an opening condition, then allow controlled recovery probes.

### Mode A

**Archetype:** `system_blueprint` plus `request_flow_meter` and latency charts.

```text
request.arrived
  → rate_limit.allowed | rate_limit.denied
  → circuit.checked
  → dependency.called
  → dependency.succeeded | dependency.failed
  → circuit.opened
  → circuit.half_opened
  → circuit.closed
```

State includes bucket tokens, rolling timestamps, concurrency occupancy, dependency failure history, breaker state and scheduled retries.

### Pre-wired lab

`labs/w28/resilience_lab.py`

Libraries: `FastAPI`, `httpx`, `asyncio`, Redis for optional distributed limiting.

Provide a ready-to-run dependency service with adjustable latency and failure probability.

Metrics: admitted requests, `429` responses, circuit state, p95 latency, downstream calls, retries and outstanding requests.

**Mastery:** Select complementary resilience mechanisms and explain why unlimited retries against a failing service can worsen an outage.

---

## Citadel V capstone — Reliable commerce checkout

The learner must combine:

- HTTP request/response behavior.
- Authentication and resource authorization.
- Pydantic validation.
- Transaction-safe order submission.
- Asynchronous notifications.
- Idempotency and retry semantics.
- Rate limiting and circuit breakers.

The final challenge injects a network timeout and a worker crash during checkout.

**Success criterion:** One intended order produces one committed business operation, even if the external request and background-task execution are repeated.

---

# Part F — Citadel VI: GenAI Systems & Intelligent Systems

<text color="secondary" weight="medium" size="xs">CITADEL KEY: `ai_resume` · WORLDS 34–38</text>

This citadel should teach engineering mechanics rather than encouraging learners to memorize AI buzzwords or copy prompt templates.

The highest-value experience is showing how AI quality, latency, cost, retrieval and security are interconnected.

## The organic knowledge tree

<CodeBlock language="mermaid" model_previewable>
flowchart TD
    A["World 34: Tokens and LLM Mechanics"]
    B["World 35: Embeddings and Vector Search"]
    C["World 36: Production RAG"]
    D["World 37: Semantic Caching and Prompt Optimization"]
    E["World 38: Agents and Tool Calling"]
    F["Capstone: Trustworthy AI Assistant"]

    A --> B --> C
    A --> D
    C --> D
    C --> E
    D --> E
    E --> F
</CodeBlock>

**Citadel capstone:** Build a simulated intelligent assistant that answers questions using retrieved documents, respects document permissions, controls token spending and safely calls approved tools.

## World 34 — LLM Foundational Mechanics

<text color="secondary" size="xs">`llm-foundational-mechanics` · Proposed depth: 7 stages</text>

**Product anchor:** An OpenAI API-powered support assistant becomes expensive because every request includes an enormous conversation history, redundant instructions and retrieved documents.

### Organic progression

1. Understand text versus tokens.
2. Explore subword tokenization.
3. Discover token IDs and input representations.
4. Understand context windows and causal attention at a conceptual level.
5. Experience next-token generation.
6. Calculate input, output and cached-input token costs.
7. Design context-budget strategies under quality and latency constraints.

### Core misconception

“One word equals one token, and a longer prompt always produces a better answer.”

### POE

**Predict:** An application repeatedly appends irrelevant old messages to every model request. What is a likely consequence?

- **A.** Input-token usage, cost and processing requirements may increase without improving answer quality. **Correct.**
- **B.** The model automatically ignores all irrelevant tokens at no computational cost. *Misconception:* Context can grow without cost.
- **C.** Every additional token improves factual accuracy. *Misconception:* More context always provides more useful evidence.

### Interactive controls

| Control | Values |
|---|---|
| `prompt_text` | Editable controlled input |
| `tokenizer_model` | Approved tokenizer profiles |
| `history_messages` | 0–100 |
| `retrieved_chunks` | 0–20 |
| `output_token_budget` | 16–4096 |
| `price_input_per_1k` | Configurable |
| `price_output_per_1k` | Configurable |
| `cached_input_fraction` | 0–100% |

**Observe:** Changing the prompt or tokenizer changes token count. Adding context reduces remaining window capacity and changes estimated cost.

Do not hard-code a fictional universal API price. Use a versioned pricing fixture, with the option for instructors to update it.

### Mode A

**Archetype:** New `token_flow`, with token blocks, context-window occupancy and cumulative cost.

```text
text.received
  → text.tokenized
  → context.assembled
  → context.budget_checked
  → generation.started
  → token.generated*
  → usage.calculated
```

State includes tokenizer profile, input tokens, cached-input tokens, generated tokens, context capacity and price schedule.

### Pre-wired lab

`labs/w34/token_budget_lab.py`

Libraries: a supported tokenizer implementation such as `tiktoken`, plus a deterministic mock generation client.

Provide a predefined conversation and multiple context-compression strategies.

Metrics: input tokens, output tokens, estimated spend, context occupancy and truncation risk.

**Mastery:** Design a context strategy that satisfies an explicit budget while preserving the evidence required for a correct answer.

---

## World 35 — Vector Embeddings & Similarity Search

<text color="secondary" size="xs">`vector-embeddings-similarity` · Proposed depth: 7 stages</text>

**Product anchor:** An Instagram-style content search system needs to retrieve semantically relevant results, but comparing every embedding against millions of records is expensive.

### Organic progression

1. Experience the limitations of exact keyword matching.
2. Understand embeddings as numerical representations.
3. Explore vector dimensions and distance.
4. Compare cosine similarity, dot product and Euclidean distance.
5. Introduce top-K nearest-neighbor retrieval.
6. Explore approximate nearest-neighbor search and HNSW graphs.
7. Analyze recall, latency, memory use and filtering trade-offs.

### Core misconception

“Cosine similarity and dot product always rank vectors identically, and HNSW always returns the true nearest neighbor.”

### POE

**Predict:** Two vectors have different magnitudes. Which statement is correct?

- **A.** Cosine similarity and raw dot product must give identical rankings. *Misconception:* Vector magnitude never matters.
- **B.** Cosine similarity normalizes for magnitude, while raw dot product is affected by magnitude. **Correct.**
- **C.** Cosine similarity cannot be used for semantic search. *Misconception:* Angular similarity is unsuitable for embeddings.

### Interactive controls

`vector_dimensions` = 2/3/128/768; `normalize_vectors` toggle; `similarity_metric` = cosine/dot/L2; `top_k` 1–20; `search_mode` = exact/HNSW; `hnsw_m` 4–32; `ef_search` 8–256.

**Observe:** Rankings can change depending on normalization and metric. Approximate search visits fewer candidate nodes in favorable workloads but can sacrifice recall.

HNSW should be taught as an approximate graph-search method—not as a guarantee of sublinear worst-case search or exact recall. Faiss documentation describes the roles of `M`, `efConstruction` and `efSearch` in the accuracy/memory/search trade-off. <Cite ref="turn330880search0"/>

### Mode A

**Archetype:** `vector_space`, using 2D/3D educational projections plus an HNSW graph traversal panel.

```text
query.embedded
  → vector.compared
  → graph.node.visited
  → candidate.selected
  → search.completed
```

State includes the vector corpus, metric, candidate set, graph edges, visited nodes and search result ranking.

For high-dimensional data, make it explicit that the displayed 2D projection does not preserve all original distances.

### Pre-wired lab

`labs/w35/vector_search_lab.py`

Libraries: `numpy`, optionally `faiss-cpu`.

Preload a synthetic embedding corpus and compare exact nearest-neighbor search against HNSW.

Metrics: recall@K, latency, candidate visits, memory and build time.

**Mastery:** Choose vector similarity and index parameters appropriate for an application with stated recall and latency constraints.

---

## World 36 — Production RAG Pipelines

<text color="secondary" size="xs">`production-rag-pipelines` · Proposed depth: 9 stages</text>

**Product anchor:** An enterprise HR assistant retrieves an outdated leave policy instead of the latest approved policy. The model produces a confident answer using irrelevant evidence.

### Organic progression

1. Understand why model parameters alone cannot reliably provide current organizational facts.
2. Introduce document ingestion and parsing.
3. Compare fixed-size and semantic chunking.
4. Explore chunk overlap, metadata and document versions.
5. Understand embeddings and dense retrieval.
6. Introduce BM25 keyword retrieval.
7. Combine keyword and dense candidates through hybrid search.
8. Apply cross-encoder reranking.
9. Assemble authorized context and evaluate grounded answers.

### Core misconception

“Retrieving semantically similar text guarantees that the answer is factually correct.”

### POE

**Predict:** A user searches for a policy identified by an exact code such as `HR-2026-17`. Dense semantic search returns a related but outdated document. What is a reasonable improvement?

- **A.** Increase the generation temperature. *Misconception:* More varied generation fixes retrieval.
- **B.** Combine lexical and semantic retrieval, filter authorized/current documents, then rerank the candidate set. **Correct.**
- **C.** Remove document metadata because the model can infer recency. *Misconception:* Semantic similarity establishes document authority and freshness.

Modern hybrid search systems combine keyword and vector results, commonly through reciprocal rank fusion, and may apply a cross-encoder reranker afterward. <Cite ref="turn211140search5"/>

### Interactive controls

`chunk_size` 100–2000 tokens; `overlap_tokens` 0–400; `retrieval_mode` = BM25/dense/hybrid; `top_k` 1–20; `reranker` toggle; `document_version` = mixed/current_only; `user_access_scope` = employee/manager/admin; `context_budget` 500–8000.

**Observe:** Different chunk sizes affect evidence boundaries. Hybrid retrieval can improve retrieval of exact policy identifiers. Metadata filtering prevents unauthorized or obsolete documents from being selected.

### Mode A

**Archetype:** `rag_pipeline`, with document chunks, candidate ranking, reranking scores and final context assembly.

```text
document.ingested
  → chunk.created
  → chunk.embedded
  → query.received
  → document.retrieved
  → candidates.fused
  → document.reranked
  → authorization.filtered
  → context.assembled
  → answer.evaluated
```

State includes chunk IDs, source versions, access labels, relevance judgments, retrieval scores and answer-grounding evidence.

### Pre-wired lab

`labs/w36/rag_pipeline.py`

Libraries: `rank_bm25`, `numpy`, a fixed embedding fixture, optional `sentence-transformers`, and a deterministic reranking fixture.

Use a small, synthetic HR policy corpus with approved answers and citation IDs.

Metrics: Recall@K, MRR, nDCG@K, authorized-document coverage, context tokens and unsupported claims.

The initial experience should not require a paid model call. Model-backed generation can be an optional advanced extension.

**Mastery:** Explain the difference between improving retrieval relevance, ensuring document authorization and verifying answer grounding.

---

## World 37 — Semantic Caching & Prompt Optimization

<text color="secondary" size="xs">`semantic-caching-prompts` · Proposed depth: 7 stages</text>

**Product anchor:** A customer-support AI assistant repeatedly answers similar questions. The team introduces semantic caching, but cached answers occasionally belong to another user or reference outdated account data.

### Organic progression

1. Understand repeated LLM requests and exact-match caching.
2. Introduce embedding-based semantic cache lookup.
3. Explore similarity thresholds and false cache hits.
4. Introduce freshness, TTL and invalidation.
5. Separate tenant, user and permission scopes.
6. Compare zero-shot and few-shot prompting.
7. Evaluate structured reasoning prompts, answer quality, cost and safety.

### Core misconception

“If two prompts have highly similar embeddings, their answers can always be shared safely.”

### POE

**Predict:** Two customers ask, “What is my account balance?” Their question embeddings are nearly identical. Can the same cached answer be returned to both?

- **A.** Yes, because semantic similarity proves equivalent authorized answers. *Misconception:* Similar prompts imply identical user-specific context.
- **B.** No. User-specific authorization and data freshness must be considered before reusing the response. **Correct.**
- **C.** No semantic cache can ever safely store responses. *Misconception:* Caching is universally inappropriate for AI systems.

### Interactive controls

`similarity_threshold` 0.60–1.00; `cache_ttl_seconds` 10–3600; `tenant_scope` = shared/per_tenant/per_user; `data_version` = current/stale; `prompt_style` = zero_shot/few_shot/structured_steps; `example_count` 0–5; `cache_hit_override` chaos toggle.

**Observe:** Lower similarity thresholds increase cache reuse but may introduce false positives. Strict tenant boundaries prevent cross-tenant reuse. Structured prompts and examples can change output consistency, but their effects must be measured on labeled evaluation cases.

### Mode A

**Archetype:** `semantic_cache_view` plus `token_flow`.

```text
query.embedded
  → cache.candidate_found
  → cache.similarity_checked
  → cache.scope_checked
  → cache.freshness_checked
  → cache.hit | cache.miss
  → prompt.assembled
  → response.generated
  → cache.written
```

State includes query embedding, cache-entry version, tenant scope, similarity score, token budget and cached-response provenance.

### Pre-wired lab

`labs/w37/semantic_cache_lab.py`

Libraries: `numpy`, Redis or a local fixture, Pydantic for output validation.

Preload a question corpus with paraphrases, near-miss examples and user-specific questions.

Metrics: cache-hit rate, false-hit rate, cost saved, stale-answer rate and cross-scope leakage attempts blocked.

For the Chain-of-Thought topic, teach **structured task decomposition, verification and observable explanations**, not dependence on exposing a model's hidden private reasoning. Evaluate outputs through explicit evidence and correctness criteria.

**Mastery:** Design a semantic cache that improves cost and latency without leaking or reusing the wrong user's information.

---

## World 38 — Autonomous Agents & Tool Calling

<text color="secondary" size="xs">`autonomous-agents-tools` · Proposed depth: 9 stages</text>

**Product anchor:** An intelligent shopping assistant can search products, check stock and create an order. A malicious instruction hidden inside retrieved product information attempts to make it call an unauthorized tool.

### Organic progression

1. Understand deterministic workflows versus agents.
2. Introduce tool schemas and structured arguments.
3. Explore the propose → validate → execute → observe loop.
4. Understand agent state, memory and intermediate results.
5. Introduce maximum steps, budgets and termination.
6. Experience tool failures, retries and idempotency.
7. Discover prompt injection through untrusted tool output.
8. Introduce least privilege, approval gates and audit logs.
9. Design a production agent with safe tool boundaries.

### Core misconception

“If a model selects a tool call, the application can safely execute it.”

### POE

**Predict:** A retrieved product description contains an instruction telling the assistant to call a privileged order-refund tool. What should the application do?

- **A.** Execute the instruction because it appeared in retrieved context. *Misconception:* Retrieved content has the same authority as an approved application instruction.
- **B.** Ignore the model's tool arguments and execute the tool using guessed values. *Misconception:* Bypassing argument validation is safe.
- **C.** Treat the retrieved instruction as untrusted data and enforce tool permissions, argument validation and required approvals. **Correct.**

OWASP identifies prompt injection and excessive agency as major risk categories for LLM and agentic applications. <Cite refs={["turn211140search9","turn211140search97"]}/>

### Interactive controls

`max_steps` 1–20; `tool_allowlist` multi-select; `require_human_approval` toggle; `inject_malicious_document` button; `tool_timeout_ms` 100–10,000; `retry_budget` 0–5; `token_budget` 500–10,000.

**Observe:** An unsafe agent attempts the unauthorized action. The protected agent records a proposed tool call, checks permissions and denies execution. Legitimate tool calls proceed after validation and approval.

### Mode A

**Archetype:** `agent_state_graph`.

```text
agent.started
  → tool.proposed
  → policy.checked
  → approval.requested
  → approval.granted | approval.denied
  → tool.executed | tool.denied
  → tool.result_observed
  → agent.continued | agent.finished
```

State includes goal, tool registry, approved scopes, step count, token budget, pending approvals and immutable audit events.

### Pre-wired lab

`labs/w38/agent_tool_lab.py`

Libraries: `FastAPI`, `Pydantic`, deterministic model-response fixtures.

Approved demo tools:

```text
search_products
check_inventory
create_draft_order
submit_order
```

`submit_order` must require a distinct authorization/approval policy. Simulated external actions should be recorded in a sandbox database only.

Metrics: completed workflows, tool calls, denied calls, budget consumption, unsafe-action attempts and duplicate business effects prevented.

**Mastery:** Explain why the application's security policy must be enforced independently of the model's generated tool-call arguments.

---

## Citadel VI capstone — Trustworthy enterprise AI assistant

The learner receives an enterprise document corpus with:

- Current and outdated policies.
- Duplicate and conflicting documents.
- Restricted records.
- Semantically similar user-specific requests.
- One malicious retrieved instruction.
- A tool capable of creating a business action.

They must choose retrieval, caching, context and tool-execution policies.

**The final challenge:** Produce accurate, cited, authorized answers while remaining within a defined latency and token budget and preventing unauthorized tool execution.

This is the apex synthesis of Worlds 34–38.

---

# Part G — Citadel VII: Computer Networking & Protocols

<text color="secondary" weight="medium" size="xs">CITADEL KEY: `computer_networking` · WORLDS 40–41</text>

Although this citadel currently contains only two listed worlds, these two journeys should be among the most interactive and visually rigorous in ApexCaliber.

They provide foundations for HTTP, TLS, API gateways and distributed backend communication.

## The organic knowledge tree

<CodeBlock language="mermaid" model_previewable>
flowchart TD
    A["Why applications need remote addresses"]
    B["World 40: DNS Resolution"]
    C["IP Address and Port"]
    D["World 41: TCP Establishment"]
    E["Reliable Byte Stream"]
    F["World 17: HTTP Lifecycle"]
    G["Capstone: Diagnose a Failed Connection"]

    A --> B --> C --> D --> E --> F
    B --> G
    D --> G
    F --> G
</CodeBlock>

## World 40 — DNS & Domain Resolution

<text color="secondary" size="xs">`dns-resolution` · Proposed depth: 7 stages</text>

**Product anchor:** A Zerodha-style trading application's API endpoint moves to a new server. Some customers immediately reach the new endpoint, while others still resolve the old address.

### Organic progression

1. Why applications need names instead of memorizing IP addresses.
2. Introduce DNS records and the distinction between names and addresses.
3. Explore the recursive resolver.
4. Follow referrals through Root → TLD → Authoritative servers.
5. Understand A, AAAA, CNAME and record resolution.
6. Introduce TTL, positive caching and negative caching.
7. Diagnose a stale resolution or failed DNS deployment.

### Core misconception

“Every DNS request always contacts the root, TLD and authoritative servers, and changing a record updates every client immediately.”

### POE

**Predict:** A recursive resolver has cached an A record with an unexpired TTL. The authoritative record is changed. What can happen on the next lookup through that resolver?

- **A.** The resolver may return the old cached IP until the cached record expires. **Correct.**
- **B.** The root server automatically pushes the new IP to every resolver. *Misconception:* DNS cache updates are globally synchronized.
- **C.** DNS must return an error whenever the authoritative answer changes. *Misconception:* Record modification invalidates the domain.

### Interactive controls

| Control | Values |
|---|---|
| `domain` | `api.example.test`, `orders.example.test` |
| `record_type` | A/AAAA/CNAME |
| `ttl_seconds` | 5–3600 |
| `recursive_cache_enabled` | Boolean |
| `advance_clock_seconds` | 0–7200 |
| `authoritative_ip` | Select from synthetic addresses |
| `inject_nxdomain` | Toggle |
| `inject_servfail` | Toggle |
| `flush_resolver_cache` | Button |
| `resolve_domain` | Button |

**Observe:** The first uncached query traverses the hierarchy. Subsequent lookups can be served from the recursive cache. Changing the authoritative record does not immediately change an unexpired cached answer.

Negative responses can also be cached. RFC 2308 covers NXDOMAIN/NODATA caching, while RFC 9520 extends requirements for DNS resolution-failure caching. <Cite refs={["turn330880search2","turn330880search5"]}/>

### Mode A

**Archetype:** `network_flow`, with DNS resolver, root, TLD and authoritative nodes.

<CodeBlock language="mermaid" model_previewable>
sequenceDiagram
    participant C as Client
    participant R as Recursive Resolver
    participant Root as Root
    participant TLD as TLD
    participant A as Authoritative

    C->>R: Resolve api.example.test A
    R->>Root: Query
    Root-->>R: TLD referral
    R->>TLD: Query
    TLD-->>R: Authoritative referral
    R->>A: Query A
    A-->>R: Answer + TTL
    R-->>C: Cached answer
    C->>R: Repeat query
    R-->>C: Cache hit
</CodeBlock>

Normalized events:

```text
dns.query
  → dns.cache_miss
  → dns.referral(root)
  → dns.referral(tld)
  → dns.authoritative_query
  → dns.answer
  → dns.cache_written

second_lookup
  → dns.cache_hit
  → dns.answer
```

State includes records, resolver cache, cached expiry timestamps, current virtual time, referral information and error conditions.

### Pre-wired lab

`labs/w40/dns_resolution_lab.py`

Libraries: `dnspython`, `asyncio`.

Mode B should use a controlled DNS fixture served by an isolated DNS server, rather than depending on the unpredictable state of public internet DNS infrastructure.

The lesson can expose real DNS message fields and cached response information.

Metrics: lookup latency, query count, cache-hit ratio, cache TTL, authoritative request count and failure outcome.

**Mastery:** Explain why two clients can temporarily resolve different IP addresses for the same domain and how a team can diagnose that condition.

---

## World 41 — TCP 3-Way Handshake & Sockets

<text color="secondary" size="xs">`tcp-handshake` · Proposed depth: 8 stages</text>

**Product anchor:** A trading application loses connectivity during market activity. The client tries to connect, but dropped packets and retransmission delays prevent timely connection establishment.

### Organic progression

1. Understand IP addresses, ports and process-level sockets.
2. Distinguish connectionless packet delivery from TCP's connection-oriented byte stream.
3. Discover TCP sequence and acknowledgement numbers.
4. Execute SYN → SYN-ACK → ACK.
5. Explore client and server TCP state machines.
6. Drop packets and observe retransmission timers.
7. Introduce reliable ordered byte-stream delivery, flow control and basic congestion effects.
8. Explore connection teardown, FIN, RST and TIME_WAIT.

### Core misconception

“If a TCP SYN-ACK packet is lost, the client and server immediately know the connection failed.”

### POE

**Predict:** A server receives a SYN and sends a SYN-ACK, but the SYN-ACK is lost. What can happen next?

- **A.** The client eventually retransmits the SYN according to its retransmission behavior, and the server may retransmit the SYN-ACK. **Correct.**
- **B.** TCP automatically switches to UDP. *Misconception:* Transport protocols change automatically after packet loss.
- **C.** The connection is permanently established on both sides despite the missing response. *Misconception:* Both peers have completed the same handshake state.

### Interactive controls

`client_initial_seq` 0–10000; `server_initial_seq` 0–10000; `rtt_ms` 10–1000; `packet_loss_target` = none/SYN/SYN_ACK/ACK; `rto_ms` 200–3000 for simplified simulation; `max_retransmissions` 0–5; `send_fin` button; `send_rst` button; `advance_packet` button.

**Observe:** Dropping SYN or SYN-ACK delays connection establishment. The client and server remain in different protocol states until acknowledgement progresses.

Teach RTO using a simplified configurable timer first, then introduce RTT estimation and retransmission-timer calculation. RFC 6298 specifies TCP retransmission timer behavior. <Cite ref="turn330880search8"/>

### Mode A

**Archetype:** `network_flow` with two synchronized state machines and a packet timeline.

```text
tcp.segment_sent(SYN)
  → tcp.state_changed(SYN_SENT)

tcp.segment_received(SYN)
  → tcp.state_changed(SYN_RECEIVED)

tcp.segment_sent(SYN_ACK)
  → tcp.segment_lost | tcp.segment_received

tcp.timeout
  → tcp.segment_retransmitted

tcp.segment_received(ACK)
  → tcp.state_changed(ESTABLISHED)
```

State includes:

```typescript
interface TcpSimulationState {
  clientState: string;
  serverState: string;

  clientNextSeq: number;
  serverNextSeq: number;

  pendingSegments: TcpSegment[];
  retransmissionTimers: Record<string, number>;

  elapsedVirtualMs: number;
  retransmissions: number;
}
```

### Pre-wired lab

`labs/w41/tcp_sockets_lab.py`

Libraries: `socket`, `asyncio`, optionally a controlled packet capture integration.

The code creates a local TCP server and client inside an isolated environment and sends actual application bytes.

Mode B must not claim that a Python socket application controls SYN sequence numbers directly. Real low-level packet inspection or controlled packet-loss injection requires appropriate OS/network facilities and isolation.

**Metrics:** Connection duration, retransmissions where observed, state transitions, packet loss, RTO events and successful data exchanges.

**Mastery:** Explain how TCP recovers from packet loss during establishment and distinguish the handshake from subsequent application-level HTTP behavior.

---

## Citadel VII capstone — Diagnose an unreachable trading API

A fictional client cannot consistently connect to `api.example.test`.

The learner must determine whether the problem is:

1. Stale DNS resolution.
2. DNS lookup failure.
3. TCP SYN/SYN-ACK loss.
4. Connection refusal.
5. A gateway or application-level timeout.

This capstone should integrate the event streams from Worlds 40, 41 and 17.

**The central insight:** DNS, TCP and HTTP failures occur at different layers. A useful diagnosis identifies the failure location rather than labeling every problem as “the server is down.”

---

# Part H — Production implementation architecture for all 23 worlds

The individual blueprints establish the teaching experiences. The next requirement is ensuring Antigravity can implement them as **one extensible product** instead of 23 separate experiments.

## H1. Create six simulation-engine families

The 23 worlds should be grouped into reusable execution infrastructure.

| Engine family | Worlds | Responsibility |
|---|---|---|
| `python_runtime_engine` | 13, 14, 15, 16 | Objects, references, execution steps, pipelines, numerical operations |
| `storage_engine` | 24, 25, 26, 39 | Pages, indexes, transaction schedules, queries, caches |
| `os_engine` | 19, 27, 42 | Tasks, schedulers, locks, memory translation |
| `backend_engine` | 17, 18, 20, 21, 28 | HTTP, auth, request lifecycle, queues, resilience |
| `ai_engine` | 34, 35, 36, 37, 38 | Tokenization, retrieval, generation, caching, agents |
| `network_engine` | 40, 41 | Protocol state machines, packets, DNS lookup and timers |

These are logical engine families, not a recommendation to create six independent backend services.

For the initial release, they can exist as Python packages inside the existing FastAPI application, with executable labs dispatched to isolated workers.

## H2. Recommended backend structure

```text
backend/
  app/
    content/
      models.py
      validators.py
      registry.py
      lesson_loader.py

    simulations/
      contracts/
        events.py
        state.py
        run_result.py

      core/
        virtual_clock.py
        event_queue.py
        event_emitter.py
        invariant_checker.py
        deterministic_runner.py

      engines/
        python_runtime/
        storage/
        operating_systems/
        backend/
        artificial_intelligence/
        networking/

      registry.py
      run_service.py

    labs/
      models.py
      worker_dispatcher.py
      permissions.py
      telemetry_normalizer.py

    assessment/
      poe.py
      explanations.py
      mastery.py

    api/
      lessons.py
      simulations.py
      labs.py
      progress.py

  content/
    citadels/
      python_data/
        world_13.yaml
        world_14.yaml
        world_15.yaml
        world_16.yaml

      sql_dbms/
        world_24.yaml
        world_25.yaml
        world_26.yaml
        world_39.yaml

      os_concurrency/
        world_19.yaml
        world_27.yaml
        world_42.yaml

      backend_apis/
        world_17.yaml
        world_18.yaml
        world_20.yaml
        world_21.yaml
        world_28.yaml

      ai_resume/
        world_34.yaml
        world_35.yaml
        world_36.yaml
        world_37.yaml
        world_38.yaml

      computer_networking/
        world_40.yaml
        world_41.yaml

  labs/
    w13/
    w14/
    ...
    w42/

  tests/
    contracts/
    simulations/
    content/
    integration/
```

The actual repository layout should take precedence if it already provides equivalent module boundaries.

## H3. A deterministic simulation engine contract

Each simulator should implement a common callable protocol.

<CodeBlock language="python" editable>
from dataclasses import dataclass
from typing import Any, Protocol


@dataclass(frozen=True)
class SimulationInput:
    lesson_id: str
    stage_id: str
    simulator_id: str
    version: str
    seed: int
    parameters: dict[str, Any]
    actions: list[str]


@dataclass
class SimulationResult:
    final_state: dict[str, Any]
    events: list[dict[str, Any]]
    metrics: dict[str, float]
    assumptions: list[str]


class DeterministicSimulator(Protocol):
    simulator_id: str
    version: str

    def run(
        self,
        request: SimulationInput,
    ) -> SimulationResult:
        ...
</CodeBlock>

Use a shared virtual clock and priority-based event scheduler for concurrent simulations.

For example, the Redis simulator, TCP simulator and task-queue simulator all require delayed events, but they should not implement three different timer systems.

### Required scheduling properties

- Events have explicit simulated timestamps.
- Equal-time events use stable tie-breaking rules.
- Causality is represented separately from visual ordering.
- Randomness is seeded and versioned.
- Runs have event-count and virtual-time limits.
- All emitted events pass schema and invariant validation.
- A reset returns the simulator to its original configuration.
- Repeat runs with the same simulator version, inputs and seed produce the same trace.

## H4. Example: Generic virtual event scheduler

<CodeBlock language="python" editable>
from dataclasses import dataclass, field
from heapq import heappush, heappop
from typing import Any


@dataclass(order=True)
class ScheduledEvent:
    at_ms: int
    order: int
    event_type: str = field(compare=False)
    payload: dict[str, Any] = field(compare=False)


class VirtualScheduler:
    def __init__(self, max_events: int = 10000):
        self.now_ms = 0
        self.next_order = 0
        self.queue: list[ScheduledEvent] = []
        self.max_events = max_events

    def schedule(
        self,
        delay_ms: int,
        event_type: str,
        payload: dict[str, Any],
    ) -> None:
        if delay_ms < 0:
            raise ValueError("Negative event delay")

        self.next_order += 1

        heappush(
            self.queue,
            ScheduledEvent(
                at_ms=self.now_ms + delay_ms,
                order=self.next_order,
                event_type=event_type,
                payload=payload,
            ),
        )

    def run(self, handler):
        processed = 0

        while self.queue:
            if processed >= self.max_events:
                raise RuntimeError(
                    "Simulation event budget exceeded"
                )

            event = heappop(self.queue)
            self.now_ms = event.at_ms

            handler(event, self)
            processed += 1

        return processed
</CodeBlock>

This is a basic scheduler foundation. The production implementation should additionally enforce a maximum virtual timestamp, cancellation policy, event payload validation and simulator-specific terminal conditions.

It should not allow an incorrectly implemented simulator to schedule an infinite sequence of future events.

## H5. Standardize visualizer components

One reusable visualizer can serve several different worlds.

| Visualizer | Reusable across |
|---|---|
| `MemoryView` | Python references, CPython objects, virtual memory |
| `SequenceDiagram` | HTTP, DNS, TCP, queues, authentication |
| `ConcurrencyTimeline` | Threads, GIL, locks, database transactions |
| `ResourceGraph` | Locks, dependency injection, agent tools |
| `RelationalExplorer` | B-Trees, schema design, SQL plans |
| `CacheRelational` | Redis, semantic caching, retrieval stores |
| `PipelineFlow` | Data parsing, FastAPI, RAG |
| `SystemBlueprint` | OOP, distributed systems, resilience |
| `StateMachineView` | TCP, circuit breakers, payment states, agents |
| `MetricsPanel` | Every world |
| `TraceInspector` | Every world |

The common visualizer API should accept:

```typescript
interface SimulationVisualizerProps {
  events: ApexTraceEvent[];
  currentSequence: number;
  metrics: Record<string, number>;
  selectedEntityId?: string;
  onSelectEvent?: (eventId: string) => void;
}
```

No visualization should execute hidden domain logic to generate its own simulation outcomes.

The view can calculate harmless display transformations, but authoritative state transitions and technical results come from the simulation engine.

---

# Part I — Assessment contracts and simulator invariants

## I1. Every world needs one defining invariant

A critical teaching rule is to distinguish the **underlying state of the system** from what a learner observes.

The following invariants form a practical test catalog.

| World | Required invariant / correctness property |
|---|---|
| 13 | Reference aliasing and copy operations preserve the declared object-graph semantics |
| 14 | Provider replacement changes adapters without requiring business-logic changes in the decoupled model |
| 15 | Accepted and quarantined records account for all attempted records under a completed run |
| 16 | Equivalent implementations produce numerically equivalent results within declared tolerance |
| 17 | Client-visible HTTP failure never automatically implies backend rollback |
| 18 | An invalid signature or unauthorized resource request never grants access |
| 19 | A blocked event-loop task prevents other tasks on that loop from progressing until it yields or completes |
| 20 | Failed validation prevents the protected route handler from executing |
| 21 | Duplicate delivery does not create duplicate effects when a correct idempotent handler is enabled |
| 24 | Every returned row satisfies the query predicate regardless of selected scan |
| 25 | A protected inventory reservation never oversells the modeled quantity |
| 26 | Equivalent reporting queries produce consistent expected results |
| 27 | Global lock ordering prevents circular wait in the modeled exclusive-lock system |
| 28 | A fully open circuit rejects protected downstream calls under its declared policy |
| 34 | Token accounting matches the selected tokenizer and pricing fixture |
| 35 | Exact nearest-neighbor results match brute-force reference ordering for the selected metric |
| 36 | Unauthorized documents never enter the assembled context |
| 37 | Cache hits cannot cross forbidden user/tenant boundaries |
| 38 | Unauthorized tool proposals never become executed tool actions |
| 39 | Cache-hit/miss and origin-read accounting remains internally consistent |
| 40 | Unexpired cached records follow the declared cache policy and virtual clock |
| 41 | A TCP peer reaches established state only through valid state-machine transitions |
| 42 | Every resident virtual page maps to a valid physical frame in the simulation |

These are contract tests, not merely display checks.

## I2. POE assessment schema

Every world should produce evidence in three categories:

| Evidence | What it records |
|---|---|
| Prediction | The original choice and attached misconception |
| Observation | Which experiment was actually run and inspected |
| Explanation | The learner's account of why the outcome occurred |

A suggested learner evidence object:

```typescript
interface PoeEvidence {
  lessonId: string;
  stageId: string;

  prediction: {
    choiceId: string;
    submittedAt: string;
  };

  observation: {
    runId: string;
    experimentVersion: string;
    observedEventIds: string[];
  };

  explanation: {
    response: string;
    rubricVersion: string;
    result: "passed" | "needs_review";
    misconceptionIds: string[];
  };
}
```

**Do not allow the client to self-award mastery.** The backend should verify the assessment result and record the content and rubric versions.

The learner may continue exploring after an incorrect prediction. Wrong initial predictions are valuable evidence for targeting misconceptions.

## I3. The 12-point publication quality gate

Apply the same quality checklist to every one of the 23 worlds.

{@body const checklist = [
"Concrete, believable production incident",
"Clear prerequisites and objective-level outcomes",
"Organic stages, without arbitrary stage-count limits",
"Mechanism explained from first principles",
"Exact three-choice POE with misconception feedback",
"Interactive controls that materially alter outcomes",
"Deterministic, versioned Mode A event stream",
"Appropriate, technically accurate visualizer",
"Pre-wired Mode B lab where genuine execution adds value",
"At least one controlled failure or edge case",
"Novel transfer challenge requiring engineering reasoning",
"Accessibility, technical review, tests and reproducibility"
]}
{@body const [checked,setChecked]=DIL.useState([])}
<box border radius="xl" padding={3} gap={3}>
  <row align="center" justify="between">
    **Publication gate**
    <text color="secondary" weight="medium" tabularNums>{checked.length}/12</text>
  </row>
  <box background="surface-tertiary" height="7px" radius="full" clip>
    <box width={`${checked.length/12*100}%`} height="100%" background="#159C85" radius="full"/>
  </box>
  {#each checklist as item,i}
    <checkbox key={i} checked={checked.includes(i)} onChange={v=>setChecked(prev=>v?[...prev,i]:prev.filter(x=>x!==i))} lineThrough={false}>{item}</checkbox>
  {/each}
  <button block color="secondary" variant="outline" onClick={()=>GenUI.copy(checklist.map((x,i)=>`${checked.includes(i)?"[x]":"[ ]"} ${x}`).join("\n"))}><icon name="copy" inline/> Copy quality checklist</button>
</box>

The publication gate must validate the content as well as the software.

A beautiful animation that teaches incorrect TCP behavior should fail publication. A technically correct simulator with incomprehensible instructions should also fail publication.

---

# Part J — Phased engineering roadmap for Antigravity

The most expensive mistake would be to build all 22 new lessons independently.

Instead, implement the common learning infrastructure first, then migrate the worlds in groups that share visualizers and simulator mechanics.

## J1. Implementation sequence

<box gap={3}>
  <row gap={3} align="start">
    <box background="surface-secondary" padding={3} radius="lg">
      <icon name="layers" size="lg"/>
    </box>
    <box flex="1" gap={1}>
      <title size="md">Phase 1 — Finalize the universal engine</title>
      <text color="secondary" size="xs">Highest priority</text>

      Generalize World 17's event schema, create the event scheduler, define the simulator registry, and introduce reusable prediction, observation, mastery and lab components.

      **Exit test:** World 17 continues functioning using the generic engine with no changes to its pedagogical content.
    </box>
  </row>
  <divider color="subtle"/>
  <row gap={3} align="start">
    <box background="surface-secondary" padding={3} radius="lg">
      <icon name="network" size="lg"/>
    </box>
    <box flex="1" gap={1}>
      <title size="md">Phase 2 — Networking and backend integration</title>

      Complete Worlds 40, 41 and 28. Reuse World 17's sequence renderer and develop packet, timer and rate-limiter visualizations.

      **Exit test:** A learner can follow DNS → TCP → HTTP → API Gateway → Rate Limiter as a coherent cross-world journey.
    </box>
  </row>
  <divider color="subtle"/>
  <row gap={3} align="start">
    <box background="surface-secondary" padding={3} radius="lg">
      <icon name="database" size="lg"/>
    </box>
    <box flex="1" gap={1}>
      <title size="md">Phase 3 — Storage, transactions and caching</title>

      Complete Worlds 24, 25, 26 and 39, sharing storage visualizers, transaction scheduling and the database/Redis isolated lab infrastructure.

      **Exit test:** Learners can diagnose an inventory race and a cache stampede, then distinguish performance optimizations from correctness guarantees.
    </box>
  </row>
  <divider color="subtle"/>
  <row gap={3} align="start">
    <box background="surface-secondary" padding={3} radius="lg">
      <icon name="cpu" size="lg"/>
    </box>
    <box flex="1" gap={1}>
      <title size="md">Phase 4 — Runtime, concurrency and memory</title>

      Complete Worlds 13, 19, 27 and 42 using shared reference graphs, memory diagrams, schedulers and synchronization primitives.

      **Exit test:** Learners can explain both event-loop blocking and deadlock rather than misdiagnosing them as the same problem.
    </box>
  </row>
  <divider color="subtle"/>
  <row gap={3} align="start">
    <box background="surface-secondary" padding={3} radius="lg">
      <icon name="workflow" size="lg"/>
    </box>
    <box flex="1" gap={1}>
      <title size="md">Phase 5 — Production application workflows</title>

      Complete Worlds 14, 15, 16, 18, 20 and 21.

      **Exit test:** A complete validation → authentication → transaction → background-worker workflow can be demonstrated and diagnosed.
    </box>
  </row>
  <divider color="subtle"/>
  <row gap={3} align="start">
    <box background="surface-secondary" padding={3} radius="lg">
      <icon name="brain-circuit" size="lg"/>
    </box>
    <box flex="1" gap={1}>
      <title size="md">Phase 6 — GenAI learning engine</title>

      Complete Worlds 34–38, reusing the existing pipeline, cache and state-machine components.

      **Exit test:** A learner can build a safe retrieval-and-tool workflow while monitoring relevance, token cost, permissions and failure conditions.
    </box>
  </row>
  <divider color="subtle"/>
  <row gap={3} align="start">
    <box background="surface-secondary" padding={3} radius="lg">
      <icon name="graduation-cap" size="lg"/>
    </box>
    <box flex="1" gap={1}>
      <title size="md">Phase 7 — Cross-citadel production capstones</title>

      Assemble the commerce, networking, concurrency and GenAI scenarios from the reusable lesson engines.

      **Exit test:** Learners can explain and repair a multi-layer production failure, not merely answer isolated questions about individual technologies.
    </box>
  </row>
</box>

This order prioritizes technical reuse. Curriculum authoring can proceed in parallel, provided the team uses the same versioned manifest and assessment contracts.

---

## J2. Exact work packages to create

| Work package | Deliverable |
|---|---|
| `AC-CORE-001` | Generic `apex.trace.v1` schema with domain event families |
| `AC-CORE-002` | Deterministic scheduler and virtual clock |
| `AC-CORE-003` | Versioned simulator registry |
| `AC-CORE-004` | Content manifest validator with prerequisite graph checks |
| `AC-CORE-005` | POE evidence and mastery API |
| `AC-CORE-006` | Pre-wired lab registry and isolated worker executor |
| `AC-UI-001` | Reusable memory visualizer |
| `AC-UI-002` | Reusable sequence/network visualizer |
| `AC-UI-003` | Reusable concurrency timeline |
| `AC-UI-004` | Reusable pipeline visualizer |
| `AC-UI-005` | Reusable relational/cache visualizer |
| `AC-UI-006` | Reusable architecture/state-machine visualizer |
| `AC-UI-007` | GenAI token, vector and retrieval visualizers |
| `AC-CONTENT-001` | All 23 world manifests and prerequisite relationships |
| `AC-QA-001` | Causal-invariant and event-contract test suite |
| `AC-QA-002` | Content accuracy and accessibility review |
| `AC-QA-003` | Browser journey tests, lab safety tests and DSA regression suite |

## J3. Content-production contract

Each world should ultimately have this structure:

```text
world_39/
  lesson.yaml
  objectives.yaml
  assessments.yaml

  scenarios/
    cache_miss.yaml
    stampede.yaml
    eviction.yaml
    ttl_jitter.yaml

  simulations/
    cache_aside.py
    stampede.py
    eviction.py

  labs/
    starter.py
    requirements.lock

  tests/
    test_simulation.py
    test_invariants.py
    test_lesson_content.py

  references/
    technical_sources.yaml
```

The exact layout can be adapted, but those responsibilities should be represented.

### Three release gates

**Gate 1 — Content validation:** Every stage is connected to objectives, references and a valid experiment or assessment.

**Gate 2 — Engineering validation:** Simulations are reproducible, Mode B is isolated and technical invariants pass.

**Gate 3 — Learning validation:** Learners can explain the mechanism and apply it to a scenario different from the original demonstration.

All three gates are necessary.

---

# Part K — Design principles that must never be compromised

## 1. Failure comes before the mechanism

In World 39, the learner sees a stampede before being taught a Redis coordination strategy.

In World 27, they experience a deadlock before learning why global lock ordering matters.

In World 37, they see a dangerous semantic-cache collision before discovering permission-aware caching.

This makes the mechanism a solution to a problem the learner has already encountered.

## 2. Technical fidelity comes before animation quality

A simulated TCP packet must follow valid state-machine rules.

A simulated transaction must obey the declared isolation model.

A simulated LLM cost must use an explicit pricing fixture.

A simulated Redis lock must not claim stronger correctness guarantees than it provides.

**ApexCaliber's animations must make correct mechanisms understandable, not make incorrect mechanisms attractive.**

## 3. Products provide context, not invented authority

Use Flipkart, Swiggy, Zerodha, Razorpay, Hotstar and other familiar platforms to make the scenarios engaging.

But clearly identify these as educational approximations unless a company's actual architecture or incident has been verified from public sources.

## 4. Keep implementation optional until the mechanism is understood

The pre-wired lab is the natural next step after the learner has explored the mechanism.

It should never be a barrier that requires understanding decorators, Python package management or boilerplate configuration before the student can learn about HTTP, locks, caching or TCP.

## 5. Reward engineering judgment, not only getting the answer right

A strong learner should be able to say:

> “I would use an atomic database update for inventory correctness, Redis for reducing read load, and request coalescing for limiting concurrent cache misses. I would not use a cache lock as my sole defense against overselling.”

That is substantially more valuable than memorizing what `SETNX` means.

---

# Final deliverable summary

The complete teaching-first target for the supplied inventory is now defined:

<box gap={3}>
  <grid columns={2} gap={2}>
    <box border radius="lg" padding={3} gap={1}>
      <text color="secondary" size="2xs">WORLD BLUEPRINTS</text>
      <title size="2xl" tabularNums>23</title>
      <caption>Including World 17</caption>
    </box>
    <box border radius="lg" padding={3} gap={1}>
      <text color="secondary" size="2xs">ESTIMATED CONTENT STAGES</text>
      <title size="2xl" tabularNums>168</title>
      <caption>Proposed across the listed worlds</caption>
    </box>
    <box border radius="lg" padding={3} gap={1}>
      <text color="secondary" size="2xs">ENGINE FAMILIES</text>
      <title size="2xl" tabularNums>6</title>
      <caption>Reusable simulation infrastructure</caption>
    </box>
    <box border radius="lg" padding={3} gap={1}>
      <text color="secondary" size="2xs">QUALITY GATES</text>
      <title size="2xl" tabularNums>12</title>
      <caption>Required per published lesson</caption>
    </box>
  </grid>
</box>

The stage counts are initial authoring recommendations, not fixed implementation constraints. Each world can be split or expanded after prerequisite analysis and learner testing.

## What would help me make the next specification repository-exact?

I can proceed from the architecture above, but two things from you would materially improve its precision:

1. **The seven worlds missing from the stated 30-world inventory**, with their IDs, titles and current slugs.
2. **A snapshot of the current ApexCaliber repository structure**, particularly `QuestionPage.tsx`, the content schemas, simulator registry, visualizer components and World 17 implementation.

With those, the next deliverable can move from architectural blueprints to an exact Antigravity implementation contract: world-by-world YAML manifests, typed event payloads, deterministic transition functions, pre-wired lab files, tests and a migration sequence that preserves existing IDs.

The long-term differentiator is clear:

**ApexCaliber should not merely teach students how to answer engineering interview questions. It should teach them to recognize, experiment with, diagnose and design the systems those questions are about.**