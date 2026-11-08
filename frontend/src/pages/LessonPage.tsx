import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { CheckResult, LessonDetail } from '../api/learningTypes'
import { ErrorNote, Skeleton } from '../components/ui'
import LessonModel from '../components/learning/LessonModel'

export default function LessonPage() {
  const { lessonId = '' } = useParams()
  const [search] = useSearchParams()
  const requestedPractice = search.get('practice')
  const practiceSlug = requestedPractice && /^[a-z0-9-]+$/.test(requestedPractice) ? requestedPractice : null
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [results, setResults] = useState<Record<number, CheckResult>>({})
  const [busy, setBusy] = useState<number | null>(null)
  const [phase, setPhase] = useState<0 | 1 | 2>(0)
  const [unlockedPhase, setUnlockedPhase] = useState<0 | 1 | 2>(0)
  const [nextLesson, setNextLesson] = useState<{ id: string; title: string } | null>(null)
  const [practiceLessons, setPracticeLessons] = useState<Array<{ id: string; title: string; mastered: boolean }> | null>(null)
  const [practiceTitle, setPracticeTitle] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    setLesson(null); setAnswers({}); setResults({}); setError(null); setPhase(0); setUnlockedPhase(0); setNextLesson(null); setPracticeLessons(null); setPracticeTitle(null)
    api.lesson(lessonId).then((item) => {
      if (!active) return
      setLesson(item)
      if (practiceSlug) {
        api.question(practiceSlug).then((question) => {
          if (active && question.required_lessons.some((required) => required.id === item.id)) {
            setPracticeLessons(question.required_lessons)
            setPracticeTitle(question.title)
          }
        }).catch(() => {})
      }
      api.learningPath(item.citadel_id).then((path) => {
        if (!active) return
        const ordered = path.modules.flatMap((module) => module.lessons)
        const index = ordered.findIndex((candidate) => candidate.id === item.id)
        const next = index >= 0 ? ordered[index + 1] : null
        if (next) setNextLesson({ id: next.id, title: next.title })
      }).catch(() => {})
    }).catch((e) => { if (active) setError(e.message) })
    return () => { active = false }
  }, [lessonId, practiceSlug])

  function advance(next: 1 | 2) {
    setUnlockedPhase(next)
    setPhase(next)
  }

  async function submit(index: number) {
    if (answers[index] === undefined) return
    setBusy(index)
    try {
      const result = await api.checkLesson(lessonId, index, answers[index])
      setResults((current) => ({ ...current, [index]: result }))
      setLesson((current) => current && ({ ...current, passed_checks: result.passed_checks, mastered: result.mastered }))
      if (result.mastered) setPracticeLessons((current) => current?.map((item) => item.id === lessonId ? { ...item, mastered: true } : item) ?? null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not check answer') }
    finally { setBusy(null) }
  }

  if (error && !lesson) return <div className="shell py-8"><ErrorNote message={error} /></div>
  if (!lesson) return <div className="shell py-8"><Skeleton className="h-64 rounded-2xl" /></div>
  const c = lesson.content
  const firstMissingPrerequisite = lesson.prerequisite_details.find((parent) => !parent.mastered)
  const practiceQuery = practiceSlug ? `?practice=${encodeURIComponent(practiceSlug)}` : ''
  const nextRequired = practiceLessons?.find((item) => !item.mastered)
  const nextUrl = practiceSlug && practiceLessons
    ? nextRequired ? `/lesson/${nextRequired.id}${practiceQuery}` : `/q/${practiceSlug}`
    : practiceSlug ? `/q/${practiceSlug}`
    : nextLesson ? `/lesson/${nextLesson.id}` : `/learn/${lesson.citadel_id}`
  const nextLabel = practiceSlug
    ? nextRequired ? `Next idea: ${nextRequired.title}` : 'Continue to the question'
    : nextLesson ? `Next: ${nextLesson.title}` : 'View interview playbook'
  return <div className="shell max-w-4xl py-8 space-y-8">
    <Link to={`/learn/${lesson.citadel_id}`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-chalk"><ArrowLeft size={16} /> Concept route</Link>
    {practiceTitle && practiceLessons && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan/25 bg-cyan/5 px-4 py-3 text-sm"><span className="text-muted">Preparing for <strong className="text-chalk">{practiceTitle}</strong> · Idea {practiceLessons.findIndex((item) => item.id === lesson.id) + 1} of {practiceLessons.length}</span><Link to={`/q/${practiceSlug}`} className="font-medium text-cyan hover:text-chalk">View question <ArrowRight size={14} className="inline" /></Link></div>}
    {!lesson.ready ? <div className="rounded-2xl border border-line bg-panel p-8 space-y-3">
      <LockKeyhole className="text-cyan" />
      <h1 className="font-plate text-2xl text-chalk">Start with the first missing idea</h1>
      <p className="text-muted">This lesson builds on the ideas below. Follow them in order, then return here.</p>
      <ol className="space-y-2">{lesson.prerequisite_details.map((parent, index) => <li key={parent.id} className="flex items-center gap-3 rounded-xl border border-line bg-panel-2 px-4 py-3"><span className="font-mono text-xs text-muted">{index + 1}</span><span className="flex-1 text-chalk">{parent.title}</span><span className="text-xs text-muted">{parent.mastered ? 'Done' : 'To learn'}</span></li>)}</ol>
      {firstMissingPrerequisite && <Link to={`/lesson/${firstMissingPrerequisite.id}${practiceQuery}`} className="inline-flex items-center gap-2 rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-[#06121a]">Start with {firstMissingPrerequisite.title} <ArrowRight size={15} /></Link>}
      <Link to={`/learn/${lesson.citadel_id}`} className="block text-sm text-muted underline">Open the full concept route</Link>
    </div> : <>
      <header className="rounded-3xl border border-line bg-panel p-6 sm:p-8"><div className="text-xs font-semibold uppercase tracking-widest text-cyan">Concept {lesson.position} · {lesson.mastered ? 'Checks complete' : 'Learning'}</div><h1 className="mt-3 font-plate text-3xl font-semibold text-chalk">{lesson.title}</h1><p className="mt-2 text-muted">{lesson.summary}</p>{lesson.mastered && <Link to={nextUrl} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan">{nextLabel} <ArrowRight size={16} /></Link>}</header>
      <nav aria-label="Lesson steps" className="grid grid-cols-3 gap-2">{(['Understand', 'Explore', 'Check'] as const).map((label, index) => <button key={label} type="button" disabled={index > unlockedPhase} aria-current={phase === index ? 'step' : undefined} onClick={() => setPhase(index as 0 | 1 | 2)} className={`rounded-xl border px-2 py-3 text-left text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${phase === index ? 'border-cyan/60 bg-cyan/10 text-chalk' : 'border-line bg-panel text-muted hover:text-chalk disabled:cursor-not-allowed disabled:opacity-45'}`}><span className="mr-2 font-mono text-cyan">{index + 1}</span>{label}</button>)}</nav>
      {phase === 0 && <div className="space-y-6">
      <section className="rounded-2xl border border-cyan/25 bg-cyan/5 p-6"><div className="text-xs font-semibold uppercase tracking-widest text-cyan">Imagine this</div><p className="mt-2 text-lg leading-relaxed text-chalk">{c.situation}</p></section>
      <section className="space-y-3"><h2 className="font-plate text-2xl font-semibold text-chalk">Build the idea</h2><p className="max-w-3xl leading-7 text-chalk/90">{c.explanation}</p><div className="grid gap-3 sm:grid-cols-3">{c.terms.map((term) => <div key={term.name} className="rounded-xl border border-line bg-panel p-4"><strong className="text-chalk">{term.name}</strong><p className="mt-1 text-sm leading-6 text-muted">{term.meaning}</p></div>)}</div></section>
      <button type="button" onClick={() => advance(1)} className="inline-flex items-center gap-2 rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-[#06121a]">See examples <ArrowRight size={16} /></button>
      </div>}
      {phase === 1 && <div className="space-y-6">
      <section className="space-y-3"><h2 className="font-plate text-2xl font-semibold text-chalk">See it in practice</h2><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-line bg-panel p-5"><div className="text-xs uppercase tracking-widest text-cyan">Example 1</div><p className="mt-2 leading-7 text-chalk/90">{c.worked_example}</p></div><div className="rounded-xl border border-line bg-panel p-5"><div className="text-xs uppercase tracking-widest text-cyan">A different setting</div><p className="mt-2 leading-7 text-chalk/90">{c.second_example}</p></div></div></section>
      <aside className="rounded-xl border border-amber/25 bg-amber/5 p-4"><div className="text-xs font-semibold uppercase tracking-widest text-amber">Common confusion</div><p className="mt-1 text-sm leading-6 text-chalk/90">{c.misconception}</p></aside>
      {c.visual && <LessonModel key={lesson.id} visual={c.visual} />}
      <div className="flex flex-wrap gap-3"><button type="button" onClick={() => setPhase(0)} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-sm text-chalk"><ArrowLeft size={16} /> Review idea</button><button type="button" onClick={() => advance(2)} className="inline-flex items-center gap-2 rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-[#06121a]">Check understanding <ArrowRight size={16} /></button></div>
      </div>}
      {phase === 2 && <div className="space-y-6">
      <section className="space-y-4"><div><div className="text-xs uppercase tracking-widest text-cyan">Check your understanding</div><h2 className="mt-1 font-plate text-2xl font-semibold text-chalk">Try two situations</h2><p className="text-sm text-muted">You can retry. The explanation appears after each choice.</p></div>{c.checks.map((check, index) => <div key={index} className="rounded-2xl border border-line bg-panel p-5 space-y-4"><h3 className="font-semibold text-chalk">{index + 1}. {check.prompt}</h3><div className="grid gap-2">{check.choices.map((choice, choiceIndex) => <label key={choiceIndex} className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition-colors ${answers[index] === choiceIndex ? 'border-cyan bg-cyan/10 text-chalk' : 'border-line bg-panel-2 text-muted hover:text-chalk'}`}><input type="radio" name={`check-${index}`} checked={answers[index] === choiceIndex} onChange={() => setAnswers((current) => ({ ...current, [index]: choiceIndex }))} className="accent-cyan" />{choice}</label>)}</div><button type="button" disabled={answers[index] === undefined || busy !== null || lesson.passed_checks.includes(index)} onClick={() => submit(index)} className="rounded-xl bg-cyan px-4 py-2 text-sm font-semibold text-[#06121a] disabled:opacity-50">{lesson.passed_checks.includes(index) ? 'Understood' : busy === index ? 'Checking…' : 'Check answer'}</button>{results[index] && <p role="status" className={`rounded-xl p-3 text-sm ${results[index].correct ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-200'}`}>{results[index].correct ? 'Yes. ' : 'Try again. '}{results[index].explanation}</p>}</div>)}</section>
      {lesson.mastered && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5"><div className="flex items-center gap-2 font-semibold text-emerald-300"><CheckCircle2 size={18} /> Checks complete</div><p className="mt-1 text-sm text-muted">You can now build on this idea. Try it again later to make sure it sticks.</p><Link to={nextUrl} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan">{nextLabel} <ArrowRight size={16} /></Link></div>}
      <button type="button" onClick={() => setPhase(1)} className="inline-flex items-center gap-2 text-sm text-muted hover:text-chalk"><ArrowLeft size={16} /> Revisit examples</button>
      </div>}
      <details className="rounded-xl border border-line bg-panel px-4 py-3 text-sm text-muted"><summary className="cursor-pointer font-medium text-chalk">Further reading</summary><ul className="mt-3 space-y-2">{c.sources.map((source) => <li key={source}><a href={source} target="_blank" rel="noreferrer" className="text-cyan underline">{new URL(source).hostname.replace(/^www\./, '')}</a></li>)}</ul></details>
      {error && <ErrorNote message={error} />}
    </>}
  </div>
}
