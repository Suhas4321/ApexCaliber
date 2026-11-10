import { Zap } from 'lucide-react'
import { useState } from 'react'

export default function DipSimulator() {
  const [offlineMock, setOfflineMock] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-line pb-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-cyan/15 text-cyan dark:text-cyan font-mono text-xs font-bold">
          <Zap size={13} />
        </span>
        <span className="font-plate text-sm font-bold text-chalk">
          Interactive Architecture Simulation: Decoupled Dependency Injection
        </span>
      </div>

      <div className="rounded-lg border border-line bg-panel-2/60 p-4 font-mono text-xs flex items-center justify-between">
        <div>
          <span className="text-muted text-2xs block uppercase">Active Injected Dependency</span>
          <strong className="text-chalk text-sm">{offlineMock ? 'InMemoryRatesTable (Offline Mock)' : 'LiveForexHttpService (External HTTP)'}</strong>
        </div>
        <span className={`px-2 py-1 rounded text-2xs font-semibold ${offlineMock ? 'bg-emerald/15 text-emerald border border-emerald/30' : 'bg-amber/15 text-amber border border-amber/30'}`}>
          {offlineMock ? '0.1ms Offline Test' : '350ms Network I/O'}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => setOfflineMock((m) => !m)}
          className="rounded bg-chalk px-3 py-1.5 font-semibold text-void"
        >
          {offlineMock ? 'Switch to Production HTTP Service' : '⚡ Inject Fast Test Double Mock'}
        </button>
      </div>
    </div>
  )
}
