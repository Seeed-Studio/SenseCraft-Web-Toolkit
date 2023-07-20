<template>
  <a-card :bordered="false" :body-style="{ padding: '20px' }">
    <div class="logger">
      <div v-for="(log, index) in logs" :key="index" class="logger-item">{{ log }}</div>
    </div>
  </a-card>
</template>

<script lang="ts">
export default {
  data() {
    return {
      logs: [
        'Strart',
        'Stio',
        '{"asdf: "asdf"}',
      ]
    };
  },
  methods: {
    log(data: string) {
      this.logs.push(data);
    }
  }
};
</script>

<style scoped lang="less">
.logger {
  height: 300px;
  overflow-y: scroll;
  padding: 20px;

  &-item {
    margin-bottom: 8px;
  }
}
</style>
