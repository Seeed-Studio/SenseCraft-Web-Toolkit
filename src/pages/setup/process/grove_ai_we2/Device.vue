<script setup lang="ts">
  import { watch, onMounted, onUnmounted } from 'vue';
  import { decode } from 'js-base64';
  import { Message } from '@arco-design/web-vue';
  import { useI18n } from 'vue-i18n';
  import { DeviceStatus } from '@/sscma';
  import { useDeviceStore } from '@/store';
  import useDeviceManager from '@/hooks/deviceManager';
  import Flasher from '@/sscma/grove_ai_we2/Flasher';
  import { FlashWayType } from '@/store/modules/device';
  import { delay } from '@/utils/timer';
  import Device from '../components/Device.vue';

  const { device, term } = useDeviceManager();
  const deviceStore = useDeviceStore();
  const flasher = new Flasher();
  const { t } = useI18n();

  const handelRefresh = async () => {
    if (deviceStore.deviceStatus === DeviceStatus.SerialConnected) {
      try {
        const [name, version, model, currentModel, deviceId, mqttServer] =
          await Promise.all([
            device.value?.getName(),
            device.value?.getVersion(),
            device.value?.getInfo().then((base64Str) => {
              if (!base64Str) return null;
              const str = decode(base64Str);
              return JSON.parse(str);
            }),
            device.value?.getModel(),
            device.value?.getID(),
            device.value?.getMqttServer(),
          ]);
        deviceStore.setDeviceName(name);
        deviceStore.setDeviceVersion(version);
        deviceStore.setDeviceId(deviceId);
        deviceStore.setIsCanMqtt(true);
        deviceStore.setIsCanWifi(true);
        deviceStore.setDeviceServerState(mqttServer?.status);
        deviceStore.setCurrentModel(model);
        deviceStore.setCurrentAvailableModel(currentModel?.id !== undefined);
        if (deviceStore.flashWay !== FlashWayType.ComeToSenseCraftAI) {
          deviceStore.setFlashWay(
            FlashWayType[model.isCustom ? 'Custom' : 'Prefabricated']
          );
        }
        if (!name && !version && !model && !currentModel) {
          // 代表这些指令都超时了
          Message.warning(t('workplace.serial.command.timeout'));
        }
      } catch (error: any) {
        console.error(error);
        term.writeln(`Error: ${error?.message}`);
      }
    }
  };

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

  const fetchAvailableModels = async () => {
    const data = await fetch(
      `https://files.seeedstudio.com/sscma/sscma-model-we2.json?timestamp=${new Date().getTime()}`
    ).then((response) => response.json());
    deviceStore.setModels(data.models);
    const firmwares = data.firmwares;
    if (firmwares?.length > 0) {
      deviceStore.setFirmware(firmwares[0]);
    }
  };

  const checkWifiStatusAndGetInfo = () => {
    let isStarted = false;
    let isLoop = true;
    async function start(isFirst = true) {
      if (isStarted) {
        return;
      }
      if (deviceStore.deviceStatus !== DeviceStatus.SerialConnected) {
        return;
      }
      isStarted = true;
      try {
        await delay(isFirst ? 1000 : 10000);
        const wifi = await device.value?.getWifi();
        deviceStore.setDeviceIPv4AddressAndStatus(
          wifi?.in4_info?.ip,
          wifi?.status
        );
      } catch (error) {
        console.log('get wifi info error', error);
      } finally {
        isStarted = false;
        if (isLoop) {
          await start(false);
        }
      }
    }
    function stop() {
      isLoop = false;
    }
    return { start, stop };
  };

  const { start, stop } = checkWifiStatusAndGetInfo();

  onMounted(fetchAvailableModels);
  onMounted(handelRefresh);
  onMounted(start);

  onUnmounted(deviceStore.clearDeviceInfo);
  onUnmounted(stop);

  watch(() => deviceStore.deviceStatus, handelRefresh);
  watch(
    () => deviceStore.deviceStatus,
    () => start()
  );
</script>

<template>
  <Device :flasher="flasher" :read-file="readFile" />
</template>
