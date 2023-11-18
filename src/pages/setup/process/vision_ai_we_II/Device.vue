<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue';
  import { DeviceStatus } from '@/sscma';
  import { useDeviceStore } from '@/store';
  import useDeviceManager from '@/hooks/deviceManager';
  import Flasher from '@/sscma/vision_ai_we_II/Flasher';
  import Device from '../components/Device.vue';

  const deviceManager = useDeviceManager();

  const deviceStore = useDeviceStore();
  const deviceName = ref<string | null>(null);
  const deviceVersion = ref<string | null>(null);
  const device = deviceManager.value?.getDevice();
  const flasher = new Flasher();

  const handelRefresh = async () => {
    console.log('看看这里的状态', deviceStore.deviceStatus);
    if (deviceStore.deviceStatus === DeviceStatus.SerialConnected) {
      deviceStore.setReady(false);
      try {
        const name = await device?.getName();
        const version = await device?.getVersion();
        if (name) {
          deviceName.value = name;
        }
        if (version) {
          deviceVersion.value = version;
        }
        const base64Str = await device?.getInfo();
        if (base64Str) {
          const str = atob(base64Str);
          const model = JSON.parse(str);
          deviceStore.setCurrentModel(model);
        } else {
          deviceStore.setCurrentModel(undefined);
        }
      } catch (error) {
        console.error(error, '在刷新设备数据的地方出现了错误');
      } finally {
        deviceStore.setReady(true);
      }
    }
  };

  const readFile = (blob: Blob | File): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        resolve(uint8Array);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  };

  const fetchAvailableModels = async () => {
    const data = await fetch(
      `https://files.seeedstudio.com/sscma/sscma-model-test.json?timestamp=${new Date().getTime()}`
    ).then((response) => response.json());
    deviceStore.setModels(data.models);
    deviceStore.setHasLoadModel(true);
    const firmwares = data.firmwares;
    if (firmwares?.length > 0) {
      deviceStore.setFirmware(firmwares[1]);
    }
  };

  onMounted(() => {
    fetchAvailableModels();
    handelRefresh();
  });

  watch(
    () => deviceStore.deviceStatus,
    () => {
      if (!deviceStore.hasLoadModel) {
        fetchAvailableModels();
      }
      handelRefresh();
    }
  );
</script>

<template>
  <Device
    :device-name="deviceName"
    :device-version="deviceVersion"
    :flasher="flasher"
    :read-file="readFile"
  />
</template>
