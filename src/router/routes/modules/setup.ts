import { RouteRecordRaw } from 'vue-router';
import { DEFAULT_LAYOUT } from '../base';

const SETUP: RouteRecordRaw = {
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
      component: () => import('@/pages/setup/process/index.vue'),
      meta: {
        locale: 'menu.setup.process',
        requiresAuth: true,
        roles: ['*'],
      },
    },
    {
      path: 'config',
      name: 'config',
      component: () => import('@/pages/setup/config/index.vue'),
      meta: {
        locale: 'menu.setup.config',
        requiresAuth: true,
        roles: ['*'],
      },
    },
    {
      path: 'output',
      name: 'output',
      component: () => import('@/pages/setup/output/index.vue'),
      meta: {
        locale: 'menu.setup.output',
        requiresAuth: true,
        roles: ['*'],
      },
    },
  ],
};

export default SETUP;
