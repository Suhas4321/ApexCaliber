import StudyGuideLayout from './StudyGuideLayout'
import { Clock, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import type { Progress, QuestionDetail } from '../../api/types'
import { LeetCodeLink, Markdown, formatRelative } from '../ui'

interface Props {
  question: QuestionDetail
  progress: Progress
  onProgress: (p: Progress) => void
  onOpenTerminal?: () => void
}

interface ParsedPitchStep {
  tag: string
  text: string
}

function parsePitchScript(raw: string): ParsedPitchStep[] {
  const blocks = raw
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
  const out: ParsedPitchStep[] = []
  for (const b of blocks) {
    const m = /^\*\*\(([^)]+)\)\*\*\s*([\s\S]*)$/.exec(b)
    if (m) {
      out.push({ tag: m[1].trim(), text: m[2].trim().replace(/^"|"$/g, '') })
    } else {
      out.push({ tag: 'Step', text: b.replace(/^"|"$/g, '') })
    }
  }
  return out
}

const leetcodeUrl = (title: string) =>
  `https://leetcode.com/problems/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}/`

const CONFIDENCE_OPTIONS = [
  { value: 1, label: 'Struggled (Review in 3d)' },
  { value: 2, label: 'Needed Hints (Review in 7d)' },
  { value: 3, label: 'Solid (Review in 21d)' },
]

