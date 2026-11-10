import { ArrowRight, CheckCircle2, Eye, EyeOff, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ApexCaliberLogo from '../components/ApexCaliberLogo'
import SignOutButton from '../components/SignOutButton'
import { supabase, useAuth } from '../lib/auth'
import { AUTH_RETURN_KEY, safeReturnPath } from '../lib/authNavigation'
import './SignInPage.css'

export default function SignInPage() {
  const { session, loading, needsSetup, authError, refreshSession } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localBusy, setLocalBusy] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const next = safeReturnPath(params.get('next'))
  const linkFailed = params.get('error') === 'link'

  async function submitLocal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = username.trim().toLowerCase()
    if (!/^[a-z0-9][a-z0-9_.-]{2,31}$/.test(normalized)) {
      setError('Use 3–32 lowercase letters, numbers, dots, dashes or underscores for your username.')
      document.getElementById('local-username')?.focus()
      return
    }
    if (needsSetup && (password.length < 12 || password.length > 128)) {
      setError('Choose a password between 12 and 128 characters.')
      document.getElementById('local-password')?.focus()
      return
    }
    if (needsSetup && password !== confirmPassword) {
      setError('The passwords do not match.')
      document.getElementById('local-confirm-password')?.focus()
      return
    }
    setLocalBusy(true)
    setError('')
    try {
      const response = await fetch(needsSetup ? '/api/local-auth/setup' : '/api/local-auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalized, password }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { detail?: string }
        setPassword(''); setConfirmPassword('')
        setError(typeof body.detail === 'string' ? body.detail : 'Could not sign in. Try again.')
        if (response.status === 409) void refreshSession()
        return
      }
      await refreshSession()
      navigate(next, { replace: true })
    } catch {
      setError('Could not reach the local server. Start it and try again.')
    } finally {
      setLocalBusy(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address to get your sign-in link.')
      document.getElementById('email')?.focus()
      return
    }
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

  return <div className="auth-page relative min-h-screen overflow-hidden bg-void text-chalk">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_15%,color-mix(in_srgb,var(--color-cyan)_14%,transparent),transparent_42%),radial-gradient(ellipse_at_88%_92%,color-mix(in_srgb,var(--color-reward)_9%,transparent),transparent_45%)]" />
    <div className="shell relative grid min-h-screen items-center gap-10 py-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)] lg:gap-20">
      <div className="order-2 max-w-xl space-y-8 lg:order-1">
        <Link to="/" aria-label="ApexCaliber home" className="hidden lg:inline-flex"><ApexCaliberLogo size="md" /></Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">Your next step starts here</p>
          <h1 className="mt-4 max-w-[12ch] font-plate text-4xl font-semibold leading-tight sm:text-5xl">Learn one concept at a time.</h1>
          <p className="mt-5 max-w-[55ch] text-base leading-7 text-muted">Begin with the foundations, understand a real example, then practice. Your place in the learning path is ready when you return.</p>
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
          <p className="mt-2 break-words text-sm text-muted">Signed in as {session.user.email || session.user.name}</p>
          <Link to={next} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-void hover:brightness-110">Continue learning <ArrowRight size={16} /></Link>
          <SignOutButton className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm text-muted hover:text-chalk" />
        </> : !supabase ? <>
          <h2 id="sign-in-title" className="font-plate text-3xl font-semibold">{needsSetup ? 'Create your local account' : 'Sign in to ApexCaliber'}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{needsSetup ? 'Set up this installation once. Your existing lessons and progress will stay here.' : 'Pick up your lessons and practice where you left off.'}</p>
          {authError && <div role="alert" className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-chalk"><p>{authError}</p><button type="button" onClick={() => void refreshSession().catch((cause) => setError(cause.message))} className="mt-2 font-semibold underline underline-offset-2">Try again</button></div>}
          <form noValidate onSubmit={submitLocal} className="mt-7 space-y-4">
            <div className="space-y-2"><label htmlFor="local-username" className="block text-sm font-medium text-chalk">Username</label><input id="local-username" name="username" type="text" autoComplete="username" required maxLength={32} spellCheck={false} value={username} onChange={(event) => { setUsername(event.target.value); setError('') }} aria-invalid={!!error} aria-describedby={error ? 'local-sign-in-error' : undefined} placeholder="yourname" className="min-h-12 w-full rounded-xl border border-line bg-panel-2 px-4 py-3 text-chalk outline-none placeholder:text-faint focus-visible:border-cyan focus-visible:ring-2 focus-visible:ring-cyan/30" /></div>
            <div className="space-y-2"><label htmlFor="local-password" className="block text-sm font-medium text-chalk">Password</label><div className="relative"><input id="local-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={needsSetup ? 'new-password' : 'current-password'} required value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} aria-invalid={!!error} aria-describedby={error ? 'local-sign-in-error' : undefined} className="min-h-12 w-full rounded-xl border border-line bg-panel-2 px-4 py-3 pr-14 text-chalk outline-none focus-visible:border-cyan focus-visible:ring-2 focus-visible:ring-cyan/30" /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted hover:text-chalk focus-visible:outline-2 focus-visible:outline-cyan">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{needsSetup && <p className="text-xs text-muted">Use at least 12 characters. You can use a password manager.</p>}</div>
            {needsSetup && <div className="space-y-2"><label htmlFor="local-confirm-password" className="block text-sm font-medium text-chalk">Confirm password</label><input id="local-confirm-password" name="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError('') }} aria-invalid={!!error} aria-describedby={error ? 'local-sign-in-error' : undefined} className="min-h-12 w-full rounded-xl border border-line bg-panel-2 px-4 py-3 text-chalk outline-none focus-visible:border-cyan focus-visible:ring-2 focus-visible:ring-cyan/30" /></div>}
            {error && <p id="local-sign-in-error" role="alert" className="text-sm text-rose-300">{error}</p>}
            <button type="submit" disabled={localBusy || !!authError} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-void hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{localBusy ? 'Please wait…' : needsSetup ? 'Create account' : 'Sign in'} {!localBusy && <ArrowRight size={16} />}</button>
          </form>
          <p className="mt-5 text-xs leading-5 text-muted">This account works on this local installation. Passwords are stored as hashes; progress stays on this computer.</p>
        </> : <>
          <div className="flex size-11 items-center justify-center rounded-xl border border-cyan/30 bg-cyan/10 text-cyan"><Mail size={22} /></div>
          <h2 id="sign-in-title" className="mt-5 font-plate text-3xl font-semibold">Sign in to ApexCaliber</h2>
          <p className="mt-2 text-sm leading-6 text-muted">We’ll email you a secure link. No password to remember.</p>
          {linkFailed && <p role="alert" className="mt-5 rounded-xl border border-amber/30 bg-amber/10 p-3 text-sm text-chalk">That sign-in link has expired or could not be used. Request a new one below.</p>}
          {sent ? <div className="mt-7 space-y-4" role="status"><div className="rounded-xl border border-cyan/30 bg-cyan/5 p-4"><strong className="text-chalk">Check your inbox</strong><p className="mt-2 text-sm leading-6 text-muted">We sent a link to {email.trim()}. Open it in this browser to continue your journey.</p></div><button type="button" onClick={() => setSent(false)} className="text-sm font-medium text-cyan hover:text-chalk">Use another email</button></div> :
            <form noValidate onSubmit={submit} className="mt-7 space-y-4">
              <div className="space-y-2"><label htmlFor="email" className="block text-sm font-medium text-chalk">Email address</label><input id="email" name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} required aria-invalid={!!error} aria-describedby={error ? 'sign-in-error' : undefined} value={email} onChange={(event) => { setEmail(event.target.value); if (error) setError('') }} placeholder="you@example.com" className="min-h-12 w-full rounded-xl border border-line bg-panel-2 px-4 py-3 text-chalk outline-none placeholder:text-faint focus-visible:border-cyan focus-visible:ring-2 focus-visible:ring-cyan/30" /></div>
              {error && <p id="sign-in-error" role="alert" className="text-sm text-rose-300">{error}</p>}
              <button type="submit" disabled={sending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-void hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{sending ? 'Sending link…' : 'Email me a sign-in link'} {!sending && <ArrowRight size={16} />}</button>
            </form>}
          <p className="mt-5 text-xs leading-5 text-muted">Your learning progress is saved to your account so you can continue on another device.</p>
        </>}
      </section>
    </div>
  </div>
}
