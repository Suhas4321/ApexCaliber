import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Flame, Users } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function CollabDocMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [strategyMode, setStrategyMode] = useState<'crdt_sync' | 'lww_overwrite' | 'pessimistic_lock'>('crdt_sync')

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
  let isLwwClobbered = false
  let isPessimisticBlocked = false

  if (currentTime < 3.0) {
    subtitle = '0.0s - 3.0s: Stateful WebSocket Room. Alice and Bob connect to document_402. Gateway attaches sockets to Redis Pub/Sub room mesh (<30ms hop).'
    metrics = [
      { label: 'Room Mesh', value: 'room:doc_402 (Active)', variant: 'default' },
      { label: 'Connected Peers', value: 'Alice & Bob (Online)', variant: 'success' },
      { label: 'Sync Protocol', value: 'Character Delta CRDT', variant: 'success' },
      { label: 'Keystroke Latency', value: '18 ms (Sub-50ms SLA)', variant: 'success' },
    ]
  } else if (currentTime < 6.0) {
    if (strategyMode === 'lww_overwrite') {
      isLwwClobbered = true
      subtitle = '3.0s - 6.0s: LOST UPDATE DISASTER! Bob\'s full-document POST arrives 20ms later. Last-Write-Wins overwrites Alice\'s paragraph completely!'
      metrics = [
        { label: 'Strategy', value: 'Last-Write-Wins (LWW)', variant: 'danger' },
        { label: 'Bandwidth Waste', value: '2 MB JSON per Keystroke', variant: 'danger' },
        { label: 'Data Integrity', value: 'Alice Edits Overwritten', variant: 'danger' },
        { label: 'Conflict Result', value: 'LOST UPDATES (Fatal)', variant: 'danger' },
      ]
    } else if (strategyMode === 'pessimistic_lock') {
      isPessimisticBlocked = true
      subtitle = '3.0s - 6.0s: PESSIMISTIC LOCK STALL. Alice holds exclusive write lock on paragraph 1. Bob attempts to type; UI freezes with red padlock!'
      metrics = [
        { label: 'Strategy', value: 'Pessimistic Row Lock', variant: 'warning' },
        { label: 'Alice Status', value: 'Lock Held on Section 1', variant: 'default' },
        { label: 'Bob Status', value: 'BLOCKED (Read Only)', variant: 'danger' },
        { label: 'User Experience', value: 'Anti-Collaborative Freeze', variant: 'danger' },
      ]
    } else {
      subtitle = '3.0s - 6.0s: Concurrent Typing. Alice inserts "A" at idx 10 while Bob deletes idx 8. CRDT fractional indexing orders deltas without locks.'
      metrics = [
        { label: 'Concurrent Edits', value: 'Alice Insert + Bob Delete', variant: 'warning' },
        { label: 'CRDT Lamport IDs', value: 'id=(Alice, 14), id=(Bob, 21)', variant: 'success' },
        { label: 'Commutative Merge', value: 'A o B == B o A', variant: 'success' },
        { label: 'Lock Contention', value: 'Zero (Lock-Free)', variant: 'success' },
      ]
    }
  } else if (currentTime < 9.0) {
    if (strategyMode === 'lww_overwrite') {
      isLwwClobbered = true
      subtitle = '6.0s - 9.0s: CORRUPTED DOCUMENT. Both users see conflicting versions of the document. Server cannot reconcile diverging trees.'
      metrics = [
        { label: 'State Divergence', value: 'Alice != Bob Content', variant: 'danger' },
        { label: 'Sync Status', value: 'UNRECONCILABLE', variant: 'danger' },
        { label: 'Network Ingress', value: '500k POSTs/sec (Overload)', variant: 'danger' },
        { label: 'Root Cause', value: 'Full Document Snapshot Sync', variant: 'danger' },
      ]
    } else if (strategyMode === 'pessimistic_lock') {
      isPessimisticBlocked = true
      subtitle = '6.0s - 9.0s: LOCK TIMEOUT & ABANDONMENT. Alice leaves browser tab open while holding lock. Bob cannot finish document and rage-quits!'
      metrics = [
        { label: 'Orphaned Lock', value: 'Alice Idle (Tab in BG)', variant: 'danger' },
        { label: 'Bob Wait Time', value: '35 seconds (Timed Out)', variant: 'danger' },
        { label: 'Collaboration', value: 'Zero Real-Time Teamwork', variant: 'danger' },
        { label: 'Fix', value: 'Migrate to Figma-Style CRDTs', variant: 'warning' },
      ]
    } else {
      subtitle = '6.0s - 9.0s: Snapshot Compaction. Operations append to WAL. Background worker rolls 100 deltas into S3 snapshot. Zero memory leaks.'
      metrics = [
        { label: 'Append-Only WAL', value: 'Op Log: 100 deltas saved', variant: 'success' },
        { label: 'S3 Compactor', value: 'Snapshot Rolled in BG', variant: 'success' },
        { label: 'Peer Broadcast', value: 'Redis Pub/Sub Fan-out', variant: 'success' },
        { label: 'State Convergence', value: 'Alice & Bob 100% Identical', variant: 'success' },
      ]
    }
  } else {
    if (strategyMode === 'lww_overwrite') {
      isLwwClobbered = true
      subtitle = '9.0s - 12.0s: Architectural Verdict. Full-JSON Last-Write-Wins is completely prohibited for multiplayer tools. CRDT delta streaming is required.'
      metrics = [
        { label: 'Architecture Verdict', value: 'LWW UNVIABLE', variant: 'danger' },
        { label: 'Lost Edits', value: 'Permanent Data Destruction', variant: 'danger' },
        { label: 'Standard', value: 'Yjs / Automerge / Figma', variant: 'default' },
        { label: 'Remediation', value: 'Deploy CRDT Delta Stream', variant: 'warning' },
      ]
    } else {
      subtitle = '9.0s - 12.0s: Perfect Convergence! Real-time color cursors track peers across screen. 500,000 ops/sec sustained with sub-30ms latency.'
      metrics = [
        { label: 'Final State', value: '100% Consistent Across Peers', variant: 'success' },
        { label: 'Delta Bandwidth', value: '45 bytes per keystroke', variant: 'success' },
        { label: 'Multi-Cursor Sync', value: '60 FPS Smooth Movement', variant: 'success' },
        { label: 'Production Status', value: 'Google Docs / Figma Grade', variant: 'success' },
      ]
    }
  }

  // Animation cursor coordinates
  const aliceCursorX = 85 + (Math.sin(currentTime * 1.5) * 20)
  const bobCursorX = 85 + (Math.cos(currentTime * 1.5) * 20)

  return (
    <div className="w-full space-y-4">
      <MotionGraphicPlayer
        title="Real-Time Collaborative Document & CRDT Engine"
        subtitle="12-Second Slow Walkthrough · Google Docs OT, Figma Multiplayer Architecture, Lamport Fractional IDs & WAL Compaction"
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
              onClick={() => { setStrategyMode('crdt_sync'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'crdt_sync'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>CRDT Delta Stream (Safe)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('lww_overwrite'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'lww_overwrite'
                  ? 'bg-rose-950/50 text-rose-300 font-bold border border-rose-600/60 shadow-xs'
                  : 'text-muted hover:text-rose-300'
              }`}
            >
              <Flame size={12} />
              <span>Last-Write-Wins (Lost Edits)</span>
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
              <Users size={12} />
              <span>Pessimistic Lock (Stall)</span>
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
          const alicePink = '#ec4899'
          const bobCyan = '#06b6d4'
          const crdtGreen = '#10b981'
          const dangerRed = '#ef4444'

          return (
            <div className="relative w-full aspect-[16/10] max-w-[860px] mx-auto py-2">
              <svg viewBox="0 0 880 500" className="w-full h-full transition-all duration-300">
                <defs>
                  <filter id="doc-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity={isLight ? '0.1' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* ==================== ALICE'S CLIENT EDITOR (Left) ==================== */}
                <g transform="translate(25, 120)" filter="url(#doc-shadow)">
                  <rect x="0" y="0" width="165" height="260" rx="14" fill={cardBg} stroke={alicePink} strokeWidth="3" />
                  <text x="82" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Alice&apos;s Client
                  </text>
                  <text x="82" y="44" textAnchor="middle" fill={alicePink} fontSize="10" fontFamily="monospace">
                    Peer #1 (WebSocket)
                  </text>

                  {/* Alice Text Box */}
                  <g transform="translate(12, 58)">
                    <rect x="0" y="0" width="140" height="75" rx="6" fill={isLight ? '#fdf2f8' : '#831843'} stroke={alicePink} strokeWidth="1" />
                    <text x="10" y="22" fill={textPrimary} fontSize="10" fontFamily="sans-serif">
                      Text: Hello World
                    </text>
                    <text x="10" y="40" fill={alicePink} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      + Insert &quot;A&quot; @ idx 10
                    </text>
                    <text x="10" y="58" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      id: (Alice, 14)
                    </text>
                    {/* Live Cursor */}
                    <line x1={aliceCursorX} y1="12" x2={aliceCursorX} y2="28" stroke={alicePink} strokeWidth="2.5" />
                  </g>

                  {/* Alice Delta Outbox */}
                  <g transform="translate(12, 145)">
                    <rect x="0" y="0" width="140" height="50" rx="6" fill={isLight ? '#f8fafc' : '#1e293b'} stroke={cardBorder} strokeWidth="1" />
                    <text x="70" y="20" textAnchor="middle" fill={textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      Delta Stream Egress
                    </text>
                    <text x="70" y="36" textAnchor="middle" fill={crdtGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      45 Bytes JSON Frame
                    </text>
                  </g>

                  <rect x="12" y="206" width="140" height="40" rx="6" fill={isLight ? '#ecfdf5' : '#064e3b'} />
                  <text x="70" y="224" textAnchor="middle" fill={crdtGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    Local Optimistic Apply
                  </text>
                  <text x="70" y="238" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    Zero Typo Delay (0ms)
                  </text>
                </g>

                {/* ==================== WEBSOCKET GATEWAY & REDIS ROOM (Top-Center) ==================== */}
                <g transform="translate(230, 40)" filter="url(#doc-shadow)">
                  <rect x="0" y="0" width="370" height="150" rx="14" fill={cardBg} stroke={crdtGreen} strokeWidth="3" />
                  <text x="185" y="26" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Stateful WebSocket Gateway &amp; Redis Mesh
                  </text>
                  <text x="185" y="42" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Room: doc_402 · 500,000 WebSocket ops / sec
                  </text>

                  {/* Redis Pub/Sub Dispatch Mesh */}
                  <g transform="translate(20, 56)">
                    <rect x="0" y="0" width="330" height="75" rx="8" fill={isLight ? '#f8fafc' : '#1e293b'} stroke={cardBorder} strokeWidth="1.5" />
                    <text x="15" y="22" fill={crdtGreen} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      Redis Channel: room:doc_402:deltas
                    </text>
                    <text x="15" y="40" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      Fan-Out: [Peer Alice → Peer Bob] in 18ms
                    </text>
                    <text x="15" y="58" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      Deltas broadcast concurrently to all active room subscribers
                    </text>
                  </g>
                </g>

                {/* ==================== CRDT DELTA MERGE & WAL (Bottom-Center) ==================== */}
                <g transform="translate(230, 220)" filter="url(#doc-shadow)">
                  <rect
                    x="0"
                    y="0"
                    width="370"
                    height="200"
                    rx="14"
                    fill={cardBg}
                    stroke={isLwwClobbered ? dangerRed : crdtGreen}
                    strokeWidth={isLwwClobbered ? '3' : '2'}
                  />
                  <text x="185" y="26" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    CRDT Fractional Indexing &amp; WAL Compactor
                  </text>
                  <text x="185" y="42" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Commutative Merge Engine &amp; S3 Snapshots
                  </text>

                  {/* Fractional Index Structure */}
                  <g transform="translate(20, 56)">
                    <rect
                      x="0"
                      y="0"
                      width="330"
                      height="75"
                      rx="8"
                      fill={isLwwClobbered ? (isLight ? '#fee2e2' : '#450a0a') : (isLight ? '#ecfdf5' : '#064e3b')}
                      stroke={isLwwClobbered ? dangerRed : crdtGreen}
                      strokeWidth="1.5"
                    />
                    <text x="15" y="22" fill={isLwwClobbered ? dangerRed : crdtGreen} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {isLwwClobbered ? '❌ FULL OVERWRITE: User B Overwrote User A' : '✓ FRACTIONAL INDEXING (Order Preserved)'}
                    </text>
                    <text x="15" y="42" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      {isLwwClobbered ? 'Alice edit lost! Document text clobbered.' : 'pos[1.0]="H"  pos[1.5]="A"  pos[2.0]="W"'}
                    </text>
                    <text x="15" y="60" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      {isLwwClobbered ? 'Last-Write-Wins destroyed paragraph integrity' : 'Operations commute: Order of arrival does not matter!'}
                    </text>
                  </g>

                  {/* Snapshot Rollup Plaque */}
                  <g transform="translate(20, 145)">
                    <rect x="0" y="0" width="330" height="42" rx="6" fill={isLight ? '#f8fafc' : '#1e293b'} stroke={cardBorder} strokeWidth="1" />
                    <text x="165" y="18" textAnchor="middle" fill={textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      WAL Log Compacted to S3 Snapshot
                    </text>
                    <text x="165" y="32" textAnchor="middle" fill={crdtGreen} fontSize="8" fontFamily="monospace">
                      100 Deltas → 1 S3 Snapshot (Fast Late-Join Replay)
                    </text>
                  </g>
                </g>

                {/* ==================== BOB'S CLIENT EDITOR (Right) ==================== */}
                <g transform="translate(650, 120)" filter="url(#doc-shadow)">
                  <rect x="0" y="0" width="165" height="260" rx="14" fill={cardBg} stroke={bobCyan} strokeWidth="3" />
                  <text x="82" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Bob&apos;s Client
                  </text>
                  <text x="82" y="44" textAnchor="middle" fill={bobCyan} fontSize="10" fontFamily="monospace">
                    Peer #2 (WebSocket)
                  </text>

                  {/* Bob Text Box */}
                  <g transform="translate(12, 58)">
                    <rect x="0" y="0" width="140" height="75" rx="6" fill={isLight ? '#ecfeff' : '#083344'} stroke={bobCyan} strokeWidth="1" />
                    <text x="10" y="22" fill={textPrimary} fontSize="10" fontFamily="sans-serif">
                      Text: Hello World
                    </text>
                    <text x="10" y="40" fill={bobCyan} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      - Delete idx 8
                    </text>
                    <text x="10" y="58" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      id: (Bob, 21)
                    </text>
                    {/* Live Cursor */}
                    <line x1={bobCursorX} y1="12" x2={bobCursorX} y2="28" stroke={bobCyan} strokeWidth="2.5" />
                  </g>

                  {/* Bob Delta Outbox */}
                  <g transform="translate(12, 145)">
                    <rect x="0" y="0" width="140" height="50" rx="6" fill={isLight ? '#f8fafc' : '#1e293b'} stroke={cardBorder} strokeWidth="1" />
                    <text x="70" y="20" textAnchor="middle" fill={textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      Delta Stream Egress
                    </text>
                    <text x="70" y="36" textAnchor="middle" fill={crdtGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      38 Bytes JSON Frame
                    </text>
                  </g>

                  <rect x="12" y="206" width="140" height="40" rx="6" fill={isLight ? '#ecfdf5' : '#064e3b'} />
                  <text x="70" y="224" textAnchor="middle" fill={crdtGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    Remote Peer Merged
                  </text>
                  <text x="70" y="238" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    Zero Conflict Stalls
                  </text>
                </g>

                {/* OVERLAY WARNING: LAST-WRITE-WINS OVERWRITE */}
                {isLwwClobbered && (
                  <g transform="translate(230, 435)">
                    <rect x="0" y="0" width="420" height="52" rx="10" fill={isLight ? '#fef2f2' : '#450a0a'} stroke={dangerRed} strokeWidth="2.5" />
                    <text x="210" y="22" textAnchor="middle" fill={dangerRed} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                      🚨 DATA LOSS: Last-Write-Wins Overwrote Alice&apos;s Paragraph
                    </text>
                    <text x="210" y="38" textAnchor="middle" fill={isLight ? '#991b1b' : '#fca5a5'} fontSize="10" fontFamily="monospace">
                      Full-document POSTs cannot merge concurrent edits. Use CRDT deltas!
                    </text>
                  </g>
                )}

                {/* OVERLAY WARNING: PESSIMISTIC LOCK STALL */}
                {isPessimisticBlocked && (
                  <g transform="translate(230, 435)">
                    <rect x="0" y="0" width="420" height="52" rx="10" fill={isLight ? '#fffbeb' : '#451a03'} stroke={dangerRed} strokeWidth="2.5" />
                    <text x="210" y="22" textAnchor="middle" fill={dangerRed} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                      ⚠️ SECTION LOCK STALL: Collaborative Freeze
                    </text>
                    <text x="210" y="38" textAnchor="middle" fill={isLight ? '#991b1b' : '#fca5a5'} fontSize="10" fontFamily="monospace">
                      Exclusive locks ruin real-time UX. Bob cannot edit while Alice is idle!
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