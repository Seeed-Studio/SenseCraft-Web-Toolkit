import { defineStore } from 'pinia';
import { DeviceStatus, Model, Firmware } from '@/sscma/types';

const useDeviceStore = defineStore('device', {
  state: () => ({
    deviceStatus: DeviceStatus.UnConnected,
    ready: false,
    deviceType: '',
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
    setReady(ready: boolean) {
      this.ready = ready;
    },
    setDeviceStatus(deviceStatus: DeviceStatus) {
      console.log('setDeviceStatus:', deviceStatus);
      this.deviceStatus = deviceStatus;
    },
    setDeviceType(deviceType: string) {
      this.deviceType = deviceType;
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
      this.models = models.filter((model) =>
        model.devices?.includes(this.deviceType)
      );
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
