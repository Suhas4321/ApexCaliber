import { ArrowRight, BookOpen, BrainCircuit, Code2, Cpu, Database, Network, Server, Shapes } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { LearningPath } from '../api/learningTypes'
import type { World } from '../api/types'
import { ErrorNote, Skeleton } from '../components/ui'
import { CITADELS, getCitadel, type Citadel } from '../lib/citadels'
import { currentQuest, questUrl } from '../lib/journey'
import { useSystemDesignProgress } from '../lib/systemDesignProgress'
import './StudyPages.css'

const descriptions: Record<string, string> = {
  dsa: 'Build problem-solving skill with patterns, worked examples, and coding practice.',
  python_data: 'Learn what Python does with values and data before writing more complex code.',
  sql_dbms: 'Understand tables, queries, and the systems that store your data.',
  os_concurrency: 'Make sense of processes, threads, and coordination step by step.',
  backend_apis: 'Follow a request from the browser into a working service.',
  ai_resume: 'Understand AI concepts and explain your work clearly in interviews.',
  computer_networking: 'Understand how requests travel through networks, from DNS to secure connections.',
}

const icons = {
  dsa: Shapes,
  python_data: Code2,
  sql_dbms: Database,
  os_concurrency: Cpu,
  backend_apis: Server,
  ai_resume: BrainCircuit,
} as const

function lessonCount(path: LearningPath | undefined) {
  return path?.modules.reduce((sum, module) => sum + module.lessons.length, 0) ?? 0
}

function nextLesson(path: LearningPath | undefined) {
  return path?.modules.flatMap((module) => module.lessons).find((lesson) => lesson.ready && !lesson.mastered)
}

function PathCard({ citadel, path, worlds }: { citadel: Citadel; path?: LearningPath; worlds: World[] }) {
  const Icon = icons[citadel.id as keyof typeof icons] ?? BookOpen
  const topics = worlds.filter((world) => citadel.worldIds.includes(world.id))
  const questions = topics.reduce((sum, world) => sum + world.questions.length, 0)
  const completed = path?.modules.flatMap((module) => module.lessons).filter((lesson) => lesson.mastered).length ?? 0
  return <Link to={`/citadel/${citadel.id}`} className="study-path-card" style={{ '--category-accent': citadel.themeColor } as React.CSSProperties}>
    <div className="study-path-top"><span className="study-path-icon"><Icon size={21} strokeWidth={1.8} /></span><ArrowRight size={18} className="study-path-arrow" aria-hidden="true" /></div>
    <h3>{citadel.shortName}</h3>
    <p>{descriptions[citadel.id] ?? citadel.description}</p>
    <div className="study-path-meta"><span>{lessonCount(path) ? `${lessonCount(path)} lessons` : 'Practice route'}</span><span aria-hidden="true">·</span><span>{questions} questions</span>{completed > 0 && <span className="study-path-progress">{completed} completed</span>}</div>
  </Link>
}

