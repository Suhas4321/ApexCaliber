import curriculumData from './curriculum.json'

export interface Citadel {
  id: string
  name: string
  shortName: string
  numeral: string
  icon: string
  tagline: string
  description: string
  worldIds: number[]
  tiers: number[][]
  edges: [number, number][]
  themeColor: string
}

const CITADEL_ICONS: Record<string, string> = {
  dsa: 'code',
  python_data: 'terminal',
  sql_dbms: 'database',
  os_concurrency: 'cpu',
  backend_apis: 'server',
  ai_resume: 'sparkles',
  computer_networking: 'globe',
}

interface RawCitadel {
  id: string
  numeral: string
  name: string
  short_name: string
  accent: string
  tagline: string
  description: string
  tiers: number[][]
  edges: number[][]
}

export const PEAK_ACCENTS_DARK: Record<string, string> = {
  dsa: '#00FF88',
  python_data: '#00FF88',
  sql_dbms: '#00FF88',
  os_concurrency: '#00FF88',
  backend_apis: '#00FF88',
  ai_resume: '#00FF88',
  computer_networking: '#00FF88',
}

export const PEAK_ACCENTS_LIGHT: Record<string, string> = {
  dsa: '#047857',
  python_data: '#047857',
  sql_dbms: '#047857',
  os_concurrency: '#047857',
  backend_apis: '#047857',
  ai_resume: '#047857',
  computer_networking: '#047857',
}

export const PEAK_ACCENTS: Record<string, string> = PEAK_ACCENTS_DARK

export function getCitadelAccent(citadelId: string, isLight = false): string {
  return isLight ? (PEAK_ACCENTS_LIGHT[citadelId] ?? '#047857') : (PEAK_ACCENTS_DARK[citadelId] ?? '#00FF88')
}

export const CITADELS: Citadel[] = (((curriculumData as unknown) as { citadels?: RawCitadel[] }).citadels || []).map((raw) => {
  const worldIds = raw.tiers.flat()
  return {
    id: raw.id,
    name: raw.name,
    shortName: raw.short_name,
    numeral: raw.numeral,
    icon: CITADEL_ICONS[raw.id] ?? 'compass',
    tagline: raw.tagline,
    description: raw.description,
    worldIds,
    tiers: raw.tiers,
    edges: (raw.edges || []).map(([f, t]) => [f, t] as [number, number]),
    themeColor: `var(--study-accent, ${PEAK_ACCENTS_DARK[raw.id] ?? '#00FF88'})`,
  }
})

export function getCitadel(id?: string): Citadel {
  return CITADELS.find((c) => c.id === id) ?? CITADELS[0]
}

export function citadelForWorld(worldId: number): Citadel {
  return CITADELS.find((c) => c.worldIds.includes(worldId)) ?? CITADELS[0]
}
