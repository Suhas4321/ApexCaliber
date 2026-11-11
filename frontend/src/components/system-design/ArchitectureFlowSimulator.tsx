import { ArrowRight, CheckCircle2, Flame, Pause, Play, RotateCcw, Sparkles, StepForward, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export interface ArchitectureNode {
  id: string
  label: string
  metric: string
  role: string
}

interface Props {
  systemTitle: string
  nodes: ArchitectureNode[]
  peakRps: string
  latencySla: string
  activeHop: number
  onHopChange: (hop: number) => void
}

type SimulationMode = 'normal' | 'spike' | 'cache_hit'

export default function ArchitectureFlowSimulator({
  systemTitle,
  nodes,
  peakRps,
  latencySla,
  activeHop,
  onHopChange,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<1 | 2 | 4>(1)
  const [mode, setMode] = useState<SimulationMode>('normal')
  const [packetProgress, setPacketProgress] = useState(0)
  const [packetStatus, setPacketStatus] = useState<string>('Ready to dispatch')
  const [accumulatedMs, setAccumulatedMs] = useState(0)

  const animRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  useEffect(() => {
    setIsPlaying(false)
    setPacketProgress(0)
    setAccumulatedMs(0)
    setPacketStatus('Ready to dispatch')
    onHopChange(0)
  }, [systemTitle])

  const getDeterministicLatency = (hop: number, simMode: typeof mode) => {
    if (simMode === 'spike') return [24, 1, 38, 42][hop % 4]
    if (simMode === 'cache_hit') return [8, 10, 2, 6][hop % 4]
    return [12, 16, 14, 18][hop % 4]
  }

  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null
      return
    }

    const durationPerHop = mode === 'spike' ? 600 / speed : 1100 / speed
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const advanceHop = () => {
      const nextHop = (activeHop + 1) % nodes.length
      onHopChange(nextHop)

      const hopLatency = getDeterministicLatency(activeHop, mode)
      setAccumulatedMs((m) => m + hopLatency)

      const currentNode = nodes[activeHop]
      let statusText = `Passed ${currentNode.label.split(' ')[0]} (+${hopLatency}ms)`
      if (mode === 'spike' && activeHop === 1) {
        statusText = 'Token Bucket 429 Shedding 20% Surge (+1ms)'
      } else if (mode === 'cache_hit' && activeHop === 2) {
        statusText = '100% SHA256 Cache Hit (Short-Circuit in 2ms)'
      }
      setPacketStatus(statusText)
    }

    if (reducedMotion) {
      const timer = window.setTimeout(() => {
        advanceHop()
        setPacketProgress(0)
      }, durationPerHop)
      return () => window.clearTimeout(timer)
    }

    const tick = (time: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = time
      const delta = time - lastTimeRef.current

      setPacketProgress((prev) => {
        const next = prev + delta / durationPerHop
        if (next >= 1) {
          lastTimeRef.current = time
          advanceHop()
          return 0
        }
        return next
      })

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [isPlaying, activeHop, nodes, speed, mode, onHopChange])

  const stepForward = () => {
    const nextHop = (activeHop + 1) % nodes.length
    onHopChange(nextHop)
    const hopLatency = getDeterministicLatency(activeHop, mode)
    setAccumulatedMs((m) => m + hopLatency)
    setPacketStatus(`Step: ${nodes[activeHop].label} (+${hopLatency}ms)`)
  }

  const resetSim = () => {
    setIsPlaying(false)
    setPacketProgress(0)
    setAccumulatedMs(0)
    setPacketStatus('Reset to trailhead')
    onHopChange(0)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-panel p-4 space-y-4 shadow-sm">
        {/* Header & Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber font-mono text-xs font-bold">
              <Zap size={14} />
            </span>
            <div>
              <h3 className="font-plate text-sm font-bold text-chalk">
                Interactive Architecture Simulation
              </h3>
              <p className="text-2xs text-muted">
                Simulate end-to-end request packet travel, inspect latency per hop, or inject chaos failure modes.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-panel-2 p-1 text-2xs font-mono">
            <button
              type="button"
              onClick={() => { setMode('normal'); resetSim() }}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition-colors ${
                mode === 'normal' ? 'bg-panel text-emerald shadow-xs border border-line' : 'text-muted hover:text-chalk'
              }`}
            >
              <CheckCircle2 size={11} />
              <span>Normal Flow</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('spike'); resetSim() }}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition-colors ${
                mode === 'spike' ? 'bg-amber/20 text-amber shadow-xs border border-amber/40' : 'text-muted hover:text-amber'
              }`}
            >
              <Flame size={11} />
              <span>10x Spike Surge</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('cache_hit'); resetSim() }}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition-colors ${
                mode === 'cache_hit' ? 'bg-cyan/20 text-cyan shadow-xs border border-cyan/40' : 'text-muted hover:text-cyan'
              }`}
            >
              <Sparkles size={11} />
              <span>Cache Hit</span>
            </button>
          </div>
        </div>

        {/* Live Architecture Canvas */}
        <div className="relative overflow-hidden rounded-lg border border-line bg-panel-2/60 p-4 min-h-[200px] flex flex-col justify-between select-none">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-2xs border-b border-line pb-2.5">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="h-2 w-2 rounded-full bg-emerald" aria-hidden="true" />
              <span>Status:</span>
              <strong className="text-chalk font-semibold">{packetStatus}</strong>
            </span>
            <div className="flex items-center gap-4 text-muted">
              <span>Latency: <strong className="text-amber font-semibold">{accumulatedMs}ms</strong> / {latencySla}</span>
              <span>Load: <strong className="text-chalk">{mode === 'spike' ? '10,000 RPS' : peakRps}</strong></span>
              <span>Hop: <strong className="text-chalk font-bold">0{activeHop + 1} / 0{nodes.length}</strong></span>
            </div>
          </div>

          {/* Node Flow Diagram */}
          <div className="py-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 px-1 relative">
              {nodes.map((node, idx) => {
                const isActive = activeHop === idx
                const isPassed = activeHop > idx

                return (
                  <div key={node.id} className="flex items-center flex-1 last:flex-initial gap-2">
                    <button
                      type="button"
                      onClick={() => onHopChange(idx)}
                      className={`group relative flex flex-col items-start rounded-lg border p-3 text-left transition-colors duration-200 w-full md:w-auto md:flex-1 md:min-w-0 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--study-accent)] ${
                        isActive
                          ? 'border-amber bg-amber/15 z-10'
                          : isPassed
                          ? 'border-emerald/40 bg-emerald/5 hover:border-emerald/60'
                          : 'border-line bg-panel hover:border-line-strong hover:bg-panel-2'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute top-2.5 right-2.5 flex h-2 w-2 rounded-full bg-amber" aria-hidden="true" />
                      )}
                      <div className="flex items-center justify-between w-full font-mono text-2xs text-faint mb-1">
                        <span className="font-bold">0{idx + 1}</span>
                        <span className={`px-1.5 py-0.5 rounded text-2xs font-semibold ${
                          isActive ? 'bg-amber text-void' : isPassed ? 'text-emerald' : 'text-muted'
                        }`}>
                          {node.metric}
                        </span>
                      </div>
                      <div className="font-plate text-xs font-bold text-chalk leading-snug line-clamp-2">
                        {node.label}
                      </div>
                    </button>

                    {idx < nodes.length - 1 && (
                      <>
                        {/* Desktop horizontal connector */}
                        <div className="hidden md:flex relative items-center justify-center w-8 h-6 shrink-0">
                          <div className="h-0.5 w-full bg-line" />
                          <ArrowRight size={12} className={`relative z-10 text-muted ${isActive ? 'text-amber' : ''}`} />
                          {isActive && isPlaying && (
                            <div
                              className="pointer-events-none absolute inset-x-1 inset-y-0"
                              style={{ transform: `translate3d(${packetProgress * 100}%, 0, 0)` }}
                            >
                              <span className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-amber ring-2 ring-panel" />
                            </div>
                          )}
                        </div>

                        {/* Mobile stacked vertical connector */}
                        <div className="flex md:hidden relative items-center justify-center h-6 w-full shrink-0">
                          <div className="w-0.5 h-full bg-line" />
                          <ArrowRight size={12} className={`relative z-10 rotate-90 text-muted ${isActive ? 'text-amber' : ''}`} />
                          {isActive && isPlaying && (
                            <div
                              className="pointer-events-none absolute inset-x-0 inset-y-1"
                              style={{ transform: `translate3d(0, ${packetProgress * 100}%, 0)` }}
                            >
                              <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-amber ring-2 ring-panel" />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Active Node Detail */}
          <div className="rounded-lg border border-line bg-panel p-3.5 space-y-1 text-xs">
            <div className="flex items-center justify-between font-mono text-2xs">
              <span className="text-amber font-semibold uppercase tracking-wider">
                Hop 0{activeHop + 1}: {nodes[activeHop]?.label}
              </span>
              <span className="text-muted">Target SLA: <strong className="text-chalk">{nodes[activeHop]?.metric}</strong></span>
            </div>
            <p className="text-muted leading-relaxed">{nodes[activeHop]?.role}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-md bg-chalk px-3.5 py-1.5 font-semibold text-void hover:opacity-90 active:scale-[0.985] transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--study-accent)]"
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>{isPlaying ? 'Pause' : 'Play Simulation'}</span>
            </button>
            <button
              type="button"
              onClick={stepForward}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-panel px-2.5 py-1.5 text-muted hover:text-chalk hover:bg-panel-2 transition-colors"
            >
              <StepForward size={13} />
              <span>Step</span>
            </button>
            <button
              type="button"
              onClick={resetSim}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-panel px-2.5 py-1.5 text-muted hover:text-chalk hover:bg-panel-2 transition-colors"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-2xs">
            <span className="text-muted">Speed:</span>
            {([1, 2, 4] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[36px] inline-flex items-center justify-center px-2 py-0.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--study-accent)] ${
                  speed === s ? 'bg-amber text-void font-bold' : 'border border-line bg-panel text-muted hover:text-chalk'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
