import { defineStore } from 'pinia';
import { DeviceStatus, Model, Firmware } from '@/sscma/types';
import { DEVICE_LIST } from '@/sscma/constants';

export const FlashWayType = {
  Prefabricated: 0,
  Custom: 1,
  ComeToSenseCraftAI: 2,
};

export const DeviceWIFIStatus = {
  NotInitOrJoined: 0,
  JoinedConfigNotApplied: 1,
  JoinedLatestConfigApplied: 2,
};

export const MqttServerStatus = {
  NotInitOrConnect: 0,
  ConnectedNotApplied: 1,
  ConnectedApplied: 2,
};

export type ComeToSenseCraftAIType = {
  model: {
    description: string;
    classes: string[];
    algorithm: string;
    name: string;
    version: string;
    category: string;
    model_type: string;
    size: string;
    modelImg: string;
    isCustom: boolean;
  };
  modelUrl: string;
};
const useDeviceStore = defineStore('device', {
  state: () => ({
    deviceStatus: DeviceStatus.UnConnected,
    isCanWifi: false,
    isCanMqtt: false,
    tiou: 0,
    tscore: 0,
    isInvoke: false,
    models: [] as Model[],
    firmware: null as Firmware | null | undefined,
    currentModel: null as Model | null | undefined,
    deviceType: { ...DEVICE_LIST[0] },
    deviceName: null as string | null,
    deviceVersion: null as string | null,
    deviceId: null as string | null,
    deviceServerState: MqttServerStatus.NotInitOrConnect,
    deviceIPv4Address: null as string | null,
    deviceIPStatus: DeviceWIFIStatus.NotInitOrJoined,
    currentAvailableModel: false,
    comeToSenseCraftAI: {} as ComeToSenseCraftAIType,
    flashWay: FlashWayType.Prefabricated,
    flashProgress: '0%',
    flashTip: '',
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
    setCurrentModel(currentModel: Model | null = null) {
      this.currentModel = currentModel;
    },
    setDeviceType(name: string) {
      const index = DEVICE_LIST.findIndex((e) => e.name === name);
      if (index !== -1) {
        this.deviceType = { ...DEVICE_LIST[index] };
      }
    },
    setDeviceTypeById(id: string) {
      const index = DEVICE_LIST.findIndex((e) => e.id === id);
      if (index !== -1) {
        this.deviceType = { ...DEVICE_LIST[index] };
      }
    },
    setDeviceName(name: string | null) {
      this.deviceName = name;
    },
    setDeviceVersion(version: string | null) {
      this.deviceVersion = version;
    },
    setDeviceId(id: string | null) {
      this.deviceId = id;
    },
    setCurrentAvailableModel(model: boolean) {
      this.currentAvailableModel = model;
    },
    setComeToSenseCraftAI(data: ComeToSenseCraftAIType) {
      this.comeToSenseCraftAI = data;
    },
    setFlashWay(flashWay: number) {
      this.flashWay = flashWay;
    },
    setDeviceServerState(status: number = MqttServerStatus.NotInitOrConnect) {
      this.deviceServerState = status;
    },
    setDeviceIPv4AddressAndStatus(
      ipv4: string | null = null,
      status: number = DeviceWIFIStatus.NotInitOrJoined
    ) {
      this.deviceIPv4Address = ipv4;
      this.deviceIPStatus = status;
    },

    setIsCanWifi(isCanWifi: boolean) {
      this.isCanWifi = isCanWifi;
    },
    setIsCanMqtt(isCanMqtt: boolean) {
      this.isCanMqtt = isCanMqtt;
    },
    setFlashProgress(progress: string) {
      this.flashProgress = progress;
    },

    setFlashTip(tip: string) {
      this.flashTip = tip;
    },

    clearDeviceInfo() {
      this.deviceName = null;
      this.deviceVersion = null;
      this.deviceId = null;
      this.deviceServerState = MqttServerStatus.NotInitOrConnect;
      this.deviceIPv4Address = null;
      this.deviceIPStatus = DeviceWIFIStatus.NotInitOrJoined;
      this.currentAvailableModel = false;
      this.currentModel = null;
      this.isCanMqtt = false;
      this.isCanWifi = false;
    },
  },
});

export default useDeviceStore;
