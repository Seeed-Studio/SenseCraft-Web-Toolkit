<script setup lang="ts">
  import { deviceTypeObj } from '@/sscma/constants';
  import { useAppStore } from '@/store';
  import XiaoESP32S3Tools from './xiao_esp32s3/index.vue';
  import VisionAiWeIITools from './vision_ai_we_II/index.vue';

  const appStore = useAppStore();
</script>

<template>
  <XiaoESP32S3Tools
    v-if="appStore.deviceType === deviceTypeObj['XIAO ESP32S3'].name"
    key="XIAO ESP32S3"
  />
  <VisionAiWeIITools
    v-else-if="appStore.deviceType === deviceTypeObj['Vision AI (WE-II)'].name"
    key="Vision AI (WE-II)"
  />
</template>
