<template>
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
        default-value="webusb"
        v-model="protocol"
        placeholder="Please select ..."
        style="width: 120px"
      >
        <a-option
          v-for="item in PROTOCOL_LIST"
          :key="item"
          :value="item.value"
          >{{ item.label }}</a-option
        >
      </a-select>
      <a-button v-if="connected" type="secondary" @click="handleDisConnect">{{
        $t('workplace.device.btn.disconnect')
      }}</a-button>
      <a-button v-else type="primary" status="success" @click="handleConnect">{{
        $t('workplace.device.btn.connect')
      }}</a-button>
    </a-space>
  </a-card>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
  import { useDeviceStore } from '@/store';
  import { PROTOCOL_LIST } from '@/api/device';

  const deviceStore = useDeviceStore();
  const dev = deviceStore.device;

  export default defineComponent({
    data() {
      return {
        port: null as any,
        connected: false,
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
    name: 'Device',
    methods: {
      async handleConnect() {
        try {
          await dev.requestDevice(this.protocol);
          await dev.connect();
          if (dev.connected) {
            this.connected = true;
          }
        } catch (error) {
          console.log(error);
        }
      },
      async handleDisConnect() {
        try {
          await dev.disconnect();
          if (!dev.connected) {
            this.connected = false;
          }
        } catch (error) {
          console.log(error);
        }
      },
    },
    computed: {
      devConnected() {
        return dev.connected;
      },
    },
    watch: {
      async devConnected(val) {
        this.connected = val;
        if (this.connected) {
          const name = await dev.client.getName();
          const version = await dev.client.getVersion();
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
      await dev.mount();
      this.connected = dev.connected;
      this.protocol = dev.protocol;
    },
  });
</script>
