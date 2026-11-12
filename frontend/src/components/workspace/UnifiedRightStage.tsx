import {
  ArrowRight,
  Check,
  CheckCircle2,
  Lock,
  PauseCircle,
  Play,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import type { Progress, QuestionDetail, Quiz } from '../../api/types'
import { Markdown } from '../ui'
import type { StudioStage } from './PersistentVisualAnchor'

interface CheckpointChoice {
  id: string
  label: string
  isCorrect: boolean
  explanation?: string
}

interface CheckpointQuestion {
  title: string
  prompt: string
  choices: CheckpointChoice[]
  revealedExplanation: string
}

function buildCheckpointQuestion(question: QuestionDetail): CheckpointQuestion | null {
  const content = question.content
  if (!content) return null

  const journeyStage = content.journey?.[0]
  if (journeyStage?.prediction && journeyStage.prediction.choices.length > 0) {
    return {
      title: journeyStage.title.replace(/^Transfer Challenge:\s*/, ''),
      prompt: journeyStage.prediction.prompt,
      choices: journeyStage.prediction.choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
        isCorrect: Boolean(choice.is_correct),
        explanation: choice.explanation,
      })),
      revealedExplanation: journeyStage.prediction.revealed_explanation,
    }
  }

  const fallbackQuiz: Quiz | undefined = content.pattern_quiz || content.constraint_quiz
  if (!fallbackQuiz) return null

  return {
    title: 'State & Strategy Prediction',
    prompt: fallbackQuiz.prompt,
    choices: fallbackQuiz.options.map((label, idx) => ({
      id: String(idx),
      label,
      isCorrect: idx === fallbackQuiz.answer,
    })),
    revealedExplanation: fallbackQuiz.explanation,
  }
}

interface UnifiedRightStageProps {
  question: QuestionDetail
  progress: Progress
  studioStage: StudioStage
  checkpointUnlocked: boolean
  arenaUnlocked: boolean
  freeAccess: boolean
  pausedStepIndex: number
  totalSteps: number
  onSelectStage: (stage: StudioStage) => void
  onProceedToCheckpoint: () => void
  onFocusCheckpointTrace: () => void
  onReplayToCheckpoint: () => void
  onUnlockArena: (passedQuiz: boolean) => void
  children: ReactNode
}

