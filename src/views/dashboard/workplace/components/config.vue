<template>
  <a-card class="general-card" :title="$t('workplace.config.title')">
    <a-form :model="{}" layout="vertical">
      <a-form-item :label="$t('workplace.config.model.label')" required>
        <a-select v-model="model">
          <a-option
            v-for="item in modelList"
            :key="item.value"
            :value="item.value"
            :label="$t(item.label)"
          />
        </a-select>
      </a-form-item>
      <a-form-item :label="$t('workplace.config.algorithm.label')" required>
        <a-select v-model="algorithm">
          <a-option
            v-for="item in algorithmList"
            :key="item.value"
            :value="item.value"
            :label="$t(item.label)"
          />
        </a-select>
      </a-form-item>
      <div>
        <a-space>
          <a-form-item
            :label="$t('workplace.config.confidence.label')"
            required
          >
            <a-input-number
              v-model="confidence"
              mode="button"
              :min="0"
              :max="100"
            />
          </a-form-item>
          <a-form-item :label="$t('workplace.config.nms.iou.label')" required>
            <a-input-number v-model="iou" mode="button" :min="0" :max="100" />
          </a-form-item>
        </a-space>
        <a-space>
          <a-form-item :label="$t('workplace.config.pointer.start')" required>
            <a-input-group style="min-width: 180px">
              <a-button
                :type="isStart ? 'secondary' : 'primary'"
                status="success"
                style="min-width: 30px"
                @click="handelPosition('start')"
                ><template #icon><icon-location /></template
              ></a-button>
              <a-input-number v-model="startX" />
              <a-input-number v-model="startY" />
            </a-input-group>
          </a-form-item>
          <a-form-item :label="$t('workplace.config.pointer.end')" required>
            <a-input-group style="min-width: 180px">
              <a-button
                :type="isEnd ? 'secondary' : 'primary'"
                status="success"
                style="min-width: 30px"
                @click="handelPosition('end')"
                ><template #icon><icon-location /></template
              ></a-button>
              <a-input-number v-model="endX" />
              <a-input-number v-model="endY" />
            </a-input-group>
          </a-form-item>
        </a-space>
        <a-space>
          <a-form-item :label="$t('workplace.config.pointer.center')" required>
            <a-input-group style="min-width: 180px">
              <a-button
                :type="isCenter ? 'secondary' : 'primary'"
                status="success"
                style="min-width: 30px"
                @click="handelPosition('center')"
                ><template #icon><icon-location /></template
              ></a-button>
              <a-input-number v-model="centerX" />
              <a-input-number v-model="centerY" />
            </a-input-group>
          </a-form-item>
          <a-form-item :label="$t('workplace.config.pointer.range')" required>
            <a-input-group style="min-width: 180px">
              <a-button type="primary" status="warning" style="min-width: 30px"
                ><template #icon><icon-record /></template
              ></a-button>
              <a-input-number v-model="from" :step="0.001" :precision="3" />
              <a-input-number v-model="to" :step="0.001" :precision="3" />
            </a-input-group>
          </a-form-item>
        </a-space>
      </div>
    </a-form>
    <a-button type="primary" :loading="saveLoading" @click="handelSave">{{
      $t('workplace.config.btn.save')
    }}</a-button>
    <span :style="{ width: '15px', display: 'inline-block' }"></span>
    <a-button
      type="secondary"
      :loading="refreshLoading"
      @click="handelRefresh"
      >{{ $t('workplace.config.btn.refresh') }}</a-button
    >
  </a-card>
</template>

