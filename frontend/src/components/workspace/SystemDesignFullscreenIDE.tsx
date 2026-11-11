import { ArrowRight, CheckCircle2, HelpCircle, Minimize2, Play, RotateCcw, XCircle } from 'lucide-react'
import { useState } from 'react'
import type { SystemDesignAssignmentSpec } from '../../lib/systemDesignAssignments'
import ChatGPTCodeBlock from '../ChatGPTCodeBlock'
import CodeEditor from '../CodeEditor'

export interface TestRunOutcome {
  label: string
  args: unknown[]
  expected: unknown
  actual: unknown
  passed: boolean
  error?: string | null
}

interface Props {
  spec: SystemDesignAssignmentSpec
  stepNumber: number
  code: string
  onCodeChange: (code: string) => void
  running: boolean
  onRunTests: () => void
  outcomes: TestRunOutcome[] | null
  compileErr: string | null
  hasPassed: boolean
  onClose: () => void
  onNextLesson?: () => void
  onReset: () => void
}

export default function SystemDesignFullscreenIDE({
  spec,
  stepNumber,
  code,
  onCodeChange,
  running,
  onRunTests,
  outcomes,
  compileErr,
  hasPassed,
  onClose,
  onNextLesson,
  onReset,
}: Props) {
  const [showHint, setShowHint] = useState(false)
  const allPassed = outcomes !== null && outcomes.length > 0 && outcomes.every((o) => o.passed)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-void text-chalk" data-zone="night">
      <header className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line bg-panel px-4 py-1.5 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-cyan/30 bg-cyan/15 font-mono text-xs font-semibold text-cyan">
            {stepNumber}
          </span>
          <span className="font-plate text-sm font-bold text-chalk truncate max-w-sm">
            {spec.scenarioTitle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHint((h) => !h)}
            className="inline-flex items-center gap-1 rounded border border-line bg-panel-2 px-2.5 py-1 text-xs text-muted hover:text-chalk"
          >
            <HelpCircle size={12} />
            <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
          </button>
          <button
            type="button"
            onClick={() => onCodeChange(spec.solutionCode)}
            className="rounded border border-line bg-panel-2 px-2.5 py-1 text-xs text-muted hover:text-chalk"
          >
            Solution
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded border border-line bg-panel-2 px-2.5 py-1 text-xs text-muted hover:text-chalk"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
          <button
            type="button"
            disabled={running}
            onClick={onRunTests}
            className="inline-flex items-center gap-1.5 rounded bg-emerald px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-50"
          >
            <Play size={12} />
            <span>{running ? 'Running…' : 'Run Tests'}</span>
          </button>
          {hasPassed && onNextLesson && (
            <button
              type="button"
              onClick={() => { onClose(); onNextLesson() }}
              className="inline-flex items-center gap-1.5 rounded bg-action px-3 py-1.5 text-xs font-semibold text-[var(--study-on-accent)] hover:bg-action-hi active:scale-[0.985] transition-[transform,background-color]"
            >
              <span>Next</span>
              <ArrowRight size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded border border-line bg-panel px-2.5 py-1.5 text-xs text-chalk hover:bg-panel-2"
          >
            <Minimize2 size={13} />
            <span>Exit Fullscreen</span>
          </button>
        </div>
      </header>

      {/* Main Split Body */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 w-full overflow-y-auto lg:overflow-hidden">
        {/* Left Column */}
        <div className="w-full lg:w-[420px] shrink-0 border-b lg:border-b-0 lg:border-r border-line bg-panel overflow-y-auto p-5 space-y-4">
          <div className="font-mono text-2xs uppercase tracking-wider text-cyan font-semibold">
            Assignment
          </div>
          <h3 className="text-base font-bold text-chalk">{spec.scenarioTitle}</h3>
          <p className="text-sm leading-relaxed text-muted">{spec.scenarioPrompt}</p>

          {showHint && (
            <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              <span className="font-semibold text-amber-400 block mb-1">Architecture Hint</span>
              <p>{spec.hint}</p>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-line">
            <div className="font-mono text-2xs uppercase tracking-wider text-muted font-semibold">
              Reference: {spec.workedExampleTitle}
            </div>
            <ChatGPTCodeBlock code={spec.workedExampleCode} language="python" />
          </div>
        </div>

        {/* Right Column: Editor & Test Results */}
        <div className="flex-1 min-w-0 flex flex-col bg-void overflow-hidden min-h-[360px]">
          <div className="flex-1 min-h-0 w-full">
            <CodeEditor value={code} onChange={onCodeChange} height="100%" />
          </div>

          {(outcomes || compileErr) && (
            <div className="h-44 shrink-0 border-t border-line bg-panel-2 overflow-y-auto p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="font-mono uppercase text-muted">Test Execution</span>
                {allPassed ? (
                  <span className="font-mono text-emerald flex items-center gap-1">
                    <CheckCircle2 size={13} /> All Tests Passed ({outcomes?.length}/{outcomes?.length})
                  </span>
                ) : (
                  <span className="font-mono text-crimson flex items-center gap-1">
                    <XCircle size={13} /> Test Failures
                  </span>
                )}
              </div>
              {compileErr && <div className="rounded p-2 text-xs text-crimson bg-crimson/10 font-mono">{compileErr}</div>}
              {outcomes && (
                <div className="rounded border border-line bg-panel-2 overflow-hidden text-xs">
                  {outcomes.map((o, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border-b border-line last:border-none">
                      <span className="font-medium text-chalk">{o.label}</span>
                      <span className="font-mono text-muted text-2xs truncate max-w-xs">{JSON.stringify(o.actual)}</span>
                      {o.passed ? <span className="text-emerald font-semibold">Pass</span> : <span className="text-crimson font-semibold">Fail</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
