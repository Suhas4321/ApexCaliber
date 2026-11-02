import { Mail } from 'lucide-react'
import { useState } from 'react'

export default function NotificationRouterSimulator() {
  const [logs, setLogs] = useState<string[]>([])

  const simulateDispatch = () => {
    setLogs([
      '1. Client dispatched payload to NotificationRouter.',
      '2. Primary SMS Gateway returned HTTP 503 Service Unavailable.',
      '3. RetryDecorator: Attempt 1 failed. Backing off 100ms.',
      '4. RetryDecorator: Attempt 2 failed. Primary channel deemed DOWN.',
      '5. FallbackPolicy activated: Routing payload to secondary channel (SendGrid Email)...',
      '6. ✓ Fallback email delivered in 14ms with zero data loss!',
    ])
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-cyan/15 text-cyan font-mono text-xs font-bold">
            <Mail size={13} />
          </span>
          <span className="font-plate text-sm font-bold text-chalk">
            Interactive Domain Simulation: Pluggable Fallback Channel
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-panel-2/60 p-3.5 space-y-1.5 font-mono text-2xs">
        {logs.length === 0 ? (
          <p className="text-muted">Click simulate to watch primary SMS failure trigger automatic SendGrid Email fallback.</p>
        ) : (
          logs.map((l, i) => (
            <div key={i} className={l.startsWith('6') ? 'text-emerald font-semibold' : l.includes('failed') ? 'text-amber' : 'text-slate-300'}>
              {l}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={simulateDispatch}
          className="rounded-md bg-chalk px-3 py-1.5 font-semibold text-void hover:opacity-90 active:scale-95 transition-all"
        >
          ⚡ Simulate Send with Primary SMS Brownout
        </button>
      </div>
    </div>
  )
}
