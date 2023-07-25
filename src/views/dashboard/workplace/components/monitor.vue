<template>
  <a-card
    class="general-card"
    :title="$t('workplace.monitor.title')"
    :header-style="{ paddingBottom: '0' }"
  >
    <template v-if="invoke" #extra>
      <a-dropdown @select="handleInvoke" :disable="invokeDisable">
        <a-button type="primary">Invoke</a-button>
        <template #content>
          <a-doption value="One Shot">One Shot</a-doption>
          <a-doption value="Continuous">Continuous</a-doption>
        </template>
      </a-dropdown>
    </template>
    <template v-else #extra>
      <a-button @click="handleCancel">Cancel</a-button>
    </template>
    <div class="monitor-wrapper">
      <canvas ref="canvas" class="monitor-preview" :style="computedStyle" />
    </div>
  </a-card>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
  import { useDeviceStore } from '@/store';
  import { objectPick } from '@vueuse/core';

  const deviceStore = useDeviceStore();
  const dev = deviceStore.device;

  const colors = [
    'green',
    'red',
    'blue',
    'yellow',
    'orange',
    'purple',
    'pink',
    'cyan',
    'lime',
    'brown',
    'grey',
    'white',
  ];

  export default defineComponent({
    name: 'Monitor',
    data() {
      return {
        canvas: null as HTMLCanvasElement | null,
        ctx: null as CanvasRenderingContext2D | null,
        img: null as HTMLImageElement | null,
        invoke: true,
        invokeDisable: true,
        rotate: 0,
      };
    },
    mounted() {
      this.monitor = this.monitor.bind(this);
      dev.onMonitor = this.monitor;
      dev.onPreview = this.preview;
    },
    methods: {
      monitor(data: string) {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.img = new Image();
        this.img.src = 'data:image/jpeg;base64,'.concat(data);
        this.img.onload = () => {
          this.canvas!.width = this.img!.width;
          this.canvas!.height = this.img!.height;
          this.ctx!.drawImage(
            this.img,
            0,
            0,
            this.img!.width,
            this.img!.height
          );
        };
      },
      preview(data: string) {
        const obj = JSON.parse(data);
        if (this.ctx === null) return;
        if (obj.algorithm === 0) {
          for (let i = 0; i < obj.count; i += 1) {
            const color = `#${(0x1f * obj.object.x[i]).toString(16)}`;
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
              obj.object.y[i] - obj.object.h[i] / 2,
              obj.object.w[i],
              16
            );
            this.ctx.font = 'bold 10px arial';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(
              `${obj.object.target[i]}: ${obj.object.confidence[i]}`,
              obj.object.x[i] - obj.object.w[i] / 2 + 5,
              obj.object.y[i] - obj.object.h[i] / 2 + 12
            );
          }
        }
        if (obj.algorithm === 1) {
          for (let i = 0; i < obj.count; i += 1) {
            this.ctx.fillStyle = colors[obj.object.target[i]];
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
        if (obj.algorithm === 2) {
          for (let i = 0; i < obj.count; i += 1) {
            this.ctx.fillStyle = colors[obj.object.target[i]];
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
        if (obj.algorithm === 3) {
          for (let i = 0; i < obj.count; i += 1) {
            this.ctx.fillStyle = colors[i];
            this.ctx.fillRect(obj.object.x[i] - 1, obj.object.y[i] - 1, 4, 4);
          }
        }
      },
      handleInvoke(value: string) {
        console.log(value);
        if (value === 'One Shot') {
          dev.client.invoke(1);
        } else {
          this.invoke = false;
          dev.client.invoke(4294967296);
        }
      },
      handleCancel() {
        console.log('cancel');
        dev.client.invoke(0);
        this.invoke = true;
      },
    },
    computed: {
      computedStyle() {
        return {
          transform: `rotate(${this.rotate}deg)`,
        };
      },
      connected() {
        return dev.connected;
      },
    },

    watch: {
      async connected(value) {
        if (value) {
          this.invokeDisable = false;
          this.rotate= await dev.client.getRotate();
        } else {
          this.invokeDisable = true;
        }
      },
    },
  });
</script>

<style scoped lang="less">
  .monitor {
    &-wrapper {
      display: flex;
      min-width: 320px;
      min-height: 240px;
      max-width: 640px;
      max-height: 480px;
      margin: 0 auto;
      border-radius: 5px;
      width: 100%;
      justify-content: center;
    }

    &-preview {
      max-width: 640px;
      max-height: 480px;
      min-width: 240px;
      min-height: 240px;
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
