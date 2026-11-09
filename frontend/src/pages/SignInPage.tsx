import { ArrowRight, CheckCircle2, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ApexCaliberLogo from '../components/ApexCaliberLogo'
import { supabase, useAuth } from '../lib/auth'
import { AUTH_RETURN_KEY, safeReturnPath } from '../lib/authNavigation'

export default function SignInPage() {
  const { session, loading, signOut } = useAuth()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const next = safeReturnPath(params.get('next'))
  const linkFailed = params.get('error') === 'link'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setSending(true)
    setError('')
    const callback = new URL('/auth/callback', window.location.origin)
    try { localStorage.setItem(AUTH_RETURN_KEY, next) } catch { /* home is a safe fallback */ }
    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: callback.toString() },
      })
      if (signInError) setError(signInError.message)
      else setSent(true)
    } catch {
      setError('We could not send the link right now. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return <div className="relative min-h-screen overflow-hidden bg-void text-chalk">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_15%,color-mix(in_srgb,var(--color-cyan)_14%,transparent),transparent_42%),radial-gradient(ellipse_at_88%_92%,color-mix(in_srgb,var(--color-reward)_9%,transparent),transparent_45%)]" />
    <div className="shell relative grid min-h-screen items-center gap-10 py-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)] lg:gap-20">
      <div className="order-2 max-w-xl space-y-8 lg:order-1">
        <Link to="/" aria-label="ApexCaliber home" className="hidden lg:inline-flex"><ApexCaliberLogo size="md" /></Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">Your next step starts here</p>
          <h1 className="mt-4 max-w-[12ch] font-plate text-4xl font-semibold leading-tight sm:text-5xl">Climb one concept at a time.</h1>
          <p className="mt-5 max-w-[55ch] text-base leading-7 text-muted">Begin with the foundations, understand a real example, then practice. Your place in the journey is ready when you return.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {['Learn the idea', 'Try it in a new setting', 'Return where you left off'].map((step, index) => <div key={step} className="flex items-center gap-3 text-sm text-muted"><span className="grid size-8 shrink-0 place-items-center rounded-full border border-cyan/30 bg-cyan/10 font-mono text-xs text-cyan">{index + 1}</span>{step}</div>)}
        </div>
      </div>

      <section className="order-1 rounded-3xl border border-line bg-panel p-6 shadow-xl shadow-black/10 sm:p-8 lg:order-2" aria-labelledby="sign-in-title">
        <Link to="/" aria-label="ApexCaliber home" className="mb-7 inline-flex lg:hidden"><ApexCaliberLogo size="sm" /></Link>
        {loading ? <p role="status" className="text-muted">Checking your saved session…</p> : session ? <>
          <CheckCircle2 className="text-cyan" size={28} />
          <h2 id="sign-in-title" className="mt-4 font-plate text-3xl font-semibold">Welcome back</h2>
          <p className="mt-2 break-words text-sm text-muted">Signed in as {session.user.email}</p>
          <Link to={next} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-void hover:brightness-110">Continue learning <ArrowRight size={16} /></Link>
          <button type="button" onClick={() => void signOut()} className="mt-4 w-full rounded-xl border border-line px-4 py-3 text-sm text-muted hover:text-chalk">Sign out</button>
        </> : !supabase ? <>
          <h2 id="sign-in-title" className="font-plate text-3xl font-semibold">Local preview</h2>
          <p className="mt-3 leading-7 text-muted">This copy runs without student accounts. Progress stays on this computer. On the hosted site, sign-in appears here before the journey opens.</p>
          <Link to="/" className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-void hover:brightness-110">Open the local journey <ArrowRight size={16} /></Link>
        </> : <>
          <div className="flex size-11 items-center justify-center rounded-xl border border-cyan/30 bg-cyan/10 text-cyan"><Mail size={22} /></div>
          <h2 id="sign-in-title" className="mt-5 font-plate text-3xl font-semibold">Sign in to ApexCaliber</h2>
          <p className="mt-2 text-sm leading-6 text-muted">We’ll email you a secure link. No password to remember.</p>
          {linkFailed && <p role="alert" className="mt-5 rounded-xl border border-amber/30 bg-amber/10 p-3 text-sm text-chalk">That sign-in link has expired or could not be used. Request a new one below.</p>}
          {sent ? <div className="mt-7 space-y-4" role="status"><div className="rounded-xl border border-cyan/30 bg-cyan/5 p-4"><strong className="text-chalk">Check your inbox</strong><p className="mt-2 text-sm leading-6 text-muted">We sent a link to {email.trim()}. Open it in this browser to continue your journey.</p></div><button type="button" onClick={() => setSent(false)} className="text-sm font-medium text-cyan hover:text-chalk">Use another email</button></div> :
            <form onSubmit={submit} className="mt-7 space-y-4">
              <div className="space-y-2"><label htmlFor="email" className="block text-sm font-medium text-chalk">Email address</label><input id="email" name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-h-12 w-full rounded-xl border border-line bg-panel-2 px-4 py-3 text-chalk outline-none placeholder:text-faint focus-visible:border-cyan focus-visible:ring-2 focus-visible:ring-cyan/30" /></div>
              {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
              <button type="submit" disabled={sending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-void hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{sending ? 'Sending link…' : 'Email me a sign-in link'} {!sending && <ArrowRight size={16} />}</button>
            </form>}
          <p className="mt-5 text-xs leading-5 text-muted">Your learning progress is saved to your account so you can continue on another device.</p>
        </>}
      </section>
    </div>
  </div>
}
