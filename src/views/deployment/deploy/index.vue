<template>
  <div class="content">
    <a-button type="primary" class="result" @click="handleDeploy">
      Deploy
    </a-button>
  </div>
</template>

<script lang="ts" setup>
  import { useDeviceStore } from '@/store';

  const deviceStore = useDeviceStore();
  const device = deviceStore.getDevice;

  const handleDeploy = () => {
    if (device.connected) {
      device.disconnect();
    }
    window.open('https://espressif.github.io/esptool-js/');
  };
</script>

<style scoped lang="less">
  .content {
    // padding-top: 100px;
    position: absolute;
    top: 50%;
    left: 50%;
    margin-top: -121px;
    margin-left: -95px;
    text-align: center;
  }
</style>
