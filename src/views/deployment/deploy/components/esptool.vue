<template>
  <div class="deployPage">
    <a-space :size="16" class="content" direction="vertical">
      <a-card :title="$t('workplace.device.card.uploadAImodel')">
        <div v-if="connected">
          <a-space direction="vertical" size="large" fill>
            <a-space>
              <a-button
                type="primary"
                status="warning"
                @click="handleDisConnect"
              >
                {{ $t('workplace.device.btn.disconnect') }}
              </a-button>
              <a-button
                type="primary"
                status="danger"
                @click="handleEraseflash"
              >
                {{ $t('workplace.device.btn.eraseflash') }}
              </a-button>
            </a-space>

            <a-space direction="vertical" class="aimodel">
              <label>{{ $t('workplace.device.card.chooseAImodel') }}</label>
              <a-space class="aimodel-button">
                <a-upload
                  :custom-request="
                    (option) => fileChangeHandler(option, FILE_TYPE.MODEL_FILE)
                  "
                  :limit="1"
                  accept=".tflite"
                  @before-remove="() => beforeRemove(FILE_TYPE.MODEL_FILE)"
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
                <a-button
                  v-if="aiModelFile"
                  type="primary"
                  :loading="aiModelUploading"
                  :disabled="binFileUploading"
                  @click="uploadModel"
                >
                  {{ $t('workplace.device.btn.upload') }}
                </a-button>
              </a-space>
            </a-space>
          </a-space>
        </div>
        <div v-else>
          <a-button
            type="primary"
            status="success"
            :loading="connecting"
            @click="handleConnect"
            >{{ $t('workplace.device.btn.connect') }}</a-button
          >
        </div>
      </a-card>

      <a-card
        v-if="connected"
        :title="$t('workplace.device.card.burnfirmware')"
      >
        <template #extra>
          <a-button
            type="primary"
            :loading="binFileUploading"
            :disabled="aiModelUploading"
            @click="burnFirmware"
          >
            {{ $t('workplace.device.btn.burn') }}
          </a-button>
        </template>
        <a-space direction="vertical" size="medium" fill>
          <a-space direction="vertical">
            <label>{{ $t('workplace.device.card.chooseBootloader') }}</label>
            <a-upload
              :custom-request="
                (option) => fileChangeHandler(option, FILE_TYPE.BOOTLOADER_FILE)
              "
              :limit="1"
              accept=".bin"
              @before-remove="() => beforeRemove(FILE_TYPE.BOOTLOADER_FILE)"
            >
              <template #upload-button>
                <div>
                  <a-button type="primary">
                    <template #icon>
                      <icon-upload />
                    </template>
                    <template #default>Bootloader</template></a-button
                  >
                </div>
              </template>
            </a-upload>
          </a-space>

          <a-space direction="vertical">
            <label>{{ $t('workplace.device.card.choosePartiontable') }}</label>
            <a-upload
              :custom-request="
                (option) =>
                  fileChangeHandler(option, FILE_TYPE.PARTIONTABLE_FILE)
              "
              :limit="1"
              accept=".bin"
              @before-remove="() => beforeRemove(FILE_TYPE.PARTIONTABLE_FILE)"
            >
              <template #upload-button>
                <div>
                  <a-button type="primary">
                    <template #icon>
                      <icon-upload />
                    </template>
                    <template #default>Partion Table</template></a-button
                  >
                </div>
              </template>
            </a-upload>
          </a-space>

          <a-space direction="vertical">
            <label>{{ $t('workplace.device.card.chooseApp') }}</label>
            <a-upload
              :custom-request="
                (option) => fileChangeHandler(option, FILE_TYPE.APP_FILE)
              "
              :limit="1"
              accept=".bin"
              @before-remove="() => beforeRemove(FILE_TYPE.APP_FILE)"
            >
              <template #upload-button>
                <div>
                  <a-button type="primary">
                    <template #icon>
                      <icon-upload />
                    </template>
                    <template #default>App</template></a-button
                  >
                </div>
              </template>
            </a-upload>
          </a-space>
        </a-space>
      </a-card>
    </a-space>
    <a-space :size="16" :align="'start'" direction="vertical" class="content">
      <div ref="terminal" class="terminal"></div>
    </a-space>
  </div>
</template>

