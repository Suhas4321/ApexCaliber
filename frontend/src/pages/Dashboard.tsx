import { ArrowRight, BookOpen, CalendarClock, Check, ChevronDown, Compass, Crown, Lock, Map as MapIcon, Sparkles } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { LearningPath, LearningSummary } from '../api/learningTypes'
import type { ReviewQueue, World } from '../api/types'
import ChapterIntroModal from '../components/ChapterIntroModal'
import DailyQuestCard from '../components/DailyQuestCard'
import PracticeCard from '../components/PracticeCard'
import Sky from '../components/Sky'
import WorldPreviewPopover from '../components/WorldPreviewPopover'
import { BorderBeam, MagicCard, NumberTicker, ShineBorder } from '../components/effects'
import { Button, DifficultyBadge, ErrorNote, LeetCodeLink, ProgressRing, Skeleton, formatRelative } from '../components/ui'
import { CITADELS, getCitadel, type Citadel } from '../lib/citadels'
import { currentQuest, isRusting, questUrl, rankFor, worldState, type WorldState } from '../lib/journey'
import { useConnectors } from '../lib/useConnectors'
import { useSystemDesignProgress } from '../lib/systemDesignProgress'

const CITADEL_INTROS: Record<string, string> = {
  dsa: 'Build algorithm skills through hands-on practice.',
  python_data: 'Understand how Python values, objects, and data tools work.',
  sql_dbms: 'Start with tables and keys, then build toward queries and storage.',
  os_concurrency: 'Start with processes and threads before coordination problems.',
  backend_apis: 'Follow a request from the browser to a working API.',
  ai_resume: 'Understand models and retrieval before building with AI.',
  computer_networking: 'Follow a message through DNS, TCP, and HTTP.',
  system_design: 'Build from one working service toward larger systems.',
}

function getTierAltitude(tierIdx: number, totalTiers: number): string {
  if (totalTiers <= 1) return 'Summit · 5,000m'
  if (tierIdx === 0) return 'Base Camp · 900m'
  if (tierIdx === totalTiers - 1) return 'Summit · 5,000m'
  const alt = Math.round(900 + (tierIdx / (totalTiers - 1)) * (5000 - 900))
  return `Camp ${tierIdx + 1} · ${alt.toLocaleString()}m`
}

