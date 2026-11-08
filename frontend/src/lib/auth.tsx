import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const hostedAuthEnabled = Boolean(url && key)
export const supabase: SupabaseClient | null = hostedAuthEnabled ? createClient(url!, key!, {
  auth: { flowType: 'pkce', detectSessionInUrl: false },
}) : null
let activeStudentId: string | null = null
export function currentStudentId() { return activeStudentId }

function syncDesignProgress(next: Session | null) {
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
  void fetch('/api/me/system-design', { headers: { Authorization: `Bearer ${next.access_token}` } })
    .then(res => res.ok ? res.json() : null)
    .then((data: { completed_ids?: string[] } | null) => {
      if (activeStudentId !== id || !Array.isArray(data?.completed_ids)) return
      localStorage.setItem(`pf_sysdesign_completed_v1:${id}`, JSON.stringify(data.completed_ids))
      window.dispatchEvent(new Event('pf_sysdesign_progress_updated'))
    })
    .catch(() => {})
}

type AuthState = {
  session: Session | null
  loading: boolean
  enabled: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({ session: null, loading: false, enabled: false, signOut: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(hostedAuthEnabled)

  useEffect(() => {
    if (!supabase) return
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session)
        syncDesignProgress(data.session)
        setLoading(false)
      }
    })
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
    enabled: hostedAuthEnabled,
    signOut: async () => {
      await supabase?.auth.signOut()
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
