import {
  Code2,
  Compass,
  Cpu,
  Database,
  Globe,
  Network,
  Server,
  Sparkles,
  Terminal,
  type LucideProps,
} from 'lucide-react'

const CITADEL_ICON_COMPONENTS = {
  dsa: Code2,
  python_data: Terminal,
  sql_dbms: Database,
  os_concurrency: Cpu,
  backend_apis: Server,
  ai_resume: Sparkles,
  computer_networking: Globe,
  system_design: Network,
} as const

interface CitadelIconProps extends Omit<LucideProps, 'ref'> {
  id: string
}

/** Crisp line-art icon for each engineering curriculum track (never emojis). */
export function CitadelIcon({ id, size = 18, strokeWidth = 1.75, ...props }: CitadelIconProps) {
  const Icon = CITADEL_ICON_COMPONENTS[id as keyof typeof CITADEL_ICON_COMPONENTS] ?? Compass
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" {...props} />
}
