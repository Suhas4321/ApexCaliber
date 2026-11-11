import React, { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Braces, Check, ChevronRight, FileCode2, GitBranch } from 'lucide-react'
import { isReducedMotion } from '../lib/motion'

interface StudioTraceFrame {
  id: 'init-seen' | 'compute-need' | 'lookup-hit' | 'return-pair'
  activeIndex: number
  matchedIndices: number[]
  seenEntries: Array<{ key: number; idx: number; hit: boolean }>
  activeCodeLine: number
  complementLabel: string
  statusSummary: string
  circuitPath: string
  returnCircuitPath?: string
  tone: 'emerald' | 'sky'
}

const ARRAY_VALUES = [2, 7, 11, 15]
const STEP_DURATION_MS = 1100
const FLOW_EASE: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

const STUDIO_FRAMES: StudioTraceFrame[] = [
  {
    id: 'init-seen',
    activeIndex: 0,
    matchedIndices: [],
    seenEntries: [{ key: 2, idx: 0, hit: false }],
    activeCodeLine: 8,
    complementLabel: 'need = 9 - 2 -> store {2: 0}',
    statusSummary: 'Miss in seen -> bind key 2 to index 0',
    circuitPath: 'M 45 6 C 45 50, 92 64, 92 98',
    tone: 'sky',
  },
  {
    id: 'compute-need',
    activeIndex: 1,
    matchedIndices: [],
    seenEntries: [{ key: 2, idx: 0, hit: false }],
    activeCodeLine: 5,
    complementLabel: 'need = 9 - 7 -> 2',
    statusSummary: 'Computing complement for nums[1] = 7',
    circuitPath: 'M 135 6 C 135 36, 178 44, 180 54',
    tone: 'emerald',
  },
  {
    id: 'lookup-hit',
    activeIndex: 1,
    matchedIndices: [],
    seenEntries: [{ key: 2, idx: 0, hit: true }],
    activeCodeLine: 6,
    complementLabel: 'if 2 in seen -> hit @ idx 0',
    statusSummary: 'O(1) hash hit matched seen[2] == 0',
    circuitPath: 'M 135 6 C 135 48, 92 56, 92 98',
    tone: 'emerald',
  },
  {
    id: 'return-pair',
    activeIndex: 1,
    matchedIndices: [0, 1],
    seenEntries: [{ key: 2, idx: 0, hit: true }],
    activeCodeLine: 7,
    complementLabel: '2 + 7 = 9 -> return [0, 1]',
    statusSummary: 'Resolved pair [0, 1] verified across assertions',
    circuitPath: 'M 135 6 C 135 50, 92 58, 92 98',
    returnCircuitPath: 'M 92 98 C 58 64, 45 48, 45 6',
    tone: 'emerald',
  },
]

interface CodeToken {
  text: string
  color?: string
}

const CODE_LINES: Array<{ line: number; tokens: CodeToken[] }> = [
  {
    line: 1,
    tokens: [
      { text: 'def ', color: '#38BDF8' },
      { text: 'two_sum', color: '#00F59B' },
      { text: '(nums: ', color: '#F4F6F5' },
      { text: 'list', color: '#93C5FD' },
      { text: '[', color: '#8E9893' },
      { text: 'int', color: '#93C5FD' },
      { text: '], target: ', color: '#F4F6F5' },
      { text: 'int', color: '#93C5FD' },
      { text: ') -> ', color: '#8E9893' },
      { text: 'list', color: '#93C5FD' },
      { text: '[', color: '#8E9893' },
      { text: 'int', color: '#93C5FD' },
      { text: ']:', color: '#8E9893' },
    ],
  },
  {
    line: 2,
    tokens: [{ text: '    """Single-pass complement lookup."""', color: '#828D87' }],
  },
  {
    line: 3,
    tokens: [
      { text: '    seen: ', color: '#F4F6F5' },
      { text: 'dict', color: '#93C5FD' },
      { text: '[', color: '#8E9893' },
      { text: 'int', color: '#93C5FD' },
      { text: ', ', color: '#8E9893' },
      { text: 'int', color: '#93C5FD' },
      { text: '] = {}', color: '#F4F6F5' },
    ],
  },
  {
    line: 4,
    tokens: [
      { text: '    ', color: '#F4F6F5' },
      { text: 'for', color: '#38BDF8' },
      { text: ' i, num ', color: '#F4F6F5' },
      { text: 'in', color: '#38BDF8' },
      { text: ' ', color: '#F4F6F5' },
      { text: 'enumerate', color: '#93C5FD' },
      { text: '(nums):', color: '#F4F6F5' },
    ],
  },
  {
    line: 5,
    tokens: [{ text: '        need = target - num', color: '#F4F6F5' }],
  },
  {
    line: 6,
    tokens: [
      { text: '        ', color: '#F4F6F5' },
      { text: 'if', color: '#38BDF8' },
      { text: ' need ', color: '#F4F6F5' },
      { text: 'in', color: '#38BDF8' },
      { text: ' seen:', color: '#F4F6F5' },
    ],
  },
  {
    line: 7,
    tokens: [
      { text: '            ', color: '#F4F6F5' },
      { text: 'return', color: '#38BDF8' },
      { text: ' [seen[need], i]', color: '#F4F6F5' },
    ],
  },
  {
    line: 8,
    tokens: [{ text: '        seen[num] = i', color: '#F4F6F5' }],
  },
  {
    line: 9,
    tokens: [
      { text: '    ', color: '#F4F6F5' },
      { text: 'return', color: '#38BDF8' },
      { text: ' []', color: '#F4F6F5' },
    ],
  },
  {
    line: 10,
    tokens: [{ text: ' ', color: '#F4F6F5' }],
  },
  {
    line: 11,
    tokens: [{ text: '# Live runtime instrumentation probe', color: '#828D87' }],
  },
  {
    line: 12,
    tokens: [
      { text: 'assert two_sum([', color: '#F4F6F5' },
      { text: '2', color: '#FBBF24' },
      { text: ', ', color: '#8E9893' },
      { text: '7', color: '#FBBF24' },
      { text: ', ', color: '#8E9893' },
      { text: '11', color: '#FBBF24' },
      { text: ', ', color: '#8E9893' },
      { text: '15', color: '#FBBF24' },
      { text: '], ', color: '#8E9893' },
      { text: '9', color: '#FBBF24' },
      { text: ') == [', color: '#8E9893' },
      { text: '0', color: '#FBBF24' },
      { text: ', ', color: '#8E9893' },
      { text: '1', color: '#FBBF24' },
      { text: ']', color: '#8E9893' },
    ],
  },
]

