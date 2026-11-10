import { ArrowRight, ArrowUpRight, Braces, Check, ChevronRight, Code2, Compass, Menu, Play, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ApexCaliberLogo from '../components/ApexCaliberLogo'
import AccountMenu from '../components/AccountMenu'
import { useAuth } from '../lib/auth'
import { signInPath } from '../lib/authNavigation'
import './LandingPage.css'

const signInUrl = '/sign-in?next=%2Fapp'

const demoSteps = [
  {
    label: 'Understand',
    eyebrow: '01 / THE IDEA',
    title: 'Start with the question behind the code.',
    description: 'You have seen 2. What number would complete the pair to make 9? Work out the missing piece before choosing a data structure.',
    note: '9 − 2 = 7',
  },
  {
    label: 'Trace',
    eyebrow: '02 / THE TRACE',
    title: 'Watch the state change, one move at a time.',
    description: 'Store each number as you go. At 7, the missing number is 2—and 2 is already in the map.',
    note: 'seen = { 2: 0 }  →  match at index 1',
  },
  {
    label: 'Code',
    eyebrow: '03 / THE CODE',
    title: 'Turn the reasoning into working code.',
    description: 'The solution follows the thought process: calculate the complement, look it up, then remember the current number.',
    note: 'return [seen[need], i]',
  },
]

const tracks = [
  { index: '01', title: 'Data structures & algorithms', detail: 'Patterns, problems, and code practice', path: '/app' },
  { index: '02', title: 'Python & data', detail: 'Language fundamentals to data tools', path: '/learn/python_data' },
  { index: '03', title: 'SQL & databases', detail: 'Tables, queries, and storage', path: '/learn/sql_dbms' },
  { index: '04', title: 'Operating systems', detail: 'Processes, threads, and coordination', path: '/learn/os_concurrency' },
  { index: '05', title: 'Backend & APIs', detail: 'Requests, responses, and services', path: '/learn/backend_apis' },
  { index: '06', title: 'Computer networks', detail: 'From DNS to the packets underneath', path: '/learn/computer_networking' },
  { index: '07', title: 'AI & retrieval', detail: 'Models, embeddings, and applications', path: '/learn/ai_resume' },
  { index: '08', title: 'System design', detail: 'Build a service, then make it scale', path: '/system-design' },
]

export default function LandingPage() {
  const { session } = useAuth()
  const [step, setStep] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const destination = session ? '/app' : signInUrl

  useEffect(() => {
    document.title = 'ApexCaliber — Learn engineering by building the answer'
    return () => { document.title = 'ApexCaliber — Your learning workspace' }
  }, [])

  return <div className="landing">
    <a className="landing-skip" href="#landing-main">Skip to content</a>
    <header className="landing-header">
      <div className="landing-container landing-header-inner">
        <Link to="/" aria-label="ApexCaliber home" className="landing-brand"><ApexCaliberLogo size="md" /></Link>
        <nav aria-label="Main navigation" className={menuOpen ? 'landing-nav is-open' : 'landing-nav'}>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#tracks" onClick={() => setMenuOpen(false)}>Learning tracks</a>
          <a href="#practice" onClick={() => setMenuOpen(false)}>Inside the workspace</a>
          <Link to={destination} className="landing-nav-mobile-action" onClick={() => setMenuOpen(false)}>{session ? 'Open my journey' : 'Sign in'} <ArrowRight size={16} /></Link>
        </nav>
        <div className="landing-header-actions">
          <Link to={destination} className="landing-signin">{session ? 'My journey' : 'Sign in'} <ArrowUpRight size={15} /></Link>
          <Link to={destination} className="landing-button landing-button-small">Start learning <ArrowRight size={16} /></Link>
          {session && <AccountMenu className="landing-account" />}
        </div>
        <button className="landing-menu-toggle" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
    </header>

    <main id="landing-main">
      <section className="landing-hero landing-container" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow"><span className="landing-eyebrow-line" /> THE LEARNING PATH FOR FUTURE ENGINEERS</p>
          <h1 id="landing-title">Understand it. <span>Code it.</span><br />Own the interview.</h1>
          <p className="landing-hero-description">For engineering students and graduates who want to do more than memorize answers. Start with a simple idea, see how it works, then write the code yourself.</p>
          <div className="landing-hero-actions">
            <Link className="landing-button" to={destination}>Start your journey <ArrowRight size={19} /></Link>
            <a className="landing-text-link" href="#how-it-works">See how learning works <ChevronRight size={18} /></a>
          </div>
          <div className="landing-hero-footnote"><span className="landing-footnote-mark"><Check size={13} /></span> Built for the step between “I read it” and “I can solve it.”</div>
        </div>

        <div className="landing-demo-wrap" aria-label="Example of the ApexCaliber learning method">
          <div className="landing-demo-orbit" aria-hidden="true" />
          <div className="landing-demo">
            <div className="landing-demo-topline"><span className="landing-demo-live"><span /> FROM IDEA TO IMPLEMENTATION</span><span className="landing-demo-id">DSA / ARRAYS / 01</span></div>
            <div className="landing-demo-heading"><div><p className="landing-demo-kicker">A SMALL PROBLEM, PROPERLY UNDERSTOOD</p><h2>Find the pair that adds to 9.</h2></div><Braces size={28} strokeWidth={1.4} aria-hidden="true" /></div>
            <div className="landing-input-strip"><span>INPUT</span><div aria-label="Numbers 2, 7, 11, 15"><i>2</i><i className="landing-input-active">7</i><i>11</i><i>15</i></div><span>TARGET <strong>9</strong></span></div>
            <div className="landing-demo-step-buttons" aria-label="Explore the learning steps">
              {demoSteps.map((item, index) => <button key={item.label} type="button" aria-pressed={step === index} className={step === index ? 'is-active' : ''} onClick={() => setStep(index)}><span>{`0${index + 1}`}</span>{item.label}</button>)}
            </div>
            <div className="landing-demo-content" aria-live="polite">
              <p className="landing-demo-kicker">{demoSteps[step].eyebrow}</p>
              <h3>{demoSteps[step].title}</h3>
              <p>{demoSteps[step].description}</p>
              {step === 2 ? <pre className="landing-code"><code><span>def</span> two_sum(nums, target):{'\n'}    seen = {'{}'}{'\n'}    <span>for</span> i, num <span>in</span> enumerate(nums):{'\n'}        need = target - num{'\n'}        <span>if</span> need <span>in</span> seen:{'\n'}            <em>return [seen[need], i]</em>{'\n'}        seen[num] = i</code></pre> : <div className="landing-demo-result"><span>{step === 0 ? 'THINK FIRST' : 'STATE AFTER INDEX 1'}</span><strong>{demoSteps[step].note}</strong></div>}
            </div>
            <div className="landing-demo-bottom"><span><span className="landing-pulse" /> YOUR NEXT STEP IS ALWAYS CLEAR</span><Code2 size={17} /></div>
          </div>
          <div className="landing-demo-caption">A preview of the learning approach · two sum example</div>
        </div>
      </section>

      <section id="how-it-works" className="landing-section landing-method">
        <div className="landing-container landing-method-grid">
          <div className="landing-section-intro"><p className="landing-eyebrow">THE METHOD</p><h2>Learn the logic.<br /><span>Then earn the answer.</span></h2><p>Definitions alone do not prepare you for a coding round. ApexCaliber connects the concept to the decision you make while solving a problem.</p><Link to={destination} className="landing-inline-link">Begin with the foundations <ArrowRight size={17} /></Link></div>
          <div className="landing-method-list">
            <div className="landing-method-row"><span>01</span><div><h3>Understand from the ground up</h3><p>Start with a familiar situation, plain language, and the one idea you need next.</p></div><Braces size={20} /></div>
            <div className="landing-method-row"><span>02</span><div><h3>See it in motion</h3><p>Follow worked examples and visual explanations before reaching for a solution.</p></div><Play size={20} /></div>
            <div className="landing-method-row"><span>03</span><div><h3>Practice in code</h3><p>Apply the pattern to a fresh question, write code, and keep track of your progress.</p></div><Code2 size={20} /></div>
          </div>
        </div>
      </section>

      <section id="tracks" className="landing-section landing-tracks landing-container">
        <div className="landing-tracks-heading"><div><p className="landing-eyebrow">ONE JOURNEY. EIGHT LEARNING AREAS.</p><h2>Build the whole engineering picture.</h2></div><p>Begin with algorithms. Connect them to the language, databases, networks, systems, and design decisions behind real software.</p></div>
        <div className="landing-tracks-grid">{tracks.map(track => <Link className="landing-track" key={track.index} to={session ? track.path : signInPath(track.path)}><span className="landing-track-index">{track.index}</span><div><h3>{track.title}</h3><p>{track.detail}</p></div><ChevronRight size={18} aria-hidden="true" /></Link>)}</div>
        <p className="landing-tracks-note">Learning routes are growing. Some areas currently have selected foundation lessons followed by deeper challenges.</p>
      </section>

      <section id="practice" className="landing-section landing-workspace">
        <div className="landing-container landing-workspace-grid"><div className="landing-workspace-visual" aria-hidden="true"><div className="landing-workspace-chrome"><span /><span /><span /><strong>apexcaliber / practice</strong></div><div className="landing-workspace-body"><div className="landing-workspace-sidebar"><span>YOUR ROUTE</span><b className="is-current">01&nbsp;&nbsp; Arrays & hashing</b><b>02&nbsp;&nbsp; Two pointers</b><b>03&nbsp;&nbsp; Sliding window</b><b>04&nbsp;&nbsp; Trees & graphs</b></div><div className="landing-workspace-main"><div className="landing-workspace-title"><span>ACTIVE CHALLENGE</span><strong>Two Sum</strong><small>Find a pair of indices whose values add to the target.</small></div><pre><code>need = target - num{'\n'}<em>if need in seen:</em>{'\n'}    return [seen[need], i]</code></pre><div className="landing-workspace-success"><Check size={14} /> Pattern recognized · Hash map lookup</div></div></div></div><div className="landing-workspace-copy"><p className="landing-eyebrow">INSIDE THE WORKSPACE</p><h2>The lesson leads to the code.</h2><p>Move from a concept route into a practice question. Use the pattern finder when you are stuck, and return to your journey with a clearer idea of what to study next.</p><ul><li><Compass size={17} /> A guided route instead of a random problem list</li><li><Code2 size={17} /> A place to reason, write, and test code</li><li><Check size={17} /> Progress you can come back to</li></ul><Link className="landing-button" to={destination}>Go to the workspace <ArrowRight size={18} /></Link></div></div>
      </section>

      <section className="landing-close landing-container"><p className="landing-eyebrow">YOUR NEXT STEP</p><h2>Start small.<br /><span>Build real confidence.</span></h2><p>One concept, one trace, one solved problem at a time.</p><Link className="landing-button" to={destination}>Start learning <ArrowRight size={18} /></Link></section>
    </main>
    <footer className="landing-footer"><div className="landing-container"><ApexCaliberLogo size="sm" /><span>Learn from first principles. Practice toward the interview.</span><a href="#landing-main">Back to top ↑</a></div></footer>
  </div>
}
