import { ArrowRight, Check, RotateCcw } from 'lucide-react'
import { useState } from 'react'

const frames = [
  { right: 3, sum: 17, caption: 'Sum exceeds target 9. Advance right pointer left.' },
  { right: 2, sum: 13, caption: 'Sum 13 is still high. Decrement right pointer.' },
  { right: 1, sum: 9, caption: 'Exact match: indices [0, 1] resolve in one pass.' },
]

/** User-paced night console example embedded in the Studio cockpit. */
export default function ConceptPreview() {
  const [step, setStep] = useState(0)
  const frame = frames[step]
  const done = step === frames.length - 1

  return (
    <div
      className="concept-preview flex flex-col justify-between gap-4 rounded-lg border border-white/[0.08] bg-[#0B0E0C] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-4 sm:p-5 text-[#F4F6F5]"
      data-zone="night"
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5 font-mono text-2xs">
        <span className="font-semibold uppercase tracking-wider text-[#00F59B]">
          TRACE SANDBOX
        </span>
        <span className="text-[#8E9893]">Two Pointers · target 9</span>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-1" aria-hidden="true">
        {[2, 7, 11, 15].map((value, index) => {
          const isSelected = index === 0 || index === frame.right
          const isMatch = done && isSelected
          return (
            <div key={value} className="flex flex-col items-center gap-1">
              <span className="font-mono text-2xs text-[#828D87]">[{index}]</span>
              <div
                className={`flex h-12 w-full items-center justify-center rounded border font-mono text-lg font-semibold tabular-nums transition-[transform,border-color,background-color,color] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                  isMatch
                    ? 'border-[#00F59B] bg-[#00F59B]/15 text-[#00F59B] -translate-y-0.5'
                    : isSelected
                    ? 'border-[#38BDF8] bg-[#38BDF8]/15 text-[#F4F6F5] -translate-y-0.5'
                    : 'border-white/[0.08] bg-[#0F1311] text-[#8E9893]'
                }`}
              >
                {value}
              </div>
              <span
                className={`font-mono text-2xs ${
                  isMatch ? 'text-[#00F59B] font-semibold' : isSelected ? 'text-[#38BDF8]' : 'text-transparent'
                }`}
              >
                {index === 0 ? 'left' : index === frame.right ? 'right' : '—'}
              </span>
            </div>
          )
        })}
      </div>

      <div className="rounded border border-white/[0.08] bg-[#0F1311] px-3 py-2.5 space-y-1" aria-live="polite">
        <div className="flex items-center justify-between gap-2 font-mono text-xs">
          <code className={done ? 'font-semibold text-[#00F59B]' : 'font-semibold text-[#38BDF8]'}>
            2 + {[15, 11, 7][step]} = {frame.sum}
          </code>
          <span className="inline-flex items-center gap-1 text-[#8E9893]">
            target <strong className="text-[#F4F6F5]">9</strong>
            {done && <Check size={14} className="text-[#00F59B]" aria-hidden="true" />}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-[#8E9893]">{frame.caption}</p>
      </div>

      <div className="flex items-center justify-between gap-3 pt-0.5">
        <span className="font-mono text-2xs text-[#828D87]">
          Step {step + 1} / {frames.length}
        </span>
        <button
          type="button"
          onClick={() => setStep(done ? 0 : step + 1)}
          className="inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-lg border border-white/[0.12] bg-[#0F1311] px-3 py-1.5 font-mono text-2xs font-semibold text-[#00F59B] hover:border-[#00F59B]/50 hover:bg-[#141A17] active:scale-[0.985] transition-[transform,background-color,border-color] duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F59B]"
        >
          <span>{done ? 'Replay' : 'Next step'}</span>
          {done ? <RotateCcw size={13} aria-hidden="true" /> : <ArrowRight size={13} aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}
