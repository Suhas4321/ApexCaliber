import {
  Bot,
  CheckCircle2,
  Eye,
  FileText,
  FlaskConical,
  Lightbulb,
  PauseCircle,
  Play,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { api } from '../../api/client'
import type {
  CoachReply,
  Drill,
  Progress,
  QuestionDetail,
  Trace,
  TraceStep,
  TraceValue,
} from '../../api/types'
import { precomputeTraceNarration } from '../../lib/narrator'
import { formatArgs } from '../RunResults'
import { Button, ErrorNote, Markdown } from '../ui'
import VisualizerHost from '../visualizers/VisualizerHost'
import ProblemStatement from './ProblemStatement'

export type LeftAnchorView = 'trace' | 'spec' | 'drills'
export type StudioStage = 1 | 2 | 3

export interface RunTraceMeta {
  passed: boolean
  passedCount: number
  totalCount: number
  source: 'demo' | 'user'
}

interface PersistentVisualAnchorProps {
  question: QuestionDetail
  progress: Progress
  leftView: LeftAnchorView
  onChangeLeftView: (view: LeftAnchorView) => void
  studioStage: StudioStage
  steps: TraceStep[]
  lineInfo?: Trace['line_info']
  tracedCode: string
  stepIndex: number
  playing: boolean
  speed: number
  onTogglePlay: () => void
  onStepForward: () => void
  onStepBackward: () => void
  onJumpFirst: () => void
  onJumpLast: () => void
  onSeek: (idx: number) => void
  onSpeedChange: (speed: number) => void
  activeCode: string
  activeTarget: string
  onSelectTarget: (target: string) => void
  onProgress: (p: Progress) => void
  runTraceMeta: RunTraceMeta | null
  onOpenInterviewGuide?: () => void
}

function buildFallbackSteps(question: QuestionDetail): TraceStep[] {
  const content = question.content
  if (!content) return []

  const firstArgs = content.tests?.[0]?.args
  const locals: Record<string, TraceValue> = {}
  const params = content.function.params ?? []

  if (Array.isArray(firstArgs)) {
    firstArgs.forEach((argVal, idx) => {
      const name = params[idx]?.name ?? `arg${idx}`
      locals[name] = argVal as TraceValue
    })
  } else if (firstArgs && typeof firstArgs === 'object') {
    locals.input = firstArgs as TraceValue
  }

  const example = content.statement.examples?.[0]
  const ct = content.concept_trace

  return [
    {
      event: ct ? 'pipeline_step' : 'call',
      line: 1,
      func: content.function.name || 'solve',
      depth: 0,
      params: params.map((p) => p.name),
      frames: [
        {
          id: 1,
          func: content.function.name || 'solve',
          line: 1,
          locals,
        },
      ],
      heap: {},
      sql_state: ct?.sql_state,
      df_state: ct?.df_state,
      concurrency_state: ct?.concurrency_state,
      http_state: ct?.http_state,
      blueprint_state: ct?.blueprint_state,
      title: `${question.title} · Initial Input Frame`,
      description: example
        ? `Input: ${example.input} → Expected: ${example.output}`
        : content.concept.key_insight,
    },
  ]
}

export default function PersistentVisualAnchor({
  question,
  progress,
  leftView,
  onChangeLeftView,
  studioStage,
  steps,
  lineInfo,
  tracedCode,
  stepIndex,
  playing,
  speed,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onJumpFirst,
  onJumpLast,
  onSeek,
  onSpeedChange,
  activeCode,
  activeTarget,
  onSelectTarget,
  onProgress,
  runTraceMeta,
  onOpenInterviewGuide,
}: PersistentVisualAnchorProps) {
  const content = question.content!
  const drills = content.drills ?? []

  const [revealedHints, setRevealedHints] = useState(progress.hints_used)
  const [coachReply, setCoachReply] = useState<CoachReply | null>(null)
  const [coachLoading, setCoachLoading] = useState(false)
  const [coachError, setCoachError] = useState<string | null>(null)

  const fallbackSteps = useMemo(() => buildFallbackSteps(question), [question])
  const effectiveSteps = steps.length > 0 ? steps : fallbackSteps
  const safeIndex = Math.max(0, Math.min(stepIndex, Math.max(0, effectiveSteps.length - 1)))

  const narrations = useMemo(
    () =>
      effectiveSteps.length > 0
        ? precomputeTraceNarration(effectiveSteps, lineInfo, content.viz, question.visualizer)
        : [],
    [effectiveSteps, lineInfo, content.viz, question.visualizer],
  )

  const currentStep = effectiveSteps[safeIndex] ?? {
    event: 'line',
    line: 1,
    func: content.function.name,
    depth: 0,
    frames: [],
    heap: {},
  }
  const currentNarration = narrations[safeIndex]

  const revealNextHint = async () => {
    const next = Math.min(content.hints.length, revealedHints + 1)
    setRevealedHints(next)
    try {
      const updated = await api.patchProgress(question.slug, { hints_used: next })
      onProgress(updated)
    } catch {
      /* ignore network hiccup on local hint increment */
    }
  }

  const askSocraticCoach = async () => {
    setCoachLoading(true)
    setCoachError(null)
    try {
      const res = await api.askCoach(question.slug, {
        mode: 'hint',
        code: activeCode || content.starter_code,
      })
      setCoachReply(res)
    } catch (e) {
      setCoachError(e instanceof Error ? e.message : String(e))
    } finally {
      setCoachLoading(false)
    }
  }

  const isCheckpointPaused = studioStage === 2 && !playing && effectiveSteps.length > 0

  return (
    <aside
      aria-label="Visual Runtime Anchor"
      className="flex h-full min-h-0 flex-col bg-[#080808] [html[data-theme='light']_&]:bg-panel border-r border-[#1a1a1a] [html[data-theme='light']_&]:border-line"
    >
      {/* Anchor Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1a1a1a] [html[data-theme='light']_&]:border-line bg-[#0a0a0a] [html[data-theme='light']_&]:bg-panel-2 px-3 py-2 shrink-0">
        <div className="flex items-center gap-1" role="tablist" aria-label="Left visual anchor views">
          <button
            type="button"
            role="tab"
            aria-selected={leftView === 'trace'}
            onClick={() => onChangeLeftView('trace')}
            className={`inline-flex items-center gap-1.5 min-h-[40px] md:min-h-[32px] px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FF88] ${
              leftView === 'trace'
                ? 'bg-[#00FF88]/12 text-[#00FF88] border border-[#00FF88]/30 [html[data-theme=\'light\']_&]:bg-[var(--study-accent)]/12 [html[data-theme=\'light\']_&]:text-[var(--study-accent)] [html[data-theme=\'light\']_&]:border-[var(--study-accent)]/35'
                : 'text-muted border border-transparent hover:text-chalk hover:bg-white/[0.04]'
            }`}
          >
            <Eye size={13} aria-hidden="true" />
            <span>Runtime Trace</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={leftView === 'spec'}
            onClick={() => onChangeLeftView('spec')}
            className={`inline-flex items-center gap-1.5 min-h-[40px] md:min-h-[32px] px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FF88] ${
              leftView === 'spec'
                ? 'bg-[#00FF88]/12 text-[#00FF88] border border-[#00FF88]/30 [html[data-theme=\'light\']_&]:bg-[var(--study-accent)]/12 [html[data-theme=\'light\']_&]:text-[var(--study-accent)] [html[data-theme=\'light\']_&]:border-[var(--study-accent)]/35'
                : 'text-muted border border-transparent hover:text-chalk hover:bg-white/[0.04]'
            }`}
          >
            <FileText size={13} aria-hidden="true" />
            <span>Problem Spec</span>
          </button>

          {drills.length > 0 && (
            <button
              type="button"
              role="tab"
              aria-selected={leftView === 'drills'}
              onClick={() => onChangeLeftView('drills')}
              className={`inline-flex items-center gap-1.5 min-h-[40px] md:min-h-[32px] px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FF88] ${
                leftView === 'drills'
                  ? 'bg-[#00FF88]/12 text-[#00FF88] border border-[#00FF88]/30 [html[data-theme=\'light\']_&]:bg-[var(--study-accent)]/12 [html[data-theme=\'light\']_&]:text-[var(--study-accent)] [html[data-theme=\'light\']_&]:border-[var(--study-accent)]/35'
                  : 'text-muted border border-transparent hover:text-chalk hover:bg-white/[0.04]'
              }`}
            >
              <FlaskConical size={13} aria-hidden="true" />
              <span>
                Drills ({progress.drills_passed.length}/{drills.length})
              </span>
            </button>
          )}
        </div>

        {/* Live Context Sync Badge */}
        {isCheckpointPaused ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00FF88]/30 bg-[#00FF88]/10 px-2.5 py-1 font-mono text-xs text-[#00FF88] [html[data-theme='light']_&]:border-[var(--study-accent)]/35 [html[data-theme='light']_&]:bg-[var(--study-accent)]/10 [html[data-theme='light']_&]:text-[var(--study-accent)]">
            <PauseCircle size={12} aria-hidden="true" />
            <span>
              Paused Frame {safeIndex + 1}/{effectiveSteps.length}
            </span>
          </span>
        ) : runTraceMeta?.source === 'user' ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs ${
              runTraceMeta.passed
                ? 'border-[#00FF88]/30 bg-[#00FF88]/10 text-[#00FF88]'
                : 'border-amber/40 bg-amber/10 text-amber'
            }`}
          >
            <span>
              {runTraceMeta.passed ? 'Passed' : 'Trace'} · {runTraceMeta.passedCount}/
              {runTraceMeta.totalCount}
            </span>
          </span>
        ) : null}
      </div>

      {/* Persistent Runtime Trace Pane — always mounted, never unmounted between Stages 1, 2, 3 */}
      <div
        role="tabpanel"
        aria-hidden={leftView !== 'trace'}
        className={
          leftView === 'trace'
            ? 'stage flex-1 min-h-0 overflow-y-auto bg-[#080808] p-3 sm:p-4'
            : 'hidden'
        }
      >
        <div className="min-h-full flex flex-col">
          <VisualizerHost
            kind={question.visualizer}
            title={content.viz?.title || `${question.title} · Runtime State`}
            timeComplexity={
              content.viz?.complexity?.time || content.solution.time.split(' — ')[0]
            }
            spaceComplexity={
              content.viz?.complexity?.space || content.solution.space.split(' — ')[0]
            }
            step={currentStep}
            prev={safeIndex > 0 ? effectiveSteps[safeIndex - 1] : undefined}
            steps={effectiveSteps}
            index={safeIndex}
            config={content.viz || {}}
            code={tracedCode || content.solution.code}
            narration={currentNarration}
            caption={currentNarration?.caption || currentStep.description}
            why={currentNarration?.why}
            comparisons={currentNarration?.counters.comparisons}
            swaps={currentNarration?.counters.swaps}
            writes={currentNarration?.counters.writes}
            playing={playing}
            onTogglePlay={onTogglePlay}
            onStepForward={onStepForward}
            onStepBackward={onStepBackward}
            onJumpFirst={onJumpFirst}
            onJumpLast={onJumpLast}
            onSeek={onSeek}
            speed={speed}
            onSpeedChange={onSpeedChange}
          />
        </div>
      </div>

      {/* Problem Spec & Socratic Help Pane */}
      {leftView === 'spec' && (
        <div role="tabpanel" className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-6">
          <ProblemStatement content={content} />

          {/* Hints & AI Coach */}
          <section
            aria-label="Hints and AI Coach"
            className="border-t border-[#1a1a1a] [html[data-theme='light']_&]:border-line pt-5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                <Lightbulb size={14} aria-hidden="true" />
                Progressive Hints ({revealedHints}/{content.hints.length})
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {revealedHints < content.hints.length && (
                  <Button
                    variant="outline"
                    className="min-h-[36px] px-3 text-xs"
                    onClick={revealNextHint}
                  >
                    Reveal Hint {revealedHints + 1}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="min-h-[36px] px-3 text-xs"
                  onClick={askSocraticCoach}
                  disabled={coachLoading}
                >
                  <Bot size={13} aria-hidden="true" />
                  <span>{coachLoading ? 'Thinking…' : 'Ask AI Coach'}</span>
                </Button>
              </div>
            </div>

            {content.hints.slice(0, revealedHints).map((hint, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-amber/30 bg-amber/[0.06] p-3 text-xs leading-relaxed text-chalk"
              >
                <strong className="mb-1 block text-amber">Hint {idx + 1}:</strong>
                <Markdown>{hint}</Markdown>
              </div>
            ))}

            {coachError && <ErrorNote message={coachError} />}
            {coachReply && !coachReply.enabled && (
              <p className="text-xs text-muted">
                AI Coach is offline in this environment. Reveal the structured hints above to guide your solution.
              </p>
            )}
            {coachReply?.error && <ErrorNote message={coachReply.error} />}
            {coachReply?.reply && (
              <div className="rounded-lg border border-[#00FF88]/30 bg-[#00FF88]/[0.06] p-3 text-xs leading-relaxed text-chalk">
                <strong className="mb-1 block text-[#00FF88]">Socratic AI Coach:</strong>
                <Markdown>{coachReply.reply}</Markdown>
              </div>
            )}

            {onOpenInterviewGuide && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#1a1a1a] [html[data-theme='light']_&]:border-line bg-[#0a0a0a] [html[data-theme='light']_&]:bg-panel-2 p-3.5 text-xs">
                <div>
                  <strong className="block font-medium text-chalk">Interview Rehearsal</strong>
                  <span className="text-muted">
                    Review clarifying prompts, spoken script, and complexity proof.
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="min-h-[36px] px-3 text-xs shrink-0"
                  onClick={onOpenInterviewGuide}
                >
                  Interview Playbook →
                </Button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Drills Sub-View */}
      {leftView === 'drills' && drills.length > 0 && (
        <div role="tabpanel" className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3">
          <div className="rounded-lg border border-[#1a1a1a] [html[data-theme='light']_&]:border-line bg-[#0a0a0a] [html[data-theme='light']_&]:bg-panel-2 p-3 text-xs text-muted leading-relaxed">
            Pick any micro-drill to load its isolated signature into the Verification Arena editor.
          </div>

          <button
            type="button"
            onClick={() => onSelectTarget('main')}
            className={`flex w-full min-h-[44px] items-center justify-between rounded-xl border p-3.5 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FF88] ${
              activeTarget === 'main'
                ? 'border-[#00FF88]/50 bg-[#00FF88]/10 text-chalk'
                : 'border-[#1a1a1a] [html[data-theme=\'light\']_&]:border-line bg-[#0a0a0a] [html[data-theme=\'light\']_&]:bg-panel-2 text-muted hover:text-chalk'
            }`}
          >
            <span className="font-semibold">Main Solution ({content.function.name})</span>
            <span className="font-mono text-xs text-[#00FF88]">
              {activeTarget === 'main' ? 'Active' : 'Select →'}
            </span>
          </button>

          {drills.map((d: Drill, i: number) => {
            const targetKey = `drill:${i}`
            const passed = progress.drills_passed.includes(i)
            const selected = activeTarget === targetKey
            return (
              <div
                key={d.title}
                className={`rounded-xl border p-4 space-y-2.5 transition-colors ${
                  selected
                    ? 'border-[#00FF88]/50 bg-[#0a0a0a] [html[data-theme=\'light\']_&]:bg-panel-2'
                    : 'border-[#1a1a1a] [html[data-theme=\'light\']_&]:border-line bg-[#0a0a0a] [html[data-theme=\'light\']_&]:bg-panel'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {passed ? (
                      <CheckCircle2 size={15} className="text-[#00FF88]" aria-hidden="true" />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#1a1a1a] [html[data-theme='light']_&]:border-line font-mono text-xs text-muted">
                        {i + 1}
                      </span>
                    )}
                    <h4 className="font-plate text-sm font-semibold text-chalk">{d.title}</h4>
                  </div>

                  <Button
                    variant={selected ? 'primary' : 'outline'}
                    className="min-h-[36px] px-3 text-xs"
                    onClick={() => onSelectTarget(targetKey)}
                  >
                    <Play size={12} aria-hidden="true" />
                    <span>{selected ? 'Editing Drill' : 'Code This Drill'}</span>
                  </Button>
                </div>

                <p className="text-xs font-medium text-amber">{d.goal}</p>
                <div className="text-xs text-muted leading-relaxed">
                  <Markdown>{d.instructions}</Markdown>
                </div>
                <div className="space-y-1 font-mono text-xs">
                  {d.tests.map((tc, tIdx) => (
                    <div
                      key={tIdx}
                      className="rounded border border-[#1a1a1a] [html[data-theme='light']_&]:border-line bg-[#080808] [html[data-theme='light']_&]:bg-panel-2 px-2.5 py-1.5"
                    >
                      <span className="text-chalk">{formatArgs(tc.args, d.function)}</span>
                      <span className="text-faint"> → </span>
                      <span className="text-[#00FF88]">{JSON.stringify(tc.expected)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </aside>
  )
}
