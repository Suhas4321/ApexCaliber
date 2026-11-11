import * as Dialog from '@radix-ui/react-dialog'
import { BookOpen, ChartNoAxesCombined, Code2, Compass, Home, Menu, Network, NotebookPen, PanelLeftClose, ScanSearch } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { hostedAuthEnabled } from '../lib/auth'
import { useGrimoire } from '../lib/grimoire'
import ApexCaliberLogo from './ApexCaliberLogo'

const sections = [
  { label: 'Workspace', items: [{ to: '/app', label: 'Learning home', icon: Home }, { to: '/app#learning-paths', label: 'Subjects', icon: BookOpen }, { to: '/stats', label: 'Your progress', icon: ChartNoAxesCombined }] },
  { label: 'Practice & prepare', items: [{ to: '/citadel/dsa', label: 'Coding practice', icon: Code2 }, { to: '/system-design', label: 'System design', icon: Network }, { to: '/resume-grill', label: 'Interview practice', icon: NotebookPen }, { to: '/finder', label: 'Pattern finder', icon: ScanSearch }] },
]

function NavigationContent({ onNavigate }: { onNavigate?: () => void }) {
  const openGuide = useGrimoire()
  const { hash, pathname } = useLocation()
  return <>
    <Link to="/app" className="studio-brand" onClick={onNavigate} aria-label="ApexCaliber learning home"><ApexCaliberLogo size="sm" /></Link>
    <nav aria-label="Primary navigation" className="studio-nav">
      {sections.map((section) => <div className="studio-nav-section" key={section.label}>
        <p>{section.label}</p>
        {section.items.map(({ to, label, icon: Icon }) => {
          const active = to.includes('#') ? pathname === '/app' && hash === '#learning-paths' : pathname === to && !(to === '/app' && hash)
          return <Link key={to} to={to} aria-current={active ? 'page' : undefined} onClick={onNavigate} className={`studio-nav-item${active ? ' is-active' : ''}`}><Icon size={18} strokeWidth={1.7} /><span>{label}</span></Link>
        })}
      </div>)}
      <div className="studio-nav-section"><p>Your toolkit</p>
        <button type="button" className="studio-nav-item" onClick={() => { onNavigate?.(); openGuide() }}><BookOpen size={18} strokeWidth={1.7} /><span>Revision guide</span></button>
        {!hostedAuthEnabled && <NavLink to="/playground" onClick={onNavigate} className="studio-nav-item"><Code2 size={18} strokeWidth={1.7} /><span>Code playground</span></NavLink>}
      </div>
    </nav>
    <div className="studio-nav-note"><Compass size={19} /><strong>Understanding comes first.</strong><p>One idea. A working example.<br />Then make it your own.</p></div>
    <Link className="studio-public-link" to="/" onClick={onNavigate}>About ApexCaliber <span aria-hidden="true">↗</span></Link>
  </>
}

export function StudySidebar() {
  return <aside className="studio-sidebar no-print"><NavigationContent /></aside>
}

export function StudyNavigationDrawer() {
  const [open, setOpen] = useState(false)
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger className="studio-menu-button" aria-label="Open navigation"><Menu size={20} /></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="studio-drawer-overlay" /><Dialog.Content className="studio-drawer" aria-describedby={undefined}>
      <Dialog.Title className="sr-only">Navigation</Dialog.Title>
      <Dialog.Close className="studio-drawer-close" aria-label="Close navigation"><PanelLeftClose size={19} /></Dialog.Close>
      <NavigationContent onNavigate={() => setOpen(false)} />
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>
}
