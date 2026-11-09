import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/auth'
import { AUTH_RETURN_KEY, safeReturnPath, signInPath } from '../lib/authNavigation'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const exchanged = useRef(false)
  useEffect(() => {
    if (exchanged.current) return
    exchanged.current = true
    let requested = '/'
    try {
      requested = localStorage.getItem(AUTH_RETURN_KEY) || '/'
      localStorage.removeItem(AUTH_RETURN_KEY)
    } catch { /* continue at home */ }
    const next = safeReturnPath(requested)
    if (!supabase) { navigate('/', { replace: true }); return }
    const code = params.get('code')
    if (!code) { navigate(`${signInPath(next)}&error=link`, { replace: true }); return }
    void supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      navigate(error ? `${signInPath(next)}&error=link` : next, { replace: true })
    }).catch(() => navigate(`${signInPath(next)}&error=link`, { replace: true }))
  }, [navigate, params])
  return <div className="shell py-16 text-muted" role="status">Finishing sign-in…</div>
}
