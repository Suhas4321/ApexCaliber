import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function VirtualMemoryMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [algorithm, setAlgorithm] = useState<'LRU' | 'FIFO'>('LRU')

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

  // Calculate Frames, Subtitle, and Metrics based on currentTime and algorithm
  let subtitle = ''
  let metrics: { label: string; value: string; variant?: 'default' | 'success' | 'warning' | 'danger' }[] = []
  let activePage = 1
  let frames: number[] = []
  let isPageHit = false
  let isThrashing = false

  if (currentTime < 2.5) {
    activePage = 1
    frames = [1]
    subtitle = '0.0s - 2.5s: Cold RAM Cache. CPU requests Page 1. MMU triggers Page Fault; loaded into Physical Frame 0 in 10ms.'
    metrics = [
      { label: 'CPU Request', value: 'Page 1', variant: 'default' },
      { label: 'Event', value: 'PAGE FAULT (Disk Fetch)', variant: 'warning' },
      { label: 'RAM Occupancy', value: '1 / 3 Frames', variant: 'default' },
    ]
  } else if (currentTime < 5.0) {
    activePage = 2
    frames = [1, 2, 3]
    subtitle = '2.5s - 5.0s: Pages 2 and 3 requested. Physical RAM fills completely (3/3 frames occupied). Zero free slots remaining.'
    metrics = [
      { label: 'CPU Requests', value: 'Pages 2 & 3', variant: 'default' },
      { label: 'RAM State', value: '3 / 3 (100% Full)', variant: 'warning' },
      { label: 'Active Frames', value: '[P1, P2, P3]', variant: 'default' },
    ]
  } else if (currentTime < 7.5) {
    activePage = 1
    isPageHit = true
    frames = algorithm === 'LRU' ? [2, 3, 1] : [1, 2, 3]
    subtitle = '5.0s - 7.5s: Temporal Locality! CPU accesses Page 1 again. Instant PAGE HIT (100ns in RAM, 0 disk I/O). Under LRU, P1 recency updates.'
    metrics = [
      { label: 'CPU Request', value: 'Page 1 (Again)', variant: 'success' },
      { label: 'MMU Result', value: 'PAGE HIT (100ns)', variant: 'success' },
      { label: 'LRU Recency', value: 'P1 marked Most Recent', variant: 'success' },
    ]
  } else if (currentTime < 10.0) {
    activePage = 4
    if (algorithm === 'LRU') {
      frames = [3, 1, 4]
      subtitle = '7.5s - 10.0s: Page 4 Requested (Fault). LRU evicts Page 2 (least recently used) to Swap Disk. Page 1 stays safe in RAM!'
      metrics = [
        { label: 'Eviction Victim', value: 'Page 2 -> Swap Disk', variant: 'warning' },
        { label: 'New Frame State', value: '[P3, P1, P4]', variant: 'success' },
        { label: 'Belady Anomaly', value: 'Immune (Stack Algo)', variant: 'success' },
      ]
    } else {
      frames = [4, 2, 3]
      isThrashing = true
      subtitle = '7.5s - 10.0s: FIFO ANOMALY! FIFO blindly evicts Page 1 (oldest loaded) even though it was just actively used. Order matching stalls!'
      metrics = [
        { label: 'Eviction Victim', value: 'Page 1 (Wrong Choice)', variant: 'danger' },
        { label: 'System Risk', value: 'THRASHING IMMINENT', variant: 'danger' },
        { label: 'Latency Spike', value: '15ms -> 12s Hang', variant: 'danger' },
      ]
    }
  } else {
    if (algorithm === 'LRU') {
      frames = [3, 1, 4]
      subtitle = '10.0s - 12.0s: Optimal Steady State. LRU hit rate exceeds 60%. Zerodha trading latency stays bounded under 15 milliseconds.'
      metrics = [
        { label: 'Final Hit Rate', value: '60% (Optimal)', variant: 'success' },
        { label: 'Trading Latency', value: '15 ms (Fast)', variant: 'success' },
        { label: 'CPU Utilization', value: '98% Execution', variant: 'success' },
      ]
    } else {
      frames = [4, 2, 3]
      isThrashing = true
      subtitle = '10.0s - 12.0s: SEVERE THRASHING. Page 1 immediately requested again, triggering another fault. CPU spends 99% time in disk I/O wait.'
      metrics = [
        { label: 'System State', value: 'THRASHING (Freeze)', variant: 'danger' },
        { label: 'Disk Swap Wait', value: '99% CPU Idle', variant: 'danger' },
        { label: 'Trading Engine', value: 'Orders Delayed 12s', variant: 'danger' },
      ]
    }
  }

  return (
    <div className="w-full space-y-4">
      <MotionGraphicPlayer
        title="Virtual Memory Page Replacement & Thrashing Defense"
        subtitle="12-Second Slow Walkthrough · Zerodha Kite Architecture, Silberschatz OS Paging & LRU vs FIFO"
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
              onClick={() => { setAlgorithm('LRU'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                algorithm === 'LRU'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>LRU (Safe)</span>
            </button>
            <button
              type="button"
              onClick={() => { setAlgorithm('FIFO'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                algorithm === 'FIFO'
                  ? 'bg-amber-950/50 text-amber-300 font-bold border border-amber-600/60 shadow-xs'
                  : 'text-muted hover:text-amber-300'
              }`}
            >
              <AlertTriangle size={12} />
              <span>FIFO (Thrashing)</span>
            </button>
          </div>
        }
      >
        {(canvasTheme) => {
          const isLight = canvasTheme === 'light'

          const textPrimary = isLight ? '#0f172a' : '#f8fafc'
          const textSecondary = isLight ? '#475569' : '#94a3b8'
          const cardBg = isLight ? '#ffffff' : '#0F1311'
          const cardBorder = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.14)'
          const mmuCobalt = isLight ? '#008A54' : '#00F59B'
          const ramGreen = '#10b981'
          const diskAmber = '#f59e0b'
          const dangerRed = '#ef4444'

          return (
            <div className="relative w-full aspect-[16/10] max-w-[840px] mx-auto py-2">
              <svg viewBox="0 0 880 500" className="w-full h-full transition-colors duration-300">
                <defs>
                  <marker id="vm-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#38bdf8" />
                  </marker>
                  <marker id="vm-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={ramGreen} />
                  </marker>
                  <marker id="vm-arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={diskAmber} />
                  </marker>
                  <filter id="vm-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity={isLight ? '0.1' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* FLOW CONNECTORS */}

                {/* 1. CPU -> MMU Translation */}
                <path d="M 160 210 L 230 210" fill="none" stroke="#38bdf8" strokeWidth="4" markerEnd="url(#vm-arrow-blue)" />

                {/* 2. MMU -> Physical RAM Frame Check */}
                <path d="M 380 210 L 440 210" fill="none" stroke={isPageHit ? ramGreen : '#38bdf8'} strokeWidth="4" markerEnd="url(#vm-arrow-blue)" />

                {/* 3. MMU -> Disk Swap on Page Fault */}
                {!isPageHit && (
                  <path
                    d="M 310 270 C 310 370, 710 370, 710 280"
                    fill="none"
                    stroke={diskAmber}
                    strokeWidth="3.5"
                    strokeDasharray="6 5"
                    markerEnd="url(#vm-arrow-amber)"
                  />
                )}

                {/* ==================== ARCHITECTURE NODES ==================== */}

                {/* NODE 1: CPU CORE (Left) */}
                <g transform="translate(30, 140)" filter="url(#vm-shadow)">
                  <rect x="0" y="0" width="130" height="140" rx="14" fill={cardBg} stroke="#38bdf8" strokeWidth="3" />
                  <text x="65" y="30" textAnchor="middle" fill={textPrimary} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                    CPU Core
                  </text>
                  <text x="65" y="48" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Trading Thread
                  </text>

                  {/* Virtual Address Register */}
                  <rect x="15" y="62" width="100" height="34" rx="6" fill={isLight ? '#f0f9ff' : '#0c4a6e'} />
                  <text x="65" y="80" textAnchor="middle" fill="#0284c7" fontSize="11" fontWeight="bold" fontFamily="monospace">
                    Page #{activePage}
                  </text>
                  <text x="65" y="91" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    Virtual Address
                  </text>

                  <text x="65" y="122" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    MMU LOOKUP
                  </text>
                </g>

                {/* NODE 2: MEMORY MANAGEMENT UNIT (MMU + TLB) */}
                <g transform="translate(230, 130)" filter="url(#vm-shadow)">
                  <rect x="0" y="0" width="150" height="160" rx="14" fill={cardBg} stroke={mmuCobalt} strokeWidth="3" />
                  <text x="75" y="30" textAnchor="middle" fill={textPrimary} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                    Hardware MMU
                  </text>
                  <text x="75" y="48" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    TLB Cache & Paging
                  </text>

                  {/* Hit / Miss Status Badge */}
                  <rect
                    x="15"
                    y="65"
                    width="120"
                    height="35"
                    rx="6"
                    fill={isPageHit ? (isLight ? '#dcfce7' : '#064e3b') : (isLight ? '#fffbeb' : '#451a03')}
                    stroke={isPageHit ? ramGreen : diskAmber}
                    strokeWidth="1.5"
                  />
                  <text
                    x="75"
                    y="86"
                    textAnchor="middle"
                    fill={isPageHit ? ramGreen : diskAmber}
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {isPageHit ? '✓ PAGE HIT' : '⚡ PAGE FAULT'}
                  </text>

                  {/* Latency metric */}
                  <text x="75" y="122" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    {isPageHit ? 'Latency: 100 ns' : 'Disk I/O: 10 ms'}
                  </text>
                  <text x="75" y="142" textAnchor="middle" fill={isPageHit ? ramGreen : diskAmber} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                    {isPageHit ? 'Instant RAM Access' : '100,000x Slower!'}
                  </text>
                </g>

                {/* NODE 3: PHYSICAL RAM FRAMES (Center, 3 Slots) */}
                <g transform="translate(440, 80)" filter="url(#vm-shadow)">
                  <rect x="0" y="0" width="180" height="260" rx="16" fill={cardBg} stroke={ramGreen} strokeWidth="3" />
                  <text x="90" y="28" textAnchor="middle" fill={textPrimary} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                    Physical RAM
                  </text>
                  <text x="90" y="46" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    3 Page Frames (8 KiB each)
                  </text>

                  {/* 3 Frame Slots */}
                  <g transform="translate(20, 60)">
                    {[0, 1, 2].map((frameIdx) => {
                      const pageLoaded = frames[frameIdx]
                      return (
                        <g key={frameIdx} transform={`translate(0, ${frameIdx * 58})`}>
                          <rect
                            x="0"
                            y="0"
                            width="140"
                            height="48"
                            rx="8"
                            fill={pageLoaded ? (isLight ? '#ecfdf5' : '#064e3b') : (isLight ? '#f1f5f9' : '#1e293b')}
                            stroke={pageLoaded ? ramGreen : cardBorder}
                            strokeWidth="2"
                          />
                          <text x="15" y="24" fill={textPrimary} fontSize="12" fontWeight="bold" fontFamily="monospace">
                            Frame #{frameIdx}
                          </text>
                          <text x="15" y="38" fill={textSecondary} fontSize="9" fontFamily="sans-serif">
                            {pageLoaded ? `Holds Page [${pageLoaded}]` : 'Empty Slot'}
                          </text>
                          {pageLoaded && (
                            <circle cx="120" cy="24" r="5" fill={ramGreen} />
                          )}
                        </g>
                      )
                    })}
                  </g>

                  {/* Occupancy Summary */}
                  <text x="90" y="245" textAnchor="middle" fill={ramGreen} fontSize="10" fontWeight="bold" fontFamily="monospace">
                    {frames.length} / 3 Frames Active
                  </text>
                </g>

                {/* NODE 4: DISK SWAP SPACE / NVMe SSD (Right) */}
                <g transform="translate(670, 130)" filter="url(#vm-shadow)">
                  <rect x="0" y="0" width="160" height="160" rx="14" fill={cardBg} stroke={diskAmber} strokeWidth="3" />
                  <text x="80" y="30" textAnchor="middle" fill={textPrimary} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                    Swap Disk
                  </text>
                  <text x="80" y="48" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    NVMe SSD Storage
                  </text>

                  {/* Disk Platter Visual */}
                  <g transform="translate(15, 65)">
                    <rect x="0" y="0" width="130" height="50" rx="6" fill={isLight ? '#fffbeb' : '#451a03'} stroke={diskAmber} strokeWidth="1.5" />
                    <text x="65" y="22" textAnchor="middle" fill={diskAmber} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      Eviction Target
                    </text>
                    <text x="65" y="38" textAnchor="middle" fill={textSecondary} fontSize="9" fontFamily="sans-serif">
                      {algorithm === 'LRU' ? 'Victim: Page 2' : 'Victim: Page 1'}
                    </text>
                  </g>

                  <text x="80" y="142" textAnchor="middle" fill={textSecondary} fontSize="9" fontFamily="monospace">
                    10,000 µs Seek Penalty
                  </text>
                </g>

                {/* THRASHING WARNING BANNER OVERLAY */}
                {isThrashing && (
                  <g transform="translate(260, 20)">
                    <rect x="0" y="0" width="360" height="65" rx="12" fill={isLight ? '#fef2f2' : '#450a0a'} stroke={dangerRed} strokeWidth="2.5" />
                    <text x="180" y="26" textAnchor="middle" fill={dangerRed} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                      ⚡ SEVERE THRASHING (Belady Anomaly)
                    </text>
                    <text x="180" y="46" textAnchor="middle" fill={isLight ? '#991b1b' : '#fca5a5'} fontSize="10" fontFamily="monospace">
                      FIFO evicted active page. Trading terminal frozen!
                    </text>
                    <text x="180" y="58" textAnchor="middle" fill={isLight ? '#7f1d1d' : '#fecaca'} fontSize="9" fontFamily="sans-serif">
                      CPU spends 99% time in disk I/O swap wait.
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
