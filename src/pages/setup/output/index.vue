<script setup lang="ts">
  import useDeviceType from '@/hooks/deviceType';
  import XIAOESP32S3Output from './XIAOESP32S3/index.vue';

  const deviceType = useDeviceType();
</script>

<template>
  <XIAOESP32S3Output :is="deviceType === 'XIAO ESP32S3'" />
</template>
