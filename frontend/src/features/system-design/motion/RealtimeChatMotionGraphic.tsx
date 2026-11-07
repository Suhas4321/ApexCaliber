import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Flame, Users } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function RealtimeChatMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [strategyMode, setStrategyMode] = useState<'lazy_presence' | 'presence_storm' | 'polling_crash'>('lazy_presence')

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
  let isStormCrash = false
  let isPollingLag = false
  let messageDelivered = false

  if (currentTime < 3.0) {
    subtitle = '0.0s - 3.0s: Stateful WebSocket Mesh. 1M persistent connections. Redis presence registry maps user_id -> gateway_pod with 30s heartbeat TTL.'
    metrics = [
      { label: 'WebSocket Conns', value: '1,000,000 Active Sockets', variant: 'default' },
      { label: 'Presence Registry', value: 'Redis Hash (user -> pod)', variant: 'success' },
      { label: 'Heartbeat Lease', value: '30s TTL Expiry', variant: 'success' },
      { label: 'Message Sequencer', value: '64-bit Snowflake ID', variant: 'default' },
    ]
  } else if (currentTime < 6.0) {
    if (strategyMode === 'presence_storm') {
      isStormCrash = true
      subtitle = '3.0s - 6.0s: PRESENCE FAN-OUT STORM! 100k users disconnect. Eager presence pushes 50,000,000 "Offline" events. Gateway pods OOM crash!'
      metrics = [
        { label: 'Disconnect Event', value: '100,000 Concurrent Closes', variant: 'danger' },
        { label: 'Eager Fan-Out', value: '50,000,000 Events Pushed', variant: 'danger' },
        { label: 'Gateway Memory', value: '100% Saturated (OOM)', variant: 'danger' },
        { label: 'Cluster Health', value: 'PODS REBOOTING (Outage)', variant: 'danger' },
      ]
    } else if (strategyMode === 'polling_crash') {
      isPollingLag = true
      subtitle = '3.0s - 6.0s: HTTP POLLING DISASTER. 10M clients poll SQL every 3s. 3,300,000 queries/sec hammer DB even with zero messages being typed!'
      metrics = [
        { label: 'Ingress Method', value: 'Short Polling (3s interval)', variant: 'danger' },
        { label: 'SQL Ingress QPS', value: '3,300,000 queries / sec', variant: 'danger' },
        { label: 'Database Load', value: '100% CPU Lockup', variant: 'danger' },
        { label: 'Delivery Delay', value: '3.0s - 12.0s Latency Lag', variant: 'danger' },
      ]
    } else {
      subtitle = '3.0s - 6.0s: 100k Mass Disconnect! Lazy presence filters out idle friends. Heartbeats naturally expire in Redis without broadcasting 50M storms.'
      metrics = [
        { label: 'Mass Disconnect', value: '100,000 Users Offline', variant: 'warning' },
        { label: 'Lazy Presence', value: 'Filtered to Active Chats Only', variant: 'success' },
        { label: 'Fan-Out Reduction', value: '99% Events Eliminated', variant: 'success' },
        { label: 'Gateway Memory', value: 'Stable (Zero OOM Spikes)', variant: 'success' },
      ]
    }
  } else if (currentTime < 9.0) {
    if (strategyMode === 'presence_storm') {
      isStormCrash = true
      subtitle = '6.0s - 9.0s: CASCADING OUTAGE. Connection storms overwhelm Redis cluster. All chat channels disconnected globally.'
      metrics = [
        { label: 'Gateway Cluster', value: '504 Gateway Timeouts', variant: 'danger' },
        { label: 'Dropped Messages', value: '140,000 Chats Lost', variant: 'danger' },
        { label: 'Root Cause', value: 'Eager Unbounded Fan-Out', variant: 'danger' },
        { label: 'Remediation', value: 'Switch to Lazy Subscriptions', variant: 'warning' },
      ]
    } else if (strategyMode === 'polling_crash') {
      isPollingLag = true
      subtitle = '6.0s - 9.0s: OUT-OF-ORDER MESSAGES. Due to network retries on polling, Message #2 arrives before Message #1. Chat chronology corrupted!'
      metrics = [
        { label: 'Message Ordering', value: 'CORRUPTED (Out of Sequence)', variant: 'danger' },
        { label: 'Battery Drain', value: 'Excessive Client Radio Wakeup', variant: 'danger' },
        { label: 'User Experience', value: 'Broken Conversations', variant: 'danger' },
        { label: 'Required Fix', value: 'Persistent WebSockets + Snowflake', variant: 'warning' },
      ]
    } else {
      messageDelivered = true
      subtitle = '6.0s - 9.0s: Monotonic Chat Delivery. Snowflake sequencer timestamps message -> written to ScyllaDB partition. Pushed to Bob\'s pod in 42ms.'
      metrics = [
        { label: 'Snowflake ID', value: '184920481928491029', variant: 'default' },
        { label: 'ScyllaDB Write', value: '2.1 ms (Wide-Column)', variant: 'success' },
        { label: 'Pod Lookup', value: 'Bob on gateway_pod_07', variant: 'success' },
        { label: 'End-to-End Latency', value: '42 ms (Sub-80ms SLA)', variant: 'success' },
      ]
    }
  } else {
    if (strategyMode === 'presence_storm' || strategyMode === 'polling_crash') {
      isStormCrash = true
      subtitle = '9.0s - 12.0s: Architectural Verdict. Modern real-time chat requires persistent WebSockets, Snowflake ordering, and lazy presence caching.'
      metrics = [
        { label: 'Verdict', value: 'ARCHITECTURE FAILED', variant: 'danger' },
        { label: 'Discord Standard', value: 'ScyllaDB + Lazy Presence', variant: 'default' },
        { label: 'Max Throughput', value: '1,000,000 msgs / sec', variant: 'success' },
        { label: 'Reliability', value: '99.999% High Availability', variant: 'success' },
      ]
    } else {
      messageDelivered = true
      subtitle = '9.0s - 12.0s: Steady-State Nirvana. Message delivered with double blue checkmark. Partition key (channel_id, bucket) guarantees sub-10ms history.'
      metrics = [
        { label: 'Delivery Status', value: 'READ (Double Checkmark ✓✓)', variant: 'success' },
        { label: 'Partition Strategy', value: 'Time-Bucketed ScyllaDB', variant: 'success' },
        { label: 'P99 Latency', value: '48 ms Globally', variant: 'success' },
        { label: 'Production Status', value: 'DISCORD / SLACK GRADE', variant: 'success' },
      ]
    }
  }

  return (
    <div className="w-full space-y-4">
      <MotionGraphicPlayer
        title="Global Real-Time Chat & Presence Engine"
        subtitle="12-Second Slow Walkthrough · Discord Architecture, Snowflake Sequencer, Lazy Presence & ScyllaDB Partitioning"
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
              onClick={() => { setStrategyMode('lazy_presence'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'lazy_presence'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>Lazy Presence (Safe)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('presence_storm'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'presence_storm'
                  ? 'bg-rose-950/50 text-rose-300 font-bold border border-rose-600/60 shadow-xs'
                  : 'text-muted hover:text-rose-300'
              }`}
            >
              <Flame size={12} />
              <span>Presence Storm (Crash)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('polling_crash'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'polling_crash'
                  ? 'bg-amber-950/50 text-amber-300 font-bold border border-amber-600/60 shadow-xs'
                  : 'text-muted hover:text-amber-300'
              }`}
            >
              <Users size={12} />
              <span>HTTP Polling (Lag)</span>
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
          const chatBlue = '#38bdf8'
          const scyllaPurple = '#818cf8'
          const successGreen = '#10b981'
          const dangerRed = '#ef4444'

          return (
            <div className="relative w-full aspect-[16/10] max-w-[860px] mx-auto py-2">
              <svg viewBox="0 0 880 500" className="w-full h-full transition-all duration-300">
                <defs>
                  <filter id="chat-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity={isLight ? '0.1' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* ==================== ALICE (SENDER) & GATEWAY POD 1 (Left) ==================== */}
                <g transform="translate(25, 110)" filter="url(#chat-shadow)">
                  <rect x="0" y="0" width="165" height="280" rx="14" fill={cardBg} stroke={chatBlue} strokeWidth="3" />
                  <text x="82" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Alice (Sender)
                  </text>
                  <text x="82" y="44" textAnchor="middle" fill={chatBlue} fontSize="10" fontFamily="monospace">
                    gateway_pod_01
                  </text>

                  {/* Alice Message Card */}
                  <g transform="translate(12, 58)">
                    <rect x="0" y="0" width="140" height="70" rx="6" fill={isLight ? '#f0f9ff' : '#0c4a6e'} stroke={chatBlue} strokeWidth="1" />
                    <text x="10" y="20" fill={chatBlue} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      Chat Bubble:
                    </text>
                    <text x="10" y="38" fill={textPrimary} fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                      &quot;Hey Bob, check this out!&quot;
                    </text>
                    <text x="10" y="56" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      Snowflake: #18492048...
                    </text>
                  </g>

                  {/* WebSocket Egress Plaque */}
                  <g transform="translate(12, 140)">
                    <rect x="0" y="0" width="140" height="60" rx="6" fill={isLight ? '#f8fafc' : '#1e293b'} stroke={cardBorder} strokeWidth="1" />
                    <text x="70" y="20" textAnchor="middle" fill={textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      WebSocket Frame
                    </text>
                    <text x="70" y="36" textAnchor="middle" fill={successGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      Binary ProtoBuf
                    </text>
                    <text x="70" y="50" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      Sub-5ms Socket Hop
                    </text>
                  </g>

                  <rect x="12" y="215" width="140" height="50" rx="6" fill={isLight ? '#ecfdf5' : '#064e3b'} />
                  <text x="70" y="235" textAnchor="middle" fill={successGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    Online Presence: Active
                  </text>
                  <text x="70" y="250" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    Heartbeat Sent (30s)
                  </text>
                </g>

                {/* ==================== REDIS PRESENCE & ROUTER (Top-Center) ==================== */}
                <g transform="translate(230, 45)" filter="url(#chat-shadow)">
                  <rect x="0" y="0" width="370" height="150" rx="14" fill={cardBg} stroke={chatBlue} strokeWidth="3" />
                  <text x="185" y="24" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Redis Presence Registry &amp; Chat Router
                  </text>
                  <text x="185" y="40" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Maps User ID → Gateway Pod with 30s TTL Heartbeats
                  </text>

                  {/* Presence Mapping Table */}
                  <g transform="translate(20, 56)">
                    <rect
                      x="0"
                      y="0"
                      width="330"
                      height="75"
                      rx="8"
                      fill={isStormCrash ? (isLight ? '#fee2e2' : '#450a0a') : (isLight ? '#f8fafc' : '#1e293b')}
                      stroke={isStormCrash ? dangerRed : cardBorder}
                      strokeWidth="1.5"
                    />
                    <text x="15" y="22" fill={isStormCrash ? dangerRed : chatBlue} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {isStormCrash ? '⚡ 50,000,000 FAN-OUT EVENT FLOOD' : 'Hash: presence:users'}
                    </text>
                    <text x="15" y="42" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      {isStormCrash ? 'Redis OOM: Memory exhausted by broadcast storm' : 'Alice → gateway_pod_01 | Bob → gateway_pod_07'}
                    </text>
                    <text x="15" y="60" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      {isStormCrash ? 'Mass disconnect melted gateway connection pool' : 'Lazy subscriptions: Only pushes to actively open chat panes!'}
                    </text>
                  </g>
                </g>

                {/* ==================== SCYLLADB TIME-BUCKETED PARTITION (Bottom-Center) ==================== */}
                <g transform="translate(230, 220)" filter="url(#chat-shadow)">
                  <rect x="0" y="0" width="370" height="200" rx="14" fill={cardBg} stroke={scyllaPurple} strokeWidth="3" />
                  <text x="185" y="24" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Wide-Column Store (Cassandra / ScyllaDB)
                  </text>
                  <text x="185" y="40" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Partition Key (channel_id, bucket) · Clustering Key (snowflake_id)
                  </text>

                  {/* ScyllaDB Table Mock */}
                  <g transform="translate(20, 56)">
                    <rect x="0" y="0" width="330" height="80" rx="8" fill={isLight ? '#eef2ff' : '#1e1b4b'} stroke={scyllaPurple} strokeWidth="1.5" />
                    <text x="15" y="20" fill={scyllaPurple} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      Partition: (channel_402, 2026_w45)
                    </text>
                    <text x="15" y="40" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      [Row 1] id: 184920481928491028 | sender: Alice | &quot;Hi&quot;
                    </text>
                    <text x="15" y="58" fill={successGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      [Row 2] id: 184920481928491029 | sender: Alice | &quot;Hey Bob!&quot;
                    </text>
                    <text x="15" y="74" fill={textSecondary} fontSize="7" fontFamily="sans-serif">
                      Write Latency: 2.1ms · Monotonic Clustering ASC
                    </text>
                  </g>

                  {/* Partition Health */}
                  <g transform="translate(20, 145)">
                    <rect x="0" y="0" width="330" height="42" rx="6" fill={isLight ? '#f8fafc' : '#1e293b'} stroke={cardBorder} strokeWidth="1" />
                    <text x="165" y="18" textAnchor="middle" fill={textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      Bounded Partition Size Guard
                    </text>
                    <text x="165" y="32" textAnchor="middle" fill={successGreen} fontSize="8" fontFamily="monospace">
                      Time Bucketing Prevents 10M Row Partition Bloat
                    </text>
                  </g>
                </g>

                {/* ==================== BOB (RECIPIENT) & GATEWAY POD 7 (Right) ==================== */}
                <g transform="translate(650, 110)" filter="url(#chat-shadow)">
                  <rect x="0" y="0" width="165" height="280" rx="14" fill={cardBg} stroke={successGreen} strokeWidth="3" />
                  <text x="82" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Bob (Recipient)
                  </text>
                  <text x="82" y="44" textAnchor="middle" fill={successGreen} fontSize="10" fontFamily="monospace">
                    gateway_pod_07
                  </text>

                  {/* Bob Received Chat Box */}
                  <g transform="translate(12, 58)">
                    <rect
                      x="0"
                      y="0"
                      width="140"
                      height="75"
                      rx="6"
                      fill={messageDelivered ? (isLight ? '#ecfdf5' : '#064e3b') : (isLight ? '#f8fafc' : '#1e293b')}
                      stroke={messageDelivered ? successGreen : cardBorder}
                      strokeWidth="1.5"
                    />
                    <text x="10" y="20" fill={messageDelivered ? successGreen : textSecondary} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      {messageDelivered ? '✓✓ Message Arrived:' : 'Listening on socket...'}
                    </text>
                    <text x="10" y="40" fill={textPrimary} fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                      {messageDelivered ? '&quot;Hey Bob, check this out!&quot;' : 'Waiting...'}
                    </text>
                    <text x="10" y="60" fill={successGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      {messageDelivered ? 'Status: READ (42ms)' : '0ms Delay'}
                    </text>
                  </g>

                  {/* Delivery SLA Plaque */}
                  <g transform="translate(12, 145)">
                    <rect x="0" y="0" width="140" height="55" rx="6" fill={isLight ? '#f8fafc' : '#1e293b'} stroke={cardBorder} strokeWidth="1" />
                    <text x="70" y="20" textAnchor="middle" fill={textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      End-to-End Hop
                    </text>
                    <text x="70" y="36" textAnchor="middle" fill={successGreen} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      42 ms P99
                    </text>
                    <text x="70" y="50" textAnchor="middle" fill={textSecondary} fontSize="7" fontFamily="sans-serif">
                      SLA Target: &lt; 80ms
                    </text>
                  </g>

                  <rect x="12" y="215" width="140" height="50" rx="6" fill={isLight ? '#f0fdf4' : '#052e16'} />
                  <text x="70" y="235" textAnchor="middle" fill={successGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    Monotonic Guarantee
                  </text>
                  <text x="70" y="250" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    Zero Out-of-Order Glitches
                  </text>
                </g>

                {/* OVERLAY WARNING: PRESENCE STORM */}
                {isStormCrash && (
                  <g transform="translate(230, 435)">
                    <rect x="0" y="0" width="420" height="52" rx="10" fill={isLight ? '#fef2f2' : '#450a0a'} stroke={dangerRed} strokeWidth="2.5" />
                    <text x="210" y="22" textAnchor="middle" fill={dangerRed} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                      🚨 PRESENCE FAN-OUT STORM: 50,000,000 Events Pushed
                    </text>
                    <text x="210" y="38" textAnchor="middle" fill={isLight ? '#991b1b' : '#fca5a5'} fontSize="10" fontFamily="monospace">
                      Eager broadcast overwhelmed gateway pods. Use lazy presence caching!
                    </text>
                  </g>
                )}

                {/* OVERLAY WARNING: POLLING LAG */}
                {isPollingLag && (
                  <g transform="translate(230, 435)">
                    <rect x="0" y="0" width="420" height="52" rx="10" fill={isLight ? '#fffbeb' : '#451a03'} stroke={dangerRed} strokeWidth="2.5" />
                    <text x="210" y="22" textAnchor="middle" fill={dangerRed} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                      ⚠️ SQL SHORT POLLING: 3,300,000 QPS Database Lockup
                    </text>
                    <text x="210" y="38" textAnchor="middle" fill={isLight ? '#991b1b' : '#fca5a5'} fontSize="10" fontFamily="monospace">
                      Polling causes out-of-order delivery and 100% DB CPU thrashing!
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