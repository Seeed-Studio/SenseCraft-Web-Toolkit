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

<script lang="ts">
  import { defineComponent } from 'vue';
  import { useDeviceStore } from '@/store';
  import { Pointer, ALGORITHM, EVENT } from '@/edgelab';

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
  const device = deviceStore.getDevice;

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

  export default defineComponent({
    name: 'Monitor',
    data() {
      return {
        canvas: null as HTMLCanvasElement | null,
        ctx: null as CanvasRenderingContext2D | null,
        invoke: true,
        invokeDisable: true,
        pointer: null as Pointer | null,
        rotate: 0,
        configPointer: 0,
      };
    },
    computed: {
      connected() {
        return device.connected;
      },
      event() {
        return device.getEvent();
      },
    },

    watch: {
      async connected(value) {
        if (value) {
          const invoke = await device.getInvoke();
          if (invoke === 0) {
            this.invokeDisable = false;
            this.invoke = true;
          } else {
            this.invokeDisable = true;
            this.invoke = false;
          }
          this.rotate = await device.getRotate();
          this.invokeDisable = false;
        } else {
          this.invokeDisable = true;
        }
      },
      async event(value: number) {
        console.log(value);
        if (value & EVENT.CONFIG_POINTER_START) {
          this.configPointer = EVENT.CONFIG_POINTER_START;
          device.clearEvent(EVENT.CONFIG_POINTER_START);
        }
        if (value & EVENT.CONFIG_POINTER_END) {
          this.configPointer = EVENT.CONFIG_POINTER_END;
          device.clearEvent(EVENT.CONFIG_POINTER_END);
        }
        if (value & EVENT.CONFIG_POINTER_CENTER) {
          this.configPointer = EVENT.CONFIG_POINTER_CENTER;
          device.clearEvent(EVENT.CONFIG_POINTER_CENTER);
        }
        if (value & EVENT.CONFIG_POINTER_CANCEL) {
          this.configPointer = 0;
          device.clearEvent(EVENT.CONFIG_POINTER_CANCEL);
        }
      },
    },
    mounted() {
      this.monitor = this.monitor.bind(this);
      device.onMonitor = this.monitor;
      device.onPreview = this.preview;
    },
    methods: {
      monitor(blob: Blob) {
        if (blob.type === 'image/jpeg') {
          this.canvas = this.$refs.canvas as HTMLCanvasElement;
          this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
          const img = new Image();
          img.src = URL.createObjectURL(blob);
          img.onload = () => {
            if (this.rotate === 270) {
              this.canvas!.width = img!.width;
              this.canvas!.height = img!.height;
              this.ctx!.translate(
                this.canvas!.width / 2,
                this.canvas!.height / 2
              );
              this.ctx!.rotate((270 * Math.PI) / 180);
              this.ctx!.drawImage(img, -img!.width / 2, -img!.height / 2);
              this.ctx!.rotate((-270 * Math.PI) / 180);
              this.ctx!.translate(
                -this.canvas!.width / 2,
                -this.canvas!.height / 2
              );
            } else {
              this.canvas!.width = img!.height;
              this.canvas!.height = img!.width;
              this.ctx!.drawImage(img, 0, 0, img!.width, img!.height);
            }
          };
        }
      },
      preview(data: string) {
        const obj = JSON.parse(data);
        if (this.ctx === null) return;
        let algorithm = '';
        if (typeof obj.algorithm === 'number')
          algorithm = obj.algorithm.toString();
        else algorithm = obj.algorithm;
        if (algorithm === ALGORITHM.OBJECT_DETECTION) {
          for (let i = 0; i < obj.count; i += 1) {
            const color = COLORS[obj.object.x[i] % COLORS.length];
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
              obj.object.x[i] - obj.object.w[i] / 2,
              obj.object.y[i] - obj.object.h[i] / 2,
              obj.object.w[i],
              obj.object.h[i]
            );
            this.ctx.fillStyle = color;
            this.ctx.fillRect(
              obj.object.x[i] - obj.object.w[i] / 2,
              obj.object.y[i] - obj.object.h[i] / 2 - 12,
              obj.object.w[i],
              12
            );
            this.ctx.font = 'bold 10px arial';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(
              `${obj.object.target[i]}: ${obj.object.confidence[i]}`,
              obj.object.x[i] - obj.object.w[i] / 2 + 5,
              obj.object.y[i] - obj.object.h[i] / 2 - 2
            );
          }
        }
        if (algorithm === ALGORITHM.OBJECT_COUNTING) {
          for (let i = 0; i < obj.count; i += 1) {
            this.ctx.fillStyle = COLORS[obj.object.target[i]];
            this.ctx.fillRect(0, 16 * i, this.canvas!.width, 16 * (i + 1));
            this.ctx.font = 'bold 10px arial';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(
              `${obj.object.target[i]}: ${obj.object.count[i]}`,
              0,
              16 * i + 12
            );
          }
        }
        if (algorithm === ALGORITHM.IMAGE_CLASSIFICATION) {
          for (let i = 0; i < obj.count; i += 1) {
            this.ctx.fillStyle = COLORS[obj.object.target[i]];
            this.ctx.fillRect(
              (this.canvas!.width / obj.count) * i,
              0,
              (this.canvas!.width / obj.count) * (i + 1),
              16
            );
            this.ctx.font = 'bold 10px arial';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(
              `${obj.object.target[i]}: ${obj.object.confidence[i]}`,
              (this.canvas!.width / obj.count) * i,
              12
            );
          }
        }
        if (algorithm === ALGORITHM.POINTER_METER) {
          this.ctx.fillStyle = 'red';
          this.ctx?.fillRect(obj.object.x[0], obj.object.y[0] - 1, 4, 4);
          this.ctx?.drawImage(
            centerImg,
            device.config.pointer.centerX - 20,
            device.config.pointer.centerY - 40,
            40,
            40
          );
          this.ctx?.drawImage(
            startImg,
            device.config.pointer.startX - 20,
            device.config.pointer.startY - 40,
            40,
            40
          );
          this.ctx?.drawImage(
            endImg,
            device.config.pointer.endX - 20,
            device.config.pointer.endY - 40,
            40,
            40
          );
        }
        if (algorithm === ALGORITHM.DIGITAL_METER) {
          for (let i = 0; i < obj.count; i += 1) {
            const color = COLORS[obj.object.target[i]];
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
              obj.object.x[i] - obj.object.w[i] / 2,
              obj.object.y[i] - obj.object.h[i] / 2,
              obj.object.w[i],
              obj.object.h[i]
            );
            this.ctx.fillStyle = color;
            this.ctx.fillRect(
              obj.object.x[i] - obj.object.w[i] / 2,
              obj.object.y[i] - obj.object.h[i] / 2 - 12,
              obj.object.w[i],
              12
            );
            this.ctx.font = 'bold 10px arial';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(
              obj.object.target[i],
              obj.object.x[i] - obj.object.w[i] / 2 + 5,
              obj.object.y[i] - obj.object.h[i] / 2 - 2
            );
          }
        }
      },
      handleInvoke() {
        device.invoke(-1);
        this.invoke = false;
      },
      handleStop() {
        device.invoke(0);
        this.invoke = true;
      },
      handleClick(e: MouseEvent) {
        if (this.configPointer !== 0) {
          if (this.configPointer & EVENT.CONFIG_POINTER_START) {
            device.config.pointer.startX = e.offsetX;
            device.config.pointer.startY = e.offsetY;
          }
          if (this.configPointer & EVENT.CONFIG_POINTER_END) {
            device.config.pointer.endX = e.offsetX;
            device.config.pointer.endY = e.offsetY;
          }
          if (this.configPointer & EVENT.CONFIG_POINTER_CENTER) {
            device.config.pointer.centerX = e.offsetX;
            device.config.pointer.centerY = e.offsetY;
          }
          device.setEvent(EVENT.CONFIG_POINTER_DONE);
        }
      },
    },
  });
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
@/edgelab/serial
