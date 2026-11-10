import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const hostedAuthEnabled = Boolean(url && key)
export const supabase: SupabaseClient | null = hostedAuthEnabled ? createClient(url!, key!, {
  auth: { flowType: 'pkce', detectSessionInUrl: false, persistSession: true, autoRefreshToken: true },
}) : null
let activeStudentId: string | null = null
export function currentStudentId() { return activeStudentId }

export type StudentSession = { user: { id: string; email?: string; name?: string }; access_token?: string }
type LocalAuthStatus = { authenticated: boolean; needs_setup: boolean; username: string | null }

function syncDesignProgress(next: StudentSession | null) {
  const id = next?.user.id
  if (id && localStorage.getItem('apex-last-auth-user') !== id) {
    for (const name of Object.keys(localStorage)) {
      if (name.startsWith('pf_') || name.startsWith('pf-')) localStorage.removeItem(name)
    }
    localStorage.setItem('apex-last-auth-user', id)
  }
  activeStudentId = next?.user.id ?? null
  window.dispatchEvent(new Event('pf_sysdesign_progress_updated'))
  if (!next) return
  void fetch('/api/me/system-design', { headers: next.access_token ? { Authorization: `Bearer ${next.access_token}` } : {} })
    .then(res => res.ok ? res.json() : null)
    .then((data: { completed_ids?: string[] } | null) => {
      if (activeStudentId !== id || !Array.isArray(data?.completed_ids)) return
      localStorage.setItem(`pf_sysdesign_completed_v1:${id}`, JSON.stringify(data.completed_ids))
      window.dispatchEvent(new Event('pf_sysdesign_progress_updated'))
    })
    .catch(() => {})
}

type AuthState = {
  session: StudentSession | null
  loading: boolean
  enabled: boolean
  needsSetup: boolean
  authError: string | null
  refreshSession: () => Promise<StudentSession | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({ session: null, loading: true, enabled: true, needsSetup: false, authError: null, refreshSession: async () => null, signOut: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StudentSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  async function refreshSession(): Promise<StudentSession | null> {
    if (supabase) {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      setSession(data.session)
      syncDesignProgress(data.session)
      setLoading(false)
      return data.session
    }
    const response = await fetch('/api/local-auth/session')
    if (!response.ok) throw new Error('Could not check your local account. Start the backend and try again.')
    const status = await response.json() as LocalAuthStatus
    const next: StudentSession | null = status.authenticated && status.username
      ? { user: { id: 'local', name: status.username } } : null
    setNeedsSetup(status.needs_setup)
    setSession(next)
    syncDesignProgress(next)
    setAuthError(null)
    setLoading(false)
    return next
  }

  useEffect(() => {
    if (!supabase) {
      void refreshSession().catch((error) => { setAuthError(error.message); setLoading(false) })
      return
    }
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session)
        syncDesignProgress(data.session)
        setLoading(false)
      }
    }).catch(() => { if (active) { setAuthError('Could not check your saved session. Try again.'); setLoading(false) } })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      if (active) {
        if (event === 'SIGNED_OUT') localStorage.removeItem('apex-last-auth-user')
        setSession(next)
        syncDesignProgress(next)
        setLoading(false)
      }
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  return <AuthContext.Provider value={{
    session,
    loading,
    enabled: true,
    needsSetup,
    authError,
    refreshSession,
    signOut: async () => {
      if (supabase) {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      } else {
        const response = await fetch('/api/local-auth/logout', { method: 'POST' })
        if (!response.ok) throw new Error('Could not log out. Try again.')
      }
      setSession(null)
      activeStudentId = null
      // Clear per-student browser state before another account uses this device.
      for (const name of Object.keys(localStorage)) {
        if (name.startsWith('pf_') || name.startsWith('pf-')) localStorage.removeItem(name)
      }
      localStorage.removeItem('apex-last-auth-user')
      window.location.assign('/')
    },
  }}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }

export async function accessToken(): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data.session?.access_token ?? null
}
