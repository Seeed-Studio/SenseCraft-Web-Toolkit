<script setup lang="ts">
  import { DeviceType, deviceTypeObj } from '@/sscma/constants';
  import { useDeviceStore } from '@/store';
  import XiaoESP32S3Output from './xiao_esp32s3/index.vue';

  const deviceStore = useDeviceStore();
</script>

<template>
  <XiaoESP32S3Output
    v-if="
      deviceStore.deviceType.id === deviceTypeObj[DeviceType.XiaoEsp32s3].id
    "
  />
  <XiaoESP32S3Output
    v-else-if="
      deviceStore.deviceType.id === deviceTypeObj[DeviceType.VisionAIWeII].id
    "
  />
</template>
