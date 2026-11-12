import { onScopeDispose, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/** Mirror internal pages in the host router so its existing Back protocol can consume them.
 * The embedded shell uses memory history; never traverse the containing browser document.
 */
export function useShellNavigation(base: string, internal: () => boolean, back: () => void | boolean | Promise<boolean>, canLeave: () => boolean | Promise<boolean> = () => true): void {
  const router = useRouter(), route = useRoute()
  const page = `${base}/view`
  let handling = false, disposed = false
  const removeGuard = router.beforeEach(async (to, from) => {
    if (from.path !== base && from.path !== page) return
    if (handling) return false
    if (from.path === page && to.path === base && internal()) {
      handling = true
      try {
        await back()
        // Cancel just this router traversal when another business page remains.
        // This also restores the memory-history position after a cancelled Back.
        return !disposed && !internal()
      } finally { handling = false }
    }
    if (to.path !== base && to.path !== page) return await canLeave()
  })
  const sync = () => {
    if (disposed || handling) return
    if (internal() && route.path === base) void router.push({ path: page, query: route.query })
    else if (!internal() && route.path === page) router.back()
  }
  const stop = watch(internal, sync, { flush: 'sync' })
  // Existing /owner and /staff links remain valid, with side retained at the entry path.
  if (route.path !== base) void router.replace({ path: base, query: { ...route.query, ...(route.path.endsWith('/staff') ? { side: 'staff' } : route.path.endsWith('/owner') ? { side: 'owner' } : {}) } }).then(sync)
  else sync()
  onScopeDispose(() => { disposed = true; stop(); removeGuard() })
}
