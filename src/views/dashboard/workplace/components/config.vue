<template>
  <a-card class="general-card" :title="$t('workplace.config.title')">
    <a-form :model="{}" layout="vertical">
      <a-form-item :label="$t('workplace.config.model.label')" required>
        <a-select>
        </a-select>
      </a-form-item>
      <a-form-item :label="$t('workplace.config.algorithm.label')" required>
        <a-select>
        </a-select>
      </a-form-item>
      <a-space>
        <a-form-item :label="$t('workplace.config.confidence.label')" required>
          <a-input-number mode="button" />
        </a-form-item>
        <a-form-item :label="$t('workplace.config.nms.iou.label')" required>
          <a-input-number mode="button" />
        </a-form-item>
      </a-space>
    </a-form>
    <a-button type="primary" @click='handelSave'>{{ $t('workplace.config.btn.save') }}</a-button>
    <span :style="{ width: '15px', display: 'inline-block' }"></span>
    <a-button type="secondary" @click='handelRefresh'>{{ $t('workplace.config.btn.refresh') }}</a-button>
  </a-card>
</template>

<script lang="ts" setup>

const handelSave = () => {
  console.log('save');
}
const handelRefresh = () => {
  console.log('refresh');
}
</script>

