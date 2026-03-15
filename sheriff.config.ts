import { noDependencies, sameTag, type SheriffConfig } from '@softarc/sheriff-core'

export const config: SheriffConfig = {
  enableBarrelLess: true,

  entryPoints: {
    store: './apps/store/src/router.tsx',
    admin: './apps/admin/src/router.tsx',
    api: './apps/api/src/index.ts',
  },

  modules: {
    'apps/store/src/pages': 'app:store',
    'apps/store/src/routes': 'app:store',
    'apps/store/src/@shared': 'app:store',
    'apps/admin/src/pages': 'app:admin',
    'apps/admin/src/routes': 'app:admin',
    'apps/admin/src/@shared': 'app:admin',
    'apps/api/src': 'svc:api',
    'packages/design-system/src': 'lib:design-system',
    'packages/api-spec/src': 'lib:api-spec',
    'packages/api-spec/generated': 'lib:api-spec',
  },

  depRules: {
    'app:*': [sameTag, 'lib:design-system', 'lib:api-spec'],
    'svc:*': [sameTag, 'lib:api-spec'],
    'lib:design-system': noDependencies,
    'lib:api-spec': noDependencies,
    root: ['app:store', 'app:admin', 'svc:api', 'lib:design-system', 'lib:api-spec', 'noTag'],
    noTag: ['noTag', 'lib:design-system', 'lib:api-spec'],
  },
}
