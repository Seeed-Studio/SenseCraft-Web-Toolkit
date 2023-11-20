<script setup lang="ts">
  import { DeviceType, deviceTypeObj } from '@/sscma/constants';
  import { useDeviceStore } from '@/store';
  import XiaoESP32S3Tools from './xiao_esp32s3/index.vue';
  import VisionAiWeIITools from './vision_ai_we_II/index.vue';

  const deviceStore = useDeviceStore();
</script>

<template>
  <XiaoESP32S3Tools
    v-if="
      deviceStore.deviceType.id === deviceTypeObj[DeviceType.XiaoEsp32s3].id
    "
    key="XIAO ESP32S3"
  />
  <VisionAiWeIITools
    v-else-if="
      deviceStore.deviceType.id === deviceTypeObj[DeviceType.VisionAIWeII].id
    "
    key="Vision AI (WE-II)"
  />
</template>
