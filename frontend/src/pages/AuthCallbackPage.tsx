import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/auth'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const exchanged = useRef(false)
  useEffect(() => {
    if (exchanged.current) return
    exchanged.current = true
    let requested = '/'
    try {
      requested = sessionStorage.getItem('apex-auth-return') || '/'
      sessionStorage.removeItem('apex-auth-return')
    } catch { /* continue at home */ }
    const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/'
    if (!supabase) { navigate('/', { replace: true }); return }
    const code = params.get('code')
    if (!code) { navigate('/sign-in', { replace: true }); return }
    void supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      navigate(error ? '/sign-in' : next, { replace: true })
    })
  }, [navigate, params])
  return <div className="shell py-16 text-muted" role="status">Finishing sign-in…</div>
}
