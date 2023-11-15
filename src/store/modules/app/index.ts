import { defineStore } from 'pinia';
import type { RouteRecordNormalized } from 'vue-router';
import defaultSettings from '@/config/settings.json';
import { AppState } from './types';

export const DeviceType = {
  'XIAO ESP32S3': 'XIAO ESP32S3',
  'XIAO ESP32S4': 'XIAO ESP32S4',
};

const useAppStore = defineStore('app', {
  state: (): AppState => ({
    ...defaultSettings,
    deviceType: DeviceType['XIAO ESP32S3'],
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