const VERIFIED_TESTS = [
  { id: 1, label: 'assert two_sum([2, 7, 11, 15], 9) == [0, 1]', duration: '0.2ms' },
  { id: 2, label: 'assert two_sum([3, 2, 4], 6) == [1, 2]', duration: '0.1ms' },
]

export const HeroTracePlayer: React.FC = () => {
  const prefersReducedMotion = useReducedMotion()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(true)
  const [activeStep, setActiveStep] = useState(() => (isReducedMotion() ? 3 : 2))

  useEffect(() => {
    const node = rootRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        setInView(entries.some((entry) => entry.isIntersecting))
      },
      { threshold: 0.05 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (prefersReducedMotion || !inView) return
    const timer = window.setTimeout(() => {
      if (!document.hidden) {
        setActiveStep((prev) => (prev + 1) % STUDIO_FRAMES.length)
      }
    }, STEP_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [activeStep, inView, prefersReducedMotion])

  const frame = prefersReducedMotion ? STUDIO_FRAMES[3] : STUDIO_FRAMES[activeStep]
  const circuitStroke = frame.tone === 'emerald' ? '#00F59B' : '#38BDF8'
  const isReturning = frame.matchedIndices.length > 0

  return (
    <div
      ref={rootRef}
      className="w-full max-w-5xl lg:aspect-[16/10] lg:min-h-[560px] mx-auto rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] shadow-2xl relative z-10 flex flex-col overflow-hidden text-left"
      aria-label="ApexCaliber Studio workspace preview tracing Two Sum in Python"
    >
      {/* Desktop Application Title Bar */}
      <div className="h-10 border-b border-[#1a1a1a] px-3 sm:px-4 flex items-center justify-between gap-2 bg-[#080808]">
        {/* macOS Window Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" aria-hidden="true">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F56]" />
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFBD2E]" />
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27C93F]" />
        </div>

        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-1 font-mono text-xs text-[#8E9893] min-w-0 truncate">
          <span className="text-[#F4F6F5] font-medium truncate">
            <span className="hidden sm:inline">ApexCaliber </span>Studio
          </span>
          <ChevronRight size={13} className="shrink-0 text-[#828D87]" aria-hidden="true" />
          <span className="hidden md:inline shrink-0">Arrays &amp; Hashing</span>
          <ChevronRight size={13} className="hidden md:inline shrink-0 text-[#828D87]" aria-hidden="true" />
          <span className="text-[#00FF88] shrink-0">Two Sum</span>
        </div>

        {/* Execution Status Tag */}
        <div className="flex items-center shrink-0 whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-[#00FF88]">
            <span
              aria-hidden="true"
              className="w-2 h-2 rounded-full bg-[#00FF88] shadow-[0_0_8px_#00FF88]"
            />
            <span>Live Trace</span>
          </span>
        </div>
      </div>

      {/* Balanced 45% / 55% Split Interior */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[45%_55%] divide-y lg:divide-y-0 lg:divide-x divide-[#1a1a1a]">
        {/* Left Panel (45%): Project File Tree & Live Memory Array + Hash Map Trace */}
        <div className="flex flex-col min-w-0 bg-[#080808]/85 divide-y divide-[#1a1a1a]">
          {/* Miniature Workspace Explorer */}
          <div className="p-3.5 sm:p-4 space-y-2">
            <div className="flex items-center justify-between font-mono text-xs text-[#828D87]">
              <span className="tracking-wider uppercase">Workspace</span>
              <span className="inline-flex items-center gap-1 text-[#8E9893]">
                <GitBranch size={11} aria-hidden="true" />
                <span>main</span>
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 rounded-lg bg-[#141A17] px-2.5 py-1.5 font-mono text-xs text-[#F4F6F5]">
                <span className="inline-flex items-center gap-2 min-w-0 truncate">
                  <FileCode2 size={14} className="shrink-0 text-[#00FF88]" aria-hidden="true" />
                  <span className="truncate">solution.py</span>
                </span>
                <span className="text-[#00FF88] shrink-0">L{frame.activeCodeLine}</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 font-mono text-xs text-[#8E9893]">
                <span className="inline-flex items-center gap-2 min-w-0 truncate">
                  <Braces size={14} className="shrink-0 text-[#828D87]" aria-hidden="true" />
                  <span className="truncate">test_cases.json</span>
                </span>
                <span className="text-[#828D87] shrink-0">12 cases</span>
              </div>
            </div>
          </div>

          {/* Live Array & Hash Map Lookup Circuit */}
          <div className="flex-1 p-4 flex flex-col justify-between gap-3 min-w-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 font-mono text-xs">
                <span className="text-[#8E9893]">nums = [2, 7, 11, 15]</span>
                <span className="text-[#00F59B]">target = 9</span>
              </div>

              {/* Array Memory Cells */}
              <div className="grid grid-cols-4 gap-2">
                {ARRAY_VALUES.map((val, idx) => {
                  const isMatched = frame.matchedIndices.includes(idx)
                  const isActive = frame.activeIndex === idx && !isMatched
                  const isVisited = idx === 0 && frame.seenEntries.length > 0 && !isMatched && !isActive

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col items-center justify-center rounded-lg border py-2 min-h-[56px] transition-[border-color,background-color] duration-200 ${
                        isMatched
                          ? 'border-[#00F59B] bg-[#00F59B]/15 text-[#F4F6F5]'
                          : isActive
                          ? 'border-[#00F59B]/75 bg-[#141A17] text-[#F4F6F5]'
                          : isVisited
                          ? 'border-[#38BDF8]/45 bg-[#0F1311] text-[#F4F6F5]'
                          : 'border-white/[0.08] bg-[#0F1311] text-[#8E9893]'
                      }`}
                    >
                      <span className="font-mono text-xs text-[#828D87]">[{idx}]</span>
                      <span className="font-mono text-base font-semibold tabular-nums mt-0.5">
                        {val}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Hash Map Lookup Circuit Tracer */}
            <div className="relative h-24 w-full">
              <svg viewBox="0 0 360 104" preserveAspectRatio="none" className="h-full w-full overflow-visible" fill="none" aria-hidden="true">
                <line x1="45" y1="0" x2="45" y2="104" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 4" />
                <line x1="135" y1="0" x2="135" y2="104" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 4" />
                <motion.path
                  key={`circuit-glow-${frame.id}`}
                  d={frame.circuitPath}
                  stroke={circuitStroke}
                  strokeOpacity={0.22}
                  strokeWidth={7}
                  strokeLinecap="round"
                  initial={prefersReducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.45, ease: FLOW_EASE }}
                />
                <motion.path
                  key={`circuit-line-${frame.id}`}
                  d={frame.circuitPath}
                  stroke={circuitStroke}
                  strokeWidth={2}
                  strokeLinecap="round"
                  initial={prefersReducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.45, ease: FLOW_EASE }}
                />
                <circle
                  cx={frame.activeIndex === 0 ? 45 : 135}
                  cy="6"
                  r="3.5"
                  fill={circuitStroke}
                />
                <circle cx="92" cy="98" r="3.5" fill={circuitStroke} />

                {frame.returnCircuitPath && (
                  <>
                    <motion.path
                      d={frame.returnCircuitPath}
                      stroke="#00F59B"
                      strokeOpacity={0.22}
                      strokeWidth={6}
                      strokeLinecap="round"
                      initial={prefersReducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.42, delay: 0.08, ease: FLOW_EASE }}
                    />
                    <motion.path
                      d={frame.returnCircuitPath}
                      stroke="#00F59B"
                      strokeWidth={2}
                      strokeLinecap="round"
                      initial={prefersReducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.42, delay: 0.08, ease: FLOW_EASE }}
                    />
                    <circle cx="45" cy="6" r="3.5" fill="#00F59B" />
                  </>
                )}
              </svg>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
                <span
                  className={`rounded-full border px-3 py-1 font-mono text-xs font-medium bg-[#0A0D0B]/95 ${
                    frame.tone === 'emerald'
                      ? 'border-[#00F59B]/45 text-[#00F59B]'
                      : 'border-[#38BDF8]/45 text-[#38BDF8]'
                  }`}
                >
                  {frame.complementLabel}
                </span>
              </div>
            </div>

            {/* Hash Map `seen` Table State */}
            <div className="space-y-1.5">
              <div className="rounded-lg border border-white/[0.08] bg-[#0F1311] px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#8E9893]">seen</span>
                  {frame.seenEntries.map((entry) => (
                    <span
                      key={entry.key}
                      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-xs font-medium ${
                        isReturning || entry.hit
                          ? 'border-[#00F59B]/50 bg-[#00F59B]/15 text-[#F4F6F5]'
                          : 'border-white/[0.12] bg-[#141A17] text-[#E4ECE8]'
                      }`}
                    >
                      <span>{entry.key}</span>
                      <span className="text-[#828D87]">:</span>
                      <span className={isReturning || entry.hit ? 'text-[#00F59B]' : 'text-[#38BDF8]'}>
                        {entry.idx}
                      </span>
                    </span>
                  ))}
                </div>
                <span className="font-mono text-xs font-medium text-[#00F59B]">
                  {isReturning ? '[0, 1]' : frame.seenEntries[0]?.hit ? 'Hit @ 0' : 'O(1)'}
                </span>
              </div>
              <p className="font-mono text-xs text-[#828D87] truncate">{frame.statusSummary}</p>
            </div>
          </div>
        </div>

        {/* Right Panel (55%): Monaco-Style Code Editor & Integrated Test Assert Outputs */}
        <div className="flex flex-col min-w-0 justify-between bg-[#0a0a0a]">
          {/* Editor Header Tab */}
          <div className="h-10 border-b border-[#1a1a1a] px-4 flex items-center justify-between bg-[#080808]">
            <div className="inline-flex items-center gap-2 font-mono text-xs font-medium text-[#F4F6F5] h-full border-b-2 border-[#00FF88]">
              <FileCode2 size={14} className="text-[#00FF88]" aria-hidden="true" />
              <span>solution.py</span>
            </div>
            <span className="font-mono text-xs text-[#828D87]">Python 3.12 · O(n) Time</span>
          </div>

          {/* Code Editor Lines (1–12) */}
          <div className="flex-1 px-3 sm:px-4 py-3 font-mono text-[13px] leading-6 overflow-x-auto">
            {CODE_LINES.map((row) => {
              const isActiveLine = row.line === frame.activeCodeLine
              return (
                <div
                  key={row.line}
                  className="relative flex items-center gap-3 px-2 rounded"
                >
                  {isActiveLine && (
                    <motion.div
                      layoutId="studio-active-code-line"
                      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.24, ease: FLOW_EASE }}
                      className="absolute inset-0 rounded border border-[#00F59B]/35 bg-[#00F59B]/10"
                    />
                  )}
                  <span
                    className={`relative z-10 w-5 select-none text-right text-xs tabular-nums ${
                      isActiveLine ? 'text-[#00F59B] font-semibold' : 'text-[#828D87]'
                    }`}
                  >
                    {row.line}
                  </span>
                  <code className="relative z-10 whitespace-pre">
                    {row.tokens.map((tok, i) => (
                      <span key={i} style={{ color: tok.color ?? '#F4F6F5' }}>
                        {tok.text}
                      </span>
                    ))}
                  </code>
                </div>
              )
            })}
          </div>

          {/* Integrated Test Assert Console */}
          <div className="border-t border-[#1a1a1a] bg-[#080808] px-4 py-3 space-y-2 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-[#1a1a1a]">
              <span className="text-[#828D87] uppercase tracking-wider">Test Outputs</span>
              <span className="text-[#00FF88] font-semibold">
                12/12 passing · 100% test coverage
              </span>
            </div>

            <div className="space-y-1.5">
              {VERIFIED_TESTS.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between gap-3 text-[#E4ECE8]"
                >
                  <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
                    <Check size={13} className="shrink-0 text-[#00F59B]" aria-hidden="true" />
                    <span className="truncate">{test.label}</span>
                  </span>
                  <span className="text-[#8E9893] shrink-0 tabular-nums">({test.duration})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroTracePlayer
