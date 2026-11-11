import { ArrowRight, DollarSign } from 'lucide-react'
import { useState } from 'react'

export default function SplitwiseSimulator() {
  const [simplified, setSimplified] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-line pb-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-cyan/15 text-cyan font-mono text-xs font-bold">
          <DollarSign size={13} />
        </span>
        <span className="font-plate text-sm font-bold text-chalk">
          Interactive Domain Simulation: Min-Max Heap Debt Simplifier
        </span>
      </div>

      <div className="rounded-lg border border-line bg-panel-2/60 p-4 min-h-[110px] flex items-center justify-center font-mono text-xs">
        {!simplified ? (
          <div className="flex flex-wrap items-center justify-around gap-2 w-full">
            <div className="rounded border border-line bg-panel p-2 text-center">Alice<br /><span className="text-crimson text-2xs">-$40</span></div>
            <div className="text-amber flex flex-col items-center"><span className="text-2xs">owes $40</span><ArrowRight size={14} /></div>
            <div className="rounded border border-line bg-panel p-2 text-center">Bob<br /><span className="text-muted text-2xs">$0 Net</span></div>
            <div className="text-amber flex flex-col items-center"><span className="text-2xs">owes $40</span><ArrowRight size={14} /></div>
            <div className="rounded border border-line bg-panel p-2 text-center">Charlie<br /><span className="text-emerald text-2xs">+$40</span></div>
          </div>
        ) : (
          <div className="flex items-center justify-around w-full animate-in fade-in">
            <div className="rounded border border-crimson/40 bg-crimson/10 p-2.5 text-center">Alice<br /><span className="text-crimson text-2xs">-$40</span></div>
            <div className="text-emerald flex flex-col items-center"><span className="text-2xs font-bold">1 Direct Payment of $40</span><ArrowRight size={18} /></div>
            <div className="rounded border border-emerald/40 bg-emerald/10 p-2.5 text-center">Charlie<br /><span className="text-emerald text-2xs">+$40</span></div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => setSimplified((s) => !s)}
          className="rounded bg-chalk px-3 py-1.5 font-semibold text-void"
        >
          {simplified ? 'Show Raw 2 Transactions' : '⚡ Run Heap Simplification'}
        </button>
        <span className="font-mono text-2xs text-muted">
          {simplified ? '✓ Intermediate Bob node eliminated!' : '2 transactions required without heap simplification.'}
        </span>
      </div>
    </div>
  )
}
