# ApexCaliber — World 17 Production Engineering Specification

<text color="secondary" size="xs" weight="medium">RFC W17-001 · HTTP LIFECYCLE, HEADERS & STATUS CODES · ARCHITECTURE V1.0</text>

<badge color="success">Implementation specification</badge>

This specification defines World 17 as the first complete implementation of ApexCaliber's teaching-first architecture.

It is designed for **FastAPI + Python 3.14, Pydantic V2, React 19, TypeScript, Vite, and Tailwind CSS**.

The proposed contracts are implementation-ready reference designs. They have not been integrated or tested against your actual repository, so Antigravity should reconcile imports, database conventions and existing IDs before merging.

## Architectural decisions

| Decision | Specification |
|---|---|
| Canonical world | World 17 |
| Lesson identifier | `world-17-http` |
| Learning mode | `concept_journey` |
| Pilot stage count | 7, explicitly configured rather than hard-coded |
| Default runtime | Mode A — Deterministic Simulation |
| Advanced runtime | Mode B — Isolated Executable Lab |
| Trace contract | `w17.trace.v1` |
| Content schema | `w17.lesson.v1` |
| Simulation clock | Relative milliseconds, monotonic |
| Transport | JSON for completed runs; SSE where live streaming is needed |
| Assessment | Predict → Observe → Explain → Apply |
| Existing DSA runner | Unchanged |

Two particularly important engineering rules:

1. **An HTTP error status and a network failure are not interchangeable.** A dropped response may mean the client received no HTTP response at all.
2. **A backend commit and successful delivery of the HTTP response are different events.** The simulation must preserve that distinction to teach payment retries correctly.

These rules follow HTTP semantics and current payment integration guidance. <Cite refs={["turn670563search0","turn726239view1"]}/>

---

# 1. The normalized event stream contract

## 1.1 Architectural flow

<box border radius="lg" padding={3} gap={2}>
  <CodeBlock language="mermaid" model_previewable>
flowchart TD
    A["JourneyPlayer"]
    B["Validated SimulationConfig"]
    C{"Execution mode"}
    D["Mode A: Pure deterministic simulator"]
    E["Mode B: Isolated FastAPI lab"]
    F["Event normalization adapter"]
    G["TraceEvent[] — v1"]
    H["Sequence diagram"]
    I["Request inspector"]
    J["Timeline and telemetry"]
    K["POE assessment"]

    A --> B --> C
    C --> D
    C --> E
    D --> G
    E --> F --> G
    G --> H
    G --> I
    G --> J
    G --> K
  </CodeBlock>
</box>

The visualizers **must never depend on the underlying execution mode**.

A request animation must work identically whether the event came from a simulated HTTP lifecycle or a real request executed inside an isolated lab.

The difference is captured in event provenance, not in a separate visualizer API.

## 1.2 TypeScript contract

<text color="secondary" size="xs">Target: `frontend/src/features/journey/contracts/trace-events.ts`</text>

<CodeBlock language="typescript" editable>
export const TRACE_VERSION = "w17.trace.v1" as const;

export type EngineMode = "deterministic" | "executable";
export type EvidenceSource = "simulated" | "observed";

export type StageId =
  | "w17-s1" | "w17-s2" | "w17-s3"
  | "w17-s4" | "w17-s5" | "w17-s6"
  | "w17-s7";

export type HopId =
  | "client"
  | "network"
  | "gateway"
  | "api"
  | "database"
  | "payment_provider";

export type HttpMethod =
  | "GET" | "POST" | "PUT" | "PATCH"
  | "DELETE" | "HEAD" | "OPTIONS";

export interface HttpHeader {
  name: string;
  value: string;
  redacted: boolean;
}

export interface HttpSnapshot {
  protocol: "HTTP/1.1" | "HTTP/2" | "HTTP/3";
  method?: HttpMethod;
  scheme?: "http" | "https";
  path?: string;
  statusCode?: number;
  reason?: string;
  requestHeaders?: HttpHeader[];
  responseHeaders?: HttpHeader[];
  bodyPreview?: string;
  bodyTruncated?: boolean;
}

export interface NetworkObservation {
  layer: "tcp" | "tls" | "http";
  source: "synthetic" | "captured";
  sourcePort?: number;
  destinationPort?: number;
  tcpFlags?: Array<
    "SYN" | "ACK" | "FIN" | "RST" | "PSH"
  >;
  bytes?: number;
  note?: string;
}

export interface TraceTiming {
  /** Time since the preceding event in this run. */
  deltaMs: number;

  /** Duration of the operation represented, if known. */
  durationMs?: number;

  /** Optional measured/simulated stage duration. */
  processingMs?: number;
}

export interface HopRef {
  from?: HopId;
  at: HopId;
  to?: HopId;
}

export interface VisualizerPayload {
  archetype:
    | "sequence"
    | "http_inspector"
    | "status_card"
    | "timeline"
    | "architecture";

  animation:
    | "send"
    | "receive"
    | "process"
    | "commit"
    | "drop"
    | "fail"
    | "highlight"
    | "none";

  focusHops: HopId[];
  edge?: { from: HopId; to: HopId };
  badge?: string;
  annotation?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}

export interface TraceEventBase {
  schemaVersion: typeof TRACE_VERSION;

  eventId: string;
  runId: string;
  lessonId: "world-17-http";
  stageId: StageId;

  mode: EngineMode;
  evidence: EvidenceSource;

  /** Starts at 1 and is contiguous within a run. */
  sequence: number;

  /** Relative to the beginning of the run. */
  atMs: number;

  timing: TraceTiming;

  correlation: {
    traceId: string;
    logicalOperationId: string;
    attemptId: string;
    requestId: string;
  };

  hop: HopRef;

  /** Status is absent if no HTTP response exists. */
  http?: HttpSnapshot;

  /** Optional; never implies real packet capture. */
  network?: NetworkObservation;

  visual: VisualizerPayload;
}

export interface TracePayloadMap {
  "http.request.sent": {
    method: HttpMethod;
    path: string;
  };

  "http.request.received": {
    acceptedBy: HopId;
  };

  "auth.checked": {
    outcome: "accepted" | "rejected";
    reason?: string;
  };

  "validation.checked": {
    outcome: "accepted" | "rejected";
    fieldErrors?: string[];
  };

  "rate_limit.checked": {
    outcome: "accepted" | "rejected";
    remainingTokens: number;
    retryAfterSeconds?: number;
  };

  "app.started": {
    handler: string;
  };

  "app.exception": {
    exceptionCode: string;
    handled: boolean;
  };

  "db.transaction.committed": {
    entityType: "order" | "payment";
    entityId: string;
  };

  "payment.effect.applied": {
    paymentId: string;
    amountMinor: number;
    currency: "INR";
  };

  "gateway.deadline_exceeded": {
    deadlineMs: number;
    upstreamElapsedMs: number;
  };

  "gateway.upstream_invalid": {
    reason: string;
  };

  "http.response.created": {
    statusCode: number;
    producedBy: HopId;
  };

  "http.response.delivered": {
    statusCode: number;
  };

  "http.response.dropped": {
    reason: "connection_lost" | "injected_drop";
  };

  "client.retry": {
    previousAttemptId: string;
    sameIdempotencyKey: boolean;
  };

  "idempotency.lookup": {
    outcome: "miss" | "hit" | "conflict" | "in_progress";
    keyFingerprint: string | null;
  };

  "log.recorded": {
    logCode: string;
    message: string;
    severity: "info" | "warning" | "error";
  };

  "run.completed": {
    outcome:
      | "success"
      | "http_error"
      | "network_failure"
      | "indeterminate";
    clientObservedStatus: number | null;
    committedEffects: number;
  };
}

export type TraceEvent = {
  [K in keyof TracePayloadMap]:
    TraceEventBase & {
      type: K;
      payload: TracePayloadMap[K];
    };
}[keyof TracePayloadMap];

export interface TraceRunResult {
  schemaVersion: typeof TRACE_VERSION;
  runId: string;
  stageId: StageId;
  mode: EngineMode;
  simulationVersion: string;
  events: TraceEvent[];
  metrics: {
    totalLatencyMs: number;
    attempts: number;
    committedEffects: number;
    responseDelivered: boolean;
    statusCode: number | null;
  };
  modelAssumptions: string[];
}
</CodeBlock>

### Why these fields are necessary

| Field | Reason |
|---|---|
| `runId` | Separates one experiment from another |
| `traceId` | Connects related events across application components |
| `logicalOperationId` | Connects multiple attempts to one intended order/payment |
| `attemptId` | Distinguishes the initial request from a retry |
| `requestId` | Identifies an individual HTTP request |
| `sequence` | Deterministic playback ordering |
| `atMs` | Relative event timestamp |
| `deltaMs` | Time elapsed since the previous emitted event |
| `hop` | Enables the request-path animation |
| `http` | Enables headers, methods and status inspection |
| `network` | Represents synthetic or observed transport metadata |
| `visual` | Allows the renderer to remain engine-independent |
| `evidence` | Prevents synthetic telemetry from being mistaken for real capture |

**Important:** HTTP headers are not necessarily literal network-packet headers. They belong in `HttpSnapshot`. TCP flag and port metadata belongs in `NetworkObservation`, and is optional.

### Event invariants

Enforce these at the event normalization layer:

- `sequence` starts at 1 and increments by exactly 1.
- `atMs` is nonnegative and monotonically nondecreasing.
- `timing.deltaMs` equals the difference between consecutive event timestamps; the first event uses `atMs` relative to zero.
- `statusCode` is an integer from 100–599 when present; never use `0` to mean timeout.
- `http.response.dropped` never becomes `http.response.delivered`.
- `db.transaction.committed` means an actual committed state change within the modeled system, not merely a request having been sent.
- `committedEffects` counts distinct business side effects, not attempts.
- In Mode B, `evidence: "observed"` is permitted only for genuinely captured or instrumented events. Inferred or synthesized transitions remain `"simulated"`.
- Sensitive headers such as `Authorization` and cookies must have their values redacted before entering the learner-facing trace.
- Every normalized event must be validated against the same schema at the API boundary.

