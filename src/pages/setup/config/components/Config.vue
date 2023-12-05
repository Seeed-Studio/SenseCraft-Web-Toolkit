<template>
  <a-card
    :class="['general-card', 'item-card']"
    :title="$t('workplace.config.wifi')"
  >
    <a-form :model="config" :style="{ width: '80%' }" @submit="handleSubmit">
      <a-form-item
        field="wifi.ssid"
        :label="$t('workplace.config.wifi.ssid')"
        required
      >
        <a-input
          v-model="config.wifi.ssid"
          :placeholder="$t('workplace.config.wifi.message.ssid')"
          size="large"
          allow-clear
        />
      </a-form-item>
      <a-form-item
        field="wifi.password"
        :label="$t('workplace.config.wifi.password')"
      >
        <a-input-password
          v-model="config.wifi.password"
          :placeholder="$t('workplace.config.wifi.message.password')"
          size="large"
          allow-clear
        />
      </a-form-item>
      <a-form-item
        field="wifi.encryption"
        :label="$t('workplace.config.wifi.encryption')"
      >
        <a-select v-model="config.wifi.encryption" size="large">
          <a-option value="0">AUTO</a-option>
          <a-option value="1">Open</a-option>
          <a-option value="2">WEP</a-option>
          <a-option value="3">WPA1_WPA2</a-option>
          <a-option value="4">WPA2_WPA3</a-option>
          <a-option value="5">WPA3</a-option>
        </a-select>
      </a-form-item>
      <a-form-item :label="$t('workplace.config.mqtt')">
        <a-switch v-model="config.mqtt.enabled" />
      </a-form-item>
      <div v-if="config.mqtt.enabled" style="margin-bottom: 16px">
        <a-form-item
          field="mqtt.host"
          :label="$t('workplace.config.mqtt.host')"
          required
        >
          <a-input
            v-model="config.mqtt.host"
            :placeholder="$t('workplace.config.mqtt.message.host')"
            size="large"
            allow-clear
          />
        </a-form-item>
        <a-form-item
          field="mqtt.port"
          :label="$t('workplace.config.mqtt.port')"
          required
        >
          <a-input-number
            v-model="config.mqtt.port"
            :placeholder="$t('workplace.config.mqtt.message.port')"
            size="large"
            allow-clear
          />
        </a-form-item>
        <a-form-item
          field="mqtt.username"
          :label="$t('workplace.config.mqtt.username')"
        >
          <a-input
            v-model="config.mqtt.username"
            :placeholder="$t('workplace.config.mqtt.message.username')"
            size="large"
            allow-clear
          />
        </a-form-item>
        <a-form-item
          field="mqtt.password"
          :label="$t('workplace.config.mqtt.password')"
        >
          <a-input-password
            v-model="config.mqtt.password"
            :placeholder="$t('workplace.config.mqtt.message.password')"
            size="large"
            allow-clear
          />
        </a-form-item>
      </div>
      <a-form-item>
        <a-button
          type="primary"
          html-type="submit"
          size="large"
          :loading="loading"
          :disabled="change"
          >{{ $t('workplace.config.wifi.save') }}</a-button
        >
      </a-form-item>
    </a-form>
  </a-card>
</template>

<script lang="ts" setup>
  import { onMounted, watch, reactive, ref } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { useI18n } from 'vue-i18n';
  import { useDeviceStore } from '@/store';
  import { DeviceStatus } from '@/sscma';
  import useDeviceManager from '@/hooks/deviceManager';

  const { device } = useDeviceManager();
  const deviceStore = useDeviceStore();
  const { t } = useI18n();

  const config = reactive({
    wifi: {
      enabled: true,
      ssid: '',
      password: '',
      encryption: '0',
    },
    mqtt: {
      enabled: false,
      host: '',
      port: 0,
      username: '',
      password: '',
      ssl: 0,
    },
  });

  let oldConfig = reactive({
    wifi: {
      enabled: true,
      ssid: '',
      password: '',
      encryption: '0',
    },
    mqtt: {
      enabled: false,
      host: '',
      port: 0,
      username: '',
      password: '',
      ssl: 0,
    },
  });

  const loaded = ref(false);
  const loading = ref(false);
  const change = ref(true);

  const handleSubmit = async () => {
    loading.value = true;
    let ret = await device.value?.setWifi(
      config.wifi.ssid,
      config.wifi.password,
      parseInt(config.wifi.encryption, 10)
    );
    if (!config.mqtt.enabled) {
      ret = await device.value?.setMqttServer('', 0, '', '', 0);
    } else {
      ret = await device.value?.setMqttServer(
        config.mqtt.host,
        config.mqtt.port,
        config.mqtt.username,
        config.mqtt.password,
        config.mqtt.ssl
      );
    }
    loading.value = false;
    change.value = true;
  };

  const handelRefresh = async (deviceStatus: DeviceStatus) => {
    if (deviceStatus === DeviceStatus.SerialConnected && !loaded.value) {
      const wifi = await device.value?.getWifi();
      const mqtt = await device.value?.getMqttServer();
      config.wifi.password = wifi.config.password;
      config.wifi.ssid = wifi.config.name;
      config.wifi.encryption = wifi.config.security.toString();
      if (mqtt.config.address !== '') {
        config.mqtt.enabled = true;
        config.mqtt.host = mqtt.config.address;
        config.mqtt.port = mqtt.config.port;
        config.mqtt.username = mqtt.config.username;
        config.mqtt.password = mqtt.config.password;
        config.mqtt.ssl = mqtt.config.use_ssl;
      } else {
        config.mqtt.enabled = false;
      }
      oldConfig = JSON.parse(JSON.stringify(config));
      loaded.value = true;
      change.value = true;
    }
  };

  watch(
    () => config,
    (val) => {
      if (JSON.stringify(config) !== JSON.stringify(oldConfig)) {
        change.value = false;
      } else {
        change.value = true;
      }
    },
    { deep: true }
  );

  watch(
    () => deviceStore.deviceStatus,
    (val) => {
      handelRefresh(val);
    }
  );

  onMounted(async () => {
    handelRefresh(deviceStore.deviceStatus);
  });
</script>

<style lang="less">
  .arco-form-item-label-col {
    justify-content: flex-start;
  }

  .arco-list-medium .arco-list-content-wrapper .arco-list-header {
    padding: 6px 20px;
    background-color: var(--color-neutral-2);
  }
</style>

<style scoped lang="less">
  .item-card {
    width: 50%;
    min-width: 680px;
    height: 90%;
    margin: 16px;
  }
</style>
