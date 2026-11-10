import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  ScrollText,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Progress, QuestionDetail, RunResult, Trace } from '../api/types'
import { ThemeToggle } from '../components/effects'
import AccountMenu from '../components/AccountMenu'
import { Button, DifficultyBadge, ErrorNote, Skeleton } from '../components/ui'
import VictoryModal from '../components/VictoryModal'
import { usePlayback } from '../components/visualizers/stage/usePlayback'
import DataStructurePrimer from '../components/workspace/DataStructurePrimer'
import InterviewAnswerPlaybook from '../components/workspace/InterviewAnswerPlaybook'
import LeetCodeLeftPanel, { type LeftTab } from '../components/workspace/LeetCodeLeftPanel'
import LeetCodeRightPanel from '../components/workspace/LeetCodeRightPanel'
import ResizableSplit from '../components/workspace/ResizableSplit'
import JourneyPlayer from '../features/journey/JourneyPlayer'
import { useGrimoire } from '../lib/grimoire'
import { hostedAuthEnabled } from '../lib/auth'
import { precomputeTraceNarration } from '../lib/narrator/index.ts'
import { useDraft } from '../lib/useDraft'

const compactQuery = '(max-width: 760px)'
function subscribeCompactLayout(onChange: () => void) {
  const query = window.matchMedia(compactQuery)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export default function QuestionPage() {
  const { slug = '' } = useParams()
  const [search] = useSearchParams()
  return <QuestionWorkspace key={`${slug}:${search.toString()}`} />
}

function QuestionWorkspace() {
  const compactLayout = useSyncExternalStore(subscribeCompactLayout, () => window.matchMedia(compactQuery).matches, () => false)
  const { slug = '' } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const openGrimoire = useGrimoire()
  const blind = search.get('mode') === 'review'
  const requestedStage = search.get('stage')

  const [question, setQuestion] = useState<QuestionDetail | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [victory, setVictory] = useState<{ review: boolean } | null>(null)
  const progressRef = useRef<Progress | null>(null)

  const [leftTab, setLeftTab] = useState<LeftTab>(() => {
    const st = Number(search.get('stage'))
    if (st === 2) return 'drills'
    return 'description'
  })
  const [workspaceStep, setWorkspaceStep] = useState<'journey' | 'learn' | 'code' | 'interview'>(() => {
    const st = Number(search.get('stage'))
    if (blind) return 'code'
    if (st === 1) return 'learn'
    if (st === 2 || st === 3) return 'code'
    if (st === 4) return 'interview'
    return 'learn'
  })
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [mobilePane, setMobilePane] = useState<'problem' | 'editor'>('problem')
  const [activeTarget, setActiveTarget] = useState<string>('main')

  // Execution & Trace state
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [result, setResult] = useState<RunResult | null>(null)
  const [trace, setTrace] = useState<Trace | null>(null)
  const [tracedCode, setTracedCode] = useState<string>('')
  const [stepIndex, setStepIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    let active = true
    api
      .question(slug)
      .then((q) => {
        if (!active) return
        setQuestion(q)
        setProgress(q.progress)
        progressRef.current = q.progress
        setTracedCode(q.content?.solution?.code || q.content?.starter_code || '')
        if ((q.content?.journey && q.content.journey.length > 0) || (q.citadel_id && q.citadel_id !== 'dsa')) {
          if (!requestedStage && !blind) {
            setWorkspaceStep('journey')
          }
        }
      })
      .catch((e) => { if (active) setError(e.message) })

    // Preload demo trace so the Visualizer tab is immediately interactive
    if (!hostedAuthEnabled) api
      .demoTrace(slug)
      .then((res) => {
        if (active && res.trace?.steps?.length) {
          setTrace((prev) => prev ?? res.trace)
        }
      })
      .catch(() => {})
    return () => { active = false }
  }, [slug, requestedStage, blind])

  const onProgress = useCallback(
    (p: Progress) => {
      const prev = progressRef.current
      if (prev && prev.confidence === null && p.confidence !== null) setVictory({ review: false })
      else if (prev && blind && p.confidence !== null && p.last_practiced_at !== prev.last_practiced_at)
        setVictory({ review: true })
      progressRef.current = p
      setProgress(p)
    },
    [blind],
  )

  // Compute initial starter/draft code for activeTarget
  const initialCode = useMemo(() => {
    if (!question?.content) return ''
    if (activeTarget.startsWith('drill:')) {
      const idx = Number(activeTarget.split(':')[1])
      const d = question.content.drills[idx]
      return question.drafts[activeTarget] ?? d?.starter_code ?? ''
    }
    if (blind) return question.content.starter_code
    return question.drafts.main ?? question.content.starter_code
  }, [question, activeTarget, blind])

  const [code, setCode] = useDraft(slug, activeTarget, initialCode)

  const resetCode = () => {
    if (!question?.content) return
    if (activeTarget.startsWith('drill:')) {
      const idx = Number(activeTarget.split(':')[1])
      setCode(question.content.drills[idx]?.starter_code ?? '')
    } else {
      setCode(question.content.starter_code)
    }
  }

  const runCode = async (customArgs?: unknown, switchToViz = false) => {
    if (hostedAuthEnabled) {
      setRunError('Code execution is paused on the hosted site until the isolated runner is ready.')
      return
    }
    if (!question?.content) return
    setRunning(true)
    setRunError(null)
    setPlaying(false)
    try {
      const r = await api.run(slug, {
        code,
        target: activeTarget,
        visualize: true,
        custom_args: customArgs,
      })
      setResult(r)
      onProgress(r.progress)
      if (r.trace && r.trace.steps && r.trace.steps.length > 0) {
        setTrace(r.trace)
        setTracedCode(code)
        setStepIndex(0)
        if (switchToViz) {
          setLeftCollapsed(false)
          setLeftTab('visualizer')
          setPlaying(true)
        }
      }
    } catch (e) {
      setRunError((e as Error).message)
    } finally {
      setRunning(false)
    }
  }

  const playback = usePlayback({
    trace,
    index: stepIndex,
    onIndex: setStepIndex,
    playing,
    onPlaying: setPlaying,
    speed,
    onSpeed: setSpeed,
  })

  const narrations = useMemo(() => {
    if (!trace?.steps?.length || !question?.content) return []
    return precomputeTraceNarration(trace.steps, trace.line_info, question.content.viz, question.visualizer)
  }, [trace, question])

  if (error) {
    return (
      <div className="p-8">
        <ErrorNote message={error} />
      </div>
    )
  }
  if (!question || !progress) {
    return (
      <div className="h-dvh w-full overflow-hidden bg-void text-chalk" role="status" aria-label="Loading lesson">
        <div className="flex h-14 items-center gap-4 border-b border-line px-5">
          <Skeleton className="h-7 w-28 rounded-md" />
          <Skeleton className="h-5 w-52 max-w-[35vw] rounded-md" />
          <Skeleton className="ml-auto h-8 w-44 rounded-md" />
        </div>
        <div className="mx-auto grid h-[calc(100%-3.5rem)] max-w-7xl gap-6 px-4 py-6 md:grid-cols-[15rem_minmax(0,1fr)]">
          <div className="hidden space-y-4 md:block">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-7 w-40 rounded-md" />
            <Skeleton className="h-10 w-3/4 max-w-2xl rounded-md" />
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
        <span className="sr-only">Loading lesson</span>
      </div>
    )
  }

  const prerequisiteLessons = question.required_lessons
  const missingLessons = progress.solved ? [] : prerequisiteLessons.filter((lesson) => !lesson.mastered)
  if (missingLessons.length > 0) {
    return <div className="shell max-w-3xl py-10 space-y-6">
      <Link to={`/world/${question.world_id}`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-chalk"><ArrowLeft size={16} /> Back to {question.world_name}</Link>
      <div className="rounded-3xl border border-line bg-panel p-7 sm:p-9"><div className="text-xs font-semibold uppercase tracking-widest text-cyan">Your route to this question</div><h1 className="mt-2 font-plate text-3xl font-semibold text-chalk">Start with the first idea</h1><p className="mt-3 leading-7 text-muted">Before {question.title}, learn these ideas in order. Each short lesson uses a familiar situation and a worked example. We will bring you back here when you finish.</p><ol className="mt-6 space-y-3">{prerequisiteLessons.map((lesson, index) => <li key={lesson.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel-2 p-4"><span className="flex items-center gap-3 text-chalk"><span className="font-mono text-xs text-muted">{String(index + 1).padStart(2, '0')}</span>{lesson.title}</span><span className="shrink-0 text-sm text-cyan">{lesson.mastered ? 'Done' : lesson.id === missingLessons[0].id ? 'Up next' : 'Later'}</span></li>)}</ol><Link to={`/lesson/${missingLessons[0].id}?practice=${encodeURIComponent(slug)}`} className="mt-6 inline-flex rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-[var(--study-on-accent)]">{prerequisiteLessons.length === missingLessons.length ? 'Start' : 'Continue'}: {missingLessons[0].title} →</Link></div>
    </div>
  }

  const content = question.content
  const isBoss = question.position === question.world_total - 1
  const steps = playback.steps
  const curStep = steps[stepIndex]
  const prevStep = stepIndex > 0 ? steps[stepIndex - 1] : undefined
  const traceLine = curStep?.line ?? null
  const errorLine =
    result?.compile_error?.line ??
    result?.fatal_error?.line ??
    result?.results.find((r) => r.error?.line)?.error?.line ??
    null

  return (
    <div className="question-workspace flex h-dvh w-full flex-col overflow-hidden bg-void text-chalk">
      <header className="question-header">
        <div className="question-identity">
          <Link to={`/world/${question.world_id}`} className="question-back" aria-label={`Back to ${question.world_name}`} title={`Back to ${question.world_name}`}><ArrowLeft size={16} /><span>{question.world_name}</span></Link>
          <h1 title={question.title}>{question.title}</h1>
          <span className="question-difficulty"><DifficultyBadge difficulty={question.difficulty} /></span>
        </div>
        <nav className="question-modes" aria-label="Question workspace">
          <button aria-pressed={workspaceStep === 'journey' || workspaceStep === 'learn'} onClick={() => setWorkspaceStep(question.citadel_id !== 'dsa' || content?.journey?.length ? 'journey' : 'learn')}>Learn</button>
          <button aria-pressed={workspaceStep === 'code'} onClick={() => setWorkspaceStep('code')}>Practice</button>
          <button aria-pressed={workspaceStep === 'interview'} onClick={() => setWorkspaceStep('interview')}>Interview</button>
        </nav>
        <div className="question-tools">
          {workspaceStep === 'code' && <div className="question-code-tools flex items-center gap-2">
            <Button className="h-7 px-3 text-xs" onClick={() => runCode()} disabled={running || hostedAuthEnabled}><Play size={12} />{running ? 'Running…' : 'Run'}</Button>
          </div>}
          <details className="question-resource-menu">
            <summary aria-label="More question tools and resources" title="More tools"><ScrollText size={16} /></summary>
            <div>
              {workspaceStep === 'code' && <>
                <button type="button" onClick={() => runCode(undefined, true)} disabled={running || hostedAuthEnabled}><Eye size={15} /> Run and visualize</button>
                <button type="button" onClick={() => setLeftCollapsed(c => !c)}>{leftCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}{leftCollapsed ? 'Show problem' : 'Expand editor'}</button>
              </>}
              <button type="button" onClick={() => openGrimoire(question.world_id)}>Topic reference sheet</button>
              {question.prev_slug && <Link to={`/q/${question.prev_slug}`}><ChevronLeft size={13} /> Previous question</Link>}
              {question.next_slug && <Link to={`/q/${question.next_slug}`}>Next question <ChevronRight size={13} /></Link>}
            </div>
          </details>
          <ThemeToggle compact />
          <AccountMenu />
        </div>
      </header>
      {hostedAuthEnabled && workspaceStep === 'code' && <p className="border-b border-amber/30 bg-amber/10 px-4 py-2 text-xs text-amber" role="status">You can read and draft here. Running code is paused on the hosted site until a secure practice worker is ready.</p>}
      {!content ? (
        <div className="p-8">
          <ErrorNote message="This question's content is not yet available." />
        </div>
      ) : workspaceStep === 'journey' ? (
        <div className="flex-1 min-h-0 w-full overflow-y-auto bg-void">
          <JourneyPlayer
            key={slug}
            question={question}
            onProceedToCode={() => setWorkspaceStep('code')}
          />
        </div>
      ) : workspaceStep === 'learn' ? (
        <div className="flex-1 min-h-0 w-full overflow-y-auto bg-void">
          <DataStructurePrimer
            question={question}
            steps={steps}
            stepIndex={stepIndex}
            onSeek={setStepIndex}
            playing={playing}
            onTogglePlay={playback.togglePlay}
            onStepForward={playback.stepForward}
            onStepBackward={playback.stepBackward}
            onJumpFirst={playback.jumpFirst}
            onJumpLast={playback.jumpLast}
            speed={speed}
            onSpeedChange={setSpeed}
            narration={narrations[stepIndex]}
            onProceedToCode={() => setWorkspaceStep('code')}
          />
        </div>
      ) : workspaceStep === 'interview' ? (
        <div className="flex-1 min-h-0 w-full overflow-y-auto bg-void">
          <InterviewAnswerPlaybook
            question={question}
            progress={progress}
            onProgress={onProgress}
            onOpenTerminal={() => setWorkspaceStep('code')}
          />
        </div>
      ) : (

        <div className="flex flex-col flex-1 min-h-0 w-full overflow-hidden">
          <div className="mobile-code-nav"><button aria-pressed={mobilePane === 'problem'} onClick={() => setMobilePane('problem')}>Problem & help</button><button aria-pressed={mobilePane === 'editor'} onClick={() => setMobilePane('editor')}>Code & tests</button><button disabled={running || hostedAuthEnabled} onClick={() => { setMobilePane('editor'); runCode() }}>{running ? 'Running…' : 'Run code'}</button></div>
          <ResizableSplit
            className={`question-code-split ${mobilePane}-view`}
            direction="horizontal"
            initialPrimaryPct={45}
            minPrimaryPct={22}
            maxPrimaryPct={76}
            storageKey="pf-lc-split-x"
            primaryCollapsed={leftCollapsed && !compactLayout}
            first={
              <LeetCodeLeftPanel
                question={question}
                progress={progress}
                onProgress={onProgress}
                activeTab={leftTab}
                onTabChange={setLeftTab}
                activeTarget={activeTarget}
                onSelectTarget={setActiveTarget}
                steps={steps}
                stepIndex={stepIndex}
                onSeek={setStepIndex}
                playing={playing}
                onTogglePlay={playback.togglePlay}
                onStepForward={playback.stepForward}
                onStepBackward={playback.stepBackward}
                onJumpFirst={playback.jumpFirst}
                onJumpLast={playback.jumpLast}
                speed={speed}
                onSpeedChange={setSpeed}
                narration={narrations[stepIndex]}
                tracedCode={tracedCode}
                currentCode={code}
                onOpenInterviewGuide={() => setWorkspaceStep('interview')}
              />
            }
            second={
              <LeetCodeRightPanel
                question={question}
                activeTarget={activeTarget}
                onSelectTarget={setActiveTarget}
                code={code}
                onChangeCode={setCode}
                onResetCode={resetCode}
                onRun={(customArgs) => runCode(customArgs, false)}
                running={running}
                result={result}
                error={runError}
                traceLine={traceLine}
                errorLine={errorLine}
                step={curStep}
                prevStep={prevStep}
              />
            }
          />
        </div>
      )}

      <VictoryModal
        open={victory !== null}
        title={question.title}
        boss={isBoss}
        review={victory?.review ?? false}
        confidence={progress.confidence}
        nextReviewAt={progress.next_review_at}
        onNext={question.next_slug ? () => navigate(`/q/${question.next_slug}`) : undefined}
        onWorld={() => navigate(`/world/${question.world_id}`)}
        onClose={() => setVictory(null)}
      />
    </div>
  )
}
