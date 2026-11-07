import { useState, useEffect, useRef } from 'react'
import { Flame, CheckCircle2, ShieldAlert } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function TinyUrlMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [strategyMode, setStrategyMode] = useState<'production' | 'sql_lock' | 'http_301'>('production')

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

  // Calculate Narrative, Metrics & Visual States based on currentTime and strategyMode
  let subtitle = ''
  let metrics: { label: string; value: string; variant?: 'default' | 'success' | 'warning' | 'danger' }[] = []
  let kgsActive = false
  let cacheHit = false
  let kafkaActive = false
  let sqlLocked = false
  let browserCached = false

  if (currentTime < 3.0) {
    kgsActive = true
    subtitle = '0.0s - 3.0s: Write Path. Long URL arrives at Gateway. KGS Range Server dispenses unique ID 9,182,736 -> encoded into 7-char Base62 "aZ81qK" (0 collisions).'
    metrics = [
      { label: 'Operation', value: 'POST /api/v1/shorten', variant: 'default' },
      { label: 'KGS Server', value: 'Pre-allocated ID 9,182,736', variant: 'success' },
      { label: 'Base62 Hash', value: 'aZ81qK (Zero Collisions)', variant: 'success' },
      { label: 'Storage', value: 'PostgreSQL + Warm Redis', variant: 'default' },
    ]
  } else if (currentTime < 6.0) {
    if (strategyMode === 'production') {
      cacheHit = true
      subtitle = '3.0s - 6.0s: Viral Read Burst! 50,000 RPS request "tiny.cc/aZ81qK". Redis Cache-Aside yields instant HIT in 1.2ms -> HTTP 302 Found response.'
      metrics = [
        { label: 'Incoming Traffic', value: '50,000 RPS Burst', variant: 'default' },
        { label: 'Redis Lookup', value: 'CACHE HIT (1.2 ms)', variant: 'success' },
        { label: 'Redirect Code', value: 'HTTP 302 Found', variant: 'success' },
        { label: 'Postgres Load', value: '0% (100% Offloaded)', variant: 'success' },
      ]
    } else if (strategyMode === 'sql_lock') {
      sqlLocked = true
      subtitle = '3.0s - 6.0s: CRITICAL BOTTLENECK. Synchronous SQL "UPDATE clicks = clicks + 1" attempts 50,000 concurrent row locks on PostgreSQL. Queries queue up!'
      metrics = [
        { label: 'Incoming Traffic', value: '50,000 RPS Burst', variant: 'danger' },
        { label: 'DB Query', value: 'UPDATE urls SET clicks = clicks + 1', variant: 'danger' },
        { label: 'Row Lock Wait', value: '50,000 Transactions Stuck', variant: 'danger' },
        { label: 'P99 Latency', value: '14,200 ms (SPIKE)', variant: 'danger' },
      ]
    } else {
      browserCached = true
      subtitle = '3.0s - 6.0s: HTTP 301 Moved Permanently issued. Browser caches redirect locally. Subsequent clicks never touch our gateway!'
      metrics = [
        { label: 'Incoming Traffic', value: '1st Request Received', variant: 'warning' },
        { label: 'Redirect Code', value: 'HTTP 301 Permanent', variant: 'warning' },
        { label: 'Browser Action', value: 'Aggressive Local Cache', variant: 'warning' },
        { label: 'Server Ingress', value: 'Future Clicks Dropped', variant: 'warning' },
      ]
    }
  } else if (currentTime < 9.0) {
    if (strategyMode === 'production') {
      cacheHit = true
      kafkaActive = true
      subtitle = '6.0s - 9.0s: Non-blocking Analytics. Gateway publishes click event to Kafka partition buffer. Redirect latency unaffected (<2ms).'
      metrics = [
        { label: 'Redirect SLA', value: '2.1 ms (Maintained)', variant: 'success' },
        { label: 'Kafka Ingest', value: '50,000 events/sec', variant: 'success' },
        { label: 'Lock Contention', value: 'Zero (Async Decoupled)', variant: 'success' },
        { label: 'Pipeline State', value: 'Buffered in Memory', variant: 'success' },
      ]
    } else if (strategyMode === 'sql_lock') {
      sqlLocked = true
      subtitle = '6.0s - 9.0s: SYSTEM CRASH. PostgreSQL connection pool saturated (max_connections=1000 exceeded). Gateway returns 504 Gateway Timeout.'
      metrics = [
        { label: 'Postgres Status', value: 'CONNECTION POOL EXHAUSTED', variant: 'danger' },
        { label: 'Error Rate', value: '98.4% (504 Timeout)', variant: 'danger' },
        { label: 'Active Locks', value: 'Exclusive Row Contention', variant: 'danger' },
        { label: 'System Health', value: 'UNRESPONSIVE', variant: 'danger' },
      ]
    } else {
      browserCached = true
      subtitle = '6.0s - 9.0s: ANALYTICS BLINDED. User clicks 2 to 50,000 bypass server completely. Kafka ingest queue sits empty (0 events tracked).'
      metrics = [
        { label: 'Incoming Traffic', value: '0 RPS (Browser Short-circuit)', variant: 'danger' },
        { label: 'Kafka Telemetry', value: '0 Events Ingested', variant: 'danger' },
        { label: 'Analytics Accuracy', value: 'FATAL: 99.9% Data Loss', variant: 'danger' },
        { label: 'Revenue Loss', value: 'Sponsor Tracking Broken', variant: 'danger' },
      ]
    }
  } else {
    if (strategyMode === 'production') {
      cacheHit = true
      kafkaActive = true
      subtitle = '9.0s - 12.0s: Steady-State Nirvana. ClickHouse micro-batches 50k events/sec. Zero lock contention, 99.8% cache hit rate, <5ms P99 SLA.'
      metrics = [
        { label: 'P99 Latency', value: '2.4 ms (SLA < 10ms)', variant: 'success' },
        { label: 'ClickHouse Ingest', value: 'Columnar Micro-batching', variant: 'success' },
        { label: 'Analytics Freshness', value: '< 1 sec lag', variant: 'success' },
        { label: 'Availability', value: '99.999% High Availability', variant: 'success' },
      ]
    } else if (strategyMode === 'sql_lock') {
      sqlLocked = true
      subtitle = '9.0s - 12.0s: Total Outage. All short links fail globally. Monolithic DB restart required to clear orphaned row transaction locks.'
      metrics = [
        { label: 'System Recovery', value: 'Manual DB Failover Needed', variant: 'danger' },
        { label: 'Lost Redirects', value: '142,000 Dropped Requests', variant: 'danger' },
        { label: 'Remediation', value: 'Decouple to Redis + Kafka', variant: 'danger' },
        { label: 'Architecture Grade', value: 'FAIL (Naive Synchronous)', variant: 'danger' },
      ]
    } else {
      browserCached = true
      subtitle = '9.0s - 12.0s: Post-Mortem. HTTP 301 is disastrous for ad-tech/analytics. Production systems MUST use HTTP 302 Found for tracked links.'
      metrics = [
        { label: 'Root Cause', value: 'HTTP 301 RFC Browser Cache', variant: 'warning' },
        { label: 'Correct Fix', value: 'Switch to HTTP 302 Found', variant: 'success' },
        { label: 'Edge Strategy', value: 'Cache in Redis, NOT Browser', variant: 'default' },
        { label: 'Telemetry Gap', value: 'Irreversible Blindspot', variant: 'warning' },
      ]
    }
  }

  // Animation packet positions
  const packetProgress = (currentTime % 2.5) / 2.5

  return (
    <div className="w-full space-y-4">
      <MotionGraphicPlayer
        title="Scalable URL Shortener with Real-Time Click Analytics"
        subtitle="12-Second Slow Walkthrough · TinyURL & Bitly Architecture, Base62 KGS, Redis Cache-Aside & Kafka Analytics"
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
              onClick={() => { setStrategyMode('production'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'production'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>HTTP 302 + Redis (Safe)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('sql_lock'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'sql_lock'
                  ? 'bg-rose-950/50 text-rose-300 font-bold border border-rose-600/60 shadow-xs'
                  : 'text-muted hover:text-rose-300'
              }`}
            >
              <Flame size={12} />
              <span>SQL Lock (Crash)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('http_301'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'http_301'
                  ? 'bg-amber-950/50 text-amber-300 font-bold border border-amber-600/60 shadow-xs'
                  : 'text-muted hover:text-amber-300'
              }`}
            >
              <ShieldAlert size={12} />
              <span>HTTP 301 (Blinded)</span>
            </button>
          </div>
        }
      >
        {(canvasTheme) => {
          const isLight = canvasTheme === 'light'

          const textPrimary = isLight ? '#0f172a' : '#f8fafc'
          const textSecondary = isLight ? '#475569' : '#94a3b8'
          const cardBg = isLight ? '#ffffff' : '#111726'
          const cardBorder = isLight ? '#cbd5e1' : '#334155'
          const kgsPurple = '#818cf8'
          const redisGreen = '#10b981'
          const kafkaAmber = '#f59e0b'
          const dangerRed = '#ef4444'
          const primaryBlue = '#38bdf8'

          // Animated particle coordinates
          const requestPktX = 160 + packetProgress * 90
          const redirectPktX = 250 - packetProgress * 90
          const kafkaPktX = 390 + packetProgress * 290

          return (
            <div className="relative w-full aspect-[16/10] max-w-[860px] mx-auto py-2">
              <svg viewBox="0 0 880 500" className="w-full h-full transition-all duration-300">
                <defs>
                  <marker id="tiny-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={primaryBlue} />
                  </marker>
                  <marker id="tiny-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={redisGreen} />
                  </marker>
                  <marker id="tiny-arrow-purple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={kgsPurple} />
                  </marker>
                  <marker id="tiny-arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={kafkaAmber} />
                  </marker>
                  <marker id="tiny-arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={dangerRed} />
                  </marker>
                  <filter id="tiny-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity={isLight ? '0.1' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* ==================== FLOW CONNECTOR PATHS ==================== */}

                {/* 1. Client -> Gateway (Request line) */}
                <path d="M 160 215 L 240 215" fill="none" stroke={primaryBlue} strokeWidth="3.5" markerEnd="url(#tiny-arrow-blue)" />

                {/* 2. Gateway -> Client (Redirect line) */}
                <path
                  d="M 240 255 L 160 255"
                  fill="none"
                  stroke={sqlLocked ? dangerRed : (browserCached ? kafkaAmber : redisGreen)}
                  strokeWidth="3.5"
                  strokeDasharray={browserCached ? '5 5' : 'none'}
                  markerEnd={sqlLocked ? 'url(#tiny-arrow-red)' : (browserCached ? 'url(#tiny-arrow-amber)' : 'url(#tiny-arrow-green)')}
                />

                {/* 3. Write Path: Gateway <-> KGS Range Server */}
                <path
                  d="M 310 160 L 310 115"
                  fill="none"
                  stroke={kgsActive ? kgsPurple : cardBorder}
                  strokeWidth="3"
                  strokeDasharray="4 4"
                  markerEnd="url(#tiny-arrow-purple)"
                />

                {/* 4. Read Path: Gateway <-> Redis Cache-Aside */}
                <path
                  d="M 380 220 L 450 220"
                  fill="none"
                  stroke={cacheHit ? redisGreen : cardBorder}
                  strokeWidth="3.5"
                  markerEnd="url(#tiny-arrow-green)"
                />

                {/* 5. Persistent DB Write / Lock Path: Gateway -> Postgres */}
                <path
                  d="M 310 330 L 310 380 L 450 380"
                  fill="none"
                  stroke={sqlLocked ? dangerRed : cardBorder}
                  strokeWidth={sqlLocked ? '4' : '2.5'}
                  markerEnd={sqlLocked ? 'url(#tiny-arrow-red)' : undefined}
                />

                {/* 6. Async Clickstream: Gateway -> Kafka */}
                {strategyMode !== 'sql_lock' && (
                  <path
                    d="M 350 170 C 420 120, 600 120, 680 180"
                    fill="none"
                    stroke={kafkaActive ? kafkaAmber : cardBorder}
                    strokeWidth={kafkaActive ? '3.5' : '2'}
                    strokeDasharray={kafkaActive ? '6 4' : '4 4'}
                    markerEnd="url(#tiny-arrow-amber)"
                  />
                )}

                {/* ==================== ANIMATED PACKETS ==================== */}
                {isPlaying && (
                  <>
                    {/* User request packet */}
                    {!browserCached && (
                      <g transform={`translate(${requestPktX}, 215)`}>
                        <circle cx="0" cy="0" r="6" fill={primaryBlue} />
                      </g>
                    )}

                    {/* Returning redirect packet */}
                    {cacheHit && (
                      <g transform={`translate(${redirectPktX}, 255)`}>
                        <circle cx="0" cy="0" r="6" fill={redisGreen} />
                      </g>
                    )}

                    {/* Kafka async stream packet */}
                    {kafkaActive && (
                      <g transform={`translate(${kafkaPktX}, 135)`}>
                        <circle cx="0" cy="0" r="5" fill={kafkaAmber} />
                      </g>
                    )}
                  </>
                )}

                {/* ==================== ARCHITECTURE NODES ==================== */}

                {/* NODE 1: CLIENT BROWSER / SMARTPHONE (Left) */}
                <g transform="translate(25, 140)" filter="url(#tiny-shadow)">
                  <rect x="0" y="0" width="135" height="175" rx="14" fill={cardBg} stroke={primaryBlue} strokeWidth="3" />
                  <text x="67" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Client Browser
                  </text>
                  <text x="67" y="44" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    50k Concurrent Users
                  </text>

                  {/* Browser URL Bar Mockup */}
                  <rect x="12" y="58" width="111" height="42" rx="6" fill={isLight ? '#f0f9ff' : '#0c4a6e'} stroke="#0284c7" strokeWidth="1" />
                  <text x="18" y="74" fill="#0284c7" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    tiny.cc/aZ81qK
                  </text>
                  <text x="18" y="90" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    Target: ApexCaliber
                  </text>

                  {/* Client Result Banner */}
                  <rect
                    x="12"
                    y="112"
                    width="111"
                    height="45"
                    rx="6"
                    fill={sqlLocked ? (isLight ? '#fee2e2' : '#450a0a') : (browserCached ? (isLight ? '#fef3c7' : '#451a03') : (isLight ? '#ecfdf5' : '#064e3b'))}
                    stroke={sqlLocked ? dangerRed : (browserCached ? kafkaAmber : redisGreen)}
                    strokeWidth="1.5"
                  />
                  <text
                    x="67"
                    y="130"
                    textAnchor="middle"
                    fill={sqlLocked ? dangerRed : (browserCached ? kafkaAmber : redisGreen)}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {sqlLocked ? '504 TIMEOUT' : (browserCached ? '301 CACHED' : '302 FOUND')}
                  </text>
                  <text
                    x="67"
                    y="146"
                    textAnchor="middle"
                    fill={textSecondary}
                    fontSize="8"
                    fontFamily="sans-serif"
                  >
                    {sqlLocked ? 'Database frozen' : (browserCached ? 'Bypasses gateway' : 'Redirects in 1.2ms')}
                  </text>
                </g>

                {/* NODE 2: API GATEWAY & LOAD BALANCER (Center-Left) */}
                <g transform="translate(240, 140)" filter="url(#tiny-shadow)">
                  <rect x="0" y="0" width="140" height="175" rx="14" fill={cardBg} stroke={primaryBlue} strokeWidth="3" />
                  <text x="70" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    API Gateway
                  </text>
                  <text x="70" y="44" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Envoy / NGINX
                  </text>

                  {/* Mode Card */}
                  <rect x="12" y="58" width="116" height="50" rx="6" fill={isLight ? '#f8fafc' : '#1e293b'} stroke={cardBorder} strokeWidth="1" />
                  <text x="70" y="76" textAnchor="middle" fill={textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                    Routing Engine
                  </text>
                  <text x="70" y="94" textAnchor="middle" fill={redisGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    {cacheHit ? 'HIT -> Redis' : (kgsActive ? 'POST -> KGS' : 'IDLE')}
                  </text>

                  {/* Analytics Firehose Label */}
                  <rect x="12" y="118" width="116" height="42" rx="6" fill={isLight ? '#fffbeb' : '#291e0a'} stroke={kafkaAmber} strokeWidth="1" />
                  <text x="70" y="134" textAnchor="middle" fill={kafkaAmber} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    Async Event Hub
                  </text>
                  <text x="70" y="148" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    Fire-and-Forget
                  </text>
                </g>

                {/* NODE 3: KEY GENERATION SERVICE (KGS) (Top-Center) */}
                <g transform="translate(220, 15)" filter="url(#tiny-shadow)">
                  <rect
                    x="0"
                    y="0"
                    width="220"
                    height="95"
                    rx="12"
                    fill={cardBg}
                    stroke={kgsActive ? kgsPurple : cardBorder}
                    strokeWidth={kgsActive ? '3' : '1.5'}
                  />
                  <text x="110" y="24" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    KGS Range Server (Base62)
                  </text>
                  <text x="110" y="40" textAnchor="middle" fill={kgsPurple} fontSize="10" fontFamily="monospace">
                    Range: [9,000,000 - 9,999,999]
                  </text>

                  {/* Base62 Math Box */}
                  <rect x="15" y="48" width="190" height="36" rx="6" fill={isLight ? '#eef2ff' : '#1e1b4b'} />
                  <text x="110" y="65" textAnchor="middle" fill={kgsPurple} fontSize="11" fontWeight="bold" fontFamily="monospace">
                    9,182,736 → &quot;aZ81qK&quot;
                  </text>
                  <text x="110" y="78" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    62^7 = 3.52 Trillion Unique URLs
                  </text>
                </g>

                {/* NODE 4: REDIS CACHE-ASIDE CLUSTER (Center) */}
                <g transform="translate(450, 120)" filter="url(#tiny-shadow)">
                  <rect
                    x="0"
                    y="0"
                    width="170"
                    height="195"
                    rx="14"
                    fill={cardBg}
                    stroke={cacheHit ? redisGreen : cardBorder}
                    strokeWidth={cacheHit ? '3.5' : '2'}
                  />
                  <text x="85" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Redis Cache-Aside
                  </text>
                  <text x="85" y="44" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    In-Memory Cluster (P99 1ms)
                  </text>

                  {/* Cache Record View */}
                  <g transform="translate(15, 55)">
                    <rect x="0" y="0" width="140" height="75" rx="8" fill={cacheHit ? (isLight ? '#ecfdf5' : '#064e3b') : (isLight ? '#f1f5f9' : '#1e293b')} stroke={cacheHit ? redisGreen : cardBorder} strokeWidth="1.5" />
                    <text x="10" y="20" fill={redisGreen} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      Key: aZ81qK
                    </text>
                    <text x="10" y="38" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      Val: .../ApexCaliber
                    </text>
                    <text x="10" y="54" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      TTL: 86,400s (1 Day)
                    </text>
                    <text x="10" y="68" fill={redisGreen} fontSize="8" fontWeight="bold" fontFamily="monospace">
                      Hit Rate: 99.8%
                    </text>
                  </g>

                  <rect x="15" y="142" width="140" height="38" rx="6" fill={isLight ? '#f8fafc' : '#1e293b'} />
                  <text x="85" y="158" textAnchor="middle" fill={redisGreen} fontSize="10" fontWeight="bold" fontFamily="monospace">
                    {cacheHit ? '⚡ CACHE HIT (1.2ms)' : 'STANDBY'}
                  </text>
                  <text x="85" y="172" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    Zero Disk Read Delay
                  </text>
                </g>

                {/* NODE 5: POSTGRESQL PERSISTENCE STORE (Bottom-Center) */}
                <g transform="translate(450, 345)" filter="url(#tiny-shadow)">
                  <rect
                    x="0"
                    y="0"
                    width="170"
                    height="125"
                    rx="14"
                    fill={cardBg}
                    stroke={sqlLocked ? dangerRed : cardBorder}
                    strokeWidth={sqlLocked ? '3.5' : '1.5'}
                  />
                  <text x="85" y="24" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    PostgreSQL DB
                  </text>
                  <text x="85" y="38" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Persistent Storage
                  </text>

                  {/* SQL Lock Contention Box */}
                  <rect
                    x="15"
                    y="48"
                    width="140"
                    height="62"
                    rx="6"
                    fill={sqlLocked ? (isLight ? '#fee2e2' : '#450a0a') : (isLight ? '#f8fafc' : '#1e293b')}
                    stroke={sqlLocked ? dangerRed : cardBorder}
                    strokeWidth="1.5"
                  />
                  <text
                    x="85"
                    y="66"
                    textAnchor="middle"
                    fill={sqlLocked ? dangerRed : textPrimary}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {sqlLocked ? '🔥 ROW LOCK CONTENTION' : 'urls TABLE (Indexed)'}
                  </text>
                  <text
                    x="85"
                    y="82"
                    textAnchor="middle"
                    fill={sqlLocked ? dangerRed : textSecondary}
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {sqlLocked ? '50,000 UPDATEs Queued' : 'id: 9,182,736'}
                  </text>
                  <text
                    x="85"
                    y="98"
                    textAnchor="middle"
                    fill={sqlLocked ? (isLight ? '#991b1b' : '#fca5a5') : textSecondary}
                    fontSize="8"
                    fontFamily="sans-serif"
                  >
                    {sqlLocked ? 'max_connections reached!' : 'Bypassed during read burst'}
                  </text>
                </g>

                {/* NODE 6: KAFKA CLICKSTREAM & CLICKHOUSE ANALYTICS (Right) */}
                <g transform="translate(680, 130)" filter="url(#tiny-shadow)">
                  <rect
                    x="0"
                    y="0"
                    width="175"
                    height="190"
                    rx="14"
                    fill={cardBg}
                    stroke={kafkaActive ? kafkaAmber : cardBorder}
                    strokeWidth={kafkaActive ? '3.5' : '1.5'}
                  />
                  <text x="87" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Kafka & ClickHouse
                  </text>
                  <text x="87" y="44" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Real-Time Click Analytics
                  </text>

                  {/* Kafka Partition Stream */}
                  <g transform="translate(15, 55)">
                    <rect x="0" y="0" width="145" height="48" rx="6" fill={isLight ? '#fffbeb' : '#291e0a'} stroke={kafkaAmber} strokeWidth="1" />
                    <text x="72" y="20" textAnchor="middle" fill={kafkaAmber} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      topic: url-clicks
                    </text>
                    <text x="72" y="36" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      {browserCached ? '0 events (Blinded!)' : (kafkaActive ? 'Ingesting 50k evts/sec' : 'Queue Idle')}
                    </text>
                  </g>

                  {/* ClickHouse Columnar Box */}
                  <g transform="translate(15, 115)">
                    <rect x="0" y="0" width="145" height="60" rx="6" fill={isLight ? '#f8fafc' : '#1e293b'} stroke={cardBorder} strokeWidth="1" />
                    <text x="72" y="18" textAnchor="middle" fill={textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      ClickHouse Aggregator
                    </text>
                    <text x="72" y="34" textAnchor="middle" fill={redisGreen} fontSize="8" fontWeight="bold" fontFamily="monospace">
                      Geo / Referrer / Browser
                    </text>
                    <text x="72" y="48" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      Columnar Micro-batching
                    </text>
                  </g>
                </g>

                {/* OVERLAY WARNING: CRITICAL SQL CONTENTION */}
                {sqlLocked && (
                  <g transform="translate(230, 435)">
                    <rect x="0" y="0" width="420" height="50" rx="10" fill={isLight ? '#fef2f2' : '#450a0a'} stroke={dangerRed} strokeWidth="2" />
                    <text x="210" y="22" textAnchor="middle" fill={dangerRed} fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                      🚨 FATAL: Synchronous SQL UPDATE Row Lock Contention
                    </text>
                    <text x="210" y="38" textAnchor="middle" fill={isLight ? '#991b1b' : '#fca5a5'} fontSize="10" fontFamily="monospace">
                      Never update counters synchronously in relational DBs on read paths!
                    </text>
                  </g>
                )}

                {/* OVERLAY WARNING: 301 BROWSER CACHING BLINDSPOT */}
                {browserCached && (
                  <g transform="translate(230, 435)">
                    <rect x="0" y="0" width="420" height="50" rx="10" fill={isLight ? '#fffbeb' : '#451a03'} stroke={kafkaAmber} strokeWidth="2" />
                    <text x="210" y="22" textAnchor="middle" fill={kafkaAmber} fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                      ⚠️ ANALYTICS BLINDSPOT: HTTP 301 Permanent Redirect
                    </text>
                    <text x="210" y="38" textAnchor="middle" fill={isLight ? '#92400e' : '#fde68a'} fontSize="10" fontFamily="monospace">
                      Browsers cache 301 forever. Clicks bypass server. Use HTTP 302 Found!
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