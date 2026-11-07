import { type ReactNode } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Sparkles,
} from 'lucide-react'

export interface MotionGraphicPlayerProps {
  title: string
  subtitle?: string
  durationSec: number
  currentTime: number
  isPlaying: boolean
  speed: number // 0.25 | 0.5 | 1 | 2
  onPlayPause: () => void
  onReplay: () => void
  onSeek: (timeSec: number) => void
  onSpeedChange: (speed: number) => void
  activeSubtitle: string
  metrics?: { label: string; value: string; variant?: 'default' | 'success' | 'warning' | 'danger' }[]
  toolbarExtra?: ReactNode
  children: ReactNode
}

export default function MotionGraphicPlayer({
  title,
  subtitle,
  durationSec,
  currentTime,
  isPlaying,
  speed,
  onPlayPause,
  onReplay,
  onSeek,
  onSpeedChange,
  activeSubtitle,
  metrics = [],
  toolbarExtra,
  children,
}: MotionGraphicPlayerProps) {
  const scrubberProgressPct = Math.min(100, Math.max(0, (currentTime / durationSec) * 100))

  return (
    <div className="flex flex-col w-full rounded-xl border border-line bg-panel-2/90 shadow-2xl overflow-hidden select-none">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-line bg-panel/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand/20 text-brand-light font-mono text-xs font-bold shrink-0">
            <Sparkles size={13} />
          </span>
          <div className="min-w-0">
            <h3 className="font-plate text-xs sm:text-sm font-semibold text-chalk truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-muted truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Custom levers (e.g. Lock Ordering toggle) */}
        {toolbarExtra && (
          <div className="flex items-center gap-2">
            {toolbarExtra}
          </div>
        )}
      </div>

      {/* 2. Visual Animation Stage / Canvas Container */}
      <div className="relative w-full min-h-[300px] sm:min-h-[360px] bg-void/90 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, var(--color-chalk, #fff) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Live Metrics Overlay (top right of stage) */}
        {metrics.length > 0 && (
          <div className="absolute top-3 right-3 flex flex-wrap items-center gap-1.5 z-10">
            {metrics.map((m, idx) => {
              const variantClasses =
                m.variant === 'danger'
                  ? 'bg-red-950/60 text-red-400 border-red-800/50'
                  : m.variant === 'warning'
                  ? 'bg-amber-950/60 text-amber-400 border-amber-800/50'
                  : m.variant === 'success'
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
                  : 'bg-panel-3/70 text-chalk border-line'

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono backdrop-blur-md shadow-xs ${variantClasses}`}
                >
                  <span className="text-muted text-[10px] uppercase font-sans font-medium">{m.label}:</span>
                  <span className="font-bold">{m.value}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* The Animated SVG Scene */}
        <div className="relative z-0 w-full max-w-3xl flex items-center justify-center">
          {children}
        </div>
      </div>

      {/* 3. Dynamic Narrative Subtitle Ribbon */}
      <div className="px-4 py-2.5 border-t border-line bg-panel/90 flex items-start sm:items-center gap-2.5 text-xs text-chalk leading-relaxed min-h-[44px]">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/20 text-brand-light shrink-0 mt-0.5 sm:mt-0 font-mono text-[10px] font-bold">
          {Math.floor(currentTime)}s
        </span>
        <p className="flex-1 text-[13px] text-chalk font-medium tracking-wide transition-all duration-200">
          {activeSubtitle}
        </p>
      </div>

      {/* 4. Controls & Scrubber Footer */}
      <div className="px-4 py-3 border-t border-line bg-panel-2 flex flex-col gap-2.5">
        {/* Timeline Scrubber Bar */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-muted w-10 text-right shrink-0">
            {currentTime.toFixed(1)}s
          </span>

          <div className="relative flex-1 flex items-center group cursor-pointer">
            <input
              type="range"
              min={0}
              max={durationSec}
              step={0.05}
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              aria-label="Animation timeline scrubber"
              className="w-full h-2 rounded-lg appearance-none bg-panel border border-line cursor-pointer accent-brand transition-all hover:h-2.5 focus:outline-none"
              style={{
                background: `linear-gradient(to right, var(--color-brand, #8b5cf6) 0%, var(--color-brand, #8b5cf6) ${scrubberProgressPct}%, var(--color-panel, #12161f) ${scrubberProgressPct}%, var(--color-panel, #12161f) 100%)`,
              }}
            />
          </div>

          <span className="font-mono text-[11px] text-muted w-10 text-left shrink-0">
            {durationSec.toFixed(1)}s
          </span>
        </div>

        {/* Buttons Toolbar */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5">
            {/* Play / Pause Button */}
            <button
              type="button"
              onClick={onPlayPause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:brightness-110 active:scale-95 transition-all shadow-sm"
              title={isPlaying ? 'Pause animation (Space)' : 'Play animation (Space)'}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            {/* Replay Button */}
            <button
              type="button"
              onClick={onReplay}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-line bg-panel hover:bg-panel-3 text-muted hover:text-chalk text-xs font-medium transition-colors"
              title="Restart from 0.0s"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Replay</span>
            </button>
          </div>

          {/* Speed Selector (0.25x, 0.5x, 1x) */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-muted hidden sm:inline flex items-center gap-1">
              <Gauge size={12} /> Speed:
            </span>
            <div className="inline-flex rounded-lg border border-line bg-panel p-0.5 text-[11px] font-mono">
              {[0.25, 0.5, 1.0].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSpeedChange(s)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    speed === s
                      ? 'bg-panel-3 text-brand-light font-bold shadow-xs'
                      : 'text-muted hover:text-chalk'
                  }`}
                  title={
                    s === 0.25
                      ? '0.25x (Super Slow for deep inspection)'
                      : s === 0.5
                      ? '0.5x (Recommended Slow Walkthrough)'
                      : '1.0x (Normal Speed)'
                  }
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
