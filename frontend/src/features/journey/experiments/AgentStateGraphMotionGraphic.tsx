import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Flame, Zap } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function AgentStateGraphMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [strategyMode, setStrategyMode] = useState<'hitl_approval' | 'react_tool_loop' | 'infinite_loop_breaker'>('hitl_approval')

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

  let activeNode = 'classifier'
  let graphStatus: 'RUNNING' | 'PAUSED_HITL' | 'COMPLETED' | 'MAX_STEPS_EXCEEDED' = 'RUNNING'
  let stepCount = 0
  let checkpointId = 'chk_001'
  let humanApproved = false

  if (currentTime < 3.0) {
    // Act 1: State Ingestion & Initialization
    activeNode = 'classifier'
    graphStatus = 'RUNNING'
    stepCount = 1
    checkpointId = 'chk_001'
    subtitle = 'Act 1 (0.0s – 3.0s): State Ingestion. User request enters StateGraph. Global state dictionary initialized with checkpoint chk_001.'
    metrics = [
      { label: 'Active Node', value: 'classifier (Entrypoint)', variant: 'default' },
      { label: 'Input Query', value: '"Urgent $1,200 refund on Order #8821"', variant: 'default' },
      { label: 'State Checkpoint', value: 'chk_001 (SqliteSaver)', variant: 'success' },
      { label: 'Step Counter', value: '1 / 10 Max Steps', variant: 'default' },
    ]
  } else if (currentTime < 6.0) {
    // Act 2: Intent Classification & Routing
    activeNode = 'classifier -> billing_agent'
    graphStatus = 'RUNNING'
    stepCount = 2
    checkpointId = 'chk_002'

    if (strategyMode === 'react_tool_loop') {
      activeNode = 'tool_agent -> calculator'
      subtitle = 'Act 2 (3.0s – 6.0s): Tool Dispatch. Agent inspects mathematical query and emits Tool Call `calculator("12 * 8")`. State enters execution step 2.'
      metrics = [
        { label: 'Action Type', value: 'Tool Call: `calculator`', variant: 'default' },
        { label: 'Tool Argument', value: '"12 * 8"', variant: 'default' },
        { label: 'Step Count', value: '2 / 10 Steps', variant: 'default' },
        { label: 'Execution Mode', value: 'ReAct Autonomous Cycle', variant: 'success' },
      ]
    } else {
      subtitle = 'Act 2 (3.0s – 6.0s): Conditional Routing. Classifier detects "refund" keyword, sets intent="billing", and routes to Billing Specialist Agent.'
      metrics = [
        { label: 'Detected Intent', value: 'intent = "billing"', variant: 'success' },
        { label: 'Conditional Edge', value: 'Branch to `billing_agent`', variant: 'success' },
        { label: 'Target Worker', value: 'Billing Specialist Agent', variant: 'default' },
        { label: 'Step Counter', value: '2 / 10 Max Steps', variant: 'default' },
      ]
    }
  } else if (currentTime < 9.0) {
    // Act 3: Divergence - HITL Breakpoint vs Infinite Loop
    activeNode = 'billing_agent'

    if (strategyMode === 'hitl_approval') {
      graphStatus = 'PAUSED_HITL'
      stepCount = 3
      checkpointId = 'chk_003'
      subtitle = 'Act 3 (6.0s – 9.0s): Human-in-the-Loop Interruption! State frozen at checkpoint chk_003. Graph pauses for operator approval before committing refund.'
      metrics = [
        { label: 'Graph Status', value: 'PAUSED_FOR_HUMAN_APPROVAL', variant: 'warning' },
        { label: 'Action Gate', value: 'interrupt_before=["execute_refund"]', variant: 'warning' },
        { label: 'State Checkpointer', value: 'Serialized in SqliteSaver', variant: 'success' },
        { label: 'Financial Safety', value: 'Guarded: Zero unauthorized payout', variant: 'success' },
      ]
    } else if (strategyMode === 'infinite_loop_breaker') {
      activeNode = 'looping_agent'
      stepCount = 8
      checkpointId = 'chk_008'
      subtitle = 'Act 3 (6.0s – 9.0s): RUNAWAY LOOP DETECTED! Ambiguous prompt causes agent to repeat search query without terminating. Steps surging: 8/10!'
      metrics = [
        { label: 'Execution Anomaly', value: 'Recursive Tool Call Loop', variant: 'danger' },
        { label: 'Current Step', value: 'Step 8 of 10 Max Budget', variant: 'danger' },
        { label: 'Token Consumption', value: 'Rapid API Billing Drain', variant: 'danger' },
        { label: 'Guard Circuit', value: 'Max Steps Guard Arming', variant: 'warning' },
      ]
    } else {
      // ReAct Loop observation
      activeNode = 'tool_agent'
      stepCount = 3
      subtitle = 'Act 3 (6.0s – 9.0s): Observation Received. Calculator returns observation "96". Agent incorporates result into state messages and formulates answer.'
      metrics = [
        { label: 'Tool Observation', value: 'Calculator returned "96"', variant: 'success' },
        { label: 'State Update', value: 'Observation appended to log', variant: 'success' },
        { label: 'Next Action', value: 'Synthesizing Final Answer', variant: 'default' },
        { label: 'Step Count', value: '3 / 10 Steps', variant: 'default' },
      ]
    }
  } else {
    // Act 4: Resumption & Clean Termination
    if (strategyMode === 'hitl_approval') {
      humanApproved = true
      activeNode = '__end__'
      graphStatus = 'COMPLETED'
      stepCount = 4
      checkpointId = 'chk_004'
      subtitle = 'Act 4 (9.0s – 12.0s): Human Approved! Graph resumed from checkpoint chk_003, committed $1,200 refund, and terminated cleanly at __end__.'
      metrics = [
        { label: 'Operator Action', value: 'APPROVED (Resume from chk_003)', variant: 'success' },
        { label: 'Ledger Mutation', value: '$1,200 Refund Dispatched', variant: 'success' },
        { label: 'Final Node', value: '__end__ (Resolved: True)', variant: 'success' },
        { label: 'Audit Trail', value: '100% Tracked & Reversible', variant: 'success' },
      ]
    } else if (strategyMode === 'infinite_loop_breaker') {
      activeNode = '__halted__'
      graphStatus = 'MAX_STEPS_EXCEEDED'
      stepCount = 10
      subtitle = 'Act 4 (9.0s – 12.0s): CIRCUIT BREAKER TRIPPED! Hard limit of 10 steps reached. Execution halted safely, preventing infinite cloud billing drain.'
      metrics = [
        { label: 'Circuit Breaker', value: 'MAX_STEPS_EXCEEDED (Tripped)', variant: 'danger' },
        { label: 'Halt Step', value: '10 Steps Capped', variant: 'warning' },
        { label: 'Cloud Protection', value: 'Billing Drain Neutralized', variant: 'success' },
        { label: 'Fallback Route', value: 'Escalated to Human Tier 2', variant: 'default' },
      ]
    } else {
      // ReAct Loop Finish
      activeNode = '__end__'
      graphStatus = 'COMPLETED'
      stepCount = 4
      subtitle = 'Act 4 (9.0s – 12.0s): Completed! Agent emits `finish("The answer is 96.")` and transitions to __end__. Total 2 reasoning steps executed.'
      metrics = [
        { label: 'Final Output', value: '"The answer is 96."', variant: 'success' },
        { label: 'Total Steps', value: '2 reasoning iterations', variant: 'success' },
        { label: 'Terminal State', value: '__end__ (Status: completed)', variant: 'success' },
        { label: 'Efficiency', value: 'Zero redundant tool calls', variant: 'success' },
      ]
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      <MotionGraphicPlayer
        title="Multi-Agent StateGraph, Cyclical Tool Calling & Human-in-the-Loop Interrupts"
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
              onClick={() => { setStrategyMode('hitl_approval'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'hitl_approval'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>HITL Breakpoint (LangGraph)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('react_tool_loop'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'react_tool_loop'
                  ? 'bg-sky-950/50 text-sky-300 font-bold border border-sky-600/60 shadow-xs'
                  : 'text-muted hover:text-sky-300'
              }`}
            >
              <Zap size={12} />
              <span>ReAct Tool-Calling Loop</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('infinite_loop_breaker'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'infinite_loop_breaker'
                  ? 'bg-rose-950/50 text-rose-300 font-bold border border-rose-600/60 shadow-xs'
                  : 'text-muted hover:text-rose-300'
              }`}
            >
              <Flame size={12} />
              <span>Max-Steps Circuit Breaker</span>
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
          const stateCyan = '#06b6d4'
          const routerPurple = '#a855f7'
          const workerEmerald = '#10b981'
          const dangerRed = '#ef4444'
          const warningAmber = '#f59e0b'

          // Particle timings
          const tAct1 = Math.min(1, Math.max(0, (currentTime - 0.5) / 2.0))
          const tAct2 = Math.min(1, Math.max(0, (currentTime - 3.5) / 2.0))
          const tAct4 = Math.min(1, Math.max(0, (currentTime - 9.5) / 2.0))

          return (
            <div className="relative w-full aspect-[16/10] max-w-[880px] mx-auto py-2">
              <svg viewBox="0 0 900 520" className="w-full h-full transition-all duration-300">
                <defs>
                  <marker id="agent-arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={stateCyan} />
                  </marker>
                  <marker id="agent-arrow-purple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={routerPurple} />
                  </marker>
                  <marker id="agent-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={workerEmerald} />
                  </marker>
                  <filter id="agent-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity={isLight ? '0.08' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* ==================== FLOW CONNECTORS ==================== */}
                {/* 1. Global State -> Classifier */}
                <line x1="220" y1="210" x2="260" y2="210" stroke={stateCyan} strokeWidth="2.5" />

                {/* 2. Classifier -> Billing Agent */}
                <path
                  d="M 420 180 C 440 180, 450 140, 470 140"
                  fill="none"
                  stroke={routerPurple}
                  strokeWidth="2.5"
                />

                {/* 3. Classifier -> Auth Agent */}
                <line x1="420" y1="230" x2="470" y2="230" stroke={cardBorder} strokeWidth="1.5" strokeDasharray="3 3" />

                {/* 4. Specialist Agent -> __end__ Node */}
                <path
                  d="M 660 140 C 670 140, 680 210, 700 210"
                  fill="none"
                  stroke={workerEmerald}
                  strokeWidth="2.5"
                />

                {/* ReAct Self-Loop Arc in ReAct Mode */}
                {strategyMode === 'react_tool_loop' && (
                  <path
                    d="M 560 110 C 560 60, 520 60, 520 110"
                    fill="none"
                    stroke={stateCyan}
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                )}

                {/* ==================== FLYING DATA PACKETS ==================== */}
                {/* Act 1: Initial state to Classifier */}
                {currentTime < 3.0 && (
                  <g transform={`translate(${220 + (260 - 220) * tAct1}, 210)`}>
                    <circle r="6" fill={stateCyan} />
                  </g>
                )}

                {/* Act 2: State packet to Billing Agent */}
                {currentTime >= 3.0 && currentTime < 6.0 && (
                  <g transform={`translate(${420 + (470 - 420) * tAct2}, ${180 - (180 - 140) * tAct2})`}>
                    <circle r="7" fill={routerPurple} filter="url(#agent-shadow)" />
                    <rect x="-35" y="-20" width="70" height="15" rx="3" fill={isLight ? '#7e22ce' : '#581c87'} />
                    <text x="0" y="-9" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                      INTENT: BILLING
                    </text>
                  </g>
                )}

                {/* Act 4: Resumed execution to __end__ */}
                {currentTime >= 9.0 && strategyMode === 'hitl_approval' && (
                  <g transform={`translate(${660 + (700 - 660) * tAct4}, ${140 + (210 - 140) * tAct4})`}>
                    <circle r="7" fill={workerEmerald} filter="url(#agent-shadow)" />
                    <rect x="-30" y="-20" width="60" height="15" rx="3" fill={isLight ? '#059669' : '#065f46'} />
                    <text x="0" y="-9" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                      RESOLVED
                    </text>
                  </g>
                )}

                {/* ==================== 1. GLOBAL STATE & CHECKPOINTER (Left) ==================== */}
                <g transform="translate(30, 50)" filter="url(#agent-shadow)">
                  <rect
                    width="190"
                    height="410"
                    rx="14"
                    fill={cardBg}
                    stroke={cardBorder}
                    strokeWidth="1"
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="190" height="38" rx="14" fill={isLight ? '#ecfeff' : '#083344'} />
                  <circle cx="18" cy="19" r="6" fill={stateCyan} />
                  <text x="32" y="24" fill={textPrimary} fontSize="12" fontWeight="700">
                    StateGraph Runtime
                  </text>

                  {/* Body Content */}
                  <g transform="translate(14, 55)">
                    <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="bold">
                      SHARED GRAPH STATE (`TypedDict`)
                    </text>
                    <rect x="0" y="22" width="162" height="110" rx="6" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    
                    <text x="8" y="40" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      query: <tspan fill={textPrimary}>"$1,200 refund..."</tspan>
                    </text>
                    <text x="8" y="58" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      intent: <tspan fill={routerPurple} fontWeight="bold">{currentTime >= 3.0 ? 'billing' : 'null'}</tspan>
                    </text>
                    <text x="8" y="76" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      step: <tspan fill={stepCount >= 10 ? dangerRed : textPrimary} fontWeight="bold">{stepCount} / 10</tspan>
                    </text>
                    <text x="8" y="94" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      resolved: <tspan fill={humanApproved ? workerEmerald : textSecondary} fontWeight="bold">{humanApproved ? 'True' : 'False'}</tspan>
                    </text>
                    <text x="8" y="112" fill={stateCyan} fontSize="8" fontFamily="monospace">
                      log: [{currentTime >= 3.0 ? "'classified'" : ''}{humanApproved ? ", 'resolved'" : ''}]
                    </text>
                  </g>

                  {/* Checkpoint Persistence Engine */}
                  <g transform="translate(14, 185)">
                    <rect x="0" y="0" width="162" height="100" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      SQLITE CHECKPOINTER
                    </text>
                    <text x="10" y="38" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      Thread ID: `th_user_882`
                    </text>
                    <text x="10" y="56" fill={stateCyan} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      Saved: {checkpointId}
                    </text>
                    <text x="10" y="74" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      Snapshot: Durable WAL
                    </text>
                    <text x="10" y="92" fill={workerEmerald} fontSize="8" fontFamily="monospace">
                      Supports Freeze / Time Travel
                    </text>
                  </g>

                  {/* Graph Status Pill */}
                  <g transform="translate(14, 298)">
                    <rect
                      x="0"
                      y="0"
                      width="162"
                      height="92"
                      rx="8"
                      fill={
                        graphStatus === 'COMPLETED'
                          ? isLight ? '#dcfce7' : '#052e16'
                          : graphStatus === 'PAUSED_HITL'
                          ? isLight ? '#fef3c7' : '#451a03'
                          : graphStatus === 'MAX_STEPS_EXCEEDED'
                          ? isLight ? '#fee2e2' : '#450a0a'
                          : isLight ? '#f0f9ff' : '#082f49'
                      }
                      stroke={
                        graphStatus === 'COMPLETED'
                          ? workerEmerald
                          : graphStatus === 'PAUSED_HITL'
                          ? warningAmber
                          : graphStatus === 'MAX_STEPS_EXCEEDED'
                          ? dangerRed
                          : stateCyan
                      }
                    />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      GRAPH EXECUTION STATE
                    </text>
                    <text
                      x="10"
                      y="38"
                      fill={
                        graphStatus === 'COMPLETED'
                          ? workerEmerald
                          : graphStatus === 'PAUSED_HITL'
                          ? warningAmber
                          : graphStatus === 'MAX_STEPS_EXCEEDED'
                          ? dangerRed
                          : stateCyan
                      }
                      fontSize="12"
                      fontWeight="800"
                      fontFamily="monospace"
                    >
                      {graphStatus}
                    </text>
                    <text x="10" y="56" fill={textSecondary} fontSize="8.5" fontFamily="monospace">
                      {graphStatus === 'PAUSED_HITL'
                        ? 'Awaiting human review'
                        : graphStatus === 'COMPLETED'
                        ? 'Reached __end__ terminal'
                        : graphStatus === 'MAX_STEPS_EXCEEDED'
                        ? 'Guard halted loop'
                        : 'Advancing graph nodes'}
                    </text>
                    <text x="10" y="74" fill={stateCyan} fontSize="8.5" fontFamily="monospace">
                      Node: {activeNode}
                    </text>
                  </g>
                </g>

                {/* ==================== 2. SUPERVISOR / CLASSIFIER ROUTER ==================== */}
                <g transform="translate(250, 50)" filter="url(#agent-shadow)">
                  <rect
                    width="170"
                    height="410"
                    rx="14"
                    fill={cardBg}
                    stroke={cardBorder}
                    strokeWidth="1"
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="170" height="38" rx="14" fill={isLight ? '#faf5ff' : '#2e1065'} />
                  <circle cx="18" cy="19" r="6" fill={routerPurple} />
                  <text x="32" y="24" fill={textPrimary} fontSize="12" fontWeight="700">
                    Classifier Router
                  </text>

                  {/* Body Content */}
                  <g transform="translate(14, 55)">
                    <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="bold">
                      INTENT EVALUATION
                    </text>
                    <rect x="0" y="22" width="142" height="80" rx="6" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="8" y="40" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      • "refund" -&gt; billing
                    </text>
                    <text x="8" y="56" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      • "reset" -&gt; auth
                    </text>
                    <text x="8" y="72" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      • else -&gt; general
                    </text>
                    <text x="8" y="90" fill={routerPurple} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      Match: intent="billing"
                    </text>
                  </g>

                  {/* Conditional Edge Decision */}
                  <g transform="translate(14, 185)">
                    <rect x="0" y="0" width="142" height="110" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      CONDITIONAL EDGES
                    </text>
                    <text x="10" y="38" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      add_conditional_edges(
                    </text>
                    <text x="10" y="54" fill={routerPurple} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      "classifier",
                    </text>
                    <text x="10" y="70" fill={routerPurple} fontSize="9" fontFamily="monospace">
                      route_by_intent
                    </text>
                    <text x="10" y="86" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      )
                    </text>
                    <text x="10" y="104" fill={workerEmerald} fontSize="8" fontFamily="monospace">
                      Dynamic State Steering
                    </text>
                  </g>

                  {/* Max Steps Guard Monitor */}
                  <g transform="translate(14, 310)">
                    <rect x="0" y="0" width="142" height="80" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      BUDGET CIRCUIT BREAKER
                    </text>
                    <text x="10" y="38" fill={stepCount >= 10 ? dangerRed : textPrimary} fontSize="11" fontWeight="bold" fontFamily="monospace">
                      Steps: {stepCount} / 10
                    </text>
                    <text x="10" y="56" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      Max Guard: 10 Iterations
                    </text>
                    <text x="10" y="72" fill={stepCount >= 10 ? dangerRed : workerEmerald} fontSize="8" fontFamily="monospace">
                      {stepCount >= 10 ? 'HALTED: Limit Reached' : 'Within Safety Budget'}
                    </text>
                  </g>
                </g>

                {/* ==================== 3. SPECIALIST WORKERS & HITL GATE ==================== */}
                <g transform="translate(450, 50)" filter="url(#agent-shadow)">
                  <rect
                    width="210"
                    height="410"
                    rx="14"
                    fill={cardBg}
                    stroke={graphStatus === 'PAUSED_HITL' ? warningAmber : cardBorder}
                    strokeWidth={graphStatus === 'PAUSED_HITL' ? 2 : 1}
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="210" height="38" rx="14" fill={isLight ? '#f0fdf4' : '#052e16'} />
                  <circle cx="18" cy="19" r="6" fill={workerEmerald} />
                  <text x="32" y="24" fill={textPrimary} fontSize="12" fontWeight="700">
                    Specialist Agents & HITL Gate
                  </text>

                  {/* Billing Specialist Node */}
                  <g transform="translate(14, 55)">
                    <rect
                      x="0"
                      y="0"
                      width="182"
                      height="75"
                      rx="8"
                      fill={isLight ? '#f8fafc' : '#0b0f19'}
                      stroke={currentTime >= 3.0 ? workerEmerald : cardBorder}
                      strokeWidth={currentTime >= 3.0 ? 2 : 1}
                    />
                    <text x="10" y="18" fill={textPrimary} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      NODE: `billing_agent`
                    </text>
                    <text x="10" y="36" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      Payload: Process $1,200 Refund
                    </text>
                    <text x="10" y="54" fill={workerEmerald} fontSize="9" fontFamily="monospace">
                      Target: Stripe / UPI Ledger API
                    </text>
                    <text x="10" y="68" fill={warningAmber} fontSize="8" fontWeight="bold" fontFamily="monospace">
                      Flag: High Financial Consequence
                    </text>
                  </g>

                  {/* HITL Breakpoint Card */}
                  <g transform="translate(14, 145)">
                    <rect
                      x="0"
                      y="0"
                      width="182"
                      height="140"
                      rx="8"
                      fill={
                        graphStatus === 'PAUSED_HITL'
                          ? isLight ? '#fef3c7' : '#451a03'
                          : isLight ? '#f8fafc' : '#0b0f19'
                      }
                      stroke={graphStatus === 'PAUSED_HITL' ? warningAmber : cardBorder}
                    />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      HITL APPROVAL BREAKPOINT
                    </text>
                    <text x="10" y="38" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      interrupt_before=["refund"]
                    </text>
                    
                    {/* Pulsing Approval Button simulation */}
                    <g transform="translate(10, 52)">
                      <rect
                        x="0"
                        y="0"
                        width="162"
                        height="42"
                        rx="6"
                        fill={humanApproved ? '#059669' : '#d97706'}
                      />
                      <text x="81" y="24" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                        {humanApproved ? '✓ REFUND APPROVED' : '⚠ APPROVE $1,200?'}
                      </text>
                      <text x="81" y="36" textAnchor="middle" fill="#ffffff" fontSize="8" opacity={0.8}>
                        {humanApproved ? 'Invoking from checkpoint' : 'Click to resume graph'}
                      </text>
                    </g>

                    <text x="10" y="112" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      State safely serialized in SQLite.
                    </text>
                    <text x="10" y="126" fill={workerEmerald} fontSize="8" fontWeight="bold" fontFamily="monospace">
                      Zero accidental funds dispatched.
                    </text>
                  </g>

                  {/* Auth Agent Node (Idle) */}
                  <g transform="translate(14, 300)">
                    <rect x="0" y="0" width="182" height="42" rx="6" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} opacity={0.5} />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      NODE: `auth_agent` (Idle)
                    </text>
                    <text x="10" y="32" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      No PIN reset requested
                    </text>
                  </g>

                  {/* General Agent Node (Idle) */}
                  <g transform="translate(14, 350)">
                    <rect x="0" y="0" width="182" height="42" rx="6" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} opacity={0.5} />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      NODE: `general_agent` (Idle)
                    </text>
                    <text x="10" y="32" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      FAQ fallback unneeded
                    </text>
                  </g>
                </g>

                {/* ==================== 4. VISITED NODES & TERMINAL `__end__` ==================== */}
                <g transform="translate(685, 50)" filter="url(#agent-shadow)">
                  <rect
                    width="185"
                    height="410"
                    rx="14"
                    fill={cardBg}
                    stroke={cardBorder}
                    strokeWidth="1"
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="185" height="38" rx="14" fill={isLight ? '#f1f5f9' : '#1e293b'} />
                  <circle cx="18" cy="19" r="6" fill={graphStatus === 'COMPLETED' ? workerEmerald : warningAmber} />
                  <text x="32" y="24" fill={textPrimary} fontSize="12" fontWeight="700">
                    Terminal & Execution Log
                  </text>

                  {/* Body Content */}
                  <g transform="translate(14, 55)">
                    <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="bold">
                      VISITED NODES TRAIL
                    </text>
                    <rect x="0" y="22" width="157" height="120" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    
                    <text x="8" y="42" fill={stateCyan} fontSize="10" fontFamily="monospace">
                      1. ['classifier']
                    </text>
                    <text x="8" y="62" fill={currentTime >= 3.0 ? routerPurple : textSecondary} fontSize="10" fontFamily="monospace">
                      2. ['billing_agent']
                    </text>
                    <text x="8" y="82" fill={graphStatus === 'PAUSED_HITL' ? warningAmber : humanApproved ? workerEmerald : textSecondary} fontSize="10" fontFamily="monospace">
                      3. [HITL: {graphStatus === 'PAUSED_HITL' ? 'Interrupted' : 'Approved'}]
                    </text>
                    <text x="8" y="102" fill={humanApproved ? workerEmerald : textSecondary} fontSize="10" fontFamily="monospace">
                      4. ['__end__']
                    </text>
                    <text x="8" y="126" fill={workerEmerald} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      Total: {stepCount} Steps Executed
                    </text>
                  </g>

                  {/* Terminal State Node */}
                  <g transform="translate(14, 195)">
                    <rect
                      x="0"
                      y="0"
                      width="157"
                      height="100"
                      rx="8"
                      fill={
                        graphStatus === 'COMPLETED'
                          ? isLight ? '#dcfce7' : '#052e16'
                          : graphStatus === 'MAX_STEPS_EXCEEDED'
                          ? isLight ? '#fee2e2' : '#450a0a'
                          : isLight ? '#f8fafc' : '#0b0f19'
                      }
                      stroke={
                        graphStatus === 'COMPLETED'
                          ? workerEmerald
                          : graphStatus === 'MAX_STEPS_EXCEEDED'
                          ? dangerRed
                          : cardBorder
                      }
                    />
                    <text x="10" y="20" fill={textSecondary} fontSize="9" fontWeight="bold">
                      TERMINAL NODE (`__end__`)
                    </text>
                    <text
                      x="10"
                      y="46"
                      fill={
                        graphStatus === 'COMPLETED'
                          ? workerEmerald
                          : graphStatus === 'MAX_STEPS_EXCEEDED'
                          ? dangerRed
                          : textPrimary
                      }
                      fontSize="14"
                      fontWeight="800"
                      fontFamily="monospace"
                    >
                      {graphStatus === 'COMPLETED' ? '✓ RESOLVED: TRUE' : graphStatus === 'MAX_STEPS_EXCEEDED' ? 'ABORTED: BUDGET' : 'PENDING'}
                    </text>
                    <text x="10" y="66" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      {graphStatus === 'COMPLETED' ? 'Output payload verified' : 'Graph execution paused'}
                    </text>
                    <text x="10" y="84" fill={workerEmerald} fontSize="8" fontFamily="monospace">
                      Clean session termination
                    </text>
                  </g>

                  {/* Summary Metric */}
                  <g transform="translate(14, 310)">
                    <rect x="0" y="0" width="157" height="80" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      SAFETY AUDIT
                    </text>
                    <text x="10" y="38" fill={workerEmerald} fontSize="11" fontWeight="bold" fontFamily="monospace">
                      100% Deterministic
                    </text>
                    <text x="10" y="56" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      Zero unverified actions
                    </text>
                    <text x="10" y="72" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      Production Grade Agent
                    </text>
                  </g>
                </g>

                {/* HITL Interruption Overlay Badge */}
                {currentTime >= 6.0 && currentTime < 9.0 && strategyMode === 'hitl_approval' && (
                  <g transform="translate(550, 240)" filter="url(#agent-shadow)">
                    <rect x="-105" y="-24" width="210" height="48" rx="8" fill="#d97706" stroke={warningAmber} strokeWidth="2" />
                    <text x="0" y="-4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                      HITL INTERRUPT TRIGGERED
                    </text>
                    <text x="0" y="14" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace">
                      Execution Frozen at Checkpoint
                    </text>
                  </g>
                )}

                {/* Circuit Breaker Overlay */}
                {currentTime >= 6.0 && strategyMode === 'infinite_loop_breaker' && (
                  <g transform="translate(550, 240)" filter="url(#agent-shadow)">
                    <rect x="-105" y="-24" width="210" height="48" rx="8" fill="#991b1b" stroke={dangerRed} strokeWidth="2" />
                    <text x="0" y="-4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                      CIRCUIT BREAKER: 10 STEPS
                    </text>
                    <text x="0" y="14" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace">
                      Halted Runaway Agent Loop
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
