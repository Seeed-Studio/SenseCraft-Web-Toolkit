import { defineStore } from 'pinia';
import { DeviceStatus, Model, Firmware } from '@/sscma/types';
import { DEVICE_LIST } from '@/sscma/constants';

const useDeviceStore = defineStore('device', {
  state: () => ({
    deviceStatus: DeviceStatus.UnConnected,
    wifi: false,
    mqtt: false,
    tiou: 0,
    tscore: 0,
    isInvoke: false,
    models: [] as Model[],
    firmware: null as Firmware | null | undefined,
    currentModel: null as Model | null | undefined,
    deviceType: { ...DEVICE_LIST[0] },
    deviceName: null as string | null,
    deviceVersion: null as string | null,
    currentAvailableModel: false,
  }),
  persist: {
    enabled: true,
    strategies: [
      {
        storage: localStorage,
        paths: ['deviceType'],
      },
    ],
  },

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
    setModels(models: Model[]) {
      this.models = models.filter((model) =>
        model.devices?.includes(this.deviceType.id)
      );
    },
    setFirmware(firmware: Firmware) {
      this.firmware = firmware;
    },
    setCurrentModel(currentModel?: Model) {
      this.currentModel = currentModel;
    },
    setDeviceType(name: string) {
      const index = DEVICE_LIST.findIndex((e) => e.name === name);
      if (index !== -1) {
        this.deviceType = { ...DEVICE_LIST[index] };
      }
    },
    setDeviceName(name: string) {
      this.deviceName = name;
    },
    setDeviceVersion(version: string) {
      this.deviceVersion = version;
    },
    setCurrentAvailableModel(model: boolean) {
      this.currentAvailableModel = model;
    },
  },
});

export default useDeviceStore;
