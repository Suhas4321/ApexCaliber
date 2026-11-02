import { Film, RotateCcw } from 'lucide-react'
import { useState } from 'react'

export default function BookMyShowSimulator() {
  const [seatState, setSeatState] = useState<{ status: 'AVAILABLE' | 'BOOKED'; version: number; heldBy: string | null }>({
    status: 'AVAILABLE',
    version: 1,
    heldBy: null,
  })
  const [raceLog, setRaceLog] = useState('Seat B12 available. Click to simulate 2 users booking simultaneously.')

  const simulateRace = () => {
    setSeatState({ status: 'BOOKED', version: 2, heldBy: 'Alice' })
    setRaceLog('RACE VERDICT: Alice checked version=1 and committed version=2. Bob checked version=1, detected version mismatch (2!=1), and rolled back with OptimisticLockException (HTTP 409)!')
  }

  const resetSeat = () => {
    setSeatState({ status: 'AVAILABLE', version: 1, heldBy: null })
    setRaceLog('Seat B12 reset to AVAILABLE, version=1.')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-line pb-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-cyan/15 text-cyan font-mono text-xs font-bold">
          <Film size={13} />
        </span>
        <span className="font-plate text-sm font-bold text-chalk">
          Interactive Domain Simulation: Optimistic Concurrency Seat Lock
        </span>
      </div>

      <div className="rounded-lg border border-line bg-panel-2/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className={`h-16 w-16 rounded-xl border flex flex-col items-center justify-center text-center shadow-md ${
            seatState.status === 'BOOKED' ? 'border-emerald bg-emerald/15 text-emerald' : 'border-line bg-panel text-chalk'
          }`}>
            <span className="text-2xs text-muted">Seat</span>
            <strong className="text-base font-bold">B12</strong>
            <span className="text-[10px] font-semibold">{seatState.status}</span>
          </div>
          <div>
            <div className="text-chalk font-semibold">Row B · Seat 12</div>
            <div className="text-2xs text-muted">Version: <strong className="text-amber">v{seatState.version}</strong></div>
            <div className="text-2xs text-muted">Held By: <strong className="text-chalk">{seatState.heldBy || 'None'}</strong></div>
          </div>
        </div>

        <div className="flex-1 max-w-sm rounded border border-line bg-panel p-2.5 text-2xs text-muted leading-relaxed">
          {raceLog}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 text-xs">
        <button
          type="button"
          onClick={simulateRace}
          className="rounded-md bg-chalk px-3 py-1.5 font-semibold text-void hover:opacity-90 active:scale-95 transition-all"
        >
          ⚡ Simulate Concurrent Race (Alice vs Bob on B12)
        </button>
        <button
          type="button"
          onClick={resetSeat}
          className="rounded-md border border-line bg-panel px-2.5 py-1.5 text-muted hover:text-chalk"
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  )
}
