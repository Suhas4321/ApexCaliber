import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../src/lib/patternFinder.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { resolvePatternPath, isResult } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('a valid bookmarked route reaches its authored result', () => {
  assert.deepEqual(resolvePatternPath('array.pair.two-pointers'), {
    path: ['array', 'pair', 'two-pointers'], nodeId: 'two-pointers', invalid: false,
  })
})

test('a stale route stops at the last valid question instead of crashing', () => {
  assert.deepEqual(resolvePatternPath('array.pair.missing'), {
    path: ['array', 'pair'], nodeId: 'pair', invalid: true,
  })
  assert.deepEqual(resolvePatternPath('missing'), { path: [], nodeId: 'start', invalid: true })
})

test('prototype properties cannot masquerade as authored results', () => {
  assert.equal(isResult('toString'), false)
  assert.equal(resolvePatternPath('array.toString').invalid, true)
})
