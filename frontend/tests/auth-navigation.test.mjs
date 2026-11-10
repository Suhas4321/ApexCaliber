import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../src/lib/authNavigation.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { safeReturnPath, signInPath } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('keeps a deep link and its practice context after sign-in', () => {
  const lesson = '/lesson/os-thread?practice=mutex-protected-counter#example'
  assert.equal(safeReturnPath(lesson), lesson)
  assert.equal(signInPath(lesson), `/sign-in?next=${encodeURIComponent(lesson)}`)
})

test('rejects external and active-scheme return targets', () => {
  for (const target of [null, '', 'https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)']) {
    assert.equal(safeReturnPath(target), '/app')
  }
})

test('does not send a completed sign-in back into the auth flow', () => {
  for (const target of ['/sign-in', '/sign-in?next=%2F', '/auth/callback?code=secret']) {
    assert.equal(safeReturnPath(target), '/app')
  }
})
