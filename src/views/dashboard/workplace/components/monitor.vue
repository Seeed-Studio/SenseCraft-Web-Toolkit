<template>
  <a-card
    class="general-card"
    :title="$t('workplace.monitor.title')"
    :header-style="{ paddingBottom: '0' }"
  >
    <template #extra>
      <a-button
        v-if="invoke"
        type="primary"
        :disabled="invokeDisable"
        @click="handleInvoke"
      >
        Invoke
      </a-button>
      <a-button
        v-else
        type="secondary"
        :disabled="invokeDisable"
        @click="handleStop"
      >
        Stop
      </a-button>
    </template>
    <div class="monitor-wrapper">
      <canvas ref="canvas" class="monitor-preview" @click="handleClick" />
    </div>
  </a-card>
</template>

<script lang="ts" setup>
  import { computed, onMounted, watch, ref } from 'vue';
  import { useDeviceStore } from '@/store';
  import { Pointer, ALGORITHM, EVENT, DEVICESTATUS } from '@/senseCraft';
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

  const centerImg = new Image();
  centerImg.src = new URL(
    '@/assets/images/location-blue.svg',
    import.meta.url
  ).href;

  const startImg = new Image();
  startImg.src = new URL(
    '@/assets/images/location-green.svg',
    import.meta.url
  ).href;

  const endImg = new Image();
  endImg.src = new URL(
    '@/assets/images/location-red.svg',
    import.meta.url
  ).href;

  const img = new Image();

  const canvas = ref<HTMLCanvasElement | null>(null);
  const ctx = ref<CanvasRenderingContext2D | null>(null);
  const invoke = ref<boolean>(true);
  const invokeDisable = ref<boolean>(true);
  const rotate = ref<number>(0);
  const configPointer = ref<number>(0);

  const connectStatus = computed(() => deviceStore.connectStatus);
  const event = computed(() => device?.getEvent());

  watch(
    () => connectStatus.value,
    async (val) => {
      if (val === DEVICESTATUS.SERIALCONNECTED) {
        const number = await device?.getInvoke();
        if (number === 0) {
          invokeDisable.value = false;
          invoke.value = true;
        } else {
          invokeDisable.value = true;
          invoke.value = false;
        }
        rotate.value = (await device?.getRotate()) || 0;
        invokeDisable.value = false;
      } else {
        invokeDisable.value = true;
      }
    }
  );

  watch(
    () => event.value,
    async (val) => {
      if (val & EVENT.CONFIG_POINTER_START) {
        configPointer.value = EVENT.CONFIG_POINTER_START;
        device?.clearEvent(EVENT.CONFIG_POINTER_START);
      }
      if (val & EVENT.CONFIG_POINTER_END) {
        configPointer.value = EVENT.CONFIG_POINTER_END;
        device?.clearEvent(EVENT.CONFIG_POINTER_END);
      }
      if (val & EVENT.CONFIG_POINTER_CENTER) {
        configPointer.value = EVENT.CONFIG_POINTER_CENTER;
        device?.clearEvent(EVENT.CONFIG_POINTER_CENTER);
      }
      if (val & EVENT.CONFIG_POINTER_CANCEL) {
        configPointer.value = 0;
        device?.clearEvent(EVENT.CONFIG_POINTER_CANCEL);
      }
    }
  );

  const monitor = (blob: Blob) => {
    if (blob.type === 'image/jpeg') {
      ctx.value = canvas.value?.getContext('2d') as CanvasRenderingContext2D;

      img.onload = () => {
        if (rotate.value === 270) {
          canvas.value!.width = img!.width;
          canvas.value!.height = img!.height;
          ctx.value!.translate(
            canvas.value!.width / 2,
            canvas.value!.height / 2
          );
          ctx.value!.rotate((270 * Math.PI) / 180);
          ctx.value!.drawImage(img, -img!.width / 2, -img!.height / 2);
          ctx.value!.rotate((-270 * Math.PI) / 180);
          ctx.value!.translate(
            -canvas.value!.width / 2,
            -canvas.value!.height / 2
          );
        } else {
          canvas.value!.width = img!.height;
          canvas.value!.height = img!.width;
          ctx.value!.drawImage(img, 0, 0, img!.width, img!.height);
        }
        // const url = canvas.value!.toDataURL('images/png');
        // const a = document.createElement('a');
        // const event = new MouseEvent('click');
        // a.download = randomString(8);
        // a.href = url;
        // a.dispatchEvent(event);
      };
      img.src = URL.createObjectURL(blob);
    }
  };

  const preview = (data: string) => {
    const obj = JSON.parse(data);
    if (ctx.value === null) return;
    let algorithm = '';
    if (typeof obj.algorithm === 'number') algorithm = obj.algorithm.toString();
    else {
      algorithm = obj.algorithm.toString();
    }
    if (algorithm === ALGORITHM.OBJECT_DETECTION) {
      for (let i = 0; i < obj.count; i += 1) {
        const color = COLORS[obj.object.x[i] % COLORS.length];
        ctx.value.strokeStyle = color;
        ctx.value.lineWidth = 2;
        ctx.value.strokeRect(
          obj.object.x[i] - obj.object.w[i] / 2,
          obj.object.y[i] - obj.object.h[i] / 2,
          obj.object.w[i],
          obj.object.h[i]
        );
        ctx.value.fillStyle = color;
        ctx.value.fillRect(
          obj.object.x[i] - obj.object.w[i] / 2,
          obj.object.y[i] - obj.object.h[i] / 2 - 12,
          obj.object.w[i],
          12
        );
        ctx.value.font = 'bold 12px arial';
        ctx.value.fillStyle = '#ffffff';
        ctx.value.fillText(
          `${obj.object.target[i]}: ${obj.object.confidence[i]}`,
          obj.object.x[i] - obj.object.w[i] / 2 + 5,
          obj.object.y[i] - obj.object.h[i] / 2 - 2
        );
      }
    } else if (algorithm === ALGORITHM.OBJECT_COUNTING) {
      for (let i = 0; i < obj.count; i += 1) {
        ctx.value.fillStyle = COLORS[obj.object.target[i]];
        ctx.value.fillRect(0, 16 * i, canvas.value!.width, 16 * (i + 1));
        ctx.value.font = 'bold 12px arial';
        ctx.value.fillStyle = '#ffffff';
        ctx.value.fillText(
          `${obj.object.target[i]}: ${obj.object.count[i]}`,
          0,
          16 * i + 12
        );
      }
    } else if (algorithm === ALGORITHM.IMAGE_CLASSIFICATION) {
      for (let i = 0; i < obj.count; i += 1) {
        ctx.value.fillStyle = COLORS[obj.object.target[i]];
        ctx.value.fillRect(
          (canvas.value!.width / obj.count) * i,
          0,
          (canvas.value!.width / obj.count) * (i + 1),
          16
        );
        ctx.value.font = 'bold 10px arial';
        ctx.value.fillStyle = '#ffffff';
        ctx.value.fillText(
          `${obj.object.target[i]}: ${obj.object.confidence[i]}`,
          (canvas.value!.width / obj.count) * i,
          12
        );
      }
    } else if (algorithm === ALGORITHM.POINTER_METER) {
      if (device) {
        ctx.value.fillStyle = 'red';
        ctx.value?.fillRect(obj.object.x[0], obj.object.y[0] - 1, 4, 4);
        ctx.value?.drawImage(
          centerImg,
          device.config.pointer.centerX - 20,
          device.config.pointer.centerY - 40,
          40,
          40
        );
        ctx.value?.drawImage(
          startImg,
          device.config.pointer.startX - 20,
          device.config.pointer.startY - 40,
          40,
          40
        );
        ctx.value?.drawImage(
          endImg,
          device.config.pointer.endX - 20,
          device.config.pointer.endY - 40,
          40,
          40
        );
      }
    } else if (algorithm === ALGORITHM.DIGITAL_METER) {
      for (let i = 0; i < obj.count; i += 1) {
        const color = COLORS[obj.object.target[i]];
        ctx.value.strokeStyle = color;
        ctx.value.lineWidth = 2;
        ctx.value.strokeRect(
          obj.object.x[i] - obj.object.w[i] / 2,
          obj.object.y[i] - obj.object.h[i] / 2,
          obj.object.w[i],
          obj.object.h[i]
        );
        ctx.value.fillStyle = color;
        ctx.value.fillRect(
          obj.object.x[i] - obj.object.w[i] / 2,
          obj.object.y[i] - obj.object.h[i] / 2 - 12,
          obj.object.w[i],
          12
        );
        ctx.value.font = 'bold 12px arial';
        ctx.value.fillStyle = '#ffffff';
        ctx.value.fillText(
          obj.object.target[i],
          obj.object.x[i] - obj.object.w[i] / 2 + 5,
          obj.object.y[i] - obj.object.h[i] / 2 - 2
        );
      }
    }
  };

  onMounted(async () => {
    device.onMonitor = monitor;
    device.onPreview = preview;
  });

  const handleInvoke = () => {
    device?.invoke(-1);
    invoke.value = false;
  };

  const handleStop = () => {
    device?.invoke(0);
    invoke.value = true;
  };

  const handleClick = (e: MouseEvent) => {
    if (configPointer.value !== 0 && device) {
      if (configPointer.value & EVENT.CONFIG_POINTER_START) {
        device.config.pointer.startX = e.offsetX;
        device.config.pointer.startY = e.offsetY;
      }
      if (configPointer.value & EVENT.CONFIG_POINTER_END) {
        device.config.pointer.endX = e.offsetX;
        device.config.pointer.endY = e.offsetY;
      }
      if (configPointer.value & EVENT.CONFIG_POINTER_CENTER) {
        device.config.pointer.centerX = e.offsetX;
        device.config.pointer.centerY = e.offsetY;
      }
      device.setEvent(EVENT.CONFIG_POINTER_DONE);
    }
  };
</script>

<style scoped lang="less">
  .monitor {
    &-wrapper {
      display: flex;
      justify-content: center;
      width: 100%;
      min-width: 320px;
      max-width: 640px;
      min-height: 285px;
      max-height: 480px;
      margin: 0 auto;
      border-radius: 5px;
    }

    &-preview {
      min-width: 240px;
      max-width: 640px;
      min-height: 240px;
      max-height: 480px;
      margin: auto;
      border-radius: 5px;
      // background-color: black;
    }

    &-bar {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
    }
  }
</style>
