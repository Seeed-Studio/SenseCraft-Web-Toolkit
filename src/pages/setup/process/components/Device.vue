<template>
  <a-spin :loading="loading" :tip="loadingTip" class="item-card">
    <a-card
      :class="['general-card', 'item-card']"
      :title="$t('workplace.device.title')"
    >
      <a-space
        v-if="deviceStore.deviceStatus === DeviceStatus.UnConnected"
        direction="vertical"
        size="large"
      >
        <div class="device-item"> {{ $t('workplace.device.noconnect') }} </div>
      </a-space>
      <div v-else>
        <template v-if="deviceStore.currentAvailableModel">
          <div class="device-basic-info">
            <a-space class="device-item">
              <div class="device-item-title">{{
                $t('workplace.device.id')
              }}</div>
              <div class="device-item-value">{{ deviceStore.deviceId }}</div>
            </a-space>
            <a-space class="device-item">
              <div class="device-item-title">{{
                $t('workplace.device.name')
              }}</div>
              <div class="device-item-value">{{ deviceStore.deviceName }}</div>
            </a-space>
            <a-space class="device-item">
              <div class="device-item-title"
                >{{ $t('workplace.device.version') }}
              </div>
              <div class="device-item-value">
                {{ deviceStore.deviceVersion }}</div
              >
            </a-space>
          </div>

          <div class="device-basic-info">
            <a-space class="device-item">
              <div class="device-item-title">{{
                $t('workplace.device.model.name')
              }}</div>
              <div class="device-item-value">{{
                deviceStore.currentModel?.name
              }}</div>
            </a-space>
            <a-space class="device-item">
              <div class="device-item-title"
                >{{ $t('workplace.device.model.version') }}
              </div>
              <div class="device-item-value">
                {{ deviceStore.currentModel?.version }}</div
              >
            </a-space>
          </div>

          <div
            v-if="deviceStore.isCanMqtt || deviceStore.isCanWifi"
            class="device-basic-info"
          >
            <a-space v-if="deviceStore.isCanWifi" class="device-item">
              <div class="device-item-title"
                >{{ $t('workplace.device.model.ip.address') }}
              </div>
              <span
                v-if="
                  deviceStore.deviceIPStatus ===
                  DeviceWIFIStatus.JoinedLatestConfigApplied
                "
                class="device-item-value"
              >
                {{ deviceStore.deviceIPv4Address }}</span
              >
              <span v-else class="device-item-value">-</span>
            </a-space>
            <a-space v-if="deviceStore.isCanMqtt" class="device-item">
              <div class="device-item-title"
                >{{ $t('workplace.device.model.server.state') }}
              </div>
              <div class="device-item-value">
                {{
                  $t(
                    `workplace.device.model.server.state.${deviceStore.deviceServerState}`
                  )
                }}</div
              >
            </a-space>
          </div>
        </template>
        <div v-else class="device-item">
          {{ $t('workplace.device.model.nomodel') }}
        </div>
      </div>
      <div class="models-item-title">
        <a-typography-title :heading="6">{{
          $t('workplace.device.use.aimodel')
        }}</a-typography-title>
        <a-button
          v-if="deviceStore.flashWay !== FlashWayType.ComeToSenseCraftAI"
          type="primary"
          @click="handleShowCustomModel"
          >{{ $t('workplace.device.upload.aimodel') }}</a-button
        >
      </div>
      <div
        v-if="deviceStore.flashWay !== FlashWayType.ComeToSenseCraftAI"
        class="device-item"
        >{{ $t('workplace.device.select.aimodel') }}</div
      >
      <div v-else class="device-item">{{
        $t('workplace.device.select.comeToSenseCraft')
      }}</div>
      <div
        v-if="deviceStore.flashWay !== FlashWayType.ComeToSenseCraftAI"
        class="img-container"
      >
        <div
          v-for="(item, index) in deviceStore.models"
          :key="index"
          :class="[
            'carousel-item-wrapper',
            {
              'carousel-item-selected':
                selectedModel === index && !isSelectedCustomModel,
            },
          ]"
          :onclick="() => handleSelectedModel(index)"
          :virtual-index="index"
        >
          <a-popover position="top">
            <template #content>
              <a-descriptions
                style="width: 400px; margin-top: 20px"
                :data="getModelHoverData(item)"
                size="medium"
                :column="1"
              />
            </template>
            <div class="carousel-container">
              <div class="carousel-item">
                <img class="carousel-item-image" :src="item.image" alt="" />
              </div>
              <span class="carousel-item-name">{{ item.name }}</span>
            </div>
          </a-popover>
        </div>
      </div>

      <div
        v-if="deviceStore.flashWay === FlashWayType.ComeToSenseCraftAI"
        class="come-to-sense-craft-ai custom-model-selected"
      >
        <img :src="deviceStore.comeToSenseCraftAI.model.modelImg" alt="" />
        <span>{{ deviceStore.comeToSenseCraftAI.model.name }}</span>
      </div>

      <div
        v-if="deviceStore.flashWay === FlashWayType.Custom"
        :class="[
          'custom-model-wrapper',
          { 'custom-model-selected': isSelectedCustomModel },
        ]"
        :onclick="() => handleSelectedCustomModel()"
      >
        <img
          :src="deviceStore?.currentModel?.modelImg ?? customModelIcon"
          class="custom-model-image"
          alt=""
        />
        <div class="custom-model-name">{{
          modalName ?? deviceStore.currentModel?.name
        }}</div>
      </div>
      <div class="bottom">
        <a-button type="primary" @click="handleUpload">{{
          $t('workplace.device.send')
        }}</a-button>
      </div>
    </a-card>

    <a-modal
      v-model:visible="modalVisible"
      :title="$t('workplace.device.model.aimodel')"
      :ok-text="$t('workplace.device.model.sendmodel')"
      :on-before-ok="handleCustomModelOk"
      @cancel="handleCustomModelCancel"
    >
      <a-row>
        <a-col :span="6" class="grid-left">
          <div>{{ $t('workplace.device.model.name') }}</div>
        </a-col>
        <a-col :span="18">
          <a-input
            v-model="modalName"
            :placeholder="$t('workplace.device.model.name')"
          />
        </a-col>
      </a-row>
      <a-row>
        <a-col :span="6" class="grid-left">
          <div>{{ $t('workplace.device.model.file') }}</div>
        </a-col>
        <a-col :span="18">
          <a-upload
            :custom-request="fileChangeHandler"
            :limit="1"
            accept=".tflite,.lite"
            @before-upload="beforeUpload"
            @before-remove="beforeRemove"
          >
            <template #upload-button>
              <div>
                <a-button type="primary">
                  <template #icon>
                    <icon-upload />
                  </template>
                  <template #default>{{
                    $t('workplace.device.card.chooseAImodel')
                  }}</template>
                </a-button>
              </div>
            </template>
          </a-upload>
        </a-col>
      </a-row>
      <a-row>
        <a-col :span="6" class="grid-left">
          <div>ID:{{ $t('workplace.device.model.object') }}</div>
        </a-col>
        <a-col :span="18">
          <a-space wrap>
            <a-tag
              v-for="(tag, index) of modelObjects"
              :key="tag"
              closable
              @close="handleRemove(tag)"
            >
              {{ index + ':' + tag }}
            </a-tag>
            <a-input
              v-if="showInput"
              ref="inputRef"
              v-model.trim="inputVal"
              :style="{ width: '90px' }"
              size="mini"
              @keyup.enter="handleAdd"
              @blur="handleAdd"
            />
            <a-tag
              v-else
              :style="{
                backgroundColor: 'var(--color-fill-2)',
                border: '1px dashed var(--color-fill-3)',
                cursor: 'pointer',
              }"
              @click="handleAddClass"
            >
              <template #icon>
                <icon-plus />
              </template>
              {{ $t('workplace.device.model.add.object') }}
            </a-tag>
          </a-space>
        </a-col>
      </a-row>
    </a-modal>
    <a-modal
      v-model:visible="visible"
      :closable="false"
      :ok-text="$t('confirm')"
      :cancel-text="$t('cancel')"
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <p>{{ $t('workplace.serial.device.flash.confirm') }}</p>
    </a-modal>
  </a-spin>
