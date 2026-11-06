# 🏛️ ApexCaliber: Complete Curriculum Inventory, Pedagogical Problem & Frontier AI Master Research Brief

> **Prompt Persona & Mandate for the AI:** You are an elite Principal Software Architect, FAANG SDE Bar Raiser, and Master Educational Technologist (combining the pedagogical micro-interactions of Brilliant.org, the architectural clarity of ByteByteGo, and the interactive polish of Stripe).

> The founder of **ApexCaliber** has provided the complete system architecture, the entire 198-question curriculum inventory, and their exact pedagogical intent below.

> Your mission: Conduct deep industry research into modern Tier-1 SDE interview patterns, audit every question and world in the platform, and deliver an exhaustive, step-by-step master plan to transform ApexCaliber into the world's most engaging, interactive, and joyful Computer Science academy.

---

## Part 1: What is ApexCaliber?

**ApexCaliber** is an interactive, full-stack Computer Science and Software Engineering learning platform and library.
- **Backend:** FastAPI, Python 3.14, SQLAlchemy, SQLite/PostgreSQL, dynamic code execution runners (`python_trace`, `python_practical`, `sql_sqlite`).
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Monaco Code Editor, Framer Motion, custom CSS-3D / Canvas / SVG visualizers.
- **Current Scale:** 7 Core Citadels, 42 Worlds, 198 Modules/Questions.

---

## Part 2: The Core Problem & The Founder's Vision

### The Historical Flaw: The 'LeetCode Trap' in Systems Topics
ApexCaliber started with an algorithm practice runner. Because of that legacy structure, **every single non-DSA topic (DBMS, OS, Backend APIs, Networking, GenAI, Python Internals) was accidentally packaged like a LeetCode coding problem!**

For example:
- A student clicks on **'HTTP Status Codes'** (Citadel V).
- Instead of being taught what HTTP is, what a client/server is, what network latency is, or how Swiggy handles 504 timeouts, they are dumped into a **split-screen LeetCode coding editor** with an empty Python stub:
  ```python
  def handle_status(code: int) -> str:
      # Write code to pass 3 test cases...
  ```
- If the student has never built a backend, **how can they possibly do this?** They are forced to memorize syntax and copy-paste trivia `if-else` branches. They learn *nothing* about real engineering.

### The Founder's Non-Negotiable Intent & Philosophy
1. **Teaching & Intuitive Understanding is Priority #1 (NOT Coding First):**
   - **Citadel I (DSA Apex Mastery) remains code-first**, because algorithms are coding puzzles.
   - **Citadels II through VII (Systems, DBMS, OS, Backend, Networking, GenAI) MUST BE TEACHING-FIRST.**
   - Students must understand the concept down to their bones before writing or inspecting any code.
2. **The 'Knowledge Tree' / Organic Stage Progression:**
   - Concepts must never be thrown at the user as isolated trivia. They must feel like an interconnected **journey**.
   - Start from foundational building blocks (what something is, why it exists, elementary primitives).
   - Progressively branch into interconnected mechanisms.
   - Culminate in the apex root concept (how real-world systems, product flows, and large-scale architectures work).
   - **Crucial Rule:** The progression is **NOT a rigid 3-box limit**. It must adapt organically to what each specific topic requires (some topics have 2 stages, others 4 or 5 progressive layers). Adapt the progression dynamically to fit the topic's natural cognitive learning curve!
3. **Joyful, Gamified & Attention-Grabbing (Anti-Boring Notes):**
   - No dry, academic walls of text (like traditional GeeksforGeeks or wikis).
   - **Interactive Micro-Experiments:** Buttons to spam requests and trigger `429 Too Many Requests`, sliders to adjust latency and trigger `504 Gateway Timeout`, toggle failure modes.
   - **'Feel the Pain' Broken Demos:** Show why a technology exists by letting students see the failure first (e.g., watch a database crash under 100 simultaneous queries before introducing Redis Mutex locks).
   - **Real Product Stories:** Connect every topic to Swiggy, Zomato, Zerodha, Razorpay, Netflix, Hotstar, Instagram, Flipkart.
4. **Pre-Wired, Ready-to-Run Code Sandboxes (Instead of Empty Homework):**
   - In non-DSA topics, do not force students to write boilerplate classes from scratch.
   - Provide a pre-wired, fully functioning interactive lab where students tweak parameters, run live experiments, and inspect real telemetry.

---

## Part 3: Complete Curriculum & Question Inventory (Ground Truth)

### 🏰 Citadel I: DSA Apex Mastery (`dsa`)
*12 Worlds · 115 Core Patterns · 12 Worlds · 116 Questions*
> **Citadel Description:** Master algorithm patterns from two pointers to dynamic programming with visual execution.

> **Pedagogical Mode:** Code-First Algorithmic Puzzle Practice

