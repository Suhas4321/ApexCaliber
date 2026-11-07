import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Flame, ShieldAlert } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function NotificationEngineMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [strategyMode, setStrategyMode] = useState<'isolated_p0' | 'shared_fifo_crash' | 'vendor_outage'>('isolated_p0')

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
  let isHeadOfLineBlocked = false
  let isVendorDown = false
  let p0Delivered = false

  if (currentTime < 3.0) {
    subtitle = '0.0s - 3.0s: Ingestion. 200k notifications/sec enter gateway. Redis checks idempotency and user preferences in 1ms.'
    metrics = [
      { label: 'Ingress Rate', value: '200,000 / sec', variant: 'default' },
      { label: 'Idempotency Gate', value: 'Zero Duplicate SMS', variant: 'success' },
      { label: 'Priority Classifier', value: 'P0 (OTP) / P1 / P2 (Promo)', variant: 'success' },
      { label: 'User Opt-Out', value: 'Marketing Filtered', variant: 'default' },
    ]
  } else if (currentTime < 6.0) {
    if (strategyMode === 'shared_fifo_crash') {
      isHeadOfLineBlocked = true
      subtitle = '3.0s - 6.0s: HEAD-OF-LINE BLOCKING! Single FIFO queue flooded with 10M promo messages. 2FA login OTP sits at position #9,820,114. 45m delay!'
      metrics = [
        { label: 'Queue Architecture', value: 'Single Shared FIFO', variant: 'danger' },
        { label: 'Marketing Blast', value: '10,000,000 Messages', variant: 'danger' },
        { label: 'Login OTP Position', value: '#9,820,114 in Queue', variant: 'danger' },
        { label: 'Delivery Delay', value: '45.0 Minutes (Session Expired)', variant: 'danger' },
      ]
    } else {
      p0Delivered = true
      subtitle = '3.0s - 6.0s: 10M Promo Surge! Marketing floods P2 queue. Dedicated P0_OTP worker pods remain 100% free. 2FA OTP delivers in 650ms!'
      metrics = [
        { label: 'Queue Architecture', value: 'Physically Isolated P0/P1/P2', variant: 'success' },
        { label: 'P2 Promo Backlog', value: '10M Queued (Acceptable)', variant: 'warning' },
        { label: 'P0 OTP Worker Pods', value: 'Zero Delay (Dedicated Pool)', variant: 'success' },
        { label: 'OTP Delivery Time', value: '650 ms (Sub-second SLA)', variant: 'success' },
      ]
    }
  } else if (currentTime < 9.0) {
    if (strategyMode === 'shared_fifo_crash') {
      isHeadOfLineBlocked = true
      subtitle = '6.0s - 9.0s: USER ABANDONMENT. Users cannot log into bank accounts. Help desk flooded with 50,000 tickets. Business conversion drops 78%.'
      metrics = [
        { label: 'Login Success Rate', value: '12% (Severe Failure)', variant: 'danger' },
        { label: 'Support Queue', value: '50,000 Tickets Escalated', variant: 'danger' },
        { label: 'Cost of Outage', value: '$120,000 Lost GMV', variant: 'danger' },
        { label: 'Root Cause', value: 'Lack of Physical Queue Isolation', variant: 'danger' },
      ]
    } else if (strategyMode === 'vendor_outage') {
      isVendorDown = true
      subtitle = '6.0s - 9.0s: VENDOR DEGRADATION. Primary SMS gateway (Twilio) 500 errors! Circuit breaker trips -> auto-fails over to AWS SNS backup.'
      metrics = [
        { label: 'Primary Gateway', value: 'Twilio 500 Outage', variant: 'danger' },
        { label: 'Circuit Breaker', value: 'TRIPPED (Open)', variant: 'warning' },
        { label: 'Secondary Gateway', value: 'AWS SNS Failover (Active)', variant: 'success' },
        { label: 'Delivery Integrity', value: '99.98% Maintained', variant: 'success' },
      ]
    } else {
      p0Delivered = true
      subtitle = '6.0s - 9.0s: Multi-Channel Dispatch. Dedicated worker pools process SMS (Twilio), Push (FCM), and Email (SES) concurrently with exponential jitter.'
      metrics = [
        { label: 'FCM Push Workers', value: '45,000 / sec Throughput', variant: 'success' },
        { label: 'Twilio SMS Workers', value: 'Carrier Handshake Verified', variant: 'success' },
        { label: 'SES Email Batch', value: 'DKIM/SPF Signed', variant: 'success' },
        { label: 'DLQ Error Rate', value: '< 0.01% (Clean Deliveries)', variant: 'success' },
      ]
    }
  } else {
    if (strategyMode === 'shared_fifo_crash') {
      isHeadOfLineBlocked = true
      subtitle = '9.0s - 12.0s: Architectural Verdict. Shared FIFO queues for mixed-priority traffic are completely prohibited. Physical topic isolation is mandatory.'
      metrics = [
        { label: 'Architecture Grade', value: 'FAIL (Shared FIFO)', variant: 'danger' },
        { label: 'Remediation', value: 'Partition into P0 / P1 / P2 Kafka Topics', variant: 'warning' },
        { label: 'SLA Compliance', value: '0% on Critical 2FA', variant: 'danger' },
        { label: 'Industry Standard', value: 'Uber / Razorpay Isolated Queues', variant: 'default' },
      ]
    } else {
      p0Delivered = true
      subtitle = '9.0s - 12.0s: Masterclass Resilience. P0 OTP achieved sub-second latency. P2 Marketing safely drained over 15 minutes without dropping revenue.'
      metrics = [
        { label: 'P0 2FA OTP SLA', value: '650 ms (Target < 1.0s)', variant: 'success' },
        { label: 'P1 Order SLA', value: '2.8 s (Target < 10s)', variant: 'success' },
        { label: 'P2 Promo Batch', value: 'Drained Cleanly in BG', variant: 'success' },
        { label: 'Production Status', value: 'ENTERPRISE BULLETPROOF', variant: 'success' },
      ]
    }
  }

  return (
    <div className="w-full space-y-4">
      <MotionGraphicPlayer
        title="High-Throughput Notification Service & Priority Queues"
        subtitle="12-Second Slow Walkthrough · ByteByteGo Architecture, P0/P1/P2 Topic Isolation, Twilio/SNS Failover & DLQ"
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
              onClick={() => { setStrategyMode('isolated_p0'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'isolated_p0'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>Isolated P0 Queue (Safe)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('shared_fifo_crash'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'shared_fifo_crash'
                  ? 'bg-rose-950/50 text-rose-300 font-bold border border-rose-600/60 shadow-xs'
                  : 'text-muted hover:text-rose-300'
              }`}
            >
              <Flame size={12} />
              <span>Shared FIFO (Blocked)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('vendor_outage'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'vendor_outage'
                  ? 'bg-amber-950/50 text-amber-300 font-bold border border-amber-600/60 shadow-xs'
                  : 'text-muted hover:text-amber-300'
              }`}
            >
              <ShieldAlert size={12} />
              <span>Vendor Failover (Active)</span>
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
          const p0Purple = '#a855f7'
          const p1Cyan = '#06b6d4'
          const p2Amber = '#f59e0b'
          const successGreen = '#10b981'
          const dangerRed = '#ef4444'

          return (
            <div className="relative w-full aspect-[16/10] max-w-[860px] mx-auto py-2">
              <svg viewBox="0 0 880 500" className="w-full h-full transition-all duration-300">
                <defs>
                  <filter id="notif-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity={isLight ? '0.1' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* ==================== INGESTION & IDEMPOTENCY GATE (Left) ==================== */}
                <g transform="translate(25, 110)" filter="url(#notif-shadow)">
                  <rect x="0" y="0" width="165" height="280" rx="14" fill={cardBg} stroke={p1Cyan} strokeWidth="3" />
                  <text x="82" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Ingestion Gateway
                  </text>
                  <text x="82" y="44" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    200k Events / Sec
                  </text>

                  {/* Idempotency Check Card */}
                  <g transform="translate(12, 58)">
                    <rect x="0" y="0" width="140" height="65" rx="6" fill={isLight ? '#ecfeff' : '#083344'} stroke={p1Cyan} strokeWidth="1" />
                    <text x="10" y="18" fill={p1Cyan} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      Redis Idempotency Gate
                    </text>
                    <text x="10" y="36" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      SET notification_id NX
                    </text>
                    <text x="10" y="52" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      Zero Duplicate SMS Charge
                    </text>
                  </g>

                  {/* Priority Classifier */}
                  <g transform="translate(12, 135)">
                    <rect x="0" y="0" width="140" height="75" rx="6" fill={isLight ? '#f8fafc' : '#1e293b'} stroke={cardBorder} strokeWidth="1" />
                    <text x="10" y="18" fill={textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      Topic Classifier
                    </text>
                    <text x="10" y="34" fill={p0Purple} fontSize="8" fontWeight="bold" fontFamily="monospace">
                      • 2FA Code → P0_OTP
                    </text>
                    <text x="10" y="48" fill={p1Cyan} fontSize="8" fontWeight="bold" fontFamily="monospace">
                      • Order Update → P1_TRANS
                    </text>
                    <text x="10" y="62" fill={p2Amber} fontSize="8" fontWeight="bold" fontFamily="monospace">
                      • 10M Promo → P2_PROMO
                    </text>
                  </g>

                  <rect x="12" y="222" width="140" height="42" rx="6" fill={isLight ? '#f0fdf4' : '#052e16'} />
                  <text x="70" y="240" textAnchor="middle" fill={successGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    User Preference Filter
                  </text>
                  <text x="70" y="254" textAnchor="middle" fill={textSecondary} fontSize="7" fontFamily="sans-serif">
                    Do Not Disturb Enforced
                  </text>
                </g>

                {/* ==================== 3 PHYSICALLY ISOLATED KAFKA QUEUES (Center) ==================== */}
                <g transform="translate(230, 45)" filter="url(#notif-shadow)">
                  <rect
                    x="0"
                    y="0"
                    width="370"
                    height="380"
                    rx="14"
                    fill={cardBg}
                    stroke={isHeadOfLineBlocked ? dangerRed : cardBorder}
                    strokeWidth={isHeadOfLineBlocked ? '3' : '1.5'}
                  />
                  <text x="185" y="24" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    {isHeadOfLineBlocked ? 'SINGLE SHARED FIFO QUEUE (BLOCKED!)' : 'Physically Isolated Kafka Priority Topics'}
                  </text>
                  <text x="185" y="40" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    {isHeadOfLineBlocked ? 'Head-of-Line Blocking: All Priorities Mixed' : 'Independent Consumer Groups & Pod Scaling'}
                  </text>

                  {/* LANE 1: P0_OTP QUEUE */}
                  <g transform="translate(20, 56)">
                    <rect
                      x="0"
                      y="0"
                      width="330"
                      height="85"
                      rx="8"
                      fill={p0Delivered ? (isLight ? '#faf5ff' : '#2e1065') : (isLight ? '#f8fafc' : '#1e293b')}
                      stroke={p0Purple}
                      strokeWidth="2"
                    />
                    <text x="15" y="22" fill={p0Purple} fontSize="11" fontWeight="bold" fontFamily="monospace">
                      [P0] topic: notifications.p0.otp
                    </text>
                    <text x="15" y="40" fill={textPrimary} fontSize="9" fontFamily="sans-serif">
                      2FA Verification Codes · Password Resets · High-Stakes Auth
                    </text>
                    <rect x="15" y="50" width="140" height="24" rx="4" fill={isLight ? '#f3e8ff' : '#581c87'} />
                    <text x="85" y="66" textAnchor="middle" fill={p0Purple} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      {isHeadOfLineBlocked ? 'Blocked Behind Promo' : 'SLA: 650ms (Uncongested)'}
                    </text>
                    <text x="315" y="66" textAnchor="end" fill={successGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      {isHeadOfLineBlocked ? 'STALLED' : 'VIP Workers Active'}
                    </text>
                  </g>

                  {/* LANE 2: P1_TRANSACTIONAL QUEUE */}
                  <g transform="translate(20, 155)">
                    <rect x="0" y="0" width="330" height="75" rx="8" fill={isLight ? '#f8fafc' : '#1e293b'} stroke={p1Cyan} strokeWidth="1.5" />
                    <text x="15" y="22" fill={p1Cyan} fontSize="11" fontWeight="bold" fontFamily="monospace">
                      [P1] topic: notifications.p1.transactional
                    </text>
                    <text x="15" y="40" fill={textPrimary} fontSize="9" fontFamily="sans-serif">
                      Ride Arrived · Food Out for Delivery · Payment Receipt
                    </text>
                    <text x="15" y="60" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      SLA: &lt; 10s · Throughput: 40k msgs/sec
                    </text>
                  </g>

                  {/* LANE 3: P2_MARKETING QUEUE (10M BLAST) */}
                  <g transform="translate(20, 245)">
                    <rect
                      x="0"
                      y="0"
                      width="330"
                      height="95"
                      rx="8"
                      fill={isLight ? '#fffbeb' : '#291e0a'}
                      stroke={p2Amber}
                      strokeWidth="2"
                    />
                    <text x="15" y="22" fill={p2Amber} fontSize="11" fontWeight="bold" fontFamily="monospace">
                      [P2] topic: notifications.p2.marketing_promo
                    </text>
                    <text x="15" y="40" fill={textPrimary} fontSize="9" fontFamily="sans-serif">
                      Weekend Flash Sale · 50% Off Restaurant Blast
                    </text>
                    {/* Backlog Counter Meter */}
                    <rect x="15" y="52" width="300" height="18" rx="4" fill={isLight ? '#fde68a' : '#78350f'} />
                    <text x="165" y="65" textAnchor="middle" fill="#000000" fontSize="9" fontWeight="bold" fontFamily="monospace">
                      10,000,000 Messages Queued
                    </text>
                    <text x="15" y="86" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      Drains gracefully over 15 mins without starving P0/P1
                    </text>
                  </g>
                </g>

                {/* ==================== WORKERS & MULTI-VENDOR DISPATCH (Right) ==================== */}
                <g transform="translate(650, 100)" filter="url(#notif-shadow)">
                  <rect
                    x="0"
                    y="0"
                    width="195"
                    height="300"
                    rx="14"
                    fill={cardBg}
                    stroke={isVendorDown ? p2Amber : successGreen}
                    strokeWidth="3"
                  />
                  <text x="97" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Multi-Channel Dispatch
                  </text>
                  <text x="97" y="44" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Vendor Failover Engine
                  </text>

                  {/* SMS Gateway (Twilio / AWS SNS) */}
                  <g transform="translate(15, 60)">
                    <rect
                      x="0"
                      y="0"
                      width="165"
                      height="65"
                      rx="6"
                      fill={isVendorDown ? (isLight ? '#fffbeb' : '#291e0a') : (isLight ? '#f0fdf4' : '#052e16')}
                      stroke={isVendorDown ? p2Amber : successGreen}
                      strokeWidth="1.5"
                    />
                    <text x="10" y="18" fill={isVendorDown ? p2Amber : successGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      SMS: {isVendorDown ? 'AWS SNS (Failover)' : 'Twilio Gateway'}
                    </text>
                    <text x="10" y="34" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      {isVendorDown ? 'Twilio 500 Circuit Open' : 'Status: Healthy (99.9%)'}
                    </text>
                    <text x="10" y="50" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      {isVendorDown ? 'Auto-routed to backup' : 'Exponential Jitter Active'}
                    </text>
                  </g>

                  {/* FCM Push Notification Box */}
                  <g transform="translate(15, 135)">
                    <rect x="0" y="0" width="165" height="55" rx="6" fill={isLight ? '#f8fafc' : '#1e293b'} stroke={cardBorder} strokeWidth="1" />
                    <text x="10" y="18" fill={textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      Push: Google FCM / APNs
                    </text>
                    <text x="10" y="34" fill={p1Cyan} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      HTTP/2 Multiplexing
                    </text>
                    <text x="10" y="48" fill={textSecondary} fontSize="7" fontFamily="sans-serif">
                      45,000 concurrent push/sec
                    </text>
                  </g>

                  {/* Dead Letter Queue (DLQ) Card */}
                  <g transform="translate(15, 200)">
                    <rect x="0" y="0" width="165" height="45" rx="6" fill={isLight ? '#f8fafc' : '#1e293b'} stroke={cardBorder} strokeWidth="1" />
                    <text x="10" y="18" fill={textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      Dead Letter Queue (DLQ)
                    </text>
                    <text x="10" y="34" fill={successGreen} fontSize="8" fontWeight="bold" fontFamily="monospace">
                      Error Rate: &lt; 0.01%
                    </text>
                  </g>

                  <rect x="15" y="255" width="165" height="32" rx="6" fill={isLight ? '#f0fdf4' : '#052e16'} />
                  <text x="82" y="275" textAnchor="middle" fill={successGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    SLA: P0 &lt; 1.0s Guaranteed
                  </text>
                </g>

                {/* OVERLAY WARNING: HEAD-OF-LINE BLOCKING */}
                {isHeadOfLineBlocked && (
                  <g transform="translate(230, 435)">
                    <rect x="0" y="0" width="420" height="52" rx="10" fill={isLight ? '#fef2f2' : '#450a0a'} stroke={dangerRed} strokeWidth="2.5" />
                    <text x="210" y="22" textAnchor="middle" fill={dangerRed} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                      🚨 HEAD-OF-LINE BLOCKING: 2FA OTP Trapped in FIFO Queue
                    </text>
                    <text x="210" y="38" textAnchor="middle" fill={isLight ? '#991b1b' : '#fca5a5'} fontSize="10" fontFamily="monospace">
                      10M promo messages delayed login codes by 45 minutes! Users abandoned.
                    </text>
                  </g>
                )}

                {/* OVERLAY WARNING: VENDOR FAILOVER */}
                {isVendorDown && (
                  <g transform="translate(230, 435)">
                    <rect x="0" y="0" width="420" height="52" rx="10" fill={isLight ? '#fffbeb' : '#451a03'} stroke={p2Amber} strokeWidth="2.5" />
                    <text x="210" y="22" textAnchor="middle" fill={p2Amber} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                      🛡️ VENDOR RESILIENCE: Circuit Breaker Auto-Failover
                    </text>
                    <text x="210" y="38" textAnchor="middle" fill={isLight ? '#92400e' : '#fde68a'} fontSize="10" fontFamily="monospace">
                      Twilio 500 error tripped circuit breaker. Seamlessly switched to AWS SNS!
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