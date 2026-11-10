import { ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { StatsResponse } from '../api/types'
import { ErrorNote, Skeleton } from '../components/ui'
import { useAuth } from '../lib/auth'
import './StudyPages.css'


function ActivityGrid({ days }: { days: StatsResponse['activity_20_weeks'] }) {
  if (!days.some((day) => day.count)) return <p className="study-empty">Your activity will appear here after you run code or finish a practice question.</p>
  const activeDays = days.filter((day) => day.count > 0).length
  return <div className="study-activity-scroll"><div className="study-activity-grid" role="img" aria-label={`Practice activity over the last 20 weeks: ${activeDays} active days`}>{days.map((day) => <span key={day.date} className={`study-activity-cell level-${Math.min(day.level, 4)}`} title={`${day.date}: ${day.count} activities`} aria-hidden="true" />)}</div><div className="study-activity-caption"><span>20 weeks ago</span><span>Today</span></div></div>
}

export default function StatsPage() {
  const auth = useAuth()
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (auth.enabled && !auth.session) return
    let active = true
    setLoading(true)
    setError(null)
    api.stats().then((data) => { if (active) { setStats(data); setLoading(false) } }).catch((cause) => { if (active) { setError(cause instanceof Error ? cause.message : 'Could not load progress'); setLoading(false) } })
    return () => { active = false }
  }, [auth.enabled, auth.session, reloadKey])

  if (auth.enabled && !auth.session) return <div className="study-page"><h1>Your progress</h1><p>Sign in to see your saved learning and practice.</p><Link className="study-button" to="/sign-in?next=%2Fstats">Sign in <ArrowRight size={16} /></Link></div>
  if (loading) return <div className="study-page" role="status" aria-label="Loading progress"><Skeleton className="h-44 rounded-xl" /><Skeleton className="mt-8 h-72 rounded-xl" /></div>
  if (error || !stats) return <div className="study-page"><ErrorNote message={error || 'Could not load progress'} /><button type="button" className="study-outline-button mt-5" onClick={() => setReloadKey((value) => value + 1)}><RefreshCw size={16} /> Try again</button></div>

  return <div className="study-page study-progress-page">
    <header className="study-heading"><span className="study-eyebrow">Learning record</span><h1>Your progress</h1><p>See what you have practiced, what needs another look, and where to continue.</p></header>
    <div className="study-summary-grid" aria-label="Progress summary">
      <div className="study-summary-card"><span>Questions solved</span><strong>{stats.total_solved}<small> / {stats.total_questions}</small></strong><p>Across all learning paths</p></div>
      <div className="study-summary-card"><span>Reviews due</span><strong>{stats.reviews_due_today}</strong><p>{stats.reviews_due_this_week} due this week</p></div>
      <div className="study-summary-card"><span>Study streak</span><strong>{stats.streak}<small> days</small></strong><p>Days with practice activity</p></div>
    </div>

    <section className="study-section" aria-labelledby="path-progress-title"><div className="study-section-header"><div><span className="study-eyebrow">By subject</span><h2 id="path-progress-title">Learning paths</h2></div><Link className="study-text-link" to="/app#learning-paths">Explore paths <ArrowRight size={16} /></Link></div><div className="study-progress-list">{stats.peaks.map((peak) => <Link key={peak.id} to={`/citadel/${peak.id}`} className="study-progress-row"><span className="study-progress-name">{peak.short_name}</span><span className="study-progress-bar" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, peak.mastery))}%` }} /></span><span className="study-progress-count">{peak.solved}/{peak.total}</span><ArrowRight size={16} aria-hidden="true" /></Link>)}</div></section>

    <section className="study-section" aria-labelledby="review-title"><div className="study-section-header"><div><span className="study-eyebrow">Next actions</span><h2 id="review-title">Review and strengthen</h2></div><span className="study-section-note">Practice again to keep ideas fresh</span></div><div className="study-review-grid"><div className="study-detail-card"><h3>Concepts to revisit</h3>{stats.rust_camps.length ? <ul className="study-detail-list">{stats.rust_camps.map((item) => <li key={item.slug}><div><strong>{item.title}</strong><small>{item.world_title} · {item.rust === 'rusted' ? 'Needs a refresh' : 'Getting rusty'}</small></div><Link to={`/q/${item.slug}`}>Review <ArrowRight size={14} /></Link></li>)}</ul> : <p className="study-muted">Concepts to refresh will appear after you have practiced for a while.</p>}</div><div className="study-detail-card"><h3>Worth another try</h3>{stats.weakest_lessons.length ? <ul className="study-detail-list">{stats.weakest_lessons.map((item) => <li key={item.slug}><div><strong>{item.title}</strong><small>{item.world_title} · {item.attempts} attempts</small></div><Link to={`/q/${item.slug}`}>Practice <ArrowRight size={14} /></Link></li>)}</ul> : <p className="study-muted">Areas to revisit will appear after you practice and rate your confidence.</p>}</div></div></section>

    <section className="study-section" aria-labelledby="activity-title"><div className="study-section-header"><div><span className="study-eyebrow">Consistency</span><h2 id="activity-title">Study activity</h2></div><span className="study-section-note">Code runs, test passes, and completed drills</span></div><div className="study-detail-card"><ActivityGrid days={stats.activity_20_weeks} /><div className="study-week-list" aria-label="This week's activity">{stats.activity_this_week.map((day) => <span key={day.date}><strong>{day.count}</strong><small>{day.day}</small></span>)}</div></div></section>

    <details className="study-more-details"><summary>More progress details <span>Scores, achievements, and recent runs</span></summary><div className="study-more-content">
      <div className="study-insight-grid"><div><span>First-try pass rate</span><strong>{stats.first_try_pass_rate === null ? '—' : `${stats.first_try_pass_rate}%`}</strong></div><div><span>Average hints used</span><strong>{stats.average_hints ?? '—'}</strong></div><div><span>Confidence rating</span><strong>{stats.average_confidence === null ? '—' : `${stats.average_confidence}/3`}</strong></div><div><span>Estimated readiness</span><strong>{stats.readiness_score}/100</strong></div><div><span>Level and XP</span><strong>{stats.level} · {stats.level_xp}/100 XP</strong></div></div>
      <div className="study-more-block"><h3>Topics practiced</h3><div className="study-progress-list">{stats.world_mastery.map((world) => <div key={world.slug} className="study-progress-row"><span className="study-progress-name">{world.title}</span><span className="study-progress-bar" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, world.mastery))}%` }} /></span><span className="study-progress-count">{world.solved}/{world.total}</span></div>)}</div></div>
      <div className="study-more-block"><h3>Milestones</h3><div className="study-milestone-grid">{stats.seals.map((seal) => <div key={seal.citadel_id} className="study-milestone"><CheckCircle2 size={17} aria-hidden="true" /><strong>{seal.name}</strong><small>{seal.unlocked ? 'Completed' : `${seal.solved}/${seal.total} solved`}</small></div>)}{stats.badges.map((badge) => <div key={badge.id} className="study-milestone"><span aria-hidden="true">{badge.icon}</span><strong>{badge.title}</strong><small>{badge.unlocked ? 'Earned' : badge.description}</small></div>)}</div></div>
      <div className="study-more-block"><h3>Recent runs</h3>{stats.recent_timeline.length ? <ul className="study-detail-list">{stats.recent_timeline.map((event) => <li key={event.id}><div><Link to={`/q/${event.question_slug}`}><strong>{event.question_title}</strong></Link><small>{event.passed_count}/{event.total_count} tests passed · {new Date(event.created_at).toLocaleString()}</small></div><span className="study-run-result">{event.passed ? 'Passed' : 'Try again'}</span></li>)}</ul> : <p className="study-muted">Your code runs will appear here.</p>}</div>
    </div></details>
  </div>
}
