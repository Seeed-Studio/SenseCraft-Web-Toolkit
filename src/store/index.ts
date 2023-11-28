import { createPinia } from 'pinia';
import piniaPersist from 'pinia-plugin-persist';
import useAppStore from './modules/app';
import useTabBarStore from './modules/tab-bar';
import useDeviceStore from './modules/device';

const pinia = createPinia();
pinia.use(piniaPersist);
export { useAppStore, useTabBarStore, useDeviceStore };
export default pinia;
