import { Layers } from 'lucide-react'
import { useState } from 'react'

export default function ElevatorSimulator() {
  const [carFloor, setCarFloor] = useState(3)
  const [direction, setDirection] = useState<'UP' | 'DOWN'>('UP')
  const [queue, setQueue] = useState<number[]>([5, 7])

  const callFloor = (floor: number) => {
    if (floor === carFloor) return
    setQueue((q) => (q.includes(floor) ? q : [...q, floor].sort((a, b) => (direction === 'UP' ? a - b : b - a))))
  }

  const stepElevator = () => {
    if (queue.length === 0) return
    const next = queue[0]
    setCarFloor(next)
    setQueue((q) => q.slice(1))
    if (next === 8) setDirection('DOWN')
    if (next === 1) setDirection('UP')
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-cyan/15 text-cyan font-mono text-xs font-bold">
            <Layers size={13} />
          </span>
          <span className="font-plate text-sm font-bold text-chalk">
            Interactive Domain Simulation: LOOK Elevator Direction Sweep
          </span>
        </div>
        <span className="font-mono text-2xs text-muted">
          Car 1: Floor <strong className="text-chalk">{carFloor}</strong> ({direction})
        </span>
      </div>

      <div className="rounded-lg border border-line bg-panel-2/60 p-4 flex items-center justify-between gap-2 overflow-x-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((floor) => {
          const isCar = carFloor === floor
          const isTarget = queue.includes(floor)
          return (
            <button
              key={floor}
              type="button"
              onClick={() => callFloor(floor)}
              className={`flex-1 min-w-[54px] min-h-[88px] rounded-lg border flex flex-col items-center justify-between p-2 font-mono text-xs transition-[transform,colors] active:scale-[0.985] ${
                isCar
                  ? 'border-cyan bg-cyan/20 text-cyan scale-105 shadow-md font-bold'
                  : isTarget
                  ? 'border-amber/50 bg-amber/15 text-amber'
                  : 'border-line bg-panel text-muted hover:border-line-strong'
              }`}
            >
              <span>F{floor}</span>
              <span className="text-2xs font-semibold">{isCar ? 'CAR 1' : isTarget ? 'STOP' : ''}</span>
              <span className="text-2xs text-faint">Call</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={stepElevator}
          disabled={queue.length === 0}
          className="rounded-md bg-chalk px-3 py-1.5 font-semibold text-void hover:opacity-90 disabled:opacity-40"
        >
          Step Elevator Sweep
        </button>
        <span className="font-mono text-2xs text-muted">
          Queue: {queue.length > 0 ? queue.map((f) => `F${f}`).join(' → ') : 'Idle (Click floors to request)'}
        </span>
      </div>
    </div>
  )
}
