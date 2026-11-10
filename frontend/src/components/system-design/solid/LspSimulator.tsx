import { ShieldAlert } from 'lucide-react'
import { useState } from 'react'

export default function LspSimulator() {
  const [contractBroken, setContractBroken] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-line pb-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-cyan/15 text-cyan dark:text-cyan font-mono text-xs font-bold">
          <ShieldAlert size={13} />
        </span>
        <span className="font-plate text-sm font-bold text-chalk">
          Interactive Architecture Simulation: Subtype Substitutability
        </span>
      </div>

      <div className="rounded-lg border border-line bg-panel-2/60 p-3.5 font-mono text-xs">
        {!contractBroken ? (
          <div className="text-emerald space-y-1">
            <span className="font-semibold block">✓ Correct LSP Hierarchy:</span>
            <span className="text-muted text-2xs block">
              ReadOnlyStorage defines read(). WritableStorage extends with write() & delete(). Loop only invokes delete() on Writable stores.
            </span>
          </div>
        ) : (
          <div className="text-crimson space-y-1 animate-in fade-in">
            <span className="font-semibold block">✕ LSP Violation: ReadOnlyStorage.delete() throws NotImplementedError!</span>
            <span className="text-muted text-2xs block">
              Subclass cannot weaken parent contract. Client crashes during batch storage purge.
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => setContractBroken((b) => !b)}
          className="rounded bg-chalk px-3 py-1.5 font-semibold text-void"
        >
          {contractBroken ? 'Fix Hierarchy (LSP Compliant)' : 'Simulate Broken Subtype Crash'}
        </button>
      </div>
    </div>
  )
}
