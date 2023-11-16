<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { ESPLoader, FlashOptions, Transport } from 'esptool-js';
  import { DeviceStatus, Serial } from '@/sscma';
  import { useDeviceStore } from '@/store';
  import useDeviceManager from '@/hooks/deviceManager';
  import FlasherInterface from '@/sscma/FlasherInterface';
  import Device from '../components/Device.vue';

  const deviceManager = useDeviceManager();

  const { t } = useI18n();
  const device = deviceManager.value?.getDevice();
  const term = deviceManager.value?.getTerm();
  const deviceStore = useDeviceStore();
  const deviceName = ref<string | null>(null);
  const deviceVersion = ref<string | null>(null);

  const espLoaderTerminal = {
    clean() {
      term?.clear();
    },
    writeLine(data: string) {
      term?.writeln(data);
    },
    write(data: string) {
      term?.write(data);
    },
  };

  class Flasher implements FlasherInterface {
    isNeedConnectDevice = true;
    isNeedResetDevice = true;
    private espLoader: ESPLoader | null = null;
    private transport: Transport | null = null;

    private async espLoaderConnect() {
      if (deviceStore.deviceStatus !== DeviceStatus.EspConnected) {
        await (device as Serial).esploaderConnect(espLoaderTerminal);
      }
      this.espLoader = (device as Serial).esploader;
      this.transport = (device as Serial).transport;
      if (!this.espLoader || !this.transport) {
        throw new Error(t('workplace.serial.no.port'));
      }
    }

    async writeFlashBefore() {
      await this.espLoaderConnect();
    }

    async onWriteFlash(data: any) {
      try {
        deviceStore.setDeviceStatus(DeviceStatus.Flashing);
        const flashOptions: FlashOptions = {
          fileArray: data,
          flashSize: 'keep',
          eraseAll: false,
          compress: true,
          reportProgress: (fileIndex, written, total) => {
            console.log(
              'written ',
              fileIndex,
              ' file:',
              (written / total) * 100
            );
          },
        } as FlashOptions;
        await this.espLoader?.write_flash(flashOptions);
        return true;
      } catch (error) {
        console.error(error, '在烧录的过程中出现了错误');
        return false;
      }
    }

    async onResetDevice() {
      await this.transport?.setDTR(false);
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
      await this.transport?.setDTR(true);
    }

    async onConnectDevice() {
      if (deviceStore.deviceStatus !== DeviceStatus.SerialConnected) {
        await (device as Serial).connect();
      }
    }

    async onEraseFlashBefore() {
      await this.espLoaderConnect();
    }

    async onEraseFlash() {
      await this.espLoader?.erase_flash();
      return true;
    }
  }

  const flasher = new Flasher();

  const handelRefresh = async () => {
    if (deviceStore.deviceStatus === DeviceStatus.SerialConnected) {
      try {
        const name = await device?.getName();
        const version = await device?.getVersion();
        if (name) {
          deviceName.value = name;
        }
        if (version) {
          deviceVersion.value = version;
        }
        const base64Str = await device?.getInfo();
        if (base64Str) {
          const str = atob(base64Str);
          const model = JSON.parse(str);
          deviceStore.setCurrentModel(model);
        } else {
          deviceStore.setCurrentModel(undefined);
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  const fetchAvailableModels = async () => {
    const data = await fetch(
      `https://files.seeedstudio.com/sscma/sscma-model.json?timestamp=${new Date().getTime()}`
    ).then((response) => response.json());
    deviceStore.setModels(data.models);
    deviceStore.setHasLoadModel(true);
    const firmwares = data.firmwares;
    if (firmwares?.length > 0) {
      deviceStore.setFirmware(firmwares[1]);
    }
  };

  onMounted(() => {
    fetchAvailableModels();
    handelRefresh();
  });

  watch(
    () => deviceStore.deviceStatus,
    () => {
      if (deviceStore.hasLoadModel) {
        return;
      }
      fetchAvailableModels();
      handelRefresh();
    }
  );
</script>

<template>
  <Device
    :device-name="deviceName"
    :device-version="deviceVersion"
    :flasher="flasher"
  />
</template>
@/sscma
