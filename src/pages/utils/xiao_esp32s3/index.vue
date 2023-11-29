<template>
  <Tools :flasher="flasher" :read-file="readFile" />
</template>

<script lang="ts" setup>
  import Flasher from '@/sscma/xiao_esp32s3/Flasher';
  import Tools from '../components/Tools.vue';

  const flasher = new Flasher();

  const readFile = (blob: Blob | File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev: ProgressEvent<FileReader>) => {
        const data = ev?.target?.result as string;
        resolve(data);
      };
      reader.readAsBinaryString(blob);
    });
  };
</script>
