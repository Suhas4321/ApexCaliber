import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, LockKeyhole } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { LearningPath } from '../api/learningTypes'
import { ErrorNote, Skeleton } from '../components/ui'
import { getCitadel } from '../lib/citadels'

export default function LearningPathPage() {
  const { citadelId = '' } = useParams()
  const [path, setPath] = useState<LearningPath | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({})
  useEffect(() => {
    let active = true
    setPath(null)
    setError(null)
    setOpenModules({})
    api.learningPath(citadelId).then((item) => { if (active) setPath(item) }).catch((e) => { if (active) setError(e.message) })
    return () => { active = false }
  }, [citadelId])
  const citadel = getCitadel(citadelId)

  if (error) return <div className="shell py-8"><ErrorNote message={error} /></div>
  if (!path || path.citadel_id !== citadelId) return <div className="shell py-8"><Skeleton className="h-64 rounded-2xl" /></div>
  const lessons = path.modules.flatMap((module) => module.lessons)
  const done = lessons.filter((lesson) => lesson.mastered).length
  const nextLesson = lessons.find((lesson) => lesson.ready && !lesson.mastered)

  return <div className="study-page study-reading study-syllabus space-y-8">
    <header className="space-y-4">
      <Link to={`/citadel/${citadelId}`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-chalk"><ArrowLeft size={16} /> Back to {citadel.shortName}</Link>
      <div className="study-panel">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-cyan"><BookOpen size={16} /> Lessons</div>
        <h1 className="mt-3 font-plate text-3xl font-semibold text-chalk">{citadel.shortName}: start with the foundations</h1>
        <p className="mt-2 max-w-2xl text-muted">One small idea at a time. See it in a real situation, work through an example, then check your understanding.</p>
        <div className="mt-6 flex items-center gap-4"><div role="progressbar" aria-label={`${citadel.shortName} concept progress`} aria-valuenow={done} aria-valuemin={0} aria-valuemax={lessons.length} className="h-2 flex-1 overflow-hidden rounded-full bg-panel-3"><div className="h-full rounded-full bg-cyan" style={{ width: `${lessons.length ? done / lessons.length * 100 : 0}%` }} /></div><span className="text-sm text-muted">{done} of {lessons.length} concepts</span></div>
        {nextLesson ? <Link to={`/lesson/${nextLesson.id}`} className="study-button mt-5">Continue: {nextLesson.title} <ArrowRight size={16} /></Link> : lessons.length > 0 && done === lessons.length ? <p className="mt-5 text-sm font-semibold text-success">Route complete. Revisit any lesson or try a practice challenge.</p> : null}
      </div>
    </header>

    {path.modules.map((module) => <details key={module.id} className="group study-list-panel" open={openModules[module.id] ?? (module.lessons.some((lesson) => lesson.id === nextLesson?.id) || (done === lessons.length && module.position === 1))} onToggle={(event) => { const isOpen = event.currentTarget.open; setOpenModules((current) => ({ ...current, [module.id]: isOpen })) }}>
      <summary className="cursor-pointer list-none rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan [&::-webkit-details-marker]:hidden"><div className="flex items-center justify-between gap-4"><div><div className="text-xs uppercase tracking-widest text-cyan">Module {module.position} · {module.lessons.filter((lesson) => lesson.mastered).length}/{module.lessons.length} concepts</div><h2 className="mt-1 font-plate text-2xl font-semibold text-chalk">{module.title}</h2><p className="mt-1 text-sm text-muted">{module.summary}</p></div><span className="shrink-0 text-sm font-semibold text-cyan group-open:rotate-90">›</span></div></summary>
      <div className="mt-5 space-y-4">
      <ol className="grid gap-3">
        {module.lessons.map((lesson) => <li key={lesson.id}>
          {lesson.ready ? <Link to={`/lesson/${lesson.id}`} className="group flex items-center gap-4 rounded-lg border border-line bg-panel p-4 transition-colors hover:border-line-strong hover:bg-panel-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan/10 text-cyan">{lesson.mastered ? <CheckCircle2 size={20} /> : String(lesson.position).padStart(2, '0')}</span>
            <span className="min-w-0 flex-1"><span className="block font-semibold text-chalk">{lesson.title}</span><span className="block text-sm text-muted">{lesson.summary}</span></span><ArrowRight size={18} className="text-faint group-hover:text-cyan" />
          </Link> : <div className="flex items-center gap-4 rounded-lg border border-line bg-panel-2 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-panel-3 text-muted"><LockKeyhole size={17} /></span><span><span className="block font-semibold text-chalk">{lesson.title}</span><span className="block text-sm text-muted">First learn {lesson.prerequisite_details.filter((parent) => !parent.mastered).map((parent, index) => <span key={parent.id}>{index > 0 ? ', ' : ''}<Link to={`/lesson/${parent.id}`} className="text-cyan underline hover:text-chalk">{parent.title}</Link></span>)}</span></span></div>}
        </li>)}
      </ol>
      {module.completed && module.practice_challenges.length > 0 && <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <h3 className="font-plate text-xl font-semibold text-chalk">Now apply these ideas</h3>
        <p className="mt-1 text-sm text-muted">These questions use concepts from this module. Pick one and try it in a new setting.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">{module.practice_challenges.map((challenge) => <li key={challenge.slug}><Link to={`/q/${challenge.slug}`} className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-line bg-panel px-4 py-3 text-sm font-medium text-chalk transition-colors hover:border-cyan/50 hover:bg-panel-2">{challenge.title}<ArrowRight size={16} className="shrink-0 text-cyan" /></Link></li>)}</ul>
      </section>}
      {module.cue_card && <div className="rounded-2xl border border-cyan/30 bg-cyan/5 p-5 space-y-4">
        <div><div className="text-xs uppercase tracking-widest text-cyan">High-yield interview playbook</div><h3 className="mt-1 font-plate text-xl text-chalk">Say it clearly, then show the mechanism</h3></div>
        <p className="text-chalk">{module.cue_card.elevator_pitch}</p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted">{module.cue_card.pillars.map((item) => <li key={item}>{item}</li>)}</ul>
        <p className="text-sm text-muted"><strong className="text-chalk">Tradeoffs:</strong> {module.cue_card.tradeoffs.join(' ')}</p>
        <p className="text-sm text-muted"><strong className="text-chalk">Common trap:</strong> {module.cue_card.candidate_trap}</p>
      </div>}
      </div>
    </details>)}
    <Link to={`/citadel/${citadelId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan hover:text-chalk">Explore practice challenges <ArrowRight size={16} /></Link>
  </div>
}
