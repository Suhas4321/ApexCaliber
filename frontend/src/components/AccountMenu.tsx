import { BarChart3, ChevronDown, House, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import SignOutButton from './SignOutButton'

/** The same account affordance is used in the learning shell and full-screen tools. */
export default function AccountMenu({ className = '' }: { className?: string }) {
  const { session } = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
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

  if (!session) return null
  const name = session.user.name || session.user.email || 'Account'
  const initials = name.slice(0, 2).toUpperCase()

  return <div ref={rootRef} className={`account-menu ${className}`}>
    <button ref={triggerRef} type="button" className="account-menu-trigger" aria-label="Open account menu" aria-expanded={open} aria-controls="account-menu-panel" onClick={() => setOpen((value) => !value)}>
      <span className="account-menu-avatar" aria-hidden="true">{initials || <UserRound size={16} />}</span>
      <ChevronDown size={14} aria-hidden="true" />
    </button>
    {open && <div id="account-menu-panel" className="account-menu-panel">
      <div className="account-menu-identity"><span>Signed in as</span><strong title={name}>{name}</strong></div>
      <Link to="/app" onClick={() => setOpen(false)}><House size={16} /> Learning home</Link>
      <Link to="/stats" onClick={() => setOpen(false)}><BarChart3 size={16} /> Progress</Link>
      <div className="account-menu-divider" />
      <SignOutButton className="account-menu-signout" />
    </div>}
  </div>
}
