<script setup lang="ts">
  import { DeviceType, deviceTypeObj } from '@/sscma/constants';
  import { useDeviceStore } from '@/store';
  import XiaoESP32S3Process from './xiao_esp32s3/index.vue';
  import GroveAIWE2Process from './grove_ai_we2/index.vue';

  const deviceStore = useDeviceStore();
</script>

<template>
  <XiaoESP32S3Process
    v-if="
      deviceStore.deviceType.id === deviceTypeObj[DeviceType.XiaoEsp32s3].id
    "
  />

  <GroveAIWE2Process
    v-else-if="
      deviceStore.deviceType.id === deviceTypeObj[DeviceType.GroveAIWE2].id
    "
  />
</template>
