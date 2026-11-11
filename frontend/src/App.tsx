import { useEffect } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { StudySidebar, StudyNavigationDrawer } from './components/StudyNavigation'
import AccountMenu from './components/AccountMenu'
import CommandPalette, { openCommandPalette } from './components/CommandPalette'
import ErrorBoundary from './components/ErrorBoundary'
import MoreMenu from './components/MoreMenu'
import ApexCaliberLogo from './components/ApexCaliberLogo'
import TopBarHUD from './components/TopBarHUD'
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

  const crumbs: { label: string; to?: string }[] = [{ label: 'Studio', to: '/app' }]

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
      <div className="w-full px-4 sm:px-6 flex h-9 items-center gap-1.5 overflow-x-auto">
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
                <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'font-medium text-chalk' : ''}>{c.label}</span>
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

  return <header className="study-topbar no-print">
    <div className="w-full px-4 sm:px-6 flex items-center justify-between gap-4 study-topbar-inner">
      <div className="flex items-center gap-3 shrink-0">
        <StudyNavigationDrawer />
        <Link to="/app" aria-label="ApexCaliber learning home" className="study-topbar-brand"><ApexCaliberLogo size="sm" /></Link>
      </div>
      <div className="hidden md:flex flex-1 justify-center min-w-0 px-2">
        <button type="button" onClick={openCommandPalette} aria-label="Search topics and questions" className="study-search-button"><Search size={16} /><span>Search topics and questions</span><kbd>⌘ K</kbd></button>
      </div>
      <div className="study-topbar-tools shrink-0">
        <TopBarHUD />
        <button type="button" onClick={openCommandPalette} aria-label="Search topics and questions" className="md:hidden study-search-button study-search-button-mobile"><Search size={16} /></button>
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
  useEffect(() => {
    if (hash) requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }))
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])
  useEffect(() => {
    const names: Record<string, string> = { '/app': 'Studio', '/stats': 'Telemetry', '/finder': 'Pattern Finder', '/system-design': 'System Design', '/resume-grill': 'Interview Drills', '/playground': 'Sandbox', '/sign-in': 'Sign in' }
    const subject = /^\/(?:citadel|learn)\/([^/]+)/.exec(pathname)
    const title = names[pathname] ?? (subject ? getCitadel(subject[1]).shortName : pathname.startsWith('/lesson/') ? 'Lesson' : pathname.startsWith('/q/') ? 'Coding practice' : 'Learning workspace')
    document.title = `${title} · ApexCaliber`
  }, [pathname])
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
    <div className={isFullscreenIde ? 'h-screen w-screen overflow-hidden bg-void text-chalk' : `min-h-screen bg-void text-chalk${!isAuthRoute ? ' studio-shell' : ''}${pathname === '/system-design' || pathname === '/resume-grill' ? ' studio-shell-focus' : ''}`}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-panel focus:px-4 focus:py-2 focus:text-chalk focus:shadow-xl">Skip to main content</a>
      {!isFullscreenIde && !isAuthRoute && <><StudySidebar /><TopBar /></>}
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
