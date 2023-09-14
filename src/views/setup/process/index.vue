<template>
  <div class="container">
    <div class="content">
      <div class="item">
        <Device />
      </div>
      <div :class="['item', 'right']">
        <Config />
        <Preview />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import Device from './components/device.vue';
  import Config from './components/config.vue';
  import Preview from './components/preview.vue';
</script>

<style scoped lang="less">
  .container {
    .content {
      display: flex;
      overflow-x: auto;

      .item {
        margin: 16px;
      }

      .right {
        flex: 1;
        min-width: 400px;
        background-color: var(--color-bg-2);
        border-radius: var(--border-radius-small);
      }
    }
  }
</style>
