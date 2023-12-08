<script setup lang="ts">
  import { DeviceType, deviceTypeObj } from '@/sscma/constants';
  import { useDeviceStore } from '@/store';
  import XiaoESP32S3Tools from './xiao_esp32s3/index.vue';
  import GroveAIWE2Tools from './grove_ai_we2/index.vue';

  const deviceStore = useDeviceStore();
</script>

<template>
  <XiaoESP32S3Tools
    v-if="
      deviceStore.deviceType.id === deviceTypeObj[DeviceType.XiaoEsp32s3].id
    "
    key="XIAO ESP32S3"
  />
  <GroveAIWE2Tools
    v-else-if="
      deviceStore.deviceType.id === deviceTypeObj[DeviceType.GroveAIWE2].id
    "
    key="GROVE AI WE2"
  />
</template>
