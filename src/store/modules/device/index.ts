import { defineStore } from 'pinia';
import { DEVICESTATUS, Model, Firmware } from '@/senseCraft/types';

const useDeviceStore = defineStore('device', {
  state: () => ({
    connectStatus: DEVICESTATUS.UNCONNECTED,
    tiou: 0,
    tscore: 0,
    isInvoke: false,
    hasLoadModel: false,
    models: [] as Model[],
    firmware: null as Firmware | null,
    currentModel: null as Model | null,
  }),

  getters: {},

  actions: {
    setConnectStatus(connectStatus: DEVICESTATUS) {
      this.connectStatus = connectStatus;
    },
    setIOU(tiou: number) {
      this.tiou = tiou;
    },
    setScore(tscore: number) {
      this.tscore = tscore;
    },
    setIsInvoke(isInvoke: boolean) {
      this.isInvoke = isInvoke;
    },
    setHasLoadModel(hasLoadModel: boolean) {
      this.hasLoadModel = hasLoadModel;
    },
    setModels(models: Model[]) {
      this.models = models;
    },
    setFirmware(firmware: Firmware) {
      this.firmware = firmware;
    },
    setCurrentModel(currentModel: Model) {
      this.currentModel = currentModel;
    },
  },
});

export default useDeviceStore;
