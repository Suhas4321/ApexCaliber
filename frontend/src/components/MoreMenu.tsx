import { BarChart3, BookMarked, Compass, FlaskConical, HardDriveDownload, MoreHorizontal, Shapes, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../api/client'
import { hostedAuthEnabled } from '../lib/auth'

type Status = Awaited<ReturnType<typeof api.backupStatus>>

export default function MoreMenu({ onOpenGrimoire }: { onOpenGrimoire: () => void }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [busy, setBusy] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()

  useEffect(() => { setOpen(false); setConfirmRestore(false) }, [pathname])
  useEffect(() => {
    if (!open) return
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setConfirmRestore(false)
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])
  useEffect(() => {
    if (!open || hostedAuthEnabled) return
    setMessage(null)
    api.backupStatus().then(setStatus).catch(() => setMessage('Could not check for a local backup. Try opening this menu again.'))
  }, [open])

  async function backUp() {
    setBusy(true)
    setMessage(null)
    try {
      await api.backupDump()
      setStatus(await api.backupStatus())
      setMessage('Your local backup is ready.')
    } catch {
      setMessage('Could not create a backup. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function restore() {
    setBusy(true)
    setMessage(null)
    try {
      await api.backupRestore()
      setMessage('Your progress has been restored. Reloading…')
      window.setTimeout(() => window.location.reload(), 900)
    } catch {
      setMessage('Could not restore the backup. Your current progress is still here.')
      setConfirmRestore(false)
      setBusy(false)
    }
  }

  const navItem = 'flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-panel-2 hover:text-chalk'

  return <div ref={rootRef} className="relative">
    <button ref={triggerRef} type="button" onClick={() => setOpen((value) => !value)} aria-label="More learning tools" aria-expanded={open} aria-controls="more-tools-panel" className="flex size-9 items-center justify-center rounded-lg border border-line bg-panel text-muted transition-colors hover:border-line-strong hover:text-chalk">
      <MoreHorizontal size={18} aria-hidden="true" />
    </button>
    {open && <div id="more-tools-panel" className="absolute right-0 top-full z-[100] mt-2 w-[min(290px,calc(100vw-24px))] rounded-xl border border-line-strong bg-panel p-2 text-chalk shadow-xl">
      <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-faint">Learning tools</p>
      <Link to="/citadel/dsa" onClick={() => setOpen(false)} className={`${navItem} min-[951px]:hidden`} aria-current={pathname === '/citadel/dsa' || pathname.startsWith('/world/') ? 'page' : undefined}><Shapes size={17} aria-hidden="true" />Practice</Link>
      <Link to="/resume-grill" onClick={() => setOpen(false)} className={navItem} aria-current={pathname === '/resume-grill' ? 'page' : undefined}><ShieldCheck size={17} aria-hidden="true" />Interview practice</Link>
      <button type="button" onClick={() => { setOpen(false); onOpenGrimoire() }} className={`${navItem} w-full text-left`}><BookMarked size={17} aria-hidden="true" />Revision sheets</button>
      <Link to="/finder" onClick={() => setOpen(false)} className={navItem} aria-current={pathname === '/finder' ? 'page' : undefined}><Compass size={17} aria-hidden="true" />Pattern Finder</Link>
      {!hostedAuthEnabled && <Link to="/playground" onClick={() => setOpen(false)} className={navItem} aria-current={pathname === '/playground' ? 'page' : undefined}><FlaskConical size={17} aria-hidden="true" />Playground</Link>}
      <Link to="/stats" onClick={() => setOpen(false)} className={`${navItem} min-[951px]:hidden`} aria-current={pathname === '/stats' ? 'page' : undefined}><BarChart3 size={17} aria-hidden="true" />Progress</Link>
      {!hostedAuthEnabled && <details className="more-data-details mt-2 border-t border-line pt-2">
        <summary className={`${navItem} cursor-pointer list-none`}><HardDriveDownload size={17} aria-hidden="true" />Local data</summary>
        <div className="px-3 pb-2 pt-1">
          {confirmRestore ? <>
            <p className="text-sm leading-5 text-chalk">Restore your saved backup?</p>
            <p className="mt-1 text-xs leading-5 text-muted">This replaces your current progress and code drafts with the saved copy.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" disabled={busy} onClick={() => void restore()} className="min-h-9 rounded-lg bg-action px-3 text-xs font-semibold text-surface-0 disabled:opacity-50">Restore backup</button>
              <button type="button" disabled={busy} onClick={() => setConfirmRestore(false)} className="min-h-9 rounded-lg border border-line px-3 text-xs text-muted hover:text-chalk">Cancel</button>
            </div>
          </> : <>
            <p className="text-xs leading-5 text-muted">Save a copy of your progress and code drafts on this computer.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" disabled={busy} onClick={() => void backUp()} className="min-h-9 rounded-lg border border-line-strong px-3 text-xs font-semibold text-chalk hover:bg-panel-2 disabled:opacity-50">Back up now</button>
              <button type="button" disabled={busy || !status?.exists} onClick={() => setConfirmRestore(true)} className="min-h-9 rounded-lg border border-line px-3 text-xs text-muted hover:bg-panel-2 hover:text-chalk disabled:cursor-not-allowed disabled:opacity-40">Restore</button>
            </div>
          </>}
          {message && <p role="status" className="mt-3 text-xs leading-5 text-muted">{message}</p>}
        </div>
      </details>}
    </div>}
  </div>
}
