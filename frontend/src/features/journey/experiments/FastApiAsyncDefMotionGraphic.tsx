import { useState, useEffect, useRef } from 'react'
import { Cpu, Zap, AlertOctagon } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function FastApiAsyncDefMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [strategyMode, setStrategyMode] = useState<'async_def_blocking' | 'sync_def_threadpool' | 'pure_async_await'>('async_def_blocking')

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
    }
    setIsPlaying(!isPlaying)
  }

  const handleReplay = () => {
    setCurrentTime(0)
    setIsPlaying(true)
  }

  const handleSeek = (time: number) => {
    setCurrentTime(time)
  }

  // Derived state across the 4 acts
  let subtitle = ''
  let metrics: { label: string; value: string; variant?: 'default' | 'success' | 'warning' | 'danger' }[] = []

  let eventLoopFrozen = false
  let healthcheckStatus: '200_OK' | 'PENDING' | 'TIMEOUT_504' = 'PENDING'
  let activeThreadsCount = 0
  let totalWallClockMs = 0
  let calculatedThroughput = 0

  if (strategyMode === 'async_def_blocking') {
    if (currentTime < 3.0) {
      eventLoopFrozen = false
      healthcheckStatus = 'PENDING'
      activeThreadsCount = 0
      totalWallClockMs = 0
      calculatedThroughput = 10.0
      subtitle = 'Act 1 (0.0s – 3.0s): 10 concurrent requests arrive at FastAPI. Route declared as `async def get_report(): time.sleep(0.1)`.'
      metrics = [
        { label: 'Route Type', value: 'async def (Direct Event Loop)', variant: 'warning' },
        { label: 'Workload', value: 'time.sleep(100ms) synchronous blocking call', variant: 'danger' },
        { label: 'Event Loop State', value: 'Running (Pre-dispatch)', variant: 'default' },
        { label: 'Worker Threads', value: '0 Threads (Bypassed)', variant: 'default' },
      ]
    } else if (currentTime < 6.0) {
      eventLoopFrozen = true
      healthcheckStatus = 'PENDING'
      activeThreadsCount = 0
      totalWallClockMs = 400
      calculatedThroughput = 10.0
      subtitle = 'Act 2 (3.0s – 6.0s): Request #1 begins executing synchronous `time.sleep()`. Without `await`, the single OS thread cannot switch tasks!'
      metrics = [
        { label: 'Executing Task', value: 'Req #1 blocking event loop thread', variant: 'danger' },
        { label: 'Event Loop State', value: 'FREEZING (Cooperation Violated)', variant: 'danger' },
        { label: 'Queue Backlog', value: 'Requests #2..#10 stalled in TCP buffer', variant: 'warning' },
        { label: 'ThreadPool Offload', value: 'None (async def runs on main thread)', variant: 'danger' },
      ]
    } else if (currentTime < 9.0) {
      eventLoopFrozen = true
      healthcheckStatus = 'TIMEOUT_504'
      activeThreadsCount = 0
      totalWallClockMs = 800
      calculatedThroughput = 10.0
      subtitle = 'Act 3 (6.0s – 9.0s): Total Freeze! Kubernetes liveness probe `GET /healthz` arrives. The event loop cannot answer! 504 TIMEOUT triggered!'
      metrics = [
        { label: 'Event Loop State', value: 'STARVED / FROZEN SOLID', variant: 'danger' },
        { label: 'K8s Health Probe', value: 'TIMEOUT (504 Gateway Timeout)', variant: 'danger' },
        { label: 'Pod Lifecycle', value: 'CrashLoopBackOff (Pod Evicted)', variant: 'danger' },
        { label: 'Total Serialization', value: '10 requests * 100ms = 1,000ms', variant: 'danger' },
      ]
    } else {
      eventLoopFrozen = true
      healthcheckStatus = 'TIMEOUT_504'
      activeThreadsCount = 0
      totalWallClockMs = 1000
      calculatedThroughput = 10.0
      subtitle = 'Act 4 (9.0s – 12.0s): Benchmark summary: Complete serialization under async def. Throughput capped at 10.0 req/s. The classic async pitfall!'
      metrics = [
        { label: 'Total Wall Time', value: '1,000 ms (Serialized)', variant: 'danger' },
        { label: 'Final Throughput', value: '10.0 req / sec', variant: 'danger' },
        { label: 'Event Loop Starved', value: 'True (High Severity Bug)', variant: 'danger' },
        { label: 'Remedy', value: 'Change to standard def or await non-blocking', variant: 'success' },
      ]
    }
  } else if (strategyMode === 'sync_def_threadpool') {
    if (currentTime < 3.0) {
      eventLoopFrozen = false
      healthcheckStatus = 'PENDING'
      activeThreadsCount = 0
      totalWallClockMs = 0
      calculatedThroughput = 33.33
      subtitle = 'Act 1 (0.0s – 3.0s): 10 concurrent requests arrive. Route declared as standard `def get_report(): time.sleep(0.1)`. FastAPI recognizes standard `def`.'
      metrics = [
        { label: 'Route Type', value: 'def (Standard Sync Route)', variant: 'success' },
        { label: 'FastAPI Dispatcher', value: 'anyio.to_thread.run_sync', variant: 'success' },
        { label: 'Threadpool Size', value: '4 Worker Threads (Configurable)', variant: 'default' },
        { label: 'Event Loop State', value: 'Free & Unblocked', variant: 'success' },
      ]
    } else if (currentTime < 6.0) {
      eventLoopFrozen = false
      healthcheckStatus = '200_OK'
      activeThreadsCount = 4
      totalWallClockMs = 100
      calculatedThroughput = 33.33
      subtitle = 'Act 2 (3.0s – 6.0s): FastAPI offloads Batch 1 (Requests #1..#4) to 4 worker threads. The main event loop remains 100% free!'
      metrics = [
        { label: 'Active Threads', value: '4 / 4 Worker Threads Busy', variant: 'default' },
        { label: 'Batch 1 Progress', value: 'Reqs #1, #2, #3, #4 in parallel', variant: 'success' },
        { label: 'Event Loop State', value: 'FREE (Ready for incoming traffic)', variant: 'success' },
        { label: 'Threadpool Queue', value: '6 requests waiting for next batch', variant: 'default' },
      ]
    } else if (currentTime < 9.0) {
      eventLoopFrozen = false
      healthcheckStatus = '200_OK'
      activeThreadsCount = 4
      totalWallClockMs = 200
      calculatedThroughput = 33.33
      subtitle = 'Act 3 (6.0s – 9.0s): Batch 2 executes concurrently. K8s probe `GET /healthz` hits the event loop and returns 200 OK in 0.4 milliseconds!'
      metrics = [
        { label: 'Active Threads', value: '4 / 4 (Batch 2 in flight)', variant: 'default' },
        { label: 'K8s Health Probe', value: '200 OK (0.4ms Latency)', variant: 'success' },
        { label: 'Pod Lifecycle', value: 'HEALTHY (Pod Stays Live)', variant: 'success' },
        { label: 'Event Loop Starved', value: 'False (Zero Degradation)', variant: 'success' },
      ]
    } else {
      eventLoopFrozen = false
      healthcheckStatus = '200_OK'
      activeThreadsCount = 2
      totalWallClockMs = 300
      calculatedThroughput = 33.33
      subtitle = 'Act 4 (9.0s – 12.0s): Summary: Standard `def` finished 10 requests in 3 batches (300ms) = 33.33 req/s (3.3x faster than blocking async def)!'
      metrics = [
        { label: 'Total Wall Time', value: '300 ms (ceil(10/4) = 3 batches)', variant: 'success' },
        { label: 'Final Throughput', value: '33.33 req / sec', variant: 'success' },
        { label: 'Event Loop Starved', value: 'False (Safe for Sync SDKs)', variant: 'success' },
        { label: 'Speedup', value: '3.3x Faster than blocking async def', variant: 'success' },
      ]
    }
  } else {
    // Pure Async with await
    if (currentTime < 3.0) {
      eventLoopFrozen = false
      healthcheckStatus = 'PENDING'
      activeThreadsCount = 0
      totalWallClockMs = 0
      calculatedThroughput = 95.24
      subtitle = 'Act 1 (0.0s – 3.0s): Pure Async: `async def get_report(): await asyncio.sleep(0.1)` (or `await httpx.get()`). Genuine non-blocking I/O.'
      metrics = [
        { label: 'Route Type', value: 'async def with await (Native Async)', variant: 'success' },
        { label: 'I/O Driver', value: 'Non-blocking Socket (epoll/kqueue)', variant: 'success' },
        { label: 'Cooperative Yield', value: 'await yields control on I/O wait', variant: 'success' },
        { label: 'Event Loop State', value: 'Active Multiplexing', variant: 'success' },
      ]
    } else if (currentTime < 6.0) {
      eventLoopFrozen = false
      healthcheckStatus = '200_OK'
      activeThreadsCount = 0
      totalWallClockMs = 50
      calculatedThroughput = 95.24
      subtitle = 'Act 2 (3.0s – 6.0s): All 10 requests register epoll event handlers and cooperatively yield control. All 10 run concurrently on 1 thread!'
      metrics = [
        { label: 'In-Flight Sockets', value: '10 Concurrent Coroutines', variant: 'success' },
        { label: 'Context Switch', value: 'Microsecond Coroutine Yielding', variant: 'success' },
        { label: 'OS Thread Count', value: '1 Single OS Thread', variant: 'success' },
        { label: 'Memory Cost', value: '~1 KiB per Coroutine (Ultra Low)', variant: 'success' },
      ]
    } else if (currentTime < 9.0) {
      eventLoopFrozen = false
      healthcheckStatus = '200_OK'
      activeThreadsCount = 0
      totalWallClockMs = 105
      calculatedThroughput = 95.24
      subtitle = 'Act 3 (6.0s – 9.0s): Sockets signal completion. Event loop resumes all 10 coroutines without thread switching overhead!'
      metrics = [
        { label: 'Completed Tasks', value: '10 / 10 Coroutines Resolved', variant: 'success' },
        { label: 'K8s Health Probe', value: '200 OK (< 0.2ms Latency)', variant: 'success' },
        { label: 'Event Loop Starved', value: 'False (Peak Responsiveness)', variant: 'success' },
        { label: 'CPU Overhead', value: 'Near Zero Kernel Context Switches', variant: 'success' },
      ]
    } else {
      eventLoopFrozen = false
      healthcheckStatus = '200_OK'
      activeThreadsCount = 0
      totalWallClockMs = 105
      calculatedThroughput = 95.24
      subtitle = 'Act 4 (9.0s – 12.0s): Summary: Pure async finishes all 10 requests in 105ms = 95.24 req/s! (9.5x faster than blocking async def)!'
      metrics = [
        { label: 'Total Wall Time', value: '105 ms (Fully Concurrent)', variant: 'success' },
        { label: 'Final Throughput', value: '95.24 req / sec', variant: 'success' },
        { label: 'Concurrency Mode', value: 'Single-Threaded Epoll Multiplexing', variant: 'success' },
        { label: 'Peak Performance', value: '9.5x Speedup over blocking async', variant: 'success' },
      ]
    }
  }

  // Animation phase timers
  const rotAngle = (currentTime * 120) % 360

  return (
    <div className="w-full space-y-4">
      {/* Strategy Selector Deck */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-panel-2 p-3 rounded-xl border border-line">
        <div className="flex items-center gap-2">
          <Cpu size={16} className="text-brand-light" />
          <span className="text-xs font-semibold text-chalk uppercase tracking-wider">
            FastAPI Execution Paradigm:
          </span>
        </div>
        <div className="inline-flex rounded-lg border border-line bg-panel p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setStrategyMode('async_def_blocking')
              setCurrentTime(0)
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
              strategyMode === 'async_def_blocking'
                ? 'bg-panel-3 text-red-400 font-bold shadow-xs'
                : 'text-muted hover:text-chalk'
            }`}
          >
            <AlertOctagon size={13} />
            <span>async def + Blocking Call (The Outage)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setStrategyMode('sync_def_threadpool')
              setCurrentTime(0)
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
              strategyMode === 'sync_def_threadpool'
                ? 'bg-panel-3 text-brand-light font-bold shadow-xs'
                : 'text-muted hover:text-chalk'
            }`}
          >
            <Cpu size={13} />
            <span>Standard def (ThreadPool Offload)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setStrategyMode('pure_async_await')
              setCurrentTime(0)
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
              strategyMode === 'pure_async_await'
                ? 'bg-panel-3 text-emerald-400 font-bold shadow-xs'
                : 'text-muted hover:text-chalk'
            }`}
          >
            <Zap size={13} />
            <span>Pure async def with await</span>
          </button>
        </div>
      </div>

      {/* Main Motion Graphic Player */}
      <MotionGraphicPlayer
        title="FastAPI Architecture: Event Loop Starvation vs. ThreadPool Offloading"
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
      >
        {(theme) => {
          const isLight = theme === 'light'
          // Studio Theme Colors
          const bgCanvas = isLight ? '#f8fafc' : '#030712'
          const cardBg = isLight ? '#ffffff' : '#0f172a'
          const cardBorder = isLight ? '#e2e8f0' : '#1e293b'
          const textPrimary = isLight ? '#0f172a' : '#f8fafc'
          const textSecondary = isLight ? '#64748b' : '#94a3b8'

          const loopCyan = '#06b6d4'
          const loopGlow = 'rgba(6, 182, 212, 0.4)'
          const threadEmerald = '#10b981'
          const threadGlow = 'rgba(16, 185, 129, 0.4)'
          const freezeRed = '#ef4444'
          const freezeIce = '#38bdf8'
          const amberWarning = '#f59e0b'

          return (
            <svg
              viewBox="0 0 1000 500"
              className="w-full h-auto select-none"
              style={{ backgroundColor: bgCanvas }}
            >
              <defs>
                <filter id="fastapi-shadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity={isLight ? '0.06' : '0.4'} />
                </filter>
                <filter id="glow-loop" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={loopGlow} />
                </filter>
                <filter id="glow-freeze" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="rgba(239, 68, 68, 0.6)" />
                </filter>
                <filter id="glow-thread" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={threadGlow} />
                </filter>
                <marker
                  id="fastapi-arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill={loopCyan} />
                </marker>
                <marker
                  id="arrow-green"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill={threadEmerald} />
                </marker>
              </defs>

              {/* Background Grid Pattern */}
              <pattern id="fastapi-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill={isLight ? '#cbd5e1' : '#1e293b'} opacity="0.4" />
              </pattern>
              <rect width="1000" height="500" fill="url(#fastapi-grid)" />

              {/* ========================================================= */}
              {/* TOP HEADER: INGRESS TRAFFIC & ROUTE SIGNATURE             */}
              {/* ========================================================= */}
              <g transform="translate(20, 15)">
                <rect
                  x="0"
                  y="0"
                  width="960"
                  height="45"
                  rx="8"
                  fill={cardBg}
                  stroke={cardBorder}
                  strokeWidth="1.2"
                />
                <circle cx="20" cy="22" r="5" fill={strategyMode === 'async_def_blocking' ? freezeRed : threadEmerald} />
                <text x="34" y="26" fill={textPrimary} fontSize="11" fontWeight="bold">
                  {strategyMode === 'async_def_blocking'
                    ? '@app.get("/report")  ->  async def get_report(): time.sleep(0.1)  # ⚠️ SYNC CALL IN ASYNC ROUTE'
                    : strategyMode === 'sync_def_threadpool'
                    ? '@app.get("/report")  ->  def get_report(): time.sleep(0.1)  # ✓ AUTO-THREADPOOL OFFLOAD'
                    : '@app.get("/report")  ->  async def get_report(): await httpx_client.get()  # ★ PURE ASYNC'}
                </text>
                <g transform="translate(640, 12)">
                  <rect x="0" y="0" width="305" height="22" rx="4" fill={isLight ? '#f1f5f9' : '#0b0f19'} />
                  <text x="10" y="15" fill={textSecondary} fontSize="9" fontFamily="monospace">
                    Ingress: 10 Concurrent HTTP Requests + /healthz
                  </text>
                </g>
              </g>

              {/* ========================================================= */}
              {/* LEFT HALF: ASYNCIO EVENT LOOP (SINGLE OS THREAD)          */}
              {/* ========================================================= */}
              <g transform="translate(20, 70)">
                <rect
                  x="0"
                  y="0"
                  width="470"
                  height="340"
                  rx="12"
                  fill={cardBg}
                  stroke={eventLoopFrozen ? freezeRed : cardBorder}
                  strokeWidth={eventLoopFrozen ? 2 : 1.5}
                  filter="url(#fastapi-shadow)"
                />

                {/* Panel Header */}
                <rect
                  x="0"
                  y="0"
                  width="470"
                  height="36"
                  rx="12"
                  fill={
                    eventLoopFrozen
                      ? isLight ? '#fee2e2' : '#450a0a'
                      : isLight ? '#f0fdfa' : '#042f2e'
                  }
                />
                <path
                  d="M 0 12 Q 0 0 12 0 L 458 0 Q 470 0 470 12 L 470 36 L 0 36 Z"
                  fill={
                    eventLoopFrozen
                      ? isLight ? '#fee2e2' : '#450a0a'
                      : isLight ? '#f0fdfa' : '#042f2e'
                  }
                />
                <circle cx="20" cy="18" r="6" fill={eventLoopFrozen ? freezeRed : loopCyan} />
                <text x="34" y="22" fill={textPrimary} fontSize="11" fontWeight="700">
                  MAIN THREAD: PYTHON ASYNCIO EVENT LOOP
                </text>
                <text
                  x="330"
                  y="22"
                  fill={eventLoopFrozen ? freezeRed : loopCyan}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {eventLoopFrozen ? 'THREAD LOCKED' : 'SINGLE OS THREAD'}
                </text>

                {/* Central Event Loop Rotating Ring */}
                <g transform="translate(235, 150)">
                  {/* Outer Orbit Path */}
                  <circle
                    cx="0"
                    cy="0"
                    r="75"
                    fill="none"
                    stroke={eventLoopFrozen ? freezeRed : loopCyan}
                    strokeWidth="3"
                    strokeDasharray={eventLoopFrozen ? 'none' : '8 6'}
                    filter={eventLoopFrozen ? 'url(#glow-freeze)' : 'url(#glow-loop)'}
                  />

                  {/* Rotating Stage Markers */}
                  <g transform={eventLoopFrozen ? 'rotate(45)' : `rotate(${rotAngle})`}>
                    {/* 4 Phases of Asyncio Event Loop */}
                    <g transform="translate(0, -75)">
                      <circle cx="0" cy="0" r="12" fill={eventLoopFrozen ? freezeRed : loopCyan} />
                      <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                        POLL
                      </text>
                    </g>
                    <g transform="translate(75, 0)">
                      <circle cx="0" cy="0" r="12" fill={eventLoopFrozen ? freezeRed : loopCyan} />
                      <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">
                        CALLS
                      </text>
                    </g>
                    <g transform="translate(0, 75)">
                      <circle cx="0" cy="0" r="12" fill={eventLoopFrozen ? freezeRed : loopCyan} />
                      <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">
                        TIMER
                      </text>
                    </g>
                    <g transform="translate(-75, 0)">
                      <circle cx="0" cy="0" r="12" fill={eventLoopFrozen ? freezeRed : loopCyan} />
                      <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">
                        CHECK
                      </text>
                    </g>
                  </g>

                  {/* Center Node / State Label */}
                  <circle
                    cx="0"
                    cy="0"
                    r="45"
                    fill={isLight ? '#ffffff' : '#0b0f19'}
                    stroke={eventLoopFrozen ? freezeRed : cardBorder}
                    strokeWidth="2"
                  />
                  <text
                    x="0"
                    y="-8"
                    textAnchor="middle"
                    fill={eventLoopFrozen ? freezeRed : textPrimary}
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {eventLoopFrozen ? 'FROZEN' : 'ACTIVE'}
                  </text>
                  <text
                    x="0"
                    y="10"
                    textAnchor="middle"
                    fill={eventLoopFrozen ? freezeRed : loopCyan}
                    fontSize="8.5"
                    fontFamily="monospace"
                  >
                    {eventLoopFrozen ? 'NO YIELD' : 'COOPERATIVE'}
                  </text>
                  <text
                    x="0"
                    y="24"
                    textAnchor="middle"
                    fill={textSecondary}
                    fontSize="7"
                    fontFamily="monospace"
                  >
                    OS TID: 8192
                  </text>
                </g>

                {/* Freezing Ice Crystal Visual When Loop is Starved */}
                {eventLoopFrozen && (
                  <g transform="translate(135, 100)">
                    <rect
                      x="0"
                      y="0"
                      width="200"
                      height="100"
                      rx="8"
                      fill="none"
                      stroke={freezeIce}
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      opacity="0.8"
                    />
                    <text x="100" y="-8" textAnchor="middle" fill={freezeRed} fontSize="11" fontWeight="bold">
                      ❄️ EVENT LOOP STARVATION LOCK
                    </text>
                  </g>
                )}

                {/* Health Check Probe Box (The Smoke Test!) */}
                <g transform="translate(20, 250)">
                  <rect
                    x="0"
                    y="0"
                    width="430"
                    height="75"
                    rx="8"
                    fill={
                      healthcheckStatus === 'TIMEOUT_504'
                        ? isLight ? '#fef2f2' : '#450a0a'
                        : healthcheckStatus === '200_OK'
                        ? isLight ? '#f0fdf4' : '#052e16'
                        : isLight ? '#f8fafc' : '#0b0f19'
                    }
                    stroke={
                      healthcheckStatus === 'TIMEOUT_504'
                        ? freezeRed
                        : healthcheckStatus === '200_OK'
                        ? threadEmerald
                        : cardBorder
                    }
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="8"
                    fill={
                      healthcheckStatus === 'TIMEOUT_504'
                        ? freezeRed
                        : healthcheckStatus === '200_OK'
                        ? threadEmerald
                        : amberWarning
                    }
                  />
                  <text x="20" y="24" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                    {healthcheckStatus === 'TIMEOUT_504' ? '!' : '♥'}
                  </text>
                  <text
                    x="36"
                    y="22"
                    fill={
                      healthcheckStatus === 'TIMEOUT_504'
                        ? freezeRed
                        : healthcheckStatus === '200_OK'
                        ? threadEmerald
                        : textPrimary
                    }
                    fontSize="10"
                    fontWeight="bold"
                  >
                    KUBERNETES PROBE: GET /healthz
                  </text>
                  <text x="14" y="42" fill={textPrimary} fontSize="9" fontFamily="monospace">
                    {healthcheckStatus === 'TIMEOUT_504'
                      ? 'Status: 504 GATEWAY TIMEOUT (Event loop cannot schedule socket)'
                      : healthcheckStatus === '200_OK'
                      ? 'Status: 200 OK (Healthy - Answered in 0.4 milliseconds)'
                      : 'Status: PENDING (Waiting for response)'}
                  </text>
                  <text
                    x="14"
                    y="58"
                    fill={healthcheckStatus === 'TIMEOUT_504' ? freezeRed : threadEmerald}
                    fontSize="8.5"
                    fontFamily="monospace"
                  >
                    {healthcheckStatus === 'TIMEOUT_504'
                      ? '→ RESULT: K8s liveness probe times out. Pod evicted & restarted!'
                      : '→ RESULT: Event loop responds instantly. Service stays 100% online.'}
                  </text>
                </g>
              </g>

              {/* ========================================================= */}
              {/* RIGHT HALF: ANYIO WORKER THREADPOOL (anyio.to_thread)     */}
              {/* ========================================================= */}
              <g transform="translate(510, 70)">
                <rect
                  x="0"
                  y="0"
                  width="470"
                  height="340"
                  rx="12"
                  fill={cardBg}
                  stroke={strategyMode === 'sync_def_threadpool' ? threadEmerald : cardBorder}
                  strokeWidth={strategyMode === 'sync_def_threadpool' ? 2 : 1.5}
                  filter="url(#fastapi-shadow)"
                />

                {/* Panel Header */}
                <rect
                  x="0"
                  y="0"
                  width="470"
                  height="36"
                  rx="12"
                  fill={isLight ? '#f0fdf4' : '#022c22'}
                />
                <path
                  d="M 0 12 Q 0 0 12 0 L 458 0 Q 470 0 470 12 L 470 36 L 0 36 Z"
                  fill={isLight ? '#f0fdf4' : '#022c22'}
                />
                <circle cx="20" cy="18" r="6" fill={threadEmerald} />
                <text x="34" y="22" fill={textPrimary} fontSize="11" fontWeight="700">
                  ANYIO WORKER THREADPOOL (Starlette Concurrency)
                </text>
                <text x="320" y="22" fill={threadEmerald} fontSize="10" fontFamily="monospace" fontWeight="bold">
                  {strategyMode === 'sync_def_threadpool' ? '4 THREADS ACTIVE' : 'THREADPOOL IDLE'}
                </text>

                {/* Offload Dispatch Note */}
                <g transform="translate(20, 48)">
                  <rect x="0" y="0" width="430" height="26" rx="5" fill={isLight ? '#f8fafc' : '#0b0f19'} />
                  <text x="10" y="17" fill={textSecondary} fontSize="8.5" fontFamily="monospace">
                    FastAPI Bridge: `anyio.to_thread.run_sync(handler)` (Default limit: 40 threads)
                  </text>
                </g>

                {/* 4 Thread Lanes */}
                <g transform="translate(20, 85)">
                  {[1, 2, 3, 4].map((tIdx) => {
                    const isThreadActive = strategyMode === 'sync_def_threadpool' && currentTime >= 3.0
                    return (
                      <g key={tIdx} transform={`translate(0, ${(tIdx - 1) * 38})`}>
                        <rect
                          x="0"
                          y="0"
                          width="430"
                          height="32"
                          rx="6"
                          fill={isThreadActive ? (isLight ? '#ecfdf5' : '#064e3b') : isLight ? '#f8fafc' : '#0b0f19'}
                          stroke={isThreadActive ? threadEmerald : cardBorder}
                          strokeWidth="1.2"
                        />
                        <circle cx="16" cy="16" r="4" fill={isThreadActive ? threadEmerald : textSecondary} />
                        <text
                          x="28"
                          y="19"
                          fill={isThreadActive ? textPrimary : textSecondary}
                          fontSize="9.5"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          Worker Thread #{tIdx}
                        </text>
                        {isThreadActive ? (
                          <g transform="translate(180, 8)">
                            <rect x="0" y="0" width="160" height="16" rx="3" fill="#10b981" opacity="0.3" />
                            <rect
                              x="0"
                              y="0"
                              width={Math.min(160, ((currentTime * 50 + tIdx * 25) % 160))}
                              height="16"
                              rx="3"
                              fill="#10b981"
                            />
                            <text x="5" y="12" fill="#ffffff" fontSize="8" fontFamily="monospace" fontWeight="bold">
                              time.sleep(100ms) Busy
                            </text>
                          </g>
                        ) : (
                          <text x="200" y="19" fill={textSecondary} fontSize="8.5" fontFamily="monospace">
                            [ Idle / Awaiting Sync Task ]
                          </text>
                        )}
                        <text
                          x="375"
                          y="19"
                          fill={isThreadActive ? threadEmerald : textSecondary}
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {isThreadActive ? 'RUNNING' : 'STANDBY'}
                        </text>
                      </g>
                    )
                  })}
                </g>

                {/* Queue Overflow / Backlog indicator */}
                <g transform="translate(20, 250)">
                  <rect
                    x="0"
                    y="0"
                    width="430"
                    height="75"
                    rx="8"
                    fill={isLight ? '#f8fafc' : '#0b0f19'}
                    stroke={cardBorder}
                  />
                  <text x="12" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                    THREAD CAPACITY &amp; BATCHING LOGIC
                  </text>
                  <text x="12" y="36" fill={textPrimary} fontSize="9" fontFamily="monospace">
                    Formula: Batches = ceil(Requests / Workers) = ceil(10 / 4) = 3 Batches
                  </text>
                  <text x="12" y="52" fill={threadEmerald} fontSize="9" fontFamily="monospace" fontWeight="bold">
                    Wall Time: 3 batches * 100ms = 300ms (vs 1,000ms blocking async)
                  </text>
                  <text x="12" y="66" fill={textSecondary} fontSize="8">
                    Active Threads: {activeThreadsCount} | Event Loop Remains Responsive: 100%
                  </text>
                </g>
              </g>

              {/* ========================================================= */}
              {/* BOTTOM TELEMETRY CARD: THROUGHPUT & BENCHMARK             */}
              {/* ========================================================= */}
              <g transform="translate(20, 425)">
                <rect
                  x="0"
                  y="0"
                  width="960"
                  height="60"
                  rx="8"
                  fill={cardBg}
                  stroke={cardBorder}
                  strokeWidth="1.2"
                />
                <g transform="translate(20, 18)">
                  <text x="0" y="0" fill={textSecondary} fontSize="8.5" fontWeight="bold">
                    TOTAL WALL CLOCK TIME
                  </text>
                  <text x="0" y="18" fill={textPrimary} fontSize="14" fontWeight="800" fontFamily="monospace">
                    {totalWallClockMs} ms
                  </text>
                </g>
                <g transform="translate(200, 18)">
                  <text x="0" y="0" fill={textSecondary} fontSize="8.5" fontWeight="bold">
                    MEASURED THROUGHPUT
                  </text>
                  <text
                    x="0"
                    y="18"
                    fill={
                      strategyMode === 'async_def_blocking'
                        ? freezeRed
                        : strategyMode === 'sync_def_threadpool'
                        ? threadEmerald
                        : loopCyan
                    }
                    fontSize="14"
                    fontWeight="800"
                    fontFamily="monospace"
                  >
                    {calculatedThroughput} req / sec
                  </text>
                </g>
                <g transform="translate(400, 18)">
                  <text x="0" y="0" fill={textSecondary} fontSize="8.5" fontWeight="bold">
                    EVENT LOOP STARVED BOOLEAN
                  </text>
                  <text
                    x="0"
                    y="18"
                    fill={eventLoopFrozen ? freezeRed : threadEmerald}
                    fontSize="13"
                    fontWeight="800"
                    fontFamily="monospace"
                  >
                    {eventLoopFrozen ? 'TRUE (Loop Frozen!)' : 'FALSE (Loop Healthy)'}
                  </text>
                </g>
                <g transform="translate(640, 18)">
                  <text x="0" y="0" fill={textSecondary} fontSize="8.5" fontWeight="bold">
                    KUBERNETES CONTAINER STATUS
                  </text>
                  <text
                    x="0"
                    y="18"
                    fill={eventLoopFrozen ? freezeRed : threadEmerald}
                    fontSize="13"
                    fontWeight="800"
                    fontFamily="monospace"
                  >
                    {eventLoopFrozen ? '🚨 CRASH_LOOP_BACKOFF' : '✅ HEALTHY_RUNNING'}
                  </text>
                </g>
              </g>
            </svg>
          )
        }}
      </MotionGraphicPlayer>
    </div>
  )
}
