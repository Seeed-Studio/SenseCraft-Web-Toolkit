<script setup lang="ts">
  import { ref, watch, Ref, onMounted } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { ESPLoader, FlashOptions } from 'esptool-js';
  import { DeviceStatus, Model, Serial, deviceManager } from '@/sscma';
  import { useDeviceStore } from '@/store';
  import Device from '../components/Device.vue';

  const { t } = useI18n();
  const { device, term } = deviceManager;
  const deviceStore = useDeviceStore();
  const deviceName = ref<string | null>(null);
  const deviceVersion = ref<string | null>(null);

  const espLoaderTerminal = {
    clean() {
      term.clear();
    },
    writeLine(data: string) {
      term.writeln(data);
    },
    write(data: string) {
      term.write(data);
    },
  };

  const handelRefresh = async () => {
    if (deviceStore.deviceStatus === DeviceStatus.SerialConnected) {
      try {
        const name = await device.getName();
        const version = await device.getVersion();
        deviceName.value = name;
        deviceVersion.value = version;
        const base64Str = await device.getInfo();
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

  const onFlashFirmwareBefore = async () => {
    if (deviceStore.deviceStatus !== DeviceStatus.EspConnected) {
      await (device as Serial).esploaderConnect(espLoaderTerminal);
    }
    const esploader = (device as Serial).esploader;
    const transport = (device as Serial).transport;
    if (!esploader || !transport) {
      throw new Error(t('workplace.serial.no.port'));
    }
    return { esploader, transport };
  };

  const onWriteFlash = async (params: Record<string, any>) => {
    const tempParams = params as {
      fileArray: { data: string; address: number }[];
      esploader: ESPLoader;
    };
    deviceStore.setDeviceStatus(DeviceStatus.Flashing);
    try {
      const flashOptions = {
        fileArray: tempParams.fileArray,
        flashSize: 'keep',
        eraseAll: false,
        compress: true,
        reportProgress: (fileIndex, written, total) => {
          console.log('written ', fileIndex, ' file:', (written / total) * 100);
        },
      } as FlashOptions;
      await tempParams.esploader?.write_flash(flashOptions);
      return true;
    } catch (e: any) {
      term.writeln(`Error: ${e.message}`);
      return false;
    }
  };

  const onResetDevice = async (params: Record<string, any>) => {
    await params.transport?.setDTR(false);
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    await params.transport?.setDTR(true);
  };

  const onResetFinish = async (loadingTip: Ref<string>) => {
    if (deviceStore.deviceStatus !== DeviceStatus.SerialConnected) {
      loadingTip.value = t('workplace.device.message.tip.connecting');
      await (device as Serial).connect();
    }
  };

  const onAllFinish = (model: Model) => {
    if (model) {
      try {
        const info = btoa(JSON.stringify(model));
        device.setInfo(info);
        device.deleteAction();
        deviceStore.setCurrentModel(model);
      } catch (error) {
        console.error(error);
      }
    }
  };

  onMounted(() => {
    fetch(
      `https://files.seeedstudio.com/sscma/sscma-model.json?timestamp=${new Date().getTime()}`
    )
      .then((response) => response.json())
      .then((data: any) => {
        deviceStore.setModels(data.models);
        deviceStore.setHasLoadModel(true);
        const firmwares = data.firmwares;
        if (firmwares?.length > 0) {
          deviceStore.setFirmware(firmwares[1]);
        }
      });
    handelRefresh();
  });

  watch(
    () => deviceStore.deviceStatus,
    () => {
      if (!deviceStore.hasLoadModel) {
        fetch(
          `https://files.seeedstudio.com/sscma/sscma-model.json?timestamp=${new Date().getTime()}`
        )
          .then((response) => response.json())
          .then((data: any) => {
            deviceStore.setModels(data.models);
            deviceStore.setHasLoadModel(true);
            const firmwares = data.firmwares;
            if (firmwares?.length > 0) {
              deviceStore.setFirmware(firmwares[1]);
            }
          });
        handelRefresh();
      }
    }
  );
</script>

<template>
  <Device
    :on-flash-firmware-before="onFlashFirmwareBefore"
    :device-name="deviceName"
    :device-version="deviceVersion"
    :on-write-flash="onWriteFlash"
    :on-reset-device="onResetDevice"
    :on-reset-finish="onResetFinish"
    :on-all-finish="onAllFinish"
  />
</template>
@/sscma
