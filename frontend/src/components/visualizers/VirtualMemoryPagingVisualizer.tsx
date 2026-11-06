import { useState } from 'react'
import {
  Cpu,
  Layers,
  HardDrive,
  RotateCcw,
  Sparkles,
  Activity,
} from 'lucide-react'
import type { VisualizerProps } from './types'

type PagingPolicy = 'fifo' | 'lru'

interface FrameState {
  frameId: number
  pageNum: number | null
  lastAccessTime: number
  loadedAt: number
}

export default function VirtualMemoryPagingVisualizer({ step: _step, config: _config }: VisualizerProps) {
  const [policy, setPolicy] = useState<PagingPolicy>('lru')
  const [capacity] = useState<number>(3)

  // Simulation state
  const [frames, setFrames] = useState<FrameState[]>([
    { frameId: 0, pageNum: 1, lastAccessTime: 1, loadedAt: 1 },
    { frameId: 1, pageNum: 2, lastAccessTime: 2, loadedAt: 2 },
    { frameId: 2, pageNum: null, lastAccessTime: 0, loadedAt: 0 },
  ])
  const [timeCounter, setTimeCounter] = useState<number>(3)
  const [hits, setHits] = useState<number>(4)
  const [faults, setFaults] = useState<number>(2)
  const [lastAction, setLastAction] = useState<string>('Ready — Click any Virtual Page below to request memory access.')
  const [lastResult, setLastResult] = useState<'hit' | 'fault' | null>(null)
  const [evictedPage, setEvictedPage] = useState<number | null>(null)

  // Handle Page Request
  const handleAccessPage = (pageNum: number) => {
    const nextTime = timeCounter + 1
    setTimeCounter(nextTime)

    // Check if page is currently in one of the RAM frames
    const existingIndex = frames.findIndex((f) => f.pageNum === pageNum)

    if (existingIndex !== -1) {
      // PAGE HIT!
      setHits((h) => h + 1)
      setLastResult('hit')
      setEvictedPage(null)
      setLastAction(`★ PAGE HIT: Virtual Page ${pageNum} already mapped in RAM Frame ${existingIndex} (10ns access)!`)

      setFrames((prev) =>
        prev.map((f, idx) => (idx === existingIndex ? { ...f, lastAccessTime: nextTime } : f))
      )
    } else {
      // PAGE FAULT!
      setFaults((f) => f + 1)
      setLastResult('fault')

      // Find an empty frame or victim frame
      const emptyIndex = frames.findIndex((f) => f.pageNum === null)

      if (emptyIndex !== -1) {
        // Unallocated frame available
        setEvictedPage(null)
        setLastAction(`⚠️ PAGE FAULT: Page ${pageNum} not in RAM. Loaded into empty Frame ${emptyIndex} from Swap Disk.`)
        setFrames((prev) =>
          prev.map((f, idx) =>
            idx === emptyIndex
              ? { frameId: idx, pageNum, lastAccessTime: nextTime, loadedAt: nextTime }
              : f
          )
        )
      } else {
        // Memory full! Must evict victim
        let victimIndex = 0
        if (policy === 'fifo') {
          // FIFO: oldest loadedAt
          victimIndex = frames.reduce(
            (oldestIdx, cur, curIdx, arr) => (cur.loadedAt < arr[oldestIdx].loadedAt ? curIdx : oldestIdx),
            0
          )
        } else {
          // LRU: least recently accessed
          victimIndex = frames.reduce(
            (lruIdx, cur, curIdx, arr) => (cur.lastAccessTime < arr[lruIdx].lastAccessTime ? curIdx : lruIdx),
            0
          )
        }

        const victim = frames[victimIndex].pageNum
        setEvictedPage(victim)
        setLastAction(
          `🚨 PAGE FAULT + EVICTION (${policy.toUpperCase()}): Evicted Page ${victim} to Swap Disk. Mapped Page ${pageNum} into Frame ${victimIndex}!`
        )

        setFrames((prev) =>
          prev.map((f, idx) =>
            idx === victimIndex
              ? { frameId: idx, pageNum, lastAccessTime: nextTime, loadedAt: nextTime }
              : f
          )
        )
      }
    }
  }

  const resetPaging = () => {
    setFrames([
      { frameId: 0, pageNum: null, lastAccessTime: 0, loadedAt: 0 },
      { frameId: 1, pageNum: null, lastAccessTime: 0, loadedAt: 0 },
      { frameId: 2, pageNum: null, lastAccessTime: 0, loadedAt: 0 },
    ])
    setHits(0)
    setFaults(0)
    setTimeCounter(0)
    setLastResult(null)
    setEvictedPage(null)
    setLastAction('Paging frames cleared. Ready to trace.')
  }

  const totalAccess = hits + faults
  const hitRate = totalAccess > 0 ? Math.round((hits / totalAccess) * 100) : 0

  return (
    <div className="flex h-full w-full flex-col gap-3 p-4 font-sans text-slate-200">
      {/* Top Header & Replacement Policy Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E3446] pb-3">
        <div className="flex items-center gap-2">
          <Cpu size={18} className="text-amber" />
          <span className="font-plate text-sm font-bold tracking-wide text-chalk">
            OS Virtual Memory, MMU & Physical Frame Replacement
          </span>
          <span className="rounded-full bg-amber/15 px-2 py-0.5 text-2xs font-mono text-amber font-semibold">
            Citadel IV Visualizer
          </span>
        </div>

        {/* Policy Switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-[#2E3446] bg-[#0E1118] p-1 text-xs">
          <button
            type="button"
            onClick={() => setPolicy('lru')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all ${
              policy === 'lru' ? 'bg-amber text-slate-950 font-bold shadow-sm' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Sparkles size={13} /> 1. LRU (Least Recently Used)
          </button>
          <button
            type="button"
            onClick={() => setPolicy('fifo')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all ${
              policy === 'fifo' ? 'bg-sky-500 text-white font-bold shadow-sm' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Layers size={13} /> 2. FIFO (First In First Out)
          </button>
        </div>
      </div>

      {/* Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl border border-[#222838] bg-[#0E1118] p-2.5 text-xs font-mono">
        <div className="flex flex-col">
          <span className="text-2xs text-[#94A3B8]">Page Hit Rate</span>
          <span className={`text-sm font-bold ${hitRate >= 60 ? 'text-emerald' : 'text-amber'}`}>
            {hitRate}% ({hits} hits / {faults} faults)
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xs text-[#94A3B8]">Memory Access Cost</span>
          <span className={`text-sm font-bold ${lastResult === 'hit' ? 'text-emerald' : lastResult === 'fault' ? 'text-crimson' : 'text-slate-300'}`}>
            {lastResult === 'hit' ? '10ns (RAM Hit)' : lastResult === 'fault' ? '10,000,000ns (Disk Trap)' : '—'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xs text-[#94A3B8]">Physical RAM Capacity</span>
          <span className="text-sm font-bold text-cyan">{capacity} Frames (12 KB RAM)</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xs text-[#94A3B8]">Last Evicted Page</span>
          <span className="text-sm font-bold text-amber">
            {evictedPage !== null ? `Page ${evictedPage} (to Swap)` : 'None'}
          </span>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-[#2E3446] bg-[#0A0D14] p-4 shadow-inner overflow-y-auto">
        {/* Status notification */}
        <div className="flex items-center justify-between rounded-xl border border-[#222838] bg-[#101420] px-4 py-2 text-xs font-mono">
          <span className="flex items-center gap-2">
            <Activity size={14} className="text-amber animate-pulse" />
            <span className="text-slate-300">{lastAction}</span>
          </span>
          <button
            type="button"
            onClick={resetPaging}
            className="flex items-center gap-1 rounded-lg border border-line bg-panel-2 px-2 py-0.5 text-2xs text-muted hover:text-white"
          >
            <RotateCcw size={11} /> Reset Frames
          </button>
        </div>

        {/* Virtual Page Selector: Interactive Address Request */}
        <div className="flex flex-col gap-2 rounded-xl border border-[#222838] bg-[#121624] p-3 text-xs">
          <span className="font-mono text-2xs uppercase text-muted">
            Click Virtual Page Number to Request Memory Address (Simulate CPU Execution):
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((pNum) => {
              const inRam = frames.some((f) => f.pageNum === pNum)
              return (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => handleAccessPage(pNum)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 font-mono text-xs font-bold transition-all shadow-sm ${
                    inRam
                      ? 'border-emerald/60 bg-emerald/15 text-emerald hover:bg-emerald/25 hover:border-emerald'
                      : 'border-[#2E3446] bg-[#181D2E] text-slate-300 hover:border-amber hover:text-white'
                  }`}
                >
                  <span>Page {pNum}</span>
                  {inRam && <span className="h-1.5 w-1.5 rounded-full bg-emerald" title="Resident in RAM" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Split Memory Canvas: Virtual Pages ➔ MMU Page Table ➔ Physical RAM Frames ➔ Swap Disk */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 items-stretch">
          {/* MMU Page Table */}
          <div className="flex flex-col rounded-2xl border border-[#222838] bg-[#101420] p-4">
            <div className="flex items-center justify-between border-b border-[#222838] pb-2 mb-2">
              <span className="font-plate text-xs font-bold text-white">MMU Page Table</span>
              <span className="text-2xs font-mono text-cyan">VPN ➔ PFN</span>
            </div>
            <div className="flex-1 space-y-1 font-mono text-2xs overflow-y-auto max-h-[220px]">
              <div className="grid grid-cols-4 font-bold text-faint pb-1 border-b border-line">
                <span>VPN</span>
                <span>Frame</span>
                <span>Valid</span>
                <span>Bit</span>
              </div>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((pNum) => {
                const mappedFrame = frames.find((f) => f.pageNum === pNum)
                const isValid = Boolean(mappedFrame)
                return (
                  <div
                    key={pNum}
                    className={`grid grid-cols-4 py-1 px-1 rounded transition-colors ${
                      isValid ? 'bg-emerald/10 text-emerald font-semibold' : 'text-slate-500'
                    }`}
                  >
                    <span>Page {pNum}</span>
                    <span>{mappedFrame ? `Frame ${mappedFrame.frameId}` : '—'}</span>
                    <span>{isValid ? '1 (RAM)' : '0 (Swap)'}</span>
                    <span>{isValid ? 'R/W' : '—'}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Physical RAM Frames (The 3 slots) */}
          <div className="flex flex-col rounded-2xl border border-[#222838] bg-[#101420] p-4">
            <div className="flex items-center justify-between border-b border-[#222838] pb-2 mb-2">
              <span className="font-plate text-xs font-bold text-white">Physical RAM (Hardware)</span>
              <span className="text-2xs font-mono text-emerald">10ns Bus</span>
            </div>
            <div className="flex-1 flex flex-col justify-around gap-2">
              {frames.map((frame) => {
                const isOccupied = frame.pageNum !== null
                return (
                  <div
                    key={frame.frameId}
                    className={`rounded-xl border p-3 font-mono text-xs transition-all ${
                      isOccupied
                        ? 'border-emerald/50 bg-emerald/[0.08] text-white shadow-sm'
                        : 'border-dashed border-[#222838] bg-[#0A0D14] text-faint'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-cyan">Physical Frame {frame.frameId}</span>
                      <span className="text-2xs text-muted">
                        {isOccupied ? `Loaded T=${frame.loadedAt}` : 'Empty'}
                      </span>
                    </div>
                    {isOccupied ? (
                      <div className="flex items-center justify-between text-xs text-emerald font-bold">
                        <span>Resident: Virtual Page {frame.pageNum}</span>
                        <span className="text-2xs text-amber font-normal">Last Used: T={frame.lastAccessTime}</span>
                      </div>
                    ) : (
                      <div className="text-2xs text-slate-500 italic">No page resident</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Swap Partition on NVMe/HDD */}
          <div className="flex flex-col rounded-2xl border border-[#222838] bg-[#101420] p-4">
            <div className="flex items-center justify-between border-b border-[#222838] pb-2 mb-2">
              <span className="font-plate text-xs font-bold text-white">Disk Swap Partition</span>
              <span className="text-2xs font-mono text-crimson">10ms Penalty</span>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center gap-3 p-4 bg-[#0A0D14] rounded-xl border border-[#1A1F2C] text-center">
              <HardDrive size={24} className="text-muted" />
              <div className="space-y-1">
                <span className="font-plate text-xs font-bold text-chalk block">Secondary Storage</span>
                <p className="text-2xs font-mono text-muted">
                  When a Page Fault occurs, the CPU halts application execution, OS initiates Disk I/O, swapping victim pages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
