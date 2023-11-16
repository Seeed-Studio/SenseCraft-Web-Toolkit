<script setup lang="ts">
  import { DeviceType } from '@/store/modules/app';
  import useDeviceType from '@/hooks/deviceType';
  import XiaoESP32S3Output from './xiao_esp32s3/index.vue';

  const deviceType = useDeviceType();
</script>

<template>
  <XiaoESP32S3Output :is="deviceType === DeviceType['XIAO ESP32S3']" />
</template>
