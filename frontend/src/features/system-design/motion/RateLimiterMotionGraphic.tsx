import { useState, useEffect, useRef } from 'react'
import { Flame, CheckCircle2, ShieldAlert } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function RateLimiterMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [trafficMode, setTrafficMode] = useState<'normal' | 'surge' | 'fail_open'>('normal')

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

  // Calculate Tokens, Subtitle, and Metrics based on currentTime and trafficMode
  let subtitle = ''
  let metrics: { label: string; value: string; variant?: 'default' | 'success' | 'warning' | 'danger' }[] = []
  let availableTokens = 5
  let isRateLimited = false

  if (trafficMode === 'surge') {
    // 50 RPS SURGE ATTACK
    if (currentTime < 2.5) {
      availableTokens = Math.max(3, 5 - Math.floor(currentTime * 1.5))
      subtitle = '0.0s - 2.5s: 50 RPS traffic surge hits API Gateway. First 5 requests rapidly consume available tokens.'
      metrics = [
        { label: 'Incoming Traffic', value: '50 RPS (Surge)', variant: 'warning' },
        { label: 'Token Bucket', value: `${availableTokens} / 5 Tokens`, variant: 'default' },
        { label: 'Allowed Traffic', value: 'Passing ✓', variant: 'success' },
      ]
    } else if (currentTime < 8.0) {
      availableTokens = 0
      isRateLimited = true
      subtitle = '2.5s - 8.0s: BUCKET DEPLETED! Tokens hit 0. Gateway immediately sheds excess load with HTTP 429 Too Many Requests in <1.5ms.'
      metrics = [
        { label: 'Token Bucket', value: '0 / 5 (EMPTY)', variant: 'danger' },
        { label: 'Gateway Action', value: 'HTTP 429 Shedding', variant: 'danger' },
        { label: 'Downstream DB', value: '100% HEALTHY (Protected)', variant: 'success' },
      ]
    } else {
      availableTokens = Math.min(5, Math.floor((currentTime - 8.0) * 1.25))
      subtitle = '8.0s - 12.0s: Lazy Refill in Action. Redis computes elapsed time on-demand, refilling +1 token/sec. System safely unthrottles!'
      metrics = [
        { label: 'Token Refill', value: `${availableTokens} / 5 Tokens`, variant: 'success' },
        { label: 'Rate Limiter', value: 'Unthrottled ✓', variant: 'success' },
        { label: 'Downstream Impact', value: 'Zero Outages', variant: 'success' },
      ]
    }
  } else if (trafficMode === 'fail_open') {
    // REDIS OUTAGE FAIL-OPEN CIRCUIT BREAKER
    subtitle = 'Redis Cluster partition detected! Gateway circuit breaker fails-open, falling back to local pod memory so users are never blocked.'
    metrics = [
      { label: 'Redis Cluster', value: 'Partition / Outage', variant: 'danger' },
      { label: 'Circuit Breaker', value: 'FAIL-OPEN Active', variant: 'warning' },
      { label: 'Customer Impact', value: '0% Dropped Requests', variant: 'success' },
    ]
  } else {
    // NORMAL BALANCED TRAFFIC (5 RPS)
    if (currentTime < 3.0) {
      availableTokens = 5
      subtitle = '0.0s - 3.0s: Token Bucket Initialized. Capacity = 5 tokens, refill rate = +1 token/sec. Normal traffic (5 RPS) arrives.'
      metrics = [
        { label: 'Bucket Capacity', value: '5 Tokens', variant: 'default' },
        { label: 'Incoming Traffic', value: '5 RPS (Normal)', variant: 'default' },
        { label: 'Lua RTT', value: '< 1.2ms', variant: 'success' },
      ]
    } else if (currentTime < 8.0) {
      availableTokens = 3
      subtitle = '3.0s - 8.0s: Atomic Token Deduction. Redis Lua script checks tokens & decrements atomically in 1 single-threaded round-trip.'
      metrics = [
        { label: 'Available Tokens', value: '3 / 5 Tokens', variant: 'success' },
        { label: 'Downstream Status', value: 'HTTP 200 OK', variant: 'success' },
        { label: 'Race Conditions', value: '0 (Eliminated via Lua)', variant: 'success' },
      ]
    } else {
      availableTokens = 5
      subtitle = '8.0s - 12.0s: Steady State Maintained. New tokens replenish as requests process. Seamless 200 OK throughput.'
      metrics = [
        { label: 'Bucket Balance', value: '5 / 5 (Full)', variant: 'success' },
        { label: 'HTTP Status', value: '200 OK (100%)', variant: 'success' },
        { label: 'SLA Target', value: '< 2ms Overhead', variant: 'success' },
      ]
    }
  }

  // Animation packet offsets
  const packetClientProgress = Math.min(1, Math.max(0, currentTime / 2.0))
  const packetRedisProgress = Math.min(1, Math.max(0, (currentTime - 2.0) / 2.5))
  const packetDownstreamProgress = Math.min(1, Math.max(0, (currentTime - 4.5) / 3.0))

  return (
    <div className="w-full space-y-4">
      <MotionGraphicPlayer
        title="Distributed Rate Limiter (Token Bucket & Redis Lua)"
        subtitle="12-Second Slow Walkthrough · Stripe & ByteByteGo Architecture with Atomic Lua Execution"
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
              onClick={() => { setTrafficMode('normal'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                trafficMode === 'normal'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>Normal (5 RPS)</span>
            </button>
            <button
              type="button"
              onClick={() => { setTrafficMode('surge'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                trafficMode === 'surge'
                  ? 'bg-amber-950/50 text-amber-300 font-bold border border-amber-600/60 shadow-xs'
                  : 'text-muted hover:text-amber-300'
              }`}
            >
              <Flame size={12} />
              <span>50 RPS Surge (429)</span>
            </button>
            <button
              type="button"
              onClick={() => { setTrafficMode('fail_open'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                trafficMode === 'fail_open'
                  ? 'bg-blue-950/50 text-blue-300 font-bold border border-blue-600/60 shadow-xs'
                  : 'text-muted hover:text-blue-300'
              }`}
            >
              <ShieldAlert size={12} />
              <span>Fail-Open</span>
            </button>
          </div>
        }
      >
        {(canvasTheme) => {
          const isLight = canvasTheme === 'light'

          const textPrimary = isLight ? '#0f172a' : '#f8fafc'
          const textSecondary = isLight ? '#475569' : '#94a3b8'
          const cardBg = isLight ? '#ffffff' : '#111726'
          const arrowColor = isLight ? '#2563eb' : '#60a5fa'
          const tokenGold = '#f59e0b'
          const dangerRed = '#ef4444'

          return (
            <div className="relative w-full aspect-[16/10] max-w-[840px] mx-auto py-2">
              <svg viewBox="0 0 880 500" className="w-full h-full transition-all duration-300">
                <defs>
                  <marker id="rl-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={arrowColor} />
                  </marker>
                  <marker id="rl-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#10b981" />
                  </marker>
                  <marker id="rl-arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={dangerRed} />
                  </marker>
                  <filter id="rl-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity={isLight ? '0.1' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* FLOW CONNECTORS */}

                {/* 1. Client -> Gateway */}
                {packetClientProgress > 0 && (
                  <g>
                    <path
                      d="M 160 210 C 190 210, 190 210, 220 210"
                      fill="none"
                      stroke={arrowColor}
                      strokeWidth="4"
                      markerEnd="url(#rl-arrow-blue)"
                    />
                    <circle cx={160 + 60 * packetClientProgress} cy="210" r="5" fill="#38bdf8" />
                  </g>
                )}

                {/* 2. Gateway <-> Redis (Two-way evaluation curve) */}
                {packetRedisProgress > 0 && (
                  <g>
                    <path
                      d="M 370 190 C 400 170, 420 170, 440 190"
                      fill="none"
                      stroke={tokenGold}
                      strokeWidth="3.5"
                      strokeDasharray="5 4"
                    />
                    <text x="405" y="160" textAnchor="middle" fill={tokenGold} fontSize="10" fontFamily="monospace" fontWeight="bold">
                      EVAL Lua (1-Hop)
                    </text>
                  </g>
                )}

                {/* 3. Gateway -> Downstream Service (Only if not rate limited!) */}
                {!isRateLimited && packetDownstreamProgress > 0 && (
                  <g>
                    <path
                      d="M 370 230 C 500 230, 520 230, 660 230"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="4"
                      markerEnd="url(#rl-arrow-green)"
                    />
                    <circle cx={370 + 290 * packetDownstreamProgress} cy="230" r="6" fill="#10b981" />
                    <rect x="470" y="215" width="100" height="24" rx="12" fill={isLight ? '#ecfdf5' : '#064e3b'} stroke="#10b981" strokeWidth="1.5" />
                    <text x="520" y="231" textAnchor="middle" fill="#10b981" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
                      200 OK (Allowed)
                    </text>
                  </g>
                )}

                {/* 4. 429 SHEDDING BOUNCE (When rate limited) */}
                {isRateLimited && (
                  <g>
                    <path
                      d="M 340 170 C 340 110, 240 110, 160 170"
                      fill="none"
                      stroke={dangerRed}
                      strokeWidth="4"
                      strokeDasharray="5 4"
                      markerEnd="url(#rl-arrow-red)"
                    />
                    <rect x="190" y="90" width="160" height="30" rx="15" fill={isLight ? '#fef2f2' : '#450a0a'} stroke={dangerRed} strokeWidth="1.5" />
                    <text x="270" y="110" textAnchor="middle" fill={dangerRed} fontSize="11" fontFamily="sans-serif" fontWeight="bold">
                      ⚡ HTTP 429 (SHED LOAD)
                    </text>
                  </g>
                )}

                {/* ==================== ARCHITECTURE NODES ==================== */}

                {/* NODE 1: CLIENT (Left) */}
                <g transform="translate(30, 150)" filter="url(#rl-shadow)">
                  <rect x="0" y="0" width="130" height="120" rx="12" fill={cardBg} stroke="#38bdf8" strokeWidth="3" />
                  <text x="65" y="32" textAnchor="middle" fill={textPrimary} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                    API Clients
                  </text>
                  <text x="65" y="52" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    User / Scraper
                  </text>
                  <rect x="15" y="68" width="100" height="36" rx="6" fill={isLight ? '#f0f9ff' : '#0c4a6e'} />
                  <text x="65" y="85" textAnchor="middle" fill="#0284c7" fontSize="10" fontWeight="bold" fontFamily="monospace">
                    GET /checkout
                  </text>
                  <text x="65" y="97" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    Auth: Bearer Key
                  </text>
                </g>

                {/* NODE 2: API GATEWAY (Middle-Left) */}
                <g transform="translate(220, 135)" filter="url(#rl-shadow)">
                  <rect
                    x="0"
                    y="0"
                    width="150"
                    height="150"
                    rx="14"
                    fill={cardBg}
                    stroke={isRateLimited ? dangerRed : '#34d399'}
                    strokeWidth={isRateLimited ? '4' : '3'}
                    className="transition-all duration-300"
                  />
                  <text x="75" y="30" textAnchor="middle" fill={textPrimary} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                    API Gateway
                  </text>
                  <text x="75" y="48" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Envoy / Nginx Edge
                  </text>

                  {/* Middleware Badge */}
                  <rect x="15" y="62" width="120" height="30" rx="6" fill={isLight ? '#f1f5f9' : '#1e293b'} />
                  <text x="75" y="81" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Lua Filter Hook
                  </text>

                  {/* Status Banner */}
                  <rect
                    x="15"
                    y="102"
                    width="120"
                    height="32"
                    rx="6"
                    fill={isRateLimited ? (isLight ? '#fee2e2' : '#7f1d1d') : (isLight ? '#dcfce7' : '#064e3b')}
                  />
                  <text
                    x="75"
                    y="122"
                    textAnchor="middle"
                    fill={isRateLimited ? dangerRed : '#10b981'}
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {isRateLimited ? '429 SHEDDING' : 'ALLOW (200)'}
                  </text>
                </g>

                {/* NODE 3: THE TOKEN BUCKET VESSEL (Center) */}
                <g transform="translate(430, 90)" filter="url(#rl-shadow)">
                  {/* Bucket Outer Vessel */}
                  <rect x="0" y="0" width="180" height="240" rx="16" fill={cardBg} stroke={tokenGold} strokeWidth="3" />
                  <text x="90" y="30" textAnchor="middle" fill={textPrimary} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                    Token Bucket
                  </text>
                  <text x="90" y="48" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Redis: rate_limit:user_id
                  </text>

                  {/* Capacity Marker */}
                  <text x="90" y="68" textAnchor="middle" fill={tokenGold} fontSize="11" fontWeight="bold" fontFamily="monospace">
                    Capacity: 5 · +1/sec
                  </text>

                  {/* The 5 Token Slots inside the bucket */}
                  <g transform="translate(25, 80)">
                    {[4, 3, 2, 1, 0].map((slotIdx) => {
                      const hasToken = availableTokens > slotIdx
                      return (
                        <g key={slotIdx} transform={`translate(0, ${slotIdx * 24})`}>
                          <rect
                            x="0"
                            y="0"
                            width="130"
                            height="20"
                            rx="10"
                            fill={hasToken ? tokenGold : isLight ? '#e2e8f0' : '#1e293b'}
                            stroke={hasToken ? '#d97706' : '#475569'}
                            strokeWidth="1.5"
                            className="transition-all duration-300"
                          />
                          <text
                            x="65"
                            y="14"
                            textAnchor="middle"
                            fill={hasToken ? '#78350f' : textSecondary}
                            fontSize="10"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {hasToken ? `TOKEN #${slotIdx + 1}` : 'EMPTY (ACCELERATING)'}
                          </text>
                        </g>
                      )
                    })}
                  </g>

                  {/* Bottom Counter */}
                  <text x="90" y="224" textAnchor="middle" fill={availableTokens === 0 ? dangerRed : '#10b981'} fontSize="11" fontWeight="bold" fontFamily="monospace">
                    {availableTokens > 0 ? `${availableTokens} Tokens Available` : '0 TOKENS (THROTTLED)'}
                  </text>
                </g>

                {/* NODE 4: DOWNSTREAM ORIGIN SERVICES (Right) */}
                <g transform="translate(670, 140)" filter="url(#rl-shadow)">
                  <rect x="0" y="0" width="170" height="140" rx="14" fill={cardBg} stroke="#10b981" strokeWidth="3" />
                  <text x="85" y="30" textAnchor="middle" fill={textPrimary} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                    Origin Service
                  </text>
                  <text x="85" y="48" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    PostgreSQL / Payment API
                  </text>

                  {/* Protected State */}
                  <rect x="15" y="65" width="140" height="55" rx="8" fill={isLight ? '#f0fdf4' : '#064e3b'} />
                  <text x="85" y="88" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    100% HEALTHY
                  </text>
                  <text x="85" y="105" textAnchor="middle" fill={isLight ? '#166534' : '#a7f3d0'} fontSize="9" fontFamily="monospace">
                    Zero Crash / No Overload
                  </text>
                </g>

                {/* RATE LIMIT 429 BANNER */}
                {isRateLimited && (
                  <g transform="translate(270, 15)">
                    <rect x="0" y="0" width="340" height="65" rx="12" fill={isLight ? '#fef2f2' : '#450a0a'} stroke={dangerRed} strokeWidth="2.5" />
                    <text x="170" y="26" textAnchor="middle" fill={dangerRed} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                      ⚡ HTTP 429: TOKEN BUCKET DEPLETED
                    </text>
                    <text x="170" y="46" textAnchor="middle" fill={isLight ? '#991b1b' : '#fca5a5'} fontSize="10" fontFamily="monospace">
                      Retry-After: 30s · X-RateLimit-Remaining: 0
                    </text>
                    <text x="170" y="58" textAnchor="middle" fill={isLight ? '#7f1d1d' : '#fecaca'} fontSize="9" fontFamily="sans-serif">
                      Gateway short-circuits in &lt;1.5ms. Downstream DB protected!
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
