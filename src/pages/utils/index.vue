<template>
  <a-spin :loading="loading" :tip="loadingTip" class="item-card">
    <a-card class="general-card" :title="$t('workplace.device.card.esptool')">
      <template #extra>
        <a-button type="primary" status="danger" @click="handleEraseflash">
          {{ $t('workplace.firmware.eraseflash') }}
        </a-button>
      </template>

      <a-list class="list" :data="data">
        <template #header>
          <div class="list-header">
            <div class="list-header-address">{{
              $t('workplace.firmware.address')
            }}</div>
            <div class="list-header-file">{{
              $t('workplace.firmware.file')
            }}</div>
          </div>
        </template>
        <template #item="{ item, index }">
          <a-list-item class="list-item">
            <div class="list-item-content">
              <div class="list-item-address">
                <a-input
                  v-model="item.address"
                  :style="{ width: '150px' }"
                  :placeholder="$t('workplace.firmware.address')"
                  allow-clear
                />
              </div>
              <div class="list-item-file">
                <a-upload
                  :custom-request="fileChangeHandler"
                  :limit="1"
                  @before-upload="(file) => beforeUpload(file, index)"
                  @before-remove="() => beforeRemove(index)"
                >
                  <template #upload-button>
                    <a-button type="primary">
                      <template #icon>
                        <icon-upload />
                      </template>
                      <template #default>{{
                        $t('workplace.firmware.choosefile')
                      }}</template>
                    </a-button>
                  </template>
                </a-upload>
              </div>
              <div>
                <a-button type="primary" @click="() => removeFile(index)">{{
                  $t('workplace.firmware.remove')
                }}</a-button>
              </div>
            </div>
          </a-list-item>
        </template>
      </a-list>

      <div class="bottom">
        <a-button type="primary" @click="addFile">{{
          $t('workplace.firmware.addfile')
        }}</a-button>
        <a-button class="flash-btn" type="primary" @click="flashFirmware">
          {{ $t('workplace.device.btn.flash') }}
        </a-button>
      </div>
    </a-card>
  </a-spin>
</template>