#### World 1: Arrays & Hashing (Slug: `arrays-hashing`)
*11 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 217 | Contains Duplicate | `contains-duplicate` | `array_pointer` | `python_trace` |
| 242 | Valid Anagram | `valid-anagram` | `array_pointer` | `python_trace` |
| 1 | Two Sum | `two-sum` | `array_pointer` | `python_trace` |
| 169 | Majority Element | `majority-element` | `array_pointer` | `python_trace` |
| 49 | Group Anagrams | `group-anagrams` | `array_pointer` | `python_trace` |
| 347 | Top K Frequent Elements | `top-k-frequent-elements` | `array_pointer` | `python_trace` |
| 238 | Product of Array Except Self | `product-of-array-except-self` | `array_pointer` | `python_trace` |
| 128 | Longest Consecutive Sequence | `longest-consecutive-sequence` | `array_pointer` | `python_trace` |
| 560 | Subarray Sum Equals K | `subarray-sum-equals-k` | `array_pointer` | `python_trace` |
| 31 | Next Permutation | `next-permutation` | `array_pointer` | `python_trace` |
| 9010 | Bubble Sort | `bubble-sort` | `array_pointer` | `python_trace` |

#### World 2: Two Pointers (Slug: `two-pointers`)
*8 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 125 | Valid Palindrome | `valid-palindrome` | `array_pointer` | `python_trace` |
| 283 | Move Zeroes | `move-zeroes` | `array_pointer` | `python_trace` |
| 167 | Two Sum II - Input Array Is Sorted | `two-sum-ii-input-array-is-sorted` | `array_pointer` | `python_trace` |
| 2149 | Rearrange Array Elements by Sign | `rearrange-array-elements-by-sign` | `array_pointer` | `python_trace` |
| 75 | Sort Colors | `sort-colors` | `array_pointer` | `python_trace` |
| 15 | 3Sum | `3sum` | `array_pointer` | `python_trace` |
| 11 | Container With Most Water | `container-with-most-water` | `array_pointer` | `python_trace` |
| 42 | Trapping Rain Water | `trapping-rain-water` | `array_pointer` | `python_trace` |

#### World 3: Sliding Window (Slug: `sliding-window`)
*8 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 643 | Maximum Average Subarray I | `maximum-average-subarray-i` | `array_pointer` | `python_trace` |
| 121 | Best Time to Buy and Sell Stock | `best-time-to-buy-and-sell-stock` | `array_pointer` | `python_trace` |
| 1004 | Max Consecutive Ones III | `max-consecutive-ones-iii` | `array_pointer` | `python_trace` |
| 904 | Fruit Into Baskets | `fruit-into-baskets` | `array_pointer` | `python_trace` |
| 3 | Longest Substring Without Repeating Characters | `longest-substring-without-repeating-characters` | `array_pointer` | `python_trace` |
| 424 | Longest Repeating Character Replacement | `longest-repeating-character-replacement` | `array_pointer` | `python_trace` |
| 567 | Permutation in String | `permutation-in-string` | `array_pointer` | `python_trace` |
| 76 | Minimum Window Substring | `minimum-window-substring` | `array_pointer` | `python_trace` |

#### World 4: Stack & Monotonic Stack (Slug: `stack-monotonic-stack`)
*8 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 20 | Valid Parentheses | `valid-parentheses` | `stack_queue` | `python_trace` |
| 496 | Next Greater Element I | `next-greater-element-i` | `stack_queue` | `python_trace` |
| 155 | Min Stack | `min-stack` | `stack_queue` | `python_trace` |
| 150 | Evaluate Reverse Polish Notation | `evaluate-reverse-polish-notation` | `stack_queue` | `python_trace` |
| 739 | Daily Temperatures | `daily-temperatures` | `stack_queue` | `python_trace` |
| 735 | Asteroid Collision | `asteroid-collision` | `stack_queue` | `python_trace` |
| 853 | Car Fleet | `car-fleet` | `stack_queue` | `python_trace` |
| 84 | Largest Rectangle in Histogram | `largest-rectangle-in-histogram` | `stack_queue` | `python_trace` |

#### World 5: Binary Search & BS on Answer (Slug: `binary-search`)
*10 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 704 | Binary Search | `binary-search` | `array_pointer` | `python_trace` |
| 35 | Search Insert Position | `search-insert-position` | `array_pointer` | `python_trace` |
| 74 | Search a 2D Matrix | `search-a-2d-matrix` | `array_pointer` | `python_trace` |
| 34 | Find First and Last Position of Element in Sorted Array | `find-first-and-last-position-of-element-in-sorted-array` | `array_pointer` | `python_trace` |
| 153 | Find Minimum in Rotated Sorted Array | `find-minimum-in-rotated-sorted-array` | `array_pointer` | `python_trace` |
| 33 | Search in Rotated Sorted Array | `search-in-rotated-sorted-array` | `array_pointer` | `python_trace` |
| 875 | Koko Eating Bananas | `koko-eating-bananas` | `array_pointer` | `python_trace` |
| 1011 | Capacity To Ship Packages Within D Days | `capacity-to-ship-packages-within-d-days` | `array_pointer` | `python_trace` |
| 410 | Split Array Largest Sum (Allocate Books) | `split-array-largest-sum` | `array_pointer` | `python_trace` |
| 4 | Median of Two Sorted Arrays | `median-of-two-sorted-arrays` | `array_pointer` | `python_trace` |

