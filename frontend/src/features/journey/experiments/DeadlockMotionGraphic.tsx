import { useState, useEffect, useRef } from 'react'
import { ShieldCheck, AlertOctagon } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function DeadlockMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [lockOrderingEnabled, setLockOrderingEnabled] = useState(false)

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

  // Calculate Subtitles & Metrics based on currentTime and lockOrdering
  let subtitle = ''
  let metrics: { label: string; value: string; variant?: 'default' | 'success' | 'warning' | 'danger' }[] = []
  let isDeadlocked = false
  let isSafeResolved = false

  if (!lockOrderingEnabled) {
    // UNORDERED LOCKING (DEADLOCK PATH)
    if (currentTime < 2.5) {
      subtitle = '0.0s - 2.5s: Initial Allocations. Thread 1 acquires Lock(Rider). Concurrently, Thread 2 acquires Lock(Order).'
      metrics = [
        { label: 'T1 Status', value: 'Running', variant: 'default' },
        { label: 'T2 Status', value: 'Running', variant: 'default' },
        { label: 'RAG Cycle', value: 'None', variant: 'success' },
      ]
    } else if (currentTime < 5.5) {
      subtitle = '2.5s - 5.5s: Hold & Wait. Thread 1 requests Lock(Order) while holding Lock(Rider). Thread 2 requests Lock(Rider) while holding Lock(Order).'
      metrics = [
        { label: 'T1 Status', value: 'Waiting on Lock(Order)', variant: 'warning' },
        { label: 'T2 Status', value: 'Waiting on Lock(Rider)', variant: 'warning' },
        { label: 'Hold & Wait', value: 'Active', variant: 'warning' },
      ]
    } else if (currentTime < 8.5) {
      subtitle = '5.5s - 8.5s: Circular Wait condition closed. Neither thread can release its held lock until it acquires the next lock.'
      metrics = [
        { label: 'T1 Status', value: 'BLOCKED', variant: 'danger' },
        { label: 'T2 Status', value: 'BLOCKED', variant: 'danger' },
        { label: 'WFG Dependency', value: 'T1 → T2 → T1', variant: 'danger' },
      ]
      isDeadlocked = true
    } else {
      subtitle = '8.5s - 12.0s: SYSTEM FREEZE. CPU progress halts. Kernel/PostgreSQL cycle detector triggers 3-color DFS to break deadlock.'
      metrics = [
        { label: 'System State', value: 'DEADLOCK (Frozen)', variant: 'danger' },
        { label: 'CPU Utilization', value: '0% (Stalled)', variant: 'danger' },
        { label: 'Coffman Conditions', value: '4 / 4 Satisfied', variant: 'danger' },
      ]
      isDeadlocked = true
    }
  } else {
    // STRICT LOCK ORDERING (SAFE PATH: Always acquire Lock(Rider) BEFORE Lock(Order))
    if (currentTime < 2.5) {
      subtitle = '0.0s - 2.5s: Lock Hierarchy Enforced (Rider Lock < Order Lock). Thread 1 acquires Lock(Rider).'
      metrics = [
        { label: 'T1 Status', value: 'Acquired Lock(Rider)', variant: 'success' },
        { label: 'T2 Status', value: 'Blocked waiting on L1', variant: 'default' },
        { label: 'Lock Ordering', value: 'Enforced', variant: 'success' },
      ]
    } else if (currentTime < 6.0) {
      subtitle = '2.5s - 6.0s: Thread 2 is forced to wait for Lock(Rider) first. It CANNOT grab Lock(Order) yet. Thread 1 acquires Lock(Order) safely.'
      metrics = [
        { label: 'T1 Status', value: 'Holds L1 & L2', variant: 'success' },
        { label: 'T2 Status', value: 'Safely Queued', variant: 'default' },
        { label: 'Circular Wait', value: 'PREVENTED', variant: 'success' },
      ]
    } else if (currentTime < 9.0) {
      subtitle = '6.0s - 9.0s: Thread 1 completes delivery matching, releases Lock(Order) & Lock(Rider). System unblocks Thread 2.'
      metrics = [
        { label: 'T1 Status', value: 'Completed ✓', variant: 'success' },
        { label: 'T2 Status', value: 'Acquiring Locks', variant: 'success' },
        { label: 'Deadlock Risk', value: '0%', variant: 'success' },
      ]
      isSafeResolved = true
    } else {
      subtitle = '9.0s - 12.0s: Thread 2 finishes successfully. All resources released without any circular wait!'
      metrics = [
        { label: 'System State', value: 'COMPLETED SAFELY', variant: 'success' },
        { label: 'Orders Matched', value: '100% Success', variant: 'success' },
        { label: 'Coffman Broken', value: 'No Circular Wait', variant: 'success' },
      ]
      isSafeResolved = true
    }
  }

  // Visual edge progress calculations (0 to 1)
  const p1HoldProgress = Math.min(1, Math.max(0, currentTime / 1.5))
  const p2HoldProgress = !lockOrderingEnabled
    ? Math.min(1, Math.max(0, currentTime / 1.5))
    : 0 // In ordered mode, T2 does not get L2 early!
  const p1ReqProgress = Math.min(1, Math.max(0, (currentTime - 2.5) / 2.0))
  const p2ReqProgress = !lockOrderingEnabled
    ? Math.min(1, Math.max(0, (currentTime - 2.5) / 2.0))
    : 0

  return (
    <div className="w-full space-y-4">
      <MotionGraphicPlayer
        title="OS Deadlock & Resource Allocation Graph (RAG)"
        subtitle="12-Second Slow Walkthrough · Silberschatz & GeeksforGeeks Formal Architecture"
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLockOrderingEnabled((prev) => !prev)
                setCurrentTime(0)
                setIsPlaying(true)
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border shadow-xs ${
                lockOrderingEnabled
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/70 shadow-emerald-950/40'
                  : 'bg-panel-3 text-muted border-line hover:text-chalk'
              }`}
              title="Toggle Strict Lock Hierarchy (Resource Ordering)"
            >
              {lockOrderingEnabled ? (
                <>
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Lock Ordering: ON (Safe)</span>
                </>
              ) : (
                <>
                  <AlertOctagon size={14} className="text-amber-400" />
                  <span>Lock Ordering: OFF (Deadlock)</span>
                </>
              )}
            </button>
          </div>
        }
      >
        {(canvasTheme) => {
          const isLight = canvasTheme === 'light'
          
          // Theme-dependent color tokens
          const bgNode = isLight ? '#ffffff' : '#111726'
          const borderThread1 = isLight ? '#4f46e5' : '#818cf8'
          const borderThread2 = isLight ? '#0891b2' : '#22d3ee'
          const textPrimary = isLight ? '#0f172a' : '#f8fafc'
          const textSecondary = isLight ? '#475569' : '#94a3b8'
          const resourceBg = isLight ? '#f1f5f9' : '#1e293b'
          const resourceBorder = isLight ? '#cbd5e1' : '#334155'
          const arrowGreen = isLight ? '#059669' : '#10b981'
          const arrowAmber = isLight ? '#d97706' : '#f59e0b'
          const arrowRed = isLight ? '#dc2626' : '#ef4444'

          return (
            <div className="relative w-full aspect-[16/10] max-w-[840px] mx-auto py-2">
              <svg
                viewBox="0 0 880 500"
                className={`w-full h-full transition-all duration-300 ${
                  isDeadlocked ? 'drop-shadow-[0_0_35px_rgba(239,68,68,0.35)]' : ''
                }`}
              >
                <defs>
                  {/* Arrow Markers */}
                  <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={arrowGreen} />
                  </marker>
                  <marker id="arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={arrowAmber} />
                  </marker>
                  <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={arrowRed} />
                  </marker>

                  {/* Drop Shadow Filter for Nodes */}
                  <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity={isLight ? '0.12' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* Circular Cycle Halo Ring (Background aura) */}
                <ellipse
                  cx="440"
                  cy="250"
                  rx="260"
                  ry="180"
                  fill="none"
                  stroke={isDeadlocked ? arrowRed : isSafeResolved ? arrowGreen : isLight ? '#cbd5e1' : '#1e293b'}
                  strokeWidth={isDeadlocked ? 3 : 1.5}
                  strokeDasharray={isDeadlocked ? '8 6' : '4 6'}
                  className={isDeadlocked ? 'animate-pulse' : 'opacity-50'}
                />

                {/* ==================== EDGES ==================== */}

                {/* 1. Assignment Edge: Lock 1 (Rider) -> Thread 1 (Solid Green Arrow) */}
                {p1HoldProgress > 0 && (
                  <g>
                    <line
                      x1="220"
                      y1="340"
                      x2="220"
                      y2={340 - 150 * p1HoldProgress}
                      stroke={isDeadlocked ? arrowRed : arrowGreen}
                      strokeWidth="4"
                      markerEnd={p1HoldProgress >= 0.95 ? (isDeadlocked ? 'url(#arrow-red)' : 'url(#arrow-green)') : ''}
                    />
                    <rect x="155" y="245" width="130" height="28" rx="14" fill={isLight ? '#ecfdf5' : '#064e3b'} stroke={arrowGreen} strokeWidth="1.5" />
                    <text x="220" y="263" textAnchor="middle" fill={arrowGreen} fontSize="11" fontFamily="sans-serif" fontWeight="bold">
                      ✓ HOLDS LOCK 1
                    </text>
                  </g>
                )}

                {/* 2. Assignment Edge: Lock 2 (Order) -> Thread 2 (Solid Green Arrow) */}
                {p2HoldProgress > 0 && (
                  <g>
                    <line
                      x1="660"
                      y1="160"
                      x2="660"
                      y2={160 + 150 * p2HoldProgress}
                      stroke={isDeadlocked ? arrowRed : arrowGreen}
                      strokeWidth="4"
                      markerEnd={p2HoldProgress >= 0.95 ? (isDeadlocked ? 'url(#arrow-red)' : 'url(#arrow-green)') : ''}
                    />
                    <rect x="595" y="245" width="130" height="28" rx="14" fill={isLight ? '#ecfdf5' : '#064e3b'} stroke={arrowGreen} strokeWidth="1.5" />
                    <text x="660" y="263" textAnchor="middle" fill={arrowGreen} fontSize="11" fontFamily="sans-serif" fontWeight="bold">
                      ✓ HOLDS LOCK 2
                    </text>
                  </g>
                )}

                {/* 3. Request Edge: Thread 1 -> Lock 2 (Order) (Dashed Amber Arrow) */}
                {p1ReqProgress > 0 && (
                  <g>
                    <line
                      x1="280"
                      y1="125"
                      x2={280 + 300 * p1ReqProgress}
                      y2="125"
                      stroke={isDeadlocked ? arrowRed : arrowAmber}
                      strokeWidth="4"
                      strokeDasharray="6 5"
                      markerEnd={p1ReqProgress >= 0.95 ? (isDeadlocked ? 'url(#arrow-red)' : 'url(#arrow-amber)') : ''}
                    />
                    <rect x="375" y="105" width="130" height="28" rx="14" fill={isLight ? '#fffbeb' : '#451a03'} stroke={isDeadlocked ? arrowRed : arrowAmber} strokeWidth="1.5" />
                    <text x="440" y="123" textAnchor="middle" fill={isDeadlocked ? arrowRed : arrowAmber} fontSize="11" fontFamily="sans-serif" fontWeight="bold">
                      ⚡ REQUESTS LOCK 2
                    </text>
                  </g>
                )}

                {/* 4. Request Edge: Thread 2 -> Lock 1 (Rider) (Dashed Amber Arrow) */}
                {p2ReqProgress > 0 && (
                  <g>
                    <line
                      x1="600"
                      y1="375"
                      x2={600 - 300 * p2ReqProgress}
                      y2="375"
                      stroke={isDeadlocked ? arrowRed : arrowAmber}
                      strokeWidth="4"
                      strokeDasharray="6 5"
                      markerEnd={p2ReqProgress >= 0.95 ? (isDeadlocked ? 'url(#arrow-red)' : 'url(#arrow-amber)') : ''}
                    />
                    <rect x="375" y="360" width="130" height="28" rx="14" fill={isLight ? '#fffbeb' : '#451a03'} stroke={isDeadlocked ? arrowRed : arrowAmber} strokeWidth="1.5" />
                    <text x="440" y="378" textAnchor="middle" fill={isDeadlocked ? arrowRed : arrowAmber} fontSize="11" fontFamily="sans-serif" fontWeight="bold">
                      ⚡ REQUESTS LOCK 1
                    </text>
                  </g>
                )}

                {/* ==================== NODES ==================== */}

                {/* THREAD 1 (Process Node - Circle, Top-Left) */}
                <g transform="translate(220, 125)" filter="url(#node-shadow)">
                  <circle
                    r="52"
                    fill={bgNode}
                    stroke={isDeadlocked ? arrowRed : borderThread1}
                    strokeWidth={isDeadlocked ? '4' : '3.5'}
                    className="transition-all duration-300"
                  />
                  <text textAnchor="middle" y="-12" fill={textPrimary} fontSize="15" fontWeight="bold" fontFamily="sans-serif">
                    Thread 1
                  </text>
                  <text textAnchor="middle" y="8" fill={textSecondary} fontSize="11" fontFamily="monospace">
                    Rider Matcher
                  </text>
                  <rect
                    x="-38"
                    y="18"
                    width="76"
                    height="18"
                    rx="9"
                    fill={isDeadlocked ? (isLight ? '#fee2e2' : '#7f1d1d') : (isLight ? '#e0e7ff' : '#312e81')}
                  />
                  <text
                    textAnchor="middle"
                    y="31"
                    fill={isDeadlocked ? arrowRed : borderThread1}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {isDeadlocked ? 'BLOCKED' : p1HoldProgress > 0 ? 'ACTIVE' : 'IDLE'}
                  </text>
                </g>

                {/* THREAD 2 (Process Node - Circle, Bottom-Right) */}
                <g transform="translate(660, 375)" filter="url(#node-shadow)">
                  <circle
                    r="52"
                    fill={bgNode}
                    stroke={isDeadlocked ? arrowRed : borderThread2}
                    strokeWidth={isDeadlocked ? '4' : '3.5'}
                    className="transition-all duration-300"
                  />
                  <text textAnchor="middle" y="-12" fill={textPrimary} fontSize="15" fontWeight="bold" fontFamily="sans-serif">
                    Thread 2
                  </text>
                  <text textAnchor="middle" y="8" fill={textSecondary} fontSize="11" fontFamily="monospace">
                    Order Dispatch
                  </text>
                  <rect
                    x="-42"
                    y="18"
                    width="84"
                    height="18"
                    rx="9"
                    fill={isDeadlocked ? (isLight ? '#fee2e2' : '#7f1d1d') : isSafeResolved ? (isLight ? '#dcfce7' : '#064e3b') : (isLight ? '#cffafe' : '#164e63')}
                  />
                  <text
                    textAnchor="middle"
                    y="31"
                    fill={isDeadlocked ? arrowRed : isSafeResolved ? arrowGreen : borderThread2}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {isDeadlocked ? 'BLOCKED' : p2HoldProgress > 0 ? 'ACTIVE' : lockOrderingEnabled ? 'QUEUED (SAFE)' : 'IDLE'}
                  </text>
                </g>

                {/* RESOURCE 1: LOCK(RIDER) (Resource Node - Rectangle, Bottom-Left) */}
                <g transform="translate(150, 345)" filter="url(#node-shadow)">
                  <rect
                    x="0"
                    y="0"
                    width="140"
                    height="70"
                    rx="10"
                    fill={resourceBg}
                    stroke={p1HoldProgress > 0 ? arrowGreen : resourceBorder}
                    strokeWidth="3"
                  />
                  <circle cx="26" cy="24" r="6" fill={p1HoldProgress > 0 ? arrowGreen : textSecondary} />
                  <text x="42" y="28" fill={textPrimary} fontSize="14" fontWeight="bold" fontFamily="monospace">
                    Lock 1 (L1)
                  </text>
                  <text x="20" y="52" fill={textSecondary} fontSize="11" fontFamily="sans-serif">
                    Rider Profile Mutex
                  </text>
                </g>

                {/* RESOURCE 2: LOCK(ORDER) (Resource Node - Rectangle, Top-Right) */}
                <g transform="translate(590, 85)" filter="url(#node-shadow)">
                  <rect
                    x="0"
                    y="0"
                    width="140"
                    height="70"
                    rx="10"
                    fill={resourceBg}
                    stroke={p2HoldProgress > 0 ? arrowGreen : resourceBorder}
                    strokeWidth="3"
                  />
                  <circle cx="26" cy="24" r="6" fill={p2HoldProgress > 0 ? arrowGreen : textSecondary} />
                  <text x="42" y="28" fill={textPrimary} fontSize="14" fontWeight="bold" fontFamily="monospace">
                    Lock 2 (L2)
                  </text>
                  <text x="20" y="52" fill={textSecondary} fontSize="11" fontFamily="sans-serif">
                    Order Batch Mutex
                  </text>
                </g>

                {/* ==================== CENTER OVERLAY BANNERS ==================== */}

                {/* DEADLOCK BANNER OVERLAY */}
                {isDeadlocked && (
                  <g transform="translate(290, 215)">
                    <rect x="0" y="0" width="300" height="70" rx="12" fill={isLight ? '#fef2f2' : '#450a0a'} stroke={arrowRed} strokeWidth="2.5" />
                    <text x="150" y="28" textAnchor="middle" fill={arrowRed} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                      ⚡ CIRCULAR WAIT DEADLOCK
                    </text>
                    <text x="150" y="48" textAnchor="middle" fill={isLight ? '#991b1b' : '#fca5a5'} fontSize="11" fontFamily="monospace">
                      Cycle: T1 → L2 → T2 → L1 → T1
                    </text>
                    <text x="150" y="62" textAnchor="middle" fill={isLight ? '#7f1d1d' : '#fecaca'} fontSize="9" fontFamily="sans-serif">
                      All 4 Coffman conditions satisfied. System frozen!
                    </text>
                  </g>
                )}

                {/* SAFE RESOLVED BANNER OVERLAY */}
                {isSafeResolved && (
                  <g transform="translate(270, 215)">
                    <rect x="0" y="0" width="340" height="70" rx="12" fill={isLight ? '#f0fdf4' : '#064e3b'} stroke={arrowGreen} strokeWidth="2.5" />
                    <text x="170" y="28" textAnchor="middle" fill={arrowGreen} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                      ✓ DEADLOCK PREVENTED SAFELY
                    </text>
                    <text x="170" y="48" textAnchor="middle" fill={isLight ? '#166534' : '#a7f3d0'} fontSize="11" fontFamily="monospace">
                      Strict Global Lock Order (L1 &lt; L2) Enforced
                    </text>
                    <text x="170" y="62" textAnchor="middle" fill={isLight ? '#14532d' : '#d1fae5'} fontSize="9" fontFamily="sans-serif">
                      Circular wait broken. Transactions completed in sequence!
                    </text>
                  </g>
                )}
              </svg>
            </div>
          )
        }}
      </MotionGraphicPlayer>

      {/* Legend & Formal Definition Card (Bottom of Player) */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 rounded-xl border border-line bg-panel-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="font-bold text-chalk">RAG Formalism:</span>
          <span className="text-muted">Single-instance Resource Allocation Graph</span>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 bg-panel" />
            <span className="text-chalk">Process (Circle)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-3 rounded-xs border-2 border-slate-400 bg-panel" />
            <span className="text-chalk">Resource Lock (Box)</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-5 h-0.5 bg-emerald-500" />
            <span>Assignment (R → T)</span>
          </div>
          <div className="flex items-center gap-2 text-amber-400">
            <span className="w-5 h-0.5 border-t-2 border-dashed border-amber-500" />
            <span>Request (T → R)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
