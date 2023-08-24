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
  import { ref, onMounted } from 'vue';
  import deviceManager from '@/senseCraft/deviceManager';

  const { device } = deviceManager;

  const logs = ref<string[]>([]);
  const addLog = (log: string) => {
    logs.value.push(log);
  };

  const onLogger = (log: string) => {
    addLog(log);
  };

  onMounted(() => {
    device.onLogger = onLogger;
  });
</script>

<style scoped lang="less">
  .logger {
    padding: 20px;

    &-item {
      margin-bottom: 8px;
    }
  }
</style>
