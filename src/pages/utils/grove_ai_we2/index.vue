<template>
  <Tools :flasher="flasher" :read-file="readFile" />
</template>

<script lang="ts" setup>
  import Flasher from '@/sscma/grove_ai_we2/Flasher';
  import Tools from '../components/Tools.vue';

  const flasher = new Flasher();

  const readFile = (blob: Blob | File): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        resolve(uint8Array);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  };
</script>
