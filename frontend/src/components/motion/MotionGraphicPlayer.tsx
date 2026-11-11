import { useState, useEffect, type ReactNode } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Monitor,
  Tv,
  Keyboard,
  Activity,
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
  const [isTheaterMode, setIsTheaterMode] = useState(false)
  const [showKeyboardHints, setShowKeyboardHints] = useState(false)

  const scrubberProgressPct = Math.min(100, Math.max(0, (currentTime / durationSec) * 100))

  // Pro Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in inputs or code editors
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

      if (e.code === 'Space') {
        e.preventDefault()
        onPlayPause()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        onSeek(Math.max(0, currentTime - (e.shiftKey ? 2.5 : 1.0)))
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        onSeek(Math.min(durationSec, currentTime + (e.shiftKey ? 2.5 : 1.0)))
      } else if (e.code === 'KeyR') {
        e.preventDefault()
        onReplay()
      } else if (e.code === 'KeyF') {
        e.preventDefault()
        setIsFullscreen((prev) => !prev)
      } else if (e.code === 'KeyT') {
        e.preventDefault()
        setIsTheaterMode((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentTime, durationSec, onPlayPause, onReplay, onSeek])

  return (
    <div
      className={`flex flex-col w-full rounded-xl border transition-colors duration-200 select-none overflow-hidden ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-void/95 backdrop-blur-xl p-3 sm:p-6 rounded-none flex flex-col justify-between'
          : isTheaterMode
          ? 'relative w-full max-w-none border-cyan/40 bg-panel-2 shadow-xl'
          : 'relative border-line bg-panel-2 w-full max-w-7xl mx-auto shadow-lg'
      }`}
    >
      {/* 1. Top Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-line bg-panel">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan/15 text-cyan border border-cyan/25 shrink-0">
            <Tv size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-sans text-sm sm:text-base font-bold text-chalk truncate">
                {title}
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-mono font-semibold bg-cyan/15 text-cyan border border-cyan/25">
                60 FPS Studio
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

          {/* Keyboard Shortcuts Hint Button */}
          <button
            type="button"
            onClick={() => setShowKeyboardHints((h) => !h)}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--study-accent)] ${
              showKeyboardHints
                ? 'bg-cyan/15 border-cyan/40 text-cyan'
                : 'bg-panel-3 border-line text-muted hover:text-chalk'
            }`}
            title="Toggle Keyboard Shortcuts Cheat Sheet"
          >
            <Keyboard size={13} />
            <span className="text-2xs font-mono">Shortcuts</span>
          </button>

          {/* Theater Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsTheaterMode((t) => !t)}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--study-accent)] ${
              isTheaterMode
                ? 'bg-cyan/15 border-cyan/40 text-cyan'
                : 'bg-panel-3 border-line text-muted hover:text-chalk'
            }`}
            title={isTheaterMode ? 'Exit Theater Mode (Press T)' : 'Enter Theater Mode (Press T)'}
          >
            <Monitor size={13} />
            <span className="text-2xs font-mono">
              {isTheaterMode ? 'Standard' : 'Theater'}
            </span>
          </button>

          {/* Canvas Theme Toggle (Studio Light vs Studio Dark) */}
          <button
            type="button"
            onClick={() => setCanvasTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              canvasTheme === 'light'
                ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs'
                : 'bg-panel-3 border-line text-muted hover:text-chalk'
            }`}
            title={`Switch to ${canvasTheme === 'dark' ? 'Studio Clean Light Canvas' : 'Studio Dark Canvas'}`}
          >
            {canvasTheme === 'dark' ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} className="text-cyan" />}
            <span className="text-2xs font-mono hidden md:inline">
              {canvasTheme === 'dark' ? 'Clean Light' : 'Dark Studio'}
            </span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-line bg-panel-3 hover:bg-panel text-muted hover:text-chalk transition-colors"
            title={isFullscreen ? 'Exit Fullscreen (Press F or Esc)' : 'Expand to Fullscreen (Press F)'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Helper Pill Banner (When Toggled) */}
      {showKeyboardHints && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2 bg-cyan/10 border-b border-cyan/25 text-xs text-cyan">
          <div className="flex items-center gap-2">
            <Keyboard size={13} />
            <span className="font-semibold font-sans">Pro Keyboard Controls:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 font-mono text-2xs">
            <span><kbd className="px-1.5 py-0.5 rounded bg-panel-3 border border-line">Space</kbd> Play/Pause</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-panel-3 border border-line">← / →</kbd> ±1s Seek</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-panel-3 border border-line">Shift + ← / →</kbd> ±2.5s Seek</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-panel-3 border border-line">R</kbd> Replay</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-panel-3 border border-line">T</kbd> Theater Mode</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-panel-3 border border-line">F</kbd> Fullscreen</span>
          </div>
        </div>
      )}

      {/* 2. Dedicated Telemetry HUD Strip (Shadcn Badge Ribbon - Zero Overlap) */}
      {metrics.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-5 py-2.5 border-b border-line/60 bg-panel/75 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Activity size={13} className="text-cyan" />
            <span className="text-2xs font-mono font-bold uppercase tracking-wider text-muted">
              Live Architecture Telemetry
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {metrics.map((m, idx) => {
              const darkVariantClasses =
                m.variant === 'danger'
                  ? 'bg-red-950/80 text-red-300 border-red-700/60 shadow-xs'
                  : m.variant === 'warning'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-700/60 shadow-xs'
                  : m.variant === 'success'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 shadow-xs'
                  : 'bg-panel-2/80 text-chalk border-line-strong'

              const lightVariantClasses =
                m.variant === 'danger'
                  ? 'bg-red-50 text-red-700 border-red-300 shadow-xs'
                  : m.variant === 'warning'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs'
                  : m.variant === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                  : 'bg-white/90 text-slate-800 border-slate-300 shadow-xs'

              const classes = canvasTheme === 'light' ? lightVariantClasses : darkVariantClasses

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono transition-colors duration-200 ${classes}`}
                >
                  <span className="text-2xs font-sans font-semibold tracking-wider uppercase opacity-70">
                    {m.label}:
                  </span>
                  <span className="font-bold text-xs">{m.value}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. Visual Animation Stage / Canvas Container */}
      <div
        className={`relative w-full flex items-center justify-center p-3 sm:p-6 md:p-8 transition-colors duration-300 overflow-hidden ${
          isFullscreen
            ? 'flex-1 min-h-[500px] h-full'
            : isTheaterMode
            ? 'min-h-[560px] sm:min-h-[640px] md:min-h-[720px]'
            : 'min-h-[480px] sm:min-h-[540px] md:min-h-[600px]'
        } ${
          canvasTheme === 'light'
            ? 'bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] text-slate-900'
            : 'bg-gradient-to-b from-[#08090A] via-[#111413] to-[#08090A] text-chalk'
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

        {/* The Animated SVG/Canvas Scene Passed in Children - Unlocked Fluid Width! */}
        <div
          className={`relative z-0 w-full flex items-center justify-center ${
            isFullscreen
              ? 'max-w-[95vw] max-h-[82vh]'
              : isTheaterMode
              ? 'max-w-7xl'
              : 'max-w-6xl'
          } transition-[max-width] duration-300`}
        >
          {children(canvasTheme)}
        </div>
      </div>

      {/* 4. Dynamic Narrative Subtitle Ribbon */}
      <div
        className={`px-6 py-3.5 border-t border-line flex items-center gap-3 transition-colors duration-200 ${
          canvasTheme === 'light' ? 'bg-white text-slate-800' : 'bg-panel text-chalk'
        }`}
      >
        <span className="flex h-6 min-w-6 px-1.5 items-center justify-center rounded-md bg-action text-[var(--study-on-accent)] shrink-0 font-mono text-2xs font-bold">
          {Math.floor(currentTime)}s
        </span>
        <p className="flex-1 text-sm sm:text-base font-medium tracking-normal leading-relaxed">
          {activeSubtitle}
        </p>
      </div>

      {/* 5. Controls & Scrubber Footer */}
      <div className="px-5 py-3.5 border-t border-line bg-panel-2 flex flex-col gap-3">
        {/* Timeline Act Quick-Jump Milestones */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-2xs font-mono text-muted select-none">
          <button
            type="button"
            onClick={() => onSeek(0)}
            className="hover:text-cyan transition-colors flex items-center gap-1.5 min-h-[36px] sm:min-h-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--study-accent)] rounded"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" aria-hidden="true" />
            <span>Act 1: Ingress (0s)</span>
          </button>
          <button
            type="button"
            onClick={() => onSeek(durationSec * 0.25)}
            className="hover:text-cyan transition-colors flex items-center gap-1.5 min-h-[36px] sm:min-h-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--study-accent)] rounded"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" aria-hidden="true" />
            <span>Act 2: Traversal (3s)</span>
          </button>
          <button
            type="button"
            onClick={() => onSeek(durationSec * 0.5)}
            className="hover:text-cyan transition-colors flex items-center gap-1.5 min-h-[36px] sm:min-h-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--study-accent)] rounded"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" aria-hidden="true" />
            <span>Act 3: Divergence (6s)</span>
          </button>
          <button
            type="button"
            onClick={() => onSeek(durationSec * 0.75)}
            className="hover:text-cyan transition-colors flex items-center gap-1.5 min-h-[36px] sm:min-h-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--study-accent)] rounded"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" aria-hidden="true" />
            <span>Act 4: Resolution (9s)</span>
          </button>
        </div>

        {/* Timeline Scrubber Bar */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-semibold text-muted w-11 text-right shrink-0">
            {currentTime.toFixed(1)}s
          </span>

          <div className="relative flex-1 flex items-center cursor-pointer py-2">
            <input
              type="range"
              min={0}
              max={durationSec}
              step={0.05}
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              aria-label="Animation timeline scrubber"
              className="w-full h-2.5 rounded-full appearance-none bg-panel border border-line cursor-pointer accent-[var(--study-accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--study-accent)]"
              style={{
                background: `linear-gradient(to right, var(--study-accent, #00F59B) 0%, var(--study-accent, #00F59B) ${scrubberProgressPct}%, var(--line, rgba(255, 255, 255, 0.08)) ${scrubberProgressPct}%, var(--line, rgba(255, 255, 255, 0.08)) 100%)`,
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
              className="flex items-center gap-2 min-h-[44px] sm:min-h-[36px] px-4 py-2 rounded-lg bg-action text-[var(--study-on-accent)] text-xs font-bold hover:brightness-110 active:scale-[0.985] transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--study-accent)]"
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
              title="Restart from 0.0s (Press R)"
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
            <div className="inline-flex rounded-lg border border-line bg-panel p-1 gap-0.5 text-xs font-mono">
              {[0.25, 0.5, 1.0].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSpeedChange(s)}
                  className={`min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[36px] inline-flex items-center justify-center px-2.5 py-1 rounded font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--study-accent)] ${
                    speed === s
                      ? 'bg-action text-[var(--study-on-accent)]'
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
