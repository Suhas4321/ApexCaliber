import { useState, useEffect, useRef } from 'react'
import { Flame, Bug, CheckCircle2 } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function CodeExecutionMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [chaosMode, setChaosMode] = useState<'normal' | 'fork_bomb' | 'infinite_loop'>('normal')

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

  // Calculate Subtitles & Metrics based on currentTime and chaosMode
  let subtitle = ''
  let metrics: { label: string; value: string; variant?: 'default' | 'success' | 'warning' | 'danger' }[] = []
  let isThrottled = false
  let isVerdictReady = false

  if (currentTime < 3.0) {
    subtitle = '0.0s - 3.0s: 1,000 contest participants hit Run. Stateless API Gateway checks SHA-256 hash & returns HTTP 202 Accepted in 12ms.'
    metrics = [
      { label: 'API Ingestion', value: '1,000 RPS', variant: 'default' },
      { label: 'HTTP Status', value: '202 Accepted', variant: 'success' },
      { label: 'Gateway Latency', value: '12ms', variant: 'success' },
    ]
  } else if (currentTime < 6.0) {
    subtitle = '3.0s - 6.0s: Queue Decoupling. Redis Streams buffers burst traffic with consumer group leases, shielding workers from OOM crashes.'
    metrics = [
      { label: 'Redis Streams Buffer', value: '1,000 Jobs', variant: 'warning' },
      { label: 'Worker Pull Rate', value: '1 Job / Core', variant: 'default' },
      { label: 'Dropped Jobs', value: '0 (Guaranteed)', variant: 'success' },
    ]
  } else if (currentTime < 9.0) {
    if (chaosMode === 'fork_bomb') {
      subtitle = '6.0s - 9.0s: CHAOS INJECTED! User code attempts `os.fork()`. Linux cgroup `pids.max = 32` blocks further processes. Host PID table safe!'
      metrics = [
        { label: 'Sandbox Isolation', value: 'pids.max = 32 (Cap Hit)', variant: 'danger' },
        { label: 'Host System', value: '100% HEALTHY', variant: 'success' },
        { label: 'Defense Action', value: 'SIGKILL Dispatched', variant: 'danger' },
      ]
      isThrottled = true
    } else if (chaosMode === 'infinite_loop') {
      subtitle = '6.0s - 9.0s: CHAOS INJECTED! User code executes `while True: pass`. Cgroup CPU timer triggers SIGALRM at 2.0s hard cutoff.'
      metrics = [
        { label: 'CPU Watchdog', value: '2.0s Cutoff Breached', variant: 'danger' },
        { label: 'Host CPU', value: 'Normal', variant: 'success' },
        { label: 'Verdict', value: 'TimeLimitExceeded', variant: 'warning' },
      ]
      isThrottled = true
    } else {
      subtitle = '6.0s - 9.0s: Cgroups v2 & Isolate Sandbox Execution. Isolated PID & Network namespaces protect host. Seccomp filters all dangerous syscalls.'
      metrics = [
        { label: 'Sandbox', value: 'cgroups v2 Active', variant: 'success' },
        { label: 'Network Namespace', value: 'Loopback (0 Internet)', variant: 'success' },
        { label: 'Memory Cap', value: '256 MB Limit', variant: 'default' },
      ]
    }
  } else {
    if (chaosMode === 'fork_bomb') {
      subtitle = '9.0s - 12.0s: Verdict Published via SSE: Runtime Error (Resource Limit Exceeded). Host never froze; worker instantly recycled.'
      metrics = [
        { label: 'Verdict', value: 'Runtime Error (Fork Blocked)', variant: 'danger' },
        { label: 'Host Uptime', value: '100% (Zero Leak)', variant: 'success' },
        { label: 'Worker Recycle', value: 'Cleaned in 5ms', variant: 'success' },
      ]
    } else if (chaosMode === 'infinite_loop') {
      subtitle = '9.0s - 12.0s: Verdict Published via SSE: Time Limit Exceeded (TLE). Worker slot reclaimed and ready for next contest job.'
      metrics = [
        { label: 'Verdict', value: 'Time Limit Exceeded (TLE)', variant: 'warning' },
        { label: 'Worker Reclaim', value: 'Ready for Next Job', variant: 'success' },
        { label: 'Contest Availability', value: '100% Online', variant: 'success' },
      ]
    } else {
      subtitle = '9.0s - 12.0s: All 3 Test Cases Passed! Verdict: ACCEPTED (42ms runtime, 14.2MB RAM). Redis Pub/Sub pushes verdict via SSE.'
      metrics = [
        { label: 'Final Verdict', value: 'ACCEPTED ✓', variant: 'success' },
        { label: 'Execution Time', value: '42 ms', variant: 'success' },
        { label: 'Memory Used', value: '14.2 MB / 256MB', variant: 'success' },
      ]
    }
    isVerdictReady = true
  }

  // Progress offsets
  const packetGatewayProgress = Math.min(1, Math.max(0, currentTime / 2.5))
  const packetQueueProgress = Math.min(1, Math.max(0, (currentTime - 2.5) / 2.5))
  const packetWorkerProgress = Math.min(1, Math.max(0, (currentTime - 5.0) / 3.0))
  const packetReturnProgress = Math.min(1, Math.max(0, (currentTime - 8.5) / 3.0))

  return (
    <div className="w-full space-y-4">
      <MotionGraphicPlayer
        title="Remote Code Execution Sandbox (Judge0 / LeetCode)"
        subtitle="12-Second Slow Walkthrough · ByteByteGo Architecture, Linux Cgroups v2 & Redis Streams"
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
              onClick={() => { setChaosMode('normal'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                chaosMode === 'normal'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>Normal Run</span>
            </button>
            <button
              type="button"
              onClick={() => { setChaosMode('fork_bomb'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                chaosMode === 'fork_bomb'
                  ? 'bg-red-950/50 text-red-300 font-bold border border-red-600/60 shadow-xs'
                  : 'text-muted hover:text-red-300'
              }`}
            >
              <Bug size={12} />
              <span>Fork Bomb</span>
            </button>
            <button
              type="button"
              onClick={() => { setChaosMode('infinite_loop'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                chaosMode === 'infinite_loop'
                  ? 'bg-amber-950/50 text-amber-300 font-bold border border-amber-600/60 shadow-xs'
                  : 'text-muted hover:text-amber-300'
              }`}
            >
              <Flame size={12} />
              <span>Infinite Loop</span>
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
          const pulseColor = isThrottled ? '#ef4444' : isLight ? '#059669' : '#10b981'

          return (
            <div className="relative w-full aspect-[16/10] max-w-[840px] mx-auto py-2">
              <svg viewBox="0 0 880 500" className="w-full h-full transition-all duration-300">
                <defs>
                  <marker id="arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={arrowColor} />
                  </marker>
                  <marker id="arrow-emerald" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#10b981" />
                  </marker>
                  <marker id="arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#f59e0b" />
                  </marker>
                  <filter id="hld-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity={isLight ? '0.1' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* FLOW CONNECTORS (BEZIER CURVES) */}

                {/* 1. Client -> Gateway */}
                {packetGatewayProgress > 0 && (
                  <g>
                    <path
                      d="M 170 200 C 210 200, 210 200, 250 200"
                      fill="none"
                      stroke={arrowColor}
                      strokeWidth="4"
                      markerEnd="url(#arrow-blue)"
                    />
                    <circle
                      cx={170 + 80 * packetGatewayProgress}
                      cy="200"
                      r="6"
                      fill="#38bdf8"
                      className="animate-ping"
                    />
                  </g>
                )}

                {/* 2. Gateway -> Redis Streams */}
                {packetQueueProgress > 0 && (
                  <g>
                    <path
                      d="M 390 200 C 420 200, 420 200, 450 200"
                      fill="none"
                      stroke={arrowColor}
                      strokeWidth="4"
                      markerEnd="url(#arrow-blue)"
                    />
                    <circle
                      cx={390 + 60 * packetQueueProgress}
                      cy="200"
                      r="6"
                      fill="#818cf8"
                    />
                  </g>
                )}

                {/* 3. Redis Streams -> Worker Sandbox */}
                {packetWorkerProgress > 0 && (
                  <g>
                    <path
                      d="M 590 200 C 620 200, 620 200, 650 200"
                      fill="none"
                      stroke={arrowColor}
                      strokeWidth="4"
                      markerEnd="url(#arrow-blue)"
                    />
                    <circle
                      cx={590 + 60 * packetWorkerProgress}
                      cy="200"
                      r="6"
                      fill={isThrottled ? '#ef4444' : '#10b981'}
                    />
                  </g>
                )}

                {/* 4. Worker Verdict -> SSE Return Line (Bottom Arc back to Client) */}
                {packetReturnProgress > 0 && (
                  <g>
                    <path
                      d="M 720 280 C 720 420, 100 420, 100 280"
                      fill="none"
                      stroke={isThrottled ? '#ef4444' : pulseColor}
                      strokeWidth="3.5"
                      strokeDasharray="6 6"
                      markerEnd="url(#arrow-emerald)"
                    />
                    <rect x="350" y="405" width="180" height="28" rx="14" fill={isLight ? '#ecfdf5' : '#064e3b'} stroke={pulseColor} strokeWidth="1.5" />
                    <text x="440" y="423" textAnchor="middle" fill={pulseColor} fontSize="11" fontFamily="sans-serif" fontWeight="bold">
                      SSE STREAM VERDICT
                    </text>
                  </g>
                )}

                {/* ==================== ARCHITECTURE NODES ==================== */}

                {/* NODE 1: CLIENTS (Left) */}
                <g transform="translate(40, 140)" filter="url(#hld-shadow)">
                  <rect x="0" y="0" width="130" height="120" rx="12" fill={cardBg} stroke="#38bdf8" strokeWidth="3" />
                  <text x="65" y="32" textAnchor="middle" fill={textPrimary} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                    Clients
                  </text>
                  <text x="65" y="52" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    1,000+ Contestants
                  </text>
                  <rect x="15" y="68" width="100" height="36" rx="6" fill={isLight ? '#f0f9ff' : '#0c4a6e'} />
                  <text x="65" y="84" textAnchor="middle" fill="#0284c7" fontSize="10" fontWeight="bold" fontFamily="monospace">
                    POST /runs
                  </text>
                  <text x="65" y="96" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    clicks Run button
                  </text>
                </g>

                {/* NODE 2: API GATEWAY (Middle-Left) */}
                <g transform="translate(250, 130)" filter="url(#hld-shadow)">
                  <rect x="0" y="0" width="140" height="140" rx="12" fill={cardBg} stroke="#34d399" strokeWidth="3" />
                  <text x="70" y="30" textAnchor="middle" fill={textPrimary} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                    API Gateway
                  </text>
                  <text x="70" y="48" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Stateless FastAPI
                  </text>
                  
                  {/* Dedup Hash Check Box */}
                  <rect x="15" y="60" width="110" height="26" rx="4" fill={isLight ? '#f1f5f9' : '#1e293b'} />
                  <text x="70" y="77" textAnchor="middle" fill={textSecondary} fontSize="9" fontFamily="monospace">
                    SHA-256 Dedup
                  </text>

                  {/* 202 Accepted Badge */}
                  <rect x="15" y="94" width="110" height="28" rx="6" fill={isLight ? '#dcfce7' : '#064e3b'} />
                  <text x="70" y="112" textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="bold" fontFamily="monospace">
                    HTTP 202 (&lt;15ms)
                  </text>
                </g>

                {/* NODE 3: REDIS STREAMS BUFFER (Middle-Right) */}
                <g transform="translate(450, 130)" filter="url(#hld-shadow)">
                  <rect x="0" y="0" width="140" height="140" rx="12" fill={cardBg} stroke="#818cf8" strokeWidth="3" />
                  <text x="70" y="30" textAnchor="middle" fill={textPrimary} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                    Job Queue
                  </text>
                  <text x="70" y="48" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Redis Streams
                  </text>

                  {/* Queue Buffer Visualizer */}
                  <g transform="translate(15, 62)">
                    <rect x="0" y="0" width="110" height="60" rx="6" fill={isLight ? '#e0e7ff' : '#1e1b4b'} />
                    <text x="55" y="20" textAnchor="middle" fill="#6366f1" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      XADD Buffer
                    </text>
                    <text x="55" y="38" textAnchor="middle" fill={textSecondary} fontSize="9" fontFamily="sans-serif">
                      1,000 Burst Jobs
                    </text>
                    <text x="55" y="52" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">
                      Zero Dropped
                    </text>
                  </g>
                </g>

                {/* NODE 4: CGROUP ISOLATED WORKER (Right) */}
                <g transform="translate(650, 110)" filter="url(#hld-shadow)">
                  <rect
                    x="0"
                    y="0"
                    width="190"
                    height="180"
                    rx="14"
                    fill={cardBg}
                    stroke={isThrottled ? '#ef4444' : '#fb7185'}
                    strokeWidth={isThrottled ? '4' : '3'}
                    className="transition-all duration-300"
                  />
                  <text x="95" y="28" textAnchor="middle" fill={textPrimary} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                    Sandbox Worker
                  </text>
                  <text x="95" y="46" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Cgroups v2 + Isolate
                  </text>

                  {/* Sandbox Protection Layers */}
                  <g transform="translate(15, 58)">
                    {/* Layer 1: PIDs */}
                    <rect x="0" y="0" width="160" height="26" rx="4" fill={chaosMode === 'fork_bomb' ? '#7f1d1d' : isLight ? '#f1f5f9' : '#1e293b'} />
                    <text x="80" y="17" textAnchor="middle" fill={chaosMode === 'fork_bomb' ? '#fca5a5' : textSecondary} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      pids.max = 32 (RLIMIT)
                    </text>

                    {/* Layer 2: RAM */}
                    <rect x="0" y="32" width="160" height="26" rx="4" fill={isLight ? '#f1f5f9' : '#1e293b'} />
                    <text x="80" y="49" textAnchor="middle" fill={textSecondary} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      memory.max = 256MB
                    </text>

                    {/* Layer 3: Network & Seccomp */}
                    <rect x="0" y="64" width="160" height="26" rx="4" fill={isLight ? '#f1f5f9' : '#1e293b'} />
                    <text x="80" y="81" textAnchor="middle" fill={textSecondary} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      netns: Loopback (0 Net)
                    </text>
                  </g>

                  {/* Watchdog Status */}
                  <text x="95" y="168" textAnchor="middle" fill={isThrottled ? '#ef4444' : '#10b981'} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    {isThrottled ? 'SIGKILL ENFORCED' : 'SEPARATE KERNEL JAIL'}
                  </text>
                </g>

                {/* VERDICT POPUP CARD */}
                {isVerdictReady && (
                  <g transform="translate(290, 15)">
                    <rect
                      x="0"
                      y="0"
                      width="300"
                      height="65"
                      rx="12"
                      fill={isThrottled ? (isLight ? '#fef2f2' : '#450a0a') : (isLight ? '#f0fdf4' : '#064e3b')}
                      stroke={isThrottled ? '#ef4444' : '#10b981'}
                      strokeWidth="2.5"
                    />
                    <text
                      x="150"
                      y="26"
                      textAnchor="middle"
                      fill={isThrottled ? '#ef4444' : '#10b981'}
                      fontSize="14"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {chaosMode === 'fork_bomb'
                        ? '⚡ RUNTIME ERROR (Fork Blocked)'
                        : chaosMode === 'infinite_loop'
                        ? '⚡ TIME LIMIT EXCEEDED (2.0s TLE)'
                        : '✓ VERDICT: ACCEPTED'}
                    </text>
                    <text
                      x="150"
                      y="46"
                      textAnchor="middle"
                      fill={isLight ? '#334155' : '#e2e8f0'}
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {chaosMode === 'fork_bomb'
                        ? 'Cgroup capped PIDs at 32. Host 100% stable.'
                        : chaosMode === 'infinite_loop'
                        ? 'CPU watchdog terminated spinning thread.'
                        : 'Passed 3/3 test cases in 42ms · 14.2MB RAM'}
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
