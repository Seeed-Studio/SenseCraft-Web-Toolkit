import { RouteRecordRaw } from 'vue-router';
import { DEFAULT_LAYOUT } from '../base';

const TOOL: RouteRecordRaw = {
  path: '/tool',
  name: 'tool',
  component: DEFAULT_LAYOUT,
  redirect: '/tool/tool',
  meta: {
    locale: 'menu.tool',
    requiresAuth: true,
    icon: 'icon-tool',
    order: 1,
    hideChildrenInMenu: true,
  },
  children: [
    {
      path: 'tool',
      name: 'tool',
      component: () => import('@/pages/utils/index.vue'),
      meta: {
        locale: 'menu.tool',
        requiresAuth: true,
        roles: ['*'],
        activeMenu: 'tool',
      },
    },
  ],
};

export default TOOL;
