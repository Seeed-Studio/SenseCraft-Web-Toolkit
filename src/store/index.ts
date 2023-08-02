import { createPinia } from 'pinia';
import useAppStore from './modules/app';
import useTabBarStore from './modules/tab-bar';
import useDeviceStore from './modules/device';

const pinia = createPinia();

export { useAppStore, useTabBarStore , useDeviceStore };
export default pinia;
