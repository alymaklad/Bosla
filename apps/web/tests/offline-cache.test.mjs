import assert from 'node:assert/strict'
import test from 'node:test'

function storage() {
  const values = new Map()
  return {
    get length() { return values.size },
    getItem(key) { return values.get(key) ?? null },
    setItem(key, value) { values.set(key, String(value)) },
    removeItem(key) { values.delete(key) },
    key(index) { return [...values.keys()][index] ?? null },
  }
}

globalThis.window = { localStorage: storage(), sessionStorage: storage() }
const { readCached, saveCached, clearCached } = await import('../src/lib/offlineCache.ts')

test('read snapshots stay scoped to the signed-in account', () => {
  window.localStorage.setItem('bosla.cached-user.v1', JSON.stringify({ id: 'account-a' }))
  saveCached('/habits/progress', { total_xp: 25 })
  assert.deepEqual(readCached('/habits/progress')?.value, { total_xp: 25 })

  window.localStorage.setItem('bosla.cached-user.v1', JSON.stringify({ id: 'account-b' }))
  assert.equal(readCached('/habits/progress'), null)

  window.localStorage.setItem('bosla.cached-user.v1', JSON.stringify({ id: 'account-a' }))
  clearCached()
  assert.equal(readCached('/habits/progress'), null)
})

test('corrupt snapshots and missing identities fail closed', () => {
  window.localStorage.removeItem('bosla.cached-user.v1')
  saveCached('/dashboard', { private: true })
  assert.equal(readCached('/dashboard'), null)
  window.localStorage.setItem('bosla.cached-user.v1', '{invalid')
  assert.equal(readCached('/dashboard'), null)
})
