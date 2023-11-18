<script setup lang="ts">
  import { DeviceType, deviceTypeObj } from '@/sscma/constants';
  import { useAppStore } from '@/store';
  import XiaoESP32S3Output from './xiao_esp32s3/index.vue';

  const appStore = useAppStore();
</script>

<template>
  <XiaoESP32S3Output
    v-if="appStore.deviceType === deviceTypeObj[DeviceType.XiaoEsp32s3].name"
  />
</template>
