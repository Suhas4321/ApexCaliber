import { ListTree, PanelLeftOpen, PanelRightClose } from 'lucide-react'
import { useEffect, useState } from 'react'
import SystemDesignSidebar, { type SelectedItem } from '../components/system-design/SystemDesignSidebar'
import SystemDesignSolidView from '../components/system-design/SystemDesignSolidView'
import SystemDesignLldView from '../components/system-design/SystemDesignLldView'
import SystemDesignHldView from '../components/system-design/SystemDesignHldView'
import SystemDesignSyllabusView from '../components/system-design/SystemDesignSyllabusView'
import { markSystemDesignCompleted, useSystemDesignProgress } from '../lib/systemDesignProgress'

export default function SystemDesignPage() {
  const [selected, setSelected] = useState<SelectedItem>(null)
  const { solved, total, completedIds } = useSystemDesignProgress()

  const [leftOpen, setLeftOpen] = useState(() => window.matchMedia('(min-width: 768px)').matches)
  const [leftWidth, setLeftWidth] = useState(280)
  const [draggingLeft, setDraggingLeft] = useState(false)

  const [rightOpen, setRightOpen] = useState(true)
  const [rightWidth, setRightWidth] = useState(240)
  const [draggingRight, setDraggingRight] = useState(false)

  useEffect(() => {
    if (!draggingLeft) return
    const onMove = (e: PointerEvent) => setLeftWidth(Math.max(220, Math.min(460, e.clientX)))
    const onUp = () => setDraggingLeft(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [draggingLeft])

  useEffect(() => {
    if (!draggingRight) return
    const onMove = (e: PointerEvent) => setRightWidth(Math.max(180, Math.min(380, window.innerWidth - e.clientX)))
    const onUp = () => setDraggingRight(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [draggingRight])

  const handleSelect = (next: SelectedItem) => {
    setSelected(next)
    if (window.matchMedia('(max-width: 767px)').matches) setLeftOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCompleted = (id: string) => {
    markSystemDesignCompleted(id)
  }

  return (
    <div className="w-full min-h-screen bg-void text-chalk flex overflow-hidden">
      {/* 1. Left Sticky Navigation Tree (Draggable & Closable) */}
      {leftOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            aria-label="Close curriculum navigator"
            onClick={() => setLeftOpen(false)}
          />
          <div id="system-design-curriculum" className="fixed inset-y-0 left-0 z-50 max-w-[85vw] md:static md:z-auto md:max-w-none">
            <SystemDesignSidebar
              selected={selected}
              onSelect={handleSelect}
              completedIds={completedIds}
              solvedCount={solved}
              totalCount={total}
              width={leftWidth}
              onClose={() => setLeftOpen(false)}
            />
          </div>

          {/* Left Draggable Resizer Gutter */}
          <div
            role="separator"
            aria-orientation="vertical"
            title="Drag to resize sidebar · Double-click to reset"
            onPointerDown={(e) => { e.preventDefault(); setDraggingLeft(true) }}
            onDoubleClick={() => setLeftWidth(280)}
            className={`hidden md:block w-1 shrink-0 cursor-col-resize bg-line hover:bg-violet-400/60 active:bg-violet-500 transition-colors z-20 select-none ${
              draggingLeft ? 'bg-violet-500 w-1.5' : ''
            }`}
          />
        </>
      )}

      {/* 2. Main Fluid Reading & Coding Canvas (Full Center Space Utilization) */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto px-4 sm:px-8 xl:px-12 py-6">
        <div className="system-design-reading w-full max-w-6xl mx-auto space-y-4">
          {/* A visible control makes the reading mode discoverable. */}
            <div className="flex items-center justify-between pb-2 border-b border-line text-xs">
              <div>
                  <button
                    type="button"
                    onClick={() => setLeftOpen((open) => !open)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-panel px-3 font-medium text-muted transition-colors hover:bg-panel-2 hover:text-chalk"
                    aria-expanded={leftOpen}
                    aria-controls="system-design-curriculum"
                  >
                    <PanelLeftOpen size={14} className="text-violet-500 dark:text-violet-400" />
                    <span>{leftOpen ? 'Focus reading' : 'Show curriculum'}</span>
                  </button>
              </div>

              <div>
                {!rightOpen && selected !== null && (
                  <button
                    type="button"
                    onClick={() => setRightOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 py-1 font-medium text-muted hover:text-chalk hover:bg-panel-2 transition-colors"
                    title="Open Table of Contents"
                  >
                    <ListTree size={14} className="text-violet-500 dark:text-violet-400" />
                    <span>On This Page</span>
                  </button>
                )}
              </div>
            </div>
          {selected === null && (
            <SystemDesignSyllabusView
              completedIds={completedIds}
              onOpenItem={handleSelect}
            />
          )}

          {selected?.kind === 'solid' && (
            <SystemDesignSolidView
              index={selected.index}
              onNavigate={handleSelect}
              completedIds={completedIds}
              onCompleted={handleCompleted}
            />
          )}

          {selected?.kind === 'lld' && (
            <SystemDesignLldView
              index={selected.index}
              onNavigate={handleSelect}
              completedIds={completedIds}
              onCompleted={handleCompleted}
            />
          )}

          {selected?.kind === 'hld' && (
            <SystemDesignHldView
              index={selected.index}
              onNavigate={handleSelect}
              completedIds={completedIds}
              onCompleted={handleCompleted}
            />
          )}
        </div>
      </main>

      {/* 3. Right Sticky "On This Page" Table of Contents (Draggable & Closable) */}
      {selected !== null && rightOpen && (
        <>
          {/* Right Draggable Resizer Gutter */}
          <div
            role="separator"
            aria-orientation="vertical"
            title="Drag to resize TOC · Double-click to reset"
            onPointerDown={(e) => { e.preventDefault(); setDraggingRight(true) }}
            onDoubleClick={() => setRightWidth(240)}
            className={`hidden 2xl:block w-1 shrink-0 cursor-col-resize bg-line hover:bg-violet-400/60 active:bg-violet-500 transition-colors z-20 select-none ${
              draggingRight ? 'bg-violet-500 w-1.5' : ''
            }`}
          />

          <aside
            style={{ width: `${rightWidth}px` }}
            className="hidden 2xl:flex flex-col shrink-0 border-l border-line bg-panel h-screen sticky top-0 p-5 space-y-4 select-none overflow-y-auto transition-[width] duration-75"
          >
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <span className="font-mono text-2xs uppercase tracking-wider text-muted font-semibold">
                On This Page
              </span>
              <button
                type="button"
                onClick={() => setRightOpen(false)}
                className="inline-flex items-center rounded p-1 text-muted hover:text-chalk hover:bg-panel-2 transition-colors"
                title="Close Table of Contents"
                aria-label="Close Table of Contents"
              >
                <PanelRightClose size={14} />
              </button>
            </div>

            <nav className="flex flex-col space-y-2 text-xs text-muted">
              {selected.kind === 'solid' && (
                <>
                  <a href="#section-concept" className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors">1. Mental Model & Scenario</a>
                  <a href="#section-tradeoffs" className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors">2. When to Apply vs YAGNI</a>
                  <a href="#section-code" className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors">3. Before vs After Refactor</a>
                  <a href="#section-lab" className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors">4. Hands-On Coding Lab</a>
                </>
              )}

              {selected.kind === 'lld' && (
                <>
                  <a href="#section-classes" className="hover:text-cyan transition-colors">1. Class Responsibilities</a>
                  <a href="#section-invariant" className="hover:text-cyan transition-colors">2. Domain Invariant</a>
                  <a href="#section-code" className="hover:text-cyan transition-colors">3. Python Implementation</a>
                  <a href="#section-lab" className="hover:text-cyan transition-colors">4. Hands-On Coding Lab</a>
                </>
              )}

              {selected.kind === 'hld' && (
                <>
                  <a href="#section-scale" className="hover:text-amber transition-colors">1. Scale Targets & SLA</a>
                  <a href="#section-failure" className="hover:text-amber transition-colors">2. Monolith Breaking Point</a>
                  <a href="#section-architecture" className="hover:text-amber transition-colors">3. Scaled Hop Flow</a>
                  <a href="#section-defenses" className="hover:text-amber transition-colors">4. Failure & Defenses</a>
                  <a href="#section-interview" className="hover:text-amber transition-colors">5. Senior Pitch</a>
                  <a href="#section-lab" className="hover:text-amber transition-colors">6. Hands-On Coding Lab</a>
                </>
              )}
            </nav>

            <div className="mt-auto pt-4 border-t border-line text-2xs text-muted">
              <span className="block font-semibold text-chalk mb-1">Pass to Complete</span>
              Solve the hands-on lab in each lesson to track completion in Citadel VIII.
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
