import { defineStore } from 'pinia';
import Device from '@/api/device';

const useDeviceStore = defineStore('device', {
  state: () =>{
    return {
      device : new Device()
    };
  },

  getters: {
    deviceCurrentSetting(state) {
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
