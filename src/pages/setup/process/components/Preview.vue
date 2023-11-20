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
        {{ $t('workplace.preview.stop') }}
      </a-button>
      <a-button v-else type="primary" :disabled="disable" @click="handleInvoke">
        {{ $t('workplace.preview.invoke') }}
      </a-button>
    </template>
    <div class="monitor-wrapper">
      <canvas ref="canvas" class="monitor-preview" />
    </div>
  </a-card>
</template>

<script lang="ts" setup>
  import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { useI18n } from 'vue-i18n';
  import { useDeviceStore } from '@/store';
  import useDeviceManager from '@/hooks/deviceManager';
  import { DeviceStatus } from '@/sscma';

  const { device } = useDeviceManager();

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
  const { t } = useI18n();

  const img = new Image();

  const canvas = ref<HTMLCanvasElement | null>(null);
  const invoke = ref<boolean>(false);
  const disable = ref<boolean>(true);

  const classes = computed(() => deviceStore.currentModel?.classes || []);
  const length = computed(() => classes.value.length);

  const handleInvoke = async () => {
    const result = await device.value?.invoke(-1);
    if (result) {
      invoke.value = true;
    } else {
      Message.error(t('workplace.preview.message.invoke.failed'));
      invoke.value = false;
    }
  };

  const handleStop = () => {
    device.value?.break();
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
              const color = COLORS[x % COLORS.length];
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
        if (data?.classes && canvas.value) {
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
              (canvas.value.width / tagets.length) * i,
              0,
              (canvas.value.width / tagets.length) * (i + 1),
              canvas.value.height / 10
            );
            ctx.globalAlpha = 1;
            ctx.font = `bold ${canvas.value.height / 16}px arial`;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(
              `${tarStr}: ${score}`,
              (canvas.value.width / tagets.length) * i,
              canvas.value.height / 16
            );
          }
        }
      };

      img.src = `data:image/jpg;base64,${image}`;
    }
  };

  defineExpose({ onInvoke });

  const handelRefresh = async () => {
    if (deviceStore.deviceStatus === DeviceStatus.SerialConnected) {
      device.value?.addEventListener(eventName, onInvoke);
      disable.value = false;
      const isInvoke = await device.value?.isInvoke();
      if (isInvoke) {
        invoke.value = true;
        deviceStore.setIsInvoke(true);
      } else {
        const result = await device.value?.invoke(-1);
        if (result) {
          invoke.value = true;
        } else {
          Message.error(t('workplace.preview.message.invoke.failed'));
          invoke.value = false;
        }
      }
    } else {
      deviceStore.setIsInvoke(false);
      disable.value = true;
      invoke.value = false;
    }
  };
  watch(() => deviceStore.deviceStatus, handelRefresh);

  onMounted(handelRefresh);

  onBeforeUnmount(() => {
    device.value?.removeEventListener(eventName);
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
@/sscma@/sscma/deviceManager @/sscma/xiao_esp32s3/deviceManager
