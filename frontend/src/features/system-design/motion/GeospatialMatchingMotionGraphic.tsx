import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Flame, Users } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function GeospatialMatchingMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [strategyMode, setStrategyMode] = useState<'h3_hex' | 'sql_crash' | 'double_dispatch'>('h3_hex')

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
  let kRingExpanded = false
  let lockAcquired = false
  let isSqlCrashed = false
  let isDoubleDispatched = false

  if (currentTime < 3.0) {
    subtitle = '0.0s - 3.0s: Ingress. 250,000 GPS pings/sec mapped to 64-bit Uber H3 Hexagon cells. O(1) in-memory spatial index in Redis.'
    metrics = [
      { label: 'GPS Ingestion', value: '250,000 pings/sec', variant: 'default' },
      { label: 'Spatial Index', value: 'Uber H3 Res 8 (~460m)', variant: 'success' },
      { label: 'Active Drivers', value: '1,000,000 in memory', variant: 'success' },
      { label: 'Cell Geometry', value: 'Hexagonal (Equidistant)', variant: 'success' },
    ]
  } else if (currentTime < 6.0) {
    kRingExpanded = true
    if (strategyMode === 'sql_crash') {
      isSqlCrashed = true
      subtitle = '3.0s - 6.0s: SQL CRASH. Naive 2D B-Tree range query locks table. 250k concurrent GPS updates stall. Query latency spikes to 4,800ms!'
      metrics = [
        { label: 'Query Type', value: 'SELECT WHERE lat BETWEEN... lng BETWEEN...', variant: 'danger' },
        { label: 'SQL Lock State', value: 'B-Tree Index Contention', variant: 'danger' },
        { label: 'Query Latency', value: '4,850 ms (TIMEOUT)', variant: 'danger' },
        { label: 'System Health', value: 'DATABASE FROZEN', variant: 'danger' },
      ]
    } else {
      subtitle = '3.0s - 6.0s: Rider Request. Rider pings at Terminal 2. System queries origin hex (k=0) and expands to k=1 ring (6 neighbor hexes) in 2ms.'
      metrics = [
        { label: 'Rider Request', value: 'Origin Hex 882685...', variant: 'default' },
        { label: 'k-Ring Expansion', value: 'k=1 (6 Hexagons)', variant: 'success' },
        { label: 'Candidate Cabs', value: '5 Nearby Drivers Found', variant: 'success' },
        { label: 'Search Latency', value: '1.8 ms (Redis Hash)', variant: 'success' },
      ]
    }
  } else if (currentTime < 9.0) {
    kRingExpanded = true
    if (strategyMode === 'sql_crash') {
      isSqlCrashed = true
      subtitle = '6.0s - 9.0s: CASCADING OUTAGE. Connection pool exhausted. Ride requests fail globally. App shows "No Cabs Available".'
      metrics = [
        { label: 'PostgreSQL Status', value: '100% CPU Lockup', variant: 'danger' },
        { label: 'Dropped Requests', value: '18,400 Riders Stranded', variant: 'danger' },
        { label: 'B-Tree Fragmentation', value: 'Severe Index Thrashing', variant: 'danger' },
        { label: 'Root Cause', value: 'SQL Range on Moving Objects', variant: 'danger' },
      ]
    } else if (strategyMode === 'double_dispatch') {
      isDoubleDispatched = true
      subtitle = '6.0s - 9.0s: RACE CONDITION! Without atomic locks, Rider A & B both claim Driver #402. Dual push notifications sent for single vehicle!'
      metrics = [
        { label: 'Concurrency Conflict', value: '2 Riders at Same Terminal', variant: 'danger' },
        { label: 'Dispatch Lock', value: 'DISABLED (Race Condition)', variant: 'danger' },
        { label: 'Driver Assigned', value: 'Driver #402 (DOUBLE-BOOKED)', variant: 'danger' },
        { label: 'Customer Impact', value: 'Severe Dispute / Churn', variant: 'danger' },
      ]
    } else {
      lockAcquired = true
      subtitle = '6.0s - 9.0s: Atomic Dispatch Lock. Redis "SET driver_lock:402 rider_A NX EX 15" locks driver for Rider A. Rider B instantly routed to next nearest cab.'
      metrics = [
        { label: 'Selected Driver', value: 'Driver #402 (ETA 2 min)', variant: 'success' },
        { label: 'Atomic Lock', value: 'SET NX EX 15 (Acquired)', variant: 'success' },
        { label: 'Competing Rider', value: 'Rider B -> Driver #882', variant: 'success' },
        { label: 'Double-Booking', value: 'Zero Collisions', variant: 'success' },
      ]
    }
  } else {
    kRingExpanded = true
    if (strategyMode === 'sql_crash') {
      isSqlCrashed = true
      subtitle = '9.0s - 12.0s: Architectural Verdict. Relational databases cannot handle high-throughput moving coordinate streams. Uber H3 in-memory indexing is mandatory.'
      metrics = [
        { label: 'Verdict', value: 'SQL B-Tree Failed', variant: 'danger' },
        { label: 'Solution', value: 'Migrate to Uber H3 Hexagons', variant: 'warning' },
        { label: 'Memory Footprint', value: '64-bit Ints (Compact)', variant: 'default' },
        { label: 'Availability', value: 'Restored upon Failover', variant: 'default' },
      ]
    } else if (strategyMode === 'double_dispatch') {
      isDoubleDispatched = true
      subtitle = '9.0s - 12.0s: Post-Mortem. Distributed state systems require atomic distributed locks with TTL leases (Redis SET NX) to guarantee mutual exclusion.'
      metrics = [
        { label: 'Flaw', value: 'Missing Mutual Exclusion', variant: 'danger' },
        { label: 'Fix', value: 'Enforce Redis SET NX EX 15', variant: 'success' },
        { label: 'Lease Safety', value: 'Auto-release on Crash', variant: 'success' },
        { label: 'State Invariant', value: '1 Driver <=> 1 Active Trip', variant: 'success' },
      ]
    } else {
      lockAcquired = true
      subtitle = '9.0s - 12.0s: Trip Dispatched in 118ms! Real-time H3 hexagonal density calculates dynamic surge pricing (1.4x). Driver navigation en route.'
      metrics = [
        { label: 'Dispatch Latency', value: '118 ms (SLA < 150ms)', variant: 'success' },
        { label: 'Trip Confirmed', value: 'Driver #402 En Route', variant: 'success' },
        { label: 'Hex Surge Multiplier', value: '1.4x (High Demand)', variant: 'warning' },
        { label: 'Architecture Grade', value: 'WORLD CLASS (Tier 1)', variant: 'success' },
      ]
    }
  }

  // Visual coordinates for Hexagon Center and 6 Neighbors
  const hexRadius = 48
  const mapCenterX = 415
  const mapCenterY = 245

  // Helper to generate regular hexagon SVG polygon points
  const getHexPoints = (cx: number, cy: number, r: number) => {
    const points = []
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 * Math.PI) / 180
      points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`)
    }
    return points.join(' ')
  }

  // 6 Neighbor hex centers: distance is sqrt(3) * r ≈ 1.732 * r
  const neighborDist = Math.sqrt(3) * hexRadius
  const neighborCenters = [
    { x: mapCenterX, cy: mapCenterY - neighborDist, label: 'Hex 1' },
    { x: mapCenterX + (neighborDist * Math.sqrt(3)) / 2, cy: mapCenterY - neighborDist / 2, label: 'Hex 2' },
    { x: mapCenterX + (neighborDist * Math.sqrt(3)) / 2, cy: mapCenterY + neighborDist / 2, label: 'Hex 3' },
    { x: mapCenterX, cy: mapCenterY + neighborDist, label: 'Hex 4' },
    { x: mapCenterX - (neighborDist * Math.sqrt(3)) / 2, cy: mapCenterY + neighborDist / 2, label: 'Hex 5' },
    { x: mapCenterX - (neighborDist * Math.sqrt(3)) / 2, cy: mapCenterY - neighborDist / 2, label: 'Hex 6' },
  ]

  return (
    <div className="w-full space-y-4">
      <MotionGraphicPlayer
        title="Geospatial Driver-Rider Matching Engine (Uber H3)"
        subtitle="12-Second Slow Walkthrough · Uber H3 Hexagonal Spatial Indexing, k-Ring Expansion & Atomic Distributed Locks"
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
              onClick={() => { setStrategyMode('h3_hex'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'h3_hex'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>H3 Hexagons + Lock (Safe)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('sql_crash'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'sql_crash'
                  ? 'bg-rose-950/50 text-rose-300 font-bold border border-rose-600/60 shadow-xs'
                  : 'text-muted hover:text-rose-300'
              }`}
            >
              <Flame size={12} />
              <span>SQL 2D Scan (Crash)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('double_dispatch'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'double_dispatch'
                  ? 'bg-amber-950/50 text-amber-300 font-bold border border-amber-600/60 shadow-xs'
                  : 'text-muted hover:text-amber-300'
              }`}
            >
              <Users size={12} />
              <span>Double-Dispatch (Conflict)</span>
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
          const h3Cyan = '#06b6d4'
          const taxiGreen = '#10b981'
          const dangerRed = '#ef4444'
          const riderBlue = '#3b82f6'

          return (
            <div className="relative w-full aspect-[16/10] max-w-[860px] mx-auto py-2">
              <svg viewBox="0 0 880 500" className="w-full h-full transition-all duration-300">
                <defs>
                  <filter id="geo-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity={isLight ? '0.1' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* ==================== INGESTION & REDIS (Left) ==================== */}
                <g transform="translate(25, 120)" filter="url(#geo-shadow)">
                  <rect x="0" y="0" width="165" height="260" rx="14" fill={cardBg} stroke={h3Cyan} strokeWidth="3" />
                  <text x="82" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Location Ingestion
                  </text>
                  <text x="82" y="44" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    250k GPS writes / sec
                  </text>

                  {/* Lat/Lng Conversion Box */}
                  <g transform="translate(12, 58)">
                    <rect x="0" y="0" width="140" height="60" rx="6" fill={isLight ? '#ecfeff' : '#083344'} stroke={h3Cyan} strokeWidth="1" />
                    <text x="10" y="18" fill={h3Cyan} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      (Lat, Lng) → H3 Index
                    </text>
                    <text x="10" y="34" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      8826856235fffff
                    </text>
                    <text x="10" y="48" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      20ns pure CPU bit-shift
                    </text>
                  </g>

                  {/* Redis Spatial Store Box */}
                  <g transform="translate(12, 130)">
                    <rect
                      x="0"
                      y="0"
                      width="140"
                      height="65"
                      rx="6"
                      fill={isSqlCrashed ? (isLight ? '#fee2e2' : '#450a0a') : (isLight ? '#f8fafc' : '#1e293b')}
                      stroke={isSqlCrashed ? dangerRed : cardBorder}
                      strokeWidth="1.5"
                    />
                    <text x="70" y="18" textAnchor="middle" fill={isSqlCrashed ? dangerRed : textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      {isSqlCrashed ? 'SQL B-TREE CRASH' : 'REDIS IN-MEMORY'}
                    </text>
                    <text x="70" y="36" textAnchor="middle" fill={isSqlCrashed ? dangerRed : taxiGreen} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {isSqlCrashed ? '4,850ms Lockup' : 'k-Ring: 1.8ms'}
                    </text>
                    <text x="70" y="52" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      {isSqlCrashed ? '2D range scan dead' : 'H3 Hash Store'}
                    </text>
                  </g>

                  <rect x="12" y="206" width="140" height="40" rx="6" fill={isLight ? '#ecfdf5' : '#064e3b'} />
                  <text x="70" y="224" textAnchor="middle" fill={taxiGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    Equidistant Neighbors
                  </text>
                  <text x="70" y="238" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    Zero Square Distortion
                  </text>
                </g>

                {/* ==================== THE UBER H3 HEXAGONAL MAP (Center) ==================== */}
                <g id="h3-map">
                  {/* Outer Concentric Radar Pulse when expanding k-ring */}
                  {kRingExpanded && isPlaying && (
                    <circle
                      cx={mapCenterX}
                      cy={mapCenterY}
                      r={hexRadius * 2.5}
                      fill="none"
                      stroke={h3Cyan}
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="animate-pulse"
                    />
                  )}

                  {/* 6 Neighbor Hexagons (k=1 Ring) */}
                  {neighborCenters.map((nc, idx) => (
                    <g key={idx}>
                      <polygon
                        points={getHexPoints(nc.x, nc.cy, hexRadius - 2)}
                        fill={kRingExpanded ? (isLight ? '#f0fdfa' : '#042f2e') : cardBg}
                        stroke={kRingExpanded ? h3Cyan : cardBorder}
                        strokeWidth="2"
                        className="transition-colors duration-500"
                      />
                      <text x={nc.x} y={nc.cy - 18} textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="monospace">
                        {nc.label}
                      </text>
                    </g>
                  ))}

                  {/* Center Hexagon (k=0, Rider's Pickup Location) */}
                  <polygon
                    points={getHexPoints(mapCenterX, mapCenterY, hexRadius - 2)}
                    fill={isLight ? '#eff6ff' : '#1e3a8a'}
                    stroke={riderBlue}
                    strokeWidth="3.5"
                  />
                  <text x={mapCenterX} y={mapCenterY - 20} textAnchor="middle" fill={riderBlue} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                    Origin (k=0)
                  </text>

                  {/* RIDER AVATAR PIN */}
                  <g transform={`translate(${mapCenterX}, ${mapCenterY})`}>
                    <circle cx="0" cy="0" r="14" fill={riderBlue} />
                    <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      Rider
                    </text>
                    <text x="0" y="22" textAnchor="middle" fill={riderBlue} fontSize="8" fontWeight="bold" fontFamily="monospace">
                      Terminal 2
                    </text>
                  </g>

                  {/* DRIVER CABS POSITIONED IN HEXAGONS */}

                  {/* Driver #402 in Hex 1 (Closest, ETA 2m) */}
                  <g transform={`translate(${neighborCenters[0].x}, ${neighborCenters[0].cy})`}>
                    <rect
                      x="-38"
                      y="-12"
                      width="76"
                      height="24"
                      rx="6"
                      fill={isDoubleDispatched ? dangerRed : (lockAcquired ? taxiGreen : '#f59e0b')}
                    />
                    <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace">
                      Cab #402 (2m)
                    </text>
                    {lockAcquired && (
                      <circle cx="32" cy="0" r="4" fill="#ffffff" />
                    )}
                  </g>

                  {/* Driver #882 in Hex 2 (2nd Closest, ETA 4m) */}
                  <g transform={`translate(${neighborCenters[1].x}, ${neighborCenters[1].cy})`}>
                    <rect x="-35" y="-12" width="70" height="24" rx="6" fill={cardBg} stroke={taxiGreen} strokeWidth="1.5" />
                    <text x="0" y="4" textAnchor="middle" fill={taxiGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      Cab #882 (4m)
                    </text>
                  </g>

                  {/* Driver #104 in Hex 5 (ETA 6m) */}
                  <g transform={`translate(${neighborCenters[4].x}, ${neighborCenters[4].cy})`}>
                    <rect x="-35" y="-12" width="70" height="24" rx="6" fill={cardBg} stroke={taxiGreen} strokeWidth="1.5" />
                    <text x="0" y="4" textAnchor="middle" fill={taxiGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      Cab #104 (6m)
                    </text>
                  </g>

                  {/* Dispatch Match Vector Line (Rider -> Cab #402) */}
                  {kRingExpanded && !isSqlCrashed && (
                    <path
                      d={`M ${mapCenterX} ${mapCenterY - 14} L ${neighborCenters[0].x} ${neighborCenters[0].cy + 12}`}
                      fill="none"
                      stroke={isDoubleDispatched ? dangerRed : taxiGreen}
                      strokeWidth="3.5"
                      strokeDasharray={isDoubleDispatched ? '4 4' : 'none'}
                    />
                  )}
                </g>

                {/* ==================== DISPATCH ENGINE & DISTRIBUTED LOCK (Right) ==================== */}
                <g transform="translate(670, 110)" filter="url(#geo-shadow)">
                  <rect
                    x="0"
                    y="0"
                    width="185"
                    height="280"
                    rx="14"
                    fill={cardBg}
                    stroke={lockAcquired ? taxiGreen : (isDoubleDispatched ? dangerRed : cardBorder)}
                    strokeWidth={lockAcquired || isDoubleDispatched ? '3' : '1.5'}
                  />
                  <text x="92" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Dispatch Engine
                  </text>
                  <text x="92" y="44" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Atomic Mutex Lock
                  </text>

                  {/* Redis SET NX Distributed Lock Box */}
                  <g transform="translate(12, 58)">
                    <rect
                      x="0"
                      y="0"
                      width="160"
                      height="75"
                      rx="8"
                      fill={lockAcquired ? (isLight ? '#ecfdf5' : '#064e3b') : (isDoubleDispatched ? (isLight ? '#fee2e2' : '#450a0a') : (isLight ? '#f8fafc' : '#1e293b'))}
                      stroke={lockAcquired ? taxiGreen : (isDoubleDispatched ? dangerRed : cardBorder)}
                      strokeWidth="1.5"
                    />
                    <text x="10" y="18" fill={lockAcquired ? taxiGreen : (isDoubleDispatched ? dangerRed : textPrimary)} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      SET driver_lock:402
                    </text>
                    <text x="10" y="34" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      NX EX 15 (15s Lease)
                    </text>
                    <text x="10" y="50" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      {isDoubleDispatched ? 'COLLISION: Double Dispatched' : (lockAcquired ? 'Locked to: Rider A' : 'Pending Bid')}
                    </text>
                    <text x="10" y="66" fill={lockAcquired ? taxiGreen : textSecondary} fontSize="8" fontWeight="bold" fontFamily="monospace">
                      {lockAcquired ? '✓ Mutual Exclusion OK' : 'Waiting on Dispatch'}
                    </text>
                  </g>

                  {/* Surge Pricing Heatmap Calculator */}
                  <g transform="translate(12, 145)">
                    <rect x="0" y="0" width="160" height="70" rx="8" fill={isLight ? '#fffbeb' : '#291e0a'} stroke="#f59e0b" strokeWidth="1" />
                    <text x="10" y="18" fill="#f59e0b" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      Hex Cell Surge Model
                    </text>
                    <text x="10" y="36" fill="#f59e0b" fontSize="12" fontWeight="bold" fontFamily="monospace">
                      Surge: 1.4x Multiplier
                    </text>
                    <text x="10" y="52" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      Rider/Driver Demand: 18 / 5
                    </text>
                  </g>

                  <rect x="12" y="228" width="160" height="38" rx="6" fill={isLight ? '#f0fdf4' : '#052e16'} />
                  <text x="80" y="246" textAnchor="middle" fill={taxiGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    Match Latency: 118ms
                  </text>
                  <text x="80" y="258" textAnchor="middle" fill={textSecondary} fontSize="7" fontFamily="sans-serif">
                    Zero Double-Dispatch Error
                  </text>
                </g>

                {/* OVERLAY WARNING: SQL 2D B-TREE CRASH */}
                {isSqlCrashed && (
                  <g transform="translate(230, 420)">
                    <rect x="0" y="0" width="420" height="58" rx="10" fill={isLight ? '#fef2f2' : '#450a0a'} stroke={dangerRed} strokeWidth="2.5" />
                    <text x="210" y="22" textAnchor="middle" fill={dangerRed} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                      🚨 DATABASE COLLAPSE: 2D SQL Range Scan Lock
                    </text>
                    <text x="210" y="38" textAnchor="middle" fill={isLight ? '#991b1b' : '#fca5a5'} fontSize="10" fontFamily="monospace">
                      Continuous GPS UPDATEs deadlocked B-Tree index. 4.8s query timeout!
                    </text>
                    <text x="210" y="50" textAnchor="middle" fill={isLight ? '#7f1d1d' : '#fecaca'} fontSize="8" fontFamily="sans-serif">
                      Fix: Uber H3 converts 2D spatial search into O(1) integer hash lookups.
                    </text>
                  </g>
                )}

                {/* OVERLAY WARNING: DOUBLE DISPATCH RACE CONDITION */}
                {isDoubleDispatched && (
                  <g transform="translate(230, 420)">
                    <rect x="0" y="0" width="420" height="58" rx="10" fill={isLight ? '#fee2e2' : '#450a0a'} stroke={dangerRed} strokeWidth="2.5" />
                    <text x="210" y="22" textAnchor="middle" fill={dangerRed} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                      ⚠️ RACE CONDITION: Double Dispatch Conflict
                    </text>
                    <text x="210" y="38" textAnchor="middle" fill={isLight ? '#991b1b' : '#fca5a5'} fontSize="10" fontFamily="monospace">
                      Both riders claimed Driver #402 without Redis SET NX atomic lock!
                    </text>
                    <text x="210" y="50" textAnchor="middle" fill={isLight ? '#7f1d1d' : '#fecaca'} fontSize="8" fontFamily="sans-serif">
                      Fix: Enforce 15-second distributed lease lock before driver assignment.
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