import * as Dialog from '@radix-ui/react-dialog'
import { BookMarked, CalendarClock, Compass, FlaskConical, Map, Moon, Mountain, Search, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { World } from '../api/types'
import { useGrimoire } from '../lib/grimoire'
import { currentQuest, questUrl } from '../lib/journey'
import { DifficultyBadge, Kbd } from './ui'
import { hostedAuthEnabled } from '../lib/auth'

interface Item {
  id: string
  group: 'Actions' | 'Topics' | 'Questions'
  label: string
  detail?: string
  icon: ReactNode
  /** lower-case text the query is matched against */
  haystack: string
  badge?: ReactNode
  run: () => void
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

/** Ranks an item for a query: every word must match; title-prefix and LeetCode-number hits rank first. */
function score(item: Item, words: string[]): number {
  let s = 0
  for (const w of words) {
    const num = w.replace(/^#/, '')
    if (/^\d+$/.test(num) && item.haystack.includes(` #${num} `)) s += 100
    else if (item.label.toLowerCase().startsWith(w)) s += 40
    else if (item.label.toLowerCase().includes(w)) s += 20
    else if (item.haystack.includes(w)) s += 5
    else return -1
  }
  return s + (item.group === 'Actions' ? 3 : item.group === 'Topics' ? 2 : 0)
}

export function openCommandPalette() {
  window.dispatchEvent(new Event('pf-open-palette'))
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [worlds, setWorlds] = useState<World[] | null>(null)
  const navigate = useNavigate()
  const openGrimoire = useGrimoire()
  const openerRef = useRef<HTMLElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Ctrl/Cmd+K anywhere, "/" when not typing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof Element && e.target.closest('input, textarea, [contenteditable], .monaco-editor')
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (!open) openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
        setOpen((o) => !o)
      } else if (e.key === '/' && !typing && !open) {
        e.preventDefault()
        openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
        setOpen(true)
      }
    }
    const onOpen = () => { openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setOpen(true) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pf-open-palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pf-open-palette', onOpen)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    let activeRequest = true
    setLoadError('')
    api.worlds().then((data) => { if (activeRequest) setWorlds(data) }).catch(() => {
      if (activeRequest) { setWorlds([]); setLoadError('Topics could not load. Your navigation shortcuts are still available.') }
    })
    return () => { activeRequest = false }
  }, [open, attempt])

  const items = useMemo<Item[]>(() => {
    const close = (fn: () => void) => () => {
      setOpen(false)
      fn()
    }
    const quest = worlds ? currentQuest(worlds) : null
    const actions: Item[] = [
      ...(quest
        ? [
            {
              id: 'continue',
              group: 'Actions' as const,
              label: quest.reason === 'review' ? 'Do the due blind re-solve' : 'Continue practice',
              detail: quest.question.title,
              icon: quest.reason === 'review' ? <CalendarClock size={16} /> : <Sparkles size={16} />,
              haystack: 'continue journey next quest current review',
              run: close(() => navigate(questUrl(quest.question))),
            },
          ]
        : []),
      { id: 'journey', group: 'Actions', label: 'Learning home', icon: <Map size={16} />, haystack: 'journey dashboard home constellation map', run: close(() => navigate('/app')) },
      { id: 'finder', group: 'Actions', label: 'Pattern Finder', detail: 'Which pattern is this problem?', icon: <Compass size={16} />, haystack: 'pattern finder which pattern flowchart decide', run: close(() => navigate('/finder')) },
      { id: 'grimoire', group: 'Actions', label: 'Revision guide', detail: 'Revision sheets', icon: <BookMarked size={16} />, haystack: 'grimoire cheat sheet revision notes pitch', run: close(() => openGrimoire()) },
      ...(!hostedAuthEnabled ? [{ id: 'playground', group: 'Actions' as const, label: 'Playground', detail: 'Trace any code', icon: <FlaskConical size={16} />, haystack: 'playground trace visualize code', run: close(() => navigate('/playground')) }] : []),
      { id: 'theme', group: 'Actions', label: 'Switch theme', detail: 'Switch between light and dark', icon: <Moon size={16} />, haystack: 'theme dark light mode system night expedition alpine morning', run: close(() => window.dispatchEvent(new Event('pf-toggle-theme'))) },
    ]
    const worldItems: Item[] = (worlds ?? []).map((w) => ({
      id: `world-${w.id}`,
      group: 'Topics',
      label: w.name,
      detail: `${w.solved}/${w.total} solved`,
      icon: <Mountain size={16} />,
      haystack: `world ${w.id} ${w.name} ${w.triggers.join(' ')}`.toLowerCase(),
      run: close(() => navigate(`/world/${w.id}`)),
    }))
    const questionItems: Item[] = (worlds ?? []).flatMap((w) =>
      w.questions.map((q) => ({
        id: q.slug,
        group: 'Questions' as const,
        label: q.title,
        detail: `${w.name.replace(/ — .*/, '')}${q.progress.solved ? ', solved' : ''}`,
        icon: <span className="font-mono text-caption">{q.citadel_id === 'dsa' ? `#${q.lc}` : 'Q'}</span>,
        haystack: ` ${q.citadel_id === 'dsa' ? `#${q.lc}` : ''} ${q.title} ${q.difficulty} ${w.name} ${q.patterns.join(' ').replace(/-/g, ' ')} `.toLowerCase(),
        badge: <DifficultyBadge difficulty={q.difficulty} />,
        run: close(() => navigate(questUrl(q))),
      })),
    )
    return [...actions, ...worldItems, ...questionItems]
  }, [worlds, navigate, openGrimoire])

  const results = useMemo(() => {
    const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
    if (!words.length) return items.filter((i) => i.group !== 'Questions')
    return items
      .map((i) => ({ i, s: score(i, words) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 40)
      .map((x) => x.i)
  }, [items, query])

  useEffect(() => setActive(0), [query])
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.max(0, Math.min(results.length - 1, a + 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      results[active]?.run()
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-[3px]" />
      <Dialog.Content className="command-dialog fixed left-1/2 top-[12vh] z-[81] w-[calc(100%_-_32px)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-line bg-panel shadow-2xl" aria-describedby={undefined} onCloseAutoFocus={(event) => { event.preventDefault(); if (openerRef.current?.isConnected) openerRef.current.focus() }} onOpenAutoFocus={(event) => { event.preventDefault(); inputRef.current?.focus() }}>
        <Dialog.Title className="sr-only">Search topics and questions</Dialog.Title>
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={17} className="shrink-0 text-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                aria-label="Search topics and questions"
                placeholder="Search topics, questions, or a pattern…"
                className="h-12 w-full bg-transparent text-ui text-chalk outline-none placeholder:text-faint"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
                aria-activedescendant={results[active] ? `pal-${results[active].id}` : undefined}
              />
              {query && <button type="button" aria-label="Clear search" onClick={() => { setQuery(''); inputRef.current?.focus() }} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted hover:bg-panel-2"><X size={16} /></button>}
              <Dialog.Close aria-label="Close search" className="rounded px-2 py-1 text-xs text-muted hover:bg-panel-2">Esc</Dialog.Close>
            </div>
            {loadError && <div role="alert" className="border-b border-line px-4 py-3 text-sm text-muted">{loadError}<button type="button" onClick={() => setAttempt((value) => value + 1)} className="ml-2 font-semibold text-cyan hover:underline">Try again</button></div>}
            <div ref={listRef} id="palette-list" role="listbox" className="max-h-[52vh] overflow-y-auto p-2">
              {!worlds && <p className="px-3 py-6 text-center text-sm text-muted">Loading…</p>}
              {worlds && results.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted">
                  Nothing matches “{query}”. Try a LeetCode number like <span className="font-mono">#3</span> or a pattern like “window”.
                </p>
              )}
              {results.map((r, idx) => {
                const header = r.group !== results[idx - 1]?.group ? r.group : null
                return (
                  <div key={r.id}>
                    {header && <div className="px-3 pt-2 pb-1 text-2xs font-medium text-faint">{header}</div>}
                    <button
                      id={`pal-${r.id}`}
                      data-index={idx}
                      role="option"
                      aria-selected={idx === active}
                      onMouseMove={() => setActive(idx)}
                      onClick={r.run}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-100 ${
                        idx === active ? 'bg-cyan/10' : ''
                      }`}
                    >
                      <span className={`flex w-8 shrink-0 justify-center ${idx === active ? 'text-cyan' : 'text-muted'}`}>{r.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-chalk">{r.label}</span>
                        {r.detail && <span className="block truncate text-xs text-muted">{r.detail}</span>}
                      </span>
                      {r.badge}
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-2xs text-faint">
              <span className="flex items-center gap-1"><Kbd keys={['↑', '↓']} /> move</span>
              <span className="flex items-center gap-1"><Kbd keys={['Enter']} /> open</span>
              <span className="ml-auto flex items-center gap-1"><Kbd keys={[isMac ? '⌘' : 'Ctrl', 'K']} /> toggle</span>
            </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