#### World 6: Linked Lists (Slug: `linked-lists`)
*9 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 206 | Reverse Linked List | `reverse-linked-list` | `linked_list` | `python_trace` |
| 21 | Merge Two Sorted Lists | `merge-two-sorted-lists` | `linked_list` | `python_trace` |
| 876 | Middle of the Linked List | `middle-of-the-linked-list` | `linked_list` | `python_trace` |
| 141 | Linked List Cycle | `linked-list-cycle` | `linked_list` | `python_trace` |
| 19 | Remove Nth Node From End of List | `remove-nth-node-from-end-of-list` | `linked_list` | `python_trace` |
| 143 | Reorder List | `reorder-list` | `linked_list` | `python_trace` |
| 138 | Copy List with Random Pointer | `copy-list-with-random-pointer` | `linked_list` | `python_trace` |
| 146 | LRU Cache | `lru-cache` | `linked_list` | `python_trace` |
| 25 | Reverse Nodes in k-Group | `reverse-nodes-in-k-group` | `linked_list` | `python_trace` |

#### World 7: Trees — BFS & DFS (Slug: `trees`)
*12 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 104 | Maximum Depth of Binary Tree | `maximum-depth-of-binary-tree` | `tree_recursion` | `python_trace` |
| 226 | Invert Binary Tree | `invert-binary-tree` | `tree_recursion` | `python_trace` |
| 100 | Same Tree | `same-tree` | `tree_recursion` | `python_trace` |
| 572 | Subtree of Another Tree | `subtree-of-another-tree` | `tree_recursion` | `python_trace` |
| 543 | Diameter of Binary Tree | `diameter-of-binary-tree` | `tree_recursion` | `python_trace` |
| 110 | Balanced Binary Tree | `balanced-binary-tree` | `tree_recursion` | `python_trace` |
| 102 | Binary Tree Level Order Traversal | `binary-tree-level-order-traversal` | `tree_recursion` | `python_trace` |
| 199 | Binary Tree Right Side View | `binary-tree-right-side-view` | `tree_recursion` | `python_trace` |
| 235 | Lowest Common Ancestor of a Binary Search Tree | `lowest-common-ancestor-of-a-binary-search-tree` | `tree_recursion` | `python_trace` |
| 1448 | Count Good Nodes in Binary Tree | `count-good-nodes-in-binary-tree` | `tree_recursion` | `python_trace` |
| 98 | Validate Binary Search Tree | `validate-binary-search-tree` | `tree_recursion` | `python_trace` |
| 124 | Binary Tree Maximum Path Sum | `binary-tree-maximum-path-sum` | `tree_recursion` | `python_trace` |

#### World 8: Heaps / Priority Queue (Slug: `heaps`)
*7 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 703 | Kth Largest Element in a Stream | `kth-largest-element-in-a-stream` | `tree_recursion` | `python_trace` |
| 1046 | Last Stone Weight | `last-stone-weight` | `tree_recursion` | `python_trace` |
| 215 | Kth Largest Element in an Array | `kth-largest-element-in-an-array` | `tree_recursion` | `python_trace` |
| 973 | K Closest Points to Origin | `k-closest-points-to-origin` | `tree_recursion` | `python_trace` |
| 621 | Task Scheduler | `task-scheduler` | `tree_recursion` | `python_trace` |
| 23 | Merge k Sorted Lists | `merge-k-sorted-lists` | `tree_recursion` | `python_trace` |
| 295 | Find Median from Data Stream | `find-median-from-data-stream` | `tree_recursion` | `python_trace` |

#### World 9: Backtracking & Recursion (Slug: `backtracking`)
*8 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 78 | Subsets | `subsets` | `tree_recursion` | `python_trace` |
| 90 | Subsets II | `subsets-ii` | `tree_recursion` | `python_trace` |
| 46 | Permutations | `permutations` | `tree_recursion` | `python_trace` |
| 39 | Combination Sum | `combination-sum` | `tree_recursion` | `python_trace` |
| 40 | Combination Sum II | `combination-sum-ii` | `tree_recursion` | `python_trace` |
| 131 | Palindrome Partitioning | `palindrome-partitioning` | `tree_recursion` | `python_trace` |
| 79 | Word Search | `word-search` | `graph_grid` | `python_trace` |
| 51 | N-Queens | `n-queens` | `tree_recursion` | `python_trace` |

