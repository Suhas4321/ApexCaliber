import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Flame, Zap } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function VectorRagMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [strategyMode, setStrategyMode] = useState<'two_stage_rerank' | 'naive_vector_only' | 'brute_force_cross_encoder'>('two_stage_rerank')

  const durationSec = 12.0
  const animFrameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)

  // Animation Loop synced to requestAnimationFrame and speed
  useEffect(() => {
    if (!isPlaying) {
      lastTimestampRef.current = null
      return
    }

    const tick = (now: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = now
      }
      const deltaSec = (now - lastTimestampRef.current) / 1000
      lastTimestampRef.current = now

      setCurrentTime((prev) => {
        const next = prev + deltaSec * speed
        if (next >= durationSec) {
          setIsPlaying(false)
          return durationSec
        }
        return next
      })

      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isPlaying, speed])

  const handlePlayPause = () => {
    if (currentTime >= durationSec) {
      setCurrentTime(0)
      setIsPlaying(true)
    } else {
      setIsPlaying((p) => !p)
    }
  }

  const handleReplay = () => {
    setCurrentTime(0)
    setIsPlaying(true)
  }

  const handleSeek = (t: number) => {
    setCurrentTime(t)
  }

  // Derived state across the 4 acts
  let subtitle = ''
  let metrics: { label: string; value: string; variant?: 'default' | 'success' | 'warning' | 'danger' }[] = []

  let rankDocA = 14
  let rankDocB = 1
  let crossScoreDocA = '0.78 (Bi-only)'
  let crossScoreDocB = '0.91 (Bi-only)'
  let hallucinationRate = '0%'
  let pipelineLatency = '38 ms'

  if (currentTime < 3.0) {
    // Act 1: Query Ingestion & Bi-Encoder Vector Search
    rankDocA = 14
    rankDocB = 1
    crossScoreDocA = '0.78 (Bi)'
    crossScoreDocB = '0.91 (Bi)'
    pipelineLatency = '14 ms'
    subtitle = 'Act 1 (0.0s – 3.0s): Vector Search. Bi-Encoder embeds query. HNSW index rapidly scans 10M vectors to retrieve top-50 candidate passages.'
    metrics = [
      { label: 'User Query', value: 'HPT vane burn through inspection', variant: 'default' },
      { label: 'Embedding Model', value: 'Bi-Encoder (1536-dim vector)', variant: 'default' },
      { label: 'HNSW Index Search', value: '10,000,000 vectors scanned in 14ms', variant: 'success' },
      { label: 'Shortlist Output', value: 'Top-50 Candidates Retrieved', variant: 'default' },
    ]
  } else if (currentTime < 6.0) {
    // Act 2: Vector Candidate Inspection & The Semantic Blind Spot
    rankDocA = 14
    rankDocB = 1
    pipelineLatency = '18 ms'

    if (strategyMode === 'brute_force_cross_encoder') {
      pipelineLatency = '45,200 ms (STALL)'
      subtitle = 'Act 2 (3.0s – 6.0s): Brute Force Meltdown! Attempting to run heavy cross-encoder over all 10M documents. GPU compute exhausted!'
      metrics = [
        { label: 'Cross-Attention Pairs', value: '10,000,000 document pairs', variant: 'danger' },
        { label: 'Transformer Latency', value: '45.2 SECONDS (Unusable)', variant: 'danger' },
        { label: 'GPU Cluster Load', value: '100% VRAM OOM Warning', variant: 'danger' },
        { label: 'Architecture Flaw', value: 'Lacks Stage-1 Vector Pre-filter', variant: 'danger' },
      ]
    } else {
      subtitle = 'Act 2 (3.0s – 6.0s): The Vector Blind Spot! Bi-encoder scores generic turbine manual at Rank #1 (0.91), while exact inspection protocol is stuck at Rank #14 (0.78)!'
      metrics = [
        { label: 'Vector Rank #1', value: 'Doc B: Generic Manual (Bi: 0.91)', variant: 'warning' },
        { label: 'Vector Rank #14', value: 'Doc A: Exact Protocol (Bi: 0.78)', variant: 'danger' },
        { label: 'Recall Risk', value: 'Top passage lacks exact procedure', variant: 'danger' },
        { label: 'Root Cause', value: 'Isolated Query/Doc Embeddings', variant: 'warning' },
      ]
    }
  } else if (currentTime < 9.0) {
    // Act 3: Divergence - Cross-Encoder Joint Reranking
    if (strategyMode === 'naive_vector_only') {
      rankDocA = 14
      rankDocB = 1
      hallucinationRate = '92% (WRONG PASSAGE)'
      pipelineLatency = '22 ms'
      subtitle = 'Act 3 (6.0s – 9.0s): NO RERANKER! Raw vector results sent to LLM. Doc B contains generic specs; LLM misses exact vane tolerances and hallucinates!'
      metrics = [
        { label: 'Reranker Status', value: 'DISABLED (Raw Vectors Only)', variant: 'danger' },
        { label: 'Context Fed to LLM', value: 'Doc B (Compressor overview)', variant: 'danger' },
        { label: 'Grounding Integrity', value: 'LOST IN THE MIDDLE', variant: 'danger' },
        { label: 'Hallucination Risk', value: 'CRITICAL (Wrong Torque Spec)', variant: 'danger' },
      ]
    } else if (strategyMode === 'brute_force_cross_encoder') {
      pipelineLatency = 'Timeout (504)'
      subtitle = 'Act 3 (6.0s – 9.0s): TIMEOUT! Without fast Stage-1 vector retrieval, user connection drops before cross-encoder completes 10M passes.'
      metrics = [
        { label: 'Search Status', value: 'HTTP 504 GATEWAY TIMEOUT', variant: 'danger' },
        { label: 'Inference Cost', value: '$1.40 per query (Exorbitant)', variant: 'danger' },
        { label: 'Fix Required', value: 'Two-Stage: Bi-Encoder then Rerank', variant: 'warning' },
        { label: 'User Experience', value: 'Frozen Search Interface', variant: 'danger' },
      ]
    } else {
      // Two-Stage Rerank (Optimal)
      rankDocA = 1
      rankDocB = 28
      crossScoreDocA = '0.98 (Rank 1)'
      crossScoreDocB = '0.35 (Rank 28)'
      pipelineLatency = '38 ms'
      subtitle = 'Act 3 (6.0s – 9.0s): Cross-Encoder Joint Reranking! Transformer evaluates cross-attention, lexical coverage (100%), and exact phrase bonus (+1.0). Doc A leaps to Rank #1!'
      metrics = [
        { label: 'Candidate Shortlist', value: 'Top-50 passed to Cross-Encoder', variant: 'default' },
        { label: 'Doc A Phrase Match', value: 'Exact Phrase Bonus: +1.0', variant: 'success' },
        { label: 'Composite Score Doc A', value: '0.9800 (Rank 1 Surge!)', variant: 'success' },
        { label: 'Composite Score Doc B', value: '0.3467 (Demoted to Rank 28)', variant: 'default' },
      ]
    }
  } else {
    // Act 4: Grounded LLM Context Injection & Output
    if (strategyMode === 'naive_vector_only') {
      hallucinationRate = '94%'
      subtitle = 'Act 4 (9.0s – 12.0s): Hallucinated generation! Because Doc A was stranded at Rank #14, LLM invented non-existent inspection guidelines.'
      metrics = [
        { label: 'LLM Generation', value: 'HALLUCINATED (Factually False)', variant: 'danger' },
        { label: 'Accuracy Rating', value: '6% Factual Precision', variant: 'danger' },
        { label: 'Engineering Cost', value: 'Improper Maintenance / Grounding', variant: 'danger' },
        { label: 'Solution', value: 'Deploy Cohere/BGE Cross-Encoder', variant: 'warning' },
      ]
    } else if (strategyMode === 'brute_force_cross_encoder') {
      subtitle = 'Act 4 (9.0s – 12.0s): System failure. Cross-encoder accuracy is meaningless if latency exceeds acceptable SLAs.'
      metrics = [
        { label: 'End-to-End SLA', value: 'FAILED (> 30,000 ms)', variant: 'danger' },
        { label: 'Efficiency', value: '0.01 queries / second', variant: 'danger' },
        { label: 'Key Learning', value: 'Never run Cross-Encoder on full corpus', variant: 'warning' },
        { label: 'Optimal Ratio', value: 'Retrieve 50 -> Rerank to 3', variant: 'success' },
      ]
    } else {
      // Two-Stage Rerank: 100% Grounded
      hallucinationRate = '0%'
      pipelineLatency = '38 ms'
      subtitle = 'Act 4 (9.0s – 12.0s): 100% Grounded Synthesis! Top-3 reranked passages injected into LLM context window. Flawless technical response with exact page citations!'
      metrics = [
        { label: 'Context Fed to LLM', value: 'Top-3 Reranked Passages (Doc A)', variant: 'success' },
        { label: 'Hallucination Rate', value: '0.00% (Strictly Grounded)', variant: 'success' },
        { label: 'End-to-End Latency', value: '38 ms Total (Interactive Speed)', variant: 'success' },
        { label: 'Citation Fidelity', value: 'Aircraft Maintenance Manual §4.2', variant: 'success' },
      ]
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      <MotionGraphicPlayer
        title="Vector Database & Two-Stage RAG (Bi-Encoder Retrieval + Cross-Encoder Reranking)"
        durationSec={durationSec}
        currentTime={currentTime}
        isPlaying={isPlaying}
        speed={speed}
        onPlayPause={handlePlayPause}
        onReplay={handleReplay}
        onSeek={handleSeek}
        onSpeedChange={setSpeed}
        activeSubtitle={subtitle}
        metrics={metrics}
        toolbarExtra={
          <div className="flex items-center gap-1.5 rounded-lg border border-line bg-panel p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => { setStrategyMode('two_stage_rerank'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'two_stage_rerank'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>Two-Stage Rerank (Optimal)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('naive_vector_only'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'naive_vector_only'
                  ? 'bg-rose-950/50 text-rose-300 font-bold border border-rose-600/60 shadow-xs'
                  : 'text-muted hover:text-rose-300'
              }`}
            >
              <Flame size={12} />
              <span>Naive Vector Only (Hallucinates)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('brute_force_cross_encoder'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'brute_force_cross_encoder'
                  ? 'bg-amber-950/50 text-amber-300 font-bold border border-amber-600/60 shadow-xs'
                  : 'text-muted hover:text-amber-300'
              }`}
            >
              <Zap size={12} />
              <span>Brute Force Cross-Encoder (Crash)</span>
            </button>
          </div>
        }
      >
        {(canvasTheme) => {
          const isLight = canvasTheme === 'light'

          const textPrimary = isLight ? '#0f172a' : '#f8fafc'
          const textSecondary = isLight ? '#475569' : '#94a3b8'
          const cardBg = isLight ? '#ffffff' : '#111726'
          const cardBorder = isLight ? '#cbd5e1' : '#1e293b'
          const queryBlue = '#38bdf8'
          const vectorIndigo = '#6366f1'
          const rerankPurple = '#a855f7'
          const llmGreen = '#10b981'
          const dangerRed = '#ef4444'

          // Particle timings
          const tAct1 = Math.min(1, Math.max(0, (currentTime - 0.5) / 2.0))
          const tAct2 = Math.min(1, Math.max(0, (currentTime - 3.5) / 2.0))
          const tAct3 = Math.min(1, Math.max(0, (currentTime - 6.5) / 2.0))
          const tAct4 = Math.min(1, Math.max(0, (currentTime - 9.5) / 2.0))

          return (
            <div className="relative w-full aspect-[16/10] max-w-[880px] mx-auto py-2">
              <svg viewBox="0 0 900 520" className="w-full h-full transition-all duration-300">
                <defs>
                  <marker id="rag-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={queryBlue} />
                  </marker>
                  <marker id="rag-arrow-purple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={rerankPurple} />
                  </marker>
                  <marker id="rag-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={llmGreen} />
                  </marker>
                  <filter id="rag-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity={isLight ? '0.08' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* ==================== FLOW CONNECTORS ==================== */}
                {/* 1. Query -> Vector DB */}
                <line x1="220" y1="220" x2="260" y2="220" stroke={queryBlue} strokeWidth="2.5" />

                {/* 2. Vector DB -> Cross-Encoder */}
                <line x1="430" y1="220" x2="470" y2="220" stroke={vectorIndigo} strokeWidth="2.5" />

                {/* 3. Cross-Encoder -> LLM Generator */}
                <line x1="660" y1="220" x2="700" y2="220" stroke={llmGreen} strokeWidth="2.5" />

                {/* Direct Bypass in Naive Vector Only Mode (Bypasses Reranker) */}
                {strategyMode === 'naive_vector_only' && (
                  <path
                    d="M 430 260 C 500 420, 620 420, 700 260"
                    fill="none"
                    stroke={dangerRed}
                    strokeWidth="3"
                    strokeDasharray="5 5"
                  />
                )}

                {/* ==================== FLYING DATA PACKETS ==================== */}
                {/* Act 1: Query embedding to Vector DB */}
                {currentTime < 3.0 && (
                  <g transform={`translate(${220 + (260 - 220) * tAct1}, 220)`}>
                    <circle r="6" fill={queryBlue} />
                  </g>
                )}

                {/* Act 2: Top-50 candidates to Cross-Encoder */}
                {currentTime >= 3.0 && currentTime < 6.0 && (
                  <g transform={`translate(${430 + (470 - 430) * tAct2}, 220)`}>
                    <circle r="7" fill={vectorIndigo} filter="url(#rag-shadow)" />
                    <rect x="-35" y="-20" width="70" height="15" rx="3" fill={isLight ? '#4f46e5' : '#3730a3'} />
                    <text x="0" y="-9" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                      TOP 50 CANDIDATES
                    </text>
                  </g>
                )}

                {/* Act 3: Reranked Top-3 to LLM */}
                {currentTime >= 6.0 && currentTime < 9.0 && strategyMode === 'two_stage_rerank' && (
                  <g transform={`translate(${660 + (700 - 660) * tAct3}, 220)`}>
                    <circle r="7" fill={llmGreen} filter="url(#rag-shadow)" />
                    <rect x="-35" y="-20" width="70" height="15" rx="3" fill={isLight ? '#059669' : '#065f46'} />
                    <text x="0" y="-9" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                      TOP-3 RERANKED
                    </text>
                  </g>
                )}

                {/* Act 4: LLM Output Packet */}
                {currentTime >= 9.0 && strategyMode === 'two_stage_rerank' && (
                  <circle cx={700 + 40 * tAct4} cy="220" r="6" fill={llmGreen} className="animate-pulse" />
                )}

                {/* ==================== 1. USER QUERY & BI-ENCODER (Left) ==================== */}
                <g transform="translate(30, 50)" filter="url(#rag-shadow)">
                  <rect
                    width="190"
                    height="410"
                    rx="14"
                    fill={cardBg}
                    stroke={cardBorder}
                    strokeWidth="1"
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="190" height="38" rx="14" fill={isLight ? '#f0f9ff' : '#082f49'} />
                  <circle cx="18" cy="19" r="6" fill={queryBlue} />
                  <text x="32" y="24" fill={textPrimary} fontSize="12" fontWeight="700">
                    Query & Bi-Encoder
                  </text>

                  {/* Body Content */}
                  <g transform="translate(14, 55)">
                    <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="bold">
                      NATURAL LANGUAGE QUERY
                    </text>
                    <rect x="0" y="22" width="162" height="60" rx="6" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="10" y="42" fill={queryBlue} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      "HPT vane burn through
                    </text>
                    <text x="10" y="58" fill={queryBlue} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      inspection"
                    </text>
                  </g>

                  {/* Bi-Encoder Embedding Tensor */}
                  <g transform="translate(14, 155)">
                    <rect x="0" y="0" width="162" height="110" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      STAGE 1: BI-ENCODER
                    </text>
                    <text x="10" y="38" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      Model: text-embedding-3
                    </text>
                    <text x="10" y="56" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      Dimensions: 1536-dim
                    </text>
                    <text x="10" y="74" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      [-0.042, 0.812, ... +1534]
                    </text>
                    <text x="10" y="96" fill={queryBlue} fontSize="9" fontFamily="monospace">
                      Dense semantic vector
                    </text>
                  </g>

                  {/* Latency Gauge */}
                  <g transform="translate(14, 285)">
                    <rect x="0" y="0" width="162" height="95" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      PIPELINE LATENCY SLA
                    </text>
                    <text
                      x="10"
                      y="44"
                      fill={strategyMode === 'brute_force_cross_encoder' && currentTime >= 6.0 ? dangerRed : llmGreen}
                      fontSize="17"
                      fontWeight="800"
                      fontFamily="monospace"
                    >
                      {pipelineLatency}
                    </text>
                    <text x="10" y="66" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      Target: &lt; 50 ms interactive
                    </text>
                    <text x="10" y="84" fill={llmGreen} fontSize="9" fontFamily="monospace">
                      ✓ Sub-50ms Production SLA
                    </text>
                  </g>
                </g>

                {/* ==================== 2. VECTOR DATABASE (Center-Left) ==================== */}
                <g transform="translate(250, 50)" filter="url(#rag-shadow)">
                  <rect
                    width="180"
                    height="410"
                    rx="14"
                    fill={cardBg}
                    stroke={cardBorder}
                    strokeWidth="1"
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="180" height="38" rx="14" fill={isLight ? '#eef2ff' : '#1e1b4b'} />
                  <circle cx="18" cy="19" r="6" fill={vectorIndigo} />
                  <text x="32" y="24" fill={textPrimary} fontSize="12" fontWeight="700">
                    Vector DB (HNSW Index)
                  </text>

                  {/* Body Content */}
                  <g transform="translate(14, 55)">
                    <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="bold">
                      ANN COSINE DISTANCE
                    </text>
                    <text x="0" y="32" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      Corpus: 10,000,000 chunks
                    </text>
                  </g>

                  {/* Candidate Passage B (Generic) */}
                  <g transform="translate(14, 100)">
                    <rect
                      x="0"
                      y="0"
                      width="152"
                      height="95"
                      rx="8"
                      fill={isLight ? '#f8fafc' : '#0b0f19'}
                      stroke={strategyMode === 'naive_vector_only' ? dangerRed : cardBorder}
                    />
                    <text x="10" y="18" fill={textPrimary} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      Doc B: Turbine Overview
                    </text>
                    <text x="10" y="34" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      "General high pressure..."
                    </text>
                    <text x="10" y="54" fill={vectorIndigo} fontSize="10" fontFamily="monospace">
                      Vector Score: 0.91
                    </text>
                    <rect x="10" y="64" width="132" height="22" rx="4" fill={isLight ? '#eef2ff' : '#312e81'} />
                    <text x="76" y="79" textAnchor="middle" fill={vectorIndigo} fontSize="9" fontWeight="bold">
                      Vector Rank: #{rankDocB}
                    </text>
                  </g>

                  {/* Candidate Passage A (Exact Match) */}
                  <g transform="translate(14, 210)">
                    <rect
                      x="0"
                      y="0"
                      width="152"
                      height="105"
                      rx="8"
                      fill={
                        strategyMode === 'two_stage_rerank' && currentTime >= 6.0
                          ? isLight ? '#dcfce7' : '#052e16'
                          : isLight ? '#f8fafc' : '#0b0f19'
                      }
                      stroke={
                        strategyMode === 'two_stage_rerank' && currentTime >= 6.0
                          ? llmGreen
                          : dangerRed
                      }
                    />
                    <text x="10" y="18" fill={textPrimary} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      Doc A: Vane Inspection
                    </text>
                    <text x="10" y="34" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      "HPT vane burn through..."
                    </text>
                    <text x="10" y="54" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      Vector Score: 0.78
                    </text>
                    <rect
                      x="10"
                      y="64"
                      width="132"
                      height="22"
                      rx="4"
                      fill={
                        strategyMode === 'two_stage_rerank' && currentTime >= 6.0
                          ? isLight ? '#bbf7d0' : '#14532d'
                          : isLight ? '#fee2e2' : '#450a0a'
                      }
                    />
                    <text
                      x="76"
                      y="79"
                      textAnchor="middle"
                      fill={
                        strategyMode === 'two_stage_rerank' && currentTime >= 6.0
                          ? llmGreen
                          : dangerRed
                      }
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {strategyMode === 'two_stage_rerank' && currentTime >= 6.0
                        ? '★ SURGED TO RANK #1'
                        : `Vector Rank: #${rankDocA} (Stranded!)`}
                    </text>
                  </g>

                  {/* Vector Blind Spot Notice */}
                  <g transform="translate(14, 330)">
                    <text x="0" y="12" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      *Bi-encoder lacks cross-attention
                    </text>
                    <text x="0" y="24" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      between query and document tokens.
                    </text>
                  </g>
                </g>

                {/* ==================== 3. CROSS-ENCODER RERANKER (Center-Right) ==================== */}
                <g transform="translate(460, 50)" filter="url(#rag-shadow)">
                  <rect
                    width="210"
                    height="410"
                    rx="14"
                    fill={cardBg}
                    stroke={strategyMode === 'naive_vector_only' ? dangerRed : rerankPurple}
                    strokeWidth={1}
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="210" height="38" rx="14" fill={isLight ? '#faf5ff' : '#2e1065'} />
                  <circle cx="18" cy="19" r="6" fill={rerankPurple} />
                  <text x="32" y="24" fill={textPrimary} fontSize="12" fontWeight="700">
                    Stage 2: Cross-Encoder Reranker
                  </text>

                  {/* Body Content */}
                  <g transform="translate(14, 55)">
                    <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="bold">
                      JOINT CROSS-ATTENTION
                    </text>
                    <text x="0" y="32" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      Input: `[CLS] Query [SEP] Doc`
                    </text>
                  </g>

                  {/* Formula Box */}
                  <g transform="translate(14, 100)">
                    <rect x="0" y="0" width="182" height="110" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      RERANK SCORING EQUATION
                    </text>
                    <text x="10" y="38" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      Score = 0.5 * Coverage
                    </text>
                    <text x="10" y="54" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.3 * PhraseBonus
                    </text>
                    <text x="10" y="70" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.2 * BiScore
                    </text>
                    <text x="10" y="94" fill={rerankPurple} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      Joint Token Alignment Matrix
                    </text>
                  </g>

                  {/* Rerank Output Rankings */}
                  <g transform="translate(14, 225)">
                    <rect x="0" y="0" width="182" height="100" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      RERANKED TOP CANDIDATES
                    </text>
                    <text x="10" y="42" fill={llmGreen} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      • Rank 1: Doc A ({crossScoreDocA})
                    </text>
                    <text x="10" y="60" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      &nbsp;&nbsp;Coverage: 100% | Phrase: +1.0
                    </text>
                    <text x="10" y="80" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      • Rank 28: Doc B ({crossScoreDocB})
                    </text>
                  </g>

                  {/* Speedup Notice */}
                  <g transform="translate(14, 345)">
                    <text x="0" y="12" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      Evaluates top-50 only: O(50 * L^2)
                    </text>
                    <text x="0" y="24" fill={llmGreen} fontSize="8" fontWeight="bold" fontFamily="monospace">
                      200x faster than full corpus cross-attention
                    </text>
                  </g>
                </g>

                {/* ==================== 4. GROUNDED LLM GENERATION (Right) ==================== */}
                <g transform="translate(700, 50)" filter="url(#rag-shadow)">
                  <rect
                    width="170"
                    height="410"
                    rx="14"
                    fill={cardBg}
                    stroke={cardBorder}
                    strokeWidth="1"
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="170" height="38" rx="14" fill={isLight ? '#f0fdf4' : '#052e16'} />
                  <circle cx="18" cy="19" r="6" fill={llmGreen} />
                  <text x="32" y="24" fill={textPrimary} fontSize="12" fontWeight="700">
                    Grounded LLM
                  </text>

                  {/* Body Content */}
                  <g transform="translate(14, 55)">
                    <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="bold">
                      CONTEXT WINDOW
                    </text>
                    <rect x="0" y="22" width="142" height="60" rx="6" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="8" y="40" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      Passages Injected:
                    </text>
                    <text x="8" y="56" fill={llmGreen} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {strategyMode === 'two_stage_rerank' ? 'Doc A (Exact Vane)' : 'Doc B (Noise)'}
                    </text>
                  </g>

                  {/* Hallucination Risk Gauge */}
                  <g transform="translate(14, 150)">
                    <rect
                      x="0"
                      y="0"
                      width="142"
                      height="85"
                      rx="8"
                      fill={
                        strategyMode === 'two_stage_rerank'
                          ? isLight ? '#f0fdf4' : '#052e16'
                          : isLight ? '#fee2e2' : '#450a0a'
                      }
                      stroke={strategyMode === 'two_stage_rerank' ? llmGreen : dangerRed}
                    />
                    <text x="10" y="18" fill={textSecondary} fontSize="8" fontWeight="bold">
                      HALLUCINATION RATE
                    </text>
                    <text
                      x="10"
                      y="44"
                      fill={strategyMode === 'two_stage_rerank' ? llmGreen : dangerRed}
                      fontSize="17"
                      fontWeight="800"
                      fontFamily="monospace"
                    >
                      {hallucinationRate}
                    </text>
                    <text x="10" y="66" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      {strategyMode === 'two_stage_rerank' ? 'Strictly Grounded' : 'Unverified Guess'}
                    </text>
                  </g>

                  {/* Final Output Card */}
                  <g transform="translate(14, 255)">
                    <rect x="0" y="0" width="142" height="135" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="8" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      FINAL SYNTHESIS
                    </text>
                    {strategyMode === 'two_stage_rerank' && currentTime >= 9.0 ? (
                      <>
                        <text x="8" y="38" fill={llmGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                          "Per AMM §4.2:
                        </text>
                        <text x="8" y="54" fill={textPrimary} fontSize="8" fontFamily="monospace">
                          Inspect vane shroud
                        </text>
                        <text x="8" y="70" fill={textPrimary} fontSize="8" fontFamily="monospace">
                          burn-through &gt; 2.5mm.
                        </text>
                        <text x="8" y="86" fill={textPrimary} fontSize="8" fontFamily="monospace">
                          Replace segment if
                        </text>
                        <text x="8" y="102" fill={textPrimary} fontSize="8" fontFamily="monospace">
                          limit exceeded."
                        </text>
                        <text x="8" y="122" fill={llmGreen} fontSize="8" fontWeight="bold" fontFamily="monospace">
                          [Cited: Doc A]
                        </text>
                      </>
                    ) : (
                      <>
                        <text x="8" y="38" fill={dangerRed} fontSize="9" fontWeight="bold" fontFamily="monospace">
                          "Ensure turbine is
                        </text>
                        <text x="8" y="54" fill={dangerRed} fontSize="8" fontFamily="monospace">
                          properly bolted..."
                        </text>
                        <text x="8" y="80" fill={dangerRed} fontSize="8" fontFamily="monospace">
                          (Generic hallucination)
                        </text>
                        <text x="8" y="110" fill={dangerRed} fontSize="8" fontWeight="bold" fontFamily="monospace">
                          [No exact spec]
                        </text>
                      </>
                    )}
                  </g>
                </g>

                {/* Hallucination Alert Overlay */}
                {currentTime >= 6.0 && currentTime < 9.0 && strategyMode === 'naive_vector_only' && (
                  <g transform="translate(560, 240)" filter="url(#rag-shadow)">
                    <rect x="-95" y="-24" width="190" height="48" rx="8" fill="#991b1b" stroke={dangerRed} strokeWidth="2" />
                    <text x="0" y="-4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                      HALLUCINATION DETECTED!
                    </text>
                    <text x="0" y="14" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace">
                      Doc A lost at Rank #14
                    </text>
                  </g>
                )}
              </svg>
            </div>
          )
        }}
      </MotionGraphicPlayer>
    </div>
  )
}
