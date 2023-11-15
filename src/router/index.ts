import { createRouter, createWebHashHistory } from 'vue-router';
import NProgress from 'nprogress'; // progress bar
import 'nprogress/nprogress.css';

import { useAppStore } from '@/store';
import { appRoutes } from './routes';
import { REDIRECT_MAIN, NOT_FOUND_ROUTE } from './routes/base';
import createRouteGuard from './guard';

NProgress.configure({ showSpinner: false }); // NProgress Configuration
const router = createRouter({
  history: createWebHashHistory(import.meta.env.VITE_BASE_PATH as string),
  routes: [
    {
      path: '/',
      redirect: () => {
        const appState = useAppStore();
        return `/${appState.deviceType}/setup/process`;
      },
    },
    ...appRoutes,
    REDIRECT_MAIN,
    NOT_FOUND_ROUTE,
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

createRouteGuard(router);

export default router;
