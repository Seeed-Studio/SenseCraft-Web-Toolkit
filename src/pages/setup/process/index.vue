<script setup lang="ts">
  import { DeviceType, deviceTypeObj } from '@/sscma/constants';
  import { useAppStore } from '@/store';
  import XiaoESP32S3Process from './xiao_esp32s3/index.vue';
  import VisionAIWeIIProcess from './vision_ai_we_II/index.vue';

  const appStore = useAppStore();
</script>

<template>
  <XiaoESP32S3Process
    v-if="appStore.deviceType === deviceTypeObj[DeviceType.XiaoEsp32s3].name"
  />

  <VisionAIWeIIProcess
    v-else-if="
      appStore.deviceType === deviceTypeObj[DeviceType.VisionAIWeII].name
    "
  />
</template>