export default function Dashboard() {
  const { citadelId } = useParams<{ citadelId?: string }>()
  const selected = citadelId ? getCitadel(citadelId) : null
  const [worlds, setWorlds] = useState<World[] | null>(null)
  const [paths, setPaths] = useState<Record<string, LearningPath>>({})
  const [error, setError] = useState<string | null>(null)
  const { solved: designSolved, total: designTotal } = useSystemDesignProgress()

  useEffect(() => {
    let active = true
    api.worlds().then((items) => { if (active) setWorlds(items) }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load learning paths') })
    Promise.allSettled(CITADELS.map((citadel) => api.learningPath(citadel.id))).then((results) => {
      if (!active) return
      const available: Record<string, LearningPath> = {}
      results.forEach((result, index) => { if (result.status === 'fulfilled') available[CITADELS[index].id] = result.value })
      setPaths(available)
    })
    return () => { active = false }
  }, [])

  const activeWorlds = useMemo(() => worlds?.filter((world) => selected?.worldIds.includes(world.id)) ?? [], [worlds, selected])
  if (error) return <div className="study-page"><ErrorNote message={error} /></div>
  if (!worlds) return <div className="study-page" role="status" aria-label="Loading learning paths"><Skeleton className="h-40 rounded-xl" /><Skeleton className="mt-8 h-72 rounded-xl" /></div>

  if (selected) {
    const path = paths[selected.id]
    const readyLesson = nextLesson(path)
    const firstTopic = activeWorlds.find((world) => world.questions.length > 0 && world.status !== 'coming_soon')
    const primaryUrl = readyLesson ? `/lesson/${readyLesson.id}` : firstTopic ? `/world/${firstTopic.id}` : `/learn/${selected.id}`
    const primaryLabel = readyLesson ? `Continue: ${readyLesson.title}` : firstTopic ? 'Explore practice topics' : 'View learning path'
    return <div className="study-page">
      <Link to="/app" className="study-back">← All learning paths</Link>
      <header className="study-heading study-heading-category"><span className="study-eyebrow">Learning path</span><h1>{selected.shortName}</h1><p>{descriptions[selected.id] ?? selected.description}</p><Link className="study-button" to={primaryUrl}>{primaryLabel}<ArrowRight size={17} /></Link></header>
      {path?.modules.length > 0 && <section className="study-section" aria-labelledby="foundation-title"><div className="study-section-header"><div><span className="study-eyebrow">Start here</span><h2 id="foundation-title">Learn the foundations</h2></div><Link to={`/learn/${selected.id}`} className="study-text-link">View complete syllabus <ArrowRight size={16} /></Link></div><div className="study-module-list">{path.modules.map((module) => <Link to={`/learn/${selected.id}`} className="study-module-row" key={module.id}><span className="study-module-number">{String(module.position).padStart(2, '0')}</span><span className="study-module-copy"><strong>{module.title}</strong><span>{module.summary}</span></span><span className="study-module-count">{module.lessons.filter((lesson) => lesson.mastered).length}/{module.lessons.length} lessons</span><ArrowRight size={17} aria-hidden="true" /></Link>)}</div></section>}
      <section className="study-section" aria-labelledby="topics-title"><div className="study-section-header"><div><span className="study-eyebrow">Practice</span><h2 id="topics-title">Explore topics</h2></div><span className="study-section-note">Questions and guides stay in each topic</span></div>{activeWorlds.length ? <div className="study-topic-list">{activeWorlds.map((world) => <Link to={`/world/${world.id}`} className="study-topic-row" key={world.id}><span className="study-topic-title"><strong>{world.name.replace(/ — .*/, '')}</strong><small>{world.tagline}</small></span><span className="study-topic-progress">{world.status === 'coming_soon' || !world.questions.length ? 'Coming soon' : `${world.solved}/${world.total} solved`}</span><ArrowRight size={17} aria-hidden="true" /></Link>)}</div> : <p className="study-empty">Practice topics for this path are being prepared. You can start with the lessons above.</p>}</section>
    </div>
  }

  const quest = currentQuest(worlds)
  const pathWithProgress = CITADELS.map((citadel) => paths[citadel.id]).find((path) => path?.modules.some((module) => module.lessons.some((lesson) => lesson.mastered)) && nextLesson(path))
  const firstPath = pathWithProgress ?? CITADELS.map((citadel) => paths[citadel.id]).find((path) => nextLesson(path))
  const lesson = nextLesson(firstPath)
  const inProgressQuestion = worlds.flatMap((world) => world.questions).find((question) => question.progress.status === 'in_progress')
  const focusUrl = inProgressQuestion ? questUrl(inProgressQuestion) : lesson ? `/lesson/${lesson.id}` : quest ? questUrl(quest.question) : '/citadel/dsa'
  const focusTitle = inProgressQuestion?.title ?? lesson?.title ?? quest?.question.title ?? 'Choose your first topic'
  const focusPath = inProgressQuestion ? 'Continue practice' : lesson ? 'Continue learning' : quest ? 'Start practice' : 'Get started'
  return <div className="study-page">
    <header className="study-heading"><span className="study-eyebrow">Your learning space</span><h1>Learn it. Then build it.</h1><p>Pick up your next step, or choose a subject to learn from the foundations through code.</p></header>
    <section className="study-focus" aria-labelledby="study-focus-title"><div><span className="study-eyebrow">Your next step</span><h2 id="study-focus-title">{focusTitle}</h2><p>{focusPath} with a clear explanation, a worked example, and a chance to try it yourself.</p></div><Link to={focusUrl} className="study-button">{focusPath}<ArrowRight size={17} /></Link></section>
    <section id="learning-paths" className="study-section" aria-labelledby="paths-title"><div className="study-section-header"><div><span className="study-eyebrow">Browse by subject</span><h2 id="paths-title">Learning paths</h2></div><p className="study-section-note">One subject at a time. Your progress is saved.</p></div><div className="study-path-grid">{CITADELS.map((citadel) => <PathCard key={citadel.id} citadel={citadel} path={paths[citadel.id]} worlds={worlds} />)}<Link to="/system-design" className="study-path-card" style={{ '--category-accent': '#8a9da0' } as React.CSSProperties}><div className="study-path-top"><span className="study-path-icon"><Network size={21} strokeWidth={1.8} /></span><ArrowRight size={18} className="study-path-arrow" /></div><h3>System Design</h3><p>Build from a working service toward reliable systems at scale.</p><div className="study-path-meta"><span>{designSolved}/{designTotal} lessons completed</span></div></Link></div></section>
    <div className="study-bottom-link"><Link to="/stats" className="study-text-link">View your progress <ArrowRight size={16} /></Link></div>
  </div>
}
