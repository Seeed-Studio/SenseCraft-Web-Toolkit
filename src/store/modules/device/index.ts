import { defineStore } from 'pinia';
import { DeviceStatus, Model, Firmware } from '@/senseCraft/types';

const useDeviceStore = defineStore('device', {
  state: () => ({
    deviceStatus: DeviceStatus.UnConnected,
    tiou: 0,
    tscore: 0,
    isInvoke: false,
    hasLoadModel: false,
    models: [] as Model[],
    firmware: null as Firmware | null | undefined,
    currentModel: null as Model | null | undefined,
  }),

  getters: {},

  actions: {
    setDeviceStatus(deviceStatus: DeviceStatus) {
      this.deviceStatus = deviceStatus;
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
    setCurrentModel(currentModel?: Model) {
      this.currentModel = currentModel;
    },
  },
});

export default useDeviceStore;
