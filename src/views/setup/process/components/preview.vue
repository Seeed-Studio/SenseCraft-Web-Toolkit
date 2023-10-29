<template>
  <a-card
    class="general-card"
    :title="$t('workplace.preview.title')"
    :header-style="{ paddingBottom: '0' }"
  >
    <template #extra>
      <a-button
        v-if="invoke"
        type="secondary"
        status="danger"
        :disabled="disable"
        @click="handleStop"
      >
        Stop
      </a-button>
      <a-button v-else type="primary" :disabled="disable" @click="handleInvoke">
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
  import { Message } from '@arco-design/web-vue';
  import { useDeviceStore } from '@/store';
  import { DeviceStatus } from '@/sscma';
  import deviceManager from '@/sscma/deviceManager';

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

  const eventName = 'INVOKE';

  const deviceStore = useDeviceStore();

  const img = new Image();

  const canvas = ref<HTMLCanvasElement | null>(null);
  const invoke = ref<boolean>(false);
  const disable = ref<boolean>(true);

  const classes = computed(() => deviceStore.currentModel?.classes || []);
  const length = computed(() => classes.value.length);

  const handleInvoke = async () => {
    const device = deviceManager.getDevice();
    const result = await device.invoke(-1);
    if (result) {
      invoke.value = true;
    } else {
      Message.error('Invoke failed, please check device connection');
      invoke.value = false;
    }
  };

  const handleStop = async () => {
    const device = deviceManager.getDevice();
    device.break();
    invoke.value = false;
    deviceStore.setIsInvoke(false);
  };

  const onInvoke = (resp: any) => {
    const code = resp.code;
    const data = resp.data;
    const name = resp.name;
    if (name !== eventName) {
      return;
    }
    if (code !== 0) {
      handleStop();
      return;
    }

    if (data?.image) {
      const image = data.image;
      img.onload = () => {
        if (!canvas.value) return;
        const ctx = canvas.value?.getContext('2d');
        if (!ctx) return;

        canvas.value.width = img.height;
        canvas.value.height = img.width;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        if (data?.boxes) {
          const boxes = data.boxes;
          for (let i = 0; i < boxes.length; i += 1) {
            const rect = boxes[i];
            if (rect?.length === 6) {
              const x = rect[0];
              const y = rect[1];
              const w = rect[2];
              const h = rect[3];
              const score = rect[4];
              const tar = parseInt(rect[5], 10);
              const color = COLORS[tar % COLORS.length];
              let tarStr = '';
              if (classes.value && tar < length.value) {
                tarStr = classes.value[tar];
              } else {
                tarStr = tar.toString();
              }
              ctx.strokeStyle = color;
              ctx.lineWidth = 2;
              ctx.strokeRect(x - w / 2, y - h / 2, w, h);
              ctx.fillStyle = color;
              ctx.fillRect(x - w / 2, y - h / 2 - 12, w, 12);
              ctx.font = 'bold 12px arial';
              ctx.fillStyle = '#ffffff';
              ctx.fillText(`${tarStr}: ${score}`, x - w / 2 + 5, y - h / 2 - 2);
            }
          }
        }
        if (data?.classes) {
          const tagets = data.classes;
          for (let i = 0; i < tagets.length; i += 1) {
            const tar = tagets[i][1];
            const score = tagets[i][0];
            let tarStr = '';
            if (classes.value && tar < length.value) {
              tarStr = classes.value[tar];
            } else {
              tarStr = tar.toString();
            }
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = COLORS[tar % COLORS.length];
            ctx.fillRect(
              (canvas.value!.width / tagets.length) * i,
              0,
              (canvas.value!.width / tagets.length) * (i + 1),
              canvas.value!.height / 10
            );
            ctx.globalAlpha = 1;
            ctx.font = `bold ${canvas.value!.height / 16}px arial`;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(
              `${tarStr}: ${score}`,
              (canvas.value!.width / tagets.length) * i,
              canvas.value!.height / 16
            );
          }
        }
      };

      img.src = `data:image/jpg;base64,${image}`;
    }
  };

  const handelRefresh = async (ready: boolean) => {
    if (ready === true) {
      const device = deviceManager.getDevice();
      disable.value = false;
      device.addEventListener(eventName, onInvoke);
      const isInvoke = await device.isInvoke();
      if (isInvoke) {
        invoke.value = true;
        deviceStore.setIsInvoke(true);
      } else {
        const result = await device.invoke(-1);
        if (result) {
          invoke.value = true;
        } else {
          Message.error('Invoke failed, please check device connection');
          invoke.value = false;
        }
      }
    } else {
      deviceStore.setIsInvoke(false);
      disable.value = true;
      invoke.value = false;
    }
  };

  watch(
    () => deviceStore.ready,
    (val) => {
      handelRefresh(val);
    }
  );

  onMounted(async () => {
    handelRefresh(deviceStore.ready);
  });

  onBeforeUnmount(async () => {
    const device = await deviceManager.getDevice();
    device.break();
    deviceStore.setIsInvoke(false);
    deviceStore.setReady(false);
    device?.removeEventListener(eventName);
  });
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
