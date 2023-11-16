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
        <a-space v-if="hasDeviceContent" direction="vertical" size="large">
          <a-space class="device-item">
            <div class="device-item-title">{{
              $t('workplace.device.name')
            }}</div>
            <div class="device-item-value">{{ deviceName }}</div>
          </a-space>
          <a-space class="device-item">
            <div class="device-item-title"
              >{{ $t('workplace.device.version') }}
            </div>
            <div class="device-item-value"> {{ deviceVersion }}</div>
          </a-space>
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
        </a-space>
        <div v-else class="device-item">
          {{ $t('workplace.device.model.nomodel') }}
        </div>
      </div>
      <div class="models-item-title">
        <a-typography-title :heading="6">{{
          $t('workplace.device.use.aimodel')
        }}</a-typography-title>
        <a-button type="primary" @click="handleShowCustomModel">{{
          $t('workplace.device.upload.aimodel')
        }}</a-button>
      </div>
      <div class="device-item">{{ $t('workplace.device.select.aimodel') }}</div>
      <swiper
        class="carousel"
        :slides-per-view="3"
        :space-between="30"
        :navigation="true"
        :modules="[Navigation]"
        :breakpoints="{
          1080: {
            slidesPerView: 3,
            spaceBetween: 30,
          },
          1920: {
            slidesPerView: 4,
            spaceBetween: 40,
          },
          3840: {
            slidesPerView: 7,
            spaceBetween: 50,
          },
        }"
      >
        <swiper-slide
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
          <div>
            <div class="carousel-item">
              <img class="carousel-item-image" :src="item.image" alt="" />
            </div>
            <div class="carousel-item-name">{{ item.name }}</div>
          </div>
        </swiper-slide>
      </swiper>
      <div
        v-if="deviceStore.currentModel?.isCustom"
        :class="[
          'custom-model-wrapper',
          { 'custom-model-selected': isSelectedCustomModel },
        ]"
        :onclick="() => handleSelectedCustomModel()"
      >
        <img :src="customModelIcon" class="custom-model-image" alt="" />
        <div class="custom-model-name">{{
          deviceStore.currentModel?.name
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
  </a-spin>
</template>

<script lang="ts" setup>
  import { Ref, ref, nextTick, computed } from 'vue';
  import { Swiper, SwiperSlide } from 'swiper/vue';
  import { useI18n } from 'vue-i18n';
  import { RequestOption, FileItem } from '@arco-design/web-vue/es/upload';
  import 'swiper/css';
  import 'swiper/css/navigation';
  import { Navigation } from 'swiper/modules';
  import { Message } from '@arco-design/web-vue';
  import { useDeviceStore } from '@/store';
  import { DeviceStatus, Bin, Model } from '@/sscma';
  import customModelIcon from '@/assets/images/custom-model.png';

  export type FileType = {
    data: Uint8Array;
    address: number;
  };

  export type FlashFirmwareParams = {
    isCustom: boolean;
    onDownloadFirmware: (bins: Bin[]) => Promise<FileType[]>;
    onHandleModel: (isCustom: boolean, files: FileType[]) => Promise<void>;
  };
  type Props = {
    deviceName: string | null;
    deviceVersion: string | null;
    onFlashFirmwareBefore: () => Promise<Record<string, any>>;
    onWriteFlash: (params: Record<string, any>) => Promise<boolean>;
    onResetDevice: (params: Record<string, any>) => Promise<void>;
    onResetFinish?: (loadingTip: Ref<string>) => Promise<void>;
    onAllFinish?: (model: Model) => void;
  };
  const props = defineProps<Props>();
  const { t } = useI18n();
  const deviceStore = useDeviceStore();

  const modalName = ref('');
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

  const hasDeviceContent = computed(() => {
    if (
      props.deviceName === null ||
      props.deviceVersion === null ||
      deviceStore.currentModel === undefined
    ) {
      return false;
    }
    return true;
  });

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

  const readFile = (blob: Blob | File): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        resolve(uint8Array);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  };

  const downloadFirmware = async (bins: Bin[]) => {
    const fileList = await Promise.all(
      bins.map(async (bin) => {
        const response = await fetch(
          `${bin.url}?timestamp=${new Date().getTime()}`
        );
        const blob = await response.blob();
        const data = await readFile(blob);
        return { data, address: bin.address };
      })
    );
    return fileList;
  };

  const downloadModel = async (model: Model) => {
    const response = await fetch(
      `${model.url}?timestamp=${new Date().getTime()}`
    );
    const blob = await response.blob();
    const data = await readFile(blob);
    return {
      data,
      address: deviceStore.firmware?.model_slots[0].address || 4194304,
    };
  };

  const handleCustomModelData = async () => {
    if (!modelFile.value) throw new Error('文件不存在');
    const data = await readFile(modelFile.value);
    const model: Model = {
      name: modalName.value,
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

  const flashFirmware = async (isCustom: boolean) => {
    loading.value = true;
    loadingTip.value = t('workplace.device.message.tip.connecting');
    const instance = await props.onFlashFirmwareBefore();
    const version = deviceStore.firmware?.version;
    const bins = deviceStore.firmware?.bins ?? [];
    const fileArray: FileType[] = [];
    if (version !== props.deviceVersion && bins.length === 0) {
      if (bins.length === 0) {
        Message.error(t('workplace.device.message.firmware.no'));
        loading.value = false;
        return;
      }
      // 下载固件
      loadingTip.value = t('workplace.device.message.tip.downloading.firmware');
      const firmwareArray = await downloadFirmware(bins);
      fileArray.push(...firmwareArray);
    }
    let finallyModel: Model | null = null;
    if (isCustom) {
      if (!modelFile.value) {
        loading.value = false;
      }
      const { model, data } = await handleCustomModelData();
      finallyModel = model;
      fileArray.push({ data, address: 0x400000 });
    } else {
      if (selectedModel.value < 0) {
        loading.value = false;
        Message.error(t('workplace.device.message.model.no'));
        return;
      }
      if (deviceStore.models.length > 0) {
        loadingTip.value = t('workplace.device.message.tip.downloading.model');
        finallyModel = deviceStore.models[selectedModel.value];
        const modelFile = await downloadModel(finallyModel);
        fileArray.push(modelFile);
      }
    }
    loadingTip.value = t('workplace.device.message.tip.flashing');
    const result = await props.onWriteFlash({ ...instance, fileArray });
    if (result) {
      loadingTip.value = t('workplace.device.message.tip.resetting');
      await props.onResetDevice({ ...instance });
      props.onResetFinish?.(loadingTip);
      if (finallyModel && props.onAllFinish) {
        props.onAllFinish(finallyModel);
      }
      loadingTip.value = '';
      loading.value = false;
    }
  };

  const handleUpload = async () => {
    if (isSelectedCustomModel.value) {
      Message.warning(t('workplace.device.message.model.current'));
      return;
    }
    if (selectedModel.value > -1) {
      const model = deviceStore.models[selectedModel.value];
      if (model.checksum === deviceStore.currentModel?.checksum) {
        Message.warning(t('workplace.device.message.model.current'));
        return;
      }
    }
    try {
      await flashFirmware(false);
    } catch (error: any) {
      console.error(error);
      Message.error(error?.message ?? '');
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
    if (modalName.value == null || modalName.value === '') {
      Message.error(t('workplace.device.message.model.name'));
      return false;
    }
    if (!modelFile.value) {
      Message.error(t('workplace.device.message.model.file'));
      return false;
    }
    if (modelObjects.value.length === 0) {
      Message.error(t('workplace.device.message.model.object'));
      return false;
    }
    flashFirmware(true);
    return true;
  };
</script>

<style scoped lang="less">
  .item-card {
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

  .carousel {
    width: 40vw;
    margin: 30px auto;
    padding: 0 45px;

    --swiper-navigation-size: 26px;
    // --swiper-navigation-color: #fff;
    .carousel-item-wrapper {
      flex-shrink: 0;
      // width: 150px;
      // height: 150px;
      border: 1px solid var(--color-neutral-3);
      border-radius: var(--border-radius-small);
      cursor: pointer;
    }

    .carousel-item {
      position: relative;
      width: 100%;
      height: 0;
      padding-bottom: 75%;

      .carousel-item-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .carousel-item-name {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 35px;
      margin: 0 5px;
      text-align: center;
    }

    .carousel-item-selected {
      border-color: rgb(var(--primary-6));
      border-width: 2px;
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

    .custom-model-name {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 25%;
      margin: 0 5px;
      text-align: center;
    }
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
</style>
@/sscma