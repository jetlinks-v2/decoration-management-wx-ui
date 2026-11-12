import test from 'node:test'
import assert from 'node:assert/strict'
import { createRenderer, ref, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useShellNavigation } from '../mobile/shell/navigation.ts'

const tick = async () => { await nextTick(); await new Promise(resolve => setTimeout(resolve, 20)) }
async function fixture(entry = '/applications/test-app') {
  const base = '/applications/test-app', depth = ref(0), allowed = ref(true)
  let calls = 0, delayed = false, release
  const renderer = createRenderer({ insert() {}, remove() {}, createElement: () => ({}), createText: () => ({}), createComment: () => ({}), setText() {}, setElementText() {}, parentNode() {}, nextSibling() {}, patchProp() {} })
  const empty = { render: () => null }
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: base, component: empty, children: ['view','owner','staff'].map(path => ({ path, component: empty })) }, { path: '/apps', component: empty }] })
  await router.push(entry)
  const app = renderer.createApp({ setup() {
    useShellNavigation(base, () => depth.value > 0, async () => {
      calls++
      if (delayed) await new Promise(resolve => { release = resolve })
      if (!allowed.value) return false
      depth.value--; return true
    }, () => allowed.value)
    return () => null
  } })
  app.use(router); app.mount({}); await tick()
  return { router, app, depth, allowed, base, calls: () => calls,
    delay() { delayed = true }, resume() { delayed = false; release() } }
}

test('host Back returns one business level, then root; page Back and root close work', async () => {
  const f = await fixture()
  try {
    f.depth.value = 2; await tick()
    assert.equal(f.router.currentRoute.value.path, f.base + '/view')
    f.router.back(); await tick()
    assert.equal(f.depth.value, 1)
    assert.equal(f.router.currentRoute.value.path, f.base + '/view')
    f.router.back(); await tick()
    assert.equal(f.depth.value, 0)
    assert.equal(f.router.currentRoute.value.path, f.base)
    f.depth.value = 1; await tick(); f.depth.value = 0; await tick()
    assert.equal(f.router.currentRoute.value.path, f.base)
    await f.router.replace('/apps')
    assert.equal(f.router.currentRoute.value.path, '/apps')
  } finally { f.app.unmount() }
})

test('cancelled or pending draft confirmation and saving keep the current page', async () => {
  const f = await fixture()
  try {
    f.depth.value = 2; await tick(); f.allowed.value = false
    f.router.back(); await tick()
    assert.equal(f.depth.value, 2)
    assert.equal(f.router.currentRoute.value.path, f.base + '/view')
    f.allowed.value = true; f.delay(); f.router.back(); await tick()
    assert.equal(f.depth.value, 2)
    f.router.back(); await tick()
    assert.equal(f.calls(), 2, 'a second hardware Back must not open another confirmation')
    f.resume(); await tick()
    assert.equal(f.depth.value, 1)
    f.router.back(); await tick()
    assert.equal(f.router.currentRoute.value.path, f.base)
  } finally { f.app.unmount() }
})

test('staff deep link keeps side at the entry, and unmount removes all guards', async () => {
  const f = await fixture('/applications/test-app/staff')
  assert.equal(f.router.currentRoute.value.path, f.base)
  assert.equal(f.router.currentRoute.value.query.side, 'staff')
  f.depth.value = 1; await tick(); f.allowed.value = false
  f.app.unmount()
  await f.router.replace('/apps')
  assert.equal(f.router.currentRoute.value.path, '/apps')
  f.depth.value = 2; await tick()
  assert.equal(f.router.currentRoute.value.path, '/apps')
})


test('owner deep link retains its identity preference after returning to the shell entry', async () => {
  const f = await fixture('/applications/test-app/owner?decorationId=record&step=rectification')
  try {
    assert.equal(f.router.currentRoute.value.path, f.base)
    assert.equal(f.router.currentRoute.value.query.side, 'owner')
    assert.equal(f.router.currentRoute.value.query.decorationId, 'record')
    assert.equal(f.router.currentRoute.value.query.step, 'rectification')
  } finally { f.app.unmount() }
})
