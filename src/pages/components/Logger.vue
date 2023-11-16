<template>
  <Vue3DraggableResizable
    class="parent"
    :init-w="728"
    :init-h="588"
    :min-w="300"
    :min-h="300"
    :x="500"
    :y="200"
    :active="true"
    :draggable="true"
    :resizable="true"
    :handles="['tl', 'tr', 'bl', 'br']"
    @resize-end="resizeEndHandle"
  >
    <div class="header">
      <div class="title">Logger</div>
      <a-button
        class="close-btn"
        shape="circle"
        size="mini"
        @click="handleClose"
        ><template #icon><icon-close /></template
      ></a-button>
    </div>
    <div ref="terminal" class="terminal"></div>
  </Vue3DraggableResizable>
</template>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue';
  import 'xterm/css/xterm.css';
  import Vue3DraggableResizable from 'vue3-draggable-resizable';
  import 'vue3-draggable-resizable/dist/Vue3DraggableResizable.css';
  import { useAppStore } from '@/store';
  import { deviceManager } from '@/sscma';

  const appStore = useAppStore();

  const terminal = ref();
  const term = deviceManager.term;

  onMounted(async () => {
    if (terminal.value) {
      term.open(terminal.value);
    }
  });

  const resizeEndHandle = (payload: {
    x: number;
    y: number;
    w: number;
    h: number;
  }) => {
    const terminalHeight = payload.h - 48;
    const terminalWidth = payload.w;
    const rows = Math.floor(terminalHeight / 18);
    const columns = Math.floor(terminalWidth / 9) - 3;
    term.resize(columns, rows);
  };

  const handleClose = () => {
    appStore.toggleLog(false);
  };
</script>

<style lang="less" scoped>
  .parent {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--color-neutral-3);

    .header {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      box-sizing: border-box;
      width: 100%;
      height: 48px;
      padding: 0 20px;
      background-color: white;
      border-bottom: 1px solid var(--color-neutral-3);

      .title {
        display: flex;
        flex: 1;
        align-items: center;
        justify-content: center;
        color: var(--color-text-1);
        font-weight: 500;
        font-size: 16px;
      }

      .close-btn {
        margin-left: -12px;
        color: var(--color-text-1);
        font-size: 12px;
        cursor: pointer;
      }
    }

    .terminal {
      z-index: 10;
      flex: 1;
      width: 100%;
      padding-left: 8px;
      background-color: black;
    }
  }
</style>
@/sscma
