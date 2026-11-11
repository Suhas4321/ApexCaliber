import { ExternalLink, Film, Sliders } from 'lucide-react'
import { useState } from 'react'
import ArchitectureFlowSimulator from './ArchitectureFlowSimulator'
import CodeExecutionMotionGraphic from '../../features/system-design/motion/CodeExecutionMotionGraphic'
import RateLimiterMotionGraphic from '../../features/system-design/motion/RateLimiterMotionGraphic'
import TinyUrlMotionGraphic from '../../features/system-design/motion/TinyUrlMotionGraphic'
import CollabDocMotionGraphic from '../../features/system-design/motion/CollabDocMotionGraphic'
import NotificationEngineMotionGraphic from '../../features/system-design/motion/NotificationEngineMotionGraphic'
import ConsistentHashingMotionGraphic from '../../features/system-design/motion/ConsistentHashingMotionGraphic'
import RealtimeChatMotionGraphic from '../../features/system-design/motion/RealtimeChatMotionGraphic'
import VideoStreamingMotionGraphic from '../../features/system-design/motion/VideoStreamingMotionGraphic'
import GeospatialMatchingMotionGraphic from '../../features/system-design/motion/GeospatialMatchingMotionGraphic'
import PaymentLedgerMotionGraphic from '../../features/system-design/motion/PaymentLedgerMotionGraphic'
import SystemDesignAssignment from '../workspace/SystemDesignAssignment'
import { SYSTEM_DESIGN_ASSIGNMENTS } from '../../lib/systemDesignAssignments'
import { HLD_PROBLEMS } from '../../lib/systemDesignData'
import type { SelectedItem } from './SystemDesignSidebar'

interface Props {
  index: number
  onNavigate: (next: SelectedItem) => void
  completedIds: string[]
  onCompleted: (id: string) => void
}

