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
    <div class="monitor">
      <canvas ref="canvas" class="preview" />
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
  import { logEvent } from '@/utils/firebase';

  const { device, term } = useDeviceManager();

  const COLORS = [
    '#FF0000',
    '#FFA500',
    '#FFFF00',
    '#32CD32',
    '#006400',
    '#4169E1',
    '#0000FF',
    '#FF1493',
    '#FFC0CB',
    '#800080',
    '#FFD700',
    '#9ACD32',
    '#ADFF2F',
    '#00FFFF',
    '#1E90FF',
    '#FF4500',
    '#CD853F',
    '#FF8C00',
    '#FF6347',
    '#8B4513',
    '#FF69B4',
    '#FF00FF',
    '#BA55D3',
    '#9400D3',
    '#8A2BE2',
    '#4682B4',
    '#87CEEB',
    '#00CED1',
    '#20B2AA',
    '#FFB6C1',
    '#696969',
    '#808080',
    '#A9A9A9',
    '#C0C0C0',
    '#D3D3D3',
    '#FFFAFA',
    '#F0FFF0',
    '#F5F5DC',
    '#FFE4C4',
    '#FFDAB9',
    '#EEE8AA',
    '#F0E68C',
    '#BDB76B',
    '#FFD700',
    '#F5DEB3',
    '#D2B48C',
    '#DEB887',
    '#BC8F8F',
    '#F4A460',
    '#DAA520',
    '#CD853F',
    '#A52A2A',
    '#8B4513',
    '#D2691E',
    '#B22222',
    '#FF6347',
    '#FF4500',
    '#FF8C00',
    '#FFA07A',
    '#FA8072',
    '#E9967A',
    '#FF69B4',
    '#FF1493',
    '#DB7093',
    '#C71585',
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
    logEvent('invoke', { behavior: 'invoke' });
    const model = await device.value?.getModel();
    const isAvailable = model?.id !== undefined;
    deviceStore.setCurrentAvailableModel(isAvailable);
    if (!isAvailable) {
      Message.warning(t('workplace.device.model.nomodel'));
      return;
    }
    const result = await device.value?.invoke(-1);
    if (result) {
      invoke.value = true;
    } else {
      Message.error(t('workplace.preview.message.invoke.failed'));
      invoke.value = false;
    }
  };

  const handleStop = () => {
    logEvent('invoke', { behavior: 'stop' });
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

    if (data?.perf) {
      const perf = {
        preprocess: data.perf[0],
        inference: data.perf[1],
        postprocess: data.perf[2],
      };
      term.writeln(`perf: ${JSON.stringify(perf)}`);
    }
    if (data?.image) {
      const image = data.image;
      img.onload = () => {
        if (!canvas.value) return;
        const ctx = canvas.value?.getContext('2d');
        if (!ctx) return;

        canvas.value.width = img.height;
        canvas.value.height = img.width;
        if (data?.rotate) {
          const rotate = data.rotate;
          console.log(rotate);
          if (rotate === 0) {
            ctx.drawImage(img, 0, 0, img.width, img.height);
          }
          if (rotate === 90) {
            ctx.translate(canvas.value.width / 2, canvas.value.height / 2);
            ctx.rotate((90 * Math.PI) / 180);
            ctx.drawImage(
              img,
              -canvas.value.height / 2,
              -canvas.value.width / 2,
              canvas.value.height,
              canvas.value.width
            );
            ctx.setTransform(1, 0, 0, 1, 0, 0);
          }
          if (rotate === 180) {
            ctx.translate(canvas.value.width / 2, canvas.value.height / 2);
            ctx.rotate((180 * Math.PI) / 180);
            ctx.drawImage(
              img,
              -canvas.value.width / 2,
              -canvas.value.height / 2,
              canvas.value.width,
              canvas.value.height
            );
            ctx.setTransform(1, 0, 0, 1, 0, 0);
          }
          if (rotate === 270) {
            ctx.translate(canvas.value.width / 2, canvas.value.height / 2);
            ctx.rotate((270 * Math.PI) / 180);
            ctx.drawImage(
              img,
              -canvas.value.height / 2,
              -canvas.value.width / 2,
              canvas.value.height,
              canvas.value.width
            );
            ctx.setTransform(1, 0, 0, 1, 0, 0);
          }
        } else {
          ctx.drawImage(img, 0, 0, img.width, img.height);
        }

        if (data?.boxes) {
          const boxes = data.boxes;
          term.writeln(`boxes: ${JSON.stringify(boxes)}`);
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
        if (data?.classes && canvas.value) {
          term.writeln(`classes: ${JSON.stringify(data.classes)}`);
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
        if (data?.keypoints) {
          term.writeln(`keypoints: ${JSON.stringify(data.keypoints)}`);
          const keypoints = data.keypoints;
          for (let i = 0; i < keypoints.length; i += 1) {
            const keypoint = keypoints[i];
            const rect = keypoint[0];
            const points = keypoint[1];
            const pointSet = new Set();
            // draw box
            if (rect?.length === 6) {
              const x = rect[0];
              const y = rect[1];
              const w = rect[2];
              const h = rect[3];
              const score = rect[4];
              const tar = parseInt(rect[5], 10);
              const color = COLORS[i % COLORS.length];
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
            // fliter points
            for (let j = 0; j < points.length; j += 1) {
              const point = points[j];
              const x = point[0];
              const y = point[1];
              const target = point[3];
              // draw if point in the box
              if (
                x > rect[0] - rect[2] / 2 &&
                x < rect[0] + rect[2] / 2 &&
                y > rect[1] - rect[3] / 2 &&
                y < rect[1] + rect[3] / 2
              ) {
                pointSet.add(target);
              }
            }
            // draw lines
            if (points.length === 17) {
              // human pose with 17 points
              ctx.lineWidth = 2;

              // nose to left eye
              if (pointSet.has(0) && pointSet.has(1)) {
                ctx.strokeStyle = COLORS[0];
                ctx.beginPath();
                ctx.moveTo(points[0][0], points[0][1]);
                ctx.lineTo(points[1][0], points[1][1]);
                ctx.stroke();
              }
              // nose to right eye
              if (pointSet.has(0) && pointSet.has(2)) {
                ctx.strokeStyle = COLORS[0];
                ctx.beginPath();
                ctx.moveTo(points[0][0], points[0][1]);
                ctx.lineTo(points[2][0], points[2][1]);
                ctx.stroke();
              }

              // left eye to left ear
              if (pointSet.has(1) && pointSet.has(3)) {
                ctx.strokeStyle = COLORS[0];
                ctx.beginPath();
                ctx.moveTo(points[1][0], points[1][1]);
                ctx.lineTo(points[3][0], points[3][1]);
                ctx.stroke();
              }

              // right eye to right ear
              if (pointSet.has(2) && pointSet.has(4)) {
                ctx.strokeStyle = COLORS[0];
                ctx.beginPath();
                ctx.moveTo(points[2][0], points[2][1]);
                ctx.lineTo(points[4][0], points[4][1]);
                ctx.stroke();
              }

              // left ear to left shoulder
              if (pointSet.has(3) && pointSet.has(5)) {
                ctx.strokeStyle = COLORS[0];
                ctx.beginPath();
                ctx.moveTo(points[3][0], points[3][1]);
                ctx.lineTo(points[5][0], points[5][1]);
                ctx.stroke();
              }

              // right ear to right shoulder
              if (pointSet.has(4) && pointSet.has(6)) {
                ctx.strokeStyle = COLORS[0];
                ctx.beginPath();
                ctx.moveTo(points[4][0], points[4][1]);
                ctx.lineTo(points[6][0], points[6][1]);
                ctx.stroke();
              }

              // left shoulder to right shoulder
              if (pointSet.has(5) && pointSet.has(6)) {
                ctx.strokeStyle = COLORS[1];
                ctx.beginPath();
                ctx.moveTo(points[5][0], points[5][1]);
                ctx.lineTo(points[6][0], points[6][1]);
                ctx.stroke();
              }

              // left shoulder to left hip
              if (pointSet.has(5) && pointSet.has(11)) {
                ctx.strokeStyle = COLORS[2];
                ctx.beginPath();
                ctx.moveTo(points[5][0], points[5][1]);
                ctx.lineTo(points[11][0], points[11][1]);
                ctx.stroke();
              }

              // right shoulder to right hip
              if (pointSet.has(6) && pointSet.has(12)) {
                ctx.strokeStyle = COLORS[2];
                ctx.beginPath();
                ctx.moveTo(points[6][0], points[6][1]);
                ctx.lineTo(points[12][0], points[12][1]);
                ctx.stroke();
              }

              // left hip to right hip
              if (pointSet.has(11) && pointSet.has(12)) {
                ctx.strokeStyle = COLORS[2];
                ctx.beginPath();
                ctx.moveTo(points[11][0], points[11][1]);
                ctx.lineTo(points[12][0], points[12][1]);
                ctx.stroke();
              }

              // left shoulder to left elbow
              if (pointSet.has(5) && pointSet.has(7)) {
                ctx.strokeStyle = COLORS[1];
                ctx.beginPath();
                ctx.moveTo(points[5][0], points[5][1]);
                ctx.lineTo(points[7][0], points[7][1]);
                ctx.stroke();
              }

              // left elbow to left wrist
              if (pointSet.has(7) && pointSet.has(9)) {
                ctx.strokeStyle = COLORS[1];
                ctx.beginPath();
                ctx.moveTo(points[7][0], points[7][1]);
                ctx.lineTo(points[9][0], points[9][1]);
                ctx.stroke();
              }

              // right shoulder to right elbow
              if (pointSet.has(6) && pointSet.has(8)) {
                ctx.strokeStyle = COLORS[1];
                ctx.beginPath();
                ctx.moveTo(points[6][0], points[6][1]);
                ctx.lineTo(points[8][0], points[8][1]);
                ctx.stroke();
              }

              // right elbow to right wrist
              if (pointSet.has(8) && pointSet.has(10)) {
                ctx.strokeStyle = COLORS[1];
                ctx.beginPath();
                ctx.moveTo(points[8][0], points[8][1]);
                ctx.lineTo(points[10][0], points[10][1]);
                ctx.stroke();
              }

              // left hip to left knee
              if (pointSet.has(11) && pointSet.has(13)) {
                ctx.strokeStyle = COLORS[3];
                ctx.beginPath();
                ctx.moveTo(points[11][0], points[11][1]);
                ctx.lineTo(points[13][0], points[13][1]);
                ctx.stroke();
              }

              // left knee to left ankle
              if (pointSet.has(13) && pointSet.has(15)) {
                ctx.strokeStyle = COLORS[3];
                ctx.beginPath();
                ctx.moveTo(points[13][0], points[13][1]);
                ctx.lineTo(points[15][0], points[15][1]);
                ctx.stroke();
              }

              // right hip to right knee
              if (pointSet.has(12) && pointSet.has(14)) {
                ctx.strokeStyle = COLORS[3];
                ctx.beginPath();
                ctx.moveTo(points[12][0], points[12][1]);
                ctx.lineTo(points[14][0], points[14][1]);
                ctx.stroke();
              }

              // right knee to right ankle
              if (pointSet.has(14) && pointSet.has(16)) {
                ctx.strokeStyle = COLORS[3];
                ctx.beginPath();
                ctx.moveTo(points[14][0], points[14][1]);
                ctx.lineTo(points[16][0], points[16][1]);
                ctx.stroke();
              }
            }

            if (points.length === 21) {
              // hand 21 points
              ctx.lineWidth = 2;

              // thumb
              if (pointSet.has(0) && pointSet.has(1)) {
                ctx.strokeStyle = COLORS[0];
                ctx.beginPath();
                ctx.moveTo(points[0][0], points[0][1]);
                ctx.lineTo(points[1][0], points[1][1]);
                ctx.stroke();
              }

              if (pointSet.has(1) && pointSet.has(2)) {
                ctx.strokeStyle = COLORS[0];
                ctx.beginPath();
                ctx.moveTo(points[1][0], points[1][1]);
                ctx.lineTo(points[2][0], points[2][1]);
                ctx.stroke();
              }

              if (pointSet.has(2) && pointSet.has(3)) {
                ctx.strokeStyle = COLORS[0];
                ctx.beginPath();
                ctx.moveTo(points[2][0], points[2][1]);
                ctx.lineTo(points[3][0], points[3][1]);
                ctx.stroke();
              }

              if (pointSet.has(3) && pointSet.has(4)) {
                ctx.strokeStyle = COLORS[0];
                ctx.beginPath();
                ctx.moveTo(points[3][0], points[3][1]);
                ctx.lineTo(points[4][0], points[4][1]);
                ctx.stroke();
              }

              // index finger
              if (pointSet.has(0) && pointSet.has(5)) {
                ctx.strokeStyle = COLORS[1];
                ctx.beginPath();
                ctx.moveTo(points[0][0], points[0][1]);
                ctx.lineTo(points[5][0], points[5][1]);
                ctx.stroke();
              }
              if (pointSet.has(5) && pointSet.has(6)) {
                ctx.strokeStyle = COLORS[1];
                ctx.beginPath();
                ctx.moveTo(points[5][0], points[5][1]);
                ctx.lineTo(points[6][0], points[6][1]);
                ctx.stroke();
              }

              if (pointSet.has(6) && pointSet.has(7)) {
                ctx.strokeStyle = COLORS[1];
                ctx.beginPath();
                ctx.moveTo(points[6][0], points[6][1]);
                ctx.lineTo(points[7][0], points[7][1]);
                ctx.stroke();
              }

              if (pointSet.has(7) && pointSet.has(8)) {
                ctx.strokeStyle = COLORS[1];
                ctx.beginPath();
                ctx.moveTo(points[7][0], points[7][1]);
                ctx.lineTo(points[8][0], points[8][1]);
                ctx.stroke();
              }

              // middle finger
              if (pointSet.has(5) && pointSet.has(9)) {
                ctx.strokeStyle = COLORS[5];
                ctx.beginPath();
                ctx.moveTo(points[5][0], points[5][1]);
                ctx.lineTo(points[9][0], points[9][1]);
                ctx.stroke();
              }
              if (pointSet.has(9) && pointSet.has(10)) {
                ctx.strokeStyle = COLORS[2];
                ctx.beginPath();
                ctx.moveTo(points[9][0], points[9][1]);
                ctx.lineTo(points[10][0], points[10][1]);
                ctx.stroke();
              }

              if (pointSet.has(10) && pointSet.has(11)) {
                ctx.strokeStyle = COLORS[2];
                ctx.beginPath();
                ctx.moveTo(points[10][0], points[10][1]);
                ctx.lineTo(points[11][0], points[11][1]);
                ctx.stroke();
              }

              if (pointSet.has(11) && pointSet.has(12)) {
                ctx.strokeStyle = COLORS[2];
                ctx.beginPath();
                ctx.moveTo(points[11][0], points[11][1]);
                ctx.lineTo(points[12][0], points[12][1]);
                ctx.stroke();
              }

              // ring finger
              if (pointSet.has(9) && pointSet.has(13)) {
                ctx.strokeStyle = COLORS[5];
                ctx.beginPath();
                ctx.moveTo(points[9][0], points[9][1]);
                ctx.lineTo(points[13][0], points[13][1]);
                ctx.stroke();
              }

              if (pointSet.has(13) && pointSet.has(14)) {
                ctx.strokeStyle = COLORS[3];
                ctx.beginPath();
                ctx.moveTo(points[13][0], points[13][1]);
                ctx.lineTo(points[14][0], points[14][1]);
                ctx.stroke();
              }

              if (pointSet.has(14) && pointSet.has(15)) {
                ctx.strokeStyle = COLORS[3];
                ctx.beginPath();
                ctx.moveTo(points[14][0], points[14][1]);
                ctx.lineTo(points[15][0], points[15][1]);
                ctx.stroke();
              }

              if (pointSet.has(15) && pointSet.has(16)) {
                ctx.strokeStyle = COLORS[3];
                ctx.beginPath();
                ctx.moveTo(points[15][0], points[15][1]);
                ctx.lineTo(points[16][0], points[16][1]);
                ctx.stroke();
              }

              // pinky
              if (pointSet.has(13) && pointSet.has(17)) {
                ctx.strokeStyle = COLORS[5];
                ctx.beginPath();
                ctx.moveTo(points[13][0], points[13][1]);
                ctx.lineTo(points[17][0], points[17][1]);
                ctx.stroke();
              }
              if (pointSet.has(0) && pointSet.has(17)) {
                ctx.strokeStyle = COLORS[4];
                ctx.beginPath();
                ctx.moveTo(points[0][0], points[0][1]);
                ctx.lineTo(points[17][0], points[17][1]);
                ctx.stroke();
              }

              if (pointSet.has(17) && pointSet.has(18)) {
                ctx.strokeStyle = COLORS[4];
                ctx.beginPath();
                ctx.moveTo(points[17][0], points[17][1]);
                ctx.lineTo(points[18][0], points[18][1]);
                ctx.stroke();
              }

              if (pointSet.has(18) && pointSet.has(19)) {
                ctx.strokeStyle = COLORS[4];
                ctx.beginPath();
                ctx.moveTo(points[18][0], points[18][1]);
                ctx.lineTo(points[19][0], points[19][1]);
                ctx.stroke();
              }

              if (pointSet.has(19) && pointSet.has(20)) {
                ctx.strokeStyle = COLORS[4];
                ctx.beginPath();
                ctx.moveTo(points[19][0], points[19][1]);
                ctx.lineTo(points[20][0], points[20][1]);
                ctx.stroke();
              }
            }

            // draw points
            for (let j = 0; j < points.length; j += 1) {
              const point = points[j];
              const x = point[0];
              const y = point[1];
              const target = point[3];
              if (pointSet.has(target)) {
                ctx.fillStyle = COLORS[target % COLORS.length];
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 3 * Math.PI);
                ctx.fill();
              }
            }
          }
        }
      };

      img.src = `data:image/jpg;base64,${image}`;
    }
  };

  defineExpose({ onInvoke });

  const handelRefresh = async () => {
    if (
      deviceStore.deviceStatus === DeviceStatus.SerialConnected &&
      deviceStore.currentAvailableModel
    ) {
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
  watch(() => deviceStore.currentAvailableModel, handelRefresh);

  onMounted(handelRefresh);

  onBeforeUnmount(() => {
    device.value?.removeEventListener(eventName);
  });
</script>

<style scoped lang="less">
  .monitor {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    min-width: 320px;
    max-width: 640px;
    min-height: 285px;
    max-height: 480px;
    margin: 0 auto;
    border-radius: 5px;

    .preview {
      min-width: 240px;
      max-width: 640px;
      min-height: 240px;
      max-height: 480px;
      margin: auto;
      border-radius: 5px;
    }

    .text {
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: rgb(var(--success-6));
      font-size: 16px;
    }
  }
</style>
