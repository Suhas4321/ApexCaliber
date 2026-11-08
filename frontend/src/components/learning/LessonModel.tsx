import { ArrowLeft, ArrowRight, GitMerge, Split, Waypoints } from 'lucide-react'
import { useState } from 'react'
import type { LessonVisual } from '../../api/learningTypes'

/** A deliberately manual model: each click reveals one causal change, with no timed playback. */
export default function LessonModel({ visual }: { visual: LessonVisual }) {
  const [trackIndex, setTrackIndex] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const track = visual.tracks[trackIndex]
  const step = track.steps[stepIndex]

  function chooseTrack(index: number) {
    setTrackIndex(index)
    setStepIndex(0)
  }

  return <section className="overflow-hidden rounded-2xl border border-cyan/25 bg-panel" aria-label={visual.title}>
    <div className="border-b border-line px-5 py-5 sm:px-6">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-cyan">
        {visual.kind === 'race' ? <Split size={16} /> : visual.kind === 'join' ? <GitMerge size={16} /> : <Waypoints size={16} />} Step-through model
      </div>
      <h2 className="mt-2 font-plate text-2xl font-semibold text-chalk">{visual.title}</h2>
      <p className="mt-1 text-sm text-muted">Choose a path, then move one action at a time. Compare what changes.</p>
    </div>

    <div className="flex flex-wrap gap-2 px-5 pt-5 sm:px-6" role="group" aria-label="Compare outcomes">
      {visual.tracks.map((option, index) => <button
        key={option.id}
        type="button"
        aria-pressed={index === trackIndex}
        onClick={() => chooseTrack(index)}
        className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors ${index === trackIndex ? 'border-cyan/60 bg-cyan/10 text-chalk' : 'border-line bg-panel-2 text-muted hover:border-line-strong hover:text-chalk'}`}
      >{option.title}</button>)}
    </div>

    <div className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3 text-xs text-muted">
        <span>{track.title}</span>
        <span className="font-mono">Action {stepIndex + 1} / {track.steps.length}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-panel-3" aria-hidden="true"><div className="h-full rounded-full bg-cyan transition-[width] duration-200" style={{ width: `${(stepIndex + 1) / track.steps.length * 100}%` }} /></div>

      <div className="mt-5 rounded-xl border border-line bg-ink/60 p-4" aria-live="polite" aria-atomic="true">
        <h3 className="font-semibold text-chalk">{step.label}</h3>
        <p className="mt-2 leading-6 text-muted">{step.explanation}</p>
      </div>
      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        {Object.entries(step.state).map(([label, value]) => <div key={label} className="min-w-0 rounded-xl border border-line bg-panel-2 p-4"><dt className="text-xs uppercase tracking-wide text-muted">{label}</dt><dd className="mt-2 break-words text-sm font-semibold leading-6 text-chalk">{value}</dd></div>)}
      </dl>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button type="button" disabled={stepIndex === 0} onClick={() => setStepIndex((current) => current - 1)} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm text-chalk transition-colors hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-40"><ArrowLeft size={15} /> Previous action</button>
        <button type="button" disabled={stepIndex === track.steps.length - 1} onClick={() => setStepIndex((current) => current + 1)} className="inline-flex items-center gap-2 rounded-xl bg-cyan px-4 py-2 text-sm font-semibold text-[#06121a] transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">Next action <ArrowRight size={15} /></button>
      </div>
    </div>
  </section>
}
