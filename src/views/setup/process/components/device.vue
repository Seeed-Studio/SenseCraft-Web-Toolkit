<template>
  <a-spin :loading="loading" :tip="loadingTip" class="item-card">
    <a-card :class="['general-card', 'item-card']" :title="$t('workplace.device.title')">
      <a-space direction="vertical" size="large">
        <a-space class="device-item">
          <div class="device-item-title">{{ $t('workplace.device.name') }}</div>
          <div class="device-item-value">{{ deviceName }}</div>
        </a-space>
        <a-space class="device-item">
          <div class="device-item-title">{{ $t('workplace.device.version') }} </div>
          <div class="device-item-value"> {{ deviceVersion }}</div>
        </a-space>
        <a-space class="device-item">
          <div class="device-item-title">{{ $t('workplace.device.model.name') }}</div>
          <div class="device-item-value">{{ deviceStore.currentModel?.name }}</div>
        </a-space>
        <a-space class="device-item">
          <div class="device-item-title">{{ $t('workplace.device.model.version') }} </div>
          <div class="device-item-value"> {{ deviceStore.currentModel?.version }}</div>
        </a-space>
      </a-space>
      <a-typography-title class="models-item-title" :heading="6">Ready to use AI models</a-typography-title>
      <div class="device-item">Please select an preset AI model or
        <!-- <span class="ai-label">Upload Custom AI Model</span> -->
        <a-button type="primary" @click="handleShowCustomModel">Upload Custom AI Model</a-button>
      </div>
      <swiper class="carousel" :slides-per-view="3" :space-between="50" :navigation="true" :modules="[Navigation]">
        <swiper-slide v-for="(item, index) in deviceStore.models"
          :class="['carousel-item', { 'carousel-item-selected': selectedModel === index }]" :key="index"
          :onclick="() => handleSelectedModel(index)" :virtualIndex="index">
          <img :src="item.image" class="carousel-item-image" />
          <div class="carousel-item-name">{{ item.name }}</div>
        </swiper-slide>
      </swiper>
      <div v-if="deviceStore.currentModel?.isCustom" class="custom-model-wrapper">
        <img :src="customModelIcon" class="custom-model-image" />
        <div class="custom-model-name">{{ deviceStore.currentModel?.name }}</div>
      </div>
      <div class="bottom">
        <a-button type="primary" @click="handleUpload">Send</a-button>
      </div>
    </a-card>

    <a-modal v-model:visible="modalVisible" title="Custom AI Model" @cancel="handleCustomModelCancel"
      :on-before-ok="handleCustomModelOk">
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
          <a-upload :custom-request="fileChangeHandler" :limit="1" accept=".tflite" @before-upload="beforeUpload"
            @before-remove="beforeRemove">
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
            <a-tag v-for="(tag, index) of modelObjects" :key="tag" closable @close="handleRemove(tag)">
              {{ index + ':' + tag }}
            </a-tag>
            <a-input v-if="showInput" ref="inputRef" :style="{ width: '90px' }" size="mini" v-model.trim="inputVal"
              @keyup.enter="handleAdd" @blur="handleAdd" />
            <a-tag v-else :style="{
              backgroundColor: 'var(--color-fill-2)',
              border: '1px dashed var(--color-fill-3)',
              cursor: 'pointer',
            }" @click="handleAddClass">
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
import { Ref, ref, nextTick, onMounted, watch, reactive } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { RequestOption, FileItem } from '@arco-design/web-vue/es/upload';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import { FlashOptions } from 'esptool-js';
import { Message } from '@arco-design/web-vue';
import { useDeviceStore } from '@/store';
import { DEVICESTATUS, Serial, Bin, Model } from '@/senseCraft';
import deviceManager from '@/senseCraft/deviceManager';
import customModelIcon from '@/assets/images/custom-model.png';

const { device, term } = deviceManager;
const deviceStore = useDeviceStore();

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

const loading = ref(false);
const loadingTip = ref('');
const selectedModel = ref(-1);
const deviceName = ref('');
const deviceVersion = ref('');

// custom model
const modalVisible = ref(false);
const modalName = ref('');
const modelFile: Ref<File | null> = ref(null);
const modelObjects: Ref<string[]> = ref([]);
const inputRef = ref(null);
const showInput = ref(false);
const inputVal = ref('');

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
  const fileList = await Promise.all(bins.map(async (bin) => {
    const response = await fetch(`${bin.url}?timestamp=${new Date().getTime()}`);
    const blob = await response.blob();
    const data = await readFile(blob);
    return { data, address: bin.address };
  }))
  return fileList
}

const downloadModel = async (model: Model) => {
  const response = await fetch(`${model.url}?timestamp=${new Date().getTime()}`);
  const blob = await response.blob();
  const data = await readFile(blob);
  return { data, address: deviceStore.firmware?.model_slots[0].address || 4194304 };
}

