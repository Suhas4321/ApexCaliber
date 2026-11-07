import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Flame, ShieldCheck } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function DnsResolutionMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [strategyMode, setStrategyMode] = useState<'dnssec_safe' | 'kaminsky_poison' | 'uncached_flood'>('dnssec_safe')

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
  let isPoisoned = false
  let isUncachedFlood = false
  let isDnssecActive = false
  let activeResolvedIp = '198.51.100.88'

  if (currentTime < 3.0) {
    subtitle = '0.0s - 3.0s: Cold Iterative Resolution. Recursive resolver queries Root (.) -> TLD (.com) -> Authoritative (ns1.netflix.com). IP 198.51.100.88 cached.'
    metrics = [
      { label: 'Client Query', value: 'api.netflix.com', variant: 'default' },
      { label: 'Root Referral', value: 'a.root-servers.net -> .com', variant: 'default' },
      { label: 'TLD Referral', value: '.com TLD -> ns1.netflix.com', variant: 'default' },
      { label: 'Authoritative IP', value: '198.51.100.88 (TTL 300s)', variant: 'success' },
    ]
  } else if (currentTime < 6.0) {
    if (strategyMode === 'uncached_flood') {
      isUncachedFlood = true
      subtitle = '3.0s - 6.0s: UNCACHED ROOT FLOOD. Mobile clients disable DNS caching. 100,000 requests/sec hammer Root Servers directly. Upstream rate limit hits!'
      metrics = [
        { label: 'Client Ingress', value: '100,000 queries / sec', variant: 'danger' },
        { label: 'Resolver Cache', value: 'DISABLED (Bypassed)', variant: 'danger' },
        { label: 'Root Server Load', value: '100k QPS (Rate Limited)', variant: 'danger' },
        { label: 'Resolution Latency', value: '850 ms (Global WAN Spike)', variant: 'danger' },
      ]
    } else {
      subtitle = '3.0s - 6.0s: Cache Shield. 50,000 client queries answered in <1ms directly from resolver RAM. Root and TLD servers completely shielded.'
      metrics = [
        { label: 'Client Ingress', value: '50,000 queries / sec', variant: 'default' },
        { label: 'Resolver Cache', value: '99.98% CACHE HIT (<1ms)', variant: 'success' },
        { label: 'Upstream Traffic', value: '0 QPS (100% Shielded)', variant: 'success' },
        { label: 'Latency SLA', value: '0.8 ms (Local RAM)', variant: 'success' },
      ]
    }
  } else if (currentTime < 9.0) {
    if (strategyMode === 'kaminsky_poison') {
      isPoisoned = true
      activeResolvedIp = '66.66.66.66'
      subtitle = '6.0s - 9.0s: KAMINSKY ATTACK SUCCEEDS! Attacker guessed 16-bit TXID on UDP port 53. Resolver cached forged IP 66.66.66.66. Users routed to phishing site!'
      metrics = [
        { label: 'Attack Vector', value: 'Kaminsky 16-bit TXID Guess', variant: 'danger' },
        { label: 'Spoofed Record', value: 'api.netflix.com -> 66.66.66.66', variant: 'danger' },
        { label: 'Cache State', value: 'POISONED (Malicious IP)', variant: 'danger' },
        { label: 'User Impact', value: '50,000 Phishing Highjackings', variant: 'danger' },
      ]
    } else if (strategyMode === 'uncached_flood') {
      isUncachedFlood = true
      subtitle = '6.0s - 9.0s: ROOT TIMEOUT OUTAGE. Root nameserver clusters throttle ISP resolver. Mobile app returns NXDOMAIN / DNS_PROBE_FINISHED_NXDOMAIN.'
      metrics = [
        { label: 'DNS Error', value: 'NXDOMAIN / SERVFAIL', variant: 'danger' },
        { label: 'App Connection', value: 'Delivery App Offline', variant: 'danger' },
        { label: 'Root Response', value: 'Rate Limit Dropped', variant: 'danger' },
        { label: 'Fix', value: 'Enable Local TTL Caching', variant: 'warning' },
      ]
    } else {
      isDnssecActive = true
      subtitle = '6.0s - 9.0s: Kaminsky Attack Thwarted! Attacker injects forged IP 66.66.66.66. DNSSEC RRSIG cryptographic verification fails. Fake packet dropped!'
      metrics = [
        { label: 'Attack Attempt', value: 'Spoofed UDP Packet Arrived', variant: 'warning' },
        { label: 'DNSSEC Validation', value: 'RRSIG Cryptographic Check', variant: 'success' },
        { label: 'Integrity Verification', value: 'SIGNATURE MISMATCH -> Dropped', variant: 'success' },
        { label: 'Cache Integrity', value: 'Authentic 198.51.100.88 Preserved', variant: 'success' },
      ]
    }
  } else {
    if (strategyMode === 'kaminsky_poison') {
      isPoisoned = true
      activeResolvedIp = '66.66.66.66'
      subtitle = '9.0s - 12.0s: Post-Mortem. Unsigned UDP DNS is vulnerable to transaction spoofing. Deploying DNSSEC (RFC 4033) is mandatory for cryptographic defense.'
      metrics = [
        { label: 'Security Grade', value: 'VULNERABLE (Plaintext UDP)', variant: 'danger' },
        { label: 'Incident Result', value: 'Mass Phishing Compromise', variant: 'danger' },
        { label: 'Mandatory Fix', value: 'Deploy DNSSEC + Port Randomization', variant: 'warning' },
        { label: 'RFC Standard', value: 'RFC 4033 / RFC 5452', variant: 'default' },
      ]
    } else {
      isDnssecActive = true
      subtitle = '9.0s - 12.0s: Production Resilience. Zero-downtime blue-green cutovers honor 300s TTL. 99.999% resolution uptime across Cloudflare 1.1.1.1 & Route 53.'
      metrics = [
        { label: 'Final Resolution', value: '198.51.100.88 (Verified ✓)', variant: 'success' },
        { label: 'DNSSEC Trust Chain', value: 'Root Anchor -> TLD -> Auth', variant: 'success' },
        { label: 'Cache Hit Efficiency', value: '99.98% Shielding Factor', variant: 'success' },
        { label: 'Production Status', value: 'CLOUDFLARE / ROUTE 53 GRADE', variant: 'success' },
      ]
    }
  }

  return (
    <div className="w-full space-y-4">
      <MotionGraphicPlayer
        title="Hierarchical Recursive DNS Resolution & DNSSEC"
        subtitle="12-Second Slow Walkthrough · RFC 1035, Root Hierarchy Tree, Kaminsky Cache Poisoning & DNSSEC RRSIG Validation"
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
              onClick={() => { setStrategyMode('dnssec_safe'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'dnssec_safe'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>DNSSEC (Cryptographic Safe)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('kaminsky_poison'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'kaminsky_poison'
                  ? 'bg-rose-950/50 text-rose-300 font-bold border border-rose-600/60 shadow-xs'
                  : 'text-muted hover:text-rose-300'
              }`}
            >
              <Flame size={12} />
              <span>Kaminsky Poison (Spoofed)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('uncached_flood'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'uncached_flood'
                  ? 'bg-amber-950/50 text-amber-300 font-bold border border-amber-600/60 shadow-xs'
                  : 'text-muted hover:text-amber-300'
              }`}
            >
              <ShieldCheck size={12} />
              <span>Uncached Root Flood (Crash)</span>
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
          const resolverPurple = '#818cf8'
          const treeAmber = '#f59e0b'
          const successGreen = '#10b981'
          const dangerRed = '#ef4444'

          return (
            <div className="relative w-full aspect-[16/10] max-w-[860px] mx-auto py-2">
              <svg viewBox="0 0 880 500" className="w-full h-full transition-all duration-300">
                <defs>
                  <marker id="dns-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={clientBlue} />
                  </marker>
                  <marker id="dns-arrow-purple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={resolverPurple} />
                  </marker>
                  <marker id="dns-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={successGreen} />
                  </marker>
                  <filter id="dns-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity={isLight ? '0.1' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* ==================== FLOW CONNECTORS ==================== */}
                {/* Client -> Recursive Resolver */}
                <path d="M 175 220 L 225 220" fill="none" stroke={clientBlue} strokeWidth="3" markerEnd="url(#dns-arrow-blue)" />

                {/* Recursive Resolver -> Root */}
                <path d="M 405 160 L 470 85" fill="none" stroke={isUncachedFlood ? dangerRed : treeAmber} strokeWidth="2.5" strokeDasharray="4 4" />

                {/* Recursive Resolver -> TLD */}
                <path d="M 405 200 L 470 200" fill="none" stroke={treeAmber} strokeWidth="2.5" strokeDasharray="4 4" />

                {/* Recursive Resolver -> Authoritative */}
                <path d="M 405 240 L 470 315" fill="none" stroke={successGreen} strokeWidth="2.5" strokeDasharray="4 4" markerEnd="url(#dns-arrow-green)" />

                {/* ==================== CLIENT STUB RESOLVER (Left) ==================== */}
                <g transform="translate(25, 110)" filter="url(#dns-shadow)">
                  <rect x="0" y="0" width="155" height="270" rx="14" fill={cardBg} stroke={clientBlue} strokeWidth="3" />
                  <text x="77" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Client Browser
                  </text>
                  <text x="77" y="44" textAnchor="middle" fill={clientBlue} fontSize="10" fontFamily="monospace">
                    Stub Resolver
                  </text>

                  {/* Browser Query Box */}
                  <g transform="translate(12, 58)">
                    <rect x="0" y="0" width="130" height="55" rx="6" fill={isLight ? '#f0f9ff' : '#0c4a6e'} stroke={clientBlue} strokeWidth="1" />
                    <text x="10" y="18" fill={clientBlue} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      getaddrinfo()
                    </text>
                    <text x="10" y="34" fill={textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      api.netflix.com
                    </text>
                    <text x="10" y="46" fill={textSecondary} fontSize="7" fontFamily="monospace">
                      UDP Port 53 / DoH
                    </text>
                  </g>

                  {/* Client Result Banner */}
                  <g transform="translate(12, 125)">
                    <rect
                      x="0"
                      y="0"
                      width="130"
                      height="65"
                      rx="6"
                      fill={isPoisoned ? (isLight ? '#fee2e2' : '#450a0a') : (isLight ? '#ecfdf5' : '#064e3b')}
                      stroke={isPoisoned ? dangerRed : successGreen}
                      strokeWidth="1.5"
                    />
                    <text x="10" y="18" fill={isPoisoned ? dangerRed : successGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      {isPoisoned ? '⚠️ POISONED IP' : '✓ RESOLVED IP:'}
                    </text>
                    <text x="10" y="36" fill={isPoisoned ? dangerRed : textPrimary} fontSize="11" fontWeight="bold" fontFamily="monospace">
                      {activeResolvedIp}
                    </text>
                    <text x="10" y="52" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      {isPoisoned ? 'Phishing Site Active' : 'Netflix Edge Cluster'}
                    </text>
                  </g>

                  <rect x="12" y="205" width="130" height="45" rx="6" fill={isLight ? '#f8fafc' : '#1e293b'} />
                  <text x="65" y="224" textAnchor="middle" fill={textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                    Local OS Cache
                  </text>
                  <text x="65" y="238" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="monospace">
                    systemd-resolved
                  </text>
                </g>

                {/* ==================== RECURSIVE RESOLVER & CACHE (Center-Left) ==================== */}
                <g transform="translate(225, 90)" filter="url(#dns-shadow)">
                  <rect x="0" y="0" width="185" height="310" rx="14" fill={cardBg} stroke={resolverPurple} strokeWidth="3" />
                  <text x="92" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Recursive Resolver
                  </text>
                  <text x="92" y="44" textAnchor="middle" fill={resolverPurple} fontSize="10" fontFamily="monospace">
                    Cloudflare 1.1.1.1 / 8.8.8.8
                  </text>

                  {/* Cache Record View */}
                  <g transform="translate(12, 58)">
                    <rect
                      x="0"
                      y="0"
                      width="160"
                      height="85"
                      rx="8"
                      fill={isPoisoned ? (isLight ? '#fee2e2' : '#450a0a') : (isLight ? '#ecfdf5' : '#064e3b')}
                      stroke={isPoisoned ? dangerRed : successGreen}
                      strokeWidth="1.5"
                    />
                    <text x="10" y="20" fill={isPoisoned ? dangerRed : successGreen} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      DNS Cache Record:
                    </text>
                    <text x="10" y="38" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      api.netflix.com
                    </text>
                    <text x="10" y="54" fill={isPoisoned ? dangerRed : successGreen} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      A → {activeResolvedIp}
                    </text>
                    <text x="10" y="70" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      TTL Remaining: 284s
                    </text>
                  </g>

                  {/* DNSSEC Signature Validator Box */}
                  <g transform="translate(12, 155)">
                    <rect
                      x="0"
                      y="0"
                      width="160"
                      height="75"
                      rx="8"
                      fill={isDnssecActive ? (isLight ? '#f0fdf4' : '#052e16') : (isLight ? '#f8fafc' : '#1e293b')}
                      stroke={isDnssecActive ? successGreen : cardBorder}
                      strokeWidth="1.5"
                    />
                    <text x="10" y="20" fill={isDnssecActive ? successGreen : textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      DNSSEC Validation (RFC 4033)
                    </text>
                    <text x="10" y="38" fill={isDnssecActive ? successGreen : textSecondary} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      {isDnssecActive ? 'RRSIG Validated ✓' : 'DNSSEC: Standard UDP'}
                    </text>
                    <text x="10" y="54" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      {isDnssecActive ? 'Root Trust Anchor Verified' : 'TXID: 0x82A1'}
                    </text>
                  </g>

                  <rect x="12" y="245" width="160" height="45" rx="6" fill={isLight ? '#f8fafc' : '#1e293b'} />
                  <text x="80" y="264" textAnchor="middle" fill={successGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    Shielding Factor: 99.98%
                  </text>
                  <text x="80" y="278" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    Root Protected from Flood
                  </text>
                </g>

                {/* ==================== 3-TIER GLOBAL HIERARCHY (Center-Right) ==================== */}

                {/* TIER 1: ROOT NAMESERVER (.) */}
                <g transform="translate(470, 35)" filter="url(#dns-shadow)">
                  <rect
                    x="0"
                    y="0"
                    width="180"
                    height="90"
                    rx="12"
                    fill={cardBg}
                    stroke={isUncachedFlood ? dangerRed : treeAmber}
                    strokeWidth={isUncachedFlood ? '3' : '2'}
                  />
                  <text x="90" y="24" textAnchor="middle" fill={textPrimary} fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    1. Root Nameserver (.)
                  </text>
                  <text x="90" y="40" textAnchor="middle" fill={treeAmber} fontSize="9" fontFamily="monospace">
                    13 Global Root Clusters [a-m]
                  </text>
                  <rect x="12" y="48" width="156" height="30" rx="6" fill={isLight ? '#fffbeb' : '#291e0a'} />
                  <text x="90" y="66" textAnchor="middle" fill={isUncachedFlood ? dangerRed : treeAmber} fontSize="8" fontWeight="bold" fontFamily="monospace">
                    {isUncachedFlood ? '100k QPS (RATE LIMITED!)' : 'Referral → .com TLD'}
                  </text>
                </g>

                {/* TIER 2: TLD NAMESERVER (.com) */}
                <g transform="translate(470, 155)" filter="url(#dns-shadow)">
                  <rect x="0" y="0" width="180" height="90" rx="12" fill={cardBg} stroke={treeAmber} strokeWidth="2" />
                  <text x="90" y="24" textAnchor="middle" fill={textPrimary} fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    2. TLD Server (.com)
                  </text>
                  <text x="90" y="40" textAnchor="middle" fill={treeAmber} fontSize="9" fontFamily="monospace">
                    Verisign Global Registry
                  </text>
                  <rect x="12" y="48" width="156" height="30" rx="6" fill={isLight ? '#fffbeb' : '#291e0a'} />
                  <text x="90" y="66" textAnchor="middle" fill={treeAmber} fontSize="8" fontWeight="bold" fontFamily="monospace">
                    Referral → ns1.netflix.com
                  </text>
                </g>

                {/* TIER 3: AUTHORITATIVE NAMESERVER (ns1.netflix.com) */}
                <g transform="translate(470, 275)" filter="url(#dns-shadow)">
                  <rect x="0" y="0" width="180" height="100" rx="12" fill={cardBg} stroke={successGreen} strokeWidth="2.5" />
                  <text x="90" y="24" textAnchor="middle" fill={textPrimary} fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    3. Authoritative DNS
                  </text>
                  <text x="90" y="40" textAnchor="middle" fill={successGreen} fontSize="9" fontFamily="monospace">
                    ns1.netflix.com (AWS Route 53)
                  </text>
                  <rect x="12" y="48" width="156" height="38" rx="6" fill={isLight ? '#f0fdf4' : '#052e16'} />
                  <text x="90" y="64" textAnchor="middle" fill={successGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    A: 198.51.100.88
                  </text>
                  <text x="90" y="78" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="monospace">
                    TTL=300s · RRSIG Verified
                  </text>
                </g>

                {/* ==================== ATTACK / DNSSEC DEFENDER (Far Right) ==================== */}
                <g transform="translate(685, 110)" filter="url(#dns-shadow)">
                  <rect
                    x="0"
                    y="0"
                    width="170"
                    height="270"
                    rx="14"
                    fill={cardBg}
                    stroke={isPoisoned ? dangerRed : (isDnssecActive ? successGreen : cardBorder)}
                    strokeWidth="3"
                  />
                  <text x="85" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Security Boundary
                  </text>
                  <text x="85" y="44" textAnchor="middle" fill={isPoisoned ? dangerRed : successGreen} fontSize="10" fontFamily="monospace">
                    {isPoisoned ? 'Kaminsky Spoofing' : 'DNSSEC Cryptography'}
                  </text>

                  {/* Kaminsky Attack Status Box */}
                  <g transform="translate(12, 58)">
                    <rect
                      x="0"
                      y="0"
                      width="146"
                      height="75"
                      rx="6"
                      fill={isPoisoned ? (isLight ? '#fee2e2' : '#450a0a') : (isLight ? '#f8fafc' : '#1e293b')}
                      stroke={isPoisoned ? dangerRed : cardBorder}
                      strokeWidth="1.5"
                    />
                    <text x="10" y="18" fill={isPoisoned ? dangerRed : textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      16-bit TXID Flooder
                    </text>
                    <text x="10" y="36" fill={isPoisoned ? dangerRed : textSecondary} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      {isPoisoned ? 'Collision: 0x82A1' : 'Brute-forcing 65k IDs'}
                    </text>
                    <text x="10" y="52" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      {isPoisoned ? 'Cache Injected!' : 'Blocked by port randomization'}
                    </text>
                    <text x="10" y="66" fill={isPoisoned ? dangerRed : successGreen} fontSize="8" fontWeight="bold" fontFamily="monospace">
                      {isPoisoned ? 'Poison: 66.66.66.66' : 'Source Port: Random'}
                    </text>
                  </g>

                  {/* Trust Anchor Signature */}
                  <g transform="translate(12, 145)">
                    <rect x="0" y="0" width="146" height="55" rx="6" fill={isLight ? '#ecfdf5' : '#064e3b'} stroke={successGreen} strokeWidth="1" />
                    <text x="10" y="18" fill={successGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      RFC 4034 RRSIG
                    </text>
                    <text x="10" y="34" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      RSA-SHA256 Sign
                    </text>
                    <text x="10" y="48" fill={textSecondary} fontSize="7" fontFamily="sans-serif">
                      Authenticity Guaranteed
                    </text>
                  </g>

                  <rect x="12" y="215" width="146" height="42" rx="6" fill={isLight ? '#f0fdf4' : '#052e16'} />
                  <text x="73" y="234" textAnchor="middle" fill={successGreen} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    DNSSEC Trust Anchor
                  </text>
                  <text x="73" y="248" textAnchor="middle" fill={textSecondary} fontSize="7" fontFamily="sans-serif">
                    Zero Cache Poisoning Risk
                  </text>
                </g>

                {/* OVERLAY WARNING: CACHE POISONING */}
                {isPoisoned && (
                  <g transform="translate(230, 435)">
                    <rect x="0" y="0" width="420" height="52" rx="10" fill={isLight ? '#fef2f2' : '#450a0a'} stroke={dangerRed} strokeWidth="2.5" />
                    <text x="210" y="22" textAnchor="middle" fill={dangerRed} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                      🚨 KAMINSKY ATTACK: DNS Cache Poisoned (66.66.66.66)
                    </text>
                    <text x="210" y="38" textAnchor="middle" fill={isLight ? '#991b1b' : '#fca5a5'} fontSize="10" fontFamily="monospace">
                      Attacker guessed UDP TXID. 50,000 users hijacked to phishing replica!
                    </text>
                  </g>
                )}

                {/* OVERLAY WARNING: UNCACHED ROOT FLOOD */}
                {isUncachedFlood && (
                  <g transform="translate(230, 435)">
                    <rect x="0" y="0" width="420" height="52" rx="10" fill={isLight ? '#fffbeb' : '#451a03'} stroke={treeAmber} strokeWidth="2.5" />
                    <text x="210" y="22" textAnchor="middle" fill={treeAmber} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                      ⚠️ UNCACHED ROOT FLOOD: 100k QPS Upstream Spike
                    </text>
                    <text x="210" y="38" textAnchor="middle" fill={isLight ? '#92400e' : '#fde68a'} fontSize="10" fontFamily="monospace">
                      Mobile clients disabled caching. Root servers rate-limited upstream queries!
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