import { defineStore } from 'pinia';
import type { RouteRecordNormalized } from 'vue-router';
import defaultSettings from '@/config/settings.json';
import { DEVICE_LIST } from '@/sscma/constants';
import { AppState } from './types';

const useAppStore = defineStore('app', {
  state: (): AppState => ({
    ...defaultSettings,
    deviceType: DEVICE_LIST[0].name,
  }),

  getters: {
    appCurrentSetting(state: AppState): AppState {
      return { ...state };
    },
    appDevice(state: AppState) {
      return state.device;
    },
    appAsyncMenus(state: AppState): RouteRecordNormalized[] {
      return state.serverMenu as unknown as RouteRecordNormalized[];
    },
  },

  actions: {
    // Update app settings
    updateSettings(partial: Partial<AppState>) {
      // @ts-ignore-next-line
      this.$patch(partial);
    },

    // Change theme color
    toggleTheme(dark: boolean) {
      if (dark) {
        this.theme = 'dark';
        document.body.setAttribute('arco-theme', 'dark');
      } else {
        this.theme = 'light';
        document.body.removeAttribute('arco-theme');
      }
    },
    toggleDevice(device: string) {
      this.device = device;
    },
    toggleMenu(value: boolean) {
      this.hideMenu = value;
    },
    toggleLog(value: boolean) {
      this.log = value;
    },
    async fetchServerMenuConfig() {},
    clearServerMenu() {
      this.serverMenu = [];
    },
    switchDevice(newDeviceType: string) {
      this.deviceType = newDeviceType;
    },
  },
});

export default useAppStore;