<script lang="ts" setup>
  import { watch, ref } from 'vue';
  import { useDeviceStore } from '@/store';
  import { Modal } from '@arco-design/web-vue';
  import { ALGORITHM, EVENT } from '@/edgelab';

  const deviceStore = useDeviceStore();
  const device = deviceStore.getDevice;

  interface Option {
    value: string;
    label: string;
  }

  const model = ref('');
  const algorithm = ref('');
  const confidence = ref(0);
  const iou = ref(0);
  const modelList = ref<Option[]>([]);
  const algorithmList = ref<Option[]>([]);
  const saveLoading = ref(false);
  const refreshLoading = ref(false);
  const startX = ref(0);
  const startY = ref(0);
  const endX = ref(0);
  const endY = ref(0);
  const centerX = ref(0);
  const centerY = ref(0);
  const from = ref(0);
  const to = ref(0);
  const isStart = ref(false);
  const isEnd = ref(false);
  const isCenter = ref(false);

  const handelSave = async () => {
    saveLoading.value = true;
    const invoke = await device.getInvoke();
    if (invoke !== 0) {
      Modal.error({
        title: 'Error',
        content: 'Please stop the device first',
      });
      saveLoading.value = false;
      return;
    }
    await device.setModel(model.value);
    await device.setAlgorithm(algorithm.value);
    await device.setConfidence(confidence.value);
    await device.setIOU(iou.value);
    if (algorithm.value === ALGORITHM.POINTER_METER) {
      const pointer = {
        startX: startX.value,
        startY: startY.value,
        endX: endX.value,
        endY: endY.value,
        centerX: centerX.value,
        centerY: centerY.value,
        from: from.value,
        to: to.value,
      };
      await device.setPointer(pointer);
    }
    await device.saveConfig();
    await device.reset();
    device.getError().then((error: string) => {
      if (error) {
        device.onLogger(error);
        if (error === 'Success') {
          Modal.success({
            title: 'Success',
            content: 'Save config success',
          });
        } else {
          Modal.error({
            title: 'Error',
            content: error,
          });
        }
      }
    });
    saveLoading.value = false;
  };
  const handelRefresh = async () => {
    refreshLoading.value = true;
    model.value = await device.getModel();
    algorithm.value = await device.getAlgorithm();
    if (algorithm.value === ALGORITHM.POINTER_METER) {
      const pointer = await device.getPointer();
      startX.value = pointer.startX;
      startY.value = pointer.startY;
      endX.value = pointer.endX;
      endY.value = pointer.endY;
      centerX.value = pointer.centerX;
      centerY.value = pointer.centerY;
      from.value = pointer.from;
      to.value = pointer.to;
      console.log(pointer);
    }
    confidence.value = await device.getConfidence();
    iou.value = await device.getIOU();
    modelList.value = await device.getModelList();
    algorithmList.value = await device.getAlgorithmList();
    refreshLoading.value = false;
    device.getError().then((error: string) => {
      console.log(error);
      if (error && error !== 'Success') {
        device.onLogger(error);
        Modal.error({
          title: 'Error',
          content: error,
        });
      }
    });
  };

  const handelPosition = (type: string) => {
    if (type === 'start') {
      isEnd.value = false;
      isCenter.value = false;
      isStart.value = !isStart.value;
      if (isStart.value) {
        device.setEvent(EVENT.CONFIG_POINTER_START);
      } else {
        device.setEvent(EVENT.CONFIG_POINTER_CANCEL);
      }
    } else if (type === 'end') {
      isStart.value = false;
      isCenter.value = false;
      isEnd.value = !isEnd.value;
      if (isEnd.value) {
        device.setEvent(EVENT.CONFIG_POINTER_END);
      } else {
        device.setEvent(EVENT.CONFIG_POINTER_CANCEL);
      }
    } else if (type === 'center') {
      isStart.value = false;
      isEnd.value = false;
      isCenter.value = !isCenter.value;
      if (isCenter.value) {
        device.setEvent(EVENT.CONFIG_POINTER_CENTER);
      } else {
        device.setEvent(EVENT.CONFIG_POINTER_CANCEL);
      }
    }
  };

  watch(
    () => device.getEvent(),
    (val) => {
      if (val === EVENT.CONFIG_POINTER_DONE) {
        if (isStart.value) {
          startX.value = device.config.pointer.startX;
          startY.value = device.config.pointer.startY;
        }
        if (isEnd.value) {
          endX.value = device.config.pointer.endX;
          endY.value = device.config.pointer.endY;
        }
        if (isCenter.value) {
          centerX.value = device.config.pointer.centerX;
          centerY.value = device.config.pointer.centerY;
        }
        isStart.value = false;
        isEnd.value = false;
        isCenter.value = false;
        device.clearEvent(EVENT.CONFIG_POINTER_DONE);
      }
    }
  );

  watch(
    () => device.connected,
    (val) => {
      if (device.connected) {
        handelRefresh();
      }
    }
  );
</script>

<style scoped lang="less">
  .pointer {
    cursor: crosshair;
  }
</style>
