<template>
  <a-spin :loading="loading" :tip="loadingTip" class="item-card">
    <a-card class="general-card" :title="$t('workplace.device.card.flasher')">
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
  import { RequestOption } from '@arco-design/web-vue/es/upload';
  import { Message } from '@arco-design/web-vue';
  import { useDeviceStore } from '@/store';
  import { deviceManager } from '@/sscma';

  const deviceStore = useDeviceStore();

  const data: Ref<
    {
      address: string;
      file: File | null;
    }[]
  > = ref([]);

  const loading = ref(false);
  const loadingTip = ref('');

  const handleEraseflash = async () => {
    loading.value = true;
    loadingTip.value = 'Connecting';
    try {
      let device = deviceManager.getDevice();
      if (device === null) {
        device = await deviceManager.requestDevice();
      }
      await device.eraseFlash();
    } catch (e) {
      console.log(e);
      Message.error(e.messsage);
    } finally {
      loadingTip.value = '';
      loading.value = false;
    }
  };

  // read file as arraybuffer
  const readFile = (file: File): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        resolve(uint8Array);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const flashFirmware = async () => {
    loading.value = true;
    const fileArray = [] as {
      data: Uint8Array;
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
      Message.error('The address is decimal or hexadecimal');
      loading.value = false;
      return;
    }
    if (fileArray.length === 0) {
      Message.error('Please select bin file');
      loading.value = false;
      return;
    }

    try {
      let device = deviceManager.getDevice();
      if (device === null) {
        device = await deviceManager.requestDevice();
      }
      for (let index = 0; index < fileArray.length; index += 1) {
        const item = fileArray[index];
        await device.flash(item.data, item.address);
      }
      device.deleteAction();
      deviceStore.setCurrentModel(undefined);
    } catch (e) {
      Message.error(e.toString());
    } finally {
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
    data.value.push({ address: '0x0000', file: null });
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
