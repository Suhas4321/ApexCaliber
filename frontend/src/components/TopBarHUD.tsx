import { CheckCircle2, Flame } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUserStats } from '../lib/userStats'
import CountUp from './vendor/react-bits/CountUp'

/** Compact studio telemetry bar docked inside TopBar: solved total, level meter, and streak. */
export default function TopBarHUD() {
  const stats = useUserStats()

  return (
    <Link
      to="/stats"
      aria-label={`Studio telemetry: ${stats.totalSolved} of ${stats.totalQuestions} solved, level ${stats.level}, ${stats.streak} day streak`}
      title={`${stats.totalSolved}/${stats.totalQuestions} solved · Lvl ${stats.level} (${stats.levelXp}/100 XP) · ${stats.streak}d streak`}
      className="hidden lg:inline-flex items-center gap-2.5 rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-xs transition-[border-color,background-color,transform] duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:border-[var(--study-accent)]/40 hover:bg-panel-3 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--study-accent)]"
    >
      {/* Solved Counter */}
      <span className="inline-flex items-center gap-1.5 rounded border border-emerald/30 bg-emerald/10 px-2 py-0.5 font-mono text-2xs font-semibold tabular-nums text-emerald">
        <CheckCircle2 size={12} className="shrink-0" aria-hidden="true" />
        <span>
          <CountUp to={stats.totalSolved} duration={0.6} />/{stats.totalQuestions}
        </span>
      </span>

      <span className="h-3.5 w-px bg-line" aria-hidden="true" />

      {/* Level & Hairline XP Meter */}
      <span className="inline-flex items-center gap-2">
        <span className="font-mono text-2xs font-semibold tabular-nums text-chalk">
          Lvl {stats.level}
        </span>
        <span className="h-1.5 w-10 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
          <span
            className="block h-full rounded-full bg-[var(--study-accent)] shadow-[0_0_8px_var(--accent-glow)] transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
            style={{ width: `${Math.min(100, Math.max(0, stats.levelXp))}%` }}
          />
        </span>
      </span>

      <span className="h-3.5 w-px bg-line" aria-hidden="true" />

      {/* Day Streak */}
      <span className="inline-flex items-center gap-1 font-mono text-2xs font-semibold tabular-nums text-amber">
        <Flame size={13} className="shrink-0" aria-hidden="true" />
        <span>{stats.streak}d</span>
      </span>
    </Link>
  )
}
