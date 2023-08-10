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
        <a-descriptions
          layout="horizontal"
          :data="info"
          :column="1"
          size="large"
        />
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
        <a-button v-if="connected" type="secondary" @click="handleDisConnect">{{
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

<script lang="ts">
  import { defineComponent } from 'vue';
  import { useDeviceStore } from '@/store';
  import { PROTOCOL_LIST } from '@/edgelab';

  const deviceStore = useDeviceStore();
  const device = deviceStore.getDevice;

  export default defineComponent({
    name: 'Device',
    data() {
      return {
        port: null as any,
        loading: false,
        protocol: 'webusb',
        buttonConnect: this.$t('workplace.device.btn.connect'),
        dataStatus: '',
        PROTOCOL_LIST,
        info: [
          {
            label: this.$t('workplace.device.name'),
            value: 'unknown',
          },
          {
            label: this.$t('workplace.device.version'),
            value: 'unknown',
          },
        ],
      };
    },
    computed: {
      connected() {
        return device.connected;
      },
    },
    watch: {
      async connected(val) {
        if (val) {
          this.loading = false;
          const name = await device.client.getName();
          const version = await device.client.getVersion();
          this.info = [
            {
              label: this.$t('workplace.device.name'),
              value: name,
            },
            {
              label: this.$t('workplace.device.version'),
              value: version,
            },
          ];
        }
      },
    },
    async mounted() {
      this.loading = true;
      await device.mount();
      this.protocol = device.protocol;
    },
    methods: {
      async handleConnect() {
        try {
          this.loading = true;
          await device.requestDevice(this.protocol);
          await device.connect();
        } catch (error) {
          this.loading = false;
          console.log(error);
        }
      },
      async handleDisConnect() {
        try {
          await device.disconnect();
        } catch (error) {
          console.log(error);
        }
      },
    },
  });
</script>
@/edgelab/device
