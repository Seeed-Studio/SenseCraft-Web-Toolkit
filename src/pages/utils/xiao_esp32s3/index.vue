<template>
  <Tools :flasher="flasher" />
</template>

<script lang="ts" setup>
  import Flasher from '@/sscma/xiao_esp32s3/Flasher';
  import Tools from '../components/Tools.vue';

  const flasher = new Flasher();
</script>
