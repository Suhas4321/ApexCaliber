import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { World } from '../api/types'
import { DifficultyBadge, ErrorNote, Skeleton } from '../components/ui'
import { citadelForWorld } from '../lib/citadels'
import { useGrimoire } from '../lib/grimoire'
import { questUrl } from '../lib/journey'
import './StudyPages.css'

export default function WorldPage() {
  const { id = '' } = useParams()
  const [world, setWorld] = useState<World | null>(null)
  const [hasLessons, setHasLessons] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const openGuide = useGrimoire()

  useEffect(() => {
    let active = true
    setWorld(null)
    setError(null)
    api.worlds().then((items) => {
      if (!active) return
      const item = items.find((candidate) => String(candidate.id) === id)
      if (item) setWorld(item)
      else setError('This topic could not be found.')
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load topic') })
    return () => { active = false }
  }, [id])
  useEffect(() => {
    if (!world) return
    let active = true
    const citadel = citadelForWorld(world.id)
    api.learningPath(citadel.id).then((path) => { if (active) setHasLessons(path.modules.some((module) => module.lessons.length > 0)) }).catch(() => { if (active) setHasLessons(false) })
    return () => { active = false }
  }, [world])

  if (error) return <div className="study-page"><ErrorNote message={error} /></div>
  if (!world) return <div className="study-page" role="status" aria-label="Loading topic"><Skeleton className="h-40 rounded-xl" /><Skeleton className="mt-8 h-72 rounded-xl" /></div>
  const citadel = citadelForWorld(world.id)
  const next = world.questions.find((question) => question.progress.status === 'review_due' || question.progress.status === 'in_progress') ?? world.questions.find((question) => !question.progress.solved)
  return <div className="study-page">
    <Link className="study-back" to={`/citadel/${citadel.id}`}><ArrowLeft size={15} className="inline" /> {citadel.shortName}</Link>
    <header className="study-heading study-heading-category"><span className="study-eyebrow">Practice topic</span><h1>{world.name.replace(/ — .*/, '')}</h1><p>{world.tagline || world.core_idea}</p><div className="study-topic-actions">{next && <Link to={questUrl(next)} className="study-button">{next.progress.status === 'new' ? 'Start practice' : 'Continue practice'}<ArrowRight size={17} /></Link>}<button type="button" className="study-outline-button" onClick={() => openGuide(world.id)}><FileText size={16} /> Open topic guide</button></div></header>
    {hasLessons && <section className="study-bridge"><BookOpen size={20} /><div><strong>Build the foundation first</strong><p>Short explanations and worked examples prepare you for these questions.</p></div><Link to={`/learn/${citadel.id}`} className="study-text-link">View lessons <ArrowRight size={16} /></Link></section>}
    <section className="study-section" aria-labelledby="questions-heading"><div className="study-section-header"><div><span className="study-eyebrow">Practice</span><h2 id="questions-heading">Questions</h2></div><span className="study-section-note">{world.solved} of {world.total} solved</span></div>{world.questions.length ? <ol className="study-topic-list">{world.questions.map((question, index) => <li key={question.slug}><Link className="study-question-row" to={questUrl(question)}><span className="study-question-index">{String(index + 1).padStart(2, '0')}</span><span className="study-question-name"><strong>{question.title}</strong><small>{question.patterns.slice(0, 2).join(' · ') || 'Practice question'}</small></span><DifficultyBadge difficulty={question.difficulty} /><span className="study-question-status">{question.progress.solved ? <><CheckCircle2 size={15} /> Solved</> : question.progress.status === 'in_progress' ? 'In progress' : 'Start'}</span><ArrowRight size={17} aria-hidden="true" /></Link></li>)}</ol> : <p className="study-empty">Questions for this topic are being prepared. You can still open its guide.</p>}</section>
  </div>
}
