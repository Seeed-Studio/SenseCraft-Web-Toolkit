<template>
  <a-card class="general-card" :title="$t('workplace.config.title')">
    <a-form :model="{}" layout="vertical">
      <a-form-item :label="$t('workplace.config.model.label')" required>
        <a-select v-model="model">
          <a-option v-for="item in modelList" :value="item.value" :label=$t(item.label) :key="item" />
        </a-select>
      </a-form-item>
      <a-form-item :label="$t('workplace.config.algorithm.label')" required>
        <a-select v-model="algorithm">
          <a-option v-for="item in algorithmList" :value="item.value" :label=$t(item.label) :key="item" />
        </a-select>
      </a-form-item>
      <a-space>
        <a-form-item :label="$t('workplace.config.confidence.label')" required>
          <a-input-number mode="button" :min=0 :max=100 v-model="confidence" />
        </a-form-item>
        <a-form-item :label="$t('workplace.config.nms.iou.label')" required>
          <a-input-number mode="button" :min=0 :max=100 v-model="iou" />
        </a-form-item>
      </a-space>
    </a-form>
    <a-button type="primary" :loading="saveLoading" @click='handelSave'>{{ $t('workplace.config.btn.save') }}</a-button>
    <span :style="{ width: '15px', display: 'inline-block' }"></span>
    <a-button type="secondary" :loading="refreshLoading" @click='handelRefresh'>{{ $t('workplace.config.btn.refresh')
    }}</a-button>
  </a-card>
</template>

<script lang="ts" setup>

import { watch, ref } from 'vue';
import { useDeviceStore } from '@/store';

const deviceStore = useDeviceStore();
const dev = deviceStore.device;

const model = ref('');
const algorithm = ref('');
const confidence = ref(0);
const iou = ref(0);
const modelList = ref('');
const algorithmList = ref('');
const saveLoading = ref(false);
const refreshLoading = ref(false);


const handelSave = async () => {
  saveLoading.value = true;
  await dev.client.setModel(model.value);
  await dev.client.setAlgorithm(algorithm.value);
  await dev.client.setConfidence(confidence.value)
  await dev.client.setIOU(iou.value);
  await dev.client.saveConfig();
  await dev.client.reset();
  saveLoading.value = false;
}
const handelRefresh = async () => {
  refreshLoading.value = true;
  model.value = await dev.client.getModel();
  algorithm.value = await dev.client.getAlgorithm();
  confidence.value = await dev.client.getConfidence();
  iou.value = await dev.client.getIOU();
  modelList.value = await dev.client.getModelList();
  algorithmList.value = await dev.client.getAlgorithmList();
  refreshLoading.value = false;
}

watch(() => dev.connected, (val) => {
  if (dev.connected) {
    handelRefresh();
  }
});

</script>

