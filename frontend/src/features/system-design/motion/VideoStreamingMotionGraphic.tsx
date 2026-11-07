import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Flame, WifiOff } from 'lucide-react'
import MotionGraphicPlayer from '../../../components/motion/MotionGraphicPlayer'

export default function VideoStreamingMotionGraphic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.5) // default to 0.5x slow walkthrough
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [strategyMode, setStrategyMode] = useState<'adaptive_hls' | 'monolithic_mp4' | 'cdn_outage'>('adaptive_hls')

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
  let activeResolution = '1080p'
  let clientBufferSeconds = 24
  let isRebuffering = false
  let isCdnBypassed = false

  if (currentTime < 3.0) {
    activeResolution = '1080p'
    clientBufferSeconds = 20
    subtitle = '0.0s - 3.0s: Ingestion. Resumable S3 multipart upload -> DAG FFmpeg workers transcode into 4K, 1080p, 720p, 360p HLS segments in parallel.'
    metrics = [
      { label: 'Upload Method', value: 'S3 Pre-Signed Multipart', variant: 'default' },
      { label: 'Transcode DAG', value: 'Parallel GOP Workers', variant: 'success' },
      { label: 'Output Segments', value: '4-Second .m4s Chunks', variant: 'success' },
      { label: 'Master Manifest', value: 'playlist.m3u8 Ready', variant: 'default' },
    ]
  } else if (currentTime < 6.0) {
    if (strategyMode === 'cdn_outage') {
      isCdnBypassed = true
      activeResolution = '720p'
      clientBufferSeconds = 8
      subtitle = '3.0s - 6.0s: CDN OUTAGE! Edge POP failure forces 100,000 clients to fetch from S3 Origin. Data transfer costs explode; origin throttles!'
      metrics = [
        { label: 'Edge CDN Status', value: 'OFFLINE (Bypassed)', variant: 'danger' },
        { label: 'Origin S3 Egress', value: '500 Gbps Spike', variant: 'danger' },
        { label: 'Egress Cost', value: '$45,000 / hour', variant: 'danger' },
        { label: 'Client Latency', value: '1,200 ms (Buffering risk)', variant: 'warning' },
      ]
    } else {
      activeResolution = '1080p'
      clientBufferSeconds = 28
      subtitle = '3.0s - 6.0s: Global Edge CDN. Open Connect appliances cache 4s video chunks at ISP edge POPs. 98% offload shields origin data centers.'
      metrics = [
        { label: 'Global Egress', value: '50 Tbps Edge Traffic', variant: 'default' },
        { label: 'CDN Cache Hit', value: '98.4% (Open Connect)', variant: 'success' },
        { label: 'Playback Startup', value: '180 ms First Frame', variant: 'success' },
        { label: 'Active Bitrate', value: '5.2 Mbps (1080p)', variant: 'success' },
      ]
    }
  } else if (currentTime < 9.0) {
    if (strategyMode === 'monolithic_mp4') {
      isRebuffering = true
      activeResolution = 'FROZEN'
      clientBufferSeconds = 0
      subtitle = '6.0s - 9.0s: BUFFERING FREEZE! Monolithic 4GB MP4 cannot adapt to elevator bandwidth drop. Playback halts with spinning loader. 42% churn!'
      metrics = [
        { label: 'Network Bandwidth', value: '1.2 Mbps (Elevator Drop)', variant: 'danger' },
        { label: 'Streaming Protocol', value: 'Raw Monolithic MP4', variant: 'danger' },
        { label: 'Player Buffer', value: '0.0s (STALLED)', variant: 'danger' },
        { label: 'User Experience', value: 'Spinning Loader (Freeze)', variant: 'danger' },
      ]
    } else if (strategyMode === 'cdn_outage') {
      isCdnBypassed = true
      isRebuffering = true
      activeResolution = '480p'
      clientBufferSeconds = 2
      subtitle = '6.0s - 9.0s: S3 RATE LIMITING! AWS S3 503 Slow Down errors hit clients. Rebuffering stalls occur globally across 20% of viewers.'
      metrics = [
        { label: 'S3 Origin Status', value: '503 Slow Down Throttling', variant: 'danger' },
        { label: 'Buffer Depletion', value: 'Under 2.0s', variant: 'danger' },
        { label: 'Stall Rate', value: '22% Users Rebuffering', variant: 'danger' },
        { label: 'Mitigation', value: 'Multi-CDN Failover Needed', variant: 'warning' },
      ]
    } else {
      activeResolution = '360p'
      clientBufferSeconds = 16
      subtitle = '6.0s - 9.0s: Network Degradation! Bandwidth drops 50Mbps -> 1Mbps. ABR player automatically steps down from 1080p to 360p. Zero buffer stall!'
      metrics = [
        { label: 'Network Bandwidth', value: '1.2 Mbps (Elevator)', variant: 'warning' },
        { label: 'ABR Decision', value: 'Step Down: 1080p -> 360p', variant: 'success' },
        { label: 'Bitrate Consumed', value: '600 kbps (Safe)', variant: 'success' },
        { label: 'Buffer Health', value: '16.0s (Stall Prevented)', variant: 'success' },
      ]
    }
  } else {
    if (strategyMode === 'monolithic_mp4') {
      isRebuffering = true
      activeResolution = 'FROZEN'
      clientBufferSeconds = 0
      subtitle = '9.0s - 12.0s: Post-Mortem. Single-bitrate MP4 streaming is extinct in modern infrastructure. HLS/DASH dynamic chunking is non-negotiable.'
      metrics = [
        { label: 'Architecture Grade', value: 'FAIL (Monolithic File)', variant: 'danger' },
        { label: 'Stream Completion', value: '14% (Severe Abandonment)', variant: 'danger' },
        { label: 'Required Fix', value: 'Apple HLS / MPEG-DASH', variant: 'warning' },
        { label: 'Standard', value: 'Netflix / YouTube Stack', variant: 'default' },
      ]
    } else {
      activeResolution = '1080p'
      clientBufferSeconds = 26
      subtitle = '9.0s - 12.0s: Bandwidth Recovers! WiFi restored (40 Mbps). Player buffer climbs and steps quality back to 1080p smoothly. 100% uptime!'
      metrics = [
        { label: 'Network Bandwidth', value: '45 Mbps (WiFi Reconnected)', variant: 'success' },
        { label: 'Quality Restored', value: '1080p Full HD (60 FPS)', variant: 'success' },
        { label: 'Stall Count', value: '0 Rebuffers (Flawless)', variant: 'success' },
        { label: 'CDN Offload SLA', value: '98.5% Sustained', variant: 'success' },
      ]
    }
  }

  return (
    <div className="w-full space-y-4">
      <MotionGraphicPlayer
        title="Global Video Streaming & Adaptive Bitrate (Netflix HLS)"
        subtitle="12-Second Slow Walkthrough · Netflix Open Connect CDN, FFmpeg DAG Transcoder & Dynamic ABR Buffer Control"
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
              onClick={() => { setStrategyMode('adaptive_hls'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'adaptive_hls'
                  ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-600/60 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>Adaptive HLS (Smooth)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('monolithic_mp4'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'monolithic_mp4'
                  ? 'bg-rose-950/50 text-rose-300 font-bold border border-rose-600/60 shadow-xs'
                  : 'text-muted hover:text-rose-300'
              }`}
            >
              <Flame size={12} />
              <span>Monolithic MP4 (Freeze)</span>
            </button>
            <button
              type="button"
              onClick={() => { setStrategyMode('cdn_outage'); setCurrentTime(0); setIsPlaying(true) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                strategyMode === 'cdn_outage'
                  ? 'bg-amber-950/50 text-amber-300 font-bold border border-amber-600/60 shadow-xs'
                  : 'text-muted hover:text-amber-300'
              }`}
            >
              <WifiOff size={12} />
              <span>CDN Outage (Origin Spike)</span>
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
          const cdnEmerald = '#10b981'
          const transcodeAmber = '#f59e0b'
          const dangerRed = '#ef4444'
          const playerBlue = '#3b82f6'

          return (
            <div className="relative w-full aspect-[16/10] max-w-[860px] mx-auto py-2">
              <svg viewBox="0 0 880 500" className="w-full h-full transition-all duration-300">
                <defs>
                  <marker id="vid-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={cdnEmerald} />
                  </marker>
                  <marker id="vid-arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={transcodeAmber} />
                  </marker>
                  <filter id="vid-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity={isLight ? '0.1' : '0.4'} floodColor="#000" />
                  </filter>
                </defs>

                {/* ==================== INGESTION & S3 STORAGE (Left) ==================== */}
                <g transform="translate(25, 120)" filter="url(#vid-shadow)">
                  <rect x="0" y="0" width="160" height="260" rx="14" fill={cardBg} stroke={transcodeAmber} strokeWidth="3" />
                  <text x="80" y="28" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Raw Video Ingestion
                  </text>
                  <text x="80" y="44" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    S3 Resumable Upload
                  </text>

                  {/* Multipart Upload Card */}
                  <g transform="translate(12, 58)">
                    <rect x="0" y="0" width="136" height="60" rx="6" fill={isLight ? '#fffbeb' : '#291e0a'} stroke={transcodeAmber} strokeWidth="1" />
                    <text x="10" y="18" fill={transcodeAmber} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      S3 Pre-Signed Chunks
                    </text>
                    <text x="10" y="34" fill={textPrimary} fontSize="9" fontFamily="monospace">
                      5 MB Part 1..800
                    </text>
                    <text x="10" y="48" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      Zero Web Server RAM
                    </text>
                  </g>

                  {/* Origin Storage */}
                  <g transform="translate(12, 130)">
                    <rect
                      x="0"
                      y="0"
                      width="136"
                      height="65"
                      rx="6"
                      fill={isCdnBypassed ? (isLight ? '#fee2e2' : '#450a0a') : (isLight ? '#f8fafc' : '#1e293b')}
                      stroke={isCdnBypassed ? dangerRed : cardBorder}
                      strokeWidth="1.5"
                    />
                    <text x="68" y="18" textAnchor="middle" fill={isCdnBypassed ? dangerRed : textPrimary} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      {isCdnBypassed ? 'ORIGIN SPIKE!' : 'AWS S3 ORIGIN'}
                    </text>
                    <text x="68" y="36" textAnchor="middle" fill={isCdnBypassed ? dangerRed : cdnEmerald} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {isCdnBypassed ? '500 Gbps Overload' : '1.8% Egress Only'}
                    </text>
                    <text x="68" y="52" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      {isCdnBypassed ? '503 SlowDown errors' : 'Shielded by CDN'}
                    </text>
                  </g>

                  <rect x="12" y="206" width="136" height="40" rx="6" fill={isLight ? '#ecfdf5' : '#064e3b'} />
                  <text x="68" y="224" textAnchor="middle" fill={cdnEmerald} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    Keyframe GOP Splitting
                  </text>
                  <text x="68" y="238" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                    Independent Parallel Chunks
                  </text>
                </g>

                {/* ==================== FFmpeg TRANSCODING DAG (Top-Center) ==================== */}
                <g transform="translate(230, 40)" filter="url(#vid-shadow)">
                  <rect x="0" y="0" width="370" height="150" rx="14" fill={cardBg} stroke={transcodeAmber} strokeWidth="3" />
                  <text x="185" y="26" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Parallel FFmpeg Transcoding DAG
                  </text>
                  <text x="185" y="42" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Encodes GOP Chunks into Multi-Bitrate Ladder
                  </text>

                  {/* 4 Resolution Ladder Cards */}
                  <g transform="translate(15, 54)">
                    {[
                      { res: '4K (2160p)', br: '15.0 Mbps', color: '#a855f7' },
                      { res: '1080p FHD', br: '5.2 Mbps', color: cdnEmerald },
                      { res: '720p HD', br: '2.5 Mbps', color: '#3b82f6' },
                      { res: '360p Mobile', br: '600 kbps', color: transcodeAmber },
                    ].map((item, i) => (
                      <g key={i} transform={`translate(${i * 86}, 0)`}>
                        <rect
                          x="0"
                          y="0"
                          width="80"
                          height="75"
                          rx="6"
                          fill={activeResolution.includes(item.res.slice(0, 4)) ? (isLight ? '#ecfdf5' : '#064e3b') : (isLight ? '#f8fafc' : '#1e293b')}
                          stroke={activeResolution.includes(item.res.slice(0, 4)) ? cdnEmerald : cardBorder}
                          strokeWidth={activeResolution.includes(item.res.slice(0, 4)) ? '2' : '1'}
                        />
                        <text x="40" y="22" textAnchor="middle" fill={item.color} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                          {item.res}
                        </text>
                        <text x="40" y="40" textAnchor="middle" fill={textPrimary} fontSize="8" fontWeight="bold" fontFamily="monospace">
                          {item.br}
                        </text>
                        <text x="40" y="58" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="monospace">
                          4s .m4s
                        </text>
                      </g>
                    ))}
                  </g>
                </g>

                {/* ==================== OPEN CONNECT EDGE CDN (Bottom-Center) ==================== */}
                <g transform="translate(230, 230)" filter="url(#vid-shadow)">
                  <rect
                    x="0"
                    y="0"
                    width="370"
                    height="190"
                    rx="14"
                    fill={cardBg}
                    stroke={isCdnBypassed ? dangerRed : cdnEmerald}
                    strokeWidth={isCdnBypassed ? '2.5' : '3'}
                  />
                  <text x="185" y="26" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Global Edge CDN (Netflix Open Connect)
                  </text>
                  <text x="185" y="42" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    ISP Embedded POP Caches · 50 Tbps Egress
                  </text>

                  {/* 4-second Chunks In-Flight */}
                  <g transform="translate(20, 56)">
                    {[1, 2, 3, 4].map((chunkIdx) => (
                      <g key={chunkIdx} transform={`translate(${(chunkIdx - 1) * 82}, 0)`}>
                        <rect x="0" y="0" width="76" height="52" rx="6" fill={isLight ? '#f0fdf4' : '#052e16'} stroke={cdnEmerald} strokeWidth="1.5" />
                        <text x="38" y="22" textAnchor="middle" fill={cdnEmerald} fontSize="9" fontWeight="bold" fontFamily="monospace">
                          Chunk #{chunkIdx}
                        </text>
                        <text x="38" y="38" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="monospace">
                          {activeResolution}
                        </text>
                      </g>
                    ))}
                  </g>

                  {/* CDN Metrics Plaque */}
                  <g transform="translate(20, 120)">
                    <rect x="0" y="0" width="330" height="50" rx="6" fill={isLight ? '#f8fafc' : '#1e293b'} stroke={cardBorder} strokeWidth="1" />
                    <text x="80" y="24" textAnchor="middle" fill={textPrimary} fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                      Cache Offload: 98.4%
                    </text>
                    <text x="80" y="40" textAnchor="middle" fill={cdnEmerald} fontSize="9" fontFamily="monospace">
                      Origin Shield Active
                    </text>
                    <text x="240" y="24" textAnchor="middle" fill={textPrimary} fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                      ISP Edge Latency: 12ms
                    </text>
                    <text x="240" y="40" textAnchor="middle" fill={textSecondary} fontSize="9" fontFamily="monospace">
                      Local Fiber Peering
                    </text>
                  </g>
                </g>

                {/* ==================== CLIENT PLAYER & DYNAMIC ABR (Right) ==================== */}
                <g transform="translate(650, 90)" filter="url(#vid-shadow)">
                  <rect
                    x="0"
                    y="0"
                    width="205"
                    height="330"
                    rx="14"
                    fill={cardBg}
                    stroke={isRebuffering ? dangerRed : playerBlue}
                    strokeWidth="3"
                  />
                  <text x="102" y="26" textAnchor="middle" fill={textPrimary} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Client ABR Player
                  </text>
                  <text x="102" y="42" textAnchor="middle" fill={textSecondary} fontSize="10" fontFamily="monospace">
                    Buffer-Based Adaptation
                  </text>

                  {/* Video Screen Simulation */}
                  <g transform="translate(15, 54)">
                    <rect
                      x="0"
                      y="0"
                      width="175"
                      height="95"
                      rx="8"
                      fill={isRebuffering ? (isLight ? '#fee2e2' : '#450a0a') : '#0f172a'}
                      stroke={isRebuffering ? dangerRed : '#334155'}
                      strokeWidth="2"
                    />
                    <text x="87" y="38" textAnchor="middle" fill={isRebuffering ? dangerRed : '#ffffff'} fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                      {isRebuffering ? 'SPINNING BUFFER...' : `PLAYING: ${activeResolution}`}
                    </text>
                    <text x="87" y="58" textAnchor="middle" fill={isRebuffering ? dangerRed : cdnEmerald} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {isRebuffering ? 'Playback Stalled' : 'Smooth 60 FPS'}
                    </text>
                    <text x="87" y="78" textAnchor="middle" fill={textSecondary} fontSize="8" fontFamily="monospace">
                      manifest: playlist.m3u8
                    </text>
                  </g>

                  {/* Buffer Gauge Bar */}
                  <g transform="translate(15, 160)">
                    <text x="0" y="14" fill={textPrimary} fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                      Forward Buffer Health
                    </text>
                    <text x="175" y="14" textAnchor="end" fill={clientBufferSeconds > 10 ? cdnEmerald : dangerRed} fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {clientBufferSeconds}s
                    </text>
                    <rect x="0" y="22" width="175" height="12" rx="6" fill={isLight ? '#e2e8f0' : '#1e293b'} />
                    <rect
                      x="0"
                      y="22"
                      width={Math.min(175, Math.max(0, (clientBufferSeconds / 30) * 175))}
                      height="12"
                      rx="6"
                      fill={clientBufferSeconds > 10 ? cdnEmerald : dangerRed}
                      className="transition-all duration-300"
                    />
                  </g>

                  {/* Bandwidth Monitor */}
                  <g transform="translate(15, 215)">
                    <rect x="0" y="0" width="175" height="52" rx="6" fill={isLight ? '#f8fafc' : '#1e293b'} stroke={cardBorder} strokeWidth="1" />
                    <text x="12" y="20" fill={textSecondary} fontSize="8" fontFamily="sans-serif">
                      Current Mobile Throughput
                    </text>
                    <text x="12" y="38" fill={activeResolution === '360p' ? transcodeAmber : cdnEmerald} fontSize="11" fontWeight="bold" fontFamily="monospace">
                      {activeResolution === '360p' ? '1.2 Mbps (Elevator)' : '45.0 Mbps (WiFi)'}
                    </text>
                  </g>

                  <rect x="15" y="280" width="175" height="36" rx="6" fill={isLight ? '#f0fdf4' : '#052e16'} />
                  <text x="87" y="298" textAnchor="middle" fill={cdnEmerald} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    ABR State: Optimized
                  </text>
                  <text x="87" y="310" textAnchor="middle" fill={textSecondary} fontSize="7" fontFamily="sans-serif">
                    Zero Rebuffering Guaranteed
                  </text>
                </g>

                {/* OVERLAY WARNING: MONOLITHIC MP4 FREEZE */}
                {isRebuffering && (
                  <g transform="translate(230, 435)">
                    <rect x="0" y="0" width="420" height="52" rx="10" fill={isLight ? '#fef2f2' : '#450a0a'} stroke={dangerRed} strokeWidth="2.5" />
                    <text x="210" y="22" textAnchor="middle" fill={dangerRed} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                      🚨 BUFFER STALL: Monolithic MP4 Cannot Adapt
                    </text>
                    <text x="210" y="38" textAnchor="middle" fill={isLight ? '#991b1b' : '#fca5a5'} fontSize="10" fontFamily="monospace">
                      Network dropped below file bitrate. Playback frozen! 42% viewer churn.
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