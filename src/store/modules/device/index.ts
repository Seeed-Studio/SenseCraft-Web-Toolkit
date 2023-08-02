import { defineStore } from 'pinia';
import { Device } from '@/edgelab';

const useDeviceStore = defineStore('device', {
  state: () => {
    return {
      device: new Device(),
    };
  },

  getters: {
    getDevice(state) {
      return state.device;
    },
  },

  actions: {
    // Update app settings
    updateSettings(partial: any) {
      // @ts-ignore-next-line
      this.$patch(partial);
    },
  },
});

export default useDeviceStore;
