<script setup lang="ts">
  import useDeviceType from '@/hooks/deviceType';
  import { DeviceType } from '@/store/modules/app';
  import XiaoESP32S3Process from './xiao_esp32s3/index.vue';

  const deviceType = useDeviceType();
</script>

<template>
  <XiaoESP32S3Process :is="deviceType === DeviceType['XIAO ESP32S3']" />
</template>
