import yaml
from pathlib import Path
from app.content_schema import QuestionContent

def inject_w21_vector_search():
    path = Path('content/questions/21-ai-resume-defense/vector-cosine-similarity-search.yaml')
    data = yaml.safe_load(path.read_text())

    journey = [
        {
            'id': 'w21_s1_lexical_gap',
            'title': 'The Lexical Gap: Why Keyword Search Misses Semantic Meaning',
            'subtitle': 'Why exact token matching fails on synonyms, paraphrasing, and intent',
            'scenario': 'When aircraft maintenance engineers searched enterprise technical manuals for "engine overheating during takeoff", the legacy BM25 full-text search returned 0 results. The manual chapter was titled "Turbofan High-Pressure Turbine Thermal Degradation", never using the casual words "overheating" or "engine". Why did this fail?',
            'mechanism': 'Inverted indexes match identical lexical stems or n-grams. Because the words "engine", "overheating", and "takeoff" do not literally appear in the heading or first paragraph, the BM25 lexical score is zero. The lexical gap prevents keyword engines from recognizing conceptual equivalence.',
            'prediction': {
                'prompt': 'Why does a BM25 keyword search fail when a user queries for "heart attack symptoms" and the article uses "myocardial infarction indicators"?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Because BM25 relies on exact token matching and has zero understanding that "heart attack" and "myocardial infarction" are identical clinical concepts.',
                        'explanation': 'Correct! Lexical inverted indexes match exact tokens; they cannot detect synonymy or semantic equivalence.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Because medical terms are blocked by search engine firewalls.',
                        'explanation': 'Nonsense! BM25 simply matches strings without semantic understanding.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Because BM25 only searches single-letter words.',
                        'explanation': 'Incorrect! BM25 processes arbitrary tokens.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'The lexical gap is the primary reason modern search systems require dense vector representations to bridge conceptual meaning.',
            },
            'controls': [
                {
                    'id': 'retrieval_mode',
                    'label': 'Search Paradigm',
                    'type': 'select',
                    'default': 'Lexical Keyword (BM25)',
                    'options': ['Lexical Keyword (BM25)', 'Dense Semantic Embeddings'],
                    'description': 'Algorithm used to match documents',
                },
                {
                    'id': 'query_phrase',
                    'label': 'Query Phrase',
                    'type': 'select',
                    'default': '"engine overheating during takeoff"',
                    'options': ['"engine overheating during takeoff"', '"heart attack symptoms"', '"fix memory leak"'],
                    'description': 'Simulated user search query',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'The Lexical Gap: BM25 Zero-Match vs Conceptual Equivalence'},
        },
        {
            'id': 'w21_s2_embedding_space_geometry',
            'title': 'High-Dimensional Embedding Spaces & Semantic Geometry',
            'subtitle': 'Mapping human knowledge into continuous geometric coordinate spaces',
            'scenario': 'How does an embedding neural network convert words and sentences into numbers that capture conceptual meaning?',
            'mechanism': 'The encoder maps text into an N-dimensional vector space (e.g. 1536 dimensions). During training on billions of text pairs, the network positions semantically related concepts close together. Words like "king" and "queen" share similar directional offsets to "man" and "woman", embedding latent semantic relationships directly into vector coordinates.',
            'prediction': {
                'prompt': 'In an embedding space, what geometric property indicates that two documents discuss similar topics?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Their embedding vectors point in nearly the same geometric direction, resulting in a small angle between them.',
                        'explanation': 'Correct! Semantic similarity maps to directional orientation in high-dimensional hyperspace.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Their vectors have identical file byte sizes on disk.',
                        'explanation': 'Incorrect! All vectors of dimension N have the exact same byte footprint regardless of meaning.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Their coordinate values are always prime numbers.',
                        'explanation': 'Nonsense! Embeddings consist of continuous floating-point numbers.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Dense embeddings transform the subjective question of "What does this text mean?" into a rigorous geometric calculation.',
            },
            'controls': [
                {
                    'id': 'vector_dim',
                    'label': 'Vector Dimensions',
                    'type': 'slider',
                    'default': 384,
                    'min': 64,
                    'max': 1536,
                    'step': 64,
                    'description': 'Embedding dimensionality (e.g. MiniLM vs text-embedding-3)',
                },
                {
                    'id': 'semantic_domain',
                    'label': 'Knowledge Domain',
                    'type': 'select',
                    'default': 'Aerospace & Turbines',
                    'options': ['Aerospace & Turbines', 'Medical Pathology', 'Distributed Systems'],
                    'description': 'Domain cluster to visualize',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'High-Dimensional Hypersphere Vector Projections'},
        },
        {
            'id': 'w21_s3_dot_product_vs_cosine',
            'title': 'Dot Product vs Cosine Similarity: Isolating Angle from Magnitude',
            'subtitle': 'Why unnormalized vector dot products skew rankings toward long documents',
            'scenario': 'You calculate the dot product between a short 5-word query vector and two candidate documents: Document A (a 10-word summary) and Document B (a 500-word detailed article). What unexpected bias occurs with raw dot product?',
            'mechanism': 'Dot product is A · B = ||A|| ||B|| cos(θ). If a vector has a large magnitude (common in unnormalized embeddings or longer passages), its dot product can be artificially massive even when the angle θ is large (poor conceptual match). Cosine Similarity divides by ||A|| ||B||, bounding the score to [-1, 1] and measuring pure directional alignment.',
            'prediction': {
                'prompt': 'Why can raw Dot Product produce misleading retrieval rankings compared to Cosine Similarity?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Raw dot product scales with vector magnitude; a long or heavily weighted document can achieve a higher dot product than a concise document that is much closer in actual semantic angle.',
                        'explanation': 'Correct! Dividing by norms isolates the angle θ, ensuring fair comparison regardless of text length or vector scale.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Dot product can only produce negative numbers.',
                        'explanation': 'Incorrect! Dot products can be positive, negative, or zero.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Dot product is only supported on Apple Silicon chips.',
                        'explanation': 'Nonsense! Dot product is a universal linear algebra operation.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Cosine similarity standardizes vector comparisons, ensuring that retrieval is driven by semantic orientation rather than document length bias.',
            },
            'controls': [
                {
                    'id': 'metric_choice',
                    'label': 'Distance Metric',
                    'type': 'select',
                    'default': 'Cosine Similarity (Normalized)',
                    'options': ['Cosine Similarity (Normalized)', 'Raw Dot Product (Unnormalized)'],
                    'description': 'Metric used for candidate ranking',
                },
                {
                    'id': 'doc_magnitude',
                    'label': 'Document Vector Norm (Magnitude)',
                    'type': 'slider',
                    'default': 5,
                    'min': 1,
                    'max': 10,
                    'step': 1,
                    'description': 'Magnitude multiplier simulating passage length',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Dot Product Magnitude Skew vs Cosine Angle Normalization'},
        },
        {
            'id': 'w21_s4_unit_normalization',
            'title': 'Unit Vector Normalization & Euclidean Equivalence',
            'subtitle': 'How pre-normalizing vectors turns expensive cosine calculations into fast dot products',
            'scenario': 'In production vector databases (pgvector, Milvus, Qdrant), computing cosine similarity across millions of rows is computationally intensive because of square roots and divisions. How do databases optimize this?',
            'mechanism': 'Unit Normalization! During ingestion, every document vector is pre-normalized to unit length: v_norm = v / ||v||, so ||v_norm|| = 1.0. When vectors are unit-normalized, the cosine similarity formula simplifies to sim(A, B) = A_norm · B_norm. The expensive square roots disappear, allowing real-time SIMD hardware dot products.',
            'prediction': {
                'prompt': 'When all vectors stored in a vector database are pre-normalized to unit length (||v|| = 1.0), what mathematical optimization becomes possible?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Cosine similarity becomes identical to raw dot product, eliminating expensive square root calculations during real-time queries.',
                        'explanation': 'Correct! Since the denominator ||A|| * ||B|| equals 1.0, cosine similarity reduces to a blazing-fast dot product.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The database size shrinks to 0 bytes.',
                        'explanation': 'Incorrect! The floating-point numbers remain in storage.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Queries run in O(0) constant quantum time.',
                        'explanation': 'Nonsense! Queries still require O(N * D) operations or index traversal.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Pre-normalizing vectors at ingestion time is the bedrock optimization enabling vector databases to execute millions of nearest-neighbor checks per second.',
            },
            'controls': [
                {
                    'id': 'unit_normalization',
                    'label': 'Pre-Normalize Vectors (||v|| = 1)',
                    'type': 'toggle',
                    'default': True,
                    'description': 'Normalize vectors to unit sphere during indexing',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Unit Sphere Normalization & SIMD Dot Product Fast-Path'},
        },
        {
            'id': 'w21_s5_top_k_rag_pipeline',
            'title': 'Top-K Nearest Neighbor Retrieval in Production RAG',
            'subtitle': 'Selecting the optimal context window budget for LLM generation',
            'scenario': 'A user asks an LLM: "Why did payment gateway webhook retries fail?" How does a RAG retrieval pipeline choose the exact passages to inject into the prompt?',
            'mechanism': 'The query is embedded into a vector. The vector index executes a Top-K nearest neighbor search (e.g. K=3). The top 3 chunks with highest cosine similarity are retrieved and formatted into the LLM system prompt: "Context: {chunks} ... Answer: {query}". Choosing K balances context completeness against token cost and prompt distraction.',
            'prediction': {
                'prompt': 'In a RAG pipeline, what happens if K is set too small (e.g. K=1) vs too large (e.g. K=50)?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'If K=1, crucial context might be missed (under-retrieval); if K=50, the LLM prompt context window is flooded with irrelevant noise (distraction and high token cost).',
                        'explanation': 'Correct! Production RAG requires tuning K to provide sufficient factual grounding without diluting model attention.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'If K=50, the LLM catches fire.',
                        'explanation': 'Nonsense! The model simply spends more tokens and may hallucinate due to noise.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Changing K has zero effect on LLM output.',
                        'explanation': 'Misconception! Context window contents directly dictate generative responses.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Tuning Top-K and setting similarity cutoff thresholds are critical engineering levers in production RAG systems.',
            },
            'controls': [
                {
                    'id': 'top_k_slider',
                    'label': 'Top-K Retrieved Chunks',
                    'type': 'slider',
                    'default': 3,
                    'min': 1,
                    'max': 10,
                    'step': 1,
                    'description': 'Number of document chunks injected into prompt',
                },
                {
                    'id': 'similarity_cutoff',
                    'label': 'Similarity Cutoff Threshold',
                    'type': 'slider',
                    'default': 0.75,
                    'min': 0.50,
                    'max': 0.95,
                    'step': 0.05,
                    'description': 'Minimum cosine similarity required for inclusion',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'RAG Prompt Context Assembly & Chunk Injection'},
        },
        {
            'id': 'w21_s6_transfer_challenge',
            'title': 'Transfer Challenge: Vector Cosine Similarity Search Engine',
            'subtitle': 'Build the dense vector ranking engine from scratch',
            'scenario': 'Implement `search_similar_chunks(query_vec: list[float], chunks: list[dict], top_k: int) -> list[dict]` to rank and retrieve document chunks.',
            'mechanism': '1. Return [] if chunks is empty or top_k <= 0. 2. Compute dot product, query norm, and chunk norm. If either norm is 0, similarity is 0.0, else round(dot / (norm_q * norm_c), 4). 3. Sort chunks descending by similarity (preserving original order for ties). 4. Return top top_k items as [{"id": c["id"], "text": c["text"], "similarity": similarity}].',
            'prediction': {
                'prompt': 'Given query_vec = [1.0, 0.0] and chunk embedding = [0.0, 1.0], what is their cosine similarity?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': '0.0 (They are completely orthogonal, at a 90-degree angle, indicating zero semantic overlap).',
                        'explanation': 'Correct! Dot product is (1*0) + (0*1) = 0. Cosine similarity of 0.0 denotes orthogonal vectors.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': '1.0 (Identical meaning).',
                        'explanation': 'Incorrect! Identical vectors would be [1.0, 0.0].',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': '-1.0 (Opposite meaning).',
                        'explanation': 'Incorrect! Opposite vectors point in the direction [-1.0, 0.0].',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Implement the vector similarity search engine in the code editor below and verify against all test cases.',
            },
            'controls': [
                {
                    'id': 'run_verification',
                    'label': 'Run Full Vector Similarity Tests',
                    'type': 'button',
                    'default': True,
                    'description': 'Execute test suite validating cosine calculation, zero-norm handling, and top-K sorting',
                },
            ],
            'lab_starter_code': data.get('starter_code', ''),
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Vector Cosine Similarity Sandbox'},
        },
    ]

    data['journey'] = journey
    QuestionContent(**data)
    path.write_text(yaml.dump(data, sort_keys=False))
    print(f'Successfully injected {len(journey)} stages into {path}')

def inject_w35_rrf():
    path = Path('content/questions/21-ai-resume-defense/reciprocal-rank-fusion-hybrid-search.yaml')
    data = yaml.safe_load(path.read_text())

    journey = [
        {
            'id': 'w35_s1_dense_blindspot',
            'title': 'The Dense Embedding Blindspot: Serial Numbers, SKUs & Exact Codes',
            'subtitle': 'Why semantic embeddings fail on precise alphanumeric identifiers',
            'scenario': 'Aircraft maintenance mechanics asked WisdomBot for exact fastener specifications: MS21042-4 locknut torque limits. Pure dense vector search retrieved general articles about "threaded fasteners and bolt tightening". Why did it fail to return the exact part document?',
            'mechanism': 'Subword tokenizers break unfamiliar alphanumeric codes into generic fragments (MS, 21042, 4). The embedding model clusters the vector near general "fastener tightening". Documents containing completely different models score nearly identical cosine similarity, losing exact token identity.',
            'prediction': {
                'prompt': 'Why does dense vector search frequently fail on exact part numbers like MS21042-4 or error codes like ORA-01403?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Embedding models project text into semantic concept space, blurring rare alphanumeric strings into general topical clusters and losing exact token identity.',
                        'explanation': 'Correct! Dense embeddings optimize for broad conceptual meaning, making them blind to exact token matches.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Vector databases only support words found in standard dictionaries.',
                        'explanation': 'Incorrect! Vector models process arbitrary subwords, but blur their exact meaning.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'High-dimensional math cannot represent numbers greater than 100.',
                        'explanation': 'Nonsense! Vector components are standard floating-point coordinates.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Exact identifiers require lexical keyword indexes to guarantee precise token retrieval.',
            },
            'controls': [
                {
                    'id': 'query_type',
                    'label': 'Query Structure',
                    'type': 'select',
                    'default': 'Exact Part Code (MS21042-4)',
                    'options': ['Exact Part Code (MS21042-4)', 'Natural Language Paraphrase'],
                    'description': 'Type of search query',
                },
                {
                    'id': 'retriever_engine',
                    'label': 'Retriever Engine',
                    'type': 'select',
                    'default': 'Pure Dense Vector Search',
                    'options': ['Pure Dense Vector Search', 'Hybrid BM25 + Vector'],
                    'description': 'Active search system architecture',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Subword Fragmentation & Alphanumeric Blurring in Embeddings'},
        },
        {
            'id': 'w35_s2_sparse_bm25_blindspot',
            'title': 'The Sparse BM25 Blindspot: Synonyms, Paraphrasing & Conceptual Queries',
            'subtitle': 'Why keyword matching fails when vocabulary diverges',
            'scenario': 'A user queries: "How do I upgrade to the paid plan?" The documentation page uses the heading: "Subscription Billing & Tier Elevation". How does BM25 perform?',
            'mechanism': 'BM25 searches for term frequency and inverse document frequency of the exact tokens upgrade, paid, plan. None of these tokens appear in the target passage. BM25 scores it as 0.0, completely missing the most relevant document in the knowledge base.',
            'prediction': {
                'prompt': 'In what scenario does a sparse lexical retriever (like BM25) completely fail to return the correct document?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'When the user expresses their intent using synonyms or colloquial phrasing that does not contain the exact vocabulary used in the document text.',
                        'explanation': 'Correct! Lexical search requires exact term overlap and cannot bridge synonymy.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'When documents contain fewer than 10 words.',
                        'explanation': 'Incorrect! BM25 functions on short documents as long as keywords match.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'When the search index is stored on an SSD instead of RAM.',
                        'explanation': 'Irrelevant! Hardware storage media does not alter ranking logic.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Neither dense vector search nor sparse BM25 is sufficient on its own. Production enterprise RAG demands Hybrid Search.',
            },
            'controls': [
                {
                    'id': 'lexical_overlap',
                    'label': 'Keyword Vocabulary Overlap',
                    'type': 'slider',
                    'default': 0,
                    'min': 0,
                    'max': 100,
                    'step': 10,
                    'description': 'Percentage of query words appearing in document text',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'BM25 Term Frequency vs Synonym Vocabulary Disconnect'},
        },
        {
            'id': 'w35_s3_uncalibrated_score_trap',
            'title': 'The Uncalibrated Score Trap: Why BM25 + Cosine Breaks',
            'subtitle': 'The mathematical peril of adding unbounded lexical scores to bounded cosine metrics',
            'scenario': 'An engineer tries to combine BM25 and vector search by calculating a combined score: score = 0.5 * bm25_score + 0.5 * cosine_score. What goes wrong?',
            'mechanism': 'Cosine similarity is bounded strictly between [-1.0, 1.0] (typically [0.0, 1.0] for text). BM25 scores, however, depend on document length and inverse document frequency, frequently reaching values like 18.5, 42.1, or higher. Adding them directly means BM25 completely drowns out the cosine score, effectively reducing the hybrid search to a pure keyword search.',
            'prediction': {
                'prompt': 'What happens if an engineer linearly sums raw BM25 scores and raw Cosine Similarity scores?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Uncalibrated score mismatch: BM25 scores are unbounded [0, infinity) while Cosine scores are bounded [-1, 1], allowing BM25 magnitudes to completely dominate ranking.',
                        'explanation': 'Correct! Raw score combination allows arbitrary lexical score scales to overwhelm semantic similarity.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The scores cancel each other out to zero every time.',
                        'explanation': 'Incorrect! Both scores are generally positive for relevant documents.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'The CPU encounters a floating-point overflow interrupt.',
                        'explanation': 'Nonsense! Standard 64-bit floats handle numbers up to 10^308.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Linear score fusion without complex per-corpus normalization is fundamentally unstable. Reciprocal Rank Fusion eliminates score calibration entirely.',
            },
            'controls': [
                {
                    'id': 'bm25_score_val',
                    'label': 'Simulated BM25 Raw Score',
                    'type': 'slider',
                    'default': 28,
                    'min': 0,
                    'max': 50,
                    'step': 2,
                    'description': 'Raw BM25 lexical score',
                },
                {
                    'id': 'cosine_score_val',
                    'label': 'Simulated Cosine Similarity',
                    'type': 'slider',
                    'default': 0.85,
                    'min': 0.0,
                    'max': 1.0,
                    'step': 0.05,
                    'description': 'Bounded cosine similarity score',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Uncalibrated Scale Comparison: BM25 [0, inf) vs Cosine [0, 1]'},
        },
        {
            'id': 'w35_s4_rrf_mechanics',
            'title': 'Reciprocal Rank Fusion (RRF) Mechanics & Constant k=60',
            'subtitle': 'Ordinal rank fusion that balances dense and sparse signals without normalization',
            'scenario': 'How does Reciprocal Rank Fusion solve the uncalibrated score problem without requiring complex score normalization?',
            'mechanism': 'RRF ignores raw score values entirely and operates strictly on ordinal rank positions! RRF(d) = 1/(k + rank_dense(d)) + 1/(k + rank_sparse(d)). If a document ranks #1 in dense and #1 in sparse with k=60: Score = 1/61 + 1/61 = 0.03278. The constant k=60 dampens the exponential advantage of ranking #1 over ranking #2, rewarding documents that consistently appear across both retrieval lists.',
            'prediction': {
                'prompt': 'In Reciprocal Rank Fusion, what happens to a document that ranks near the top of BOTH the dense vector search and sparse BM25 search?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'It receives a compounded score boost from both rank reciprocal terms, outranking documents that only scored well in a single retriever.',
                        'explanation': 'Correct! Documents validated by both keyword and semantic retrieval receive cumulative rank reciprocals, rising to the top.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Its score is subtracted because duplicate appearances are penalized.',
                        'explanation': 'Incorrect! RRF is additive; appearing in both lists is rewarded.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'It is filtered out as an anomalous outlier.',
                        'explanation': 'Nonsense! Dual-list presence is the strongest possible signal of relevance.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'RRF provides a mathematically stable, parameter-light method to fuse disparate retrieval systems in production.',
            },
            'controls': [
                {
                    'id': 'smoothing_constant_k',
                    'label': 'RRF Smoothing Constant (k)',
                    'type': 'slider',
                    'default': 60,
                    'min': 10,
                    'max': 100,
                    'step': 10,
                    'description': 'Outlier damping parameter (standard value: 60)',
                },
                {
                    'id': 'rank_scenario',
                    'label': 'Candidate Document Ranks',
                    'type': 'select',
                    'default': 'Doc B: Rank #1 Dense, Rank #1 Sparse',
                    'options': [
                        'Doc B: Rank #1 Dense, Rank #1 Sparse',
                        'Doc A: Rank #1 Dense, Missing Sparse',
                        'Doc C: Missing Dense, Rank #1 Sparse',
                    ],
                    'description': 'Simulated rank positions across retrievers',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'RRF Curve: Rank Reciprocal Score vs Rank Position'},
        },
        {
            'id': 'w35_s5_cross_encoder_reranking',
            'title': 'Production Hybrid Architecture: Fast RRF + Deep Cross-Encoder',
            'subtitle': 'The 2-stage retrieval pattern powering production search at OpenAI and Cohere',
            'scenario': 'How do top-tier RAG platforms achieve state-of-the-art retrieval accuracy at millisecond latencies?',
            'mechanism': 'Two-stage retrieval pipeline: Stage 1 (Fast Retrieval): Retrieve top 50 candidates using Hybrid Search (BM25 + Dense Embeddings fused via RRF) in ~15ms. Stage 2 (Precision Reranking): Feed the 50 candidate passages through a Cross-Encoder model (which attends across query and document tokens simultaneously) to produce deeply contextual semantic scores, selecting the final top 3 passages for the LLM.',
            'prediction': {
                'prompt': 'Why don\'t production search engines run Cross-Encoders across the entire 10,000,000 document corpus directly?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Cross-Encoders process full query-document token interactions simultaneously, making them hundreds of times too slow for full corpus search; using them as a second-stage reranker on top-50 candidates balances speed and accuracy.',
                        'explanation': 'Correct! Cross-Encoders are O(N * (Q+D)^2) attention models, too expensive for millions of docs but ideal for top 50 reranking.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Cross-Encoders can only process documents written in Latin.',
                        'explanation': 'Nonsense! Cross-encoders are multilingual transformer models.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Cross-Encoders consume 1TB of network bandwidth per query.',
                        'explanation': 'Incorrect! The bottleneck is GPU tensor computation, not network bandwidth.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'The two-stage pipeline (Bi-Encoder/BM25 fast recall + Cross-Encoder precision rerank) represents the gold standard in modern information retrieval.',
            },
            'controls': [
                {
                    'id': 'first_stage_pool',
                    'label': 'First-Stage Candidate Pool Size',
                    'type': 'slider',
                    'default': 50,
                    'min': 10,
                    'max': 100,
                    'step': 10,
                    'description': 'Number of candidates sent to cross-encoder',
                },
                {
                    'id': 'rerank_architecture',
                    'label': 'Reranking Strategy',
                    'type': 'select',
                    'default': 'Two-Stage (RRF Recall -> Cross-Encoder Precision)',
                    'options': [
                        'Two-Stage (RRF Recall -> Cross-Encoder Precision)',
                        'Single-Stage RRF Only (Fastest)',
                    ],
                    'description': 'Pipeline architecture configuration',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Two-Stage Retrieval: Bi-Encoder RRF + Cross-Encoder Reranker'},
        },
        {
            'id': 'w35_s6_transfer_challenge',
            'title': 'Transfer Challenge: Reciprocal Rank Fusion Hybrid Search Engine',
            'subtitle': 'Build the production RRF ranking algorithm',
            'scenario': 'Implement `reciprocal_rank_fusion(dense_ranks: list[str], sparse_ranks: list[str], k: int = 60) -> list[dict]` to fuse dense and sparse search rankings.',
            'mechanism': '1. Return [] if both dense_ranks and sparse_ranks are empty. 2. Accumulate reciprocal scores: for index i in dense_ranks, add 1.0 / (k + i + 1). For index j in sparse_ranks, add 1.0 / (k + j + 1). 3. Round scores to 6 decimal places. 4. Sort unique documents: primary by rrf_score descending, secondary by doc_id alphabetically ascending. 5. Return list of dicts: [{"doc_id": doc, "rrf_score": score}].',
            'prediction': {
                'prompt': 'Given dense_ranks = ["docA", "docB"] and sparse_ranks = ["docB", "docC"] with k=60, which document achieves the highest RRF score?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'docB (Ranks #2 in dense and #1 in sparse, yielding 1/62 + 1/61 = 0.032522, outperforming docA and docC).',
                        'explanation': 'Correct! Appearing on both lists provides a compound reciprocal score that wins the ranking.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'docA because it was listed first in dense_ranks.',
                        'explanation': 'Incorrect! docA only gets 1/61 = 0.016393 since it is absent in sparse_ranks.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'docC because sparse search has higher priority.',
                        'explanation': 'Incorrect! RRF treats both ranks symmetrically without artificial retriever bias.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Implement the RRF algorithm in the code editor below and verify with all test cases.',
            },
            'controls': [
                {
                    'id': 'run_verification',
                    'label': 'Run Full RRF Fusion Tests',
                    'type': 'button',
                    'default': True,
                    'description': 'Execute test suite validating single lists, dual list fusion, tie-breaking, and empty inputs',
                },
            ],
            'lab_starter_code': data.get('starter_code', ''),
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Reciprocal Rank Fusion Sandbox'},
        },
    ]

    data['journey'] = journey
    QuestionContent(**data)
    path.write_text(yaml.dump(data, sort_keys=False))
    print(f'Successfully injected {len(journey)} stages into {path}')

def inject_w36_agents():
    path = Path('content/questions/36-agents-langgraph/agent-state-machine-graph.yaml')
    data = yaml.safe_load(path.read_text())

    journey = [
        {
            'id': 'w36_s1_script_fragility',
            'title': 'Monolithic Script Spaghetti vs StateGraph Architecture',
            'subtitle': 'Why hardcoded scripts fail on non-linear multi-step agent workflows',
            'scenario': 'A developer attempts to orchestrate a customer support LLM pipeline using a 500-line Python script with nested while and if loops. What happens when a new refund policy requires human approval before payment?',
            'mechanism': 'In monolithic scripts, control flow, prompt construction, and tool execution are tightly coupled. Adding non-linear steps (like human approval or multi-turn retries) requires rewriting core loop mechanics. In a StateGraph, adding a human-in-the-loop step simply means adding an approval node and updating two edge pointers.',
            'prediction': {
                'prompt': 'What is the primary architectural advantage of modeling agent workflows as a directed graph rather than a sequential script?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Nodes and conditional edges decouple state transformation from routing decisions, allowing complex non-linear branching, cyclical retries, and modular testing.',
                        'explanation': 'Correct! StateGraphs separate what a node does (state mutation) from where the workflow goes next (routing).',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Directed graphs allow Python code to run directly on GPU tensor cores.',
                        'explanation': 'Incorrect! StateGraphs are Python orchestration abstractions, not GPU kernels.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Scripts are only supported on Windows operating systems.',
                        'explanation': 'Nonsense! Python scripts run across all major operating systems.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'StateGraphs model complex autonomous agent workflows cleanly as directed cyclic graphs where state moves between specialized nodes.',
            },
            'controls': [
                {
                    'id': 'orchestration_paradigm',
                    'label': 'Architecture Style',
                    'type': 'select',
                    'default': 'Directed StateGraph (LangGraph)',
                    'options': ['Directed StateGraph (LangGraph)', 'Monolithic Script (Nested Ifs)'],
                    'description': 'Workflow coordination model',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Monolithic Script Spaghetti vs Directed StateGraph'},
        },
        {
            'id': 'w36_s2_shared_state_contract',
            'title': 'The Shared State Contract: State Mutation & Context Flow',
            'subtitle': 'Passing structured data dictionaries deterministically across workflow vertices',
            'scenario': 'In an agent graph, how do different nodes (like a query classifier and a billing agent) share information without global variables?',
            'mechanism': 'The workflow passes a centralized state dictionary between nodes. Each node receives the current state, performs its task, and returns updated state fields (e.g. {"intent": "billing", "log": ["classified"]}). State reducers merge updates deterministically into the shared context.',
            'prediction': {
                'prompt': 'How is context communicated between independent nodes in a StateGraph?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Via a centralized state dictionary passed into and updated by each node along the execution path.',
                        'explanation': 'Correct! Shared state contracts ensure clean data isolation and predictable state progression.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Through global operating system environment variables.',
                        'explanation': 'Antipattern! Global state creates race conditions and prevents concurrent agent sessions.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'By saving JSON files to disk between each node execution.',
                        'explanation': 'Inefficient! Disk I/O between every node adds unnecessary latency.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Explicit state dictionaries ensure that agent execution is reproducible, serializable, and easily testable.',
            },
            'controls': [
                {
                    'id': 'context_passing',
                    'label': 'Context Mechanism',
                    'type': 'select',
                    'default': 'Typed State Dictionary',
                    'options': ['Typed State Dictionary', 'Global Variables'],
                    'description': 'How nodes communicate execution state',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'State Transformation Timeline: State In -> Node -> State Out'},
        },
        {
            'id': 'w36_s3_specialized_nodes',
            'title': 'Nodes as Specialized Execution Units',
            'subtitle': 'Applying the Principle of Least Privilege to agent prompts and tools',
            'scenario': 'You have 3 specialized support agents: billing_agent (handles refunds and charges), auth_agent (handles password and 2FA resets), and general_agent (handles FAQs). How are they represented?',
            'mechanism': 'Each agent is an isolated Node in the graph. The node encapsulates specific system prompts, specialized tools (e.g. only billing_agent has access to the Stripe refund API), and constrained output schemas.',
            'prediction': {
                'prompt': 'Why is it safer to separate agents into specialized nodes rather than having one massive prompt with all tools enabled?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Principle of Least Privilege: Giving each node only the tools and instructions relevant to its domain prevents tool hallucinations and unauthorized actions.',
                        'explanation': 'Correct! Constraining tool access per node dramatically reduces hallucination surface area and security vulnerabilities.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'LLMs refuse to run if they have more than 2 tools.',
                        'explanation': 'Incorrect! LLMs can accept many tools, but accuracy degrades and security risks multiply.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Massive prompts are automatically blocked by cloud firewalls.',
                        'explanation': 'Nonsense! Prompts are limited by context window, not firewalls.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Specialized domain nodes allow fine-grained permission boundaries and targeted evaluation across distinct agent capabilities.',
            },
            'controls': [
                {
                    'id': 'node_architecture',
                    'label': 'Agent Specialization',
                    'type': 'select',
                    'default': 'Modular Domain Nodes (Least Privilege)',
                    'options': ['Modular Domain Nodes (Least Privilege)', 'Monolithic All-In-One Prompt'],
                    'description': 'Tool access boundary design',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Domain Isolation: Specialized Agents & Scoped Toolsets'},
        },
        {
            'id': 'w36_s4_conditional_edges',
            'title': 'Conditional Edges: Dynamic Intent-Driven State Routing',
            'subtitle': 'Dynamic edge resolution functions that steer execution graph trajectories',
            'scenario': 'After the classifier node inspects the user\'s query and sets state[\'intent\'] = \'billing\', how does the graph transition to the billing agent?',
            'mechanism': 'Conditional Edges! Instead of hardcoding a direct link from classifier to billing_agent, the edge between classifier and the next node is dynamic: route_after_classification(state) inspects state[\'intent\'] and returns the string identifier of the destination node. The graph engine calls this function to resolve the next vertex dynamically.',
            'prediction': {
                'prompt': 'How does a StateGraph decide which node to execute after the classifier completes?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'A conditional edge routing function inspects state attributes (like intent) and returns the string identifier of the target node.',
                        'explanation': 'Correct! Dynamic edge functions evaluate state outputs to determine graph transitions.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The operating system kernel chooses the next node at random.',
                        'explanation': 'Incorrect! Routing is deterministic based on user intent and state data.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'All nodes run simultaneously in an uncoordinated race condition.',
                        'explanation': 'Incorrect! The graph coordinates sequential or parallel execution according to edge topology.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Conditional edges provide the dynamic steering mechanism that makes agent graphs adaptable to arbitrary customer intents.',
            },
            'controls': [
                {
                    'id': 'customer_intent',
                    'label': 'Sample Customer Query',
                    'type': 'select',
                    'default': '"I need a refund on order 123" (Billing)',
                    'options': [
                        '"I need a refund on order 123" (Billing)',
                        '"Please reset my password" (Auth)',
                        '"What are your business hours?" (General)',
                    ],
                    'description': 'Input query steering the conditional edge',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Conditional Edge Branching: Classifier -> Specialized Agents'},
        },
        {
            'id': 'w36_s5_step_budget_guardrails',
            'title': 'Cyclic Execution & Step Budget Guardrails (max_steps)',
            'subtitle': 'Preventing infinite loops, runaway recursion, and billing explosions',
            'scenario': 'An agent attempts to solve a problem: if tool execution fails, it reflects and retries (a cycle in the graph). What happens if the tool continuously errors or the LLM hallucinates an invalid argument in an infinite loop?',
            'mechanism': 'The graph will loop forever, consuming thousands of dollars in LLM API tokens. To prevent runaway costs and server resource starvation, all production agent graph runtimes enforce an explicit max_steps execution ceiling. If step_count >= max_steps, the graph forcibly halts with status "max_steps_exceeded".',
            'prediction': {
                'prompt': 'Why must an agentic StateGraph enforce an explicit max_steps execution guard?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'To prevent infinite execution loops and runaway API token costs caused by cyclical tool retry failures or circular routing logic.',
                        'explanation': 'Correct! Without a step budget, non-terminating cycles in agent graphs drain API budgets and stall server workers.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Because Python can only count up to 10.',
                        'explanation': 'Nonsense! Python supports arbitrarily large integers.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Because web browsers crash if an agent runs for more than 3 seconds.',
                        'explanation': 'Incorrect! Step budgets protect backend resources, independent of browsers.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Every cyclic agent graph in production must enforce strict step and timeout budgets to guarantee deterministic termination.',
            },
            'controls': [
                {
                    'id': 'max_steps_slider',
                    'label': 'Max Steps Budget',
                    'type': 'slider',
                    'default': 10,
                    'min': 1,
                    'max': 25,
                    'step': 1,
                    'description': 'Execution ceiling before forced termination',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Step Budget Counter & Loop Termination Guard'},
        },
        {
            'id': 'w36_s6_transfer_challenge',
            'title': 'Transfer Challenge: Agentic Customer Support StateGraph Engine',
            'subtitle': 'Build the LangGraph-style state machine router',
            'scenario': 'Implement `run_state_graph(initial_state: dict, max_steps: int = 10) -> dict` across classifier and domain agents.',
            'mechanism': '1. Start at "classifier". If query has "refund", intent="billing". If "reset", intent="auth". Else intent="general". Append "classified" to log. 2. Route to billing_agent, auth_agent, or general_agent based on intent. 3. Each agent appends its resolution to log, sets resolved=True, and routes to "__end__". 4. Enforce max_steps guard. Return final_state, visited_nodes, and status.',
            'prediction': {
                'prompt': 'Given initial_state with query "Please reset my password", what node sequence is visited?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': '["classifier", "auth_agent"] with final status "completed" and resolved=True.',
                        'explanation': 'Correct! The query matches "reset", routing from classifier to auth_agent which transitions to __end__.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': '["classifier", "billing_agent"] with status "completed".',
                        'explanation': 'Incorrect! A password reset query routes to auth, not billing.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': '["classifier"] with status "max_steps_exceeded".',
                        'explanation': 'Incorrect! The workflow successfully traverses to auth_agent in 2 steps.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Implement the state graph in the code editor below and verify with all routing scenarios.',
            },
            'controls': [
                {
                    'id': 'run_verification',
                    'label': 'Run Full StateGraph Tests',
                    'type': 'button',
                    'default': True,
                    'description': 'Execute test suite validating intent routing, state mutation, and max_steps guards',
                },
            ],
            'lab_starter_code': data.get('starter_code', ''),
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Agentic StateGraph Engine Sandbox'},
        },
    ]

    data['journey'] = journey
    QuestionContent(**data)
    path.write_text(yaml.dump(data, sort_keys=False))
    print(f'Successfully injected {len(journey)} stages into {path}')

def inject_w37_gepa():
    path = Path('content/questions/21-ai-resume-defense/gepa-genetic-prompt-optimizer.yaml')
    data = yaml.safe_load(path.read_text())

    journey = [
        {
            'id': 'w37_s1_verbose_prompt_trap',
            'title': 'The Verbose Prompt Trap: Why Conversational Filler Costs $35,000/mo',
            'subtitle': 'How unformatted instructions and polite filler explode enterprise API bills',
            'scenario': 'When running hundreds of thousands of automated UI verification runs across GPT-4o, Drizz\'s monthly OpenAI API invoice suddenly surged past $35,000. An audit revealed that engineers had crafted a verbose 1,800-token system prompt containing conversational filler ("Please be polite and ensure that you always..."). Why was this costly?',
            'mechanism': 'LLM APIs bill for every input token on every API call. Adding 100 unnecessary tokens across 1,000,000 monthly API calls costs 100,000,000 wasted input tokens with zero benefit to reasoning accuracy. Furthermore, verbose preambles dilute attention mechanisms on complex instructions.',
            'prediction': {
                'prompt': 'How does conversational filler ("Please be polite and carefully think...") impact production LLM applications?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'It increases API billing costs linearly across every API invocation and dilutes attention on crucial technical constraints without improving accuracy.',
                        'explanation': 'Correct! Conversational padding wastes money on every request and clutters model attention.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'It makes the LLM happier and prevents model hallucinations.',
                        'explanation': 'Misconception! LLMs are mathematical transformer functions, not human beings.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'It speeds up generation speed because polite prompts run on higher-priority servers.',
                        'explanation': 'Nonsense! Token count increases processing latency.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Pruning conversational fluff and structuring instructions into dense Markdown schemas saves tens of thousands of dollars in production.',
            },
            'controls': [
                {
                    'id': 'monthly_api_volume',
                    'label': 'Monthly API Request Volume',
                    'type': 'slider',
                    'default': 500000,
                    'min': 50000,
                    'max': 1000000,
                    'step': 50000,
                    'description': 'Number of LLM invocations per month',
                },
                {
                    'id': 'filler_tokens',
                    'label': 'Wasted Filler Tokens per Request',
                    'type': 'slider',
                    'default': 150,
                    'min': 20,
                    'max': 500,
                    'step': 20,
                    'description': 'Unnecessary conversational padding in system prompt',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Token Inflation Cost Curve: Filler Tokens vs Monthly Invoice'},
        },
        {
            'id': 'w37_s2_prompts_as_genomes',
            'title': 'Prompts as Genomes: The Genetic Search Space',
            'subtitle': 'Treating prompt variations as evolutionary candidates evaluated on benchmarks',
            'scenario': 'How can we search through thousands of possible prompt phrasings to find the best candidate without manually testing each one?',
            'mechanism': 'Treat the system prompt as a genome! A population of prompt variants is generated through programmatic mutations (e.g., converting prose to bullet points, extracting JSON schemas, reordering constraints). The algorithm evaluates the fitness of each candidate and evolves better candidates over successive generations.',
            'prediction': {
                'prompt': 'In genetic prompt optimization (GEPA), what represents the "individual genome"?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'A candidate system prompt string with specific instructions, formatting styles, and phrasing.',
                        'explanation': 'Correct! The prompt text itself is the discrete genome subject to mutation and selection.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'The physical CPU chip running the server.',
                        'explanation': 'Incorrect! The optimization operates on software prompts, not hardware.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'The Python interpreter executable file.',
                        'explanation': 'Incorrect! The Python interpreter remains unchanged.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Evolutionary algorithms transform intuitive prompt hacking into a reproducible, automated optimization pipeline.',
            },
            'controls': [
                {
                    'id': 'population_size',
                    'label': 'Candidate Population Size',
                    'type': 'slider',
                    'default': 20,
                    'min': 5,
                    'max': 50,
                    'step': 5,
                    'description': 'Number of active prompt variations per generation',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Prompt Population Generation & Evolutionary Tree'},
        },
        {
            'id': 'w37_s3_fitness_penalty_function',
            'title': 'The Multi-Objective Fitness Function: Accuracy vs Token Cost Penalty',
            'subtitle': 'Formulating mathematical constraints against prompt bloat',
            'scenario': 'If an optimizer only maximized accuracy, it would choose a 5,000-token prompt with 50 few-shot examples. If it only minimized token count, it would choose a 2-word prompt that fails on edge cases. How do we balance both?',
            'mechanism': 'A composite fitness function! 1. Measure benchmark accuracy on test queries: accuracy in [0.0, 1.0]. 2. If tokens > token_budget: cost_penalty = (tokens - token_budget) * 0.01. 3. If tokens <= token_budget: cost_penalty = 0.0. 4. Final fitness: fitness = accuracy - cost_penalty. This creates a steep penalty surface against prompt bloat.',
            'prediction': {
                'prompt': 'Given a candidate with accuracy 0.95 and 250 tokens under a budget of 200 tokens (penalty 0.01 per excess token), what is its fitness?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': '0.45 (Penalty is (250 - 200) * 0.01 = 0.50; fitness = 0.95 - 0.50 = 0.45).',
                        'explanation': 'Correct! 0.95 - 0.50 = 0.45, heavily disincentivizing the candidate for exceeding the budget.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': '0.95 because accuracy is the only metric that matters.',
                        'explanation': 'Misconception! Production systems must account for token economics.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': '0.0 because it exceeded the budget.',
                        'explanation': 'Incorrect! The penalty degrades fitness proportionally rather than zeroing it out entirely.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'A dual-objective fitness function forces the genetic algorithm to find concise prompts that maintain high accuracy.',
            },
            'controls': [
                {
                    'id': 'budget_tokens',
                    'label': 'Target Token Budget',
                    'type': 'slider',
                    'default': 200,
                    'min': 100,
                    'max': 500,
                    'step': 25,
                    'description': 'Maximum allowable tokens without penalty',
                },
                {
                    'id': 'candidate_tokens',
                    'label': 'Candidate Token Length',
                    'type': 'slider',
                    'default': 250,
                    'min': 100,
                    'max': 500,
                    'step': 25,
                    'description': 'Tested candidate token count',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Fitness Surface: Accuracy minus Token Budget Penalty'},
        },
        {
            'id': 'w37_s4_pareto_efficiency',
            'title': 'The Pareto Efficiency Frontier: Selecting Non-Dominated Candidates',
            'subtitle': 'Identifying candidates that cannot be improved in accuracy without increasing cost',
            'scenario': 'You have 3 candidate prompts: Candidate A (95% accuracy, 180 tokens), Candidate B (90% accuracy, 120 tokens), and Candidate C (85% accuracy, 220 tokens). Which candidate is strictly inferior?',
            'mechanism': 'Candidate C is dominated: it has lower accuracy AND more tokens than Candidate A! Candidates A and B lie on the Pareto Frontier: neither is strictly better on both dimensions; Candidate A offers higher accuracy, while Candidate B offers lower cost. Genetic selection preserves the Pareto frontier to find the optimal trade-off point.',
            'prediction': {
                'prompt': 'In multi-objective prompt optimization, when is Candidate X considered "dominated" by Candidate Y?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'When Candidate Y achieves both equal or higher accuracy AND uses equal or fewer tokens than Candidate X.',
                        'explanation': 'Correct! A candidate is Pareto-dominated if another solution outperforms it across all objectives.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'When Candidate X has an older timestamp.',
                        'explanation': 'Irrelevant! Pareto dominance is based on metric coordinates, not creation time.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'When Candidate Y was written by human engineers.',
                        'explanation': 'Nonsense! Optimization is strictly data-driven.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Pruning dominated candidates ensures that compute budget is spent only on prompts that expand the Pareto frontier.',
            },
            'controls': [
                {
                    'id': 'pareto_display',
                    'label': 'Frontier View',
                    'type': 'select',
                    'default': 'Pareto Frontier Highlighted',
                    'options': ['Pareto Frontier Highlighted', 'All Candidates Unfiltered'],
                    'description': 'Filter dominated prompt variants',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Pareto Frontier: Accuracy vs Token Length Trade-off'},
        },
        {
            'id': 'w37_s5_mutation_operators',
            'title': 'Evolutionary Mutation Operators: Markdown Schemas & Few-Shot Pruning',
            'subtitle': 'The algorithmic transformations that trim tokens without degrading reasoning',
            'scenario': 'What concrete prompt mutations produce high-accuracy compression in real production deployments?',
            'mechanism': '1. Markdown Schema Transformation: Replace verbose sentences ("The output must be a dictionary with keys name and age") with strict TypeScript/Pydantic code blocks. 2. Filler Pruning: Strip polite introductory and concluding phrases. 3. Dynamic Few-Shot Pruning: Keep only ambiguous boundary test cases, eliminating redundant simple examples.',
            'prediction': {
                'prompt': 'Which prompt refactoring technique typically achieves the highest compression without sacrificing structural compliance?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Replacing paragraph prose instructions with concise Markdown code blocks or TypeScript/JSON schemas.',
                        'explanation': 'Correct! Code and schemas communicate structural constraints in 70% fewer tokens than prose sentences.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Removing all vowels from the English language.',
                        'explanation': 'Nonsense! That destroys tokenizer recognition and degrades model reasoning.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Translating the prompt into binary 0s and 1s.',
                        'explanation': 'Incorrect! Binary text explodes token count dramatically.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Structured schemas and boundary few-shot pruning produce lean, high-performing prompts that slash API costs.',
            },
            'controls': [
                {
                    'id': 'mutation_type',
                    'label': 'Active Mutation Operator',
                    'type': 'select',
                    'default': 'Markdown Schema Compression',
                    'options': ['Markdown Schema Compression', 'Filler Pruning', 'Boundary Example Distillation'],
                    'description': 'Prompt mutation technique to apply',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Mutation Transformation: Prose Paragraph -> Concise Schema'},
        },
        {
            'id': 'w37_s6_transfer_challenge',
            'title': 'Transfer Challenge: GEPA Genetic Prompt Generation Optimizer',
            'subtitle': 'Build the automated candidate evaluation and selection engine',
            'scenario': 'Implement `optimize_prompt_generation(candidates: list[dict], token_budget: int) -> dict` to select the highest-fitness prompt candidate.',
            'mechanism': '1. Return zeros if candidates is empty. 2. For each candidate: cost_penalty = round((tokens - token_budget) * 0.01, 4) if tokens > token_budget else 0.0. Calculate fitness = round(accuracy - cost_penalty, 4). 3. Select winning candidate: primary by highest fitness, secondary by lowest tokens, tertiary by original index. 4. Return selected_id, tokens, accuracy, cost_penalty, and fitness.',
            'prediction': {
                'prompt': 'Given candidates [{"prompt_id": "p1", "tokens": 150, "accuracy": 0.90}, {"prompt_id": "p2", "tokens": 250, "accuracy": 0.95}] with token_budget=200, which candidate wins?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'p1 (p1 fitness is 0.90 - 0 = 0.90; p2 penalty is (250-200)*0.01 = 0.50, so p2 fitness is 0.95 - 0.50 = 0.45).',
                        'explanation': 'Correct! Even though p2 has higher raw accuracy, its token penalty severely lowers its fitness below p1.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'p2 because 0.95 is higher than 0.90.',
                        'explanation': 'Incorrect! The token budget penalty penalizes p2 for bloat.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Neither, both are disqualified.',
                        'explanation': 'Incorrect! Both are valid candidates with calculated fitness scores.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Implement the prompt optimization evaluator in the code editor below and test against all candidate pools.',
            },
            'controls': [
                {
                    'id': 'run_verification',
                    'label': 'Run Full GEPA Optimizer Tests',
                    'type': 'button',
                    'default': True,
                    'description': 'Execute test suite validating token budget penalties, fitness ranking, and tie-breaking',
                },
            ],
            'lab_starter_code': data.get('starter_code', ''),
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'GEPA Prompt Generation Optimizer Sandbox'},
        },
    ]

    data['journey'] = journey
    QuestionContent(**data)
    path.write_text(yaml.dump(data, sort_keys=False))
    print(f'Successfully injected {len(journey)} stages into {path}')

def inject_w38_resume_grill():
    path = Path('content/questions/21-ai-resume-defense/resume-bullet-architecture-grill.yaml')
    data = yaml.safe_load(path.read_text())

    journey = [
        {
            'id': 'w38_s1_buzzword_collapse',
            'title': 'The Buzzword Collapse: Surviving Basement-Layer Technical Probes',
            'subtitle': 'Why reciting technology names fails in Senior and Staff technical interviews',
            'scenario': 'A candidate boasts: "Architected distributed Kafka pipeline processing 50,000 QPS with sub-second latency across microservices." During a Staff interview, the interviewer asks about partition sizing, consumer group rebalance storms, and idempotency guarantees. The candidate freezes. Why?',
            'mechanism': 'Junior engineers describe what technology they used. Senior and Staff engineers describe the boundary conditions, failure modes, and trade-offs: cache stampedes, mutex locking, eviction policies (allkeys-lru vs volatile-ttl), and serialization overhead. Memorizing high-level buzzwords fails when interviewers probe the basement layer.',
            'prediction': {
                'prompt': 'What is the primary difference between a Junior and a Staff-level answer during a technical resume grill?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Staff engineers articulate the exact failure modes, trade-offs, and why alternative solutions were rejected, while junior engineers merely list technology names.',
                        'explanation': 'Correct! Staff-level engineering is defined by deep understanding of boundary conditions and trade-off decisions.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Staff engineers know how to write assembly code from memory.',
                        'explanation': 'Misconception! Staff engineering focuses on distributed systems design and architectural trade-offs.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Junior engineers are not allowed to use Redis.',
                        'explanation': 'Nonsense! Anyone can use Redis, but senior engineers know how it behaves under failure.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Surviving the resume grill requires the 4-Part Staff Defense Matrix: Baseline Bottleneck, Rejected Alternatives, Precise Mechanism, and Verified Outcome.',
            },
            'controls': [
                {
                    'id': 'interview_depth',
                    'label': 'Interviewer Probing Depth',
                    'type': 'select',
                    'default': 'Staff Deep-Dive (Basement Layer & Trade-offs)',
                    'options': [
                        'Staff Deep-Dive (Basement Layer & Trade-offs)',
                        'Junior Surface-Level (Tool Names)',
                    ],
                    'description': 'Depth of technical interrogation',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'The Technical Iceberg: Surface Buzzwords vs Basement Mechanics'},
        },
        {
            'id': 'w38_s2_baseline_bottleneck',
            'title': 'Part 1: Quantifying the Baseline Bottleneck (Measured Latency & QPS)',
            'subtitle': 'Anchoring engineering claims in telemetry before optimizing',
            'scenario': 'Which resume bullet demonstrates higher engineering maturity: "Optimized slow database queries" or "Diagnosed 200ms p95 sequential table scans on 10M-row table causing connection pool saturation"?',
            'mechanism': 'High-impact engineering begins with precision measurement. Stating baseline bottlenecks (p95/p99 latency, CPU utilization, thread contention, memory bloat) demonstrates that the engineer diagnoses root causes using telemetry rather than guessing.',
            'prediction': {
                'prompt': 'Why do top engineering hiring managers favor candidates who state specific baseline metrics before optimization?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'It proves the candidate measured production performance objectively and diagnosed root causes before writing code.',
                        'explanation': 'Correct! Telemetry-driven diagnosis demonstrates scientific rigor and senior engineering discipline.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Because hiring managers only hire mathematicians.',
                        'explanation': 'Nonsense! Metrics are practical indicators of business and engineering impact.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Because metrics are required by local legal regulations.',
                        'explanation': 'Irrelevant! Metrics are an engineering best practice, not a legal mandate.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'A clear baseline metric provides the anchor that proves the magnitude of your subsequent architectural improvements.',
            },
            'controls': [
                {
                    'id': 'telemetry_metric',
                    'label': 'Baseline Telemetry Metric',
                    'type': 'select',
                    'default': '200ms p95 Sequential Scan Latency',
                    'options': [
                        '200ms p95 Sequential Scan Latency',
                        '50-Minute Sequential Test Run',
                        '$35k/mo Runaway Token Invoices',
                    ],
                    'description': 'Production bottleneck being diagnosed',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Baseline Telemetry: Latency Distributions & Error Cliffs'},
        },
        {
            'id': 'w38_s3_rejected_alternatives',
            'title': 'Part 2: The Art of Rejected Alternatives (Why Naive Scaling Failed)',
            'subtitle': 'Proving architectural reasoning by explaining why obvious solutions were rejected',
            'scenario': 'Why does a Principal interviewer ask: "Why didn\'t you just add more RAM or increase DynamoDB read capacity instead of migrating to PostgreSQL?"',
            'mechanism': 'The "Rejected Alternatives" question tests engineering economics and architectural reasoning. Adding provisioned capacity to DynamoDB for complex range queries scales costs exponentially (O(N) full table scans), whereas migrating to a relational database with composite B-Tree indexes satisfies access patterns in O(log N) time at 1/10th the infrastructure cost.',
            'prediction': {
                'prompt': 'When asked why you didn\'t just vertically scale hardware (more CPU/RAM), what is the strongest engineering response?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'Explaining that algorithmic complexity or architectural design flaws cannot be solved by hardware: an O(N) scan remains inefficient and cost-prohibitive regardless of server size.',
                        'explanation': 'Correct! Senior engineers understand that hardware scaling is an expensive band-aid that fails against asymptotic algorithmic complexity.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Saying that cloud servers cannot have more than 16GB of RAM.',
                        'explanation': 'False! Cloud providers offer instances with terabytes of RAM.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Claiming that buying larger servers is illegal in your company.',
                        'explanation': 'Nonsense! The decision is guided by economics and architectural scalability.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Articulating rejected alternatives demonstrates that your architectural choices were deliberate, economically sound, and technically rigorous.',
            },
            'controls': [
                {
                    'id': 'rejected_alternative',
                    'label': 'Rejected Naive Alternative',
                    'type': 'select',
                    'default': 'DynamoDB Provisioned Capacity ($10k/mo)',
                    'options': [
                        'DynamoDB Provisioned Capacity ($10k/mo)',
                        'Unbounded Python Threading (GIL Contention)',
                        'Manual Prompt Word Trimming (Regression Prone)',
                    ],
                    'description': 'Evaluated and rejected solution',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Trade-Off Comparison: Naive Scaling vs Architectural Redesign'},
        },
        {
            'id': 'w38_s4_concrete_primitives',
            'title': 'Part 3: Concrete Architectural Primitives (B-Trees, Semaphores, Mutexes)',
            'subtitle': 'Naming the exact data structures and synchronization mechanisms chosen',
            'scenario': 'Instead of saying "We made the Python service concurrent", which specific primitives communicate deep systems knowledge?',
            'mechanism': 'Naming the exact concurrency primitive (asyncio.Semaphore(25) for gateway rate limiting, ProcessPoolExecutor for CPU-bound OCR math, Single-Flight Lock for cache stampede suppression) demonstrates that the candidate understands OS and runtime trade-offs.',
            'prediction': {
                'prompt': 'If an engineer claims they prevented mobile API gateway saturation during traffic spikes, which primitive best substantiates the claim?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'asyncio.Semaphore(25) bounding concurrent network tasks while maintaining non-blocking event loop execution.',
                        'explanation': 'Correct! Bounded semaphores prevent socket exhaustion and gateway starvation.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'Adding 1,000 time.sleep(1) calls throughout the codebase.',
                        'explanation': 'Antipattern! Blocking sleeps stall event loops and freeze user requests.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'Disabling all unit tests.',
                        'explanation': 'Irrelevant and reckless! Testing has nothing to do with runtime concurrency.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Concrete primitives (Composite B-Trees, Semaphores, Mutexes, Single-Flight locks) anchor high-level claims in verified systems engineering reality.',
            },
            'controls': [
                {
                    'id': 'primitive_type',
                    'label': 'Selected Architectural Primitive',
                    'type': 'select',
                    'default': 'Composite B-Tree on (tenant_id, created_at DESC)',
                    'options': [
                        'Composite B-Tree on (tenant_id, created_at DESC)',
                        'asyncio.Semaphore(25)',
                        'Redis Mutex with Single-Flight Lock',
                        'GEPA Genetic Algorithm with Token Penalty',
                    ],
                    'description': 'Specific systems mechanism implemented',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Systems Primitive Architecture: State & Concurrency Flow'},
        },
        {
            'id': 'w38_s5_verified_outcomes',
            'title': 'Part 4: Verified Quantitative Outcomes (Impact Metrics That Convince)',
            'subtitle': 'Closing the defense matrix with verified latency, concurrency, and cost numbers',
            'scenario': 'A candidate states: "Migrated from DynamoDB to PostgreSQL with composite B-Tree index, reducing p95 query latency from 220ms to 18ms (91% reduction) and cutting AWS infrastructure costs by $12,000/mo." Why is this compelling?',
            'mechanism': 'The 4-part matrix is complete: Baseline (220ms p95) -> Rejected Alternative (DynamoDB scan scaling) -> Precise Mechanism (Composite B-Tree) -> Verified Outcome (91% latency drop, $12k savings). It presents an irrefutable narrative of high-leverage technical competence.',
            'prediction': {
                'prompt': 'What makes a quantitative project outcome bullet point convincing to a Principal Engineer?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'It directly links the architectural mechanism to a measured percentage improvement and verified business or latency metric.',
                        'explanation': 'Correct! Quantitative claims validated by pre-and-post metrics prove real-world engineering effectiveness.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'It includes emojis and exclamation marks.',
                        'explanation': 'Unprofessional! Senior resumes rely on facts and telemetry.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'It claims 100.000% zero-latency perfection.',
                        'explanation': 'Red flag! Claiming zero latency reveals a lack of real-world distributed systems experience.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Mastering the 4-Part Staff Defense Matrix elevates technical candidates from buzzword reciting to authoritative, hireable system leaders.',
            },
            'controls': [
                {
                    'id': 'outcome_metric_type',
                    'label': 'Verified Production Outcome',
                    'type': 'select',
                    'default': '91% p95 Latency Reduction (220ms -> 18ms)',
                    'options': [
                        '91% p95 Latency Reduction (220ms -> 18ms)',
                        '25x Concurrency Boost (1 -> 25 concurrent workers)',
                        '66% Token Cost Reduction ($35k -> $12k/mo)',
                    ],
                    'description': 'Quantitative metric of success',
                },
            ],
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Pre vs Post Optimization: Quantitative Latency & Throughput'},
        },
        {
            'id': 'w38_s6_transfer_challenge',
            'title': 'Transfer Challenge: Senior Resume Architecture Defense Evaluator',
            'subtitle': 'Build the automated interview scoring engine',
            'scenario': 'Implement `evaluate_resume_defense(defense_submission: dict) -> dict` to validate technical claims and architectural trade-offs.',
            'mechanism': '1. Validate topic: recognized topics are dynamodb_migration, drizz_async, gepa_prompt, fitlabs_vton. 2. Verify mandatory defense criteria: dynamodb_migration requires latency_reduction_pct >= 80, storage_engine == "postgresql", index_strategy == "composite_btree", connection_pooler == "pgbouncer". drizz_async requires concurrency_boost >= 20, concurrency_primitive == "asyncio_semaphore", max_workers == 25. gepa_prompt requires cost_reduction_pct >= 60, optimizer == "genetic_algorithm", objective == "accuracy_minus_token_penalty". fitlabs_vton requires polling_pattern == "http_202_accepted", stampede_protection == "single_flight_lock". 3. Return verified=True and verdict="HIRE_STRONG_STAFF" if passed, else reject feedback.',
            'prediction': {
                'prompt': 'For topic "dynamodb_migration", what storage engine and index strategy must the candidate defend?',
                'choices': [
                    {
                        'id': 'opt_a',
                        'label': 'storage_engine: "postgresql" and index_strategy: "composite_btree".',
                        'explanation': 'Correct! PostgreSQL with composite B-Trees satisfies the relational access pattern efficiently.',
                        'is_correct': True,
                    },
                    {
                        'id': 'opt_b',
                        'label': 'storage_engine: "mongodb" and index_strategy: "unindexed".',
                        'explanation': 'Incorrect! Unindexed collections cause fatal sequential table scans.',
                        'is_correct': False,
                    },
                    {
                        'id': 'opt_c',
                        'label': 'storage_engine: "flat_json_file" on desktop.',
                        'explanation': 'Nonsense! Flat files cannot support multi-tenant concurrency.',
                        'is_correct': False,
                    },
                ],
                'revealed_explanation': 'Implement the defense evaluator in the code editor below and verify with all interview submission topics.',
            },
            'controls': [
                {
                    'id': 'run_verification',
                    'label': 'Run Full Defense Evaluator Tests',
                    'type': 'button',
                    'default': True,
                    'description': 'Execute test suite validating topic recognition, architectural verification, and hire verdicts',
                },
            ],
            'lab_starter_code': data.get('starter_code', ''),
            'visualizer_type': 'system_blueprint',
            'visualizer_config': {'title': 'Resume Architecture Defense Evaluator Sandbox'},
        },
    ]

    data['journey'] = journey
    QuestionContent(**data)
    path.write_text(yaml.dump(data, sort_keys=False))
    print(f'Successfully injected {len(journey)} stages into {path}')

if __name__ == '__main__':
    inject_w21_vector_search()
    inject_w35_rrf()
    inject_w36_agents()
    inject_w37_gepa()
    inject_w38_resume_grill()
    print('All Phase 6 Journeys injected and validated successfully!')