## 1.3 Example serialized event

This is a complete event for a successful `201 Created` response leaving the API server.

```json
{
  "schemaVersion": "w17.trace.v1",
  "eventId": "run-001:0005",
  "runId": "run-001",
  "lessonId": "world-17-http",
  "stageId": "w17-s3",
  "mode": "deterministic",
  "evidence": "simulated",
  "sequence": 5,
  "atMs": 135,
  "timing": {
    "deltaMs": 45,
    "durationMs": 45,
    "processingMs": 38
  },
  "correlation": {
    "traceId": "trace-001",
    "logicalOperationId": "order-abc",
    "attemptId": "attempt-1",
    "requestId": "req-001"
  },
  "hop": {
    "from": "api",
    "at": "api",
    "to": "gateway"
  },
  "http": {
    "protocol": "HTTP/1.1",
    "method": "POST",
    "scheme": "https",
    "path": "/api/orders",
    "statusCode": 201,
    "reason": "Created",
    "responseHeaders": [
      {
        "name": "Location",
        "value": "/api/orders/ord-912",
        "redacted": false
      },
      {
        "name": "Content-Type",
        "value": "application/json",
        "redacted": false
      }
    ]
  },
  "visual": {
    "archetype": "sequence",
    "animation": "send",
    "focusHops": ["api", "gateway"],
    "edge": {
      "from": "api",
      "to": "gateway"
    },
    "badge": "201 Created",
    "tone": "success"
  },
  "type": "http.response.created",
  "payload": {
    "statusCode": 201,
    "producedBy": "api"
  }
}
```

For a lost response, emit `http.response.created`, followed by `http.response.dropped`, and complete the attempt with `clientObservedStatus: null`.

This lets the visualizer show that the server processed the order even though the user never received confirmation.

---

# 2. Complete seven-stage state machine

## 2.1 Shared stage lifecycle

Every stage should have a common orchestration state, independent of the technical concept it teaches.

<CodeBlock language="mermaid" model_previewable>
stateDiagram-v2
    [*] --> intro
    intro --> predicting: Begin prediction
    predicting --> ready: Submit choice
    ready --> running: Run experiment
    running --> observing: Trace available
    running --> error: Execution failure
    error --> ready: Retry
    observing --> explaining: Inspect observations
    explaining --> completed: Pass checkpoint
    explaining --> needs_review: Misconception remains
    needs_review --> ready: Try new preset
    completed --> [*]
</CodeBlock>

The stage cannot transition to `completed` merely because the animation finished.

Recommended completion rule:

```typescript
function canCompleteStage(state: StageRuntimeState): boolean {
  return (
    state.predictionSubmitted &&
    state.experimentObserved &&
    state.explanationAssessed &&
    state.masteryPassed
  );
}
```

An incorrect prediction **must not block exploration**. In fact, an incorrect prediction followed by a corrected explanation can be valuable evidence of learning.

The complete lesson advances through:

```text
w17-s1 → w17-s2 → w17-s3 → w17-s4
       → w17-s5 → w17-s6 → w17-s7
       → WORLD_17_COMPLETED
```

This ordering is World 17's authored prerequisite chain. The shared engine must continue to support arbitrary lesson graph structures.

---

## Stage 1 — Why does HTTP exist?

<text color="secondary" size="xs">ID: `w17-s1` · Simulator: `http.request-lifecycle`</text>

### Real-world hook

A simulated Swiggy-style food-ordering interface displays a `Place Order` button.

The learner sees that the frontend must communicate the customer's intention to a backend service.

### POE prediction

**Question:** What is the primary purpose of the HTTP request sent when the customer places an order?

| Choice | Answer | Assessment |
|---|---|---|
| A | It tells the backend which operation the client wants performed | **Correct** |
| B | It directly writes the order into the database | Misconception: HTTP carries a request; the server decides how to process it |
| C | It guarantees that the order has been successfully created | Misconception: sending a request does not guarantee execution or success |

### Interactive controls

| Control ID | UI | Allowed values | Default |
|---|---|---|---|
| `network_latency_ms` | Slider | 0–2000 ms | 100 |
| `backend_processing_ms` | Slider | 10–3000 ms | 150 |
| `network_connected` | Toggle | Boolean | `true` |
| `place_order` | Button | Action | — |
| `replay` | Button | Action | — |

### Deterministic transition

```text
Action: place_order
network_connected = true

t=0                       http.request.sent
t=network_latency_ms      http.request.received
t=+1                      app.started
t=+backend_processing_ms  db.transaction.committed
t=+1                      http.response.created (201)
t=+network_latency_ms     http.response.delivered (201)
                           run.completed (success)
```

For `network_connected = false`, emit a request attempt followed by a `http.response.dropped` event with reason `connection_lost`, and `run.completed` with `clientObservedStatus: null` and zero committed effects.

The simulator must explicitly model this as a disconnected-before-arrival scenario, not imply that every network disconnection prevents backend execution.

**Visualizer:** `HTTPSequenceDiagram`, with Client → Network → Gateway → API → Database.

**Mastery checkpoint:** Explain why the frontend needs a server response and why the response does not necessarily reflect everything that may subsequently occur in an asynchronous order workflow.

---

## Stage 2 — Inspect the HTTP request

<text color="secondary" size="xs">ID: `w17-s2` · Simulator: `http.request-inspector`</text>

### POE prediction

**Question:** A `POST /api/orders` request contains a valid JSON body but is missing the required `item_id`. What should our demo FastAPI application return after request validation?

| Choice | Answer | Assessment |
|---|---|---|
| A | `201 Created` | Misconception: valid JSON syntax does not guarantee valid application data |
| B | `422 Unprocessable Content` | **Correct** under the configured FastAPI validation policy |
| C | `500 Internal Server Error` | Misconception: ordinary client validation failures should not be treated as unexpected server errors |

### Interactive controls

| Control ID | UI | Values | Default |
|---|---|---|---|
| `method` | Select | `GET`, `POST`, `PUT`, `DELETE` | `POST` |
| `path` | Select | `/api/orders`, `/api/orders/42` | `/api/orders` |
| `content_type` | Select | `application/json`, `text/plain` | `application/json` |
| `has_authorization` | Toggle | Boolean | `true` |
| `body_variant` | Select | `valid`, `missing_item`, `invalid_json` | `valid` |
| `send_request` | Button | Action | — |

### Transition rules

| Input condition | Result | Event trace |
|---|---|---|
| `POST`, valid JSON, all required fields | `201` | request → auth accepted → validation accepted → commit → 201 |
| `POST`, `missing_item` | `422` | request → auth accepted → validation rejected → 422 |
| `POST`, `text/plain` | `415` in the demo's explicitly configured content-type policy | request → content-type rejection → 415 |
| Unsupported method for selected route | `405` | request → router rejection → 405 |
| Authorization missing | `401` | request → auth rejected → 401 |

For `invalid_json`, the demo should use an explicitly configured parse-error policy rather than treating every malformed request as semantically invalid content. The teaching panel should distinguish malformed syntax from syntactically valid content that fails validation.

**Visualizer:** A request inspector displaying method, URL, headers, JSON body and a structured validation result.

**Mastery checkpoint:** Explain the difference between an HTTP header, the request body and the status code returned by the server.

---

## Stage 3 — HTTP response semantics

<text color="secondary" size="xs">ID: `w17-s3` · Simulator: `http.response-semantics`</text>

### POE prediction

**Question:** The server cannot identify a valid authenticated user for a protected endpoint. Which response should it normally return?

| Choice | Answer | Assessment |
|---|---|---|
| A | `401 Unauthorized` | **Correct** |
| B | `403 Forbidden` | Misconception: `403` generally means the server understands the request but refuses it; `401` is appropriate for missing or invalid authentication credentials |
| C | `500 Internal Server Error` | Misconception: missing credentials are not an unexpected server failure |

HTTP specifies that a `401` response includes an applicable `WWW-Authenticate` challenge. <Cite ref="turn670563search0"/>

### Interactive controls

| Control ID | UI | Values |
|---|---|---|
| `scenario` | Segmented control | `created`, `unauthenticated`, `invalid_body`, `rate_limited` |
| `remaining_tokens` | Slider | 0–5 |
| `show_response_headers` | Toggle | Boolean |
| `run_response` | Button | Action |

### Transition rules

| Scenario | Events | Expected HTTP response |
|---|---|---|
| `created` | request received → validation accepted → DB commit → response created/delivered | `201`, with `Location` |
| `unauthenticated` | request received → `auth.checked(rejected)` → response created/delivered | `401`, with `WWW-Authenticate` |
| `invalid_body` | auth accepted → `validation.checked(rejected)` → response created/delivered | `422`, with field errors |
| `rate_limited` | auth accepted → `rate_limit.checked(rejected)` → response created/delivered | `429`, optionally with `Retry-After` |

For token-bucket experimentation, when tokens equal zero and the configured refill rate is one token per 30 seconds, the simulator may return:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
Content-Type: application/json

