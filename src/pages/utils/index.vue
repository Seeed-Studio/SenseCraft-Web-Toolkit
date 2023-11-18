<script setup lang="ts">
  import { DeviceType, deviceTypeObj } from '@/sscma/constants';
  import { useAppStore } from '@/store';
  import XiaoESP32S3Tools from './xiao_esp32s3/index.vue';
  import VisionAiWeIITools from './vision_ai_we_II/index.vue';

  const appStore = useAppStore();
</script>

<template>
  <XiaoESP32S3Tools
    v-if="appStore.deviceType === deviceTypeObj[DeviceType.XiaoEsp32s3].name"
    key="XIAO ESP32S3"
  />
  <VisionAiWeIITools
    v-else-if="
      appStore.deviceType === deviceTypeObj[DeviceType.VisionAIWeII].name
    "
    key="Vision AI (WE-II)"
  />
</template>