export default function UnifiedRightStage({
  question,
  progress,
  studioStage,
  checkpointUnlocked,
  arenaUnlocked,
  freeAccess,
  pausedStepIndex,
  totalSteps,
  onSelectStage,
  onProceedToCheckpoint,
  onFocusCheckpointTrace,
  onReplayToCheckpoint,
  onUnlockArena,
  children,
}: UnifiedRightStageProps) {
  const content = question.content!
  const [showFormalSpec, setShowFormalSpec] = useState(false)
  const [pickedChoiceId, setPickedChoiceId] = useState<string | null>(null)
  const [extraQuizPicked, setExtraQuizPicked] = useState<number | null>(null)

  const checkpoint = useMemo(() => buildCheckpointQuestion(question), [question])
  const secondaryQuiz = content.journey?.[0]?.prediction
    ? content.constraint_quiz
    : content.pattern_quiz !== (content.pattern_quiz || content.constraint_quiz)
      ? content.constraint_quiz
      : null

  const selectedChoice = checkpoint?.choices.find((c) => c.id === pickedChoiceId) ?? null
  const isChoiceCorrect = Boolean(selectedChoice?.isCorrect)
  const canProceedToArena = arenaUnlocked || pickedChoiceId !== null || freeAccess

  const firstExample = content.statement.examples?.[0]
  const timeComplexity = content.viz?.complexity?.time || content.solution.time.split(' — ')[0]
  const spaceComplexity = content.viz?.complexity?.space || content.solution.space.split(' — ')[0]

  const stages: Array<{
    id: StudioStage
    num: string
    label: string
    unlocked: boolean
    completed: boolean
  }> = [
    {
      id: 1,
      num: '01',
      label: 'Intuition Blueprint',
      unlocked: true,
      completed: studioStage > 1 || progress.concept_done || progress.solved,
    },
    {
      id: 2,
      num: '02',
      label: 'Mental Checkpoint',
      unlocked: checkpointUnlocked || freeAccess,
      completed: arenaUnlocked || progress.quiz_passed || progress.solved,
    },
    {
      id: 3,
      num: '03',
      label: 'Verification Arena',
      unlocked: arenaUnlocked || freeAccess,
      completed: progress.solved,
    },
  ]

  return (
    <section
      aria-label="Guided Verification Workspace"
      className="flex h-full min-h-0 flex-col bg-[#080808] [html[data-theme='light']_&]:bg-void"
    >
      {/* Persistent Top 3-Stage Milestone Stepper */}
      <nav
        aria-label="Studio progression milestones"
        className="flex items-stretch gap-1.5 overflow-x-auto border-b border-[#1a1a1a] [html[data-theme='light']_&]:border-line bg-[#0a0a0a] [html[data-theme='light']_&]:bg-panel px-3 py-2 shrink-0"
      >
        {stages.map((item) => {
          const isCurrent = studioStage === item.id
          return (
            <button
              key={item.id}
              type="button"
              disabled={!item.unlocked}
              aria-current={isCurrent ? 'step' : undefined}
              onClick={() => item.unlocked && onSelectStage(item.id)}
              className={`flex flex-1 min-w-[144px] min-h-[44px] md:min-h-[38px] items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FF88] ${
                isCurrent
                  ? 'border-[#00FF88]/45 bg-[#00FF88]/10 text-chalk [html[data-theme=\'light\']_&]:border-[var(--study-accent)]/45 [html[data-theme=\'light\']_&]:bg-[var(--study-accent)]/10'
                  : item.unlocked
                    ? 'border-[#1a1a1a] [html[data-theme=\'light\']_&]:border-line bg-[#0f1311]/70 [html[data-theme=\'light\']_&]:bg-panel-2 text-muted hover:text-chalk hover:border-white/20'
                    : 'border-[#1a1a1a]/60 [html[data-theme=\'light\']_&]:border-line/60 bg-transparent text-faint cursor-not-allowed opacity-65'
              }`}
            >
              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-xs ${
                  isCurrent
                    ? 'bg-[#00FF88] text-[#050806] [html[data-theme=\'light\']_&]:bg-[var(--study-accent)] [html[data-theme=\'light\']_&]:text-white font-semibold'
                    : item.completed
                      ? 'bg-[#00FF88]/15 text-[#00FF88] [html[data-theme=\'light\']_&]:text-[var(--study-accent)]'
                      : 'border border-white/15 [html[data-theme=\'light\']_&]:border-line text-faint'
                }`}
              >
                {item.completed && !isCurrent ? (
                  <Check size={11} strokeWidth={2.75} aria-hidden="true" />
                ) : !item.unlocked ? (
                  <Lock size={10} aria-hidden="true" />
                ) : (
                  item.num
                )}
              </span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* STAGE 1: Intuition Blueprint */}
      {studioStage === 1 && (
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-6 sm:px-7">
          <div className="mx-auto max-w-[68ch] space-y-5">
            <header className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-faint">
                <span className="uppercase tracking-wider">{question.world_name}</span>
                {question.patterns.slice(0, 3).map((pattern) => (
                  <span
                    key={pattern}
                    className="rounded border border-[#1a1a1a] [html[data-theme='light']_&]:border-line bg-[#0a0a0a] [html[data-theme='light']_&]:bg-panel px-2 py-0.5 text-muted"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
              <h2 className="font-plate text-2xl font-semibold tracking-tight text-chalk">
                Intuition Blueprint
              </h2>
              <p className="text-sm leading-relaxed text-muted">
                Inspect the execution model on the left while grounding the core invariant below.
              </p>
            </header>

            {/* Engineering Context + Example */}
            <section className="rounded-xl border border-[#1a1a1a] [html[data-theme='light']_&]:border-line bg-[#0a0a0a] [html[data-theme='light']_&]:bg-panel p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#00FF88] [html[data-theme='light']_&]:text-[var(--study-accent)]">
                  Engineering Scenario
                </h3>
                {content.statement.oa_story && content.statement.clean && (
                  <button
                    type="button"
                    onClick={() => setShowFormalSpec((prev) => !prev)}
                    className="min-h-[32px] rounded-md border border-[#1a1a1a] [html[data-theme='light']_&]:border-line px-2.5 py-1 font-mono text-xs text-muted hover:text-chalk focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FF88]"
                  >
                    {showFormalSpec ? 'Show Incident Context' : 'Show Formal Core'}
                  </button>
                )}
              </div>

              <div className="text-sm leading-relaxed text-chalk">
                <Markdown>
                  {showFormalSpec || !content.statement.oa_story
                    ? content.statement.clean
                    : content.statement.oa_story}
                </Markdown>
              </div>

              {firstExample && (
                <div className="rounded-lg border border-[#1a1a1a] [html[data-theme='light']_&]:border-line bg-[#080808] [html[data-theme='light']_&]:bg-panel-2 px-3.5 py-2.5 font-mono text-xs space-y-1">
                  <div>
                    <span className="text-faint">Input: </span>
                    <span className="text-chalk">{firstExample.input}</span>
                  </div>
                  <div>
                    <span className="text-faint">Output: </span>
                    <span className="text-[#00FF88] [html[data-theme='light']_&]:text-[var(--study-accent)]">
                      {firstExample.output}
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* Naive Brute Force Failure Mode */}
            <section className="rounded-xl border border-[#1a1a1a] [html[data-theme='light']_&]:border-line bg-[#0a0a0a] [html[data-theme='light']_&]:bg-panel p-5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-amber">
                  Why Naive Approach Fails
                </h3>
                <code className="rounded border border-amber/30 bg-amber/10 px-2 py-0.5 font-mono text-xs text-amber">
                  {content.concept.brute_force_complexity}
                </code>
              </div>
              <div className="text-sm leading-relaxed text-muted">
                <Markdown>{content.concept.brute_force}</Markdown>
              </div>
              {content.statement.constraints[0] && (
                <p className="pt-1 font-mono text-xs text-faint">
                  Constraint ceiling: {content.statement.constraints.slice(0, 2).join(' · ')}
                </p>
              )}
            </section>

            {/* Core Invariant */}
            <section className="rounded-xl border border-[#00FF88]/30 bg-[#00FF88]/[0.04] [html[data-theme='light']_&]:border-[var(--study-accent)]/35 [html[data-theme='light']_&]:bg-[var(--study-accent)]/[0.05] p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#00FF88] [html[data-theme='light']_&]:text-[var(--study-accent)]">
                  Core Invariant
                </h3>
                <span className="font-mono text-xs text-muted">
                  Target: {timeComplexity} · {spaceComplexity}
                </span>
              </div>
              <div className="text-sm leading-relaxed text-chalk">
                <Markdown>{content.concept.key_insight}</Markdown>
              </div>
            </section>

            {/* Blueprint Navigation CTA */}
            <footer className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1a1a1a] [html[data-theme='light']_&]:border-line">
              {freeAccess ? (
                <button
                  type="button"
                  onClick={() => onSelectStage(3)}
                  className="min-h-[44px] rounded-lg border border-[#1a1a1a] [html[data-theme='light']_&]:border-line px-4 py-2 text-xs font-medium text-muted hover:text-chalk focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FF88]"
                >
                  Open Verification Arena
                </button>
              ) : (
                <span className="text-xs text-faint">
                  Next: validate your mental model on a paused runtime frame.
                </span>
              )}

              <button
                type="button"
                onClick={onProceedToCheckpoint}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#00FF88] px-5 py-2.5 text-sm font-semibold text-[#050806] transition-transform duration-150 hover:bg-[#00e67a] active:scale-[0.98] [html[data-theme='light']_&]:bg-[var(--study-accent)] [html[data-theme='light']_&]:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FF88]"
              >
                <span>Proceed to Mental Checkpoint</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* STAGE 2: Mental Checkpoint */}
      {studioStage === 2 && (
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-6 sm:px-7">
          <div className="mx-auto max-w-[68ch] space-y-5">
            <header className="space-y-2">
              <h2 className="font-plate text-2xl font-semibold tracking-tight text-chalk">
                Mental Checkpoint
              </h2>
              <p className="text-sm leading-relaxed text-muted">
                Inspect the paused execution state on the left pane, then predict what the invariant requires next.
              </p>
            </header>

            {/* Sync Banner Linked to Left Paused Frame */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#00FF88]/30 bg-[#00FF88]/[0.05] [html[data-theme='light']_&]:border-[var(--study-accent)]/30 [html[data-theme='light']_&]:bg-[var(--study-accent)]/[0.06] px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#00FF88] [html[data-theme='light']_&]:text-[var(--study-accent)]">
                <PauseCircle size={15} aria-hidden="true" />
                <span>
                  Left Visual Anchor paused at Step {pausedStepIndex + 1} of{' '}
                  {Math.max(1, totalSteps)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onFocusCheckpointTrace}
                  className="min-h-[36px] rounded-md border border-[#00FF88]/35 px-3 py-1 text-xs font-medium text-[#00FF88] hover:bg-[#00FF88]/10 [html[data-theme='light']_&]:border-[var(--study-accent)]/40 [html[data-theme='light']_&]:text-[var(--study-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FF88]"
                >
                  Focus Frame
                </button>
                <button
                  type="button"
                  onClick={onReplayToCheckpoint}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[#1a1a1a] [html[data-theme='light']_&]:border-line bg-[#0a0a0a] [html[data-theme='light']_&]:bg-panel px-3 py-1 text-xs font-medium text-muted hover:text-chalk focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FF88]"
                >
                  <Play size={12} aria-hidden="true" />
                  <span>Replay</span>
                </button>
              </div>
            </div>

            {/* Interactive Prediction Quiz */}
            {checkpoint ? (
              <section className="rounded-xl border border-[#1a1a1a] [html[data-theme='light']_&]:border-line bg-[#0a0a0a] [html[data-theme='light']_&]:bg-panel p-5 space-y-4">
                <div className="space-y-1.5">
                  <span className="font-mono text-xs uppercase tracking-wider text-faint">
                    {checkpoint.title}
                  </span>
                  <div className="text-base font-medium leading-relaxed text-chalk">
                    <Markdown>{checkpoint.prompt}</Markdown>
                  </div>
                </div>

                <div className="space-y-2.5" role="radiogroup" aria-label="Checkpoint prediction">
                  {checkpoint.choices.map((choice, idx) => {
                    const isPicked = pickedChoiceId === choice.id
                    const stateClass = isPicked
                      ? choice.isCorrect
                        ? 'border-[#00FF88] bg-[#00FF88]/10 text-chalk'
                        : 'border-crimson/70 bg-crimson/10 text-chalk'
                      : 'border-[#1a1a1a] [html[data-theme=\'light\']_&]:border-line bg-[#080808] [html[data-theme=\'light\']_&]:bg-panel-2 text-muted hover:border-white/25 hover:text-chalk'

                    return (
                      <button
                        key={choice.id}
                        type="button"
                        role="radio"
                        aria-checked={isPicked}
                        onClick={() => setPickedChoiceId(choice.id)}
                        className={`flex w-full min-h-[48px] items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FF88] ${stateClass}`}
                      >
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border font-mono text-xs ${
                            isPicked && choice.isCorrect
                              ? 'border-[#00FF88] bg-[#00FF88] text-[#050806] font-bold'
                              : isPicked && !choice.isCorrect
                                ? 'border-crimson bg-crimson text-white font-bold'
                                : 'border-white/15 [html[data-theme=\'light\']_&]:border-line text-faint'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 leading-relaxed">{choice.label}</span>
                        {isPicked && choice.isCorrect && (
                          <CheckCircle2
                            size={18}
                            className="mt-0.5 shrink-0 text-[#00FF88]"
                            aria-hidden="true"
                          />
                        )}
                        {isPicked && !choice.isCorrect && (
                          <XCircle
                            size={18}
                            className="mt-0.5 shrink-0 text-crimson"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    )
                  })}
                </div>

                {selectedChoice && (
                  <div
                    role="status"
                    className={`rounded-lg border p-4 text-sm leading-relaxed space-y-2 ${
                      isChoiceCorrect
                        ? 'border-[#00FF88]/40 bg-[#00FF88]/[0.06] text-chalk'
                        : 'border-amber/40 bg-amber/[0.06] text-chalk'
                    }`}
                  >
                    <strong
                      className={`block font-mono text-xs uppercase tracking-wider ${
                        isChoiceCorrect ? 'text-[#00FF88]' : 'text-amber'
                      }`}
                    >
                      {isChoiceCorrect ? 'Invariant Confirmed' : 'Inspect the Distinction'}
                    </strong>
                    {selectedChoice.explanation && (
                      <Markdown>{selectedChoice.explanation}</Markdown>
                    )}
                    {checkpoint.revealedExplanation &&
                      checkpoint.revealedExplanation !== selectedChoice.explanation && (
                        <div className="text-xs text-muted pt-1">
                          <Markdown>{checkpoint.revealedExplanation}</Markdown>
                        </div>
                      )}
                  </div>
                )}
              </section>
            ) : null}

            {/* Optional Extra Sanity Check */}
            {secondaryQuiz && (
              <details className="rounded-xl border border-[#1a1a1a] [html[data-theme='light']_&]:border-line bg-[#0a0a0a] [html[data-theme='light']_&]:bg-panel px-5 py-3.5 text-sm">
                <summary className="cursor-pointer font-medium text-chalk select-none">
                  Optional Constraints Sanity Check
                </summary>
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-muted">{secondaryQuiz.prompt}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {secondaryQuiz.options.map((opt, idx) => {
                      const picked = extraQuizPicked === idx
                      const right = picked && idx === secondaryQuiz.answer
                      const wrong = picked && idx !== secondaryQuiz.answer
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setExtraQuizPicked(idx)}
                          className={`min-h-[44px] rounded-md border px-3 py-2 text-left font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-[#00FF88] ${
                            right
                              ? 'border-[#00FF88] bg-[#00FF88]/10 text-chalk'
                              : wrong
                                ? 'border-crimson bg-crimson/10 text-chalk'
                                : 'border-[#1a1a1a] [html[data-theme=\'light\']_&]:border-line text-muted hover:text-chalk'
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                  {extraQuizPicked !== null && (
                    <p className="text-xs text-muted">{secondaryQuiz.explanation}</p>
                  )}
                </div>
              </details>
            )}

            {/* Unlock Editor CTA */}
            <footer className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1a1a1a] [html[data-theme='light']_&]:border-line">
              <button
                type="button"
                onClick={() => onSelectStage(1)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#1a1a1a] [html[data-theme='light']_&]:border-line px-4 py-2 text-xs font-medium text-muted hover:text-chalk focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FF88]"
              >
                <RotateCcw size={13} aria-hidden="true" />
                <span>Revisit Blueprint</span>
              </button>

              <button
                type="button"
                disabled={!canProceedToArena}
                onClick={() => onUnlockArena(isChoiceCorrect)}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#00FF88] px-5 py-2.5 text-sm font-semibold text-[#050806] transition-transform duration-150 hover:bg-[#00e67a] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 [html[data-theme='light']_&]:bg-[var(--study-accent)] [html[data-theme='light']_&]:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FF88]"
              >
                <span>
                  {arenaUnlocked || freeAccess
                    ? 'Enter Verification Arena'
                    : 'Unlock Verification Arena'}
                </span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* STAGE 3: Verification Arena (Monaco + Assert Test Runners) */}
      {studioStage === 3 && <div className="flex-1 min-h-0 flex flex-col">{children}</div>}
    </section>
  )
}
