import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../lib/auth'

export default function SignOutButton({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const { signOut } = useAuth()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleSignOut() {
    setBusy(true)
    setFailed(false)
    try {
      await signOut()
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return <button
    type="button"
    aria-label={failed ? 'Log out failed. Try again.' : 'Log out'}
    title={failed ? 'Could not log out. Try again.' : 'Log out'}
    disabled={busy}
    onClick={() => void handleSignOut()}
    className={className}
  >
    <LogOut size={compact ? 15 : 16} aria-hidden="true" />
    <span className={compact ? 'hidden sm:inline' : ''}>{failed ? 'Retry log out' : busy ? 'Logging out…' : 'Log out'}</span>
  </button>
}
