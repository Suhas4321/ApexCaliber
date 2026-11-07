import { ArrowLeft, ArrowRight, ChevronDown, List } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'

interface Props {
  title: string
  label: string
  introduction: ReactNode
  tools?: ReactNode
  sections: { id: string; title: string; content: ReactNode }[]
  onPractice?: () => void
}

export default function StudyGuideLayout({ title, label, introduction, tools, sections, onPractice }: Props) {
  const [active, setActive] = useState(0)
  const [outlineOpen, setOutlineOpen] = useState(false)
  const main = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const section = sections[active]

  function select(index: number) {
    setActive(index)
    setOutlineOpen(false)
    main.current?.scrollTo({ top: 0 })
    heading.current?.focus({ preventScroll: true })
  }

  return <div className="lesson-layout study-guide">
    <button className="lesson-outline-toggle" aria-expanded={outlineOpen} aria-controls="study-outline" onClick={() => setOutlineOpen(!outlineOpen)}>
      <List size={15} /> Guide outline <span>{active + 1} / {sections.length}</span><ChevronDown size={14} />
    </button>
    <aside id="study-outline" className={`lesson-outline ${outlineOpen ? 'is-open' : ''}`} aria-label={`${label} outline`}>
      <div className="lesson-outline-heading"><span className="lesson-eyebrow">{label}</span><h2>{title}</h2><span className="lesson-eyebrow">{sections.length} sections · Read at your pace</span></div>
      <nav>{sections.map((item, i) => <button key={item.id} className={`lesson-outline-item ${i === active ? 'is-current' : ''}`} aria-current={i === active ? 'step' : undefined} onClick={() => select(i)}>
        <span className="lesson-number">{String(i + 1).padStart(2, '0')}</span><span>{item.title}</span>
      </button>)}</nav>
      {onPractice && <div className="lesson-outline-footer"><p>Put the idea into practice when you’re ready.</p><button onClick={onPractice}>Open practice editor <ArrowRight size={14} /></button></div>}
    </aside>
    <div className="lesson-main" ref={main}>
      <div className="lesson-body">
        <div className="study-guide-meta"><span className="lesson-eyebrow">{label} / {active + 1} of {sections.length}</span>{tools}</div>
        <h1 ref={heading} tabIndex={-1} className="lesson-title">{section.title}</h1>
        {active === 0 && <div className="lesson-subtitle">{introduction}</div>}
        <div key={section.id} className="study-guide-content">{section.content}</div>
        <div className="lesson-actions">
          <button className="lesson-link" disabled={active === 0} onClick={() => select(active - 1)}><ArrowLeft size={15} /> Previous section</button>
          {active < sections.length - 1
            ? <button className="lesson-primary" onClick={() => select(active + 1)}>Next: {sections[active + 1].title}<ArrowRight size={16} /></button>
            : onPractice && <button className="lesson-primary" onClick={onPractice}>Practice in editor <ArrowRight size={16} /></button>}
        </div>
      </div>
    </div>
  </div>
}
