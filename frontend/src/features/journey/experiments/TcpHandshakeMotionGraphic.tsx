import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Flame, ShieldCheck } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function TcpHandshakeMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [mode, setMode] = useState<'normal' | 'syn_flood' | 'syn_cookies'>('normal')

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

  // Calculate narrative, state machines, and metrics based on time and mode
  let subtitle = ''
  let metrics: { label: string; value: string; variant?: 'default' | 'success' | 'warning' | 'danger' }[] = []
  let clientState = 'CLOSED'
  let serverState = 'LISTEN'
  let packetOnWire: 'SYN' | 'SYN_ACK' | 'ACK' | 'FLOOD' | 'NONE' = 'NONE'
  let isBacklogFull = false
  let synCookiesActive = false

  if (currentTime < 3.0) {
    clientState = 'SYN_SENT'
    serverState = 'LISTEN'
    packetOnWire = mode === 'syn_flood' ? 'FLOOD' : 'SYN'
    if (mode === 'syn_flood') {
      subtitle = '0.0s - 3.0s: SYN Flood Ingress! Spoofed botnet bombards Server with 100,000 SYN packets with randomized source IPs.'
      metrics = [
        { label: 'Attacker Action', value: '100,000 SYN/sec Burst', variant: 'danger' },
        { label: 'Server Port', value: 'Port 443 (LISTEN)', variant: 'default' },
        { label: 'Backlog Queue', value: 'Filling rapidly...', variant: 'warning' },
        { label: 'SYN Cookies', value: 'Disabled (sysctl default)', variant: 'danger' },
      ]
    } else {
      subtitle = '0.0s - 3.0s: Step 1: SYN. Client selects random ISN x=1000, enters SYN_SENT, and transmits SYN [seq=1000, len=0] to Server port 443.'
      metrics = [
        { label: 'Client State', value: 'SYN_SENT', variant: 'default' },
        { label: 'Packet Transmitted', value: 'SYN [seq=1000]', variant: 'default' },
        { label: 'Server State', value: 'LISTEN (Port 443)', variant: 'default' },
        { label: 'Sequence Arithmetic', value: 'SYN consumes 1 sequence #', variant: 'default' },
      ]
    }
  } else if (currentTime < 6.0) {
    if (mode === 'syn_flood') {
      clientState = 'SYN_SENT'
      serverState = 'SYN_RCVD (STALLED)'
      isBacklogFull = true
      packetOnWire = 'FLOOD'
      subtitle = '3.0s - 6.0s: Backlog Saturated! Server allocates 1024 half-open Transmission Control Blocks (TCBs). Memory is 100% full!'
      metrics = [
        { label: 'SYN Backlog Queue', value: '1024 / 1024 (EXHAUSTED)', variant: 'danger' },
        { label: 'Memory Saturated', value: 'Allocating TCB blocks', variant: 'danger' },
        { label: 'Half-Open Timers', value: 'Waiting 75s timeout', variant: 'danger' },
        { label: 'Server Health', value: 'DROPPING PACKETS', variant: 'danger' },
      ]
    } else if (mode === 'syn_cookies') {
      clientState = 'SYN_SENT'
      serverState = 'LISTEN (Cookie Hash)'
      synCookiesActive = true
      packetOnWire = 'SYN_ACK'
      subtitle = '3.0s - 6.0s: SYN Cookies Active! Server refuses to allocate TCB memory. Cryptographically hashes IP+port into ISN y=Hash(Key, IP, Port).'
      metrics = [
        { label: 'Defense Mode', value: 'SYN Cookies Enabled', variant: 'success' },
        { label: 'TCB Memory Stored', value: '0 Bytes (Zero Allocation)', variant: 'success' },
        { label: 'Server ISN y', value: 'Cryptographic HMAC Hash', variant: 'success' },
        { label: 'SYN Backlog Queue', value: '0 / 1024 (Free)', variant: 'success' },
      ]
    } else {
      clientState = 'SYN_SENT'
      serverState = 'SYN_RCVD'
      packetOnWire = 'SYN_ACK'
      subtitle = '3.0s - 6.0s: Step 2: SYN-ACK. Server allocates half-open TCB, generates ISN y=5000, and returns SYN-ACK [seq=5000, ack=1001].'
      metrics = [
        { label: 'Server State', value: 'SYN_RCVD', variant: 'warning' },
        { label: 'Server ISN', value: 'y = 5000', variant: 'default' },
        { label: 'Acknowledgment', value: 'ack = x + 1 (1001)', variant: 'success' },
        { label: 'Half-Open TCB', value: 'Allocated in Backlog', variant: 'default' },
      ]
    }
  } else if (currentTime < 9.0) {
    if (mode === 'syn_flood') {
      clientState = 'CLOSED'
      serverState = 'CRASH (ECONNREFUSED)'
      isBacklogFull = true
      packetOnWire = 'NONE'
      subtitle = '6.0s - 9.0s: LEGITIMATE USERS BLOCKED! A real customer attempts to connect. Server drops SYN packet. Connection refused (ECONNREFUSED)!'
      metrics = [
        { label: 'Legitimate Client', value: 'DROPPED (No Response)', variant: 'danger' },
        { label: 'Error Code', value: 'ECONNREFUSED', variant: 'danger' },
        { label: 'SYN Backlog State', value: '100% Locked with Zombies', variant: 'danger' },
        { label: 'Service Availability', value: '0% Outage', variant: 'danger' },
      ]
    } else if (mode === 'syn_cookies') {
      clientState = 'ESTABLISHED'
      serverState = 'ESTABLISHED'
      synCookiesActive = true
      packetOnWire = 'ACK'
      subtitle = '6.0s - 9.0s: Cookie Verified! Legitimate client sends ACK [ack=y+1]. Server decodes secret hash and instantiates socket on the fly!'
      metrics = [
        { label: 'Client State', value: 'ESTABLISHED', variant: 'success' },
        { label: 'Cookie Verification', value: 'HMAC Hash Matched ✓', variant: 'success' },
        { label: 'Server State', value: 'ESTABLISHED (On Demand)', variant: 'success' },
        { label: 'DDoS Immunity', value: 'SYN Flood Nullified', variant: 'success' },
      ]
    } else {
      clientState = 'ESTABLISHED'
      serverState = 'ESTABLISHED'
      packetOnWire = 'ACK'
      subtitle = '6.0s - 9.0s: Step 3: ACK. Client verifies ack=1001, moves to ESTABLISHED, and sends ACK [seq=1001, ack=5001]. Connection complete!'
      metrics = [
        { label: 'Client State', value: 'ESTABLISHED', variant: 'success' },
        { label: 'Client ACK Sent', value: 'seq=1001, ack=5001', variant: 'success' },
        { label: 'Server State', value: 'ESTABLISHED', variant: 'success' },
        { label: 'Handshake Time', value: '1 RTT (~15 ms)', variant: 'success' },
      ]
    }
  } else {
    if (mode === 'syn_flood') {
      clientState = 'CLOSED'
      serverState = 'CRASH'
      isBacklogFull = true
      packetOnWire = 'NONE'
      subtitle = '9.0s - 12.0s: Total Denial of Service. The lack of SYN Cookies allowed 1,000 zombie packets to starve all server network threads.'
      metrics = [
        { label: 'Root Cause', value: 'Unbounded Half-Open TCBs', variant: 'danger' },
        { label: 'sysctl Vulnerability', value: 'tcp_syncookies = 0', variant: 'danger' },
        { label: 'Damage', value: 'Complete Server Outage', variant: 'danger' },
        { label: 'Fix', value: 'Enable net.ipv4.tcp_syncookies', variant: 'warning' },
      ]
    } else {
      clientState = 'ESTABLISHED'
      serverState = 'ESTABLISHED'
      packetOnWire = 'NONE'
      subtitle = '9.0s - 12.0s: Full Duplex Established! High-throughput TLS 1.3 / HTTP/2 byte stream begins over in-order, lossless TCP socket.'
      metrics = [
        { label: 'Connection Status', value: 'ESTABLISHED (Full Duplex)', variant: 'success' },
        { label: 'Receive Window', value: '64 KB (Sliding Window)', variant: 'success' },
        { label: 'Byte Stream', value: 'In-Order & Lossless', variant: 'success' },
        { label: 'TCP Security', value: 'ISN Randomization Verified', variant: 'success' },
      ]
    }
  }

  // Animation packet positions
  const packetProgress = (currentTime % 3.0) / 3.0

  return (
    <div className="w-full space-y-4">
      <MotionGraphicPlayer
        title="TCP 3-Way Handshake & SYN Flood Defense"
        subtitle="12-Second Slow Walkthrough · RFC 793, RFC 4987, Sequence Number Math & SYN Cookie Cryptographic Defense"
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
              onClick={() => { setMode('normal'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                mode === 'normal'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>Normal (3-Way)</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('syn_flood'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                mode === 'syn_flood'
                  ? 'bg-rose-950/50 text-rose-300 font-bold border border-rose-600/60 shadow-xs'
                  : 'text-muted hover:text-rose-300'
              }`}
            >
              <Flame size={12} />
              <span>SYN Flood (Attack)</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('syn_cookies'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                mode === 'syn_cookies'
                  ? 'bg-indigo-950/50 text-indigo-300 font-bold border border-indigo-600/60 shadow-xs'
                  : 'text-muted hover:text-indigo-300'
              }`}
            >
              <ShieldCheck size={12} />
              <span>SYN Cookies (Defense)</span>
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
          const clientBlue = '#38bdf8'
          const serverEmerald = '#10b981'
          const dangerRed = '#ef4444'
          const cookiePurple = '#a855f7'

          // Coordinates for flying packets along slanted wire
          // Wire 1: Client (190, 160) -> Server (670, 200) [SYN]
          const synX = 190 + packetProgress * (670 - 190)
          const synY = 160 + packetProgress * (200 - 160)

          // Wire 2: Server (670, 230) -> Client (190, 270) [SYN-ACK]
          const synAckX = 670 - packetProgress * (670 - 190)
          const synAckY = 230 + packetProgress * (270 - 230)

          // Wire 3: Client (190, 300) -> Server (670, 340) [ACK]
          const ackX = 190 + packetProgress * (670 - 190)
          const ackY = 300 + packetProgress * (340 - 300)

          return (
            <div className="relative w-full aspect-[16/10] max-w-[860px] mx-auto py-2">
              <svg viewBox="0 0 880 500" className="w-full h-full transition-all duration-300">
                <defs>
                  <marker id="tcp-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={clientBlue} />
                  </marker>
                  <marker id="tcp-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={serverEmerald} />
                  </marker>
                  <marker id="tcp-arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={dangerRed} />
                  </marker>
                  <filter id="tcp-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity={isLight ? '0.1' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* ==================== NETWORK CHANNEL WIRES ==================== */}

                {/* Wire 1: Step 1 (SYN) */}
                <path d="M 190 160 L 670 200" fill="none" stroke={clientBlue} strokeWidth="3" strokeDasharray="5 5" markerEnd="url(#tcp-arrow-blue)" />
                <rect x="380" y="155" width="120" height="26" rx="6" fill={isLight ? '#f0f9ff' : '#0c4a6e'} stroke={clientBlue} strokeWidth="1" />
                <text x="440" y="172" textAnchor="middle" fill={clientBlue} fontSize="10" fontWeight="bold" fontFamily="monospace">
                  1. SYN [seq=1000]
                </text>

                {/* Wire 2: Step 2 (SYN-ACK) */}
                <path d="M 670 230 L 190 270" fill="none" stroke={serverEmerald} strokeWidth="3" strokeDasharray="5 5" markerEnd="url(#tcp-arrow-green)" />
                <rect x="360" y="235" width="160" height="26" rx="6" fill={isLight ? '#ecfdf5' : '#064e3b'} stroke={serverEmerald} strokeWidth="1" />
                <text x="440" y="252" textAnchor="middle" fill={serverEmerald} fontSize="10" fontWeight="bold" fontFamily="monospace">
                  2. SYN-ACK [seq=5000, ack=1001]
                </text>

                {/* Wire 3: Step 3 (ACK) */}
                <path d="M 190 300 L 670 340" fill="none" stroke={clientBlue} strokeWidth="3" strokeDasharray="5 5" markerEnd="url(#tcp-arrow-blue)" />
                <rect x="360" y="305" width="160" height="26" rx="6" fill={isLight ? '#f0f9ff' : '#0c4a6e'} stroke={clientBlue} strokeWidth="1" />
                <text x="440" y="322" textAnchor="middle" fill={clientBlue} fontSize="10" fontWeight="bold" fontFamily="monospace">
                  3. ACK [seq=1001, ack=5001]
                </text>

                {/* ==================== FLYING PACKET ANIMATIONS ==================== */}
                {isPlaying && (
                  <>
                    {/* Step 1 Packet */}
                    {packetOnWire === 'SYN' && (
                      <g transform={`translate(${synX}, ${synY})`}>
                        <circle cx="0" cy="0" r="7" fill={clientBlue} />
                      </g>
                    )}

                    {/* Step 2 Packet */}
                    {packetOnWire === 'SYN_ACK' && (
                      <g transform={`translate(${synAckX}, ${synAckY})`}>
                        <circle cx="0" cy="0" r="7" fill={serverEmerald} />
                      </g>
                    )}

                    {/* Step 3 Packet */}
                    {packetOnWire === 'ACK' && (
                      <g transform={`translate(${ackX}, ${ackY})`}>
                        <circle cx="0" cy="0" r="7" fill={clientBlue} />
                      </g>
                    )}

                    {/* SYN Flood Burst of Multiple Packets */}
                    {packetOnWire === 'FLOOD' && (
                      <>
                        <circle cx={190 + packetProgress * 480} cy={160 + packetProgress * 40} r="6" fill={dangerRed} />
                        <circle cx={190 + ((packetProgress + 0.3) % 1) * 480} cy={175 + ((packetProgress + 0.3) % 1) * 40} r="6" fill={dangerRed} />
                        <circle cx={190 + ((packetProgress + 0.6) % 1) * 480} cy={190 + ((packetProgress + 0.6) % 1) * 40} r="6" fill={dangerRed} />
                      </>
                    )}
                  </>
                )}

                {/* ==================== HOST NODES ==================== */}

                {/* NODE 1: CLIENT HOST (Left) */}
                <g transform="translate(30, 80)" filter="url(#tcp-shadow)">
                  <rect x="0" y="0" width="165" height="340" rx="14" fill={cardBg} stroke={clientBlue} strokeWidth="3" />
                  <text x="82" y="28" textAnchor="middle" fill={textPrimary} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                    Client Socket
                  </text>
                  <text x="82" y="46" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    IP: 192.168.1.50
                  </text>

                  {/* Client State Badge */}
                  <rect
                    x="15"
                    y="60"
                    width="135"
                    height="42"
                    rx="8"
                    fill={clientState === 'ESTABLISHED' ? (isLight ? '#ecfdf5' : '#064e3b') : (clientState === 'SYN_SENT' ? (isLight ? '#f0f9ff' : '#0c4a6e') : (isLight ? '#f1f5f9' : '#1e293b'))}
                    stroke={clientState === 'ESTABLISHED' ? serverEmerald : clientBlue}
                    strokeWidth="1.5"
                  />
                  <text
                    x="82"
                    y="78"
                    textAnchor="middle"
                    fill={clientState === 'ESTABLISHED' ? serverEmerald : clientBlue}
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    STATE: {clientState}
                  </text>
                  <text x="82" y="93" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    {clientState === 'SYN_SENT' ? 'Waiting for SYN-ACK' : (clientState === 'ESTABLISHED' ? 'Connected & Ready' : 'Socket Closed')}
                  </text>

                  {/* Sequence Register Box */}
                  <g transform="translate(15, 115)">
                    <rect x="0" y="0" width="135" height="60" rx="6" fill={isLight ? '#f8fafc' : '#1e293b'} stroke={cardBorder} strokeWidth="1" />
                    <text x="12" y="20" fill={textPrimary} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      Client ISN (x):
                    </text>
                    <text x="12" y="36" fill={clientBlue} fontSize="12" fontWeight="bold" fontFamily="monospace">
                      1000
                    </text>
                    <text x="12" y="50" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      Randomly Generated
                    </text>
                  </g>

                  {/* Receive Window Buffer Box */}
                  <g transform="translate(15, 185)">
                    <rect x="0" y="0" width="135" height="70" rx="6" fill={isLight ? '#f8fafc' : '#1e293b'} stroke={cardBorder} strokeWidth="1" />
                    <text x="12" y="20" fill={textPrimary} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      Sliding Window:
                    </text>
                    <text x="12" y="38" fill={serverEmerald} fontSize="11" fontWeight="bold" fontFamily="monospace">
                      rcv_wnd = 65,535 B
                    </text>
                    <text x="12" y="54" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      Flow Control Credit
                    </text>
                  </g>

                  <rect x="15" y="270" width="135" height="48" rx="6" fill={isLight ? '#f0fdf4' : '#052e16'} stroke={serverEmerald} strokeWidth="1" />
                  <text x="82" y="290" textAnchor="middle" fill={serverEmerald} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    STREAM STATUS
                  </text>
                  <text x="82" y="304" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    {clientState === 'ESTABLISHED' ? 'Full Duplex Open' : 'Handshake Pending'}
                  </text>
                </g>

                {/* NODE 2: SERVER HOST (Right) */}
                <g transform="translate(680, 80)" filter="url(#tcp-shadow)">
                  <rect
                    x="0"
                    y="0"
                    width="170"
                    height="340"
                    rx="14"
                    fill={cardBg}
                    stroke={isBacklogFull ? dangerRed : serverEmerald}
                    strokeWidth="3"
                  />
                  <text x="85" y="28" textAnchor="middle" fill={textPrimary} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                    Server Socket
                  </text>
                  <text x="85" y="46" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    IP: 10.0.0.1:443
                  </text>

                  {/* Server State Badge */}
                  <rect
                    x="15"
                    y="60"
                    width="140"
                    height="42"
                    rx="8"
                    fill={isBacklogFull ? (isLight ? '#fee2e2' : '#450a0a') : (serverState === 'ESTABLISHED' ? (isLight ? '#ecfdf5' : '#064e3b') : (isLight ? '#fffbeb' : '#451a03'))}
                    stroke={isBacklogFull ? dangerRed : (serverState === 'ESTABLISHED' ? serverEmerald : '#f59e0b')}
                    strokeWidth="1.5"
                  />
                  <text
                    x="85"
                    y="78"
                    textAnchor="middle"
                    fill={isBacklogFull ? dangerRed : (serverState === 'ESTABLISHED' ? serverEmerald : '#f59e0b')}
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    STATE: {serverState}
                  </text>
                  <text x="85" y="93" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    {isBacklogFull ? 'CRITICAL EXHAUSTION' : (serverState === 'ESTABLISHED' ? 'Session Instantiated' : 'Listening for SYN')}
                  </text>

                  {/* SYN Backlog Queue Box */}
                  <g transform="translate(15, 115)">
                    <rect
                      x="0"
                      y="0"
                      width="140"
                      height="75"
                      rx="6"
                      fill={isBacklogFull ? (isLight ? '#fee2e2' : '#450a0a') : (isLight ? '#f8fafc' : '#1e293b')}
                      stroke={isBacklogFull ? dangerRed : cardBorder}
                      strokeWidth="1.5"
                    />
                    <text x="10" y="18" fill={textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      SYN Backlog Queue:
                    </text>
                    <text
                      x="10"
                      y="36"
                      fill={isBacklogFull ? dangerRed : (synCookiesActive ? cookiePurple : serverEmerald)}
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {isBacklogFull ? '1024 / 1024 FULL' : (synCookiesActive ? '0 / 1024 (Stateless)' : '1 / 1024 Allocated')}
                    </text>
                    <text x="10" y="52" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      {isBacklogFull ? 'TCB memory saturated' : (synCookiesActive ? 'HMAC Cookie Hash' : 'Half-open TCB holds slot')}
                    </text>
                    <text x="10" y="66" fill={textSecondary} fontSize="7" fontFamily="sans-serif">
                      tcp_max_syn_backlog
                    </text>
                  </g>

                  {/* Accept Queue / Crypto Engine */}
                  <g transform="translate(15, 200)">
                    <rect
                      x="0"
                      y="0"
                      width="140"
                      height="65"
                      rx="6"
                      fill={synCookiesActive ? (isLight ? '#faf5ff' : '#2e1065') : (isLight ? '#f8fafc' : '#1e293b')}
                      stroke={synCookiesActive ? cookiePurple : cardBorder}
                      strokeWidth="1.5"
                    />
                    <text x="10" y="18" fill={synCookiesActive ? cookiePurple : textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      {synCookiesActive ? 'SYN Cookie Engine' : 'Accept Queue'}
                    </text>
                    <text x="10" y="36" fill={synCookiesActive ? cookiePurple : serverEmerald} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {synCookiesActive ? 'SHA-1(IP, Port, Secret)' : 'SOMAXCONN = 4096'}
                    </text>
                    <text x="10" y="52" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      {synCookiesActive ? 'Zero memory stored' : 'Ready for accept()'}
                    </text>
                  </g>

                  <rect x="15" y="275" width="140" height="45" rx="6" fill={isLight ? '#f0fdf4' : '#052e16'} stroke={serverEmerald} strokeWidth="1" />
                  <text x="85" y="293" textAnchor="middle" fill={serverEmerald} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    SERVER ISN (y)
                  </text>
                  <text x="85" y="307" textAnchor="middle" fill={textPrimary} fontSize="10" fontWeight="bold" fontFamily="monospace">
                    {synCookiesActive ? 'y = Hash(Cookie)' : 'y = 5000'}
                  </text>
                </g>

                {/* OVERLAY WARNING BANNER: SYN FLOOD ATTACK */}
                {isBacklogFull && (
                  <g transform="translate(230, 20)">
                    <rect x="0" y="0" width="420" height="55" rx="10" fill={isLight ? '#fef2f2' : '#450a0a'} stroke={dangerRed} strokeWidth="2.5" />
                    <text x="210" y="22" textAnchor="middle" fill={dangerRed} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                      ⚡ DENIAL OF SERVICE: SYN Backlog Queue Exhausted
                    </text>
                    <text x="210" y="38" textAnchor="middle" fill={isLight ? '#991b1b' : '#fca5a5'} fontSize="10" fontFamily="monospace">
                      Botnet zombie packets filled all 1024 TCB slots. Legit clients dropped!
                    </text>
                    <text x="210" y="49" textAnchor="middle" fill={isLight ? '#7f1d1d' : '#fecaca'} fontSize="8" fontFamily="sans-serif">
                      Fix: Enable Linux SYN Cookies (sysctl -w net.ipv4.tcp_syncookies=1)
                    </text>
                  </g>
                )}

                {/* OVERLAY BANNER: SYN COOKIES ACTIVE */}
                {synCookiesActive && (
                  <g transform="translate(230, 20)">
                    <rect x="0" y="0" width="420" height="55" rx="10" fill={isLight ? '#faf5ff' : '#2e1065'} stroke={cookiePurple} strokeWidth="2.5" />
                    <text x="210" y="22" textAnchor="middle" fill={cookiePurple} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                      🛡️ RFC 4987 SYN COOKIES: Stateless DDoS Defense
                    </text>
                    <text x="210" y="38" textAnchor="middle" fill={isLight ? '#6b21a8' : '#e9d5ff'} fontSize="10" fontFamily="monospace">
                      Server stores 0 bytes for half-open sockets. State recreated from ACK!
                    </text>
                    <text x="210" y="49" textAnchor="middle" fill={isLight ? '#581c87' : '#d8b4fe'} fontSize="8" fontFamily="sans-serif">
                      Zero backlog memory used · Botnet SYN flood completely neutralized
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