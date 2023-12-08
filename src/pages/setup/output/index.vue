<script setup lang="ts">
  import { DeviceType, deviceTypeObj } from '@/sscma/constants';
  import { useDeviceStore } from '@/store';
  import XiaoESP32S3Output from './xiao_esp32s3/index.vue';
  import GroveAIWE2Output from './grove_ai_we2/index.vue';

  const deviceStore = useDeviceStore();
</script>

<template>
  <XiaoESP32S3Output
    v-if="
      deviceStore.deviceType.id === deviceTypeObj[DeviceType.XiaoEsp32s3].id
    "
  />
  <GroveAIWE2Output
    v-else-if="
      deviceStore.deviceType.id === deviceTypeObj[DeviceType.GroveAIWE2].id
    "
  />
</template>
