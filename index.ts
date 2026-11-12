import type { MobileAppModule } from '@jetlinks-mobile-core'
import { jetlinksMobile } from './package.json'
const { id, name, templateCodes } = jetlinksMobile
const entryPath = `/applications/${id}`
export default {
  id, name, templateCodes, entryPath,
  getRoutes: () => [{
    path: entryPath, name: `${id}:entry`, component: () => import('./mobile/shell/ModuleRoot.vue'),
    children: ['owner', 'staff'].map(side => ({ path: side, name: `${id}:${side}`, component: () => import('./mobile/shell/SideRoute.vue') })),
  }],
} satisfies MobileAppModule