export default function InterviewAnswerPlaybook({ question, progress, onProgress, onOpenTerminal }: Props) {
  const content = question.content!
  const steps = useMemo(() => parsePitchScript(content.pitch_script), [content.pitch_script])

  const [timerSec, setTimerSec] = useState(60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [answerRevealed, setAnswerRevealed] = useState(() => progress.solved || progress.studied_solution)
  const [revealError, setRevealError] = useState(false)

  useEffect(() => {
    if (!timerRunning) return
    const id = window.setTimeout(() => {
      setTimerSec(Math.max(0, timerSec - 1))
      if (timerSec <= 1) setTimerRunning(false)
    }, 1000)
    return () => window.clearTimeout(id)
  }, [timerRunning, timerSec])

  const rateConfidence = async (val: number) => {
    try {
      if (!progress.solved && !progress.studied_solution) {
        await api.patchProgress(question.slug, { studied_solution: true })
      }
      const next = await api.rate(question.slug, val)
      onProgress(next)
    } catch {
      /* ignore */
    }
  }

  const clarifyStep = steps.find((s) => /clarify/i.test(s.tag))
  const bruteStep = steps.find((s) => /brute|basement/i.test(s.tag))
  const triggerStep = steps.find((s) => /trigger/i.test(s.tag))
  const optimalStep = steps.find((s) => /optimal|solution/i.test(s.tag))
  const complexityStep = steps.find((s) => /complexity/i.test(s.tag))

  if (!answerRevealed) return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col justify-center gap-5 px-6 py-12 text-chalk">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">Interview rehearsal</span>
      <h2 className="text-3xl font-semibold">Explain your approach first.</h2>
      <p className="max-w-2xl text-base leading-relaxed text-muted">Try describing the problem, your first solution, a better approach, and its trade-offs. The reference answer includes the solution code, so reveal it when you are ready to compare.</p>
      <div className="flex flex-wrap gap-3">
        {onOpenTerminal && <button type="button" className="rounded-lg border border-line-strong bg-panel px-4 py-2.5 text-sm font-medium hover:bg-panel-2" onClick={onOpenTerminal}>Practice in the editor</button>}
        <button type="button" className="rounded-lg bg-action px-4 py-2.5 text-sm font-semibold text-void" onClick={async () => {
          try {
            const next = await api.patchProgress(question.slug, { studied_solution: true })
            onProgress(next)
            setAnswerRevealed(true)
          } catch { setRevealError(true) }
        }}>Reveal reference answer</button>
      </div>
      {revealError && <p role="alert" className="text-sm text-crimson">Could not save that you studied the answer. Please try again.</p>}
    </main>
  )

  return (
    <StudyGuideLayout
      title={question.title}
      label="Interview guide"
      introduction={"Start with the constraints, explain your approach, then justify its cost. Use the timer to rehearse each part aloud."}
      onPractice={onOpenTerminal}
      tools={<div className="flex items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-1 font-mono text-xs">
              <Clock size={13} className="text-muted" />
              <span className="font-semibold text-chalk tabular-nums">{Math.floor(timerSec / 60)}:{String(timerSec % 60).padStart(2, '0')}</span>
              <button
                type="button"
                onClick={() => {
                  if (timerSec === 0) setTimerSec(60)
                  setTimerRunning((r) => !r)
                }}
                className="rounded bg-panel-3 px-2 py-0.5 text-[11px] font-medium text-chalk hover:opacity-90"
              >
                {timerRunning ? 'Pause' : '60s Pacer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false)
                  setTimerSec(60)
                }}
                className="text-muted hover:text-chalk"
                title="Reset 60s timer"
                aria-label="Reset 60s timer"
              >
                <RotateCcw size={12} />
              </button>
            </div>}
      sections={[
        { id: "section-1", title: "Clarify the problem", content: (
          <section className="border-b border-line py-7">
        <p className="text-sm leading-relaxed text-muted mb-3">
          Before writing any code, ask these clarifying questions in the first 15 seconds to confirm input bounds and edge cases:
        </p>
        <blockquote className="rounded-r-md border-l-[3px] border-muted/60 bg-panel px-4 py-3.5 text-sm leading-relaxed text-chalk">
          "{clarifyStep?.text || 'Just to confirm: what are the input size bounds, can the input be empty or contain duplicates, and am I allowed to use auxiliary memory?'}"
        </blockquote>
      </section>
        ) },
        { id: "section-2", title: "Build your approach", content: (
          <section className="border-b border-line py-7 space-y-4">

        <div className="space-y-2 text-sm leading-relaxed text-muted">
          <p>
            <strong className="font-semibold text-chalk">
              Baseline Brute Force ({content.concept.brute_force_complexity.split('—')[0].trim()}):
            </strong>{' '}
            {bruteStep?.text || content.concept.brute_force}
          </p>
          <p>
            <strong className="font-semibold text-chalk">
              Trigger Signal & Optimal Idea ({question.patterns.join(', ')}):
            </strong>{' '}
            {triggerStep?.text || content.concept.key_insight}
          </p>
        </div>

        <blockquote className="rounded-r-md border-l-[3px] border-muted/60 bg-panel px-4 py-3.5 text-sm leading-relaxed text-chalk">
          "{optimalStep?.text || content.concept.key_insight}"
        </blockquote>
      </section>
        ) },
        { id: "section-3", title: "Prove the complexity", content: (
          <section className="border-b border-line py-7">
        <p className="text-sm leading-relaxed text-muted mb-4">
          {complexityStep?.text || 'State both Time and Space bounds explicitly and justify how they are derived from your loops and data structures:'}
        </p>

        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-panel text-xs font-semibold text-muted">
                <th className="py-2.5 px-4 w-44">Metric</th>
                <th className="py-2.5 px-4 w-36">Bound</th>
                <th className="py-2.5 px-4">Step-by-Step Derivation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-sm">
              <tr>
                <td className="py-3 px-4 font-medium text-chalk">Time Complexity</td>
                <td className="py-3 px-4 font-mono text-xs text-chalk">
                  <code className="rounded border border-line bg-panel-2 px-1.5 py-0.5">
                    {content.solution.time.split(' — ')[0]}
                  </code>
                </td>
                <td className="py-3 px-4 text-muted">
                  {content.solution.time.includes(' — ') ? content.solution.time.split(' — ')[1] : content.solution.time}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-chalk">Space Complexity</td>
                <td className="py-3 px-4 font-mono text-xs text-chalk">
                  <code className="rounded border border-line bg-panel-2 px-1.5 py-0.5">
                    {content.solution.space.split(' — ')[0]}
                  </code>
                </td>
                <td className="py-3 px-4 text-muted">
                  {content.solution.space.includes(' — ') ? content.solution.space.split(' — ')[1] : content.solution.space}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
        ) },
        { id: "section-4", title: "Review & rehearse", content: (
          <section className="py-7 space-y-6">

        <pre className="overflow-x-auto rounded-md border border-line bg-panel p-4 font-mono text-xs leading-relaxed text-chalk">
          {content.solution.code}
        </pre>

        <div className="prose-forge text-sm leading-relaxed text-muted">
          <Markdown>{content.solution.explanation}</Markdown>
        </div>

        {/* Follow-Up Variation */}
        <div className="rounded-md border border-line bg-panel p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Common Interview Follow-Up Variation
            </span>
            {question.citadel_id === 'dsa' && <LeetCodeLink lc={content.twist.lc} url={leetcodeUrl(content.twist.title)} showLabel />}
          </div>
          <div className="text-sm font-semibold text-chalk">{content.twist.title}</div>
          <div className="text-sm leading-relaxed text-muted">
            <Markdown>{content.twist.why}</Markdown>
          </div>
        </div>

        {/* Minimal Monochrome Spaced Repetition Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-panel px-4 py-3 text-xs">
          <div className="text-muted">
            <strong className="text-chalk font-semibold">Spaced Repetition Schedule:</strong>{' '}
            {progress.next_review_at ? `Next review ${formatRelative(progress.next_review_at)}` : 'Select when to review this problem again'}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CONFIDENCE_OPTIONS.map((opt) => {
              const active = progress.confidence === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => rateConfidence(opt.value)}
                  className={`rounded px-2.5 py-1 font-medium transition-colors border ${
                    active
                      ? 'border-chalk bg-chalk text-void font-semibold'
                      : 'border-line bg-panel-2 text-muted hover:text-chalk'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>
        ) },
      ]}
    />
  )
}
