import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const VISUALIZATION: AppRouteRecordRaw = {
  path: '/deployment',
  name: 'deployment',
  component: DEFAULT_LAYOUT,
  meta: {
    locale: 'menu.deployment',
    requiresAuth: true,
    roles: ['*'],
    icon: 'icon-common',
    order: 4,
  },
  children: [
    {
      path: 'convert',
      name: 'Convert',
      component: () => import('@/views/comming-soon/index.vue'),
      meta: {
        locale: 'menu.deployment.convert',
        requiresAuth: true,
        roles: ['*'],
      },
    },
    {
      path: 'deploy',
      name: 'Deploy',
      component: () => import('@/views/deployment/deploy/index.vue'),
      meta: {
        locale: 'menu.deployment.deploy',
        requiresAuth: true,
        roles: ['*'],
      },
    },
  ],
};

export default VISUALIZATION;
