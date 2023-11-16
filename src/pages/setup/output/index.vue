<script setup lang="ts">
  import useDeviceType from '@/hooks/deviceType';
  import { deviceTypeObj } from '@/sscma/constants';
  import XiaoESP32S3Output from './xiao_esp32s3/index.vue';

  const deviceType = useDeviceType();
</script>

<template>
  <XiaoESP32S3Output :is="deviceType === deviceTypeObj['XIAO ESP32S3'].name" />
</template>
