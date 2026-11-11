import { ArrowRight, Check, RotateCcw } from 'lucide-react'
import { useState } from 'react'

const frames = [
  { right: 3, sum: 17, caption: 'Too large. Move the right pointer left.' },
  { right: 2, sum: 13, caption: 'Still too large. Move right once more.' },
  { right: 1, sum: 9, caption: 'A match. Two values, one clear reason.' },
]

/** User-paced example: no autoplay competes with reading or navigation. */
export default function ConceptPreview() {
  const [step, setStep] = useState(0)
  const frame = frames[step]
  const done = step === frames.length - 1
  return <div className="concept-preview">
    <div className="concept-preview-label"><span>Inside an idea</span><span>Two pointers</span></div>
    <div className="concept-array" aria-hidden="true">{[2, 7, 11, 15].map((value, index) => <div key={value} className={`concept-cell${index === 0 || index === frame.right ? ' is-selected' : ''}${done && (index === 0 || index === frame.right) ? ' is-match' : ''}`}><small>{index}</small><strong>{value}</strong><span>{index === 0 ? 'left' : index === frame.right ? 'right' : '\u00a0'}</span></div>)}</div>
    <div className="concept-explanation" aria-live="polite"><p><code>2 + {[15, 11, 7][step]} = {frame.sum}</code><span>target <strong>9</strong>{done && <Check size={15} />}</span></p><p>{frame.caption}</p></div>
    <div className="concept-playback"><span>Example · {step + 1} / {frames.length}</span><button type="button" onClick={() => setStep(done ? 0 : step + 1)}>{done ? 'Replay' : 'Next step'}{done ? <RotateCcw size={14} /> : <ArrowRight size={14} />}</button></div>
  </div>
}
