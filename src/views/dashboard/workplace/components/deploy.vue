<template>
  <div class="deployPage">
    <a-card
      class="general-card"
      :title="$t('workplace.device.card.burnfirmware')"
    >
      <template #extra>
        <a-button type="primary" status="danger" @click="handleEraseflash">
          {{ $t('workplace.device.btn.eraseflash') }}
        </a-button>
        <a-button
          v-if="haveBurnFile"
          class="burn-btn"
          type="primary"
          :loading="binFileUploading"
          @click="burnFirmware"
        >
          {{ $t('workplace.device.btn.burn') }}
        </a-button>
      </template>
      <a-space direction="vertical" size="large" fill>
        <a-space direction="vertical" size="mini" class="aimodel">
          <label>{{ $t('workplace.device.card.chooseAImodel') }}</label>
          <a-space class="aimodel-button">
            <a-upload
              :custom-request="fileChangeHandler"
              :limit="1"
              accept=".tflite"
              @before-upload="
                (file) => beforeUpload(file, FILE_TYPE.MODEL_FILE)
              "
              @before-remove="
                (fileItem) => beforeRemove(fileItem, FILE_TYPE.MODEL_FILE)
              "
            >
              <template #upload-button>
                <div>
                  <a-button type="primary">
                    <template #icon>
                      <icon-upload />
                    </template>
                    <template #default>{{
                      $t('workplace.device.card.aimodel')
                    }}</template>
                  </a-button>
                </div>
              </template>
            </a-upload>
          </a-space>
        </a-space>

        <a-space direction="vertical" size="mini" class="aimodel">
          <label>{{ $t('workplace.device.card.chooseBootloader') }}</label>
          <a-space>
            <a-upload
              :custom-request="fileChangeHandler"
              multiple
              :limit="3"
              accept=".bin"
              @before-upload="
                (file) => beforeUpload(file, FILE_TYPE.FIRMWARE_FILE)
              "
              @before-remove="
                (fileItem) => beforeRemove(fileItem, FILE_TYPE.FIRMWARE_FILE)
              "
            >
              <template #upload-button>
                <div>
                  <a-button type="primary">
                    <template #icon>
                      <icon-upload />
                    </template>
                    <template #default>{{
                      $t('workplace.device.card.binFile')
                    }}</template></a-button
                  >
                </div>
              </template>
            </a-upload>
          </a-space>
        </a-space>
      </a-space>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
  import { computed, Ref, ref } from 'vue';
  import { FlashOptions } from 'esptool-js';
  import { Terminal } from 'xterm';
  import { RequestOption, FileItem } from '@arco-design/web-vue/es/upload';
  import { Message } from '@arco-design/web-vue';
  import { useDeviceStore } from '@/store';
  import { DEVICESTATUS } from '@/senseCraft';
  import Serial from '@/senseCraft/serial';
  import deviceManager from '@/senseCraft/deviceManager';

  const props = defineProps({
    term: {
      type: Terminal,
      default: null,
    },
  });

  const deviceStore = useDeviceStore();
  const { device } = deviceManager;
  enum FILE_TYPE {
    FIRMWARE_FILE = 1,
    MODEL_FILE = 2,
  }

  const bootloaderFile: Ref<File | null> = ref(null);
  const partiontableFile: Ref<File | null> = ref(null);
  const appFile: Ref<File | null> = ref(null);
  const aiModelFile: Ref<File | null> = ref(null);

  const binFileUploading = ref(false);

  const espLoaderTerminal = {
    clean() {
      props.term.clear();
    },
    writeLine(data: string) {
      props.term.writeln(data);
    },
    write(data: string) {
      props.term.write(data);
    },
  };

  const haveBurnFile = computed(() => {
    return (
      bootloaderFile.value ||
      partiontableFile.value ||
      appFile.value ||
      aiModelFile.value
    );
  });

  const handleEraseflash = async () => {
    try {
      if (deviceStore.connectStatus !== DEVICESTATUS.ESPCONNECTED) {
        await (device as Serial).esploaderConnect(espLoaderTerminal);
      }
      const esploader = (device as Serial).esploader;
      await esploader?.erase_flash();
    } catch (e) {
      console.error(e);
    }
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

  const burnFirmware = async () => {
    if (deviceStore.connectStatus !== DEVICESTATUS.ESPCONNECTED) {
      await (device as Serial).esploaderConnect(espLoaderTerminal);
    }
    const esploader = (device as Serial).esploader;
    const transport = (device as Serial).transport;

    const fileArray = [];
    if (aiModelFile.value) {
      const data = await readFile(aiModelFile.value);
      fileArray.push({ data, address: 0x400000 });
    }
    if (bootloaderFile.value) {
      const data = await readFile(bootloaderFile.value);
      fileArray.push({ data, address: 0x0 });
    }
    if (partiontableFile.value) {
      const data = await readFile(partiontableFile.value);
      fileArray.push({ data, address: 0x8000 });
    }
    if (appFile.value) {
      const data = await readFile(appFile.value);
      fileArray.push({ data, address: 0x10000 });
    }

    if (fileArray.length === 0) {
      Message.error('Please select bin file');
      return;
    }
    binFileUploading.value = true;
    let result;
    try {
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
      props.term.writeln(`Error: ${e.message}`);
    } finally {
      // reset device
      if (result) {
        await transport?.setDTR(false);
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
        await transport?.setDTR(true);
      }
    }
    binFileUploading.value = false;
  };

  const fileChangeHandler = (option: RequestOption) => {
    const { onSuccess } = option;
    onSuccess(true);
    return {};
  };

  const beforeUpload = (file: File, type: number): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (file) {
        const size = file.size;
        const reader = new FileReader();
        reader.onload = (ev: ProgressEvent<FileReader>) => {
          const data = ev?.target?.result as string;
          let wrongFile = false;
          if (type === FILE_TYPE.MODEL_FILE) {
            aiModelFile.value = file;
          } else if (type === FILE_TYPE.FIRMWARE_FILE) {
            if (
              data.indexOf('abort() was called at PC 0x%08') > -1 &&
              size < 100 * 1024
            ) {
              if (bootloaderFile.value) {
                Message.error('The same file exists');
                wrongFile = true;
              } else {
                bootloaderFile.value = file;
              }
            } else if (
              data.indexOf('factory') > -1 &&
              data.indexOf('nvs') > -1 &&
              size < 10 * 1024
            ) {
              if (partiontableFile.value) {
                Message.error('The same file exists');
                wrongFile = true;
              } else {
                partiontableFile.value = file;
              }
            } else if (
              data.indexOf('esp_hw_support') > -1 &&
              size < 4 * 1024 * 1024
            ) {
              if (appFile.value) {
                Message.error('The same file exists');
                wrongFile = true;
              } else {
                appFile.value = file;
              }
            } else {
              Message.error('Wrong file format!');
              wrongFile = true;
            }
          }
          if (wrongFile) {
            reject();
          } else {
            resolve(true);
          }
        };
        reader.readAsBinaryString(file);
      } else {
        reject();
      }
    });
  };

  const beforeRemove = (fileItem: FileItem, type: number): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const file = fileItem.file;
      if (file) {
        if (type === FILE_TYPE.MODEL_FILE) {
          aiModelFile.value = null;
        } else if (type === FILE_TYPE.FIRMWARE_FILE) {
          if (
            file.name === bootloaderFile.value?.name &&
            file.size === bootloaderFile.value?.size
          ) {
            bootloaderFile.value = null;
          } else if (
            file.name === partiontableFile.value?.name &&
            file.size === partiontableFile.value?.size
          ) {
            partiontableFile.value = null;
          } else if (
            file.name === appFile.value?.name &&
            file.size === appFile.value?.size
          ) {
            appFile.value = null;
          }
        }
        resolve(true);
      }
    });
  };
</script>

<style scoped lang="less">
  .deployPage {
    width: 100%;

    .burn-btn {
      margin-left: 10px;
    }

    .aimodel {
      width: 100%;
      margin-bottom: 5px;

      .aimodel-button {
        display: flex;
        justify-content: space-between;
      }
    }
  }
</style>