{"detail":"Rate limit exceeded"}
```

The `Retry-After` value must be derived from the active simulated limiter state, not hard-coded independently.

**Visualizer:** Status cards + response-header inspector + explanation of which application layer produced the response.

**Mastery checkpoint:** Given four new application scenarios, select the appropriate status and defend the decision.

---

## Stage 4 — Where did the request fail?

<text color="secondary" size="xs">ID: `w17-s4` · Simulator: `http.gateway-failures`</text>

### POE prediction

**Question:** An API gateway waits 30 seconds for an upstream application, but no response arrives before the deadline. Which status should the configured gateway generate?

| Choice | Answer | Assessment |
|---|---|---|
| A | `500 Internal Server Error` | Misconception: a gateway timeout is not necessarily an exception in the application |
| B | `502 Bad Gateway` | Misconception: `502` describes an invalid upstream response rather than merely a late response |
| C | `504 Gateway Timeout` | **Correct** |

These distinctions follow RFC 9110. <Cite ref="turn670563search0"/>

### Interactive controls

| Control ID | UI | Values | Default |
|---|---|---|---|
| `upstream_latency_ms` | Slider | 0–45000 | 150 |
| `gateway_timeout_ms` | Slider | 1000–45000 | 30000 |
| `failure_mode` | Select | `none`, `app_exception`, `invalid_upstream` | `none` |
| `simulate_commit_before_timeout` | Toggle | Boolean | `false` |
| `send_request` | Button | Action | — |

### Transition logic

```text
IF failure_mode == app_exception:
    app.started
    app.exception(handled=false)
    http.response.created(500, producedBy=api)
    http.response.delivered(500)

ELSE IF failure_mode == invalid_upstream:
    app.started
    gateway.upstream_invalid
    http.response.created(502, producedBy=gateway)
    http.response.delivered(502)

ELSE IF upstream_latency_ms > gateway_timeout_ms:
    app.started
    gateway.deadline_exceeded
    http.response.created(504, producedBy=gateway)
    http.response.delivered(504)

ELSE:
    app.started
    db.transaction.committed
    http.response.created(201, producedBy=api)
    http.response.delivered(201)
```

For the commit-before-timeout toggle, the simulator must schedule the database commit separately from response production. A commit may precede a gateway timeout even if the application response itself is delayed.

A gateway timeout does not automatically cancel upstream processing.

**Visualizer:** Multi-lane sequence diagram with a vertical 30-second deadline and highlighted fault origin.

**Mastery checkpoint:** Explain why a `504` response does not prove the backend rolled back its transaction.

---

## Stage 5 — Retry uncertainty and the double-billing trap

<text color="secondary" size="xs">ID: `w17-s5` · Simulator: `http.retry-uncertainty`</text>

### POE prediction

**Question:** A payment/order request times out, but the database may already have committed the operation. What is the safest general retry approach?

| Choice | Answer | Assessment |
|---|---|---|
| A | Create a completely new operation immediately | Misconception: this may duplicate the business effect |
| B | Retry the same logical operation using a stable idempotency key, with status reconciliation when needed | **Correct** |
| C | Assume the operation failed because the HTTP response was lost | Misconception: network failure does not prove transaction failure |

### Interactive controls

| Control ID | UI | Values | Default |
|---|---|---|---|
| `drop_first_response` | Toggle | Boolean | `true` |
| `idempotency_enabled` | Toggle | Boolean | `false` |
| `retry_key_policy` | Select | `reuse`, `regenerate` | `regenerate` |
| `commit_before_drop` | Toggle | Boolean | `true` |
| `send_first` | Button | Action | — |
| `retry_request` | Button | Action | — |
| `reset_scenario` | Button | Action | — |

### Transition: unprotected scenario

```text
Logical operation: checkout-1001

Attempt A:
  http.request.sent
  app.started
  db.transaction.committed(order-1)
  http.response.created(201)
  http.response.dropped

Client observes: no HTTP response

Attempt B:
  client.retry(sameIdempotencyKey=false)
  http.request.sent
  app.started
  db.transaction.committed(order-2)
  http.response.created(201)
  http.response.delivered(201)

Final committedEffects = 2
```

### Transition: protected scenario

```text
Logical operation: checkout-1001
Idempotency key: checkout-1001-key

Attempt A:
  idempotency.lookup(miss)
  db.transaction.committed(order-1)
  http.response.created(201)
  http.response.dropped

Attempt B:
  client.retry(sameIdempotencyKey=true)
  idempotency.lookup(hit)
  http.response.created(201)
  http.response.delivered(201)

Final committedEffects = 1
```

This educational model uses stored-response replay. The persistence layer must atomically associate an idempotency key, a request fingerprint and the resulting business operation; a simple in-memory map is insufficient for a multi-worker production backend.

**Visualizer:** Two request timelines stacked vertically, with persistent state displayed in a database panel.

**Mastery checkpoint:** Explain why the same logical operation needs the same idempotency identity across retries, and why reconciliation is still necessary for uncertain or long-running outcomes.

---

## Stage 6 — Incident diagnosis through partial observability

<text color="secondary" size="xs">ID: `w17-s6` · Simulator: `http.incident-reconstruction`</text>

### POE prediction

**Question:** A client receives `504`, while a database log indicates that the corresponding order transaction committed. Which conclusion is best supported?

| Choice | Answer | Assessment |
|---|---|---|
| A | The database transaction was rolled back | Misconception: the available database evidence contradicts this |
| B | The backend committed an order, but the gateway did not return a timely successful response | **Correct** |
| C | The client must have received `201 Created` before the timeout | Misconception: backend success does not establish response delivery |

### Interactive controls

| Control ID | UI | Values |
|---|---|---|
| `open_gateway_logs` | Button | Reveal gateway log projection |
| `open_application_logs` | Button | Reveal application log projection |
| `open_database_logs` | Button | Reveal commit evidence |
| `correlate_by_trace_id` | Toggle | Boolean |
| `show_second_attempt` | Toggle | Boolean |
| `submit_diagnosis` | Button | Assessment action |

### Initial learner-visible evidence

```text
Gateway:
  trace_id = trace-84
  upstream_timeout = 30000ms
  returned_status = 504

Client:
  checkout unsuccessful / timeout displayed

Application:
  No visible logs yet

Database:
  No visible records yet
```

### Transition logic

```text
open_gateway_logs
  → log.recorded(gateway_timeout)

open_application_logs
  → log.recorded(request_received)
  → log.recorded(application_commit_ack)

open_database_logs
  → log.recorded(transaction_committed)
  → db.transaction.committed(order-912)

show_second_attempt
  → client.retry
  → db.transaction.committed(order-913)
```

The full incident trace must be stored server-side. Each control requests a **projection** of that trace.

Do not send hidden evidence to the frontend and rely on CSS to conceal it; learners could inspect the network response and discover the diagnosis.

**Visualizer:** Distributed-trace waterfall, correlated logs, database commit history and a progressive evidence board.

**Mastery checkpoint:** Submit a root-cause explanation identifying the origin of the timeout, the evidence of committed state and the missing idempotency protection.

---

## Stage 7 — Transfer challenge: UPI payment idempotency

<text color="secondary" size="xs">ID: `w17-s7` · Simulator: `http.upi-payment-transfer`</text>

### Real-world scenario

A fictional checkout integration, inspired by Razorpay-style UPI payment flows, initiates a payment. The customer's app loses connectivity before receiving a conclusive result.

The provider may have accepted the request, but the final payment state is unresolved.

This scenario is illustrative; it does not claim to reproduce Razorpay's exact API or idempotency guarantees.

### POE prediction

**Question:** A UPI payment initiation request times out, and the payment status remains unknown. What should the backend do?

| Choice | Answer | Assessment |
|---|---|---|
| A | Immediately initiate another charge using a new key | Misconception: a new operation might duplicate the payment |
| B | Mark the payment permanently failed | Misconception: a timeout is not authoritative evidence of failure |
| C | Reuse the supported idempotency identity for safe retries, reconcile status and process verified provider updates | **Correct** |

### Interactive controls

| Control ID | UI | Values |
|---|---|---|
| `amount_minor` | Select | `49900`, `99900`, `149900` |
| `provider_latency_ms` | Slider | 0–45000 |
| `response_lost` | Toggle | Boolean |
| `idempotency_policy` | Select | `disabled`, `stable_key`, `new_key` |
| `provider_outcome` | Select | `pending`, `success`, `failed` |
| `duplicate_webhook` | Toggle | Boolean |
| `initiate_payment` | Button | Action |
| `retry_payment` | Button | Action |
| `deliver_webhook` | Button | Action |
| `reconcile_status` | Button | Action |

### Required transition behavior

| Scenario | Expected outcome |
|---|---|
| Provider responds with pending status | Local payment remains `PENDING`; no success claim |
| Initial response lost | Client outcome is unknown; provider state may exist |
| Retry uses supported stable key | No duplicate payment initiation in the demo |
| Retry uses new key | A separate initiation may occur |
| Valid success webhook | Payment transitions to `SUCCEEDED` |
| Duplicate success webhook | Business effect is applied once |
| Verified failure result | Payment transitions to `FAILED` according to the modeled lifecycle |
| Status reconciliation returns success | Local state converges to `SUCCEEDED` |

The simulation should introduce webhook authenticity checks, deduplication and reconciliation, but those are modeled capabilities—not connections to a live payment network.

The canonical success rule is:

```text
HTTP 202 / request accepted
           ≠
