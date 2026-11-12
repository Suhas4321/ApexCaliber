import { BookOpen, Bot, CheckCircle2, Cpu, Eye, Lightbulb, Play } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { api } from '../../api/client'
import type { CoachReply, Drill, Progress, QuestionDetail, TraceStep } from '../../api/types'
import type { NarratorResult } from '../../lib/narrator/types'
import { formatArgs } from '../RunResults'
import { Button, ErrorNote, Markdown } from '../ui'
import VisualizerHost from '../visualizers/VisualizerHost'
import '../../features/journey/journey.css'
import ConstraintsCheatWidget from './ConstraintsCheatWidget'
import Quiz from './Quiz'

export type LeftTab = 'description' | 'visualizer' | 'drills' | 'pitch'

export interface LeftPanelProps {
  question: QuestionDetail
  progress: Progress
  onProgress: (p: Progress) => void
  activeTab: LeftTab
  onTabChange: (t: LeftTab) => void
  activeTarget: string
  onSelectTarget: (target: string) => void
  steps: TraceStep[]
  stepIndex: number
  onSeek: (i: number) => void
  playing: boolean
  onTogglePlay: () => void
  onStepForward: () => void
  onStepBackward: () => void
  onJumpFirst: () => void
  onJumpLast: () => void
  speed: number
  onSpeedChange: (s: number) => void
  narration?: NarratorResult
  tracedCode: string
  currentCode: string
  onOpenInterviewGuide?: () => void
}