<script lang="ts" setup>
  import { Ref, ref } from 'vue';
  import { FlashOptions } from 'esptool-js';
  import { useI18n } from 'vue-i18n';
  import { RequestOption } from '@arco-design/web-vue/es/upload';
  import { Message } from '@arco-design/web-vue';
  import { useDeviceStore } from '@/store';
  import { DeviceStatus, Serial, deviceManager } from '@/sscma';

  const deviceStore = useDeviceStore();
  const { t } = useI18n();

  const { device, term } = deviceManager;

  const data: Ref<
    {
      address: string;
      file: File | null;
    }[]
  > = ref([]);

  const loading = ref(false);
  const loadingTip = ref('');

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

  const handleEraseflash = async () => {
    loading.value = true;
    loadingTip.value = t('workplace.device.message.tip.connecting');
    let result;
    try {
      if (deviceStore.deviceStatus !== DeviceStatus.EspConnected) {
        await (device as Serial).esploaderConnect(espLoaderTerminal);
      }
      const esploader = (device as Serial).esploader;
      loadingTip.value = t('workplace.device.message.tip.erasing');
      await esploader?.erase_flash();
      result = true;
    } catch (e) {
      console.error(e);
      result = false;
    }
    if (result) {
      if (deviceStore.deviceStatus !== DeviceStatus.SerialConnected) {
        await (device as Serial).connect();
      }
      device.deleteInfo();
      device.deleteAction();
      deviceStore.setCurrentModel(undefined);
      Message.success(t('workplace.firmware.message.erase.successful'));
    } else {
      Message.error(t('workplace.firmware.message.erase.failed'));
    }
    loadingTip.value = '';
    loading.value = false;
  };

  const readFile = (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev: ProgressEvent<FileReader>) => {
        const data = ev?.target?.result as string;
        resolve(data);
      };
      reader.readAsBinaryString(file);
    });
  };

  const flashFirmware = async () => {
    loading.value = true;
    const fileArray = [] as {
      data: string;
      address: number;
    }[];
    let noNumber = false;
    /* eslint-disable no-await-in-loop */
    for (let index = 0; index < data.value.length; index += 1) {
      const item = data.value[index];
      if (item.file) {
        const data = await readFile(item.file);
        let address;
        if (/0[xX][0-9a-fA-F]+/.test(item.address)) {
          address = parseInt(item.address, 16);
          fileArray.push({ data, address });
        } else if (/^[0-9]*$/.test(item.address)) {
          address = parseInt(item.address, 10);
          fileArray.push({ data, address });
        } else {
          noNumber = true;
        }
      }
    }
    if (noNumber) {
      Message.error(t('workplace.firmware.message.address'));
      loading.value = false;
      return;
    }
    if (fileArray.length === 0) {
      Message.error(t('workplace.firmware.message.file'));
      loading.value = false;
      return;
    }

    loadingTip.value = t('workplace.device.message.tip.connecting');
    if (deviceStore.deviceStatus !== DeviceStatus.EspConnected) {
      await (device as Serial).esploaderConnect(espLoaderTerminal);
    }
    const esploader = (device as Serial).esploader;
    const transport = (device as Serial).transport;
    if (!esploader || !transport) {
      Message.error(t('workplace.serial.no.port'));
      loading.value = false;
      return;
    }

    let result;
    deviceStore.setDeviceStatus(DeviceStatus.Flashing);
    try {
      loadingTip.value = t('workplace.device.message.tip.flashing');
      const flashOptions: FlashOptions = {
        fileArray,
        flashSize: 'keep',
        eraseAll: false,
        compress: true,
        reportProgress: (fileIndex, written, total) => {
          console.log('written ', fileIndex, ' file:', (written / total) * 100);
        },
      } as FlashOptions;
      await esploader?.write_flash(flashOptions);
      result = true;
    } catch (e: any) {
      result = false;
      term.writeln(`Error: ${e.message}`);
    } finally {
      // reset device
      if (result) {
        loadingTip.value = t('workplace.device.message.tip.resetting');
        await transport?.setDTR(false);
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
        await transport?.setDTR(true);
        Message.success(t('workplace.firmware.message.flash.successful'));
      } else {
        Message.error(t('workplace.firmware.message.flash.failed'));
      }
      // 连接设备
      if (deviceStore.deviceStatus !== DeviceStatus.SerialConnected) {
        loadingTip.value = t('workplace.device.message.tip.connecting');
        await (device as Serial).connect();
      }
      device.deleteInfo();
      device.deleteAction();
      deviceStore.setCurrentModel(undefined);
      loadingTip.value = '';
      loading.value = false;
    }
  };

  const fileChangeHandler = (option: RequestOption) => {
    const { onSuccess } = option;
    onSuccess(true);
    return {};
  };

  const beforeUpload = (file: File, index: number): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (file) {
        if (index > data.value.length - 1) {
          reject();
        } else {
          const item = data.value[index];
          item.file = file;
          resolve(true);
        }
      }
    });
  };

  const beforeRemove = (index: number): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (index > data.value.length - 1) {
        reject();
      } else {
        const item = data.value[index];
        item.file = null;
        resolve(true);
      }
    });
  };

  const addFile = () => {
    data.value.push({ address: '0x1000', file: null });
  };

  const removeFile = (index: number) => {
    data.value.splice(index, 1);
  };
</script>

<style lang="less">
  .arco-list-medium .arco-list-content-wrapper .arco-list-header {
    padding: 6px 20px;
    background-color: var(--color-neutral-2);
  }
</style>

<style scoped lang="less">
  .item-card {
    width: 50%;
    min-width: 680px;
    height: 100%;
    margin: 16px;

    .list {
      margin-left: 10px;

      .list-header {
        display: flex;

        .list-header-address {
          width: 200px;
        }

        .list-header-file {
          flex: 1;
        }
      }

      .list-item {
        align-items: center;

        .list-item-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .list-item-address {
          width: 200px;
        }

        .list-item-file {
          margin: 0 auto;
          margin-left: 0;
        }
      }
    }

    .bottom {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 60px;
      margin-top: 30px;

      .flash-btn {
        margin-left: 80px;
      }
    }
  }
</style>
@/sscma