UPI payment succeeded
```

### Provider state machine

<CodeBlock language="mermaid" model_previewable>
stateDiagram-v2
    [*] --> CREATED
    CREATED --> PENDING: Initiation accepted
    PENDING --> SUCCEEDED: Verified success
    PENDING --> FAILED: Verified failure
    PENDING --> PENDING: Retry / status unresolved
    SUCCEEDED --> SUCCEEDED: Duplicate webhook ignored
    SUCCEEDED --> [*]
    FAILED --> [*]
</CodeBlock>

For real integrations, intermediate provider-specific states, settlement status, reversals, refunds and disputes require separate modeling.

Stripe's official guidance illustrates why this distinction matters: its API v1 replay semantics differ from API v2, and unresolved operations require reconciliation rather than unlimited retries. ApexCaliber should never teach that all payment providers share identical idempotency semantics. <Cite refs={["turn726239view0","turn726239view1"]}/>

**Final mastery checkpoint:** The learner designs a safe retry policy and explains how idempotency, persistence, verified webhooks and status reconciliation work together.

---

## 2.2 Stage-by-stage transition registry

The implementation should bind each stage to a simulator through a registry, not through seven hard-coded JSX condition branches.

| Stage | Simulator ID | Core action | Primary success evidence |
|---|---|---|---|
| S1 | `http.request-lifecycle` | `place_order` | Request, commit, response sequence |
| S2 | `http.request-inspector` | `send_request` | Correct request inspection and validation |
| S3 | `http.response-semantics` | `run_response` | Correct response and headers |
| S4 | `http.gateway-failures` | `send_request` | Accurate fault-origin identification |
| S5 | `http.retry-uncertainty` | `retry_request` | Correct operation/attempt separation |
| S6 | `http.incident-reconstruction` | `submit_diagnosis` | Evidence-based root cause |
| S7 | `http.upi-payment-transfer` | `reconcile_status` | Safe final-state reasoning |

The critical implementation constraint is that **these seven simulators must emit the same `TraceEvent` contract**, even though their internal state transitions differ.

---

# 3. Pydantic content schema

<text color="secondary" size="xs">Target: `backend/app/content_schema.py`</text>

Use **Pydantic V2 models with strict unknown-field rejection**. A malformed lesson should fail at content-validation or application-startup time, rather than breaking for the learner halfway through the journey.

The schema below is designed to support World 17 while remaining reusable for other teaching-first worlds.

Pydantic V2 can generate JSON Schema from these models and validate YAML-loaded Python objects directly. <Cite refs={["turn171242search6","turn171242search4"]}/>

## 3.1 Complete content model

<CodeBlock language="python" editable>
# backend/app/content_schema.py

from __future__ import annotations

from typing import Literal, TypeAlias

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)


EngineMode: TypeAlias = Literal[
    "deterministic", "executable"
]

ControlValue: TypeAlias = str | int | float | bool


class StrictContentModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_assignment=True,
    )


class PredictionChoice(StrictContentModel):
    id: Literal["A", "B", "C"]
    text: str = Field(min_length=1)
    misconception: str | None = None


class PoePrediction(StrictContentModel):
    id: str = Field(min_length=1)
    question: str = Field(min_length=1)

    choices: list[PredictionChoice] = Field(
        min_length=3,
        max_length=3,
    )

    correct_choice_id: Literal["A", "B", "C"]
    explanation: str = Field(min_length=1)

    @model_validator(mode="after")
    def validate_choices(self):
        ids = [choice.id for choice in self.choices]

        if set(ids) != {"A", "B", "C"}:
            raise ValueError(
                "POE must contain choices A, B, C exactly once"
            )

        for choice in self.choices:
            if (
                choice.id != self.correct_choice_id
                and not choice.misconception
            ):
                raise ValueError(
                    f"Missing misconception for {choice.id}"
                )

        return self


class ControlDefinition(StrictContentModel):
    id: str = Field(min_length=1)
    kind: Literal["slider", "toggle", "select"]
    label: str = Field(min_length=1)

    default: ControlValue

    min_value: float | None = None
    max_value: float | None = None
    step: float | None = None

    options: list[ControlValue] = Field(
        default_factory=list
    )

    @model_validator(mode="after")
    def validate_control(self):
        value = self.default

        if self.kind == "slider":
            if (
                isinstance(value, bool)
                or not isinstance(value, (int, float))
            ):
                raise ValueError(
                    "Slider default must be numeric"
                )

            if (
                self.min_value is None
                or self.max_value is None
                or self.step is None
                or self.step <= 0
                or self.min_value > self.max_value
            ):
                raise ValueError(
                    "Invalid slider range"
                )

            if not (
                self.min_value <= value <= self.max_value
            ):
                raise ValueError(
                    "Slider default outside range"
                )

        elif self.kind == "toggle":
            if not isinstance(value, bool):
                raise ValueError(
                    "Toggle default must be boolean"
                )

        elif self.kind == "select":
            if not self.options:
                raise ValueError(
                    "Select requires options"
                )

            if value not in self.options:
                raise ValueError(
                    "Select default must appear in options"
                )

        return self


class SimulationConfig(StrictContentModel):
    simulator_id: str = Field(min_length=1)

    default_mode: EngineMode = "deterministic"

    supported_modes: list[EngineMode] = Field(
        default_factory=lambda: ["deterministic"],
        min_length=1,
    )

    controls: list[ControlDefinition] = Field(
        default_factory=list
    )

    actions: list[str] = Field(
        min_length=1
    )

    model_assumptions: list[str] = Field(
        default_factory=list
    )

    @model_validator(mode="after")
    def validate_simulation(self):
        if self.default_mode not in self.supported_modes:
            raise ValueError(
                "Default mode must be supported"
            )

        if len(self.supported_modes) != len(
            set(self.supported_modes)
        ):
            raise ValueError("Duplicate engine modes")

        control_ids = [c.id for c in self.controls]

        if len(control_ids) != len(set(control_ids)):
            raise ValueError("Duplicate control IDs")

        if len(self.actions) != len(set(self.actions)):
            raise ValueError("Duplicate actions")

        return self


class MasteryCheck(StrictContentModel):
    objective_ids: list[str] = Field(
        min_length=1
    )

    prompt: str = Field(min_length=1)

    assessment_id: str = Field(min_length=1)


class JourneyStage(StrictContentModel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1)

    description: str = Field(min_length=1)
    real_world_hook: str = Field(min_length=1)

    objective_ids: list[str] = Field(
        min_length=1
    )

    prerequisite_stage_ids: list[str] = Field(
        default_factory=list
    )

    poe: PoePrediction
    simulation: SimulationConfig
    mastery: MasteryCheck


class LearningObjective(StrictContentModel):
    id: str = Field(min_length=1)
    description: str = Field(min_length=1)


class LessonJourney(StrictContentModel):
    schema_version: Literal["w17.lesson.v1"]

    lesson_id: str = Field(min_length=1)
    world_number: int = Field(ge=1)

    citadel_id: str = Field(min_length=1)

    learning_mode: Literal[
        "concept_journey"
    ] = "concept_journey"

    title: str = Field(min_length=1)
    description: str = Field(min_length=1)

    prerequisites: list[str] = Field(
        default_factory=list
    )

    objectives: list[LearningObjective] = Field(
        min_length=1
    )

    stages: list[JourneyStage] = Field(
        min_length=1
    )

    @model_validator(mode="after")
    def validate_journey_graph(self):
        ids = [stage.id for stage in self.stages]

        if len(ids) != len(set(ids)):
            raise ValueError("Duplicate stage IDs")

        objective_ids = [
            objective.id for objective in self.objectives
        ]

        if len(objective_ids) != len(set(objective_ids)):
            raise ValueError("Duplicate objectives")

        known_objectives = set(objective_ids)
        known_stages = set(ids)

        graph = {
            stage.id: stage.prerequisite_stage_ids
            for stage in self.stages
        }

        for stage in self.stages:
            used_objectives = (
                stage.objective_ids
                + stage.mastery.objective_ids
            )

            for objective_id in used_objectives:
                if objective_id not in known_objectives:
                    raise ValueError(
                        f"Unknown objective: {objective_id}"
                    )

            for prerequisite in stage.prerequisite_stage_ids:
                if prerequisite not in known_stages:
                    raise ValueError(
                        f"Unknown stage: {prerequisite}"
                    )

        visiting: set[str] = set()
        visited: set[str] = set()

        def visit(stage_id: str):
            if stage_id in visiting:
                raise ValueError(
                    "Cycle in journey prerequisites"
                )

            if stage_id in visited:
                return

            visiting.add(stage_id)

            for prerequisite in graph[stage_id]:
                visit(prerequisite)

            visiting.remove(stage_id)
            visited.add(stage_id)

        for stage_id in graph:
            visit(stage_id)

        return self
</CodeBlock>

### Deliberate schema decisions

**No fixed stage count:** `LessonJourney.stages` accepts an arbitrary nonempty list, provided the graph is valid.

**One POE prediction per World 17 stage:** Every `JourneyStage` requires a `PoePrediction`. Other future lesson types can introduce a discriminated stage union if they need stages without predictions.

**Buttons are actions:** Buttons such as `retry_request` belong in `SimulationConfig.actions`. They should not be confused with persistent parameter values.

**Controls are declarative:** The UI is generated from control definitions rather than bespoke React forms for every lesson.

**No embedded Python:** YAML specifies simulator IDs and parameters, not executable Python expressions. The backend resolves a simulator ID through a trusted registry.

**Strict value verification:** The model validates the authored control defaults. Incoming runtime parameter values still need separate validation against these definitions.

For production, also add string-length limits and content-size caps, finite-number validation, and simulator-registry reference checks. These are best implemented as shared content linting and API boundary validation rather than left implicit.

---

## 3.2 Example World 17 YAML content

<text color="secondary" size="xs">Target: `backend/content/worlds/world_17_http.yaml`</text>

This is a fully populated example of Stage 4 using the schema above. The other six stages should follow the same structure, using the stage definitions specified earlier.

```yaml
schema_version: w17.lesson.v1
lesson_id: world-17-http
world_number: 17
citadel_id: backend
learning_mode: concept_journey

title: "HTTP Lifecycle, Headers & Status Codes"
description: >
  Understand HTTP requests, responses, failures,
  retries and real-world backend behavior.

prerequisites:
  - networking-client-server-basics

objectives:
  - id: http.failure-origin
    description: >
      Distinguish application exceptions from
      upstream and gateway failures.

