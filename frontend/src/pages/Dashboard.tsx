import {
  ArrowRight,
  ScanSearch,
  Terminal,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { LearningPath } from '../api/learningTypes'
import type { World } from '../api/types'
import ConceptPreview from '../components/ConceptPreview'
import SubjectArtwork from '../components/SubjectArtwork'
import { ErrorNote, Skeleton } from '../components/ui'
import { hostedAuthEnabled } from '../lib/auth'
import { CITADELS, citadelForWorld, getCitadel, type Citadel } from '../lib/citadels'
import { CitadelIcon } from '../components/CitadelIcon'
import { currentQuest, questUrl, stagesDone } from '../lib/journey'
import { useSystemDesignProgress } from '../lib/systemDesignProgress'
import './StudyPages.css'

const TRACK_COPY: Record<string, { tag: string; blurb: string }> = {
  dsa: {
    tag: 'Patterns & Traces',
    blurb: 'Sliding windows, trees, DP grids, and line-by-line Python execution traces.',
  },
  python_data: {
    tag: 'Memory & Data',
    blurb: 'Heap references, mutability traps, OOP invariants, and Pandas pipelines.',
  },
  sql_dbms: {
    tag: 'Indexing & ACID',
    blurb: 'Query plans, B-Tree vs. hash indexes, relational joins, and isolation levels.',
  },
  os_concurrency: {
    tag: 'Threads & Locks',
    blurb: 'Thread pools, mutex locks, GIL contention, deadlocks, and async event loops.',
  },
  backend_apis: {
    tag: 'HTTP & Auth',
    blurb: 'FastAPI request lifecycles, JWT refresh rotation, Redis caching, and queues.',
  },
  computer_networking: {
    tag: 'TCP · DNS · TLS',
    blurb: 'DNS resolution, TCP 3-way handshakes, TLS encryption, and packet routing.',
  },
  ai_resume: {
    tag: 'RAG & Defense',
    blurb: 'Embedding retrieval, vector RAG pipelines, agent state graphs, and defense drills.',
  },
  system_design: {
    tag: 'SOLID · LLD · HLD',
    blurb: 'SOLID boundaries, OOP domain labs (LLD), and fault-tolerant distributed scale (HLD).',
  },
}

function lessonCount(path: LearningPath | undefined) {
  return path?.modules.reduce((sum, module) => sum + module.lessons.length, 0) ?? 0
}

function nextLesson(path: LearningPath | undefined) {
  return path?.modules.flatMap((module) => module.lessons).find((lesson) => lesson.ready && !lesson.mastered)
}

function trackMetrics(citadel: Citadel, path: LearningPath | undefined, worlds: World[]) {
  const topics = worlds.filter((world) => citadel.worldIds.includes(world.id))
  const totalQuestions = topics.reduce((sum, world) => sum + world.questions.length, 0)
  const solvedQuestions = topics.reduce((sum, world) => sum + world.solved, 0)
  const dueQuestions = topics.reduce((sum, world) => sum + world.due, 0)
  const lessonsTotal = lessonCount(path)
  const lessonsDone =
    path?.modules.flatMap((module) => module.lessons).filter((lesson) => lesson.mastered).length ?? 0

  const labsCount = lessonsTotal || topics.length
  const totalItems = totalQuestions > 0 ? totalQuestions : lessonsTotal
  const solvedItems = totalQuestions > 0 ? solvedQuestions : lessonsDone
  const pct = totalItems > 0 ? Math.min(100, Math.round((solvedItems / totalItems) * 100)) : 0

  return { labsCount, totalItems, solvedItems, dueQuestions, pct }
}

interface TrackCardModel {
  id: string
  to: string
  tag: string
  title: string
  blurb: string
  pct: number
  summary: string
  due: number
  showPct: boolean
}

function UniformTrackCard({ track }: { track: TrackCardModel }) {
  const isComplete = track.pct >= 100

  return (
    <Link
      to={track.to}
      className="study-path-card achilles-track-card group w-full min-w-0 rounded-xl p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch aspect-[16/10] min-h-[280px] hover:-translate-y-0.5 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FF88]"
    >
      <div className="md:col-span-7 flex flex-col justify-between gap-4 min-w-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="study-path-icon shrink-0">
                <CitadelIcon id={track.id} size={18} strokeWidth={1.75} />
              </span>
              <span className="truncate font-mono text-xs uppercase tracking-wider text-faint">
                {track.tag}
              </span>
            </div>
            <ArrowRight
              size={17}
              className="shrink-0 text-faint transition-[transform,color] duration-150 group-hover:translate-x-0.5 group-hover:text-[#00FF88]"
              aria-hidden="true"
            />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-plate text-lg font-semibold leading-snug text-chalk">
              {track.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted">
              {track.blurb}
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-3 border-t border-[#1a1a1a] [html[data-theme='light']_&]:border-line">
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                isComplete ? 'bg-[#00FF88]' : 'bg-[var(--study-accent)]'
              }`}
              style={{ width: `${track.pct}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-faint">
            <span>{track.summary}</span>
            {track.due > 0 ? (
              <span className="rounded border border-[#00FF88]/30 bg-[#00FF88]/10 px-2 py-0.5 text-[#00FF88] [html[data-theme='light']_&]:border-[var(--study-accent)]/30 [html[data-theme='light']_&]:bg-[var(--study-accent)]/10 [html[data-theme='light']_&]:text-[var(--study-accent)] font-semibold tabular-nums">
                {track.due} due
              </span>
            ) : (
              track.showPct && <span className="text-muted tabular-nums">{track.pct}%</span>
            )}
          </div>
        </div>
      </div>

      <div className="md:col-span-5 h-[132px] md:h-full min-h-[132px] overflow-hidden rounded-lg border border-[#1a1a1a] [html[data-theme='light']_&]:border-line flex items-stretch">
        <SubjectArtwork subject={track.id} />
      </div>
    </Link>
  )
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
    Promise.all([api.worlds(), Promise.allSettled(CITADELS.map((citadel) => api.learningPath(citadel.id)))])
      .then(([items, results]) => {
        if (!active) return
        const available: Record<string, LearningPath> = {}
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') available[CITADELS[index].id] = result.value
        })
        setPaths(available)
        setWorlds(items)
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load engineering tracks')
      })
    return () => {
      active = false
    }
  }, [])

  const activeWorlds = useMemo(
    () => worlds?.filter((world) => selected?.worldIds.includes(world.id)) ?? [],
    [worlds, selected],
  )

  if (error) return <div className="study-page"><ErrorNote message={error} /></div>

  if (!worlds) {
    return (
      <div className="study-page space-y-10" role="status" aria-label="Loading Engineering Studio">
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-36 rounded" />
          <Skeleton className="h-10 w-80 max-w-full rounded-md" />
          <Skeleton className="h-4 w-[520px] max-w-full rounded" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 rounded-xl border border-line bg-panel p-5 sm:p-6">
          <div className="lg:col-span-7 space-y-4 py-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-8 w-2/3 rounded-md" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-11 w-44 rounded-lg" />
          </div>
          <Skeleton className="lg:col-span-5 h-60 w-full rounded-lg" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="w-full min-w-0 rounded-xl border border-[#1a1a1a] [html[data-theme='light']_&]:border-line bg-[#0a0a0a] [html[data-theme='light']_&]:bg-panel p-5 grid grid-cols-1 md:grid-cols-12 gap-5 aspect-[16/10] min-h-[280px]">
              <div className="md:col-span-7 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-32 rounded" />
                  <Skeleton className="h-6 w-2/3 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                </div>
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
              <Skeleton className="md:col-span-5 h-32 md:h-full w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (selected) {
    const path = paths[selected.id]
    const readyLesson = nextLesson(path)
    const firstTopic = activeWorlds.find((world) => world.questions.length > 0 && world.status !== 'coming_soon')
    const primaryUrl = readyLesson
      ? `/lesson/${readyLesson.id}`
      : firstTopic
      ? `/world/${firstTopic.id}`
      : `/learn/${selected.id}`
    const primaryLabel = readyLesson
      ? `Resume: ${readyLesson.title}`
      : firstTopic
      ? 'Open track labs'
      : 'View track syllabus'

    return (
      <div className="study-page">
        <Link to="/app" className="study-back">← All engineering tracks</Link>
        <div
          className="study-category-hero"
          style={{ '--category-accent': selected.themeColor } as React.CSSProperties}
        >
          <header className="study-heading study-heading-category">
            <span className="study-eyebrow">{TRACK_COPY[selected.id]?.tag ?? 'Engineering Track'}</span>
            <h1>{selected.shortName}</h1>
            <p>{TRACK_COPY[selected.id]?.blurb ?? selected.description}</p>
            <Link className="study-button" to={primaryUrl}>
              {primaryLabel}
              <ArrowRight size={17} />
            </Link>
          </header>
          <SubjectArtwork subject={selected.id} />
        </div>

        {path?.modules.length > 0 && (
          <section className="study-section" aria-labelledby="foundation-title">
            <div className="study-section-header">
              <div>
                <span className="study-eyebrow">Reference Modules</span>
                <h2 id="foundation-title">Foundations &amp; Walkthroughs</h2>
              </div>
              <Link to={`/learn/${selected.id}`} className="study-text-link">
                Open full curriculum <ArrowRight size={16} />
              </Link>
            </div>
            <div className="study-module-list">
              {path.modules.map((module) => (
                <Link to={`/learn/${selected.id}`} className="study-module-row" key={module.id}>
                  <span className="study-module-number">{String(module.position).padStart(2, '0')}</span>
                  <span className="study-module-copy">
                    <strong>{module.title}</strong>
                    <span>{module.summary}</span>
                  </span>
                  <span className="study-module-count">
                    {module.lessons.filter((lesson) => lesson.mastered).length}/{module.lessons.length} labs
                  </span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="study-section" aria-labelledby="topics-title">
          <div className="study-section-header">
            <div>
              <span className="study-eyebrow">Hands-On Practice</span>
              <h2 id="topics-title">Track Sandboxes</h2>
            </div>
            <span className="study-section-note">Isolated runner traces &amp; verification suites</span>
          </div>
          {activeWorlds.length ? (
            <div className="study-topic-list">
              {activeWorlds.map((world) => (
                <Link to={`/world/${world.id}`} className="study-topic-row" key={world.id}>
                  <span className="study-topic-title">
                    <strong>{world.name.replace(/ — .*/, '')}</strong>
                    <small>{world.tagline}</small>
                  </span>
                  <span className="study-topic-progress">
                    {world.status === 'coming_soon' || !world.questions.length
                      ? 'Coming soon'
                      : `${world.solved}/${world.total} solved`}
                  </span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="study-empty">Sandboxes for this track are in progress. Start with the reference modules above.</p>
          )}
        </section>
      </div>
    )
  }

  const quest = currentQuest(worlds)
  const pathWithProgress = CITADELS.map((citadel) => paths[citadel.id]).find(
    (path) => path?.modules.some((module) => module.lessons.some((lesson) => lesson.mastered)) && nextLesson(path),
  )
  const firstPath = pathWithProgress ?? CITADELS.map((citadel) => paths[citadel.id]).find((path) => nextLesson(path))
  const lesson = nextLesson(firstPath)
  const inProgressQuestion = worlds.flatMap((world) => world.questions).find((question) => question.progress.status === 'in_progress')

  const activeQuestion = inProgressQuestion ?? quest?.question ?? null
  const activeCitadel = activeQuestion
    ? citadelForWorld(activeQuestion.world_id)
    : firstPath
    ? getCitadel(firstPath.citadel_id)
    : getCitadel('dsa')

  const focusUrl = inProgressQuestion
    ? questUrl(inProgressQuestion)
    : lesson
    ? `/lesson/${lesson.id}`
    : quest
    ? questUrl(quest.question)
    : '/citadel/dsa'
  const focusTitle = inProgressQuestion?.title ?? lesson?.title ?? quest?.question.title ?? 'Launch your first trace'
  const focusAction = inProgressQuestion
    ? 'Resume Trace'
    : quest?.reason === 'review'
    ? 'Review Trace'
    : lesson
    ? 'Continue Lab'
    : 'Start Practice'
  const focusEyebrow =
    quest?.reason === 'review'
      ? 'Review Due'
      : inProgressQuestion
      ? 'Current Trace · In Progress'
      : 'Recommended Next Lab'

  const qStages = activeQuestion ? stagesDone(activeQuestion.progress) : null
  const designPct = designTotal > 0 ? Math.min(100, Math.round((designSolved / designTotal) * 100)) : 0
  const dsaCitadel = CITADELS.find((citadel) => citadel.id === 'dsa')
  const domainCitadels = CITADELS.filter((citadel) => citadel.id !== 'dsa')

  const toTrackCard = (citadel: Citadel): TrackCardModel => {
    const meta = TRACK_COPY[citadel.id]
    const { labsCount, totalItems, solvedItems, dueQuestions, pct } = trackMetrics(citadel, paths[citadel.id], worlds)
    return {
      id: citadel.id,
      to: `/citadel/${citadel.id}`,
      tag: meta?.tag ?? 'Track',
      title: citadel.shortName,
      blurb: meta?.blurb ?? citadel.description,
      pct,
      summary: `${labsCount} ${labsCount === 1 ? 'lab' : 'labs'} · ${totalItems > 0 ? `${solvedItems}/${totalItems} solved` : 'Practice ready'}`,
      due: dueQuestions,
      showPct: totalItems > 0,
    }
  }

  const uniformTracks: TrackCardModel[] = [
    ...(dsaCitadel ? [toTrackCard(dsaCitadel)] : []),
    {
      id: 'system_design',
      to: '/system-design',
      tag: TRACK_COPY.system_design.tag,
      title: 'System Design',
      blurb: TRACK_COPY.system_design.blurb,
      pct: designPct,
      summary: `${designTotal} labs · ${designSolved}/${designTotal} solved`,
      due: 0,
      showPct: true,
    },
    ...domainCitadels.map(toTrackCard),
  ]

  return (
    <div className="study-page">
      <header className="study-heading">
        <span className="study-eyebrow">Engineering Studio</span>
        <h1>
          Inspect runtime state.
          <br />
          <span>Write verified code.</span>
        </h1>
        <p>
          Resume your active trace or jump into an engineering track to step through memory, concurrency, queries, and system topology.
        </p>
      </header>

      {/* Top Hero Cockpit (7 / 5 split) */}
      <section
        className="study-focus-cockpit achilles-card-shell grid grid-cols-1 lg:grid-cols-12 gap-5 rounded-xl p-4 sm:p-6"
        aria-labelledby="study-focus-title"
      >
        <div className="lg:col-span-7 flex flex-col justify-between gap-6 p-1 sm:p-2 min-w-0">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="study-eyebrow">{focusEyebrow}</span>
              <span className="rounded border border-line bg-panel-2 px-2 py-0.5 font-mono text-2xs text-muted">
                {activeCitadel.shortName}
              </span>
              {activeQuestion && (
                <span className="rounded border border-line bg-panel-2 px-2 py-0.5 font-mono text-2xs text-faint">
                  {activeQuestion.difficulty}
                </span>
              )}
            </div>

            <h2
              id="study-focus-title"
              className="font-plate text-xl sm:text-2xl font-semibold tracking-tight text-chalk leading-tight"
            >
              {focusTitle}
            </h2>

            <p className="text-base leading-relaxed text-muted max-w-[54ch]">
              Step through live call-stack bindings, pointer mutations, and automated edge-case assertions inside the trace runner.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to={focusUrl}
                className="study-button active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--study-accent)]"
              >
                <span>{focusAction}</span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>

              {!hostedAuthEnabled ? (
                <Link
                  to="/playground"
                  className="study-outline-button active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--study-accent)]"
                >
                  <Terminal size={15} aria-hidden="true" />
                  <span>Open Sandbox</span>
                </Link>
              ) : (
                <Link
                  to="/finder"
                  className="study-outline-button active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--study-accent)]"
                >
                  <ScanSearch size={15} aria-hidden="true" />
                  <span>Pattern Finder</span>
                </Link>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line font-mono text-2xs">
              {qStages ? (
                <>
                  <span className={qStages.concept ? 'text-emerald font-semibold' : 'text-faint'}>
                    01 Concept {qStages.concept ? '✓' : ''}
                  </span>
                  <span className="text-line-strong" aria-hidden="true">/</span>
                  <span className={qStages.drills ? 'text-emerald font-semibold' : 'text-faint'}>
                    02 Trace Drills {qStages.drills ? '✓' : ''}
                  </span>
                  <span className="text-line-strong" aria-hidden="true">/</span>
                  <span className={qStages.arena ? 'text-emerald font-semibold' : 'text-[var(--study-accent)]'}>
                    03 Verified Code {qStages.arena ? '✓' : ''}
                  </span>
                </>
              ) : (
                <span className="text-faint">01 Concept -&gt; 02 Step Trace -&gt; 03 Verified Code</span>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-center min-w-0">
          <ConceptPreview />
        </div>
      </section>

      {/* Bento Engineering Tracks */}
      <section id="learning-paths" className="study-section" aria-labelledby="paths-title">
        <div className="study-section-header">
          <div>
            <span className="study-eyebrow">Core Architecture &amp; Tracks</span>
            <h2 id="paths-title">Engineering Tracks</h2>
          </div>
          <p className="study-section-note">Live progress telemetry synced across labs and sandboxes.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {uniformTracks.map((track) => (
            <UniformTrackCard key={track.id} track={track} />
          ))}
        </div>
      </section>

      <div className="study-bottom-link">
        <Link to="/stats" className="study-text-link">
          Inspect full activity &amp; telemetry <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
