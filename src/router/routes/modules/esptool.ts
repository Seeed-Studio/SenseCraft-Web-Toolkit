import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const ESPTOOL: AppRouteRecordRaw = {
  path: '/esptool',
  name: 'esptool',
  component: DEFAULT_LAYOUT,
  redirect: '/esptool/esptool',
  meta: {
    locale: 'menu.tool',
    requiresAuth: true,
    icon: 'icon-tool',
    order: 1,
    hideChildrenInMenu: true,
  },
  children: [
    {
      path: 'esptool',
      name: 'esptool',
      component: () => import('@/views/esptool/index.vue'),
      meta: {
        locale: 'menu.tool',
        requiresAuth: true,
        roles: ['*'],
        activeMenu: 'esptool',
      },
    },
  ],
};

export default ESPTOOL;
