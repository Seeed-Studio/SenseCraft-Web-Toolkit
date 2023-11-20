<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue';
  import { DeviceStatus } from '@/sscma';
  import { useDeviceStore } from '@/store';
  import useDeviceManager from '@/hooks/deviceManager';
  import Flasher from '@/sscma/xiao_esp32s3/Flasher';
  import Device from '../components/Device.vue';

  const { device } = useDeviceManager();

  const deviceStore = useDeviceStore();

  const flasher = new Flasher();

  const handelRefresh = async () => {
    if (deviceStore.deviceStatus === DeviceStatus.SerialConnected) {
      try {
        const name = await device.value?.getName();
        const version = await device.value?.getVersion();
        if (name) {
          deviceStore.setDeviceName(name);
        }
        if (version) {
          deviceStore.setDeviceVersion(version);
        }
        const base64Str = await device.value?.getInfo();
        if (base64Str) {
          const str = atob(base64Str);
          const model = JSON.parse(str);
          deviceStore.setCurrentModel(model);
        } else {
          deviceStore.setCurrentModel(undefined);
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  const fetchAvailableModels = async () => {
    const data = await fetch(
      `https://files.seeedstudio.com/sscma/sscma-model.json?timestamp=${new Date().getTime()}`
    ).then((response) => response.json());
    deviceStore.setModels(data.models);
    const firmwares = data.firmwares;
    if (firmwares?.length > 0) {
      deviceStore.setFirmware(firmwares[0]);
    }
  };

  const readFile = (blob: Blob | File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev: ProgressEvent<FileReader>) => {
        const data = ev?.target?.result as string;
        resolve(data);
      };
      reader.readAsBinaryString(blob);
    });
  };

  onMounted(fetchAvailableModels);

  watch(() => deviceStore.deviceStatus, handelRefresh);
</script>

<template>
  <Device :flasher="flasher" :read-file="readFile" />
</template>
