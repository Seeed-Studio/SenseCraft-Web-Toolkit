<template>
  <a-spin class="device-card" :loading="loading" tip="This may take a while...">
    <a-card class="general-card" :title="$t('workplace.device.title')">
      <template #extra>
        <a-tag
          v-if="connectStatus === DEVICESTATUS.SERIALCONNECTED"
          color="green"
          >{{ $t('workplace.device.status.online') }}</a-tag
        >
        <a-tag v-else color="red">{{
          $t('workplace.device.status.offline')
        }}</a-tag>
      </template>
      <a-space direction="vertical">
        <a-descriptions layout="horizontal" :column="1" size="large">
          <a-descriptions-item
            v-for="item in info"
            :key="item.label"
            :label="$t(item.label)"
          >
            {{ item.value }}
          </a-descriptions-item>
        </a-descriptions>
        <a-button
          v-if="connectStatus === DEVICESTATUS.SERIALCONNECTED"
          type="secondary"
          @click="handleDisconnect"
          >{{ $t('workplace.device.btn.disconnect') }}</a-button
        >
        <a-button
          v-else
          type="primary"
          status="success"
          @click="handleConnect"
          >{{ $t('workplace.device.btn.connect') }}</a-button
        >
      </a-space>
    </a-card>
  </a-spin>
</template>

<script lang="ts" setup>
  import { ref, reactive, onMounted, computed, watch } from 'vue';
  import { useDeviceStore } from '@/store';
  import { PROTOCOL_LIST, DEVICESTATUS } from '@/senseCraft';
  import deviceManager from '@/senseCraft/deviceManager';

  const deviceStore = useDeviceStore();
  const { device } = deviceManager;

  const loading = ref(false);
  const protocol = ref('serial');
  const info = reactive([
    {
      label: 'workplace.device.name',
      value: 'unknown',
    },
    {
      label: 'workplace.device.version',
      value: 'unknown',
    },
  ]);

  const handleConnect = async () => {
    try {
      loading.value = true;
      await device.connect();
    } catch (error) {
      loading.value = false;
      console.log(error);
    }
  };

  const handleDisconnect = async () => {
    try {
      device.disconnect();
    } catch (error) {
      console.log(error);
    }
  };

  onMounted(async () => {
    protocol.value = device.protocol || 'serial';
  });

  const connectStatus = computed(() => deviceStore.connectStatus);

  watch(
    () => connectStatus.value,
    async (val) => {
      if (val === DEVICESTATUS.SERIALCONNECTED) {
        loading.value = false;
        const name = (await device.getName()) || '';
        const version = (await device.getVersion()) || '';
        info[0].value = name;
        info[1].value = version;
      }
    }
  );
</script>

<style scoped lang="less">
  .device-card {
    width: 100%;
  }
</style>
