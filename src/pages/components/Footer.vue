<template>
  <a-layout-footer class="footer">
    <img class="logo" :src="seeedLogoIcon" />
  </a-layout-footer>
</template>

<script lang="ts" setup>
  import seeedLogoIcon from '@/assets/images/seeed-logo.png';
</script>

<style lang="less" scoped>
  .footer {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    color: var(--color-text-2);
    text-align: center;

    .logo {
      width: 200px;
    }
  }
</style>
