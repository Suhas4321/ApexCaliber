import yaml
from pathlib import Path
from app.content_schema import QuestionContent

def inject_w17_storage():
    path = Path('content/questions/17-dbms-storage/heap-pages-and-scans.yaml')
    data = yaml.safe_load(path.read_text())

    journey = [
        {
            'id': 'w17_s1_flat_file_illusion',
            'title': 'The Flat File Illusion & The 8KB Disk Block Boundary',
            'subtitle': 'Why relational databases cannot read or write individual bytes directly to disk',
            'scenario': 'When storing 10,000,000 user rows, why can\'t a database engine read and write individual bytes directly to disk like a simple text file?',
            'mechanism': 'Physical storage devices (NVMe SSDs and HDDs) operate in discrete physical blocks. Databases organize data into fixed-size Pages (typically 8KB). A database engine cannot read less than one full 8KB page from disk at a time.',
            'prediction': {
                'prompt': 'If a row is 100 bytes in size and you query for 1 row on an unindexed table, how much physical disk data must the storage engine load into RAM?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'At least 8KB (one complete disk page), and potentially every single 8KB page in the table if unindexed.',
                        'explanation': 'Correct! Database I/O is strictly page-oriented; the storage engine reads complete 8KB blocks into the buffer pool.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Exactly 100 bytes, because modern SSDs support byte-level addressing.',
                        'explanation': 'Misconception! SSD block controllers transfer data in pages (typically 4KB to 16KB), never individual bytes.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': '0 bytes, because SQL queries execute directly on the hardware disk controller.',
                        'explanation': 'Incorrect! The database process must load pages into CPU RAM to evaluate WHERE filters.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Relational databases are page-buffered storage engines. All I/O occurs at the granularity of fixed 8KB disk blocks.',
            },
            'controls': [
                {
                    'id': 'table_rows',
                    'label': 'Table Record Count',
                    'type': 'slider',
                    'default': 1000,
                    'min': 100,
                    'max': 10000,
                    'step': 100,
                    'description': 'Simulate number of records stored in disk pages',
                },
                {
                    'id': 'page_capacity',
                    'label': 'Records per 8KB Page',
                    'type': 'slider',
                    'default': 10,
                    'min': 2,
                    'max': 50,
                    'step': 2,
                    'description': 'Number of row slots accommodated per physical page',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': '8KB Disk Heap Page Layout'},
        },
        {
            'id': 'w17_s2_slotted_pages_ctid',
            'title': 'Slotted Heap Pages & Physical Tuple IDs (ctid)',
            'subtitle': 'How databases address variable-length records without scanning from the start of the page',
            'scenario': 'Inside an 8KB disk page, rows can be variable-length strings. How does the storage engine locate a row within a page without scanning from the top?',
            'mechanism': 'Slotted page architecture: The page header holds an array of item pointers (offsets). Tuples grow upward from the bottom of the page. Every row has a physical address called a Tuple ID: ctid = (page_number, slot_index).',
            'prediction': {
                'prompt': 'What happens to a row\'s physical ctid in PostgreSQL when you execute an UPDATE that increases its text size beyond remaining page space?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Because the row cannot fit in the existing page, MVCC inserts the new row version into another page, changing its ctid.',
                        'explanation': 'Correct! In PostgreSQL, updates write a new tuple version, which frequently moves to a new page with a new ctid.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The row\'s ctid is an immutable primary key that can never change under any circumstance.',
                        'explanation': 'Misconception! ctid is a physical storage coordinate, not a logical primary key.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'The operating system expands the 8KB page to 16KB dynamically on disk.',
                        'explanation': 'Incorrect! Database page sizes are fixed at compile time (typically 8KB).',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Physical tuple addresses (ctid) represent volatile block coordinates, which is why indexes point to ctids rather than physical byte offsets.',
            },
            'controls': [
                {
                    'id': 'variable_text_size_bytes',
                    'label': 'Record Text Payload Size (Bytes)',
                    'type': 'slider',
                    'default': 256,
                    'min': 64,
                    'max': 2048,
                    'step': 64,
                    'description': 'Simulate tuple payload expansion triggering page overflow',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Slotted Page Header & Offsets'},
        },
        {
            'id': 'w17_s3_seq_scans_buffer_pool',
            'title': 'Sequential Table Scans & Buffer Pool Eviction',
            'subtitle': 'Why an unindexed query pollutes RAM and slows down unrelated application queries',
            'scenario': 'What happens to the database buffer pool cache when a developer runs an unindexed query across a 50GB table?',
            'mechanism': 'The storage engine loads Page 0, Page 1, Page 2... into the shared buffer pool in RAM. Hot cache pages (like frequently queried user profiles) are evicted to make room for cold pages read during the sequential scan, causing a global latency spike across all application queries.',
            'prediction': {
                'prompt': 'Why does a Sequential Scan on an unindexed table hurt other completely unrelated queries running on the same database?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'The sequential scan floods the shared buffer pool cache with single-use pages, evicting hot cached data and forcing other queries to read from slow disk.',
                        'explanation': 'Correct! Cache pollution degrades buffer pool hit ratios across the entire database.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Sequential scans lock the entire operating system kernel.',
                        'explanation': 'Incorrect! Sequential scans run in user-space DBMS processes.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Unindexed queries consume all available TCP network sockets.',
                        'explanation': 'Incorrect! Socket counts are unrelated to internal table scanning.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Buffer pool pollution from unindexed full table scans is the #1 cause of sudden database I/O saturation.',
            },
            'controls': [
                {
                    'id': 'buffer_pool_capacity_pages',
                    'label': 'Buffer Pool Size (Pages)',
                    'type': 'slider',
                    'default': 50,
                    'min': 10,
                    'max': 200,
                    'step': 10,
                    'description': 'Available RAM buffer pool frame capacity',
                },
                {
                    'id': 'unindexed_scan_active',
                    'label': 'Execute Full Sequential Scan',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Toggle full-table sequential scan vs indexed lookup',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Buffer Pool Cache Eviction'},
        },
        {
            'id': 'w17_s4_btree_direct_seeks',
            'title': 'B-Tree Indexes & O(log N) Direct Page Traversal',
            'subtitle': 'How auxiliary trees turn 500,000 page scans into 3 direct page reads',
            'scenario': 'How does an index avoid scanning thousands of 8KB disk pages?',
            'mechanism': 'A B-Tree index is an auxiliary sorted tree where leaf nodes store (indexed_value, ctid). The database traverses root -> internal branch -> leaf page in O(log N) page reads (typically 3 to 4 I/O operations), and then fetches the exact single heap page using the ctid.',
            'prediction': {
                'prompt': 'For a table with 10,000,000 rows across 500,000 heap pages, how many disk page reads does a B-Tree index lookup require to find a single user?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Approximately 3 to 4 page reads (tree height + 1 heap page read).',
                        'explanation': 'Correct! B-Tree fanouts of 100+ allow searching millions of keys in 3 to 4 logarithmic hops.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Approximately 250,000 page reads (half the table).',
                        'explanation': 'Misconception! 250,000 reads is the average cost of an unindexed sequential scan.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Exactly 1 page read for all table sizes.',
                        'explanation': 'Incorrect! The index tree itself has internal branch pages that must be traversed.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'High-fanout B-Trees ensure that even multi-terabyte tables can locate any key with fewer than 5 physical page reads.',
            },
            'controls': [
                {
                    'id': 'btree_fanout',
                    'label': 'B-Tree Node Fanout',
                    'type': 'slider',
                    'default': 100,
                    'min': 10,
                    'max': 500,
                    'step': 10,
                    'description': 'Number of pointer keys per index branch page',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'B-Tree Index Traversal'},
        },
        {
            'id': 'w17_s5_composite_leftmost_prefix',
            'title': 'Composite Indexes: Leftmost Prefix & Skip Scans',
            'subtitle': 'Why querying on the second column alone challenges the query planner',
            'scenario': 'You create an index on (country, signup_date, user_id). A query filters on signup_date only. Does the database use the index?',
            'mechanism': 'Traditional leftmost prefix rule: B-Trees sort lexicographically by the first column. Without country, the index cannot be traversed in a single logarithmic seek. However, modern engines (PostgreSQL/SQLite) can perform an Index Skip Scan if the leading column has low cardinality.',
            'prediction': {
                'prompt': 'When querying on (signup_date = \'2026-01-01\') against an index (country, signup_date), why is the query planner reluctant to use a standard B-Tree seek?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Because the B-Tree is sorted first by country; records with that date are scattered across every country branch, preventing a single contiguous range scan.',
                        'explanation': 'Correct! Without the leading column, matching records are dispersed across independent subtrees.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Because dates cannot be stored in B-Tree data structures.',
                        'explanation': 'Incorrect! B-Trees can index dates, numbers, strings, and UUIDs.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Because composite indexes only support single-column equality checks.',
                        'explanation': 'Incorrect! Composite indexes excel at multi-column range queries when following leftmost order.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Understanding leftmost prefix semantics ensures developers design composite indexes that match real production query filters.',
            },
            'controls': [
                {
                    'id': 'leading_col_cardinality',
                    'label': 'Country Column Distinct Values',
                    'type': 'slider',
                    'default': 5,
                    'min': 2,
                    'max': 50,
                    'step': 1,
                    'description': 'Low cardinality enables skip-scans; high cardinality forces sequential table scans',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Composite Index Prefix Matrix'},
        },
        {
            'id': 'w17_s6_transfer_challenge',
            'title': 'Transfer Challenge: In-Memory Slotted Heap Page Scanner',
            'subtitle': 'Implement the physical page partitioning and sequential scanner in Python',
            'scenario': 'Build a disk storage engine simulator in Python: pack records into fixed-capacity 8KB pages, assign physical ctid = (page, slot) coordinates, simulate sequential scan page I/O, and measure page access efficiency.',
            'mechanism': 'The scanner organizes records into pages of page_capacity. It simulates sequential I/O by loading page 0, page 1... until search_id is matched or the table is exhausted.',
            'prediction': {
                'prompt': 'When searching for record id=45 in a table with page_capacity=10, which physical page index and slot index does the scanner find it in?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Page 4, Slot 5 (ctid = [4, 5]).',
                        'explanation': 'Correct! 45 // 10 = 4 (page index) and 45 % 10 = 5 (slot index).',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Page 5, Slot 4.',
                        'explanation': 'Incorrect! Page index is determined by integer division.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Page 0, Slot 45.',
                        'explanation': 'Incorrect! Each page holds at most 10 records.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Physical ctid arithmetic directly connects logical query execution with disk block layout.',
            },
            'controls': [
                {
                    'id': 'target_search_id',
                    'label': 'Target Record ID',
                    'type': 'slider',
                    'default': 45,
                    'min': 0,
                    'max': 99,
                    'step': 1,
                    'description': 'Search target to measure pages scanned before termination',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Heap Scanner Production Runner'},
            'lab_starter_code': '''class Solution:
    def simulate_heap_scan(self, records: list[dict], page_capacity: int, search_id: int) -> dict:
        # Implement 8KB Slotted Heap Page Scanner
        pass
''',
            'lab_solution': '''class Solution:
    def simulate_heap_scan(self, records: list[dict], page_capacity: int, search_id: int) -> dict:
        if not records:
            return {"total_pages": 0, "pages_scanned": 0, "found": False, "ctid": None}

        # Partition records into pages
        pages = []
        for i in range(0, len(records), page_capacity):
            pages.append(records[i:i + page_capacity])

        total_pages = len(pages)
        pages_scanned = 0
        found = False
        ctid = None

        for page_idx, page in enumerate(pages):
            pages_scanned += 1
            for slot_idx, record in enumerate(page):
                if record["id"] == search_id:
                    found = True
                    ctid = [page_idx, slot_idx]
                    break
            if found:
                break

        return {
            "total_pages": total_pages,
            "pages_scanned": pages_scanned,
            "found": found,
            "ctid": ctid,
        }
''',
        },
    ]

    data['journey'] = journey
    validated = QuestionContent.model_validate(data)
    with open(path, 'w') as f:
        yaml.dump(data, f, sort_keys=False, allow_unicode=True)
    print(f"World 17 validated and saved! ({len(validated.journey)} stages)")

def inject_w25_acid():
    path = Path('content/questions/25-transactions-acid/sql-acid-money-transfer.yaml')
    data = yaml.safe_load(path.read_text())

    journey = [
        {
            'id': 'w25_s1_split_brain_transfers',
            'title': 'The Split-Brain Money Transfer & Atomicity',
            'subtitle': 'Why multi-step ledger updates require all-or-nothing execution boundaries',
            'scenario': 'Transferring ₹200 from Aarav to Priya requires two distinct operations: UPDATE Accounts SET balance = balance - 200 WHERE id = 1 and UPDATE Accounts SET balance = balance + 200 WHERE id = 2. What happens if the network drops between statement 1 and statement 2?',
            'mechanism': 'Without an explicit transaction boundary, each SQL update commits independently. A failure halfway through debits the sender while never crediting the recipient, creating phantom balance loss.',
            'prediction': {
                'prompt': 'If the power cuts off between two unfenced UPDATE statements during a bank transfer, what state is the ledger left in after reboot?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Corrupted state: the sender has lost ₹200, the recipient never received it, and total money in the system has decreased.',
                        'explanation': 'Correct! Unfenced operations violate Atomicity, leaving partial side-effects in storage.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The database automatically detects the intent and completes statement 2 upon reboot.',
                        'explanation': 'Impossible! Databases have no magical knowledge of subsequent intended queries.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'The database rolls back statement 1 automatically even without a transaction block.',
                        'explanation': 'Incorrect! In autocommit mode, statement 1 committed durably to disk.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'ACID Atomicity guarantees that a set of operations executes as an indivisible unit: either all succeed and commit, or all abort and roll back.',
            },
            'controls': [
                {
                    'id': 'simulate_crash_between_statements',
                    'label': 'Inject Crash Mid-Transfer',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Simulate power loss between debit and credit queries',
                },
                {
                    'id': 'wrap_in_transaction',
                    'label': 'Wrap in BEGIN ... COMMIT Block',
                    'type': 'toggle',
                    'default': False,
                    'description': 'Enforce atomic rollback boundaries',
                },
            ],
            'visualizer_type': 'sql_pipeline',
            'visualizer_config': {'title': 'Atomic Money Transfer Ledger'},
        },
        {
            'id': 'w25_s2_wal_crash_recovery',
            'title': 'Atomicity & The Write-Ahead Log (WAL) Crash Recovery',
            'subtitle': 'How relational databases survive sudden power loss without losing committed transactions',
            'scenario': 'How does a relational database ensure it never loses a committed transaction even if the operating system crashes seconds later?',
            'mechanism': 'Write-Ahead Logging (WAL): Before dirty 8KB heap pages are flushed to slow disk tables, changes are appended sequentially to the WAL log file. On reboot after a crash, the recovery process performs REDO for all committed transactions and UNDO for any uncommitted transactions.',
            'prediction': {
                'prompt': 'Why does a database write to the WAL on disk before modifying the actual table heap pages?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Sequential disk writes to WAL are orders of magnitude faster than random writes to scattered table pages, ensuring durability with minimal latency.',
                        'explanation': 'Correct! Appending sequential log records guarantees durability without stalling on random disk seeks.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'WAL files are stored in cloud object storage, not on physical disks.',
                        'explanation': 'Incorrect! WAL logs are written to high-speed local NVMe or SSD storage.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'The database cannot modify heap pages until the operating system restarts.',
                        'explanation': 'Incorrect! Buffer pool pages are modified in RAM continuously.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'WAL logging enables both high-throughput writes and rock-solid crash recovery.',
            },
            'controls': [
                {
                    'id': 'wal_sync_commit',
                    'label': 'Synchronous Commit (fsync to disk)',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Wait for physical disk flush before returning success',
                },
            ],
            'visualizer_type': 'sql_pipeline',
            'visualizer_config': {'title': 'Write-Ahead Log (WAL) Engine'},
        },
        {
            'id': 'w25_s3_dirty_reads_isolation',
            'title': 'Isolation Levels: Dirty Reads vs Non-Repeatable Reads',
            'subtitle': 'Understanding the 4 ANSI SQL isolation levels and read phenomena',
            'scenario': 'Transaction A transfers money and updates balance to ₹800. Transaction B reads the ₹800. Then Transaction A encounters an error and ROLLS BACK. What did Transaction B just see?',
            'mechanism': 'A Dirty Read occurs when a transaction reads uncommitted changes from another transaction. Under READ COMMITTED (PostgreSQL default), transactions only read rows that have been officially committed. Under REPEATABLE READ, a transaction sees a snapshot of the database as of the transaction start time.',
            'prediction': {
                'prompt': 'Under READ COMMITTED, can a transaction read row X, have another transaction modify and commit row X, and then read row X again and see different values?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Yes! That is the definition of a Non-Repeatable Read, which is permitted in Read Committed isolation.',
                        'explanation': 'Correct! In Read Committed, each SELECT statement takes a fresh snapshot of committed data.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'No, Read Committed prevents all concurrent row changes.',
                        'explanation': 'Misconception! Read Committed only prevents reading UNCOMMITTED data.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Yes, but only if the row is a foreign key.',
                        'explanation': 'Incorrect! Non-repeatable reads apply to any table column.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Read Committed balances high concurrency with dirty-read prevention, while Repeatable Read provides consistent point-in-time snapshots.',
            },
            'controls': [
                {
                    'id': 'isolation_tier',
                    'label': 'Transaction Isolation Level',
                    'type': 'select',
                    'default': 'READ_COMMITTED',
                    'options': ['READ_UNCOMMITTED', 'READ_COMMITTED', 'REPEATABLE_READ', 'SERIALIZABLE'],
                    'description': 'Select isolation level to evaluate concurrent visibility phenomena',
                },
            ],
            'visualizer_type': 'sql_pipeline',
            'visualizer_config': {'title': 'Isolation Levels & Read Anomalies'},
        },
        {
            'id': 'w25_s4_lost_updates_for_update',
            'title': 'The Lost Update Anomaly & Row-Level Locking (FOR UPDATE)',
            'subtitle': 'How concurrent read-modify-write patterns overwrite each other without locks',
            'scenario': 'Two concurrent customers click "Buy Last Ticket". Both read tickets = 1. Both compute tickets - 1 = 0. Both execute UPDATE tickets = 0. Two tickets were sold, but only one existed in inventory!',
            'mechanism': 'The Lost Update anomaly occurs under concurrent read-modify-write patterns. In PostgreSQL, using SELECT ... FOR UPDATE acquires an exclusive row-level write lock, forcing Transaction 2 to block until Transaction 1 commits.',
            'prediction': {
                'prompt': 'How does SELECT * FROM inventory WHERE id = 1 FOR UPDATE prevent two concurrent checkouts from overselling inventory?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'It locks the physical row in the buffer pool, forcing concurrent transactions trying to lock or update the same row to wait in a queue.',
                        'explanation': 'Correct! Row-level exclusive locks serialize concurrent updates on contested rows.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'It locks the entire database server, pausing all read queries across all tables.',
                        'explanation': 'Incorrect! Row-level locking locks only the filtered rows, allowing other tables to operate at full speed.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'It cancels the second user\'s credit card transaction immediately.',
                        'explanation': 'Incorrect! The second transaction waits for the lock; it can then observe tickets = 0 and fail gracefully.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Pessimistic row locking (FOR UPDATE) is the standard SQL mechanism for eliminating Lost Updates in high-concurrency checkouts.',
            },
            'controls': [
                {
                    'id': 'use_pessimistic_locking',
                    'label': 'Use SELECT ... FOR UPDATE',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Acquire exclusive row-level lock on account records',
                },
            ],
            'visualizer_type': 'sql_pipeline',
            'visualizer_config': {'title': 'Row-Level Locking & Lost Updates'},
        },
        {
            'id': 'w25_s5_write_skew_serializable',
            'title': 'Write Skew & Serializable Snapshot Isolation (SSI)',
            'subtitle': 'The on-call doctor paradox: why constraints break even when rows do not overlap',
            'scenario': 'Two doctors are on call. Hospital policy requires at least one doctor on call. Both doctors check out concurrently. Both see that the other is active. Both check out. Zero doctors are on call!',
            'mechanism': 'Write Skew occurs when two transactions read overlapping datasets, satisfy a constraint, and then modify non-overlapping rows that mutually violate the constraint. Only SERIALIZABLE isolation detects read-write conflict dependencies (rw-antidependencies) and aborts one transaction.',
            'prediction': {
                'prompt': 'Why does standard Repeatable Read (Snapshot Isolation) fail to prevent the two doctors on-call dilemma?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Because each doctor modifies their OWN row, neither transaction experiences a row-level write conflict, yet the global business invariant is violated.',
                        'explanation': 'Correct! Snapshot isolation detects write-write conflicts on identical rows, not cross-row semantic invariants.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Because doctor schedules are stored in NoSQL databases.',
                        'explanation': 'Incorrect! Write skew is a classical relational database anomaly.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Because transactions cannot read other transactions\' user IDs.',
                        'explanation': 'Incorrect! Both transactions could read all rows; they simply wrote to different rows.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Serializable Snapshot Isolation (SSI) in PostgreSQL tracks dependency cycles to guarantee absolute serializability without locking entire tables.',
            },
            'controls': [
                {
                    'id': 'enable_serializable_ssi',
                    'label': 'Enable SERIALIZABLE Isolation (SSI)',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Detect read-write conflict graph cycles and abort colliding transactions',
                },
            ],
            'visualizer_type': 'sql_pipeline',
            'visualizer_config': {'title': 'Write Skew & SSI Dependency Graph'},
        },
        {
            'id': 'w25_s6_transfer_challenge',
            'title': 'Transfer Challenge: Atomic Money Transfer Transaction with Rollback',
            'subtitle': 'Implement the conditional balance transfer with atomic rollback in SQL',
            'scenario': 'Write a SQL query to simulate an atomic money transfer transaction between accounts: Transfer 200 units from Account 1 (Aarav) to Account 2 (Priya). Verify whether Account 1 has at least 200 units. If sufficient, update both balances and report COMMITTED. If insufficient, leave all balances untouched and report ROLLEDBACK.',
            'mechanism': 'The query evaluates the balance condition atomically, updating balances only when the invariant holds and tagging status accordingly.',
            'prediction': {
                'prompt': 'When Aarav has balance 100 and Priya has 500, what status and balances are returned after a transfer attempt of 200 units?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Status ROLLEDBACK: Aarav remains 100, Priya remains 500.',
                        'explanation': 'Correct! 100 < 200, so insufficient funds triggers a complete atomic rollback.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Status COMMITTED: Aarav becomes -100, Priya becomes 700.',
                        'explanation': 'Incorrect! Negative balances violate banking invariants.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Status COMMITTED: Aarav becomes 0, Priya becomes 600.',
                        'explanation': 'Incorrect! Partial debit violates atomicity.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Atomicity ensures that ledger consistency is preserved under all edge conditions.',
            },
            'controls': [
                {
                    'id': 'sender_initial_balance',
                    'label': 'Sender Initial Balance',
                    'type': 'slider',
                    'default': 1000,
                    'min': 0,
                    'max': 2000,
                    'step': 100,
                    'description': 'Adjust sender balance above or below transfer threshold (200)',
                },
            ],
            'visualizer_type': 'sql_pipeline',
            'visualizer_config': {'title': 'SQL Transaction Execution Runner'},
        },
    ]

    data['journey'] = journey
    validated = QuestionContent.model_validate(data)
    with open(path, 'w') as f:
        yaml.dump(data, f, sort_keys=False, allow_unicode=True)
    print(f"World 25 validated and saved! ({len(validated.journey)} stages)")

def inject_w39_caching():
    path = Path('content/questions/39-redis-caching/redis-cache-stampede-mutex.yaml')
    data = yaml.safe_load(path.read_text())

    journey = [
        {
            'id': 'w39_s1_origin_bottleneck',
            'title': 'The Origin Database Bottleneck & In-Memory Caching',
            'subtitle': 'Why relational databases cannot serve 50,000 identical queries per second',
            'scenario': 'A social media app reaches 100,000 active users. All users view the same viral homepage feed. The database CPU hits 100% and queries slow down to 8 seconds.',
            'mechanism': 'Reading from disk or executing complex SQL joins costs milliseconds per query and locks connection pool slots. In-memory data stores like Redis serve responses from RAM in <1ms over single-threaded in-memory hash tables, handling 100,000+ QPS per node.',
            'prediction': {
                'prompt': 'What is the typical latency differential between querying an indexed relational database row on NVMe SSD versus querying a Redis key in RAM?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Redis RAM lookups take <1ms, whereas relational database queries typically take 5ms to 50ms (or seconds under pool contention).',
                        'explanation': 'Correct! RAM is orders of magnitude faster than disk I/O and SQL query parsing.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Relational databases are faster because SQL queries compile directly into GPU instructions.',
                        'explanation': 'Incorrect! Standard RDBMS engines execute on CPU and read from storage.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'There is zero performance difference because both store data on disk.',
                        'explanation': 'Incorrect! Redis is an in-memory data structure store.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'In-memory caches are the primary architectural mechanism used to scale high-read web applications.',
            },
            'controls': [
                {
                    'id': 'traffic_volume_qps',
                    'label': 'Inbound Query Volume (QPS)',
                    'type': 'slider',
                    'default': 2500,
                    'min': 100,
                    'max': 10000,
                    'step': 100,
                    'description': 'Simulate concurrent read query volume against database',
                },
                {
                    'id': 'enable_redis_cache',
                    'label': 'Enable Redis In-Memory Caching',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Route reads through Redis cache layer',
                },
            ],
            'visualizer_type': 'cache_relational',
            'visualizer_config': {'title': 'Origin DB vs Redis In-Memory Cache'},
        },
        {
            'id': 'w39_s2_cache_aside_lifecycle',
            'title': 'The Cache-Aside (Lazy Loading) Architecture & TTL Expiration',
            'subtitle': 'How applications coordinate reads, cache misses, and database hydration',
            'scenario': 'How does the Cache-Aside pattern work during normal production operation?',
            'mechanism': '1. Application checks Redis: GET key. 2. If Cache HIT: Return data to client immediately (<1ms). 3. If Cache MISS: Query PostgreSQL origin database, store result in Redis with a Time-To-Live (SET key data EX 300), and return data to client.',
            'prediction': {
                'prompt': 'What is the purpose of setting a TTL (Time-To-Live) on cached keys in Redis?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'To prevent RAM from exhausting and ensure the cache eventually evicts stale data if application update events are dropped.',
                        'explanation': 'Correct! TTLs provide automatic memory hygiene and eventual consistency guarantees.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Because Redis keys automatically delete after 3 queries.',
                        'explanation': 'Incorrect! Redis keys persist until TTL expires or memory eviction triggers.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'To force the client browser to refresh its cookies.',
                        'explanation': 'Incorrect! Redis TTL is an internal backend caching parameter.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Cache-Aside keeps the cache decoupled from the database while TTL guarantees bounded memory usage.',
            },
            'controls': [
                {
                    'id': 'cache_ttl_seconds',
                    'label': 'Cache Key TTL (seconds)',
                    'type': 'slider',
                    'default': 60,
                    'min': 5,
                    'max': 300,
                    'step': 5,
                    'description': 'Time-To-Live before cached key expires in Redis',
                },
            ],
            'visualizer_type': 'cache_relational',
            'visualizer_config': {'title': 'Cache-Aside Flow & Eviction'},
        },
        {
            'id': 'w39_s3_thundering_herd_stampede',
            'title': 'The Cache Stampede (Thundering Herd) Disaster',
            'subtitle': 'What happens when a viral key expires under 10,000 requests per second',
            'scenario': 'Key match_score_123 expires at 12:00:00. At 12:00:00.010, 5,000 concurrent users refresh the screen. What happens to the database?',
            'mechanism': 'All 5,000 requests experience a simultaneous cache miss. None see the key in Redis. All 5,000 workers fire the exact same SQL query to PostgreSQL simultaneously. The database runs out of connection pool slots, thread thrashing occurs, and queries time out.',
            'prediction': {
                'prompt': 'When an intensely requested cache key expires under 5,000 concurrent requests, what happens without mutex protection?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Every concurrent worker queries the database simultaneously, exhausting the database connection pool and causing cascading 504 timeouts.',
                        'explanation': 'Correct! This is the classic Thundering Herd (Cache Stampede) failure mode.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The database queues the queries sequentially without any performance loss.',
                        'explanation': 'Misconception! 5,000 concurrent connections exhaust DB pool limits and trigger thread thrashing.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Redis automatically delays returning the miss until the database is ready.',
                        'explanation': 'Incorrect! Redis immediately returns nil on an expired key.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Cache Stampedes are among the most dangerous failure modes in distributed systems, turning a cache miss into an origin outage.',
            },
            'controls': [
                {
                    'id': 'stampede_concurrency',
                    'label': 'Concurrent Misses at Expiration',
                    'type': 'slider',
                    'default': 1000,
                    'min': 50,
                    'max': 5000,
                    'step': 50,
                    'description': 'Simulate simultaneous incoming traffic when key TTL hits zero',
                },
            ],
            'visualizer_type': 'cache_relational',
            'visualizer_config': {'title': 'Thundering Herd Connection Pool Crash'},
        },
        {
            'id': 'w39_s4_mutex_lock_solution',
            'title': 'The Distributed Mutex Lock (SET NX EX) Pattern',
            'subtitle': 'Ensuring exactly ONE thread queries the database while others wait',
            'scenario': 'How can we ensure that out of 5,000 concurrent misses, exactly ONE worker queries the database while the other 4,999 wait and read the warm cache?',
            'mechanism': '1. On cache miss, attempt atomic lock acquisition: SET lock:key token NX EX 10. 2. The WINNER gets OK: queries PostgreSQL and writes SET key data EX 60, then deletes the lock. 3. The LOSERS fail to acquire the lock: they sleep for 50ms and retry reading from Redis, hitting the freshly populated cache in RAM!',
            'prediction': {
                'prompt': 'How does SET lock:key token NX EX 10 guarantee that only one thread queries the database?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'The NX flag ensures the key is set ONLY if it does not already exist, making lock acquisition an atomic single-winner test-and-set operation.',
                        'explanation': 'Correct! Atomic NX guarantees exactly one winner among competing concurrent threads.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'It reboots Redis so other threads cannot connect.',
                        'explanation': 'Incorrect! Other threads continue reading from Redis normally.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'It forces the database to refuse connections from all other worker threads.',
                        'explanation': 'Incorrect! The database is completely unaware of the Redis mutex.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'The distributed mutex shelters origin databases by collapsing 5,000 duplicate queries into exactly 1 database fetch.',
            },
            'controls': [
                {
                    'id': 'use_stampede_mutex',
                    'label': 'Enable Stampede Mutex (SET NX EX)',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Single-flight mutex lock shielding database',
                },
            ],
            'visualizer_type': 'cache_relational',
            'visualizer_config': {'title': 'Distributed Mutex Shelter'},
        },
        {
            'id': 'w39_s5_db_constraints_vs_cache',
            'title': 'Database Constraints vs Cache Mutexes: Who Guarantees What?',
            'subtitle': 'Why Redis locks protect performance, while database constraints protect correctness',
            'scenario': 'Does a Redis distributed lock replace database unique constraints or row-level ACID transactions for inventory purchases?',
            'mechanism': 'Redis locks are advisory and non-durable across network partitions (e.g. split-brain or GC pauses). The database primary key, foreign key, and UPDATE inventory SET stock = stock - 1 WHERE stock > 0 constraints guarantee financial and inventory correctness. The Redis mutex exists solely as an architectural shield to protect the origin database from resource exhaustion.',
            'prediction': {
                'prompt': 'If a Redis node crashes and releases a lock prematurely while a worker is still writing, how does a resilient architecture prevent double-selling inventory?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'The database enforces an atomic check or constraint (e.g. WHERE stock > 0); the DB remains the authoritative source of transactional truth.',
                        'explanation': 'Correct! Never rely on caching layers for transactional invariant guarantees.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Redis locks are mathematically guaranteed to never fail even if servers lose power.',
                        'explanation': 'Misconception! Redis memory is non-blocking and subject to network partitions.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'By running the Redis cluster on three different operating systems.',
                        'explanation': 'Incorrect! Hardware redundancy does not replace transactional database constraints.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Separation of concerns: Redis shields origin latency; Relational ACID constraints guarantee business correctness.',
            },
            'controls': [
                {
                    'id': 'enforce_db_constraints',
                    'label': 'Enforce Database Atomic Constraints (WHERE stock > 0)',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Transactional safety fence at origin database layer',
                },
            ],
            'visualizer_type': 'cache_relational',
            'visualizer_config': {'title': 'Transactional Defense in Depth'},
        },
        {
            'id': 'w39_s6_transfer_challenge',
            'title': 'Transfer Challenge: Production Cache Stampede Mutex Simulator',
            'subtitle': 'Implement the single-flight mutex coordination engine in Python',
            'scenario': 'Build the Cache Stampede Mutex simulator in Python: manage an in-memory cache, track active lock keys, coordinate concurrent callers, count database queries vs lock waits, and verify that only 1 DB query is fired per batch of misses.',
            'mechanism': 'When key is in cache -> hit. When absent -> if lock acquired: db_queries += 1, populate cache, release lock. If lock held: lock_waits += 1, read from populated cache.',
            'prediction': {
                'prompt': 'When 5 concurrent requests arrive for the exact same expired key, how many database queries are executed with the stampede mutex enabled?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Exactly 1 database query (first request acquires lock; other 4 wait and read cache).',
                        'explanation': 'Correct! The mutex collapses redundant queries into a single authoritative fetch.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': '5 database queries.',
                        'explanation': 'Incorrect! 5 queries occur only when the mutex is disabled.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': '0 database queries.',
                        'explanation': 'Incorrect! The expired key must be fetched from the database once to refresh the cache.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Single-flight mutex coordination eliminates 99.9% of redundant origin traffic during cache invalidation.',
            },
            'controls': [
                {
                    'id': 'request_batch_size',
                    'label': 'Concurrent Request Batch Size',
                    'type': 'slider',
                    'default': 5,
                    'min': 2,
                    'max': 20,
                    'step': 1,
                    'description': 'Simulate concurrent batch size querying same key',
                },
            ],
            'visualizer_type': 'cache_relational',
            'visualizer_config': {'title': 'Stampede Mutex Production Runner'},
            'lab_starter_code': '''class Solution:
    def simulate_stampede_mutex(self, database: dict[str, str], requests: list[str]) -> dict:
        # Implement Cache Stampede Mutex Lock Simulator
        pass
''',
            'lab_solution': '''class Solution:
    def simulate_stampede_mutex(self, database: dict[str, str], requests: list[str]) -> dict:
        cache = {}
        locks = set()
        db_queries = 0
        cache_hits = 0
        cache_misses = 0
        lock_waits = 0
        results = []

        for key in requests:
            if key in cache:
                cache_hits += 1
                results.append(cache[key])
            else:
                cache_misses += 1
                if key not in locks:
                    locks.add(key)
                    db_queries += 1
                    val = database.get(key)
                    if val is not None:
                        cache[key] = val
                    results.append(val)
                    locks.remove(key)
                else:
                    lock_waits += 1
                    results.append(cache.get(key))

        return {
            "db_queries": db_queries,
            "cache_hits": cache_hits,
            "cache_misses": cache_misses,
            "lock_waits": lock_waits,
            "results": results,
            "final_cache": cache,
        }
''',
        },
    ]

    data['journey'] = journey
    validated = QuestionContent.model_validate(data)
    with open(path, 'w') as f:
        yaml.dump(data, f, sort_keys=False, allow_unicode=True)
    print(f"World 39 validated and saved! ({len(validated.journey)} stages)")

inject_w17_storage()
inject_w25_acid()
inject_w39_caching()
