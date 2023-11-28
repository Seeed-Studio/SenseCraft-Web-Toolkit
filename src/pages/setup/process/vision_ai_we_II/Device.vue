<script setup lang="ts">
  import { watch, onMounted } from 'vue';
  import { decode } from 'js-base64';
  import { DeviceStatus } from '@/sscma';
  import { useDeviceStore } from '@/store';
  import useDeviceManager from '@/hooks/deviceManager';
  import Flasher from '@/sscma/vision_ai_we_II/Flasher';
  import Device from '../components/Device.vue';

  const { device, term } = useDeviceManager();
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
        const tempModel = await device.value?.getModel();
        if (base64Str) {
          const str = decode(base64Str);
          const model = JSON.parse(str);
          deviceStore.setCurrentModel(model);
          deviceStore.setCurrentAvailableModel(tempModel?.id !== undefined);
        } else {
          deviceStore.setCurrentModel(undefined);
        }
      } catch (error: any) {
        console.error(error);
        term.writeln(`Error: ${error?.message}`);
      }
    }
  };

  const readFile = (blob: Blob | File): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
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
    const firmwares = data.firmwares;
    if (firmwares?.length > 0) {
      deviceStore.setFirmware(firmwares[1]);
    }
  };

  onMounted(fetchAvailableModels);
  onMounted(handelRefresh);

  watch(() => deviceStore.deviceStatus, handelRefresh);
</script>

<template>
  <Device :flasher="flasher" :read-file="readFile" />
</template>
