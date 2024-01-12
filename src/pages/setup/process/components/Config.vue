<template>
  <a-card class="general-card" :title="$t('workplace.preview.config.title')">
    <a-space class="item-card" direction="vertical" size="large">
      <a-space direction="vertical" class="slider">
        <div class="slider-top">
          <div>{{ $t('workplace.preview.config.confidence.label') }}</div>
          <a-tooltip :content="$t('workplace.preview.config.confidence.tip')">
            <icon-question-circle class="slider-tooltip" />
          </a-tooltip>
        </div>
        <a-slider
          v-model="confidence"
          :min="0"
          :max="100"
          show-input
          :disabled="
            !deviceStore.isInvoke ||
            deviceStore.deviceStatus !== DeviceStatus.SerialConnected
          "
          @change="handelConfidenceChange"
        />
      </a-space>
      <a-space direction="vertical" class="slider">
        <div class="slider-top">
          <div>{{ $t('workplace.preview.config.iou.label') }}</div>
          <a-tooltip :content="$t('workplace.preview.config.iou.tip')">
            <icon-question-circle class="slider-tooltip" />
          </a-tooltip>
        </div>
        <a-slider
          v-model="iou"
          :min="0"
          :max="100"
          show-input
          :disabled="
            !deviceStore.isInvoke ||
            deviceStore.deviceStatus !== DeviceStatus.SerialConnected
          "
          @change="handelIouChange"
        />
      </a-space>
    </a-space>
  </a-card>
</template>

<script lang="ts" setup>
  import { watch, ref } from 'vue';
  import { throttle } from 'lodash';
  import { useDeviceStore } from '@/store';
  import useDeviceManager from '@/hooks/deviceManager';
  import { DeviceStatus } from '@/sscma';

  const { device } = useDeviceManager();

  const deviceStore = useDeviceStore();

  const confidence = ref(deviceStore.tscore);
  const iou = ref(deviceStore.tiou);

  const setConfidence = async (value: number | [number, number]) => {
    const result = await device.value?.setScore(value as number);
    if (Number(result) === Number(value)) {
      deviceStore.setScore(Number(result));
    }
  };

  const setIou = async (value: number | [number, number]) => {
    const result = await device.value?.setIOU(value as number);
    if (Number(result) === Number(value)) {
      deviceStore.setIOU(Number(result));
    }
  };

  const handelConfidenceChange = throttle(setConfidence, 1000);

  const handelIouChange = throttle(setIou, 1000);

  watch(
    () => deviceStore.tscore,
    (val) => {
      if (val) {
        confidence.value = deviceStore.tscore;
      }
    }
  );

  watch(
    () => deviceStore.tiou,
    (val) => {
      if (val) {
        iou.value = deviceStore.tiou;
      }
    }
  );
</script>

<style scoped lang="less">
  .item-card {
    width: 100%;

    .slider {
      width: 100%;
      padding: 10px 0 10px 10px;

      .slider-top {
        display: flex;
        align-items: center;

        .slider-tooltip {
          margin-left: 5px;
          cursor: pointer;
        }
      }
    }
  }
</style>
@/sscma
