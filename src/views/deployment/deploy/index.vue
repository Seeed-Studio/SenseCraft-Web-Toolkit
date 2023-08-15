<template>
  <Esptool v-if="isEsptool" />
  <CommingSoon v-else />
</template>

<script setup lang="ts">
  import { useDeviceStore } from '@/store';
  import Esptool from './components/esptool.vue';
  import CommingSoon from './components/comming-soon.vue';

  const deviceStore = useDeviceStore();
  const device = deviceStore.getDevice;

  const isEsptool = device?.protocol === 'serial'

</script>
