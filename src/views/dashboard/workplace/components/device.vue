<template>
  <a-spin :loading="loading" tip="This may take a while...">
    <a-card class="general-card" :title="$t('workplace.device.title')">
      <template #extra>
        <a-tag v-if="connected" color="green">{{
          $t('workplace.device.status.online')
        }}</a-tag>
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
      </a-space>
      <a-space direction="horizontal">
        <a-select
          v-model="protocol"
          default-value="webusb"
          placeholder="Please select ..."
          style="width: 120px"
          :disabled="connected"
        >
          <a-option
            v-for="item in PROTOCOL_LIST"
            :key="item.value"
            :value="item.value"
            >{{ item.label }}</a-option
          >
        </a-select>
        <a-button v-if="connected" type="secondary" @click="handleDisconnect">{{
          $t('workplace.device.btn.disconnect')
        }}</a-button>
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

<script setup lang="ts">
  import { ref, reactive, onMounted, computed, watch } from 'vue';
  import { useDeviceStore } from '@/store';
  import { PROTOCOL_LIST } from '@/edgelab';

  const deviceStore = useDeviceStore();
  const device = deviceStore.getDevice;

  const loading = ref(false);
  const protocol = ref('webusb');
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
      await device.requestDevice(protocol.value);
      await device.connect();
    } catch (error) {
      loading.value = false;
      console.log(error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await device.disconnect();
    } catch (error) {
      console.log(error);
    }
  };

  onMounted(async () => {
    loading.value = true;
    loading.value = await device.mount();
    protocol.value = device.protocol;
  });

  const connected = computed(() => device.connected);

  watch(
    () => device.connected,
    async (val) => {
      if (val) {
        loading.value = false;
        const name = await device.client.getName();
        const version = await device.client.getVersion();
        info[0].value = name;
        info[1].value = version;
      }
    }
  );
</script>
