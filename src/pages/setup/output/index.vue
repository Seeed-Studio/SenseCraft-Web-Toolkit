<script setup lang="ts">
  import { deviceTypeObj } from '@/sscma/constants';
  import { useAppStore } from '@/store';
  import XiaoESP32S3Output from './xiao_esp32s3/index.vue';

  const appStore = useAppStore();
</script>

<template>
  <XiaoESP32S3Output
    v-if="appStore.deviceType === deviceTypeObj['XIAO ESP32S3'].name"
  />
</template>
