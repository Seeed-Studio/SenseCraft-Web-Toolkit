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
        <div class="device-item"> Please connect the device to your PC </div>
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
          Your device does not have a deployment model, please select a model
          and click the send button
        </div>
      </div>
      <div class="models-item-title">
        <a-typography-title :heading="6"
          >Ready to use AI models</a-typography-title
        >
        <a-button type="primary" @click="handleShowCustomModel"
          >Upload Custom AI Model</a-button
        >
      </div>
      <div class="device-item"
        >Please select an preset AI model or upload custom AI Model</div
      >
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
              <img class="carousel-item-image" :src="item.image" />
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
        <img :src="customModelIcon" class="custom-model-image" />
        <div class="custom-model-name">{{
          deviceStore.currentModel?.name
        }}</div>
      </div>
      <div class="bottom">
        <a-button type="primary" @click="handleUpload">Send</a-button>
      </div>
    </a-card>

    <a-modal
      v-model:visible="modalVisible"
      title="Custom AI Model"
      ok-text="Send Model"
      :on-before-ok="handleCustomModelOk"
      @cancel="handleCustomModelCancel"
    >
      <a-row>
        <a-col :span="6" class="grid-left">
          <div>Model Name</div>
        </a-col>
        <a-col :span="18">
          <a-input v-model="modalName" placeholder="please enter model name" />
        </a-col>
      </a-row>
      <a-row>
        <a-col :span="6" class="grid-left">
          <div>Model File</div>
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
          <div>ID:Object</div>
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
              Add Object
            </a-tag>
          </a-space>
        </a-col>
      </a-row>
    </a-modal>
  </a-spin>
</template>

<script lang="ts" setup>
  import { Ref, ref, nextTick, computed, onMounted, watch } from 'vue';
  import { Swiper, SwiperSlide } from 'swiper/vue';
  import { RequestOption, FileItem } from '@arco-design/web-vue/es/upload';
  import 'swiper/css';
  import 'swiper/css/navigation';
  import { Navigation } from 'swiper/modules';
  import { Message } from '@arco-design/web-vue';
  import { useDeviceStore } from '@/store';
  import { DeviceStatus, Bin, Model } from '@/sscma';
  import deviceManager from '@/sscma/deviceManager';
  import customModelIcon from '@/assets/images/custom-model.png';

  const deviceStore = useDeviceStore();

  const loading = ref(false);
  const loadingTip = ref('');
  const selectedModel = ref(-1);
  const isSelectedCustomModel = ref(false);
  const deviceName: Ref<string | null> = ref('');
  const deviceVersion: Ref<string | null> = ref('');

  // custom model
  const modalVisible = ref(false);
  const modalName = ref('');
  const modelFile: Ref<File | null> = ref(null);
  const modelObjects: Ref<string[]> = ref([]);
  const inputRef = ref(null);
  const showInput = ref(false);
  const inputVal = ref('');

  const hasDeviceContent = computed(() => {
    // if (
    //   deviceName.value === null ||
    //   deviceVersion.value === null ||
    //   deviceStore.currentModel === undefined
    // ) {
    //   console.log('deviceName.value', deviceName.value);
    //   console.log('deviceVersion.value', deviceVersion.value);
    //   console.log('deviceStore.currentModel', deviceStore.currentModel);
    //   return false;
    // }
    return true;
  });

  const readFile = (blob: Blob | File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev: ProgressEvent<FileReader>) => {
        const data = ev?.target?.result as string;
        resolve(data);
      };
      reader.readAsBinaryString(blob);
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

  const flashFirmware = async (isCustom = false) => {};

  const handleSelectedModel = (index: number) => {
    selectedModel.value = index;
    isSelectedCustomModel.value = false;
  };

  const handleSelectedCustomModel = () => {
    selectedModel.value = -1;
    isSelectedCustomModel.value = true;
  };

  const handleUpload = async () => {};

  const handelRefresh = async (deviceStatus: DeviceStatus) => {
    if (deviceStatus === DeviceStatus.SerialConnected) {
      const device = deviceManager.getDevice();
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
      } finally {
        deviceStore.setReady(true);
      }
    }
  };

  const handleShowCustomModel = () => {
    modalVisible.value = true;
  };

  const handleCustomModelOk = async () => {
    if (modalName.value == null || modalName.value === '') {
      Message.error('Please enter modal name');
      return false;
    }
    if (!modelFile.value) {
      Message.error('Please choose modal file');
      return false;
    }
    if (modelObjects.value.length === 0) {
      Message.error('Please enter at least one object');
      return false;
    }
    flashFirmware(true);
    return true;
  };

  const handleCustomModelCancel = () => {
    modalVisible.value = false;
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

  onMounted(() => {
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
            deviceStore.setFirmware(firmwares[0]);
          }
        });
    }
    handelRefresh(deviceStore.deviceStatus);
  });

  watch(
    () => deviceStore.deviceStatus,
    async (val) => {
      handelRefresh(val);
    }
  );

  watch(
    () => deviceStore.currentModel,
    (currentModel) => {
      if (currentModel?.isCustom) {
        isSelectedCustomModel.value = currentModel?.isCustom;
      } else {
        const index = deviceStore.models.findIndex((model) => {
          return model.uuid === currentModel?.uuid;
        });
        selectedModel.value = index;
      }
    }
  );
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