#### World 10: Graphs — BFS, DFS, Topo Sort, Shortest Path (Slug: `graphs`)
*12 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 733 | Flood Fill | `flood-fill` | `graph_grid` | `python_trace` |
| 200 | Number of Islands | `number-of-islands` | `graph_grid` | `python_trace` |
| 695 | Max Area of Island | `max-area-of-island` | `graph_grid` | `python_trace` |
| 994 | Rotting Oranges | `rotting-oranges` | `graph_grid` | `python_trace` |
| 547 | Number of Provinces | `number-of-provinces` | `graph_grid` | `python_trace` |
| 133 | Clone Graph | `clone-graph` | `graph_grid` | `python_trace` |
| 417 | Pacific Atlantic Water Flow | `pacific-atlantic-water-flow` | `graph_grid` | `python_trace` |
| 207 | Course Schedule | `course-schedule` | `graph_grid` | `python_trace` |
| 210 | Course Schedule II | `course-schedule-ii` | `graph_grid` | `python_trace` |
| 743 | Network Delay Time | `network-delay-time` | `graph_grid` | `python_trace` |
| 787 | Cheapest Flights Within K Stops | `cheapest-flights-within-k-stops` | `graph_grid` | `python_trace` |
| 127 | Word Ladder | `word-ladder` | `graph_grid` | `python_trace` |

