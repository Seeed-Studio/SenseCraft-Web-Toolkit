<script setup lang="ts">
  import { watch, onMounted, onUnmounted } from 'vue';
  import { decode } from 'js-base64';
  import { Message } from '@arco-design/web-vue';
  import { useI18n } from 'vue-i18n';
  import { DeviceStatus } from '@/sscma';
  import { useDeviceStore } from '@/store';
  import useDeviceManager from '@/hooks/deviceManager';
  import Flasher from '@/sscma/xiao_esp32s3/Flasher';
  import { FlashWayType } from '@/store/modules/device';
  import { retry } from '@/utils/timer';
  import Device from '../components/Device.vue';

  const { device, term } = useDeviceManager();

  const deviceStore = useDeviceStore();
  const { t } = useI18n();

  const flasher = new Flasher();

  const handelRefresh = async () => {
    if (deviceStore.deviceStatus === DeviceStatus.SerialConnected) {
      try {
        /**
         * Because the data retrieved immediately after burning to xiao will be from the previous time,
         * so we can't request it right away. Therefore, we still use a synchronous method to request
         * instructions one by one here.
         */
        const name = await device.value?.getName();
        const version = await device.value?.getVersion();
        const deviceId = await device.value?.getID();
        const base64Str = await device.value?.getInfo();
        const currentModel = await device.value?.getModel();

        let model = null;
        if (base64Str) {
          const str = decode(base64Str);
          model = JSON.parse(str);
        }
        deviceStore.setDeviceName(name);
        deviceStore.setDeviceVersion(version);
        deviceStore.setDeviceId(deviceId);
        deviceStore.setCurrentModel(model);
        deviceStore.setCurrentAvailableModel(currentModel?.id !== undefined);
        if (deviceStore.flashWay !== FlashWayType.ComeToSenseCraftAI) {
          deviceStore.setFlashWay(
            FlashWayType[model?.isCustom ? 'Custom' : 'Prefabricated']
          );
        }
        if (!name && !version && !model && !currentModel) {
          // 代表这些指令都超时了
          Message.warning(t('workplace.serial.command.timeout'));
        }
      } catch (error: any) {
        console.log(error);
        term.writeln(`Error: ${error?.message}`);
      }
    }
  };

  const fetchAvailableModels = async () => {
    const data = await retry(
      () =>
        fetch(
          `https://files.seeedstudio.com/sscma/sscma-model.json?timestamp=${new Date().getTime()}`
        ).then((response) => response.json()),
      5,
      500
    );
    deviceStore.setModels(data.models);
    const firmwares = data.firmwares;
    if (firmwares?.length > 0) {
      deviceStore.setFirmware(firmwares[0]);
    }
  };

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

  onMounted(fetchAvailableModels);
  onMounted(handelRefresh);
  onUnmounted(deviceStore.clearDeviceInfo);
  watch(() => deviceStore.deviceStatus, handelRefresh);
</script>

<template>
  <Device :flasher="flasher" :read-file="readFile" />
</template>
