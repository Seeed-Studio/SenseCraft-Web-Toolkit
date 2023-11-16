<template>
  <Tools :flasher="flasher" />
</template>

<script lang="ts" setup>
  import { ESPLoader, FlashOptions, Transport } from 'esptool-js';
  import { useI18n } from 'vue-i18n';
  import { useDeviceStore } from '@/store';
  import { DeviceStatus, Serial } from '@/sscma';
  import useDeviceManager from '@/hooks/deviceManager';
  import FlasherInterface from '@/sscma/FlasherInterface';
  import Tools from '../components/Tools.vue';

  const deviceManager = useDeviceManager();

  const deviceStore = useDeviceStore();
  const { t } = useI18n();

  const device = deviceManager.value?.getDevice();
  const term = deviceManager.value?.getTerm();

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
</script>
