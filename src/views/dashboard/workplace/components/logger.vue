<template>
  <a-card
    class="general-card"
    :title="$t('workplace.logger.title')"
    :header-style="{ paddingBottom: '0' }"
  >
    <a-scrollbar style="height: 300px; overflow: auto">
      <div class="logger">
        <div v-for="(log, index) in logs" :key="index" class="logger-item">{{
          log
        }}</div>
      </div>
    </a-scrollbar>
  </a-card>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { useDeviceStore } from '@/store';

  const deviceStore = useDeviceStore();
  const device = deviceStore.getDevice;

  const logs = ref<string[]>([]);
  const addLog = (log: string) => {
    logs.value.push(log);
  };

  device.onLogger = (log: string) => {
    addLog(log);
  };
</script>

<style scoped lang="less">
  .logger {
    padding: 20px;

    &-item {
      margin-bottom: 8px;
    }
  }
</style>
