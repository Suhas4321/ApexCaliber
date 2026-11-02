import { RotateCcw, Zap } from 'lucide-react'
import { useState } from 'react'

export default function ParkingLotSimulator() {
  const [spots, setSpots] = useState([
    { id: '101', floor: 1, type: 'compact', occupied: true },
    { id: '102', floor: 1, type: 'compact', occupied: false },
    { id: '103', floor: 1, type: 'ev', occupied: false },
    { id: '104', floor: 1, type: 'ev', occupied: true },
    { id: '201', floor: 2, type: 'compact', occupied: false },
    { id: '202', floor: 2, type: 'compact', occupied: false },
  ])
  const [log, setLog] = useState('Parking allocator initialized with 2 floors.')

  const park = (type: string) => {
    const idx = spots.findIndex((s) => s.type === type && !s.occupied)
    if (idx === -1) {
      setLog(`[FULL] No free ${type.toUpperCase()} spot!`)
      return
    }
    const next = [...spots]
    next[idx].occupied = true
    setSpots(next)
    setLog(`[ALLOCATED] Floor ${next[idx].floor} Spot #${next[idx].id} to ${type.toUpperCase()}.`)
  }

  const resetLot = () => {
    setSpots((prev) => prev.map((s) => ({ ...s, occupied: false })))
    setLog('All spots cleared.')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-line pb-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-cyan/15 text-cyan font-mono text-xs font-bold">
          <Zap size={13} />
        </span>
        <span className="font-plate text-sm font-bold text-chalk">
          Interactive Domain Simulation: Multi-Floor Slot Allocator
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {spots.map((s) => (
          <div
            key={s.id}
            className={`rounded-lg border p-2.5 font-mono text-xs transition-colors ${
              s.occupied ? 'border-amber/40 bg-amber/10 text-amber' : 'border-line bg-panel-2 text-muted'
            }`}
          >
            <div className="flex justify-between font-bold">
              <span>F{s.floor} · #{s.id}</span>
              <span className="text-[10px] uppercase">{s.type}</span>
            </div>
            <span className="text-2xs font-semibold mt-1 block">{s.occupied ? 'OCCUPIED' : 'FREE'}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => park('compact')} className="rounded bg-chalk px-3 py-1.5 font-semibold text-void">
            + Park Compact
          </button>
          <button type="button" onClick={() => park('ev')} className="rounded border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-semibold text-cyan">
            + Park EV
          </button>
          <button type="button" onClick={resetLot} className="rounded border border-line bg-panel p-1.5 text-muted hover:text-chalk">
            <RotateCcw size={13} />
          </button>
        </div>
        <span className="font-mono text-2xs text-muted truncate">{log}</span>
      </div>
    </div>
  )
}