<script lang="ts" setup>
  import { useDeviceStore } from '@/store';
  import {
    ESPLoader,
    FlashOptions,
    LoaderOptions,
    Transport,
  } from 'esptool-js';
  import { Terminal } from 'xterm';
  import 'xterm/css/xterm.css';
  import { RequestOption } from '@arco-design/web-vue/es/upload';
  import { onMounted, onBeforeUnmount, Ref, ref } from 'vue';
  import { Message } from '@arco-design/web-vue';

  const deviceStore = useDeviceStore();
  const device = deviceStore.getDevice;

  enum FILE_TYPE {
    BOOTLOADER_FILE = 1,
    PARTIONTABLE_FILE = 2,
    APP_FILE = 3,
    MODEL_FILE = 4,
  }

  const bootloaderFile: Ref<string | ArrayBuffer | null | undefined> =
    ref(null);
  const partiontableFile: Ref<string | ArrayBuffer | null | undefined> =
    ref(null);
  const appFile: Ref<string | ArrayBuffer | null | undefined> = ref(null);
  const aiModelFile: Ref<string | ArrayBuffer | null | undefined> = ref(null);

  const terminal = ref();

  const aiModelUploading = ref(false);
  const binFileUploading = ref(false);
  const connecting = ref(false);
  const connected = ref(false);

  let transport: Transport;
  // let chip: string = null;
  let esploader: ESPLoader;

  let serial: any;
  const term = new Terminal({});

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

  const handleConnect = async () => {
    // if (!connected) {
    //   serial = await device.requestDevice('serial');
    // } else {
    serial = await device.getPort();
    // }
    connecting.value = true;
    if (!serial) {
      serial = await device.requestDevice('serial');
      if (!serial) return;
    }

    transport = new Transport(serial.port);
    const flashOptions = {
      transport,
      baudrate: 115200,
      terminal: espLoaderTerminal,
    } as LoaderOptions;
    esploader = new ESPLoader(flashOptions);

    const chip = await esploader.main_fn();
    connected.value = true;
    connecting.value = false;
    // console.log('chip', chip);
  };

  onMounted(async () => {
    if (terminal.value) {
      term.open(terminal.value);
    }
    if (device.connected) {
      try {
        await device.disconnect();
        handleConnect();
      } catch (error) {
        console.log(error);
      }
    }
  });

  const handleDisConnect = async () => {
    try {
      // await device.disconnect();
      if (transport) await transport.disconnect();
    } catch (error) {
      console.log(error);
    }
  };

  onBeforeUnmount(async () => {
    handleDisConnect();
  });

  const handleEraseflash = async () => {
    try {
      await esploader.erase_flash();
    } catch (e) {
      console.error(e);
    }
  };

  const writeFlash = async (fileArray: any[]) => {
    if (!fileArray || fileArray.length === 0) {
      Message.error('Please select bin file');
      return;
    }
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
      await esploader.write_flash(flashOptions);
      result = true;
    } catch (e: any) {
      result = false;
      term.writeln(`Error: ${e.message}`);
    } finally {
      // reset device
      if (result) {
        await transport.setDTR(false);
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
        await transport.setDTR(true);
      }
    }
  };

  const uploadModel = async () => {
    const fileArray = [];
    if (aiModelFile.value) {
      const data = aiModelFile.value;
      fileArray.push({ data, address: 0x400000 });
    }
    aiModelUploading.value = true;
    await writeFlash(fileArray);
    aiModelUploading.value = false;
  };

  const burnFirmware = async () => {
    const fileArray = [];
    if (bootloaderFile.value) {
      const data = bootloaderFile.value;
      fileArray.push({ data, address: 0x0 });
    }
    if (partiontableFile.value) {
      const data = partiontableFile.value;
      fileArray.push({ data, address: 0x8000 });
    }
    if (appFile.value) {
      const data = appFile.value;
      fileArray.push({ data, address: 0x10000 });
    }
    binFileUploading.value = true;
    await writeFlash(fileArray);
    binFileUploading.value = false;
  };

  const fileChangeHandler = (option: RequestOption, type: number) => {
    const { onSuccess, fileItem } = option;
    if (fileItem.file) {
      const reader = new FileReader();
      reader.onload = (ev: ProgressEvent<FileReader>) => {
        const data = ev?.target?.result;
        if (type === FILE_TYPE.BOOTLOADER_FILE) {
          bootloaderFile.value = data;
        } else if (type === FILE_TYPE.PARTIONTABLE_FILE) {
          partiontableFile.value = data;
        } else if (type === FILE_TYPE.APP_FILE) {
          appFile.value = data;
        } else if (type === FILE_TYPE.MODEL_FILE) {
          aiModelFile.value = data;
        }
      };
      reader.readAsBinaryString(fileItem.file);
    }

    onSuccess(true);
    return {
      // abort() {},
    };
  };

  const beforeRemove = (type: number): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (type === FILE_TYPE.BOOTLOADER_FILE) {
        bootloaderFile.value = null;
      } else if (type === FILE_TYPE.PARTIONTABLE_FILE) {
        partiontableFile.value = null;
      } else if (type === FILE_TYPE.APP_FILE) {
        appFile.value = null;
      } else if (type === FILE_TYPE.MODEL_FILE) {
        aiModelFile.value = null;
      }
      resolve(true);
    });
  };
</script>

<style lang="less">
  .xterm .xterm-viewport {
    right: -15px;
  }
</style>

<style scoped lang="less">
  .deployPage {
    display: flex;

    .content {
      flex: 1;
      margin: 20px;

      .aimodel {
        width: 100%;

        .aimodel-button {
          display: flex;
          justify-content: space-between;
        }
      }

      .terminal {
        padding-left: 4px;
        background-color: black;
      }

      .title {
        padding-bottom: 20px;
        font-size: 22px;
      }
    }
  }
</style>
