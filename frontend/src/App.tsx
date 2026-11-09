import { ChevronRight, Compass, Flame, FlaskConical, Mountain, ScrollText, Search } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import CommandPalette, { openCommandPalette } from './components/CommandPalette'
import ErrorBoundary from './components/ErrorBoundary'
import MoreMenu from './components/MoreMenu'
import TopBarHUD from './components/TopBarHUD'
import ApexCaliberLogo from './components/ApexCaliberLogo'
import { ThemeToggle } from './components/effects'
import { GlassSurface } from './components/vendor/vsrc/glass-surface'
import { citadelForWorld, getCitadel } from './lib/citadels'
import { GrimoireProvider, useGrimoire } from './lib/grimoire'
import { hostedAuthEnabled, useAuth } from './lib/auth'
import { signInPath } from './lib/authNavigation'

const itemClass = (active: boolean) =>
  `relative z-10 flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-colors ${
    active ? 'text-chalk font-semibold' : 'text-muted hover:text-chalk'
  }`

/** Dock item: lifts on hover; the active item gets a sliding pill behind it. */
function DockItem({ active, children }: { active: boolean; children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      className="relative block"
    >
      {active && (
        <motion.span
          layoutId={reduce ? undefined : 'dock-pill'}
          className="absolute inset-0 rounded-lg border border-line bg-panel-2"
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        />
      )}
      {children}
    </motion.div>
  )
}

