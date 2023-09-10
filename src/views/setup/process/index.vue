<template>
  <div class="container">
    <div class="content">
      <div class="item">
        <Device />
      </div>
      <div :class="['item', 'right']">
        <Config class="config" />
        <Preview class="preview" />
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

      .config {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }

      .preview {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
      }
    }

    .right {
      flex: 1;
      max-width: 680px;
      background-color: var(--color-bg-2);
    }
  }
}
</style>


