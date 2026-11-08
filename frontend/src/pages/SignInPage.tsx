import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase, useAuth } from '../lib/auth'

export default function SignInPage() {
  const { session, loading, signOut } = useAuth()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const requested = params.get('next') || '/'
  const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/'

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setSending(true)
    setError('')
    const callback = new URL('/auth/callback', window.location.origin)
    try { sessionStorage.setItem('apex-auth-return', next) } catch { /* continue at home */ }
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callback.toString() },
    })
    setSending(false)
    if (signInError) setError(signInError.message)
    else setSent(true)
  }

  if (!supabase) return <div className="shell py-16 text-chalk">Student accounts are not configured on this local copy.</div>
  if (loading) return <div className="shell py-16 text-muted">Checking your session…</div>
  if (session) return <div className="shell max-w-lg py-16 space-y-4 text-chalk"><h1 className="text-2xl font-semibold">Your climb is saved</h1><p className="text-muted">Signed in as {session.user.email}</p><div className="flex gap-3"><Link className="inline-flex rounded-lg bg-violet-500 px-4 py-2 font-semibold text-white" to={next}>Continue learning</Link><button type="button" onClick={() => void signOut()} className="rounded-lg border border-line px-4 py-2 text-muted hover:text-chalk">Sign out</button></div></div>

  return <div className="shell max-w-lg py-16 text-chalk">
    <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-violet-300">Save your climb</p>
    <h1 className="mb-3 text-3xl font-semibold">Your learning stays yours</h1>
    <p className="mb-8 text-muted">Use an email link to save progress and pick up where you stopped. You can explore lessons without an account.</p>
    {sent ? <div className="rounded-xl border border-line bg-panel p-5" role="status">Check your inbox for a sign-in link. Open it on this device to continue.</div> :
      <form onSubmit={submit} className="space-y-4">
        <label htmlFor="email" className="block text-sm font-medium">Email address</label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}
          className="w-full rounded-lg border border-line bg-panel px-4 py-3 text-chalk outline-none focus:border-violet-400" />
        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        <button type="submit" disabled={sending} className="w-full rounded-lg bg-violet-500 px-4 py-3 font-semibold text-white disabled:opacity-50">
          {sending ? 'Sending link…' : 'Email me a sign-in link'}
        </button>
      </form>}
  </div>
}
