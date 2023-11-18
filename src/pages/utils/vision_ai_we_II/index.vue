<template>
  <Tools :flasher="flasher" />
</template>

<script lang="ts" setup>
  import Flasher from '@/sscma/vision_ai_we_II/Flasher';
  import Tools from '../components/Tools.vue';

  const flasher = new Flasher();
</script>