stages:
  - id: w17-s4
    title: "Where did the request fail?"

    description: >
      Investigate upstream failures, application
      crashes and gateway deadlines.

    real_world_hook: >
      A customer submits an order but receives
      an error after the gateway contacts the backend.

    objective_ids:
      - http.failure-origin

    prerequisite_stage_ids: []

    poe:
      id: poe-w17-s4
      question: >
        The gateway waits 30 seconds for its
        upstream server but receives no response.
        Which status should it return?

      choices:
        - id: A
          text: "500 Internal Server Error"
          misconception: >
            An upstream timeout is not necessarily
            an application exception.

        - id: B
          text: "502 Bad Gateway"
          misconception: >
            An invalid upstream response differs
            from a late or missing response.

        - id: C
          text: "504 Gateway Timeout"

      correct_choice_id: C

      explanation: >
        The reverse proxy generates 504 when its
        configured upstream response deadline
        expires without a timely response.

    simulation:
      simulator_id: http.gateway-failures
      default_mode: deterministic
      supported_modes:
        - deterministic
        - executable

      controls:
        - id: upstream_latency_ms
          kind: slider
          label: "Upstream latency"
          default: 150
          min_value: 0
          max_value: 45000
          step: 50

        - id: gateway_timeout_ms
          kind: slider
          label: "Gateway deadline"
          default: 30000
          min_value: 1000
          max_value: 45000
          step: 1000

        - id: failure_mode
          kind: select
          label: "Failure injection"
          default: none
          options:
            - none
            - app_exception
            - invalid_upstream

        - id: simulate_commit_before_timeout
          kind: toggle
          label: "Commit before timeout"
          default: false

      actions:
        - send_request
        - reset_scenario

      model_assumptions:
        - "The gateway deadline is configurable."
        - "App exceptions produce HTTP 500."
        - "Invalid upstream responses produce HTTP 502."
        - "Gateway deadlines produce HTTP 504."

    mastery:
      assessment_id: assess-w17-s4
      objective_ids:
        - http.failure-origin
      prompt: >
        Explain why a gateway timeout does not
        prove that an upstream database transaction
        was rolled back.
```

This is a **single-stage validation fixture**, not the complete seven-stage World 17 file. It intentionally has no prerequisite stage because Stage 3 is not included in this isolated example. In the complete journey, `w17-s4` should declare `w17-s3` as its prerequisite, with all seven stage records and their corresponding objectives present.

That permits developers to validate the schema independently before authoring the full manifest.

## 3.3 Generate the authoritative JSON Schema

Do not manually maintain a separate JSON Schema that could drift from Pydantic.

Generate it from the source models.

<CodeBlock language="python" editable>
# backend/scripts/export_content_schemas.py

import json
from pathlib import Path

from app.content_schema import (
    LessonJourney,
    JourneyStage,
    PoePrediction,
    SimulationConfig,
)

models = {
    "lesson-journey": LessonJourney,
    "journey-stage": JourneyStage,
    "poe-prediction": PoePrediction,
    "simulation-config": SimulationConfig,
}

output_dir = Path("backend/generated/schemas")
output_dir.mkdir(parents=True, exist_ok=True)

for filename, model in models.items():
    schema = model.model_json_schema(
        mode="validation"
    )

    output = output_dir / f"{filename}.schema.json"

    output.write_text(
        json.dumps(schema, indent=2),
        encoding="utf-8",
    )

    print(f"Generated {output}")
</CodeBlock>

This produces four JSON Schema files:

```text
backend/generated/schemas/
  lesson-journey.schema.json
  journey-stage.schema.json
  poe-prediction.schema.json
  simulation-config.schema.json
```

Pydantic-generated schemas use JSON Schema Draft 2020-12 conventions. <Cite ref="turn171242search6"/>

### Example runtime JSON request

The runtime must use a separate request contract from the authoring YAML.

```json
{
  "lessonId": "world-17-http",
  "stageId": "w17-s4",
  "simulatorId": "http.gateway-failures",
  "mode": "deterministic",
  "simulationVersion": "1.0.0",
  "parameters": {
    "upstream_latency_ms": 35000,
    "gateway_timeout_ms": 30000,
    "failure_mode": "none",
    "simulate_commit_before_timeout": false
  },
  "actions": [
    "send_request"
  ],
  "seed": 0
}
```

The runtime validator must reject an unknown simulator ID, unsupported mode, undeclared parameter, out-of-range slider value, undeclared action or incompatible simulation version.

The simulator must also revalidate the configuration server-side. Client-side validation is only for user experience, not trust.

## 3.4 Simulation execution API

Recommended endpoint:

`POST /api/v2/simulations/runs`

Returns `TraceRunResult` for a short deterministic simulation.

For example:

```json
{
  "schemaVersion": "w17.trace.v1",
  "runId": "run-504-001",
  "stageId": "w17-s4",
  "mode": "deterministic",
  "simulationVersion": "1.0.0",
  "events": [],
  "metrics": {
    "totalLatencyMs": 30000,
    "attempts": 1,
    "committedEffects": 0,
    "responseDelivered": true,
    "statusCode": 504
  },
  "modelAssumptions": [
    "30-second upstream response deadline",
    "No application commit occurs before timeout"
  ]
}
```

The empty `events` array above is only an envelope example. A successful simulation run **must populate the event trace**, in order, including request submission, upstream activity, gateway deadline, response creation, delivery and completion.

### API access strategy

- `GET /api/v2/lessons/world-17-http` — learner-safe content projection.
- `POST /api/v2/lessons/world-17-http/predictions` — record prediction and return feedback.
- `POST /api/v2/simulations/runs` — execute and return a completed trace.
- `GET /api/v2/simulations/runs/{run_id}/events` — optional SSE stream.
- `POST /api/v2/lessons/world-17-http/checkpoints` — evaluate learning evidence.

**Never expose `correct_choice_id` or misconception feedback to the learner before prediction submission.** Those fields belong in the authoring model and protected assessment logic, while the public lesson API should return only choice IDs and text until feedback becomes available.

For executable labs, use a separate authenticated execution route and queue/worker system rather than performing untrusted or potentially expensive work inside the main request handler.

---

# 4. React 19 component architecture

<text color="secondary" size="xs">Target: `frontend/src/features/journey/`</text>

## 4.1 Component hierarchy

<CodeBlock language="mermaid" model_previewable>
flowchart TD
    A["QuestionPage.tsx"]
    B["JourneyPlayer.tsx"]
    C["StageStepper"]
    D["ActiveStageView"]
    E["PredictionModal"]
    F["InteractiveSimulatorCard"]
    G["TracePlayback"]
    H["CodeLabDrawer"]
    I["MasteryCheckpoint"]
    J["VisualizerRegistry"]
    K["HttpSequenceDiagram"]
    L["RequestInspector"]
    M["IncidentTimeline"]

    A --> B
    B --> C
    B --> D
    B --> E
    B --> H
    D --> F
    D --> I
    F --> G
    G --> J
    J --> K
    J --> L
    J --> M
</CodeBlock>

Proposed directory structure:

```text
frontend/src/
  features/
    journey/
      JourneyPlayer.tsx
      JourneyPlayer.reducer.ts
      journey.types.ts

      contracts/
        trace-events.ts
        simulation-api.ts

      components/
        StageStepper.tsx
        ActiveStageView.tsx
        PredictionModal.tsx
        InteractiveSimulatorCard.tsx
        MasteryCheckpoint.tsx
        CodeLabDrawer.tsx

      visualizers/
        VisualizerRegistry.tsx
        HttpSequenceDiagram.tsx
        HttpRequestInspector.tsx
        GatewayFailureTimeline.tsx
        RetryAttemptTimeline.tsx
        IncidentEvidenceBoard.tsx
        PaymentStateMachine.tsx

      hooks/
        useJourneyProgress.ts
        useSimulationRunner.ts
        useTracePlayback.ts

      api/
        journeyApi.ts