const burnFirmware = async (isCustom = false) => {
  loading.value = true;
  loadingTip.value = 'connecting';
  if (deviceStore.connectStatus !== DEVICESTATUS.ESPCONNECTED) {
    await (device as Serial).esploaderConnect(espLoaderTerminal);
  }
  const esploader = (device as Serial).esploader;
  const transport = (device as Serial).transport;
  if (!esploader || !transport) {
    Message.error('No port selected by the user');
    loading.value = false;
    return
  }
  let fileArray = [] as {
    data: string;
    address: number;
  }[];
  const version = deviceStore.firmware?.version;
  if (version !== deviceVersion.value) {
    const bins = deviceStore.firmware?.bins;
    if (!bins || bins.length === 0) {
      Message.error('No firmware');
      loading.value = false;
      return
    }
    // 下载固件
    loadingTip.value = 'downloading firmware';
    const firmwareArray = await downloadFirmware(bins);
    fileArray = fileArray.concat(firmwareArray)
  }

  // 模型对象
  let model;
  if (isCustom) {
    if (!modelFile.value) {
      loading.value = false;
      return
    }
    const data = await readFile(modelFile.value);
    fileArray.push({ data, address: 0x400000 });
    model = {
      "name": modalName.value,
      "version": "1.0.0",
      "category": "Object Detection",
      "model_type": "TFLite",
      "algorithm": "YOLO",
      "description": "Custom Model",
      "classes": modelObjects.value,
      "size": modelFile.value.size.toString(),
      "isCustom": true,
    }
  } else {
    if (selectedModel.value < 0) {
      loading.value = false;
      Message.error('Please select a model');
      return
    }
    if (deviceStore.models.length > 0) {
      loadingTip.value = 'downloading model';
      model = deviceStore.models[selectedModel.value];
      const modelfile = await downloadModel(model);
      fileArray.push(modelfile)
    }
  }

  let result;
  try {
    loadingTip.value = 'burning';
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
    // 烧录完重置设备
    if (result) {
      loadingTip.value = 'resetting';
      await transport?.setDTR(false);
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
      await transport?.setDTR(true);
    }
    // 连接设备
    if (deviceStore.connectStatus !== DEVICESTATUS.SERIALCONNECTED) {
      loadingTip.value = 'connecting';
      await (device as Serial).connect();
    }
    if (model) {
      try {
        const info = btoa(JSON.stringify(model));
        device.setInfo(info);
        device.deleteAction();
        deviceStore.setCurrentModel(model);
      } catch (error) {
        console.log(error)
      }
    }
    loadingTip.value = '';
    loading.value = false;
  }
};

const handleSelectedModel = (index: number) => {
  selectedModel.value = index;
}

const handleUpload = async () => {
  try {
    burnFirmware()
  } catch (error) {
    console.log(error);
    loadingTip.value = '';
    loading.value = false;
  }
};

const handelRefresh = async (connectStatus: DEVICESTATUS) => {
  if (connectStatus === DEVICESTATUS.SERIALCONNECTED) {
    try {
      const name = await device.getName();
      const version = await device.getVersion();
      deviceName.value = name;
      deviceVersion.value = version
      const base64Str = await device.getInfo();
      if (base64Str) {
        const str = atob(base64Str);
        const model = JSON.parse(str)
        deviceStore.setCurrentModel(model)
      }
    } catch (error) {
      console.log(error)
    }
  }
}

const handleShowCustomModel = () => {
  modalVisible.value = true;
};

const handleCustomModelOk = async () => {
  if (modalName.value == null || modalName.value === '') {
    Message.error('Please enter modal name');
    return false
  }
  if (!modelFile.value) {
    Message.error('Please choose modal file');
    return false
  }
  if (modelObjects.value.length === 0) {
    Message.error('Please enter at least one object');
    return false
  }
  burnFirmware(true);
  return true
};

const handleCustomModelCancel = () => {
  modalVisible.value = false;
}

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
    fetch(`https://files.seeedstudio.com/sscma/sscma-model.json?timestamp=${new Date().getTime()}`)
      .then(response => response.json())
      .then((data: any) => {
        deviceStore.setModels(data.models)
        deviceStore.setHasLoadModel(true);
        const firmwares = data.firmwares;
        if (firmwares?.length > 0) {
          deviceStore.setFirmware(firmwares[0])
        }
      });
  }
  handelRefresh(deviceStore.connectStatus);
});

watch(
  () => deviceStore.connectStatus,
  async (val) => {
    handelRefresh(val);
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
  margin-top: 30px;
}

.item-card-bottom {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  flex: 1;
}

.ai-label {
  color: rgb(var(--primary-6));
}

.slidePrevClass {
  width: 10px;
}

.carousel {
  width: 640px;
  margin: 30px auto;
  padding: 0 45px;
  /* 单独设置按钮颜色 */
  --swiper-navigation-size: 26px;

  /* 设置按钮大小 */
  .carousel-item {
    width: 150px;
    height: 150px;
    border: 1px solid var(--color-neutral-3);
    border-radius: var(--border-radius-small);
    flex-shrink: 0;
    cursor: pointer;

    .carousel-item-image {
      width: 100%;
      height: 75%;
    }

    .carousel-item-name {
      height: 25%;
      text-align: center;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 5px;
    }
  }

  .carousel-item-selected {
    border-color: rgb(var(--primary-6));
    border-width: 2px;
  }
}

.custom-model-wrapper {
  width: 150px;
  height: 150px;
  border: 1px solid var(--color-neutral-3);
  border-radius: var(--border-radius-small);
  margin-left: 45px;

  .custom-model-image {
    width: 100%;
    height: 75%;
  }

  .custom-model-name {
    height: 25%;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 5px;
  }
}

.bottom {
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.grid-left {
  height: 48px;
  color: var(--color-text-2);
}
</style>
