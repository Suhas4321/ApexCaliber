import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, AlertTriangle, Lock } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function AcidTransactionsMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [strategyMode, setStrategyMode] = useState<'occ_versioning' | 'lost_update_disaster' | 'pessimistic_lock'>('occ_versioning')

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
  
  // Database live row state
  let currentStock = 10
  let currentVersion = 1
  let clientAStatus: 'IDLE' | 'READING' | 'UPDATING' | 'COMMITTED' = 'IDLE'
  let clientBStatus: 'IDLE' | 'READING' | 'WAITING' | 'UPDATING' | 'REJECTED' | 'RETRYING' | 'COMMITTED' | 'OVERWRITTEN' = 'IDLE'
  let dbLockState: 'UNLOCKED' | 'X_LOCK_CLIENT_A' | 'X_LOCK_CLIENT_B' = 'UNLOCKED'
  let activePacket = ''

  if (currentTime < 3.0) {
    // Act 1: Parallel Read Phase
    clientAStatus = 'READING'
    clientBStatus = 'READING'
    activePacket = 'SELECT stock, version FROM Inventory WHERE id = 1'
    subtitle = 'Act 1 (0.0s – 3.0s): High-concurrency flash sale. Client A & Client B both read snapshot (Stock: 10, Version: 1) without holding locks.'
    metrics = [
      { label: 'DB Row [id=1]', value: 'Stock: 10 | Version: 1', variant: 'default' },
      { label: 'Client A (Order #101)', value: 'Cached Stock: 10 (Ver 1)', variant: 'default' },
      { label: 'Client B (Order #102)', value: 'Cached Stock: 10 (Ver 1)', variant: 'default' },
      { label: 'Isolation Mode', value: strategyMode === 'pessimistic_lock' ? '2PL (Row X-Lock)' : 'Optimistic Concurrency (OCC)', variant: 'default' },
    ]
  } else if (currentTime < 6.0) {
    // Act 2: Client A updates first
    clientAStatus = 'COMMITTED'
    
    if (strategyMode === 'pessimistic_lock') {
      dbLockState = 'X_LOCK_CLIENT_A'
      clientBStatus = 'WAITING'
      currentStock = 8
      currentVersion = 2
      activePacket = 'UPDATE ... SET stock=8 (Holds Exclusive Lock)'
      subtitle = 'Act 2 (3.0s – 6.0s): Client A acquires Row Exclusive Lock (X-Lock). Decrements stock to 8. Client B is suspended in queue waiting for lock.'
      metrics = [
        { label: 'Lock Manager', value: 'X-LOCK held by Client A', variant: 'warning' },
        { label: 'Client A Status', value: 'COMMITTED (Stock 10 -> 8)', variant: 'success' },
        { label: 'Client B Status', value: 'BLOCKED (Waiting for lock)', variant: 'warning' },
        { label: 'Concurrency Latency', value: '+42ms Lock Queuing', variant: 'warning' },
      ]
    } else if (strategyMode === 'lost_update_disaster') {
      currentStock = 8
      currentVersion = 1 // blind update has no version bump
      clientBStatus = 'IDLE'
      activePacket = 'UPDATE Inventory SET stock = 8 WHERE id = 1'
      subtitle = 'Act 2 (3.0s – 6.0s): Blind update without version predicate! Client A writes stock = 8. Client B still holds old snapshot stock = 10.'
      metrics = [
        { label: 'DB Row [id=1]', value: 'Stock: 8 (No Versioning)', variant: 'default' },
        { label: 'Client A (Order #101)', value: 'Wrote Stock = 8', variant: 'success' },
        { label: 'Client B State', value: 'Stale Snapshot (Stock: 10)', variant: 'warning' },
        { label: 'Data Risk', value: 'Pending Blind Overwrite', variant: 'danger' },
      ]
    } else {
      // OCC mode
      currentStock = 8
      currentVersion = 2
      clientBStatus = 'IDLE'
      activePacket = 'UPDATE ... SET stock=8, ver=2 WHERE id=1 AND ver=1'
      subtitle = 'Act 2 (3.0s – 6.0s): Client A commits atomic OCC update WHERE version = 1. Condition matches! Stock updates to 8, version increments to 2.'
      metrics = [
        { label: 'Client A Query', value: 'WHERE id=1 AND version=1', variant: 'default' },
        { label: 'Predicate Match', value: 'MATCH (1 == 1) -> 1 Row Affected', variant: 'success' },
        { label: 'DB Row State', value: 'Stock: 8 | Version: 2', variant: 'success' },
        { label: 'Client A Outcome', value: 'SUCCESS_COMMITTED', variant: 'success' },
      ]
    }
  } else if (currentTime < 9.0) {
    // Act 3: Client B attempts to update
    if (strategyMode === 'lost_update_disaster') {
      currentStock = 7 // 10 - 3, blind overwrite clobbers A's 2-item deduction!
      clientBStatus = 'OVERWRITTEN'
      activePacket = 'UPDATE Inventory SET stock = 7 WHERE id = 1'
      subtitle = 'Act 3 (6.0s – 9.0s): LOST UPDATE DISASTER! Client B writes 10 - 3 = 7, clobbering Client A\'s write! Total 5 items sold, but stock shows 7 instead of 5!'
      metrics = [
        { label: 'Blind Write', value: 'Client B wrote Stock = 7', variant: 'danger' },
        { label: 'Anomaly Detected', value: 'LOST UPDATE (G0 Anomaly)', variant: 'danger' },
        { label: 'Warehouse Mismatch', value: 'Physical sold: 5 | DB sold: 3', variant: 'danger' },
        { label: 'Inventory Integrity', value: 'DATA CORRUPTION (-2 items phantom)', variant: 'danger' },
      ]
    } else if (strategyMode === 'pessimistic_lock') {
      dbLockState = 'X_LOCK_CLIENT_B'
      clientAStatus = 'COMMITTED'
      clientBStatus = 'UPDATING'
      currentStock = 5 // reads 8, writes 8 - 3 = 5
      currentVersion = 3
      activePacket = 'UPDATE ... SET stock = 5 WHERE id = 1'
      subtitle = 'Act 3 (6.0s – 9.0s): Client A commits & releases lock. Client B wakes up, reads latest stock (8), and decrements to 5 under lock.'
      metrics = [
        { label: 'Lock Handoff', value: 'Client A Released -> Client B Acquired', variant: 'default' },
        { label: 'Client B Read', value: 'Fresh Stock: 8 (Serialized)', variant: 'default' },
        { label: 'Client B Write', value: 'Stock 8 - 3 = 5 (Committed)', variant: 'success' },
        { label: 'Lock Overhead', value: 'Zero lost updates, serialized throughput', variant: 'warning' },
      ]
    } else {
      // OCC mode: Collision Detected!
      clientBStatus = 'REJECTED'
      currentStock = 8
      currentVersion = 2
      activePacket = 'UPDATE ... WHERE id=1 AND version=1 (Live ver is 2!)'
      subtitle = 'Act 3 (6.0s – 9.0s): Client B submits update with cached version 1. Predicate fails (live version is 2). Rows affected: 0 — collision averted!'
      metrics = [
        { label: 'Client B Query', value: 'WHERE id=1 AND version=1', variant: 'default' },
        { label: 'Predicate Match', value: 'MISMATCH (1 != 2) -> 0 Rows Affected', variant: 'danger' },
        { label: 'Collision Shield', value: 'REJECTED_STALE_VERSION', variant: 'warning' },
        { label: 'DB Row State', value: 'Stock: 8 | Version: 2 (Untouched)', variant: 'success' },
      ]
    }
  } else {
    // Act 4: Resolution & Final State
    if (strategyMode === 'lost_update_disaster') {
      currentStock = 7
      clientBStatus = 'OVERWRITTEN'
      subtitle = 'Act 4 (9.0s – 12.0s): Audit failure! Without Optimistic Locking (OCC) or 2PL, concurrent writes silently destroy accounting ledger balances.'
      metrics = [
        { label: 'Final DB Stock', value: '7 (Expected: 5)', variant: 'danger' },
        { label: 'Client A Order', value: 'Fulfillment Desync', variant: 'danger' },
        { label: 'Fix Required', value: 'Add `version INT` column & OCC predicate', variant: 'warning' },
        { label: 'ACID Compliance', value: 'FAILED (Consistency Violated)', variant: 'danger' },
      ]
    } else if (strategyMode === 'pessimistic_lock') {
      dbLockState = 'UNLOCKED'
      currentStock = 5
      currentVersion = 3
      clientBStatus = 'COMMITTED'
      subtitle = 'Act 4 (9.0s – 12.0s): Both orders committed safely via Pessimistic Row Locking. Final stock is 5. High consistency, but bottlenecks at high QPS.'
      metrics = [
        { label: 'Final DB Stock', value: '5 (Strictly Consistent)', variant: 'success' },
        { label: 'Lock State', value: 'All X-Locks Released', variant: 'success' },
        { label: 'Tradeoff', value: 'Heavy DB contention under flash-sale traffic', variant: 'warning' },
        { label: 'Throughput', value: 'Serialized (Lower QPS)', variant: 'default' },
      ]
    } else {
      // OCC mode: Retry loop succeeds!
      clientBStatus = 'COMMITTED'
      currentStock = 5
      currentVersion = 3
      activePacket = 'RETRY: UPDATE ... SET stock=5, ver=3 WHERE id=1 AND ver=2'
      subtitle = 'Act 4 (9.0s – 12.0s): Client B detects 0 rows affected, fetches fresh version 2, recomputes 8 - 3 = 5, and commits safely. 100% ACID consistency!'
      metrics = [
        { label: 'Retry Strategy', value: 'Application Backoff & Re-read', variant: 'success' },
        { label: 'Retry Predicate', value: 'WHERE id=1 AND version=2 -> MATCH!', variant: 'success' },
        { label: 'Final DB Stock', value: '5 | Final Version: 3', variant: 'success' },
        { label: 'OCC Benefits', value: 'Zero Locks, Maximum Throughput, Safe Commits', variant: 'success' },
      ]
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      <MotionGraphicPlayer
        title="ACID Transactions & Lost Update Concurrency Control (OCC vs 2PL)"
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
              onClick={() => { setStrategyMode('occ_versioning'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'occ_versioning'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>OCC Versioning (Safe & Fast)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('lost_update_disaster'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'lost_update_disaster'
                  ? 'bg-rose-950/50 text-rose-300 font-bold border border-rose-600/60 shadow-xs'
                  : 'text-muted hover:text-rose-300'
              }`}
            >
              <AlertTriangle size={12} />
              <span>Blind Overwrite (Lost Update)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('pessimistic_lock'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'pessimistic_lock'
                  ? 'bg-amber-950/50 text-amber-300 font-bold border border-amber-600/60 shadow-xs'
                  : 'text-muted hover:text-amber-300'
              }`}
            >
              <Lock size={12} />
              <span>Pessimistic X-Lock (2PL)</span>
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
          const clientABlue = '#06b6d4'
          const clientBPurple = '#a855f7'
          const dbIndigo = '#6366f1'
          const successGreen = '#10b981'
          const dangerRed = '#ef4444'
          const warningAmber = '#f59e0b'

          // Particle interpolation positions along Bezier curves
          // Curve A: Client A (220, 150) -> DB (480, 210)
          // Curve B: Client B (220, 370) -> DB (480, 270)
          const tProgressAct1 = Math.min(1, Math.max(0, (currentTime - 0.5) / 2.0))
          const tProgressAct2 = Math.min(1, Math.max(0, (currentTime - 3.5) / 2.0))
          const tProgressAct3 = Math.min(1, Math.max(0, (currentTime - 6.5) / 2.0))
          const tProgressAct4 = Math.min(1, Math.max(0, (currentTime - 9.5) / 2.0))

          const packetA_X = 220 + (480 - 220) * tProgressAct2
          const packetA_Y = 150 + (210 - 150) * tProgressAct2

          const packetB_X = 220 + (480 - 220) * (currentTime >= 9.0 ? tProgressAct4 : tProgressAct3)
          const packetB_Y = 370 + (270 - 370) * (currentTime >= 9.0 ? tProgressAct4 : tProgressAct3)

          return (
            <div className="relative w-full aspect-[16/10] max-w-[880px] mx-auto py-2">
              <svg viewBox="0 0 900 520" className="w-full h-full transition-all duration-300">
                <defs>
                  <marker id="arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={clientABlue} />
                  </marker>
                  <marker id="arrow-purple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={clientBPurple} />
                  </marker>
                  <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={successGreen} />
                  </marker>
                  <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={dangerRed} />
                  </marker>
                  <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity={isLight ? '0.08' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* ==================== FLOW CONNECTORS (BEZIER CURVES) ==================== */}
                {/* Client A <-> DB path */}
                <path
                  d="M 230 150 C 350 150, 360 210, 480 210"
                  fill="none"
                  stroke={clientAStatus === 'COMMITTED' ? successGreen : clientABlue}
                  strokeWidth={currentTime >= 3.0 && currentTime < 6.0 ? 3 : 2}
                  strokeDasharray={currentTime < 3.0 ? '4 4' : 'none'}
                  opacity={0.7}
                />

                {/* Client B <-> DB path */}
                <path
                  d="M 230 370 C 350 370, 360 270, 480 270"
                  fill="none"
                  stroke={
                    clientBStatus === 'REJECTED'
                      ? dangerRed
                      : clientBStatus === 'COMMITTED'
                      ? successGreen
                      : clientBStatus === 'OVERWRITTEN'
                      ? dangerRed
                      : clientBPurple
                  }
                  strokeWidth={currentTime >= 6.0 ? 3 : 2}
                  strokeDasharray={currentTime < 3.0 ? '4 4' : 'none'}
                  opacity={0.7}
                />

                {/* Flying Packets */}
                {/* Act 1 Read Broadcast Packets (DB -> Clients) */}
                {currentTime < 3.0 && (
                  <>
                    <circle
                      cx={480 - (480 - 230) * tProgressAct1}
                      cy={210 - (210 - 150) * tProgressAct1}
                      r="6"
                      fill={clientABlue}
                      className="animate-pulse"
                    />
                    <circle
                      cx={480 - (480 - 230) * tProgressAct1}
                      cy={270 + (370 - 270) * tProgressAct1}
                      r="6"
                      fill={clientBPurple}
                      className="animate-pulse"
                    />
                  </>
                )}

                {/* Act 2 Client A Update Packet */}
                {currentTime >= 3.0 && currentTime < 6.0 && (
                  <g transform={`translate(${packetA_X}, ${packetA_Y})`}>
                    <circle r="7" fill={clientABlue} filter="url(#card-shadow)" />
                    <rect x="-45" y="-24" width="90" height="18" rx="4" fill={isLight ? '#0891b2' : '#155e75'} />
                    <text x="0" y="-12" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                      SET stock=8, v=2
                    </text>
                  </g>
                )}

                {/* Act 3 Client B Update Packet */}
                {currentTime >= 6.0 && currentTime < 9.0 && (
                  <g transform={`translate(${packetB_X}, ${packetB_Y})`}>
                    <circle
                      r="7"
                      fill={strategyMode === 'lost_update_disaster' ? dangerRed : clientBPurple}
                      filter="url(#card-shadow)"
                    />
                    <rect
                      x="-55"
                      y="-24"
                      width="110"
                      height="18"
                      rx="4"
                      fill={strategyMode === 'lost_update_disaster' ? '#be123c' : isLight ? '#7e22ce' : '#581c87'}
                    />
                    <text x="0" y="-12" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                      {strategyMode === 'lost_update_disaster' ? 'BLIND: SET stock=7' : 'SET stock=7, v=2?'}
                    </text>
                  </g>
                )}

                {/* Act 4 Client B Retry Packet (in OCC mode) */}
                {currentTime >= 9.0 && strategyMode === 'occ_versioning' && (
                  <g transform={`translate(${packetB_X}, ${packetB_Y})`}>
                    <circle r="7" fill={successGreen} filter="url(#card-shadow)" />
                    <rect x="-55" y="-24" width="110" height="18" rx="4" fill={isLight ? '#047857' : '#065f46'} />
                    <text x="0" y="-12" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                      RETRY: stock=5, v=3
                    </text>
                  </g>
                )}

                {/* ==================== CLIENT A CARD (Top Left) ==================== */}
                <g transform="translate(40, 70)" filter="url(#card-shadow)">
                  <rect
                    width="190"
                    height="160"
                    rx="12"
                    fill={cardBg}
                    stroke={clientAStatus === 'COMMITTED' ? successGreen : clientABlue}
                    strokeWidth={clientAStatus === 'COMMITTED' ? 2 : 1.5}
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="190" height="32" rx="12" fill={isLight ? '#f0fdfa' : '#083344'} />
                  <circle cx="16" cy="16" r="6" fill={clientABlue} />
                  <text x="30" y="20" fill={textPrimary} fontSize="12" fontWeight="700">
                    Client A (Order #101)
                  </text>

                  {/* Body Content */}
                  <text x="14" y="55" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    User: <tspan fill={textPrimary} fontWeight="bold">Aarav (Checkout)</tspan>
                  </text>
                  <text x="14" y="75" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Desired Qty: <tspan fill={clientABlue} fontWeight="bold">2 Units (-2)</tspan>
                  </text>
                  <text x="14" y="95" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Read Version: <tspan fill={textPrimary} fontWeight="bold">v1 (Cached: 10)</tspan>
                  </text>

                  {/* Status Pill */}
                  <rect
                    x="14"
                    y="114"
                    width="162"
                    height="32"
                    rx="6"
                    fill={
                      clientAStatus === 'COMMITTED'
                        ? isLight ? '#dcfce7' : '#052e16'
                        : isLight ? '#e0f2fe' : '#082f49'
                    }
                    stroke={clientAStatus === 'COMMITTED' ? successGreen : clientABlue}
                    strokeWidth="1"
                  />
                  <text
                    x="95"
                    y="134"
                    textAnchor="middle"
                    fill={clientAStatus === 'COMMITTED' ? successGreen : clientABlue}
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {clientAStatus === 'COMMITTED' ? '✓ SUCCESS_COMMITTED' : 'READING SNAPSHOT'}
                  </text>
                </g>

                {/* ==================== CLIENT B CARD (Bottom Left) ==================== */}
                <g transform="translate(40, 290)" filter="url(#card-shadow)">
                  <rect
                    width="190"
                    height="160"
                    rx="12"
                    fill={cardBg}
                    stroke={
                      clientBStatus === 'REJECTED'
                        ? dangerRed
                        : clientBStatus === 'COMMITTED'
                        ? successGreen
                        : clientBStatus === 'OVERWRITTEN'
                        ? dangerRed
                        : clientBPurple
                    }
                    strokeWidth={clientBStatus === 'REJECTED' || clientBStatus === 'COMMITTED' ? 2 : 1.5}
                  />
                  {/* Header */}
                  <rect
                    x="0"
                    y="0"
                    width="190"
                    height="32"
                    rx="12"
                    fill={
                      clientBStatus === 'REJECTED'
                        ? isLight ? '#fee2e2' : '#450a0a'
                        : isLight ? '#faf5ff' : '#2e1065'
                    }
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="6"
                    fill={clientBStatus === 'REJECTED' ? dangerRed : clientBPurple}
                  />
                  <text x="30" y="20" fill={textPrimary} fontSize="12" fontWeight="700">
                    Client B (Order #102)
                  </text>

                  {/* Body Content */}
                  <text x="14" y="55" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    User: <tspan fill={textPrimary} fontWeight="bold">Priya (Checkout)</tspan>
                  </text>
                  <text x="14" y="75" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Desired Qty: <tspan fill={clientBPurple} fontWeight="bold">3 Units (-3)</tspan>
                  </text>
                  <text x="14" y="95" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Read Version: <tspan fill={textPrimary} fontWeight="bold">
                      {currentTime >= 9.0 && strategyMode === 'occ_versioning' ? 'v2 (Refreshed: 8)' : 'v1 (Cached: 10)'}
                    </tspan>
                  </text>

                  {/* Status Pill */}
                  <rect
                    x="14"
                    y="114"
                    width="162"
                    height="32"
                    rx="6"
                    fill={
                      clientBStatus === 'REJECTED'
                        ? isLight ? '#fee2e2' : '#450a0a'
                        : clientBStatus === 'COMMITTED'
                        ? isLight ? '#dcfce7' : '#052e16'
                        : clientBStatus === 'OVERWRITTEN'
                        ? isLight ? '#fee2e2' : '#450a0a'
                        : clientBStatus === 'WAITING'
                        ? isLight ? '#fef3c7' : '#451a03'
                        : isLight ? '#f3e8ff' : '#3b0764'
                    }
                    stroke={
                      clientBStatus === 'REJECTED'
                        ? dangerRed
                        : clientBStatus === 'COMMITTED'
                        ? successGreen
                        : clientBStatus === 'OVERWRITTEN'
                        ? dangerRed
                        : clientBStatus === 'WAITING'
                        ? warningAmber
                        : clientBPurple
                    }
                    strokeWidth="1"
                  />
                  <text
                    x="95"
                    y="134"
                    textAnchor="middle"
                    fill={
                      clientBStatus === 'REJECTED'
                        ? dangerRed
                        : clientBStatus === 'COMMITTED'
                        ? successGreen
                        : clientBStatus === 'OVERWRITTEN'
                        ? dangerRed
                        : clientBStatus === 'WAITING'
                        ? warningAmber
                        : clientBPurple
                    }
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {clientBStatus === 'REJECTED'
                      ? '✗ REJECTED_STALE_VER'
                      : clientBStatus === 'COMMITTED'
                      ? '✓ COMMITTED (v3)'
                      : clientBStatus === 'OVERWRITTEN'
                      ? '⚠ LOST UPDATE OVERWRITE'
                      : clientBStatus === 'WAITING'
                      ? '⏳ BLOCKED (X-Lock)'
                      : 'CONCURRENT ORDER'}
                  </text>
                </g>

                {/* ==================== DATABASE ENGINE CARD (Center & Right) ==================== */}
                <g transform="translate(480, 50)" filter="url(#card-shadow)">
                  <rect
                    width="380"
                    height="420"
                    rx="14"
                    fill={cardBg}
                    stroke={dbLockState !== 'UNLOCKED' ? warningAmber : cardBorder}
                    strokeWidth={dbLockState !== 'UNLOCKED' ? 2 : 1}
                  />

                  {/* DB Header */}
                  <rect x="0" y="0" width="380" height="42" rx="14" fill={isLight ? '#eef2ff' : '#1e1b4b'} />
                  <circle cx="20" cy="21" r="8" fill={dbIndigo} />
                  <text x="36" y="26" fill={textPrimary} fontSize="14" fontWeight="800">
                    PostgreSQL / SQLite Storage Engine
                  </text>
                  <rect
                    x="250"
                    y="10"
                    width="118"
                    height="22"
                    rx="6"
                    fill={
                      dbLockState !== 'UNLOCKED'
                        ? warningAmber
                        : strategyMode === 'occ_versioning'
                        ? successGreen
                        : isLight ? '#cbd5e1' : '#334155'
                    }
                    opacity={0.9}
                  />
                  <text x="309" y="25" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                    {dbLockState !== 'UNLOCKED'
                      ? 'EXCLUSIVE LOCK'
                      : strategyMode === 'occ_versioning'
                      ? 'OCC NON-BLOCKING'
                      : 'NO LOCKS (BLIND)'}
                  </text>

                  {/* 1. Live Table View: Inventory */}
                  <g transform="translate(18, 55)">
                    <text x="0" y="14" fill={textSecondary} fontSize="11" fontWeight="700" letterSpacing="0.05em">
                      BUFFER POOL / LIVE TABLE: `Inventory`
                    </text>
                    <rect x="0" y="22" width="344" height="96" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    
                    {/* Table Columns Header */}
                    <rect x="0" y="22" width="344" height="26" rx="8" fill={isLight ? '#f1f5f9' : '#161e2e'} />
                    <text x="14" y="39" fill={textSecondary} fontSize="10" fontWeight="bold" fontFamily="monospace">id</text>
                    <text x="45" y="39" fill={textSecondary} fontSize="10" fontWeight="bold" fontFamily="monospace">product</text>
                    <text x="165" y="39" fill={textSecondary} fontSize="10" fontWeight="bold" fontFamily="monospace">stock</text>
                    <text x="240" y="39" fill={textSecondary} fontSize="10" fontWeight="bold" fontFamily="monospace">version</text>

                    {/* Table Row 1 (Primary Key = 1) */}
                    <line x1="0" y1="48" x2="344" y2="48" stroke={cardBorder} />
                    <text x="14" y="74" fill={textPrimary} fontSize="12" fontWeight="bold" fontFamily="monospace">1</text>
                    <text x="45" y="74" fill={textPrimary} fontSize="12" fontWeight="bold" fontFamily="monospace">Flagship Phone</text>
                    
                    {/* Stock Value with Animated Highlight */}
                    <rect
                      x="158"
                      y="58"
                      width="54"
                      height="26"
                      rx="4"
                      fill={
                        currentStock === 10
                          ? isLight ? '#f1f5f9' : '#1e293b'
                          : currentStock === 8
                          ? isLight ? '#e0f2fe' : '#075985'
                          : currentStock === 7
                          ? isLight ? '#fee2e2' : '#7f1d1d'
                          : isLight ? '#dcfce7' : '#065f46'
                      }
                    />
                    <text
                      x="185"
                      y="75"
                      textAnchor="middle"
                      fill={
                        currentStock === 10
                          ? textPrimary
                          : currentStock === 8
                          ? clientABlue
                          : currentStock === 7
                          ? dangerRed
                          : successGreen
                      }
                      fontSize="13"
                      fontWeight="800"
                      fontFamily="monospace"
                    >
                      {currentStock}
                    </text>

                    {/* Version Column Value */}
                    <rect
                      x="235"
                      y="58"
                      width="54"
                      height="26"
                      rx="4"
                      fill={strategyMode === 'lost_update_disaster' ? (isLight ? '#fee2e2' : '#450a0a') : isLight ? '#eef2ff' : '#312e81'}
                    />
                    <text
                      x="262"
                      y="75"
                      textAnchor="middle"
                      fill={strategyMode === 'lost_update_disaster' ? dangerRed : dbIndigo}
                      fontSize="13"
                      fontWeight="800"
                      fontFamily="monospace"
                    >
                      {strategyMode === 'lost_update_disaster' ? 'N/A' : `v${currentVersion}`}
                    </text>

                    {/* Subtext info */}
                    <text x="14" y="106" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      Warehouse actual inventory baseline: 10 units
                    </text>
                  </g>

                  {/* 2. Predicate Evaluator Box */}
                  <g transform="translate(18, 190)">
                    <text x="0" y="14" fill={textSecondary} fontSize="11" fontWeight="700" letterSpacing="0.05em">
                      OCC PREDICATE & CONCURRENCY CONTROLLER
                    </text>
                    <rect
                      x="0"
                      y="22"
                      width="344"
                      height="80"
                      rx="8"
                      fill={isLight ? '#f8fafc' : '#0b0f19'}
                      stroke={cardBorder}
                    />

                    {/* Evaluation Logic display */}
                    <text x="12" y="44" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      SQL: <tspan fill={textPrimary} fontWeight="bold">{activePacket.slice(0, 46)}</tspan>
                    </text>

                    {/* Predicate validation check pill */}
                    <g transform="translate(12, 54)">
                      {currentTime < 3.0 ? (
                        <text x="0" y="24" fill={textSecondary} fontSize="10" fontFamily="monospace">
                          Status: Parallel reads permitted. Zero locking overhead.
                        </text>
                      ) : currentTime < 6.0 ? (
                        <g>
                          <rect x="0" y="8" width="320" height="26" rx="4" fill={isLight ? '#dcfce7' : '#052e16'} stroke={successGreen} />
                          <text x="10" y="25" fill={successGreen} fontSize="10" fontWeight="bold" fontFamily="monospace">
                            MATCH: `WHERE version = 1` -&gt; 1 ROW UPDATED
                          </text>
                        </g>
                      ) : currentTime < 9.0 ? (
                        strategyMode === 'occ_versioning' ? (
                          <g>
                            <rect x="0" y="8" width="320" height="26" rx="4" fill={isLight ? '#fee2e2' : '#450a0a'} stroke={dangerRed} />
                            <text x="10" y="25" fill={dangerRed} fontSize="10" fontWeight="bold" fontFamily="monospace">
                              COLLISION: version (1) != live (2) -&gt; 0 ROWS AFFECTED!
                            </text>
                          </g>
                        ) : strategyMode === 'lost_update_disaster' ? (
                          <g>
                            <rect x="0" y="8" width="320" height="26" rx="4" fill={isLight ? '#fee2e2' : '#450a0a'} stroke={dangerRed} />
                            <text x="10" y="25" fill={dangerRed} fontSize="10" fontWeight="bold" fontFamily="monospace">
                              NO VERSION CHECK: Blind overwrite clobbered Client A!
                            </text>
                          </g>
                        ) : (
                          <g>
                            <rect x="0" y="8" width="320" height="26" rx="4" fill={isLight ? '#fef3c7' : '#451a03'} stroke={warningAmber} />
                            <text x="10" y="25" fill={warningAmber} fontSize="10" fontWeight="bold" fontFamily="monospace">
                              X-LOCK ACQUIRED: Serialized write to stock = 5
                            </text>
                          </g>
                        )
                      ) : (
                        <g>
                          <rect x="0" y="8" width="320" height="26" rx="4" fill={isLight ? '#dcfce7' : '#052e16'} stroke={successGreen} />
                          <text x="10" y="25" fill={successGreen} fontSize="10" fontWeight="bold" fontFamily="monospace">
                            {strategyMode === 'occ_versioning'
                              ? 'RETRY COMMITTED: WHERE version = 2 -&gt; 1 ROW UPDATED'
                              : strategyMode === 'pessimistic_lock'
                              ? 'TRANSACTION COMPLETE: 2PL Locks Safely Released'
                              : 'INTEGRITY AUDIT FAILED: 2 units unaccounted for!'}
                          </text>
                        </g>
                      )}
                    </g>
                  </g>

                  {/* 3. Write-Ahead Log (WAL / Transaction Timeline) */}
                  <g transform="translate(18, 305)">
                    <text x="0" y="14" fill={textSecondary} fontSize="11" fontWeight="700" letterSpacing="0.05em">
                      WRITE-AHEAD LOG (WAL) AUDIT STREAM
                    </text>
                    <rect x="0" y="22" width="344" height="80" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    
                    <g transform="translate(12, 38)">
                      <text x="0" y="10" fill={textSecondary} fontSize="10" fontFamily="monospace">
                        LSN 101: <tspan fill={clientABlue}>[T1 Read]</tspan> Snapshot stock=10, v=1
                      </text>
                      <text x="0" y="26" fill={currentTime >= 3.0 ? (clientAStatus === 'COMMITTED' ? successGreen : textSecondary) : textSecondary} fontSize="10" fontFamily="monospace">
                        LSN 102: <tspan fill={clientABlue}>[T1 Commit]</tspan> {currentTime >= 3.0 ? 'Stock 10->8, Version 1->2' : 'Pending...'}
                      </text>
                      <text
                        x="0"
                        y="42"
                        fill={
                          currentTime >= 6.0
                            ? strategyMode === 'occ_versioning'
                              ? (currentTime >= 9.0 ? successGreen : dangerRed)
                              : strategyMode === 'lost_update_disaster'
                              ? dangerRed
                              : successGreen
                            : textSecondary
                        }
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        LSN 103: <tspan fill={clientBPurple}>[T2 Exec]</tspan>{' '}
                        {currentTime < 6.0
                          ? 'Pending...'
                          : strategyMode === 'occ_versioning'
                          ? currentTime >= 9.0
                            ? 'Retry Commit: Stock 8->5, Version 2->3'
                            : 'OCC Abort: 0 rows affected (Stale v1)'
                          : strategyMode === 'lost_update_disaster'
                          ? 'Blind Overwrite: Stock clobbered to 7'
                          : 'Lock Commit: Stock 8->5'}
                      </text>
                    </g>
                  </g>
                </g>

                {/* Conflict / Collision Shield Badge overlay */}
                {currentTime >= 6.0 && currentTime < 9.0 && strategyMode === 'occ_versioning' && (
                  <g transform="translate(430, 240)" filter="url(#card-shadow)">
                    <rect x="-90" y="-30" width="180" height="60" rx="10" fill={isLight ? '#fee2e2' : '#7f1d1d'} stroke={dangerRed} strokeWidth="2" />
                    <text x="0" y="-8" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">
                      OCC COLLISION
                    </text>
                    <text x="0" y="14" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="monospace">
                      0 Rows Affected
                    </text>
                  </g>
                )}

                {/* Lost Update Anomaly Alert Overlay */}
                {currentTime >= 6.0 && strategyMode === 'lost_update_disaster' && (
                  <g transform="translate(430, 240)" filter="url(#card-shadow)">
                    <rect x="-95" y="-30" width="190" height="60" rx="10" fill={isLight ? '#fee2e2' : '#7f1d1d'} stroke={dangerRed} strokeWidth="2" />
                    <text x="0" y="-8" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">
                      LOST UPDATE ERROR!
                    </text>
                    <text x="0" y="14" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="monospace">
                      Client A write destroyed
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