export default function Dashboard() {
  const { citadelId } = useParams<{ citadelId?: string }>()
  const activeCitadel = getCitadel(citadelId)

  const [worlds, setWorlds] = useState<World[] | null>(null)
  const [review, setReview] = useState<ReviewQueue | null>(null)
  const [learningSummary, setLearningSummary] = useState<LearningSummary | null>(null)
  const [activeLearningPath, setActiveLearningPath] = useState<LearningPath | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.worlds(), api.review()])
      .then(([w, r]) => {
        setWorlds(w)
        setReview(r)
      })
      .catch((e) => setError(e.message))
    api.learningSummary().then(setLearningSummary).catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    setActiveLearningPath(null)
    api.learningPath(activeCitadel.id).then((path) => {
      if (active) setActiveLearningPath(path.modules.length ? path : null)
    }).catch(() => {})
    return () => { active = false }
  }, [activeCitadel.id])

  if (error) return <div className="shell p-8"><ErrorNote message={error} /></div>
  if (!worlds || !review)
    return (
      <div className="shell flex flex-col gap-6 py-6" role="status" aria-label="Loading your journey">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-16 rounded-xl" />
        <div className="h-[560px] rounded-3xl bg-panel/30 animate-pulse" />
      </div>
    )

  // Scope worlds to the active citadel
  const citadelWorldList = worlds.filter((w) => activeCitadel.worldIds.includes(w.id))
  const displayWorlds = citadelWorldList.length > 0 ? citadelWorldList : worlds

  const quest = currentQuest(worlds)
  const questWorld = quest?.question.world_id ?? null

  const scrollToCurrentCamp = () => {
    const candidateWorldIds = activeCitadel.worldIds
    let targetId: number | null = null
    if (questWorld && candidateWorldIds.includes(questWorld)) {
      targetId = questWorld
    } else {
      const activeWorld = displayWorlds.find((w) => worldState(w, displayWorlds, questWorld, activeCitadel.edges) === 'active')
      const openWorld = displayWorlds.find((w) => worldState(w, displayWorlds, questWorld, activeCitadel.edges) === 'open')
      targetId = activeWorld?.id ?? openWorld?.id ?? candidateWorldIds[0] ?? null
    }

    if (targetId) {
      const el = document.getElementById(`world-node-${targetId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('ring-2', 'ring-cyan')
        setTimeout(() => el.classList.remove('ring-2', 'ring-cyan'), 1800)
      }
    }
  }

  return (
    <div
      data-zone="night"
      className="relative min-h-screen w-full flex flex-col pb-20 overflow-x-hidden"
      style={{ backgroundColor: '#05070E', color: '#F8FAFC' }}
    >
      {/* Full-Page Lively Procedural Sky (Aurora Curtains + Nebula + Twinkling Stars + Mountain Peaks) */}
      <Sky peak={activeCitadel.id} accent={activeCitadel.themeColor} fixed />

      {/* Chapter Intro modal: shown the first time a peak is visited */}
      {activeCitadel.id === 'dsa' && <ChapterIntroModal citadel={activeCitadel} />}

      {/* Top Cards Section: Floating over the colorful sky */}
      <div className="shell relative z-10 flex flex-col gap-5 pt-5 w-full">
        {activeCitadel.id === 'dsa' && <PeakSwitcherRibbon activeCitadel={activeCitadel} allWorlds={worlds} />}
        {/* 1. Dashboard Header: Slim ~120px Row */}
        {activeCitadel.id === 'dsa' ? (
          <>
            <CommandHud worlds={displayWorlds} review={review} citadel={activeCitadel} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/12 bg-[#0D1220]/80 p-4"><div className="text-xs uppercase tracking-widest text-slate-400">Concepts mastered</div><div className="mt-1 text-2xl font-semibold text-white">{learningSummary ? `${learningSummary.concepts_mastered} / ${learningSummary.total_concepts}` : '—'}</div><p className="mt-1 text-xs text-slate-400">Beginner concept routes authored so far</p></div>
              <div className="rounded-2xl border border-white/12 bg-[#0D1220]/80 p-4"><div className="text-xs uppercase tracking-widest text-slate-400">Challenges solved</div><div className="mt-1 text-2xl font-semibold text-white">{learningSummary ? `${learningSummary.challenges_solved} / ${learningSummary.total_challenges}` : '—'}</div><p className="mt-1 text-xs text-slate-400">Practice after the foundations</p></div>
            </div>
          </>
        ) : <ConceptEntry citadel={activeCitadel} path={activeLearningPath} />}

        {/* 2. Collapsible Activity & Practice Heatmap */}
        <details className="group rounded-2xl border border-white/12 bg-[#0D1220]/70 backdrop-blur-md transition-colors overflow-hidden shadow-xl">
          <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-xs font-semibold text-slate-300 hover:text-white transition-colors select-none">
            <div className="flex items-center gap-2">
              <CalendarClock size={15} className="text-cyan" />
              <span>Activity & Practice Heatmap</span>
            </div>
            <ChevronDown size={14} className="transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="border-t border-white/10 p-4">
            <PracticeCard />
          </div>
        </details>

        {activeCitadel.id !== 'dsa' && <PeakSwitcherRibbon activeCitadel={activeCitadel} allWorlds={worlds} />}
      </div>

      {/* 5. Full-bleed Constellation Skill Mountain over the Unified Colorful Sky */}
      <section id="citadel-map" className="relative w-full overflow-hidden mt-4 scroll-mt-20">
        <div className="relative z-10 w-full">
          <Constellation worlds={displayWorlds} citadel={activeCitadel} />
        </div>
      </section>

      {/* 7. Floating Jump to Current Camp Button */}
      <button
        type="button"
        onClick={scrollToCurrentCamp}
        aria-label="Jump to current peak camp"
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full border border-line bg-panel-2/90 px-4 py-2.5 text-xs font-semibold text-chalk shadow-2xl backdrop-blur-md transition-all hover:bg-panel-3 hover:border-line-strong hover:scale-105 active:scale-95"
      >
        <Compass size={14} className="text-cyan animate-pulse" />
        <span>Jump to current peak camp</span>
      </button>
    </div>
  )
}

function ConceptEntry({ citadel, path }: { citadel: Citadel; path: LearningPath | null }) {
  const lessons = path?.modules.flatMap((module) => module.lessons) ?? []
  const mastered = lessons.filter((lesson) => lesson.mastered).length
  const next = lessons.find((lesson) => lesson.ready && !lesson.mastered)

  return <section className="rounded-3xl border border-white/15 bg-[#101927]/90 p-6 shadow-xl backdrop-blur-md sm:p-8">
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#E2C27D]"><BookOpen size={16} /> Citadel {citadel.numeral} · Learn from the ground up</p>
        <h1 className="mt-3 font-plate text-3xl font-semibold text-white sm:text-4xl">{citadel.name}</h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-300">{CITADEL_INTROS[citadel.id] ?? citadel.description}</p>
        <p className="mt-4 text-sm text-slate-400">{next ? <>Your next idea: <strong className="font-medium text-slate-100">{next.title}</strong></> : lessons.length ? 'You have completed the concepts in this route.' : 'Begin with a simple explanation and a worked example.'}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link to={`/learn/${citadel.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#E2C27D] px-5 py-2.5 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#F4D99B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{mastered > 0 ? 'Continue learning' : 'Start with the basics'} <ArrowRight size={17} /></Link>
        <a href="#citadel-map" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"><MapIcon size={16} /> Explore the map</a>
      </div>
    </div>
    {lessons.length > 0 && <div className="mt-7 flex items-center gap-3 border-t border-white/10 pt-5"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#E2C27D]" style={{ width: `${Math.round(mastered / lessons.length * 100)}%` }} /></div><span className="shrink-0 text-xs text-slate-300">{mastered} of {lessons.length} concepts</span></div>}
  </section>
}

// ------------------------------------------------------------------------------------------
// Engineering citadels: the route comes before practice for non-DSA learners.
// ------------------------------------------------------------------------------------------

function PeakSwitcherRibbon({
  activeCitadel,
  allWorlds,
}: {
  activeCitadel: Citadel
  allWorlds: World[]
}) {
  const { solved: sysSolved, total: sysTotal } = useSystemDesignProgress()
  const cards = [
    ...CITADELS.map((cit) => {
      const questions = allWorlds.filter((world) => cit.worldIds.includes(world.id)).flatMap((world) => world.questions)
      return { id: cit.id, numeral: cit.numeral, title: cit.shortName, summary: CITADEL_INTROS[cit.id] ?? cit.description, href: cit.id === 'dsa' ? '/' : `/learn/${cit.id}`, mapHref: cit.id === 'dsa' ? '/' : `/citadel/${cit.id}`, progress: `${questions.filter((question) => question.progress.solved).length}/${questions.length} practice`, color: cit.themeColor }
    }),
    { id: 'system_design', numeral: 'VIII', title: 'System Design', summary: CITADEL_INTROS.system_design, href: '/system-design', mapHref: '/system-design', progress: `${sysSolved}/${sysTotal} lessons`, color: '#A78BFA' },
  ]

  return (
    <section aria-labelledby="engineering-citadels" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2 px-1">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#E2C27D]">Choose your expedition</p><h2 id="engineering-citadels" className="mt-1 font-plate text-xl font-semibold text-white">Engineering citadels</h2></div>
        <p className="text-sm text-slate-400">Start with the ideas. Practice when you are ready.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const isActive = card.id === activeCitadel.id
          return <div key={card.id} className={`flex min-h-44 flex-col rounded-2xl border bg-[#101927]/90 p-4 backdrop-blur-sm transition-colors hover:bg-[#162235] ${isActive ? 'border-[#E2C27D]/55' : 'border-white/12'}`}>
            <Link to={card.href} className="group flex flex-1 flex-col rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E2C27D]">
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold uppercase tracking-widest" style={{ color: card.color }}>Citadel {card.numeral}</span><ArrowRight size={17} className="text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-[#E2C27D]" /></div>
              <h3 className="mt-3 font-plate text-lg font-semibold leading-tight text-white">{card.title}</h3>
              <p className="mt-2 text-sm leading-snug text-slate-400">{card.summary}</p>
            </Link>
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3"><span className="text-xs text-slate-500">{card.progress}</span>{card.mapHref !== card.href && <Link to={card.mapHref} className="text-xs font-medium text-slate-300 underline-offset-4 hover:text-white hover:underline">View map</Link>}</div>
          </div>
        })}
      </div>
    </section>
  )
}

// ------------------------------------------------------------------------------------------
// Slim Command HUD (~120px height)
// ------------------------------------------------------------------------------------------

function CommandHud({ worlds, review, citadel }: { worlds: World[]; review: ReviewQueue; citadel: Citadel }) {
  const navigate = useNavigate()
  const quest = currentQuest(worlds)
  const all = worlds.flatMap((w) => w.questions)
  const solved = all.filter((q) => q.progress.solved).length
  const pct = all.length > 0 ? Math.round((solved / all.length) * 100) : 0
  const rank = rankFor(solved)
  const questLabel =
    quest?.reason === 'review' ? 'Blind re-solve due' : quest?.reason === 'continue' ? 'Next quest' : 'Current quest'

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.35fr_1.15fr_0.85fr_0.85fr] divide-y sm:divide-y-0 lg:divide-x divide-white/10 rounded-lg border border-white/15 bg-[#0D1220]/75 backdrop-blur-md overflow-hidden shadow-2xl">
      {/* 1. Current quest cell */}
      <div className="relative flex min-h-[112px] flex-col justify-between p-4 overflow-hidden">
        <BorderBeam />
        <div className="flex items-center justify-between gap-2">
          <p className={`flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider ${quest?.reason === 'review' ? 'text-amber' : 'text-sky-400'}`}>
            {quest?.reason === 'review' ? <CalendarClock size={13} /> : <Sparkles size={13} />}
            {questLabel}
          </p>
          <span
            className="rounded-md px-2 py-0.5 text-2xs font-plate font-bold border"
            style={{
              color: citadel.themeColor,
              borderColor: `color-mix(in srgb, ${citadel.themeColor} 30%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${citadel.themeColor} 10%, transparent)`,
            }}
          >
            Citadel {citadel.numeral}
          </span>
        </div>

        {quest ? (
          <div className="flex items-center justify-between gap-3 mt-1">
            <div className="min-w-0 flex-1">
              <h1 className="font-plate text-lg leading-snug font-semibold text-chalk line-clamp-2 break-words">
                {quest.question.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {quest.question.citadel_id === 'dsa' && <LeetCodeLink lc={quest.question.lc} url={quest.question.leetcode_url} />}
                <DifficultyBadge difficulty={quest.question.difficulty} />
                <span className="text-2xs text-muted truncate">
                  World {quest.question.world_id}
                </span>
              </div>
            </div>
            <Button
              className="shrink-0 text-xs px-3.5 py-1.5 h-8 self-center"
              onClick={() => navigate(questUrl(quest.question))}
            >
              Continue →
            </Button>
          </div>
        ) : (
          <div className="mt-1">
            <h1 className="font-plate text-base font-semibold text-chalk">{citadel.name} Mastered</h1>
            <p className="text-2xs text-muted truncate">{citadel.description}</p>
          </div>
        )}
      </div>

      {/* 2. Daily Quest cell */}
      <DailyQuestCard />

      {/* 3. Mastery & Rank cell */}
      <div className="flex min-h-[112px] items-center gap-4 p-4">
        <ProgressRing value={solved} total={all.length || 1} size={58} stroke={6} color={citadel.themeColor || "var(--accent-dsa)"}>
          <span className="font-plate text-xs font-bold text-chalk">
            <NumberTicker value={pct} />%
          </span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <div className="font-plate text-xl font-semibold text-chalk leading-none">
            <NumberTicker value={solved} />
            <span className="text-xs text-faint"> / {all.length}</span>
          </div>
          <p className="text-xs text-muted truncate mt-1">{citadel.shortName} Mastery</p>
          <div className="mt-1 flex items-center gap-1 text-2xs text-gold">
            <Crown size={12} className="shrink-0" />
            <span className="font-semibold text-chalk">{rank.title}</span>
            {rank.next && (
              <span className="text-muted text-caption">
                ({rank.next.min - solved} to {rank.next.title})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Rust Radar cell */}
      <RustRadar worlds={worlds} review={review} />
    </section>
  )
}

function RustRadar({ worlds, review }: { worlds: World[]; review: ReviewQueue }) {
  const practiced = worlds.filter((w) => w.rust !== null)
  const fresh = practiced.filter((w) => w.rust === 'fresh').length
  const freshness = practiced.length ? Math.round((fresh / practiced.length) * 100) : 100
  const oxidising = review.rusting_worlds.length
  const next = review.due[0] ?? review.upcoming[0]
  const color = freshness >= 80 ? 'var(--color-emerald)' : freshness >= 50 ? 'var(--color-amber)' : 'var(--color-crimson)'
  const r = 26
  const arc = Math.PI * r

  return (
    <div className="flex min-h-[112px] items-center gap-3.5 p-4">
      <svg width="64" height="38" viewBox="0 0 64 38" aria-hidden="true" className="shrink-0">
        <path d="M 6 34 A 26 26 0 0 1 58 34" fill="none" stroke="var(--color-line)" strokeWidth="5" strokeLinecap="round" />
        <path
          d="M 6 34 A 26 26 0 0 1 58 34"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={arc}
          strokeDashoffset={arc * (1 - freshness / 100)}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="32" y="32" textAnchor="middle" className="fill-chalk font-plate text-xs font-semibold">
          {freshness}%
        </text>
      </svg>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold" style={{ color }}>
          {oxidising === 0 ? 'Zero oxidation' : `${oxidising} world${oxidising > 1 ? 's' : ''} oxidising`}
        </div>
        <div className="text-2xs text-muted truncate mt-0.5">
          {practiced.length ? `${fresh}/${practiced.length} worlds fresh` : 'No reviews due yet'}
        </div>
        {next && (
          <div className="text-2xs text-muted truncate mt-1">
            Next: <span className="font-medium text-chalk">{next.title}</span> ({formatRelative(next.next_review_at)})
          </div>
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------------------------------
// Constellation Mountain: Renders Bottom-to-Top with Altitude Bands (Zone 3)
// ------------------------------------------------------------------------------------------

const STATE_LABEL: Record<WorldState, string> = {
  mastered: 'Mastered',
  active: 'In progress',
  open: 'Next up',
  fog: 'Unexplored',
}

const STATE_COLOR: Record<WorldState, string> = {
  mastered: 'var(--color-emerald-hi)',
  active: 'var(--color-cyan)',
  open: 'var(--color-sky)',
  fog: 'var(--color-muted)',
}

function Constellation({ worlds, citadel }: { worlds: World[]; citadel: Citadel }) {
  const reduceMotion = useReducedMotion()
  const quest = currentQuest(worlds)
  const questWorld = quest?.question.world_id ?? null
  const byId = useMemo(() => new Map(worlds.map((w) => [w.id, w])), [worlds])
  const states = useMemo(
    () => new Map(worlds.map((w) => [w.id, worldState(w, worlds, questWorld, citadel.edges)])),
    [worlds, questWorld, citadel.edges],
  )

  const edges = citadel.edges
  // Filter tiers to include only worlds present
  const rawTiers = useMemo(
    () =>
      citadel.tiers
        .map((row) => row.filter((id) => byId.has(id)))
        .filter((row) => row.length > 0),
    [citadel.tiers, byId],
  )

  // Barycentre heuristic: sort nodes within each tier by the average index of their parents before drawing lines
  const sortedTiers = useMemo(() => {
    const parentMap = new Map<number, number[]>()
    for (const [parent, child] of edges) {
      if (!parentMap.has(child)) parentMap.set(child, [])
      parentMap.get(child)!.push(parent)
    }

    const result: number[][] = []
    for (let t = 0; t < rawTiers.length; t++) {
      const rawTier = rawTiers[t]
      if (t === 0) {
        result.push([...rawTier])
        continue
      }
      const prevTier = result[t - 1]
      const prevPos = new Map<number, number>(prevTier.map((id, idx) => [id, idx]))

      const sorted = [...rawTier].sort((a, b) => {
        const parentsA = (parentMap.get(a) || []).filter((p) => prevPos.has(p))
        const parentsB = (parentMap.get(b) || []).filter((p) => prevPos.has(p))

        const baryA =
          parentsA.length > 0
            ? parentsA.reduce((sum, p) => sum + prevPos.get(p)!, 0) / parentsA.length
            : rawTier.indexOf(a)
        const baryB =
          parentsB.length > 0
            ? parentsB.reduce((sum, p) => sum + prevPos.get(p)!, 0) / parentsB.length
            : rawTier.indexOf(b)

        if (baryA !== baryB) return baryA - baryB
        return rawTier.indexOf(a) - rawTier.indexOf(b)
      })
      result.push(sorted)
    }
    return result
  }, [rawTiers, edges])

  // Render tiers top-to-bottom starting from Tier 0 (World 1 Base Camp) so active camp is immediately in view!
  const tiersBottomToTop = sortedTiers.map((tier, originalIdx) => ({ tier, originalIdx }))

  const mapHeight = tiersBottomToTop.length * 170 + 160

  const { containerRef, register, paths, size } = useConnectors<number>(edges, [citadel.id])
  const navigate = useNavigate()
  const [selectedWorld, setSelectedWorld] = useState<World | null>(null)
  const [launching, setLaunching] = useState<number | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const enterWorld = (id: number) => {
    setSelectedWorld(null)
    setLaunching(id)
    timer.current = window.setTimeout(
      () => {
        navigate(`/world/${id}`, { state: { world: byId.get(id) } })
      },
      reduceMotion ? 0 : 280,
    )
  }

  return (
    <section className="relative w-full flex flex-col justify-between pt-16 pb-12">
      {/* Mountain Header: Aligned to .shell */}
      <div className="shell mx-auto w-full mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{citadel.icon}</span>
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: citadel.themeColor }}
            >
              Citadel {citadel.numeral} Mountain Ascent
            </span>
          </div>
          <h2 className="font-plate text-2xl font-bold text-white drop-shadow-sm">{citadel.name}</h2>
          <p className="text-sm text-slate-300">{citadel.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[13px] text-slate-300">
          {(['mastered', 'active', 'open', 'fog'] as WorldState[]).map((st) => (
            <Legend key={st} color={STATE_COLOR[st]} label={STATE_LABEL[st]} />
          ))}
          <Legend color="var(--color-amber)" label="Rusting" />
        </div>
      </div>

      {/* Full-bleed Constellation Stage Canvas: Height driven by tiers, no inner scroll */}
      <div className="relative w-full" style={{ height: `${mapHeight}px` }}>
        <div ref={containerRef} className="relative w-full h-full flex flex-col justify-around py-3">
          {/* SVG Connector Paths: solid 2px stroke behind node cards with glow & pulse beams */}
          <svg className="pointer-events-none absolute inset-0 z-0" width={size.w} height={size.h} aria-hidden="true">
            {paths.map((p) => {
              const parent = states.get(p.from)
              const parentWorld = byId.get(p.from)
              const childWorld = byId.get(p.to)
              const isLiveEdge = parentWorld?.status !== 'coming_soon' && childWorld?.status !== 'coming_soon'
              const lit = (parent === 'mastered' || parent === 'active') && isLiveEdge

              return (
                <g key={`${p.from}-${p.to}`}>
                  {lit ? (
                    <>
                      {/* Depth ambient glow halo */}
                      <path
                        d={p.d}
                        fill="none"
                        stroke={citadel.themeColor}
                        strokeOpacity={0.22}
                        strokeWidth={4.5}
                        strokeLinecap="round"
                      />
                      {/* Core solid line with soft 4px glow filter */}
                      <path
                        d={p.d}
                        fill="none"
                        stroke={citadel.themeColor}
                        strokeOpacity={0.9}
                        strokeWidth={2}
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 4px ${citadel.themeColor})` }}
                      />
                      {/* Moving pulse beam */}
                      {!reduceMotion && (
                        <path
                          d={p.d}
                          fill="none"
                          stroke={citadel.themeColor}
                          strokeOpacity={0.95}
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeDasharray="16 140"
                          className="animate-pulse-beam"
                        />
                      )}
                    </>
                  ) : (
                    /* Locked connector: solid 2px stroke, var(--color-text-2) at 55%, no dash */
                    <path
                      d={p.d}
                      fill="none"
                      stroke="var(--color-text-2, #94A3B8)"
                      strokeOpacity={0.55}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  )}

                  {launching === p.to && !reduceMotion && (
                    <motion.path
                      d={p.d}
                      fill="none"
                      stroke="var(--color-cyan, #38BDF8)"
                      strokeWidth={3.5}
                      strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 10px var(--color-cyan, #38BDF8))' }}
                      initial={{ pathLength: 0, opacity: 1 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1] }}
                    />
                  )}
                </g>
              )
            })}
          </svg>

          {/* Mountain Tiers: Rendered Bottom-to-Top (Summit at top, Base Camp at bottom) */}
          <ol className="relative z-10 flex flex-col justify-around h-full py-2 w-full">
            {tiersBottomToTop.map(({ tier, originalIdx }) => (
              <li key={originalIdx} className="relative py-2 w-full">
                {/* Altitude Elevation Line & Label styled like a topo map */}
                <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center gap-3 z-0 pl-6 pr-6">
                  <span className="font-mono text-[13px] uppercase tracking-wider text-slate-400 font-medium select-none shrink-0">
                    {getTierAltitude(originalIdx, sortedTiers.length)}
                  </span>
                  <div className="h-px flex-1 border-t border-dotted border-[rgba(255,255,255,0.14)]" />
                </div>

                {/* World Nodes in Tier: Spread across the full viewport width */}
                <div className="relative z-10 flex flex-wrap justify-evenly items-center gap-x-8 sm:gap-x-12 gap-y-4 px-6 sm:px-12 w-full max-w-full">
                  {tier.map((id) => (
                    <WorldNode
                      key={id}
                      world={byId.get(id)!}
                      citadel={citadel}
                      state={states.get(id) ?? 'fog'}
                      hasQuest={questWorld === id}
                      final={id === Math.max(...citadel.worldIds)}
                      launching={launching === id}
                      onSelect={() => setSelectedWorld(byId.get(id)!)}
                      nodeRef={register(id)}
                    />
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Tap-to-Preview Popover */}
      <WorldPreviewPopover
        world={selectedWorld}
        citadel={citadel}
        isLocked={selectedWorld ? states.get(selectedWorld.id) === 'fog' : false}
        onClose={() => setSelectedWorld(null)}
        onEnterCamp={enterWorld}
        onOpenGrimoire={enterWorld}
      />
    </section>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      {label}
    </span>
  )
}

function WorldNode({
  world: w,
  citadel,
  state,
  hasQuest,
  final,
  launching,
  onSelect,
  nodeRef,
}: {
  world: World
  citadel: Citadel
  state: WorldState
  hasQuest: boolean
  final: boolean
  launching: boolean
  onSelect: () => void
  nodeRef: (el: HTMLElement | null) => void
}) {
  const isComingSoon = w.status === 'coming_soon' || (w.total === 0 && !w.questions?.length)
  const isLocked = state === 'fog'
  const rusting = !isComingSoon && isRusting(w)
  const rustColor = w.rust === 'rusted' ? 'var(--color-crimson)' : 'var(--color-amber)'
  const color = isComingSoon ? 'var(--color-faint)' : STATE_COLOR[state]

  // 1px hairline border: unlocked = peak accent @ 35%, locked = border-subtle (rgba(255,255,255,0.10))
  const borderColor = isLocked || isComingSoon
    ? 'rgba(255, 255, 255, 0.10)'
    : `color-mix(in srgb, ${citadel.themeColor} 35%, transparent)`

  return (
    <div
      id={`world-node-${w.id}`}
      ref={nodeRef}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      aria-label={`World ${w.id}: ${w.name}`}
      title={isComingSoon ? 'Lessons landing soon' : isLocked ? 'Complete prerequisite worlds to unlock' : undefined}
      className={`group relative block w-[232px] cursor-pointer rounded-2xl text-left transition-[transform,box-shadow] duration-200 select-none hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${
        state === 'active' && !isComingSoon ? 'shadow-[0_0_24px_-2px_rgba(34,211,238,0.45)] animate-pulse' : ''
      } ${launching ? 'scale-[1.04] ring-2 ring-cyan' : ''}`}
    >
      <MagicCard
        className="relative flex items-center gap-3 rounded-2xl p-3 transition-colors backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(13, 18, 32, 0.78)',
          border: `1px solid ${borderColor}`,
          ...(rusting ? { boxShadow: `0 0 24px -4px ${rustColor}` } : {}),
        }}
        spotlight={isComingSoon ? 'transparent' : state === 'active' ? 'rgba(34, 211, 238, 0.16)' : 'rgba(129, 140, 248, 0.12)'}
      >
        {/* Boss ShineBorder if applicable */}
        {final && state !== 'mastered' && !isComingSoon && <ShineBorder />}

        {/* State 1: Coming soon numeral */}
        {isComingSoon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong bg-panel-2 font-plate text-xs font-semibold text-faint">
            {w.id}
          </div>
        ) : state === 'mastered' ? (
          /* State 2: Mastered numeral with check and accent ring */
          <span className="relative shrink-0">
            <ProgressRing value={w.solved} total={w.total || 1} size={44} stroke={4} color="var(--color-emerald-hi)">
              <span className="font-plate text-xs font-bold text-chalk">{w.id}</span>
            </ProgressRing>
            <span
              className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald text-surface-0 shadow-sm"
              title="Mastered"
            >
              <Check size={10} strokeWidth={3} />
            </span>
          </span>
        ) : state === 'fog' ? (
          /* State 4: Locked (readable) */
          <span className="relative shrink-0">
            <ProgressRing value={0} total={1} size={44} stroke={4} color="rgba(255, 255, 255, 0.14)">
              <span className="font-plate text-xs font-semibold text-slate-400">{w.id}</span>
            </ProgressRing>
          </span>
        ) : (
          /* State 3 & 5: Active or Next up progress ring */
          <span className="relative shrink-0">
            <ProgressRing value={w.solved} total={w.total || 1} size={44} stroke={4} color={color}>
              <span className="font-plate text-xs font-semibold text-slate-100">{w.id}</span>
            </ProgressRing>
          </span>
        )}

        <div className="relative min-w-0 flex-1">
          {/* Header row: World number + status badge */}
          <div className="flex items-center justify-between gap-1 text-2xs text-slate-400 mb-0.5">
            <span className="font-mono text-2xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
              {final ? 'Citadel Boss' : `World ${w.id}`}
              {hasQuest && !isComingSoon && (
                <span title="Current Quest Target">
                  <Sparkles size={10} className="text-amber" />
                </span>
              )}
            </span>

            {isComingSoon ? (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-1.5 py-px text-caption text-slate-400">
                Coming soon
              </span>
            ) : isLocked ? (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.08] px-1.5 py-px text-caption font-medium text-slate-300">
                <Lock size={9} /> Locked
              </span>
            ) : state === 'mastered' ? (
              <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-caption font-semibold text-emerald bg-emerald/15 border border-emerald/30">
                Mastered
              </span>
            ) : state === 'active' ? (
              <span className="inline-flex items-center rounded-full px-1.5 py-px text-caption font-semibold text-cyan bg-cyan/15 border border-cyan/30">
                In progress
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-px text-caption font-medium text-sky bg-sky/15 border border-sky/30">
                <span className="h-1.5 w-1.5 rounded-full bg-sky" />
                Next up
              </span>
            )}
          </div>

          {/* Title: 2 lines */}
          <div className="line-clamp-2 font-plate text-xs leading-snug font-semibold text-slate-100 break-words">
            {w.name.replace(/ — .*/, '')}
          </div>

          {/* Solved stats & rust */}
          <div className="mt-1 flex items-center justify-between gap-1 text-2xs text-slate-400">
            {isComingSoon ? (
              <span className="text-slate-500 text-caption">In development</span>
            ) : (
              <>
                <span className="font-mono text-caption text-slate-400">
                  {w.solved}/{w.total} solved
                </span>
                {rusting && (
                  <span className="flex items-center gap-1 font-medium" style={{ color: rustColor }}>
                    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
                      <path d="M5 0 L4 3 L6 4.5 L3.5 7 L5 10" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                    {w.due > 0 ? `${w.due} due` : 'rusting'}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </MagicCard>
    </div>
  )
}
