import { useState, type ReactNode } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Sparkles,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Tv,
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
  children: (theme: 'dark' | 'light') => ReactNode
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
  const [canvasTheme, setCanvasTheme] = useState<'dark' | 'light'>('dark')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const scrubberProgressPct = Math.min(100, Math.max(0, (currentTime / durationSec) * 100))

  return (
    <div
      className={`flex flex-col w-full rounded-2xl border transition-all duration-300 shadow-2xl select-none overflow-hidden ${
        isFullscreen
          ? 'fixed inset-4 z-50 bg-panel border-line-strong'
          : 'relative border-line bg-panel-2'
      }`}
    >
      {/* 1. Top Header Toolbar (Shadcn Studio Header) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-line bg-panel/90 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-brand border border-brand/25 shrink-0 shadow-xs">
            <Tv size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-sans text-sm sm:text-base font-bold text-chalk truncate">
                {title}
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-brand/15 text-brand-light border border-brand/20">
                <Sparkles size={10} /> 60 FPS Studio
              </span>
            </div>
            {subtitle && (
              <p className="text-xs text-muted truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Action Tools: Levers, Canvas Theme Switcher & Fullscreen */}
        <div className="flex items-center gap-2">
          {toolbarExtra}

          {/* Canvas Theme Toggle (Studio Light vs Studio Dark) */}
          <button
            type="button"
            onClick={() => setCanvasTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              canvasTheme === 'light'
                ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs'
                : 'bg-panel-3 border-line text-muted hover:text-chalk'
            }`}
            title={`Switch to ${canvasTheme === 'dark' ? 'Studio Clean Light Canvas' : 'Studio Dark Canvas'}`}
          >
            {canvasTheme === 'dark' ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} className="text-indigo-600" />}
            <span className="text-[11px] font-mono hidden md:inline">
              {canvasTheme === 'dark' ? 'Clean Light' : 'Dark Studio'}
            </span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-line bg-panel-3 hover:bg-panel text-muted hover:text-chalk transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand to Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* 2. Visual Animation Stage / Canvas Container */}
      <div
        className={`relative w-full flex items-center justify-center p-4 sm:p-8 transition-colors duration-300 overflow-hidden ${
          isFullscreen
            ? 'flex-1 min-h-[500px]'
            : 'min-h-[460px] sm:min-h-[520px] md:min-h-[560px]'
        } ${
          canvasTheme === 'light'
            ? 'bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] text-slate-900'
            : 'bg-gradient-to-b from-[#090d16] via-[#0d121f] to-[#070a10] text-chalk'
        }`}
      >
        {/* Subtle grid pattern background */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
            canvasTheme === 'light' ? 'opacity-[0.08]' : 'opacity-[0.05]'
          }`}
          style={{
            backgroundImage:
              canvasTheme === 'light'
                ? 'radial-gradient(circle at 1px 1px, #334155 1.2px, transparent 0)'
                : 'radial-gradient(circle at 1px 1px, #f8fafc 1.2px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Live Metrics Overlay (top right of stage) */}
        {metrics.length > 0 && (
          <div className="absolute top-4 right-4 flex flex-wrap items-center gap-2 z-10">
            {metrics.map((m, idx) => {
              const darkVariantClasses =
                m.variant === 'danger'
                  ? 'bg-red-950/80 text-red-300 border-red-700/60 shadow-lg shadow-red-950/50'
                  : m.variant === 'warning'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-700/60 shadow-lg shadow-amber-950/50'
                  : m.variant === 'success'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 shadow-lg shadow-emerald-950/50'
                  : 'bg-panel-2/80 text-chalk border-line-strong backdrop-blur-md'

              const lightVariantClasses =
                m.variant === 'danger'
                  ? 'bg-red-50 text-red-700 border-red-300 shadow-sm'
                  : m.variant === 'warning'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm'
                  : m.variant === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
                  : 'bg-white/90 text-slate-800 border-slate-300 shadow-sm'

              const classes = canvasTheme === 'light' ? lightVariantClasses : darkVariantClasses

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-200 ${classes}`}
                >
                  <span className="text-[10px] font-sans font-semibold tracking-wider uppercase opacity-70">
                    {m.label}:
                  </span>
                  <span className="font-bold text-xs">{m.value}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* The Animated SVG/Canvas Scene Passed in Children */}
        <div className="relative z-0 w-full max-w-4xl flex items-center justify-center">
          {children(canvasTheme)}
        </div>
      </div>

      {/* 3. Dynamic Narrative Subtitle Ribbon */}
      <div
        className={`px-6 py-3.5 border-t border-line flex items-center gap-3 transition-colors duration-200 ${
          canvasTheme === 'light' ? 'bg-white text-slate-800' : 'bg-panel text-chalk'
        }`}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand text-white shrink-0 font-mono text-xs font-bold shadow-xs">
          {Math.floor(currentTime)}s
        </span>
        <p className="flex-1 text-sm sm:text-base font-medium tracking-normal leading-relaxed">
          {activeSubtitle}
        </p>
      </div>

      {/* 4. Controls & Scrubber Footer */}
      <div className="px-5 py-3.5 border-t border-line bg-panel-2/95 flex flex-col gap-3">
        {/* Timeline Scrubber Bar */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-semibold text-muted w-11 text-right shrink-0">
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
              className="w-full h-2.5 rounded-full appearance-none bg-panel border border-line cursor-pointer accent-brand transition-all hover:h-3 focus:outline-none"
              style={{
                background: `linear-gradient(to right, var(--color-brand, #8b5cf6) 0%, var(--color-brand, #8b5cf6) ${scrubberProgressPct}%, var(--color-line, #334155) ${scrubberProgressPct}%, var(--color-line, #334155) 100%)`,
              }}
            />
          </div>

          <span className="font-mono text-xs font-semibold text-muted w-11 text-left shrink-0">
            {durationSec.toFixed(1)}s
          </span>
        </div>

        {/* Buttons Toolbar */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            {/* Play / Pause Button */}
            <button
              type="button"
              onClick={onPlayPause}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md shadow-brand/20"
              title={isPlaying ? 'Pause animation (Space)' : 'Play animation (Space)'}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            {/* Replay Button */}
            <button
              type="button"
              onClick={onReplay}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line bg-panel-3 hover:bg-panel text-muted hover:text-chalk text-xs font-medium transition-colors"
              title="Restart from 0.0s"
            >
              <RotateCcw size={13} />
              <span>Replay</span>
            </button>
          </div>

          {/* Speed Selector (0.25x, 0.5x, 1x) */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-xs text-muted hidden sm:flex items-center gap-1">
              <Gauge size={13} /> Speed:
            </span>
            <div className="inline-flex rounded-lg border border-line bg-panel p-0.5 text-xs font-mono">
              {[0.25, 0.5, 1.0].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSpeedChange(s)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    speed === s
                      ? 'bg-brand text-white shadow-xs'
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
