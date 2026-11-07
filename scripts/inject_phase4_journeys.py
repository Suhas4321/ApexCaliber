import yaml
from pathlib import Path
from app.content_schema import QuestionContent

def inject_w42_virtual_memory():
    path = Path('content/questions/42-virtual-memory/virtual-memory-page-replacement.yaml')
    data = yaml.safe_load(path.read_text())

    journey = [
        {
            'id': 'w42_s1_address_space_illusion',
            'title': 'The Virtual Memory Illusion & 4KB Page Boundaries',
            'subtitle': 'How an operating system runs 32GB workloads on 8GB physical RAM',
            'scenario': 'How can an operating system run programs requiring 32 GB of memory when the machine only has 8 GB of physical RAM?',
            'mechanism': 'Virtual memory decouples a process\'s logical address space from physical hardware memory. The OS divides memory into fixed-size blocks called Pages (typically 4KB). Physical RAM is divided into matching Page Frames. The CPU Memory Management Unit (MMU) uses Page Tables to translate virtual addresses to physical frames dynamically.',
            'prediction': {
                'prompt': 'What happens when total allocated virtual memory across running processes exceeds physical hardware RAM?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'The OS transparently maps active pages into RAM frames and stores dormant pages in disk swap space, triggering page faults when needed.',
                        'explanation': 'Correct! Virtual memory enables overcommit: active working sets live in RAM, while inactive pages are swapped to disk.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The computer immediately crashes with hardware memory controller damage.',
                        'explanation': 'Misconception! Operating systems are designed to manage memory overcommit safely via paging and disk swap.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Virtual memory compresses physical RAM by 10x using lossless ZIP algorithms inside the CPU.',
                        'explanation': 'Incorrect! While zswap/zram compressed caches exist, virtual memory fundamentally relies on address space paging and swap backing.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Virtual memory isolates processes and allows systems to overcommit memory by keeping only the active working set resident in physical RAM frames.',
            },
            'controls': [
                {
                    'id': 'physical_ram_gb',
                    'label': 'Physical RAM Capacity (GB)',
                    'type': 'slider',
                    'default': 8,
                    'min': 4,
                    'max': 64,
                    'step': 4,
                    'description': 'Total physical hardware memory installed',
                },
                {
                    'id': 'virtual_process_size_gb',
                    'label': 'Total Virtual Allocated Memory (GB)',
                    'type': 'slider',
                    'default': 24,
                    'min': 4,
                    'max': 64,
                    'step': 4,
                    'description': 'Combined virtual address space of running processes',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'MMU Virtual Address Translation & Page Table'},
        },
        {
            'id': 'w42_s2_page_fault_trap',
            'title': 'The Anatomy of a Page Fault Interrupt',
            'subtitle': 'The 100,000x latency penalty when accessing non-resident pages',
            'scenario': 'A CPU instruction attempts to read address 0x7FFF0040. The MMU consults the page table entry and discovers the Present Bit is 0. What sequence unfolds?',
            'mechanism': 'The MMU triggers a hardware Page Fault interrupt (interrupt vector 14 on x86). The CPU halts user execution, saves registers, switches to kernel mode, initiates disk swap I/O to read the 4KB page into an empty RAM frame, updates the Page Table entry with the frame number and Present Bit = 1, and resumes the user process.',
            'prediction': {
                'prompt': 'Why is a page fault hundreds of thousands of times slower than a direct physical RAM access?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'RAM latency is ~50-100 nanoseconds, whereas reading a missing page from disk swap takes ~100 microseconds (NVMe) to 10 milliseconds (HDD) — a 100,000x gap.',
                        'explanation': 'Correct! Physical disk I/O introduces a massive mechanical or bus latency penalty compared to direct CPU memory bus access.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The CPU must reboot its memory controllers on every page fault.',
                        'explanation': 'Incorrect! The hardware memory controller remains running; the delay is purely disk storage I/O and kernel interrupt handling.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'The operating system must recompile the entire binary from source code.',
                        'explanation': 'Nonsense! The binary is already compiled; only a 4KB chunk of machine code or data needs to be transferred.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Because disk swap I/O is 100,000x slower than RAM, an efficient page replacement policy is critical to minimize page fault rates.',
            },
            'controls': [
                {
                    'id': 'storage_backing',
                    'label': 'Swap Storage Medium',
                    'type': 'select',
                    'default': 'NVMe SSD',
                    'options': ['Mechanical HDD (10ms)', 'NVMe SSD (100μs)', 'ZRAM Compressed (2μs)'],
                    'description': 'Latency penalty incurred during page fault swap fetch',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Page Fault Interrupt Flow: User Mode to Kernel Trap'},
        },
        {
            'id': 'w42_s3_beladys_anomaly_fifo',
            'title': 'FIFO Eviction & Belady\'s Anomaly Paradox',
            'subtitle': 'Why adding physical RAM can counter-intuitively increase page faults',
            'scenario': 'First-In First-Out (FIFO) evicts the oldest page loaded into RAM. What happens when you test the reference string [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5] with 3 frames vs 4 frames?',
            'mechanism': 'For this string, 3 frames produce 9 page faults. Increasing physical RAM to 4 frames counter-intuitively produces 10 page faults! This is Belady\'s Anomaly: FIFO is not a stack algorithm, so the set of pages resident in k frames is not always a subset of pages in k+1 frames.',
            'prediction': {
                'prompt': 'When FIFO page replacement is used, what unexpected behavior can occur if you allocate MORE physical RAM frames to a process?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Belady\'s Anomaly: The number of page faults can paradoxically INCREASE despite having more physical memory.',
                        'explanation': 'Correct! Belady proved in 1969 that FIFO can evict recently needed pages simply because they arrived earlier.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'CPU cache thrashing causes the CPU to lock its clock frequency permanently.',
                        'explanation': 'Incorrect! Belady\'s anomaly is an algorithmic property of FIFO, not a hardware clock issue.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Page faults always decrease linearly with frame count regardless of algorithm.',
                        'explanation': 'Misconception! FIFO violates monotonic decrease because it lacks the stack inclusion property.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'FIFO fails to account for page access recency or frequency. Belady\'s Anomaly proved that memory replacement algorithms must satisfy the stack inclusion property.',
            },
            'controls': [
                {
                    'id': 'frame_capacity',
                    'label': 'Page Frame Count',
                    'type': 'slider',
                    'default': 3,
                    'min': 2,
                    'max': 6,
                    'step': 1,
                    'description': 'Number of physical memory frames allocated',
                },
                {
                    'id': 'algorithm',
                    'label': 'Eviction Policy',
                    'type': 'select',
                    'default': 'FIFO',
                    'options': ['FIFO', 'LRU'],
                    'description': 'Algorithm chosen for victim selection',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'FIFO vs LRU Page Fault Comparison Matrix'},
        },
        {
            'id': 'w42_s4_lru_temporal_locality',
            'title': 'Least Recently Used (LRU) & Temporal Locality',
            'subtitle': 'Exploiting program execution patterns with stack inclusion guarantees',
            'scenario': 'Real software exhibits strong temporal locality: memory pages accessed recently are overwhelmingly likely to be accessed again soon. How does LRU exploit this?',
            'mechanism': 'LRU tracks page access order. On a page hit, the accessed page moves to the head (most recently used). When an eviction occurs, the page at the tail (least recently used) is selected. LRU is a Stack Algorithm: the contents of an n-frame memory are always a subset of an (n+1)-frame memory, mathematically guaranteeing immunity to Belady\'s Anomaly.',
            'prediction': {
                'prompt': 'Why is LRU mathematically guaranteed to NEVER experience Belady\'s Anomaly?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'LRU is a stack algorithm satisfying the inclusion property: pages resident in k frames are always a subset of pages in k+1 frames.',
                        'explanation': 'Correct! Because the top k elements in the recency stack are always preserved when adding an extra slot, page hits can never decrease.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'LRU peeks into the future using hardware branch predictors to see next instructions.',
                        'explanation': 'Misconception! Looking into the future is the theoretical Optimal algorithm (Bélády\'s MIN/OPT), not LRU.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Because LRU never evicts any pages from physical RAM.',
                        'explanation': 'Incorrect! LRU evicts pages on every fault when capacity is reached, but chooses the least recently accessed page.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'LRU aligns with temporal locality and stack inclusion, making it the bedrock principle behind OS page replacement and database buffer pool managers.',
            },
            'controls': [
                {
                    'id': 'access_pattern',
                    'label': 'Access Locality Pattern',
                    'type': 'select',
                    'default': 'Temporal Loop',
                    'options': ['Temporal Loop', 'Sequential Scan', 'Belady Sequence'],
                    'description': 'Simulated page reference pattern',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'LRU Doubly-Linked Recency Queue'},
        },
        {
            'id': 'w42_s5_thrashing_working_set',
            'title': 'The Working Set Model & The Thrashing Death Spiral',
            'subtitle': 'What happens when total active memory exceeds physical RAM',
            'scenario': 'What happens to a production server when active applications collectively demand more page frames than physical RAM provides?',
            'mechanism': 'When the sum of all processes\' Working Sets (the set of pages referenced in a time window Δ) exceeds physical RAM, every page fault evicts a page that is immediately needed by another thread. The system spends 99% of CPU time waiting for disk swap I/O transfers, causing CPU utilization to plummet. This death spiral is known as Thrashing.',
            'prediction': {
                'prompt': 'If an operating system enters thrashing, what symptom appears in CPU and system monitoring metrics?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'User CPU utilization drops near 0% while iowait spikes to 95-99%, because threads spend all time blocked on swap disk I/O.',
                        'explanation': 'Correct! Thrashing starves the CPU of runnable instructions; the disk controller is overwhelmed by continuous page swapping.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'CPU utilization locks at 100% user space because the CPU executes user code faster.',
                        'explanation': 'Incorrect! The CPU cannot execute user instructions because the necessary memory pages are not in RAM.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Network bandwidth increases by 10x automatically.',
                        'explanation': 'Irrelevant! Thrashing is an internal memory/disk bottleneck.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'To recover from thrashing, modern kernels invoke kswapd to proactively reclaim page cache, and if necessary, trigger the OOM killer to terminate memory-heavy processes.',
            },
            'controls': [
                {
                    'id': 'working_set_size_pages',
                    'label': 'Active Working Set (Pages)',
                    'type': 'slider',
                    'default': 20,
                    'min': 4,
                    'max': 30,
                    'step': 2,
                    'description': 'Number of unique pages referenced in active loop',
                },
                {
                    'id': 'ram_frames',
                    'label': 'Available RAM Frames',
                    'type': 'slider',
                    'default': 8,
                    'min': 4,
                    'max': 16,
                    'step': 2,
                    'description': 'Physical page frames in memory',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Thrashing Curve: Page Fault Rate vs Working Set'},
        },
        {
            'id': 'w42_s6_transfer_challenge',
            'title': 'Transfer Challenge: OS Virtual Memory Page Replacement Engine',
            'subtitle': 'Build the complete kernel page replacement simulator for FIFO and LRU',
            'scenario': 'Implement the operating system page replacement simulator `simulate_page_replacement(capacity: int, pages: list[int], algorithm: str) -> dict`.',
            'mechanism': 'Track page hits, faults, frame snapshots, and evicted pages under both FIFO and LRU policies. Maintain the recency ordering on hits for LRU, and snapshot frame states after every memory access.',
            'prediction': {
                'prompt': 'In your simulation, when page 3 is accessed with capacity 3, frames [1, 2, 3], and algorithm "LRU", what changes in the frames list?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'It is a page hit: page 3 moves to the end of the list [1, 2, 3] as most recently used, and page_hits increments by 1 with 0 evictions.',
                        'explanation': 'Correct! A page hit updates recency order in LRU without evicting any pages.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Page 1 is evicted to disk immediately because the page table is full.',
                        'explanation': 'Incorrect! Since page 3 is already resident, no eviction is necessary.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'The simulator crashes with a MemoryError.',
                        'explanation': 'Nonsense! A hit is the optimal fast path in virtual memory.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Implement the simulator using the pre-loaded starter below and run your test suite.',
            },
            'controls': [
                {
                    'id': 'run_verification',
                    'label': 'Execute Full OS Kernel Simulation Tests',
                    'type': 'button',
                    'default': True,
                    'description': 'Run comprehensive test suite against LRU and FIFO implementations',
                },
            ],
            'lab_starter_code': data.get('starter_code', ''),
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Kernel Memory Simulator Sandbox'},
        },
    ]

    data['journey'] = journey
    QuestionContent(**data)
    path.write_text(yaml.dump(data, sort_keys=False))
    print(f'Successfully injected {len(journey)} stages into {path}')

def inject_w27_deadlocks():
    path = Path('content/questions/27-locks-deadlocks/deadlock-cycle-detector.yaml')
    data = yaml.safe_load(path.read_text())

    journey = [
        {
            'id': 'w27_s1_mutual_exclusion',
            'title': 'Mutual Exclusion & Race Conditions (Why We Lock)',
            'subtitle': 'The non-atomic nature of CPU memory increments and lost updates',
            'scenario': 'Two threads increment a shared counter variable count = count + 1 1,000 times concurrently without a mutex. What happens to the final value?',
            'mechanism': 'Incrementing is not an atomic CPU instruction: it involves 1. Read memory to register, 2. Add 1, 3. Write register to memory. An interleaved thread context switch overwrites updates, causing lost increments. Mutexes enforce mutual exclusion so only one thread enters the critical section.',
            'prediction': {
                'prompt': 'If Thread A and Thread B each increment a shared counter 1,000 times without locks on a multi-core machine, what is the final counter value?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Less than 2,000 (often 1,200 to 1,600) due to race condition overwrites.',
                        'explanation': 'Correct! Without mutual exclusion, interleaved reads and writes overwrite each other, causing lost updates.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Exactly 2,000 every single time.',
                        'explanation': 'Misconception! Without synchronization, race conditions make deterministic results impossible.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Always 0 because concurrent writes cancel each other out.',
                        'explanation': 'Incorrect! The value increments, but loses dozens or hundreds of operations due to clobbered registers.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Locks are essential to enforce mutual exclusion on shared mutable state. However, introducing multiple locks creates the risk of Deadlocks.',
            },
            'controls': [
                {
                    'id': 'thread_count',
                    'label': 'Concurrent Threads',
                    'type': 'slider',
                    'default': 2,
                    'min': 2,
                    'max': 8,
                    'step': 1,
                    'description': 'Number of threads competing for critical section',
                },
                {
                    'id': 'mutex_enabled',
                    'label': 'Mutex Lock Enabled',
                    'type': 'toggle',
                    'default': False,
                    'description': 'Acquire exclusive lock before modifying shared state',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Thread Race Condition & Interleaved CPU Assembly'},
        },
        {
            'id': 'w27_s2_coffman_conditions',
            'title': 'The 4 Coffman Conditions for System Deadlock',
            'subtitle': 'The mathematical requirements that produce permanent thread freezes',
            'scenario': 'When does a multi-threaded system freeze in an unrecoverable deadlock?',
            'mechanism': 'Deadlock can occur if and only if all four Coffman conditions hold simultaneously: 1. Mutual Exclusion (resources held exclusively), 2. Hold and Wait (processes holding resources request new ones), 3. No Preemption (resources cannot be forcibly taken), 4. Circular Wait (a closed cycle of processes waiting for each other).',
            'prediction': {
                'prompt': 'If you break ANY ONE of the four Coffman conditions in an operating system, can a deadlock still occur?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'No! All 4 conditions are strictly required simultaneously; breaking any single condition makes deadlock mathematically impossible.',
                        'explanation': 'Correct! Deadlock prevention algorithms focus on eliminating at least one Coffman condition (most commonly Circular Wait).',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Yes, deadlocks can occur spontaneously due to CPU overheating.',
                        'explanation': 'Incorrect! Deadlock is a logical scheduling and synchronization state, not a thermal fault.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Yes, breaking Circular Wait only delays the deadlock rather than preventing it.',
                        'explanation': 'Misconception! Without circular wait, the resource allocation graph is a directed acyclic graph (DAG), which can never deadlock.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Operating system and database architects prevent deadlocks by designing protocols that eliminate at least one Coffman condition.',
            },
            'controls': [
                {
                    'id': 'circular_wait_permitted',
                    'label': 'Circular Wait Allowed',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Permit arbitrary circular locking patterns',
                },
                {
                    'id': 'preemption_permitted',
                    'label': 'Resource Preemption Allowed',
                    'type': 'toggle',
                    'default': False,
                    'description': 'Kernel can forcibly seize lock from waiting thread',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Coffman Conditions Matrix'},
        },
        {
            'id': 'w27_s3_wait_for_graphs',
            'title': 'Resource Allocation Graphs ➔ Wait-For Graphs (WFG)',
            'subtitle': 'Modeling threads and locks as a directed dependency graph',
            'scenario': 'How do database engines (PostgreSQL, MySQL InnoDB) and OS kernels monitor locks to detect deadlocks programmatically?',
            'mechanism': 'The kernel collapses the bipartite Resource Allocation Graph (threads and locks) into a directed Wait-For Graph (WFG) where nodes are threads. If Thread A requests a lock currently allocated to Thread B, a directed edge T_A -> T_B is added. For single-unit resources, a directed cycle in the WFG is necessary and sufficient for deadlock.',
            'prediction': {
                'prompt': 'If Thread 1 holds Lock A and requests Lock B, while Thread 2 holds Lock B and requests Lock A, what does the Wait-For Graph look like?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'A 2-node cycle: T1 -> T2 and T2 -> T1, proving an unresolvable circular deadlock.',
                        'explanation': 'Correct! T1 is waiting for T2 (owner of Lock B), and T2 is waiting for T1 (owner of Lock A). Neither can proceed.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'A disconnected graph with no edges.',
                        'explanation': 'Incorrect! Lock requests create directed dependencies between the requesting thread and the holding thread.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'A self-loop on Lock A.',
                        'explanation': 'Misconception! In a Wait-For Graph, nodes represent threads, not locks.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Wait-For Graphs transform the deadlock problem into a classic graph problem: detecting directed cycles.',
            },
            'controls': [
                {
                    'id': 'scenario_preset',
                    'label': 'Lock Scenario',
                    'type': 'select',
                    'default': 'Classic Deadlock',
                    'options': ['Classic Deadlock', 'Chain No Cycle', '3-Thread Cycle'],
                    'description': 'Simulated thread lock allocations and requests',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Wait-For Graph (WFG) Directed Graph Canvas'},
        },
        {
            'id': 'w27_s4_three_color_dfs',
            'title': '3-Color DFS Cycle Detection (White ➔ Gray ➔ Black)',
            'subtitle': 'Detecting circular wait in O(V + E) time without infinite recursion',
            'scenario': 'How does the operating system detect cycles in a Wait-For Graph without falling into an infinite loop during graph traversal?',
            'mechanism': 'The kernel uses 3-color Depth-First Search: 0 (White: unvisited), 1 (Gray: currently in the active recursion call stack), 2 (Black: fully explored with all descendants verified acyclic). If DFS visits a node that is currently Gray, it has found a back-edge pointing to an active ancestor — confirming a directed cycle in O(V + E) time.',
            'prediction': {
                'prompt': 'During DFS traversal of a Wait-For Graph, which node color encounter indicates that a directed cycle exists?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Encountering a Gray (visiting) node, indicating a back-edge to an active ancestor in the recursion call stack.',
                        'explanation': 'Correct! A Gray node is currently in the active traversal stack; encountering it means a closed loop has been formed.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Encountering a Black (visited) node, meaning the search reached a finished branch.',
                        'explanation': 'Incorrect! A Black node has already been completely explored and certified free of cycles.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Encountering a White (unvisited) node.',
                        'explanation': 'Incorrect! White nodes are simply unvisited vertices waiting to be explored.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': '3-color DFS allows database engines like PostgreSQL to run deadlock detection asynchronously every deadlock_timeout (default 1000ms) with minimal CPU overhead.',
            },
            'controls': [
                {
                    'id': 'step_traversal',
                    'label': 'Step DFS Traversal',
                    'type': 'button',
                    'default': True,
                    'description': 'Advance DFS step-by-step watching White -> Gray -> Black transitions',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': '3-Color DFS Recursion Stack Trace'},
        },
        {
            'id': 'w27_s5_hierarchical_lock_ordering',
            'title': 'Deadlock Prevention: Hierarchical Global Lock Ordering',
            'subtitle': 'Eliminating circular wait by design in production architectures',
            'scenario': 'Instead of letting threads deadlock and killing one after a timeout, how can high-performance distributed systems prevent deadlocks entirely?',
            'mechanism': 'Establish a global total ordering on all locks (e.g. by sorting lock IDs lexicographically: Lock_1 < Lock_2 < Lock_3). Every thread in the system must acquire locks in strictly increasing order. If Thread A holds Lock 1 and needs Lock 2, it acquires Lock 2. If Thread B needs both, it CANNOT acquire Lock 2 first. Circular wait becomes mathematically impossible.',
            'prediction': {
                'prompt': 'If all threads in an application are strictly required to acquire locks in sorted order (Lock A before Lock B, Lock B before Lock C), what happens to deadlocks?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Deadlocks are mathematically impossible because circular wait cannot form in an acyclic directed resource hierarchy.',
                        'explanation': 'Correct! Hierarchical lock acquisition transforms the resource dependency graph into a DAG, completely eliminating circular wait.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Deadlocks happen twice as often because all threads queue for Lock A first.',
                        'explanation': 'Misconception! Threads may queue (contention), but they will never deadlock (permanent circular freeze).',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Locks become volatile and lose mutual exclusion guarantees.',
                        'explanation': 'Incorrect! Mutual exclusion is preserved; only the acquisition sequence is disciplined.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Hierarchical lock ordering is the gold-standard design pattern used in Linux kernel spinlocks, database transaction managers, and concurrent systems to prevent deadlocks proactively.',
            },
            'controls': [
                {
                    'id': 'enforce_lock_ordering',
                    'label': 'Enforce Global Lock Ordering',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Sort lock acquisitions by global resource ID',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Lock Hierarchy DAG vs Unordered Circular Wait'},
        },
        {
            'id': 'w27_s6_transfer_challenge',
            'title': 'Transfer Challenge: OS Wait-For Graph Cycle Detector',
            'subtitle': 'Build the kernel deadlock detector using 3-color DFS',
            'scenario': 'Implement `detect_deadlock(allocations: dict[str, str], requests: list[list[str]]) -> dict` to construct the Wait-For Graph and detect deadlocked threads.',
            'mechanism': 'Parse lock allocations and pending requests. Build the directed graph of thread dependencies. Run 3-color DFS in lexicographical thread order to detect cycles, extracting the cycle path and unique deadlocked threads.',
            'prediction': {
                'prompt': 'Given allocations {"L1": "T1", "L2": "T2"} and requests [["T1", "L2"], ["T2", "L1"]], what does detect_deadlock return?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': '{"has_deadlock": True, "cycle": ["T1", "T2", "T1"], "deadlocked_threads": ["T1", "T2"]}',
                        'explanation': 'Correct! T1 waits for T2 (holder of L2), and T2 waits for T1 (holder of L1), forming a direct cycle.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': '{"has_deadlock": False, "cycle": [], "deadlocked_threads": []}',
                        'explanation': 'Incorrect! Both threads are mutually blocked waiting for each other\'s locks.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': '{"has_deadlock": True, "cycle": ["L1", "L2"], "deadlocked_threads": ["L1", "L2"]}',
                        'explanation': 'Incorrect! The Wait-For Graph connects threads, not locks.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Implement the cycle detector in the code editor below and verify with all test cases.',
            },
            'controls': [
                {
                    'id': 'run_verification',
                    'label': 'Run Full Deadlock Detection Test Suite',
                    'type': 'button',
                    'default': True,
                    'description': 'Execute test suite validating cycle detection and acyclic chains',
                },
            ],
            'lab_starter_code': data.get('starter_code', ''),
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Wait-For Graph Cycle Detector Sandbox'},
        },
    ]

    data['journey'] = journey
    QuestionContent(**data)
    path.write_text(yaml.dump(data, sort_keys=False))
    print(f'Successfully injected {len(journey)} stages into {path}')

def inject_w28_gil():
    path = Path('content/questions/19-os-concurrency/python-gil-contention.yaml')
    data = yaml.safe_load(path.read_text())

    journey = [
        {
            'id': 'w28_s1_refcounting_gil',
            'title': 'CPython Reference Counting & The Need for the GIL',
            'subtitle': 'Why Python wraps the bytecode interpreter in a global mutual exclusion lock',
            'scenario': 'In CPython, memory cleanup relies on reference counting (ob_refcnt, Py_INCREF, Py_DECREF). Why does this necessitate the Global Interpreter Lock (GIL)?',
            'mechanism': 'Incrementing and decrementing ob_refcnt is not atomic in standard C. Without locking, two threads reading and updating ob_refcnt simultaneously cause race conditions: an object with active references could have its refcount drop to 0 and be freed prematurely (use-after-free vulnerability), or memory can be leaked indefinitely. The GIL solves this globally by ensuring only one thread executes bytecode at a time.',
            'prediction': {
                'prompt': 'What happens if multiple native OS threads modify CPython object reference counts concurrently without the GIL or atomic operations?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Race conditions corrupt ob_refcnt, triggering heap corruption, segmentation faults, and use-after-free security vulnerabilities.',
                        'explanation': 'Correct! Reference counting without locks is not thread-safe; concurrent access can cause memory corruption or crashes.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'CPython automatically converts all variables into atomic CPU registers without overhead.',
                        'explanation': 'Misconception! Atomic CPU instructions on every increment/decrement would add substantial performance overhead to single-threaded code.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Python switches to Java\'s generational garbage collector automatically.',
                        'explanation': 'Incorrect! CPython is written in C and uses reference counting paired with a cyclic garbage collector.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'The GIL was introduced in CPython to make single-threaded execution fast and C extension integration simple, at the cost of serializing multi-threaded bytecode execution.',
            },
            'controls': [
                {
                    'id': 'thread_count',
                    'label': 'OS Thread Count',
                    'type': 'slider',
                    'default': 4,
                    'min': 1,
                    'max': 8,
                    'step': 1,
                    'description': 'Number of native threads attempting to execute Python bytecode',
                },
                {
                    'id': 'atomic_refcount',
                    'label': 'Atomic Refcounting Enabled',
                    'type': 'toggle',
                    'default': False,
                    'description': 'Use atomic instructions instead of GIL mutex',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'CPython PyObject Reference Counting & GIL Architecture'},
        },
        {
            'id': 'w28_s2_cpu_bound_threads',
            'title': 'The CPU-Bound Multithreading Paradox (1 Core Ceiling)',
            'subtitle': 'Why adding 8 threads to an 8-core CPU can make Python code run slower',
            'scenario': 'You run a CPU-intensive mathematical loop (calculating prime numbers) on an 8-core server. You split the workload across 8 threads using threading.Thread. How does total wall-clock time compare to 1 thread?',
            'mechanism': 'Because the GIL prevents simultaneous bytecode execution, all 8 threads take turns acquiring the GIL, running for a switch interval (default 5ms), and releasing it. The 8 threads must serialize onto a single CPU core. Furthermore, OS thread context-switching overhead, cache thrashing, and lock contention make the 8-thread run SLOWER than a single thread.',
            'prediction': {
                'prompt': 'How does running an intensive CPU-bound computation across 8 Python threads compare to 1 Python thread on an 8-core machine?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'The 8-thread program is actually slower or at best equal, utilizing only 100% of 1 core (out of 800%) due to GIL lock serialization and context switching.',
                        'explanation': 'Correct! All 8 threads fight for the single interpreter lock, wasting CPU cycles in lock contention while executing on only 1 physical core.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'It runs 8x faster because modern OS schedulers bypass Python locks automatically.',
                        'explanation': 'Misconception! The OS kernel scheduler cannot bypass the GIL mutex inside the CPython process.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'It utilizes 800% CPU capacity with zero context switching.',
                        'explanation': 'Incorrect! Pure Python bytecode cannot execute on multiple cores concurrently within a single interpreter.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Threading in Python does not provide multi-core parallelism for CPU-bound tasks. In fact, thread contention adds overhead that degrades performance.',
            },
            'controls': [
                {
                    'id': 'worker_count',
                    'label': 'Worker Threads',
                    'type': 'slider',
                    'default': 8,
                    'min': 1,
                    'max': 16,
                    'step': 1,
                    'description': 'Number of threads competing for single interpreter GIL',
                },
                {
                    'id': 'task_workload',
                    'label': 'Workload Type',
                    'type': 'select',
                    'default': 'CPU-Bound',
                    'options': ['CPU-Bound', 'I/O-Bound'],
                    'description': 'Type of computational workload',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'GIL Lock Contention & Core Serialization Timeline'},
        },
        {
            'id': 'w28_s3_io_bound_release',
            'title': 'I/O-Bound Workloads & Voluntary GIL Release',
            'subtitle': 'Why threading and asyncio excel for networking and disk operations',
            'scenario': 'You have 100 concurrent HTTP requests fetching device screenshots from remote mobile testing farms. Each spends 95% of its time waiting for network packets. If you use 100 threads, does the GIL block them?',
            'mechanism': 'Before initiating blocking system calls (like recv(), select(), or disk reads), CPython executes Py_BEGIN_ALLOW_THREADS, dropping the GIL. While Thread 1 waits on socket I/O, Thread 2 acquires the GIL and submits its request. Thus, I/O-bound multithreading in Python achieves true concurrency.',
            'prediction': {
                'prompt': 'When a Python thread makes a blocking network socket call (e.g. requests.get() or database query), what happens to the GIL?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'The thread voluntarily releases the GIL before waiting on the socket, allowing other threads to run Python code concurrently.',
                        'explanation': 'Correct! Standard library I/O calls drop the GIL during kernel syscalls so other Python threads can execute.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The thread holds the GIL until all data packets arrive, freezing all other threads.',
                        'explanation': 'Misconception! If this were true, Python could not handle concurrent web servers. The GIL is released during I/O waits.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'The GIL crashes because sockets are incompatible with Python bytecode.',
                        'explanation': 'Nonsense! Networking and sockets are fundamental capabilities of Python.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Because I/O releases the GIL, Python threads and asyncio coroutines are exceptionally effective for high-concurrency network servers and database clients.',
            },
            'controls': [
                {
                    'id': 'concurrent_requests',
                    'label': 'Concurrent Network Requests',
                    'type': 'slider',
                    'default': 50,
                    'min': 10,
                    'max': 200,
                    'step': 10,
                    'description': 'Number of concurrent HTTP calls in flight',
                },
                {
                    'id': 'network_latency_ms',
                    'label': 'Network Round-Trip Latency (ms)',
                    'type': 'slider',
                    'default': 50,
                    'min': 10,
                    'max': 500,
                    'step': 10,
                    'description': 'Time spent in kernel socket wait outside the GIL',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'I/O Concurrency: Voluntary GIL Release & Overlapping Waits'},
        },
        {
            'id': 'w28_s4_multiprocessing_vs_threading',
            'title': 'Multiprocessing vs Threading vs Asyncio Architectural Trade-offs',
            'subtitle': 'Choosing the right concurrency model for memory, IPC, and core utilization',
            'scenario': 'Drizz Mobile needs to choose an architecture for: A) 1,000 concurrent REST API calls, and B) 8-core OCR image edge detection. Which concurrency model fits each?',
            'mechanism': 'asyncio: Single-threaded event loop utilizing non-blocking OS I/O primitives (epoll/kqueue). Lowest memory footprint (~2KB per coroutine), ideal for massive I/O concurrency. threading: Native OS threads (~8MB stack each). Good for I/O when synchronous legacy libraries are required, but limited by GIL for CPU tasks. multiprocessing: Spawns separate OS processes via fork/spawn. Each process has its own Python interpreter and GIL, providing true multi-core CPU scaling, but incurs memory duplication and IPC serialization overhead.',
            'prediction': {
                'prompt': 'For an OCR image processing pipeline that needs to max out an 8-core CPU, which concurrency primitive must be used in Python?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'multiprocessing (or ProcessPoolExecutor), because each process has an independent interpreter and GIL running across physical cores.',
                        'explanation': 'Correct! Spawning separate OS processes provides each worker with its own Python interpreter and GIL, achieving true 8-core scaling.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'asyncio, because async code automatically runs on all CPU cores simultaneously.',
                        'explanation': 'Misconception! asyncio is strictly single-threaded; coroutines run cooperatively on a single core.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'threading, because threads share memory without any overhead.',
                        'explanation': 'Incorrect! As demonstrated in Stage 2, CPU-bound threads in Python serialize on 1 core due to the GIL.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Architectural Rule: Use asyncio for high-throughput I/O; use multiprocessing or external C extensions for CPU-bound multi-core workloads.',
            },
            'controls': [
                {
                    'id': 'target_workload',
                    'label': 'Target Workload',
                    'type': 'select',
                    'default': 'CPU-Bound',
                    'options': ['CPU-Bound', 'I/O-Bound'],
                    'description': 'Select workload profile to evaluate architecture',
                },
                {
                    'id': 'chosen_runtime',
                    'label': 'Selected Runtime',
                    'type': 'select',
                    'default': 'multiprocessing',
                    'options': ['multiprocessing', 'threading', 'asyncio'],
                    'description': 'Concurrency model to evaluate',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Concurrency Decision Matrix: Memory vs Multi-Core Scaling'},
        },
        {
            'id': 'w28_s5_free_threading_extensions',
            'title': 'Bypassing the GIL: C Extensions & Python 3.13t Free-Threading',
            'subtitle': 'How NumPy releases the GIL and how PEP 703 eliminates the lock entirely',
            'scenario': 'Modern data science libraries like NumPy, PyTorch, and Polars execute matrix operations in parallel across all CPU cores without multiprocessing. How? And what is Python 3.13t?',
            'mechanism': '1. C Extensions: Operations like numpy.dot() drop the GIL at the C level using Py_BEGIN_ALLOW_THREADS, execute parallel OpenMP/BLAS loops across all hardware cores, and re-acquire the GIL before returning to Python. 2. PEP 703 Free-Threaded Python (3.13t): Python 3.13 introduces an experimental build (--disable-gil) that disables the GIL entirely, replacing coarse locking with mimalloc thread-safe memory allocators, biased reference counting, and immortal objects.',
            'prediction': {
                'prompt': 'How does NumPy run multi-threaded matrix multiplications across all CPU cores in a standard Python process?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'NumPy drops the GIL at the C level (Py_BEGIN_ALLOW_THREADS), executes hardware-accelerated C/BLAS threads across all cores, and re-acquires the GIL before returning.',
                        'explanation': 'Correct! Compiled C extensions can release the GIL during pure computational loops, bypassing interpreter serialization.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'NumPy forces the Linux kernel to rewrite the Python bytecode interpreter in assembly.',
                        'explanation': 'Incorrect! NumPy uses standard C API hooks provided by CPython to release and re-acquire the GIL.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'NumPy runs inside a virtual machine that ignores CPU registers.',
                        'explanation': 'Nonsense! NumPy executes native compiled machine code optimized for CPU SIMD/AVX instructions.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'When building high-performance Python systems, developers either offload heavy computation to C/Rust extensions that release the GIL, or deploy on free-threaded Python 3.13t.',
            },
            'controls': [
                {
                    'id': 'library_type',
                    'label': 'Implementation',
                    'type': 'select',
                    'default': 'NumPy C Extension',
                    'options': ['NumPy C Extension', 'Pure Python Loop'],
                    'description': 'Code implementation type',
                },
                {
                    'id': 'python_runtime',
                    'label': 'CPython Runtime',
                    'type': 'select',
                    'default': 'CPython 3.12 (Standard GIL)',
                    'options': ['CPython 3.12 (Standard GIL)', 'Python 3.13t (Free-Threaded No GIL)'],
                    'description': 'Interpreter runtime configuration',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'C Extension GIL Release vs Free-Threaded PEP 703 Architecture'},
        },
        {
            'id': 'w28_s6_transfer_challenge',
            'title': 'Transfer Challenge: OS Concurrency Workload Advisor',
            'subtitle': 'Build the automated concurrency classifier and scaling advisor',
            'scenario': 'Implement `classify_concurrency_workload(workload_type: str, worker_count: int) -> dict` to inspect workload characteristics and recommend the optimal runtime strategy.',
            'mechanism': 'Detect CPU-bound vs I/O-bound workloads, determine GIL contention, compute core utilization, and return architectural guidance.',
            'prediction': {
                'prompt': 'If workload_type is "cpu_bound" with worker_count = 4, what should the concurrency advisor return?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'gil_contention: True, recommended_runtime: "multiprocessing", core_utilization: 4, and summary explaining single-core GIL serialization.',
                        'explanation': 'Correct! CPU-bound tasks require multiprocessing to escape the GIL and utilize 4 independent cores.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'gil_contention: False, recommended_runtime: "asyncio", core_utilization: 1.',
                        'explanation': 'Incorrect! That is the recommendation for I/O-bound workloads.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'recommended_runtime: "threading", core_utilization: 16.',
                        'explanation': 'Incorrect! Threading on CPU-bound workloads suffers severe GIL contention and utilizes only 1 core.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Implement the workload classifier using the pre-loaded starter below and verify against the test suite.',
            },
            'controls': [
                {
                    'id': 'run_verification',
                    'label': 'Run Full Concurrency Classifier Tests',
                    'type': 'button',
                    'default': True,
                    'description': 'Verify classifier handles cpu_bound, io_bound, worker scaling, and error cases',
                },
            ],
            'lab_starter_code': data.get('starter_code', ''),
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'OS Concurrency Advisor Sandbox'},
        },
    ]

    data['journey'] = journey
    QuestionContent(**data)
    path.write_text(yaml.dump(data, sort_keys=False))
    print(f'Successfully injected {len(journey)} stages into {path}')

if __name__ == '__main__':
    inject_w42_virtual_memory()
    inject_w27_deadlocks()
    inject_w28_gil()
    print('All Phase 4 Journeys injected and validated successfully!')
