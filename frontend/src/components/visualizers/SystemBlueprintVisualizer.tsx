import { useState } from 'react'
import { Activity, ArrowRight, Box, Dna, Network, Sparkles } from 'lucide-react'
import type { TraceFrame, TraceStep } from '../../api/types'
import { formatValue, visibleLocals } from '../../lib/trace'
import type { VisualizerProps } from './types'
import { SidePanels } from './parts'

interface BlueprintNode {
  name: string
  role: string
  color: string
}

const RAG_STEPS: BlueprintNode[] = [
  { name: 'PDF/Doc Chunking', role: 'Splits messy PDFs into 512-token semantic chunks with 10% overlap + page metadata.', color: '#22D3EE' },
  { name: 'Embedding Model', role: 'Transforms text chunks into dense vectors (e.g. SentenceTransformers / text-embedding-3).', color: '#38BDF8' },
  { name: 'Vector Index (HNSW)', role: 'Hierarchical Navigable Small World graph index performs sub-linear ANN vector search.', color: '#60A5FA' },
  { name: 'Hybrid Search (RRF)', role: 'Reciprocal Rank Fusion merges BM25 keyword matches (exact IDs/acronyms) + dense vectors.', color: '#F59E0B' },
  { name: 'Cross-Encoder Reranker', role: 'Jointly scores (query, chunk) pairs to suppress irrelevant context before synthesis.', color: '#34D399' },
  { name: 'LLM Generation', role: 'Injects top-K reranked evidence chunks into system prompt for grounded output.', color: '#10B981' },
]

const GEPA_STEPS: BlueprintNode[] = [
  { name: 'Population Init', role: 'Seeds candidate prompt variants from baseline instruction.', color: '#F59E0B' },
  { name: 'Benchmark Fitness', role: 'Scores candidates on accuracy vs. token budget across test fixtures.', color: '#22D3EE' },
  { name: 'Elitism Selection', role: 'Preserves top-performing instructions untouched across generations.', color: '#34D399' },
  { name: 'Instruction Crossover', role: 'Recombines winning reasoning instructions and targeted few-shot examples.', color: '#38BDF8' },
  { name: 'Semantic Mutation', role: 'Refines constraints for deterministic formatting and concise token usage.', color: '#10B981' },
]

const FACTORY_STEPS: BlueprintNode[] = [
  { name: 'ProviderFactory', role: 'Central dispatch interface reading runtime configuration.', color: '#22D3EE' },
  { name: 'StrategyAdapter', role: 'Normalizes request schema across concrete client implementations.', color: '#10B981' },
  { name: 'Retry & Fallback', role: 'Handles transient failures and structured error classification.', color: '#F59E0B' },
  { name: 'UnifiedResponse', role: 'Returns typed payload independent of the underlying client class.', color: '#38BDF8' },
]

function hasRuntimeTrace(step?: TraceStep, steps?: TraceStep[]): boolean {
  if (!step) return false
  if (Array.isArray(step.blueprint_state?.nodes) && step.blueprint_state.nodes.length > 0) return true
  if ((steps?.length ?? 0) > 1) return true
  const frames = step.frames ?? []
  return frames.some((f) => Object.keys(f.locals ?? {}).length > 0)
}

