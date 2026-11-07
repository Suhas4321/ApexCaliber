import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Flame, Zap } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function RedisCacheMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [strategyMode, setStrategyMode] = useState<'mutex_lock' | 'stampede_disaster' | 'xfetch_probabilistic'>('mutex_lock')

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

  let cacheStatus: 'HIT' | 'EXPIRED' | 'POPULATING' | 'RESTORED' = 'HIT'
  let lockStatus: 'FREE' | 'HELD_BY_W1' | 'RELEASED' = 'FREE'
  let dbConnections = 0
  let dbCpuLoad = '2%'
  let p99Latency = '0.4 ms'
  let ttlSeconds = 5.0

  if (currentTime < 3.0) {
    // Act 1: Warm Cache Hit Phase
    cacheStatus = 'HIT'
    lockStatus = 'FREE'
    dbConnections = 1
    dbCpuLoad = '3%'
    p99Latency = '0.4 ms'
    ttlSeconds = Math.max(0.1, 5.0 - (currentTime / 3.0) * 4.9)
    subtitle = 'Act 1 (0.0s – 3.0s): Steady State. 15,000 QPS served directly from Redis RAM (0.4ms latency). Database connection pool sits safely idle.'
    metrics = [
      { label: 'Client Traffic', value: '15,000 req / sec', variant: 'default' },
      { label: 'Redis Cache', value: '100% HIT (`deal:ps5`)', variant: 'success' },
      { label: 'DB Pool Usage', value: '1 / 100 connections (1%)', variant: 'success' },
      { label: 'P99 Latency', value: '0.4 ms (In-Memory RAM)', variant: 'success' },
    ]
  } else if (currentTime < 6.0) {
    // Act 2: Key Expiration & Concurrent Cache Miss
    cacheStatus = 'EXPIRED'
    ttlSeconds = 0.0

    if (strategyMode === 'xfetch_probabilistic') {
      cacheStatus = 'POPULATING'
      subtitle = 'Act 2 (3.0s – 6.0s): XFetch Probabilistic Trigger. As key approaches TTL, background worker asynchronously pre-warms key before hard expiration!'
      metrics = [
        { label: 'Key Expiration', value: 'TTL: 0.5s remaining', variant: 'warning' },
        { label: 'XFetch Probability', value: 'THRESHOLD EXCEEDED (Early refresh)', variant: 'success' },
        { label: 'Client Experience', value: 'Zero cache misses, 100% uptime', variant: 'success' },
        { label: 'Worker Action', value: 'Background query dispatched', variant: 'default' },
      ]
    } else {
      p99Latency = '12 ms'
      subtitle = 'Act 2 (3.0s – 6.0s): Hard Key Expiration! `deal:ps5` evicted from Redis. 500 concurrent requests hit simultaneous cache miss at t = 3.0s.'
      metrics = [
        { label: 'Key State', value: 'TTL EXPIRED (Evicted)', variant: 'warning' },
        { label: 'Concurrent Misses', value: '500 requests at same millisecond', variant: 'danger' },
        { label: 'Redis Response', value: 'NULL (Key Missing)', variant: 'warning' },
        { label: 'Stampede Threat', value: 'Potential Thundering Herd', variant: 'danger' },
      ]
    }
  } else if (currentTime < 9.0) {
    // Act 3: Divergence - Mutex vs Stampede Meltdown vs XFetch
    if (strategyMode === 'stampede_disaster') {
      cacheStatus = 'EXPIRED'
      dbConnections = 100
      dbCpuLoad = '100% (CRITICAL)'
      p99Latency = '28,450 ms'
      subtitle = 'Act 3 (6.0s – 9.0s): THUNDERING HERD DISASTER! All 500 requests hammer PostgreSQL simultaneously. Connection pool exhausted, 504 timeouts rain down!'
      metrics = [
        { label: 'DB Connections', value: '100 / 100 (SATURATED)', variant: 'danger' },
        { label: 'DB CPU Usage', value: '100% (Kernel Lock Stalls)', variant: 'danger' },
        { label: 'Query Latency', value: '28.4 SECONDS (Timeout)', variant: 'danger' },
        { label: 'HTTP Status', value: '504 GATEWAY TIMEOUT (Cascade)', variant: 'danger' },
      ]
    } else if (strategyMode === 'xfetch_probabilistic') {
      cacheStatus = 'RESTORED'
      dbConnections = 1
      dbCpuLoad = '4%'
      p99Latency = '0.5 ms'
      ttlSeconds = 60.0
      subtitle = 'Act 3 (6.0s – 9.0s): Seamless Refresh! Background worker wrote fresh key without a single user ever experiencing a cache miss or lock wait.'
      metrics = [
        { label: 'Cache Transition', value: 'Seamless Background Swap', variant: 'success' },
        { label: 'DB Query Count', value: '1 Query (Zero Contention)', variant: 'success' },
        { label: 'Lock Overhead', value: '0 Locks Needed (Lock-Free)', variant: 'success' },
        { label: 'Latency SLA', value: '< 1.0 ms guaranteed', variant: 'success' },
      ]
    } else {
      // Mutex lock mode (SETNX)
      cacheStatus = 'POPULATING'
      lockStatus = 'HELD_BY_W1'
      dbConnections = 1
      dbCpuLoad = '5%'
      p99Latency = '24 ms'
      subtitle = 'Act 3 (6.0s – 9.0s): Redis Mutex Shield! Worker 1 wins `SETNX lock:deal:ps5 EX 5`. Workers 2..500 enter wait queue. Exactly 1 query hits DB!'
      metrics = [
        { label: 'Distributed Mutex', value: 'SETNX lock:deal:ps5 -> OK (W1)', variant: 'success' },
        { label: 'Waiting Callers', value: '499 threads sleeping (50ms retry)', variant: 'warning' },
        { label: 'DB Queries Executed', value: '1 Query (PostgreSQL protected)', variant: 'success' },
        { label: 'DB Health', value: '1% Connection Pool (Stable)', variant: 'success' },
      ]
    }
  } else {
    // Act 4: Resolution & Final State
    if (strategyMode === 'stampede_disaster') {
      cacheStatus = 'EXPIRED'
      dbConnections = 100
      dbCpuLoad = '98%'
      p99Latency = '30,000 ms'
      subtitle = 'Act 4 (9.0s – 12.0s): Total service outage. Without distributed mutex locking or XFetch, hot key expirations reliably bring down production databases.'
      metrics = [
        { label: 'System Health', value: 'OUTAGE (Cascading Failure)', variant: 'danger' },
        { label: 'PostgreSQL State', value: 'Crash recovery / Deadlock aborts', variant: 'danger' },
        { label: 'Mitigation', value: 'Implement Redis SETNX Mutex Lock', variant: 'warning' },
        { label: 'Revenue Loss', value: '$45,000 / minute flash deal outage', variant: 'danger' },
      ]
    } else if (strategyMode === 'xfetch_probabilistic') {
      cacheStatus = 'RESTORED'
      dbConnections = 1
      dbCpuLoad = '3%'
      p99Latency = '0.4 ms'
      ttlSeconds = 58.0
      subtitle = 'Act 4 (9.0s – 12.0s): Optimal performance. Probabilistic early expiration maintains 99.999% cache hit rate with zero lock contention.'
      metrics = [
        { label: 'Final Cache State', value: 'Warm (TTL: 60s)', variant: 'success' },
        { label: 'Throughput', value: '15,000 QPS sustained', variant: 'success' },
        { label: 'Architecture', value: 'XFetch Probabilistic Model', variant: 'success' },
        { label: 'Availability', value: '100.00% High Availability', variant: 'success' },
      ]
    } else {
      // Mutex lock mode: cache restored & lock released!
      cacheStatus = 'RESTORED'
      lockStatus = 'RELEASED'
      dbConnections = 1
      dbCpuLoad = '3%'
      p99Latency = '0.4 ms'
      ttlSeconds = 60.0
      subtitle = 'Act 4 (9.0s – 12.0s): Cache Repopulated! Worker 1 stored fresh key with TTL 60s and deleted lock. Waiting requests wake up and hit RAM cache.'
      metrics = [
        { label: 'Cache Repopulated', value: 'SET deal:ps5 <data> EX 60', variant: 'success' },
        { label: 'Lock Released', value: 'DEL lock:deal:ps5 (Completed)', variant: 'success' },
        { label: 'Woken Callers', value: '499 requests hit RAM (<1ms)', variant: 'success' },
        { label: 'Database Saved', value: '99.8% query load eliminated', variant: 'success' },
      ]
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      <MotionGraphicPlayer
        title="Distributed Caching & Cache Stampede (Thundering Herd) Defense"
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
              onClick={() => { setStrategyMode('mutex_lock'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'mutex_lock'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>Redis Mutex (SETNX Lock)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('stampede_disaster'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'stampede_disaster'
                  ? 'bg-rose-950/50 text-rose-300 font-bold border border-rose-600/60 shadow-xs'
                  : 'text-muted hover:text-rose-300'
              }`}
            >
              <Flame size={12} />
              <span>Stampede Collapse (No Lock)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('xfetch_probabilistic'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'xfetch_probabilistic'
                  ? 'bg-sky-950/50 text-sky-300 font-bold border border-sky-600/60 shadow-xs'
                  : 'text-muted hover:text-sky-300'
              }`}
            >
              <Zap size={12} />
              <span>XFetch (Early Probabilistic)</span>
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
          const redisRed = '#ef4444'
          const dbIndigo = '#6366f1'
          const successGreen = '#10b981'
          const dangerRed = '#f43f5e'
          const warningAmber = '#f59e0b'

          // Particle and timeline interpolation
          const tAct1 = Math.min(1, Math.max(0, (currentTime - 0.5) / 2.0))
          const tAct2 = Math.min(1, Math.max(0, (currentTime - 3.5) / 2.0))
          const tAct3 = Math.min(1, Math.max(0, (currentTime - 6.5) / 2.0))
          const tAct4 = Math.min(1, Math.max(0, (currentTime - 9.5) / 2.0))

          // Coordinates
          // Clients: x=130, y=250
          // Redis: x=430, y=250
          // Database: x=750, y=250

          return (
            <div className="relative w-full aspect-[16/10] max-w-[880px] mx-auto py-2">
              <svg viewBox="0 0 900 520" className="w-full h-full transition-all duration-300">
                <defs>
                  <marker id="redis-arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={clientCyan} />
                  </marker>
                  <marker id="redis-arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={dangerRed} />
                  </marker>
                  <marker id="redis-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={successGreen} />
                  </marker>
                  <filter id="redis-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity={isLight ? '0.08' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* ==================== FLOW CONNECTORS ==================== */}
                {/* 1. Client to Redis Path */}
                <line
                  x1="220"
                  y1="230"
                  x2="330"
                  y2="230"
                  stroke={cacheStatus === 'HIT' || cacheStatus === 'RESTORED' ? successGreen : warningAmber}
                  strokeWidth="3"
                  strokeDasharray={cacheStatus === 'EXPIRED' ? '4 4' : 'none'}
                  opacity={0.8}
                />

                {/* 2. Redis to Database Path */}
                <line
                  x1="570"
                  y1="230"
                  x2="670"
                  y2="230"
                  stroke={strategyMode === 'stampede_disaster' ? dangerRed : dbIndigo}
                  strokeWidth={strategyMode === 'stampede_disaster' && currentTime >= 6.0 ? 5 : 2}
                  strokeDasharray={currentTime < 3.0 ? '4 4' : 'none'}
                  opacity={0.8}
                />

                {/* Direct Bypass Path in Stampede Mode (Clients straight to DB) */}
                {strategyMode === 'stampede_disaster' && currentTime >= 6.0 && (
                  <path
                    d="M 220 280 C 400 440, 560 440, 670 280"
                    fill="none"
                    stroke={dangerRed}
                    strokeWidth="4"
                    strokeDasharray="6 4"
                    className="animate-pulse"
                  />
                )}

                {/* Flying Packets */}
                {/* Act 1: Cache Hits (Rapid Green Particles) */}
                {currentTime < 3.0 && (
                  <>
                    <circle cx={220 + (330 - 220) * tAct1} cy="230" r="6" fill={clientCyan} />
                    <circle cx={330 - (330 - 220) * tAct1} cy="230" r="6" fill={successGreen} />
                  </>
                )}

                {/* Act 2: Cache Miss Eviction Wave */}
                {currentTime >= 3.0 && currentTime < 6.0 && (
                  <circle cx="450" cy="230" r={10 + 25 * tAct2} fill="none" stroke={dangerRed} strokeWidth="2" opacity={1 - tAct2} />
                )}

                {/* Act 3: Mutex Single Query to DB */}
                {currentTime >= 6.0 && currentTime < 9.0 && strategyMode === 'mutex_lock' && (
                  <g transform={`translate(${570 + (670 - 570) * tAct3}, 230)`}>
                    <circle r="7" fill={dbIndigo} filter="url(#redis-shadow)" />
                    <rect x="-40" y="-22" width="80" height="16" rx="4" fill={isLight ? '#4f46e5' : '#3730a3'} />
                    <text x="0" y="-10" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                      1x SQL Query
                    </text>
                  </g>
                )}

                {/* Act 3: Stampede Disaster Multi-Query Storm */}
                {currentTime >= 6.0 && currentTime < 9.0 && strategyMode === 'stampede_disaster' && (
                  <>
                    <circle cx={570 + (670 - 570) * tAct3} cy="210" r="6" fill={dangerRed} />
                    <circle cx={570 + (670 - 570) * tAct3} cy="230" r="6" fill={dangerRed} />
                    <circle cx={570 + (670 - 570) * tAct3} cy="250" r="6" fill={dangerRed} />
                    <g transform={`translate(${430}, 410)`}>
                      <rect x="-90" y="-16" width="180" height="24" rx="4" fill="#991b1b" />
                      <text x="0" y="0" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                        500 CONCURRENT SQL HITS!
                      </text>
                    </g>
                  </>
                )}

                {/* Act 4: DB to Redis Backfill */}
                {currentTime >= 9.0 && strategyMode === 'mutex_lock' && (
                  <g transform={`translate(${670 - (670 - 570) * tAct4}, 230)`}>
                    <circle r="7" fill={successGreen} filter="url(#redis-shadow)" />
                    <rect x="-48" y="-22" width="96" height="16" rx="4" fill={isLight ? '#059669' : '#065f46'} />
                    <text x="0" y="-10" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                      SET deal:ps5 EX 60
                    </text>
                  </g>
                )}

                {/* ==================== 1. CLIENT INGRESS PANEL (Left) ==================== */}
                <g transform="translate(30, 60)" filter="url(#redis-shadow)">
                  <rect
                    width="190"
                    height="380"
                    rx="14"
                    fill={cardBg}
                    stroke={cardBorder}
                    strokeWidth="1"
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="190" height="38" rx="14" fill={isLight ? '#ecfeff' : '#083344'} />
                  <circle cx="18" cy="19" r="6" fill={clientCyan} />
                  <text x="32" y="24" fill={textPrimary} fontSize="12" fontWeight="700">
                    Application Ingress
                  </text>

                  {/* Body */}
                  <text x="14" y="65" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Traffic: <tspan fill={textPrimary} fontWeight="bold">15,000 QPS</tspan>
                  </text>
                  <text x="14" y="85" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Target Key: <tspan fill={clientCyan} fontWeight="bold">deal:ps5</tspan>
                  </text>
                  <text x="14" y="105" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Cluster: <tspan fill={textPrimary}>50 Web Workers</tspan>
                  </text>

                  {/* Active Request Breakdown */}
                  <g transform="translate(14, 125)">
                    <rect x="0" y="0" width="162" height="75" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      CONCURRENT THREAD POOL
                    </text>
                    <text x="10" y="36" fill={lockStatus === 'HELD_BY_W1' ? successGreen : textPrimary} fontSize="10" fontFamily="monospace">
                      • Worker #1 (Lead): {lockStatus === 'HELD_BY_W1' ? 'LOCK WINNER' : 'Querying'}
                    </text>
                    <text x="10" y="52" fill={lockStatus === 'HELD_BY_W1' ? warningAmber : textSecondary} fontSize="10" fontFamily="monospace">
                      • Workers #2..50: {lockStatus === 'HELD_BY_W1' ? 'SLEEP (50ms)' : 'Ingress'}
                    </text>
                    <text x="10" y="66" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      • Workers #51..500: Batch queue
                    </text>
                  </g>

                  {/* Latency Gauge Card */}
                  <g transform="translate(14, 215)">
                    <rect
                      x="0"
                      y="0"
                      width="162"
                      height="70"
                      rx="8"
                      fill={
                        strategyMode === 'stampede_disaster' && currentTime >= 6.0
                          ? isLight ? '#fee2e2' : '#450a0a'
                          : isLight ? '#f0fdf4' : '#052e16'
                      }
                      stroke={strategyMode === 'stampede_disaster' && currentTime >= 6.0 ? dangerRed : successGreen}
                    />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      P99 CLIENT LATENCY
                    </text>
                    <text
                      x="10"
                      y="44"
                      fill={strategyMode === 'stampede_disaster' && currentTime >= 6.0 ? dangerRed : successGreen}
                      fontSize="18"
                      fontWeight="800"
                      fontFamily="monospace"
                    >
                      {p99Latency}
                    </text>
                    <text x="10" y="60" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      SLA Threshold: &lt; 50 ms
                    </text>
                  </g>

                  {/* Status Pill */}
                  <g transform="translate(14, 305)">
                    <rect
                      x="0"
                      y="0"
                      width="162"
                      height="34"
                      rx="6"
                      fill={
                        strategyMode === 'stampede_disaster' && currentTime >= 6.0
                          ? '#be123c'
                          : isLight ? '#e0f2fe' : '#082f49'
                      }
                    />
                    <text
                      x="81"
                      y="21"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="monospace"
                    >
                      {strategyMode === 'stampede_disaster' && currentTime >= 6.0
                        ? '⚠ 504 GATEWAY TIMEOUT'
                        : cacheStatus === 'HIT' || cacheStatus === 'RESTORED'
                        ? '✓ 200 OK (RAM CACHE)'
                        : 'WAITING FOR LOCK'}
                    </text>
                  </g>
                </g>

                {/* ==================== 2. REDIS CLUSTER PANEL (Center) ==================== */}
                <g transform="translate(330, 50)" filter="url(#redis-shadow)">
                  <rect
                    width="240"
                    height="400"
                    rx="14"
                    fill={cardBg}
                    stroke={cacheStatus === 'EXPIRED' ? dangerRed : cardBorder}
                    strokeWidth={cacheStatus === 'EXPIRED' ? 2 : 1}
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="240" height="42" rx="14" fill={isLight ? '#fef2f2' : '#450a0a'} />
                  <circle cx="20" cy="21" r="7" fill={redisRed} />
                  <text x="35" y="26" fill={textPrimary} fontSize="13" fontWeight="800">
                    Redis In-Memory Key-Value
                  </text>

                  {/* 1. Cached Key Inspection Box */}
                  <g transform="translate(14, 55)">
                    <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="700" letterSpacing="0.05em">
                      RAM KEY: `deal:black_friday_ps5`
                    </text>
                    <rect x="0" y="22" width="212" height="94" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    
                    <text x="12" y="42" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      Type: <tspan fill={textPrimary} fontWeight="bold">JSON String</tspan>
                    </text>
                    <text x="12" y="60" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      Payload: <tspan fill={successGreen}>{cacheStatus === 'EXPIRED' ? 'NULL (Evicted)' : '{"price": 499, "stock": 42}'}</tspan>
                    </text>

                    {/* TTL Bar */}
                    <g transform="translate(12, 75)">
                      <text x="0" y="12" fill={textSecondary} fontSize="9" fontFamily="monospace">
                        TTL: {ttlSeconds.toFixed(1)}s
                      </text>
                      <rect x="52" y="3" width="136" height="12" rx="3" fill={isLight ? '#e2e8f0' : '#1e293b'} />
                      <rect
                        x="52"
                        y="3"
                        width={Math.min(136, Math.max(0, (ttlSeconds / 5.0) * 136))}
                        height="12"
                        rx="3"
                        fill={ttlSeconds > 1.5 ? successGreen : ttlSeconds > 0 ? warningAmber : dangerRed}
                      />
                    </g>
                  </g>

                  {/* 2. Distributed Mutex Lock Registry */}
                  <g transform="translate(14, 185)">
                    <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="700" letterSpacing="0.05em">
                      DISTRIBUTED MUTEX (`SETNX`)
                    </text>
                    <rect
                      x="0"
                      y="22"
                      width="212"
                      height="85"
                      rx="8"
                      fill={isLight ? '#f8fafc' : '#0b0f19'}
                      stroke={cardBorder}
                    />

                    <text x="10" y="42" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      Key: <tspan fill={textPrimary}>lock:deal:ps5</tspan>
                    </text>
                    <text x="10" y="60" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      Command: <tspan fill={warningAmber}>SETNX EX 5</tspan>
                    </text>
                    <text
                      x="10"
                      y="78"
                      fill={lockStatus === 'HELD_BY_W1' ? warningAmber : lockStatus === 'RELEASED' ? successGreen : textSecondary}
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      Status: {lockStatus === 'HELD_BY_W1' ? '🔒 LOCKED (Worker #1)' : lockStatus === 'RELEASED' ? '🔓 UNLOCKED / FREED' : 'IDLE (No Contention)'}
                    </text>
                  </g>

                  {/* 3. Cache Hit Ratio Metric */}
                  <g transform="translate(14, 305)">
                    <rect
                      x="0"
                      y="0"
                      width="212"
                      height="75"
                      rx="8"
                      fill={
                        strategyMode === 'stampede_disaster' && currentTime >= 6.0
                          ? isLight ? '#fee2e2' : '#450a0a'
                          : isLight ? '#f0fdf4' : '#052e16'
                      }
                      stroke={strategyMode === 'stampede_disaster' && currentTime >= 6.0 ? dangerRed : successGreen}
                    />
                    <text x="12" y="20" fill={textSecondary} fontSize="9" fontWeight="bold">
                      CACHE HIT EFFICIENCY
                    </text>
                    <text
                      x="12"
                      y="46"
                      fill={strategyMode === 'stampede_disaster' && currentTime >= 6.0 ? dangerRed : successGreen}
                      fontSize="17"
                      fontWeight="800"
                      fontFamily="monospace"
                    >
                      {strategyMode === 'stampede_disaster' && currentTime >= 6.0
                        ? '0.0% (COLLAPSED)'
                        : cacheStatus === 'EXPIRED'
                        ? '0.0% (MISS SPURT)'
                        : '99.98% (PROTECTED)'}
                    </text>
                    <text x="12" y="64" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      {strategyMode === 'stampede_disaster' && currentTime >= 6.0 ? 'All 15k QPS hitting DB' : '0.4ms In-Memory Speed'}
                    </text>
                  </g>
                </g>

                {/* ==================== 3. POSTGRESQL / PRIMARY DATABASE (Right) ==================== */}
                <g transform="translate(670, 60)" filter="url(#redis-shadow)">
                  <rect
                    width="200"
                    height="380"
                    rx="14"
                    fill={cardBg}
                    stroke={dbConnections >= 100 ? dangerRed : cardBorder}
                    strokeWidth={dbConnections >= 100 ? 2 : 1}
                  />
                  {/* Header */}
                  <rect
                    x="0"
                    y="0"
                    width="200"
                    height="38"
                    rx="14"
                    fill={
                      dbConnections >= 100
                        ? '#be123c'
                        : isLight ? '#eef2ff' : '#1e1b4b'
                    }
                  />
                  <circle cx="18" cy="19" r="6" fill={dbConnections >= 100 ? '#ffffff' : dbIndigo} />
                  <text x="32" y="24" fill={dbConnections >= 100 ? '#ffffff' : textPrimary} fontSize="12" fontWeight="700">
                    PostgreSQL Primary DB
                  </text>

                  {/* Body */}
                  {/* Connection Pool Meter */}
                  <g transform="translate(14, 55)">
                    <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="700">
                      CONNECTION POOL (Max: 100)
                    </text>
                    <rect x="0" y="22" width="172" height="65" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    
                    <text
                      x="10"
                      y="44"
                      fill={dbConnections >= 100 ? dangerRed : successGreen}
                      fontSize="14"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {dbConnections} / 100 Active
                    </text>

                    {/* Progress Bar */}
                    <rect x="10" y="54" width="152" height="10" rx="3" fill={isLight ? '#e2e8f0' : '#1e293b'} />
                    <rect
                      x="10"
                      y="54"
                      width={Math.min(152, (dbConnections / 100) * 152)}
                      height="10"
                      rx="3"
                      fill={dbConnections >= 100 ? dangerRed : successGreen}
                    />
                  </g>

                  {/* CPU Load Metric */}
                  <g transform="translate(14, 155)">
                    <rect
                      x="0"
                      y="0"
                      width="172"
                      height="65"
                      rx="8"
                      fill={
                        dbConnections >= 100
                          ? isLight ? '#fee2e2' : '#450a0a'
                          : isLight ? '#f8fafc' : '#0b0f19'
                      }
                      stroke={dbConnections >= 100 ? dangerRed : cardBorder}
                    />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      DATABASE CPU UTILIZATION
                    </text>
                    <text
                      x="10"
                      y="42"
                      fill={dbConnections >= 100 ? dangerRed : textPrimary}
                      fontSize="16"
                      fontWeight="800"
                      fontFamily="monospace"
                    >
                      {dbCpuLoad}
                    </text>
                    <text x="10" y="58" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      {dbConnections >= 100 ? 'Thermal Throttling' : 'Idle Headroom'}
                    </text>
                  </g>

                  {/* Disk Heap Query Engine */}
                  <g transform="translate(14, 235)">
                    <rect x="0" y="0" width="172" height="65" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      DISK HEAP EXECUTION
                    </text>
                    <text x="10" y="36" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      Table: `deals` (8KB pages)
                    </text>
                    <text x="10" y="52" fill={dbConnections >= 100 ? dangerRed : successGreen} fontSize="10" fontFamily="monospace">
                      {dbConnections >= 100 ? 'I/O Thrashing (500 queries)' : '1 Query: 22ms finish'}
                    </text>
                  </g>

                  {/* Status Banner */}
                  <g transform="translate(14, 315)">
                    <rect
                      x="0"
                      y="0"
                      width="172"
                      height="34"
                      rx="6"
                      fill={
                        dbConnections >= 100
                          ? '#be123c'
                          : isLight ? '#dcfce7' : '#052e16'
                      }
                    />
                    <text
                      x="86"
                      y="21"
                      textAnchor="middle"
                      fill={dbConnections >= 100 ? '#ffffff' : successGreen}
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="monospace"
                    >
                      {dbConnections >= 100 ? 'FATAL: POOL EXHAUSTED' : '✓ HEALTHY (1% LOAD)'}
                    </text>
                  </g>
                </g>

                {/* Mutex Shield Graphic Overlay */}
                {currentTime >= 6.0 && currentTime < 9.0 && strategyMode === 'mutex_lock' && (
                  <g transform="translate(620, 230)" filter="url(#redis-shadow)">
                    <rect x="-80" y="-24" width="160" height="48" rx="8" fill={isLight ? '#dcfce7' : '#065f46'} stroke={successGreen} strokeWidth="2" />
                    <text x="0" y="-4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                      MUTEX SHIELD ACTIVE
                    </text>
                    <text x="0" y="14" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace">
                      499 queries blocked
                    </text>
                  </g>
                )}

                {/* Stampede Collapse Warning Overlay */}
                {currentTime >= 6.0 && strategyMode === 'stampede_disaster' && (
                  <g transform="translate(620, 230)" filter="url(#redis-shadow)">
                    <rect x="-85" y="-24" width="170" height="48" rx="8" fill="#991b1b" stroke={dangerRed} strokeWidth="2" />
                    <text x="0" y="-4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                      STAMPEDE COLLAPSE!
                    </text>
                    <text x="0" y="14" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace">
                      Pool Exhausted (100%)
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
