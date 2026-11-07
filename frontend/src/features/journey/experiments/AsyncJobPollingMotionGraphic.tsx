import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Flame, Zap } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function AsyncJobPollingMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [strategyMode, setStrategyMode] = useState<'exponential_backoff' | 'naive_tight_polling' | 'synchronous_blocking_timeout'>('exponential_backoff')

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

  let clientPollingInterval = '200 ms'
  let clientAttempts = 1
  let workerProgress = 10
  let jobState: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' = 'PENDING'
  let gatewayStatusCode = '202 Accepted'
  let gatewayQps = '1 req/s'

  if (currentTime < 3.0) {
    // Act 1: Job Ingestion & HTTP 202 Accepted
    jobState = 'PENDING'
    workerProgress = Math.min(25, Math.floor((currentTime / 3.0) * 25))
    gatewayStatusCode = '202 Accepted'
    gatewayQps = '1 req / poll'
    clientPollingInterval = '200 ms'
    clientAttempts = 1
    subtitle = 'Act 1 (0.0s – 3.0s): Job Initiation. Client submits bulk GST report. API Gateway enqueues task and returns instant HTTP 202 Accepted + Location URL.'
    metrics = [
      { label: 'Client Request', value: 'POST /api/v1/jobs/export_gst', variant: 'default' },
      { label: 'HTTP Response', value: '202 Accepted (Location: /jobs/gst_99)', variant: 'success' },
      { label: 'Task Queue', value: 'Enqueued in Redis Queue', variant: 'default' },
      { label: 'Initial Backoff', value: 'Initial delay: 200 ms', variant: 'default' },
    ]
  } else if (currentTime < 6.0) {
    // Act 2: Background Processing & Initial Polls
    jobState = 'PROCESSING'
    workerProgress = Math.min(65, 25 + Math.floor(((currentTime - 3.0) / 3.0) * 40))

    if (strategyMode === 'naive_tight_polling') {
      clientPollingInterval = '50 ms (Tight Loop)'
      clientAttempts = 42
      gatewayStatusCode = '200 OK (PROCESSING)'
      gatewayQps = '4,000,000 QPS (200k sellers)'
      subtitle = 'Act 2 (3.0s – 6.0s): THUNDERING HERD POLLING! Clients poll in a tight 50ms loop. 200,000 sellers flood API gateway with 4 million QPS!'
      metrics = [
        { label: 'Polling Pattern', value: 'Tight While Loop (50ms interval)', variant: 'danger' },
        { label: 'Gateway Ingress', value: '4,000,000 requests / sec', variant: 'danger' },
        { label: 'Worker Progress', value: `${workerProgress}% Rendered`, variant: 'default' },
        { label: 'Gateway Health', value: 'CPU 98% (Connection Exhaustion)', variant: 'danger' },
      ]
    } else if (strategyMode === 'synchronous_blocking_timeout') {
      clientPollingInterval = 'None (Socket Blocked)'
      clientAttempts = 1
      gatewayStatusCode = 'Holding HTTP Socket Open...'
      gatewayQps = 'Socket Pinned (120s needed)'
      subtitle = 'Act 2 (3.0s – 6.0s): Blocking Anti-Pattern. Client leaves HTTP connection open waiting for PDF rendering. Reverse proxy socket timer ticking (60s cap).'
      metrics = [
        { label: 'Connection Model', value: 'Synchronous Long-Poll Block', variant: 'warning' },
        { label: 'Proxy Socket Timer', value: '38s / 60s max timeout', variant: 'warning' },
        { label: 'Worker Progress', value: `${workerProgress}% Rendered`, variant: 'default' },
        { label: 'Risk Factor', value: '504 Gateway Timeout Imminent', variant: 'danger' },
      ]
    } else {
      // Exponential Backoff
      clientPollingInterval = '300 ms (1.5x Multiplier)'
      clientAttempts = 2
      gatewayStatusCode = '200 OK (PROCESSING 45%)'
      gatewayQps = '0.3 req / sec (Gentle)'
      subtitle = 'Act 2 (3.0s – 6.0s): Exponential Spacing. Worker crunches heavy PDF. Client poll #2 observes PROCESSING; interval expands from 200ms to 300ms.'
      metrics = [
        { label: 'Poll #2 Query', value: 'GET /jobs/gst_99 -> 200 OK', variant: 'success' },
        { label: 'Job Progress', value: `${workerProgress}% (Page 450/1000)`, variant: 'default' },
        { label: 'Next Interval', value: '300 ms (200ms * 1.5)', variant: 'success' },
        { label: 'Gateway Load', value: 'Near-zero connection overhead', variant: 'success' },
      ]
    }
  } else if (currentTime < 9.0) {
    // Act 3: Divergence - Backoff Expansion vs Gateway Collapse
    workerProgress = Math.min(95, 65 + Math.floor(((currentTime - 6.0) / 3.0) * 30))

    if (strategyMode === 'naive_tight_polling') {
      clientPollingInterval = '50 ms'
      clientAttempts = 95
      gatewayStatusCode = '503 SERVICE UNAVAILABLE'
      gatewayQps = 'Connection Pool Dropping'
      subtitle = 'Act 3 (6.0s – 9.0s): API GATEWAY MELTDOWN! Unchecked polling crashes status check endpoint. Gateway returns 503 Service Unavailable.'
      metrics = [
        { label: 'Gateway Status', value: '503 SERVICE UNAVAILABLE', variant: 'danger' },
        { label: 'Total Polls Sent', value: '95 requests for 1 job!', variant: 'danger' },
        { label: 'Database IOPS', value: '100% Saturated (Lock Stalls)', variant: 'danger' },
        { label: 'Mitigation Required', value: 'Implement Exponential Backoff', variant: 'warning' },
      ]
    } else if (strategyMode === 'synchronous_blocking_timeout') {
      clientPollingInterval = 'Socket Severed'
      clientAttempts = 1
      gatewayStatusCode = '504 GATEWAY TIMEOUT'
      gatewayQps = 'Socket Terminated'
      subtitle = 'Act 3 (6.0s – 9.0s): GATEWAY TIMEOUT COLLAPSE! Nginx 60s timeout exceeded. Connection severed with 504 Gateway Timeout. PDF orphaned in worker!'
      metrics = [
        { label: 'Proxy Event', value: 'proxy_read_timeout (60s)', variant: 'danger' },
        { label: 'HTTP Status', value: '504 GATEWAY TIMEOUT', variant: 'danger' },
        { label: 'Client Experience', value: 'Broken Download / Error Screen', variant: 'danger' },
        { label: 'Worker Loss', value: 'Completed PDF Orphaned', variant: 'danger' },
      ]
    } else {
      // Exponential Backoff
      clientPollingInterval = '450 ms -> 675 ms'
      clientAttempts = 4
      gatewayStatusCode = '200 OK (PROCESSING 85%)'
      gatewayQps = '0.15 req / sec'
      subtitle = 'Act 3 (6.0s – 9.0s): Backoff Spacing. Polling interval widens to 450ms then 675ms. Server load drops by 88% while worker approaches 100% completion.'
      metrics = [
        { label: 'Poll #3 & #4', value: '200 OK (PROCESSING 85%)', variant: 'success' },
        { label: 'Interval Expansion', value: '450ms -> 675ms (Capped at 2s)', variant: 'success' },
        { label: 'Load Reduction', value: '88% Fewer HTTP Queries', variant: 'success' },
        { label: 'Worker Health', value: 'Full CPU dedicated to PDF render', variant: 'success' },
      ]
    }
  } else {
    // Act 4: Terminal Success & Download Link
    workerProgress = 100
    jobState = 'SUCCESS'

    if (strategyMode === 'naive_tight_polling') {
      gatewayStatusCode = '503 CRASHED'
      subtitle = 'Act 4 (9.0s – 12.0s): Audit failure. Despite worker finishing, client never received download link due to gateway connection pool exhaustion.'
      metrics = [
        { label: 'Final Result', value: 'CLIENT FAILED TO RECEIVE ASSET', variant: 'danger' },
        { label: 'Root Cause', value: 'Polling Thundering Herd', variant: 'danger' },
        { label: 'Poll Count', value: '120 redundant status queries', variant: 'danger' },
        { label: 'Architecture Fix', value: 'Client SDK Exponential Backoff', variant: 'warning' },
      ]
    } else if (strategyMode === 'synchronous_blocking_timeout') {
      gatewayStatusCode = '504 DROPPED'
      subtitle = 'Act 4 (9.0s – 12.0s): Post-mortem: Synchronous blocking APIs are strictly incompatible with long-running tasks. Always decouple with HTTP 202.'
      metrics = [
        { label: 'Final Result', value: 'HTTP 504 (Connection Dropped)', variant: 'danger' },
        { label: 'Waste', value: 'Worker burned CPU for unread file', variant: 'danger' },
        { label: 'Rule of Thumb', value: 'Tasks > 5s MUST use HTTP 202', variant: 'warning' },
        { label: 'Fix', value: 'Async Request-Reply Pattern', variant: 'success' },
      ]
    } else {
      // Exponential Backoff: Success!
      clientPollingInterval = 'TERMINAL (Polling Ceased)'
      clientAttempts = 5
      gatewayStatusCode = '200 OK (SUCCESS + S3 Link)'
      subtitle = 'Act 4 (9.0s – 12.0s): Terminal Success! Poll #5 receives SUCCESS with Presigned S3 Download URL. 0 timeouts, 88% query reduction achieved!'
      metrics = [
        { label: 'Final Status', value: '200 OK: COMPLETED', variant: 'success' },
        { label: 'Total Poll Attempts', value: '5 attempts (vs 120 naive)', variant: 'success' },
        { label: 'Asset Delivered', value: 's3://swiftcart/gst_q3.pdf', variant: 'success' },
        { label: 'Pattern Grade', value: '100% Production Resilient', variant: 'success' },
      ]
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      <MotionGraphicPlayer
        title="HTTP 202 Accepted, Asynchronous Job Queues & Exponential Backoff Polling"
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
              onClick={() => { setStrategyMode('exponential_backoff'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'exponential_backoff'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>HTTP 202 + Exponential Backoff</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('naive_tight_polling'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'naive_tight_polling'
                  ? 'bg-rose-950/50 text-rose-300 font-bold border border-rose-600/60 shadow-xs'
                  : 'text-muted hover:text-rose-300'
              }`}
            >
              <Flame size={12} />
              <span>Naive Tight Polling (Stampede)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('synchronous_blocking_timeout'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'synchronous_blocking_timeout'
                  ? 'bg-amber-950/50 text-amber-300 font-bold border border-amber-600/60 shadow-xs'
                  : 'text-muted hover:text-amber-300'
              }`}
            >
              <Zap size={12} />
              <span>Synchronous Block (504 Timeout)</span>
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
          const clientCyan = '#06b6d4'
          const gatewayPurple = '#a855f7'
          const queueAmber = '#f59e0b'
          const workerEmerald = '#10b981'
          const dangerRed = '#ef4444'

          // Particle progress
          const tAct1 = Math.min(1, Math.max(0, (currentTime - 0.5) / 2.0))
          const tAct2 = Math.min(1, Math.max(0, (currentTime - 3.5) / 2.0))
          const tAct4 = Math.min(1, Math.max(0, (currentTime - 9.5) / 2.0))

          return (
            <div className="relative w-full aspect-[16/10] max-w-[880px] mx-auto py-2">
              <svg viewBox="0 0 900 520" className="w-full h-full transition-all duration-300">
                <defs>
                  <marker id="poll-arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={clientCyan} />
                  </marker>
                  <marker id="poll-arrow-purple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={gatewayPurple} />
                  </marker>
                  <marker id="poll-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={workerEmerald} />
                  </marker>
                  <filter id="poll-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity={isLight ? '0.08' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* ==================== FLOW CONNECTORS ==================== */}
                {/* 1. Client <-> Gateway */}
                <line
                  x1="220"
                  y1="220"
                  x2="280"
                  y2="220"
                  stroke={strategyMode === 'naive_tight_polling' && currentTime >= 6.0 ? dangerRed : clientCyan}
                  strokeWidth="2.5"
                  strokeDasharray={strategyMode === 'naive_tight_polling' ? '3 3' : 'none'}
                />

                {/* 2. Gateway <-> Queue */}
                <line
                  x1="440"
                  y1="220"
                  x2="480"
                  y2="220"
                  stroke={queueAmber}
                  strokeWidth="2.5"
                />

                {/* 3. Queue <-> Worker */}
                <line
                  x1="640"
                  y1="220"
                  x2="680"
                  y2="220"
                  stroke={workerEmerald}
                  strokeWidth="2.5"
                />

                {/* ==================== FLYING PACKETS ==================== */}
                {/* Act 1: Initial POST /jobs and 202 Accepted response */}
                {currentTime < 3.0 && (
                  <>
                    <g transform={`translate(${220 + (280 - 220) * tAct1}, 220)`}>
                      <circle r="6" fill={clientCyan} />
                    </g>
                    <g transform={`translate(${440 + (480 - 440) * tAct1}, 220)`}>
                      <circle r="6" fill={queueAmber} />
                    </g>
                  </>
                )}

                {/* Act 2 & 3: Polling pings back and forth */}
                {currentTime >= 3.0 && currentTime < 9.0 && strategyMode === 'exponential_backoff' && (
                  <g transform={`translate(${220 + (280 - 220) * tAct2}, 220)`}>
                    <circle r="6" fill={clientCyan} />
                    <rect x="-35" y="-20" width="70" height="15" rx="3" fill={isLight ? '#0891b2' : '#155e75'} />
                    <text x="0" y="-9" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                      POLL #3
                    </text>
                  </g>
                )}

                {/* Naive Tight Polling Storm */}
                {currentTime >= 6.0 && currentTime < 9.0 && strategyMode === 'naive_tight_polling' && (
                  <>
                    <circle cx="230" cy="210" r="5" fill={dangerRed} />
                    <circle cx="250" cy="220" r="5" fill={dangerRed} />
                    <circle cx="270" cy="230" r="5" fill={dangerRed} />
                    <g transform={`translate(250, 260)`}>
                      <rect x="-60" y="-12" width="120" height="20" rx="4" fill="#991b1b" />
                      <text x="0" y="2" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                        4M QPS SPAM!
                      </text>
                    </g>
                  </>
                )}

                {/* Act 4: S3 Asset Link delivery back to client */}
                {currentTime >= 9.0 && strategyMode === 'exponential_backoff' && (
                  <g transform={`translate(${280 - (280 - 220) * tAct4}, 220)`}>
                    <circle r="7" fill={workerEmerald} filter="url(#poll-shadow)" />
                    <rect x="-45" y="-22" width="90" height="16" rx="4" fill={isLight ? '#059669' : '#065f46'} />
                    <text x="0" y="-10" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                      200 OK (S3 PDF)
                    </text>
                  </g>
                )}

                {/* ==================== 1. CLIENT APPLICATION (Left) ==================== */}
                <g transform="translate(30, 50)" filter="url(#poll-shadow)">
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
                  <circle cx="18" cy="19" r="6" fill={clientCyan} />
                  <text x="32" y="24" fill={textPrimary} fontSize="12" fontWeight="700">
                    Client App (Seller Portal)
                  </text>

                  {/* Body */}
                  <g transform="translate(14, 55)">
                    <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="bold">
                      JOB TRIGGER DETAILS
                    </text>
                    <text x="0" y="32" fill={textPrimary} fontSize="10" fontFamily="monospace">
                      Action: Export GST Report
                    </text>
                    <text x="0" y="48" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      Volume: 100,000 Invoices
                    </text>
                    <text x="0" y="64" fill={clientCyan} fontSize="10" fontFamily="monospace">
                      Job ID: `job_gst_99`
                    </text>
                  </g>

                  {/* Polling Engine Box */}
                  <g transform="translate(14, 145)">
                    <rect x="0" y="0" width="162" height="135" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      CLIENT POLLING ENGINE
                    </text>
                    <text x="10" y="38" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      Multiplier: <tspan fill={workerEmerald} fontWeight="bold">1.5x</tspan>
                    </text>
                    <text x="10" y="56" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      Interval: <tspan fill={strategyMode === 'naive_tight_polling' ? dangerRed : workerEmerald} fontWeight="bold">{clientPollingInterval}</tspan>
                    </text>
                    <text x="10" y="74" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      Max Cap: 2,000 ms
                    </text>
                    <text x="10" y="94" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      Total Polls: <tspan fill={strategyMode === 'naive_tight_polling' ? dangerRed : textPrimary} fontWeight="bold">{clientAttempts}</tspan>
                    </text>
                    <text x="10" y="118" fill={strategyMode === 'exponential_backoff' ? workerEmerald : dangerRed} fontSize="9" fontFamily="monospace">
                      {strategyMode === 'exponential_backoff' ? '✓ Adaptive Jitter Armed' : strategyMode === 'naive_tight_polling' ? '⚠ Tight Loop Stampede' : '✗ Blocking Timeout'}
                    </text>
                  </g>

                  {/* Final Status Badge */}
                  <g transform="translate(14, 305)">
                    <rect
                      x="0"
                      y="0"
                      width="162"
                      height="85"
                      rx="8"
                      fill={
                        strategyMode === 'exponential_backoff' && currentTime >= 9.0
                          ? isLight ? '#dcfce7' : '#052e16'
                          : strategyMode !== 'exponential_backoff' && currentTime >= 6.0
                          ? isLight ? '#fee2e2' : '#450a0a'
                          : isLight ? '#f0f9ff' : '#082f49'
                      }
                      stroke={
                        strategyMode === 'exponential_backoff' && currentTime >= 9.0
                          ? workerEmerald
                          : strategyMode !== 'exponential_backoff' && currentTime >= 6.0
                          ? dangerRed
                          : clientCyan
                      }
                    />
                    <text x="10" y="20" fill={textSecondary} fontSize="9" fontWeight="bold">
                      DOCUMENT DELIVERY
                    </text>
                    <text
                      x="10"
                      y="44"
                      fill={
                        strategyMode === 'exponential_backoff' && currentTime >= 9.0
                          ? workerEmerald
                          : strategyMode !== 'exponential_backoff' && currentTime >= 6.0
                          ? dangerRed
                          : clientCyan
                      }
                      fontSize="14"
                      fontWeight="800"
                      fontFamily="monospace"
                    >
                      {strategyMode === 'exponential_backoff' && currentTime >= 9.0
                        ? '✓ PDF READY'
                        : strategyMode === 'naive_tight_polling' && currentTime >= 6.0
                        ? 'GATEWAY COLLAPSE'
                        : strategyMode === 'synchronous_blocking_timeout' && currentTime >= 6.0
                        ? '504 TIMEOUT'
                        : 'AWAITING FINISH'}
                    </text>
                    <text x="10" y="66" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      {strategyMode === 'exponential_backoff' && currentTime >= 9.0
                        ? 'S3 Download Link Valid'
                        : 'Polling background status'}
                    </text>
                  </g>
                </g>

                {/* ==================== 2. API GATEWAY & REVERSE PROXY ==================== */}
                <g transform="translate(260, 50)" filter="url(#poll-shadow)">
                  <rect
                    width="180"
                    height="410"
                    rx="14"
                    fill={cardBg}
                    stroke={strategyMode === 'naive_tight_polling' && currentTime >= 6.0 ? dangerRed : cardBorder}
                    strokeWidth={strategyMode === 'naive_tight_polling' && currentTime >= 6.0 ? 2 : 1}
                  />
                  {/* Header */}
                  <rect
                    x="0"
                    y="0"
                    width="180"
                    height="38"
                    rx="14"
                    fill={
                      strategyMode === 'naive_tight_polling' && currentTime >= 6.0
                        ? '#be123c'
                        : isLight ? '#faf5ff' : '#2e1065'
                    }
                  />
                  <circle cx="18" cy="19" r="6" fill={gatewayPurple} />
                  <text x="32" y="24" fill={textPrimary} fontSize="12" fontWeight="700">
                    API Gateway / Proxy
                  </text>

                  {/* Body Content */}
                  <g transform="translate(14, 55)">
                    <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="bold">
                      INGRESS STATUS CODE
                    </text>
                    <rect
                      x="0"
                      y="22"
                      width="152"
                      height="50"
                      rx="6"
                      fill={
                        gatewayStatusCode.startsWith('202')
                          ? isLight ? '#ecfeff' : '#083344'
                          : gatewayStatusCode.startsWith('200')
                          ? isLight ? '#dcfce7' : '#052e16'
                          : isLight ? '#fee2e2' : '#450a0a'
                      }
                      stroke={
                        gatewayStatusCode.startsWith('202')
                          ? clientCyan
                          : gatewayStatusCode.startsWith('200')
                          ? workerEmerald
                          : dangerRed
                      }
                    />
                    <text
                      x="76"
                      y="52"
                      textAnchor="middle"
                      fill={
                        gatewayStatusCode.startsWith('202')
                          ? clientCyan
                          : gatewayStatusCode.startsWith('200')
                          ? workerEmerald
                          : dangerRed
                      }
                      fontSize="12"
                      fontWeight="800"
                      fontFamily="monospace"
                    >
                      {gatewayStatusCode.slice(0, 15)}
                    </text>
                  </g>

                  {/* Gateway Timeout Protection */}
                  <g transform="translate(14, 150)">
                    <rect x="0" y="0" width="152" height="110" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      TIMEOUT SAFEGUARD
                    </text>
                    <text x="10" y="38" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      Proxy Timeout: 60s
                    </text>
                    <text x="10" y="56" fill={strategyMode === 'synchronous_blocking_timeout' ? dangerRed : workerEmerald} fontSize="10" fontFamily="monospace">
                      Model: {strategyMode === 'synchronous_blocking_timeout' ? 'Sync Block (VULN)' : 'Async 202 Decoupled'}
                    </text>
                    <text x="10" y="74" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      QPS: <tspan fill={strategyMode === 'naive_tight_polling' && currentTime >= 6.0 ? dangerRed : textPrimary}>{gatewayQps.slice(0, 14)}</tspan>
                    </text>
                    <text x="10" y="96" fill={strategyMode === 'synchronous_blocking_timeout' && currentTime >= 6.0 ? dangerRed : workerEmerald} fontSize="9" fontFamily="monospace">
                      {strategyMode === 'synchronous_blocking_timeout' && currentTime >= 6.0 ? '⚠ 504 Timeout Triggered' : '✓ 60s Timeout Protected'}
                    </text>
                  </g>

                  {/* Location Header Display */}
                  <g transform="translate(14, 280)">
                    <rect x="0" y="0" width="152" height="110" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      RESPONSE HEADERS
                    </text>
                    <text x="10" y="38" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      HTTP/1.1 202 Accepted
                    </text>
                    <text x="10" y="56" fill={gatewayPurple} fontSize="9" fontFamily="monospace">
                      Location: /jobs/gst_99
                    </text>
                    <text x="10" y="74" fill={workerEmerald} fontSize="9" fontFamily="monospace">
                      Retry-After: 2
                    </text>
                    <text x="10" y="96" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      RFC 7231 §6.3.3 Standard
                    </text>
                  </g>
                </g>

                {/* ==================== 3. TASK QUEUE & STATUS STORE ==================== */}
                <g transform="translate(470, 50)" filter="url(#poll-shadow)">
                  <rect
                    width="170"
                    height="410"
                    rx="14"
                    fill={cardBg}
                    stroke={cardBorder}
                    strokeWidth="1"
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="170" height="38" rx="14" fill={isLight ? '#fffbeb' : '#451a03'} />
                  <circle cx="18" cy="19" r="6" fill={queueAmber} />
                  <text x="32" y="24" fill={textPrimary} fontSize="12" fontWeight="700">
                    Queue & Redis State
                  </text>

                  {/* Body Content */}
                  <g transform="translate(14, 55)">
                    <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="bold">
                      MESSAGE BROKER (SQS/Redis)
                    </text>
                    <rect x="0" y="22" width="142" height="60" rx="6" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="10" y="42" fill={textPrimary} fontSize="10" fontFamily="monospace">
                      Queue: `gst_export_queue`
                    </text>
                    <text x="10" y="60" fill={queueAmber} fontSize="10" fontFamily="monospace">
                      Depth: {currentTime < 1.0 ? '1 Pending' : '0 (Claimed)'}
                    </text>
                  </g>

                  {/* Status Hash State in Redis */}
                  <g transform="translate(14, 160)">
                    <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="bold">
                      REDIS STATUS HASH
                    </text>
                    <rect x="0" y="22" width="142" height="110" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    
                    <text x="10" y="42" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      Key: `job:gst_99`
                    </text>
                    <text x="10" y="60" fill={jobState === 'SUCCESS' ? workerEmerald : queueAmber} fontSize="11" fontWeight="bold" fontFamily="monospace">
                      Status: {jobState}
                    </text>
                    <text x="10" y="78" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      Progress: {workerProgress}%
                    </text>
                    <text x="10" y="98" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      TTL: 86400s (24h)
                    </text>
                    <text x="10" y="118" fill={workerEmerald} fontSize="8" fontFamily="monospace">
                      Sub-millisecond status lookups
                    </text>
                  </g>
                </g>

                {/* ==================== 4. BACKGROUND WORKER & S3 STORAGE ==================== */}
                <g transform="translate(670, 50)" filter="url(#poll-shadow)">
                  <rect
                    width="200"
                    height="410"
                    rx="14"
                    fill={cardBg}
                    stroke={cardBorder}
                    strokeWidth="1"
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="200" height="38" rx="14" fill={isLight ? '#f0fdf4' : '#052e16'} />
                  <circle cx="18" cy="19" r="6" fill={workerEmerald} />
                  <text x="32" y="24" fill={textPrimary} fontSize="12" fontWeight="700">
                    Background Worker Pool
                  </text>

                  {/* Body Content */}
                  <g transform="translate(14, 55)">
                    <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="bold">
                      HEAVY PDF RENDER ENGINE
                    </text>
                    <rect x="0" y="22" width="172" height="90" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    
                    <text x="10" y="42" fill={textPrimary} fontSize="10" fontFamily="monospace">
                      Worker #1 (Celery / BullMQ)
                    </text>
                    <text x="10" y="60" fill={workerEmerald} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      Rendering: {workerProgress}% Complete
                    </text>
                    
                    {/* Progress Bar */}
                    <rect x="10" y="70" width="152" height="10" rx="3" fill={isLight ? '#e2e8f0' : '#1e293b'} />
                    <rect
                      x="10"
                      y="70"
                      width={Math.min(152, (workerProgress / 100) * 152)}
                      height="10"
                      rx="3"
                      fill={workerProgress === 100 ? workerEmerald : queueAmber}
                    />
                  </g>

                  {/* S3 Storage Artifact */}
                  <g transform="translate(14, 190)">
                    <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="bold">
                      OBJECT STORAGE (AWS S3)
                    </text>
                    <rect x="0" y="22" width="172" height="110" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    
                    <text x="10" y="42" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      Bucket: `swiftcart-reports`
                    </text>
                    <text x="10" y="60" fill={workerProgress === 100 ? workerEmerald : textSecondary} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      File: gst_report_q3.pdf
                    </text>
                    <text x="10" y="78" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      Size: 42.8 MB (Compressed)
                    </text>
                    <text x="10" y="98" fill={workerProgress === 100 ? workerEmerald : textSecondary} fontSize="9" fontFamily="monospace">
                      {workerProgress === 100 ? '✓ Presigned URL Active' : 'Rendering pages...'}
                    </text>
                  </g>

                  {/* Summary Metric */}
                  <g transform="translate(14, 325)">
                    <rect
                      x="0"
                      y="0"
                      width="172"
                      height="65"
                      rx="8"
                      fill={isLight ? '#f8fafc' : '#0b0f19'}
                      stroke={cardBorder}
                    />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      WORKER DECOUPLING
                    </text>
                    <text x="10" y="38" fill={workerEmerald} fontSize="14" fontWeight="800" fontFamily="monospace">
                      100% UNBLOCKING
                    </text>
                    <text x="10" y="54" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      Zero HTTP socket tying
                    </text>
                  </g>
                </g>

                {/* Gateway Meltdown Alert Overlay */}
                {currentTime >= 6.0 && currentTime < 9.0 && strategyMode === 'naive_tight_polling' && (
                  <g transform="translate(350, 240)" filter="url(#poll-shadow)">
                    <rect x="-95" y="-24" width="190" height="48" rx="8" fill="#991b1b" stroke={dangerRed} strokeWidth="2" />
                    <text x="0" y="-4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                      THUNDERING HERD!
                    </text>
                    <text x="0" y="14" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace">
                      503 Service Unavailable
                    </text>
                  </g>
                )}

                {/* 504 Gateway Timeout Overlay */}
                {currentTime >= 6.0 && strategyMode === 'synchronous_blocking_timeout' && (
                  <g transform="translate(350, 240)" filter="url(#poll-shadow)">
                    <rect x="-95" y="-24" width="190" height="48" rx="8" fill="#991b1b" stroke={dangerRed} strokeWidth="2" />
                    <text x="0" y="-4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                      504 GATEWAY TIMEOUT!
                    </text>
                    <text x="0" y="14" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace">
                      60s Proxy Timer Exceeded
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
