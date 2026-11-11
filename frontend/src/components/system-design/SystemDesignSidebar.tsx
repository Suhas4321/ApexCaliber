import { ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, Layers, LayoutGrid, PanelLeftClose, Server, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HLD_PROBLEMS, LLD_PROBLEMS, SOLID_PLAYBOOK } from '../../lib/systemDesignData'

export type SelectedItem =
  | { kind: 'solid'; index: number }
  | { kind: 'lld'; index: number }
  | { kind: 'hld'; index: number }
  | null

interface Props {
  selected: SelectedItem
  onSelect: (item: SelectedItem) => void
  completedIds: string[]
  solvedCount: number
  totalCount: number
  width?: number
  onClose?: () => void
}

export default function SystemDesignSidebar({
  selected,
  onSelect,
  completedIds,
  solvedCount,
  totalCount,
  width,
  onClose,
}: Props) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ solid: true, lld: true, hld: true })
  const toggle = (k: string) => setOpenSections((p) => ({ ...p, [k]: !p[k] }))
  const pct = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0

  const solidItems = SOLID_PLAYBOOK.map((sp, i) => ({ id: `solid-${sp.letter}`, num: `0${i + 1}`, label: sp.name.split('(')[0].trim(), tag: sp.letter }))
  const lldItems = LLD_PROBLEMS.map((l, i) => ({ id: l.id, num: `0${i + 1}`, label: l.title.replace(/^\d+\.\s*/, ''), tag: 'LLD' }))
  const hldItems = HLD_PROBLEMS.map((h, i) => ({ id: h.id, num: String(i + 1).padStart(2, '0'), label: h.title.replace(/^\d+\.\s*/, ''), tag: h.difficulty }))

  const sections = [
    { key: 'solid' as const, name: '1. OOP & SOLID', icon: ShieldCheck, color: 'text-cyan dark:text-cyan', active: 'border-cyan bg-cyan/10 dark:bg-cyan/20', items: solidItems },
    { key: 'lld' as const, name: '2. Low-Level Design', icon: Layers, color: 'text-cyan', active: 'border-cyan bg-cyan/10 dark:bg-cyan/20', items: lldItems },
    { key: 'hld' as const, name: '3. Distributed HLD', icon: Server, color: 'text-amber', active: 'border-amber bg-amber/10 dark:bg-amber-600/20', items: hldItems },
  ]

  return (
    <aside
      style={width ? { width: `${width}px` } : undefined}
      className="w-72 max-w-[85vw] md:max-w-none shrink-0 border-r border-line bg-panel flex flex-col h-screen sticky top-0 select-none overflow-hidden transition-[width] duration-75"
    >
      <div className="p-4 border-b border-line bg-panel-2 space-y-2.5">
        <div className="flex items-center justify-between">
          <Link to="/app" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-chalk transition-colors">
            <ArrowLeft size={13} />
            <span>Learning home</span>
          </Link>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded p-1 text-muted hover:text-chalk hover:bg-panel-3 transition-colors"
              title="Close Sidebar"
              aria-label="Close Sidebar"
            >
              <PanelLeftClose size={15} />
            </button>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between text-2xs">
            <span className="font-plate font-bold text-cyan uppercase tracking-wider">Learning path</span>
            <span className="font-mono text-muted">{solvedCount}/{totalCount} Done ({pct}%)</span>
          </div>
          <h2 className="font-plate text-sm font-bold text-chalk mt-0.5">System Design</h2>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-panel-3">
            <div className="h-full rounded-full bg-cyan dark:bg-cyan transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
            selected === null ? 'bg-cyan/15 text-cyan dark:text-cyan border border-cyan/30' : 'text-muted hover:bg-panel hover:text-chalk'
          }`}
        >
          <LayoutGrid size={13} />
          <span>Course overview</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2.5 text-xs">
        {sections.map((sec) => {
          const Icon = sec.icon
          const isOpen = openSections[sec.key]
          const doneCount = sec.items.filter((it) => completedIds.includes(it.id)).length

          return (
            <div key={sec.key}>
              <button
                type="button"
                onClick={() => toggle(sec.key)}
                className="flex w-full items-center justify-between px-2 py-1 text-2xs font-bold uppercase tracking-wider text-muted hover:text-chalk"
              >
                <div className="flex items-center gap-1.5">
                  <Icon size={13} className={sec.color} />
                  <span>{sec.name} ({doneCount}/{sec.items.length})</span>
                </div>
                {isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>

              {isOpen && (
                <div className="mt-0.5 space-y-0.5">
                  {sec.items.map((it, idx) => {
                    const isSelected = selected?.kind === sec.key && selected.index === idx
                    const done = completedIds.includes(it.id)
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => onSelect({ kind: sec.key, index: idx })}
                        className={`flex w-full items-center justify-between gap-1.5 rounded px-2 py-1.5 text-left transition-colors ${
                          isSelected ? `${sec.active} text-chalk font-semibold border-l-2` : 'text-muted hover:bg-panel-2 hover:text-chalk'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono text-2xs text-faint">{it.num}</span>
                          <span className="truncate">{it.label}</span>
                        </div>
                        {done ? <CheckCircle2 size={12} className="text-emerald shrink-0" /> : <span className="font-mono text-2xs text-faint shrink-0">{it.tag}</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
