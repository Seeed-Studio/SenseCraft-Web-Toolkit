import { RouteRecordRaw } from 'vue-router';
import { useAppStore } from '@/store';
import { DEFAULT_LAYOUT } from '../base';

const ESPTOOL: RouteRecordRaw = {
  path: '/:deviceType/esptool',
  name: 'esptool',
  component: DEFAULT_LAYOUT,
  redirect: () => {
    const appState = useAppStore();
    return `/${appState.deviceType}/esptool/esptool`;
  },
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
