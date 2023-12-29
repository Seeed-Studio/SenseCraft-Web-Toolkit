import { defineStore } from 'pinia';
import type { RouteRecordNormalized } from 'vue-router';
import defaultSettings from '@/config/settings.json';
import { AppState } from './types';

const useAppStore = defineStore('app', {
  state: (): AppState => ({
    ...defaultSettings,
    globalLoading: false,
    loadingText: 'loading...',
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
    showLoading(text?: string) {
      this.loadingTime = Date.now();
      const timer = setTimeout(() => {
        if (this.loadingTime) {
          this.globalLoading = true;
          if (text) {
            this.loadingText = text;
          }
        }
        clearTimeout(timer);
      }, 500);
    },
    hideLoading() {
      if (this.loadingTime && Date.now() - this.loadingTime < 500) {
        this.loadingTime = undefined;
      }
      this.globalLoading = false;
      this.loadingText = 'loading...';
    },
  },
});

export default useAppStore;
