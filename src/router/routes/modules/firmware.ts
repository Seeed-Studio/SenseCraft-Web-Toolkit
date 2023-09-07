import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const FIRMWARE: AppRouteRecordRaw = {
  path: '/firmware',
  name: 'firmware',
  component: DEFAULT_LAYOUT,
  redirect: '/firmware/firmware',
  meta: {
    locale: 'menu.firmware',
    requiresAuth: true,
    icon: 'icon-thunderbolt',
    order: 1,
    hideChildrenInMenu: true,
  },
  children: [
    {
      path: 'firmware',
      name: 'firmware',
      component: () => import('@/views/firmware/index.vue'),
      meta: {
        locale: 'menu.firmware',
        requiresAuth: true,
        roles: ['*'],
        activeMenu: 'firmware',
      },
    },
  ],
};

export default FIRMWARE;
