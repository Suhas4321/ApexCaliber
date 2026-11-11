import * as Dialog from '@radix-ui/react-dialog'
import { ChevronDown, ListTree, PanelLeftOpen } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import SystemDesignSidebar, { type SelectedItem } from '../components/system-design/SystemDesignSidebar'
import SystemDesignSolidView from '../components/system-design/SystemDesignSolidView'
import SystemDesignLldView from '../components/system-design/SystemDesignLldView'
import SystemDesignHldView from '../components/system-design/SystemDesignHldView'
import SystemDesignSyllabusView from '../components/system-design/SystemDesignSyllabusView'
import { markSystemDesignCompleted, useSystemDesignProgress } from '../lib/systemDesignProgress'

const contents = {
  solid: [['concept', 'Mental model & scenario'], ['tradeoffs', 'When to apply vs YAGNI'], ['code', 'Before & after refactor'], ['lab', 'Hands-on coding lab']],
  lld: [['classes', 'Class responsibilities'], ['invariant', 'Domain invariant'], ['code', 'Python implementation'], ['lab', 'Hands-on coding lab']],
  hld: [['scale', 'Scale targets & SLA'], ['failure', 'Monolith breaking point'], ['architecture', 'Scaled hop flow'], ['defenses', 'Failure & defenses'], ['interview', 'Senior pitch'], ['lab', 'Hands-on coding lab']],
}

export default function SystemDesignPage() {
  const [selected, setSelected] = useState<SelectedItem>(null)
  const { solved, total, completedIds } = useSystemDesignProgress()
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  const [leftOpen, setLeftOpen] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const hasSelected = useRef(false)
  const focusAfterDrawerSelection = useRef(false)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const update = () => { setWide(media.matches); setDrawerOpen(false) }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!hasSelected.current) return
    contentRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [selected])

  const handleSelect = (next: SelectedItem) => {
    hasSelected.current = true
    focusAfterDrawerSelection.current = drawerOpen
    setSelected(next)
    setDrawerOpen(false)
  }
  const sidebar = <SystemDesignSidebar selected={selected} onSelect={handleSelect} completedIds={completedIds} solvedCount={solved} totalCount={total} width={270} onClose={() => wide ? setLeftOpen(false) : setDrawerOpen(false)} />

  return <div className="system-design-layout">
    {wide && leftOpen && <div className="system-curriculum-desktop">{sidebar}</div>}
    <div className="system-design-content" ref={contentRef} tabIndex={-1}>
      <div className="system-design-reading w-full mx-auto space-y-8">
        <div className="system-reading-toolbar">
          {wide ? <button type="button" className="study-outline-button" aria-expanded={leftOpen} onClick={() => setLeftOpen(!leftOpen)}><PanelLeftOpen size={16} />{leftOpen ? 'Focus reading' : 'Show curriculum'}</button> : <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
            <Dialog.Trigger className="study-outline-button"><PanelLeftOpen size={16} />Show curriculum</Dialog.Trigger>
            <Dialog.Portal><Dialog.Overlay className="studio-drawer-overlay" /><Dialog.Content className="studio-drawer system-curriculum-drawer" aria-describedby={undefined} onCloseAutoFocus={(event) => { if (focusAfterDrawerSelection.current) { event.preventDefault(); contentRef.current?.focus(); focusAfterDrawerSelection.current = false } }}><Dialog.Title className="sr-only">System design curriculum</Dialog.Title>{sidebar}</Dialog.Content></Dialog.Portal>
          </Dialog.Root>}
          {selected && <details className="system-contents"><summary><ListTree size={16} />On this page<ChevronDown size={14} /></summary><nav aria-label="On this page">{contents[selected.kind].map(([id, title]) => <a key={id} href={`#section-${id}`} onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open') }}>{title}</a>)}</nav></details>}
          <span className="system-reading-progress">{solved} of {total} lessons complete</span>
        </div>
        {selected === null && <SystemDesignSyllabusView completedIds={completedIds} onOpenItem={handleSelect} />}
        {selected?.kind === 'solid' && <SystemDesignSolidView index={selected.index} onNavigate={handleSelect} completedIds={completedIds} onCompleted={markSystemDesignCompleted} />}
        {selected?.kind === 'lld' && <SystemDesignLldView index={selected.index} onNavigate={handleSelect} completedIds={completedIds} onCompleted={markSystemDesignCompleted} />}
        {selected?.kind === 'hld' && <SystemDesignHldView index={selected.index} onNavigate={handleSelect} completedIds={completedIds} onCompleted={markSystemDesignCompleted} />}
      </div>
    </div>
  </div>
}