export default function LeetCodeLeftPanel(props: LeftPanelProps) {
  const {
    question,
    progress,
    onProgress,
    activeTab,
    onTabChange,
    activeTarget,
    onSelectTarget,
    steps,
    stepIndex,
    onSeek,
    playing,
    onTogglePlay,
    onStepForward,
    onStepBackward,
    onJumpFirst,
    onJumpLast,
    speed,
    onSpeedChange,
    narration,
    tracedCode,
    currentCode,
    onOpenInterviewGuide,
  } = props
  const content = question.content!
  const st = content.statement
  const c = content.concept
  const drills = content.drills ?? []

  const [revealedHints, setRevealedHints] = useState<number>(0)
  const [coachLoading, setCoachLoading] = useState(false)
  const [coachReply, setCoachReply] = useState<CoachReply | null>(null)
  const [coachError, setCoachError] = useState<string | null>(null)

  const askSocraticCoach = async () => {
    setCoachLoading(true)
    setCoachError(null)
    try {
      const r = await api.askCoach(question.slug, { mode: 'hint', code: currentCode })
      setCoachReply(r)
    } catch (e) {
      setCoachError((e as Error).message)
    } finally {
      setCoachLoading(false)
    }
  }

  const revealNextHint = () => {
    const next = Math.min(content.hints.length, revealedHints + 1)
    setRevealedHints(next)
    if (next > progress.hints_used) {
      api.patchProgress(question.slug, { hints_used: next }).then(onProgress).catch(() => {})
    }
  }

  const tabBtn = (id: LeftTab, label: string, icon: ReactNode, badge?: ReactNode) => (
    <button
      type="button"
      onClick={() => onTabChange(id)}
      className={`flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
        activeTab === id ? 'bg-panel-3 text-chalk font-semibold shadow-2xs' : 'text-muted hover:text-chalk'
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge}
    </button>
  )

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-panel">
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-line bg-panel-2 px-2 overflow-x-auto no-scrollbar select-none">
        {tabBtn('description', 'Problem', <BookOpen size={13} className="text-cyan" />)}
        {tabBtn(
          'visualizer',
          'Trace',
          <Eye size={13} className="text-emerald" />,
          steps.length > 0 ? (
            <span className="rounded-full bg-emerald/20 px-1.5 py-0.5 font-mono text-2xs font-bold text-emerald">
              {steps.length}
            </span>
          ) : null,
        )}
        {drills.length > 0 &&
          tabBtn(
            'drills',
            'Exercises',
            <Cpu size={13} className="text-amber" />,
            <span className="font-mono text-2xs text-muted">
              {progress.drills_passed.length}/{drills.length}
            </span>,
          )}
        <button aria-label="Need a hint?" className="ml-auto shrink-0 whitespace-nowrap px-2 py-1 text-xs text-muted hover:text-chalk" onClick={() => {
          onTabChange('description')
          requestAnimationFrame(() => document.getElementById('question-help')?.scrollIntoView({ block: 'start' }))
        }}>Help</button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
        {activeTab === 'description' && (
          <div className="flex flex-col gap-4">
            <div className="problem-intro"><span className="lesson-eyebrow">The problem</span><h2>{question.title}</h2><p>Read the examples, check the constraints, then try a solution.</p></div>
            <div className="prose-forge text-sm leading-relaxed text-chalk"><Markdown>{st.clean}</Markdown></div>
            <details className="problem-disclosure"><summary>The real-world scenario</summary><Markdown>{st.oa_story}</Markdown></details>
            <div className="flex flex-col gap-3">
              {st.examples.map((ex, i) => (
                <div key={i} className="border-l-2 border-line-strong pl-4 py-2 font-mono text-xs">
                  <div className="mb-1.5 font-sans text-xs font-bold text-chalk">Example {i + 1}:</div>
                  <div className="space-y-1">
                    <div>
                      <span className="font-semibold text-muted">Input: </span>
                      <span className="text-chalk">{ex.input}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-muted">Output: </span>
                      <span className="font-bold text-emerald">{ex.output}</span>
                    </div>
                    {ex.explanation && (
                      <div className="pt-1 font-sans text-xs text-muted">
                        <span className="font-semibold">Explanation: </span>
                        {ex.explanation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Constraints:</h4>
              <ul className="list-inside list-disc space-y-1 font-mono text-xs text-chalk/90">
                {st.constraints.map((con, idx) => (
                  <li key={idx}>
                    <code className="rounded bg-panel-2 px-1.5 py-0.5">{con}</code>
                  </li>
                ))}
              </ul>
            </div>

            <details className="problem-disclosure"><summary>Pattern clues & trigger words</summary><div className="flex flex-wrap gap-2 pt-3">{st.trigger_keywords.map(kw => <span key={kw} className="text-xs text-muted">{kw}</span>)}</div></details>
            <details className="problem-disclosure">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-xs font-semibold text-chalk hover:bg-panel-2 select-none">
                <span>Concept notes & self-checks</span>
                <span className="font-mono text-2xs text-cyan">Expand ▾</span>
              </summary>
              <div className="space-y-4 border-t border-line p-4 text-xs leading-relaxed text-muted">
                <div>
                  <strong className="text-chalk block mb-1">Key Insight:</strong>
                  <Markdown>{c.key_insight}</Markdown>
                </div>
                <div>
                  <strong className="text-chalk block mb-1">Why Brute Force Fails ({c.brute_force_complexity}):</strong>
                  <Markdown>{c.brute_force}</Markdown>
                </div>
                <ConstraintsCheatWidget constraints={st.constraints} />
                <Quiz quiz={content.constraint_quiz} solved={progress.quiz_passed} onSolved={() => {}} />
                <Quiz
                  quiz={content.pattern_quiz}
                  solved={progress.quiz_passed}
                  onSolved={() => {
                    api.patchProgress(question.slug, { concept_done: true, quiz_passed: true }).then(onProgress).catch(() => {})
                  }}
                />
              </div>
            </details>
          </div>
        )}
        {activeTab === 'visualizer' && (
          <div className="flex h-full flex-col gap-3">
            <VisualizerHost
              kind={question.visualizer}
              title={content.viz?.title || `${question.title} · Live Trace`}
              timeComplexity={content.viz?.complexity?.time || content.solution.time.split(' — ')[0]}
              spaceComplexity={content.viz?.complexity?.space || content.solution.space.split(' — ')[0]}
              step={steps[stepIndex] ?? { event: 'line', line: 1, func: content.function.name, depth: 0, frames: [], heap: {} }}
              prev={stepIndex > 0 ? steps[stepIndex - 1] : undefined}
              steps={steps}
              index={stepIndex}
              config={content.viz || {}}
              code={tracedCode || currentCode}
              narration={narration}
              caption={narration?.caption}
              why={narration?.why}
              comparisons={narration?.counters.comparisons}
              swaps={narration?.counters.swaps}
              writes={narration?.counters.writes}
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
        )}

        {activeTab === 'drills' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-line bg-panel-2/50 p-3 text-xs text-muted">
              Select a micro-drill below to load its starter code and test cases into the right-hand editor, or switch back to <strong>Main Solution</strong> anytime.
            </div>
            <button
              type="button"
              onClick={() => onSelectTarget('main')}
              className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs transition-colors ${
                activeTarget === 'main' ? 'border-cyan bg-cyan/10 text-chalk' : 'border-line bg-panel-2 text-muted hover:text-chalk'
              }`}
            >
              <span className="font-semibold">Main Problem Solution ({content.function.name})</span>
              <span className="font-mono text-2xs text-cyan">{activeTarget === 'main' ? 'Active in Editor' : 'Switch →'}</span>
            </button>

            {drills.map((d: Drill, i: number) => {
              const tKey = `drill:${i}`
              const isPassed = progress.drills_passed.includes(i)
              const isSelected = activeTarget === tKey
              return (
                <div
                  key={d.title}
                  className={`rounded-xl border p-4 transition-colors ${
                    isSelected ? 'border-cyan bg-panel-2' : 'border-line bg-panel-2/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {isPassed ? (
                        <CheckCircle2 size={15} className="text-emerald" />
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-muted font-mono text-2xs">
                          {i + 1}
                        </span>
                      )}
                      <h4 className="font-plate text-sm font-bold text-chalk">{d.title}</h4>
                    </div>
                    <Button
                      variant={isSelected ? 'primary' : 'outline'}
                      className="h-7 px-2.5 text-2xs"
                      onClick={() => onSelectTarget(tKey)}
                    >
                      <Play size={11} />
                      <span>{isSelected ? 'Editing Drill' : 'Code This Drill'}</span>
                    </Button>
                  </div>
                  <p className="text-xs font-medium text-amber mb-2">{d.goal}</p>
                  <div className="text-xs text-muted leading-relaxed mb-3">
                    <Markdown>{d.instructions}</Markdown>
                  </div>
                  <div className="space-y-1 font-mono text-2xs">
                    {d.tests.map((tc, tIdx) => (
                      <div key={tIdx} className="rounded bg-void/70 px-2 py-1">
                        <span className="text-chalk">{formatArgs(tc.args, d.function)}</span>
                        <span className="text-faint"> → </span>
                        <span className="text-emerald">{JSON.stringify(tc.expected)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {(activeTab === 'pitch' || activeTab === 'description') && (
          <section id="question-help" className="problem-help flex flex-col gap-5">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                  <Lightbulb size={14} /> Progressive Hints ({revealedHints}/{content.hints.length})
                </span>
                <div className="flex items-center gap-2">
                  {revealedHints < content.hints.length && (
                    <Button variant="outline" className="h-7 px-2.5 text-2xs" onClick={revealNextHint}>
                      Reveal Hint {revealedHints + 1}
                    </Button>
                  )}
                  <Button variant="outline" className="h-7 px-2.5 text-2xs" onClick={askSocraticCoach} disabled={coachLoading}>
                    <Bot size={12} />
                    <span>{coachLoading ? 'Thinking…' : 'Ask AI Coach'}</span>
                  </Button>
                </div>
              </div>
              {content.hints.slice(0, revealedHints).map((h, idx) => (
                <div key={idx} className="rounded-lg border border-amber/30 bg-amber/5 p-3 text-xs text-chalk leading-relaxed">
                  <strong className="text-amber block mb-0.5">Hint {idx + 1}:</strong>
                  <Markdown>{h}</Markdown>
                </div>
              ))}
              {coachError && <ErrorNote message={coachError} />}
              {coachReply && !coachReply.enabled && <p className="text-xs text-muted">The AI coach isn’t configured. Use the lesson’s hints above.</p>}
              {coachReply?.error && <ErrorNote message={coachReply.error} />}
              {coachReply?.reply && (
                <div className="rounded-lg border border-cyan/40 bg-cyan/10 p-3 text-xs text-chalk leading-relaxed">
                  <strong className="text-cyan block mb-1">Socratic AI Coach:</strong>
                  <Markdown>{coachReply.reply}</Markdown>
                </div>
              )}
            </div>

            {onOpenInterviewGuide && (
              <div className="border-t border-line pt-5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <strong className="text-emerald block">Explain your approach</strong>
                  <span className="text-muted">View clarifying questions, spoken script, and complexity proof in full screen.</span>
                </div>
                <Button className="h-8 px-3 text-xs shrink-0" onClick={onOpenInterviewGuide}>
                  Interview guide →
                </Button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