export default function SystemBlueprintVisualizer({ step, prev, steps, index, config }: VisualizerProps) {
  const runtimeAvailable = hasRuntimeTrace(step, steps)
  const [selectedMode, setSelectedMode] = useState<'trace' | 'rag' | 'gepa' | 'factory' | null>(null)
  const [activeStep, setActiveStep] = useState(0)

  const pipelineMode =
    selectedMode === 'trace' && !runtimeAvailable
      ? 'rag'
      : selectedMode ?? (runtimeAvailable ? 'trace' : 'rag')

  const customNodes: BlueprintNode[] | null = Array.isArray(step?.blueprint_state?.nodes)
    ? step.blueprint_state.nodes
    : null

  const presetList =
    pipelineMode === 'rag' ? RAG_STEPS : pipelineMode === 'gepa' ? GEPA_STEPS : FACTORY_STEPS

  const frames: TraceFrame[] = step?.frames ?? []
  const locals = visibleLocals(step)
  const prevLocals = visibleLocals(prev)
  const safePresetIndex = Math.max(0, Math.min(activeStep, presetList.length - 1))

  return (
    <div className="flex h-full w-full flex-col gap-3 p-2 sm:p-3 font-sans text-chalk">
      {/* Header & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
        <div className="flex items-center gap-2">
          <Network size={16} className="text-emerald shrink-0" aria-hidden="true" />
          <span className="font-plate text-sm font-semibold tracking-tight text-chalk">
            {pipelineMode === 'trace'
              ? step?.title || `${step?.func || 'Execution'} · Runtime Flow`
              : 'Architecture Reference Blueprint'}
          </span>
          {pipelineMode === 'trace' && step && (
            <span className="rounded-full border border-emerald/30 bg-emerald/10 px-2 py-0.5 text-2xs font-mono text-emerald">
              {step.event === 'return' ? 'return' : step.event === 'exception' ? 'exception' : `line ${step.line}`}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-line bg-void p-1 text-xs">
          {runtimeAvailable && (
            <button
              type="button"
              onClick={() => setSelectedMode('trace')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-colors ${
                pipelineMode === 'trace'
                  ? 'bg-emerald/15 text-emerald border border-emerald/30 font-semibold'
                  : 'text-muted hover:text-chalk border border-transparent'
              }`}
            >
              <Activity size={13} aria-hidden="true" /> Live Trace
            </button>
          )}
          <button
            type="button"
            onClick={() => { setSelectedMode('rag'); setActiveStep(0) }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-colors ${
              pipelineMode === 'rag'
                ? 'bg-cyan/15 text-cyan border border-cyan/30 font-semibold'
                : 'text-muted hover:text-chalk border border-transparent'
            }`}
          >
            <Sparkles size={13} aria-hidden="true" /> RAG Flow
          </button>
          <button
            type="button"
            onClick={() => { setSelectedMode('gepa'); setActiveStep(0) }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-colors ${
              pipelineMode === 'gepa'
                ? 'bg-amber/15 text-amber border border-amber/30 font-semibold'
                : 'text-muted hover:text-chalk border border-transparent'
            }`}
          >
            <Dna size={13} aria-hidden="true" /> Genetic Opt
          </button>
          <button
            type="button"
            onClick={() => { setSelectedMode('factory'); setActiveStep(0) }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-colors ${
              pipelineMode === 'factory'
                ? 'bg-sky/15 text-sky border border-sky/30 font-semibold'
                : 'text-muted hover:text-chalk border border-transparent'
            }`}
          >
            <Box size={13} aria-hidden="true" /> Pattern Graph
          </button>
        </div>
      </div>

      {/* Main Stage */}
      {pipelineMode === 'trace' ? (
        <div className="flex flex-1 flex-col gap-4 rounded-xl border border-line bg-panel p-4 overflow-y-auto">
          {/* Custom blueprint nodes when supplied by a step */}
          {customNodes ? (
            <div className="flex flex-wrap items-center justify-center gap-2.5 py-2">
              {customNodes.map((st, idx) => (
                <div key={`${st.name}-${idx}`} className="flex items-center gap-2">
                  <div className="flex flex-col items-start rounded-xl border border-line-strong bg-panel-2 p-3 w-44 text-left">
                    <span className="text-2xs font-mono font-semibold uppercase tracking-wider mb-1 text-emerald">
                      Stage {idx + 1}
                    </span>
                    <span className="font-plate text-xs font-semibold text-chalk">{st.name}</span>
                    <span className="mt-1 text-2xs text-muted leading-snug">{st.role}</span>
                  </div>
                  {idx < customNodes.length - 1 && (
                    <ArrowRight size={14} className="text-muted shrink-0" aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Call Stack & Frame State Inspection */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-2xs font-mono text-muted">
                <span>Call Stack ({frames.length} active frame{frames.length === 1 ? '' : 's'})</span>
                <span>Step {index + 1} of {Math.max(1, steps.length)}</span>
              </div>

              {frames.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {frames.map((frame, fIdx) => {
                    const isTop = fIdx === frames.length - 1
                    return (
                      <div key={frame.id ?? `${frame.func}-${fIdx}`} className="flex items-center gap-2">
                        <div
                          className={`rounded-lg border px-3 py-2 font-mono text-xs ${
                            isTop
                              ? 'border-emerald/45 bg-emerald/10 text-chalk'
                              : 'border-line bg-panel-2 text-muted'
                          }`}
                        >
                          <span className={isTop ? 'text-emerald font-semibold' : 'text-chalk'}>
                            {frame.func}()
                          </span>
                          <span className="ml-2 text-2xs text-faint">L{frame.line}</span>
                        </div>
                        {fIdx < frames.length - 1 && (
                          <ArrowRight size={13} className="text-muted shrink-0" aria-hidden="true" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {step.event === 'return' && (
                <div className="rounded-lg border border-emerald/35 bg-emerald/10 px-3 py-2 font-mono text-xs text-chalk">
                  <span className="text-emerald font-semibold">Returned: </span>
                  <span>{formatValue(step.return_value, step.return_heap)}</span>
                </div>
              )}

              {step.event === 'exception' && (
                <div className="rounded-lg border border-crimson/45 bg-crimson/10 px-3 py-2 font-mono text-xs text-crimson">
                  <strong>Exception: </strong>
                  <span>{step.exception}</span>
                </div>
              )}

              {step.description && (
                <p className="rounded-lg border border-line bg-void px-3 py-2 text-xs text-muted leading-relaxed">
                  {step.description}
                </p>
              )}

              <SidePanels
                locals={locals}
                prevLocals={prevLocals}
                heap={step?.heap ?? {}}
                config={config}
                exclude={new Set()}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-5 rounded-xl border border-line bg-panel p-4 overflow-y-auto">
          <div className="flex items-center justify-between text-2xs font-mono text-muted">
            <span>Pipeline Nodes (Select a node to inspect role)</span>
            <span>Node {safePresetIndex + 1} of {presetList.length}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 py-2">
            {presetList.map((st, idx) => {
              const isActive = safePresetIndex === idx
              return (
                <div key={st.name} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    className={`flex flex-col items-center justify-center rounded-xl p-3 w-36 border text-center transition-colors ${
                      isActive
                        ? 'border-line-strong bg-panel-3 shadow-md'
                        : 'border-line bg-panel-2 opacity-80 hover:opacity-100 hover:border-line-strong'
                    }`}
                    style={{
                      borderColor: isActive ? st.color : undefined,
                    }}
                  >
                    <span
                      className="text-2xs font-bold uppercase tracking-wider mb-1"
                      style={{ color: st.color }}
                    >
                      Node {idx + 1}
                    </span>
                    <span className="font-plate text-xs font-semibold text-chalk leading-tight">
                      {st.name}
                    </span>
                  </button>
                  {idx < presetList.length - 1 && (
                    <ArrowRight size={14} className="text-muted shrink-0" aria-hidden="true" />
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-auto rounded-xl border border-line bg-void p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: presetList[safePresetIndex].color }}
                />
                <h3 className="font-plate text-sm font-semibold text-chalk">
                  {presetList[safePresetIndex].name}
                </h3>
              </div>
              <span className="text-2xs font-mono text-cyan">
                Stage {safePresetIndex + 1}
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {presetList[safePresetIndex].role}
            </p>
            <div className="flex items-center justify-between border-t border-line pt-2 mt-1">
              <button
                type="button"
                onClick={() => setActiveStep((p) => Math.max(0, p - 1))}
                disabled={safePresetIndex === 0}
                className="min-h-[32px] px-2 text-xs text-muted hover:text-chalk disabled:opacity-30"
              >
                Previous Node
              </button>
              <button
                type="button"
                onClick={() => setActiveStep((p) => Math.min(presetList.length - 1, p + 1))}
                disabled={safePresetIndex === presetList.length - 1}
                className="min-h-[32px] px-2 text-xs text-cyan hover:underline disabled:opacity-30"
              >
                Next Node
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
