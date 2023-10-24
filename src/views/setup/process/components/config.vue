<template>
  <a-card class="general-card" :title="$t('workplace.config.title')">
    <a-space class="item-card" direction="vertical" size="large">
      <a-space direction="vertical" class="slider">
        <div class="slider-top">
          <div>{{ $t('workplace.config.confidence.label') }}</div>
          <a-tooltip :content="$t('workplace.config.confidence.tip')">
            <icon-question-circle class="slider-tooltip" />
          </a-tooltip>
        </div>
        <a-slider
          v-model="confidence"
          :min="0"
          :max="100"
          show-input
          :disabled="!deviceStore.isInvoke"
          @change="handelConfidenceChange"
        />
      </a-space>
      <a-space direction="vertical" class="slider">
        <div class="slider-top">
          <div>{{ $t('workplace.config.iou.label') }}</div>
          <a-tooltip :content="$t('workplace.config.iou.tip')">
            <icon-question-circle class="slider-tooltip" />
          </a-tooltip>
        </div>
        <a-slider
          v-model="iou"
          :min="0"
          :max="100"
          show-input
          :disabled="!deviceStore.isInvoke"
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
  import { deviceManager } from '@/sscma';

  const { device } = deviceManager;
  const deviceStore = useDeviceStore();

  const confidence = ref(deviceStore.tscore);
  const iou = ref(deviceStore.tiou);

  const setConfidence = (value: number | [number, number]) => {
    device.setScore(value as number);
  };

  const setIou = (value: number | [number, number]) => {
    device.setIOU(value as number);
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
