import yaml
from pathlib import Path
from app.content_schema import QuestionContent

def inject_w13_generators():
    path = Path('content/questions/13-python-internals/generators-memory-streaming.yaml')
    data = yaml.safe_load(path.read_text())

    journey = [
        {
            'id': 'w13_s1_pyobject_overhead',
            'title': 'PyObject Overhead & Why Python Consumes More RAM Than C',
            'subtitle': 'The 28-byte integer structure and pointer indirection overhead',
            'scenario': 'In C, an array of 1,000,000 64-bit integers takes exactly 8MB of RAM (10^6 * 8 bytes). In Python, a list of 1,000,000 integers takes over 36MB. Why?',
            'mechanism': 'Every integer in CPython is a full PyLongObject structure containing ob_refcnt (8 bytes), ob_type pointer (8 bytes), ob_size (8 bytes), and a digit array (4+ bytes), totaling 28 bytes per int! The PyListObject is an array of 8-byte pointers pointing to these distinct heap allocations. Thus, eager collections suffer a massive memory amplification factor.',
            'prediction': {
                'prompt': 'How much heap memory does Python allocate for a list of 1,000,000 integers compared to a contiguous C array?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Around 4x to 5x more memory (~36MB to 40MB vs 8MB) due to 28-byte PyObject headers and 8-byte pointer indirection for every single number.',
                        'explanation': 'Correct! Python objects carry reference counts, type metadata, and pointer references that multiply memory consumption.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Exactly the same (8MB) because all modern compilers optimize memory identically.',
                        'explanation': 'Misconception! Python is dynamically typed; each object requires runtime type metadata and reference counting headers.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Less memory (4MB) because Python automatically compresses lists.',
                        'explanation': 'Incorrect! Standard Python lists do not compress data; they store arrays of pointers to heap objects.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'PyObject memory overhead explains why materializing millions of items into standard Python lists rapidly exhausts system RAM.',
            },
            'controls': [
                {
                    'id': 'element_count',
                    'label': 'Element Count',
                    'type': 'slider',
                    'default': 1000000,
                    'min': 100000,
                    'max': 5000000,
                    'step': 100000,
                    'description': 'Simulated number of integers stored',
                },
                {
                    'id': 'data_structure',
                    'label': 'Data Structure',
                    'type': 'select',
                    'default': 'Python List of Ints',
                    'options': ['Python List of Ints', 'NumPy Contiguous C Array', 'Python Generator'],
                    'description': 'Storage representation in physical memory',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'PyLongObject Memory Layout vs Contiguous C Buffer'},
        },
        {
            'id': 'w13_s2_eager_materialization_danger',
            'title': 'Eager Materialization: The Danger of readlines() and Lists',
            'subtitle': 'How loading 10GB log files triggers the Linux kernel OOM killer',
            'scenario': 'You need to filter 5xx errors from a 10GB access log file on a server with 2GB of physical RAM. You run: errors = [line for line in open("log.txt").readlines() if "500" in line]. What happens?',
            'mechanism': 'file.readlines() reads the entire 10GB file from disk into RAM at once, allocating thousands of string PyObject instances. Then the list comprehension creates a second list in memory. Because total memory demand exceeds physical RAM and swap space, the Linux kernel OOM killer terminates the process immediately with signal 9.',
            'prediction': {
                'prompt': 'What happens when an engineer calls .readlines() on a 10GB file on an 8GB RAM production machine?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'The operating system runs out of physical memory and swap, triggering an Out-Of-Memory (OOM) kill that terminates the process with signal 9.',
                        'explanation': 'Correct! readlines() attempts to eagerly buffer the entire file in RAM, triggering an immediate kernel OOM kill.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Python automatically pauses the code and downloads more RAM from the cloud.',
                        'explanation': 'Nonsense! The operating system enforces hard memory limits.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Python writes the overflow lines to CPU cache without performance loss.',
                        'explanation': 'Incorrect! CPU cache is tiny (a few megabytes) and cannot hold gigabytes of data.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Eager materialization scales memory as O(N). Production data pipelines must never buffer unbounded datasets into memory lists.',
            },
            'controls': [
                {
                    'id': 'file_size_gb',
                    'label': 'Log File Size (GB)',
                    'type': 'slider',
                    'default': 10,
                    'min': 1,
                    'max': 30,
                    'step': 1,
                    'description': 'Size of log file on disk',
                },
                {
                    'id': 'server_ram_gb',
                    'label': 'Available System RAM (GB)',
                    'type': 'slider',
                    'default': 8,
                    'min': 2,
                    'max': 16,
                    'step': 2,
                    'description': 'Physical hardware memory allocation',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Heap Allocation Surge vs Linux OOM Killer Threshold'},
        },
        {
            'id': 'w13_s3_generator_yield_state_machine',
            'title': 'The Generator Function & yield Stack Suspension',
            'subtitle': 'How CPython preserves execution frames for O(1) memory iteration',
            'scenario': 'When Python encounters a function containing the yield keyword, how does it differ from a standard function returning a list?',
            'mechanism': 'Calling a generator function does not execute the body immediately; it returns a generator object. When next() is called, the CPython interpreter executes bytecode until it hits yield. It captures the current value, saves the frame\'s execution state (instruction pointer, local variables), and yields control back to the caller. On the next call, it resumes exactly where it stopped. Memory consumption remains strictly O(1).',
            'prediction': {
                'prompt': 'When a Python function containing the yield keyword is invoked as gen = my_func(), what happens?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'The function does not run immediately; it returns a suspended generator object without executing any loop iterations or allocating collections.',
                        'explanation': 'Correct! Generator functions return a suspended iterator object immediately; execution begins only when next() is called.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The entire function executes from start to end and returns a completed list.',
                        'explanation': 'Misconception! If it executed eagerly, it would behave like a regular function, defeating the purpose of yield.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Python creates a background thread that executes the loop asynchronously.',
                        'explanation': 'Incorrect! Generators are single-threaded coroutine state machines, not background threads.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Generators turn function execution into an on-demand state machine, enabling infinite or massive sequences to be consumed with zero memory buildup.',
            },
            'controls': [
                {
                    'id': 'step_execution',
                    'label': 'Step Next (yield)',
                    'type': 'button',
                    'default': True,
                    'description': 'Advance generator to next yield point',
                },
                {
                    'id': 'frame_inspection',
                    'label': 'Inspect Frame State',
                    'type': 'select',
                    'default': 'Instruction Pointer',
                    'options': ['Instruction Pointer', 'Local Variables', 'Heap Footprint'],
                    'description': 'Examine CPython frame state machine',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'CPython Frame State Machine & yield Suspension'},
        },
        {
            'id': 'w13_s4_chained_generator_pipelines',
            'title': 'Chained Generator Pipelines (Filter -> Transform -> Sink)',
            'subtitle': 'Processing petabyte-scale data streams with constant working memory',
            'scenario': 'How can we build an end-to-end log processing pipeline that reads a 100GB log file, extracts 5xx errors, parses JSON, and computes average latency in 50MB of RAM?',
            'mechanism': 'Chain multiple generator expressions: raw_lines = (line for line in open("log.txt")), error_lines = (l for l in raw_lines if " 500 " in l), parsed = (parse_log(l) for l in error_lines). Each record flows through all 3 stages individually in a "pull" architecture before the next line is read from disk, maintaining strictly O(1) working memory.',
            'prediction': {
                'prompt': 'In a chained generator pipeline (Reader -> Filter -> Parser), how many log lines reside in RAM simultaneously?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Exactly 1 record at any instant; each record is read, filtered, and processed before the next line is pulled from disk.',
                        'explanation': 'Correct! Chained generators operate as a pull pipeline where one item at a time is demanded by the consumer.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'All 100GB of log lines are loaded in parallel into a thread pool.',
                        'explanation': 'Incorrect! There are no threads; execution is synchronous and lazy.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Exactly 1,024 lines because Python requires power-of-two buffer sizes.',
                        'explanation': 'Misconception! While OS I/O buffers exist, application-level generator pipelines process items one by one.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Chained generator pipelines allow Python applications to process datasets orders of magnitude larger than physical RAM with constant memory overhead.',
            },
            'controls': [
                {
                    'id': 'pipeline_stages',
                    'label': 'Pipeline Stage Count',
                    'type': 'slider',
                    'default': 3,
                    'min': 1,
                    'max': 5,
                    'step': 1,
                    'description': 'Number of chained generator transformations',
                },
                {
                    'id': 'pull_mode',
                    'label': 'Evaluation Mode',
                    'type': 'select',
                    'default': 'Lazy Pull Pipeline',
                    'options': ['Lazy Pull Pipeline', 'Eager Intermediate Lists'],
                    'description': 'Memory behavior of data flow',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Pipelined Generator Data Stream Flow'},
        },
        {
            'id': 'w13_s5_generator_lifecycle_stopiteration',
            'title': 'Generator State Lifecycle: StopIteration & Resource Cleanup',
            'subtitle': 'How for-loops terminate and how finally blocks protect file descriptors',
            'scenario': 'How does a for-loop know when a generator has finished, and how can resources (such as open file descriptors) be cleaned up cleanly?',
            'mechanism': 'When a generator reaches a return statement or the end of the code block, CPython raises a StopIteration exception. The standard Python for-loop catches this exception internally to terminate cleanly. If a generator is abandoned early, calling gen.close() raises a GeneratorExit exception inside the suspended frame, triggering any finally: cleanup blocks.',
            'prediction': {
                'prompt': 'How does a standard Python "for item in generator:" loop determine when the generator has exhausted all items?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'The generator raises a StopIteration exception, which the for-loop catches internally to exit cleanly.',
                        'explanation': 'Correct! Python iterators follow PEP 234: exhaustion is signaled via the StopIteration exception.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The generator returns a special NULL pointer value.',
                        'explanation': 'Incorrect! Python uses exception-driven iteration protocols, not NULL pointers.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Python polls the operating system file descriptor table.',
                        'explanation': 'Nonsense! Iteration protocols are entirely internal to the Python runtime.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Understanding StopIteration and GeneratorExit ensures proper exception handling and deterministic resource cleanup when streaming large datasets.',
            },
            'controls': [
                {
                    'id': 'lifecycle_action',
                    'label': 'Trigger Lifecycle Event',
                    'type': 'select',
                    'default': 'Normal Exhaustion',
                    'options': ['Normal Exhaustion', 'Early Break (close)', 'Unhandled Exception'],
                    'description': 'Simulate generator termination scenarios',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Generator Lifecycle: yield -> StopIteration / GeneratorExit'},
        },
        {
            'id': 'w13_s6_transfer_challenge',
            'title': 'Transfer Challenge: Error Log Lazy Streaming Engine',
            'subtitle': 'Build the production streaming log parser with zero memory waste',
            'scenario': 'Implement `parse_error_logs(raw_lines: list[str]) -> list[dict]` to parse high-throughput logs without accumulating intermediate string arrays in memory.',
            'mechanism': 'Build a generator streaming pipeline that: 1. Iterates over each log line, 2. Strips whitespace and skips empty lines, 3. Filters 5xx server errors (500 <= status <= 599), 4. Parses lines into {"status": int, "path": str, "latency": int}, and returns the collected results.',
            'prediction': {
                'prompt': 'Given the line "2026-10-15T10:00:01 500 /api/try-on 1250", what dictionary should be extracted?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': '{"status": 500, "path": "/api/try-on", "latency": 1250}',
                        'explanation': 'Correct! The timestamp is discarded, while status, path, and latency are parsed with their correct numeric types.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': '{"status": "500", "path": "/api/try-on", "latency": "1250"}',
                        'explanation': 'Incorrect! Status and latency must be parsed into integer values.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': '{"error": "500 Server Error"}',
                        'explanation': 'Incorrect! The required schema keys are status, path, and latency.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Implement the log parser in the code editor below using lazy generator expressions and verify with all test cases.',
            },
            'controls': [
                {
                    'id': 'run_verification',
                    'label': 'Run Full Streaming Log Parser Tests',
                    'type': 'button',
                    'default': True,
                    'description': 'Execute test suite validating 5xx error filtering, empty line skipping, and latency parsing',
                },
            ],
            'lab_starter_code': data.get('starter_code', ''),
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Log Streaming Engine Sandbox'},
        },
    ]

    data['journey'] = journey
    QuestionContent(**data)
    path.write_text(yaml.dump(data, sort_keys=False))
    print(f'Successfully injected {len(journey)} stages into {path}')

def inject_w31_rtr():
    path = Path('content/questions/31-auth-security/refresh-token-rotation-reuse.yaml')
    data = yaml.safe_load(path.read_text())

    journey = [
        {
            'id': 'w31_s1_stateless_vs_stateful',
            'title': 'Stateless Access Tokens vs Stateful Refresh Tokens',
            'subtitle': 'Why production systems separate quick authorization from session lifecycle',
            'scenario': 'Why don\'t web and mobile applications simply give users an access token that lasts for 1 year so they never have to log in again?',
            'mechanism': 'Access tokens are stateless (JWTs): services verify their signature locally using a public key without querying a central database. If an access token were valid for 1 year, revoking access when a user is fired or their phone is stolen would be impossible without creating a distributed blacklist that negates the stateless performance benefits. Therefore, access tokens expire quickly (15 minutes), while a stateful refresh token stored in the database is used to request new access tokens periodically.',
            'prediction': {
                'prompt': 'If an API uses purely stateless JWT access tokens with a 6-month lifespan, what security problem arises when an employee is terminated?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'The terminated employee can continue using the token until expiration because services verify the cryptographic signature locally without checking employee employment status.',
                        'explanation': 'Correct! Stateless tokens cannot be revoked on the fly without a centralized database check on every request.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The server immediately revokes the JWT through hardware CPU memory invalidation.',
                        'explanation': 'Misconception! The cryptographic signature remains valid until its exp claim timestamp.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'The JWT self-destructs after 10 API calls.',
                        'explanation': 'Nonsense! JWTs are static base64-encoded strings with no internal counter mechanisms.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Short-lived access tokens (15m) minimize the blast radius of stolen tokens, while stateful refresh tokens provide centralized revocation control.',
            },
            'controls': [
                {
                    'id': 'access_token_ttl_mins',
                    'label': 'Access Token Lifespan (Minutes)',
                    'type': 'slider',
                    'default': 15,
                    'min': 5,
                    'max': 120,
                    'step': 5,
                    'description': 'Stateless access token expiration time',
                },
                {
                    'id': 'revocation_method',
                    'label': 'Revocation Mechanism',
                    'type': 'select',
                    'default': 'Stateful Database Check',
                    'options': ['Stateful Database Check', 'Stateless Signature Only', 'Distributed Redis Blocklist'],
                    'description': 'How backend verifies user authorization status',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Stateless JWT Verification vs Stateful Session Check'},
        },
        {
            'id': 'w31_s2_token_theft_surface',
            'title': 'The Attack Surface: Token Theft via XSS & Device Compromise',
            'subtitle': 'How malicious scripts exfiltrate static refresh tokens from browser storage',
            'scenario': 'A malicious third-party script runs in a user\'s browser via Cross-Site Scripting (XSS). It reads localStorage.getItem("refresh_token") and sends it to an attacker\'s server. If the refresh token is static and valid for 30 days, what can the attacker do?',
            'mechanism': 'Because the server only checks if the token exists and is unexpired, the attacker can silently generate new access tokens whenever they want for the next 30 days. The legitimate user and the attacker operate side-by-side, completely invisible to the backend.',
            'prediction': {
                'prompt': 'If an attacker steals a static, non-rotating refresh token, how long can they maintain unauthorized access?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Until the token expires (e.g. 30 days) or the user manually changes their password, because the auth server cannot distinguish legitimate requests from attacker requests.',
                        'explanation': 'Correct! Static refresh tokens have no replay or theft detection; any holder of the secret string is granted access.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'For only 1 request, because HTTP packets verify the user\'s physical fingerprint.',
                        'explanation': 'Incorrect! Standard HTTP requests carry no biological or physical device proof.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Never, because browsers encrypt all tokens with quantum encryption.',
                        'explanation': 'Nonsense! localStorage is plain text and accessible to any JavaScript running in the origin.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Static refresh tokens create an intolerable security vulnerability. OAuth 2.0 introduced Refresh Token Rotation to detect and mitigate token theft.',
            },
            'controls': [
                {
                    'id': 'storage_medium',
                    'label': 'Client Storage Medium',
                    'type': 'select',
                    'default': 'Browser LocalStorage (Vulnerable to XSS)',
                    'options': ['Browser LocalStorage (Vulnerable to XSS)', 'HttpOnly SameSite Cookie', 'In-Memory JavaScript State'],
                    'description': 'Client-side credential persistence strategy',
                },
                {
                    'id': 'rotation_enabled',
                    'label': 'Refresh Token Rotation',
                    'type': 'toggle',
                    'default': False,
                    'description': 'Enable single-use rotation protocol',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'XSS Token Exfiltration Attack Vector'},
        },
        {
            'id': 'w31_s3_rtr_single_use_handoff',
            'title': 'Refresh Token Rotation (RTR): Single-Use Token Handoff',
            'subtitle': 'Invalidating the old token and issuing a single-use successor on every refresh',
            'scenario': 'How does Refresh Token Rotation prevent stolen tokens from being reused indefinitely?',
            'mechanism': 'Every time a refresh token (e.g. RT_1) is submitted to /auth/refresh: 1. The server marks RT_1 as spent/used, 2. The server issues a brand new access token AT_2 AND a brand new refresh token RT_2, 3. The client discards RT_1 and stores RT_2. Every refresh token is strictly Single-Use.',
            'prediction': {
                'prompt': 'What does the OAuth server do with the presented refresh token during a successful rotation?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'It moves the presented token into a spent/used list and returns a brand new single-use refresh token alongside the new access token.',
                        'explanation': 'Correct! RTR ensures every refresh token can only be exchanged once before being permanently invalidated.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'It extends the lifespan of the presented refresh token by 30 days.',
                        'explanation': 'Misconception! Extending lifespan is static token reuse, which violates RTR.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'It deletes the user\'s password from the database.',
                        'explanation': 'Nonsense! Passwords are unaffected by session token rotation.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'By making each refresh token single-use, any attempt to present the same token twice reveals that a security breach is underway.',
            },
            'controls': [
                {
                    'id': 'rotate_token',
                    'label': 'Execute Token Rotation',
                    'type': 'button',
                    'default': True,
                    'description': 'Advance token generation and invalidate previous token',
                },
                {
                    'id': 'token_generation',
                    'label': 'Active Token Generation',
                    'type': 'select',
                    'default': 'Generation 1 (Initial Login)',
                    'options': ['Generation 1 (Initial Login)', 'Generation 2 (First Refresh)', 'Generation 3 (Second Refresh)'],
                    'description': 'Current token lineage depth',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'RTR Token Lineage: RT_1 -> RT_2 -> RT_3'},
        },
        {
            'id': 'w31_s4_token_reuse_detection',
            'title': 'Token Reuse Detection & The Double-Spend Race Condition',
            'subtitle': 'Detecting replay attacks when an already-spent token is presented',
            'scenario': 'Suppose an attacker stole RT_1. The legitimate user uses RT_1 to rotate to RT_2. Later, the attacker attempts to use RT_1. What happens?',
            'mechanism': 'The server checks the session record and discovers that RT_1 is already in used_tokens! This is Token Reuse. Because a spent token was re-submitted, an active replay attack is underway. The server immediately sets revoked = True on the entire session record to protect the user.',
            'prediction': {
                'prompt': 'When an auth server receives a refresh token that is already marked as "used", what does this indicate?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Token reuse (replay attack): either an attacker is presenting a stolen spent token, or a legitimate user was overtaken by an attacker who rotated their token first.',
                        'explanation': 'Correct! Since tokens are single-use, receiving a used token is mathematical proof that two entities hold copies of the token.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'A temporary network glitch that should be ignored and retried.',
                        'explanation': 'Dangerous misconception! Ignoring reuse allows attackers to mint valid access tokens undetected.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'The client\'s clock is running 5 minutes fast.',
                        'explanation': 'Incorrect! Clock skew does not cause token reuse in database audit logs.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Token reuse detection is the core superpower of Refresh Token Rotation: it transforms passive theft into an active, detectable alarm.',
            },
            'controls': [
                {
                    'id': 'attack_sequence',
                    'label': 'Replay Attack Sequence',
                    'type': 'select',
                    'default': 'Legitimate User Rotates First (Attacker Replays Old)',
                    'options': [
                        'Legitimate User Rotates First (Attacker Replays Old)',
                        'Attacker Rotates First (User Replays Old)',
                    ],
                    'description': 'Simulated order of token submission',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Token Reuse Alarm: Spent Token Replay Detected'},
        },
        {
            'id': 'w31_s5_family_revocation_killswitch',
            'title': 'Token Family Revocation: The Security Killswitch',
            'subtitle': 'Why the auth server invalidates all active tokens in the compromised family',
            'scenario': 'When Token Reuse is detected on a spent refresh token, why must the server revoke the ENTIRE session rather than just rejecting the reused token?',
            'mechanism': 'If the attacker managed to rotate the token first, the attacker currently holds the legitimate active token, while the real user holds the spent token! If the server merely rejected the spent token, the real user would be locked out while the attacker maintained persistent access. By invalidating the entire family, both the attacker and user are booted, and the user is prompted for MFA.',
            'prediction': {
                'prompt': 'Why does Refresh Token Rotation revoke the ENTIRE session rather than just rejecting the reused token?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'If the attacker already rotated the token earlier, rejecting only the spent token would leave the attacker with the valid active token; revoking the entire family cuts off the attacker immediately.',
                        'explanation': 'Correct! The server cannot distinguish which entity is the attacker; invalidating the entire lineage guarantees the breach is terminated.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Because databases cannot delete single rows without truncating tables.',
                        'explanation': 'Nonsense! SQL supports granular row-level updates.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'To force the user to pay a penalty fee.',
                        'explanation': 'Irrelevant! Family revocation is a pure security safeguard.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Family Revocation guarantees that regardless of who rotated first, the compromise is cleanly terminated and the account is secured.',
            },
            'controls': [
                {
                    'id': 'security_action',
                    'label': 'Enforce Security Policy',
                    'type': 'select',
                    'default': 'Nuclear Family Revocation (Revoke All)',
                    'options': ['Nuclear Family Revocation (Revoke All)', 'Naive Rejection (Reject Spent Only)'],
                    'description': 'System response to detected token reuse',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Token Family Revocation Killswitch'},
        },
        {
            'id': 'w31_s6_transfer_challenge',
            'title': 'Transfer Challenge: OAuth 2.0 RTR Security Engine',
            'subtitle': 'Build the full refresh token rotation and replay detector',
            'scenario': 'Implement `rotate_refresh_token(presented_token: str, sessions_db: dict) -> dict` according to OAuth 2.0 Refresh Token Rotation standards.',
            'mechanism': '1. Check revocation: if sessions_db.get("revoked") is True -> 401 session_revoked. 2. Replay detection: if presented_token in sessions_db["used_tokens"] -> mark revoked=True and return 401 token_reuse_detected. 3. Token check: if presented_token != sessions_db.get("active_token") -> 404 token_not_found. 4. Rotation: archive old token to used_tokens, issue new active and access tokens, return 200.',
            'prediction': {
                'prompt': 'Given sessions_db with used_tokens=["rt_init_1001"] and active_token="rt_rot_1_1001", what happens if a client presents "rt_init_1001"?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': '{"success": False, "error": "token_reuse_detected", "session_revoked": True, "status_code": 401}',
                        'explanation': 'Correct! The presented token is in used_tokens; the session is immediately marked revoked and 401 is returned.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': '{"success": True, "status_code": 200}',
                        'explanation': 'Incorrect! Accepting spent tokens permits replay attacks.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': '{"error": "token_not_found", "status_code": 404}',
                        'explanation': 'Incorrect! The token was found in used_tokens, triggering replay detection rather than not-found.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Implement the rotation engine in the code editor below and verify against all test cases.',
            },
            'controls': [
                {
                    'id': 'run_verification',
                    'label': 'Run Full RTR Test Suite',
                    'type': 'button',
                    'default': True,
                    'description': 'Verify valid rotation, replay detection, revoked session rejection, and token not found',
                },
            ],
            'lab_starter_code': data.get('starter_code', ''),
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'OAuth 2.0 RTR Security Engine Sandbox'},
        },
    ]

    data['journey'] = journey
    QuestionContent(**data)
    path.write_text(yaml.dump(data, sort_keys=False))
    print(f'Successfully injected {len(journey)} stages into {path}')

def inject_w32_pydantic():
    path = Path('content/questions/32-fastapi-pydantic/pydantic-payload-validator.yaml')
    data = yaml.safe_load(path.read_text())

    journey = [
        {
            'id': 'w32_s1_declarative_schemas',
            'title': 'Imperative if/else Validation vs Declarative Pydantic Schemas',
            'subtitle': 'Why manual validation breaks down in production API gateways',
            'scenario': 'A developer writes 25 lines of if not isinstance(data.get("age"), int): return {"error": "bad age"} checks inside a route handler. What happens as new fields are added?',
            'mechanism': 'Imperative validation leads to code bloat, forgotten field checks, inconsistent error response shapes, and security vulnerabilities (e.g., negative balances or missing required fields). Declarative Pydantic schemas define the data contract up front, automatically validating presence, types, and constraints in a single pass before business logic runs.',
            'prediction': {
                'prompt': 'What is the primary architectural advantage of declarative schema validation (like Pydantic) over manual if/else checks?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'It guarantees consistent validation rules, uniform error responses, and automatic type coercion before handler code executes.',
                        'explanation': 'Correct! Declarative schemas separate request validation contracts from business logic, ensuring consistent behavior across all endpoints.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'It speeds up network transmission by 500% over the wire.',
                        'explanation': 'Misconception! Validation occurs on the server after network packets have arrived.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'It converts all incoming JSON strings into compiled C binary code.',
                        'explanation': 'Incorrect! While Pydantic v2 uses a Rust core (pydantic-core), the architectural benefit is schema consistency.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Declarative schemas act as a strong gatekeeper at the API boundary, guaranteeing clean, type-safe data reaches your database and business services.',
            },
            'controls': [
                {
                    'id': 'validation_approach',
                    'label': 'Validation Paradigm',
                    'type': 'select',
                    'default': 'Declarative Pydantic Schema',
                    'options': ['Declarative Pydantic Schema', 'Manual Imperative if/else Checks'],
                    'description': 'Architectural style for input validation',
                },
                {
                    'id': 'field_count',
                    'label': 'Request Fields',
                    'type': 'slider',
                    'default': 5,
                    'min': 2,
                    'max': 20,
                    'step': 1,
                    'description': 'Number of fields in incoming payload',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'FastAPI Request Pipeline: HTTP Ingress to Pydantic Barrier'},
        },
        {
            'id': 'w32_s2_cpython_bool_trap',
            'title': 'The CPython Boolean Trap: isinstance(True, int) == True',
            'subtitle': 'Why Python booleans fool naive integer validators',
            'scenario': 'You have a schema requiring an integer technician_count. A client sends {"technician_count": True}. If your validator simply checks isinstance(val, int), does it pass?',
            'mechanism': 'In Python, bool is an explicit subclass of int (issubclass(bool, int) is True). Therefore, isinstance(True, int) returns True! In raw Python math, True + 1 == 2. To prevent clients from passing booleans where integers are required, strict validators must verify isinstance(val, int) and not isinstance(val, bool).',
            'prediction': {
                'prompt': 'In standard CPython, what is the output of isinstance(True, int)?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'True! In CPython, bool inherits from int, so True is treated as a valid integer unless explicitly excluded.',
                        'explanation': 'Correct! Because bool subclasses int, isinstance(True, int) evaluates to True, causing subtle bugs in naive validators.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'False! Integers and Booleans belong to completely separate memory types in all languages.',
                        'explanation': 'Misconception! In Python 2 and 3, bool was intentionally implemented as an int subclass for backwards compatibility.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'It raises a TypeError at runtime.',
                        'explanation': 'Incorrect! isinstance() evaluates cleanly to a boolean.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Strict validation engines explicitly check "not isinstance(val, bool)" when validating integers and floats to avoid the CPython boolean inheritance trap.',
            },
            'controls': [
                {
                    'id': 'strict_mode',
                    'label': 'Strict Boolean Discrimination',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Reject booleans passed into integer fields',
                },
                {
                    'id': 'tested_value',
                    'label': 'Tested Input Value',
                    'type': 'select',
                    'default': 'True (Boolean)',
                    'options': ['True (Boolean)', 'False (Boolean)', '42 (Integer)', '"42" (String)'],
                    'description': 'Value to test against integer validator',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'CPython Type Hierarchy: object -> int -> bool'},
        },
        {
            'id': 'w32_s3_http_400_vs_422',
            'title': 'HTTP Status Semantics: 400 Bad Request vs 422 Unprocessable Entity',
            'subtitle': 'Distinguishing malformed syntax from semantic schema failures',
            'scenario': 'A client sends a POST request with valid JSON syntax {"age": "twenty"}. Should the server respond with HTTP 400 Bad Request or HTTP 422 Unprocessable Entity?',
            'mechanism': 'HTTP 400 Bad Request indicates that the HTTP message itself is malformed (e.g., invalid JSON syntax like trailing commas, corrupted headers). HTTP 422 Unprocessable Entity indicates that the syntax is well-formed (valid JSON), but the semantic instructions cannot be processed due to validation errors (e.g., age must be an int, not a string). FastAPI standardizes on HTTP 422 for all schema validation failures.',
            'prediction': {
                'prompt': 'When an incoming JSON payload is syntactically valid JSON but violates schema data types, which HTTP status code is standard in FastAPI?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'HTTP 422 Unprocessable Entity, indicating the syntax is valid JSON but fails semantic schema rules.',
                        'explanation': 'Correct! RFC 4918 / RFC 9457 establish 422 as the standard code for well-formed requests with semantic validation errors.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'HTTP 500 Internal Server Error, because the server encountered a bug.',
                        'explanation': 'Misconception! 500 indicates a server failure; client validation errors are client-side 4xx errors.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'HTTP 200 OK with an error message inside the body.',
                        'explanation': 'Antipattern! Returning 200 OK for errors breaks HTTP caching, monitoring alerts, and client retry logic.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'FastAPI uses HTTP 422 to clearly inform clients that their JSON was parsed successfully but failed business and schema constraints.',
            },
            'controls': [
                {
                    'id': 'payload_condition',
                    'label': 'Payload Malformation Type',
                    'type': 'select',
                    'default': 'Semantic Schema Violation (Type Mismatch)',
                    'options': ['Semantic Schema Violation (Type Mismatch)', 'Corrupted JSON Syntax (Missing Brace)'],
                    'description': 'Error scenario to evaluate',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'HTTP Error Codes: 400 Syntax vs 422 Semantic'},
        },
        {
            'id': 'w32_s4_error_locators_frontend',
            'title': 'Structured Error Locators: loc, msg & type for Frontend UX',
            'subtitle': 'How modern frontends highlight form inputs directly from API responses',
            'scenario': 'When an API rejects a nested request payload, how does the frontend know which form input field to highlight in red?',
            'mechanism': 'FastAPI / Pydantic error details include a loc array path (e.g. ["body", "address", "zipcode"]), an error message msg, and a machine-readable error type (missing, int_type, greater_than_equal). Client libraries (like React Hook Form or Formik) map these locators directly to form inputs to render inline error messages without custom parsing.',
            'prediction': {
                'prompt': 'Why does Pydantic return errors with a locator array like loc: ["body", "user", "email"]?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'It allows frontend frameworks to map validation errors directly to the exact nested input field in the UI.',
                        'explanation': 'Correct! Locator paths like ["body", "user", "email"] map directly to UI input component field names.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'It informs the database which column index to delete.',
                        'explanation': 'Nonsense! Error locators are strictly client communication contracts.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'It traces the GPS coordinates of the mobile device.',
                        'explanation': 'Irrelevant! loc refers to JSON payload location.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Structured error locators transform vague error messages into actionable, field-specific feedback for frontend consumers.',
            },
            'controls': [
                {
                    'id': 'nesting_depth',
                    'label': 'Schema Nesting Depth',
                    'type': 'select',
                    'default': 'Single Level (body.age)',
                    'options': ['Single Level (body.age)', 'Nested Object (body.address.zipcode)'],
                    'description': 'Complexity of field hierarchy',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Pydantic Error Object Schema & Frontend Form Binding'},
        },
        {
            'id': 'w32_s5_boundary_constraints',
            'title': 'Value Constraints: Boundaries, Ranges & Business Rules',
            'subtitle': 'Enforcing min, max, and range boundaries before SQL queries run',
            'scenario': 'An age field must be an integer between 18 and 120. A user submits age = 16. How are numeric boundary constraints applied?',
            'mechanism': 'After type verification, validators check boundary constraints: min (greater than or equal to) and max (less than or equal to). If val < min, the validator emits type: "greater_than_equal" with message "Input should be greater than or equal to {min}".',
            'prediction': {
                'prompt': 'What error should be generated for a field with constraint min: 18 when the submitted value is 16?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': '{"loc": ["body", "age"], "msg": "Input should be greater than or equal to 18", "type": "greater_than_equal"} with status 422.',
                        'explanation': 'Correct! Pydantic formats boundary violations with descriptive type tags and human-readable messages.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': '{"error": "Underage"} with status 403 Forbidden.',
                        'explanation': 'Incorrect! 403 is for authorization/permissions; schema boundary checks produce 422.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'The value is automatically rounded up to 18 with status 200.',
                        'explanation': 'Dangerous! Silently mutating user input causes unexpected data corruption.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Strict boundary validation catches invalid business data at the HTTP boundary before it can corrupt downstream transactional state.',
            },
            'controls': [
                {
                    'id': 'min_constraint',
                    'label': 'Minimum Boundary (min)',
                    'type': 'slider',
                    'default': 18,
                    'min': 0,
                    'max': 100,
                    'step': 1,
                    'description': 'Minimum allowable numeric value',
                },
                {
                    'id': 'submitted_val',
                    'label': 'Submitted Value',
                    'type': 'slider',
                    'default': 16,
                    'min': 0,
                    'max': 100,
                    'step': 1,
                    'description': 'User-submitted integer value',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Boundary Validation: Min/Max Range Verification'},
        },
        {
            'id': 'w32_s6_transfer_challenge',
            'title': 'Transfer Challenge: Pydantic Schema Validation Engine',
            'subtitle': 'Build the complete FastAPI-style schema validator',
            'scenario': 'Implement `validate_payload(schema: dict, payload: dict) -> dict` to validate incoming requests against types and boundary constraints.',
            'mechanism': '1. Check required fields: if missing, emit type: "missing". 2. Check types (str, int without bool, float without bool, bool): if mismatch, emit type: f"{expected}_type". 3. Check min and max bounds: emit type: "greater_than_equal" or "less_than_equal". 4. Return status_code 422 with detail list if errors, else 200 with data.',
            'prediction': {
                'prompt': 'Given schema {"name": {"type": "str", "required": True}, "age": {"type": "int", "required": True, "min": 18}} and payload {"name": "Aarav", "age": 16}, what does validate_payload return?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': '{"status_code": 422, "detail": [{"loc": ["body", "age"], "msg": "Input should be greater than or equal to 18", "type": "greater_than_equal"}], "valid": False}',
                        'explanation': 'Correct! Age 16 violates min: 18, producing an HTTP 422 with the exact locator and type descriptor.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': '{"status_code": 200, "data": {"name": "Aarav", "age": 16}, "valid": True}',
                        'explanation': 'Incorrect! The constraint is violated, so validation must fail.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': '{"status_code": 400, "error": "Bad age"}',
                        'explanation': 'Incorrect! The function specifies HTTP 422 with structured detail locators.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Implement the validation engine in the code editor below and test with all validation scenarios.',
            },
            'controls': [
                {
                    'id': 'run_verification',
                    'label': 'Run Full Validation Engine Tests',
                    'type': 'button',
                    'default': True,
                    'description': 'Execute test suite validating missing fields, type errors, boundary checks, and valid payloads',
                },
            ],
            'lab_starter_code': data.get('starter_code', ''),
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Pydantic Schema Validation Sandbox'},
        },
    ]

    data['journey'] = journey
    QuestionContent(**data)
    path.write_text(yaml.dump(data, sort_keys=False))
    print(f'Successfully injected {len(journey)} stages into {path}')

def inject_w33_backoff():
    path = Path('content/questions/33-async-jobs-polling/http-202-polling-backoff.yaml')
    data = yaml.safe_load(path.read_text())

    journey = [
        {
            'id': 'w33_s1_proxy_timeouts',
            'title': 'The 60-Second Proxy Timeout & Why Long Requests Fail',
            'subtitle': 'Why keeping HTTP connections open causes HTTP 504 Gateway Timeouts',
            'scenario': 'A user clicks "Generate 100-Page PDF Invoice". The PDF takes 90 seconds to render on the backend. What happens if the browser waits synchronously on a single POST request?',
            'mechanism': 'Modern cloud infrastructure routes traffic through reverse proxies and load balancers (Cloudflare, AWS ALB, Nginx). These intermediaries enforce hard connection timeout ceilings (typically 30s to 60s). If the backend does not return an HTTP response within this window, the proxy forcibly cuts the TCP socket and returns an HTTP 504 Gateway Timeout, even if the backend is still running the task.',
            'prediction': {
                'prompt': 'What happens to a client waiting synchronously on an HTTP request that takes 90 seconds on a cloud server behind an AWS ALB?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'The ALB drops the connection around 60 seconds and returns an HTTP 504 Gateway Timeout error.',
                        'explanation': 'Correct! Reverse proxies and load balancers terminate idle connections that exceed their timeout threshold.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The connection stays open indefinitely until the CPU finishes.',
                        'explanation': 'Misconception! Cloud proxies actively protect their socket pools by enforcing timeout ceilings.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'The browser automatically converts the connection into a WebSocket.',
                        'explanation': 'Nonsense! Standard HTTP requests cannot magically upgrade protocols mid-flight.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Synchronous HTTP is designed for sub-second request/response cycles. Long-running tasks must be handled asynchronously.',
            },
            'controls': [
                {
                    'id': 'task_duration_s',
                    'label': 'Task Execution Time (Seconds)',
                    'type': 'slider',
                    'default': 90,
                    'min': 10,
                    'max': 180,
                    'step': 10,
                    'description': 'Time required by worker to complete task',
                },
                {
                    'id': 'proxy_timeout_s',
                    'label': 'Proxy Timeout Ceiling (Seconds)',
                    'type': 'slider',
                    'default': 60,
                    'min': 30,
                    'max': 120,
                    'step': 10,
                    'description': 'Reverse proxy idle connection timeout',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Reverse Proxy 60s Timeout Cliff'},
        },
        {
            'id': 'w33_s2_http_202_contract',
            'title': 'The HTTP 202 Accepted Pattern & Decoupled Task Ingestion',
            'subtitle': 'Returning job identifiers in milliseconds while background workers compute',
            'scenario': 'How should an API handle operations that take longer than a few seconds without risking gateway timeouts?',
            'mechanism': 'The asynchronous pattern: 1. The client sends POST /reports. 2. The server creates a background task (in Celery/SQS), generates a job_id, and immediately responds in 20ms with HTTP 202 Accepted and header Location: /jobs/42. 3. The client periodically polls GET /jobs/42 until status transitions from PENDING -> PROCESSING -> SUCCESS.',
            'prediction': {
                'prompt': 'What is the primary semantic meaning of an HTTP 202 Accepted response code?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'The request has been accepted for processing, but processing has not been completed.',
                        'explanation': 'Correct! RFC 9110 specifies 202 Accepted for batch and asynchronous processing workflows.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The request was rejected because the server is out of memory.',
                        'explanation': 'Incorrect! 202 means successful acceptance, not rejection.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'The transaction was committed and completed synchronously.',
                        'explanation': 'Incorrect! Synchronous completion uses 200 OK or 201 Created.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'HTTP 202 decouples request acceptance from task execution, allowing workers to process workloads asynchronously.',
            },
            'controls': [
                {
                    'id': 'architecture_style',
                    'label': 'Task Processing Architecture',
                    'type': 'select',
                    'default': 'Async Worker with HTTP 202',
                    'options': ['Async Worker with HTTP 202', 'Synchronous Blocking Handler'],
                    'description': 'How backend schedules long-running workload',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'HTTP 202 Accepted & Task Queue Ingestion'},
        },
        {
            'id': 'w33_s3_polling_thundering_herd',
            'title': 'The Polling Stampede & The Thundering Herd Problem',
            'subtitle': 'How 50,000 clients polling every 100ms generate 500,000 QPS and crash databases',
            'scenario': '50,000 users initiate background export tasks. If all client applications poll /jobs/{id} every 100 milliseconds in a simple loop, what happens to the database?',
            'mechanism': '50,000 clients * 10 requests/sec = 500,000 queries per second hitting the status endpoint! Because background tasks take 30-60 seconds, millions of redundant queries flood the API gateway and database, depleting connection pools and causing system-wide cascading failure.',
            'prediction': {
                'prompt': 'If 100,000 clients poll a status endpoint every 200ms while waiting for a 1-minute job, what query rate does the backend experience?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': '500,000 requests per second, creating a catastrophic thundering herd stampede that exhausts server connection pools.',
                        'explanation': 'Correct! 100,000 * (1000ms / 200ms) = 500,000 requests every single second.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Only 1 request per second because the browser caches the response.',
                        'explanation': 'Misconception! Polling endpoints return dynamic status and cannot be aggressively cached.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Exactly 0 requests because HTTP 202 eliminates polling.',
                        'explanation': 'Nonsense! HTTP 202 requires the client to discover completion via polling or WebSockets.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Fixed-interval tight polling loops generate unsustainable query volumes. Clients must back off exponentially.',
            },
            'controls': [
                {
                    'id': 'concurrent_clients',
                    'label': 'Concurrent Polling Clients',
                    'type': 'slider',
                    'default': 50000,
                    'min': 1000,
                    'max': 100000,
                    'step': 5000,
                    'description': 'Number of active browser tabs polling for results',
                },
                {
                    'id': 'polling_strategy',
                    'label': 'Polling Strategy',
                    'type': 'select',
                    'default': 'Fixed 100ms Tight Loop (Thundering Herd)',
                    'options': ['Fixed 100ms Tight Loop (Thundering Herd)', 'Exponential Backoff'],
                    'description': 'Client polling behavior',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Thundering Herd: 500k QPS Polling Stampede'},
        },
        {
            'id': 'w33_s4_exponential_backoff_progression',
            'title': 'Truncated Exponential Backoff Mechanics & Interval Caps',
            'subtitle': 'Balancing immediate response for fast jobs with 95% reduced load for slow jobs',
            'scenario': 'How can client SDKs stay responsive for fast jobs (done in 300ms) without overwhelming servers on slow jobs (done in 60s)?',
            'mechanism': 'Truncated Exponential Backoff! Start with a small interval (e.g. 200ms). After each non-terminal poll, multiply the interval: interval = min(int(interval * multiplier), max_interval). Fast tasks are detected immediately on early polls; longer tasks poll less and less frequently, automatically throttling client load by 95%+.',
            'prediction': {
                'prompt': 'How does exponential backoff balance fast-job responsiveness with slow-job backend protection?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'It polls rapidly during initial milliseconds when quick jobs finish, then progressively widens intervals up to a maximum cap to prevent backend overload.',
                        'explanation': 'Correct! Quick jobs finish during short intervals, while long jobs automatically reduce query frequency to prevent server exhaustion.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'It increases polling frequency as time goes on to pressure the backend into working faster.',
                        'explanation': 'Misconception! Polling faster increases server load, causing jobs to slow down further.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'It cancels the job if it takes longer than 3 polls.',
                        'explanation': 'Incorrect! Backoff allows long jobs to run to completion cleanly.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Truncated exponential backoff is the industry-standard algorithm implemented in AWS Boto3, Google Cloud, and Stripe client SDKs.',
            },
            'controls': [
                {
                    'id': 'initial_interval_ms',
                    'label': 'Initial Interval (ms)',
                    'type': 'slider',
                    'default': 200,
                    'min': 50,
                    'max': 1000,
                    'step': 50,
                    'description': 'Delay before first retry',
                },
                {
                    'id': 'backoff_multiplier',
                    'label': 'Backoff Multiplier',
                    'type': 'slider',
                    'default': 1.5,
                    'min': 1.1,
                    'max': 3.0,
                    'step': 0.1,
                    'description': 'Factor by which interval grows',
                },
                {
                    'id': 'max_interval_ms',
                    'label': 'Max Interval Cap (ms)',
                    'type': 'slider',
                    'default': 2000,
                    'min': 500,
                    'max': 10000,
                    'step': 500,
                    'description': 'Maximum polling interval ceiling',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Exponential Backoff Growth Curve with Ceiling Cap'},
        },
        {
            'id': 'w33_s5_jitter_resonance_waves',
            'title': 'Decorrelated Jitter: Preventing Lockstep Resonance Waves',
            'subtitle': 'Breaking synchronized retry spikes with randomized sleep intervals',
            'scenario': 'When 10,000 clients retry with pure deterministic exponential backoff (200ms -> 400ms -> 800ms), why do micro-bursts of traffic still occur?',
            'mechanism': 'Lockstep synchronization! If 10,000 clients all start simultaneously, deterministic multipliers cause all 10,000 clients to poll at the exact same millisecond intervals, creating periodic spikes of traffic (resonance waves). Adding randomness (Jitter) decorrelates client timers and flattens traffic into a smooth, manageable stream.',
            'prediction': {
                'prompt': 'Why does AWS Architecture recommend adding random "Jitter" to exponential backoff loops?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Jitter decorrelates simultaneous client retries, preventing synchronized lockstep traffic spikes that hammer the server.',
                        'explanation': 'Correct! Randomizing intervals breaks synchronous waves, spreading requests evenly over time.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Jitter encrypts the HTTP packets against packet sniffers.',
                        'explanation': 'Nonsense! Jitter is a timing delay parameter, not an encryption cipher.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Jitter forces the CPU to use quantum randomness.',
                        'explanation': 'Irrelevant! Standard pseudorandom number generators are sufficient.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Decorrelated Jitter ensures that high-scale retries never form synchronized constructive interference waves against your infrastructure.',
            },
            'controls': [
                {
                    'id': 'jitter_enabled',
                    'label': 'Random Jitter Enabled',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Add randomized spread to polling intervals',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Lockstep Resonance Waves vs Jittered Traffic Flow'},
        },
        {
            'id': 'w33_s6_transfer_challenge',
            'title': 'Transfer Challenge: HTTP 202 Exponential Backoff Simulator',
            'subtitle': 'Build the polling engine that simulates real-world backoff curves',
            'scenario': 'Implement `simulate_job_polling(job_timeline: dict, initial_interval_ms: int, backoff_multiplier: float, max_interval_ms: int, max_attempts: int) -> dict` to model robust client polling.',
            'mechanism': '1. Start at current_time = 0, interval = initial_interval_ms, attempts = 0. 2. Loop while attempts < max_attempts: look up latest status in timeline <= current_time. 3. If SUCCESS or FAILED: return completed=True. 4. If PENDING or PROCESSING: advance current_time += interval, update interval = min(int(interval * backoff_multiplier), max_interval_ms). 5. If max_attempts exhausted: return completed=False, status="TIMEOUT".',
            'prediction': {
                'prompt': 'Given job_timeline = {"0": "PENDING", "300": "PROCESSING", "700": "SUCCESS"} with initial=200, mult=1.5, max=1000, at what timestamp is SUCCESS observed?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'At 950ms (Poll 1: 0ms -> next +200, Poll 2: 200ms -> next +300, Poll 3: 500ms -> next +450, Poll 4: 950ms sees SUCCESS).',
                        'explanation': 'Correct! The timestamps advance 0 -> 200 -> 500 -> 950ms, successfully capturing the 700ms completion milestone.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'At exactly 700ms.',
                        'explanation': 'Incorrect! The client polls at discrete intervals and does not hit 700ms exactly.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'It times out before reaching 700ms.',
                        'explanation': 'Incorrect! Max attempts is 10, easily reaching 950ms.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Implement the polling loop simulator in the code editor below and verify against all test cases.',
            },
            'controls': [
                {
                    'id': 'run_verification',
                    'label': 'Run Full Polling Simulator Tests',
                    'type': 'button',
                    'default': True,
                    'description': 'Verify exponential backoff, interval clamping, early success, and timeout termination',
                },
            ],
            'lab_starter_code': data.get('starter_code', ''),
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'HTTP 202 Backoff Simulator Sandbox'},
        },
    ]

    data['journey'] = journey
    QuestionContent(**data)
    path.write_text(yaml.dump(data, sort_keys=False))
    print(f'Successfully injected {len(journey)} stages into {path}')

if __name__ == '__main__':
    inject_w13_generators()
    inject_w31_rtr()
    inject_w32_pydantic()
    inject_w33_backoff()
    print('All Phase 5 Journeys injected and validated successfully!')
