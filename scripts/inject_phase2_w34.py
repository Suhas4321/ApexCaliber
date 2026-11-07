import yaml
from pathlib import Path
from app.content_schema import QuestionContent

def inject_w34_rate_limiter():
    path = Path('content/questions/20-backend-fastapi/redis-sliding-window-rate-limiter.yaml')
    data = yaml.safe_load(path.read_text())

    journey = [
        {
            'id': 'w34_s1_cascading_failures',
            'title': 'The Cascading Failure Problem & Ingress Protection',
            'subtitle': 'Why uncontrolled traffic floods take down entire microservice clusters',
            'scenario': 'A single misconfigured microservice or malicious scraper starts sending 5,000 requests per second to an expensive AI report generation endpoint.',
            'mechanism': 'Without rate limiting at the ingress layer (Nginx, Envoy, or Redis gateway), backend worker threads saturate, relational database connection pools exhaust, and timeouts cascade across all customer-facing endpoints.',
            'prediction': {
                'prompt': 'Where should rate limiting be enforced to protect a distributed microservice cluster with minimal server compute cost?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'At the reverse proxy or API gateway layer before requests ever reach heavy backend application workers.',
                        'explanation': 'Correct! Dropping excessive traffic at the edge prevents worker starvation and preserves database connection pools.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Inside database trigger functions executed during record insertion.',
                        'explanation': 'Misconception! Enforcing rate limits at the DB level exhausts DB connections and worsens cascading failures.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Inside the client-side JavaScript single page application bundle.',
                        'explanation': 'Catastrophic misconception! Client-side checks are easily bypassed by bots and curl scripts.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Edge rate limiting is the first line of defense protecting core database and compute infrastructure.',
            },
            'controls': [
                {
                    'id': 'inbound_rps',
                    'label': 'Client Inbound Traffic (req/sec)',
                    'type': 'slider',
                    'default': 300,
                    'min': 50,
                    'max': 2000,
                    'step': 50,
                    'description': 'Simulate incoming request surge against gateway capacity',
                },
                {
                    'id': 'rate_limiting_active',
                    'label': 'API Gateway Rate Limiter Enabled',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Toggle active edge rate limiting filter',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Ingress Rate Limiting & Backpressure'},
        },
        {
            'id': 'w34_s2_fixed_window_vulnerability',
            'title': 'The Fixed-Window Vulnerability & The 2x Boundary Spike',
            'subtitle': 'Why naive INCR + EXPIRE counters allow double-burst attacks',
            'scenario': 'An API imposes a limit of 100 requests per minute using standard fixed windows. An attacker sends 100 requests at 12:00:59 and 100 requests at 12:01:00.',
            'mechanism': 'Fixed windows reset at predetermined boundaries (e.g. the top of the minute). Because the counter resets to zero at 12:01:00, the client successfully passes 200 requests within a 2-second window, completely overwhelming downstream servers with a 2x traffic spike.',
            'prediction': {
                'prompt': 'If an API allows 100 requests/minute using a fixed-window counter, what is the maximum number of requests a client can successfully execute within a 2-second window across a boundary?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': '200 requests (100 at :59 of window 1 + 100 at :01 of window 2).',
                        'explanation': 'Correct! Fixed-window counters completely fail to regulate sliding rolling windows.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Exactly 100 requests, because the algorithm enforces spacing between calls.',
                        'explanation': 'Misconception! Fixed window algorithms have no concept of packet spacing.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': '50 requests due to automatic window throttling.',
                        'explanation': 'Incorrect! The counter resets to 0 instantly upon window expiration.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Fixed-window boundary spikes are why production platforms like Stripe and GitHub use rolling sliding window limiters.',
            },
            'controls': [
                {
                    'id': 'burst_second_offset',
                    'label': 'Burst Second Offset',
                    'type': 'slider',
                    'default': 58,
                    'min': 0,
                    'max': 59,
                    'step': 1,
                    'description': 'Simulate sending requests right before window boundary reset (:59 vs :01)',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Fixed Window Boundary Spike Simulation'},
        },
        {
            'id': 'w34_s3_sliding_window_log',
            'title': 'The Sliding Window Log Algorithm (Redis Sorted Sets)',
            'subtitle': 'Using timestamps as scores to guarantee true rolling rate limits',
            'scenario': 'How can we guarantee that over ANY continuous 60-second window, a client never exceeds 100 requests?',
            'mechanism': 'The Sliding Window Log stores every accepted request timestamp in a Redis Sorted Set (ZSET). When a request arrives at timestamp T: 1. Prune expired logs: ZREMRANGEBYSCORE key 0 (T - 60). 2. Count active entries: ZCARD key. 3. If count < limit, ZADD current timestamp and allow (HTTP 200). 4. If count >= limit, reject with HTTP 429 and compute Retry-After.',
            'prediction': {
                'prompt': 'What is the primary operational trade-off of the Sliding Window Log algorithm compared to Fixed Window counters?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'High memory consumption, because every single request timestamp must be stored in RAM for the full window duration.',
                        'explanation': 'Correct! Storing millions of timestamp members in ZSETs consumes substantial Redis memory.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Inability to compute remaining request headers.',
                        'explanation': 'Incorrect! ZCARD provides exact remaining capacity effortlessly.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'It only works for single-tenant local servers.',
                        'explanation': 'Incorrect! Keyed Redis ZSETs naturally partition per tenant IP.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Sliding Window Log offers 100% precision at the cost of O(N) memory consumption.',
            },
            'controls': [
                {
                    'id': 'window_size_seconds',
                    'label': 'Rolling Window Duration (sec)',
                    'type': 'slider',
                    'default': 60,
                    'min': 10,
                    'max': 120,
                    'step': 10,
                    'description': 'Sliding window duration for eviction evaluation',
                },
                {
                    'id': 'max_requests_allowed',
                    'label': 'Max Allowed Requests per Window',
                    'type': 'slider',
                    'default': 5,
                    'min': 2,
                    'max': 20,
                    'step': 1,
                    'description': 'Capacity limit enforced across rolling window',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Redis ZSET Sliding Window Log'},
        },
        {
            'id': 'w34_s4_memory_vs_precision',
            'title': 'Memory vs Precision: Sliding Log vs Token Bucket',
            'subtitle': 'O(N) memory logs vs O(1) memory token buckets',
            'scenario': 'At 10 million daily active users, storing every timestamp in Redis requires tens of gigabytes of RAM. How can we achieve smooth rate limiting in O(1) memory?',
            'mechanism': 'The Token Bucket stores only two numbers: tokens_available (float) and last_refill_timestamp. When a request arrives, tokens refill based on elapsed time: tokens += elapsed * refill_rate. If tokens >= 1, decrement tokens and allow. Memory is strictly O(1) per user.',
            'prediction': {
                'prompt': 'Which rate limiting algorithm consumes strictly O(1) memory per user while supporting temporary bursts of up to bucket capacity?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Token Bucket (stores only available token count and last refill timestamp).',
                        'explanation': 'Correct! Token buckets decouple memory usage from request volume.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Sliding Window Log (stores every timestamp in a list).',
                        'explanation': 'Incorrect! Sliding Window Log scales linearly with request volume (O(N)).',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Round-robin DNS balancing.',
                        'explanation': 'Incorrect! DNS is a routing mechanism, not a rate limiter.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Token Bucket is the standard algorithm chosen by AWS API Gateway and Stripe for scalable O(1) rate limiting.',
            },
            'controls': [
                {
                    'id': 'bucket_capacity',
                    'label': 'Token Bucket Burst Capacity',
                    'type': 'slider',
                    'default': 10,
                    'min': 2,
                    'max': 50,
                    'step': 2,
                    'description': 'Maximum burst tokens allowed before continuous refill kicks in',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Token Bucket vs Sliding Log'},
        },
        {
            'id': 'w34_s5_distributed_lua',
            'title': 'Distributed Concurrency & Atomic Redis Lua Scripts',
            'subtitle': 'Eliminating race conditions when multiple app servers query Redis simultaneously',
            'scenario': 'In a horizontally scaled backend with 10 FastAPI containers, two requests from the same user hit Server A and Server B at the exact same millisecond.',
            'mechanism': 'If Server A calls ZCARD (gets 4) and Server B calls ZCARD (gets 4), both servers think limit 5 is satisfied and both insert, allowing 6 requests. To guarantee atomic execution, the entire ZREMRANGEBYSCORE + ZCARD + ZADD sequence is executed inside an atomic Redis Lua script.',
            'prediction': {
                'prompt': 'Why must distributed rate limiting operations in Redis be executed inside an atomic Lua script?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Redis executes Lua scripts atomically in a single thread, preventing race conditions where multiple server replicas interleave read and write commands.',
                        'explanation': 'Correct! Lua scripts provide atomic isolation without distributed lock overhead.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Lua scripts compile into C code that runs directly on the network card.',
                        'explanation': 'Incorrect! Lua runs inside the Redis engine interpreter.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'FastAPI cannot send commands to Redis without Lua.',
                        'explanation': 'Incorrect! Standard Redis commands work over plain sockets.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Atomic Lua scripts guarantee strict thread-safety across distributed microservices without distributed lock contention.',
            },
            'controls': [
                {
                    'id': 'atomic_lua_enabled',
                    'label': 'Atomic Redis Lua Scripting Enabled',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Execute rate check and eviction in single atomic transaction',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Atomic Lua Script Execution'},
        },
        {
            'id': 'w34_s6_transfer_challenge',
            'title': 'Transfer Challenge: Production Sliding Window Limiter with Retry-After',
            'subtitle': 'Implement the sliding window log with precise HTTP 429 Retry-After calculations',
            'scenario': 'Build the accurate rolling rate limiter in Python: maintain in-memory sliding logs per IP, evict expired timestamps, compute remaining capacity, and calculate exact seconds until the oldest active timestamp expires for Retry-After.',
            'mechanism': 'The limiter evaluates each chronological request: evict timestamps <= T - window; if len < max, accept; else compute retry_after = (oldest + window) - T and reject with 429.',
            'prediction': {
                'prompt': 'When a client with limit 2/60s makes requests at T=10, T=20, and T=30, what status code and retry_after are returned for the third request?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Status 429 with retry_after = 40 (oldest request at 10 expires at 70; 70 - 30 = 40s).',
                        'explanation': 'Correct! The client must wait until the oldest timestamp slips out of the rolling 60s window.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Status 200 with remaining = 0.',
                        'explanation': 'Incorrect! 2 requests are already active in the window; the limit is 2.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Status 500 Internal Server Error.',
                        'explanation': 'Incorrect! Rate limiting is a client 429 condition, not a server crash.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Accurate Retry-After calculation is what allows automated client SDKs to back off deterministically without spamming origin servers.',
            },
            'controls': [
                {
                    'id': 'test_request_batch',
                    'label': 'Test Request Batch Index',
                    'type': 'slider',
                    'default': 1,
                    'min': 1,
                    'max': 4,
                    'step': 1,
                    'description': 'Select test vector to evaluate rate limiter compliance',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Sliding Window Limiter Verification'},
            'lab_starter_code': '''class Solution:
    def check_rate_limit(self, requests: list[dict], window_seconds: int, max_requests: int) -> list[dict]:
        # Implement Redis Sliding Window Limiter with Retry-After
        pass
''',
            'lab_solution': '''class Solution:
    def check_rate_limit(self, requests: list[dict], window_seconds: int, max_requests: int) -> list[dict]:
        logs: dict[str, list[int]] = {}
        results = []

        for req in requests:
            ip = req["ip"]
            ts = req["timestamp"]

            if ip not in logs:
                logs[ip] = []

            # Evict timestamps older than ts - window_seconds
            logs[ip] = [t for t in logs[ip] if t > ts - window_seconds]

            if len(logs[ip]) < max_requests:
                logs[ip].append(ts)
                results.append({
                    "ip": ip,
                    "allowed": True,
                    "status_code": 200,
                    "remaining": max_requests - len(logs[ip]),
                })
            else:
                oldest = logs[ip][0]
                retry_after = (oldest + window_seconds) - ts
                results.append({
                    "ip": ip,
                    "allowed": False,
                    "status_code": 429,
                    "retry_after": retry_after,
                })

        return results
''',
        },
    ]

    data['journey'] = journey
    validated = QuestionContent.model_validate(data)
    with open(path, 'w') as f:
        yaml.dump(data, f, sort_keys=False, allow_unicode=True)
    print(f"World 34 validated and saved! ({len(validated.journey)} stages)")

inject_w34_rate_limiter()
