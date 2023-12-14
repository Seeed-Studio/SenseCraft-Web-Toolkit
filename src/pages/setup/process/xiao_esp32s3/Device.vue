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
  import Device from '../components/Device.vue';

  const { device, term } = useDeviceManager();

  const deviceStore = useDeviceStore();
  const { t } = useI18n();

  const flasher = new Flasher();

  const handelRefresh = async () => {
    if (deviceStore.deviceStatus === DeviceStatus.SerialConnected) {
      try {
        const name = await device.value?.getName();
        const version = await device.value?.getVersion();
        if (name) {
          deviceStore.setDeviceName(name);
        }
        if (version) {
          deviceStore.setDeviceVersion(version);
        }
        const base64Str = await device.value?.getInfo();
        const tempModel = await device.value?.getModel();
        if (base64Str) {
          const str = decode(base64Str);
          const model = JSON.parse(str);
          if (deviceStore.flashWay !== FlashWayType.ComeToSenseCraftAI) {
            deviceStore.setFlashWay(
              FlashWayType[model.isCustom ? 'Custom' : 'Prefabricated']
            );
          }
          deviceStore.setCurrentModel(model);
          deviceStore.setCurrentAvailableModel(tempModel?.id !== undefined);
        } else {
          deviceStore.setCurrentModel(undefined);
        }
        if (!name && !version && !base64Str && !tempModel) {
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
    const data = await fetch(
      `https://files.seeedstudio.com/sscma/sscma-model.json?timestamp=${new Date().getTime()}`
    ).then((response) => response.json());
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
  onUnmounted(deviceStore.clearDeviceInfo);
  watch(() => deviceStore.deviceStatus, handelRefresh);
</script>

<template>
  <Device :flasher="flasher" :read-file="readFile" />
</template>