</template>

<script lang="ts" setup>
  import { ref, nextTick, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { RequestOption, FileItem } from '@arco-design/web-vue/es/upload';
  import 'swiper/css';
  import 'swiper/css/navigation';
  import { DescData, Message } from '@arco-design/web-vue';
  import { encode } from 'js-base64';
  import { useDeviceStore } from '@/store';
  import { DeviceStatus, Bin, Model } from '@/sscma';
  import customModelIcon from '@/assets/images/custom-model.png';
  import FlasherInterface from '@/sscma/FlasherInterface';
  import useDeviceManager from '@/hooks/deviceManager';
  import { FlashWayType, DeviceWIFIStatus } from '@/store/modules/device';
  import { flashErrorHandle } from '@/utils/flash';

  export type FileType<T> = {
    data: T;
    address: number;
  };

  type Props = {
    flasher: FlasherInterface;
    readFile: (blob: Blob | File) => Promise<unknown>;
  };
  const props = defineProps<Props>();
  const { t } = useI18n();
  const deviceStore = useDeviceStore();
  const { device, term } = useDeviceManager();
  const modalName = ref<undefined | string>();
  const modalVisible = ref(false);
  const inputRef = ref(null);
  const showInput = ref(false);
  const inputVal = ref('');
  const modelObjects = ref<string[]>([]);
  const modelFile = ref<File | null>(null);
  const loading = ref(false);
  const loadingTip = ref('');
  const selectedModel = ref(-1);
  const isSelectedCustomModel = ref(false);
  const isComeToFlashFinished = ref(false);
  const visible = ref<boolean>(false);
  const getModelHoverData = (item: Model): DescData[] => [
    {
      label: 'Name',
      value: item.name,
    },
    {
      label: 'Algorithm',
      value: item.algorithm ?? '',
    },
    {
      label: 'Category',
      value: item.category,
    },
    {
      label: 'Model Type',
      value: item.model_type ?? '',
    },
    {
      label: 'License',
      value: item.license ?? '',
    },
    {
      label: 'Version',
      value: item.version,
    },
    {
      label: 'Description',
      value: item.description ?? '',
    },
  ];

  const handleSelectedModel = (index: number) => {
    selectedModel.value = index;
    isSelectedCustomModel.value = false;
  };

  const handleSelectedCustomModel = () => {
    selectedModel.value = -1;
    isSelectedCustomModel.value = true;
  };

  const handleShowCustomModel = () => {
    modalVisible.value = true;
  };

  const handleCustomModelCancel = () => {
    modalVisible.value = false;
  };

  const downloadFirmware = async (bins: Bin[]) => {
    const fileList = await Promise.all(
      bins.map(async (bin) => {
        const response = await fetch(
          `${bin.url}?timestamp=${new Date().getTime()}`
        );
        const blob = await response.blob();
        const data = await props.readFile(blob);
        return { data, address: bin.address };
      })
    );
    return fileList;
  };

  const downloadModel = async (url: string) => {
    const response = await fetch(`${url}?timestamp=${new Date().getTime()}`);
    const blob = await response.blob();
    const data = await props.readFile(blob);
    return {
      data,
      address: deviceStore.firmware?.model_slots[0].address || 1024 * 1024,
    };
  };

  const handleCustomModelData = async () => {
    if (!modelFile.value) throw new Error('文件不存在');
    const data = await props.readFile(modelFile.value);
    const model: Model = {
      name: modalName.value ?? '',
      version: '1.0.0',
      category: 'Object Detection',
      model_type: 'TFLite',
      algorithm: 'YOLO',
      description: 'Custom Model',
      classes: modelObjects.value,
      size: modelFile.value.size.toString(),
      isCustom: true,
    };
    return { data, model };
  };

  const flashFirmware = async () => {
    loading.value = true;
    loadingTip.value = t('workplace.device.message.tip.connecting');
    await props.flasher.writeFlashBefore();
    const version = deviceStore.firmware?.version;
    const bins = deviceStore.firmware?.bins ?? [];
    const fileArray = [];
    const currentVersion = deviceStore.deviceVersion;
    if (!currentVersion || version !== currentVersion) {
      if (bins.length === 0) {
        throw new Error(t('workplace.device.message.firmware.no'));
      }
      // 下载固件
      loadingTip.value = t('workplace.device.message.tip.downloading.firmware');
      const firmwareArray = await downloadFirmware(bins);
      fileArray.push(...firmwareArray);
    }
    let finallyModel: Model | null = null;
    if (deviceStore.flashWay === FlashWayType.Custom) {
      if (!modelFile.value) {
        loading.value = false;
      }
      const { model, data } = await handleCustomModelData();
      finallyModel = model;
      fileArray.push({ data, address: 0x400000 });
    } else if (deviceStore.flashWay === FlashWayType.ComeToSenseCraftAI) {
      const modelFile = await downloadModel(
        deviceStore.comeToSenseCraftAI.modelUrl
      );
      finallyModel = deviceStore.comeToSenseCraftAI.model;
      fileArray.push(modelFile);
    } else {
      if (selectedModel.value < 0) {
        throw new Error(t('workplace.device.message.model.no'));
      }
      if (deviceStore.models.length > 0) {
        loadingTip.value = t('workplace.device.message.tip.downloading.model');
        finallyModel = deviceStore.models[selectedModel.value];
        if (finallyModel?.url) {
          const modelFile = await downloadModel(finallyModel.url);
          fileArray.push(modelFile);
        }
      }
    }
    loadingTip.value = t('workplace.device.message.tip.flashing');
    deviceStore.setDeviceStatus(DeviceStatus.Flashing);
    deviceStore.setCurrentAvailableModel(false);
    const result = await props.flasher.onWriteFlash(fileArray);
    if (result) {
      if (props.flasher.isNeedResetDevice) {
        loadingTip.value = t('workplace.device.message.tip.resetting');
        await props.flasher.onResetDevice();
      }
      if (props.flasher.isNeedConnectDevice) {
        await props.flasher.onConnectDevice();
      }

      if (finallyModel) {
        const info = encode(JSON.stringify(finallyModel));
        await device.value?.setInfo(info);
        await device.value?.deleteAction();
        deviceStore.setCurrentModel(finallyModel);
      }
      deviceStore.setDeviceStatus(DeviceStatus.SerialConnected);
    } else {
      await device.value.disconnect();
    }
    loadingTip.value = '';
    loading.value = false;
  };

  const comeToSenseCraftAIFlash = async () => {
    try {
      await flashFirmware();
      isComeToFlashFinished.value = true;
    } catch (error: any) {
      flashErrorHandle(error);
    } finally {
      loadingTip.value = '';
      loading.value = false;
    }
  };

  const handleUpload = async () => {
    if (deviceStore.flashWay === FlashWayType.ComeToSenseCraftAI) {
      if (isComeToFlashFinished.value) {
        Message.warning(t('workplace.device.message.model.current'));
      } else {
        await comeToSenseCraftAIFlash();
      }
      return;
    }
    if (isSelectedCustomModel.value) {
      Message.warning(t('workplace.device.message.model.current'));
      return;
    }
    if (selectedModel.value > -1) {
      const model = deviceStore.models[selectedModel.value];
      if (
        deviceStore.currentAvailableModel &&
        model.uuid &&
        model.uuid === deviceStore.currentModel?.uuid
      ) {
        Message.warning(t('workplace.device.message.model.current'));
        return;
      }
    }
    try {
      deviceStore.setFlashWay(FlashWayType.Prefabricated);
      await flashFirmware();
    } catch (error: any) {
      console.error(error);
      flashErrorHandle(error);
      term.writeln(`Error: ${error?.message}`);
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

  const beforeUpload = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      if (file) {
        modelFile.value = file;
        resolve(true);
      }
    });
  };

  const beforeRemove = (fileItem: FileItem): Promise<boolean> => {
    return new Promise((resolve) => {
      const file = fileItem.file;
      if (file) {
        modelFile.value = null;
        resolve(true);
      }
    });
  };

  const handleAddClass = () => {
    showInput.value = true;
    nextTick(() => {
      if (inputRef.value) {
        (inputRef.value as HTMLElement).focus();
      }
    });
  };

  const handleAdd = () => {
    if (inputVal.value) {
      modelObjects.value.push(inputVal.value);
      inputVal.value = '';
    }
    showInput.value = false;
  };

  const handleRemove = (key: any) => {
    modelObjects.value = modelObjects.value.filter((tag) => tag !== key);
  };

  const handleCustomModelOk = async () => {
    try {
      if (modalName.value == null || modalName.value === '') {
        throw new Error(t('workplace.device.message.model.name'));
      }
      if (!modelFile.value) {
        throw new Error(t('workplace.device.message.model.file'));
      }
      if (modelObjects.value.length === 0) {
        throw new Error(t('workplace.device.message.model.object'));
      }
      deviceStore.setFlashWay(FlashWayType.Custom);
      await flashFirmware();
      return true;
    } catch (error: any) {
      console.error(error);
      flashErrorHandle(error);
    } finally {
      loadingTip.value = '';
      loading.value = false;
    }
    return false;
  };

  const handleOk = () => {
    comeToSenseCraftAIFlash();
    visible.value = false;
  };

  const handleCancel = () => {
    visible.value = false;
  };

  watch(
    () => deviceStore.currentModel,
    (model?: Model | null) => {
      if (model?.isCustom) {
        isSelectedCustomModel.value = model?.isCustom;
      } else if (model?.uuid && deviceStore.currentAvailableModel) {
        const index = deviceStore.models?.findIndex(
          (e) => e.uuid === model.uuid
        );
        selectedModel.value = index;
      }
    }
  );

  watch(
    () => deviceStore.flashWay,
    async () => {
      if (
        deviceStore.flashWay === FlashWayType.ComeToSenseCraftAI &&
        !isComeToFlashFinished.value
      ) {
        visible.value = true;
      }
    }
  );