export default function SystemDesignHldView({ index, onNavigate, completedIds, onCompleted }: Props) {
  const hld = HLD_PROBLEMS[index] ?? HLD_PROBLEMS[0]
  const [activeHop, setActiveHop] = useState(0)
  const [simViewMode, setSimViewMode] = useState<'motion' | 'hop'>('motion')
  const isDone = completedIds.includes(hld.id)

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-line pb-6 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-2xs font-mono text-muted">
          <span>Module 3: Distributed HLD · System {String(index + 1).padStart(2, '0')} of {HLD_PROBLEMS.length}</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => { onNavigate({ kind: 'hld', index: index - 1 }); setActiveHop(0) }}
              className="rounded border border-line bg-panel px-2 py-0.5 text-muted hover:text-chalk hover:bg-panel-2 disabled:opacity-30"
            >
              ← Prev
            </button>
            <button
              type="button"
              disabled={index >= HLD_PROBLEMS.length - 1}
              onClick={() => { onNavigate({ kind: 'hld', index: index + 1 }); setActiveHop(0) }}
              className="rounded border border-line bg-panel px-2 py-0.5 text-muted hover:text-chalk hover:bg-panel-2 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
        <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-chalk">
          {hld.title}
        </h1>
        <div className="flex flex-wrap gap-2 pt-1 font-mono text-2xs">
          <span className="rounded bg-amber-500/15 border border-amber-500/30 text-amber px-2 py-0.5 font-semibold">{hld.difficulty}</span>
          {hld.companies.map((c) => (
            <span key={c} className="rounded bg-panel-2 border border-line text-muted px-2 py-0.5">{c}</span>
          ))}
        </div>
      </div>

      {/* 1. Scale & Capacity Targets */}
      <section id="section-scale" className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-chalk">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-500/15 font-mono text-2xs text-amber font-semibold">1</span>
          <span>Scale Targets & Latency SLA</span>
        </h2>
        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-line bg-panel-2 font-semibold text-muted">
                <th className="py-2.5 px-4">Daily Active Scale</th>
                <th className="py-2.5 px-4">Peak Concurrency</th>
                <th className="py-2.5 px-4">Latency Target</th>
                <th className="py-2.5 px-4">Workload Profile</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-3 px-4 font-mono text-xs text-chalk">{hld.scale.dau}</td>
                <td className="py-3 px-4 font-mono text-xs text-chalk">{hld.scale.peakRps}</td>
                <td className="py-3 px-4 font-mono text-xs text-chalk">{hld.scale.latency}</td>
                <td className="py-3 px-4 font-mono text-xs text-muted">{hld.scale.ratio}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Why Single-Server Monolith Fails */}
      <section id="section-failure" className="space-y-3 pt-4 border-t border-line">
        <h2 className="flex items-center gap-2 text-base font-semibold text-chalk">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-500/15 font-mono text-2xs text-amber font-semibold">2</span>
          <span>Why the Naive Single-Server Monolith Fails</span>
        </h2>
        <p className="text-sm leading-relaxed text-chalk">
          <strong className="text-chalk font-semibold">Naive Setup:</strong>{' '}
          <span className="text-muted">{hld.naiveFailure.setup}</span>
        </p>
        <div className="rounded-lg border border-line bg-panel-2 p-4 text-sm leading-relaxed text-chalk space-y-2">
          <div className="inline-flex items-center rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 font-mono text-2xs uppercase tracking-wider text-amber font-semibold">
            Breaking Point · {hld.naiveFailure.breakingPoint}
          </div>
          <ul className="list-disc list-inside space-y-1 text-muted">
            {hld.naiveFailure.crashes.map((cr, idx) => (
              <li key={idx}>{cr}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. Scaled Hop-by-Hop Flow & Live Interactive Simulation */}
      <section id="section-architecture" className="space-y-4 pt-4 border-t border-line">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-chalk">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-500/15 font-mono text-2xs text-amber font-semibold">3</span>
            <span>Architecture Simulation & Motion Graphic</span>
          </h2>

          {index >= 0 && index < 10 && (
            <div className="inline-flex flex-wrap rounded-lg border border-line bg-panel-2 p-1 text-xs font-medium gap-1">
              <button
                type="button"
                onClick={() => setSimViewMode('motion')}
                className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] sm:min-h-[32px] rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--study-accent)] ${
                  simViewMode === 'motion'
                    ? 'bg-panel-3 text-cyan font-semibold border border-line-strong'
                    : 'text-muted hover:text-chalk border border-transparent'
                }`}
              >
                <Film size={13} />
                <span>Cinematic Motion Graphic</span>
              </button>
              <button
                type="button"
                onClick={() => setSimViewMode('hop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] sm:min-h-[32px] rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--study-accent)] ${
                  simViewMode === 'hop'
                    ? 'bg-panel-3 text-cyan font-semibold border border-line-strong'
                    : 'text-muted hover:text-chalk border border-transparent'
                }`}
              >
                <Sliders size={13} />
                <span>Hop-by-Hop Flow</span>
              </button>
            </div>
          )}
        </div>

        {simViewMode === 'motion' && index === 0 ? (
          <CodeExecutionMotionGraphic />
        ) : simViewMode === 'motion' && index === 1 ? (
          <RateLimiterMotionGraphic />
        ) : simViewMode === 'motion' && index === 2 ? (
          <TinyUrlMotionGraphic />
        ) : simViewMode === 'motion' && index === 3 ? (
          <CollabDocMotionGraphic />
        ) : simViewMode === 'motion' && index === 4 ? (
          <NotificationEngineMotionGraphic />
        ) : simViewMode === 'motion' && index === 5 ? (
          <ConsistentHashingMotionGraphic />
        ) : simViewMode === 'motion' && index === 6 ? (
          <RealtimeChatMotionGraphic />
        ) : simViewMode === 'motion' && index === 7 ? (
          <VideoStreamingMotionGraphic />
        ) : simViewMode === 'motion' && index === 8 ? (
          <GeospatialMatchingMotionGraphic />
        ) : simViewMode === 'motion' && index === 9 ? (
          <PaymentLedgerMotionGraphic />
        ) : (
          <ArchitectureFlowSimulator
            systemTitle={hld.title}
            nodes={hld.architectureNodes}
            peakRps={hld.scale.peakRps}
            latencySla={hld.scale.latency}
            activeHop={activeHop}
            onHopChange={setActiveHop}
          />
        )}
      </section>

      {/* 4. Chaos & Defenses Table */}
      <section id="section-defenses" className="space-y-3 pt-4 border-t border-line">
        <h2 className="flex items-center gap-2 text-base font-semibold text-chalk">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-500/15 font-mono text-2xs text-amber font-semibold">4</span>
          <span>Failure Modes & Production Resilient Defenses</span>
        </h2>
        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-line bg-panel-2 font-semibold text-muted">
                <th className="py-2.5 px-4 w-44">Failure Scenario</th>
                <th className="py-2.5 px-4">What Breaks</th>
                <th className="py-2.5 px-4">Production Mitigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {hld.chaosScenarios.map((cs) => (
                <tr key={cs.id}>
                  <td className="py-2.5 px-4 align-top font-medium text-chalk">{cs.name}</td>
                  <td className="py-2.5 px-4 align-top text-muted">{cs.brokenWithoutDefense}</td>
                  <td className="py-2.5 px-4 align-top text-chalk font-mono text-2xs">{cs.defenseMechanism}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Senior Interview Pitch */}
      <section id="section-interview" className="space-y-3 pt-4 border-t border-line">
        <h2 className="flex items-center gap-2 text-base font-semibold text-chalk">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-500/15 font-mono text-2xs text-amber font-semibold">5</span>
          <span>Senior Interview Architecture Thesis</span>
        </h2>
        <div className="rounded-lg border border-line bg-panel-2 p-4 space-y-2 text-xs sm:text-sm text-chalk">
          <p><strong className="text-chalk font-semibold">1. Core Hook:</strong> <span className="text-muted">"{hld.seniorPitch.hook}"</span></p>
          <p><strong className="text-chalk font-semibold">2. Request Flow:</strong> <span className="text-muted">"{hld.seniorPitch.flow}"</span></p>
          <p><strong className="text-chalk font-semibold">3. Trade-offs:</strong> <span className="text-muted">"{hld.seniorPitch.tradeoffs}"</span></p>
          <p><strong className="text-chalk font-semibold">4. Resilient Defense:</strong> <span className="text-muted">"{hld.seniorPitch.defense}"</span></p>
        </div>

        {hld.references && hld.references.length > 0 && (
          <div className="pt-2 space-y-2">
            <span className="font-mono text-2xs uppercase text-muted font-semibold block">Further Architecture References</span>
            <div className="divide-y divide-line rounded-lg border border-line bg-panel overflow-hidden text-xs">
              {hld.references.map((ref) => (
                <a
                  key={ref.title}
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 transition-colors hover:bg-panel-2"
                >
                  <div>
                    <span className="font-medium text-chalk block">{ref.title} · {ref.author}</span>
                    <span className="text-2xs text-muted">{ref.takeaway}</span>
                  </div>
                  <ExternalLink size={13} className="text-muted shrink-0 ml-2" />
                </a>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 6. Hands-on Lab */}
      <div id="section-lab">
        {SYSTEM_DESIGN_ASSIGNMENTS[hld.id] && (
          <SystemDesignAssignment
            key={hld.id}
            spec={SYSTEM_DESIGN_ASSIGNMENTS[hld.id]}
            stepNumber={6}
            isCompleted={isDone}
            onCompleted={onCompleted}
            onNextLesson={() => {
              if (index < HLD_PROBLEMS.length - 1) {
                onNavigate({ kind: 'hld', index: index + 1 })
                setActiveHop(0)
              } else {
                onNavigate(null)
              }
            }}
          />
        )}
      </div>
    </div>
  )
}
