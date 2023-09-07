import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const SETUP: AppRouteRecordRaw = {
  path: '/setup',
  name: 'setup',
  component: DEFAULT_LAYOUT,
  redirect: '/setup/process',
  meta: {
    locale: 'menu.setup',
    requiresAuth: true,
    icon: 'icon-settings',
    order: 0,
  },
  children: [
    {
      path: 'process',
      name: 'process',
      component: () => import('@/views/setup/process/index.vue'),
      meta: {
        locale: 'menu.setup.process',
        requiresAuth: true,
        roles: ['*'],
      },
    },
    {
      path: 'output',
      name: 'output',
      component: () => import('@/views/setup/output/index.vue'),
      meta: {
        locale: 'menu.setup.output',
        requiresAuth: true,
        roles: ['*'],
      },
    },
  ],
};

export default SETUP;