</script>

<style scoped lang="less">
  .item-card {
    width: 100%;
    height: 100%;

    .device-item {
      padding-left: 10px;
    }

    .device-item-title {
      width: 120px;
    }

    .device-item-value {
      color: rgb(var(--success-6));
    }
  }

  .models-item-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 30px;
  }

  .item-card-bottom {
    flex: 1;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  .slidePrevClass {
    width: 10px;
  }

  .img-container {
    display: flex;
    flex-flow: row wrap;
    gap: 10px;
    max-height: 500px;
    margin: 20px 0;
    overflow-y: auto;
  }

  .carousel-item-wrapper {
    flex-shrink: 0;
    width: 150px;
    border: 2px solid var(--color-neutral-3);
    border-radius: var(--border-radius-small);
    cursor: pointer;
  }

  .carousel-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
  }

  .carousel-item {
    width: 100%;

    .carousel-item-image {
      width: 148px;
      height: 115px;
      object-fit: cover;
    }
  }

  .carousel-item-name {
    padding: 10px 5px;
  }

  .carousel-item-selected {
    border-color: rgb(var(--primary-6));
    border-width: 2px;
  }

  .come-to-sense-craft-ai {
    display: flex;
    flex-direction: column;
    width: 150px;
    margin-top: 10px;
    overflow: hidden;
    border: 1px solid var(--color-neutral-3);
    border-radius: var(--border-radius-small);

    img {
      width: 150px;
      height: 112.5px;
      object-fit: cover;
    }

    span {
      align-self: center;
      padding: 10px 0;
    }
  }

  .custom-model-wrapper {
    width: 150px;
    height: 150px;
    margin-left: 45px;
    border: 1px solid var(--color-neutral-3);
    border-radius: var(--border-radius-small);

    .custom-model-image {
      width: 100%;
      height: 75%;
    }
  }

  .custom-model-name {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 25%;
    margin: 0 5px;
    text-align: center;
  }

  .custom-model-selected {
    border-color: rgb(var(--primary-6));
    border-width: 2px;
  }

  .bottom {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 60px;
  }

  .grid-left {
    height: 48px;
    color: var(--color-text-2);
  }

  .device-basic-info {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 15px;
    padding: 15px;
    background-color: var(--color-fill-1);
    border-radius: 3px;
  }
</style>
@/sscma