```

The `JourneyPlayer` owns navigation and learning state. The simulator card owns the control UI. The trace visualizers are presentational consumers of normalized events.

## 4.2 State reducer

<text color="secondary" size="xs">Target: `JourneyPlayer.reducer.ts`</text>

Use `useReducer` rather than scattering stage state across numerous independent booleans.

<CodeBlock language="typescript" editable>
import type {
  StageId,
  TraceRunResult,
} from "./contracts/trace-events";

export type StagePhase =
  | "intro"
  | "predicting"
  | "ready"
  | "running"
  | "observing"
  | "explaining"
  | "needs_review"
  | "completed"
  | "error";

export interface PlayerState {
  activeStageId: StageId;
  phase: StagePhase;

  completedStageIds: StageId[];

  predictions: Partial<Record<StageId, string>>;

  traces: Partial<Record<StageId, TraceRunResult>>;

  actionHistory: Partial<Record<StageId, string[]>>;

  errorMessage: string | null;
}

export type PlayerAction =
  | { type: "OPEN_PREDICTION" }
  | {
      type: "SUBMIT_PREDICTION";
      stageId: StageId;
      choiceId: string;
    }
  | { type: "RUN_STARTED" }
  | {
      type: "RUN_SUCCEEDED";
      stageId: StageId;
      trace: TraceRunResult;
      actions: string[];
    }
  | {
      type: "RUN_FAILED";
      message: string;
    }
  | { type: "OPEN_EXPLANATION" }
  | {
      type: "ASSESSMENT_FAILED";
    }
  | {
      type: "STAGE_COMPLETED";
      stageId: StageId;
    }
  | {
      type: "NAVIGATE";
      stageId: StageId;
    };

export function playerReducer(
  state: PlayerState,
  action: PlayerAction
): PlayerState {
  switch (action.type) {
    case "OPEN_PREDICTION":
      return { ...state, phase: "predicting" };

    case "SUBMIT_PREDICTION":
      return {
        ...state,
        phase: "ready",
        predictions: {
          ...state.predictions,
          [action.stageId]: action.choiceId,
        },
      };

    case "RUN_STARTED":
      return {
        ...state,
        phase: "running",
        errorMessage: null,
      };

    case "RUN_SUCCEEDED":
      return {
        ...state,
        phase: "observing",
        traces: {
          ...state.traces,
          [action.stageId]: action.trace,
        },
        actionHistory: {
          ...state.actionHistory,
          [action.stageId]: action.actions,
        },
      };

    case "RUN_FAILED":
      return {
        ...state,
        phase: "error",
        errorMessage: action.message,
      };

    case "OPEN_EXPLANATION":
      return { ...state, phase: "explaining" };

    case "ASSESSMENT_FAILED":
      return { ...state, phase: "needs_review" };

    case "STAGE_COMPLETED":
      return {
        ...state,
        phase: "completed",
        completedStageIds: [
          ...new Set([
            ...state.completedStageIds,
            action.stageId,
          ]),
        ],
      };

    case "NAVIGATE":
      return {
        ...state,
        activeStageId: action.stageId,
        phase: state.completedStageIds.includes(
          action.stageId
        )
          ? "completed"
          : state.predictions[action.stageId]
            ? state.traces[action.stageId]
              ? "observing"
              : "ready"
            : "intro",
        errorMessage: null,
      };

    default:
      return state;
  }
}
</CodeBlock>

### Reducer guardrails

The reducer above defines the state updates. The production player must also enforce guards before dispatch:

- A learner cannot navigate to a stage whose prerequisites are incomplete.
- A run cannot begin until the current prediction has been submitted.
- A stage cannot complete before a passing assessment response.
- A retry action cannot execute without the preceding attempt in the deterministic action history.
- A stale API response cannot overwrite the state of a newer experiment.
- Completion should be acknowledged by the backend before being treated as persistent mastery.

The backend remains authoritative for unlocking stages and persisting progress. Client-side reducer state provides the responsive UI.

## 4.3 Main `JourneyPlayer.tsx`

The following is the reference orchestration layer. It assumes that the child components and `LessonJourneyView` type are generated/implemented under the paths shown above.

<CodeBlock language="tsx" editable>
import {
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

import {
  playerReducer,
  type PlayerState,
} from "./JourneyPlayer.reducer";

import type { StageId } from "./contracts/trace-events";
import type { LessonJourneyView } from "./journey.types";

import { StageStepper } from "./components/StageStepper";
import { ActiveStageView } from "./components/ActiveStageView";
import { PredictionModal } from "./components/PredictionModal";
import { CodeLabDrawer } from "./components/CodeLabDrawer";

type Params = Record<
  string,
  string | number | boolean
>;

interface Props {
  journey: LessonJourneyView;
}

export function JourneyPlayer({ journey }: Props) {
  const initialState: PlayerState = {
    activeStageId: journey.stages[0].id as StageId,
    phase: "intro",
    completedStageIds: [],
    predictions: {},
    traces: {},
    actionHistory: {},
    errorMessage: null,
  };

  const [state, dispatch] = useReducer(
    playerReducer,
    initialState
  );

  const [labOpen, setLabOpen] = useState(false);
  const [predictionFeedback, setPredictionFeedback] =
    useState<string | null>(null);

  const requestController =
    useRef<AbortController | null>(null);

  const activeStage = journey.stages.find(
    stage => stage.id === state.activeStageId
  )!;

  useEffect(() => {
    return () => {
      requestController.current?.abort();
    };
  }, []);

  function isUnlocked(stageId: string) {
    const stage = journey.stages.find(
      item => item.id === stageId
    );

    if (!stage) return false;

    return stage.prerequisiteStageIds.every(
      id => state.completedStageIds.includes(
        id as StageId
      )
    );
  }

  async function submitPrediction(choiceId: string) {
    const response = await fetch(
      `/api/v2/lessons/${journey.lessonId}/predictions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId: activeStage.id,
          choiceId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Prediction submission failed");
    }

    const feedback = await response.json();
    setPredictionFeedback(feedback.explanation);

    dispatch({
      type: "SUBMIT_PREDICTION",
      stageId: activeStage.id as StageId,
      choiceId,
    });
  }

  async function runExperiment(
    action: string,
    parameters: Params
  ) {
    if (state.phase === "running") return;

    const stageId = activeStage.id as StageId;

    const previousActions =
      state.actionHistory[stageId] ?? [];

    const actions = action === "reset_scenario"
      ? []
      : [...previousActions, action];

    // Cancel any previous request before starting a new run.
    requestController.current?.abort();

    const controller = new AbortController();
    requestController.current = controller;

    dispatch({ type: "RUN_STARTED" });

    try {
      const response = await fetch(
        "/api/v2/simulations/runs",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            lessonId: journey.lessonId,
            stageId,
            simulatorId:
              activeStage.simulation.simulatorId,
            mode: "deterministic",
            simulationVersion: "1.0.0",
            parameters,
            actions,
            seed: 0,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Simulation HTTP ${response.status}`);
      }

      const trace = await response.json();

      if (controller.signal.aborted) return;

      dispatch({
        type: "RUN_SUCCEEDED",
        stageId,
        trace,
        actions,
      });
    } catch (error) {
      if (controller.signal.aborted) return;

      dispatch({
        type: "RUN_FAILED",
        message: error instanceof Error
          ? error.message
          : "Simulation failed",
      });
    }
  }

  function navigate(stageId: string) {
    if (!isUnlocked(stageId)) return;
    if (state.phase === "running") return;

    dispatch({
      type: "NAVIGATE",
      stageId: stageId as StageId,
    });

    setPredictionFeedback(null);
  }

  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-8">
      <StageStepper
        stages={journey.stages}
        activeId={state.activeStageId}
        completedIds={state.completedStageIds}
        isUnlocked={isUnlocked}
        onSelect={navigate}
      />

      <ActiveStageView
        stage={activeStage}
        phase={state.phase}
        trace={state.traces[state.activeStageId]}
        onBeginPrediction={() =>
          dispatch({ type: "OPEN_PREDICTION" })
        }
        onRun={runExperiment}
        onOpenLab={() => setLabOpen(true)}
        onExplain={() =>
          dispatch({ type: "OPEN_EXPLANATION" })
        }
        onAssessmentPassed={() =>
          dispatch({
            type: "STAGE_COMPLETED",
            stageId: state.activeStageId,
          })
        }
      />

      <PredictionModal
        open={state.phase === "predicting"}
        prediction={activeStage.poe}
        feedback={predictionFeedback}
        onSubmit={submitPrediction}
      />

      <CodeLabDrawer
        open={labOpen}
        stage={activeStage}
        onClose={() => setLabOpen(false)}
      />
    </main>
  );
}
</CodeBlock>

### Production integration notes

This is the orchestration skeleton, not the complete production UI. Before merging, make the following additions:

- `LessonJourneyView` must be a sanitized learner-facing DTO. It must not contain hidden correct answers or instructor-only evidence.
- Validate simulation responses at the runtime boundary using the generated trace schema.
- Include a monotonically increasing client request token in the simulation hook so a stale response cannot overwrite a newer run.
- Persist predictions, experiment observations and mastery through the progress API.
- Hydrate progress when the journey loads; do not rely on the reducer's empty initial arrays for returning learners.
- The `reset_scenario` action should explicitly reset the current stage's stored action history and simulator controls; it must not accidentally count as a fresh experimental run.
- Catch and display prediction/assessment submission failures without losing the learner's draft answer.
- A `STAGE_COMPLETED` dispatch should occur only after the backend accepts the assessed explanation.
- Expose Mode B in the lab drawer only when the stage supports it and the backend authorizes executable runs.

The `onAssessmentPassed` callback above assumes that the assessment component has already obtained backend approval. That contract must be enforced in its implementation.

## 4.4 Prediction modal

The modal should not be a conventional quiz popup with immediate answer reveal.

Recommended interaction:

<box border radius="xl" padding={3} gap={3}>
  <row justify="between" align="center">
    <text weight="medium">Predict before running</text>
    <badge>Stage 4</badge>
  </row>
  **The gateway waits 30 seconds but receives no timely upstream response. What should happen?**
  {@body const [predictionChoice,setPredictionChoice]=DIL.useState("C")}
  <radio-group direction="col" value={predictionChoice} onChange={setPredictionChoice}>
    <radio value="A">500 — Internal Server Error</radio>
    <radio value="B">502 — Bad Gateway</radio>
    <radio value="C">504 — Gateway Timeout</radio>
  </radio-group>
  <button block onClick={()=>GenUI.copy(`World 17 Stage 4 prediction: ${predictionChoice}`)}>Save prediction choice</button>
  <caption>Illustrative interface. The actual application submits the prediction to the backend and proceeds to the experiment rather than checking the answer locally.</caption>
</box>

The production modal should use accessible dialog semantics, focus trapping, escape handling and a clear choice submission state.

For continuity, it should appear once at the beginning of a stage's initial experiment, not on every minor parameter adjustment.

## 4.5 Interactive simulator card

Use a control renderer driven by YAML metadata.

```tsx
<InteractiveSimulatorCard
  config={activeStage.simulation}
  onRun={(action, parameters) =>
    runExperiment(action, parameters)
  }
  disabled={state.phase === "running"}
/>
```

The renderer should map control types to components:

```typescript
const controlRegistry = {
  slider: SliderControl,
  toggle: ToggleControl,
  select: SelectControl,
} as const;
```

Buttons must be generated from `simulation.actions`, with each action's label and enabled condition supplied by the simulator metadata or a trusted action registry.

Use controlled inputs and apply the authored defaults on stage initialization.

**Do not infer default values from previously rendered React components.** Controls should reset predictably when a new scenario is selected.

## 4.6 Trace playback and visualizer registry

<CodeBlock language="tsx" editable>
import type {
  TraceEvent,
} from "../contracts/trace-events";

import { HttpSequenceDiagram } from "./HttpSequenceDiagram";
import { HttpRequestInspector } from "./HttpRequestInspector";
import { GatewayFailureTimeline } from "./GatewayFailureTimeline";

export function VisualizerRegistry({
  events,
}: {
  events: TraceEvent[];
}) {
  const archetype =
    events[events.length - 1]?.visual.archetype
    ?? "sequence";

  switch (archetype) {
    case "http_inspector":
      return <HttpRequestInspector events={events} />;

    case "timeline":
      return <GatewayFailureTimeline events={events} />;

    default:
      return <HttpSequenceDiagram events={events} />;
  }
}
</CodeBlock>

This is the minimal registry. The full implementation should select the visualizer from stage configuration or an explicit visualization track, rather than automatically using the final event's archetype when events have different visual roles.

**Playback requirements:**

- Timeline seek, pause, step-forward, step-backward and restart.
- Deterministic replay using event timestamps.
- Variable playback speed without changing simulated timestamps.
- Request/response inspection by selecting a hop or event.
- Reduced-motion mode and accessible textual trace.
- A consistent presentation for unavailable or incomplete telemetry.

The renderer should animate **normalized events**, not attempt to reconstruct causal behavior from HTML or source code.

## 4.7 Pre-wired Code Lab drawer

The lab drawer should expose:

<grid columns={2} gap={2}>
  <box border radius="lg" padding={3} gap={2}>
    <icon name="settings-2"/>
    **Parameters**

    <text size="sm">Latency, deadlines, failure mode, authentication and retry policy.</text>
  </box>
  <box border radius="lg" padding={3} gap={2}>
    <icon name="code-2"/>
    **Preloaded code**

    <text size="sm">Working FastAPI example with relevant lines highlighted by the trace.</text>
  </box>
  <box border radius="lg" padding={3} gap={2}>
    <icon name="play"/>
    **Execution**

    <text size="sm">Run the example in a controlled environment and inspect observed events.</text>
  </box>
  <box border radius="lg" padding={3} gap={2}>
    <icon name="chart-no-axes-combined"/>
    **Telemetry**

    <text size="sm">Request duration, gateway outcome, logs and committed business effects.</text>
  </box>
</grid>

For the pilot, Mode B should initially run **pre-approved, parameterized FastAPI code**, not arbitrary edited code. Supporting arbitrary code execution safely is a separate sandboxing milestone.

The starter should load successfully without the learner writing boilerplate. Editing can become an advanced optional feature after the isolated runner is hardened.

---

# 5. Backend runtime validation and simulator registry

The YAML authoring model answers **what the lesson contains**. The runtime model answers **what the learner is allowed to execute**.

These should remain separate.

## 5.1 Validate experiment requests

<text color="secondary" size="xs">Target: `backend/app/simulations/run_schema.py`</text>

<CodeBlock language="python" editable>
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.content_schema import (
    ControlDefinition,
    JourneyStage,
)

Parameter = str | int | float | bool


class SimulationRunRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    lessonId: str
    stageId: str
    simulatorId: str

    mode: Literal["deterministic", "executable"]

    simulationVersion: str

    parameters: dict[str, Parameter]

    actions: list[str] = Field(
        min_length=1,
        max_length=30,
    )

    seed: int = Field(default=0, ge=0)


def validate_parameter(
    control: ControlDefinition,
    value: Parameter,
) -> None:
    if control.kind == "toggle":
        if type(value) is not bool:
            raise ValueError(
                f"{control.id} requires boolean"
            )
        return

    if control.kind == "select":
        if value not in control.options:
            raise ValueError(
                f"{control.id}: invalid option"
            )
        return

    if control.kind == "slider":
        if type(value) not in (int, float):
            raise ValueError(
                f"{control.id} requires number"
            )

        low = control.min_value
        high = control.max_value
        step = control.step

        assert low is not None
        assert high is not None
        assert step is not None

        if not low <= value <= high:
            raise ValueError(
                f"{control.id}: outside allowed range"
            )

        offset = (value - low) / step

        if abs(offset - round(offset)) > 1e-7:
            raise ValueError(
                f"{control.id}: invalid slider step"
            )


def validate_run(
    request: SimulationRunRequest,
    stage: JourneyStage,
    expected_version: str,
) -> dict[str, Parameter]:
    config = stage.simulation

    if request.stageId != stage.id:
        raise ValueError("Stage mismatch")

    if request.simulatorId != config.simulator_id:
        raise ValueError("Simulator mismatch")

    if request.simulationVersion != expected_version:
        raise ValueError("Unsupported simulator version")

    if request.mode not in config.supported_modes:
        raise ValueError("Unsupported mode")

    if any(
        action not in config.actions
        for action in request.actions
    ):
        raise ValueError("Undeclared action")

    controls = {
        control.id: control
        for control in config.controls
    }

    unknown = set(request.parameters) - set(controls)

    if unknown:
        raise ValueError(
            f"Unknown parameters: {sorted(unknown)}"
        )

    resolved = {
        control.id: control.default
        for control in config.controls
    }

    resolved.update(request.parameters)

    for control_id, value in resolved.items():
        validate_parameter(controls[control_id], value)

    return resolved
</CodeBlock>

At the API boundary, translate expected input-validation failures into a structured `422` response. Unsupported simulator versions may instead warrant a documented compatibility error such as `409`.

For production, extend numeric validation to reject non-finite numbers and cap serialized request size.

## 5.2 Simulator registry

<text color="secondary" size="xs">Target: `backend/app/simulations/registry.py`</text>

```python
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

SimulationFunction = Callable[
    [dict[str, Any], list[str], int],
    dict[str, Any],
]


@dataclass(frozen=True)
class SimulatorDefinition:
    id: str
    version: str
    run: SimulationFunction


SIMULATORS: dict[str, SimulatorDefinition] = {}


def register_simulator(
    definition: SimulatorDefinition,
) -> None:
    if definition.id in SIMULATORS:
        raise ValueError(
            f"Duplicate simulator: {definition.id}"
        )

    SIMULATORS[definition.id] = definition


def get_simulator(simulator_id: str):
    try:
        return SIMULATORS[simulator_id]
    except KeyError:
        raise ValueError(
            "Unknown simulator"
        ) from None
```

Each World 17 simulator is registered at application startup using a trusted Python function.

For example:

```python
register_simulator(
    SimulatorDefinition(
        id="http.gateway-failures",
        version="1.0.0",
        run=simulate_gateway_failures,
    )
)
```

This registration assumes `simulate_gateway_failures` has been implemented using the declared function signature.

Avoid dynamic module imports based on untrusted simulator IDs, `eval`, or arbitrary YAML-supplied code paths.

## 5.3 Correct gateway timeout scheduling

There is one subtle issue Antigravity should handle carefully.

The simplified Stage 4 decision table prioritizes failure-mode branches for explanation. A production-grade simulator must instead schedule competing events according to their actual occurrence times.

Consider:

```text
Gateway deadline:      30,000 ms
Application exception: 35,000 ms
```

The learner should observe the gateway deadline first, not incorrectly receive a `500` generated five seconds later.

A deterministic gateway decision function:

<CodeBlock language="python" editable>
from typing import Literal
from dataclasses import dataclass


FailureMode = Literal[
    "none",
    "app_exception",
    "invalid_upstream",
]


@dataclass(frozen=True)
class GatewayOutcome:
    client_status: int
    response_at_ms: int
    produced_by: str
    upstream_may_continue: bool


def determine_gateway_outcome(
    upstream_latency_ms: int,
    gateway_timeout_ms: int,
    failure_mode: FailureMode,
) -> GatewayOutcome:
    # Deadline takes precedence when the upstream
    # has not produced a response in time.
    if upstream_latency_ms >= gateway_timeout_ms:
        return GatewayOutcome(
            client_status=504,
            response_at_ms=gateway_timeout_ms,
            produced_by="gateway",
            upstream_may_continue=True,
        )

    if failure_mode == "app_exception":
        return GatewayOutcome(
            client_status=500,
            response_at_ms=upstream_latency_ms,
            produced_by="api",
            upstream_may_continue=False,
        )

    if failure_mode == "invalid_upstream":
        return GatewayOutcome(
            client_status=502,
            response_at_ms=upstream_latency_ms,
            produced_by="gateway",
            upstream_may_continue=False,
        )

    return GatewayOutcome(
        client_status=201,
        response_at_ms=upstream_latency_ms,
        produced_by="api",
        upstream_may_continue=False,
    )
</CodeBlock>

This assumes the requested `upstream_latency_ms` represents the time until the upstream produces its response or failure, and that the deadline wins if both occur at exactly the same simulated instant. These are explicit simulation policies.

A separate database-commit event must be scheduled independently when the scenario allows a commit before the gateway's deadline.

That event must not be inferred from a `201` response or from `GatewayOutcome` alone.

## 5.4 Mode B normalization requirements

Mode B needs an adapter that transforms observed application events into the same `TraceEvent` contract.

Recommended mapping:

| Mode B source | Normalized event |
|---|---|
| Instrumented client request | `http.request.sent` |
| Gateway request receipt | `http.request.received` |
| FastAPI handler-entry hook | `app.started` |
| Authentication dependency | `auth.checked` |
| Request validation | `validation.checked` |
| Transaction commit hook | `db.transaction.committed` |
| Exception instrumentation | `app.exception` |
| Proxy timeout log | `gateway.deadline_exceeded` |
| Gateway response instrumentation | `http.response.created` |
| Client response observation | `http.response.delivered` |
| Client connection failure | `http.response.dropped` |
| Operation-key lookup | `idempotency.lookup` |

Do not label an event `observed` just because the executable lab generated it.

For example, a FastAPI middleware hook can observe request receipt. It cannot, by itself, prove that the end user's client received every response byte.

Similarly, a client-side connection error can establish that delivery failed from the client's perspective without establishing that the database rolled back.

That is why the shared provenance fields matter.

### Cross-engine parity criterion

Mode A and Mode B do not need identical wall-clock latencies or internal instrumentation events.

They do need to agree on the **causal invariant** for the same scenario:

```text
Scenario:
  Order committed
  Response lost
  Retry uses same valid idempotency key

Invariant:
  Distinct business effects = 1
  Attempt count = 2
  Initial client status = null
  Retry does not initiate a new business operation
```

This is more meaningful than requiring byte-for-byte identical event traces.

---

# 6. Contract generation and testing

## 6.1 Avoid independent TypeScript/Python event definitions drifting apart

For the pilot, the TypeScript trace type can be the schema-authoring source and its generated JSON Schema can be used for transport validation.

For example, add `ts-json-schema-generator` as a development dependency and generate the event schema:

```bash
npx ts-json-schema-generator \
  --path frontend/src/features/journey/contracts/trace-events.ts \
  --type TraceRunResult \
  --out backend/generated/schemas/trace-run-result.schema.json
```

The emitted schema becomes the transport contract for both engines.

The backend can validate a result before publishing it:

```python
import json
from pathlib import Path

from jsonschema import validators


SCHEMA_PATH = Path(
    "backend/generated/schemas/"
    "trace-run-result.schema.json"
)

schema = json.loads(
    SCHEMA_PATH.read_text(encoding="utf-8")
)

Validator = validators.validator_for(schema)
Validator.check_schema(schema)

trace_validator = Validator(schema)


def validate_trace_result(
    result: dict,
) -> None:
    trace_validator.validate(result)
```

Pin the generator version in the project lockfile and verify that its generated schema correctly preserves the TypeScript discriminated event union.

Schema validation alone cannot enforce temporal invariants. Add a separate trace-level invariant validator for sequence continuity, timestamps, response delivery, and committed side-effect accounting.

## 6.2 Required automated test matrix

<text color="secondary" size="sm">These tests should be implemented before the pilot is released to learners.</text>

| Test ID | Input | Required assertion |
|---|---|---|
| W17-001 | S1, healthy request | Exactly one order commit and delivered `201` |
| W17-002 | S1, disconnected before arrival | No commit, no delivered HTTP response |
| W17-003 | S2, missing `item_id` | `422` and no order creation |
| W17-004 | S3, missing credentials | `401` with `WWW-Authenticate` |
| W17-005 | S3, exhausted rate limit | `429` and derived retry delay |
| W17-006 | S4, application exception before deadline | Application-generated `500` |
| W17-007 | S4, invalid upstream response before deadline | Gateway-generated `502` |
| W17-008 | S4, upstream exceeds deadline | Gateway-generated `504` |
| W17-009 | S4, exception scheduled after gateway deadline | `504`, not `500` |
| W17-010 | S5, commit followed by lost response | Commit exists, first client status is `null` |
| W17-011 | S5, retry without protection | Two distinct commits under the modeled policy |
| W17-012 | S5, retry with same key and same parameters | One distinct business effect |
| W17-013 | S5, same key with altered request fingerprint | Conflict; no second effect |
| W17-014 | S6, unrevealed DB logs | No hidden commit evidence in learner-facing payload |
| W17-015 | S7, payment initiation pending | State remains `PENDING` |
| W17-016 | S7, duplicate verified success webhook | Success effect applied once |
| W17-017 | Every Mode A run | Deterministic output for identical input, seed and version |
| W17-018 | Every trace | Valid schema, contiguous sequence and monotonic timestamps |
| W17-019 | Mode B, safe failure injection | No effect outside isolated test environment |
| W17-020 | DSA route regression | Original code-first workspace remains unchanged |

### Example pytest for gateway decision logic

<CodeBlock language="python" editable>
import pytest

from app.simulations.gateway import (
    determine_gateway_outcome,
)


@pytest.mark.parametrize(
    "latency,deadline,mode,expected",
    [
        (100, 30000, "none", 201),
        (100, 30000, "app_exception", 500),
        (100, 30000, "invalid_upstream", 502),
        (35000, 30000, "none", 504),
        (35000, 30000, "app_exception", 504),
    ],
)
def test_gateway_outcome(
    latency,
    deadline,
    mode,
    expected,
):
    result = determine_gateway_outcome(
        upstream_latency_ms=latency,
        gateway_timeout_ms=deadline,
        failure_mode=mode,
    )

    assert result.client_status == expected
```

### Additional integration gates

Run content-schema validation, simulator tests, trace-schema checks and frontend type checking in CI.

Use browser integration tests to verify that a learner can complete the full World 17 journey without manually opening an editor.

Ensure the pilot functions with keyboard navigation, screen readers, reduced-motion preferences, and responsive mobile layouts.

---

# 7. Final architecture corrections before Antigravity merges

There are three changes I would make to the reference implementation before treating it as ApexCaliber's permanent shared architecture.

## 7.1 Make the trace contract platform-wide

The examples above intentionally use World 17 identifiers for clarity. However, the permanent normalized event envelope should not restrict every future event to World 17.

Make these substitutions throughout the contracts:

<CodeBlock language="typescript" editable>
export const TRACE_VERSION = "apex.trace.v1" as const;

// Generic platform-wide identifiers
export type LessonId = string;
export type JourneyStageId = string;

// World 17-specific validation can remain separate
export type World17StageId =
  | "w17-s1" | "w17-s2" | "w17-s3"
  | "w17-s4" | "w17-s5" | "w17-s6"
  | "w17-s7";

// In TraceEventBase:
interface TraceIdentity {
  schemaVersion: typeof TRACE_VERSION;
  lessonId: LessonId;
  stageId: JourneyStageId;
}
</CodeBlock>

Likewise, replace `w17.lesson.v1` with `apex.lesson.v1` in the content schema and YAML. Keep World 17's exact stage identifiers in its authored manifest and lesson-specific tests.

The **event envelope** is reusable across all citadels. The **event payload vocabulary** can expand through versioned, discriminated event families as new simulators are added.

This prevents the first pilot's naming conventions from accidentally becoming a platform-wide limitation.

## 7.2 Correct action-history handling in the React player

Only the multi-action lessons—Stages 5, 6 and 7—need accumulated action history. Running `place_order` twice in Stage 1 should normally represent two independent resets of the demonstration, not automatically replay the first order.

Use:

<CodeBlock language="typescript" editable>
const STATEFUL_STAGES = new Set([
  "w17-s5",
  "w17-s6",
  "w17-s7",
]);

export function buildActionSequence(
  stageId: string,
  previousActions: string[],
  action: string
): string[] {
  if (STATEFUL_STAGES.has(stageId)) {
    return [...previousActions, action];
  }

  return [action];
}
</CodeBlock>

Also make `reset_scenario` a local reducer action instead of submitting an empty action array to the simulation endpoint.

Add `RESET_STAGE` to the reducer, clear that stage's cached trace and action history, then reinitialize the controls from their authored defaults.

## 7.3 Keep business-outcome state separate from HTTP response state

For World 17's payment and retry stages, maintain two independent state dimensions:

```typescript
type ClientHttpOutcome =
  | { kind: "response"; status: number }
  | { kind: "network_failure" }
  | { kind: "pending" };

type BusinessOutcome =
  | "NOT_STARTED"
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "UNKNOWN";
```

Examples:

| Client observation | Business outcome | Meaning |
|---|---|---|
| `201` | `SUCCEEDED` | Created and confirmed within the modeled operation |
| `202` | `PENDING` | Accepted for further processing |
| `504` | `UNKNOWN` | Upstream outcome unresolved from the client's evidence |
| Network failure | `SUCCEEDED` | Backend committed; client did not observe confirmation |
| Network failure | `UNKNOWN` | Insufficient evidence to determine result |

The trace engine may know the simulated ground truth. The learner-facing interface should reveal only the evidence appropriate to the current teaching stage.

---

# 8. Antigravity implementation handoff

<box border radius="xl" padding={3} gap={3}>
  <title size="lg">World 17 — First production milestone</title>
  <text color="secondary" size="sm">Recommended development sequence</text>
  <list marker="number" gap={2}>
    <list-item>Implement the generic `apex.trace.v1` contract and its JSON Schema validation.</list-item>
    <list-item>Implement `content_schema.py` and author the seven-stage World 17 YAML manifest.</list-item>
    <list-item>Build the deterministic event-emission utility and complete the Stage 4 gateway-failure simulator first.</list-item>
    <list-item>Connect `JourneyPlayer`, `StageStepper`, the prediction modal and the HTTP sequence visualizer.</list-item>
    <list-item>Implement Stage 5's persistent logical-operation and retry simulation.</list-item>
    <list-item>Complete the remaining stages using the same simulator registry and event contract.</list-item>
    <list-item>Integrate the isolated executable laboratory and normalize its observed events.</list-item>
    <list-item>Run the contract, causal-invariant, security and DSA regression tests before enabling World 17 for learners.</list-item>
  </list>
</box>

### Acceptance standard

World 17 is production-ready when a learner can open the lesson without seeing an empty code editor, progress through all seven stages, predict outcomes, manipulate the HTTP system, inspect replayable events, explain the source of failures, diagnose an uncertain order and complete the payment-transfer challenge.

Meanwhile, DSA routing and execution must remain unaffected, both simulation modes must comply with the same validated event contract, and no real payment or external production service may be affected by learner experiments.

**The most important implementation principle for Antigravity:** the HTTP simulator owns the mechanics, the normalized trace owns the observable evidence, the content YAML owns the teaching journey, and React owns only the presentation and learner interaction.

Keeping those responsibilities separate is what will let ApexCaliber extend this engine to Redis, deadlocks, DNS, TCP, virtual memory and GenAI without rebuilding the frontend for every new concept.