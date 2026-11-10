import { Layers } from 'lucide-react'
import { useState } from 'react'

export default function IspSimulator() {
  const [segregated, setSegregated] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-line pb-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-cyan/15 text-cyan dark:text-cyan font-mono text-xs font-bold">
          <Layers size={13} />
        </span>
        <span className="font-plate text-sm font-bold text-chalk">
          Interactive Architecture Simulation: Lean Interface Contracts
        </span>
      </div>

      <div className="rounded-lg border border-line bg-panel-2/60 p-3.5 font-mono text-xs">
        {!segregated ? (
          <div className="text-muted space-y-1">
            <span className="text-amber font-semibold block">Fat Interface: WorkerInterface (12 methods)</span>
            <span className="text-2xs block">Forces SMSClient to implement attach_pdf(), encrypt_pgp(), and video_preview().</span>
          </div>
        ) : (
          <div className="text-emerald space-y-1 animate-in fade-in">
            <span className="font-semibold block">✓ Segregated Roles: TextNotifier, MediaNotifier, DocumentNotifier</span>
            <span className="text-2xs text-muted block">SMSClient only implements TextNotifier. No empty dummy stub methods!</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => setSegregated((s) => !s)}
          className="rounded bg-chalk px-3 py-1.5 font-semibold text-void"
        >
          {segregated ? 'Show Fat Interface' : '⚡ Segregate into Role Protocols'}
        </button>
      </div>
    </div>
  )
}
