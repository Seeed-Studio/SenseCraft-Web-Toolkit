<script setup lang="ts">
  import { DeviceType, deviceTypeObj } from '@/sscma/constants';
  import { useDeviceStore } from '@/store';
  import XiaoESP32S3Process from './xiao_esp32s3/index.vue';
  import VisionAIWeIIProcess from './vision_ai_we_II/index.vue';

  const deviceStore = useDeviceStore();
</script>

<template>
  <XiaoESP32S3Process
    v-if="
      deviceStore.deviceType.id === deviceTypeObj[DeviceType.XiaoEsp32s3].id
    "
  />

  <VisionAIWeIIProcess
    v-else-if="
      deviceStore.deviceType.id === deviceTypeObj[DeviceType.VisionAIWeII].id
    "
  />
</template>
