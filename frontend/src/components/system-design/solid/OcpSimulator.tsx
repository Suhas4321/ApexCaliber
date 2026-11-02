import { CheckCircle2, RotateCcw, Sparkles } from 'lucide-react'
import { useState } from 'react'

export default function OcpSimulator() {
  const [gateways, setGateways] = useState<string[]>(['STRIPE', 'PAYPAL'])

  const addGateway = (name: string) => {
    if (!gateways.includes(name)) setGateways([...gateways, name])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-line pb-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-violet-500/15 text-violet-600 dark:text-violet-400 font-mono text-xs font-bold">
          <Sparkles size={13} />
        </span>
        <span className="font-plate text-sm font-bold text-chalk">
          Interactive Architecture Simulation: Extensible Strategy Registry
        </span>
      </div>

      <div className="rounded-lg border border-line bg-panel-2/60 p-3.5 space-y-2 font-mono text-xs">
        <div className="text-2xs text-muted">FEES_REGISTRY: dict[str, Callable] (Closed for modification, open for extension):</div>
        <div className="flex flex-wrap gap-2">
          {gateways.map((g) => (
            <span key={g} className="rounded-lg border border-emerald/40 bg-emerald/10 px-2.5 py-1 text-emerald font-semibold flex items-center gap-1 text-2xs">
              <CheckCircle2 size={11} /> {g}_CALCULATOR
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => addGateway('APPLE_PAY')}
            className="rounded border border-line bg-panel px-2.5 py-1 text-muted hover:text-chalk"
          >
            + Register ApplePay Strategy
          </button>
          <button
            type="button"
            onClick={() => addGateway('CRYPTO')}
            className="rounded border border-line bg-panel px-2.5 py-1 text-muted hover:text-chalk"
          >
            + Register Crypto Strategy
          </button>
          <button
            type="button"
            onClick={() => setGateways(['STRIPE', 'PAYPAL'])}
            className="rounded border border-line bg-panel p-1.5 text-muted hover:text-chalk"
          >
            <RotateCcw size={12} />
          </button>
        </div>
        <span className="font-mono text-2xs text-muted">Zero edits made to process_payment()!</span>
      </div>
    </div>
  )
}
