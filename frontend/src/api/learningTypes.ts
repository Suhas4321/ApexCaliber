export type LearningSummary = {
  concepts_mastered: number
  total_concepts: number
  challenges_solved: number
  total_challenges: number
}

export type LessonStep = {
  id: string
  title: string
  summary: string
  position: number
  mastered: boolean
  ready: boolean
  prerequisites: string[]
  prerequisite_details: Array<{ id: string; title: string; mastered: boolean }>
}

export type CueCard = {
  elevator_pitch: string
  pillars: string[]
  tradeoffs: string[]
  candidate_trap: string
}

export type LearningPath = {
  citadel_id: string
  modules: Array<{
    id: string
    title: string
    summary: string
    position: number
    completed: boolean
    cue_card: CueCard | null
    practice_challenges: Array<{ slug: string; title: string }>
    lessons: LessonStep[]
  }>
}

export type LessonDetail = LessonStep & {
  module_id: string
  citadel_id: string
  passed_checks: number[]
  content: {
    situation: string
    explanation: string
    terms: Array<{ name: string; meaning: string }>
    worked_example: string
    second_example_prompt: string
    second_example: string
    misconception: string
    visual: LessonVisual | null
    checks: Array<{ prompt: string; choices: string[] }>
    sources: string[]
  }
}

export type CheckResult = {
  correct: boolean
  explanation: string
  passed_checks: number[]
  mastered: boolean
}

export type LessonVisual = {
  kind: 'race' | 'join' | 'model'
  title: string
  tracks: Array<{
    id: string
    title: string
    steps: Array<{ label: string; explanation: string; state: Record<string, string> }>
  }>
}
