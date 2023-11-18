import { RouteRecordRaw } from 'vue-router';
import { DEFAULT_LAYOUT } from '../base';

const ESPTOOL: RouteRecordRaw = {
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
      component: () => import('@/pages/utils/index.vue'),
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
