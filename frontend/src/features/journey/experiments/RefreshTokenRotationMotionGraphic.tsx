import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function RefreshTokenRotationMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [strategyMode, setStrategyMode] = useState<'rtr_active_defense' | 'vulnerable_static_tokens' | 'concurrent_grace_period'>('rtr_active_defense')

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

  let clientTokenState = 'RT_0 (rt_init_101)'
  let attackerTokenState = 'Inactive (Listening)'
  let activeServerToken = 'RT_0'
  let usedTokensList = ['None']
  let sessionRevoked = false
  let authStatusCode = '200 OK'

  if (currentTime < 3.0) {
    // Act 1: Legitimate Token Exchange & Rotation
    clientTokenState = currentTime < 1.5 ? 'Presenting RT_0' : 'Rotated -> RT_1 (rt_rot_1)'
    activeServerToken = currentTime < 1.5 ? 'RT_0' : 'RT_1'
    usedTokensList = currentTime < 1.5 ? [] : ['RT_0 (Spent)']
    authStatusCode = '200 OK'
    subtitle = 'Act 1 (0.0s – 3.0s): Legitimate Token Exchange. Client exchanges single-use RT_0. Auth server archives RT_0 in used vault and issues fresh RT_1.'
    metrics = [
      { label: 'Client Token', value: currentTime < 1.5 ? 'RT_0 (Presenting)' : 'RT_1 (Active)', variant: 'success' },
      { label: 'Server Active Token', value: activeServerToken, variant: 'default' },
      { label: 'Used Token Vault', value: usedTokensList.length ? 'RT_0 archived' : 'Empty', variant: 'default' },
      { label: 'Auth Status', value: '200 OK (Access Granted)', variant: 'success' },
    ]
  } else if (currentTime < 6.0) {
    // Act 2: Breach & Token Theft
    clientTokenState = 'Holding RT_1'
    attackerTokenState = 'EXFILTRATED RT_0 (Malware/XSS)'
    activeServerToken = 'RT_1'
    usedTokensList = ['RT_0 (Spent)']

    if (strategyMode === 'vulnerable_static_tokens') {
      subtitle = 'Act 2 (3.0s – 6.0s): Static Token Vulnerability. Client uses static 30-day token. Attacker steals token via browser application storage XSS.'
      metrics = [
        { label: 'Security Model', value: 'Static Refresh Token (No RTR)', variant: 'danger' },
        { label: 'Attacker State', value: 'Stole Valid Static RT_0', variant: 'danger' },
        { label: 'Server Defense', value: 'None (No Rotation Vault)', variant: 'danger' },
        { label: 'Compromise Risk', value: 'CRITICAL (Undetected Leak)', variant: 'danger' },
      ]
    } else {
      subtitle = 'Act 2 (3.0s – 6.0s): Breach Simulated. Attacker exfiltrates cached token RT_0 and prepares a replay attack against /oauth/token endpoint.'
      metrics = [
        { label: 'Attacker State', value: 'Holding Spent Token RT_0', variant: 'warning' },
        { label: 'Legitimate Client', value: 'Holding Fresh Token RT_1', variant: 'success' },
        { label: 'Auth Server', value: 'RTR Monitoring Active', variant: 'default' },
        { label: 'Trap Status', value: 'Replay Detection Armed', variant: 'default' },
      ]
    }
  } else if (currentTime < 9.0) {
    // Act 3: Attacker Replays Token -> Detection
    attackerTokenState = 'Submitting Replay RT_0'

    if (strategyMode === 'vulnerable_static_tokens') {
      authStatusCode = '200 OK (ATTACKER GRANTED)'
      subtitle = 'Act 3 (6.0s – 9.0s): UNAUTHORIZED ACCESS! Without RTR, auth server accepts stolen static token. Attacker receives valid API access token!'
      metrics = [
        { label: 'Replay Request', value: 'Attacker presented RT_0', variant: 'danger' },
        { label: 'Auth Result', value: '200 OK (New AT Issued to Hacker)', variant: 'danger' },
        { label: 'Detection Status', value: 'FAILED (Zero visibility)', variant: 'danger' },
        { label: 'API Security', value: 'DATA EXFILTRATION IN PROGRESS', variant: 'danger' },
      ]
    } else if (strategyMode === 'concurrent_grace_period') {
      authStatusCode = '200 OK (Grace Leeway)'
      subtitle = 'Act 3 (6.0s – 9.0s): Grace Period Leeway. Server detects duplicate RT_0 within 2-second network tolerance window. Reissues current active token.'
      metrics = [
        { label: 'Replay Tolerance', value: 'Within 2.0s Leeway Window', variant: 'warning' },
        { label: 'Action', value: 'Return Active RT_1 (No Revoke)', variant: 'warning' },
        { label: 'Session State', value: 'Active (Grace Match)', variant: 'default' },
        { label: 'Network Robustness', value: 'Avoids False-Positive Drops', variant: 'success' },
      ]
    } else {
      // RTR Active Defense (RFC 6819)
      sessionRevoked = true
      authStatusCode = '401 UNAUTHORIZED (TOKEN REUSE DETECTED)'
      subtitle = 'Act 3 (6.0s – 9.0s): REPLAY DETECTED! Attacker submitted RT_0, which exists in used_tokens. Entire session REVOKED immediately!'
      metrics = [
        { label: 'Replay Target', value: 'RT_0 in `used_tokens` list', variant: 'danger' },
        { label: 'Anomaly Engine', value: 'TOKEN_REUSE_DETECTED', variant: 'danger' },
        { label: 'Session Revocation', value: 'REVOKED = True (All Tokens)', variant: 'danger' },
        { label: 'Status Code', value: '401 Unauthorized (Circuit Broken)', variant: 'danger' },
      ]
    }
  } else {
    // Act 4: Cascade Invalidation & Complete Attacker Lockout
    if (strategyMode === 'vulnerable_static_tokens') {
      authStatusCode = 'COMPROMISED'
      subtitle = 'Act 4 (9.0s – 12.0s): Ongoing breach. Without Refresh Token Rotation, user accounts remain hijacked until manual password reset.'
      metrics = [
        { label: 'Final State', value: 'UNAUTHORIZED COMPROMISE', variant: 'danger' },
        { label: 'Remediation', value: 'Force Password Reset Required', variant: 'warning' },
        { label: 'RFC Compliance', value: 'VIOLATION (RFC 6749 Insecure)', variant: 'danger' },
        { label: 'Data Impact', value: 'PII & Financial Ledger Leaked', variant: 'danger' },
      ]
    } else if (strategyMode === 'concurrent_grace_period') {
      subtitle = 'Act 4 (9.0s – 12.0s): Grace period complete. Subsequent requests outside window trigger full family revocation.'
      metrics = [
        { label: 'Grace Window', value: 'Closed (TTL Expired)', variant: 'default' },
        { label: 'Active Token', value: 'RT_1 Secured', variant: 'success' },
        { label: 'User Impact', value: 'Zero Flaky Logouts on 4G Drops', variant: 'success' },
        { label: 'Defense State', value: 'Strict RTR Enforced', variant: 'success' },
      ]
    } else {
      // RTR Active Defense: Full Lockout
      sessionRevoked = true
      clientTokenState = 'Terminated (Must Re-login)'
      attackerTokenState = 'BLOCKED (401 Forbidden)'
      authStatusCode = 'SESSION TERMINATED'
      subtitle = 'Act 4 (9.0s – 12.0s): Token Family Revoked! All descendant tokens invalidated. Attacker permanently locked out. Zero data leaked.'
      metrics = [
        { label: 'Token Family', value: 'All Descendant Tokens Revoked', variant: 'success' },
        { label: 'Attacker Connection', value: 'PERMANENTLY BLOCKED (0 Access)', variant: 'success' },
        { label: 'Legitimate User', value: 'Safe Forced Re-login Prompt', variant: 'success' },
        { label: 'RFC 6819 Security', value: '100% Zero-Trust Compliance', variant: 'success' },
      ]
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      <MotionGraphicPlayer
        title="OAuth 2.0 Refresh Token Rotation & Token Family Reuse Invalidation (RFC 6819)"
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
              onClick={() => { setStrategyMode('rtr_active_defense'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'rtr_active_defense'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>RTR Active Defense (RFC 6819)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('vulnerable_static_tokens'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'vulnerable_static_tokens'
                  ? 'bg-rose-950/50 text-rose-300 font-bold border border-rose-600/60 shadow-xs'
                  : 'text-muted hover:text-rose-300'
              }`}
            >
              <AlertTriangle size={12} />
              <span>Vulnerable Static Tokens (No RTR)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('concurrent_grace_period'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'concurrent_grace_period'
                  ? 'bg-sky-950/50 text-sky-300 font-bold border border-sky-600/60 shadow-xs'
                  : 'text-muted hover:text-sky-300'
              }`}
            >
              <KeyRound size={12} />
              <span>Grace Period Leeway (Mobile)</span>
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
          const clientCyan = '#06b6d4'
          const attackerRed = '#f43f5e'
          const authIndigo = '#818cf8'
          const resourceEmerald = '#10b981'
          const dangerRed = '#ef4444'
          const warningAmber = '#f59e0b'

          // Interpolation percentages
          const tAct1 = Math.min(1, Math.max(0, (currentTime - 0.5) / 2.0))
          const tAct2 = Math.min(1, Math.max(0, (currentTime - 3.5) / 2.0))
          const tAct3 = Math.min(1, Math.max(0, (currentTime - 6.5) / 2.0))

          // Client to Auth Server path: (220, 140) -> (420, 200)
          // Attacker to Auth Server path: (220, 380) -> (420, 260)
          // Auth Server to Protected APIs path: (640, 230) -> (730, 230)

          return (
            <div className="relative w-full aspect-[16/10] max-w-[880px] mx-auto py-2">
              <svg viewBox="0 0 900 520" className="w-full h-full transition-all duration-300">
                <defs>
                  <marker id="auth-arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={clientCyan} />
                  </marker>
                  <marker id="auth-arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={dangerRed} />
                  </marker>
                  <marker id="auth-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={resourceEmerald} />
                  </marker>
                  <filter id="auth-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity={isLight ? '0.08' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* ==================== FLOW CONNECTORS (BEZIER CURVES) ==================== */}
                {/* 1. Legitimate Client <-> Auth Server Path */}
                <path
                  d="M 230 140 C 330 140, 340 190, 430 190"
                  fill="none"
                  stroke={sessionRevoked ? dangerRed : clientCyan}
                  strokeWidth="2.5"
                  opacity={0.8}
                />

                {/* 2. Attacker <-> Auth Server Path */}
                <path
                  d="M 230 380 C 330 380, 340 270, 430 270"
                  fill="none"
                  stroke={dangerRed}
                  strokeWidth={currentTime >= 6.0 ? 3 : 1.5}
                  strokeDasharray={currentTime < 6.0 ? '4 4' : 'none'}
                  opacity={0.8}
                />

                {/* 3. Auth Server <-> Protected APIs Path */}
                <line
                  x1="640"
                  y1="230"
                  x2="720"
                  y2="230"
                  stroke={
                    sessionRevoked
                      ? dangerRed
                      : strategyMode === 'vulnerable_static_tokens' && currentTime >= 6.0
                      ? dangerRed
                      : resourceEmerald
                  }
                  strokeWidth="3"
                  opacity={0.8}
                />

                {/* ==================== FLYING PACKETS ==================== */}
                {/* Act 1: Legitimate Token Exchange */}
                {currentTime < 3.0 && (
                  <g transform={`translate(${230 + (430 - 230) * tAct1}, ${140 + (190 - 140) * tAct1})`}>
                    <circle r="7" fill={clientCyan} filter="url(#auth-shadow)" />
                    <rect x="-45" y="-22" width="90" height="16" rx="4" fill={isLight ? '#0891b2' : '#155e75'} />
                    <text x="0" y="-10" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                      POST: RT_0
                    </text>
                  </g>
                )}

                {/* Act 2: Exfiltration packet from client to attacker */}
                {currentTime >= 3.0 && currentTime < 6.0 && (
                  <g transform={`translate(${130}, ${200 + (340 - 200) * tAct2})`}>
                    <circle r="6" fill={dangerRed} />
                    <text x="12" y="4" fill={dangerRed} fontSize="9" fontWeight="bold">
                      XSS EXFIL: RT_0
                    </text>
                  </g>
                )}

                {/* Act 3: Attacker Replays Token to Server */}
                {currentTime >= 6.0 && currentTime < 9.0 && (
                  <g transform={`translate(${230 + (430 - 230) * tAct3}, ${380 - (380 - 270) * tAct3})`}>
                    <circle r="7" fill={dangerRed} filter="url(#auth-shadow)" />
                    <rect x="-55" y="-22" width="110" height="16" rx="4" fill="#991b1b" />
                    <text x="0" y="-10" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                      REPLAY: RT_0 (Spent)
                    </text>
                  </g>
                )}

                {/* ==================== 1. LEGITIMATE CLIENT PANEL (Top Left) ==================== */}
                <g transform="translate(30, 60)" filter="url(#auth-shadow)">
                  <rect
                    width="200"
                    height="160"
                    rx="12"
                    fill={cardBg}
                    stroke={sessionRevoked ? dangerRed : clientCyan}
                    strokeWidth={sessionRevoked ? 2 : 1.5}
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="200" height="34" rx="12" fill={isLight ? '#ecfeff' : '#083344'} />
                  <circle cx="16" cy="17" r="6" fill={clientCyan} />
                  <text x="30" y="22" fill={textPrimary} fontSize="12" fontWeight="700">
                    Legitimate Client (Browser)
                  </text>

                  {/* Body */}
                  <text x="14" y="58" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    User: <tspan fill={textPrimary} fontWeight="bold">aarav@bharatpay.in</tspan>
                  </text>
                  <text x="14" y="78" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Device: <tspan fill={textPrimary}>Chrome / Merchant Mac</tspan>
                  </text>
                  <text x="14" y="98" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Current Token: <tspan fill={clientCyan} fontWeight="bold">{clientTokenState.slice(0, 18)}</tspan>
                  </text>

                  {/* Status Pill */}
                  <rect
                    x="14"
                    y="114"
                    width="172"
                    height="32"
                    rx="6"
                    fill={
                      sessionRevoked
                        ? isLight ? '#fee2e2' : '#450a0a'
                        : isLight ? '#dcfce7' : '#052e16'
                    }
                    stroke={sessionRevoked ? dangerRed : resourceEmerald}
                    strokeWidth="1"
                  />
                  <text
                    x="100"
                    y="134"
                    textAnchor="middle"
                    fill={sessionRevoked ? dangerRed : resourceEmerald}
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {sessionRevoked ? '⚠ SESSION REVOKED' : '✓ AUTHENTICATED (RT_1)'}
                  </text>
                </g>

                {/* ==================== 2. MALICIOUS ATTACKER PANEL (Bottom Left) ==================== */}
                <g transform="translate(30, 290)" filter="url(#auth-shadow)">
                  <rect
                    width="200"
                    height="160"
                    rx="12"
                    fill={cardBg}
                    stroke={attackerRed}
                    strokeWidth="1.5"
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="200" height="34" rx="12" fill={isLight ? '#fee2e2' : '#450a0a'} />
                  <circle cx="16" cy="17" r="6" fill={attackerRed} />
                  <text x="30" y="22" fill={textPrimary} fontSize="12" fontWeight="700">
                    Adversary / Malware Node
                  </text>

                  {/* Body */}
                  <text x="14" y="58" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Vector: <tspan fill={dangerRed} fontWeight="bold">Chrome Ext XSS Stealer</tspan>
                  </text>
                  <text x="14" y="78" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Target: <tspan fill={textPrimary}>Cached Refresh Token</tspan>
                  </text>
                  <text x="14" y="98" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Payload: <tspan fill={dangerRed} fontWeight="bold">{attackerTokenState.slice(0, 18)}</tspan>
                  </text>

                  {/* Status Pill */}
                  <rect
                    x="14"
                    y="114"
                    width="172"
                    height="32"
                    rx="6"
                    fill={
                      strategyMode === 'vulnerable_static_tokens' && currentTime >= 6.0
                        ? isLight ? '#dcfce7' : '#052e16'
                        : isLight ? '#fee2e2' : '#450a0a'
                    }
                    stroke={dangerRed}
                    strokeWidth="1"
                  />
                  <text
                    x="100"
                    y="134"
                    textAnchor="middle"
                    fill={
                      strategyMode === 'vulnerable_static_tokens' && currentTime >= 6.0
                        ? resourceEmerald
                        : dangerRed
                    }
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {strategyMode === 'vulnerable_static_tokens' && currentTime >= 6.0
                      ? '✓ ACCESS HIJACKED'
                      : sessionRevoked
                      ? '✗ ACCESS REJECTED (401)'
                      : currentTime >= 6.0
                      ? 'REPLAYING EXFIL TRT'
                      : 'LISTENING FOR TOKEN'}
                  </text>
                </g>

                {/* ==================== 3. OAUTH 2.0 AUTH SERVER (Center) ==================== */}
                <g transform="translate(430, 50)" filter="url(#auth-shadow)">
                  <rect
                    width="210"
                    height="400"
                    rx="14"
                    fill={cardBg}
                    stroke={sessionRevoked ? dangerRed : authIndigo}
                    strokeWidth={sessionRevoked ? 2 : 1}
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="210" height="42" rx="14" fill={isLight ? '#f5f3ff' : '#2e1065'} />
                  <circle cx="20" cy="21" r="7" fill={authIndigo} />
                  <text x="35" y="26" fill={textPrimary} fontSize="13" fontWeight="800">
                    OAuth 2.0 Auth Server
                  </text>

                  {/* 1. Active Token Registry */}
                  <g transform="translate(14, 55)">
                    <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="700" letterSpacing="0.05em">
                      SESSION RECORD (`s_101`)
                    </text>
                    <rect x="0" y="22" width="182" height="75" rx="8" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    
                    <text x="10" y="42" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      Active: <tspan fill={authIndigo} fontWeight="bold">{activeServerToken}</tspan>
                    </text>
                    <text x="10" y="60" fill={textSecondary} fontSize="10" fontFamily="monospace">
                      Revoked: <tspan fill={sessionRevoked ? dangerRed : resourceEmerald} fontWeight="bold">{sessionRevoked ? 'TRUE' : 'FALSE'}</tspan>
                    </text>
                    <text x="10" y="78" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      Family ID: fam_bharat_9941
                    </text>
                  </g>

                  {/* 2. Used Tokens Vault (Replay Detection) */}
                  <g transform="translate(14, 160)">
                    <text x="0" y="14" fill={textSecondary} fontSize="10" fontWeight="700" letterSpacing="0.05em">
                      USED TOKEN VAULT (`used_tokens`)
                    </text>
                    <rect
                      x="0"
                      y="22"
                      width="182"
                      height="85"
                      rx="8"
                      fill={isLight ? '#f8fafc' : '#0b0f19'}
                      stroke={cardBorder}
                    />

                    {strategyMode === 'vulnerable_static_tokens' ? (
                      <text x="10" y="50" fill={dangerRed} fontSize="10" fontFamily="monospace">
                        [Disabled: No History Kept]
                      </text>
                    ) : (
                      <>
                        <text x="10" y="42" fill={currentTime >= 1.5 ? warningAmber : textSecondary} fontSize="10" fontFamily="monospace">
                          • {currentTime >= 1.5 ? 'RT_0 (Spent at t=1.8s)' : '[Empty Vault]'}
                        </text>
                        <text x="10" y="60" fill={textSecondary} fontSize="9" fontFamily="monospace">
                          Replay check: `tok in used_tokens`
                        </text>
                        <text
                          x="10"
                          y="78"
                          fill={sessionRevoked ? dangerRed : resourceEmerald}
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {sessionRevoked ? 'REPLAY HIT -> REVOKE' : 'Status: Armed & Guarded'}
                        </text>
                      </>
                    )}
                  </g>

                  {/* 3. Replay Detector Circuit Breaker */}
                  <g transform="translate(14, 275)">
                    <rect
                      x="0"
                      y="0"
                      width="182"
                      height="105"
                      rx="8"
                      fill={
                        sessionRevoked
                          ? isLight ? '#fee2e2' : '#450a0a'
                          : isLight ? '#f0fdf4' : '#052e16'
                      }
                      stroke={sessionRevoked ? dangerRed : resourceEmerald}
                    />
                    <text x="10" y="20" fill={textSecondary} fontSize="9" fontWeight="bold">
                      CIRCUIT BREAKER STATE
                    </text>
                    <text
                      x="10"
                      y="44"
                      fill={sessionRevoked ? dangerRed : resourceEmerald}
                      fontSize="14"
                      fontWeight="800"
                      fontFamily="monospace"
                    >
                      {authStatusCode}
                    </text>
                    <text x="10" y="66" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      {sessionRevoked
                        ? 'Token reuse identified'
                        : 'Single-use integrity OK'}
                    </text>
                    <text x="10" y="82" fill={sessionRevoked ? dangerRed : textSecondary} fontSize="9" fontFamily="monospace">
                      {sessionRevoked
                        ? 'All family tokens killed'
                        : 'No replay observed'}
                    </text>
                  </g>
                </g>

                {/* ==================== 4. PROTECTED RESOURCE SERVICES (Right) ==================== */}
                <g transform="translate(720, 60)" filter="url(#auth-shadow)">
                  <rect
                    width="150"
                    height="380"
                    rx="14"
                    fill={cardBg}
                    stroke={cardBorder}
                    strokeWidth="1"
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="150" height="38" rx="14" fill={isLight ? '#f0fdf4' : '#052e16'} />
                  <circle cx="16" cy="19" r="6" fill={resourceEmerald} />
                  <text x="28" y="24" fill={textPrimary} fontSize="11" fontWeight="700">
                    Protected Microservices
                  </text>

                  {/* Body Content */}
                  <g transform="translate(12, 55)">
                    <rect x="0" y="0" width="126" height="65" rx="6" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="8" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      PAYMENT LEDGER API
                    </text>
                    <text x="8" y="38" fill={sessionRevoked ? dangerRed : resourceEmerald} fontSize="10" fontFamily="monospace">
                      {sessionRevoked ? 'BLOCKED (401)' : '200 OK'}
                    </text>
                    <text x="8" y="52" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      /api/v1/payouts
                    </text>
                  </g>

                  <g transform="translate(12, 135)">
                    <rect x="0" y="0" width="126" height="65" rx="6" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="8" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      MERCHANT SETTINGS
                    </text>
                    <text x="8" y="38" fill={sessionRevoked ? dangerRed : resourceEmerald} fontSize="10" fontFamily="monospace">
                      {sessionRevoked ? 'BLOCKED (401)' : '200 OK'}
                    </text>
                    <text x="8" y="52" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      /api/v1/settlements
                    </text>
                  </g>

                  <g transform="translate(12, 215)">
                    <rect x="0" y="0" width="126" height="65" rx="6" fill={isLight ? '#f8fafc' : '#0b0f19'} stroke={cardBorder} />
                    <text x="8" y="18" fill={textSecondary} fontSize="9" fontWeight="bold">
                      CUSTOMER PII VAULT
                    </text>
                    <text x="8" y="38" fill={sessionRevoked ? dangerRed : resourceEmerald} fontSize="10" fontFamily="monospace">
                      {sessionRevoked ? 'BLOCKED (401)' : '200 OK'}
                    </text>
                    <text x="8" y="52" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      /api/v1/merchants
                    </text>
                  </g>

                  <g transform="translate(12, 305)">
                    <rect
                      x="0"
                      y="0"
                      width="126"
                      height="38"
                      rx="6"
                      fill={
                        strategyMode === 'vulnerable_static_tokens' && currentTime >= 6.0
                          ? '#be123c'
                          : sessionRevoked
                          ? isLight ? '#fee2e2' : '#450a0a'
                          : isLight ? '#dcfce7' : '#052e16'
                      }
                    />
                    <text
                      x="63"
                      y="23"
                      textAnchor="middle"
                      fill={
                        strategyMode === 'vulnerable_static_tokens' && currentTime >= 6.0
                          ? '#ffffff'
                          : sessionRevoked
                          ? dangerRed
                          : resourceEmerald
                      }
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {strategyMode === 'vulnerable_static_tokens' && currentTime >= 6.0
                        ? 'DATA LEAKED'
                        : sessionRevoked
                        ? 'ZERO DATA LEAKED'
                        : 'SECURED'}
                    </text>
                  </g>
                </g>

                {/* Intrusion Alert Overlay */}
                {currentTime >= 6.0 && currentTime < 9.0 && strategyMode === 'rtr_active_defense' && (
                  <g transform="translate(370, 240)" filter="url(#auth-shadow)">
                    <rect x="-95" y="-24" width="190" height="48" rx="8" fill="#991b1b" stroke={dangerRed} strokeWidth="2" />
                    <text x="0" y="-4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                      TOKEN REUSE DETECTED!
                    </text>
                    <text x="0" y="14" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace">
                      Triggering Family Revocation
                    </text>
                  </g>
                )}

                {/* Unauthorized Breach Warning Overlay */}
                {currentTime >= 6.0 && strategyMode === 'vulnerable_static_tokens' && (
                  <g transform="translate(370, 240)" filter="url(#auth-shadow)">
                    <rect x="-90" y="-24" width="180" height="48" rx="8" fill="#be123c" stroke={dangerRed} strokeWidth="2" />
                    <text x="0" y="-4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                      REPLAY SUCCESSFUL!
                    </text>
                    <text x="0" y="14" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace">
                      Attacker Received Token
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
