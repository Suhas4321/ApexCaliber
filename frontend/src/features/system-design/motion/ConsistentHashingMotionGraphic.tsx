import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Flame, RefreshCw } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function ConsistentHashingMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [strategyMode, setStrategyMode] = useState<'consistent_ring' | 'modulo_crash' | 'single_flight'>('consistent_ring')

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

  // Calculate narrative, states & metrics based on time and mode
  let subtitle = ''
  let metrics: { label: string; value: string; variant?: 'default' | 'success' | 'warning' | 'danger' }[] = []
  let isNodeCCrashed = false
  let isModuloStampede = false
  let isSingleFlightActive = false

  if (currentTime < 3.0) {
    subtitle = '0.0s - 3.0s: Consistent Hash Ring. 4 physical nodes (A, B, C, D) mapped to 150 virtual nodes on a 0..2^32 circular space. Keys route clockwise.'
    metrics = [
      { label: 'Topology', value: '4 Nodes (600 Vnodes)', variant: 'default' },
      { label: 'Key Distribution', value: 'MurmurHash3 (Uniform)', variant: 'success' },
      { label: 'Cache Hit Rate', value: '99.6% (Hot)', variant: 'success' },
      { label: 'DB Query Rate', value: '0.4% (Bounded)', variant: 'default' },
    ]
  } else if (currentTime < 6.0) {
    isNodeCCrashed = true
    if (strategyMode === 'modulo_crash') {
      isModuloStampede = true
      subtitle = '3.0s - 6.0s: MODULO SHARDING DISASTER. Node C dies. N changes from 4 to 3. hash(k)%3 invalidates 75% of ALL keys across entire cluster!'
      metrics = [
        { label: 'Node Failure', value: 'Node C Crashed (Hardware)', variant: 'danger' },
        { label: 'Modulo Sharding', value: 'hash(key) % 3 (Shifted)', variant: 'danger' },
        { label: 'Keys Invalidated', value: '75.2% Total Cache Miss', variant: 'danger' },
        { label: 'Database Status', value: 'THUNDERING HERD CRASH', variant: 'danger' },
      ]
    } else if (strategyMode === 'single_flight') {
      isSingleFlightActive = true
      subtitle = '3.0s - 6.0s: Viral Key Expiry! Key "virat_profile" TTL expires. 5,000 concurrent client requests miss cache simultaneously.'
      metrics = [
        { label: 'Cache Event', value: 'Hot Key TTL Expired', variant: 'warning' },
        { label: 'Concurrent Misses', value: '5,000 Simultaneous Requests', variant: 'warning' },
        { label: 'Single-Flight Lock', value: 'Leader Elected', variant: 'success' },
        { label: 'DB Queries Sent', value: 'Exactly 1 (Coalesced)', variant: 'success' },
      ]
    } else {
      subtitle = '3.0s - 6.0s: Node C Crashes! Under Consistent Hashing, ONLY keys on Node C arc re-route to Node D. Exactly 1/4 (25%) move. 75% remain untouched!'
      metrics = [
        { label: 'Node Failure', value: 'Node C Offline', variant: 'warning' },
        { label: 'Key Remap Scope', value: '1/N = 25% Keys Only', variant: 'success' },
        { label: 'Unaffected Keys', value: '75% (Nodes A, B, D safe)', variant: 'success' },
        { label: 'Thundering Herd', value: 'Completely Prevented', variant: 'success' },
      ]
    }
  } else if (currentTime < 9.0) {
    isNodeCCrashed = true
    if (strategyMode === 'modulo_crash') {
      isModuloStampede = true
      subtitle = '6.0s - 9.0s: CASCADE COLLAPSE. 375,000 requests/sec stampede PostgreSQL. Connection pool deadlocks; API returns 503 Service Unavailable.'
      metrics = [
        { label: 'DB Connection Pool', value: '1,000 / 1,000 (EXHAUSTED)', variant: 'danger' },
        { label: 'DB CPU Utilization', value: '100% (Locked)', variant: 'danger' },
        { label: 'P99 Latency', value: '18,500 ms (Timeout)', variant: 'danger' },
        { label: 'Root Cause', value: 'hash(key) % N algorithm', variant: 'danger' },
      ]
    } else if (strategyMode === 'single_flight') {
      isSingleFlightActive = true
      subtitle = '6.0s - 9.0s: Broadcast Sharing. Single DB query finishes in 4ms. Result is broadcasted to all 4,999 waiting requests. Cache repopulated!'
      metrics = [
        { label: 'Single-Flight Ingest', value: '1 SQL Fetch Completed', variant: 'success' },
        { label: 'Broadcast Result', value: '5,000 Callers Satisfied', variant: 'success' },
        { label: 'Cache Repopulated', value: 'Key "virat_profile" Warm', variant: 'success' },
        { label: 'Saved DB Queries', value: '4,999 Prevented', variant: 'success' },
      ]
    } else {
      subtitle = '6.0s - 9.0s: Virtual Node Rebalance. The 150 virtual nodes of Node C smoothly distribute their keys across A, B, and D with zero hot spots.'
      metrics = [
        { label: 'Load Distribution', value: 'Uniform Across A, B, D', variant: 'success' },
        { label: 'Cache Hit Rate', value: 'Recovered to 96.5%', variant: 'success' },
        { label: 'Standard Deviation', value: '< 4.2% Key Skew', variant: 'success' },
        { label: 'Latency P99', value: '0.9 ms (Maintained)', variant: 'success' },
      ]
    }
  } else {
    isNodeCCrashed = true
    if (strategyMode === 'modulo_crash') {
      isModuloStampede = true
      subtitle = '9.0s - 12.0s: Post-Mortem. Modulo sharding is strictly banned in modern distributed systems. Consistent Hashing is mandatory for survival.'
      metrics = [
        { label: 'Architecture Verdict', value: 'MODULO IS FATAL', variant: 'danger' },
        { label: 'Total Downtime', value: '14 Minutes Outage', variant: 'danger' },
        { label: 'Remediation', value: 'Deploy Consistent Hash Ring', variant: 'warning' },
        { label: 'Industry Standard', value: 'Amazon Dynamo / Discord', variant: 'default' },
      ]
    } else {
      subtitle = '9.0s - 12.0s: Masterclass Architecture. Consistent Hashing bounds key migration to 1/N. Single-Flight prevents stampedes. 500,000 RPS sustained.'
      metrics = [
        { label: 'Cluster Throughput', value: '500,000 Ops / Sec', variant: 'success' },
        { label: 'Ring Stability', value: 'Self-Healing Topology', variant: 'success' },
        { label: 'Key Movement Bound', value: 'O(K / N)', variant: 'success' },
        { label: 'Production Status', value: 'Bulletproof Reliability', variant: 'success' },
      ]
    }
  }

  // Animation angle for keys orbiting the ring
  const orbitAngle = ((currentTime * 60) % 360) * (Math.PI / 180)
  const ringCenterX = 410
  const ringCenterY = 250
  const ringRadius = 140

  const key1X = ringCenterX + ringRadius * Math.cos(orbitAngle)
  const key1Y = ringCenterY + ringRadius * Math.sin(orbitAngle)
  const key2X = ringCenterX + ringRadius * Math.cos(orbitAngle + Math.PI)
  const key2Y = ringCenterY + ringRadius * Math.sin(orbitAngle + Math.PI)

  return (
    <div className="w-full space-y-4">
      <MotionGraphicPlayer
        title="Distributed In-Memory Cache Cluster & Consistent Hashing"
        subtitle="12-Second Slow Walkthrough · Amazon Dynamo Paper, MurmurHash3, Virtual Nodes & Single-Flight Coalescing"
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
              onClick={() => { setStrategyMode('consistent_ring'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'consistent_ring'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>Consistent Ring (1/N)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('modulo_crash'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'modulo_crash'
                  ? 'bg-rose-950/50 text-rose-300 font-bold border border-rose-600/60 shadow-xs'
                  : 'text-muted hover:text-rose-300'
              }`}
            >
              <Flame size={12} />
              <span>Modulo % N (Crash)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('single_flight'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'single_flight'
                  ? 'bg-indigo-950/50 text-indigo-300 font-bold border border-indigo-600/60 shadow-xs'
                  : 'text-muted hover:text-indigo-300'
              }`}
            >
              <RefreshCw size={12} />
              <span>Single-Flight (Stampede Guard)</span>
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
          const ringStroke = isLight ? '#cbd5e1' : '#334155'
          const nodeABlue = '#38bdf8'
          const nodeBGreen = '#10b981'
          const nodeCAmber = '#f59e0b'
          const nodeDPurple = '#a855f7'
          const dangerRed = '#ef4444'

          return (
            <div className="relative w-full aspect-[16/10] max-w-[860px] mx-auto py-2">
              <svg viewBox="0 0 880 500" className="w-full h-full transition-all duration-300">
                <defs>
                  <marker id="ch-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={nodeABlue} />
                  </marker>
                  <filter id="ch-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity={isLight ? '0.1' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* ==================== INGRESS CLIENT & KEY HASHER (Left) ==================== */}
                <g transform="translate(25, 120)" filter="url(#ch-shadow)">
                  <rect x="0" y="0" width="160" height="260" rx="14" fill={cardBg} stroke={nodeABlue} strokeWidth="3" />
                  <text x="80" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Client Ingress
                  </text>
                  <text x="80" y="44" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    500,000 Ops / Sec
                  </text>

                  {/* MurmurHash3 Card */}
                  <g transform="translate(12, 58)">
                    <rect x="0" y="0" width="136" height="64" rx="6" fill={isLight ? '#f0f9ff' : '#0c4a6e'} stroke="#0284c7" strokeWidth="1" />
                    <text x="10" y="18" fill="#0284c7" fontSize="9" fontWeight="bold" fontFamily="monospace">
                      MurmurHash3(key)
                    </text>
                    <text x="10" y="34" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      key1 → 0x3F81 (Node A)
                    </text>
                    <text x="10" y="48" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      key2 → 0x9A20 (Node C)
                    </text>
                  </g>

                  {/* Routing Rule Box */}
                  <g transform="translate(12, 132)">
                    <rect
                      x="0"
                      y="0"
                      width="136"
                      height="65"
                      rx="6"
                      fill={isModuloStampede ? (isLight ? '#fee2e2' : '#450a0a') : (isLight ? '#f8fafc' : '#1e293b')}
                      stroke={isModuloStampede ? dangerRed : cardBorder}
                      strokeWidth="1.5"
                    />
                    <text x="68" y="18" textAnchor="middle" fill={isModuloStampede ? dangerRed : textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      {isModuloStampede ? 'CRITICAL MODULO' : 'CLOCKWISE WALK'}
                    </text>
                    <text x="68" y="36" textAnchor="middle" fill={isModuloStampede ? dangerRed : nodeBGreen} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {isModuloStampede ? 'hash(k) % 3' : 'First Node >= Hash'}
                    </text>
                    <text x="68" y="52" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      {isModuloStampede ? '75% keys invalidated!' : 'Binary Search O(log V)'}
                    </text>
                  </g>

                  <rect x="12" y="208" width="136" height="38" rx="6" fill={isLight ? '#ecfdf5' : '#064e3b'} />
                  <text x="68" y="226" textAnchor="middle" fill={nodeBGreen} fontSize="10" fontWeight="bold" fontFamily="monospace">
                    Vnodes = 150/host
                  </text>
                  <text x="68" y="238" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    Zero Key Skew
                  </text>
                </g>

                {/* ==================== THE CONSISTENT HASH RING (Center) ==================== */}
                <g id="hash-ring">
                  {/* Outer Circular Ring (0 to 2^32 - 1) */}
                  <circle
                    cx={ringCenterX}
                    cy={ringCenterY}
                    r={ringRadius}
                    fill="none"
                    stroke={ringStroke}
                    strokeWidth="6"
                    strokeDasharray="6 6"
                  />

                  {/* 0 and 2^32 ring labels */}
                  <text x={ringCenterX} y={ringCenterY - ringRadius - 12} textAnchor="middle" fill={textSecondary} fontSize="10" fontWeight="bold" fontFamily="monospace">
                    0 / 2^32 - 1
                  </text>
                  <text x={ringCenterX + ringRadius + 14} y={ringCenterY + 4} textAnchor="start" fill={textSecondary} fontSize="9" fontFamily="monospace">
                    2^30
                  </text>
                  <text x={ringCenterX} y={ringCenterY + ringRadius + 22} textAnchor="middle" fill={textSecondary} fontSize="9" fontFamily="monospace">
                    2^31
                  </text>
                  <text x={ringCenterX - ringRadius - 14} y={ringCenterY + 4} textAnchor="end" fill={textSecondary} fontSize="9" fontFamily="monospace">
                    3·2^30
                  </text>

                  {/* Clockwise Directional Vector Arrow */}
                  <path
                    d={`M ${ringCenterX - 20} ${ringCenterY - ringRadius} A ${ringRadius} ${ringRadius} 0 0 1 ${ringCenterX + 20} ${ringCenterY - ringRadius}`}
                    fill="none"
                    stroke={nodeABlue}
                    strokeWidth="4"
                    markerEnd="url(#ch-arrow-blue)"
                  />

                  {/* ==================== 4 PHYSICAL NODES ON RING ==================== */}

                  {/* NODE A (Top-Right, ~45 deg) */}
                  <g transform={`translate(${ringCenterX + 100}, ${ringCenterY - 100})`} filter="url(#ch-shadow)">
                    <circle cx="0" cy="0" r="32" fill={cardBg} stroke={nodeABlue} strokeWidth="3.5" />
                    <text x="0" y="4" textAnchor="middle" fill={nodeABlue} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                      Node A
                    </text>
                    <text x="0" y="16" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      150 vnodes
                    </text>
                  </g>

                  {/* NODE B (Bottom-Right, ~135 deg) */}
                  <g transform={`translate(${ringCenterX + 100}, ${ringCenterY + 100})`} filter="url(#ch-shadow)">
                    <circle cx="0" cy="0" r="32" fill={cardBg} stroke={nodeBGreen} strokeWidth="3.5" />
                    <text x="0" y="4" textAnchor="middle" fill={nodeBGreen} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                      Node B
                    </text>
                    <text x="0" y="16" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      150 vnodes
                    </text>
                  </g>

                  {/* NODE C (Bottom-Left, ~225 deg - Fails during simulation!) */}
                  <g transform={`translate(${ringCenterX - 100}, ${ringCenterY + 100})`} filter="url(#ch-shadow)">
                    <circle
                      cx="0"
                      cy="0"
                      r="32"
                      fill={isNodeCCrashed ? (isLight ? '#fee2e2' : '#450a0a') : cardBg}
                      stroke={isNodeCCrashed ? dangerRed : nodeCAmber}
                      strokeWidth="3.5"
                      strokeDasharray={isNodeCCrashed ? '4 4' : 'none'}
                    />
                    <text x="0" y="4" textAnchor="middle" fill={isNodeCCrashed ? dangerRed : nodeCAmber} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                      {isNodeCCrashed ? 'DEAD C' : 'Node C'}
                    </text>
                    <text x="0" y="16" textAnchor="middle" fill={isNodeCCrashed ? dangerRed : textSecondary} fontSize="8" fontFamily="monospace">
                      {isNodeCCrashed ? 'CRASHED' : '150 vnodes'}
                    </text>
                  </g>

                  {/* NODE D (Top-Left, ~315 deg) */}
                  <g transform={`translate(${ringCenterX - 100}, ${ringCenterY - 100})`} filter="url(#ch-shadow)">
                    <circle cx="0" cy="0" r="32" fill={cardBg} stroke={nodeDPurple} strokeWidth="3.5" />
                    <text x="0" y="4" textAnchor="middle" fill={nodeDPurple} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                      Node D
                    </text>
                    <text x="0" y="16" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      150 vnodes
                    </text>
                  </g>

                  {/* VIRTUAL NODES (Tick Marks Around Circumference) */}
                  {[...Array(16)].map((_, i) => {
                    const angle = (i * 22.5 * Math.PI) / 180
                    const vnodeX = ringCenterX + ringRadius * Math.cos(angle)
                    const vnodeY = ringCenterY + ringRadius * Math.sin(angle)
                    return (
                      <circle
                        key={i}
                        cx={vnodeX}
                        cy={vnodeY}
                        r="3.5"
                        fill={i % 4 === 0 ? nodeABlue : i % 4 === 1 ? nodeBGreen : i % 4 === 2 ? (isNodeCCrashed ? dangerRed : nodeCAmber) : nodeDPurple}
                      />
                    )
                  })}

                  {/* ANIMATED ORBITING KEYS ON RING */}
                  {isPlaying && !isModuloStampede && (
                    <>
                      <g transform={`translate(${key1X}, ${key1Y})`}>
                        <circle cx="0" cy="0" r="7" fill={nodeABlue} stroke="#fff" strokeWidth="1.5" />
                      </g>
                      <g transform={`translate(${key2X}, ${key2Y})`}>
                        <circle cx="0" cy="0" r="7" fill={nodeBGreen} stroke="#fff" strokeWidth="1.5" />
                      </g>
                    </>
                  )}

                  {/* Ring Center Stat Plaque */}
                  <rect
                    x={ringCenterX - 65}
                    y={ringCenterY - 35}
                    width="130"
                    height="70"
                    rx="10"
                    fill={cardBg}
                    stroke={isModuloStampede ? dangerRed : cardBorder}
                    strokeWidth="2"
                    filter="url(#ch-shadow)"
                  />
                  <text x={ringCenterX} y={ringCenterY - 15} textAnchor="middle" fill={textPrimary} fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                    MurmurHash Ring
                  </text>
                  <text
                    x={ringCenterX}
                    y={ringCenterY + 4}
                    textAnchor="middle"
                    fill={isModuloStampede ? dangerRed : nodeBGreen}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {isModuloStampede ? 'MODULO FAILED' : 'Key Move: 1/N'}
                  </text>
                  <text x={ringCenterX} y={ringCenterY + 22} textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    {isNodeCCrashed ? (isModuloStampede ? '75% invalidated' : 'Only 25% shifted to D') : '0..4,294,967,295'}
                  </text>
                </g>

                {/* ==================== SINGLE-FLIGHT COALESCER & DB (Right) ==================== */}
                <g transform="translate(660, 100)" filter="url(#ch-shadow)">
                  <rect x="0" y="0" width="195" height="290" rx="14" fill={cardBg} stroke={isSingleFlightActive ? nodeBGreen : cardBorder} strokeWidth={isSingleFlightActive ? '3' : '1.5'} />
                  <text x="97" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Single-Flight Guard
                  </text>
                  <text x="97" y="44" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Thundering Herd Defense
                  </text>

                  {/* Coalescing Mutex Channel */}
                  <g transform="translate(15, 58)">
                    <rect
                      x="0"
                      y="0"
                      width="165"
                      height="80"
                      rx="8"
                      fill={isSingleFlightActive ? (isLight ? '#ecfdf5' : '#064e3b') : (isLight ? '#f8fafc' : '#1e293b')}
                      stroke={isSingleFlightActive ? nodeBGreen : cardBorder}
                      strokeWidth="1.5"
                    />
                    <text x="12" y="20" fill={isSingleFlightActive ? nodeBGreen : textPrimary} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      Mutex Call Map:
                    </text>
                    <text x="12" y="38" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      &quot;virat_profile&quot; [1 in-flight]
                    </text>
                    <text x="12" y="54" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      4,999 Waiting on channel
                    </text>
                    <text x="12" y="68" fill={nodeBGreen} fontSize="8" fontWeight="bold" fontFamily="monospace">
                      {isSingleFlightActive ? '✓ 4,999 DB Reads Saved' : 'Standby'}
                    </text>
                  </g>

                  {/* PostgreSQL Database Box */}
                  <g transform="translate(15, 150)">
                    <rect
                      x="0"
                      y="0"
                      width="165"
                      height="80"
                      rx="8"
                      fill={isModuloStampede ? (isLight ? '#fee2e2' : '#450a0a') : (isLight ? '#f8fafc' : '#1e293b')}
                      stroke={isModuloStampede ? dangerRed : cardBorder}
                      strokeWidth="1.5"
                    />
                    <text x="12" y="20" fill={isModuloStampede ? dangerRed : textPrimary} fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                      PostgreSQL Relational DB
                    </text>
                    <text
                      x="12"
                      y="38"
                      fill={isModuloStampede ? dangerRed : nodeBGreen}
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {isModuloStampede ? '100% CPU LOCKED' : (isSingleFlightActive ? 'Queries: 1 / 5,000' : 'Load: Normal (50 QPS)')}
                    </text>
                    <text x="12" y="54" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      {isModuloStampede ? '375,000 QPS Thundering Herd' : 'Single-Flight broadcast OK'}
                    </text>
                    <text x="12" y="68" fill={textSecondary} fontSize="7" fontFamily="sans-serif">
                      max_connections = 1000
                    </text>
                  </g>

                  <rect x="15" y="242" width="165" height="36" rx="6" fill={isLight ? '#f0fdf4' : '#052e16'} />
                  <text x="97" y="260" textAnchor="middle" fill={nodeBGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    SLA: P99 &lt; 1.0 ms
                  </text>
                  <text x="97" y="272" textAnchor="middle" fill={textSecondary} fontSize="7" fontFamily="sans-serif">
                    Zero Cache Collapse Risk
                  </text>
                </g>

                {/* OVERLAY WARNING: MODULO THUNDERING HERD */}
                {isModuloStampede && (
                  <g transform="translate(230, 420)">
                    <rect x="0" y="0" width="420" height="58" rx="10" fill={isLight ? '#fef2f2' : '#450a0a'} stroke={dangerRed} strokeWidth="2.5" />
                    <text x="210" y="22" textAnchor="middle" fill={dangerRed} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                      ⚡ THUNDERING HERD COLLAPSE (Modulo Sharding)
                    </text>
                    <text x="210" y="38" textAnchor="middle" fill={isLight ? '#991b1b' : '#fca5a5'} fontSize="10" fontFamily="monospace">
                      Node C crash changed hash(k)%4 to hash(k)%3. 75% cache miss stampede!
                    </text>
                    <text x="210" y="50" textAnchor="middle" fill={isLight ? '#7f1d1d' : '#fecaca'} fontSize="8" fontFamily="sans-serif">
                      Fix: Consistent Hashing limits key movement to exactly 1/N.
                    </text>
                  </g>
                )}

                {/* OVERLAY BANNER: SINGLE-FLIGHT COALESCED */}
                {isSingleFlightActive && (
                  <g transform="translate(230, 420)">
                    <rect x="0" y="0" width="420" height="58" rx="10" fill={isLight ? '#ecfdf5' : '#064e3b'} stroke={nodeBGreen} strokeWidth="2.5" />
                    <text x="210" y="22" textAnchor="middle" fill={nodeBGreen} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                      🛡️ SINGLE-FLIGHT COALESCING ACTIVE
                    </text>
                    <text x="210" y="38" textAnchor="middle" fill={isLight ? '#065f46' : '#a7f3d0'} fontSize="10" fontFamily="monospace">
                      Coalesced 5,000 concurrent cache misses into 1 single database query!
                    </text>
                    <text x="210" y="50" textAnchor="middle" fill={isLight ? '#047857' : '#6ee7b7'} fontSize="8" fontFamily="sans-serif">
                      Zero DB lock contention · Result broadcasted to all 5,000 callers in 4ms
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