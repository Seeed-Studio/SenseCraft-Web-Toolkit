<script setup lang="ts">
  import { DeviceType, deviceTypeObj } from '@/sscma/constants';
  import { useDeviceStore } from '@/store';
  import XiaoESP32S3OConfig from './xiao_esp32s3/index.vue';
  import VisionAIWeIIConfig from './vision_ai_we_II/index.vue';

  const deviceStore = useDeviceStore();
</script>

<template>
  <XiaoESP32S3OConfig
    v-if="
      deviceStore.deviceType.id === deviceTypeObj[DeviceType.XiaoEsp32s3].id
    "
  />
  <VisionAIWeIIConfig
    v-else-if="
      deviceStore.deviceType.id === deviceTypeObj[DeviceType.VisionAIWeII].id
    "
  />
</template>
