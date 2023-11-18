<script setup lang="ts">
  import useDeviceType from '@/hooks/deviceType';
  import { deviceTypeObj } from '@/sscma/constants';
  import XiaoESP32S3Process from './xiao_esp32s3/index.vue';
  import VisionAIWeIIProcess from './vision_ai_we_II/index.vue';

  const deviceType = useDeviceType();
  console.log(deviceType.value, '------deviceType-----');
</script>

<template>
  <XiaoESP32S3Process
    v-if="deviceType === deviceTypeObj['XIAO ESP32S3'].name"
    key="XIAO ESP32S3"
  />
  <VisionAIWeIIProcess
    v-else-if="deviceType === deviceTypeObj['Vision AI (WE-II)'].name"
    key="Vision AI (WE-II)"
  />
</template>
