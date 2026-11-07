import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const source = readFileSync(new URL('../src/features/journey/journeyState.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { restoreJourney, initialStage } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

const stages = [
  { id: 'first', prediction: { choices: [{ id: 'a' }, { id: 'b' }] } },
  { id: 'second' },
]

test('fresh or corrupted storage starts at the first lesson', () => {
  for (const raw of [null, 'broken', 'null', '[]']) {
    assert.deepEqual(restoreJourney(raw, stages), { stageIndex: 0, stages: {} })
  }
})
test('stored indices are bounded and must be integers', () => {
  for (const [input, expected] of [[99, 1], [-4, 0], [0.5, 0], ['1', 0]]) {
    assert.equal(restoreJourney(JSON.stringify({ stageIndex: input }), stages).stageIndex, expected)
  }
})
test('cannot restore explanation or completion without a valid prediction', () => {
  const saved = { stages: { first: { prediction: 'removed-choice', phase: 'explain', reached: 2, complete: true } } }
  const restored = restoreJourney(JSON.stringify(saved), stages).stages.first
  assert.equal(restored.phase, 'predict')
  assert.equal(restored.reached, 0)
  assert.equal(restored.complete, false)
})
test('valid learning progress survives reload', () => {
  const saved = { stageIndex: 0, stages: { first: { prediction: 'b', phase: 'explain', reached: 2, complete: true } } }
  assert.deepEqual(restoreJourney(JSON.stringify(saved), stages), saved)
})
test('cannot jump beyond reached phase via stale saved phase', () => {
  const saved = { stages: { first: { prediction: 'a', phase: 'explain', reached: 1 } } }
  assert.equal(restoreJourney(JSON.stringify(saved), stages).stages.first.phase, 'observe')
})
test('lessons without a prediction start in exploration, including old saved state', () => {
  assert.equal(initialStage(stages[1]).phase, 'observe')
  const saved = { stages: { second: { phase: 'predict', reached: 0 } } }
  assert.equal(restoreJourney(JSON.stringify(saved), stages).stages.second.phase, 'observe')
})
