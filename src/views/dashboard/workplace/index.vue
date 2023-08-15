<template>
  <div class="container">
    <div class="layout">
      <div class="layout-left-side">
        <a-space :size="16" direction="vertical" fill>
          <Device />
          <Config />
        </a-space>
      </div>
      <div class="layout-content">
        <a-space :size="16" direction="vertical" fill>
          <Monitor />
          <Logger />
        </a-space>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import Monitor from './components/monitor.vue';
  import Device from './components/device.vue';
  import Logger from './components/logger.vue';
  import Config from './components/config.vue';
</script>

<style scoped lang="less">
  .container {
    padding: 0 20px 20px 20px;
  }

  .layout {
    display: flex;
    padding: 16px 0;

    &-left-side {
      flex-basis: 25%;
    }

    &-content {
      flex: 1;
      padding: 0 16px;
    }

    &-right-side {
      flex-basis: 25%;
    }
  }
</style>

<style lang="less" scoped>
  // responsive
  @media (max-width: @screen-lg) {
    .layout {
      flex-wrap: wrap;

      &-left-side {
        flex: 1;
        flex-basis: 100%;
        margin-bottom: 16px;
      }

      &-content {
        flex: none;
        flex-basis: 100%;
        padding: 0;
        order: -1;
        margin-bottom: 16px;
      }

      &-right-side {
        flex-basis: 100%;
      }
    }
  }
</style>
