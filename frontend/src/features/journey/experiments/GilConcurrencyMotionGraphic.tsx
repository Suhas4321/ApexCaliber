import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Flame, Zap } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function GilConcurrencyMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [strategyMode, setStrategyMode] = useState<'threadpool_cpu_bottleneck' | 'threadpool_io_optimal' | 'processpool_parallel_speedup'>('threadpool_cpu_bottleneck')

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

  let hardwareEfficiency = '25%'
  let activeGilHolder = 'Thread #0'
  let coreStates: ('CRUNCHING' | 'STALLED' | 'IO_WAIT' | 'IDLE')[] = ['CRUNCHING', 'STALLED', 'STALLED', 'STALLED']
  let wallClockTime = '800 ms'

  if (currentTime < 3.0) {
    // Act 1: Workload Dispatch Phase
    subtitle = 'Act 1 (0.0s – 3.0s): Workload Ingress. 4 concurrent tasks dispatched to pool. Machine has 4 physical CPU cores ready.'
    if (strategyMode === 'threadpool_io_optimal') {
      coreStates = ['IO_WAIT', 'IO_WAIT', 'IO_WAIT', 'IO_WAIT']
      hardwareEfficiency = '100% (IO Overlap)'
      wallClockTime = '200 ms'
      metrics = [
        { label: 'Workload Type', value: '4x Network I/O Tasks (HTTP)', variant: 'default' },
        { label: 'Pool Strategy', value: 'ThreadPoolExecutor', variant: 'default' },
        { label: 'GIL Status', value: 'Released during socket wait', variant: 'success' },
        { label: 'Estimated Latency', value: '200 ms (Non-blocking)', variant: 'success' },
      ]
    } else if (strategyMode === 'processpool_parallel_speedup') {
      coreStates = ['CRUNCHING', 'CRUNCHING', 'CRUNCHING', 'CRUNCHING']
      hardwareEfficiency = '100% (4 Cores)'
      wallClockTime = '215 ms'
      metrics = [
        { label: 'Workload Type', value: '4x CPU-Bound (OCR Resizing)', variant: 'default' },
        { label: 'Pool Strategy', value: 'ProcessPoolExecutor', variant: 'success' },
        { label: 'Process Isolation', value: '4 Separate Processes + 4 GILs', variant: 'success' },
        { label: 'IPC Overhead', value: '15 ms (Pickle serialization)', variant: 'default' },
      ]
    } else {
      // ThreadPool CPU Bottleneck
      coreStates = ['CRUNCHING', 'STALLED', 'STALLED', 'STALLED']
      hardwareEfficiency = '25% (1 Core)'
      wallClockTime = '800 ms'
      metrics = [
        { label: 'Workload Type', value: '4x CPU-Bound (OCR Resizing)', variant: 'danger' },
        { label: 'Pool Strategy', value: 'ThreadPoolExecutor', variant: 'warning' },
        { label: 'GIL Lock', value: '1 Shared Mutex across all threads', variant: 'danger' },
        { label: 'CPU Utilization', value: '1 of 4 Cores Active (25%)', variant: 'danger' },
      ]
    }
  } else if (currentTime < 6.0) {
    // Act 2: Execution Start & The GIL Battle
    if (strategyMode === 'threadpool_cpu_bottleneck') {
      activeGilHolder = 'Thread #0 (Holding GIL)'
      coreStates = ['CRUNCHING', 'STALLED', 'STALLED', 'STALLED']
      subtitle = 'Act 2 (3.0s – 6.0s): The GIL Bottleneck! Thread 0 holds the lock on Core 0. Threads 1–3 stall with False Alarm contention on Cores 1–3.'
      metrics = [
        { label: 'Active Runner', value: 'Core 0: Thread #0 (Crunching)', variant: 'default' },
        { label: 'Contention Stalls', value: 'Cores 1, 2, 3: BLOCKED ON GIL', variant: 'danger' },
        { label: 'CPU Core Waste', value: '3 Cores Wasting Cycles (75% Idle)', variant: 'danger' },
        { label: 'David Beazley Model', value: 'Red Zone Context Thrashing', variant: 'danger' },
      ]
    } else if (strategyMode === 'threadpool_io_optimal') {
      subtitle = 'Act 2 (3.0s – 6.0s): GIL Released for I/O! As each thread hits socket wait, it yields the GIL (`Py_BEGIN_ALLOW_THREADS`). All 4 overlap!'
      coreStates = ['IO_WAIT', 'IO_WAIT', 'IO_WAIT', 'IO_WAIT']
      metrics = [
        { label: 'I/O Non-Blocking', value: 'Py_BEGIN_ALLOW_THREADS Active', variant: 'success' },
        { label: 'Kernel Sockets', value: 'All 4 waiting concurrently', variant: 'success' },
        { label: 'GIL Contention', value: '0% Contention (Clean Yields)', variant: 'success' },
        { label: 'Overhead', value: 'Ultra-low thread memory footprint', variant: 'success' },
      ]
    } else {
      // ProcessPool
      subtitle = 'Act 2 (3.0s – 6.0s): True Multi-Core Parallelism! Each process boots an independent Python VM with its own GIL. All 4 cores 100% active!'
      coreStates = ['CRUNCHING', 'CRUNCHING', 'CRUNCHING', 'CRUNCHING']
      metrics = [
        { label: 'OS Processes', value: 'PID 101, 102, 103, 104 running', variant: 'success' },
        { label: 'Hardware Parallelism', value: '4 of 4 Physical Cores Pegged', variant: 'success' },
        { label: 'GIL Interference', value: 'ZERO (Independent Interpreter VMs)', variant: 'success' },
        { label: 'Processing Speed', value: '4x Parallel Compute Rate', variant: 'success' },
      ]
    }
  } else if (currentTime < 9.0) {
    // Act 3: Progression & Mid-Flight Timeline
    if (strategyMode === 'threadpool_cpu_bottleneck') {
      activeGilHolder = 'Thread #1 (Ping-Pong Swap)'
      coreStates = ['STALLED', 'CRUNCHING', 'STALLED', 'STALLED']
      subtitle = 'Act 3 (6.0s – 9.0s): Context-Switching Thrash! OS swaps GIL from Thread 0 to Thread 1. Still only 1 core computes. Zero parallel speedup!'
      metrics = [
        { label: 'Lock Swap', value: 'Thread 0 -> Thread 1', variant: 'warning' },
        { label: 'Wall-Clock Drag', value: 'Serialized Execution (800ms total)', variant: 'danger' },
        { label: 'Multi-Core Speedup', value: '1.0x (No Speedup over 1 Core)', variant: 'danger' },
        { label: 'Diagnostic', value: 'GIL_BOTTLENECK_DETECTED = True', variant: 'danger' },
      ]
    } else if (strategyMode === 'threadpool_io_optimal') {
      subtitle = 'Act 3 (6.0s – 9.0s): Rapid I/O Resolution. Network responses return simultaneously. Fast deserialization without process spawning overhead.'
      coreStates = ['CRUNCHING', 'CRUNCHING', 'CRUNCHING', 'CRUNCHING']
      metrics = [
        { label: 'Network Response', value: 'All 4 HTTP Payloads Received', variant: 'success' },
        { label: 'Concurrent Parsing', value: 'Fast JSON parsing in shared RAM', variant: 'success' },
        { label: 'Thread Advantage', value: 'Zero IPC serialization penalty', variant: 'success' },
        { label: 'Wall-Clock Time', value: '200 ms total elapsed', variant: 'success' },
      ]
    } else {
      // ProcessPool
      subtitle = 'Act 3 (6.0s – 9.0s): Parallel Tasks Finishing! All 4 OCR chunks processed in parallel in 200ms. Result tuples packaged for parent IPC.'
      coreStates = ['CRUNCHING', 'CRUNCHING', 'CRUNCHING', 'CRUNCHING']
      metrics = [
        { label: 'Task Execution', value: 'Parallel OCR Finished (200ms)', variant: 'success' },
        { label: 'Hardware Saturation', value: '100% Core Efficiency Achieved', variant: 'success' },
        { label: 'Speedup Factor', value: '3.7x Wall-Clock Speedup', variant: 'success' },
        { label: 'Inter-Process Comm', value: 'Pickle return pipe active', variant: 'default' },
      ]
    }
  } else {
    // Act 4: Verdict & Final Metric Matrix
    if (strategyMode === 'threadpool_cpu_bottleneck') {
      hardwareEfficiency = '25%'
      wallClockTime = '800 ms'
      subtitle = 'Act 4 (9.0s – 12.0s): Bottleneck Confirmed. ThreadPool took 800ms on a 4-core machine. Workload Advisor recommends ProcessPoolExecutor!'
      metrics = [
        { label: 'Final Wall Time', value: '800 ms (Serialized under GIL)', variant: 'danger' },
        { label: 'Hardware Waste', value: '3 Cores Unutilized (75% Loss)', variant: 'danger' },
        { label: 'Recommended Fix', value: 'ProcessPoolExecutor', variant: 'success' },
        { label: 'Expected Speedup', value: '3.7x Faster (800ms -> 215ms)', variant: 'success' },
      ]
    } else if (strategyMode === 'threadpool_io_optimal') {
      hardwareEfficiency = '100%'
      wallClockTime = '200 ms'
      subtitle = 'Act 4 (9.0s – 12.0s): Optimal Choice! For I/O tasks, ThreadPoolExecutor achieves peak concurrency with zero IPC serialization cost.'
      metrics = [
        { label: 'Final Wall Time', value: '200 ms (Peak I/O Concurrency)', variant: 'success' },
        { label: 'Memory Footprint', value: 'Shared Memory (Low RAM)', variant: 'success' },
        { label: 'Recommended Pool', value: 'ThreadPoolExecutor', variant: 'success' },
        { label: 'GIL Bottleneck', value: 'False (Zero GIL Contention)', variant: 'success' },
      ]
    } else {
      hardwareEfficiency = '100%'
      wallClockTime = '215 ms'
      subtitle = 'Act 4 (9.0s – 12.0s): True Parallel Triumph! ProcessPool finished in 215ms (including IPC). 3.7x faster than threaded execution!'
      metrics = [
        { label: 'Final Wall Time', value: '215 ms (200ms CPU + 15ms IPC)', variant: 'success' },
        { label: 'Multi-Core Speedup', value: '3.7x Faster than ThreadPool', variant: 'success' },
        { label: 'Core Utilization', value: '100% (4 Physical Cores Pegged)', variant: 'success' },
        { label: 'Verdict', value: 'ProcessPoolExecutor is Superior', variant: 'success' },
      ]
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      <MotionGraphicPlayer
        title="Python GIL & ThreadPool vs ProcessPool Hardware Concurrency (David Beazley Model)"
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
              onClick={() => { setStrategyMode('threadpool_cpu_bottleneck'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'threadpool_cpu_bottleneck'
                  ? 'bg-rose-950/50 text-rose-300 font-bold border border-rose-600/60 shadow-xs'
                  : 'text-muted hover:text-rose-300'
              }`}
            >
              <Flame size={12} />
              <span>ThreadPool (CPU GIL Thrash)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('threadpool_io_optimal'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'threadpool_io_optimal'
                  ? 'bg-sky-950/50 text-sky-300 font-bold border border-sky-600/60 shadow-xs'
                  : 'text-muted hover:text-sky-300'
              }`}
            >
              <Zap size={12} />
              <span>ThreadPool (I/O Non-Blocking)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('processpool_parallel_speedup'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'processpool_parallel_speedup'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>ProcessPool (True Multi-Core)</span>
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
          const pythonYellow = '#eab308'
          const pythonBlue = '#38bdf8'
          const successGreen = '#10b981'
          const dangerRed = '#ef4444'
          const warningAmber = '#f59e0b'

          return (
            <div className="relative w-full aspect-[16/10] max-w-[880px] mx-auto py-2">
              <svg viewBox="0 0 900 520" className="w-full h-full transition-all duration-300">
                <defs>
                  <marker id="gil-arrow-yellow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={pythonYellow} />
                  </marker>
                  <marker id="gil-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={successGreen} />
                  </marker>
                  <filter id="gil-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity={isLight ? '0.08' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* ==================== 1. TASK WORKLOAD INGRESS (Left) ==================== */}
                <g transform="translate(30, 50)" filter="url(#gil-shadow)">
                  <rect
                    width="210"
                    height="410"
                    rx="14"
                    fill={cardBg}
                    stroke={cardBorder}
                    strokeWidth="1"
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="210" height="38" rx="14" fill={isLight ? '#fefce8' : '#422006'} />
                  <circle cx="18" cy="19" r="6" fill={pythonYellow} />
                  <text x="32" y="24" fill={textPrimary} fontSize="12" fontWeight="700">
                    Workload Dispatcher
                  </text>

                  {/* Body Content */}
                  <g transform="translate(14, 55)">
                    <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="bold">
                      INCOMING TASK BATCH (4 Tasks)
                    </text>
                    
                    {/* Task 1 */}
                    <g transform="translate(0, 24)">
                      <rect x="0" y="0" width="182" height="42" rx="6" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                      <text x="10" y="18" fill={textPrimary} fontSize="10" fontWeight="bold" fontFamily="monospace">
                        Task #0: {strategyMode === 'threadpool_io_optimal' ? 'HTTP Fetch' : 'OCR Resizing'}
                      </text>
                      <text x="10" y="32" fill={strategyMode === 'threadpool_io_optimal' ? pythonBlue : warningAmber} fontSize="9" fontFamily="monospace">
                        {strategyMode === 'threadpool_io_optimal' ? 'Type: I/O (200ms)' : 'Type: CPU (200ms)'}
                      </text>
                    </g>

                    {/* Task 2 */}
                    <g transform="translate(0, 74)">
                      <rect x="0" y="0" width="182" height="42" rx="6" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                      <text x="10" y="18" fill={textPrimary} fontSize="10" fontWeight="bold" fontFamily="monospace">
                        Task #1: {strategyMode === 'threadpool_io_optimal' ? 'API DB Seek' : 'Matrix Multiply'}
                      </text>
                      <text x="10" y="32" fill={strategyMode === 'threadpool_io_optimal' ? pythonBlue : warningAmber} fontSize="9" fontFamily="monospace">
                        {strategyMode === 'threadpool_io_optimal' ? 'Type: I/O (200ms)' : 'Type: CPU (200ms)'}
                      </text>
                    </g>

                    {/* Task 3 */}
                    <g transform="translate(0, 124)">
                      <rect x="0" y="0" width="182" height="42" rx="6" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                      <text x="10" y="18" fill={textPrimary} fontSize="10" fontWeight="bold" fontFamily="monospace">
                        Task #2: {strategyMode === 'threadpool_io_optimal' ? 'File Read' : 'Crypto Hash'}
                      </text>
                      <text x="10" y="32" fill={strategyMode === 'threadpool_io_optimal' ? pythonBlue : warningAmber} fontSize="9" fontFamily="monospace">
                        {strategyMode === 'threadpool_io_optimal' ? 'Type: I/O (200ms)' : 'Type: CPU (200ms)'}
                      </text>
                    </g>

                    {/* Task 4 */}
                    <g transform="translate(0, 174)">
                      <rect x="0" y="0" width="182" height="42" rx="6" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                      <text x="10" y="18" fill={textPrimary} fontSize="10" fontWeight="bold" fontFamily="monospace">
                        Task #3: {strategyMode === 'threadpool_io_optimal' ? 'DNS Lookup' : 'Video Encode'}
                      </text>
                      <text x="10" y="32" fill={strategyMode === 'threadpool_io_optimal' ? pythonBlue : warningAmber} fontSize="9" fontFamily="monospace">
                        {strategyMode === 'threadpool_io_optimal' ? 'Type: I/O (200ms)' : 'Type: CPU (200ms)'}
                      </text>
                    </g>
                  </g>

                  {/* Recommendation Card */}
                  <g transform="translate(14, 295)">
                    <rect
                      x="0"
                      y="0"
                      width="182"
                      height="95"
                      rx="8"
                      fill={
                        strategyMode === 'threadpool_cpu_bottleneck'
                          ? isLight ? '#fee2e2' : '#450a0a'
                          : isLight ? '#f0fdf4' : '#052e16'
                      }
                      stroke={strategyMode === 'threadpool_cpu_bottleneck' ? dangerRed : successGreen}
                    />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      WORKLOAD ADVISOR
                    </text>
                    <text
                      x="10"
                      y="38"
                      fill={strategyMode === 'threadpool_cpu_bottleneck' ? dangerRed : successGreen}
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {strategyMode === 'threadpool_cpu_bottleneck'
                        ? 'BOTTLENECK DETECTED'
                        : 'OPTIMAL STRATEGY'}
                    </text>
                    <text x="10" y="56" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      {strategyMode === 'threadpool_cpu_bottleneck'
                        ? 'CPU tasks serialize under GIL'
                        : strategyMode === 'threadpool_io_optimal'
                        ? 'I/O avoids IPC overhead'
                        : 'Processes parallelize CPU'}
                    </text>
                    <text
                      x="10"
                      y="78"
                      fill={strategyMode === 'threadpool_cpu_bottleneck' ? dangerRed : successGreen}
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      Rec: {strategyMode === 'threadpool_cpu_bottleneck' ? 'ProcessPoolExecutor' : strategyMode === 'threadpool_io_optimal' ? 'ThreadPoolExecutor' : 'ProcessPoolExecutor'}
                    </text>
                  </g>
                </g>

                {/* ==================== 2. CPYTHON RUNTIME & THE GIL (Center) ==================== */}
                <g transform="translate(265, 50)" filter="url(#gil-shadow)">
                  <rect
                    width="330"
                    height="410"
                    rx="14"
                    fill={cardBg}
                    stroke={strategyMode === 'threadpool_cpu_bottleneck' ? dangerRed : cardBorder}
                    strokeWidth={strategyMode === 'threadpool_cpu_bottleneck' ? 1.5 : 1}
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="330" height="42" rx="14" fill={isLight ? '#f0f9ff' : '#0c4a6e'} />
                  <circle cx="20" cy="21" r="7" fill={pythonBlue} />
                  <text x="35" y="26" fill={textPrimary} fontSize="13" fontWeight="800">
                    CPython Runtime & The GIL Architecture
                  </text>

                  {/* Internal Software Structure */}
                  {strategyMode === 'processpool_parallel_speedup' ? (
                    // 4 Independent Processes View
                    <g transform="translate(15, 55)">
                      <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="700">
                        MULTIPROCESSING ISOLATION (4 Independent GILs)
                      </text>
                      {[0, 1, 2, 3].map((pid) => (
                        <g key={pid} transform={`translate(0, ${25 + pid * 75})`}>
                          <rect x="0" y="0" width="300" height="66" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                          <rect x="0" y="0" width="6" height="66" rx="3" fill={successGreen} />
                          <text x="14" y="20" fill={textPrimary} fontSize="11" fontWeight="bold" fontFamily="monospace">
                            OS Process #{pid} (PID {1000 + pid})
                          </text>
                          <text x="14" y="38" fill={textSecondary} fontSize="10" fontFamily="monospace">
                            Memory: Isolated 48MB RAM Space
                          </text>
                          <g transform="translate(200, 14)">
                            <rect x="0" y="0" width="85" height="36" rx="6" fill={isLight ? '#dcfce7' : '#052e16'} stroke={successGreen} />
                            <text x="42" y="16" textAnchor="middle" fill={successGreen} fontSize="9" fontWeight="bold">
                              LOCAL GIL #{pid}
                            </text>
                            <text x="42" y="29" textAnchor="middle" fill={successGreen} fontSize="8" fontFamily="monospace">
                              UNLOCKED
                            </text>
                          </g>
                        </g>
                      ))}
                    </g>
                  ) : (
                    // Single Process with Shared GIL View
                    <g transform="translate(15, 55)">
                      <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="700">
                        SINGLE PROCESS ENVELOPE (PID 4091, 1 Shared GIL)
                      </text>

                      {/* Central Giant GIL Lock Token */}
                      <g transform="translate(20, 30)">
                        <rect
                          x="0"
                          y="0"
                          width="260"
                          height="85"
                          rx="10"
                          fill={strategyMode === 'threadpool_cpu_bottleneck' ? (isLight ? '#fee2e2' : '#450a0a') : isLight ? '#fefce8' : '#422006'}
                          stroke={strategyMode === 'threadpool_cpu_bottleneck' ? dangerRed : pythonYellow}
                          strokeWidth="2"
                        />
                        <circle cx="30" cy="42" r="14" fill={strategyMode === 'threadpool_cpu_bottleneck' ? dangerRed : pythonYellow} />
                        <text x="56" y="36" fill={textPrimary} fontSize="13" fontWeight="800">
                          GLOBAL INTERPRETER LOCK
                        </text>
                        <text x="56" y="52" fill={textSecondary} fontSize="10" fontFamily="monospace">
                          State: <tspan fill={strategyMode === 'threadpool_cpu_bottleneck' ? dangerRed : successGreen} fontWeight="bold">
                            {strategyMode === 'threadpool_cpu_bottleneck' ? 'MUTEX ACQUIRED (SERIALLY)' : 'RELEASED (I/O YIELD)'}
                          </tspan>
                        </text>
                        <text x="56" y="68" fill={textSecondary} fontSize="9" fontFamily="monospace">
                          Current Holder: {activeGilHolder}
                        </text>
                      </g>

                      {/* 4 Competing Threads */}
                      <g transform="translate(0, 130)">
                        <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="bold">
                          COMPETING OS THREADS (Shared Virtual Memory)
                        </text>
                        {[0, 1, 2, 3].map((tid) => {
                          const isHolding = tid === 0 && currentTime < 6.0 || tid === 1 && currentTime >= 6.0 && currentTime < 9.0
                          const isStalled = strategyMode === 'threadpool_cpu_bottleneck' && !isHolding

                          return (
                            <g key={tid} transform={`translate(0, ${22 + tid * 50})`}>
                              <rect
                                x="0"
                                y="0"
                                width="300"
                                height="42"
                                rx="6"
                                fill={
                                  isHolding
                                    ? isLight ? '#dcfce7' : '#052e16'
                                    : isStalled
                                    ? isLight ? '#fee2e2' : '#450a0a'
                                    : isLight ? '#f0f9ff' : '#082f49'
                                }
                                stroke={
                                  isHolding
                                    ? successGreen
                                    : isStalled
                                    ? dangerRed
                                    : pythonBlue
                                }
                              />
                              <text x="12" y="18" fill={textPrimary} fontSize="10" fontWeight="bold" fontFamily="monospace">
                                Native Thread #{tid}
                              </text>
                              <text
                                x="12"
                                y="32"
                                fill={
                                  isHolding
                                    ? successGreen
                                    : isStalled
                                    ? dangerRed
                                    : pythonBlue
                                }
                                fontSize="9"
                                fontFamily="monospace"
                              >
                                {isHolding
                                  ? '🟢 Holds GIL -> Bytecode Running'
                                  : isStalled
                                  ? '🔴 BLOCKED: False Alarm Contention'
                                  : '🔵 Non-blocking socket wait'}
                              </text>
                              <text
                                x="288"
                                y="25"
                                textAnchor="end"
                                fill={textSecondary}
                                fontSize="9"
                                fontFamily="monospace"
                              >
                                {isHolding ? 'ACTIVE' : isStalled ? 'STALLED' : 'WAIT'}
                              </text>
                            </g>
                          )
                        })}
                      </g>
                    </g>
                  )}
                </g>

                {/* ==================== 3. PHYSICAL 4-CORE CPU HARDWARE (Right) ==================== */}
                <g transform="translate(620, 50)" filter="url(#gil-shadow)">
                  <rect
                    width="250"
                    height="410"
                    rx="14"
                    fill={cardBg}
                    stroke={cardBorder}
                    strokeWidth="1"
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="250" height="38" rx="14" fill={isLight ? '#f1f5f9' : '#1e293b'} />
                  <circle cx="18" cy="19" r="6" fill={hardwareEfficiency === '100%' ? successGreen : dangerRed} />
                  <text x="32" y="24" fill={textPrimary} fontSize="12" fontWeight="700">
                    Physical CPU Cores (Silicon)
                  </text>

                  {/* Body: 4 CPU Core Meters */}
                  <g transform="translate(14, 50)">
                    {[0, 1, 2, 3].map((coreId) => {
                      const state = coreStates[coreId]
                      const isCrunching = state === 'CRUNCHING'
                      const isStalled = state === 'STALLED'
                      const isIo = state === 'IO_WAIT'

                      return (
                        <g key={coreId} transform={`translate(0, ${coreId * 66})`}>
                          <rect
                            x="0"
                            y="0"
                            width="222"
                            height="58"
                            rx="8"
                            fill={
                              isCrunching
                                ? isLight ? '#dcfce7' : '#052e16'
                                : isStalled
                                ? isLight ? '#fee2e2' : '#450a0a'
                                : isLight ? '#f8fafc' : '#0b0f19'
                            }
                            stroke={isCrunching ? successGreen : isStalled ? dangerRed : cardBorder}
                          />
                          <text x="12" y="20" fill={textPrimary} fontSize="11" fontWeight="bold" fontFamily="monospace">
                            CPU Core #{coreId}
                          </text>
                          <text
                            x="12"
                            y="36"
                            fill={isCrunching ? successGreen : isStalled ? dangerRed : pythonBlue}
                            fontSize="10"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {isCrunching ? '100% UTILIZED' : isStalled ? '0% (GIL STALL)' : isIo ? 'WAITING KERNEL I/O' : 'IDLE'}
                          </text>
                          {/* Progress bar */}
                          <rect x="12" y="44" width="198" height="6" rx="2" fill={isLight ? '#e2e8f0' : '#1e293b'} />
                          <rect
                            x="12"
                            y="44"
                            width={isCrunching ? 198 : isStalled ? 10 : isIo ? 90 : 0}
                            height="6"
                            rx="2"
                            fill={isCrunching ? successGreen : isStalled ? dangerRed : pythonBlue}
                          />
                        </g>
                      )
                    })}
                  </g>

                  {/* Global Efficiency Meter */}
                  <g transform="translate(14, 325)">
                    <rect
                      x="0"
                      y="0"
                      width="222"
                      height="70"
                      rx="8"
                      fill={
                        hardwareEfficiency === '100%'
                          ? isLight ? '#f0fdf4' : '#052e16'
                          : isLight ? '#fee2e2' : '#450a0a'
                      }
                      stroke={hardwareEfficiency === '100%' ? successGreen : dangerRed}
                    />
                    <text x="10" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      HARDWARE CORE EFFICIENCY
                    </text>
                    <text
                      x="10"
                      y="42"
                      fill={hardwareEfficiency === '100%' ? successGreen : dangerRed}
                      fontSize="18"
                      fontWeight="800"
                      fontFamily="monospace"
                    >
                      {hardwareEfficiency} ({wallClockTime})
                    </text>
                    <text x="10" y="58" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      {hardwareEfficiency === '100%' ? 'Full Multi-Core Saturation' : 'Severe GIL Contention Loss'}
                    </text>
                  </g>
                </g>

                {/* Conflict / GIL Contention Overlay */}
                {currentTime >= 3.0 && currentTime < 9.0 && strategyMode === 'threadpool_cpu_bottleneck' && (
                  <g transform="translate(430, 240)" filter="url(#gil-shadow)">
                    <rect x="-95" y="-24" width="190" height="48" rx="8" fill="#991b1b" stroke={dangerRed} strokeWidth="2" />
                    <text x="0" y="-4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                      GIL LOCK CONTENTION!
                    </text>
                    <text x="0" y="14" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace">
                      3 Physical Cores Stalled
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
