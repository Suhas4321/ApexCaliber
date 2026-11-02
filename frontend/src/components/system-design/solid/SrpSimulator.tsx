import { ArrowRight, Zap } from 'lucide-react'
import { useState } from 'react'

export default function SrpSimulator() {
  const [refactored, setRefactored] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-line pb-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-violet-500/15 text-violet-600 dark:text-violet-400 font-mono text-xs font-bold">
          <Zap size={13} />
        </span>
        <span className="font-plate text-sm font-bold text-chalk">
          Interactive Architecture Simulation: Single Responsibility Boundary
        </span>
      </div>

      <div className="rounded-lg border border-line bg-panel-2/60 p-4 min-h-[110px] flex items-center justify-center font-mono text-xs">
        {!refactored ? (
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="rounded-lg border border-crimson/50 bg-crimson/10 p-2.5 max-w-sm">
              <span className="text-crimson font-bold block">God Object: OrderService (900 Lines)</span>
              <span className="text-2xs text-muted mt-0.5 block">
                Tax Math + SQL INSERTs + Emails + PDFs all tangled in 1 class.
              </span>
            </div>
            <span className="text-2xs text-crimson font-semibold">4 reasons to change = 4x blast radius</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-around gap-2 w-full animate-in fade-in">
            <div className="rounded border border-emerald/50 bg-emerald/10 p-2 text-center flex-1">
              <strong className="text-emerald text-xs block">1. TaxCalculator</strong>
              <span className="text-[10px] text-muted">Pure Math</span>
            </div>
            <ArrowRight size={13} className="text-muted shrink-0" />
            <div className="rounded border border-emerald/50 bg-emerald/10 p-2 text-center flex-1">
              <strong className="text-emerald text-xs block">2. ReceiptFormatter</strong>
              <span className="text-[10px] text-muted">String Template</span>
            </div>
            <ArrowRight size={13} className="text-muted shrink-0" />
            <div className="rounded border border-emerald/50 bg-emerald/10 p-2 text-center flex-1">
              <strong className="text-emerald text-xs block">3. OrderRepository</strong>
              <span className="text-[10px] text-muted">SQL Database</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => setRefactored((r) => !r)}
          className="rounded-md bg-chalk px-3 py-1.5 font-semibold text-void hover:opacity-90 active:scale-95 transition-all"
        >
          {refactored ? 'View Monolithic God Object' : '⚡ Split into SRP Single-Responsibility Services'}
        </button>
        <span className="font-mono text-2xs text-muted">
          {refactored ? '✓ Each helper has exactly one reason to change.' : 'Mixed responsibilities cause blast-radius bugs.'}
        </span>
      </div>
    </div>
  )
}
