<template>
  <a-card class="general-card" :title="$t('workplace.studio.title')" :header-style="{ paddingBottom: '0' }">
    <div class="studio-wrapper">
      <canvas ref="canvas" class="studio-preview" />
    </div>
  </a-card>
</template>

<script lang="ts">

</script>

<style scoped lang="less">
.studio {
  &-wrapper {
    display: block;
    width: 640px;
    height: 480px;
    margin: 0 auto;
    width: 100%;
  }

  &-preview {
    width: 100%;
    height: 100%;
  }

  &-bar {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
  }
}
</style>