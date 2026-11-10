import { ChevronRight, Search } from 'lucide-react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import AccountMenu from './components/AccountMenu'
import CommandPalette, { openCommandPalette } from './components/CommandPalette'
import ErrorBoundary from './components/ErrorBoundary'
import MoreMenu from './components/MoreMenu'
import ApexCaliberLogo from './components/ApexCaliberLogo'
import { ThemeToggle } from './components/effects'
import { citadelForWorld, getCitadel } from './lib/citadels'
import { GrimoireProvider, useGrimoire } from './lib/grimoire'
import { useAuth } from './lib/auth'
import { signInPath } from './lib/authNavigation'
import './pages/StudyPages.css'

/** Row 2 breadcrumb bar shown only on non-dashboard pages. */
function BreadcrumbBar() {
  const { pathname, state } = useLocation()
  if (pathname === '/app') return null

  const crumbs: { label: string; to?: string }[] = [{ label: 'Learning home', to: '/app' }]

  const citadelMatch = /^\/citadel\/([^/]+)/.exec(pathname)
  const worldMatch = /^\/world\/(\d+)/.exec(pathname)
  const questionMatch = /^\/q\/([^/]+)/.exec(pathname)
  const learningMatch = /^\/learn\/([^/]+)/.exec(pathname)
  const lessonMatch = /^\/lesson\/([^/]+)/.exec(pathname)

  if (citadelMatch) {
    const cit = getCitadel(citadelMatch[1])
    crumbs.push({ label: cit.shortName })
  } else if (worldMatch) {
    const worldId = Number(worldMatch[1])
    const cit = citadelForWorld(worldId)
    crumbs.push({
      label: cit.shortName,
      to: `/citadel/${cit.id}`,
    })
    const stateWorldName = (state as { world?: { name?: string } } | null)?.world?.name
    const worldName = stateWorldName ? stateWorldName.replace(/ — .*/, '') : 'Practice topic'
    crumbs.push({ label: worldName })
  } else if (questionMatch) {
    crumbs.push({ label: 'Practice question' })
  } else if (learningMatch) {
    const cit = getCitadel(learningMatch[1])
    crumbs.push({ label: cit.shortName, to: `/citadel/${cit.id}` })
    crumbs.push({ label: 'Lessons' })
  } else if (lessonMatch) {
    crumbs.push({ label: 'Lesson' })
  } else if (pathname === '/resume-grill') {
    const cit = getCitadel('ai_resume')
    crumbs.push({
      label: cit.shortName,
      to: `/citadel/${cit.id}`,
    })
    crumbs.push({ label: 'Interview practice' })
  } else if (pathname === '/finder') {
    crumbs.push({ label: 'Pattern Finder' })
  } else if (pathname === '/playground') {
    crumbs.push({ label: 'Playground' })
  } else if (pathname === '/stats') {
    crumbs.push({ label: 'Progress' })
  } else if (pathname === '/system-design') {
    crumbs.push({ label: 'System Design' })
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
  const navClass = ({ isActive }: { isActive: boolean }) => `study-nav-link${isActive ? ' is-active' : ''}`

  return <header className="study-topbar no-print">
    <div className="shell study-topbar-inner">
      <Link to="/app" aria-label="ApexCaliber learning home" className="study-topbar-brand"><ApexCaliberLogo size="sm" /></Link>
      <nav aria-label="Primary navigation" className="study-main-nav">
        <NavLink to="/app" end className={navClass}>Learning home</NavLink>
        <NavLink to="/citadel/dsa" className={({ isActive }) => navClass({ isActive: isActive || pathname.startsWith('/world/') })} aria-current={pathname.startsWith('/world/') ? 'page' : undefined}>Practice</NavLink>
        <NavLink to="/stats" className={navClass}>Progress</NavLink>
      </nav>
      <div className="study-topbar-tools">
        <button type="button" onClick={openCommandPalette} aria-label="Search lessons and questions" className="study-search-button"><Search size={16} /><span>Search</span></button>
        <ThemeToggle compact />
        <MoreMenu onOpenGrimoire={() => openGrimoire(worldMatch ? Number(worldMatch[1]) : undefined)} />
        {auth.session ? <AccountMenu /> : <Link to={`/sign-in?next=${encodeURIComponent(pathname)}`} className="study-signin">Sign in</Link>}
      </div>
    </div>
    <BreadcrumbBar />
  </header>
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
        <ErrorBoundary key={pathname} fallbackTitle="Workspace encountered an unexpected error">
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
