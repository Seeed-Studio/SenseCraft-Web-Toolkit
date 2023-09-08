<template>
  <a-card class="general-card" :title="$t('workplace.preview.title')" :header-style="{ paddingBottom: '0' }">
    <template #extra>
      <a-button v-if="invoke" type="secondary" :disabled="invokeDisable" @click="handleStop">
        Stop
      </a-button>
      <a-button v-else type="primary" :disabled="invokeDisable" @click="handleInvoke">
        Invoke
      </a-button>
    </template>
    <div class="monitor-wrapper">
      <canvas ref="canvas" class="monitor-preview" />
    </div>
  </a-card>
</template>

<script lang="ts" setup>
import { computed, onMounted, onBeforeUnmount, watch, ref } from 'vue';
import { useDeviceStore } from '@/store';
import { DEVICESTATUS } from '@/senseCraft';
import deviceManager from '@/senseCraft/deviceManager';

const COLORS = [
  'red',
  'orange',
  'green',
  'cyan',
  'blue',
  'purple',
  'pink',
  'brown',
  'black',
  'lime',
  'teal',
  'lavender',
  'turquoise',
  'gray',
];

const deviceStore = useDeviceStore();
const { device } = deviceManager;

const img = new Image();

const canvas = ref<HTMLCanvasElement | null>(null);
const invoke = ref<boolean>(false);
const invokeDisable = ref<boolean>(true);

const classes = computed(() => deviceStore.currentModel?.classes || []);
const length = computed(() => classes.value.length);

const onInvoke = (data: any) => {
  if (!data?.boxes || !data?.image) {
    return
  }
  const boxes = data.boxes;
  const image = data.image;
  img.onload = () => {
    if (!canvas.value) return
    const ctx = canvas.value?.getContext('2d')
    if (!ctx) return

    canvas.value.width = img.height;
    canvas.value.height = img.width;
    ctx.drawImage(img, 0, 0, img.width, img.height);
    for (let i = 0; i < boxes.length; i += 1) {
      const rect = boxes[i];
      if (rect?.length === 6) {
        const x = rect[0];
        const y = rect[1];
        const w = rect[2];
        const h = rect[3];
        const score = rect[4];
        const tar = parseInt(rect[5], 10);
        const color = COLORS[x % COLORS.length];
        let tarStr = ''
        if (classes.value && tar < length.value) {
          tarStr = classes.value[tar]
        } else {
          tarStr = tar.toString()
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          x - w / 2,
          y - h / 2,
          w,
          h
        );
        ctx.fillStyle = color;
        ctx.fillRect(
          x - w / 2,
          y - h / 2 - 12,
          w,
          12
        );
        ctx.font = 'bold 12px arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(
          `${tarStr}: ${score}`,
          x - w / 2 + 5,
          y - h / 2 - 2
        );
      }
    }
  };

  img.src = `data:image/jpg;base64,${image}`;
}

const handelRefresh = async (connectStatus: DEVICESTATUS) => {
  if (connectStatus === DEVICESTATUS.SERIALCONNECTED) {
    const isInvoke = await device.isInvoke();
    if (isInvoke) {
      invokeDisable.value = false;
      invoke.value = true;
      deviceStore.setIsInvoke(true);
    } else {
      invokeDisable.value = true;
      invoke.value = false;
      const result = await device.invoke(-1);
      if (result) {
        invokeDisable.value = false;
        invoke.value = true;
      }
    }
  } else {
    deviceStore.setIsInvoke(false);
    invokeDisable.value = true;
    invoke.value = false;
  }
}

watch(
  () => deviceStore.connectStatus,
  (val) => {
    handelRefresh(val);
  }
);

onMounted(async () => {
  device.addEventListener('INVOKE', onInvoke);
  handelRefresh(deviceStore.connectStatus);
});

onBeforeUnmount(() => {
  device.removeEventListener('INVOKE');
  device.break();
});

const handleInvoke = async () => {
  const result = await device.invoke(-1);
  if (result) {
    invokeDisable.value = false;
    invoke.value = true;
  }
};

const handleStop = () => {
  device.break();
  invokeDisable.value = false;
  invoke.value = false;
  deviceStore.setIsInvoke(false);
};

</script>

<style scoped lang="less">
.monitor-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  min-width: 320px;
  max-width: 640px;
  min-height: 285px;
  max-height: 480px;
  margin: 0 auto;
  border-radius: 5px;

  .monitor-preview {
    min-width: 240px;
    max-width: 640px;
    min-height: 240px;
    max-height: 480px;
    margin: auto;
    border-radius: 5px;
  }
}
</style>
