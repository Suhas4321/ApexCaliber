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
  useEffect(() => {
    api.learningPath(citadelId).then(setPath).catch((e) => setError(e.message))
  }, [citadelId])
  const citadel = getCitadel(citadelId)

  if (error) return <div className="shell py-8"><ErrorNote message={error} /></div>
  if (!path) return <div className="shell py-8"><Skeleton className="h-64 rounded-2xl" /></div>
  const lessons = path.modules.flatMap((module) => module.lessons)
  const done = lessons.filter((lesson) => lesson.mastered).length

  return <div className="shell max-w-5xl py-8 space-y-8">
    <header className="space-y-4">
      <Link to={`/citadel/${citadelId}`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-chalk"><ArrowLeft size={16} /> Back to {citadel.shortName}</Link>
      <div className="rounded-3xl border border-line bg-panel p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-cyan"><BookOpen size={16} /> Concept route</div>
        <h1 className="mt-3 font-plate text-3xl font-semibold text-chalk">Start with the foundations</h1>
        <p className="mt-2 max-w-2xl text-muted">One small idea at a time. See it in a real situation, work through an example, then check your understanding.</p>
        <div className="mt-6 flex items-center gap-4"><div className="h-2 flex-1 rounded-full bg-panel-3 overflow-hidden"><div className="h-full rounded-full bg-cyan" style={{ width: `${lessons.length ? done / lessons.length * 100 : 0}%` }} /></div><span className="text-sm text-muted">{done} of {lessons.length} concepts</span></div>
      </div>
    </header>

    {path.modules.map((module) => <section key={module.id} className="space-y-4" aria-labelledby={`${module.id}-heading`}>
      <div><div className="text-xs uppercase tracking-widest text-cyan">Module {module.position}</div><h2 id={`${module.id}-heading`} className="mt-1 font-plate text-2xl font-semibold text-chalk">{module.title}</h2><p className="mt-1 text-sm text-muted">{module.summary}</p></div>
      <ol className="grid gap-3">
        {module.lessons.map((lesson) => <li key={lesson.id}>
          {lesson.ready ? <Link to={`/lesson/${lesson.id}`} className="group flex items-center gap-4 rounded-2xl border border-line bg-panel p-4 transition-colors hover:border-cyan/50 hover:bg-panel-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan/10 text-cyan">{lesson.mastered ? <CheckCircle2 size={20} /> : String(lesson.position).padStart(2, '0')}</span>
            <span className="min-w-0 flex-1"><span className="block font-semibold text-chalk">{lesson.title}</span><span className="block text-sm text-muted">{lesson.summary}</span></span><ArrowRight size={18} className="text-faint group-hover:text-cyan" />
          </Link> : <div className="flex items-center gap-4 rounded-2xl border border-line/70 bg-panel/50 p-4 opacity-65"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-panel-3 text-muted"><LockKeyhole size={17} /></span><span><span className="block font-semibold text-chalk">{lesson.title}</span><span className="block text-sm text-muted">Finish the previous concept first</span></span></div>}
        </li>)}
      </ol>
      {module.cue_card && <div className="rounded-2xl border border-cyan/30 bg-cyan/5 p-5 space-y-4">
        <div><div className="text-xs uppercase tracking-widest text-cyan">High-yield interview playbook</div><h3 className="mt-1 font-plate text-xl text-chalk">Say it clearly, then show the mechanism</h3></div>
        <p className="text-chalk">{module.cue_card.elevator_pitch}</p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted">{module.cue_card.pillars.map((item) => <li key={item}>{item}</li>)}</ul>
        <p className="text-sm text-muted"><strong className="text-chalk">Tradeoffs:</strong> {module.cue_card.tradeoffs.join(' ')}</p>
        <p className="text-sm text-muted"><strong className="text-chalk">Common trap:</strong> {module.cue_card.candidate_trap}</p>
      </div>}
    </section>)}
    <Link to={`/citadel/${citadelId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan hover:text-chalk">Explore practice challenges <ArrowRight size={16} /></Link>
  </div>
}
