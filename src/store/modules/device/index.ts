import { defineStore } from 'pinia';
import { DEVICESTATUS } from '@/edgelab/enums';

const useDeviceStore = defineStore('device', {
  state: () => ({
    connectStatus: DEVICESTATUS.UNCONNECTED
  }),

  getters: {

  },

  actions: {
    setConnectStatus(connectStatus: DEVICESTATUS) {
      this.connectStatus = connectStatus
    },
  },
});

export default useDeviceStore;
