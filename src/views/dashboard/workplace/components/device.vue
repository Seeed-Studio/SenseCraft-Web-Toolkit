<template>
  <a-card class="general-card device-card" :title="$t('workplace.device.title')" :header-style="{ paddingBottom: '0' }"
    :body-style="{ padding: '24px 20px 0 20px' }">
    <template #extra>
      <a-tag color="green">{{ $t('workplace.device.status.online') }}</a-tag>
    </template>
    <a-space direction="vertical" size="large">
      <a-select default-value="WebUSB" placeholder="Please select ...">
        <a-option value="WebUSB">WebUSB</a-option>
        <template #appen>
          <a-button type="primary">{{ $t('workplace.device.btn.connect') }}</a-button>
        </template>
      </a-select>
    </a-space>
  </a-card>
</template>

<script lang="ts" setup>
</script>

<style scoped lang="less">
.device-card {
  min-height: 300px;
}
</style>
