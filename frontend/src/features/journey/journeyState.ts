import type { JourneyStage } from '../../api/types'

export type LessonPhase = 'predict' | 'observe' | 'explain'
export interface StageProgress {
  prediction?: string
  phase: LessonPhase
  reached: number
  complete?: boolean
}
export interface JourneyProgress {
  stageIndex: number
  stages: Record<string, StageProgress>
}
export const PHASES: LessonPhase[] = ['predict', 'observe', 'explain']

/** Stored progress is untrusted: old lesson revisions and malformed storage must be safe. */
export function restoreJourney(raw: string | null, stages: JourneyStage[]): JourneyProgress {
  const empty: JourneyProgress = { stageIndex: 0, stages: {} }
  try {
    const saved = JSON.parse(raw || 'null')
    if (!saved || typeof saved !== 'object') return empty
    const stageIndex = Number.isInteger(saved.stageIndex)
      ? Math.max(0, Math.min(stages.length - 1, saved.stageIndex)) : 0
    const restored: Record<string, StageProgress> = {}
    for (const stage of stages) {
      const value = saved.stages?.[stage.id]
      if (!value || typeof value !== 'object') continue
      const prediction = stage.prediction?.choices.find(c => c.id === value.prediction)?.id
      const canObserve = !stage.prediction || Boolean(prediction)
      const reached = canObserve && Number.isInteger(value.reached) ? Math.max(1, Math.min(2, value.reached)) : 0
      const phase = PHASES.includes(value.phase) && (stage.prediction || value.phase !== 'predict') && PHASES.indexOf(value.phase) <= reached
        ? value.phase : PHASES[reached]
      restored[stage.id] = { prediction, phase, reached, complete: reached === 2 && value.complete === true }
    }
    return { stageIndex, stages: restored }
  } catch { return empty }
}

export function initialStage(stage: JourneyStage): StageProgress {
  return { phase: stage.prediction ? 'predict' : 'observe', reached: stage.prediction ? 0 : 1 }
}
