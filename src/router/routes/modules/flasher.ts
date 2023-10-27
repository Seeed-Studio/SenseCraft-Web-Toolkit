import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const FLASHER: AppRouteRecordRaw = {
  path: '/flasher',
  name: 'flasher',
  component: DEFAULT_LAYOUT,
  redirect: '/flasher/flasher',
  meta: {
    locale: 'menu.tool',
    requiresAuth: true,
    icon: 'icon-tool',
    order: 1,
    hideChildrenInMenu: true,
  },
  children: [
    {
      path: 'flasher',
      name: 'flasher',
      component: () => import('@/views/flasher/index.vue'),
      meta: {
        locale: 'menu.tool',
        requiresAuth: true,
        roles: ['*'],
        activeMenu: 'flasher',
      },
    },
  ],
};

export default FLASHER;
