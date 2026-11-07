import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, Code2, List, RotateCcw } from 'lucide-react'
import type { QuestionDetail, JourneyStage } from '../../api/types'
import { Markdown } from '../../components/ui'
import { getCitadel } from '../../lib/citadels'
import { initialStage, PHASES, restoreJourney, type JourneyProgress, type StageProgress } from './journeyState'
import LessonExperiment from './LessonExperiment'
import './journey.css'

interface JourneyPlayerProps {
  question: QuestionDetail
  onProceedToCode: () => void
}

export default function JourneyPlayer({ question, onProceedToCode }: JourneyPlayerProps) {
  const content = question.content!
  const stages = useMemo<JourneyStage[]>(() => content.journey?.length ? content.journey : [{
    id: 'core-concept', title: question.title, subtitle: 'Build your intuition, then put it into practice.',
    scenario: content.concept.problem_it_solves, mechanism: content.concept.key_insight,
    prediction: {
      prompt: content.pattern_quiz.prompt,
      choices: content.pattern_quiz.options.map((label, i) => ({ id: String(i), label,
        is_correct: i === content.pattern_quiz.answer, explanation: content.pattern_quiz.explanation })),
      revealed_explanation: content.concept.real_world,
    },
  }], [content, question.title])
  const storageKey = `apex_lesson_v2_${question.slug}`
  const [progress, setProgress] = useState<JourneyProgress>(() => {
    try {
      const current = localStorage.getItem(storageKey)
      if (current) return restoreJourney(current, stages)
      const legacyKey = `apex_journey_${question.slug}`
      const predictions = JSON.parse(localStorage.getItem(`${legacyKey}_predictions`) || '{}')
      const legacy = {
        stageIndex: Number(localStorage.getItem(`${legacyKey}_stage`) || 0),
        stages: Object.fromEntries(stages.map(stage => [stage.id, {
          prediction: predictions?.[stage.id], phase: predictions?.[stage.id] ? 'observe' : 'predict',
          reached: predictions?.[stage.id] ? 1 : 0,
        }])),
      }
      return restoreJourney(JSON.stringify(legacy), stages)
    }
    catch { return restoreJourney(null, stages) }
  })
  const [outlineOpen, setOutlineOpen] = useState(false)
  const [storageFailed, setStorageFailed] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const stage = stages[progress.stageIndex]
  const state = progress.stages[stage.id] || initialStage(stage)
  const chosenAnswer = stage.prediction?.choices.find(choice => choice.id === state.prediction)
  const completed = stages.filter(s => progress.stages[s.id]?.complete).length
  const citadel = getCitadel(question.citadel_id)

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(progress)) }
    catch {
      // External storage can fail after a user action; surface that failure in the UI.
      // eslint-disable-next-line react/set-state-in-effect
      setStorageFailed(true)
    }
  }, [progress, storageKey])

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
    headingRef.current?.focus({ preventScroll: true })
  }, [progress.stageIndex, state.phase])

  const updateStage = (update: Partial<StageProgress>) => setProgress(p => ({
    ...p, stages: { ...p.stages, [stage.id]: { ...(p.stages[stage.id] || initialStage(stage)), ...update } },
  }))
  const selectStage = (stageIndex: number) => {
    setProgress(p => ({ ...p, stageIndex }))
    setOutlineOpen(false)
  }
  const nextLesson = () => {
    setProgress(p => ({ ...p, stageIndex: Math.min(stages.length - 1, p.stageIndex + 1),
      stages: { ...p.stages, [stage.id]: { ...state, complete: true } } }))
    if (progress.stageIndex === stages.length - 1) onProceedToCode()
  }

  return (
    <div className="lesson-layout">
      <button className="lesson-outline-toggle" onClick={() => setOutlineOpen(!outlineOpen)} aria-expanded={outlineOpen} aria-controls="lesson-outline">
        <List size={16} /> Lesson {progress.stageIndex + 1} of {stages.length}<span>{outlineOpen ? 'Close outline' : 'Lesson outline'}</span>
      </button>
      <aside id="lesson-outline" className={`lesson-outline ${outlineOpen ? 'is-open' : ''}`} aria-label="Lesson outline">
        <div className="lesson-outline-heading">
          <span className="lesson-eyebrow">{citadel.shortName} / World {question.world_id}</span>
          <h2>{question.title}</h2>
          <div className="lesson-completion"><span>{completed} of {stages.length} explored</span><BookOpen size={14} /></div>
          <progress value={completed} max={stages.length} aria-label="Lessons explored" />
        </div>
        <nav aria-label="Concept lessons">
          {stages.map((s, i) => (
            <button key={s.id} className={`lesson-outline-item ${i === progress.stageIndex ? 'is-current' : ''}`} aria-current={i === progress.stageIndex ? 'step' : undefined} onClick={() => selectStage(i)}>
              <span className="lesson-number">{progress.stages[s.id]?.complete ? <Check size={13} /> : String(i + 1).padStart(2, '0')}</span>
              <span>{s.title.replace(/^Transfer Challenge: /, '')}</span>
            </button>
          ))}
        </nav>
        <div className="lesson-outline-footer">
          <p>Think it through. Try it out.<br />Then understand why.</p>
          <button onClick={onProceedToCode}><Code2 size={15} /> Open practice editor <ArrowRight size={14} /></button>
          <span>{storageFailed ? 'Progress could not be saved in this browser.' : 'Your place is saved in this browser.'}</span>
        </div>
      </aside>
      <div className="lesson-main" ref={mainRef}>
        <div className="lesson-body">
          <div className="lesson-meta"><span className="lesson-eyebrow">Lesson {String(progress.stageIndex + 1).padStart(2, '0')} / {String(stages.length).padStart(2, '0')}</span><span>Concept journey</span></div>
          <h1 className="lesson-title" ref={headingRef} tabIndex={-1}>{stage.title.replace(/^Transfer Challenge: /, '')}</h1>
          {stage.subtitle && <p className="lesson-subtitle">{stage.subtitle}</p>}
          <nav className="lesson-phases" aria-label="Learning sequence">
            {PHASES.map((phase, i) => (
              <button key={phase} aria-current={state.phase === phase ? 'step' : undefined} disabled={i > state.reached || (phase === 'predict' && !stage.prediction)} onClick={() => updateStage({ phase })}>
                <span>{i < state.reached ? <Check size={12} /> : i + 1}</span>
                {['Make a prediction', 'Explore', 'Understand'][i]}
              </button>
            ))}
          </nav>
          {state.phase === 'predict' && stage.prediction && (
            <Prediction key={stage.id} stage={stage} committed={state.prediction} onCommit={prediction => updateStage({ prediction, phase: 'observe', reached: Math.max(1, state.reached) })} />
          )}
          {state.phase === 'observe' && (
            <section className="lesson-section" aria-label="Explore the concept">
              <div className="lesson-section-heading"><div><span className="lesson-eyebrow">02 / Explore</span><h2>See what changes.</h2></div><span className="lesson-status">{stage.prediction ? 'Prediction saved' : 'Guided exploration'}</span></div>
              <LessonExperiment key={stage.id} stage={stage} question={question} />
              <div className="lesson-actions"><button className="lesson-link" disabled={!stage.prediction} onClick={() => updateStage({ phase: 'predict' })}><ArrowLeft size={15} /> Your prediction</button><button className="lesson-primary" onClick={() => updateStage({ phase: 'explain', reached: 2 })}>Understand why <ArrowRight size={16} /></button></div>
            </section>
          )}
          {state.phase === 'explain' && (
            <section className="lesson-section" aria-label="Explanation">
              <div className="lesson-section-heading"><div><span className="lesson-eyebrow">03 / Understand</span><h2>Connect the dots.</h2></div></div>
              <div className="lesson-explanation">
                <div className="lesson-prose"><Markdown>{stage.mechanism}</Markdown></div>
                {stage.prediction && <div className="lesson-feedback">
                  <span className="lesson-eyebrow">Your prediction</span>
                  <p>{chosenAnswer?.label}</p>
                  <h3>{chosenAnswer?.is_correct ? 'Your intuition was right.' : 'Here’s the distinction.'}</h3>
                  {chosenAnswer?.explanation && chosenAnswer.explanation !== stage.prediction.revealed_explanation && <Markdown>{chosenAnswer.explanation}</Markdown>}
                  <Markdown>{stage.prediction.revealed_explanation}</Markdown>
                </div>}
              </div>
              {(stage.lab_starter_code || stage.lab_solution) && <details className="lesson-reference"><summary>Code example for this lesson</summary><p>Study this example, then use the practice editor for the question’s executable tests.</p><pre><code>{stage.lab_solution || stage.lab_starter_code}</code></pre></details>}
              <div className="lesson-actions"><button className="lesson-link" onClick={() => updateStage({ phase: 'observe' })}><RotateCcw size={15} /> Revisit exploration</button><button className="lesson-primary" onClick={nextLesson}>{progress.stageIndex === stages.length - 1 ? 'Practice in editor' : 'Continue to next lesson'} <ArrowRight size={16} /></button></div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function Prediction({ stage, committed, onCommit }: { stage: JourneyStage; committed?: string; onCommit: (id: string) => void }) {
  const [selected, setSelected] = useState(committed || '')
  const prediction = stage.prediction!
  return <section className="lesson-section prediction-layout" aria-label="Make a prediction">
    <div className="lesson-scenario">
      <span className="lesson-eyebrow">The situation</span>
      <div className="lesson-prose"><Markdown>{stage.scenario}</Markdown></div>
      <p className="lesson-aside-note">Start with your intuition.<br />You’ll explore the behavior before seeing the explanation.</p>
    </div>
    <form onSubmit={e => { e.preventDefault(); if (selected) onCommit(selected) }}>
      <fieldset disabled={Boolean(committed)}>
        <legend>{prediction.prompt}</legend>
        <div className="prediction-options">{prediction.choices.map((choice, i) => <label key={choice.id} className={`prediction-option ${selected === choice.id ? 'is-selected' : ''}`}>
          <input type="radio" name={`prediction-${stage.id}`} value={choice.id} checked={selected === choice.id} onChange={() => setSelected(choice.id)} />
          <span className="prediction-letter" aria-hidden="true">{String.fromCharCode(65 + i)}</span><span>{choice.label}</span>
        </label>)}</div>
      </fieldset>
      <div className="prediction-submit"><p>{committed ? 'Your original prediction is saved.' : 'A prediction, not a score. It’s okay to be wrong.'}</p><button type="submit" className="lesson-primary" disabled={!selected}>{committed ? 'Return to exploration' : 'Commit & explore'} <ArrowRight size={16} /></button></div>
    </form>
  </section>
}