#### World 11: Greedy & Intervals (Slug: `greedy-intervals`)
*9 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 455 | Assign Cookies | `assign-cookies` | `array_pointer` | `python_trace` |
| 53 | Maximum Subarray (Kadane's) | `maximum-subarray` | `array_pointer` | `python_trace` |
| 55 | Jump Game | `jump-game` | `array_pointer` | `python_trace` |
| 45 | Jump Game II | `jump-game-ii` | `array_pointer` | `python_trace` |
| 134 | Gas Station | `gas-station` | `array_pointer` | `python_trace` |
| 56 | Merge Intervals | `merge-intervals` | `array_pointer` | `python_trace` |
| 57 | Insert Interval | `insert-interval` | `array_pointer` | `python_trace` |
| 435 | Non-overlapping Intervals | `non-overlapping-intervals` | `array_pointer` | `python_trace` |
| 452 | Minimum Number of Arrows to Burst Balloons | `minimum-number-of-arrows-to-burst-balloons` | `array_pointer` | `python_trace` |

#### World 12: 1D & 2D Dynamic Programming (Slug: `dynamic-programming`)
*14 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 70 | Climbing Stairs | `climbing-stairs` | `dp_table` | `python_trace` |
| 746 | Min Cost Climbing Stairs | `min-cost-climbing-stairs` | `dp_table` | `python_trace` |
| 198 | House Robber | `house-robber` | `dp_table` | `python_trace` |
| 213 | House Robber II | `house-robber-ii` | `dp_table` | `python_trace` |
| 62 | Unique Paths | `unique-paths` | `dp_table` | `python_trace` |
| 322 | Coin Change | `coin-change` | `dp_table` | `python_trace` |
| 518 | Coin Change II | `coin-change-ii` | `dp_table` | `python_trace` |
| 300 | Longest Increasing Subsequence | `longest-increasing-subsequence` | `dp_table` | `python_trace` |
| 139 | Word Break | `word-break` | `dp_table` | `python_trace` |
| 416 | Partition Equal Subset Sum | `partition-equal-subset-sum` | `dp_table` | `python_trace` |
| 494 | Target Sum | `target-sum` | `dp_table` | `python_trace` |
| 1143 | Longest Common Subsequence | `longest-common-subsequence` | `dp_table` | `python_trace` |
| 309 | Best Time to Buy and Sell Stock with Cooldown | `best-time-to-buy-and-sell-stock-with-cooldown` | `dp_table` | `python_trace` |
| 72 | Edit Distance | `edit-distance` | `dp_table` | `python_trace` |

---

### 🏰 Citadel II: Practical Python, OOP & Pandas (`python_data`)
*Memory · SOLID · Parsing · Pandas · 4 Worlds · 23 Questions*
> **Citadel Description:** Python internals, OOP design patterns, XML LCA tree pruning, and practical Pandas pipelines.

> **Pedagogical Mode:** TEACHING-FIRST Interactive Guided Journey & Pre-Wired Lab

#### World 13: Python Internals & Memory (Slug: `python-internals`)
*6 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9201 | Mutable Default Arguments & Object Identity | `mutability-and-default-args` | `dataframe_pipeline` | `python_practical` |
| 9202 | Streaming Generator & Lazy Pipeline | `generators-memory-streaming` | `dataframe_pipeline` | `python_practical` |
| 9203 | Transaction Rollback Context Manager | `custom-context-manager` | `system_blueprint` | `python_practical` |
| 9204 | Adaptive Exponential Backoff Decorator | `retry-with-backoff-decorator` | `concurrency_timeline` | `python_practical` |
| 9205 | Python Closures and the Late Binding Variable Trap | `python-closures-late-binding` | `system_blueprint` | `python_practical` |
| 9206 | Exponential Backoff Retry Decorator with Injected Sleep Function | `retry-backoff-injected-sleep` | `system_blueprint` | `python_practical` |

#### World 14: OOP, SOLID & Design Patterns (Slug: `oop-patterns`)
*6 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9211 | Magic Dunder Methods & Comparable Evaluator | `dunder-methods-evaluator` | `system_blueprint` | `python_practical` |
| 9212 | Document Parser Hierarchy with ABC | `abstract-document-parser` | `system_blueprint` | `python_practical` |
| 9213 | Spaghetti to SOLID: Extensible LLM Client | `solid-llm-refactor` | `system_blueprint` | `python_practical` |
| 9214 | Multi-Provider LLM Client Factory | `llm-provider-factory` | `system_blueprint` | `python_practical` |
| 9215 | Strategy Design Pattern for Multi-Model LLM Inference Providers | `oop-llm-provider-strategy` | `system_blueprint` | `python_practical` |
| 9216 | Observer Design Pattern In-Memory Event Bus | `oop-observer-event-bus` | `system_blueprint` | `python_practical` |

#### World 15: Practical File Processing (JSON/XML/PDF) (Slug: `file-processing`)
*5 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9221 | Flattening Deep JSON Telemetry Logs | `flatten-nested-json-telemetry` | `dataframe_pipeline` | `python_practical` |
| 9222 | XML Tree Active Sibling Pruning (Drizz LCA) | `xml-lca-sibling-pruning` | `dataframe_pipeline` | `python_practical` |
| 9223 | RAG Document Cleaning & Semantic Chunker | `pdf-text-semantic-chunker` | `system_blueprint` | `python_practical` |
| 9224 | Resilient Streaming CSV Log Ingestion | `resilient-csv-stream-pipeline` | `dataframe_pipeline` | `python_practical` |
| 9225 | Safe Nested JSON Path Resolver Without KeyError or IndexError | `safe-nested-json-resolver` | `system_blueprint` | `python_practical` |

#### World 16: Practical Pandas & Data Engineering (Slug: `practical-pandas`)
*6 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9231 | Vectorized Boolean Indexing with .loc | `pandas-loc-boolean-filtering` | `dataframe_pipeline` | `python_practical` |
| 9232 | Cleaning Telemetry: NaNs, Duplicates & Types | `pandas-cleaning-and-imputation` | `dataframe_pipeline` | `python_practical` |
| 9233 | Multi-Metric GroupBy & Percentile Leaderboard | `pandas-groupby-aggregations` | `dataframe_pipeline` | `python_practical` |
| 9234 | Relational Joins & P1 Customer Impact Finder | `pandas-relational-merges` | `dataframe_pipeline` | `python_practical` |
| 9235 | Department 2nd Highest Salary via Dense Rank | `pandas-window-ranking` | `dataframe_pipeline` | `python_practical` |
| 9236 | Pandas Relational Merge and GroupBy P95 Tail Latency Aggregation | `pandas-merge-groupby-p95-latency` | `dataframe_pipeline` | `python_practical` |

---

### 🏰 Citadel III: Database Systems & In-Memory Caching (`sql_dbms`)
*8KB Pages · B-Trees · ACID · Redis Caching · Eviction · 7 Worlds · 20 Questions*
> **Citadel Description:** Relational storage engines, B-Tree index traversal, ACID anomalies, and Redis caching patterns with eviction strategies.

> **Pedagogical Mode:** TEACHING-FIRST Interactive Guided Journey & Pre-Wired Lab

#### World 17: Disk Storage & Heap Pages (Slug: `dbms-storage`)
*1 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9301 | 8KB Disk Heap Pages & Sequential Scans | `heap-pages-and-scans` | `sql_pipeline` | `python_practical` |

#### World 18: Core SQL Arena (Slug: `sql-arena`)
*3 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9313 | Customers Who Never Placed Orders | `sql-customers-never-order` | `sql_pipeline` | `sql_sqlite` |
| 9314 | Employees Earning More Than Their Managers | `sql-employees-earning-more-than-managers` | `sql_pipeline` | `sql_sqlite` |
| 9316 | Test Run Status Conditional Pivot | `sql-conditional-aggregation-pivot` | `sql_pipeline` | `sql_sqlite` |

#### World 22: Indexing & Leftmost Prefix (Slug: `indexing`)
*3 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9302 | B-Tree vs Hash Index Benchmark | `btree-vs-hash-indexes` | `sql_pipeline` | `python_practical` |
| 9303 | The Leftmost Prefix Composite Rule | `composite-index-left-prefix` | `sql_pipeline` | `python_practical` |
| 9307 | EXPLAIN QUERY PLAN Composite Index Evaluation | `sql-explain-composite-index` | `sql_pipeline` | `sql_sqlite` |

#### World 23: Normalization & Schema Design (Slug: `normalization-views`)
*3 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9304 | Schema Decomposition to Third Normal Form (3NF) | `database-normalization` | `sql_pipeline` | `python_practical` |
| 9305 | 3NF Decomposition & Lossless Join Verification | `sql-decompose-3nf-lossless-join` | `sql_pipeline` | `sql_sqlite` |
| 9306 | Database View & Audit Trigger Verification | `sql-view-and-audit-trigger` | `sql_pipeline` | `sql_sqlite` |

#### World 24: Analytical SQL Arena (Slug: `analytical-sql`)
*5 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9311 | Second Highest Salary (Window & Offset) | `sql-second-highest-salary` | `sql_pipeline` | `sql_sqlite` |
| 9312 | Department Top Three Salaried Employees | `sql-department-top-three-salaries` | `sql_pipeline` | `sql_sqlite` |
| 9315 | Consecutive Available Cinema Seats | `sql-consecutive-available-seats` | `sql_pipeline` | `sql_sqlite` |
| 9317 | Running Total & Month-over-Month Growth with LAG | `sql-running-total-mom-lag` | `sql_pipeline` | `sql_sqlite` |
| 9318 | Purge Duplicate Rows Keeping Lowest Identifier | `sql-delete-duplicate-emails` | `sql_pipeline` | `sql_sqlite` |

#### World 25: Transactions & ACID Mastery (Slug: `transactions-acid`)
*3 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9321 | ACID Atomic Money Transfer & Rollback | `sql-acid-money-transfer` | `sql_pipeline` | `sql_sqlite` |
| 9322 | Optimistic Locking & Lost Update Prevention | `sql-lost-update-optimistic-lock` | `sql_pipeline` | `sql_sqlite` |
| 9323 | Eliminate N+1 Queries with Relational Aggregation | `sql-prevent-n-plus-one-join` | `sql_pipeline` | `sql_sqlite` |

#### World 39: Redis & In-Memory Caching (Slug: `redis-caching`)
*2 questions · Default Visualizer: `cache_relational`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9331 | Redis In-Memory Cache-Aside Pattern | `redis-cache-aside-strategy` | `cache_relational` | `python_practical` |
| 9332 | Cache Stampede Mutex & Thundering Herd Prevention | `redis-cache-stampede-mutex` | `cache_relational` | `python_practical` |

---

### 🏰 Citadel IV: OS, Concurrency, GIL & Async (`os_concurrency`)
*Processes · Threads · GIL · Asyncio · 7 Worlds · 14 Questions*
> **Citadel Description:** CPU cores, thread contention under Python GIL, asyncio cooperative loops, and multi-core multiprocessing.

> **Pedagogical Mode:** TEACHING-FIRST Interactive Guided Journey & Pre-Wired Lab

#### World 19: Processes & Threads (Slug: `os-concurrency`)
*3 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9401 | Thread Race Conditions & Mutex Locks | `processes-vs-threads-memory` | `concurrency_timeline` | `python_practical` |
| 9405 | Thread Shared Heap vs Process Memory Isolation | `memory-isolation-threads-vs-processes` | `concurrency_timeline` | `python_practical` |
| 9406 | Thread vs Process Context Switch Cost Model | `context-switch-cost-model` | `concurrency_timeline` | `python_practical` |

#### World 26: Concurrency vs Parallelism (Slug: `concurrency-race-conditions`)
*3 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9411 | Deterministic Interleaving Counter | `deterministic-interleaving-counter` | `concurrency_timeline` | `python_practical` |
| 9412 | Mutex-Protected Atomic Counter | `mutex-protected-counter` | `concurrency_timeline` | `python_practical` |
| 9413 | Concurrency vs Parallelism Multi-Core Model | `concurrency-vs-parallelism-cores` | `concurrency_timeline` | `python_practical` |

#### World 27: Locks, Semaphores & Deadlocks (Slug: `locks-deadlocks`)
*3 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9421 | Bounded Semaphore Permit Management | `bounded-semaphore-simulator` | `concurrency_timeline` | `python_practical` |
| 9422 | Resource Allocation Graph Deadlock Detection | `deadlock-cycle-detector` | `concurrency_timeline` | `python_practical` |
| 9423 | Hierarchical Lock Order Resolver | `hierarchical-lock-order-resolver` | `concurrency_timeline` | `python_practical` |

#### World 28: GIL & Thread/Process Pools (Slug: `gil-thread-pools`)
*2 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9402 | Python GIL: CPU-Bound vs I/O Workloads | `python-gil-contention` | `concurrency_timeline` | `python_practical` |
| 9425 | ThreadPool vs ProcessPool Workload Advisor | `thread-vs-process-pool-advisor` | `concurrency_timeline` | `python_practical` |

#### World 29: Asyncio Event Loop (Slug: `asyncio-event-loop`)
*1 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9403 | Asyncio Concurrency Throttling with Semaphores | `asyncio-event-loop-semaphore` | `concurrency_timeline` | `python_practical` |

#### World 30: Production Concurrency Boss (Slug: `production-concurrency-boss`)
*1 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9404 | Single-Flight Lock & Stampede Prevention | `single-flight-cache-lock` | `concurrency_timeline` | `python_practical` |

#### World 42: Virtual Memory & Paging (Slug: `virtual-memory-paging`)
*1 questions · Default Visualizer: `memory_view`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9431 | Virtual Memory Page Replacement & Thrashing Prevention | `virtual-memory-page-replacement` | `memory_view` | `python_practical` |

---

### 🏰 Citadel V: FastAPI, HTTP Lifecycle & Auth (`backend_apis`)
*HTTP Status Codes · JWT · Streaming · Queues · 5 Worlds · 12 Questions*
> **Citadel Description:** Complete HTTP 4xx/5xx diagnostics, JWT OAuth2 auth, Pydantic validation, and Redis/Celery job queues.

> **Pedagogical Mode:** TEACHING-FIRST Interactive Guided Journey & Pre-Wired Lab

#### World 20: HTTP & Status Codes (Slug: `backend-fastapi`)
*3 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9501 | HTTP 4xx & 5xx Status Code Diagnostics | `http-status-code-diagnostics` | `http_lifecycle` | `python_practical` |
| 9505 | HTTP Idempotency Key Store | `idempotency-key-store` | `http_lifecycle` | `python_practical` |
| 9506 | CORS Preflight OPTIONS Decision Engine | `cors-preflight-evaluator` | `http_lifecycle` | `python_practical` |

#### World 31: Auth & Security (Slug: `auth-security`)
*3 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9502 | Stateless JWT Auth & Role-Based Access Guard | `jwt-auth-role-guard` | `http_lifecycle` | `python_practical` |
| 9521 | HMAC-SHA256 Stateless Token Engine | `hmac-signed-jwt-engine` | `http_lifecycle` | `python_practical` |
| 9522 | Refresh Token Rotation with Replay Detection | `refresh-token-rotation-reuse` | `http_lifecycle` | `python_practical` |

#### World 32: FastAPI & Pydantic (Slug: `fastapi-pydantic`)
*3 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9511 | Pydantic Schema Validation & HTTP 422 | `pydantic-payload-validator` | `http_lifecycle` | `python_practical` |
| 9512 | FastAPI Dependency Injection Resolver | `dependency-injection-resolver` | `http_lifecycle` | `python_practical` |
| 9513 | Sync vs Async Def Event Loop Starvation | `sync-vs-async-handler-throughput` | `http_lifecycle` | `python_practical` |

#### World 33: Async Jobs & Polling (Slug: `async-jobs-polling`)
*2 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9503 | Asynchronous Job Dispatch & 202 Polling Pattern | `async-job-queue-polling` | `http_lifecycle` | `python_practical` |
| 9531 | HTTP 202 Polling with Exponential Backoff | `http-202-polling-backoff` | `http_lifecycle` | `python_practical` |

#### World 34: Redis & Rate Limiting Boss (Slug: `redis-rate-limiter-boss`)
*1 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9504 | Redis Sliding Window Log Rate Limiter | `redis-sliding-window-rate-limiter` | `http_lifecycle` | `python_practical` |

---

### 🏰 Citadel VI: GenAI Systems & Resume Defense (`ai_resume`)
*Embeddings · RAG · GEPA · Resume Defense · 5 Worlds · 11 Questions*
> **Citadel Description:** Production RAG, Vector DBs, genetic prompt optimization, and bullet-by-bullet live resume defense.

> **Pedagogical Mode:** TEACHING-FIRST Interactive Guided Journey & Pre-Wired Lab

#### World 21: Embeddings & Vector Math (Slug: `ai-resume-defense`)
*2 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9601 | Vector Embeddings & Cosine Similarity Search | `vector-cosine-similarity-search` | `system_blueprint` | `python_practical` |
| 9605 | Vector Nearest Neighbors Search Comparing Cosine Similarity and Dot Product | `embeddings-top-k-nearest-neighbors` | `system_blueprint` | `python_practical` |

#### World 35: Vector DBs & RAG (Slug: `vector-dbs-rag`)
*3 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9602 | Hybrid Search: Reciprocal Rank Fusion (RRF) | `reciprocal-rank-fusion-hybrid-search` | `system_blueprint` | `python_practical` |
| 9606 | Sliding Window Document Text Chunker with Token Overlap and Metadata | `rag-text-chunker-with-overlap` | `system_blueprint` | `python_practical` |
| 9607 | Deterministic Cross-Encoder Candidate Reranker by Query-Passage Relevance | `rag-cross-encoder-reranker` | `system_blueprint` | `python_practical` |

#### World 36: Agents & LangGraph (Slug: `agents-langgraph`)
*3 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9631 | StateGraph Finite State Machine with Conditional Routing | `agent-state-machine-graph` | `system_blueprint` | `python_practical` |
| 9632 | Autonomous Tool-Calling Loop with Max-Steps Guard | `agent-tool-calling-loop` | `system_blueprint` | `python_practical` |
| 9633 | Multi-Provider Gateway with Exponential Retry and Fallback Routing | `llm-provider-fallback-router` | `system_blueprint` | `python_practical` |

#### World 37: GEPA Prompt Optimization (Slug: `gepa-prompt-optimization`)
*2 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9603 | GEPA Prompt Optimizer & Token Budget Trimming | `gepa-genetic-prompt-optimizer` | `system_blueprint` | `python_practical` |
| 9608 | Genetic Prompt Optimization with Elitism, Crossover, and Mutation | `gepa-genetic-crossover-elitism` | `system_blueprint` | `python_practical` |

#### World 38: Staff Resume Defense Boss (Slug: `resume-defense-boss`)
*1 questions · Default Visualizer: `none`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9604 | Senior Engineer Live Resume Grill Simulator | `resume-bullet-architecture-grill` | `system_blueprint` | `python_practical` |

---

### 🏰 Citadel VII: Computer Networking & Protocols (`computer_networking`)
*DNS · TCP/UDP · HTTP/2 & HTTP/3 · WebSockets · TLS · 2 Worlds · 2 Questions*
> **Citadel Description:** Packet traversal, socket programming, HTTP evolution, secure handshakes, and full-duplex real-time communication.

> **Pedagogical Mode:** TEACHING-FIRST Interactive Guided Journey & Pre-Wired Lab

#### World 40: DNS & Domain Resolution (Slug: `dns-resolution`)
*1 questions · Default Visualizer: `network_flow`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9701 | Recursive DNS Resolver with Hierarchical TTL Caching | `dns-recursive-resolver` | `network_flow` | `python_practical` |

#### World 41: TCP 3-Way Handshake & Sockets (Slug: `tcp-handshake`)
*1 questions · Default Visualizer: `network_flow`*
| LC # | Title | Slug | Visualizer | Runner |
| :--- | :--- | :--- | :--- | :--- |
| 9702 | TCP 3-Way Handshake Connection State Machine | `tcp-three-way-handshake` | `network_flow` | `python_practical` |

---

## Part 4: What You (The Frontier AI) Must Research & Deliver

Perform exhaustive research and produce a comprehensive, structured master plan covering the following 5 parts:

### 1. Real-World SDE Interview & Industry Skill Audit
- Research what Tier-1 tech giants (Google, Meta, Amazon, Stripe, Uber) and high-growth engineering startups (Zerodha, Razorpay, Swiggy) actually ask SDE-1 and SDE-2 candidates.
- Audit the 198 questions above against those requirements. Detail what is missing, what is shallow, and what needs deeper practical focus.

### 2. Citadel-by-Citadel Knowledge Journey Framework
- Design the organic, multi-stage learning progression for every non-DSA Citadel (II through VII).
- Show how elementary building blocks connect into mechanisms and synthesize into real production architectures without forcing an arbitrary 3-stage limit.

### 3. Concrete Topic Teaching Blueprints
- For representative topics (e.g. HTTP Status Codes, Redis Cache-Aside & Stampede, DNS Resolution, TCP Handshake, Virtual Memory Paging, Deadlock Detection, Rate Limiting):
  - **The Hook / Product Story:** Real production context (e.g., UPI double-debit, Netflix streaming stutter).
  - **The Interactive Micro-Experiment:** Specific sliders, click-to-spam buttons, or dials.
  - **The Visual Diagram Archetype:** Where to use dbdiagram.io relational schemas, animated packet flows (ByteByteGo style), 3D isometric hardware stages, or Excalidraw-style chalkboard diagrams.
  - **The Pre-Wired Sandbox:** The exact runnable code with adjustable parameters for live experimentation.

### 4. Frontend UI/UX Redesign Specifications
- Specify how `QuestionPage.tsx` must branch: Citadel I (DSA) stays code-first; Citadels II–VII land directly on the **Interactive Concept Journey**.
- Detail the header journey progression bar and how the code editor becomes an optional, pre-loaded **Interactive Lab** tab.

### 5. Phased Implementation Roadmap
- Provide a prioritized, step-by-step engineering roadmap to update schemas, generate interactive content, and deploy the new learning experience.