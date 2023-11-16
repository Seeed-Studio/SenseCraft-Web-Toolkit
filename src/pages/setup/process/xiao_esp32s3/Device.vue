<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue';
  import { DeviceStatus } from '@/sscma';
  import { useDeviceStore } from '@/store';
  import useDeviceManager from '@/hooks/deviceManager';
  import Flasher from '@/sscma/xiao_esp32s3/Flasher';
  import type EspSerialDevice from '@/sscma/xiao_esp32s3/EspSerialDevice';
  import Device from '../components/Device.vue';

  const deviceManager = useDeviceManager();

  const device = deviceManager.value?.getDevice<EspSerialDevice>();
  const deviceStore = useDeviceStore();
  const deviceName = ref<string | null>(null);
  const deviceVersion = ref<string | null>(null);

  const flasher = new Flasher();

  const handelRefresh = async () => {
    if (deviceStore.deviceStatus === DeviceStatus.SerialConnected) {
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
        console.log(error);
      }
    }
  };

  const fetchAvailableModels = async () => {
    const data = await fetch(
      `https://files.seeedstudio.com/sscma/sscma-model.json?timestamp=${new Date().getTime()}`
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
      if (deviceStore.hasLoadModel) {
        return;
      }
      fetchAvailableModels();
      handelRefresh();
    }
  );
</script>

<template>
  <Device
    :device-name="deviceName"
    :device-version="deviceVersion"
    :flasher="flasher"
  />
</template>
