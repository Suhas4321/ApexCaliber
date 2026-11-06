import yaml
from pathlib import Path
from app.content_schema import QuestionContent

yaml_path = Path('content/questions/20-backend-fastapi/http-status-code-diagnostics.yaml')
data = yaml.safe_load(yaml_path.read_text())

journey = [
    {
        'id': 'w17_s1_why_http',
        'title': 'Why Does HTTP Exist?',
        'subtitle': 'Contrast raw TCP streams with application protocol framing',
        'scenario': 'In 1989, networks could deliver bytes across TCP streams, but servers had no uniform way to know where one file ended, what format it was in, or if authentication was required.',
        'mechanism': 'TCP is a continuous byte stream with zero message boundaries. Two send() calls can arrive as one recv(). HTTP introduces text-based framing: Method + Path + Version, CRLF-delimited headers, and explicit Content-Length or Chunked Transfer encoding.',
        'prediction': {
            'prompt': 'If a client sends two back-to-back JSON payloads over an open TCP connection without HTTP headers or length prefixes, what happens on the server?',
            'choices': [
                {
                    'id': 'opt_a',
                    'label': 'TCP packet fragmentation concatenates the payloads into an unparseable stream, causing JSONDecodeError.',
                    'explanation': 'Correct! TCP provides stream delivery, not message framing.',
                    'is_correct': True,
                },
                {
                    'id': 'opt_b',
                    'label': 'The TCP socket automatically splits each payload into a separate isolated string.',
                    'explanation': 'Misconception! TCP has no concept of application boundaries.',
                    'is_correct': False,
                },
                {
                    'id': 'opt_c',
                    'label': 'The operating system drops the second payload as duplicate traffic.',
                    'explanation': 'Incorrect! The OS delivers all valid TCP sequence bytes in order.',
                    'is_correct': False,
                },
            ],
            'revealed_explanation': 'TCP provides ordered byte delivery, NOT message framing. HTTP headers tell the parser where one request ends and the next begins.',
        },
        'controls': [
            {
                'id': 'payload_size_bytes',
                'label': 'Payload Size (Bytes)',
                'type': 'slider',
                'default': 256,
                'min': 64,
                'max': 4096,
                'step': 64,
                'description': 'Adjust inbound payload size to inspect packet fragmentation',
            },
            {
                'id': 'use_http_framing',
                'label': 'Enable HTTP Length Framing',
                'type': 'toggle',
                'default': True,
                'description': 'Include Content-Length header to prevent stream coalescing',
            },
        ],
        'visualizer_type': 'http_lifecycle',
        'visualizer_config': {'title': 'HTTP Stream Framing Inspector'},
    },
    {
        'id': 'w17_s2_request_anatomy',
        'title': 'The Anatomy of an HTTP Request',
        'subtitle': 'Headers, methods, query strings, and body boundaries',
        'scenario': 'A client submits a payment via POST /v1/charges. If the network proxy drops the Content-Length header, how does the upstream server know when to stop reading from the socket?',
        'mechanism': 'The HTTP Request Line (METHOD /path HTTP/1.1) defines the action. Headers provide critical metadata: Host (for virtual hosting), Content-Type (MIME parsing), and Content-Length or Transfer-Encoding: chunked (payload boundary).',
        'prediction': {
            'prompt': 'Why is the Host header mandatory in HTTP/1.1 even though the client already resolved the server IP via DNS?',
            'choices': [
                {
                    'id': 'opt_a',
                    'label': 'Modern cloud servers host thousands of domains on a single IP address (Virtual Hosting); the server uses Host to route to the correct tenant.',
                    'explanation': 'Correct! Virtual hosting depends completely on the HTTP Host header.',
                    'is_correct': True,
                },
                {
                    'id': 'opt_b',
                    'label': 'The Host header is used by BGP routers to calculate physical geographical routing.',
                    'explanation': 'Misconception! BGP operates at Layer 3 (IP), not Layer 7 (HTTP).',
                    'is_correct': False,
                },
                {
                    'id': 'opt_c',
                    'label': 'It is an obsolete legacy field that modern reverse proxies ignore.',
                    'explanation': 'Incorrect! Nginx, Envoy, and Cloudflare reject requests lacking the Host header with HTTP 400.',
                    'is_correct': False,
                },
            ],
            'revealed_explanation': 'Without the Host header, a cloud reverse proxy hosting multiple applications on one IP address cannot route inbound sockets.',
        },
        'controls': [
            {
                'id': 'include_host_header',
                'label': 'Include Host Header',
                'type': 'toggle',
                'default': True,
                'description': 'Toggle mandatory HTTP/1.1 Host header',
            },
        ],
        'visualizer_type': 'http_lifecycle',
        'visualizer_config': {'title': 'Request Line & Header Inspector'},
    },
    {
        'id': 'w17_s3_response_semantics',
        'title': 'HTTP Response Semantics & Status Codes',
        'subtitle': 'The 5 categorical families: 1xx, 2xx, 3xx, 4xx, and 5xx',
        'scenario': 'Your frontend makes an API call. An error returns. Should your frontend automated retry loop trigger, or should the app halt and show a validation prompt?',
        'mechanism': 'Status codes dictate client contract behavior: 2xx (Success), 3xx (Redirection), 4xx (Client fault: bad credentials, schema violation, invalid resource), and 5xx (Server/Gateway failure).',
        'prediction': {
            'prompt': 'If an API client receives HTTP 403 Forbidden, should an automated exponential backoff retry be scheduled?',
            'choices': [
                {
                    'id': 'opt_a',
                    'label': 'No. 403 means the server understood credentials but refuses permission; retrying the exact same request will always fail.',
                    'explanation': 'Correct! 4xx errors represent client bugs or authorization deficits.',
                    'is_correct': True,
                },
                {
                    'id': 'opt_b',
                    'label': 'Yes. 403 is a transient network hiccup that clears after 500ms.',
                    'explanation': 'Misconception! 403 is non-transient. Retrying wastes server compute.',
                    'is_correct': False,
                },
                {
                    'id': 'opt_c',
                    'label': 'Yes, but only if the user is authenticated as an administrator.',
                    'explanation': 'Incorrect! The server already evaluated permissions and returned Forbidden.',
                    'is_correct': False,
                },
            ],
            'revealed_explanation': '4xx codes mean the client must change the request. Only 429 (rate-limited) or transient 5xx codes should ever trigger automated client retries.',
        },
        'controls': [
            {
                'id': 'status_code_selected',
                'label': 'Inspect Status Code',
                'type': 'slider',
                'default': 403,
                'min': 200,
                'max': 504,
                'step': 1,
                'description': 'Select HTTP response code to evaluate client retry semantics',
            },
        ],
        'visualizer_type': 'http_lifecycle',
        'visualizer_config': {'title': 'RFC 9110 Status Code Matrix'},
    },
    {
        'id': 'w17_s4_failure_isolation',
        'title': 'Where Did the Request Fail? (4xx vs 502 vs 504)',
        'subtitle': 'Isolate client bugs from proxy crashes and worker pool starvation',
        'scenario': 'High-traffic flash sale. A customer clicks Checkout. After 60 seconds of spinning, Nginx returns 504 Gateway Timeout. Did the payment execute?',
        'mechanism': 'Requests pass through Client -> Ingress Gateway (Nginx/Envoy) -> App Worker -> Database. A 502 Bad Gateway means the upstream worker crashed or refused socket connection. A 504 Gateway Timeout means the upstream worker took longer than the reverse proxy timeout.',
        'prediction': {
            'prompt': 'When Nginx returns HTTP 504 Gateway Timeout, does that guarantee the database transaction did not execute?',
            'choices': [
                {
                    'id': 'opt_a',
                    'label': 'No! The backend worker might have committed the database transaction, but the HTTP response failed to reach Nginx before the timeout window.',
                    'explanation': 'Correct! This is the fundamental uncertainty of distributed systems.',
                    'is_correct': True,
                },
                {
                    'id': 'opt_b',
                    'label': 'Yes, 504 guarantees the database transaction automatically rolled back.',
                    'explanation': 'Misconception! Nginx has no control over the database transaction lifecycle.',
                    'is_correct': False,
                },
                {
                    'id': 'opt_c',
                    'label': 'Yes, 504 occurs before any packets leave Nginx towards the app worker.',
                    'explanation': 'Incorrect! Nginx sent the request and waited until proxy_read_timeout expired.',
                    'is_correct': False,
                },
            ],
            'revealed_explanation': 'A 504 timeout only means the proxy stopped waiting; the downstream database may have successfully charged the card!',
        },
        'controls': [
            {
                'id': 'proxy_timeout_ms',
                'label': 'Proxy Timeout (ms)',
                'type': 'slider',
                'default': 500,
                'min': 100,
                'max': 2000,
                'step': 50,
                'description': 'Adjust reverse proxy read timeout limit',
            },
            {
                'id': 'app_processing_ms',
                'label': 'App Worker Latency (ms)',
                'type': 'slider',
                'default': 800,
                'min': 50,
                'max': 2500,
                'step': 50,
                'description': 'Simulate database query or worker delay',
            },
        ],
        'visualizer_type': 'http_lifecycle',
        'visualizer_config': {'title': 'Distributed Gateway & Timeout Inspector'},
    },
    {
        'id': 'w17_s5_double_billing_idempotency',
        'title': 'Retry Uncertainty & The Double-Billing Trap',
        'subtitle': 'Safe vs unsafe HTTP methods and Idempotency-Key headers',
        'scenario': 'A mobile app submits a $100 payment via POST. The WiFi drops before receiving the response. The app retries. The customer is billed $200.',
        'mechanism': 'RFC 9110 defines GET, PUT, and DELETE as idempotent (f(f(x)) = f(x)). POST is explicitly non-idempotent. To make POST retryable without duplicate mutations, APIs require an Idempotency-Key: <UUID> header stored in Redis with an atomic lock.',
        'prediction': {
            'prompt': 'Why is DELETE /users/42 considered idempotent even if the second call returns HTTP 404 Not Found?',
            'choices': [
                {
                    'id': 'opt_a',
                    'label': 'Because the end state of the server (user 42 does not exist) is identical whether called once or ten times.',
                    'explanation': 'Correct! Idempotence refers to server side-effects, not identical status codes.',
                    'is_correct': True,
                },
                {
                    'id': 'opt_b',
                    'label': 'Because DELETE always returns 200 OK by RFC standard.',
                    'explanation': 'Misconception! Returning 404 on subsequent DELETE calls is valid RFC behavior.',
                    'is_correct': False,
                },
                {
                    'id': 'opt_c',
                    'label': 'DELETE is not idempotent; only GET is idempotent.',
                    'explanation': 'Incorrect! GET, HEAD, PUT, and DELETE are all idempotent.',
                    'is_correct': False,
                },
            ],
            'revealed_explanation': 'Idempotence means multiple identical requests have the same side-effect as a single request.',
        },
        'controls': [
            {
                'id': 'idempotency_key_active',
                'label': 'Idempotency Key Active',
                'type': 'toggle',
                'default': True,
                'description': 'Pass unique UUID in Idempotency-Key header',
            },
        ],
        'visualizer_type': 'http_lifecycle',
        'visualizer_config': {'title': 'Idempotency & Deduplication Engine'},
    },
    {
        'id': 'w17_s6_observability_incident',
        'title': 'Incident Diagnosis Through Partial Observability',
        'subtitle': 'Triaging production alerts using status code distributions and correlation IDs',
        'scenario': 'Payment API error rate spikes to 18%. Ingress logs reveal 90% of the failures are HTTP 429 and 10% are HTTP 500.',
        'mechanism': 'Structured access logs correlate requests via X-Request-ID. A spike in 429 indicates rate-limit exhaustion from a rogue client or bot, while 500 indicates unhandled exceptions.',
        'prediction': {
            'prompt': 'When a client receives HTTP 429 Too Many Requests, which standard header tells the client how long to back off?',
            'choices': [
                {
                    'id': 'opt_a',
                    'label': 'Retry-After (specifies seconds or an HTTP-date to wait before next attempt).',
                    'explanation': 'Correct! Standardized in RFC 6585 and RFC 9110.',
                    'is_correct': True,
                },
                {
                    'id': 'opt_b',
                    'label': 'X-RateLimit-Reset-Epoch.',
                    'explanation': 'Non-standard vendor header. RFC standard is Retry-After.',
                    'is_correct': False,
                },
                {
                    'id': 'opt_c',
                    'label': 'Cache-Control: max-age=0.',
                    'explanation': 'Incorrect! Cache-Control governs response caching, not rate limits.',
                    'is_correct': False,
                },
            ],
            'revealed_explanation': 'The Retry-After header provides coordinated backpressure between servers and client SDKs.',
        },
        'controls': [
            {
                'id': 'client_rps',
                'label': 'Client Request Rate (req/sec)',
                'type': 'slider',
                'default': 350,
                'min': 50,
                'max': 1000,
                'step': 25,
                'description': 'Simulate incoming client request volume against token bucket',
            },
        ],
        'visualizer_type': 'http_lifecycle',
        'visualizer_config': {'title': 'Observability & Rate Limiting Timeline'},
    },
    {
        'id': 'w17_s7_transfer_challenge',
        'title': 'Transfer Challenge: HTTP Error & Retry Classifier',
        'subtitle': 'Implement production-grade HTTP error and retry classification in Python',
        'scenario': 'Build the production HTTP status classifier that bridges client network exceptions with exact RFC status codes and retry flags.',
        'mechanism': 'The classifier maps scenario parameters: transient socket drop / timeout -> 504 / 502 with retryable=True; auth permission failure -> 401/403 with retryable=False.',
        'prediction': {
            'prompt': 'Which error classification guarantees zero duplicate payments while ensuring transient network drops recover automatically?',
            'choices': [
                {
                    'id': 'opt_a',
                    'label': 'Mark 429, 502, and 504 as retryable (with Idempotency-Key), while marking 400, 401, 403, and 422 as non-retryable.',
                    'explanation': 'Correct! This exact logic powers production payment SDKs.',
                    'is_correct': True,
                },
                {
                    'id': 'opt_b',
                    'label': 'Mark all 4xx and 5xx errors as retryable with immediate retry.',
                    'explanation': 'Catastrophic misconception! Retrying 4xx errors creates thundering herd crashes.',
                    'is_correct': False,
                },
                {
                    'id': 'opt_c',
                    'label': 'Never retry any request over HTTP.',
                    'explanation': 'Incorrect! Transient network drops require automated retries.',
                    'is_correct': False,
                },
            ],
            'revealed_explanation': 'Distinguishing transient transport errors from deterministic client bugs is the cornerstone of distributed system resilience.',
        },
        'controls': [
            {
                'id': 'test_scenario_id',
                'label': 'Test Scenario',
                'type': 'slider',
                'default': 1,
                'min': 1,
                'max': 5,
                'step': 1,
                'description': 'Select scenario index to run through your classifier',
            },
        ],
        'visualizer_type': 'http_lifecycle',
        'visualizer_config': {'title': 'Production Diagnostic Runner'},
        'lab_starter_code': '''class Solution:
    def classify_http_error(self, scenario: dict) -> dict:
        # Implement RFC 9110 status code classifier
        pass
''',
        'lab_solution': '''class Solution:
    def classify_http_error(self, scenario: dict) -> dict:
        if scenario.get("rate_limit_exceeded"):
            return {"status_code": 429, "reason": "Too Many Requests", "retryable": True}
        if scenario.get("upstream_timeout"):
            return {"status_code": 504, "reason": "Gateway Timeout", "retryable": True}
        if scenario.get("downstream_offline"):
            return {"status_code": 502, "reason": "Bad Gateway", "retryable": True}
        if scenario.get("validation_errors"):
            return {"status_code": 422, "reason": "Unprocessable Entity", "retryable": False}
        err_type = scenario.get("error_type")
        if err_type == "auth":
            if not scenario.get("authenticated", False):
                return {"status_code": 401, "reason": "Unauthorized", "retryable": False}
            if not scenario.get("has_role", False):
                return {"status_code": 403, "reason": "Forbidden", "retryable": False}
        if err_type == "conflict":
            return {"status_code": 409, "reason": "Conflict", "retryable": False}
        if err_type == "not_found":
            return {"status_code": 404, "reason": "Not Found", "retryable": False}
        return {"status_code": 500, "reason": "Internal Server Error", "retryable": False}
''',
    },
]

data['journey'] = journey

# Validate against QuestionContent schema
validated = QuestionContent.model_validate(data)
print(f"Validated OK! Journey stages: {len(validated.journey)}")

with open(yaml_path, 'w') as f:
    yaml.dump(data, f, sort_keys=False, allow_unicode=True)

print("Saved updated YAML successfully!")
