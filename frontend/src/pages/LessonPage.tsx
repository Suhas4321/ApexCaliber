import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { CheckResult, LessonDetail } from '../api/learningTypes'
import { ErrorNote, Skeleton } from '../components/ui'

export default function LessonPage() {
  const { lessonId = '' } = useParams()
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [results, setResults] = useState<Record<number, CheckResult>>({})
  const [busy, setBusy] = useState<number | null>(null)
  useEffect(() => {
    setLesson(null); setAnswers({}); setResults({}); setError(null)
    api.lesson(lessonId).then(setLesson).catch((e) => setError(e.message))
  }, [lessonId])

  async function submit(index: number) {
    if (answers[index] === undefined) return
    setBusy(index)
    try {
      const result = await api.checkLesson(lessonId, index, answers[index])
      setResults((current) => ({ ...current, [index]: result }))
      setLesson((current) => current && ({ ...current, passed_checks: result.passed_checks, mastered: result.mastered }))
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not check answer') }
    finally { setBusy(null) }
  }

  if (error && !lesson) return <div className="shell py-8"><ErrorNote message={error} /></div>
  if (!lesson) return <div className="shell py-8"><Skeleton className="h-64 rounded-2xl" /></div>
  const c = lesson.content
  return <div className="shell max-w-4xl py-8 space-y-8">
    <Link to={`/learn/${lesson.citadel_id}`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-chalk"><ArrowLeft size={16} /> Concept route</Link>
    {!lesson.ready ? <div className="rounded-2xl border border-line bg-panel p-8 space-y-3"><LockKeyhole className="text-cyan" /><h1 className="font-plate text-2xl text-chalk">Learn the earlier idea first</h1><p className="text-muted">This concept builds on the one just before it.</p><Link to={`/lesson/${lesson.prerequisites[0]}`} className="text-cyan underline">Open prerequisite</Link></div> : <>
      <header className="rounded-3xl border border-line bg-panel p-6 sm:p-8"><div className="text-xs font-semibold uppercase tracking-widest text-cyan">Concept {lesson.position} · {lesson.mastered ? 'Understood' : 'Learning'}</div><h1 className="mt-3 font-plate text-3xl font-semibold text-chalk">{lesson.title}</h1><p className="mt-2 text-muted">{lesson.summary}</p></header>
      <section className="rounded-2xl border border-cyan/25 bg-cyan/5 p-6"><div className="text-xs font-semibold uppercase tracking-widest text-cyan">Imagine this</div><p className="mt-2 text-lg leading-relaxed text-chalk">{c.situation}</p></section>
      <section className="space-y-3"><h2 className="font-plate text-2xl font-semibold text-chalk">Build the idea</h2><p className="max-w-3xl leading-7 text-chalk/90">{c.explanation}</p><div className="grid gap-3 sm:grid-cols-3">{c.terms.map((term) => <div key={term.name} className="rounded-xl border border-line bg-panel p-4"><strong className="text-chalk">{term.name}</strong><p className="mt-1 text-sm leading-6 text-muted">{term.meaning}</p></div>)}</div></section>
      <section className="space-y-3"><h2 className="font-plate text-2xl font-semibold text-chalk">See it in practice</h2><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-line bg-panel p-5"><div className="text-xs uppercase tracking-widest text-cyan">Example 1</div><p className="mt-2 leading-7 text-chalk/90">{c.worked_example}</p></div><div className="rounded-xl border border-line bg-panel p-5"><div className="text-xs uppercase tracking-widest text-cyan">A different setting</div><p className="mt-2 leading-7 text-chalk/90">{c.second_example}</p></div></div></section>
      <section className="space-y-4"><div><div className="text-xs uppercase tracking-widest text-cyan">Check your understanding</div><h2 className="mt-1 font-plate text-2xl font-semibold text-chalk">Try two situations</h2><p className="text-sm text-muted">You can retry. The explanation appears after each choice.</p></div>{c.checks.map((check, index) => <div key={index} className="rounded-2xl border border-line bg-panel p-5 space-y-4"><h3 className="font-semibold text-chalk">{index + 1}. {check.prompt}</h3><div className="grid gap-2">{check.choices.map((choice, choiceIndex) => <label key={choiceIndex} className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition-colors ${answers[index] === choiceIndex ? 'border-cyan bg-cyan/10 text-chalk' : 'border-line bg-panel-2 text-muted hover:text-chalk'}`}><input type="radio" name={`check-${index}`} checked={answers[index] === choiceIndex} onChange={() => setAnswers((current) => ({ ...current, [index]: choiceIndex }))} className="accent-cyan" />{choice}</label>)}</div><button type="button" disabled={answers[index] === undefined || busy !== null || lesson.passed_checks.includes(index)} onClick={() => submit(index)} className="rounded-xl bg-cyan px-4 py-2 text-sm font-semibold text-[#06121a] disabled:opacity-50">{lesson.passed_checks.includes(index) ? 'Understood' : busy === index ? 'Checking…' : 'Check answer'}</button>{results[index] && <p role="status" className={`rounded-xl p-3 text-sm ${results[index].correct ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-200'}`}>{results[index].correct ? 'Yes. ' : 'Try again. '}{results[index].explanation}</p>}</div>)}</section>
      {lesson.mastered && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5"><div className="flex items-center gap-2 font-semibold text-emerald-300"><CheckCircle2 size={18} /> Concept understood</div><p className="mt-1 text-sm text-muted">You can now build on this idea.</p><Link to={`/learn/${lesson.citadel_id}`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan">Continue concept route <ArrowRight size={16} /></Link></div>}
      <div className="text-xs text-faint">Further reading: {c.sources.map((source, index) => <a key={source} href={source} target="_blank" rel="noreferrer" className="mr-3 underline hover:text-cyan">Source {index + 1}</a>)}</div>
      {error && <ErrorNote message={error} />}
    </>}
  </div>
}
