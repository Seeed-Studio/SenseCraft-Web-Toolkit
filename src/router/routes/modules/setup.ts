import { RouteRecordRaw } from 'vue-router';
import { useAppStore } from '@/store';
import { DEFAULT_LAYOUT } from '../base';

const SETUP: RouteRecordRaw = {
  path: '/:deviceType/setup',
  name: 'setup',
  component: DEFAULT_LAYOUT,
  redirect: () => {
    const appState = useAppStore();
    return `/${appState.deviceType}/setup/process`;
  },
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
