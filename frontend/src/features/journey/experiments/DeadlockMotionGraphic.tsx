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
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all border ${
                lockOrderingEnabled
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/60 shadow-xs'
                  : 'bg-panel text-muted border-line hover:text-chalk'
              }`}
              title="Toggle Strict Lock Hierarchy (Resource Ordering)"
            >
              {lockOrderingEnabled ? (
                <>
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>Lock Ordering: ON (Safe)</span>
                </>
              ) : (
                <>
                  <AlertOctagon size={13} className="text-amber-400" />
                  <span>Lock Ordering: OFF (Deadlock)</span>
                </>
              )}
            </button>
          </div>
        }
      >
        {/* SVG Graphic Scene (600 x 340 viewBox) */}
        <div className="relative w-full aspect-[16/9] max-w-[620px] mx-auto">
          <svg
            viewBox="0 0 600 340"
            className={`w-full h-full transition-all duration-300 rounded-lg ${
              isDeadlocked ? 'drop-shadow-[0_0_25px_rgba(239,68,68,0.25)]' : ''
            }`}
          >
            <defs>
              {/* Arrow Markers */}
              <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
              </marker>
              <marker id="arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
              </marker>
              <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
              </marker>
            </defs>

            {/* Background subtle connection circle showing the cyclic dependency */}
            <circle
              cx="300"
              cy="170"
              r="140"
              fill="none"
              stroke={isDeadlocked ? '#ef4444' : isSafeResolved ? '#10b981' : '#334155'}
              strokeWidth={isDeadlocked ? 2.5 : 1}
              strokeDasharray={isDeadlocked ? '6 6' : '3 6'}
              className={isDeadlocked ? 'animate-pulse' : 'opacity-40'}
            />

            {/* EDGES (Assignment: Lock -> Thread; Request: Thread -> Lock) */}
            
            {/* 1. Assignment Edge: Lock 1 (Rider) -> Thread 1 */}
            {p1HoldProgress > 0 && (
              <g>
                <line
                  x1="180"
                  y1="230"
                  x2="180"
                  y2={230 - 110 * p1HoldProgress}
                  stroke={isDeadlocked ? '#ef4444' : '#10b981'}
                  strokeWidth="2.5"
                  markerEnd={p1HoldProgress >= 0.95 ? (isDeadlocked ? 'url(#arrow-red)' : 'url(#arrow-green)') : ''}
                />
                <text x="135" y="175" fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  holds L1
                </text>
              </g>
            )}

            {/* 2. Assignment Edge: Lock 2 (Order) -> Thread 2 */}
            {p2HoldProgress > 0 && (
              <g>
                <line
                  x1="420"
                  y1="110"
                  x2="420"
                  y2={110 + 110 * p2HoldProgress}
                  stroke={isDeadlocked ? '#ef4444' : '#10b981'}
                  strokeWidth="2.5"
                  markerEnd={p2HoldProgress >= 0.95 ? (isDeadlocked ? 'url(#arrow-red)' : 'url(#arrow-green)') : ''}
                />
                <text x="430" y="175" fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  holds L2
                </text>
              </g>
            )}

            {/* 3. Request Edge: Thread 1 -> Lock 2 (Order) */}
            {p1ReqProgress > 0 && (
              <g>
                <line
                  x1="220"
                  y1="85"
                  x2={220 + 140 * p1ReqProgress}
                  y2="85"
                  stroke={isDeadlocked ? '#ef4444' : '#f59e0b'}
                  strokeWidth="2.5"
                  strokeDasharray="5 4"
                  markerEnd={p1ReqProgress >= 0.95 ? (isDeadlocked ? 'url(#arrow-red)' : 'url(#arrow-amber)') : ''}
                />
                <text x="270" y="75" fill={isDeadlocked ? '#ef4444' : '#f59e0b'} fontSize="10" fontFamily="monospace" fontWeight="bold">
                  requests L2
                </text>
              </g>
            )}

            {/* 4. Request Edge: Thread 2 -> Lock 1 (Rider) */}
            {p2ReqProgress > 0 && (
              <g>
                <line
                  x1="380"
                  y1="255"
                  x2={380 - 140 * p2ReqProgress}
                  y2="255"
                  stroke={isDeadlocked ? '#ef4444' : '#f59e0b'}
                  strokeWidth="2.5"
                  strokeDasharray="5 4"
                  markerEnd={p2ReqProgress >= 0.95 ? (isDeadlocked ? 'url(#arrow-red)' : 'url(#arrow-amber)') : ''}
                />
                <text x="270" y="275" fill={isDeadlocked ? '#ef4444' : '#f59e0b'} fontSize="10" fontFamily="monospace" fontWeight="bold">
                  requests L1
                </text>
              </g>
            )}

            {/* THREAD 1 NODE (Process circle, Top-Left) */}
            <g transform="translate(180, 85)">
              <circle
                r="36"
                fill="#12161f"
                stroke={isDeadlocked ? '#ef4444' : '#8b5cf6'}
                strokeWidth={isDeadlocked ? '3' : '2'}
                className="transition-all duration-300"
              />
              <text textAnchor="middle" y="-6" fill="#f8fafc" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                Thread 1
              </text>
              <text textAnchor="middle" y="10" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                (Rider Matcher)
              </text>
              <text
                textAnchor="middle"
                y="22"
                fill={isDeadlocked ? '#ef4444' : '#10b981'}
                fontSize="8"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {isDeadlocked ? 'BLOCKED' : p1HoldProgress > 0 ? 'ACTIVE' : 'IDLE'}
              </text>
            </g>

            {/* THREAD 2 NODE (Process circle, Bottom-Right) */}
            <g transform="translate(420, 255)">
              <circle
                r="36"
                fill="#12161f"
                stroke={isDeadlocked ? '#ef4444' : '#8b5cf6'}
                strokeWidth={isDeadlocked ? '3' : '2'}
                className="transition-all duration-300"
              />
              <text textAnchor="middle" y="-6" fill="#f8fafc" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                Thread 2
              </text>
              <text textAnchor="middle" y="10" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                (Order Dispatch)
              </text>
              <text
                textAnchor="middle"
                y="22"
                fill={isDeadlocked ? '#ef4444' : isSafeResolved ? '#10b981' : '#10b981'}
                fontSize="8"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {isDeadlocked ? 'BLOCKED' : p2HoldProgress > 0 ? 'ACTIVE' : lockOrderingEnabled ? 'WAITING' : 'IDLE'}
              </text>
            </g>

            {/* RESOURCE 1 NODE (Lock 1 - Rider Mutex, Bottom-Left rectangle) */}
            <g transform="translate(140, 230)">
              <rect
                x="0"
                y="0"
                width="80"
                height="50"
                rx="6"
                fill="#1a202c"
                stroke={p1HoldProgress > 0 ? '#10b981' : '#475569'}
                strokeWidth="2"
              />
              <circle cx="20" cy="18" r="3" fill="#10b981" />
              <text x="32" y="22" fill="#f8fafc" fontSize="11" fontWeight="bold" fontFamily="monospace">
                L1
              </text>
              <text x="12" y="40" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">
                Rider Lock
              </text>
            </g>

            {/* RESOURCE 2 NODE (Lock 2 - Order Mutex, Top-Right rectangle) */}
            <g transform="translate(380, 60)">
              <rect
                x="0"
                y="0"
                width="80"
                height="50"
                rx="6"
                fill="#1a202c"
                stroke={p2HoldProgress > 0 ? '#10b981' : '#475569'}
                strokeWidth="2"
              />
              <circle cx="20" cy="18" r="3" fill="#10b981" />
              <text x="32" y="22" fill="#f8fafc" fontSize="11" fontWeight="bold" fontFamily="monospace">
                L2
              </text>
              <text x="12" y="40" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">
                Order Lock
              </text>
            </g>

            {/* DEADLOCK BANNER OVERLAY */}
            {isDeadlocked && (
              <g transform="translate(190, 145)">
                <rect x="0" y="0" width="220" height="48" rx="8" fill="#450a0a" stroke="#ef4444" strokeWidth="2" />
                <text x="110" y="20" textAnchor="middle" fill="#fca5a5" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                  ⚡ CIRCULAR WAIT DEADLOCK
                </text>
                <text x="110" y="36" textAnchor="middle" fill="#fecaca" fontSize="9" fontFamily="monospace">
                  T1 → L2 → T2 → L1 → T1
                </text>
              </g>
            )}

            {/* SAFE RESOLVED BANNER OVERLAY */}
            {isSafeResolved && (
              <g transform="translate(170, 145)">
                <rect x="0" y="0" width="260" height="48" rx="8" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
                <text x="130" y="20" textAnchor="middle" fill="#6ee7b7" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                  ✓ DEADLOCK AVOIDED
                </text>
                <text x="130" y="36" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontFamily="monospace">
                  Strict Hierarchy (L1 &lt; L2) broke cycle!
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Legend bar underneath the animation stage */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-[11px] font-mono border-t border-line/60">
          <div className="flex items-center gap-1.5 text-muted">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
            <span>Process Node (Circle)</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-500 border border-slate-400" />
            <span>Resource Node (Rectangle)</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-4 h-0.5 bg-emerald-500" />
            <span>Assignment Edge (R → T)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-4 h-0.5 border-t border-dashed border-amber-500" />
            <span>Request Edge (T → R)</span>
          </div>
        </div>
      </MotionGraphicPlayer>
    </div>
  )
}