/** Row 2 breadcrumb bar shown only on non-dashboard pages. */
function BreadcrumbBar() {
  const { pathname, state } = useLocation()
  if (pathname === '/') return null

  const crumbs: { label: string; to?: string }[] = [{ label: 'Home', to: '/' }]

  const citadelMatch = /^\/citadel\/([^/]+)/.exec(pathname)
  const worldMatch = /^\/world\/(\d+)/.exec(pathname)
  const questionMatch = /^\/q\/([^/]+)/.exec(pathname)
  const learningMatch = /^\/learn\/([^/]+)/.exec(pathname)
  const lessonMatch = /^\/lesson\/([^/]+)/.exec(pathname)

  if (citadelMatch) {
    const cit = getCitadel(citadelMatch[1])
    crumbs.push({ label: `Citadel ${cit.numeral}: ${cit.shortName}` })
  } else if (worldMatch) {
    const worldId = Number(worldMatch[1])
    const cit = citadelForWorld(worldId)
    crumbs.push({
      label: `Citadel ${cit.numeral}: ${cit.shortName}`,
      to: cit.id === 'dsa' ? '/' : `/citadel/${cit.id}`,
    })
    const stateWorldName = (state as { world?: { name?: string } } | null)?.world?.name
    const worldName = stateWorldName ? `World ${worldId}: ${stateWorldName.replace(/ — .*/, '')}` : `World ${worldId}`
    crumbs.push({ label: worldName })
  } else if (questionMatch) {
    crumbs.push({ label: 'Question Workspace' })
  } else if (learningMatch) {
    const cit = getCitadel(learningMatch[1])
    crumbs.push({ label: cit.shortName, to: `/citadel/${cit.id}` })
    crumbs.push({ label: 'Concept route' })
  } else if (lessonMatch) {
    crumbs.push({ label: 'Concept lesson' })
  } else if (pathname === '/resume-grill') {
    const cit = getCitadel('ai_resume')
    crumbs.push({
      label: `Citadel ${cit.numeral}: ${cit.shortName}`,
      to: `/citadel/${cit.id}`,
    })
    crumbs.push({ label: 'Resume Grill' })
  } else if (pathname === '/finder') {
    crumbs.push({ label: 'Pattern Finder' })
  } else if (pathname === '/playground') {
    crumbs.push({ label: 'Playground' })
  } else if (pathname === '/stats') {
    crumbs.push({ label: 'Expedition Log' })
  } else {
    const seg = pathname.replace(/^\//, '')
    crumbs.push({ label: seg.charAt(0).toUpperCase() + seg.slice(1) })
  }

  return (
    <nav aria-label="Breadcrumb" className="w-full border-b border-line bg-panel-2/70 text-xs text-muted backdrop-blur-md">
      <div className="shell flex h-9 items-center gap-1.5 overflow-x-auto no-scrollbar">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <div key={i} className="flex items-center gap-1.5 shrink-0">
              {i > 0 && <ChevronRight size={12} className="text-faint" />}
              {c.to && !isLast ? (
                <Link to={c.to} className="transition-colors hover:text-chalk">
                  {c.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium text-chalk' : ''}>{c.label}</span>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}

function TopBar() {
  const openGrimoire = useGrimoire()
  const auth = useAuth()
  const { pathname } = useLocation()
  const worldMatch = /^\/world\/(\d+)/.exec(pathname)
  const onJourney = pathname === '/' || pathname.startsWith('/citadel') || pathname.startsWith('/world') || pathname.startsWith('/q/') || pathname.startsWith('/learn/') || pathname.startsWith('/lesson/')

  return (
    <GlassSurface
      asChild
      glass={{
        scale: -48,
        chroma: 2,
        border: 0.1,
        mapBlur: 10,
        blur: 16,
        saturate: 1.25,
        fallbackBlur: 12,
      }}
    >
      <header className="no-print sticky top-0 z-40 w-full !overflow-visible border-b border-line bg-panel/85 shadow-sm backdrop-blur-xl">
        {/* Row 1: Primary bar */}
        <div className="shell flex h-14 items-center justify-between gap-3">
          {/* Left: Brand */}
          <Link to="/" aria-label="ApexCaliber home" className="flex items-center shrink-0 transition-opacity hover:opacity-90">
            <ApexCaliberLogo size="sm" />
          </Link>

          {/* Center: Navigation (collapses before it crowds account controls) */}
          <nav className="hidden 2xl:flex items-center gap-1">
            <DockItem active={onJourney}>
              <NavLink to="/" aria-label="Journey" className={() => itemClass(onJourney)}>
                <Mountain size={14} /> <span>Journey</span>
              </NavLink>
            </DockItem>
            <DockItem active={pathname === '/resume-grill'}>
              <NavLink to="/resume-grill" aria-label="Resume Grill" className={({ isActive }) => itemClass(isActive)}>
                <Flame size={14} /> <span>Resume Grill</span>
              </NavLink>
            </DockItem>
            <DockItem active={false}>
              <button
                aria-label="Open the Grimoire"
                className={itemClass(false)}
                onClick={() => openGrimoire(worldMatch ? Number(worldMatch[1]) : undefined)}
              >
                <ScrollText size={14} /> <span>Grimoire</span>
              </button>
            </DockItem>
            <DockItem active={pathname === '/finder'}>
              <NavLink to="/finder" aria-label="Pattern Finder" className={({ isActive }) => itemClass(isActive)}>
                <Compass size={14} /> <span>Finder</span>
              </NavLink>
            </DockItem>
            {!hostedAuthEnabled && <DockItem active={pathname === '/playground'}>
              <NavLink to="/playground" aria-label="Playground" className={({ isActive }) => itemClass(isActive)}>
                <FlaskConical size={14} /> <span>Playground</span>
              </NavLink>
            </DockItem>}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {(!auth.enabled || auth.session) && <div className="hidden xl:block"><TopBarHUD /></div>}
            <button
              onClick={openCommandPalette}
              aria-label="Search (Ctrl+K)"
              className="flex h-8 w-8 items-center justify-center gap-2 rounded-lg border border-line bg-panel-2 text-xs text-muted transition-colors hover:border-line-strong hover:text-chalk sm:w-auto sm:px-2.5"
            >
              <Search size={14} />
              <span className="hidden sm:inline">Search</span>
              <kbd className="keycap hidden sm:inline-flex">Ctrl K</kbd>
            </button>
            <ThemeToggle compact />
            <MoreMenu onOpenGrimoire={() => openGrimoire(worldMatch ? Number(worldMatch[1]) : undefined)} />
            {!auth.enabled && <Link to="/sign-in" className="hidden h-8 items-center rounded-lg border border-line bg-panel-2 px-3 text-xs font-medium text-muted hover:text-chalk sm:inline-flex" title="Accounts are off in this local preview">Local preview</Link>}
            {auth.enabled && !auth.session ? <Link
              to={`/sign-in?next=${encodeURIComponent(pathname)}`}
              className="inline-flex h-8 items-center rounded-lg border border-violet-400/40 bg-violet-400/10 px-3 text-xs font-semibold text-violet-200 hover:bg-violet-400/20"
            >Sign in</Link> : <Link
              to={auth.enabled ? `/sign-in?next=${encodeURIComponent(pathname)}` : '/stats'}
              aria-label={auth.enabled ? (auth.session ? 'Your account' : 'Sign in to save progress') : 'View profile stats'}
              title={auth.enabled ? (auth.session?.user.email || 'Sign in to save progress') : 'Expedition Log'}
              className="flex size-8 rounded-full bg-gradient-to-br from-violet-400 to-cyan-400 p-[2px] transition-transform hover:scale-105 active:scale-95"
            >
              <div className="grid size-full place-items-center rounded-full bg-panel text-[11px] font-bold text-chalk">
                {auth.enabled ? (auth.session?.user.email?.slice(0, 2).toUpperCase() || 'IN') : 'AC'}
              </div>
            </Link>}
          </div>
        </div>

        {/* Row 2: Breadcrumbs on non-dashboard pages */}
        <BreadcrumbBar />
      </header>
    </GlassSurface>
  )
}

function AppShell() {
  const { pathname, search, hash } = useLocation()
  const auth = useAuth()
  // Hide the website header on full-screen IDE routes (/q/:slug and /playground)
  const isFullscreenIde = pathname.startsWith('/q/') || pathname === '/playground'

  if (auth.enabled && auth.loading) {
    return <div className="grid min-h-screen place-items-center bg-void text-muted" role="status">Loading your learning path…</div>
  }

  const isAuthRoute = pathname === '/sign-in' || pathname === '/auth/callback'
  if (auth.enabled && !auth.session && !isAuthRoute) {
    return <Navigate to={signInPath(`${pathname}${search}${hash}`)} replace />
  }

  return (
    <div className={isFullscreenIde ? 'h-screen w-screen overflow-hidden bg-void text-chalk' : 'min-h-screen bg-void text-chalk'}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-panel focus:px-4 focus:py-2 focus:text-chalk focus:shadow-xl">Skip to main content</a>
      {!isFullscreenIde && !isAuthRoute && <TopBar />}
      <CommandPalette />
      <main id="main-content" tabIndex={-1} className={isFullscreenIde ? 'h-full w-full overflow-hidden' : ''}>
        <ErrorBoundary fallbackTitle="Workspace encountered an unexpected error">
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <GrimoireProvider>
      <AppShell />
    </GrimoireProvider>
  )
}
